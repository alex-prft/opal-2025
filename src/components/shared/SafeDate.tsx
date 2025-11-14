/**
 * SafeDate Component
 * Safely renders dates with fallback for invalid dates
 */

import React from 'react';

export interface SafeDateProps {
  date: string | Date | null | undefined;
  format?: 'full' | 'short' | 'time' | 'relative';
  fallback?: string;
  className?: string;
}

export function SafeDate({
  date,
  format = 'full',
  fallback = 'Invalid date',
  className = ''
}: SafeDateProps) {

  const formatDate = (dateInput: string | Date, formatType: string): string => {
    try {
      const dateObj = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;

      if (!dateObj || isNaN(dateObj.getTime())) {
        return fallback;
      }

      const now = new Date();
      const diffMs = now.getTime() - dateObj.getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      switch (formatType) {
        case 'relative':
          if (diffMinutes < 1) {
            return 'Just now';
          } else if (diffMinutes < 60) {
            return `${diffMinutes}m ago`;
          } else if (diffHours < 24) {
            return `${diffHours}h ago`;
          } else if (diffDays < 7) {
            return `${diffDays}d ago`;
          } else {
            return dateObj.toLocaleDateString();
          }

        case 'short':
          return dateObj.toLocaleDateString() + ' ' + dateObj.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          });

        case 'time':
          return dateObj.toLocaleTimeString();

        case 'full':
        default:
          return dateObj.toLocaleString();
      }
    } catch (error) {
      console.warn('SafeDate: Error formatting date:', error);
      return fallback;
    }
  };

  if (!date) {
    return <span className={`text-gray-400 dark:text-gray-500 ${className}`}>Never</span>;
  }

  const formattedDate = formatDate(date, format);

  return (
    <span
      className={className}
      title={typeof date === 'string' ? date : date.toISOString()}
    >
      {formattedDate}
    </span>
  );
}

/**
 * Relative time component that updates automatically
 */
export function RelativeTime({
  date,
  updateInterval = 60000, // Update every minute
  className = ''
}: {
  date: string | Date | null | undefined;
  updateInterval?: number;
  className?: string;
}) {
  const [, setTick] = React.useState(0);

  React.useEffect(() => {
    if (!date) return;

    const interval = setInterval(() => {
      setTick(prev => prev + 1);
    }, updateInterval);

    return () => clearInterval(interval);
  }, [date, updateInterval]);

  return (
    <SafeDate
      date={date}
      format="relative"
      className={className}
    />
  );
}