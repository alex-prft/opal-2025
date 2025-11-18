/**
 * Ask Assistant Context
 *
 * Provides context for the current Results section key to enable Ask Assistant
 * functionality across all Results pages.
 */

'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { ResultsSectionKey, AskAssistantPromptConfig, getAskAssistantConfig } from './config';

interface AskAssistantContextValue {
  sectionKey: ResultsSectionKey | null;
  promptConfig: AskAssistantPromptConfig | null;
  sourcePath: string;
  isAvailable: boolean;
}

const AskAssistantContext = createContext<AskAssistantContextValue>({
  sectionKey: null,
  promptConfig: null,
  sourcePath: '',
  isAvailable: false
});

export interface AskAssistantProviderProps {
  children: ReactNode;
  sectionKey: ResultsSectionKey;
  sourcePath?: string;
}

export function AskAssistantProvider({
  children,
  sectionKey,
  sourcePath = ''
}: AskAssistantProviderProps) {
  const promptConfig = getAskAssistantConfig(sectionKey);
  const isAvailable = promptConfig !== undefined && !promptConfig.expertPromptExample.startsWith('TODO:');

  const value: AskAssistantContextValue = {
    sectionKey,
    promptConfig,
    sourcePath,
    isAvailable
  };

  return (
    <AskAssistantContext.Provider value={value}>
      {children}
    </AskAssistantContext.Provider>
  );
}

/**
 * Hook to access Ask Assistant context in components
 */
export function useAskAssistant(): AskAssistantContextValue {
  const context = useContext(AskAssistantContext);

  if (!context) {
    throw new Error('useAskAssistant must be used within an AskAssistantProvider');
  }

  return context;
}

/**
 * Hook to check if Ask Assistant is available for the current section
 */
export function useAskAssistantAvailability() {
  const { isAvailable, sectionKey, promptConfig } = useAskAssistant();

  return {
    isAvailable,
    sectionKey,
    promptConfig,
    unavailableReason: !isAvailable
      ? (promptConfig ? 'Configuration not complete yet' : 'No configuration found')
      : null
  };
}