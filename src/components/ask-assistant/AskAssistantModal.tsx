/**
 * Ask Assistant Modal Component
 *
 * Modal interface for Ask Assistant prompts with section-specific configuration,
 * expert examples, recommended prompts, and custom input.
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AskAssistantPromptConfig, ResultsSectionKey } from '@/lib/askAssistant/config';
import { Copy, MessageSquare, Lightbulb, Clock, Send, Info } from 'lucide-react';

export interface AskAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  sectionKey: ResultsSectionKey;
  promptConfig: AskAssistantPromptConfig;
  sourcePath?: string;
}

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
            <MessageSquare className="h-5 w-5 mr-2" />
            Ask Assistant – {promptConfig.label}
          </DialogTitle>
          <DialogDescription>
            {promptConfig.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Expert Example Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Lightbulb className="h-4 w-4 mr-2" />
                Expert Example Prompt
              </CardTitle>
              <CardDescription>
                A comprehensive prompt designed by experts for this section
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-4 rounded-lg max-h-64 overflow-y-auto">
                <pre className="text-sm whitespace-pre-wrap text-gray-700 font-mono">
                  {promptConfig.expertPromptExample}
                </pre>
              </div>
              <div className="flex space-x-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyExpertExample}
                  disabled={copySuccess}
                >
                  <Copy className="h-4 w-4 mr-1" />
                  {copySuccess ? 'Copied!' : 'Copy'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleUseExpertExample}
                >
                  Use This Example
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recommended Prompts Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                Quick Start Prompts
              </CardTitle>
              <CardDescription>
                Click any prompt to add it to your input
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {promptConfig.recommendedPrompts.map((prompt, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    className="h-auto p-3 text-left justify-start"
                    onClick={() => handleSelectRecommendedPrompt(prompt)}
                  >
                    <div className="text-sm text-gray-700">
                      {prompt}
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* User Input Section */}
          <div className="space-y-4">
            <div>
              <label htmlFor="user-prompt" className="block text-sm font-medium mb-2">
                Your Prompt
              </label>
              <Textarea
                id="user-prompt"
                placeholder={
                  promptConfig.placeholder ||
                  "Describe what you want the assistant to help with..."
                }
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                className="min-h-[120px]"
                rows={6}
              />
            </div>

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