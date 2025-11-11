'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Bug,
  PlayCircle,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Zap,
  Database,
  Network
} from 'lucide-react';
import { SafeDate } from '@/lib/utils/date-formatter';

interface DiagnosticsData {
  success: boolean;
  lastWebhook?: {
    id: string;
    event_type: string;
    workflow_id: string;
    agent_name?: string;
    success: boolean;
    error_message?: string;
    received_at: string;
    processing_time_ms?: number;
    payload?: any;
  };
  recentEvents: Array<{
    id: string;
    event_type: string;
    workflow_id: string;
    agent_name?: string;
    success: boolean;
    error_message?: string;
    received_at: string;
    processing_time_ms?: number;
  }>;
  agentEvents: Array<{
    id: string;
    event_type: string;
    workflow_id: string;
    agent_id?: string;
    agent_name?: string;
    success: boolean;
    error_message?: string;
    received_at: string;
    processing_time_ms?: number;
  }>;
  timestamp: string;
}

interface DiagnosticsPanelProps {
  className?: string;
  id?: string;
}

export function DiagnosticsPanel({ className = '', id }: DiagnosticsPanelProps) {
  const [diagnosticsData, setDiagnosticsData] = useState<DiagnosticsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTestingWorkflow, setIsTestingWorkflow] = useState(false);

  const fetchDiagnostics = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/diagnostics/last-webhook');
      const data = await response.json();

      if (data.success) {
        setDiagnosticsData(data);
      } else {
        setError(data.message || 'Failed to fetch diagnostics data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const testWorkflow = async () => {
    try {
      setIsTestingWorkflow(true);
      setError(null);

      const response = await fetch('/api/monitoring/test-workflow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          testType: 'admin_dashboard',
          clientName: 'Diagnostics Panel Test'
        })
      });

      const result = await response.json();

      if (result.success) {
        // Refresh diagnostics after a short delay to show the new test workflow
        setTimeout(() => {
          fetchDiagnostics();
        }, 2000);
      } else {
        setError(`Test workflow failed: ${result.message || 'Unknown error'}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Test workflow request failed');
    } finally {
      setIsTestingWorkflow(false);
    }
  };

  useEffect(() => {
    fetchDiagnostics();

    // Auto-refresh diagnostics every 30 seconds
    const interval = setInterval(fetchDiagnostics, 30000);
    return () => clearInterval(interval);
  }, []);

  const getEventIcon = (eventType: string, success: boolean) => {
    if (eventType.startsWith('agent.')) {
      return success ? (
        <CheckCircle2 className="h-4 w-4 text-green-600" />
      ) : (
        <XCircle className="h-4 w-4 text-red-600" />
      );
    }
    if (eventType.startsWith('workflow.')) {
      return success ? (
        <Zap className="h-4 w-4 text-blue-600" />
      ) : (
        <AlertCircle className="h-4 w-4 text-red-600" />
      );
    }
    return <Database className="h-4 w-4 text-gray-600" />;
  };

  const getEventBadgeVariant = (eventType: string, success: boolean) => {
    if (!success) return 'destructive' as const;
    if (eventType.includes('agent.completed')) return 'default' as const;
    if (eventType.includes('workflow.')) return 'secondary' as const;
    return 'outline' as const;
  };

  return (
    <Card className={`${className}`} id={id}>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <Bug className="h-6 w-6 text-purple-600" />
          Diagnostics Panel
        </CardTitle>
        <CardDescription>
          Real-time webhook diagnostics and agent data flow troubleshooting
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Control Panel */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                onClick={testWorkflow}
                disabled={isTestingWorkflow}
                className="flex items-center gap-2"
                variant="outline"
              >
                {isTestingWorkflow ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <PlayCircle className="h-4 w-4" />
                )}
                Test Workflow
              </Button>

              <Button
                onClick={fetchDiagnostics}
                disabled={isLoading}
                size="sm"
                variant="ghost"
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            {diagnosticsData && (
              <div className="text-xs text-gray-500">
                Last updated: <SafeDate date={diagnosticsData.timestamp} format="time" />
              </div>
            )}
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

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-3" />
                <p className="text-sm text-gray-600">Loading diagnostics data...</p>
              </div>
            </div>
          )}

          {/* Diagnostics Data */}
          {diagnosticsData && !isLoading && (
            <div className="space-y-4">
              {/* Last Webhook */}
              {diagnosticsData.lastWebhook ? (
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Network className="h-4 w-4 text-blue-600" />
                    Last Webhook Event
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-3 border">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getEventIcon(diagnosticsData.lastWebhook.event_type, diagnosticsData.lastWebhook.success)}
                        <Badge variant={getEventBadgeVariant(diagnosticsData.lastWebhook.event_type, diagnosticsData.lastWebhook.success)}>
                          {diagnosticsData.lastWebhook.event_type}
                        </Badge>
                        {diagnosticsData.lastWebhook.agent_name && (
                          <span className="text-xs text-gray-600">
                            {diagnosticsData.lastWebhook.agent_name}
                          </span>
                        )}
                      </div>
                      <SafeDate
                        date={diagnosticsData.lastWebhook.received_at}
                        format="time"
                        className="text-xs text-gray-500"
                      />
                    </div>

                    <div className="text-xs text-gray-600 space-y-1">
                      <div>Workflow ID: <code className="bg-gray-200 px-1 rounded">{diagnosticsData.lastWebhook.workflow_id}</code></div>
                      {diagnosticsData.lastWebhook.processing_time_ms && (
                        <div>Processing Time: {diagnosticsData.lastWebhook.processing_time_ms}ms</div>
                      )}
                      {diagnosticsData.lastWebhook.error_message && (
                        <div className="text-red-600 mt-2">
                          <strong>Error:</strong> {diagnosticsData.lastWebhook.error_message}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">No recent webhook events found</p>
                </div>
              )}

              {/* Recent Agent Events */}
              {diagnosticsData.agentEvents.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    Recent Agent Events ({diagnosticsData.agentEvents.length})
                  </h4>
                  <div className="space-y-2">
                    {diagnosticsData.agentEvents.map((event) => (
                      <div key={event.id} className="flex items-center justify-between text-xs bg-gray-50 rounded p-2">
                        <div className="flex items-center gap-2">
                          {getEventIcon(event.event_type, event.success)}
                          <Badge
                            variant={getEventBadgeVariant(event.event_type, event.success)}
                            className="text-xs"
                          >
                            {event.event_type}
                          </Badge>
                          {event.agent_name && (
                            <span className="text-gray-600">{event.agent_name}</span>
                          )}
                          {event.processing_time_ms && (
                            <span className="text-gray-500">
                              <Clock className="h-3 w-3 inline mr-1" />
                              {event.processing_time_ms}ms
                            </span>
                          )}
                        </div>
                        <SafeDate
                          date={event.received_at}
                          format="time"
                          className="text-gray-400"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Events Summary */}
              {diagnosticsData.recentEvents.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Database className="h-4 w-4 text-gray-600" />
                    All Recent Events ({diagnosticsData.recentEvents.length})
                  </h4>
                  <div className="grid grid-cols-1 gap-1">
                    {diagnosticsData.recentEvents.slice(0, 3).map((event) => (
                      <div key={event.id} className="flex items-center justify-between text-xs py-1">
                        <div className="flex items-center gap-2">
                          {getEventIcon(event.event_type, event.success)}
                          <span className={event.success ? 'text-gray-700' : 'text-red-600'}>
                            {event.event_type}
                          </span>
                          {event.agent_name && (
                            <span className="text-gray-500">({event.agent_name})</span>
                          )}
                        </div>
                        <SafeDate
                          date={event.received_at}
                          format="time"
                          className="text-gray-400"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Test Workflow Status */}
          {isTestingWorkflow && (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 text-blue-700">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span className="text-sm font-medium">Test Workflow Running</span>
              </div>
              <div className="text-xs text-blue-600 mt-1">
                Triggering agents... Watch the OPAL Agent Status section above for real-time updates.
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default DiagnosticsPanel;