/**
 * Status Badge Component
 * Safe implementation for dynamic status colors that won't be purged by Tailwind
 */

import React from 'react';
import { cn } from '@/lib/utils';

export type AgentStatus = 'healthy' | 'degraded' | 'error' | 'loading' | 'unknown' | 'pending' | 'success' | 'warning';

export interface StatusBadgeProps {
  status: AgentStatus;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'filled' | 'outline' | 'soft';
  showIcon?: boolean;
  className?: string;
  children?: React.ReactNode;
}

// Safe status color mappings that Tailwind can detect
const getStatusClasses = (status: AgentStatus, variant: 'filled' | 'outline' | 'soft' = 'filled') => {
  const baseClasses = 'inline-flex items-center font-medium rounded-full transition-colors duration-200';

  switch (variant) {
    case 'filled':
      switch (status) {
        case 'healthy':
        case 'success':
          return `${baseClasses} bg-green-100 text-green-800 border border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800`;
        case 'degraded':
        case 'warning':
          return `${baseClasses} bg-orange-100 text-orange-800 border border-orange-200 dark:bg-orange-950 dark:text-orange-400 dark:border-orange-800`;
        case 'error':
          return `${baseClasses} bg-red-100 text-red-800 border border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800`;
        case 'loading':
          return `${baseClasses} bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800`;
        case 'pending':
          return `${baseClasses} bg-yellow-100 text-yellow-800 border border-yellow-200 dark:bg-yellow-950 dark:text-yellow-400 dark:border-yellow-800`;
        case 'unknown':
        default:
          return `${baseClasses} bg-gray-100 text-gray-800 border border-gray-200 dark:bg-gray-950 dark:text-gray-400 dark:border-gray-800`;
      }

    case 'outline':
      switch (status) {
        case 'healthy':
        case 'success':
          return `${baseClasses} bg-transparent text-green-700 border-2 border-green-300 hover:bg-green-50 dark:text-green-400 dark:border-green-600 dark:hover:bg-green-950`;
        case 'degraded':
        case 'warning':
          return `${baseClasses} bg-transparent text-orange-700 border-2 border-orange-300 hover:bg-orange-50 dark:text-orange-400 dark:border-orange-600 dark:hover:bg-orange-950`;
        case 'error':
          return `${baseClasses} bg-transparent text-red-700 border-2 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-600 dark:hover:bg-red-950`;
        case 'loading':
          return `${baseClasses} bg-transparent text-blue-700 border-2 border-blue-300 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-600 dark:hover:bg-blue-950`;
        case 'pending':
          return `${baseClasses} bg-transparent text-yellow-700 border-2 border-yellow-300 hover:bg-yellow-50 dark:text-yellow-400 dark:border-yellow-600 dark:hover:bg-yellow-950`;
        case 'unknown':
        default:
          return `${baseClasses} bg-transparent text-gray-700 border-2 border-gray-300 hover:bg-gray-50 dark:text-gray-400 dark:border-gray-600 dark:hover:bg-gray-950`;
      }

    case 'soft':
      switch (status) {
        case 'healthy':
        case 'success':
          return `${baseClasses} bg-green-50 text-green-700 border border-green-100 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800/50`;
        case 'degraded':
        case 'warning':
          return `${baseClasses} bg-orange-50 text-orange-700 border border-orange-100 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800/50`;
        case 'error':
          return `${baseClasses} bg-red-50 text-red-700 border border-red-100 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800/50`;
        case 'loading':
          return `${baseClasses} bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800/50`;
        case 'pending':
          return `${baseClasses} bg-yellow-50 text-yellow-700 border border-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800/50`;
        case 'unknown':
        default:
          return `${baseClasses} bg-gray-50 text-gray-700 border border-gray-100 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-800/50`;
      }
  }
};

const getSizeClasses = (size: 'sm' | 'md' | 'lg') => {
  switch (size) {
    case 'sm':
      return 'px-2 py-0.5 text-xs gap-1';
    case 'lg':
      return 'px-4 py-2 text-base gap-2';
    case 'md':
    default:
      return 'px-3 py-1 text-sm gap-1.5';
  }
};

const getStatusIcon = (status: AgentStatus) => {
  switch (status) {
    case 'healthy':
    case 'success':
      return '✅';
    case 'degraded':
    case 'warning':
      return '⚠️';
    case 'error':
      return '❌';
    case 'loading':
      return '⏳';
    case 'pending':
      return '⏸️';
    case 'unknown':
    default:
      return '❓';
  }
};

export function StatusBadge({
  status,
  size = 'md',
  variant = 'filled',
  showIcon = true,
  className,
  children
}: StatusBadgeProps) {
  const statusClasses = getStatusClasses(status, variant);
  const sizeClasses = getSizeClasses(size);

  return (
    <span className={cn(statusClasses, sizeClasses, className)}>
      {showIcon && (
        <span className="flex-shrink-0" role="img" aria-label={`${status} status`}>
          {status === 'loading' ? (
            <div className="animate-spin w-3 h-3 border border-current border-t-transparent rounded-full" />
          ) : (
            getStatusIcon(status)
          )}
        </span>
      )}
      <span className="capitalize">
        {children || status}
      </span>
    </span>
  );
}

/**
 * Legacy support - direct replacement for your original code
 */
export function AgentStatusBadge({
  agentStatus,
  className
}: {
  agentStatus: string;
  className?: string;
}) {
  // Map legacy status values to new typed values
  const mappedStatus: AgentStatus = (() => {
    switch (agentStatus.toLowerCase()) {
      case 'healthy':
        return 'healthy';
      case 'degraded':
        return 'degraded';
      case 'error':
      case 'failed':
        return 'error';
      case 'loading':
        return 'loading';
      case 'pending':
        return 'pending';
      case 'success':
      case 'completed':
        return 'success';
      case 'warning':
        return 'warning';
      default:
        return 'unknown';
    }
  })();

  return (
    <StatusBadge
      status={mappedStatus}
      className={className}
      showIcon={true}
    />
  );
}

/**
 * Utility function for getting status colors (for other use cases)
 */
export const getStatusColor = (status: AgentStatus) => {
  switch (status) {
    case 'healthy':
    case 'success':
      return 'green';
    case 'degraded':
    case 'warning':
      return 'orange';
    case 'error':
      return 'red';
    case 'loading':
      return 'blue';
    case 'pending':
      return 'yellow';
    case 'unknown':
    default:
      return 'gray';
  }
};