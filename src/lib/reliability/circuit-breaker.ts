/**
 * Circuit Breaker Pattern Implementation for OPAL API Reliability
 * Prevents cascading failures by temporarily disabling calls to failing services
 */

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerOptions {
  /** Failure threshold before opening circuit (default: 5) */
  failureThreshold?: number;
  /** Success threshold to close circuit from half-open (default: 3) */
  successThreshold?: number;
  /** Time in ms to wait before trying half-open (default: 60000) */
  timeout?: number;
  /** Monitor window in ms for failure tracking (default: 300000 - 5 minutes) */
  monitoringWindow?: number;
  /** Name for logging and identification */
  name?: string;
  /** Custom function to determine if error should count as failure */
  isFailure?: (error: Error) => boolean;
  /** Callback when circuit state changes */
  onStateChange?: (oldState: CircuitState, newState: CircuitState, reason: string) => void;
}

export interface CircuitBreakerStats {
  state: CircuitState;
  failureCount: number;
  successCount: number;
  lastFailureTime: string | null;
  lastSuccessTime: string | null;
  totalRequests: number;
  totalFailures: number;
  totalSuccesses: number;
  nextAttemptTime: string | null;
  uptimePercentage: number;
}

export class CircuitBreakerError extends Error {
  constructor(
    public circuitName: string,
    public state: CircuitState,
    public nextAttemptTime: string | null
  ) {
    super(`Circuit breaker '${circuitName}' is ${state.toLowerCase()}. ${
      nextAttemptTime ? `Next attempt allowed at: ${nextAttemptTime}` : 'Service temporarily unavailable.'
    }`);
    this.name = 'CircuitBreakerError';
  }
}

/**
 * Default failure detection - treat most errors as failures except client errors
 */
const defaultIsFailure = (error: Error): boolean => {
  // Don't treat authentication/authorization errors as circuit failures
  if (error.message.includes('401') || error.message.includes('403')) {
    return false;
  }

  // Don't treat bad request errors as circuit failures
  if (error.message.includes('400')) {
    return false;
  }

  // Treat network errors, timeouts, and server errors as failures
  return true;
};

export class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime: Date | null = null;
  private lastSuccessTime: Date | null = null;
  private nextAttemptTime: Date | null = null;
  private totalRequests = 0;
  private totalFailures = 0;
  private totalSuccesses = 0;
  private recentFailures: Date[] = [];

  private readonly failureThreshold: number;
  private readonly successThreshold: number;
  private readonly timeout: number;
  private readonly monitoringWindow: number;
  private readonly name: string;
  private readonly isFailure: (error: Error) => boolean;
  private readonly onStateChange?: (oldState: CircuitState, newState: CircuitState, reason: string) => void;

  constructor(options: CircuitBreakerOptions = {}) {
    this.failureThreshold = options.failureThreshold ?? 5;
    this.successThreshold = options.successThreshold ?? 3;
    this.timeout = options.timeout ?? 60000; // 1 minute
    this.monitoringWindow = options.monitoringWindow ?? 300000; // 5 minutes
    this.name = options.name ?? 'CircuitBreaker';
    this.isFailure = options.isFailure ?? defaultIsFailure;
    this.onStateChange = options.onStateChange;

    console.log(`🔧 [Circuit Breaker] Initialized '${this.name}'`, {
      failureThreshold: this.failureThreshold,
      successThreshold: this.successThreshold,
      timeout: this.timeout,
      monitoringWindow: this.monitoringWindow
    });
  }

  /**
   * Execute operation through circuit breaker
   */
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    this.totalRequests++;

    // Check if circuit should allow the call
    if (!this.canExecute()) {
      const error = new CircuitBreakerError(this.name, this.state, this.nextAttemptTime?.toISOString() || null);
      console.log(`🚫 [Circuit Breaker] ${this.name}: Call blocked`, {
        state: this.state,
        failureCount: this.failureCount,
        nextAttemptTime: this.nextAttemptTime?.toISOString()
      });
      throw error;
    }

    try {
      console.log(`⚡ [Circuit Breaker] ${this.name}: Executing operation (${this.state})`);

      const result = await operation();

      this.onSuccess();
      return result;

    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.onError(err);
      throw err;
    }
  }

  /**
   * Check if circuit allows execution
   */
  private canExecute(): boolean {
    const now = new Date();

    switch (this.state) {
      case 'CLOSED':
        return true;

      case 'OPEN':
        // Check if timeout period has elapsed
        if (this.nextAttemptTime && now >= this.nextAttemptTime) {
          this.transitionToHalfOpen();
          return true;
        }
        return false;

      case 'HALF_OPEN':
        return true;

      default:
        return false;
    }
  }

  /**
   * Handle successful operation
   */
  private onSuccess(): void {
    this.successCount++;
    this.totalSuccesses++;
    this.lastSuccessTime = new Date();

    console.log(`✅ [Circuit Breaker] ${this.name}: Operation succeeded`, {
      state: this.state,
      successCount: this.successCount,
      successThreshold: this.successThreshold
    });

    switch (this.state) {
      case 'HALF_OPEN':
        if (this.successCount >= this.successThreshold) {
          this.transitionToClosed();
        }
        break;

      case 'CLOSED':
        // Reset failure count on success
        this.failureCount = 0;
        break;
    }
  }

  /**
   * Handle operation error
   */
  private onError(error: Error): void {
    if (!this.isFailure(error)) {
      console.log(`ℹ️ [Circuit Breaker] ${this.name}: Error ignored (not a failure)`, {
        error: error.message,
        state: this.state
      });
      return;
    }

    this.failureCount++;
    this.totalFailures++;
    this.lastFailureTime = new Date();
    this.recentFailures.push(this.lastFailureTime);

    // Clean old failures outside monitoring window
    const cutoff = new Date(Date.now() - this.monitoringWindow);
    this.recentFailures = this.recentFailures.filter(failure => failure > cutoff);

    console.log(`❌ [Circuit Breaker] ${this.name}: Operation failed`, {
      error: error.message,
      state: this.state,
      failureCount: this.failureCount,
      failureThreshold: this.failureThreshold,
      recentFailures: this.recentFailures.length
    });

    switch (this.state) {
      case 'CLOSED':
        if (this.failureCount >= this.failureThreshold) {
          this.transitionToOpen();
        }
        break;

      case 'HALF_OPEN':
        this.transitionToOpen();
        break;
    }
  }

  /**
   * Transition to CLOSED state
   */
  private transitionToClosed(): void {
    const oldState = this.state;
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.successCount = 0;
    this.nextAttemptTime = null;

    const reason = `Success threshold reached (${this.successThreshold})`;
    console.log(`🟢 [Circuit Breaker] ${this.name}: CLOSED`, { reason });

    this.onStateChange?.(oldState, this.state, reason);
  }

  /**
   * Transition to OPEN state
   */
  private transitionToOpen(): void {
    const oldState = this.state;
    this.state = 'OPEN';
    this.nextAttemptTime = new Date(Date.now() + this.timeout);

    const reason = `Failure threshold reached (${this.failureCount}/${this.failureThreshold})`;
    console.log(`🔴 [Circuit Breaker] ${this.name}: OPEN`, {
      reason,
      nextAttemptTime: this.nextAttemptTime.toISOString()
    });

    this.onStateChange?.(oldState, this.state, reason);
  }

  /**
   * Transition to HALF_OPEN state
   */
  private transitionToHalfOpen(): void {
    const oldState = this.state;
    this.state = 'HALF_OPEN';
    this.successCount = 0;

    const reason = `Timeout period elapsed (${this.timeout}ms)`;
    console.log(`🟡 [Circuit Breaker] ${this.name}: HALF_OPEN`, { reason });

    this.onStateChange?.(oldState, this.state, reason);
  }

  /**
   * Get current circuit breaker statistics
   */
  getStats(): CircuitBreakerStats {
    const totalCalls = this.totalSuccesses + this.totalFailures;
    const uptimePercentage = totalCalls > 0 ? (this.totalSuccesses / totalCalls) * 100 : 100;

    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime?.toISOString() || null,
      lastSuccessTime: this.lastSuccessTime?.toISOString() || null,
      totalRequests: this.totalRequests,
      totalFailures: this.totalFailures,
      totalSuccesses: this.totalSuccesses,
      nextAttemptTime: this.nextAttemptTime?.toISOString() || null,
      uptimePercentage: Math.round(uptimePercentage * 100) / 100
    };
  }

  /**
   * Reset circuit breaker to initial state
   */
  reset(): void {
    console.log(`🔄 [Circuit Breaker] ${this.name}: Resetting to initial state`);

    const oldState = this.state;
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    this.lastSuccessTime = null;
    this.nextAttemptTime = null;
    this.recentFailures = [];

    this.onStateChange?.(oldState, this.state, 'Manual reset');
  }

  /**
   * Force circuit to specific state (for testing/admin)
   */
  forceState(state: CircuitState, reason = 'Manual override'): void {
    const oldState = this.state;
    this.state = state;

    if (state === 'OPEN') {
      this.nextAttemptTime = new Date(Date.now() + this.timeout);
    } else {
      this.nextAttemptTime = null;
    }

    if (state === 'CLOSED') {
      this.failureCount = 0;
      this.successCount = 0;
    }

    console.log(`⚙️ [Circuit Breaker] ${this.name}: Force state change`, {
      from: oldState,
      to: state,
      reason
    });

    this.onStateChange?.(oldState, this.state, reason);
  }
}