'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Shield, ShieldOff, Settings } from 'lucide-react';

interface SOPToggleProps {
  className?: string;
  onToggle?: (enabled: boolean) => void;
  defaultEnabled?: boolean;
}

export function SOPToggle({
  className = '',
  onToggle,
  defaultEnabled = true // SOP should be enabled by default for compliance
}: SOPToggleProps) {
  const [isSOPEnabled, setIsSOPEnabled] = useState(defaultEnabled);
  const [isInitializing, setIsInitializing] = useState(true);

  // Initialize from localStorage on client side
  useEffect(() => {
    const savedState = localStorage.getItem('opal-sop-enabled');
    if (savedState !== null) {
      const enabled = savedState === 'true';
      setIsSOPEnabled(enabled);
    }
    setIsInitializing(false);
  }, []);

  // Save to localStorage when state changes
  useEffect(() => {
    if (!isInitializing) {
      localStorage.setItem('opal-sop-enabled', isSOPEnabled.toString());
      onToggle?.(isSOPEnabled);
      console.log(`🛡️ [SOP Toggle] SOP Middleware ${isSOPEnabled ? 'ENABLED' : 'DISABLED'}`);

      // Set global SOP flag for middleware to check
      if (typeof window !== 'undefined') {
        (window as any).__OPAL_SOP_ENABLED = isSOPEnabled;
      }
    }
  }, [isSOPEnabled, isInitializing, onToggle]);

  const handleToggle = () => {
    setIsSOPEnabled(!isSOPEnabled);
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
        variant={isSOPEnabled ? "default" : "outline"}
        size="sm"
        onClick={handleToggle}
        className="flex items-center gap-2"
      >
        {isSOPEnabled ? (
          <>
            <Shield className="h-4 w-4" />
            <span>SOP ON</span>
          </>
        ) : (
          <>
            <ShieldOff className="h-4 w-4" />
            <span>SOP OFF</span>
          </>
        )}
      </Button>

    </div>
  );
}

// Context provider for global SOP state
interface SOPContextType {
  isSOPEnabled: boolean;
  setSOPEnabled: (enabled: boolean) => void;
}

const SOPContext = React.createContext<SOPContextType>({
  isSOPEnabled: true,
  setSOPEnabled: () => {}
});

export function SOPProvider({ children }: { children: React.ReactNode }) {
  const [isSOPEnabled, setIsSOPEnabled] = useState(true);

  // Update global flag when context changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__OPAL_SOP_ENABLED = isSOPEnabled;
    }
  }, [isSOPEnabled]);

  return (
    <SOPContext.Provider value={{
      isSOPEnabled,
      setSOPEnabled: setIsSOPEnabled
    }}>
      {children}
    </SOPContext.Provider>
  );
}

export const useSOPContext = () => {
  const context = React.useContext(SOPContext);
  if (!context) {
    throw new Error('useSOPContext must be used within SOPProvider');
  }
  return context;
};

// Helper function to check if SOP is enabled
export const isSOPEnabled = (): boolean => {
  if (typeof window === 'undefined') {
    return true; // Default to enabled on server-side
  }
  return (window as any).__OPAL_SOP_ENABLED ?? true;
};