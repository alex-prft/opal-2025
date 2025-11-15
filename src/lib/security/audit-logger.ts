// Audit Logger Service for Data Governance Compliance
// Handles secure logging of borderline data and security events

// Using Web Crypto API for Edge Runtime compatibility
import { supabase } from '@/lib/supabase';

export interface AuditEvent {
  table_name: string;
  operation: string;
  old_data?: any;
  new_data?: any;
  user_id?: string;
  threat_level?: 'none' | 'low' | 'medium' | 'high' | 'critical';
  audit_category?: 'security' | 'pii' | 'access' | 'data_change' | 'general';
  compliance_status?: 'compliant' | 'violation' | 'review_needed' | 'unknown';
}

export interface SecurityEvent {
  event_type: string;
  event_data?: Record<string, any>;
  threat_level?: 'low' | 'medium' | 'high' | 'critical';
  user_context?: string;
}

export interface PIIViolationEvent {
  violation_data: {
    violations: Array<{
      type: string;
      field: string;
      severity: string;
    }>;
    table: string;
    operation: string;
  };
  severity?: 'low' | 'medium' | 'high' | 'critical';
  table_context?: string;
}

export interface AccessEvent {
  accessed_table: string;
  access_type: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE';
  record_count?: number;
  query_metadata?: Record<string, any>;
}

export class AuditLogger {
  private static instance: AuditLogger;
  private requestContext: {
    ip_hash?: string;
    user_agent_hash?: string;
    request_id?: string;
    session_id?: string;
  } = {};

  private constructor() {}

  public static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger();
    }
    return AuditLogger.instance;
  }

  /**
   * Set request context for audit logging (call this in middleware)
   */
  public async setRequestContext(context: {
    clientIP?: string;
    userAgent?: string;
    requestId?: string;
    sessionId?: string;
  }): Promise<void> {
    this.requestContext = {
      ip_hash: context.clientIP ? await this.hashSensitiveData(context.clientIP) : undefined,
      user_agent_hash: context.userAgent ? await this.hashSensitiveData(context.userAgent) : undefined,
      request_id: context.requestId,
      session_id: context.sessionId
    };

    // Set PostgreSQL session variables for triggers
    if (this.requestContext.ip_hash) {
      supabase.rpc('set_config', {
        setting_name: 'app.client_ip_hash',
        new_value: this.requestContext.ip_hash,
        is_local: true
      });
    }

    if (this.requestContext.user_agent_hash) {
      supabase.rpc('set_config', {
        setting_name: 'app.user_agent_hash',
        new_value: this.requestContext.user_agent_hash,
        is_local: true
      });
    }

    if (this.requestContext.request_id) {
      supabase.rpc('set_config', {
        setting_name: 'app.request_id',
        new_value: this.requestContext.request_id,
        is_local: true
      });
    }
  }

  /**
   * Log a security event
   */
  public async logSecurityEvent(event: SecurityEvent): Promise<string | null> {
    try {
      const { data, error } = await supabase.rpc('log_security_event', {
        event_type: event.event_type,
        event_data: event.event_data || {},
        threat_level: event.threat_level || 'low',
        user_context: event.user_context
      });

      if (error) {
        console.error('Failed to log security event:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Security event logging error:', error);
      return null;
    }
  }

  /**
   * Log a PII violation
   */
  public async logPIIViolation(violation: PIIViolationEvent): Promise<string | null> {
    try {
      const { data, error } = await supabase.rpc('log_pii_violation', {
        violation_data: violation.violation_data,
        severity: violation.severity || 'medium',
        table_context: violation.table_context || 'unknown'
      });

      if (error) {
        console.error('Failed to log PII violation:', error);
        return null;
      }

      // Also log as security event if severity is high
      if (violation.severity === 'high' || violation.severity === 'critical') {
        await this.logSecurityEvent({
          event_type: 'PII_VIOLATION_CRITICAL',
          event_data: {
            violation_count: violation.violation_data.violations.length,
            table: violation.violation_data.table,
            severity: violation.severity
          },
          threat_level: violation.severity
        });
      }

      return data;
    } catch (error) {
      console.error('PII violation logging error:', error);
      return null;
    }
  }

  /**
   * Log data access
   */
  public async logDataAccess(access: AccessEvent): Promise<string | null> {
    try {
      const { data, error } = await supabase.rpc('log_data_access', {
        accessed_table: access.accessed_table,
        access_type: access.access_type,
        record_count: access.record_count || 1,
        query_metadata: access.query_metadata || {}
      });

      if (error) {
        console.error('Failed to log data access:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Data access logging error:', error);
      return null;
    }
  }

  /**
   * Log a general audit event
   */
  public async logAuditEvent(event: AuditEvent): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('supabase_audit_log')
        .insert({
          table_name: event.table_name,
          operation: event.operation,
          old_data: event.old_data,
          new_data: event.new_data,
          user_id: event.user_id,
          ip_hash: this.requestContext.ip_hash,
          user_agent_hash: this.requestContext.user_agent_hash,
          request_id: this.requestContext.request_id,
          session_id: this.requestContext.session_id,
          threat_level: event.threat_level || 'none',
          audit_category: event.audit_category || 'general',
          compliance_status: event.compliance_status || 'unknown'
        });

      if (error) {
        console.error('Failed to log audit event:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Audit event logging error:', error);
      return false;
    }
  }

  /**
   * Get audit health metrics
   */
  public async getHealthMetrics(): Promise<any> {
    try {
      const { data, error } = await supabase.rpc('get_audit_health_metrics');

      if (error) {
        console.error('Failed to get audit health metrics:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Health metrics error:', error);
      return null;
    }
  }

  /**
   * Get security summary for dashboard
   */
  public async getSecuritySummary(days: number = 7): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('audit_security_summary')
        .select('*')
        .gte('audit_date', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
        .order('audit_date', { ascending: false });

      if (error) {
        console.error('Failed to get security summary:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Security summary error:', error);
      return null;
    }
  }

  /**
   * Get PII compliance status
   */
  public async getPIIComplianceStatus(days: number = 30): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('audit_pii_compliance')
        .select('*')
        .gte('audit_date', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
        .order('audit_date', { ascending: false });

      if (error) {
        console.error('Failed to get PII compliance status:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('PII compliance error:', error);
      return null;
    }
  }

  /**
   * Check for suspicious activity
   */
  public async checkSuspiciousActivity(): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('audit_suspicious_activity')
        .select('*')
        .limit(10);

      if (error) {
        console.error('Failed to check suspicious activity:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Suspicious activity check error:', error);
      return [];
    }
  }

  /**
   * Create middleware for automatic request context setting
   */
  public createMiddleware() {
    return (req: any, res: any, next: any) => {
      const clientIP = req.headers['x-forwarded-for'] ||
                      req.headers['x-real-ip'] ||
                      req.connection?.remoteAddress ||
                      req.socket?.remoteAddress ||
                      '127.0.0.1';

      const userAgent = req.headers['user-agent'] || 'unknown';
      const requestId = req.headers['x-request-id'] ||
                       req.headers['x-correlation-id'] ||
                       crypto.randomUUID();

      this.setRequestContext({
        clientIP: Array.isArray(clientIP) ? clientIP[0] : clientIP,
        userAgent,
        requestId,
        sessionId: req.headers['x-session-id']
      });

      // Add audit logging to response
      const originalSend = res.send;
      res.send = function(body: any) {
        // Log the response (if needed)
        return originalSend.call(this, body);
      };

      next();
    };
  }

  /**
   * Create decorator for automatic method audit logging
   */
  public auditMethod(
    operation: string,
    category: AuditEvent['audit_category'] = 'general'
  ) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
      const originalMethod = descriptor.value;

      descriptor.value = async function (...args: any[]) {
        const logger = AuditLogger.getInstance();
        const startTime = Date.now();

        try {
          const result = await originalMethod.apply(this, args);

          // Log successful operation
          await logger.logAuditEvent({
            table_name: target.constructor.name,
            operation: `${operation}_SUCCESS`,
            new_data: {
              method: propertyKey,
              duration_ms: Date.now() - startTime,
              args_count: args.length
            },
            audit_category: category,
            compliance_status: 'compliant'
          });

          return result;
        } catch (error) {
          // Log failed operation
          await logger.logAuditEvent({
            table_name: target.constructor.name,
            operation: `${operation}_ERROR`,
            new_data: {
              method: propertyKey,
              duration_ms: Date.now() - startTime,
              error: error instanceof Error ? error.message : 'Unknown error',
              args_count: args.length
            },
            audit_category: category,
            threat_level: 'medium',
            compliance_status: 'review_needed'
          });

          throw error;
        }
      };
    };
  }

  // Private helper methods

  private async hashSensitiveData(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
}

// Export singleton instance and types
export const auditLogger = AuditLogger.getInstance();
export type { AuditEvent, SecurityEvent, PIIViolationEvent, AccessEvent };