/**
 * Ask Assistant Button Component
 *
 * Button component that triggers the Ask Assistant modal for Results pages.
 * Automatically detects section availability and shows appropriate states.
 */

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AskAssistantModal } from './AskAssistantModal';
import { useAskAssistant, useAskAssistantAvailability } from '@/lib/askAssistant/context';
import { MessageSquare, HelpCircle } from 'lucide-react';

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
    contextValue = {
      sectionKey: null,
      promptConfig: null,
      sourcePath: '',
      isAvailable: false
    };
  }

  const { sectionKey, promptConfig, sourcePath, isAvailable: contextIsAvailable } = contextValue;

  // Always available now - fallback configuration ensures button is always functional
  const isFullyAvailable = contextIsAvailable && promptConfig !== null && promptConfig !== undefined;

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

  const { unavailableReason } = useAskAssistantAvailability();

  const handleClick = () => {
    if (isFullyAvailable && promptConfig) {
      setIsModalOpen(true);
    }
  };

  const buttonContent = (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={!isFullyAvailable}
      className={`${className} ${!isFullyAvailable ? 'opacity-60' : ''}`}
    >
      <MessageSquare className="h-4 w-4 mr-2" />
      Ask Assistant
    </Button>
  );

  // If not available, wrap in tooltip to explain why
  if (!isFullyAvailable) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {buttonContent}
          </TooltipTrigger>
          <TooltipContent>
            <div className="flex items-center">
              <HelpCircle className="h-3 w-3 mr-1" />
              {unavailableReason || 'Ask Assistant not available for this section yet'}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <>
      {buttonContent}

      {/* Ask Assistant Modal */}
      {isModalOpen && promptConfig && sectionKey && (
        <AskAssistantModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          sectionKey={sectionKey}
          promptConfig={promptConfig}
          sourcePath={sourcePath}
        />
      )}
    </>
  );
}