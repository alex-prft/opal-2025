/**
 * Structured Logging for OPAL Force Sync
 *
 * Provides consistent, structured logging with context awareness,
 * correlation tracking, and production-ready formatting.
 */

interface LogContext {
  [key: string]: any;
}

interface LogLevel {
  level: 'debug' | 'info' | 'warn' | 'error';
  color?: string;
  symbol?: string;
}

const LOG_LEVELS: Record<string, LogLevel> = {
  debug: { level: 'debug', color: '\x1b[36m', symbol: '🔍' },
  info: { level: 'info', color: '\x1b[32m', symbol: '✅' },
  warn: { level: 'warn', color: '\x1b[33m', symbol: '⚠️' },
  error: { level: 'error', color: '\x1b[31m', symbol: '❌' }
};

const RESET_COLOR = '\x1b[0m';

export class Logger {
  private context: string;
  private globalContext: LogContext;

  constructor(context: string, globalContext: LogContext = {}) {
    this.context = context;
    this.globalContext = globalContext;
  }

  private formatMessage(level: LogLevel, message: string, context: LogContext = {}): string {
    const timestamp = new Date().toISOString();
    const contextStr = Object.keys(context).length > 0 ? JSON.stringify(context, null, 2) : '';

    if (process.env.NODE_ENV === 'production') {
      // Production: JSON structured logs
      return JSON.stringify({
        timestamp,
        level: level.level,
        context: this.context,
        message,
        ...this.globalContext,
        ...context
      });
    } else {
      // Development: Pretty colored logs
      const coloredLevel = `${level.color}[${level.level.toUpperCase()}]${RESET_COLOR}`;
      const coloredContext = `${level.color}[${this.context}]${RESET_COLOR}`;

      let logLine = `${level.symbol} ${coloredLevel} ${coloredContext} ${message}`;

      if (contextStr) {
        logLine += `\n${contextStr}`;
      }

      return logLine;
    }
  }

  debug(message: string, context: LogContext = {}) {
    if (process.env.NODE_ENV === 'development' || process.env.DEBUG === 'true') {
      console.debug(this.formatMessage(LOG_LEVELS.debug, message, context));
    }
  }

  info(message: string, context: LogContext = {}) {
    console.log(this.formatMessage(LOG_LEVELS.info, message, context));
  }

  warn(message: string, context: LogContext = {}) {
    console.warn(this.formatMessage(LOG_LEVELS.warn, message, context));
  }

  error(message: string, context: LogContext | Error = {}) {
    let errorContext: LogContext = {};

    if (context instanceof Error) {
      errorContext = {
        error_message: context.message,
        error_stack: context.stack,
        error_name: context.name
      };
    } else {
      errorContext = context;
    }

    console.error(this.formatMessage(LOG_LEVELS.error, message, errorContext));
  }

  /**
   * Create child logger with additional context
   */
  child(additionalContext: LogContext): Logger {
    return new Logger(this.context, { ...this.globalContext, ...additionalContext });
  }

  /**
   * Time execution of a function with logging
   */
  async time<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    const startTime = Date.now();
    this.info(`Starting ${operation}`);

    try {
      const result = await fn();
      const duration = Date.now() - startTime;
      this.info(`Completed ${operation}`, { duration_ms: duration });
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.error(`Failed ${operation}`, {
        duration_ms: duration,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }
}

/**
 * Create a logger instance for a specific context
 */
export function createLogger(context: string, globalContext: LogContext = {}): Logger {
  return new Logger(context, globalContext);
}

/**
 * Request-scoped logger with correlation tracking
 */
export function createRequestLogger(correlationId: string, spanId?: string): Logger {
  return createLogger('request', {
    correlation_id: correlationId,
    span_id: spanId
  });
}

/**
 * Database operation logger
 */
export function createDatabaseLogger(operation: string): Logger {
  return createLogger('database', {
    operation
  });
}

/**
 * OPAL webhook logger
 */
export function createWebhookLogger(workflowId: string, eventType?: string): Logger {
  return createLogger('webhook', {
    workflow_id: workflowId,
    event_type: eventType
  });
}

// Default logger
export const logger = createLogger('opal-force-sync');