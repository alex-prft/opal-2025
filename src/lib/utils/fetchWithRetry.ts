/**
 * Enhanced Fetch Utility with Retry Logic and Exponential Backoff
 * Handles network failures, timeouts, and service degradation gracefully
 */

export interface RetryOptions {
  retries?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  jitterMax?: number;
  retryableStatusCodes?: number[];
  timeout?: number;
}

export const RetryPresets = {
  standard: {
    retries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffFactor: 2,
    jitterMax: 1000,
    retryableStatusCodes: [408, 429, 500, 502, 503, 504],
    timeout: 10000
  },
  aggressive: {
    retries: 5,
    baseDelay: 500,
    maxDelay: 8000,
    backoffFactor: 1.5,
    jitterMax: 500,
    retryableStatusCodes: [408, 429, 500, 502, 503, 504],
    timeout: 15000
  },
  conservative: {
    retries: 2,
    baseDelay: 2000,
    maxDelay: 15000,
    backoffFactor: 3,
    jitterMax: 2000,
    retryableStatusCodes: [503, 504],
    timeout: 8000
  }
} as const;

export async function fetchWithRetry(
  url: string,
  init: RequestInit = {},
  options: RetryOptions = RetryPresets.standard
): Promise<any> {
  const {
    retries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2,
    jitterMax = 1000,
    retryableStatusCodes = [408, 429, 500, 502, 503, 504],
    timeout = 10000
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Add timeout to fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        ...init,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // If successful, return response
      if (response.ok) {
        return await response.json();
      }

      // If status is not retryable, throw immediately
      if (!retryableStatusCodes.includes(response.status)) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // If this is the last attempt, throw
      if (attempt === retries) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);

    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown fetch error');

      // If this is the last attempt, throw
      if (attempt === retries) {
        throw lastError;
      }

      // If it's an AbortError (timeout), it's retryable
      // If it's a network error, it's retryable
      // Otherwise, check if it should be retried
      const isTimeoutError = lastError.name === 'AbortError';
      const isNetworkError = lastError.message.includes('fetch') ||
                            lastError.message.includes('network') ||
                            lastError.message.includes('ECONNREFUSED');

      if (!isTimeoutError && !isNetworkError) {
        // For other errors, don't retry unless it's a specific retryable error
        throw lastError;
      }
    }

    // Calculate delay with exponential backoff and jitter
    const exponentialDelay = Math.min(baseDelay * Math.pow(backoffFactor, attempt), maxDelay);
    const jitter = Math.random() * jitterMax;
    const delay = exponentialDelay + jitter;

    console.warn(`🔄 Retry attempt ${attempt + 1}/${retries} after ${Math.round(delay)}ms delay`, {
      url,
      error: lastError?.message,
      attempt: attempt + 1,
      delay: Math.round(delay)
    });

    await new Promise(resolve => setTimeout(resolve, delay));
  }

  throw lastError || new Error('Max retries exceeded');
}

/**
 * Specialized fetch for health checks with fallback data
 */
export async function fetchHealthWithFallback(url: string): Promise<any> {
  try {
    return await fetchWithRetry(url, {}, RetryPresets.conservative);
  } catch (error) {
    console.warn('🏥 Health check failed, returning degraded status', {
      url,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    // Return fallback health status
    return {
      status: 'degraded',
      data: {
        status: 'degraded',
        checks: {
          database: { status: 'unknown' },
          opal_api: { status: 'unknown' },
          webhooks: { status: 'unknown' },
          workflow_engine: { status: 'unknown' }
        },
        fallback_used: true,
        cache_age_ms: 0,
        error: error instanceof Error ? error.message : 'Health check failed'
      },
      timestamp: new Date().toISOString(),
      cached: true
    };
  }
}

/**
 * Batch fetch with retry for multiple endpoints
 */
export async function fetchMultipleWithRetry(
  requests: Array<{ url: string; init?: RequestInit }>,
  options: RetryOptions = RetryPresets.standard
): Promise<Array<{ success: boolean; data?: any; error?: string }>> {
  const results = await Promise.allSettled(
    requests.map(({ url, init }) => fetchWithRetry(url, init, options))
  );

  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return { success: true, data: result.value };
    } else {
      return {
        success: false,
        error: result.reason instanceof Error ? result.reason.message : 'Unknown error',
        url: requests[index].url
      };
    }
  });
}