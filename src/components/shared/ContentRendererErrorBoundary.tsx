/**
 * Error Boundary for ContentRenderer Component
 *
 * This error boundary specifically handles runtime errors in the ContentRenderer
 * component, preventing crashes like the "renderExperienceUXSection is not defined" error.
 *
 * Features:
 * - Graceful error handling with fallback UI
 * - Error logging for debugging
 * - Recovery mechanisms
 * - User-friendly error messages
 * - Production-ready error reporting
 */

'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface ErrorInfo {
  componentStack: string;
}

interface ContentRendererErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId?: string;
  retryCount: number;
}

interface ContentRendererErrorBoundaryProps {
  children: React.ReactNode;
  fallbackComponent?: React.ComponentType<{ error?: Error; retry: () => void }>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  maxRetries?: number;
  showErrorDetails?: boolean;
}

export class ContentRendererErrorBoundary extends React.Component<
  ContentRendererErrorBoundaryProps,
  ContentRendererErrorBoundaryState
> {
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: ContentRendererErrorBoundaryProps) {
    super(props);

    this.state = {
      hasError: false,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ContentRendererErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error for debugging
    this.logError(error, errorInfo);

    // Update state with error info
    this.setState({
      errorInfo
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Report to error monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      this.reportError(error, errorInfo);
    }
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  private logError = (error: Error, errorInfo: ErrorInfo) => {
    const errorDetails = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId,
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'Unknown'
    };

    console.group('🚨 ContentRenderer Error Boundary Caught Error');
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Full Error Details:', errorDetails);
    console.groupEnd();

    // Store error in localStorage for debugging
    if (typeof localStorage !== 'undefined') {
      try {
        const existingErrors = JSON.parse(localStorage.getItem('contentRenderer_errors') || '[]');
        existingErrors.push(errorDetails);

        // Keep only last 10 errors to prevent storage bloat
        if (existingErrors.length > 10) {
          existingErrors.splice(0, existingErrors.length - 10);
        }

        localStorage.setItem('contentRenderer_errors', JSON.stringify(existingErrors));
      } catch (storageError) {
        console.warn('Failed to store error in localStorage:', storageError);
      }
    }
  };

  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    // In a real application, you would send this to your error monitoring service
    // (e.g., Sentry, Bugsnag, LogRocket, etc.)

    const errorPayload = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      version: process.env.NEXT_PUBLIC_APP_VERSION || 'unknown'
    };

    // Example: Send to error monitoring service
    if (process.env.NEXT_PUBLIC_ERROR_REPORTING_URL) {
      fetch(process.env.NEXT_PUBLIC_ERROR_REPORTING_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorPayload)
      }).catch(reportingError => {
        console.warn('Failed to report error to monitoring service:', reportingError);
      });
    }
  };

  private retry = () => {
    const maxRetries = this.props.maxRetries || 3;

    if (this.state.retryCount < maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: undefined,
        errorInfo: undefined,
        retryCount: prevState.retryCount + 1
      }));
    }
  };

  private autoRetry = () => {
    // Automatic retry after 3 seconds for certain types of errors
    const error = this.state.error;

    if (error && this.shouldAutoRetry(error)) {
      this.retryTimeoutId = setTimeout(() => {
        this.retry();
      }, 3000);
    }
  };

  private shouldAutoRetry = (error: Error): boolean => {
    const retryableErrors = [
      'is not defined',
      'Cannot read property',
      'Cannot read properties of undefined',
      'Network Error',
      'fetch is not defined'
    ];

    return retryableErrors.some(pattern =>
      error.message.includes(pattern) || error.stack?.includes(pattern)
    );
  };

  private renderErrorDetails = () => {
    const { error, errorInfo, errorId } = this.state;
    const { showErrorDetails = process.env.NODE_ENV === 'development' } = this.props;

    if (!showErrorDetails || !error) {
      return null;
    }

    return (
      <details className="mt-4 p-3 bg-gray-50 rounded-lg text-sm">
        <summary className="cursor-pointer font-medium text-gray-700 hover:text-gray-900">
          Technical Details (Error ID: {errorId})
        </summary>
        <div className="mt-2 space-y-2">
          <div>
            <strong>Error Message:</strong>
            <code className="block mt-1 p-2 bg-red-50 text-red-800 rounded text-xs">
              {error.message}
            </code>
          </div>
          {error.stack && (
            <div>
              <strong>Stack Trace:</strong>
              <pre className="mt-1 p-2 bg-gray-100 text-gray-800 rounded text-xs overflow-auto max-h-32">
                {error.stack}
              </pre>
            </div>
          )}
          {errorInfo?.componentStack && (
            <div>
              <strong>Component Stack:</strong>
              <pre className="mt-1 p-2 bg-blue-50 text-blue-800 rounded text-xs overflow-auto max-h-32">
                {errorInfo.componentStack}
              </pre>
            </div>
          )}
        </div>
      </details>
    );
  };

  private renderFallbackUI = () => {
    const { error, retryCount } = this.state;
    const maxRetries = this.props.maxRetries || 3;

    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="h-5 w-5" />
            Content Loading Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-red-600">
              We encountered an error while loading this content. This could be due to a
              temporary issue or missing component configuration.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              {retryCount < maxRetries && (
                <button
                  onClick={this.retry}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <RefreshCw className="h-4 w-4" />
                  Try Again ({maxRetries - retryCount} attempts left)
                </button>
              )}

              <button
                onClick={() => window.location.href = '/engine'}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Home className="h-4 w-4" />
                Return to Dashboard
              </button>
            </div>

            {retryCount >= maxRetries && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800">
                  Maximum retry attempts reached. Please refresh the page or contact support
                  if the issue persists.
                </p>
              </div>
            )}

            {this.renderErrorDetails()}

            <div className="text-xs text-gray-500">
              If this error persists, please report it with the error ID above.
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  render() {
    const { hasError } = this.state;
    const { children, fallbackComponent: FallbackComponent } = this.props;

    if (hasError) {
      // Auto-retry for certain error types
      this.autoRetry();

      // Use custom fallback component if provided
      if (FallbackComponent) {
        return <FallbackComponent error={this.state.error} retry={this.retry} />;
      }

      // Use default fallback UI
      return this.renderFallbackUI();
    }

    return children;
  }
}

/**
 * Higher-order component wrapper for easy error boundary integration
 */
export function withContentRendererErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Partial<ContentRendererErrorBoundaryProps>
) {
  const WrappedComponent = (props: P) => (
    <ContentRendererErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ContentRendererErrorBoundary>
  );

  WrappedComponent.displayName = `withContentRendererErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

/**
 * Hook for accessing error boundary context
 */
export function useContentRendererErrorReporting() {
  // CRITICAL: React hook safety during Next.js static generation
  // During static generation, React can be null, so check before using hooks
  if (typeof window === 'undefined' && (!React || !React.useCallback)) {
    // Return a safe fallback during static generation
    return {
      reportError: (error: Error, context?: any) => {
        console.warn('Error reporting unavailable during static generation:', error);
      }
    };
  }

  const reportError = React.useCallback((error: Error, context?: any) => {
    console.error('Manual error report:', error, context);

    // In production, send to error monitoring service
    if (process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_ERROR_REPORTING_URL) {
      fetch(process.env.NEXT_PUBLIC_ERROR_REPORTING_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: error.message,
          stack: error.stack,
          context,
          timestamp: new Date().toISOString(),
          type: 'manual_report'
        })
      }).catch(reportingError => {
        console.warn('Failed to report error:', reportingError);
      });
    }
  }, []);

  return { reportError };
}

export default ContentRendererErrorBoundary;