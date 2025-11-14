'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Terminal,
  RefreshCw,
  Download,
  Filter,
  Clock,
  Server,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Bug,
  Zap,
  Play,
  Pause
} from 'lucide-react';

interface DevLogEntry {
  timestamp: string;
  level: 'info' | 'error' | 'warn' | 'debug';
  message: string;
  source: 'next' | 'app' | 'system';
}

interface DevProcess {
  pid: string;
  port?: string;
  status: 'running' | 'stopped';
  command: string;
  startTime?: string;
}

interface DevLogsResponse {
  pid: string;
  logs: DevLogEntry[];
  total: number;
  timestamp: string;
}

type LevelFilter = 'all' | 'info' | 'error' | 'warn' | 'debug';
type SourceFilter = 'all' | 'next' | 'app' | 'system';

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<DevLogEntry[]>([]);
  const [processes, setProcesses] = useState<DevProcess[]>([]);
  const [selectedProcess, setSelectedProcess] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(5);
  const [levelFilter, setLevelFilter] = useState<LevelFilter>('all');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [maxLines, setMaxLines] = useState(100);

  // Auto-refresh functionality
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (autoRefresh) {
      intervalId = setInterval(() => {
        fetchLogs();
      }, refreshInterval * 1000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [autoRefresh, refreshInterval, selectedProcess]);

  // Fetch processes
  const fetchProcesses = useCallback(async () => {
    try {
      const response = await fetch('/api/dev/logs?action=processes');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      setProcesses(data.processes);

      // Auto-select the first process if none selected
      if (!selectedProcess && data.processes.length > 0) {
        setSelectedProcess(data.processes[0].pid);
      }
    } catch (err) {
      console.error('Error fetching processes:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch processes');
    }
  }, [selectedProcess]);

  // Fetch logs
  const fetchLogs = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams({
        action: 'logs',
        lines: maxLines.toString()
      });

      if (selectedProcess) {
        params.set('pid', selectedProcess);
      }

      const response = await fetch(`/api/dev/logs?${params}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: DevLogsResponse = await response.json();
      setLogs(data.logs);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch logs';
      setError(errorMessage);
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedProcess, maxLines]);

  // Filter logs based on level and source
  const filteredLogs = logs.filter(log => {
    const levelMatch = levelFilter === 'all' || log.level === levelFilter;
    const sourceMatch = sourceFilter === 'all' || log.source === sourceFilter;
    return levelMatch && sourceMatch;
  });

  // Initial load
  useEffect(() => {
    fetchProcesses();
  }, []);

  useEffect(() => {
    if (selectedProcess) {
      fetchLogs();
    }
  }, [selectedProcess, fetchLogs]);

  // Helper functions
  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warn':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'debug':
        return <Bug className="h-4 w-4 text-purple-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getLevelBadgeVariant = (level: string) => {
    switch (level) {
      case 'error':
        return 'destructive' as const;
      case 'warn':
        return 'secondary' as const;
      case 'debug':
        return 'outline' as const;
      default:
        return 'default' as const;
    }
  };

  const getSourceBadgeColor = (source: string) => {
    switch (source) {
      case 'next':
        return 'bg-blue-100 text-blue-800';
      case 'app':
        return 'bg-green-100 text-green-800';
      case 'system':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const exportLogs = () => {
    const exportData = {
      process: selectedProcess,
      logs: filteredLogs,
      exported_at: new Date().toISOString(),
      filters: { levelFilter, sourceFilter }
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dev-logs-${selectedProcess}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Terminal className="h-8 w-8 text-green-600" />
            Dev Server Logs
          </h1>
          <p className="text-gray-600 mt-1">
            Real-time logs from your development server processes
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchLogs}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportLogs}
            disabled={filteredLogs.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Process Selection & Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Process Controls
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Process Selection */}
            <div className="space-y-2">
              <Label>Process</Label>
              <Select value={selectedProcess} onValueChange={setSelectedProcess}>
                <SelectTrigger>
                  <SelectValue placeholder="Select process..." />
                </SelectTrigger>
                <SelectContent>
                  {processes.map(process => (
                    <SelectItem key={process.pid} value={process.pid}>
                      PID {process.pid} - Port {process.port || 'unknown'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Auto Refresh */}
            <div className="space-y-2">
              <Label>Auto Refresh</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={autoRefresh}
                  onCheckedChange={setAutoRefresh}
                />
                <span className="text-sm text-gray-600">
                  {autoRefresh ? 'On' : 'Off'}
                </span>
              </div>
            </div>

            {/* Refresh Interval */}
            <div className="space-y-2">
              <Label>Refresh Interval</Label>
              <Select
                value={refreshInterval.toString()}
                onValueChange={(value) => setRefreshInterval(parseInt(value))}
                disabled={!autoRefresh}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 second</SelectItem>
                  <SelectItem value="5">5 seconds</SelectItem>
                  <SelectItem value="10">10 seconds</SelectItem>
                  <SelectItem value="30">30 seconds</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Max Lines */}
            <div className="space-y-2">
              <Label>Max Lines</Label>
              <Select
                value={maxLines.toString()}
                onValueChange={(value) => setMaxLines(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="50">50 lines</SelectItem>
                  <SelectItem value="100">100 lines</SelectItem>
                  <SelectItem value="250">250 lines</SelectItem>
                  <SelectItem value="500">500 lines</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Log Level</Label>
              <Select value={levelFilter} onValueChange={(value: LevelFilter) => setLevelFilter(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="error">Errors Only</SelectItem>
                  <SelectItem value="warn">Warnings Only</SelectItem>
                  <SelectItem value="info">Info Only</SelectItem>
                  <SelectItem value="debug">Debug Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Source</Label>
              <Select value={sourceFilter} onValueChange={(value: SourceFilter) => setSourceFilter(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="next">Next.js Only</SelectItem>
                  <SelectItem value="app">Application Only</SelectItem>
                  <SelectItem value="system">System Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <div className="text-sm text-gray-600">
                Showing {filteredLogs.length} of {logs.length} logs
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Process Status */}
      {processes.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">Dev Server Running</span>
                </div>
                {selectedProcess && (
                  <div className="text-sm text-gray-600">
                    PID: {selectedProcess}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="h-4 w-4" />
                Last updated: {new Date().toLocaleTimeString()}
              </div>
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

      {/* Logs Display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Terminal className="h-5 w-5" />
            Live Logs
            <Badge variant="outline" className="ml-auto">
              {filteredLogs.length} entries
            </Badge>
          </CardTitle>
          <CardDescription>
            Real-time development server logs
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div
            className="max-h-96 overflow-y-auto bg-gray-900 text-gray-100 font-mono text-sm"
            style={{ fontFamily: 'Monaco, "Lucida Console", monospace' }}
          >
            {filteredLogs.length > 0 ? (
              <div className="p-4 space-y-1">
                {filteredLogs.map((log, index) => (
                  <div key={index} className="flex items-start gap-3 hover:bg-gray-800 p-2 rounded">
                    <div className="flex-shrink-0 mt-1">
                      {getLevelIcon(log.level)}
                    </div>
                    <div className="flex-shrink-0 text-xs text-gray-400 w-20">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </div>
                    <div className="flex-shrink-0">
                      <Badge
                        variant={getLevelBadgeVariant(log.level)}
                        className="text-xs"
                      >
                        {log.level.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex-shrink-0">
                      <Badge
                        className={`text-xs ${getSourceBadgeColor(log.source)}`}
                        variant="outline"
                      >
                        {log.source}
                      </Badge>
                    </div>
                    <div className="flex-1 min-w-0">
                      <pre className="whitespace-pre-wrap break-words text-xs leading-5">
                        {log.message}
                      </pre>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              !isLoading && (
                <div className="p-8 text-center text-gray-500">
                  <Terminal className="h-12 w-12 mx-auto mb-4 text-gray-600" />
                  <p className="text-lg font-medium">No logs found</p>
                  <p className="text-sm">Try adjusting your filters or refresh the logs</p>
                </div>
              )
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}