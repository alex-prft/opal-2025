/**
 * Exponential Backoff Retry Utility
 * Provides robust retry mechanisms for API calls and async operations
 */

export interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxAttempts?: number;

  /** Initial delay in milliseconds (default: 1000ms) */
  initialDelay?: number;

  /** Maximum delay cap in milliseconds (default: 30000ms) */
  maxDelay?: number;

  /** Exponential backoff factor (default: 2) */
  backoffFactor?: number;

  /** Random jitter factor to prevent thundering herd (default: 0.1) */
  jitterFactor?: number;

  /** Custom function to determine if error should trigger retry */
  shouldRetry?: (error: any, attempt: number) => boolean;

  /** Callback for each retry attempt */
  onRetry?: (error: any, attempt: number, delay: number) => void;

  /** Enable detailed logging */
  enableLogging?: boolean;

  /** Operation name for logging */
  operationName?: string;
}

export interface RetryResult<T> {
  /** Operation result if successful */
  result: T;

  /** Number of attempts made */
  attemptCount: number;

  /** Total time taken in milliseconds */
  totalTime: number;

  /** Whether operation succeeded */
  success: boolean;

  /** Final error if all retries failed */
  lastError?: Error;
}

/**
 * Default retry options
 */
const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'shouldRetry' | 'onRetry'>> = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffFactor: 2,
  jitterFactor: 0.1,
  enableLogging: true,
  operationName: 'operation'
};

/**
 * Default retry condition - retries on network errors, 5xx errors, and rate limits
 */
function defaultShouldRetry(error: any, attempt: number): boolean {
  // Don't retry after max attempts
  if (attempt >= DEFAULT_OPTIONS.maxAttempts) {
    return false;
  }

  // Retry on network errors
  if (error.code === 'ECONNRESET' ||
      error.code === 'ENOTFOUND' ||
      error.code === 'ECONNREFUSED' ||
      error.code === 'ETIMEDOUT') {
    return true;
  }

  // Retry on HTTP errors
  if (error.response) {
    const status = error.response.status || error.status;

    // Retry on server errors (5xx)
    if (status >= 500) {
      return true;
    }

    // Retry on rate limiting (429)
    if (status === 429) {
      return true;
    }

    // Retry on specific client errors that might be transient
    if (status === 408 || status === 409) { // Request timeout, conflict
      return true;
    }
  }

  // Don't retry on other errors (4xx client errors, etc.)
  return false;
}

/**
 * Calculates delay for next retry attempt with exponential backoff and jitter
 */
function calculateDelay(
  attempt: number,
  initialDelay: number,
  backoffFactor: number,
  maxDelay: number,
  jitterFactor: number
): number {
  // Calculate exponential backoff
  const exponentialDelay = initialDelay * Math.pow(backoffFactor, attempt - 1);

  // Apply maximum delay cap
  const cappedDelay = Math.min(exponentialDelay, maxDelay);

  // Add jitter to prevent thundering herd
  const jitter = cappedDelay * jitterFactor * Math.random();

  return Math.floor(cappedDelay + jitter);
}

/**
 * Executes an async operation with exponential backoff retry
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const config = { ...DEFAULT_OPTIONS, ...options };
  const shouldRetry = options.shouldRetry || defaultShouldRetry;

  const startTime = Date.now();
  let lastError: Error;
  let attempt = 0;

  while (attempt < config.maxAttempts) {
    attempt++;

    try {
      if (config.enableLogging && attempt > 1) {
        console.log(`🔄 Retry attempt ${attempt}/${config.maxAttempts} for ${config.operationName}`);
      }

      const result = await operation();

      if (config.enableLogging && attempt > 1) {
        console.log(`✅ ${config.operationName} succeeded on attempt ${attempt}`);
      }

      return result;

    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if we should retry
      if (!shouldRetry(error, attempt)) {
        if (config.enableLogging) {
          console.log(`❌ ${config.operationName} failed permanently: ${lastError.message}`);
        }
        throw lastError;
      }

      // Calculate delay for next attempt
      const delay = calculateDelay(
        attempt,
        config.initialDelay,
        config.backoffFactor,
        config.maxDelay,
        config.jitterFactor
      );

      // Call retry callback if provided
      if (options.onRetry) {
        options.onRetry(error, attempt, delay);
      }

      if (config.enableLogging) {
        console.warn(`⚠️ ${config.operationName} failed on attempt ${attempt}: ${lastError.message}`);

        if (attempt < config.maxAttempts) {
          console.log(`⏱️ Retrying in ${delay}ms...`);
        }
      }

      // Wait before next attempt (unless this was the last attempt)
      if (attempt < config.maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // All retries exhausted
  if (config.enableLogging) {
    console.error(`❌ ${config.operationName} failed after ${config.maxAttempts} attempts`);
  }

  throw lastError;
}

/**
 * Executes an async operation with retry and returns detailed result
 */
export async function withRetryResult<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<RetryResult<T>> {
  const startTime = Date.now();

  try {
    const result = await withRetry(operation, options);

    return {
      result,
      attemptCount: 1, // TODO: Track actual attempts made
      totalTime: Date.now() - startTime,
      success: true
    };
  } catch (error) {
    return {
      result: undefined as any,
      attemptCount: options.maxAttempts || DEFAULT_OPTIONS.maxAttempts,
      totalTime: Date.now() - startTime,
      success: false,
      lastError: error instanceof Error ? error : new Error(String(error))
    };
  }
}

/**
 * Retry wrapper specifically for fetch requests
 */
export async function fetchWithRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
  retryOptions: RetryOptions = {}
): Promise<Response> {
  const operation = async (): Promise<Response> => {
    const response = await fetch(input, init);

    // Check if response indicates an error that should be retried
    if (!response.ok) {
      const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
      (error as any).response = response;
      (error as any).status = response.status;
      throw error;
    }

    return response;
  };

  return withRetry(operation, {
    operationName: `fetch ${input.toString()}`,
    ...retryOptions
  });
}

/**
 * Retry wrapper for database operations
 */
export async function dbWithRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const dbShouldRetry = (error: any, attempt: number): boolean => {
    // Don't retry after max attempts
    if (attempt >= (options.maxAttempts || DEFAULT_OPTIONS.maxAttempts)) {
      return false;
    }

    // Retry on connection errors
    if (error.code === 'ECONNRESET' ||
        error.code === 'ECONNREFUSED' ||
        error.message?.includes('connection') ||
        error.message?.includes('timeout')) {
      return true;
    }

    // Retry on deadlocks and lock timeouts
    if (error.code === '40001' || // serialization_failure
        error.code === '40P01' || // deadlock_detected
        error.message?.includes('deadlock') ||
        error.message?.includes('lock timeout')) {
      return true;
    }

    // Don't retry on constraint violations, syntax errors, etc.
    return false;
  };

  return withRetry(operation, {
    shouldRetry: dbShouldRetry,
    operationName: 'database operation',
    initialDelay: 500,
    maxDelay: 5000,
    ...options
  });
}

/**
 * Retry wrapper for OPAL API calls
 */
export async function opalApiWithRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opalShouldRetry = (error: any, attempt: number): boolean => {
    // Don't retry after max attempts
    if (attempt >= (options.maxAttempts || 5)) { // More retries for OPAL
      return false;
    }

    // Retry on network errors
    if (error.code === 'ECONNRESET' ||
        error.code === 'ENOTFOUND' ||
        error.code === 'ETIMEDOUT') {
      return true;
    }

    // Check HTTP status codes
    if (error.response || error.status) {
      const status = error.response?.status || error.status;

      // Retry on server errors and rate limits
      if (status >= 500 || status === 429) {
        return true;
      }

      // Retry on OPAL-specific errors
      if (status === 503) { // Service unavailable
        return true;
      }
    }

    // Retry on OPAL-specific error messages
    if (error.message?.includes('workflow not found') ||
        error.message?.includes('agent timeout') ||
        error.message?.includes('queue full')) {
      return true;
    }

    return false;
  };

  return withRetry(operation, {
    shouldRetry: opalShouldRetry,
    operationName: 'OPAL API call',
    maxAttempts: 5,
    initialDelay: 2000,
    maxDelay: 30000,
    ...options
  });
}

/**
 * Creates a retry-enabled version of any async function
 */
export function createRetryWrapper<TArgs extends any[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>,
  defaultOptions: RetryOptions = {}
) {
  return async (
    ...args: TArgs
  ): Promise<TReturn> => {
    return withRetry(() => fn(...args), defaultOptions);
  };
}

/**
 * Utility for exponential backoff delay without retry logic
 */
export async function exponentialDelay(
  attempt: number,
  options: Pick<RetryOptions, 'initialDelay' | 'backoffFactor' | 'maxDelay' | 'jitterFactor'> = {}
): Promise<void> {
  const config = { ...DEFAULT_OPTIONS, ...options };
  const delay = calculateDelay(
    attempt,
    config.initialDelay,
    config.backoffFactor,
    config.maxDelay,
    config.jitterFactor
  );

  await new Promise(resolve => setTimeout(resolve, delay));
}