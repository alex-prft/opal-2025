'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import LoadingAnimation from '@/components/LoadingAnimation';
import {
  Workflow,
  Play,
  Pause,
  RefreshCw,
  Settings,
  Bell,
  CheckCircle,
  AlertCircle,
  Clock,
  ExternalLink,
  Copy,
  Download
} from 'lucide-react';

interface WorkflowStatus {
  workflow_id: string;
  workflow_name: string;
  status: 'active' | 'completed' | 'failed' | 'triggered' | 'paused';
  last_updated: string;
  trigger_source?: string;
  metadata?: any;
}

interface WebhookConfig {
  webhook_url: string;
  supported_events: string[];
  authentication: {
    method: string;
    header: string;
    algorithm: string;
  };
  status: string;
}

export default function OpalWorkflowManager() {
  const [workflows, setWorkflows] = useState<WorkflowStatus[]>([]);
  const [webhookConfig, setWebhookConfig] = useState<WebhookConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTriggering, setIsTriggering] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState('');
  const [triggerSource, setTriggerSource] = useState('manual');
  const [clientId, setClientId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [customPayload, setCustomPayload] = useState('');
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    fetchWebhookConfig();
    fetchWorkflowStatus();
    // Set up polling for workflow status
    const interval = setInterval(fetchWorkflowStatus, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchWebhookConfig = async () => {
    try {
      const response = await fetch('/api/webhooks/opal-workflow');
      if (response.ok) {
        const config = await response.json();
        setWebhookConfig(config);
      }
    } catch (error) {
      console.error('Failed to fetch webhook config:', error);
    }
  };

  const fetchWorkflowStatus = async () => {
    try {
      const response = await fetch('/api/webhooks/opal-workflow');
      if (response.ok) {
        const config = await response.json();
        // In a real implementation, this would fetch actual workflow statuses
        // For now, we'll create demo workflows
        setWorkflows([
          {
            workflow_id: 'osa-strategy-workflow',
            workflow_name: 'OSA Strategy Analysis',
            status: 'active',
            last_updated: new Date().toISOString(),
            trigger_source: 'schedule'
          },
          {
            workflow_id: 'audience-insights-workflow',
            workflow_name: 'Audience Insights Generator',
            status: 'active',
            last_updated: new Date().toISOString(),
            trigger_source: 'api'
          },
          {
            workflow_id: 'experiment-optimization-workflow',
            workflow_name: 'Experiment Optimization',
            status: 'active',
            last_updated: new Date().toISOString(),
            trigger_source: 'event'
          }
        ]);
      }
    } catch (error) {
      console.error('Failed to fetch workflow status:', error);
    }
  };

  const triggerWorkflow = async () => {
    if (!selectedWorkflow) {
      alert('Please select a workflow to trigger');
      return;
    }

    setIsTriggering(true);
    try {
      // Get current form data from sessionStorage if available
      let inputData = {};
      try {
        const savedInput = sessionStorage.getItem('osa_input_data');
        if (savedInput) {
          inputData = JSON.parse(savedInput);
        }
      } catch (error) {
        console.log('No saved input data found, using default');
      }

      // If custom payload is provided, use it
      if (customPayload.trim()) {
        try {
          inputData = JSON.parse(customPayload);
        } catch (error) {
          alert('Invalid JSON in custom payload');
          setIsTriggering(false);
          return;
        }
      }

      const triggerRequest = {
        workflow_name: selectedWorkflow,
        input_data: inputData,
        trigger_source: triggerSource,
        metadata: {
          client_id: clientId || 'default-client',
          project_id: projectId || 'ifpa-strategy-engine',
          user_id: 'admin',
          triggered_from: 'admin-panel'
        }
      };

      const response = await fetch('/api/webhooks/opal-workflow', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(triggerRequest)
      });

      if (response.ok) {
        const result = await response.json();

        // Add to logs
        const newLog = {
          id: Date.now(),
          timestamp: new Date().toISOString(),
          action: 'workflow_triggered',
          workflow_name: selectedWorkflow,
          workflow_id: result.workflow_id,
          status: 'success',
          message: 'Workflow triggered successfully'
        };
        setLogs(prev => [newLog, ...prev].slice(0, 50)); // Keep last 50 logs

        alert(`Workflow triggered successfully!\nWorkflow ID: ${result.workflow_id}`);

        // Refresh workflow status
        await fetchWorkflowStatus();
      } else {
        const error = await response.json();
        alert(`Failed to trigger workflow: ${error.message}`);
      }
    } catch (error) {
      console.error('Error triggering workflow:', error);
      alert('Failed to trigger workflow. Please try again.');
    } finally {
      setIsTriggering(false);
    }
  };

  const copyWebhookUrl = () => {
    if (webhookConfig?.webhook_url) {
      navigator.clipboard.writeText(webhookConfig.webhook_url);
      alert('Webhook URL copied to clipboard!');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'triggered': return 'bg-yellow-100 text-yellow-800';
      case 'paused': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'failed': return <AlertCircle className="h-4 w-4" />;
      case 'triggered': return <Clock className="h-4 w-4" />;
      case 'paused': return <Pause className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Workflow className="w-6 h-6" />
            Opal Workflow Manager
          </h2>
          <p className="text-muted-foreground">Manage and trigger Optimizely Opal workflows</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchWorkflowStatus} variant="outline" size="sm" disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="workflows" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="trigger">Trigger Workflow</TabsTrigger>
          <TabsTrigger value="webhooks">Webhook Config</TabsTrigger>
          <TabsTrigger value="logs">Activity Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="workflows" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Workflows</CardTitle>
              <CardDescription>Monitor the status of your Opal workflows</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {workflows.map((workflow) => (
                  <div key={workflow.workflow_id} className="flex items-center justify-between p-4 border rounded-md">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(workflow.status)}
                      <div>
                        <h4 className="font-medium">{workflow.workflow_name}</h4>
                        <p className="text-sm text-muted-foreground">ID: {workflow.workflow_id}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <Badge className={getStatusColor(workflow.status)}>
                          {workflow.status}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(workflow.last_updated).toLocaleString()}
                        </p>
                      </div>
                      {workflow.trigger_source && (
                        <Badge variant="outline" className="text-xs">
                          {workflow.trigger_source}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trigger" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Trigger Workflow</CardTitle>
              <CardDescription>Manually trigger an Opal workflow with custom parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="workflow">Workflow</Label>
                  <Select value={selectedWorkflow} onValueChange={setSelectedWorkflow}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select workflow to trigger" />
                    </SelectTrigger>
                    <SelectContent>
                      {workflows.map((workflow) => (
                        <SelectItem key={workflow.workflow_id} value={workflow.workflow_name}>
                          {workflow.workflow_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="trigger-source">Trigger Source</Label>
                  <Select value={triggerSource} onValueChange={setTriggerSource}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manual</SelectItem>
                      <SelectItem value="api">API</SelectItem>
                      <SelectItem value="schedule">Schedule</SelectItem>
                      <SelectItem value="event">Event</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client-id">Client ID</Label>
                  <Input
                    id="client-id"
                    placeholder="Enter client ID"
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="project-id">Project ID</Label>
                  <Input
                    id="project-id"
                    placeholder="Enter project ID"
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="custom-payload">Custom Payload (JSON)</Label>
                <Textarea
                  id="custom-payload"
                  placeholder="Enter custom JSON payload (optional - will use saved form data if empty)"
                  value={customPayload}
                  onChange={(e) => setCustomPayload(e.target.value)}
                  rows={6}
                />
              </div>

              <Button
                onClick={triggerWorkflow}
                disabled={isTriggering || !selectedWorkflow}
                className="w-full"
              >
                {isTriggering ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Triggering Workflow...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Trigger Workflow
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-4">
          {webhookConfig && (
            <Card>
              <CardHeader>
                <CardTitle>Webhook Configuration</CardTitle>
                <CardDescription>Configure Optimizely Opal to send webhooks to this endpoint</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Webhook URL</Label>
                  <div className="flex gap-2">
                    <Input
                      value={webhookConfig.webhook_url}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button onClick={copyWebhookUrl} variant="outline" size="sm">
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Supported Events</Label>
                  <div className="flex flex-wrap gap-2">
                    {webhookConfig.supported_events.map((event) => (
                      <Badge key={event} variant="outline">
                        {event}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Authentication Method</Label>
                    <Badge variant="secondary">{webhookConfig.authentication.method}</Badge>
                  </div>
                  <div className="space-y-2">
                    <Label>Signature Header</Label>
                    <code className="text-sm bg-muted px-2 py-1 rounded">
                      {webhookConfig.authentication.header}
                    </code>
                  </div>
                  <div className="space-y-2">
                    <Label>Algorithm</Label>
                    <code className="text-sm bg-muted px-2 py-1 rounded">
                      {webhookConfig.authentication.algorithm}
                    </code>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-md">
                  <h4 className="font-medium text-blue-900 mb-2">Setup Instructions</h4>
                  <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                    <li>Copy the webhook URL above</li>
                    <li>In Optimizely Opal, navigate to Workflow Settings</li>
                    <li>Add the webhook URL as a trigger endpoint</li>
                    <li>Set the signature header to <code>x-opal-signature</code></li>
                    <li>Configure the secret key (contact admin for the key)</li>
                    <li>Select the events you want to receive</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Activity Logs</CardTitle>
              <CardDescription>Recent webhook and workflow activity</CardDescription>
            </CardHeader>
            <CardContent>
              {logs.length > 0 ? (
                <div className="space-y-2">
                  {logs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-3 border rounded-md">
                      <div className="flex items-center gap-3">
                        {log.status === 'success' ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-red-600" />
                        )}
                        <div>
                          <p className="font-medium text-sm">{log.message}</p>
                          <p className="text-xs text-muted-foreground">
                            {log.workflow_name} • {new Date(log.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {log.action}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Bell className="h-8 w-8 mx-auto mb-2" />
                  <p>No activity logs yet</p>
                  <p className="text-sm">Logs will appear here when workflows are triggered or webhooks are received</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}