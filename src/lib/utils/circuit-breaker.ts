/**
 * Circuit Breaker Pattern Implementation
 * Prevents cascading failures by failing fast when a service is unavailable
 */

export enum CircuitState {
  CLOSED = 'CLOSED',     // Normal operation
  OPEN = 'OPEN',         // Circuit is open, failing fast
  HALF_OPEN = 'HALF_OPEN' // Testing if service is back up
}

export interface CircuitBreakerConfig {
  /** Name for logging and identification */
  name: string;

  /** Number of failures before opening circuit (default: 5) */
  failureThreshold: number;

  /** Time to wait before trying again when open (default: 60000ms) */
  timeoutDuration: number;

  /** Number of successful calls needed to close circuit from half-open (default: 3) */
  successThreshold: number;

  /** Time window for failure counting in milliseconds (default: 60000ms) */
  monitoringPeriod: number;

  /** Custom function to determine if error should count as failure */
  isFailure?: (error: any) => boolean;

  /** Callback when circuit state changes */
  onStateChange?: (state: CircuitState, error?: any) => void;

  /** Enable detailed logging */
  enableLogging?: boolean;
}

export interface CircuitBreakerStats {
  state: CircuitState;
  failureCount: number;
  successCount: number;
  requestCount: number;
  lastFailureTime: number | null;
  lastSuccessTime: number | null;
  nextAttemptTime: number | null;
}

export class CircuitBreakerError extends Error {
  constructor(
    public circuitName: string,
    public state: CircuitState,
    public nextAttemptTime: number | null = null
  ) {
    super(`Circuit breaker '${circuitName}' is ${state}${
      nextAttemptTime ? `, next attempt at ${new Date(nextAttemptTime).toISOString()}` : ''
    }`);
    this.name = 'CircuitBreakerError';
  }
}

/**
 * Circuit Breaker implementation for resilient service calls
 */
export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private requestCount = 0;
  private lastFailureTime: number | null = null;
  private lastSuccessTime: number | null = null;
  private nextAttemptTime: number | null = null;
  private failures: number[] = []; // Track failure timestamps for sliding window

  constructor(private config: CircuitBreakerConfig) {
    if (config.enableLogging) {
      console.log(`🔧 Circuit breaker '${config.name}' initialized:`, {
        failureThreshold: config.failureThreshold,
        timeoutDuration: config.timeoutDuration,
        successThreshold: config.successThreshold
      });
    }
  }

  /**
   * Execute an operation with circuit breaker protection
   */
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    this.requestCount++;

    // Check if circuit should be opened or closed
    this.updateState();

    // If circuit is open, fail fast
    if (this.state === CircuitState.OPEN) {
      throw new CircuitBreakerError(this.config.name, this.state, this.nextAttemptTime);
    }

    try {
      // Execute the operation
      const result = await operation();

      // Operation succeeded
      this.onSuccess();
      return result;

    } catch (error) {
      // Operation failed
      this.onFailure(error);
      throw error;
    }
  }

  /**
   * Handle successful operation
   */
  private onSuccess(): void {
    this.lastSuccessTime = Date.now();

    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;

      if (this.config.enableLogging) {
        console.log(`✅ Circuit '${this.config.name}' success ${this.successCount}/${this.config.successThreshold}`);
      }

      // Close circuit if enough successes
      if (this.successCount >= this.config.successThreshold) {
        this.setState(CircuitState.CLOSED);
        this.reset();
      }
    } else if (this.state === CircuitState.CLOSED) {
      // Reset failure count on success in closed state
      this.cleanupOldFailures();
    }
  }

  /**
   * Handle failed operation
   */
  private onFailure(error: any): void {
    // Check if this error should count as a failure
    const isFailure = this.config.isFailure ? this.config.isFailure(error) : true;

    if (!isFailure) {
      if (this.config.enableLogging) {
        console.log(`ℹ️ Circuit '${this.config.name}' error ignored: ${error.message}`);
      }
      return;
    }

    this.lastFailureTime = Date.now();
    this.failures.push(this.lastFailureTime);
    this.failureCount++;

    if (this.config.enableLogging) {
      console.warn(`⚠️ Circuit '${this.config.name}' failure ${this.failureCount}/${this.config.failureThreshold}: ${error.message}`);
    }

    // Open circuit if too many failures
    if (this.state === CircuitState.CLOSED || this.state === CircuitState.HALF_OPEN) {
      this.cleanupOldFailures();

      const recentFailures = this.failures.length;
      if (recentFailures >= this.config.failureThreshold) {
        this.setState(CircuitState.OPEN);
        this.nextAttemptTime = Date.now() + this.config.timeoutDuration;
      }
    }
  }

  /**
   * Update circuit state based on current conditions
   */
  private updateState(): void {
    const now = Date.now();

    if (this.state === CircuitState.OPEN) {
      // Check if timeout has elapsed
      if (this.nextAttemptTime && now >= this.nextAttemptTime) {
        this.setState(CircuitState.HALF_OPEN);
        this.successCount = 0;
        this.nextAttemptTime = null;
      }
    }

    // Clean up old failures
    this.cleanupOldFailures();
  }

  /**
   * Remove failures outside the monitoring period
   */
  private cleanupOldFailures(): void {
    const cutoff = Date.now() - this.config.monitoringPeriod;
    this.failures = this.failures.filter(timestamp => timestamp > cutoff);
  }

  /**
   * Change circuit state and notify listeners
   */
  private setState(newState: CircuitState): void {
    if (newState === this.state) return;

    const oldState = this.state;
    this.state = newState;

    if (this.config.enableLogging) {
      console.log(`🔄 Circuit '${this.config.name}' state: ${oldState} → ${newState}`);
    }

    if (this.config.onStateChange) {
      this.config.onStateChange(newState);
    }
  }

  /**
   * Reset circuit breaker state
   */
  private reset(): void {
    this.failureCount = 0;
    this.successCount = 0;
    this.failures = [];
    this.nextAttemptTime = null;

    if (this.config.enableLogging) {
      console.log(`🔄 Circuit '${this.config.name}' reset`);
    }
  }

  /**
   * Get current circuit breaker statistics
   */
  getStats(): CircuitBreakerStats {
    this.cleanupOldFailures();

    return {
      state: this.state,
      failureCount: this.failures.length,
      successCount: this.successCount,
      requestCount: this.requestCount,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      nextAttemptTime: this.nextAttemptTime
    };
  }

  /**
   * Force circuit to open state (for testing or emergency)
   */
  forceOpen(): void {
    this.setState(CircuitState.OPEN);
    this.nextAttemptTime = Date.now() + this.config.timeoutDuration;
  }

  /**
   * Force circuit to closed state (for testing or manual recovery)
   */
  forceClosed(): void {
    this.setState(CircuitState.CLOSED);
    this.reset();
  }

  /**
   * Check if circuit is healthy (closed or half-open with low failures)
   */
  isHealthy(): boolean {
    this.cleanupOldFailures();
    return this.state === CircuitState.CLOSED ||
           (this.state === CircuitState.HALF_OPEN && this.failures.length < this.config.failureThreshold);
  }
}

/**
 * Circuit breaker manager for multiple services
 */
export class CircuitBreakerManager {
  private breakers = new Map<string, CircuitBreaker>();

  /**
   * Get or create a circuit breaker for a service
   */
  getCircuitBreaker(
    name: string,
    config?: Partial<CircuitBreakerConfig>
  ): CircuitBreaker {
    if (!this.breakers.has(name)) {
      const defaultConfig: CircuitBreakerConfig = {
        name,
        failureThreshold: 5,
        timeoutDuration: 60000,
        successThreshold: 3,
        monitoringPeriod: 60000,
        enableLogging: true
      };

      this.breakers.set(name, new CircuitBreaker({ ...defaultConfig, ...config }));
    }

    return this.breakers.get(name)!;
  }

  /**
   * Execute operation with circuit breaker protection
   */
  async execute<T>(
    serviceName: string,
    operation: () => Promise<T>,
    config?: Partial<CircuitBreakerConfig>
  ): Promise<T> {
    const breaker = this.getCircuitBreaker(serviceName, config);
    return breaker.execute(operation);
  }

  /**
   * Get stats for all circuit breakers
   */
  getAllStats(): Record<string, CircuitBreakerStats> {
    const stats: Record<string, CircuitBreakerStats> = {};

    for (const [name, breaker] of this.breakers) {
      stats[name] = breaker.getStats();
    }

    return stats;
  }

  /**
   * Get health status of all services
   */
  getHealthStatus(): Record<string, boolean> {
    const health: Record<string, boolean> = {};

    for (const [name, breaker] of this.breakers) {
      health[name] = breaker.isHealthy();
    }

    return health;
  }

  /**
   * Force all circuits to closed state
   */
  resetAll(): void {
    for (const breaker of this.breakers.values()) {
      breaker.forceClosed();
    }
  }
}

// Global circuit breaker manager instance
export const circuitBreakerManager = new CircuitBreakerManager();

/**
 * Convenience function to execute with circuit breaker protection
 */
export async function withCircuitBreaker<T>(
  serviceName: string,
  operation: () => Promise<T>,
  config?: Partial<CircuitBreakerConfig>
): Promise<T> {
  return circuitBreakerManager.execute(serviceName, operation, config);
}

/**
 * Circuit breaker decorator for class methods
 */
export function CircuitBreakerDecorator(
  serviceName: string,
  config?: Partial<CircuitBreakerConfig>
) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      return withCircuitBreaker(serviceName, () => method.apply(this, args), config);
    };

    return descriptor;
  };
}

/**
 * Default circuit breaker configurations for common services
 */
export const CircuitBreakerConfigs = {
  OPAL_API: {
    failureThreshold: 5,
    timeoutDuration: 30000,  // 30 seconds
    successThreshold: 2,
    monitoringPeriod: 60000,
    isFailure: (error: any) => {
      // Only count server errors and timeouts as failures
      const status = error.response?.status || error.status;
      return !status || status >= 500 || error.code === 'ETIMEDOUT';
    }
  },

  DATABASE: {
    failureThreshold: 3,
    timeoutDuration: 10000,  // 10 seconds
    successThreshold: 2,
    monitoringPeriod: 30000,
    isFailure: (error: any) => {
      // Count connection and timeout errors
      return error.code === 'ECONNREFUSED' ||
             error.code === 'ETIMEDOUT' ||
             error.message?.includes('connection') ||
             error.message?.includes('timeout');
    }
  },

  OPTIMIZELY_API: {
    failureThreshold: 4,
    timeoutDuration: 45000,  // 45 seconds
    successThreshold: 3,
    monitoringPeriod: 120000, // 2 minutes
    isFailure: (error: any) => {
      const status = error.response?.status || error.status;
      // Don't count 4xx client errors as failures (except 429)
      return !status || status >= 500 || status === 429 || error.code === 'ETIMEDOUT';
    }
  }
} as const;