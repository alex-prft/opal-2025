// Phase 1: Comprehensive Validation Logging System
// Structured logging with complete audit trail for /engine/admin/monitoring integration

import { supabase, isDatabaseAvailable } from '@/lib/database/supabase-client';
import type { ValidationLog, PageValidationStatus } from '@/lib/types/phase1-database';
import fs from 'fs/promises';
import path from 'path';

export interface ValidationLogEntry {
  validation_id: string;
  page_id: string;
  widget_id: string;
  validation_type: 'opal_mapping' | 'claude_schema' | 'deduplication' | 'cross_page_consistency';
  status: 'passed' | 'failed' | 'warning' | 'pending';
  confidence_score: number;
  details: any;
  performance_metrics?: {
    validation_duration_ms: number;
    memory_usage_mb?: number;
    cpu_usage_percent?: number;
  };
  error_info?: {
    error_code: string;
    error_message: string;
    stack_trace?: string;
  };
  audit_context?: {
    user_agent?: string;
    ip_address?: string;
    session_id?: string;
    correlation_id?: string;
  };
}

export interface DrillDownLogData {
  validation_logs: ValidationLogEntry[];
  page_status: PageValidationStatus[];
  performance_summary: {
    total_validations: number;
    passed_validations: number;
    failed_validations: number;
    average_confidence_score: number;
    average_duration_ms: number;
  };
  cross_page_analysis: {
    consistency_violations: number;
    deduplication_conflicts: number;
    affected_pages: string[];
  };
}

export class ValidationLogger {
  private readonly logFilePath: string;
  private readonly maxLogSize = 10 * 1024 * 1024; // 10MB
  private readonly maxLogFiles = 5;

  constructor() {
    this.logFilePath = path.join(process.cwd(), 'logs', 'validation');
  }

  /**
   * Log ALL validation results for complete audit trail and rollback analysis
   */
  async logValidationResult(entry: ValidationLogEntry): Promise<void> {
    const timestamp = new Date().toISOString();
    const enhancedEntry = {
      ...entry,
      timestamp,
      environment: process.env.NODE_ENV || 'development',
      use_real_opal_data: process.env.USE_REAL_OPAL_DATA === 'true'
    };

    // Dual logging: Database + File Storage for resilience
    await Promise.all([
      this.logToDatabase(enhancedEntry),
      this.logToFile(enhancedEntry)
    ]);

    // Update real-time page status
    await this.updatePageValidationMetrics(entry.page_id, entry.validation_type, entry.status);

    // Trigger alerts for critical failures
    if (entry.status === 'failed' && this.isCriticalValidation(entry.validation_type)) {
      await this.triggerCriticalAlert(enhancedEntry);
    }
  }

  /**
   * Database logging with structured validation_logs table integration
   */
  private async logToDatabase(entry: ValidationLogEntry): Promise<void> {
    if (!isDatabaseAvailable()) {
      console.warn('⚠️ [ValidationLogger] Database unavailable, logging to file only');
      return;
    }

    try {
      const logRecord: Partial<ValidationLog> = {
        validation_id: entry.validation_id,
        page_id: entry.page_id,
        widget_id: entry.widget_id,
        validation_type: entry.validation_type,
        validation_status: entry.status,
        confidence_score: entry.confidence_score,
        failure_reason: entry.error_info?.error_message,
        action_taken: this.determineActionTaken(entry),
        retry_count: 0,
        admin_notified: entry.status === 'failed',
        timestamp: new Date().toISOString()
      };

      // Set type-specific validation results
      switch (entry.validation_type) {
        case 'opal_mapping':
          logRecord.opal_mapping_result = entry.details;
          break;
        case 'claude_schema':
          logRecord.claude_schema_result = entry.details;
          break;
        case 'deduplication':
          logRecord.deduplication_result = entry.details;
          break;
        case 'cross_page_consistency':
          logRecord.cross_page_consistency = entry.details;
          break;
      }

      const { error } = await supabase
        .from('validation_logs')
        .insert(logRecord);

      if (error) {
        console.error('❌ [ValidationLogger] Database insert failed:', error);
        throw error;
      }

      console.log(`✅ [ValidationLogger] Logged ${entry.validation_type} validation for ${entry.page_id}/${entry.widget_id}`);
    } catch (error) {
      console.error('❌ [ValidationLogger] Database logging error:', error);
      // Continue with file logging as fallback
    }
  }

  /**
   * File-based logging for resilience and local development
   */
  private async logToFile(entry: ValidationLogEntry): Promise<void> {
    try {
      // Ensure log directory exists
      await this.ensureLogDirectory();

      const logFileName = `validation-${new Date().toISOString().split('T')[0]}.log`;
      const logFilePath = path.join(this.logFilePath, logFileName);

      const logLine = JSON.stringify({
        ...entry,
        logged_at: new Date().toISOString()
      }) + '\n';

      await fs.appendFile(logFilePath, logLine, 'utf8');

      // Rotate logs if necessary
      await this.rotateLogs();
    } catch (error) {
      console.error('❌ [ValidationLogger] File logging error:', error);
    }
  }

  /**
   * Update real-time page validation metrics for admin dashboard
   */
  private async updatePageValidationMetrics(
    pageId: string,
    validationType: string,
    status: 'passed' | 'failed' | 'warning' | 'pending'
  ): Promise<void> {
    if (!isDatabaseAvailable()) return;

    try {
      // Get current page status
      const { data: currentStatus, error: fetchError } = await supabase
        .from('page_validation_status')
        .select('*')
        .eq('page_id', pageId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('❌ [ValidationLogger] Failed to fetch page status:', fetchError);
        return;
      }

      // Update specific validation status
      const updateFields: any = {
        [`${validationType.replace('-', '_')}_status`]: status,
        last_validation_time: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Update widget counts
      if (status === 'passed') {
        updateFields.validated_widgets = (currentStatus?.validated_widgets || 0) + 1;
      } else if (status === 'failed') {
        updateFields.failed_widgets = (currentStatus?.failed_widgets || 0) + 1;
      }

      // Calculate overall status (green/yellow/red)
      updateFields.overall_status = this.calculateOverallStatus({
        opal_mapping: status === 'opal_mapping' ? status : currentStatus?.opal_mapping_status,
        claude_schema: status === 'claude_schema' ? status : currentStatus?.claude_schema_status,
        deduplication: status === 'deduplication' ? status : currentStatus?.deduplication_status,
        cross_page_consistency: status === 'cross_page_consistency' ? status : currentStatus?.cross_page_consistency_status
      });

      const { error: updateError } = await supabase
        .from('page_validation_status')
        .update(updateFields)
        .eq('page_id', pageId);

      if (updateError) {
        console.error('❌ [ValidationLogger] Failed to update page status:', updateError);
      }
    } catch (error) {
      console.error('❌ [ValidationLogger] Page metrics update error:', error);
    }
  }

  /**
   * Retrieve validation logs with drill-down capability for admin dashboard
   */
  async getValidationLogs(filters: {
    page_id?: string;
    widget_id?: string;
    validation_type?: string;
    status?: string;
    hours?: number;
    limit?: number;
  } = {}): Promise<DrillDownLogData> {
    try {
      let query = supabase
        .from('validation_logs')
        .select('*')
        .order('timestamp', { ascending: false });

      // Apply filters
      if (filters.page_id) {
        query = query.eq('page_id', filters.page_id);
      }

      if (filters.widget_id) {
        query = query.eq('widget_id', filters.widget_id);
      }

      if (filters.validation_type) {
        query = query.eq('validation_type', filters.validation_type);
      }

      if (filters.status) {
        query = query.eq('validation_status', filters.status);
      }

      if (filters.hours) {
        const hoursAgo = new Date(Date.now() - filters.hours * 60 * 60 * 1000).toISOString();
        query = query.gte('timestamp', hoursAgo);
      }

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const { data: validationLogs, error: logsError } = await query;

      if (logsError) {
        throw logsError;
      }

      // Get page status information
      const { data: pageStatus, error: statusError } = await supabase
        .from('page_validation_status')
        .select('*');

      if (statusError) {
        console.error('❌ [ValidationLogger] Failed to fetch page status:', statusError);
      }

      // Calculate performance summary
      const performanceSummary = this.calculatePerformanceSummary(validationLogs || []);

      // Analyze cross-page issues
      const crossPageAnalysis = this.analyzeCrossPageIssues(validationLogs || []);

      return {
        validation_logs: this.transformLogsForDrillDown(validationLogs || []),
        page_status: pageStatus || [],
        performance_summary: performanceSummary,
        cross_page_analysis: crossPageAnalysis
      };
    } catch (error) {
      console.error('❌ [ValidationLogger] Failed to retrieve validation logs:', error);

      // Fallback to file-based logs
      return this.getValidationLogsFromFile(filters);
    }
  }

  /**
   * Get validation logs from file storage as fallback
   */
  private async getValidationLogsFromFile(filters: any): Promise<DrillDownLogData> {
    try {
      const logFiles = await fs.readdir(this.logFilePath);
      const validationFiles = logFiles.filter(file => file.startsWith('validation-'));

      const logs: ValidationLogEntry[] = [];

      for (const file of validationFiles.slice(-3)) { // Last 3 days
        const filePath = path.join(this.logFilePath, file);
        const content = await fs.readFile(filePath, 'utf8');
        const lines = content.split('\n').filter(line => line.trim());

        for (const line of lines) {
          try {
            const log = JSON.parse(line);
            logs.push(log);
          } catch (parseError) {
            // Skip invalid JSON lines
          }
        }
      }

      // Apply basic filters
      let filteredLogs = logs;

      if (filters.page_id) {
        filteredLogs = filteredLogs.filter(log => log.page_id === filters.page_id);
      }

      if (filters.hours) {
        const hoursAgo = Date.now() - filters.hours * 60 * 60 * 1000;
        filteredLogs = filteredLogs.filter(log => {
          const logTime = new Date(log.timestamp || '').getTime();
          return logTime > hoursAgo;
        });
      }

      if (filters.limit) {
        filteredLogs = filteredLogs.slice(0, filters.limit);
      }

      return {
        validation_logs: filteredLogs,
        page_status: [], // Not available from file storage
        performance_summary: this.calculatePerformanceSummary(filteredLogs),
        cross_page_analysis: this.analyzeCrossPageIssues(filteredLogs)
      };
    } catch (error) {
      console.error('❌ [ValidationLogger] File-based log retrieval failed:', error);

      return {
        validation_logs: [],
        page_status: [],
        performance_summary: {
          total_validations: 0,
          passed_validations: 0,
          failed_validations: 0,
          average_confidence_score: 0,
          average_duration_ms: 0
        },
        cross_page_analysis: {
          consistency_violations: 0,
          deduplication_conflicts: 0,
          affected_pages: []
        }
      };
    }
  }

  // Utility Methods

  private async ensureLogDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.logFilePath, { recursive: true });
    } catch (error) {
      console.error('❌ [ValidationLogger] Failed to create log directory:', error);
    }
  }

  private async rotateLogs(): Promise<void> {
    try {
      const files = await fs.readdir(this.logFilePath);
      const logFiles = files
        .filter(file => file.startsWith('validation-'))
        .map(file => ({
          name: file,
          path: path.join(this.logFilePath, file)
        }));

      // Remove old log files if we exceed the limit
      if (logFiles.length > this.maxLogFiles) {
        const filesToRemove = logFiles.slice(0, logFiles.length - this.maxLogFiles);
        for (const file of filesToRemove) {
          await fs.unlink(file.path);
        }
      }
    } catch (error) {
      console.error('❌ [ValidationLogger] Log rotation failed:', error);
    }
  }

  private isCriticalValidation(validationType: string): boolean {
    return ['cross_page_consistency', 'deduplication'].includes(validationType);
  }

  private determineActionTaken(entry: ValidationLogEntry): string {
    if (entry.status === 'passed') {
      return 'validation_passed';
    } else if (entry.status === 'failed') {
      return entry.error_info?.error_code || 'validation_failed';
    } else if (entry.status === 'warning') {
      return 'validation_warning';
    }
    return 'validation_pending';
  }

  private calculateOverallStatus(statuses: { [key: string]: string }): 'green' | 'yellow' | 'red' | 'pending' {
    const statusValues = Object.values(statuses);

    if (statusValues.includes('failed')) {
      return 'red';
    } else if (statusValues.includes('warning')) {
      return 'yellow';
    } else if (statusValues.every(status => status === 'passed')) {
      return 'green';
    } else {
      return 'pending';
    }
  }

  private calculatePerformanceSummary(logs: any[]): any {
    if (logs.length === 0) {
      return {
        total_validations: 0,
        passed_validations: 0,
        failed_validations: 0,
        average_confidence_score: 0,
        average_duration_ms: 0
      };
    }

    const passedCount = logs.filter(log => log.validation_status === 'passed' || log.status === 'passed').length;
    const failedCount = logs.filter(log => log.validation_status === 'failed' || log.status === 'failed').length;

    const confidenceScores = logs
      .map(log => log.confidence_score)
      .filter(score => typeof score === 'number');

    const averageConfidence = confidenceScores.length > 0
      ? confidenceScores.reduce((sum, score) => sum + score, 0) / confidenceScores.length
      : 0;

    const durations = logs
      .map(log => log.performance_metrics?.validation_duration_ms)
      .filter(duration => typeof duration === 'number');

    const averageDuration = durations.length > 0
      ? durations.reduce((sum, duration) => sum + duration, 0) / durations.length
      : 0;

    return {
      total_validations: logs.length,
      passed_validations: passedCount,
      failed_validations: failedCount,
      average_confidence_score: Math.round(averageConfidence * 100) / 100,
      average_duration_ms: Math.round(averageDuration)
    };
  }

  private analyzeCrossPageIssues(logs: any[]): any {
    const consistencyViolations = logs.filter(log =>
      log.validation_type === 'cross_page_consistency' &&
      (log.validation_status === 'failed' || log.status === 'failed')
    ).length;

    const deduplicationConflicts = logs.filter(log =>
      log.validation_type === 'deduplication' &&
      (log.validation_status === 'failed' || log.status === 'failed')
    ).length;

    const affectedPages = [...new Set(logs.map(log => log.page_id))];

    return {
      consistency_violations: consistencyViolations,
      deduplication_conflicts: deduplicationConflicts,
      affected_pages: affectedPages
    };
  }

  private transformLogsForDrillDown(logs: any[]): ValidationLogEntry[] {
    return logs.map(log => ({
      validation_id: log.validation_id,
      page_id: log.page_id,
      widget_id: log.widget_id,
      validation_type: log.validation_type,
      status: log.validation_status || log.status,
      confidence_score: log.confidence_score || 0,
      details: log.opal_mapping_result || log.claude_schema_result || log.deduplication_result || log.cross_page_consistency || {},
      performance_metrics: log.performance_metrics,
      error_info: log.failure_reason ? {
        error_code: log.action_taken || 'unknown',
        error_message: log.failure_reason
      } : undefined
    }));
  }

  private async triggerCriticalAlert(entry: ValidationLogEntry): Promise<void> {
    console.error(`🚨 [CRITICAL ALERT] ${entry.validation_type} validation failed for ${entry.page_id}/${entry.widget_id}`);
    console.error(`🚨 [CRITICAL ALERT] Details:`, entry.error_info);

    // Log critical alert for admin dashboard
    console.error(`🚨 [CRITICAL ALERT] Admin escalation required for ${entry.validation_id}`);
  }
}

// Export singleton instance
export const validationLogger = new ValidationLogger();