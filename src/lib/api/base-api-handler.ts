/**
 * Base API Handler for Next.js App Router
 *
 * Standardizes all API routes with:
 * - Consistent error handling & logging (integrates with existing logger)
 * - Request validation using Zod
 * - Rate limiting (in-memory for dev)
 * - Response formatting
 * - Performance tracking
 * - Backward compatibility with existing routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createLogger } from '@/lib/logger';

// Extend existing correlation ID pattern from your codebase
interface ApiContext {
  correlationId: string;
  startTime: number;
  userAgent: string;
  method: string;
  endpoint: string;
  ip: string;
}

// Standardized API response format (extends existing patterns)
interface StandardApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  correlation_id: string;
  timestamp: string;
  duration_ms?: number;
}

// Error types for consistent handling
export class ApiValidationError extends Error {
  public code = 'VALIDATION_ERROR';
  public status = 400;
  public details?: any;

  constructor(message: string, details?: any) {
    super(message);
    this.name = 'ApiValidationError';
    this.details = details;
  }
}

export class ApiRateLimitError extends Error {
  public code = 'RATE_LIMIT_EXCEEDED';
  public status = 429;
  public retryAfter?: number;

  constructor(message: string, retryAfter?: number) {
    super(message);
    this.name = 'ApiRateLimitError';
    this.retryAfter = retryAfter;
  }
}

export class ApiAuthenticationError extends Error {
  public code = 'AUTHENTICATION_ERROR';
  public status = 401;

  constructor(message: string) {
    super(message);
    this.name = 'ApiAuthenticationError';
  }
}

// In-memory rate limiting (perfect for dev, easy to upgrade to Redis later)
class InMemoryRateLimit {
  private requests = new Map<string, { count: number; resetTime: number }>();
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor(windowMs: number = 60000, maxRequests: number = 100) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;

    // Clean up old entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  check(key: string): { allowed: boolean; retryAfter?: number } {
    const now = Date.now();
    const entry = this.requests.get(key);

    if (!entry || now > entry.resetTime) {
      // Reset or create new entry
      this.requests.set(key, { count: 1, resetTime: now + this.windowMs });
      return { allowed: true };
    }

    if (entry.count >= this.maxRequests) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
      return { allowed: false, retryAfter };
    }

    entry.count++;
    return { allowed: true };
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.requests.entries()) {
      if (now > entry.resetTime) {
        this.requests.delete(key);
      }
    }
  }
}

// Global rate limiter instance
const rateLimiter = new InMemoryRateLimit();

// Middleware interfaces
interface ValidationMiddleware<T = any> {
  body?: z.ZodSchema<T>;
  query?: z.ZodSchema<T>;
  headers?: z.ZodSchema<T>;
}

interface RateLimitConfig {
  enabled: boolean;
  windowMs?: number;
  maxRequests?: number;
  keyGenerator?: (request: NextRequest, context: ApiContext) => string;
}

interface ApiHandlerConfig {
  endpoint: string;
  validation?: ValidationMiddleware;
  rateLimit?: RateLimitConfig;
  requireAuth?: boolean;
  cors?: boolean;
  compression?: boolean;
}

// Main Base API Handler Class
export class BaseApiHandler {
  private logger = createLogger('api-handler');
  private context?: ApiContext;

  /**
   * Initialize API context with correlation ID (extends existing pattern)
   */
  private initializeContext(request: NextRequest, endpoint: string): ApiContext {
    // Use same correlation ID pattern as existing codebase
    const correlationId = `api-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const startTime = Date.now();
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const method = request.method;
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
               request.headers.get('x-real-ip') ||
               'unknown';

    this.context = {
      correlationId,
      startTime,
      userAgent,
      method,
      endpoint,
      ip
    };

    // Use existing logger pattern
    this.logger.info('API request initiated', {
      correlation_id: correlationId,
      method,
      endpoint,
      user_agent: userAgent,
      ip
    });

    return this.context;
  }

  /**
   * Rate limiting middleware (in-memory for dev)
   */
  private checkRateLimit(request: NextRequest, config?: RateLimitConfig): void {
    if (!config?.enabled) return;

    const key = config.keyGenerator
      ? config.keyGenerator(request, this.context!)
      : this.context!.ip;

    const result = rateLimiter.check(key);

    if (!result.allowed) {
      throw new ApiRateLimitError(
        'Rate limit exceeded. Please try again later.',
        result.retryAfter
      );
    }

    this.logger.debug('Rate limit check passed', {
      correlation_id: this.context!.correlationId,
      key,
      endpoint: this.context!.endpoint
    });
  }

  /**
   * Request validation using Zod (extends existing validation patterns)
   */
  private async validateRequest(request: NextRequest, validation?: ValidationMiddleware): Promise<{
    body?: any;
    query?: any;
    headers?: any;
  }> {
    const validated: any = {};

    // Validate body
    if (validation?.body) {
      try {
        const body = await request.json();
        validated.body = validation.body.parse(body);
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new ApiValidationError('Invalid request body', error.errors);
        }
        throw new ApiValidationError('Failed to parse request body');
      }
    }

    // Validate query parameters
    if (validation?.query) {
      try {
        const url = new URL(request.url);
        const queryParams = Object.fromEntries(url.searchParams);
        validated.query = validation.query.parse(queryParams);
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new ApiValidationError('Invalid query parameters', error.errors);
        }
        throw new ApiValidationError('Failed to parse query parameters');
      }
    }

    // Validate headers
    if (validation?.headers) {
      try {
        const headers = Object.fromEntries(request.headers.entries());
        validated.headers = validation.headers.parse(headers);
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new ApiValidationError('Invalid headers', error.errors);
        }
        throw new ApiValidationError('Failed to parse headers');
      }
    }

    return validated;
  }

  /**
   * Authentication check (placeholder for your auth system)
   */
  private checkAuthentication(request: NextRequest): void {
    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
      throw new ApiAuthenticationError('Missing authorization header');
    }

    // Add your specific auth logic here
    // For now, just check if header exists
    this.logger.debug('Authentication check passed', {
      correlation_id: this.context!.correlationId
    });
  }

  /**
   * Create standardized success response (extends existing response format)
   */
  private createSuccessResponse<T>(
    data: T,
    message?: string,
    status: number = 200
  ): NextResponse {
    const duration = this.context ? Date.now() - this.context.startTime : 0;

    const response: StandardApiResponse<T> = {
      success: true,
      data,
      message,
      correlation_id: this.context?.correlationId || 'unknown',
      timestamp: new Date().toISOString(),
      duration_ms: duration
    };

    // Log success using existing logger pattern
    this.logger.info('API request completed successfully', {
      correlation_id: this.context?.correlationId,
      duration_ms: duration,
      status,
      endpoint: this.context?.endpoint
    });

    return NextResponse.json(response, {
      status,
      headers: this.getResponseHeaders()
    });
  }

  /**
   * Create standardized error response (integrates with existing error patterns)
   */
  private createErrorResponse(error: unknown): NextResponse {
    const duration = this.context ? Date.now() - this.context.startTime : 0;

    let status = 500;
    let code = 'INTERNAL_ERROR';
    let message = 'Internal server error';
    let details: any = undefined;

    // Handle known error types
    if (error instanceof ApiValidationError) {
      status = error.status;
      code = error.code;
      message = error.message;
      details = error.details;
    } else if (error instanceof ApiRateLimitError) {
      status = error.status;
      code = error.code;
      message = error.message;
    } else if (error instanceof ApiAuthenticationError) {
      status = error.status;
      code = error.code;
      message = error.message;
    } else if (error instanceof Error) {
      message = error.message;
    }

    const response: StandardApiResponse = {
      success: false,
      error: code,
      message,
      correlation_id: this.context?.correlationId || 'unknown',
      timestamp: new Date().toISOString(),
      duration_ms: duration
    };

    // Add details only in development (same pattern as existing code)
    if (process.env.NODE_ENV === 'development' && details) {
      response.data = { details };
    }

    // Use existing logger for errors
    this.logger.error('API request failed', {
      correlation_id: this.context?.correlationId,
      error_code: code,
      error_message: message,
      duration_ms: duration,
      status,
      endpoint: this.context?.endpoint,
      stack: error instanceof Error ? error.stack : undefined
    });

    const headers = this.getResponseHeaders();

    // Add rate limit headers if applicable
    if (error instanceof ApiRateLimitError && error.retryAfter) {
      headers['Retry-After'] = error.retryAfter.toString();
      headers['X-RateLimit-Remaining'] = '0';
    }

    return NextResponse.json(response, { status, headers });
  }

  /**
   * Get response headers (extends existing header patterns)
   */
  private getResponseHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Correlation-ID': this.context?.correlationId || 'unknown',
      'X-Response-Time': `${this.context ? Date.now() - this.context.startTime : 0}ms`,
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    };

    // Add CORS headers for development (same pattern as existing code)
    if (process.env.NODE_ENV === 'development') {
      headers['Access-Control-Allow-Origin'] = '*';
      headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
      headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Correlation-ID';
    }

    return headers;
  }

  /**
   * Handle CORS preflight requests
   */
  private handleCorsOptions(): NextResponse {
    this.logger.info('CORS preflight request handled');

    return NextResponse.json({}, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Correlation-ID',
        'Access-Control-Max-Age': '86400'
      }
    });
  }

  /**
   * Main handler method - processes requests with all middleware
   */
  public async handle<T>(
    request: NextRequest,
    config: ApiHandlerConfig,
    handler: (request: NextRequest, context: ApiContext, validated: any) => Promise<T>
  ): Promise<NextResponse> {
    try {
      // Handle CORS preflight
      if (request.method === 'OPTIONS' && config.cors) {
        return this.handleCorsOptions();
      }

      // Initialize context with correlation ID
      const context = this.initializeContext(request, config.endpoint);

      // Rate limiting
      this.checkRateLimit(request, config.rateLimit);

      // Authentication
      if (config.requireAuth) {
        this.checkAuthentication(request);
      }

      // Request validation
      const validated = await this.validateRequest(request, config.validation);

      // Execute the actual handler
      const result = await handler(request, context, validated);

      // Return standardized success response
      return this.createSuccessResponse(result);

    } catch (error) {
      // Return standardized error response
      return this.createErrorResponse(error);
    }
  }
}

/**
 * Convenience function to create a handler with config
 */
export function createApiHandler(config: ApiHandlerConfig) {
  const handler = new BaseApiHandler();

  return {
    async handle<T>(
      request: NextRequest,
      handlerFn: (request: NextRequest, context: ApiContext, validated: any) => Promise<T>
    ): Promise<NextResponse> {
      return handler.handle(request, config, handlerFn);
    }
  };
}

/**
 * Common validation schemas (can be extended)
 */
export const commonSchemas = {
  correlationId: z.string().min(1),
  pagination: z.object({
    page: z.string().transform(Number).pipe(z.number().min(1)).optional(),
    limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).optional()
  }),
  timestamps: z.object({
    start_date: z.string().datetime().optional(),
    end_date: z.string().datetime().optional()
  })
};

/**
 * Common rate limit configurations
 */
export const rateLimitConfigs = {
  strict: { enabled: true, windowMs: 60000, maxRequests: 10 },
  normal: { enabled: true, windowMs: 60000, maxRequests: 100 },
  lenient: { enabled: true, windowMs: 60000, maxRequests: 1000 },
  disabled: { enabled: false }
};