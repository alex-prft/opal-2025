/**
 * Enhanced Fetch with Retry Utility
 * Robust retry mechanism with exponential backoff, timeout protection, and smart error handling
 */

export interface RetryOptions {
  retries?: number;
  baseDelay?: number;
  maxDelay?: number;
  timeout?: number;
  retryableStatusCodes?: number[];
  onRetry?: (attempt: number, error: Error, nextDelay: number) => void;
  shouldRetry?: (error: Error, attempt: number) => boolean;
  backoffStrategy?: 'exponential' | 'linear' | 'constant';
  jitter?: boolean;
}

export interface RetryResult<T> {
  data?: T;
  success: boolean;
  status: 'success' | 'error' | 'timeout' | 'degraded' | 'network_error' | 'http_error';
  statusCode?: number;
  error?: string;
  attempts: number;
  totalDuration: number;
  lastError?: Error;
}

export class RetryError extends Error {
  public readonly statusCode?: number;
  public readonly attempts: number;
  public readonly originalError: Error;

  constructor(message: string, statusCode?: number, attempts?: number, originalError?: Error) {
    super(message);
    this.name = 'RetryError';
    this.statusCode = statusCode;
    this.attempts = attempts || 0;
    this.originalError = originalError || this;
  }
}

/**
 * Enhanced fetch with retry mechanism
 */
export async function fetchWithRetry<T = any>(
  url: string,
  fetchOptions: RequestInit = {},
  retryOptions: RetryOptions = {}
): Promise<RetryResult<T>> {
  const {
    retries = 3,
    baseDelay = 1000,
    maxDelay = 30000,
    timeout = 10000,
    retryableStatusCodes = [408, 429, 500, 502, 503, 504],
    onRetry,
    shouldRetry: customShouldRetry,
    backoffStrategy = 'exponential',
    jitter = true
  } = retryOptions;

  const startTime = Date.now();
  let lastError: Error | null = null;
  let lastStatusCode: number | undefined;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Add timeout to fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const requestOptions: RequestInit = {
        ...fetchOptions,
        signal: controller.signal
      };

      const response = await fetch(url, requestOptions);
      clearTimeout(timeoutId);

      lastStatusCode = response.status;

      // Success case
      if (response.ok) {
        const data = await response.json();
        return {
          data,
          success: true,
          status: 'success',
          statusCode: response.status,
          attempts: attempt + 1,
          totalDuration: Date.now() - startTime
        };
      }

      // HTTP error case
      const error = new RetryError(
        `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        attempt + 1
      );

      // Check if we should retry this HTTP error
      const shouldRetryThisError = customShouldRetry
        ? customShouldRetry(error, attempt)
        : shouldRetryHttpError(response.status, retryableStatusCodes);

      if (attempt === retries || !shouldRetryThisError) {
        return {
          success: false,
          status: getErrorStatus(response.status),
          statusCode: response.status,
          error: error.message,
          attempts: attempt + 1,
          totalDuration: Date.now() - startTime,
          lastError: error
        };
      }

      lastError = error;

    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      lastError = err;

      // Handle timeout specifically
      if (err.name === 'AbortError') {
        const timeoutError = new RetryError(`Request timeout after ${timeout}ms`, undefined, attempt + 1, err);

        if (attempt === retries) {
          return {
            success: false,
            status: 'timeout',
            error: timeoutError.message,
            attempts: attempt + 1,
            totalDuration: Date.now() - startTime,
            lastError: timeoutError
          };
        }
        lastError = timeoutError;
      } else {
        // Network error or other fetch error
        const networkError = new RetryError(`Network error: ${err.message}`, undefined, attempt + 1, err);

        // Check if we should retry network errors
        const shouldRetryThisError = customShouldRetry
          ? customShouldRetry(networkError, attempt)
          : true; // Default: retry network errors

        if (attempt === retries || !shouldRetryThisError) {
          return {
            success: false,
            status: 'network_error',
            error: networkError.message,
            attempts: attempt + 1,
            totalDuration: Date.now() - startTime,
            lastError: networkError
          };
        }
        lastError = networkError;
      }
    }

    // Calculate delay for next retry
    if (attempt < retries) {
      const delay = calculateDelay(attempt, baseDelay, maxDelay, backoffStrategy, jitter);

      // Call retry callback if provided
      if (onRetry && lastError) {
        onRetry(attempt + 1, lastError, delay);
      }

      await sleep(delay);
    }
  }

  // Should never reach here, but just in case
  return {
    success: false,
    status: 'error',
    statusCode: lastStatusCode,
    error: lastError?.message || 'Unknown error',
    attempts: retries + 1,
    totalDuration: Date.now() - startTime,
    lastError: lastError || new Error('Unknown error')
  };
}

/**
 * Simple version that matches your original API
 */
export async function fetchWithRetrySimple(url: string, retries = 3) {
  const result = await fetchWithRetry(url, {}, { retries });

  if (result.success) {
    return result.data;
  }

  return { status: 'degraded' };
}

/**
 * Calculate delay based on strategy
 */
function calculateDelay(
  attempt: number,
  baseDelay: number,
  maxDelay: number,
  strategy: 'exponential' | 'linear' | 'constant',
  jitter: boolean
): number {
  let delay: number;

  switch (strategy) {
    case 'exponential':
      delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
      break;
    case 'linear':
      delay = Math.min(baseDelay * (attempt + 1), maxDelay);
      break;
    case 'constant':
    default:
      delay = baseDelay;
      break;
  }

  // Add jitter to prevent thundering herd
  if (jitter) {
    delay = delay + (Math.random() * delay * 0.1);
  }

  return Math.floor(delay);
}

/**
 * Check if HTTP status code should be retried
 */
function shouldRetryHttpError(statusCode: number, retryableStatusCodes: number[]): boolean {
  return retryableStatusCodes.includes(statusCode);
}

/**
 * Get error status based on status code
 */
function getErrorStatus(statusCode: number): RetryResult<any>['status'] {
  if (statusCode >= 500) return 'degraded';
  if (statusCode >= 400) return 'http_error';
  return 'error';
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Preset configurations for common use cases
 */
export const RetryPresets = {
  // Fast retries for real-time operations
  aggressive: {
    retries: 5,
    baseDelay: 500,
    maxDelay: 5000,
    timeout: 5000,
    backoffStrategy: 'exponential' as const
  },

  // Balanced approach for API calls
  standard: {
    retries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    timeout: 10000,
    backoffStrategy: 'exponential' as const
  },

  // Conservative for expensive operations
  conservative: {
    retries: 2,
    baseDelay: 2000,
    maxDelay: 30000,
    timeout: 30000,
    backoffStrategy: 'linear' as const
  },

  // For health checks and monitoring
  healthCheck: {
    retries: 2,
    baseDelay: 1000,
    maxDelay: 5000,
    timeout: 5000,
    retryableStatusCodes: [408, 429, 500, 502, 503, 504],
    backoffStrategy: 'constant' as const
  }
} as const;

/**
 * Typed wrapper for common JSON API calls
 */
export async function fetchJsonWithRetry<T>(
  url: string,
  options: RequestInit & { retryOptions?: RetryOptions } = {}
): Promise<RetryResult<T>> {
  const { retryOptions, ...fetchOptions } = options;

  return fetchWithRetry<T>(
    url,
    {
      headers: {
        'Content-Type': 'application/json',
        ...fetchOptions.headers
      },
      ...fetchOptions
    },
    retryOptions
  );
}