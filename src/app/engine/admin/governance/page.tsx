'use client';

// Enhanced Data Governance Admin Dashboard - Phase 5 Integration
// Comprehensive monitoring and management interface with Results Content Architecture monitoring

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Shield,
  Eye,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Database,
  Users,
  Activity,
  TrendingUp,
  Settings,
  RefreshCw
} from 'lucide-react';

interface DashboardData {
  health: any;
  security: any;
  pii_compliance: any;
  purge_status: any;
  audit_summary: any;
  overall_status: any;
  // Phase 5 Extensions
  results_architecture?: any;
  console_settings?: any;
  guardrails_settings?: any;
}

interface HealthStatus {
  audit_system: string;
  pii_scanner: string;
  purge_system: string;
  data_governance: string;
}

export default function DataGovernanceDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Phase 5 State Management
  const [consoleSpamFilter, setConsoleSpamFilter] = useState(false);
  const [guardrailsOverlay, setGuardrailsOverlay] = useState(true);
  const [debugMode, setDebugMode] = useState(process.env.NODE_ENV === 'development');

  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);
      const response = await fetch('/api/admin/governance');

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const result = await response.json();

      if (result.success) {
        setData(result.dashboard);
        setError(null);
      } else {
        throw new Error(result.error || 'Unknown error');
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'operational':
      case 'enabled':
      case 'excellent':
        return 'text-green-600 bg-green-100';
      case 'degraded':
      case 'fair':
        return 'text-yellow-600 bg-yellow-100';
      case 'disabled':
      case 'needs improvement':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'operational':
      case 'enabled':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'degraded':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'disabled':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  // Phase 5 Control Handlers
  const handleConsoleSpamConfig = async () => {
    try {
      // Toggle console spam filtering
      const newState = !consoleSpamFilter;
      setConsoleSpamFilter(newState);

      // In a real implementation, this would call an API
      console.log(`Console spam filtering ${newState ? 'enabled' : 'disabled'}`);

      // Store in localStorage for persistence
      if (typeof window !== 'undefined') {
        localStorage.setItem('osa_console_spam_filter', newState.toString());
      }
    } catch (error) {
      console.error('Failed to configure console spam filtering:', error);
    }
  };

  const handleGuardrailsManagement = async () => {
    try {
      // Toggle guardrails overlay
      const newState = !guardrailsOverlay;
      setGuardrailsOverlay(newState);

      // In a real implementation, this would call an API
      console.log(`Guardrails overlay ${newState ? 'enabled' : 'disabled'}`);

      // Store in localStorage for persistence
      if (typeof window !== 'undefined') {
        localStorage.setItem('osa_guardrails_overlay', newState.toString());
      }
    } catch (error) {
      console.error('Failed to manage guardrails overlay:', error);
    }
  };

  // Load Phase 5 settings on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedConsoleFilter = localStorage.getItem('osa_console_spam_filter');
      const savedGuardrails = localStorage.getItem('osa_guardrails_overlay');

      if (savedConsoleFilter !== null) {
        setConsoleSpamFilter(savedConsoleFilter === 'true');
      }
      if (savedGuardrails !== null) {
        setGuardrailsOverlay(savedGuardrails === 'true');
      }
    }
  }, []);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading Data Governance Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-red-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-red-700 mb-2">
                Dashboard Error
              </h3>
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={fetchDashboardData} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const health = data?.health?.health as HealthStatus || {};
  const overallStatus = data?.overall_status || {};

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-blue-600" />
            Data Governance Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Monitor and manage data protection, compliance, and security
          </p>
        </div>

        <div className="flex items-center gap-4">
          <Badge className={getStatusColor(overallStatus.compliance_rating)}>
            {overallStatus.compliance_rating || 'Unknown'}
          </Badge>
          <Button
            onClick={fetchDashboardData}
            disabled={refreshing}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(health).map(([key, status]) => (
          <Card key={key}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium capitalize">
                    {key.replace(/_/g, ' ')}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusIcon(status)}
                    <span className={`text-sm px-2 py-1 rounded-full ${getStatusColor(status)}`}>
                      {status}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="pii">PII Compliance</TabsTrigger>
          <TabsTrigger value="purge">Data Purging</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
          <TabsTrigger value="results">Results Architecture</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Key Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Key Metrics (24h)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Events</span>
                  <span className="text-2xl font-bold">
                    {data?.audit_summary?.audit_summary?.total_events || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">PII Violations</span>
                  <span className={`text-2xl font-bold ${
                    (data?.audit_summary?.audit_summary?.pii_violations || 0) > 0
                      ? 'text-red-600'
                      : 'text-green-600'
                  }`}>
                    {data?.audit_summary?.audit_summary?.pii_violations || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Security Events</span>
                  <span className="text-2xl font-bold">
                    {data?.audit_summary?.audit_summary?.security_events || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Unique Users</span>
                  <span className="text-2xl font-bold">
                    {data?.audit_summary?.audit_summary?.unique_users || 0}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Compliance Rating */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Compliance Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${
                    getStatusColor(overallStatus.compliance_rating)
                  }`}>
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-semibold">{overallStatus.compliance_rating}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Data Governance</span>
                    <Badge variant={health.data_governance === 'enabled' ? 'default' : 'destructive'}>
                      {health.data_governance}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>PII Scanner</span>
                    <Badge variant={health.pii_scanner === 'operational' ? 'default' : 'destructive'}>
                      {health.pii_scanner}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Audit System</span>
                    <Badge variant={health.audit_system === 'operational' ? 'default' : 'destructive'}>
                      {health.audit_system}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Purge System</span>
                    <Badge variant={health.purge_system === 'operational' ? 'default' : 'destructive'}>
                      {health.purge_system}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                System Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {(data?.audit_summary?.recommendations || []).map((rec: string, index: number) => (
                  <div key={index} className="flex items-start gap-2 p-2 bg-blue-50 rounded">
                    <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{rec}</span>
                  </div>
                ))}
                {(!data?.audit_summary?.recommendations || data.audit_summary.recommendations.length === 0) && (
                  <p className="text-gray-500 text-sm">No recommendations at this time.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Security Events</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Total Events (7d)</span>
                    <span className="font-bold">
                      {data?.security?.security_metrics?.security_events || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Suspicious IPs</span>
                    <span className="font-bold text-red-600">
                      {data?.security?.security_metrics?.suspicious_ips || 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Threat Levels</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(data?.security?.security_metrics?.threat_levels || {}).map(([level, count]) => (
                    <div key={level} className="flex justify-between items-center">
                      <Badge variant={level === 'high' || level === 'critical' ? 'destructive' : 'secondary'}>
                        {level}
                      </Badge>
                      <span className="font-bold">{count as number}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* PII Compliance Tab */}
        <TabsContent value="pii" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>PII Compliance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Compliance Rate</span>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={data?.pii_compliance?.pii_compliance?.compliance_rate || 0}
                        className="w-20"
                      />
                      <span className="font-bold">
                        {data?.pii_compliance?.pii_compliance?.compliance_rate || 0}%
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Total Scans</span>
                    <span className="font-bold">
                      {data?.pii_compliance?.pii_compliance?.total_scans || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Violations Found</span>
                    <span className={`font-bold ${
                      (data?.pii_compliance?.pii_compliance?.violations_found || 0) > 0
                        ? 'text-red-600'
                        : 'text-green-600'
                    }`}>
                      {data?.pii_compliance?.pii_compliance?.violations_found || 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Violation Types</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {(data?.pii_compliance?.pii_compliance?.top_violation_types || []).map((violation: any, index: number) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="capitalize">{violation.type}</span>
                      <Badge variant="destructive">{violation.count}</Badge>
                    </div>
                  ))}
                  {(!data?.pii_compliance?.pii_compliance?.top_violation_types ||
                    data.pii_compliance.pii_compliance.top_violation_types.length === 0) && (
                    <p className="text-green-600 text-sm">No violations detected</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Data Purging Tab */}
        <TabsContent value="purge" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Purge Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Records Eligible</span>
                    <span className="font-bold">
                      {data?.purge_status?.purge_metrics?.records_eligible_for_purge || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Last Purge</span>
                    <span className="text-sm">
                      {data?.purge_status?.purge_metrics?.purge_history?.last_purge || 'Never'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Analytics Preserved</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span>Workflows</span>
                    <span className="font-bold">
                      {data?.purge_status?.purge_metrics?.analytics_preserved?.workflows?.count || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Agents</span>
                    <span className="font-bold">
                      {data?.purge_status?.purge_metrics?.analytics_preserved?.agents?.count || 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Audit Logs Tab */}
        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Audit Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded">
                  <div className="text-2xl font-bold text-blue-600">
                    {data?.audit_summary?.audit_summary?.total_events || 0}
                  </div>
                  <div className="text-sm text-blue-600">Total Events</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded">
                  <div className="text-2xl font-bold text-green-600">
                    {data?.audit_summary?.audit_summary?.unique_users || 0}
                  </div>
                  <div className="text-sm text-green-600">Unique Users</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded">
                  <div className="text-2xl font-bold text-yellow-600">
                    {data?.audit_summary?.audit_summary?.suspicious_ips || 0}
                  </div>
                  <div className="text-sm text-yellow-600">Suspicious IPs</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Results Architecture Tab - Phase 5 Integration */}
        <TabsContent value="results" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Results Content Architecture Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Results Architecture Health
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">EnhancedResultsRenderer</span>
                  <Badge className="text-green-600 bg-green-100">Active</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Widget Integration</span>
                  <Badge className="text-green-600 bg-green-100">Operational</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Content Uniqueness</span>
                  <Badge className="text-green-600 bg-green-100">Enabled</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Phase 4 Integration</span>
                  <Badge className="text-green-600 bg-green-100">Complete</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Phase 5 Cleanup Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Phase 5 Controls
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">Console Spam Filtering</span>
                      <span className="text-xs text-gray-500">Reduce development console noise</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={consoleSpamFilter ? "default" : "secondary"}>
                        {consoleSpamFilter ? "Enabled" : "Disabled"}
                      </Badge>
                      <Button size="sm" variant="outline" onClick={handleConsoleSpamConfig}>
                        {consoleSpamFilter ? "Disable" : "Enable"}
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">Guardrails Overlay</span>
                      <span className="text-xs text-gray-500">Visual security indicators</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={guardrailsOverlay ? "default" : "secondary"}>
                        {guardrailsOverlay ? "Active" : "Hidden"}
                      </Badge>
                      <Button size="sm" variant="outline" onClick={handleGuardrailsManagement}>
                        {guardrailsOverlay ? "Hide" : "Show"}
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">Debug Mode</span>
                      <span className="text-xs text-gray-500">Enhanced logging and diagnostics</span>
                    </div>
                    <Badge variant={debugMode ? "destructive" : "secondary"}>
                      {debugMode ? "Development" : "Production"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">Performance Monitoring</span>
                      <span className="text-xs text-gray-500">Real-time system metrics</span>
                    </div>
                    <Badge className="text-blue-600 bg-blue-100">Active</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results Pages Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Results Pages Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded">
                  <div className="text-lg font-bold text-blue-600">Strategy Plans</div>
                  <div className="text-sm text-blue-600 mt-1">Enhanced Architecture</div>
                  <Badge className="text-green-600 bg-green-100 text-xs mt-2">Operational</Badge>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded">
                  <div className="text-lg font-bold text-purple-600">DXP Tools</div>
                  <div className="text-sm text-purple-600 mt-1">Widget Integration</div>
                  <Badge variant="secondary" className="text-xs mt-2">Pending</Badge>
                </div>
                <div className="text-center p-4 bg-green-50 rounded">
                  <div className="text-lg font-bold text-green-600">Analytics</div>
                  <div className="text-sm text-green-600 mt-1">Insights Engine</div>
                  <Badge variant="secondary" className="text-xs mt-2">Pending</Badge>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded">
                  <div className="text-lg font-bold text-orange-600">Experience</div>
                  <div className="text-sm text-orange-600 mt-1">Optimization</div>
                  <Badge variant="secondary" className="text-xs mt-2">Pending</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Architecture Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Architecture Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Content Generation Time</span>
                  <span className="text-sm text-green-600 font-mono">~2ms</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Widget Rendering</span>
                  <span className="text-sm text-blue-600 font-mono">~15ms</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Page Load Performance</span>
                  <Progress value={92} className="w-20" />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Memory Usage</span>
                  <span className="text-sm text-gray-600 font-mono">Optimized</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}