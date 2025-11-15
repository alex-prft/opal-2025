'use client';

// Phase 2: Comprehensive Monitoring Dashboard
// Provides UI controls for all Phase 2 capabilities: validation, cache, jobs, health, and audit

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface SystemHealth {
  overall_status: string;
  health_percentage: number;
  component_statuses: {
    database: boolean;
    phase1_pipeline: boolean;
    intelligent_cache: boolean;
    background_jobs: boolean;
    claude_integration: boolean;
  };
}

interface CacheStats {
  memory_cache_size: number;
  dependencies_tracked: number;
  validation_jobs_active: number;
  startup_complete: boolean;
}

interface JobStats {
  running: boolean;
  active_jobs: string[];
  scheduled_jobs: string[];
}

export default function Phase2Dashboard() {
  // State management
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [jobStats, setJobStats] = useState<JobStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Form states
  const [validationForm, setValidationForm] = useState({
    pageId: 'strategy-plans',
    widgetId: 'kpi-dashboard',
    enable_claude_enhancement: false,
    cache_strategy: 'prefer_cache',
    claude_enhancement_type: 'enrichment'
  });

  const [cacheForm, setCacheForm] = useState({
    pageId: '',
    widgetId: '',
    action: 'warm'
  });

  const [jobForm, setJobForm] = useState({
    action: 'start',
    jobType: 'cache_validation'
  });

  // API results
  const [apiResults, setApiResults] = useState<any>({});

  // Load dashboard data
  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [healthRes, cacheRes, jobRes] = await Promise.all([
        fetch('/api/phase2/health?check=quick'),
        fetch('/api/phase2/cache?action=stats'),
        fetch('/api/phase2/jobs?action=stats')
      ]);

      if (healthRes.ok) {
        const healthData = await healthRes.json();
        setSystemHealth(healthData);
      }

      if (cacheRes.ok) {
        const cacheData = await cacheRes.json();
        setCacheStats(cacheData.cache_statistics);
      }

      if (jobRes.ok) {
        const jobData = await jobRes.json();
        setJobStats(jobData.job_system_statistics);
      }

      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh dashboard data
  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // API call helpers
  const callValidationAPI = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/phase2/validation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validationForm)
      });
      const result = await response.json();
      setApiResults(prev => ({ ...prev, validation: result }));
    } catch (error) {
      setApiResults(prev => ({ ...prev, validation: { error: error.message } }));
    } finally {
      setLoading(false);
    }
  };

  const callCacheAPI = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/phase2/cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cacheForm)
      });
      const result = await response.json();
      setApiResults(prev => ({ ...prev, cache: result }));
      loadDashboardData(); // Refresh stats
    } catch (error) {
      setApiResults(prev => ({ ...prev, cache: { error: error.message } }));
    } finally {
      setLoading(false);
    }
  };

  const callJobAPI = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/phase2/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jobForm)
      });
      const result = await response.json();
      setApiResults(prev => ({ ...prev, jobs: result }));
      loadDashboardData(); // Refresh stats
    } catch (error) {
      setApiResults(prev => ({ ...prev, jobs: { error: error.message } }));
    } finally {
      setLoading(false);
    }
  };

  const runSystemTest = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/phase2/health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'system_test' })
      });
      const result = await response.json();
      setApiResults(prev => ({ ...prev, systemTest: result }));
    } catch (error) {
      setApiResults(prev => ({ ...prev, systemTest: { error: error.message } }));
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string | boolean) => {
    if (status === true || status === 'healthy' || status === 'running') return 'bg-green-500';
    if (status === false || status === 'error' || status === 'critical') return 'bg-red-500';
    if (status === 'warning' || status === 'degraded') return 'bg-yellow-500';
    return 'bg-gray-500';
  };

  const getStatusText = (status: string | boolean) => {
    if (status === true) return 'Healthy';
    if (status === false) return 'Down';
    return typeof status === 'string' ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Phase 2 Monitoring Dashboard</h1>
              <p className="text-gray-600 mt-2">
                Enhanced validation with intelligent cache, Claude integration, and background jobs
              </p>
            </div>
            <div className="flex items-center gap-4">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          {systemHealth && (
            <>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Overall Status</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {systemHealth.health_percentage}%
                      </p>
                    </div>
                    <Badge className={`${getStatusColor(systemHealth.overall_status)} text-white`}>
                      {getStatusText(systemHealth.overall_status)}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {Object.entries(systemHealth.component_statuses).map(([component, status]) => (
                <Card key={component}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          {component.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </p>
                      </div>
                      <Badge className={`${getStatusColor(status)} text-white`}>
                        {getStatusText(status)}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {cacheStats && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Cache System
                  <Badge className={`${getStatusColor(cacheStats.startup_complete)} text-white`}>
                    {cacheStats.startup_complete ? 'Ready' : 'Warming'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Memory Entries:</span>
                    <span className="font-medium">{cacheStats.memory_cache_size}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Dependencies:</span>
                    <span className="font-medium">{cacheStats.dependencies_tracked}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Active Validations:</span>
                    <span className="font-medium">{cacheStats.validation_jobs_active}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {jobStats && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Background Jobs
                  <Badge className={`${getStatusColor(jobStats.running)} text-white`}>
                    {jobStats.running ? 'Running' : 'Stopped'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Active Jobs:</span>
                    <span className="font-medium">{jobStats.active_jobs.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Scheduled:</span>
                    <span className="font-medium">{jobStats.scheduled_jobs.length}</span>
                  </div>
                  {jobStats.active_jobs.length > 0 && (
                    <div className="mt-2 text-xs text-gray-500">
                      Active: {jobStats.active_jobs.join(', ')}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>System Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button onClick={runSystemTest} disabled={loading} className="w-full">
                  Run System Test
                </Button>
                <Button onClick={() => window.open('/api/phase2/health?check=detailed')} variant="outline" className="w-full">
                  Detailed Health Report
                </Button>
                <Button onClick={() => window.open('/api/phase2/audit?action=recent_activity')} variant="outline" className="w-full">
                  View Audit Trail
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Control Panels */}
        <Tabs defaultValue="validation" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="validation">Validation</TabsTrigger>
            <TabsTrigger value="cache">Cache Control</TabsTrigger>
            <TabsTrigger value="jobs">Background Jobs</TabsTrigger>
            <TabsTrigger value="results">API Results</TabsTrigger>
          </TabsList>

          {/* Phase 2 Validation Tab */}
          <TabsContent value="validation">
            <Card>
              <CardHeader>
                <CardTitle>Enhanced Validation Pipeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Page ID</label>
                    <Select value={validationForm.pageId} onValueChange={(value) =>
                      setValidationForm(prev => ({ ...prev, pageId: value }))}>
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
                    <label className="block text-sm font-medium mb-1">Widget ID</label>
                    <Select value={validationForm.widgetId} onValueChange={(value) =>
                      setValidationForm(prev => ({ ...prev, widgetId: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kpi-dashboard">KPI Dashboard</SelectItem>
                        <SelectItem value="roadmap-timeline">Roadmap Timeline</SelectItem>
                        <SelectItem value="analytics-dashboard">Analytics Dashboard</SelectItem>
                        <SelectItem value="insights-summary">Insights Summary</SelectItem>
                        <SelectItem value="tool-matrix">Tool Matrix</SelectItem>
                        <SelectItem value="integration-status">Integration Status</SelectItem>
                        <SelectItem value="optimization-results">Optimization Results</SelectItem>
                        <SelectItem value="test-recommendations">Test Recommendations</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Cache Strategy</label>
                    <Select value={validationForm.cache_strategy} onValueChange={(value) =>
                      setValidationForm(prev => ({ ...prev, cache_strategy: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="prefer_cache">Prefer Cache</SelectItem>
                        <SelectItem value="prefer_fresh">Prefer Fresh</SelectItem>
                        <SelectItem value="cache_only">Cache Only</SelectItem>
                        <SelectItem value="fresh_only">Fresh Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Claude Enhancement</label>
                    <Select value={validationForm.claude_enhancement_type} onValueChange={(value) =>
                      setValidationForm(prev => ({ ...prev, claude_enhancement_type: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="summarization">Summarization</SelectItem>
                        <SelectItem value="enrichment">Enrichment</SelectItem>
                        <SelectItem value="formatting">Formatting</SelectItem>
                        <SelectItem value="analysis">Analysis</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="claude_enabled"
                    checked={validationForm.enable_claude_enhancement}
                    onChange={(e) => setValidationForm(prev => ({ ...prev, enable_claude_enhancement: e.target.checked }))}
                  />
                  <label htmlFor="claude_enabled" className="text-sm font-medium">Enable Claude Enhancement</label>
                </div>

                <Button onClick={callValidationAPI} disabled={loading} className="w-full">
                  Run Phase 2 Validation
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Cache Control Tab */}
          <TabsContent value="cache">
            <Card>
              <CardHeader>
                <CardTitle>Intelligent Cache Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Cache Action</label>
                  <Select value={cacheForm.action} onValueChange={(value) =>
                    setCacheForm(prev => ({ ...prev, action: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="warm">Warm Cache</SelectItem>
                      <SelectItem value="invalidate">Invalidate Cache</SelectItem>
                      <SelectItem value="refresh">Force Refresh</SelectItem>
                      <SelectItem value="validate">Trigger Validation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(cacheForm.action === 'invalidate' || cacheForm.action === 'refresh') && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Page ID</label>
                      <Input
                        value={cacheForm.pageId}
                        onChange={(e) => setCacheForm(prev => ({ ...prev, pageId: e.target.value }))}
                        placeholder="e.g., strategy-plans"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Widget ID</label>
                      <Input
                        value={cacheForm.widgetId}
                        onChange={(e) => setCacheForm(prev => ({ ...prev, widgetId: e.target.value }))}
                        placeholder="e.g., kpi-dashboard"
                      />
                    </div>
                  </div>
                )}

                <Button onClick={callCacheAPI} disabled={loading} className="w-full">
                  Execute Cache Action
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Background Jobs Tab */}
          <TabsContent value="jobs">
            <Card>
              <CardHeader>
                <CardTitle>Background Job System</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Job Action</label>
                  <Select value={jobForm.action} onValueChange={(value) =>
                    setJobForm(prev => ({ ...prev, action: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="start">Start Job System</SelectItem>
                      <SelectItem value="stop">Stop Job System</SelectItem>
                      <SelectItem value="trigger">Trigger Job</SelectItem>
                      <SelectItem value="enable">Enable Job</SelectItem>
                      <SelectItem value="disable">Disable Job</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(jobForm.action === 'trigger' || jobForm.action === 'enable' || jobForm.action === 'disable') && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Job Type</label>
                    <Select value={jobForm.jobType} onValueChange={(value) =>
                      setJobForm(prev => ({ ...prev, jobType: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cache_validation">Cache Validation (30min)</SelectItem>
                        <SelectItem value="cache_warming">Cache Warming (On-demand)</SelectItem>
                        <SelectItem value="cross_page_sync">Cross-Page Sync (15min)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <Button onClick={callJobAPI} disabled={loading} className="w-full">
                  Execute Job Action
                </Button>
              </CardContent>
            </Card>
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
                        className="font-mono text-sm h-40"
                      />
                    </div>
                  ))}
                  {Object.keys(apiResults).length === 0 && (
                    <p className="text-gray-500 text-center py-8">No API results yet. Use the control panels to test the APIs.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          Phase 2 Enhanced Validation System - Intelligent Cache, Claude Integration, Background Jobs
        </div>
      </div>
    </div>
  );
}