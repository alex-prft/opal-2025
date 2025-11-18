/**
 * Ask Assistant History Component
 *
 * Displays previous Ask Assistant prompt runs with ability to re-run or open.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getAskAssistantConfig, ResultsSectionKey } from '@/lib/askAssistant/config';
import {
  Clock,
  MessageSquare,
  RefreshCw,
  ExternalLink,
  Calendar,
  User,
  Loader2,
  AlertCircle,
  FileText,
  ArrowRight
} from 'lucide-react';

export interface AskAssistantHistoryProps {
  sectionKey?: ResultsSectionKey;
  currentPromptId?: string;
}

interface PromptRunSummary {
  id: string;
  sectionKey: string;
  sourcePath: string;
  prompt: string;
  sourceConfigId?: string;
  usedExpertExample?: boolean;
  selectedRecommendedPrompt?: string;
  createdAt: string;
}

export function AskAssistantHistory({
  sectionKey,
  currentPromptId
}: AskAssistantHistoryProps) {
  const router = useRouter();
  const [promptRuns, setPromptRuns] = useState<PromptRunSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reRunningId, setReRunningId] = useState<string | null>(null);

  useEffect(() => {
    fetchPromptHistory();
  }, [sectionKey]);

  const fetchPromptHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      if (sectionKey) {
        queryParams.set('sectionKey', sectionKey);
      }
      queryParams.set('limit', '20');

      const response = await fetch(`/api/ask-assistant/runs?${queryParams.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch prompt history');
      }

      // Filter out current prompt if provided
      let runs = data.runs || [];
      if (currentPromptId) {
        runs = runs.filter((run: PromptRunSummary) => run.id !== currentPromptId);
      }

      setPromptRuns(runs);

    } catch (err) {
      console.error('Error fetching prompt history:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPrompt = (promptRun: PromptRunSummary) => {
    const queryParams = new URLSearchParams({
      promptId: promptRun.id,
      sectionKey: promptRun.sectionKey
    });

    if (promptRun.sourcePath) {
      queryParams.set('sourcePath', promptRun.sourcePath);
    }

    router.push(`/engine/results/ask-assistant?${queryParams.toString()}`);
  };

  const handleReRunPrompt = async (promptRun: PromptRunSummary) => {
    setReRunningId(promptRun.id);

    try {
      // Create a new prompt run using the same prompt
      const response = await fetch('/api/ask-assistant/runs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sectionKey: promptRun.sectionKey,
          sourcePath: promptRun.sourcePath,
          prompt: promptRun.prompt,
          sourceConfigId: promptRun.sourceConfigId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to re-run prompt');
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
      console.error('Error re-running prompt:', error);
      // TODO: Show error toast or alert
    } finally {
      setReRunningId(null);
    }
  };

  const handleOpenInContext = (promptRun: PromptRunSummary) => {
    if (promptRun.sourcePath) {
      // TODO: Navigate to source page with modal preloaded
      // For now, just navigate to the source page
      router.push(promptRun.sourcePath);
    }
  };

  const truncatePrompt = (prompt: string, maxLength: number = 150): string => {
    if (prompt.length <= maxLength) return prompt;
    return prompt.substring(0, maxLength) + '...';
  };

  const getSectionLabel = (sectionKey: string): string => {
    const config = getAskAssistantConfig(sectionKey as ResultsSectionKey);
    return config?.label || sectionKey;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-600" />
            <p className="text-gray-600">Loading prompt history...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (promptRuns.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Previous Prompts</h3>
            <p className="text-gray-600 mb-4">
              Your Ask Assistant conversations will appear here for easy access and re-use.
            </p>
            <p className="text-sm text-gray-500">
              Start a conversation from any Results page to begin building your history.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">
          Previous Prompts ({promptRuns.length})
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchPromptHistory}
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Refresh
        </Button>
      </div>

      {promptRuns.map((promptRun) => (
        <Card key={promptRun.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-2">
                  <Badge variant="outline" className="text-xs">
                    {getSectionLabel(promptRun.sectionKey)}
                  </Badge>
                  {promptRun.usedExpertExample && (
                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                      Expert Example
                    </Badge>
                  )}
                  {promptRun.selectedRecommendedPrompt && (
                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                      Quick Start
                    </Badge>
                  )}
                </div>

                <p className="text-sm text-gray-700 mb-3 font-mono bg-gray-50 p-2 rounded">
                  {truncatePrompt(promptRun.prompt)}
                </p>

                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <div className="flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    {new Date(promptRun.createdAt).toLocaleDateString()}
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    {new Date(promptRun.createdAt).toLocaleTimeString()}
                  </div>
                  {promptRun.sourcePath && (
                    <div className="flex items-center">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      <code className="bg-gray-100 px-1 py-0.5 rounded">
                        {promptRun.sourcePath.split('/').pop()}
                      </code>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col space-y-2 ml-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenPrompt(promptRun)}
                >
                  <MessageSquare className="h-3 w-3 mr-1" />
                  Open
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleReRunPrompt(promptRun)}
                  disabled={reRunningId === promptRun.id}
                >
                  {reRunningId === promptRun.id ? (
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3 w-3 mr-1" />
                  )}
                  Run Again
                </Button>

                {promptRun.sourcePath && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenInContext(promptRun)}
                  >
                    <ArrowRight className="h-3 w-3 mr-1" />
                    Context
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {promptRuns.length >= 20 && (
        <div className="text-center pt-4">
          <p className="text-sm text-gray-500">
            Showing most recent 20 prompts. Older prompts are archived automatically.
          </p>
        </div>
      )}
    </div>
  );
}