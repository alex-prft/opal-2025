'use client';

/**
 * Guardrails Context Provider
 * 
 * Initializes and manages the Supabase guardrails system throughout the application.
 * Provides health monitoring, audit logging, and data governance functionality.
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  initializeGuardrails, 
  checkGuardrailsHealth,
  auditSystem,
  type AuditEvent 
} from '@/lib/database';

interface GuardrailsHealth {
  status: 'healthy' | 'degraded' | 'critical';
  lastCheck: Date;
  checks: Array<{
    name: string;
    status: 'pass' | 'fail' | 'warning';
    message: string;
  }>;
}

interface GuardrailsContextType {
  isInitialized: boolean;
  health: GuardrailsHealth | null;
  isLoading: boolean;
  error: string | null;
  
  // Functions
  refreshHealth: () => Promise<void>;
  logEvent: (event: Omit<AuditEvent, 'id' | 'created_at'>) => Promise<void>;
}

// CRITICAL: Lazy initialization to prevent createContext during static generation
// Do NOT call createContext at module load time - only when actually needed
let GuardrailsContext: React.Context<GuardrailsContextType | undefined> | null = null;
function getGuardrailsContext() {
  if (!GuardrailsContext) {
    GuardrailsContext = createContext<GuardrailsContextType | undefined>(undefined);
  }
  return GuardrailsContext;
}

export function useGuardrails() {
  // During static generation, React can be null, so check before using any hooks
  if (typeof window === 'undefined') {
    return {
      isInitialized: false,
      health: null,
      isLoading: false,
      error: 'Guardrails unavailable during static generation',
      refreshHealth: async () => {},
      logEvent: async () => {}
    } as GuardrailsContextType;
  }

  // Check if React context system is available (React can be null during static generation)
  try {
    const Context = getGuardrailsContext();
    const context = useContext(Context);
    if (context === undefined) {
      throw new Error('useGuardrails must be used within a GuardrailsProvider');
    }
    return context;
  } catch (error) {
    // During static generation or when React context isn't available,
    // return a fallback object to prevent runtime errors
    if (typeof window === 'undefined') {
      return {
        isInitialized: false,
        health: null,
        isLoading: false,
        error: 'Guardrails unavailable during static generation',
        refreshHealth: async () => {},
        logEvent: async () => {}
      } as GuardrailsContextType;
    }
    // Re-throw the error if we're in a browser environment
    throw error;
  }
}

interface GuardrailsProviderProps {
  children: ReactNode;
}

export function GuardrailsProvider({ children }: GuardrailsProviderProps) {
  // CRITICAL: React hook safety during Next.js 16 static generation
  // During global-error prerendering, React can be null even on server side
  // Check React availability BEFORE any hook usage
  if (typeof window === 'undefined' && (!React || !(React as any).useState)) {
    // React is not initialized - return children directly during static generation
    return <>{children}</>;
  }

  const [isInitialized, setIsInitialized] = useState(false);
  const [health, setHealth] = useState<GuardrailsHealth | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize guardrails system
  useEffect(() => {
    async function initialize() {
      try {
        setIsLoading(true);
        
        // Check if guardrails are enabled
        const enabled = process.env.NEXT_PUBLIC_SUPABASE_GUARDRAILS_ENABLED !== 'false';
        
        if (!enabled) {
          console.log('Supabase guardrails disabled via environment variable');
          setIsInitialized(false);
          setIsLoading(false);
          return;
        }

        console.log('Initializing OSA Supabase Guardrails...');
        
        // Initialize the guardrails system
        await initializeGuardrails();
        
        console.log('✅ Guardrails initialized successfully');
        
        // Perform initial health check
        await performHealthCheck();
        
        setIsInitialized(true);
        setError(null);
        
      } catch (err) {
        console.error('❌ Failed to initialize guardrails:', err);
        setError(err instanceof Error ? err.message : 'Unknown initialization error');
        setIsInitialized(false);
        
        // Log initialization failure
        try {
          await auditSystem.logEvent({
            event_type: 'SYSTEM_EVENT',
            details: {
              event: 'guardrails_initialization_failed',
              error: err instanceof Error ? err.message : 'Unknown error',
              timestamp: new Date().toISOString()
            },
            severity: 'critical',
            status: 'failure'
          });
        } catch (auditError) {
          console.error('Failed to log initialization error:', auditError);
        }
      } finally {
        setIsLoading(false);
      }
    }

    initialize();
  }, []);

  // Periodic health checks
  useEffect(() => {
    if (!isInitialized) return;

    const healthCheckInterval = setInterval(async () => {
      await performHealthCheck();
    }, 5 * 60 * 1000); // Check every 5 minutes

    return () => clearInterval(healthCheckInterval);
  }, [isInitialized]);

  const performHealthCheck = async (): Promise<void> => {
    try {
      const healthResult = await checkGuardrailsHealth();
      
      setHealth({
        status: healthResult.status,
        lastCheck: new Date(),
        checks: healthResult.checks
      });

      // Log health check if status is not healthy
      if (healthResult.status !== 'healthy') {
        await auditSystem.logEvent({
          event_type: 'SYSTEM_EVENT',
          details: {
            event: 'health_check_warning',
            status: healthResult.status,
            failed_checks: healthResult.checks.filter(c => c.status === 'fail').length,
            warning_checks: healthResult.checks.filter(c => c.status === 'warning').length
          },
          severity: healthResult.status === 'critical' ? 'critical' : 'medium',
          status: healthResult.status === 'critical' ? 'failure' : 'warning'
        });
      }

    } catch (err) {
      console.error('Health check failed:', err);
      
      setHealth({
        status: 'critical',
        lastCheck: new Date(),
        checks: [{
          name: 'Health Check System',
          status: 'fail',
          message: err instanceof Error ? err.message : 'Health check system error'
        }]
      });
    }
  };

  const refreshHealth = async (): Promise<void> => {
    await performHealthCheck();
  };

  const logEvent = async (event: Omit<AuditEvent, 'id' | 'created_at'>): Promise<void> => {
    if (!isInitialized) {
      console.warn('Guardrails not initialized, skipping audit log');
      return;
    }

    try {
      await auditSystem.logEvent(event);
    } catch (err) {
      console.error('Failed to log audit event:', err);
    }
  };

  const contextValue: GuardrailsContextType = {
    isInitialized,
    health,
    isLoading,
    error,
    refreshHealth,
    logEvent
  };

  const Context = getGuardrailsContext();
  return (
    <Context.Provider value={contextValue}>
      {children}
    </Context.Provider>
  );
}

/**
 * Development panel for monitoring guardrails status
 */
function GuardrailsDevPanel({
  health,
  isInitialized,
  error
}: {
  health: GuardrailsHealth | null;
  isInitialized: boolean;
  error: string | null;
}) {
  // CRITICAL: React hook safety during Next.js static generation
  // During static generation, React can be null, so check before using hooks
  if (typeof window === 'undefined') {
    // Return null during static generation to prevent build failures
    return null;
  }

  const [isCollapsed, setIsCollapsed] = useState(true);

  if (!health && !error) return null;

  const statusColor = error ? 'red' : 
                      !isInitialized ? 'gray' :
                      health?.status === 'healthy' ? 'green' :
                      health?.status === 'degraded' ? 'yellow' : 'red';

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        backgroundColor: 'rgba(0,0,0,0.9)',
        color: 'white',
        padding: '10px',
        borderRadius: '8px',
        fontSize: '12px',
        fontFamily: 'monospace',
        zIndex: 9999,
        border: `2px solid ${statusColor}`,
        minWidth: '200px',
        maxWidth: '400px'
      }}
    >
      <div
        style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <span>🛡️ Guardrails: {error ? 'ERROR' : !isInitialized ? 'DISABLED' : health?.status?.toUpperCase()}</span>
        <span>{isCollapsed ? '▶' : '▼'}</span>
      </div>
      
      {!isCollapsed && (
        <div style={{ marginTop: '10px', fontSize: '11px' }}>
          {error && (
            <div style={{ color: 'red', marginBottom: '5px' }}>
              Error: {error}
            </div>
          )}
          
          {health && (
            <>
              <div>Last Check: {health.lastCheck.toLocaleTimeString()}</div>
              <div style={{ marginTop: '5px' }}>
                {health.checks.map((check, i) => (
                  <div key={i} style={{
                    color: check.status === 'pass' ? 'lightgreen' :
                           check.status === 'warning' ? 'yellow' : 'red'
                  }}>
                    {check.status === 'pass' ? '✅' : 
                     check.status === 'warning' ? '⚠️' : '❌'} {check.name}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}