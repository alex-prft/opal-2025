/**
 * Real-Time Monitoring Panel Component
 * SSE-based live updates for optimization triggers, workflow progress, and health scores
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Activity,
  Zap,
  CheckCircle,
  AlertCircle,
  Clock,
  BarChart3,
  RefreshCw,
  PlayCircle,
  PauseCircle,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';

interface WorkflowProgress {
  workflow_id: string;
  agent_name: string;
  mapping_type: string;
  status: 'running' | 'completed' | 'failed' | 'queued';
  progress: number;
  started_at: string;
  estimated_completion?: string;
  current_step: string;
  total_steps: number;
  completed_steps: number;
}

interface OptimizationTrigger {
  id: string;
  trigger_type: 'performance' | 'threshold' | 'scheduled' | 'manual';
  domain: string;
  condition: string;
  triggered_at: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'processing' | 'resolved' | 'ignored';
}

interface HealthMetric {
  metric_name: string;
  current_value: number;
  target_value: number;
  trend: 'up' | 'down' | 'stable';
  health_score: number;
  last_updated: string;
}

interface SystemMetrics {
  api_response_time: number;
  active_connections: number;
  cache_hit_rate: number;
  error_rate: number;
  throughput: number;
}

export function RealTimeMonitoringPanel() {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [workflows, setWorkflows] = useState<WorkflowProgress[]>([]);
  const [triggers, setTriggers] = useState<OptimizationTrigger[]>([]);
  const [healthMetrics, setHealthMetrics] = useState<HealthMetric[]>([]);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');

  // SSE connection for real-time updates
  const connectSSE = useCallback(() => {
    if (typeof window === 'undefined') return;

    setConnectionStatus('connecting');

    // Mock SSE connection - replace with actual SSE endpoint
    const mockSSE = () => {
      setConnectionStatus('connected');

      // Simulate real-time updates
      const updateInterval = setInterval(() => {
        // Update workflows
        setWorkflows(prev => {
          const updated = prev.map(workflow => {
            if (workflow.status === 'running' && workflow.progress < 100) {
              const newProgress = Math.min(workflow.progress + Math.random() * 10, 100);
              const newStatus = newProgress >= 100 ? 'completed' : 'running';
              return {
                ...workflow,
                progress: newProgress,
                status: newStatus as any,
                completed_steps: Math.floor((newProgress / 100) * workflow.total_steps)
              };
            }
            return workflow;
          });

          // Add new workflows occasionally
          if (Math.random() < 0.1 && updated.length < 5) {
            const agents = ['content_review', 'audience_suggester', 'experiment_blueprinter', 'integration_health'];
            const mappings = ['strategy-plans', 'dxp-tools', 'analytics-insights', 'experience-optimization'];
            const newWorkflow: WorkflowProgress = {
              workflow_id: Date.now().toString(),
              agent_name: agents[Math.floor(Math.random() * agents.length)],
              mapping_type: mappings[Math.floor(Math.random() * mappings.length)],
              status: 'running',
              progress: 0,
              started_at: new Date().toISOString(),
              current_step: 'Initializing workflow',
              total_steps: Math.floor(Math.random() * 5) + 3,
              completed_steps: 0
            };
            updated.push(newWorkflow);
          }

          return updated;
        });

        // Update triggers
        setTriggers(prev => {
          const updated = [...prev];
          if (Math.random() < 0.15 && updated.length < 8) {
            const triggerTypes = ['performance', 'threshold', 'scheduled'] as const;
            const domains = ['content', 'experimentation', 'personalization', 'ux', 'technology'];
            const severities = ['low', 'medium', 'high'] as const;
            const newTrigger: OptimizationTrigger = {
              id: Date.now().toString(),
              trigger_type: triggerTypes[Math.floor(Math.random() * triggerTypes.length)],
              domain: domains[Math.floor(Math.random() * domains.length)],
              condition: 'Performance threshold exceeded',
              triggered_at: new Date().toISOString(),
              severity: severities[Math.floor(Math.random() * severities.length)],
              status: 'pending'
            };
            updated.unshift(newTrigger);
          }
          return updated.slice(0, 8);
        });

        // Update health metrics
        setHealthMetrics(prev => prev.map(metric => ({
          ...metric,
          current_value: Math.max(0, metric.current_value + (Math.random() - 0.5) * 10),
          health_score: Math.min(100, Math.max(0, metric.health_score + (Math.random() - 0.5) * 5)),
          trend: Math.random() < 0.33 ? 'up' : Math.random() < 0.66 ? 'down' : 'stable',
          last_updated: new Date().toISOString()
        })));

        // Update system metrics
        setSystemMetrics(prev => prev ? {
          api_response_time: Math.max(20, prev.api_response_time + (Math.random() - 0.5) * 20),
          active_connections: Math.max(0, prev.active_connections + Math.floor((Math.random() - 0.5) * 10)),
          cache_hit_rate: Math.min(100, Math.max(60, prev.cache_hit_rate + (Math.random() - 0.5) * 5)),
          error_rate: Math.min(10, Math.max(0, prev.error_rate + (Math.random() - 0.5) * 0.5)),
          throughput: Math.max(0, prev.throughput + (Math.random() - 0.5) * 50)
        } : null);
      }, 2000);

      return () => {
        clearInterval(updateInterval);
        setConnectionStatus('disconnected');
      };
    };

    return mockSSE();
  }, []);

  // Initialize monitoring data
  useEffect(() => {
    // Load initial data
    const loadInitialData = () => {
      const initialWorkflows: WorkflowProgress[] = [
        {
          workflow_id: '1',
          agent_name: 'content_review',
          mapping_type: 'analytics-insights',
          status: 'running',
          progress: 65,
          started_at: new Date(Date.now() - 120000).toISOString(),
          current_step: 'Analyzing content performance',
          total_steps: 4,
          completed_steps: 2
        },
        {
          workflow_id: '2',
          agent_name: 'experiment_blueprinter',
          mapping_type: 'experience-optimization',
          status: 'completed',
          progress: 100,
          started_at: new Date(Date.now() - 300000).toISOString(),
          current_step: 'Experiment analysis complete',
          total_steps: 3,
          completed_steps: 3
        }
      ];

      const initialTriggers: OptimizationTrigger[] = [
        {
          id: '1',
          trigger_type: 'performance',
          domain: 'content',
          condition: 'Engagement rate below threshold (< 0.75)',
          triggered_at: new Date(Date.now() - 60000).toISOString(),
          severity: 'medium',
          status: 'processing'
        },
        {
          id: '2',
          trigger_type: 'threshold',
          domain: 'ux',
          condition: 'Page load time exceeds 3 seconds',
          triggered_at: new Date(Date.now() - 180000).toISOString(),
          severity: 'high',
          status: 'resolved'
        }
      ];

      const initialHealthMetrics: HealthMetric[] = [
        {
          metric_name: 'Overall System Health',
          current_value: 92,
          target_value: 95,
          trend: 'stable',
          health_score: 92,
          last_updated: new Date().toISOString()
        },
        {
          metric_name: 'Optimization Effectiveness',
          current_value: 88,
          target_value: 90,
          trend: 'up',
          health_score: 88,
          last_updated: new Date().toISOString()
        },
        {
          metric_name: 'Cross-Domain Coordination',
          current_value: 94,
          target_value: 95,
          trend: 'stable',
          health_score: 94,
          last_updated: new Date().toISOString()
        },
        {
          metric_name: 'Agent Performance',
          current_value: 91,
          target_value: 92,
          trend: 'up',
          health_score: 91,
          last_updated: new Date().toISOString()
        }
      ];

      const initialSystemMetrics: SystemMetrics = {
        api_response_time: 85,
        active_connections: 42,
        cache_hit_rate: 94,
        error_rate: 0.02,
        throughput: 1247
      };

      setWorkflows(initialWorkflows);
      setTriggers(initialTriggers);
      setHealthMetrics(initialHealthMetrics);
      setSystemMetrics(initialSystemMetrics);
    };

    loadInitialData();
  }, []);

  // Handle monitoring toggle
  useEffect(() => {
    let cleanup: (() => void) | undefined;

    if (isMonitoring) {
      cleanup = connectSSE();
    }

    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  }, [isMonitoring, connectSSE]);

  const toggleMonitoring = () => {
    setIsMonitoring(!isMonitoring);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': case 'processing': return 'text-blue-600';
      case 'completed': case 'resolved': return 'text-green-600';
      case 'failed': return 'text-red-600';
      case 'queued': case 'pending': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': case 'processing': return <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />;
      case 'completed': case 'resolved': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed': return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'queued': case 'pending': return <Clock className="h-4 w-4 text-yellow-600" />;
      default: return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getSeverityColor = (severity: OptimizationTrigger['severity']) => {
    switch (severity) {
      case 'low': return 'bg-blue-100 text-blue-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
    }
  };

  const getTrendIcon = (trend: HealthMetric['trend']) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-3 w-3 text-green-600" />;
      case 'down': return <TrendingDown className="h-3 w-3 text-red-600" />;
      case 'stable': return <Minus className="h-3 w-3 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">Real-Time Monitoring</h2>
          <p className="text-gray-600 mt-1">
            Live monitoring of workflows, optimization triggers, and system health
          </p>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-500' :
              connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' :
              'bg-red-500'
            }`}></div>
            <span className="text-sm text-gray-600 capitalize">{connectionStatus}</span>
          </div>

          <Button
            variant={isMonitoring ? "default" : "outline"}
            size="sm"
            onClick={toggleMonitoring}
          >
            {isMonitoring ? (
              <>
                <PauseCircle className="h-4 w-4 mr-2" />
                Stop Monitoring
              </>
            ) : (
              <>
                <PlayCircle className="h-4 w-4 mr-2" />
                Start Monitoring
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Connection Status Alert */}
      {connectionStatus === 'disconnected' && isMonitoring && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Unable to establish real-time connection. Monitoring data may be outdated.
          </AlertDescription>
        </Alert>
      )}

      {/* System Metrics Overview */}
      {systemMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold">{systemMetrics.api_response_time.toFixed(0)}ms</p>
                <p className="text-sm text-gray-600">API Response</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold">{systemMetrics.active_connections}</p>
                <p className="text-sm text-gray-600">Active Connections</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold">{systemMetrics.cache_hit_rate.toFixed(1)}%</p>
                <p className="text-sm text-gray-600">Cache Hit Rate</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold">{systemMetrics.error_rate.toFixed(3)}%</p>
                <p className="text-sm text-gray-600">Error Rate</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold">{systemMetrics.throughput.toFixed(0)}</p>
                <p className="text-sm text-gray-600">Throughput/min</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Workflow Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Active Workflows</span>
            </CardTitle>
            <CardDescription>
              Real-time progress of OPAL agent workflows
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {workflows.length > 0 ? workflows.map((workflow) => (
                <div key={workflow.workflow_id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(workflow.status)}
                      <span className="font-medium">{workflow.agent_name}</span>
                      <Badge variant="outline">{workflow.mapping_type}</Badge>
                    </div>
                    <Badge variant={workflow.status === 'completed' ? 'default' : 'secondary'}>
                      {workflow.status}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">{workflow.current_step}</span>
                      <span className="font-medium">{workflow.progress.toFixed(0)}%</span>
                    </div>
                    <Progress value={workflow.progress} className="h-2" />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Step {workflow.completed_steps}/{workflow.total_steps}</span>
                      <span>Started {new Date(workflow.started_at).toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8 text-gray-500">
                  No active workflows
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Optimization Triggers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="h-5 w-5" />
              <span>Optimization Triggers</span>
            </CardTitle>
            <CardDescription>
              Live optimization triggers and alerts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {triggers.length > 0 ? triggers.map((trigger) => (
                <div key={trigger.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(trigger.status)}
                      <span className="font-medium text-sm">{trigger.domain}</span>
                      <Badge className={getSeverityColor(trigger.severity)}>
                        {trigger.severity}
                      </Badge>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {trigger.trigger_type}
                    </Badge>
                  </div>

                  <p className="text-sm text-gray-600">{trigger.condition}</p>

                  <div className="text-xs text-gray-500">
                    {new Date(trigger.triggered_at).toLocaleString()}
                  </div>
                </div>
              )) : (
                <div className="text-center py-8 text-gray-500">
                  No recent triggers
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Health Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Health Score Visualization</span>
          </CardTitle>
          <CardDescription>
            Real-time health metrics across all optimization domains
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {healthMetrics.map((metric) => (
              <div key={metric.metric_name} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">{metric.metric_name}</h4>
                  {getTrendIcon(metric.trend)}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Current: {metric.current_value.toFixed(0)}</span>
                    <span className="text-gray-600">Target: {metric.target_value}</span>
                  </div>
                  <Progress value={metric.health_score} className="h-2" />
                  <div className="text-xs text-gray-500">
                    Score: {metric.health_score.toFixed(0)}% • {new Date(metric.last_updated).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}