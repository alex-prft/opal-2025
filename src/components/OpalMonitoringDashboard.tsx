'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock,
  RefreshCw,
  Zap,
  Target,
  TrendingUp,
  BarChart3,
  AlertTriangle,
  Server,
  Database,
  Webhook
} from 'lucide-react';
import { agentStatusTracker, AgentStatusInfo, WorkflowProgress } from '@/lib/monitoring/agent-status-tracker';
import { monitoringErrorHandler } from '@/lib/monitoring/error-handler';
import RealTimeAgentStatus from './RealTimeAgentStatus';

interface OpalMonitoringDashboardProps {
  className?: string;
}

export default function OpalMonitoringDashboard({ className }: OpalMonitoringDashboardProps) {
  const [currentWorkflows, setCurrentWorkflows] = useState<WorkflowProgress[]>([]);
  const [systemHealth, setSystemHealth] = useState<{
    overall: 'healthy' | 'degraded' | 'unhealthy';
    components: Record<string, { status: string; details?: any }>;
  }>({ overall: 'healthy', components: {} });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Load monitoring data
  useEffect(() => {
    const loadMonitoringData = async () => {
      try {
        // Get current workflows
        const workflowMap = new Map(Array.from({ length: 5 }).map((_, i) => {
          const mockWorkflowId = `workflow-${Date.now()}-${i}`;
          return [mockWorkflowId, {
            workflow_id: mockWorkflowId,
            workflow_name: `IFPA Strategy Analysis ${i + 1}`,
            status: i === 0 ? 'running' as const : i === 1 ? 'completed' as const : 'triggered' as const,
            agents_total: 5,
            agents_completed: i === 1 ? 5 : Math.floor(Math.random() * 5),
            agents_failed: i === 2 ? 1 : 0,
            started_at: new Date(Date.now() - (i + 1) * 300000).toISOString(),
            agents: []
          }];
        }));

        setCurrentWorkflows(Array.from(workflowMap.values()));

        // Get system health
        const health = await monitoringErrorHandler.performHealthCheck();
        setSystemHealth(health);

        setLastRefresh(new Date());
      } catch (error) {
        console.error('Failed to load monitoring data:', error);
      }
    };

    loadMonitoringData();

    // Subscribe to workflow updates
    const unsubscribeWorkflow = agentStatusTracker.subscribeToWorkflow((progress: WorkflowProgress) => {
      setCurrentWorkflows(prev => {
        const updated = [...prev];
        const index = updated.findIndex(w => w.workflow_id === progress.workflow_id);
        if (index >= 0) {
          updated[index] = progress;
        } else {
          updated.unshift(progress);
        }
        return updated.slice(0, 10); // Keep only last 10 workflows
      });
    });

    // Periodic refresh
    const interval = setInterval(loadMonitoringData, 10000); // Every 10 seconds

    return () => {
      unsubscribeWorkflow();
      clearInterval(interval);
    };
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const health = await monitoringErrorHandler.performHealthCheck();
      setSystemHealth(health);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Failed to refresh monitoring data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleTestWorkflow = async () => {
    try {
      const testWorkflowId = `test-workflow-${Date.now()}`;
      await agentStatusTracker.initializeWorkflow(testWorkflowId, 'Test Workflow');

      // Simulate agent progress
      setTimeout(() => {
        agentStatusTracker.simulateAgentProgress(testWorkflowId, 'Test Workflow');
      }, 1000);
    } catch (error) {
      console.error('Failed to start test workflow:', error);
    }
  };

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'degraded':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'unhealthy':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getHealthBadgeColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800';
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800';
      case 'unhealthy':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getWorkflowStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'running':
        return <Activity className="h-4 w-4 text-blue-600 animate-pulse" />;
      case 'triggered':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Server className="h-6 w-6 text-blue-600" />
            OPAL Ingestion & Orchestration Service
          </h2>
          <p className="text-gray-600 mt-1">Real-time monitoring and status tracking for OPAL agents</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={getHealthBadgeColor(systemHealth.overall)}>
            {getHealthIcon(systemHealth.overall)}
            <span className="ml-1 capitalize">{systemHealth.overall}</span>
          </Badge>
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Real-time Agent Status */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              Agent Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RealTimeAgentStatus />
            <div className="mt-4 pt-4 border-t">
              <Button
                onClick={handleTestWorkflow}
                variant="outline"
                size="sm"
                className="w-full"
              >
                <Zap className="h-4 w-4 mr-2" />
                Test Workflow
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* System Health */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-600" />
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(systemHealth.components).map(([component, health]) => (
                <div key={component} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {component === 'database' ? (
                      <Database className="h-4 w-4 text-gray-500" />
                    ) : component === 'webhook' ? (
                      <Webhook className="h-4 w-4 text-gray-500" />
                    ) : (
                      <Server className="h-4 w-4 text-gray-500" />
                    )}
                    <span className="text-sm font-medium capitalize">
                      {component.replace(/([A-Z])/g, ' $1')}
                    </span>
                  </div>
                  <Badge className={getHealthBadgeColor(health.status)} variant="secondary">
                    {getHealthIcon(health.status)}
                    <span className="ml-1 capitalize">{health.status}</span>
                  </Badge>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t text-xs text-gray-500">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </div>
          </CardContent>
        </Card>

        {/* Workflow Statistics */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              Workflow Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(() => {
                const stats = currentWorkflows.reduce((acc, workflow) => {
                  acc[workflow.status] = (acc[workflow.status] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>);

                const total = currentWorkflows.length;

                return (
                  <div className="space-y-3">
                    {[
                      { status: 'completed', icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-100' },
                      { status: 'running', icon: Activity, color: 'text-blue-600', bg: 'bg-blue-100' },
                      { status: 'failed', icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-100' },
                      { status: 'triggered', icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100' }
                    ].map(({ status, icon: Icon, color, bg }) => {
                      const count = stats[status] || 0;
                      const percentage = total > 0 ? (count / total) * 100 : 0;

                      return (
                        <div key={status} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <div className={`p-1 rounded ${bg}`}>
                                <Icon className={`h-3 w-3 ${color}`} />
                              </div>
                              <span className="capitalize">{status}</span>
                            </div>
                            <span className="font-medium">{count}</span>
                          </div>
                          <Progress value={percentage} className="h-1" />
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </CardContent>
        </Card>

        {/* Recent Workflows */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-indigo-600" />
              Recent Workflows
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {currentWorkflows.slice(0, 5).map((workflow) => (
                <div key={workflow.workflow_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {getWorkflowStatusIcon(workflow.status)}
                    <div>
                      <div className="font-medium text-sm">{workflow.workflow_name}</div>
                      <div className="text-xs text-gray-500">
                        Started {new Date(workflow.started_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {workflow.agents_completed + workflow.agents_failed}/{workflow.agents_total} agents
                    </div>
                    <div className="text-xs text-gray-500">
                      {Math.round(((workflow.agents_completed + workflow.agents_failed) / workflow.agents_total) * 100)}% complete
                    </div>
                  </div>
                </div>
              ))}
              {currentWorkflows.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No recent workflows</p>
                  <p className="text-sm">Start a workflow to see monitoring data</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}