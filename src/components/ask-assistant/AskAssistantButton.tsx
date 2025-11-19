/**
 * Ask Assistant Button Component
 *
 * Button component that triggers the Ask Assistant modal for Results pages.
 * Automatically detects section availability and shows appropriate states.
 */

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AskAssistantModal } from './AskAssistantModal';
import { useAskAssistant } from '@/lib/askAssistant/context';
import { getAskAssistantConfig } from '@/lib/askAssistant/config';
import { MessageSquare } from 'lucide-react';

export interface AskAssistantButtonProps {
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
}

export function AskAssistantButton({
  className = '',
  variant = 'outline',
  size = 'default'
}: AskAssistantButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Safely get context with error handling
  let contextValue;
  try {
    contextValue = useAskAssistant();
  } catch (error) {
    console.warn('[AskAssistantButton] Context not available:', error);
    // Provide fallback values when context is not available
    // Use getAskAssistantConfig to ensure we always have a valid config (returns FALLBACK_CONFIG)
    contextValue = {
      sectionKey: null,
      promptConfig: getAskAssistantConfig(null),
      sourcePath: '',
      isAvailable: true  // Should be true since fallback config is available
    };
  }

  const { sectionKey, promptConfig, sourcePath, isAvailable: contextIsAvailable } = contextValue;

  // PERMANENT RULE: Ask Assistant button is never disabled
  // User request: "create a permanent rule that the Ask Assistant button is never disabled"
  const isFullyAvailable = true; // Always available - button should never be disabled

  // Debug logging for development
  if (process.env.NODE_ENV === 'development') {
    console.log('[AskAssistantButton]', {
      sectionKey,
      promptConfigExists: !!promptConfig,
      contextIsAvailable,
      isFullyAvailable,
      promptConfigLabel: promptConfig?.label,
      sourcePath
    });
  }


  const handleClick = () => {
    // PERMANENT RULE: Always open modal, with fallback handling for missing config
    // The modal and config system will handle fallback scenarios appropriately
    setIsModalOpen(true);
  };

  const buttonContent = (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      className={className}
    >
      <MessageSquare className="h-4 w-4 mr-2" />
      Ask Assistant
    </Button>
  );

  // PERMANENT RULE: Always render the button without tooltip, never disabled
  return (
    <>
      {buttonContent}

      {/* Ask Assistant Modal - Always render when modal is open, with fallback handling */}
      {isModalOpen && (
        <AskAssistantModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          sectionKey={sectionKey || 'fallback'}
          promptConfig={promptConfig}
          sourcePath={sourcePath}
        />
      )}
    </>
  );
}