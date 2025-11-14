/**
 * Improved Health Display Component
 * Enhanced version of the original health status display with better UX
 */

import React from 'react';
import { SafeDate } from './SafeDate';

export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy' | 'unknown';

export interface ImprovedHealthDisplayProps {
  healthStatus: HealthStatus;
  forceSyncTimestamp?: string | Date | null;
  showIcon?: boolean;
  className?: string;
}

export function ImprovedHealthDisplay({
  healthStatus,
  forceSyncTimestamp,
  showIcon = true,
  className = ''
}: ImprovedHealthDisplayProps) {

  const renderHealthStatus = () => {
    switch (healthStatus) {
      case 'degraded':
        return (
          <div className="flex items-center space-x-2 text-orange-600 dark:text-orange-400">
            {showIcon && <span className="text-lg">⚠️</span>}
            <div className="flex-1">
              <div className="font-medium">Health check unavailable</div>
              <div className="text-sm text-orange-500 dark:text-orange-300">
                Showing cached data where available. Some features may be limited.
              </div>
            </div>
          </div>
        );

      case 'unhealthy':
        return (
          <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
            {showIcon && <span className="text-lg">🔴</span>}
            <div className="flex-1">
              <div className="font-medium">Service unavailable</div>
              <div className="text-sm text-red-500 dark:text-red-300">
                Unable to connect to OPAL services. Please try again later.
              </div>
            </div>
          </div>
        );

      case 'unknown':
        return (
          <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
            {showIcon && <span className="text-lg">❓</span>}
            <div className="flex-1">
              <div className="font-medium">Status unknown</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Health status could not be determined.
              </div>
            </div>
          </div>
        );

      case 'healthy':
      default:
        return (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {showIcon && <span className="text-lg">🟢</span>}
              <span className="text-gray-700 dark:text-gray-300">Last Force Sync:</span>
            </div>
            <span className="font-mono text-gray-900 dark:text-gray-100">
              {forceSyncTimestamp ? (
                <SafeDate date={forceSyncTimestamp} format="relative" />
              ) : (
                <span className="text-gray-400 dark:text-gray-500">Never</span>
              )}
            </span>
          </div>
        );
    }
  };

  return (
    <div className={`p-3 rounded-lg border transition-all duration-200 ${getContainerStyles(healthStatus)} ${className}`}>
      {renderHealthStatus()}
    </div>
  );
}

/**
 * Inline version for use in smaller spaces
 */
export function InlineHealthDisplay({
  healthStatus,
  forceSyncTimestamp,
  className = ''
}: ImprovedHealthDisplayProps) {
  if (healthStatus === 'degraded') {
    return (
      <div className={`inline-flex items-center space-x-2 text-orange-500 ${className}`}>
        <span>⚠️</span>
        <span className="text-sm">Health check unavailable. Showing cached data.</span>
      </div>
    );
  }

  if (healthStatus === 'unhealthy') {
    return (
      <div className={`inline-flex items-center space-x-2 text-red-500 ${className}`}>
        <span>🔴</span>
        <span className="text-sm">Service unavailable</span>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center space-x-2 ${className}`}>
      <span className="text-sm text-gray-600 dark:text-gray-400">Last Force Sync:</span>
      <span className="text-sm font-mono text-gray-900 dark:text-gray-100">
        {forceSyncTimestamp ? (
          <SafeDate date={forceSyncTimestamp} format="relative" />
        ) : (
          <span className="text-gray-400 dark:text-gray-500">Never</span>
        )}
      </span>
    </div>
  );
}

/**
 * Get container styles based on health status
 */
function getContainerStyles(healthStatus: HealthStatus): string {
  switch (healthStatus) {
    case 'healthy':
      return 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800';
    case 'degraded':
      return 'bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800';
    case 'unhealthy':
      return 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800';
    case 'unknown':
    default:
      return 'bg-gray-50 dark:bg-gray-950 border-gray-200 dark:border-gray-800';
  }
}

/**
 * Drop-in replacement for the original component with the same API
 */
export function HealthStatusReplacement({
  healthStatus,
  forceSyncTimestamp
}: {
  healthStatus: HealthStatus;
  forceSyncTimestamp?: string | Date | null;
}) {
  return (
    <>
      {healthStatus === 'degraded' ? (
        <div className="text-orange-500 flex items-center space-x-2">
          <span>⚠️</span>
          <span>Health check unavailable. Showing cached data.</span>
        </div>
      ) : (
        <div className="flex items-center space-x-2">
          <span className="text-gray-600 dark:text-gray-400">Last Force Sync:</span>
          <span className="font-mono">
            {forceSyncTimestamp ? (
              <SafeDate date={forceSyncTimestamp} />
            ) : (
              <span className="text-gray-400 dark:text-gray-500">Never</span>
            )}
          </span>
        </div>
      )}
    </>
  );
}