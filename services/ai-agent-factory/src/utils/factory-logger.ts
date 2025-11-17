/**
 * Factory Logger
 *
 * Enterprise-grade logging utility for AI Agent Factory operations.
 * Integrates with OSA's existing logging patterns and audit requirements.
 */

export type LogLevel = 'debug' | 'info' | 'success' | 'warning' | 'error';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  component: string;
  message: string;
  context?: Record<string, any>;
  correlationId?: string;
  userId?: string;
}

export class FactoryLogger {
  private component: string;
  private enableDebug: boolean;
  private enableAuditLogging: boolean;

  constructor(component: string) {
    this.component = component;
    this.enableDebug = process.env.NODE_ENV === 'development' || process.env.ENABLE_DEBUG_LOGGING === 'true';
    this.enableAuditLogging = process.env.ENABLE_AUDIT_LOGGING !== 'false'; // Default to true

    // Log initialization
    this.info(`🔧 [${component}] Logger initialized`, {
      debug: this.enableDebug,
      auditLogging: this.enableAuditLogging
    });
  }

  /**
   * Log debug information (development only)
   */
  debug(message: string, context?: Record<string, any>): void {
    if (this.enableDebug) {
      this.log('debug', message, context);
    }
  }

  /**
   * Log informational messages
   */
  info(message: string, context?: Record<string, any>): void {
    this.log('info', message, context);
  }

  /**
   * Log success messages
   */
  success(message: string, context?: Record<string, any>): void {
    this.log('success', message, context);
  }

  /**
   * Log warning messages
   */
  warning(message: string, context?: Record<string, any>): void {
    this.log('warning', message, context);
  }

  /**
   * Log error messages
   */
  error(message: string, context?: Record<string, any>): void {
    this.log('error', message, context);
  }

  /**
   * Core logging method
   */
  private log(level: LogLevel, message: string, context?: Record<string, any>): void {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      component: this.component,
      message,
      context: this.sanitizeContext(context),
      correlationId: this.generateCorrelationId(),
      userId: this.getCurrentUserId()
    };

    // Console output with colors for development
    if (process.env.NODE_ENV === 'development') {
      this.outputToConsole(logEntry);
    }

    // Structured logging for production
    if (process.env.NODE_ENV === 'production') {
      this.outputStructuredLog(logEntry);
    }

    // Audit logging for enterprise compliance
    if (this.enableAuditLogging && (level === 'error' || level === 'warning' || this.isAuditableEvent(message))) {
      this.sendToAuditSystem(logEntry);
    }

    // Send to external monitoring (if configured)
    if (level === 'error') {
      this.sendToErrorTracking(logEntry);
    }
  }

  /**
   * Output colorized logs to console for development
   */
  private outputToConsole(entry: LogEntry): void {
    const colors = {
      debug: '\x1b[36m',    // Cyan
      info: '\x1b[34m',     // Blue
      success: '\x1b[32m',  // Green
      warning: '\x1b[33m',  // Yellow
      error: '\x1b[31m',    // Red
      reset: '\x1b[0m'      // Reset
    };

    const color = colors[entry.level] || colors.reset;
    const contextStr = entry.context ? ` ${JSON.stringify(entry.context, null, 2)}` : '';

    console.log(
      `${color}[${entry.timestamp}] [${entry.level.toUpperCase()}] [${entry.component}] ${entry.message}${colors.reset}${contextStr}`
    );
  }

  /**
   * Output structured JSON logs for production
   */
  private outputStructuredLog(entry: LogEntry): void {
    console.log(JSON.stringify({
      '@timestamp': entry.timestamp,
      level: entry.level,
      component: entry.component,
      message: entry.message,
      context: entry.context,
      correlationId: entry.correlationId,
      userId: entry.userId,
      service: 'ai-agent-factory',
      environment: process.env.NODE_ENV || 'unknown'
    }));
  }

  /**
   * Send audit-worthy events to audit system
   */
  private async sendToAuditSystem(entry: LogEntry): Promise<void> {
    try {
      // In a real implementation, this would integrate with OSA's audit system
      // For now, we'll just ensure the log is marked as auditable

      if (process.env.NODE_ENV === 'development') {
        console.log(`🔍 [AUDIT] ${entry.message}`, entry.context);
      }

      // TODO: Integrate with Supabase audit_log table or external audit service

    } catch (error) {
      // Audit logging failures should not break the main workflow
      console.error('Failed to send audit log:', error);
    }
  }

  /**
   * Send error logs to external error tracking service
   */
  private async sendToErrorTracking(entry: LogEntry): Promise<void> {
    try {
      // In a real implementation, this would integrate with Sentry, Rollbar, etc.

      if (process.env.NODE_ENV === 'development') {
        console.error(`🚨 [ERROR TRACKING] ${entry.message}`, entry.context);
      }

      // TODO: Integrate with error tracking service

    } catch (error) {
      // Error tracking failures should not break the main workflow
      console.error('Failed to send error to tracking service:', error);
    }
  }

  /**
   * Sanitize context to remove sensitive information
   */
  private sanitizeContext(context?: Record<string, any>): Record<string, any> | undefined {
    if (!context) {
      return undefined;
    }

    const sanitized = { ...context };
    const sensitiveKeys = [
      'apiKey', 'api_key', 'password', 'token', 'secret', 'key',
      'authorization', 'auth', 'credentials', 'email', 'ssn',
      'credit_card', 'phone', 'address'
    ];

    // Recursively sanitize sensitive data
    const sanitizeValue = (obj: any): any => {
      if (obj === null || obj === undefined) {
        return obj;
      }

      if (typeof obj === 'string') {
        // Basic PII pattern detection
        if (/@/.test(obj)) { // Email pattern
          return '[EMAIL_REDACTED]';
        }
        if (/\d{3}-\d{2}-\d{4}/.test(obj)) { // SSN pattern
          return '[SSN_REDACTED]';
        }
        if (/\d{3}-\d{3}-\d{4}/.test(obj)) { // Phone pattern
          return '[PHONE_REDACTED]';
        }
        return obj;
      }

      if (Array.isArray(obj)) {
        return obj.map(sanitizeValue);
      }

      if (typeof obj === 'object') {
        const sanitizedObj: Record<string, any> = {};

        for (const [key, value] of Object.entries(obj)) {
          const lowerKey = key.toLowerCase();

          if (sensitiveKeys.some(sensitiveKey => lowerKey.includes(sensitiveKey))) {
            sanitizedObj[key] = '[REDACTED]';
          } else {
            sanitizedObj[key] = sanitizeValue(value);
          }
        }

        return sanitizedObj;
      }

      return obj;
    };

    return sanitizeValue(sanitized);
  }

  /**
   * Generate correlation ID for tracking related log entries
   */
  private generateCorrelationId(): string {
    // In a real implementation, this might use request context or workflow ID
    return `factory-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get current user ID from context
   */
  private getCurrentUserId(): string | undefined {
    // In a real implementation, this would extract user ID from request context
    return process.env.USER_ID || 'system';
  }

  /**
   * Determine if a message represents an auditable event
   */
  private isAuditableEvent(message: string): boolean {
    const auditablePatterns = [
      /agent creation/i,
      /specification saved/i,
      /phase completed/i,
      /approval/i,
      /workflow/i,
      /security/i,
      /compliance/i,
      /error/i,
      /failure/i
    ];

    return auditablePatterns.some(pattern => pattern.test(message));
  }

  /**
   * Create a child logger with additional context
   */
  createChildLogger(childComponent: string, context?: Record<string, any>): FactoryLogger {
    const childLogger = new FactoryLogger(`${this.component}:${childComponent}`);

    // Override log method to include parent context
    const originalLog = childLogger.log.bind(childLogger);
    childLogger.log = (level: LogLevel, message: string, childContext?: Record<string, any>) => {
      const mergedContext = { ...context, ...childContext };
      originalLog(level, message, mergedContext);
    };

    return childLogger;
  }

  /**
   * Log performance metrics
   */
  logPerformance(operation: string, duration: number, context?: Record<string, any>): void {
    this.info(`⏱️ [Performance] ${operation} completed`, {
      duration_ms: duration,
      duration_seconds: Math.round(duration / 1000 * 100) / 100,
      ...context
    });
  }

  /**
   * Log resource usage
   */
  logResourceUsage(resources: {
    memory?: number;
    cpu?: number;
    apiCalls?: number;
    dbQueries?: number;
    cost?: number;
  }, context?: Record<string, any>): void {
    this.info('📊 [Resources] Resource usage tracked', {
      memory_mb: resources.memory ? Math.round(resources.memory) : undefined,
      cpu_percent: resources.cpu,
      api_calls: resources.apiCalls,
      db_queries: resources.dbQueries,
      estimated_cost_cents: resources.cost,
      ...context
    });
  }

  /**
   * Log business events for analytics
   */
  logBusinessEvent(event: string, data?: Record<string, any>): void {
    this.info(`📈 [Business] ${event}`, {
      event_type: 'business',
      event_name: event,
      event_data: data,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Log security events
   */
  logSecurityEvent(event: string, severity: 'low' | 'medium' | 'high' | 'critical', context?: Record<string, any>): void {
    const logMethod = severity === 'critical' || severity === 'high' ? this.error.bind(this) : this.warning.bind(this);

    logMethod(`🔒 [Security] ${event}`, {
      security_event: true,
      severity,
      ...context
    });
  }

  /**
   * Get logger configuration
   */
  getConfiguration() {
    return {
      component: this.component,
      debugEnabled: this.enableDebug,
      auditLoggingEnabled: this.enableAuditLogging,
      environment: process.env.NODE_ENV || 'unknown'
    };
  }
}