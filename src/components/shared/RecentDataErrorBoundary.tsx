'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Bug } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

/**
 * React Error Boundary for RecentDataComponent
 * Catches JavaScript errors anywhere in the child component tree and displays fallback UI
 * Implements enhanced error reporting and graceful degradation patterns
 */
export class RecentDataErrorBoundary extends Component<Props, State> {
  private retryCount = 0;
  private readonly maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state to trigger fallback UI
    const errorId = `RDC_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    console.error('🚨 [RecentDataErrorBoundary] Error caught:', errorId, error);

    return {
      hasError: true,
      error,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorId = this.state.errorId || 'unknown';

    console.error('🚨 [RecentDataErrorBoundary] Error details:', errorId, {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      retryCount: this.retryCount,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server'
    });

    // Update state with error info
    this.setState({
      errorInfo
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Report to monitoring service (if implemented)
    this.reportError(error, errorInfo, errorId);
  }

  private reportError = async (error: Error, errorInfo: ErrorInfo, errorId: string) => {
    try {
      // Send error report to monitoring endpoint
      const errorReport = {
        errorId,
        component: 'RecentDataComponent',
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name
        },
        errorInfo: {
          componentStack: errorInfo.componentStack
        },
        context: {
          timestamp: new Date().toISOString(),
          url: typeof window !== 'undefined' ? window.location.href : 'server',
          userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
          retryCount: this.retryCount
        }
      };

      // Only send if fetch is available (client-side)
      if (typeof fetch !== 'undefined') {
        await fetch('/api/monitoring/error-report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(errorReport)
        }).catch(() => {
          // Silently fail if error reporting is unavailable
          console.warn('⚠️ [RecentDataErrorBoundary] Error reporting endpoint unavailable');
        });
      }
    } catch (reportingError) {
      console.warn('⚠️ [RecentDataErrorBoundary] Failed to report error:', reportingError);
    }
  };

  private handleRetry = () => {
    this.retryCount += 1;
    console.log(`🔄 [RecentDataErrorBoundary] Retry attempt ${this.retryCount}/${this.maxRetries}`);

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    });
  };

  private handleReload = () => {
    if (typeof window !== 'undefined') {
      console.log('🔄 [RecentDataErrorBoundary] Reloading page');
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const canRetry = this.retryCount < this.maxRetries;
      const error = this.state.error;
      const errorId = this.state.errorId;

      // Default error fallback UI
      return (
        <Card className="w-full border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="h-5 w-5" />
              Recent Data Unavailable
              {errorId && (
                <Badge variant="outline" className="ml-auto text-xs font-mono">
                  {errorId}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-red-700">
              <p className="font-medium">Something went wrong while loading recent data.</p>
              {error && (
                <p className="mt-1 text-xs text-red-600 font-mono bg-red-100 p-2 rounded">
                  {error.message}
                </p>
              )}
            </div>

            <div className="flex gap-2 flex-wrap">
              {canRetry ? (
                <Button
                  onClick={this.handleRetry}
                  size="sm"
                  variant="outline"
                  className="border-red-200 text-red-700 hover:bg-red-100"
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Try Again ({this.maxRetries - this.retryCount} remaining)
                </Button>
              ) : (
                <Button
                  onClick={this.handleReload}
                  size="sm"
                  variant="outline"
                  className="border-red-200 text-red-700 hover:bg-red-100"
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Reload Page
                </Button>
              )}

              <Button
                onClick={() => window.open('/api/monitoring/status', '_blank')}
                size="sm"
                variant="ghost"
                className="text-red-600 hover:bg-red-100"
              >
                <Bug className="h-4 w-4 mr-1" />
                System Status
              </Button>
            </div>

            <div className="text-xs text-red-600 bg-red-100 p-3 rounded">
              <p className="font-medium">Troubleshooting:</p>
              <ul className="mt-1 space-y-1 list-disc list-inside">
                <li>Check your internet connection</li>
                <li>Verify webhook endpoints are accessible</li>
                <li>Try refreshing the page</li>
                <li>Contact support if the issue persists</li>
              </ul>
              {errorId && (
                <p className="mt-2 font-mono text-xs">
                  Error ID: {errorId} (include this in support requests)
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

/**
 * Higher-order component to wrap components with RecentDataErrorBoundary
 */
export function withRecentDataErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const ComponentWithErrorBoundary = (props: P) => {
    return (
      <RecentDataErrorBoundary {...errorBoundaryProps}>
        <WrappedComponent {...props} />
      </RecentDataErrorBoundary>
    );
  };

  ComponentWithErrorBoundary.displayName =
    `withRecentDataErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name})`;

  return ComponentWithErrorBoundary;
}

export default RecentDataErrorBoundary;