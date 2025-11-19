'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Activity, Square, Play, Settings } from 'lucide-react';

interface PollingToggleProps {
  className?: string;
  onToggle?: (enabled: boolean) => void;
  defaultEnabled?: boolean;
}

export function PollingToggle({
  className = '',
  onToggle,
  defaultEnabled = false
}: PollingToggleProps) {
  const [isPollingEnabled, setIsPollingEnabled] = useState(defaultEnabled);
  const [isInitializing, setIsInitializing] = useState(true);

  // Initialize from localStorage on client side
  useEffect(() => {
    const savedState = localStorage.getItem('opal-polling-enabled');
    if (savedState !== null) {
      const enabled = savedState === 'true';
      setIsPollingEnabled(enabled);
    }
    setIsInitializing(false);
  }, []);

  // Save to localStorage when state changes
  useEffect(() => {
    if (!isInitializing) {
      localStorage.setItem('opal-polling-enabled', isPollingEnabled.toString());
      onToggle?.(isPollingEnabled);
      console.log(`🔄 [Polling Toggle] Polling ${isPollingEnabled ? 'ENABLED' : 'DISABLED'}`);
    }
  }, [isPollingEnabled, isInitializing, onToggle]);

  const handleToggle = () => {
    setIsPollingEnabled(!isPollingEnabled);
  };

  if (isInitializing) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Settings className="h-4 w-4 animate-spin text-gray-400" />
        <span className="text-sm text-gray-500">Loading...</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Button
        variant={isPollingEnabled ? "default" : "outline"}
        size="sm"
        onClick={handleToggle}
        className="flex items-center gap-2"
      >
        {isPollingEnabled ? (
          <>
            <Activity className="h-4 w-4" />
            <span>Polling ON</span>
          </>
        ) : (
          <>
            <Square className="h-4 w-4" />
            <span>Polling OFF</span>
          </>
        )}
      </Button>

    </div>
  );
}

// Context provider for global polling state
interface PollingContextType {
  isPollingEnabled: boolean;
  setPollingEnabled: (enabled: boolean) => void;
}

const PollingContext = React.createContext<PollingContextType>({
  isPollingEnabled: false,
  setPollingEnabled: () => {}
});

export function PollingProvider({ children }: { children: React.ReactNode }) {
  const [isPollingEnabled, setIsPollingEnabled] = useState(false);

  return (
    <PollingContext.Provider value={{
      isPollingEnabled,
      setPollingEnabled: setIsPollingEnabled
    }}>
      {children}
    </PollingContext.Provider>
  );
}

export const usePollingContext = () => {
  // During static generation, React can be null, so check before using hooks
  if (typeof window === 'undefined' && (!React || !React.useContext)) {
    return {
      isPollingEnabled: false,
      setPollingEnabled: () => {}
    };
  }

  const context = React.useContext(PollingContext);
  if (!context) {
    throw new Error('usePollingContext must be used within PollingProvider');
  }
  return context;
};