'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface ServiceIssue {
  service: string;
  issue: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: Date;
  resolved?: boolean;
}

interface ServiceStatusContextType {
  issues: ServiceIssue[];
  addIssue: (issue: Omit<ServiceIssue, 'timestamp'>) => void;
  resolveIssue: (service: string) => void;
  clearIssues: () => void;
}

const ServiceStatusContext = createContext<ServiceStatusContextType | undefined>(undefined);

interface ServiceStatusProviderProps {
  children: ReactNode;
}

export function ServiceStatusProvider({ children }: ServiceStatusProviderProps) {
  // CRITICAL: React hook safety during Next.js static generation
  // During static generation, React can be null, so check before using hooks
  if (typeof window === 'undefined') {
    // Return children directly during static generation to prevent build failures
    return <>{children}</>;
  }

  const [issues, setIssues] = useState<ServiceIssue[]>([]);

  const addIssue = (issue: Omit<ServiceIssue, 'timestamp'>) => {
    setIssues(prev => {
      // Check if issue already exists for this service
      const existingIndex = prev.findIndex(i => i.service === issue.service && !i.resolved);
      if (existingIndex !== -1) {
        // Update existing issue
        const updated = [...prev];
        updated[existingIndex] = { ...issue, timestamp: new Date() };
        return updated;
      } else {
        // Add new issue
        return [...prev, { ...issue, timestamp: new Date() }];
      }
    });
  };

  const resolveIssue = (service: string) => {
    setIssues(prev =>
      prev.map(issue =>
        issue.service === service ? { ...issue, resolved: true } : issue
      )
    );
  };

  const clearIssues = () => {
    setIssues([]);
  };

  return (
    <ServiceStatusContext.Provider value={{ issues, addIssue, resolveIssue, clearIssues }}>
      {children}
    </ServiceStatusContext.Provider>
  );
}

export function useServiceStatus() {
  // During static generation, React can be null, so check before using hooks
  if (typeof window === 'undefined') {
    return {
      issues: [],
      addIssue: () => {},
      resolveIssue: () => {},
      clearIssues: () => {}
    };
  }

  // Check if React context system is available (React can be null during static generation)
  try {
    const context = useContext(ServiceStatusContext);
    if (context === undefined) {
      throw new Error('useServiceStatus must be used within a ServiceStatusProvider');
    }
    return context;
  } catch (error) {
    // Fallback if React context is not available during static generation
    console.warn('ServiceStatus hook failed during static generation:', error);
    return {
      issues: [],
      addIssue: () => {},
      resolveIssue: () => {},
      clearIssues: () => {}
    };
  }
}

// Higher order component to wrap API calls with error handling
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  serviceName: string
): T {
  return ((...args: Parameters<T>) => {
    return fn(...args).catch((error: Error) => {
      // Log error to console for debugging (can be removed in production)
      console.warn(`Service ${serviceName} encountered an error:`, error.message);

      // Add issue to service status instead of throwing
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('serviceError', {
          detail: {
            service: serviceName,
            issue: error.message || 'Service temporarily unavailable',
            severity: 'medium' as const
          }
        });
        window.dispatchEvent(event);
      }

      // Return fallback data instead of throwing
      return {
        status: 'error',
        service_available: false,
        error: error.message,
        data: null
      };
    });
  }) as T;
}

// Custom hook to add service error listener
export function useServiceErrorListener() {
  // During static generation, React can be null, so check before using hooks
  if (typeof window === 'undefined') {
    return; // No-op during static generation
  }

  try {
    const { addIssue } = useServiceStatus();

    React.useEffect(() => {
      const handleServiceError = (event: CustomEvent) => {
        addIssue(event.detail);
      };

      window.addEventListener('serviceError', handleServiceError as EventListener);
      return () => {
        window.removeEventListener('serviceError', handleServiceError as EventListener);
      };
    }, [addIssue]);
  } catch (error) {
    // Gracefully handle any context errors during static generation
    console.warn('ServiceErrorListener hook failed during static generation:', error);
    return; // No-op if context is not available
  }
}