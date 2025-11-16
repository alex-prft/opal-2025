'use client';

import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Activity, RefreshCw, Wifi, WifiOff, AlertTriangle, Database, Zap } from 'lucide-react';

/**
 * Loading skeleton for RecentDataComponent
 * Provides visual feedback while data is being fetched
 */
export function RecentDataSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div className="space-y-4">
      {/* Recent Webhook Data Card Skeleton */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Activity className="h-6 w-6 text-gray-300" />
            <Skeleton className="h-6 w-48" />
            <div className="ml-auto flex items-center gap-2">
              <Skeleton className="h-5 w-16" />
              <RefreshCw className="h-4 w-4 text-gray-300" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-gray-300 animate-spin" />
                <Skeleton className="h-4 w-40" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {!compact && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Activity className="h-6 w-6 text-gray-300" />
              <Skeleton className="h-6 w-36" />
            </div>
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="p-3 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Skeleton className="h-3 w-3 rounded-full" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <Skeleton className="h-3 w-16" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/**
 * Connection status indicator component
 */
export function ConnectionStatus({
  status,
  message,
  showIcon = true
}: {
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  message?: string;
  showIcon?: boolean;
}) {
  const getStatusConfig = () => {
    switch (status) {
      case 'connecting':
        return {
          icon: RefreshCw,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          animate: 'animate-spin'
        };
      case 'connected':
        return {
          icon: Wifi,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          animate: ''
        };
      case 'disconnected':
        return {
          icon: WifiOff,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          animate: ''
        };
      case 'error':
        return {
          icon: AlertTriangle,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          animate: ''
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className={`inline-flex items-center gap-2 px-2 py-1 rounded-md ${config.bgColor} ${config.borderColor} border`}>
      {showIcon && <Icon className={`h-3 w-3 ${config.color} ${config.animate}`} />}
      <span className={`text-xs font-medium ${config.color}`}>
        {message || status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    </div>
  );
}

/**
 * Data fetching indicator with progress
 */
export function DataFetchingIndicator({
  operation,
  progress,
  details
}: {
  operation: string;
  progress?: number;
  details?: string;
}) {
  return (
    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
      <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-blue-800">{operation}</p>
        {details && (
          <p className="text-xs text-blue-600 truncate">{details}</p>
        )}
        {progress !== undefined && (
          <div className="mt-1 w-full bg-blue-200 rounded-full h-1">
            <div
              className="bg-blue-600 h-1 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Enhanced error state component
 */
export function ErrorState({
  title = "Something went wrong",
  message,
  errorId,
  canRetry = true,
  onRetry,
  suggestions = []
}: {
  title?: string;
  message?: string;
  errorId?: string;
  canRetry?: boolean;
  onRetry?: () => void;
  suggestions?: string[];
}) {
  return (
    <div className="p-6 text-center">
      <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>

      {message && (
        <p className="text-sm text-gray-600 mb-4">{message}</p>
      )}

      {errorId && (
        <div className="mb-4">
          <Badge variant="outline" className="text-xs font-mono">
            Error ID: {errorId}
          </Badge>
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="text-left bg-gray-50 p-4 rounded-lg mb-4">
          <p className="text-xs font-medium text-gray-700 mb-2">Troubleshooting steps:</p>
          <ul className="text-xs text-gray-600 space-y-1">
            {suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-gray-400">•</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {canRetry && onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </button>
      )}
    </div>
  );
}

/**
 * OPAL Status indicator with detailed states
 */
export function OPALStatusIndicator({
  status,
  progress,
  workflowId,
  showProgress = true,
  showWorkflowId = false
}: {
  status: 'initiated' | 'in_progress' | 'completed' | 'failed' | 'cancelled' | null;
  progress?: number;
  workflowId?: string;
  showProgress?: boolean;
  showWorkflowId?: boolean;
}) {
  const getStatusConfig = () => {
    switch (status) {
      case 'initiated':
        return {
          icon: Zap,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          label: 'Initiated',
          animate: ''
        };
      case 'in_progress':
        return {
          icon: RefreshCw,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          label: 'In Progress',
          animate: 'animate-spin'
        };
      case 'completed':
        return {
          icon: Activity,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          label: 'Completed',
          animate: ''
        };
      case 'failed':
        return {
          icon: AlertTriangle,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          label: 'Failed',
          animate: ''
        };
      case 'cancelled':
        return {
          icon: WifiOff,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          label: 'Cancelled',
          animate: ''
        };
      default:
        return {
          icon: Database,
          color: 'text-gray-400',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          label: 'Unknown',
          animate: ''
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className={`inline-flex flex-col gap-2 p-3 rounded-lg ${config.bgColor} ${config.borderColor} border`}>
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${config.color} ${config.animate}`} />
        <span className={`text-sm font-medium ${config.color}`}>{config.label}</span>
      </div>

      {showProgress && progress !== undefined && status === 'in_progress' && (
        <div className="w-full">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`${config.color.replace('text-', 'bg-')} h-2 rounded-full transition-all duration-300`}
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        </div>
      )}

      {showWorkflowId && workflowId && (
        <Badge variant="outline" className="text-xs font-mono w-fit">
          {workflowId.substring(0, 12)}...
        </Badge>
      )}
    </div>
  );
}