'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Bot,
  Play,
  RefreshCw,
  Settings,
  BarChart3,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Zap,
  Terminal,
  Activity,
  Loader2,
  Download,
  Eye,
  Pause,
  FileText,
  Target,
  Filter,
  Calendar,
  TrendingUp,
  AlertCircle,
  Gauge
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ExecutionStatus {
  execution_id: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  message: string;
  pages_queued: number;
  estimated_duration_minutes: number;
  created_at: string;
}

interface SystemStatus {
  success: boolean;
  system_health: 'healthy' | 'degraded' | 'unhealthy';
  overview: {
    total_pages: number;
    pages_by_section: Record<string, number>;
    environment: string;
  };
  content_optimizer: {
    agent_status: 'available' | 'unavailable' | 'unknown';
    recent_executions: number;
    success_rate_24h: number;
    average_confidence_score: number;
  };
  configuration: {
    optimizer_mode: string;
    schedule_times: string[];
    notification_email: string;
    confidence_threshold: number;
  };
  warnings?: string[];
}

/**
 * Sub Agents Dashboard - Admin Interface
 *
 * Comprehensive admin interface for managing and monitoring the results-content-optimizer
 * sub-agent system with manual trigger capabilities, real-time status monitoring,
 * and execution history tracking.
 */
export default function SubAgentsPageClient() {
  // State for system status
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // State for manual trigger form
  const [triggerForm, setTriggerForm] = useState({
    execution_mode: 'preview' as 'preview' | 'apply',
    target_sections: [] as string[],
    target_pages: '',
    confidence_threshold: 70,
    force_regeneration: false,
    priority_filter: undefined as number | undefined,
    reason: '',
  });
  const [triggerLoading, setTriggerLoading] = useState(false);
  const [lastExecution, setLastExecution] = useState<ExecutionStatus | null>(null);

  // State for execution history
  const [executionHistory, setExecutionHistory] = useState<ExecutionStatus[]>([]);
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);

  // Load system status
  const loadSystemStatus = async () => {
    setStatusLoading(true);
    try {
      const response = await fetch('/api/admin/results/status');
      if (response.ok) {
        const data = await response.json();
        setSystemStatus(data);
      } else {
        console.error('Failed to load system status');
      }
    } catch (error) {
      console.error('Error loading system status:', error);
    } finally {
      setStatusLoading(false);
      setLastRefresh(new Date());
    }
  };

  // Auto-refresh effect
  useEffect(() => {
    loadSystemStatus();

    if (isAutoRefresh) {
      const interval = setInterval(loadSystemStatus, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [isAutoRefresh]);

  // Handle manual trigger
  const handleTriggerExecution = async () => {
    setTriggerLoading(true);
    try {
      const payload = {
        workflow_id: 'results-content-optimizer',
        execution_parameters: {
          execution_mode: triggerForm.execution_mode,
          ...(triggerForm.target_sections.length > 0 && { target_sections: triggerForm.target_sections }),
          ...(triggerForm.target_pages.trim() && { target_pages: triggerForm.target_pages.split(',').map(p => p.trim()) }),
          confidence_threshold: triggerForm.confidence_threshold,
          force_regeneration: triggerForm.force_regeneration,
          ...(triggerForm.priority_filter && { priority_filter: triggerForm.priority_filter }),
        },
        trigger_metadata: {
          triggered_by: 'admin-manual',
          reason: triggerForm.reason || 'Manual execution from admin dashboard',
        }
      };

      const response = await fetch('/api/admin/results/trigger-optimization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (result.success) {
        setLastExecution({
          execution_id: result.execution_id,
          status: result.execution_status,
          message: result.message,
          pages_queued: result.pages_queued,
          estimated_duration_minutes: result.estimated_duration_minutes,
          created_at: new Date().toISOString()
        });

        // Refresh system status after trigger
        setTimeout(loadSystemStatus, 1000);
      } else {
        alert(`Execution failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error triggering execution:', error);
      alert('Failed to trigger execution. Check console for details.');
    } finally {
      setTriggerLoading(false);
    }
  };

  // Helper functions
  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'healthy': return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'degraded': return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'unhealthy': return <XCircle className="h-5 w-5 text-red-600" />;
      default: return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'text-green-600 bg-green-50 border-green-200';
      case 'degraded': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'unhealthy': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const handleSectionToggle = (section: string) => {
    setTriggerForm(prev => ({
      ...prev,
      target_sections: prev.target_sections.includes(section)
        ? prev.target_sections.filter(s => s !== section)
        : [...prev.target_sections, section]
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Bot className="h-8 w-8 text-blue-600" />
              Sub Agents Dashboard
            </h1>
            <p className="text-gray-600 mt-1">
              Administrative interface for managing and monitoring the results-content-optimizer sub-agent system
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={loadSystemStatus}
              disabled={statusLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${statusLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAutoRefresh(!isAutoRefresh)}
              className={`flex items-center gap-2 ${
                isAutoRefresh ? 'bg-green-50 text-green-700 border-green-200' : ''
              }`}
            >
              {isAutoRefresh ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              Auto-refresh {isAutoRefresh ? 'On' : 'Off'}
            </Button>
          </div>
        </div>

        {/* System Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">System Health</p>
                  <div className="flex items-center gap-2 mt-1">
                    {systemStatus ? getHealthIcon(systemStatus.system_health) : <Loader2 className="h-4 w-4 animate-spin" />}
                    <span className="font-semibold capitalize">
                      {systemStatus?.system_health || 'Loading...'}
                    </span>
                  </div>
                </div>
                <Gauge className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Agent Status</p>
                  <Badge className={systemStatus ? getHealthColor(systemStatus.content_optimizer.agent_status === 'available' ? 'healthy' : 'unhealthy') : ''}>
                    {systemStatus?.content_optimizer.agent_status || 'Loading...'}
                  </Badge>
                </div>
                <Bot className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Pages</p>
                  <p className="text-2xl font-bold">{systemStatus?.overview.total_pages || 0}</p>
                </div>
                <FileText className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Last Update</p>
                  <p className="text-sm font-medium">{lastRefresh.toLocaleTimeString()}</p>
                </div>
                <Clock className="h-8 w-8 text-gray-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard Tabs */}
        <Tabs defaultValue="trigger" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="trigger" className="flex items-center gap-2">
              <Play className="h-4 w-4" />
              Manual Trigger
            </TabsTrigger>
            <TabsTrigger value="status" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Status & Monitoring
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Execution History
            </TabsTrigger>
            <TabsTrigger value="configuration" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configuration
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <Terminal className="h-4 w-4" />
              System Logs
            </TabsTrigger>
          </TabsList>

          {/* Manual Trigger Tab */}
          <TabsContent value="trigger" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Manual Execution Trigger</CardTitle>
                  <CardDescription>
                    Manually trigger the results-content-optimizer workflow with custom parameters
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Execution Mode */}
                  <div className="space-y-2">
                    <Label htmlFor="execution-mode">Execution Mode</Label>
                    <Select
                      value={triggerForm.execution_mode}
                      onValueChange={(value: 'preview' | 'apply') =>
                        setTriggerForm(prev => ({ ...prev, execution_mode: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="preview">
                          <div className="flex items-center gap-2">
                            <Eye className="h-4 w-4" />
                            Preview Mode (Safe)
                          </div>
                        </SelectItem>
                        <SelectItem value="apply">
                          <div className="flex items-center gap-2">
                            <Zap className="h-4 w-4" />
                            Apply Mode (Makes Changes)
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {triggerForm.execution_mode === 'apply' && (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          Apply mode will make actual changes to content files. Use with caution.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>

                  {/* Target Sections */}
                  <div className="space-y-2">
                    <Label>Target Sections (leave empty for all)</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'strategy-plans', label: 'Strategy Plans', count: systemStatus?.overview.pages_by_section['strategy-plans'] || 0 },
                        { id: 'optimizely-dxp-tools', label: 'DXP Tools', count: systemStatus?.overview.pages_by_section['optimizely-dxp-tools'] || 0 },
                        { id: 'analytics-insights', label: 'Analytics Insights', count: systemStatus?.overview.pages_by_section['analytics-insights'] || 0 },
                        { id: 'experience-optimization', label: 'Experience Optimization', count: systemStatus?.overview.pages_by_section['experience-optimization'] || 0 },
                      ].map(section => (
                        <div key={section.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={section.id}
                            checked={triggerForm.target_sections.includes(section.id)}
                            onCheckedChange={() => handleSectionToggle(section.id)}
                          />
                          <Label htmlFor={section.id} className="text-sm">
                            {section.label} ({section.count})
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Target Pages */}
                  <div className="space-y-2">
                    <Label htmlFor="target-pages">Specific Pages (comma-separated)</Label>
                    <Textarea
                      id="target-pages"
                      placeholder="e.g., strategy-plans/osa/overview-dashboard, analytics-insights/content/overview"
                      value={triggerForm.target_pages}
                      onChange={(e) => setTriggerForm(prev => ({ ...prev, target_pages: e.target.value }))}
                      rows={3}
                    />
                  </div>

                  {/* Advanced Options */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="confidence-threshold">Confidence Threshold</Label>
                      <Input
                        id="confidence-threshold"
                        type="number"
                        min="0"
                        max="100"
                        value={triggerForm.confidence_threshold}
                        onChange={(e) => setTriggerForm(prev => ({ ...prev, confidence_threshold: parseInt(e.target.value) || 70 }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="priority-filter">Priority Filter</Label>
                      <Select
                        value={triggerForm.priority_filter?.toString() || 'all'}
                        onValueChange={(value) =>
                          setTriggerForm(prev => ({ ...prev, priority_filter: value && value !== 'all' ? parseInt(value) : undefined }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All priorities" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Priorities</SelectItem>
                          <SelectItem value="1">Priority 1 (High)</SelectItem>
                          <SelectItem value="2">Priority 2 (Medium)</SelectItem>
                          <SelectItem value="3">Priority 3 (Low)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Options */}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="force-regeneration"
                      checked={triggerForm.force_regeneration}
                      onCheckedChange={(checked) =>
                        setTriggerForm(prev => ({ ...prev, force_regeneration: !!checked }))
                      }
                    />
                    <Label htmlFor="force-regeneration" className="text-sm">
                      Force regeneration (ignore existing confidence scores)
                    </Label>
                  </div>

                  {/* Reason */}
                  <div className="space-y-2">
                    <Label htmlFor="reason">Reason for Execution</Label>
                    <Input
                      id="reason"
                      placeholder="e.g., Testing new content improvements"
                      value={triggerForm.reason}
                      onChange={(e) => setTriggerForm(prev => ({ ...prev, reason: e.target.value }))}
                    />
                  </div>

                  {/* Trigger Button */}
                  <Button
                    onClick={handleTriggerExecution}
                    disabled={triggerLoading}
                    className="w-full"
                    size="lg"
                  >
                    {triggerLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Triggering Execution...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Trigger {triggerForm.execution_mode === 'preview' ? 'Preview' : 'Execution'}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Execution Status */}
              <div className="space-y-4">
                {lastExecution && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Last Execution</CardTitle>
                      <CardDescription>
                        Recent execution status and details
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Execution ID:</span>
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">{lastExecution.execution_id}</code>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Status:</span>
                        <Badge variant={lastExecution.status === 'completed' ? 'default' : 'secondary'}>
                          {lastExecution.status}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Pages Queued:</span>
                        <span className="font-medium">{lastExecution.pages_queued}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Est. Duration:</span>
                        <span className="font-medium">{lastExecution.estimated_duration_minutes} min</span>
                      </div>
                      <div className="pt-2">
                        <p className="text-sm text-gray-600">{lastExecution.message}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => {
                        setTriggerForm({
                          execution_mode: 'preview',
                          target_sections: ['strategy-plans'],
                          target_pages: '',
                          confidence_threshold: 70,
                          force_regeneration: false,
                          priority_filter: 1,
                          reason: 'High priority strategy content preview'
                        });
                      }}
                    >
                      <Target className="h-4 w-4 mr-2" />
                      Preview High Priority Strategy
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => {
                        setTriggerForm({
                          execution_mode: 'preview',
                          target_sections: [],
                          target_pages: '',
                          confidence_threshold: 60,
                          force_regeneration: false,
                          priority_filter: undefined,
                          reason: 'Full system preview with lower confidence threshold'
                        });
                      }}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Full System Preview
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => {
                        setTriggerForm({
                          execution_mode: 'preview',
                          target_sections: [],
                          target_pages: '',
                          confidence_threshold: 70,
                          force_regeneration: true,
                          priority_filter: undefined,
                          reason: 'Force regeneration of all content for testing'
                        });
                      }}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Force Regenerate All
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Status & Monitoring Tab */}
          <TabsContent value="status" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* System Health */}
              <Card>
                <CardHeader>
                  <CardTitle>System Health</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Overall Status</span>
                    <div className="flex items-center gap-2">
                      {systemStatus ? getHealthIcon(systemStatus.system_health) : <Loader2 className="h-4 w-4 animate-spin" />}
                      <span className="font-medium capitalize">{systemStatus?.system_health || 'Loading...'}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Environment</span>
                    <Badge variant="outline">{systemStatus?.overview.environment || 'Unknown'}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Agent Status</span>
                    <Badge className={systemStatus ? getHealthColor(systemStatus.content_optimizer.agent_status === 'available' ? 'healthy' : 'unhealthy') : ''}>
                      {systemStatus?.content_optimizer.agent_status || 'Unknown'}
                    </Badge>
                  </div>
                  {systemStatus?.warnings && systemStatus.warnings.length > 0 && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="space-y-1">
                          {systemStatus.warnings.map((warning, index) => (
                            <div key={index} className="text-sm">{warning}</div>
                          ))}
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              {/* Performance Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Recent Executions</span>
                    <span className="font-medium">{systemStatus?.content_optimizer.recent_executions || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Success Rate (24h)</span>
                    <span className="font-medium">{systemStatus?.content_optimizer.success_rate_24h || 0}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Avg Confidence</span>
                    <span className="font-medium">{systemStatus?.content_optimizer.average_confidence_score || 0}%</span>
                  </div>
                </CardContent>
              </Card>

              {/* Content Coverage */}
              <Card>
                <CardHeader>
                  <CardTitle>Content Coverage</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {systemStatus?.overview.pages_by_section && Object.entries(systemStatus.overview.pages_by_section).map(([section, count]) => (
                    <div key={section} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 capitalize">
                        {section.replace('-', ' ')}
                      </span>
                      <span className="font-medium">{count} pages</span>
                    </div>
                  ))}
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">Total Pages</span>
                      <span className="font-bold">{systemStatus?.overview.total_pages || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Configuration Status */}
            {systemStatus?.configuration && (
              <Card>
                <CardHeader>
                  <CardTitle>Current Configuration</CardTitle>
                  <CardDescription>
                    Active system configuration and scheduling settings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Optimizer Mode</p>
                      <Badge variant="outline">{systemStatus.configuration.optimizer_mode}</Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Schedule Times</p>
                      <div className="space-y-1">
                        {systemStatus.configuration.schedule_times.map((time, index) => (
                          <div key={index} className="text-sm">{time}</div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Notification Email</p>
                      <p className="text-sm">{systemStatus.configuration.notification_email}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Confidence Threshold</p>
                      <p className="text-sm font-medium">{systemStatus.configuration.confidence_threshold}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Execution History Tab */}
          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Execution History</CardTitle>
                <CardDescription>
                  Historical record of workflow executions and their outcomes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <Clock className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg font-medium">Execution History</p>
                  <p className="text-sm">In a full implementation, this would show:</p>
                  <ul className="text-sm text-left mt-2 space-y-1 max-w-md mx-auto">
                    <li>• Execution timestamps and durations</li>
                    <li>• Success/failure status with details</li>
                    <li>• Pages processed and confidence scores</li>
                    <li>• Triggered by information and reasons</li>
                    <li>• Rollback capabilities for failed executions</li>
                  </ul>
                  <div className="mt-4">
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export History
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Configuration Tab */}
          <TabsContent value="configuration" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>System Configuration</CardTitle>
                <CardDescription>
                  Advanced configuration settings for the results-content-optimizer system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <Settings className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg font-medium">Configuration Management</p>
                  <p className="text-sm">In a full implementation, this would allow:</p>
                  <ul className="text-sm text-left mt-2 space-y-1 max-w-md mx-auto">
                    <li>• Adjusting default confidence thresholds</li>
                    <li>• Modifying schedule times and frequency</li>
                    <li>• Configuring notification recipients</li>
                    <li>• Setting up custom trigger rules</li>
                    <li>• Managing agent parameters and tools</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Logs Tab */}
          <TabsContent value="logs" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">System Logs</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export Logs
                </Button>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </div>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm overflow-auto h-96">
                  {[
                    `[${new Date().toISOString()}] 🤖 Results Content Optimizer system initialized`,
                    `[${new Date().toISOString()}] 📊 System status check completed - Status: ${systemStatus?.system_health || 'checking...'}`,
                    `[${new Date().toISOString()}] 🔧 Configuration loaded: ${systemStatus?.configuration.optimizer_mode || 'unknown'} mode`,
                    `[${new Date().toISOString()}] 📋 Total pages registered: ${systemStatus?.overview.total_pages || 0}`,
                    `[${new Date().toISOString()}] 📅 Schedule configured: ${systemStatus?.configuration.schedule_times?.join(', ') || 'loading...'}`,
                    `[${new Date().toISOString()}] 💬 Notifications configured for: ${systemStatus?.configuration.notification_email || 'loading...'}`,
                    `[${new Date().toISOString()}] ⚙️ Agent status: ${systemStatus?.content_optimizer.agent_status || 'checking...'}`,
                    `[${new Date().toISOString()}] 🎯 Confidence threshold: ${systemStatus?.configuration.confidence_threshold || 70}%`,
                    lastExecution ? `[${new Date(lastExecution.created_at).toISOString()}] 🚀 Manual execution triggered: ${lastExecution.execution_id}` : '',
                    lastExecution ? `[${new Date(lastExecution.created_at).toISOString()}] 📝 Execution status: ${lastExecution.status} - ${lastExecution.message}` : '',
                  ].filter(Boolean).map((log, index) => (
                    <div key={index} className="mb-1">{log}</div>
                  ))}
                  <div className="mb-1 text-gray-500">
                    [Live log streaming would continue here in production...]
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}