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
  events: Array<{
    id: string;
    workflow_id: string;
    agent_id: string;
    received_at: string;
    signature_valid: boolean;
    http_status: number;
    error_text?: string;
    dedup_hash: string;
    payload_preview: string;
  }>;
  summary: {
    total_count: number;
    returned_count: number;
    signature_valid_count: number;
    error_count: number;
    date_range: {
      from: string | null;
      to: string | null;
    };
    filters_applied: {
      limit: number;
      workflow_id: string | null;
      agent_id: string | null;
      status: string;
      hours: number;
    };
  };
  config_diagnostics: any;
  troubleshooting: any;
  generated_at: string;
  query_info: any;
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

  // Safe access helper for diagnostics data
  const safeGet = <T extends unknown>(getter: () => T, defaultValue: T): T => {
    try {
      return getter() ?? defaultValue;
    } catch {
      return defaultValue;
    }
  };

  const fetchDiagnostics = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/diagnostics/last-webhook?limit=25&status=all&hours=24');
      const data = await response.json();

      // API returns data directly, check if response is ok or has expected structure
      if (response.ok && data.events !== undefined) {
        setDiagnosticsData(data);
      } else {
        setError(data.message || data.error || 'Failed to fetch diagnostics data');
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
              {/* Summary Statistics */}
              {safeGet(() => diagnosticsData.summary, null) && (
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Network className="h-4 w-4 text-blue-600" />
                    Event Summary
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-3 border">
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-gray-600">Total Events:</span>
                        <span className="font-medium ml-1">{safeGet(() => diagnosticsData.summary.total_count, 0)}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Valid Signatures:</span>
                        <span className="font-medium ml-1">{safeGet(() => diagnosticsData.summary.signature_valid_count, 0)}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Errors:</span>
                        <span className="font-medium ml-1 text-red-600">{safeGet(() => diagnosticsData.summary.error_count, 0)}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Time Range:</span>
                        <span className="font-medium ml-1">{safeGet(() => diagnosticsData.summary.filters_applied.hours, 24)}h</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Recent Agent Events */}
              {safeGet(() => diagnosticsData.events, []).length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    Recent Agent Events ({safeGet(() => diagnosticsData.events.length, 0)})
                  </h4>
                  <div className="space-y-2">
                    {safeGet(() => diagnosticsData.events, []).map((event) => (
                      <div key={event.id} className="flex items-center justify-between text-xs bg-gray-50 rounded p-2">
                        <div className="flex items-center gap-2">
                          {getEventIcon('webhook', event.signature_valid && event.http_status === 202)}
                          <Badge
                            variant={getEventBadgeVariant('webhook', event.signature_valid && event.http_status === 202)}
                            className="text-xs"
                          >
                            Webhook
                          </Badge>
                          {event.agent_id && (
                            <span className="text-gray-600">{event.agent_id}</span>
                          )}
                          <span className="text-gray-500">
                            Status: {event.http_status}
                          </span>
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
              {safeGet(() => diagnosticsData.events, []).length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Database className="h-4 w-4 text-gray-600" />
                    All Recent Events ({safeGet(() => diagnosticsData.events.length, 0)})
                  </h4>
                  <div className="grid grid-cols-1 gap-1">
                    {safeGet(() => diagnosticsData.events, []).slice(0, 3).map((event) => (
                      <div key={event.id} className="flex items-center justify-between text-xs py-1">
                        <div className="flex items-center gap-2">
                          {getEventIcon('webhook', event.signature_valid && event.http_status === 202)}
                          <span className={(event.signature_valid && event.http_status === 202) ? 'text-gray-700' : 'text-red-600'}>
                            Webhook ({event.http_status})
                          </span>
                          {event.agent_id && (
                            <span className="text-gray-500">({event.agent_id})</span>
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