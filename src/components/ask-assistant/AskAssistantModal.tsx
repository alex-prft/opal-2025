/**
 * Ask Assistant Modal Component
 *
 * Enhanced modal interface for Ask Assistant prompts with section-specific configuration,
 * expert examples, recommended prompts, and custom input. Features two-column layout,
 * expandable expert prompts, and improved user experience.
 */

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { AskAssistantPromptConfig, ResultsSectionKey } from '@/lib/askAssistant/config';
import { Copy, MessageSquare, Lightbulb, Clock, Send, Info, ChevronDown, ChevronRight, Sparkles } from 'lucide-react';

export interface AskAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  sectionKey: ResultsSectionKey;
  promptConfig: AskAssistantPromptConfig;
  sourcePath?: string;
}

// Sub-component interfaces
interface ExpertPromptBlockProps {
  prompt: string;
  isExpanded: boolean;
  onToggle: () => void;
  onCopy: () => void;
  onUse: () => void;
  copySuccess: boolean;
}

interface RecommendedPromptsBlockProps {
  prompts: string[];
  showAll: boolean;
  onToggleShowAll: () => void;
  onSelectPrompt: (prompt: string) => void;
}

// Enhanced Expert Prompt Block Component
const ExpertPromptBlock: React.FC<ExpertPromptBlockProps> = ({
  prompt,
  isExpanded,
  onToggle,
  onCopy,
  onUse,
  copySuccess
}) => {
  const previewText = prompt.slice(0, 150) + (prompt.length > 150 ? "..." : "");

  return (
    <div className="border rounded-lg p-4 bg-slate-50">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium text-slate-700">Expert Instructions for This Section</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onCopy}
            className="h-6 px-2"
            disabled={copySuccess}
          >
            <Copy className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="h-6 px-2"
          >
            {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </Button>
        </div>
      </div>

      <div className="text-xs text-slate-600 font-mono leading-relaxed">
        {isExpanded ? (
          <pre className="whitespace-pre-wrap max-h-64 overflow-y-auto">{prompt}</pre>
        ) : (
          <div>{previewText}</div>
        )}
      </div>

      <div className="flex space-x-2 mt-3">
        <Button
          variant="outline"
          size="sm"
          onClick={onCopy}
          disabled={copySuccess}
          className="h-7 px-3 text-xs"
        >
          <Copy className="h-3 w-3 mr-1" />
          {copySuccess ? 'Copied!' : 'Copy'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onUse}
          className="h-7 px-3 text-xs"
        >
          Use This Example
        </Button>
        {!isExpanded && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="h-7 px-3 text-xs text-blue-600"
          >
            View full expert prompt
          </Button>
        )}
      </div>
    </div>
  );
};

// Enhanced Recommended Prompts Block Component
const RecommendedPromptsBlock: React.FC<RecommendedPromptsBlockProps> = ({
  prompts,
  showAll,
  onToggleShowAll,
  onSelectPrompt
}) => {
  const displayedPrompts = showAll ? prompts : prompts.slice(0, 4);
  const hasMore = prompts.length > 4;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-amber-600" />
        <span className="text-sm font-medium text-slate-700">Try one of these prompts</span>
      </div>

      <div className="space-y-2">
        {displayedPrompts.map((prompt, index) => (
          <Button
            key={index}
            variant="outline"
            className="w-full text-left text-sm h-auto p-3 justify-start hover:bg-blue-50 hover:border-blue-200"
            onClick={() => onSelectPrompt(prompt)}
          >
            <span className="line-clamp-2">{prompt.slice(0, 100)}{prompt.length > 100 ? "..." : ""}</span>
          </Button>
        ))}
      </div>

      {hasMore && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleShowAll}
          className="text-blue-600 h-6 px-2"
        >
          {showAll ? "Show fewer suggestions" : `View ${prompts.length - 4} more suggestions`}
          <ChevronDown className={`h-3 w-3 ml-1 transition-transform ${showAll ? 'rotate-180' : ''}`} />
        </Button>
      )}

      {showAll && hasMore && (
        <div className="border-t pt-3">
          <div className="space-y-1">
            {prompts.slice(4).map((prompt, index) => (
              <button
                key={index + 4}
                onClick={() => onSelectPrompt(prompt)}
                className="text-left text-sm text-blue-600 hover:text-blue-800 hover:underline block w-full py-1"
              >
                {prompt.slice(0, 80)}{prompt.length > 80 ? "..." : ""}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export function AskAssistantModal({
  isOpen,
  onClose,
  sectionKey,
  promptConfig,
  sourcePath = ''
}: AskAssistantModalProps) {
  const router = useRouter();
  const [userPrompt, setUserPrompt] = useState('');
  const [selectedRecommendedPrompt, setSelectedRecommendedPrompt] = useState<string>('');
  const [usedExpertExample, setUsedExpertExample] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Enhanced UI state
  const [expertPromptExpanded, setExpertPromptExpanded] = useState(false);
  const [showAllRecommended, setShowAllRecommended] = useState(false);
  const [includeContext, setIncludeContext] = useState(true);

  // Reset expanded state when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      setExpertPromptExpanded(false);
      setShowAllRecommended(false);
    }
  }, [isOpen]);

  const handleCopyExpertExample = async () => {
    try {
      await navigator.clipboard.writeText(promptConfig.expertPromptExample);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const handleUseExpertExample = () => {
    setUserPrompt(promptConfig.expertPromptExample);
    setUsedExpertExample(true);
  };

  const handleSelectRecommendedPrompt = (prompt: string) => {
    if (userPrompt.trim()) {
      // Append to existing prompt
      setUserPrompt(prev => prev + '\n\n' + prompt);
    } else {
      // Replace empty prompt
      setUserPrompt(prompt);
    }
    setSelectedRecommendedPrompt(prompt);
  };

  const handleSubmit = async () => {
    if (!userPrompt.trim()) return;

    setIsSubmitting(true);

    try {
      // Generate a client-side UUID for this prompt run
      const promptId = crypto.randomUUID();

      // Create the prompt run record
      const promptRunData = {
        sectionKey,
        sourcePath,
        prompt: userPrompt.trim(),
        sourceConfigId: promptConfig.id,
        usedExpertExample,
        selectedRecommendedPrompt: selectedRecommendedPrompt || undefined
      };

      const response = await fetch('/api/ask-assistant/runs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(promptRunData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      // Redirect to ask-assistant page with the prompt ID
      const queryParams = new URLSearchParams({
        promptId: result.id || promptId,
        sectionKey
      });

      if (sourcePath) {
        queryParams.set('sourcePath', sourcePath);
      }

      router.push(`/engine/results/ask-assistant?${queryParams.toString()}`);
      onClose();

    } catch (error) {
      console.error('Error submitting ask assistant prompt:', error);
      // For now, still redirect even if API fails (graceful degradation)
      const promptId = crypto.randomUUID();
      const queryParams = new URLSearchParams({
        promptId,
        sectionKey,
        prompt: userPrompt.trim()
      });

      if (sourcePath) {
        queryParams.set('sourcePath', sourcePath);
      }

      router.push(`/engine/results/ask-assistant?${queryParams.toString()}`);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = userPrompt.trim().length > 0 && !isSubmitting;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Sparkles className="h-5 w-5 mr-2 text-blue-600" />
            Ask Assistant – {promptConfig.label}
          </DialogTitle>
          <DialogDescription>
            {promptConfig.description}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-5 gap-6 py-4">
          {/* Left Column - Context & Examples */}
          <div className="col-span-2 space-y-4">
            {/* Expert Prompt Block */}
            <ExpertPromptBlock
              prompt={promptConfig.expertPromptExample}
              isExpanded={expertPromptExpanded}
              onToggle={() => setExpertPromptExpanded(!expertPromptExpanded)}
              onCopy={handleCopyExpertExample}
              onUse={handleUseExpertExample}
              copySuccess={copySuccess}
            />

            {/* Recommended Prompts */}
            {promptConfig.recommendedPrompts.length > 0 && (
              <RecommendedPromptsBlock
                prompts={promptConfig.recommendedPrompts}
                showAll={showAllRecommended}
                onToggleShowAll={() => setShowAllRecommended(!showAllRecommended)}
                onSelectPrompt={handleSelectRecommendedPrompt}
              />
            )}
          </div>

          {/* Right Column - User Prompt */}
          <div className="col-span-3 space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-1">Ask the Assistant</h3>
              <p className="text-sm text-slate-600">
                Use a suggested prompt, or describe what you want help with for this section.
              </p>
            </div>

            <Textarea
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              placeholder={
                promptConfig.placeholder ||
                "Example: 'Summarize the top content opportunities on this page and tell me what to create next.'"
              }
              className="min-h-[120px] resize-none"
              rows={5}
            />

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={includeContext}
                  onCheckedChange={setIncludeContext}
                  id="include-context"
                />
                <label htmlFor="include-context" className="text-slate-700">
                  Include page context automatically
                </label>
              </div>
            </div>

            <p className="text-xs text-slate-500">
              When on, the assistant includes this section's data and expert instructions in your request.
            </p>

            {/* Usage indicators */}
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              {usedExpertExample && (
                <Badge variant="outline" className="text-xs">
                  Using expert example
                </Badge>
              )}
              {selectedRecommendedPrompt && (
                <Badge variant="outline" className="text-xs">
                  Added quick start prompt
                </Badge>
              )}
            </div>

            {/* Character count */}
            <div className="text-xs text-gray-400 text-right">
              {userPrompt.length} characters
            </div>

            {/* Context Information */}
            {sourcePath && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Context:</strong> This prompt will be associated with{' '}
                  <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">
                    {sourcePath}
                  </code>
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="min-w-[100px]"
          >
            {isSubmitting ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Sending...
              </div>
            ) : (
              <div className="flex items-center">
                <Send className="h-4 w-4 mr-2" />
                Run Prompt
              </div>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}