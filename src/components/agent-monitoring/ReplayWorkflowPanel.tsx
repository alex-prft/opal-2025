'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, RotateCcw, CheckCircle, XCircle, AlertCircle, RefreshCw, Clock } from 'lucide-react';

// TypeScript interfaces for API responses
interface WorkflowReplayResult {
  success: boolean;
  correlation_id?: string;
  workflow_id?: string;
  dry_run?: boolean;
  message?: string;
  error?: string;
  timestamp: string;
}

interface ReplayWorkflowPanelProps {
  agentId: string;
  lastWorkflowId?: string;
  className?: string;
}

export function ReplayWorkflowPanel({ agentId, lastWorkflowId, className = '' }: ReplayWorkflowPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [replayResult, setReplayResult] = useState<WorkflowReplayResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Replay workflow function
  const replayWorkflow = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setReplayResult(null);

      // Use provided lastWorkflowId or generate a test workflow ID
      const workflowId = lastWorkflowId || `test-workflow-${agentId}-${Date.now()}`;

      const response = await fetch('/api/orchestrations/replay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          workflow_id: workflowId,
          dry_run: true,
          agent_id: agentId
        })
      });

      const data = await response.json();

      setReplayResult({
        success: data.success || false,
        correlation_id: data.correlation_id,
        workflow_id: workflowId,
        dry_run: true,
        message: data.message,
        error: data.error,
        timestamp: new Date().toISOString()
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to replay workflow');
      setReplayResult({
        success: false,
        workflow_id: lastWorkflowId || `test-workflow-${agentId}`,
        dry_run: true,
        error: err instanceof Error ? err.message : 'Network error occurred',
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <RotateCcw className="h-5 w-5 text-purple-600" />
            <div>
              <CardTitle className="text-lg">Replay Last Workflow</CardTitle>
              <CardDescription>
                Re-execute the last workflow for this agent in dry-run mode
              </CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4" />
                Hide
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                Show
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent>
          <div className="space-y-4">
            {/* Control Section */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-sm text-gray-600">
                  Replay workflow for: <code className="bg-gray-100 px-2 py-1 rounded text-xs">{agentId}</code>
                </div>
                {lastWorkflowId && (
                  <div className="text-xs text-gray-500">
                    Last workflow: <code className="bg-gray-100 px-1 rounded">{lastWorkflowId}</code>
                  </div>
                )}
              </div>
              <Button
                onClick={replayWorkflow}
                disabled={isLoading}
                className="flex items-center gap-2"
                variant="outline"
              >
                {isLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <RotateCcw className="h-4 w-4" />
                )}
                {isLoading ? 'Replaying...' : 'Replay Workflow'}
              </Button>
            </div>

            {/* Error Display */}
            {error && (
              <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Error:</span>
                </div>
                <div className="text-sm text-red-600 mt-1">{error}</div>
              </div>
            )}

            {/* Replay Result Display */}
            {replayResult && (
              <div className={`p-4 rounded-lg border ${
                replayResult.success
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {replayResult.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  <span className={`font-semibold ${
                    replayResult.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {replayResult.success ? 'Workflow Replayed Successfully' : 'Workflow Replay Failed'}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    <Clock className="h-3 w-3 mr-1" />
                    Dry Run
                  </Badge>
                </div>

                <div className="space-y-2 text-sm">
                  {replayResult.workflow_id && (
                    <div>
                      <span className="font-medium text-gray-700">Workflow ID:</span>
                      <code className="ml-2 bg-gray-100 px-2 py-1 rounded text-xs">
                        {replayResult.workflow_id}
                      </code>
                    </div>
                  )}

                  {replayResult.correlation_id && (
                    <div>
                      <span className="font-medium text-gray-700">Correlation ID:</span>
                      <code className="ml-2 bg-gray-100 px-2 py-1 rounded text-xs">
                        {replayResult.correlation_id}
                      </code>
                    </div>
                  )}

                  {replayResult.message && (
                    <div>
                      <span className="font-medium text-gray-700">Message:</span>
                      <span className="ml-2 text-gray-600">{replayResult.message}</span>
                    </div>
                  )}

                  {replayResult.error && (
                    <div>
                      <span className="font-medium text-red-700">Error:</span>
                      <span className="ml-2 text-red-600">{replayResult.error}</span>
                    </div>
                  )}

                  <div className="text-xs text-gray-500 pt-2 border-t border-gray-200">
                    Replayed at: {new Date(replayResult.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
            )}

            {/* Info Section */}
            <div className="text-xs text-gray-500 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="font-medium text-blue-700 mb-1">Dry Run Mode</div>
              This replay runs in dry-run mode, meaning it will simulate the workflow execution without making actual changes to the system.
              It calls <code>/api/orchestrations/replay</code> with the workflow parameters.
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

export default ReplayWorkflowPanel;