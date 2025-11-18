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
  const { sectionKey, promptConfig, sourcePath } = useAskAssistant();
  const { isAvailable, unavailableReason } = useAskAssistantAvailability();

  const handleClick = () => {
    if (isAvailable && promptConfig) {
      setIsModalOpen(true);
    }
  };

  const buttonContent = (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={!isAvailable}
      className={`${className} ${!isAvailable ? 'opacity-60' : ''}`}
    >
      <MessageSquare className="h-4 w-4 mr-2" />
      Ask Assistant
    </Button>
  );

  // If not available, wrap in tooltip to explain why
  if (!isAvailable) {
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