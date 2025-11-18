/**
 * Ask Assistant Current Result Component
 *
 * Displays the current prompt result with response area and refinement options.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { getAskAssistantConfig, ResultsSectionKey, AskAssistantPromptRun } from '@/lib/askAssistant/config';
import {
  MessageSquare,
  RefreshCw,
  Copy,
  Calendar,
  User,
  ExternalLink,
  Lightbulb,
  Loader2,
  AlertCircle
} from 'lucide-react';

export interface AskAssistantCurrentResultProps {
  promptId: string;
  sectionKey: ResultsSectionKey;
  fallbackPrompt?: string | null;
}

export function AskAssistantCurrentResult({
  promptId,
  sectionKey,
  fallbackPrompt
}: AskAssistantCurrentResultProps) {
  const router = useRouter();
  const [promptRun, setPromptRun] = useState<AskAssistantPromptRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refinedPrompt, setRefinedPrompt] = useState('');
  const [isRefining, setIsRefining] = useState(false);

  const sectionConfig = getAskAssistantConfig(sectionKey);

  useEffect(() => {
    fetchPromptRun();
  }, [promptId]);

  const fetchPromptRun = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/ask-assistant/runs/${promptId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch prompt run');
      }

      if (data.success && data.promptRun) {
        setPromptRun(data.promptRun);
        setRefinedPrompt(data.promptRun.prompt);
      } else {
        // Fallback for URL-based prompts
        if (fallbackPrompt && sectionKey) {
          const fallbackRun: AskAssistantPromptRun = {
            id: promptId,
            userId: 'anonymous',
            sectionKey: sectionKey as ResultsSectionKey,
            sourcePath: '',
            prompt: fallbackPrompt,
            sourceConfigId: sectionConfig?.id,
            createdAt: new Date()
          };
          setPromptRun(fallbackRun);
          setRefinedPrompt(fallbackPrompt);
        } else {
          throw new Error('Prompt run not found');
        }
      }
    } catch (err) {
      console.error('Error fetching prompt run:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleRefinePrompt = async () => {
    if (!refinedPrompt.trim() || !promptRun) return;

    setIsRefining(true);

    try {
      // Create a new prompt run with the refined prompt
      const response = await fetch('/api/ask-assistant/runs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sectionKey: promptRun.sectionKey,
          sourcePath: promptRun.sourcePath,
          prompt: refinedPrompt.trim(),
          sourceConfigId: promptRun.sourceConfigId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create refined prompt');
      }

      const result = await response.json();

      // Navigate to the new prompt result
      const queryParams = new URLSearchParams({
        promptId: result.id,
        sectionKey: promptRun.sectionKey
      });

      if (promptRun.sourcePath) {
        queryParams.set('sourcePath', promptRun.sourcePath);
      }

      router.push(`/engine/results/ask-assistant?${queryParams.toString()}`);

    } catch (error) {
      console.error('Error refining prompt:', error);
      // TODO: Show error toast or alert
    } finally {
      setIsRefining(false);
    }
  };

  const handleUseExpertExample = () => {
    if (sectionConfig?.expertPromptExample) {
      setRefinedPrompt(sectionConfig.expertPromptExample);
    }
  };

  const handleCopyPrompt = async () => {
    if (promptRun?.prompt) {
      try {
        await navigator.clipboard.writeText(promptRun.prompt);
        // TODO: Show success feedback
      } catch (err) {
        console.error('Failed to copy prompt:', err);
      }
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-600" />
            <p className="text-gray-600">Loading prompt result...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !promptRun) {
    return (
      <Card>
        <CardContent className="py-8">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error || 'Prompt run not found'}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Prompt Summary Panel */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="flex items-center">
                <MessageSquare className="h-5 w-5 mr-2" />
                Prompt Summary
              </CardTitle>
              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <Calendar className="h-3 w-3 mr-1" />
                  {new Date(promptRun.createdAt).toLocaleString()}
                </div>
                <div className="flex items-center">
                  <User className="h-3 w-3 mr-1" />
                  {promptRun.userId === 'anonymous' ? 'Guest User' : promptRun.userId}
                </div>
                {promptRun.sourcePath && (
                  <div className="flex items-center">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">
                      {promptRun.sourcePath}
                    </code>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {promptRun.usedExpertExample && (
                <Badge variant="outline" className="text-xs">
                  Used Expert Example
                </Badge>
              )}
              {promptRun.selectedRecommendedPrompt && (
                <Badge variant="outline" className="text-xs">
                  Used Quick Start
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-medium text-gray-900">Original Prompt</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyPrompt}
              >
                <Copy className="h-3 w-3 mr-1" />
                Copy
              </Button>
            </div>
            <pre className="text-sm whitespace-pre-wrap text-gray-700 font-mono max-h-64 overflow-y-auto">
              {promptRun.prompt}
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* Response Panel */}
      <Card>
        <CardHeader>
          <CardTitle>AI Response</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <Lightbulb className="h-4 w-4" />
            <AlertDescription>
              <strong>Coming Soon:</strong> AI response generation is being integrated.
              For now, you can refine your prompt and create new conversations.
            </AlertDescription>
          </Alert>

          {/* Placeholder for future AI response */}
          <div className="mt-4 p-8 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border border-dashed border-purple-200">
            <div className="text-center text-gray-500">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-purple-300" />
              <p className="text-lg font-medium mb-2">AI Response Area</p>
              <p className="text-sm">
                This is where the AI assistant's response will appear when the feature is fully integrated.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Refine Prompt Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <RefreshCw className="h-5 w-5 mr-2" />
            Refine Prompt
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Textarea
              placeholder="Modify your prompt to get better results..."
              value={refinedPrompt}
              onChange={(e) => setRefinedPrompt(e.target.value)}
              className="min-h-[120px]"
              rows={6}
            />

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {sectionConfig?.expertPromptExample && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleUseExpertExample}
                  >
                    <Lightbulb className="h-3 w-3 mr-1" />
                    Use Expert Example
                  </Button>
                )}
                <div className="text-xs text-gray-400">
                  {refinedPrompt.length} characters
                </div>
              </div>

              <Button
                onClick={handleRefinePrompt}
                disabled={!refinedPrompt.trim() || refinedPrompt.trim() === promptRun.prompt || isRefining}
              >
                {isRefining ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Run Updated Prompt
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}