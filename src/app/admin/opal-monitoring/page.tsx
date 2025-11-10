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
import AgentMonitoringDashboard from '@/components/AgentMonitoringDashboard';
import RealTimeAgentStatus from '@/components/RealTimeAgentStatus';
import StrategyAssistantWorkflowMonitor from '@/components/StrategyAssistantWorkflowMonitor';
import {
  Activity,
  RefreshCw,
  Play,
  Pause,
  Download,
  Settings,
  BarChart3,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Zap,
  Database,
  Network,
  Terminal,
  TestTube,
  Monitor,
  Workflow
} from 'lucide-react';

/**
 * OPAL Agent Monitoring - Admin Dashboard
 *
 * Comprehensive admin interface for monitoring all 9 OPAL agents,
 * webhook events, validation results, and system performance.
 */
export default function OPALMonitoringPage() {
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [systemStatus, setSystemStatus] = useState<'healthy' | 'warning' | 'critical'>('healthy');
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connected');
  const [webhookStats, setWebhookStats] = useState({
    total_received: 0,
    successful: 0,
    failed: 0,
    last_24h: 0
  });

  // Auto-refresh effect
  useEffect(() => {
    if (!isAutoRefresh) return;

    const interval = setInterval(() => {
      setLastRefresh(new Date());
      // Simulate updating stats (in real app, would fetch from API)
      setWebhookStats(prev => ({
        ...prev,
        total_received: prev.total_received + Math.floor(Math.random() * 3),
        successful: prev.successful + Math.floor(Math.random() * 2),
        failed: prev.failed + Math.floor(Math.random() * 0.3),
        last_24h: prev.last_24h + Math.floor(Math.random() * 2)
      }));
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [isAutoRefresh]);

  const handleManualRefresh = () => {
    setLastRefresh(new Date());
    console.log('🔄 Manual refresh triggered');
  };

  const handleRunSimulator = async () => {
    try {
      console.log('🎭 Running OPAL simulator...');
      // In a real implementation, this would call the simulator API
      alert('OPAL Simulator started! Check the console and agent dashboard for updates.');
    } catch (error) {
      console.error('Failed to start simulator:', error);
    }
  };

  const exportData = () => {
    console.log('📊 Exporting monitoring data...');
    alert('Export functionality would download agent monitoring data as CSV/JSON');
  };

  const getStatusIcon = (status: typeof systemStatus) => {
    switch (status) {
      case 'healthy': return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'critical': return <XCircle className="h-5 w-5 text-red-600" />;
    }
  };

  const getConnectionStatusColor = (status: typeof connectionStatus) => {
    switch (status) {
      case 'connected': return 'text-green-600 bg-green-50 border-green-200';
      case 'connecting': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'disconnected': return 'text-red-600 bg-red-50 border-red-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Monitor className="h-8 w-8 text-blue-600" />
              OPAL Agent Monitoring
            </h1>
            <p className="text-gray-600 mt-1">
              Administrative dashboard for monitoring Optimizely Opal agent performance and webhook events
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualRefresh}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
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
                  <p className="text-sm font-medium text-gray-600">System Status</p>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusIcon(systemStatus)}
                    <span className="font-semibold capitalize">{systemStatus}</span>
                  </div>
                </div>
                <Activity className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Connection</p>
                  <Badge className={`mt-1 ${getConnectionStatusColor(connectionStatus)}`}>
                    {connectionStatus}
                  </Badge>
                </div>
                <Network className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Webhooks (24h)</p>
                  <p className="text-2xl font-bold">{webhookStats.last_24h}</p>
                </div>
                <Zap className="h-8 w-8 text-purple-500" />
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
        <Tabs defaultValue="agents" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="agents" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Agent Status
            </TabsTrigger>
            <TabsTrigger value="webhooks" className="flex items-center gap-2">
              <Network className="h-4 w-4" />
              Webhook Events
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="testing" className="flex items-center gap-2">
              <TestTube className="h-4 w-4" />
              Testing Tools
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <Terminal className="h-4 w-4" />
              System Logs
            </TabsTrigger>
          </TabsList>

          {/* Agent Status Tab */}
          <TabsContent value="agents" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>OPAL Workflow & Agent Status</CardTitle>
                    <CardDescription>
                      Strategy Assistant workflow execution with 9 OPAL agents monitoring
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Workflow Agent */}
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-3">
                        <Badge className="bg-blue-600 text-white">
                          <Activity className="h-3 w-3 mr-1" />
                          WORKFLOW
                        </Badge>
                        <div className="flex-1">
                          <h3 className="font-semibold text-blue-900">strategy_assistant_workflow.json</h3>
                          <p className="text-sm text-blue-700">Main workflow orchestrating all OPAL agents</p>
                        </div>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                          Ready
                        </Badge>
                      </div>
                    </div>

                    {/* Agent List */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-700 text-sm uppercase tracking-wide">OPAL Agents</h4>

                      {/* Integration Health Agent */}
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Badge className="bg-purple-600 text-white">
                          <Monitor className="h-3 w-3 mr-1" />
                          HEALTH
                        </Badge>
                        <div className="flex-1">
                          <h5 className="font-medium">integration_health.json</h5>
                          <p className="text-sm text-gray-600">Monitors DXP integration status and health metrics</p>
                        </div>
                        <Badge variant="outline">Idle</Badge>
                      </div>

                      {/* Content Review Agent */}
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Badge className="bg-green-600 text-white">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          CONTENT
                        </Badge>
                        <div className="flex-1">
                          <h5 className="font-medium">content_review.json</h5>
                          <p className="text-sm text-gray-600">Analyzes experiment content and variations</p>
                        </div>
                        <Badge variant="outline">Idle</Badge>
                      </div>

                      {/* GEO Audit Agent */}
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Badge className="bg-orange-600 text-white">
                          <Zap className="h-3 w-3 mr-1" />
                          GEO
                        </Badge>
                        <div className="flex-1">
                          <h5 className="font-medium">geo_audit.json</h5>
                          <p className="text-sm text-gray-600">Generative Engine Optimization audit to optimize content for AI search engines</p>
                        </div>
                        <Badge variant="outline">Idle</Badge>
                      </div>

                      {/* Audience Suggester Agent */}
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Badge className="bg-indigo-600 text-white">
                          <BarChart3 className="h-3 w-3 mr-1" />
                          AUDIENCE
                        </Badge>
                        <div className="flex-1">
                          <h5 className="font-medium">audience_suggester.json</h5>
                          <p className="text-sm text-gray-600">Analyzes audience segment performance</p>
                        </div>
                        <Badge variant="outline">Idle</Badge>
                      </div>

                      {/* Experiment Blueprinter Agent */}
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Badge className="bg-cyan-600 text-white">
                          <TestTube className="h-3 w-3 mr-1" />
                          EXPERIMENT
                        </Badge>
                        <div className="flex-1">
                          <h5 className="font-medium">experiment_blueprinter.json</h5>
                          <p className="text-sm text-gray-600">Creates detailed experiment plans</p>
                        </div>
                        <Badge variant="outline">Idle</Badge>
                      </div>

                      {/* Personalization Idea Generator */}
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Badge className="bg-pink-600 text-white">
                          <Settings className="h-3 w-3 mr-1" />
                          PERSONAL
                        </Badge>
                        <div className="flex-1">
                          <h5 className="font-medium">personalization_idea_generator.json</h5>
                          <p className="text-sm text-gray-600">Generates personalization strategies</p>
                        </div>
                        <Badge variant="outline">Idle</Badge>
                      </div>

                      {/* Customer Journey Agent */}
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Badge className="bg-teal-600 text-white">
                          <Activity className="h-3 w-3 mr-1" />
                          JOURNEY
                        </Badge>
                        <div className="flex-1">
                          <h5 className="font-medium">customer_journey.json</h5>
                          <p className="text-sm text-gray-600">Maps customer journey touchpoints and optimization opportunities</p>
                        </div>
                        <Badge variant="outline">Idle</Badge>
                      </div>

                      {/* Roadmap Generator Agent */}
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Badge className="bg-yellow-600 text-white">
                          <Clock className="h-3 w-3 mr-1" />
                          ROADMAP
                        </Badge>
                        <div className="flex-1">
                          <h5 className="font-medium">roadmap_generator.json</h5>
                          <p className="text-sm text-gray-600">Generates implementation roadmaps and project timelines</p>
                        </div>
                        <Badge variant="outline">Idle</Badge>
                      </div>

                      {/* CMP Organizer Agent */}
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Badge className="bg-red-600 text-white">
                          <Database className="h-3 w-3 mr-1" />
                          CMP
                        </Badge>
                        <div className="flex-1">
                          <h5 className="font-medium">cmp_organizer.json</h5>
                          <p className="text-sm text-gray-600">Organizes campaign management platform workflows</p>
                        </div>
                        <Badge variant="outline">Idle</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Workflow Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Total Agents</span>
                        <span className="font-semibold">9</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Active</span>
                        <span className="font-semibold text-blue-600">0</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Completed</span>
                        <span className="font-semibold text-green-600">0</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Failed</span>
                        <span className="font-semibold text-red-600">0</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-center text-gray-500 py-4">
                      <Activity className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm">No workflow activity yet</p>
                      <p className="text-xs text-gray-400">Start workflow to see agent execution</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Webhook Events Tab */}
          <TabsContent value="webhooks" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{webhookStats.total_received}</p>
                    <p className="text-sm text-gray-600">Total Received</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{webhookStats.successful}</p>
                    <p className="text-sm text-gray-600">Successful</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-600">{webhookStats.failed}</p>
                    <p className="text-sm text-gray-600">Failed</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Webhook Events</CardTitle>
                <CardDescription>
                  Live stream of incoming webhook events and processing status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { type: 'osa_workflow_data.received', agent: 'content_review', status: 'success', time: '10:34:22' },
                    { type: 'agent.completed', agent: 'geo_audit', status: 'success', time: '10:33:45' },
                    { type: 'osa_workflow_data.received', agent: 'audience_suggester', status: 'failed', time: '10:32:18' },
                    { type: 'workflow.triggered', agent: 'all', status: 'success', time: '10:30:00' }
                  ].map((event, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant={event.status === 'success' ? 'default' : 'destructive'}>
                          {event.type}
                        </Badge>
                        <span className="text-sm font-medium">{event.agent}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {event.status === 'success' ?
                          <CheckCircle2 className="h-4 w-4 text-green-600" /> :
                          <XCircle className="h-4 w-4 text-red-600" />
                        }
                        <span className="text-sm text-gray-500">{event.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold">2.3s</p>
                    <p className="text-sm text-gray-600">Avg Response Time</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold">99.2%</p>
                    <p className="text-sm text-gray-600">Success Rate</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold">156</p>
                    <p className="text-sm text-gray-600">Requests/Hour</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold">99.8%</p>
                    <p className="text-sm text-gray-600">Uptime</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>
                  System performance and resource utilization over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                  <div className="text-center text-gray-500">
                    <BarChart3 className="h-12 w-12 mx-auto mb-2" />
                    <p>Performance charts would be rendered here</p>
                    <p className="text-sm">Integration with monitoring service (e.g., DataDog, New Relic)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Testing Tools Tab */}
          <TabsContent value="testing" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>OPAL Webhook Simulator</CardTitle>
                  <CardDescription>
                    Test the OPAL connector with realistic webhook data
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button onClick={handleRunSimulator} className="w-full">
                    <TestTube className="h-4 w-4 mr-2" />
                    Run Full Workflow Simulation
                  </Button>

                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm">
                      Test Single Agent
                    </Button>
                    <Button variant="outline" size="sm">
                      Test Failures
                    </Button>
                  </div>

                  <div className="text-sm text-gray-600 p-3 bg-blue-50 rounded">
                    <p><strong>CLI Usage:</strong></p>
                    <code className="text-xs">npx tsx scripts/test-opal-simulator.ts demo</code>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Validation Testing</CardTitle>
                  <CardDescription>
                    Test data validation and error handling
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button variant="outline" className="w-full">
                    Test Data Validation
                  </Button>
                  <Button variant="outline" className="w-full">
                    Test Error Scenarios
                  </Button>
                  <Button variant="outline" className="w-full">
                    Performance Load Test
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>API Endpoints Status</CardTitle>
                <CardDescription>
                  Monitor the health of OPAL connector API endpoints
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { endpoint: '/api/opal/discovery', status: 'healthy', response_time: '45ms' },
                    { endpoint: '/api/opal/osa-workflow', status: 'healthy', response_time: '120ms' },
                    { endpoint: '/api/webhooks/opal', status: 'healthy', response_time: '80ms' }
                  ].map((api, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <code className="text-sm font-mono">{api.endpoint}</code>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          {api.status}
                        </Badge>
                        <span className="text-sm text-gray-500">{api.response_time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Logs Tab */}
          <TabsContent value="logs" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">System Logs</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={exportData}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Logs
                </Button>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Log Settings
                </Button>
              </div>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm overflow-auto h-96">
                  {[
                    `[${new Date().toISOString()}] 🚀 OSA Connector received workflow data: workflow_abc123`,
                    `[${new Date().toISOString()}] 🔍 Validating OSA workflow data structure and content...`,
                    `[${new Date().toISOString()}] ✅ OSA workflow validation passed successfully`,
                    `[${new Date().toISOString()}] 📊 Agent Content Review Agent (content_review) data received`,
                    `[${new Date().toISOString()}] 🔄 Processing agent Content Review Agent (content_review)...`,
                    `[${new Date().toISOString()}] 🔄 Forwarding OSA agent data to webhook handler`,
                    `[${new Date().toISOString()}] ✅ Agent Content Review Agent (content_review) data processed successfully`,
                    `[${new Date().toISOString()}] 📊 Agent processing summary: 9/9 agents processed successfully`,
                    `[${new Date().toISOString()}] ✅ OSA workflow data processed successfully in 2847ms`
                  ].map((log, index) => (
                    <div key={index} className="mb-1">{log}</div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}