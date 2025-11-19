/**
 * Comprehensive Audit Logging System for OSA Supabase Operations
 *
 * This module provides enterprise-grade audit logging capabilities with
 * automatic classification, retention management, and compliance reporting.
 */

import { createSupabaseAdmin } from './supabase-client';
import { DataClassification } from './supabase-guardrails';

export interface AuditEvent {
  id?: string;
  event_type: AuditEventType;
  table_name?: string;
  operation?: 'read' | 'write' | 'update' | 'delete' | 'rpc';
  user_context?: {
    session_id?: string;
    ip_address?: string;
    user_agent?: string;
    request_id?: string;
  };
  data_classification?: DataClassification;
  details: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'success' | 'failure' | 'warning';
  duration_ms?: number;
  created_at?: string;
}

export type AuditEventType =
  | 'DATABASE_OPERATION'
  | 'PII_VIOLATION'
  | 'DATA_ACCESS'
  | 'DATA_RETENTION'
  | 'SECURITY_EVENT'
  | 'CONFIGURATION_CHANGE'
  | 'AUTHENTICATION'
  | 'AUTHORIZATION'
  | 'SYSTEM_EVENT'
  | 'COMPLIANCE_CHECK'
  | 'DATA_EXPORT'
  | 'BACKUP_OPERATION'
  | 'POLICY_VIOLATION';

export interface AuditQuery {
  event_types?: AuditEventType[];
  tables?: string[];
  operations?: string[];
  severities?: string[];
  statuses?: string[];
  date_range?: {
    start: Date;
    end: Date;
  };
  user_context?: {
    session_id?: string;
    ip_address?: string;
  };
  limit?: number;
  offset?: number;
}

export interface AuditReport {
  id: string;
  title: string;
  description: string;
  generated_at: string;
  period: {
    start: Date;
    end: Date;
  };
  summary: {
    total_events: number;
    by_type: Record<AuditEventType, number>;
    by_severity: Record<string, number>;
    by_status: Record<string, number>;
    tables_accessed: string[];
    pii_violations: number;
    compliance_issues: number;
  };
  recommendations: string[];
  export_format: 'json' | 'csv' | 'pdf';
}

export class AuditSystem {
  private _supabase: ReturnType<typeof createSupabaseAdmin> | null = null;
  private eventQueue: AuditEvent[] = [];
  private batchSize = 100;
  private flushInterval = 5000; // 5 seconds
  private flushTimer?: NodeJS.Timeout;
  private isInitialized = false;

  constructor() {
    // Lazy initialization - don't create Supabase client until needed
    // This prevents multiple GoTrueClient instances at module import time
    // Process listeners and timers are only set up when actually used
  }

  private get supabase() {
    if (!this._supabase) {
      // Only initialize if we're in a proper runtime environment
      if (typeof window === 'undefined' && typeof process !== 'undefined') {
        this._supabase = createSupabaseAdmin();
        this.initializeIfNeeded();
      } else {
        // Return a mock client during static generation or in browser
        throw new Error('Audit system not available in this environment');
      }
    }
    return this._supabase;
  }

  private initializeIfNeeded() {
    if (this.isInitialized) return;

    // Only set up process listeners and timers if we're in a Node.js server environment
    if (typeof process !== 'undefined' && process.env.NODE_ENV !== undefined) {
      // Start automatic batching only when client is first accessed
      this.startBatchProcessing();

      // Graceful shutdown handling - only in server environment
      process.on('SIGINT', () => this.flush());
      process.on('SIGTERM', () => this.flush());

      this.isInitialized = true;
    }
  }

  /**
   * Log an audit event (queued for batch processing)
   */
  async logEvent(event: Omit<AuditEvent, 'id' | 'created_at'>): Promise<void> {
    // Skip audit logging during static generation or in environments where it's not available
    if (typeof window !== 'undefined' || typeof process === 'undefined') {
      return;
    }

    try {
      const auditEvent: AuditEvent = {
        ...event,
        id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        created_at: new Date().toISOString()
      };

      // Add to queue
      this.eventQueue.push(auditEvent);

      // Flush immediately for critical events
      if (event.severity === 'critical') {
        await this.flush();
      }

      // Flush if queue is full
      if (this.eventQueue.length >= this.batchSize) {
        await this.flush();
      }
    } catch (error) {
      // Silently fail during static generation - audit logging is not critical for build process
      console.warn('Audit logging unavailable during static generation');
    }
  }

  /**
   * Log database operations automatically
   */
  async logDatabaseOperation({
    table,
    operation,
    duration_ms,
    recordCount,
    classification,
    userContext,
    success = true,
    errorMessage
  }: {
    table: string;
    operation: 'read' | 'write' | 'update' | 'delete';
    duration_ms: number;
    recordCount?: number;
    classification?: DataClassification;
    userContext?: AuditEvent['user_context'];
    success?: boolean;
    errorMessage?: string;
  }): Promise<void> {
    await this.logEvent({
      event_type: 'DATABASE_OPERATION',
      table_name: table,
      operation,
      user_context: userContext,
      data_classification: classification,
      details: {
        record_count: recordCount,
        error_message: errorMessage,
        timestamp: new Date().toISOString()
      },
      severity: errorMessage ? 'medium' : 'low',
      status: success ? 'success' : 'failure',
      duration_ms
    });
  }

  /**
   * Log PII violations
   */
  async logPIIViolation({
    table,
    operation,
    detectedTypes,
    violationCount,
    userContext
  }: {
    table: string;
    operation: string;
    detectedTypes: string[];
    violationCount: number;
    userContext?: AuditEvent['user_context'];
  }): Promise<void> {
    await this.logEvent({
      event_type: 'PII_VIOLATION',
      table_name: table,
      operation: operation as any,
      user_context: userContext,
      details: {
        detected_pii_types: detectedTypes,
        violation_count: violationCount,
        blocked: true,
        timestamp: new Date().toISOString()
      },
      severity: 'critical',
      status: 'warning'
    });
  }

  /**
   * Log security events
   */
  async logSecurityEvent({
    type,
    details,
    userContext,
    severity = 'medium'
  }: {
    type: 'unauthorized_access' | 'invalid_token' | 'rate_limit_exceeded' | 'suspicious_activity';
    details: Record<string, any>;
    userContext?: AuditEvent['user_context'];
    severity?: AuditEvent['severity'];
  }): Promise<void> {
    await this.logEvent({
      event_type: 'SECURITY_EVENT',
      user_context: userContext,
      details: {
        security_event_type: type,
        ...details,
        timestamp: new Date().toISOString()
      },
      severity,
      status: 'warning'
    });
  }

  /**
   * Log configuration changes
   */
  async logConfigurationChange({
    table,
    configType,
    changes,
    userContext
  }: {
    table: string;
    configType: 'opal_agent' | 'system_setting' | 'user_preference' | 'security_policy';
    changes: Record<string, { old: any; new: any }>;
    userContext?: AuditEvent['user_context'];
  }): Promise<void> {
    await this.logEvent({
      event_type: 'CONFIGURATION_CHANGE',
      table_name: table,
      operation: 'update',
      user_context: userContext,
      data_classification: 'configuration',
      details: {
        configuration_type: configType,
        changes_made: changes,
        change_count: Object.keys(changes).length,
        timestamp: new Date().toISOString()
      },
      severity: 'medium',
      status: 'success'
    });
  }

  /**
   * Log compliance checks
   */
  async logComplianceCheck({
    checkType,
    passed,
    issues,
    details
  }: {
    checkType: 'pii_scan' | 'data_retention' | 'access_control' | 'encryption';
    passed: boolean;
    issues?: string[];
    details: Record<string, any>;
  }): Promise<void> {
    await this.logEvent({
      event_type: 'COMPLIANCE_CHECK',
      details: {
        check_type: checkType,
        passed,
        issues: issues || [],
        ...details,
        timestamp: new Date().toISOString()
      },
      severity: passed ? 'low' : 'high',
      status: passed ? 'success' : 'warning'
    });
  }

  /**
   * Query audit events with filtering
   */
  async queryEvents(query: AuditQuery): Promise<{
    events: AuditEvent[];
    total: number;
    hasMore: boolean;
  }> {
    let supabaseQuery = this.supabase
      .from('supabase_audit_log')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    // Apply filters
    if (query.event_types?.length) {
      supabaseQuery = supabaseQuery.in('event_type', query.event_types);
    }

    if (query.tables?.length) {
      supabaseQuery = supabaseQuery.in('table_name', query.tables);
    }

    if (query.operations?.length) {
      supabaseQuery = supabaseQuery.in('operation', query.operations);
    }

    if (query.severities?.length) {
      supabaseQuery = supabaseQuery.in('severity', query.severities);
    }

    if (query.statuses?.length) {
      supabaseQuery = supabaseQuery.in('status', query.statuses);
    }

    if (query.date_range) {
      supabaseQuery = supabaseQuery
        .gte('created_at', query.date_range.start.toISOString())
        .lte('created_at', query.date_range.end.toISOString());
    }

    if (query.user_context?.session_id) {
      supabaseQuery = supabaseQuery
        .contains('user_context', { session_id: query.user_context.session_id });
    }

    if (query.user_context?.ip_address) {
      supabaseQuery = supabaseQuery
        .contains('user_context', { ip_address: query.user_context.ip_address });
    }

    // Apply pagination
    if (query.limit) {
      supabaseQuery = supabaseQuery.limit(query.limit);
    }

    if (query.offset) {
      supabaseQuery = supabaseQuery.range(query.offset, (query.offset + (query.limit || 50)) - 1);
    }

    const { data, error, count } = await supabaseQuery;

    if (error) {
      throw new Error(`Failed to query audit events: ${error.message}`);
    }

    return {
      events: data || [],
      total: count || 0,
      hasMore: (query.offset || 0) + (data?.length || 0) < (count || 0)
    };
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport({
    period,
    includeRecommendations = true,
    format = 'json'
  }: {
    period: { start: Date; end: Date };
    includeRecommendations?: boolean;
    format?: 'json' | 'csv' | 'pdf';
  }): Promise<AuditReport> {
    const reportId = `audit_report_${Date.now()}`;

    // Query events for the period
    const { events, total } = await this.queryEvents({
      date_range: period,
      limit: 10000 // Large limit for comprehensive report
    });

    // Generate summary statistics
    const summary = {
      total_events: total,
      by_type: this.groupBy(events, 'event_type') as Record<AuditEventType, number>,
      by_severity: this.groupBy(events, 'severity'),
      by_status: this.groupBy(events, 'status'),
      tables_accessed: [...new Set(events.map(e => e.table_name).filter(Boolean))],
      pii_violations: events.filter(e => e.event_type === 'PII_VIOLATION').length,
      compliance_issues: events.filter(e =>
        e.event_type === 'COMPLIANCE_CHECK' && e.status !== 'success'
      ).length
    };

    // Generate recommendations
    const recommendations = includeRecommendations ?
      this.generateRecommendations(summary, events) : [];

    const report: AuditReport = {
      id: reportId,
      title: `OSA Compliance Report - ${period.start.toDateString()} to ${period.end.toDateString()}`,
      description: 'Comprehensive audit and compliance report for OSA system',
      generated_at: new Date().toISOString(),
      period,
      summary,
      recommendations,
      export_format: format
    };

    // Store report for future reference
    await this.supabase
      .from('compliance_reports')
      .insert({
        report_id: reportId,
        report_data: report,
        generated_at: new Date().toISOString()
      });

    return report;
  }

  /**
   * Get audit health metrics
   */
  async getAuditHealthMetrics(): Promise<{
    total_events_24h: number;
    error_rate_24h: number;
    pii_violations_24h: number;
    critical_events_24h: number;
    avg_response_time_ms: number;
    compliance_score: number;
  }> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const { events } = await this.queryEvents({
      date_range: {
        start: yesterday,
        end: new Date()
      },
      limit: 10000
    });

    const totalEvents = events.length;
    const errorEvents = events.filter(e => e.status === 'failure').length;
    const piiViolations = events.filter(e => e.event_type === 'PII_VIOLATION').length;
    const criticalEvents = events.filter(e => e.severity === 'critical').length;

    const responseTimesMs = events
      .filter(e => e.duration_ms)
      .map(e => e.duration_ms!);
    const avgResponseTime = responseTimesMs.length > 0 ?
      responseTimesMs.reduce((sum, time) => sum + time, 0) / responseTimesMs.length :
      0;

    // Calculate compliance score (0-100)
    const complianceScore = Math.max(0, 100 - (
      (piiViolations * 10) +
      (criticalEvents * 5) +
      ((errorEvents / totalEvents) * 100)
    ));

    return {
      total_events_24h: totalEvents,
      error_rate_24h: totalEvents > 0 ? (errorEvents / totalEvents) * 100 : 0,
      pii_violations_24h: piiViolations,
      critical_events_24h: criticalEvents,
      avg_response_time_ms: Math.round(avgResponseTime),
      compliance_score: Math.round(complianceScore)
    };
  }

  /**
   * Flush queued events to database
   */
  private async flush(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    // Skip flush during static generation or in browser environments
    if (typeof window !== 'undefined' || typeof process === 'undefined') {
      this.eventQueue = []; // Clear queue since we can't flush
      return;
    }

    const eventsToFlush = [...this.eventQueue];
    this.eventQueue = [];

    try {
      const { error } = await this.supabase
        .from('supabase_audit_log')
        .insert(eventsToFlush);

      if (error) {
        console.error('Failed to flush audit events:', error);
        // Re-queue events on failure
        this.eventQueue.unshift(...eventsToFlush);
      }
    } catch (error) {
      // During static generation, just log and continue
      if (process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE === 'build') {
        console.warn('Audit flush unavailable during static generation');
      } else {
        console.error('Audit flush error:', error);
        // Re-queue events on failure only in runtime
        this.eventQueue.unshift(...eventsToFlush);
      }
    }
  }

  /**
   * Start batch processing timer
   */
  private startBatchProcessing(): void {
    this.flushTimer = setInterval(() => {
      this.flush().catch(console.error);
    }, this.flushInterval);
  }

  /**
   * Group array by field
   */
  private groupBy(array: any[], field: string): Record<string, number> {
    return array.reduce((acc, item) => {
      const key = item[field] || 'unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }

  /**
   * Generate recommendations based on audit data
   */
  private generateRecommendations(
    summary: AuditReport['summary'],
    events: AuditEvent[]
  ): string[] {
    const recommendations: string[] = [];

    // PII violation recommendations
    if (summary.pii_violations > 0) {
      recommendations.push(
        `Found ${summary.pii_violations} PII violations. Implement stricter input validation and consider anonymizing sensitive data at collection.`
      );
    }

    // High error rate recommendations
    const errorRate = summary.by_status.failure / summary.total_events * 100;
    if (errorRate > 10) {
      recommendations.push(
        `High error rate (${errorRate.toFixed(1)}%). Review database operations and implement retry mechanisms for transient failures.`
      );
    }

    // Critical events recommendations
    const criticalEvents = summary.by_severity.critical || 0;
    if (criticalEvents > 0) {
      recommendations.push(
        `${criticalEvents} critical events detected. Implement immediate alerting for critical security events.`
      );
    }

    // Performance recommendations
    const slowOperations = events.filter(e => e.duration_ms && e.duration_ms > 5000);
    if (slowOperations.length > 0) {
      recommendations.push(
        `${slowOperations.length} slow database operations detected (>5s). Consider query optimization and indexing.`
      );
    }

    // Data access patterns
    const frequentTables = Object.entries(this.groupBy(
      events.filter(e => e.table_name), 'table_name'
    ))
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3);

    if (frequentTables.length > 0) {
      recommendations.push(
        `Most accessed tables: ${frequentTables.map(([table, count]) => `${table} (${count})`).join(', ')}. Consider implementing caching for frequently accessed data.`
      );
    }

    return recommendations;
  }
}

// Export singleton instance
export const auditSystem = new AuditSystem();