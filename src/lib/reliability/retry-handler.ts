/**
 * Retry Handler for OPAL API Calls
 * Implements exponential backoff with jitter for reliable API interactions
 */

export interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxAttempts?: number;
  /** Initial delay in milliseconds (default: 1000) */
  initialDelay?: number;
  /** Maximum delay in milliseconds (default: 30000) */
  maxDelay?: number;
  /** Backoff multiplier (default: 2) */
  backoffMultiplier?: number;
  /** Whether to add jitter to delays (default: true) */
  jitter?: boolean;
  /** Custom function to determine if error should be retried */
  shouldRetry?: (error: Error, attempt: number) => boolean;
  /** Function called before each retry attempt */
  onRetry?: (error: Error, attempt: number, delay: number) => void;
}

export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  attempts: number;
  totalDuration: number;
  lastAttemptAt: string;
}

/**
 * Default retry condition - retry on network errors and 5xx responses
 */
const defaultShouldRetry = (error: Error, attempt: number): boolean => {
  // Don't retry client errors (4xx) except for rate limiting
  if (error.message.includes('401') || error.message.includes('403') || error.message.includes('404')) {
    return false;
  }

  // Retry on network errors and server errors
  return error.message.includes('fetch failed') ||
         error.message.includes('5') ||
         error.message.includes('timeout') ||
         error.message.includes('ECONNRESET') ||
         error.message.includes('ENOTFOUND') ||
         attempt <= 3; // Always retry first 3 attempts
};

/**
 * Calculate delay with exponential backoff and optional jitter
 */
function calculateDelay(
  attempt: number,
  options: Required<Pick<RetryOptions, 'initialDelay' | 'maxDelay' | 'backoffMultiplier' | 'jitter'>>
): number {
  const { initialDelay, maxDelay, backoffMultiplier, jitter } = options;

  // Calculate exponential backoff
  let delay = initialDelay * Math.pow(backoffMultiplier, attempt - 1);

  // Apply maximum delay cap
  delay = Math.min(delay, maxDelay);

  // Add jitter to prevent thundering herd
  if (jitter) {
    const jitterFactor = 0.1; // ±10% jitter
    const jitterAmount = delay * jitterFactor * (Math.random() * 2 - 1);
    delay += jitterAmount;
  }

  return Math.max(0, Math.floor(delay));
}

/**
 * Sleep utility function
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry wrapper for async operations with exponential backoff
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<RetryResult<T>> {
  const {
    maxAttempts = 3,
    initialDelay = 1000,
    maxDelay = 30000,
    backoffMultiplier = 2,
    jitter = true,
    shouldRetry = defaultShouldRetry,
    onRetry
  } = options;

  const startTime = Date.now();
  let lastError: Error | undefined;
  let attempts = 0;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    attempts = attempt;

    try {
      console.log(`🔄 [Retry] Attempt ${attempt}/${maxAttempts}${attempt > 1 ? ` (retry ${attempt - 1})` : ''}`);

      const result = await operation();

      const duration = Date.now() - startTime;
      console.log(`✅ [Retry] Operation succeeded on attempt ${attempt} (${duration}ms)`);

      return {
        success: true,
        data: result,
        attempts,
        totalDuration: duration,
        lastAttemptAt: new Date().toISOString()
      };

    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      console.log(`❌ [Retry] Attempt ${attempt} failed:`, {
        error: lastError.message,
        attempt,
        maxAttempts
      });

      // Check if we should retry this error
      if (attempt === maxAttempts || !shouldRetry(lastError, attempt)) {
        console.log(`🚫 [Retry] Not retrying: ${attempt === maxAttempts ? 'max attempts reached' : 'error not retryable'}`);
        break;
      }

      // Calculate delay for next attempt
      const delay = calculateDelay(attempt, {
        initialDelay,
        maxDelay,
        backoffMultiplier,
        jitter
      });

      console.log(`⏳ [Retry] Waiting ${delay}ms before attempt ${attempt + 1}`);

      // Call retry callback
      onRetry?.(lastError, attempt, delay);

      // Wait before next attempt
      await sleep(delay);
    }
  }

  const totalDuration = Date.now() - startTime;
  console.log(`💥 [Retry] All attempts failed after ${totalDuration}ms`);

  return {
    success: false,
    error: lastError,
    attempts,
    totalDuration,
    lastAttemptAt: new Date().toISOString()
  };
}

/**
 * Specialized retry wrapper for HTTP operations
 */
export async function withHttpRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions & {
    /** Request description for logging */
    operationName?: string;
    /** Correlation ID for tracking */
    correlationId?: string;
  } = {}
): Promise<RetryResult<T>> {
  const { operationName = 'HTTP Request', correlationId, ...retryOptions } = options;

  const enhancedOptions: RetryOptions = {
    ...retryOptions,
    onRetry: (error, attempt, delay) => {
      console.log(`🔁 [HTTP Retry] ${operationName} failed on attempt ${attempt}`, {
        correlation_id: correlationId,
        error: error.message,
        next_attempt_in: `${delay}ms`
      });

      // Call original onRetry if provided
      options.onRetry?.(error, attempt, delay);
    }
  };

  console.log(`🚀 [HTTP Retry] Starting ${operationName}`, {
    correlation_id: correlationId,
    max_attempts: retryOptions.maxAttempts || 3
  });

  return withRetry(operation, enhancedOptions);
}

/**
 * Retry configuration presets for different scenarios
 */
export const RetryPresets = {
  /** Fast retries for quick operations */
  fast: {
    maxAttempts: 2,
    initialDelay: 500,
    maxDelay: 2000,
    backoffMultiplier: 1.5
  } as RetryOptions,

  /** Standard retries for normal API calls */
  standard: {
    maxAttempts: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2
  } as RetryOptions,

  /** Aggressive retries for critical operations */
  aggressive: {
    maxAttempts: 5,
    initialDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2
  } as RetryOptions,

  /** OPAL-specific retry configuration */
  opal: {
    maxAttempts: 4,
    initialDelay: 2000,
    maxDelay: 15000,
    backoffMultiplier: 1.8,
    jitter: true,
    shouldRetry: (error: Error, attempt: number) => {
      // Don't retry authentication errors
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        return false;
      }

      // Don't retry bad requests after first attempt
      if (error.message.includes('400') && attempt > 1) {
        return false;
      }

      // Retry network and server errors
      return defaultShouldRetry(error, attempt);
    }
  } as RetryOptions
} as const;