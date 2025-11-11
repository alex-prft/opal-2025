'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Terminal,
  Download,
  Settings,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Filter,
  Clock
} from 'lucide-react';
import { SafeDate } from '@/lib/utils/date-formatter';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'INFO' | 'ERROR' | 'WARN';
  message: string;
  details: string;
  agent_id?: string;
  agent_name?: string;
  workflow_id?: string;
  workflow_name?: string;
  event_type?: string;
  success: boolean;
  error_message?: string;
  processing_time_ms?: number;
  session_id?: string;
}

interface LogSummary {
  total_logs: number;
  error_logs: number;
  success_logs: number;
  error_rate: string;
  time_range_hours: number;
  last_log_time: string | null;
}

interface AgentErrorPattern {
  agent_id: string;
  agent_name?: string;
  error_count: number;
  last_error: string;
  recent_errors: Array<{
    timestamp: string;
    message: string;
  }>;
}

export default function SystemLogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [summary, setSummary] = useState<LogSummary | null>(null);
  const [agentErrorPatterns, setAgentErrorPatterns] = useState<AgentErrorPattern[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [agentFilter, setAgentFilter] = useState<string>('');
  const [hoursFilter, setHoursFilter] = useState<number>(24);
  const [limitFilter, setLimitFilter] = useState<number>(100);

  // Fetch logs data
  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams({
        level: levelFilter,
        hours: hoursFilter.toString(),
        limit: limitFilter.toString()
      });

      if (agentFilter) {
        params.set('agent', agentFilter);
      }

      const response = await fetch(`/api/monitoring/agent-logs?${params}`);
      const data = await response.json();

      if (data.success) {
        setLogs(data.logs || []);
        setSummary(data.summary);
        setAgentErrorPatterns(data.agent_error_patterns || []);
      } else {
        setError(data.message || 'Failed to fetch logs');
        setLogs([]);
        setSummary(null);
        setAgentErrorPatterns([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error occurred');
      setLogs([]);
      setSummary(null);
      setAgentErrorPatterns([]);
    } finally {
      setIsLoading(false);
    }
  };

  const exportData = async () => {
    try {
      setError(null);
      const response = await fetch('/api/monitoring/agent-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'export_logs',
          format: 'json',
          hours: hoursFilter
        })
      });

      const data = await response.json();

      if (data.success) {
        const blob = new Blob([JSON.stringify(data.export_data, null, 2)], {
          type: 'application/json'
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `agent-logs-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        setError(data.message || 'Export failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    }
  };

  const getLogIcon = (level: string, success: boolean) => {
    if (level === 'ERROR' || !success) {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  const getLogBadgeVariant = (level: string, success: boolean) => {
    if (level === 'ERROR' || !success) return 'destructive' as const;
    return 'default' as const;
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 30000); // Auto-refresh every 30 seconds
    return () => clearInterval(interval);
  }, [levelFilter, agentFilter, hoursFilter, limitFilter]);

  return (
    <div className="space-y-6" id="system-logs-page">
      {/* Header */}
      <div className="flex justify-between items-start" id="page-header">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Terminal className="h-8 w-8 text-blue-600" />
            System Logs
          </h1>
          <p className="text-gray-600 mt-1">
            Real-time agent error logs and system events from webhook data
          </p>
        </div>
        <div className="flex gap-2" id="log-actions">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchLogs}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={exportData} id="export-logs-btn">
            <Download className="h-4 w-4 mr-2" />
            Export Logs
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Logs</p>
                  <p className="text-2xl font-bold">{summary.total_logs}</p>
                </div>
                <Terminal className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Error Logs</p>
                  <p className="text-2xl font-bold text-red-600">{summary.error_logs}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Success Logs</p>
                  <p className="text-2xl font-bold text-green-600">{summary.success_logs}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Error Rate</p>
                  <p className="text-2xl font-bold">{summary.error_rate}%</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Log Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium">Level</label>
              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="error">Errors Only</SelectItem>
                  <SelectItem value="success">Success Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Time Range</label>
              <Select value={hoursFilter.toString()} onValueChange={(v) => setHoursFilter(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Last Hour</SelectItem>
                  <SelectItem value="6">Last 6 Hours</SelectItem>
                  <SelectItem value="24">Last 24 Hours</SelectItem>
                  <SelectItem value="168">Last Week</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Limit</label>
              <Select value={limitFilter.toString()} onValueChange={(v) => setLimitFilter(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="50">50 logs</SelectItem>
                  <SelectItem value="100">100 logs</SelectItem>
                  <SelectItem value="250">250 logs</SelectItem>
                  <SelectItem value="500">500 logs</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Agent Filter</label>
              <input
                type="text"
                placeholder="Filter by agent..."
                value={agentFilter}
                onChange={(e) => setAgentFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Agent Error Patterns */}
      {agentErrorPatterns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Agents with Repeated Failures
            </CardTitle>
            <CardDescription>
              Agents showing multiple failures in the selected time range
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {agentErrorPatterns.slice(0, 5).map((pattern) => (
                <div key={pattern.agent_id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <XCircle className="h-4 w-4 text-red-600" />
                      <span className="font-medium text-red-800">
                        {pattern.agent_name || pattern.agent_id}
                      </span>
                      <Badge variant="destructive" className="text-xs">
                        {pattern.error_count} failures
                      </Badge>
                    </div>
                    <div className="text-sm text-red-700">
                      Last error: <SafeDate date={pattern.last_error} format="datetime" />
                    </div>
                    {pattern.recent_errors.length > 0 && (
                      <div className="text-xs text-red-600 mt-1">
                        Recent: {pattern.recent_errors[0].message}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAgentFilter(pattern.agent_id)}
                    className="text-xs"
                  >
                    View Logs
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-700">
              <XCircle className="h-4 w-4" />
              <span className="font-medium">Error loading logs:</span>
            </div>
            <div className="text-sm text-red-600 mt-1">{error}</div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="p-8">
            <div className="flex items-center justify-center">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mr-3" />
              <span className="text-gray-600">Loading system logs...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Logs Display */}
      <Card id="logs-display-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Terminal className="h-5 w-5" />
            System Events Log
            {summary?.last_log_time && (
              <span className="text-sm font-normal text-gray-500">
                (Last update: <SafeDate date={summary.last_log_time} format="time" />)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {logs.length > 0 ? (
            <div className="max-h-96 overflow-y-auto">
              <div className="space-y-1 p-4">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border text-sm ${
                      log.level === 'ERROR' ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {getLogIcon(log.level, log.success)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <SafeDate
                          date={log.timestamp}
                          format="datetime"
                          className="text-xs text-gray-500 font-mono"
                        />
                        <Badge variant={getLogBadgeVariant(log.level, log.success)} className="text-xs">
                          {log.level}
                        </Badge>
                        {log.agent_name && (
                          <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                            {log.agent_name}
                          </span>
                        )}
                        {log.processing_time_ms && (
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {log.processing_time_ms}ms
                          </span>
                        )}
                      </div>
                      <div className={`font-medium ${log.level === 'ERROR' ? 'text-red-800' : 'text-gray-800'}`}>
                        {log.message}
                      </div>
                      {log.details && (
                        <div className={`text-xs mt-1 ${log.level === 'ERROR' ? 'text-red-600' : 'text-gray-600'}`}>
                          {log.details}
                        </div>
                      )}
                      {log.workflow_id && (
                        <div className="text-xs text-gray-500 mt-1">
                          Workflow: <code className="bg-gray-200 px-1 rounded">{log.workflow_id}</code>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            !isLoading && (
              <div className="p-8 text-center text-gray-500">
                <Terminal className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium">No logs found</p>
                <p className="text-sm">Try adjusting your filters or check back later</p>
              </div>
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
}