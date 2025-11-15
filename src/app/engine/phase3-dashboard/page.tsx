'use client';

// Phase 3: Comprehensive Webhook Management Dashboard
// Complete interface for webhook security, processing, streaming, and cross-page coordination

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Phase3Statistics {
  webhook_pipeline: any;
  event_streaming: any;
  cache_coordination: any;
  system_health: any;
}

interface StreamEvent {
  type: string;
  event?: any;
  subscription_id?: string;
  timestamp: string;
}

interface RecentWebhookEvent {
  correlation_id: string;
  processing_status: string;
  page_id?: string;
  widget_id?: string;
  total_processing_ms: number;
  received_at: string;
}

export default function Phase3Dashboard() {
  // State management
  const [statistics, setStatistics] = useState<Phase3Statistics | null>(null);
  const [recentEvents, setRecentEvents] = useState<RecentWebhookEvent[]>([]);
  const [streamEvents, setStreamEvents] = useState<StreamEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [sseConnected, setSseConnected] = useState(false);

  // Form states
  const [webhookForm, setWebhookForm] = useState({
    payload: JSON.stringify({
      workflow_id: 'test_workflow',
      page_id: 'strategy-plans',
      widget_id: 'kpi-dashboard',
      opal_data: {
        engagement_rate: 0.85,
        conversion_rate: 0.12,
        page_views: 15750
      }
    }, null, 2),
    headers: JSON.stringify({
      'x-signature-256': 'sha256=test_signature',
      'content-type': 'application/json',
      'user-agent': 'Phase3-Test/1.0'
    }, null, 2)
  });

  const [cacheForm, setCacheForm] = useState({
    action: 'invalidate',
    target_page_id: 'strategy-plans',
    target_widget_id: 'kpi-dashboard',
    invalidation_type: 'specific',
    reason: 'Manual test invalidation'
  });

  const [streamForm, setStreamForm] = useState({
    clientId: `dashboard_${Date.now()}`,
    channels: 'webhook,monitoring,cache',
    eventTypes: '',
    pageId: '',
    widgetId: ''
  });

  // API results
  const [apiResults, setApiResults] = useState<any>({});

  // Load dashboard data
  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, eventsRes] = await Promise.all([
        fetch('/api/phase3/webhook?action=stats'),
        fetch('/api/phase3/webhook?action=recent_events&limit=20')
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStatistics(statsData.phase3_statistics);
      }

      if (eventsRes.ok) {
        const eventsData = await eventsRes.json();
        setRecentEvents(eventsData.recent_events || []);
      }

      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Set up SSE connection
  const setupSSEConnection = useCallback(() => {
    if (sseConnected) return;

    const channels = streamForm.channels || 'webhook,monitoring';
    const eventSource = new EventSource(
      `/api/phase3/stream?clientId=${streamForm.clientId}&channels=${channels}`
    );

    eventSource.onopen = () => {
      console.log('SSE connection established');
      setSseConnected(true);
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setStreamEvents(prev => [data, ...prev].slice(0, 50)); // Keep last 50 events

        // Auto-refresh dashboard when relevant events occur
        if (data.type === 'stream_event' &&
            ['processing_completed', 'cache_invalidated'].includes(data.event?.event_type)) {
          loadDashboardData();
        }
      } catch (error) {
        console.error('Failed to parse SSE event:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      setSseConnected(false);
      eventSource.close();
    };

    return () => {
      eventSource.close();
      setSseConnected(false);
    };
  }, [streamForm.clientId, streamForm.channels, sseConnected, loadDashboardData]);

  // Auto-refresh and SSE setup
  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 60000); // Refresh every minute

    const sseCleanup = setupSSEConnection();

    return () => {
      clearInterval(interval);
      if (sseCleanup) sseCleanup();
    };
  }, [loadDashboardData, setupSSEConnection]);

  // API call helpers
  const testWebhook = async () => {
    setLoading(true);
    try {
      const headers = JSON.parse(webhookForm.headers);
      const response = await fetch('/api/phase3/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: webhookForm.payload
      });
      const result = await response.json();
      setApiResults(prev => ({ ...prev, webhook: result }));
      loadDashboardData(); // Refresh after webhook
    } catch (error) {
      setApiResults(prev => ({ ...prev, webhook: { error: error.message } }));
    } finally {
      setLoading(false);
    }
  };

  const executeCacheOperation = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/phase3/webhook', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cacheForm)
      });
      const result = await response.json();
      setApiResults(prev => ({ ...prev, cache: result }));
      loadDashboardData(); // Refresh after cache operation
    } catch (error) {
      setApiResults(prev => ({ ...prev, cache: { error: error.message } }));
    } finally {
      setLoading(false);
    }
  };

  const sendTestEvent = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/phase3/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_test_event',
          options: {
            channels: ['test', 'monitoring']
          }
        })
      });
      const result = await response.json();
      setApiResults(prev => ({ ...prev, stream: result }));
    } catch (error) {
      setApiResults(prev => ({ ...prev, stream: { error: error.message } }));
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string | number | boolean) => {
    if (status === true || status === 'healthy' || status === 'completed' || status > 90) return 'bg-green-500';
    if (status === false || status === 'critical' || status === 'failed' || status < 50) return 'bg-red-500';
    if (status === 'degraded' || status === 'warning' || status === 'partial' || (typeof status === 'number' && status < 80)) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatDuration = (ms: number) => {
    return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Phase 3 Webhook Management Dashboard</h1>
              <p className="text-gray-600 mt-2">
                Cross-page validated webhook pipeline with enhanced security and real-time monitoring
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${sseConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-gray-600">
                  SSE {sseConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <Button onClick={loadDashboardData} disabled={loading}>
                {loading ? 'Refreshing...' : 'Refresh Data'}
              </Button>
              {lastUpdate && (
                <span className="text-sm text-gray-500">
                  Last updated: {lastUpdate.toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* System Overview */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Webhook Pipeline</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {statistics.webhook_pipeline.processing_stats.total_processed}
                    </p>
                    <p className="text-xs text-gray-500">
                      {statistics.webhook_pipeline.processing_stats.successful_processed} successful
                    </p>
                  </div>
                  <Badge className={`${getStatusColor(statistics.webhook_pipeline.recent_activity.successful_rate > 90)} text-white`}>
                    {statistics.webhook_pipeline.recent_activity.successful_rate.toFixed(1)}%
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Connections</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {statistics.event_streaming.active_connections}
                    </p>
                    <p className="text-xs text-gray-500">
                      {statistics.event_streaming.total_events_created} events created
                    </p>
                  </div>
                  <Badge className={`${getStatusColor(statistics.event_streaming.active_connections > 0)} text-white`}>
                    Streaming
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Cache Operations</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {statistics.cache_coordination.total_invalidations}
                    </p>
                    <p className="text-xs text-gray-500">
                      {statistics.cache_coordination.successful_invalidations} successful
                    </p>
                  </div>
                  <Badge className={`${getStatusColor(statistics.cache_coordination.successful_invalidations > 0)} text-white`}>
                    Active
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">System Health</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {statistics.system_health.status}
                    </p>
                    <p className="text-xs text-gray-500">
                      {statistics.system_health.details.active_processing} active
                    </p>
                  </div>
                  <Badge className={`${getStatusColor(statistics.system_health.status)} text-white`}>
                    {statistics.system_health.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Real-Time Events Stream */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Real-Time Events Stream
                <Badge className={`${sseConnected ? 'bg-green-500' : 'bg-red-500'} text-white`}>
                  {sseConnected ? 'Live' : 'Disconnected'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {streamEvents.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No real-time events received yet</p>
                ) : (
                  streamEvents.map((event, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{event.type}</Badge>
                        {event.event && (
                          <>
                            <span className="text-gray-600">{event.event.event_type}</span>
                            {event.event.page_id && (
                              <span className="text-blue-600">{event.event.page_id}/{event.event.widget_id}</span>
                            )}
                          </>
                        )}
                      </div>
                      <span className="text-gray-500">{formatTimestamp(event.timestamp)}</span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Control Panels */}
        <Tabs defaultValue="webhook" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="webhook">Webhook Testing</TabsTrigger>
            <TabsTrigger value="cache">Cache Control</TabsTrigger>
            <TabsTrigger value="streaming">Event Streaming</TabsTrigger>
            <TabsTrigger value="monitoring">Live Monitoring</TabsTrigger>
            <TabsTrigger value="results">API Results</TabsTrigger>
          </TabsList>

          {/* Webhook Testing Tab */}
          <TabsContent value="webhook">
            <Card>
              <CardHeader>
                <CardTitle>Phase 3 Webhook Testing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Webhook Headers (JSON)</label>
                  <Textarea
                    value={webhookForm.headers}
                    onChange={(e) => setWebhookForm(prev => ({ ...prev, headers: e.target.value }))}
                    className="font-mono text-sm h-24"
                    placeholder="Enter headers as JSON"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Webhook Payload (JSON)</label>
                  <Textarea
                    value={webhookForm.payload}
                    onChange={(e) => setWebhookForm(prev => ({ ...prev, payload: e.target.value }))}
                    className="font-mono text-sm h-40"
                    placeholder="Enter webhook payload as JSON"
                  />
                </div>

                <Button onClick={testWebhook} disabled={loading} className="w-full">
                  Send Test Webhook to Phase 3 Pipeline
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Cache Control Tab */}
          <TabsContent value="cache">
            <Card>
              <CardHeader>
                <CardTitle>Webhook-Triggered Cache Operations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Target Page ID</label>
                    <Select value={cacheForm.target_page_id} onValueChange={(value) =>
                      setCacheForm(prev => ({ ...prev, target_page_id: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="strategy-plans">Strategy Plans</SelectItem>
                        <SelectItem value="analytics-insights">Analytics Insights</SelectItem>
                        <SelectItem value="optimizely-dxp-tools">Optimizely DXP Tools</SelectItem>
                        <SelectItem value="experience-optimization">Experience Optimization</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Target Widget ID</label>
                    <Input
                      value={cacheForm.target_widget_id}
                      onChange={(e) => setCacheForm(prev => ({ ...prev, target_widget_id: e.target.value }))}
                      placeholder="e.g., kpi-dashboard"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Invalidation Type</label>
                    <Select value={cacheForm.invalidation_type} onValueChange={(value) =>
                      setCacheForm(prev => ({ ...prev, invalidation_type: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="specific">Specific Cache Entry</SelectItem>
                        <SelectItem value="page_wide">Entire Page</SelectItem>
                        <SelectItem value="dependency_chain">Dependency Chain</SelectItem>
                        <SelectItem value="full_site">Full Site</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Reason</label>
                    <Input
                      value={cacheForm.reason}
                      onChange={(e) => setCacheForm(prev => ({ ...prev, reason: e.target.value }))}
                      placeholder="Reason for cache invalidation"
                    />
                  </div>
                </div>

                <Button onClick={executeCacheOperation} disabled={loading} className="w-full">
                  Execute Cache Invalidation
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Event Streaming Tab */}
          <TabsContent value="streaming">
            <Card>
              <CardHeader>
                <CardTitle>Real-Time Event Streaming Control</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Client ID</label>
                    <Input
                      value={streamForm.clientId}
                      onChange={(e) => setStreamForm(prev => ({ ...prev, clientId: e.target.value }))}
                      placeholder="Unique client identifier"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Channels (comma-separated)</label>
                    <Input
                      value={streamForm.channels}
                      onChange={(e) => setStreamForm(prev => ({ ...prev, channels: e.target.value }))}
                      placeholder="webhook,monitoring,cache"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Filter by Page ID</label>
                    <Input
                      value={streamForm.pageId}
                      onChange={(e) => setStreamForm(prev => ({ ...prev, pageId: e.target.value }))}
                      placeholder="Optional page filter"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Filter by Widget ID</label>
                    <Input
                      value={streamForm.widgetId}
                      onChange={(e) => setStreamForm(prev => ({ ...prev, widgetId: e.target.value }))}
                      placeholder="Optional widget filter"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={setupSSEConnection} disabled={sseConnected} className="flex-1">
                    {sseConnected ? 'Connected' : 'Connect to Stream'}
                  </Button>
                  <Button onClick={sendTestEvent} disabled={loading} variant="outline" className="flex-1">
                    Send Test Event
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Live Monitoring Tab */}
          <TabsContent value="monitoring">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Webhook Events</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {recentEvents.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">No recent events</p>
                    ) : (
                      recentEvents.map((event, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded">
                          <div>
                            <div className="flex items-center gap-2">
                              <Badge className={`${getStatusColor(event.processing_status)} text-white`}>
                                {event.processing_status}
                              </Badge>
                              <span className="font-mono text-sm text-gray-600">{event.correlation_id}</span>
                            </div>
                            {event.page_id && (
                              <div className="text-sm text-blue-600 mt-1">
                                {event.page_id}/{event.widget_id}
                              </div>
                            )}
                            <div className="text-xs text-gray-500 mt-1">
                              {formatDuration(event.total_processing_ms)} • {formatTimestamp(event.received_at)}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {statistics && (
                <Card>
                  <CardHeader>
                    <CardTitle>System Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm">
                          <span>Success Rate</span>
                          <span>{statistics.webhook_pipeline.recent_activity.successful_rate.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div
                            className={`h-2 rounded-full ${getStatusColor(statistics.webhook_pipeline.recent_activity.successful_rate)}`}
                            style={{ width: `${Math.min(100, statistics.webhook_pipeline.recent_activity.successful_rate)}%` }}
                          ></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-sm">
                          <span>Security Failure Rate</span>
                          <span>{statistics.webhook_pipeline.recent_activity.security_failure_rate.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div
                            className="bg-red-500 h-2 rounded-full"
                            style={{ width: `${Math.min(100, statistics.webhook_pipeline.recent_activity.security_failure_rate)}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-2 text-sm">
                        <div>
                          <div className="text-gray-600">Active Processing</div>
                          <div className="font-bold">{statistics.webhook_pipeline.active_processing}</div>
                        </div>
                        <div>
                          <div className="text-gray-600">Queue Size</div>
                          <div className="font-bold">{statistics.webhook_pipeline.queue_size}</div>
                        </div>
                        <div>
                          <div className="text-gray-600">Phase 2 Integrations</div>
                          <div className="font-bold">{statistics.webhook_pipeline.processing_stats.phase2_integrations}</div>
                        </div>
                        <div>
                          <div className="text-gray-600">Cross-Page Triggers</div>
                          <div className="font-bold">{statistics.webhook_pipeline.processing_stats.cross_page_triggers}</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* API Results Tab */}
          <TabsContent value="results">
            <Card>
              <CardHeader>
                <CardTitle>API Response Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(apiResults).map(([api, result]) => (
                    <div key={api} className="border rounded-lg p-4">
                      <h3 className="font-medium mb-2 capitalize">{api} API Response</h3>
                      <Textarea
                        value={JSON.stringify(result, null, 2)}
                        readOnly
                        className="font-mono text-sm h-60"
                      />
                    </div>
                  ))}
                  {Object.keys(apiResults).length === 0 && (
                    <p className="text-gray-500 text-center py-8">No API results yet. Use the control panels to test the Phase 3 APIs.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          Phase 3 Cross-Page Validated Webhook Pipeline - Enhanced Security, Real-Time Streaming, and Complete Audit Trail
        </div>
      </div>
    </div>
  );
}