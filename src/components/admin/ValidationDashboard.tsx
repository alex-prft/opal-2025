'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Activity, 
  Database, 
  Zap, 
  Clock,
  TrendingUp,
  Settings,
  RefreshCw
} from 'lucide-react';
import { MonitoringConfig } from './MonitoringConfig';

interface ValidationRecord {
  id: string;
  force_sync_workflow_id: string;
  opal_correlation_id: string;
  overall_status: 'green' | 'yellow' | 'red';
  layer_1_status: 'success' | 'warning' | 'error';
  layer_2_status: 'success' | 'warning' | 'error';
  layer_3_status: 'success' | 'warning' | 'error';
  layer_4_status: 'success' | 'warning' | 'error';
  validation_summary: string;
  created_at: string;
  validation_duration_ms: number;
  tenant_id?: string;
}

interface DashboardStats {
  total_validations: number;
  green_count: number;
  yellow_count: number;
  red_count: number;
  avg_validation_time: number;
  last_24h_validations: number;
  success_rate: number;
}

export function ValidationDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recentValidations, setRecentValidations] = useState<ValidationRecord[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setError(null);
      setIsRefreshing(true);

      // Fetch recent validation records
      const validationsResponse = await fetch('/api/admin/osa/integration-status?limit=10');
      if (!validationsResponse.ok) {
        throw new Error(`Failed to fetch validations: ${validationsResponse.status}`);
      }
      const validationsData = await validationsResponse.json();
      setRecentValidations(validationsData.validations || []);

      // Calculate dashboard stats from the data
      const stats = calculateDashboardStats(validationsData.validations || []);
      setDashboardStats(stats);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const calculateDashboardStats = (validations: ValidationRecord[]): DashboardStats => {
    const total = validations.length;
    const greenCount = validations.filter(v => v.overall_status === 'green').length;
    const yellowCount = validations.filter(v => v.overall_status === 'yellow').length;
    const redCount = validations.filter(v => v.overall_status === 'red').length;
    
    const avgTime = total > 0 
      ? Math.round(validations.reduce((sum, v) => sum + (v.validation_duration_ms || 0), 0) / total)
      : 0;

    // Calculate last 24h validations (simplified for demo)
    const last24h = validations.filter(v => {
      const validationTime = new Date(v.created_at).getTime();
      const now = Date.now();
      return (now - validationTime) < (24 * 60 * 60 * 1000);
    }).length;

    const successRate = total > 0 ? Math.round((greenCount / total) * 100) : 0;

    return {
      total_validations: total,
      green_count: greenCount,
      yellow_count: yellowCount,
      red_count: redCount,
      avg_validation_time: avgTime,
      last_24h_validations: last24h,
      success_rate: successRate
    };
  };

  const triggerValidation = async (workflowId: string, correlationId: string) => {
    try {
      setIsRefreshing(true);
      
      const response = await fetch('/api/admin/osa/validate-integration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          forceSyncWorkflowId: workflowId,
          opalCorrelationId: correlationId,
          tenantId: 'admin_test'
        })
      });

      if (!response.ok) {
        throw new Error(`Validation failed: ${response.status}`);
      }

      // Refresh dashboard data after validation
      await fetchDashboardData();
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Validation trigger failed');
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: 'green' | 'yellow' | 'red' | 'success' | 'warning' | 'error') => {
    switch (status) {
      case 'green':
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'yellow':
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'red':
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: 'green' | 'yellow' | 'red') => {
    const variants = {
      green: 'bg-green-100 text-green-800 border-green-200',
      yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      red: 'bg-red-100 text-red-800 border-red-200'
    };

    return (
      <Badge className={variants[status]}>
        {getStatusIcon(status)}
        <span className="ml-1 capitalize">{status}</span>
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-500">Loading validation dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Integration Validation Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Monitor OPAL integration health and validation status across all workflow layers
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            onClick={fetchDashboardData}
            disabled={isRefreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Dashboard Stats Overview */}
      {dashboardStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Validations</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardStats.total_validations}</div>
              <p className="text-xs text-muted-foreground">
                {dashboardStats.last_24h_validations} in last 24h
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{dashboardStats.success_rate}%</div>
              <p className="text-xs text-muted-foreground">
                {dashboardStats.green_count} successful validations
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardStats.avg_validation_time}ms</div>
              <p className="text-xs text-muted-foreground">
                Average validation duration
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Health</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {getStatusIcon(dashboardStats.success_rate > 80 ? 'green' : dashboardStats.success_rate > 60 ? 'yellow' : 'red')}
                <span className="text-2xl font-bold">
                  {dashboardStats.success_rate > 80 ? 'Healthy' : dashboardStats.success_rate > 60 ? 'Warning' : 'Critical'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {dashboardStats.red_count} failed, {dashboardStats.yellow_count} warnings
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="recent" className="space-y-4">
        <TabsList>
          <TabsTrigger value="recent">Recent Validations</TabsTrigger>
          <TabsTrigger value="manual">Manual Testing</TabsTrigger>
          <TabsTrigger value="monitoring">Health Monitoring</TabsTrigger>
        </TabsList>

        <TabsContent value="recent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Validation Results</CardTitle>
              <CardDescription>
                Latest validation attempts with detailed layer status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentValidations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No validation records found. Run your first validation to see results here.
                </div>
              ) : (
                <div className="space-y-4">
                  {recentValidations.map((validation) => (
                    <div key={validation.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="font-medium">
                            Workflow: {validation.force_sync_workflow_id}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Correlation: {validation.opal_correlation_id}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(validation.created_at).toLocaleString()} • {validation.validation_duration_ms}ms
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(validation.overall_status)}
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-2">
                        <div className="text-center">
                          <div className="text-xs text-muted-foreground mb-1">Force Sync</div>
                          <div className="flex justify-center">{getStatusIcon(validation.layer_1_status)}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-muted-foreground mb-1">OPAL Agents</div>
                          <div className="flex justify-center">{getStatusIcon(validation.layer_2_status)}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-muted-foreground mb-1">OSA Ingestion</div>
                          <div className="flex justify-center">{getStatusIcon(validation.layer_3_status)}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-muted-foreground mb-1">Results</div>
                          <div className="flex justify-center">{getStatusIcon(validation.layer_4_status)}</div>
                        </div>
                      </div>

                      <div className="text-sm text-muted-foreground">
                        {validation.validation_summary}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manual" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Manual Validation Testing</CardTitle>
              <CardDescription>
                Trigger validation tests for specific workflows
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Button
                  onClick={() => triggerValidation('ws_manual_test_001', 'opal_corr_manual_001')}
                  disabled={isRefreshing}
                  className="flex items-center gap-2"
                >
                  <Zap className="h-4 w-4" />
                  {isRefreshing ? 'Running...' : 'Run Test Validation'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.open('/admin/opal-integration-test', '_blank')}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Open Full Test Interface
                </Button>
              </div>
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Manual testing will trigger actual validation workflows. Use the dedicated test interface for comprehensive scenario testing.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          <MonitoringConfig />
        </TabsContent>
      </Tabs>
    </div>
  );
}