/**
 * Enhanced Health Status Display Component
 * Displays OPAL health status with better UX and fallback handling
 */

import React from 'react';
import { SafeDate } from '@/components/shared/SafeDate';

export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy' | 'unknown';

export interface HealthStatusDisplayProps {
  healthStatus: HealthStatus;
  forceSyncTimestamp?: string | Date | null;
  lastHealthCheck?: string | Date | null;
  isLoading?: boolean;
  showDetails?: boolean;
  className?: string;
  onRefresh?: () => void;
}

export function HealthStatusDisplay({
  healthStatus,
  forceSyncTimestamp,
  lastHealthCheck,
  isLoading = false,
  showDetails = true,
  className = '',
  onRefresh
}: HealthStatusDisplayProps) {

  const getHealthStatusIcon = (status: HealthStatus) => {
    switch (status) {
      case 'healthy':
        return '🟢';
      case 'degraded':
        return '🟡';
      case 'unhealthy':
        return '🔴';
      case 'unknown':
      default:
        return '⚪';
    }
  };

  const getHealthStatusMessage = (status: HealthStatus) => {
    switch (status) {
      case 'healthy':
        return 'All systems operational';
      case 'degraded':
        return 'Some services may be limited. Showing cached data when available.';
      case 'unhealthy':
        return 'Service unavailable. Please try again later.';
      case 'unknown':
      default:
        return 'Health status unknown';
    }
  };

  const getHealthStatusColor = (status: HealthStatus) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 dark:text-green-400';
      case 'degraded':
        return 'text-orange-500 dark:text-orange-400';
      case 'unhealthy':
        return 'text-red-600 dark:text-red-400';
      case 'unknown':
      default:
        return 'text-gray-500 dark:text-gray-400';
    }
  };

  const getBorderColor = (status: HealthStatus) => {
    switch (status) {
      case 'healthy':
        return 'border-green-200 dark:border-green-800';
      case 'degraded':
        return 'border-orange-200 dark:border-orange-800';
      case 'unhealthy':
        return 'border-red-200 dark:border-red-800';
      case 'unknown':
      default:
        return 'border-gray-200 dark:border-gray-800';
    }
  };

  const getBackgroundColor = (status: HealthStatus) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-50 dark:bg-green-950';
      case 'degraded':
        return 'bg-orange-50 dark:bg-orange-950';
      case 'unhealthy':
        return 'bg-red-50 dark:bg-red-950';
      case 'unknown':
      default:
        return 'bg-gray-50 dark:bg-gray-950';
    }
  };

  if (isLoading) {
    return (
      <div className={`p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 ${className}`}>
        <div className="flex items-center space-x-2">
          <div className="animate-spin w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full" />
          <span className="text-gray-600 dark:text-gray-400">Checking health status...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-lg border transition-colors duration-200 ${getBorderColor(healthStatus)} ${getBackgroundColor(healthStatus)} ${className}`}>
      {/* Main Status Display */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-xl">{getHealthStatusIcon(healthStatus)}</span>
          <div className="flex-1">
            <div className={`font-medium ${getHealthStatusColor(healthStatus)}`}>
              System Health: {healthStatus.charAt(0).toUpperCase() + healthStatus.slice(1)}
            </div>
            <div className={`text-sm mt-1 ${getHealthStatusColor(healthStatus)}`}>
              {getHealthStatusMessage(healthStatus)}
            </div>
          </div>
        </div>

        {/* Refresh Button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="ml-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
            title="Refresh health status"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        )}
      </div>

      {/* Additional Details */}
      {showDetails && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
          {/* Force Sync Information */}
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600 dark:text-gray-400">Last Force Sync:</span>
            <span className={`font-mono ${getHealthStatusColor(healthStatus)}`}>
              {forceSyncTimestamp ? (
                <SafeDate date={forceSyncTimestamp} />
              ) : (
                <span className="text-gray-400 dark:text-gray-500">Never</span>
              )}
            </span>
          </div>

          {/* Health Check Timestamp */}
          {lastHealthCheck && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600 dark:text-gray-400">Last Health Check:</span>
              <span className="font-mono text-gray-500 dark:text-gray-400">
                <SafeDate date={lastHealthCheck} />
              </span>
            </div>
          )}

          {/* Status-specific additional info */}
          {healthStatus === 'degraded' && (
            <div className="mt-3 p-2 bg-orange-100 dark:bg-orange-900 rounded text-sm">
              <div className="font-medium text-orange-800 dark:text-orange-200">Limited Functionality</div>
              <div className="text-orange-700 dark:text-orange-300 mt-1">
                Some real-time features may be unavailable. Cached data is being used where possible.
              </div>
            </div>
          )}

          {healthStatus === 'unhealthy' && (
            <div className="mt-3 p-2 bg-red-100 dark:bg-red-900 rounded text-sm">
              <div className="font-medium text-red-800 dark:text-red-200">Service Disruption</div>
              <div className="text-red-700 dark:text-red-300 mt-1">
                Unable to connect to OPAL services. Please check your connection and try again.
              </div>
            </div>
          )}

          {healthStatus === 'healthy' && forceSyncTimestamp && (
            <div className="mt-3 p-2 bg-green-100 dark:bg-green-900 rounded text-sm">
              <div className="font-medium text-green-800 dark:text-green-200">System Synchronized</div>
              <div className="text-green-700 dark:text-green-300 mt-1">
                All services are operational and data is up to date.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Compact version for smaller spaces
 */
export function CompactHealthStatus({
  healthStatus,
  forceSyncTimestamp,
  className = ''
}: Pick<HealthStatusDisplayProps, 'healthStatus' | 'forceSyncTimestamp' | 'className'>) {
  const getStatusColor = (status: HealthStatus) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 dark:text-green-400';
      case 'degraded':
        return 'text-orange-500 dark:text-orange-400';
      case 'unhealthy':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-500 dark:text-gray-400';
    }
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {healthStatus === 'degraded' ? (
        <div className="flex items-center space-x-2 text-orange-500">
          <span>🟡</span>
          <span className="text-sm">Health check unavailable. Showing cached data.</span>
        </div>
      ) : (
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Last Force Sync:</span>
          <span className={`text-sm font-mono ${getStatusColor(healthStatus)}`}>
            {forceSyncTimestamp ? <SafeDate date={forceSyncTimestamp} /> : 'Never'}
          </span>
        </div>
      )}
    </div>
  );
}