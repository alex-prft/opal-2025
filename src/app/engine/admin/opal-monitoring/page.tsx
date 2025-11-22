'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  Clock,
  TrendingUp,
  Server,
  Zap,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { SafeDate } from '@/lib/utils/date-formatter';
import { getLatestWorkflowRun, getResultsPageStatuses } from '@/lib/admin/opal-monitoring-service';

interface IntegrationHealthData {
  success: boolean;
  agent_id: string;
  dataSentToOSA: {
    integration_status: string;
    uptime_percentage: number;
    api_response_times: Record<string, string>;
    error_rates: Record<string, number>;
    last_sync: string;
    health_score: number;
  };
  optimizelyDxpTools: string[];
  timestamp: string;
}

interface LatestWorkflowRun {
  workflow_id: string;
  session_id: string | null;
  status: string;
  started_at: string;
  completed_at: string | null;
  agents_expected: number;
  agents_completed: number;
  execution_data?: any;
}

interface ResultsPageStatus {
  page: string;
  route: string;
  has_required_data: boolean;
  notes: string;
}

export default function OpalMonitoringPage() {
  const [healthData, setHealthData] = useState<IntegrationHealthData | null>(null);
  const [latestWorkflow, setLatestWorkflow] = useState<LatestWorkflowRun | null>(null);
  const [resultsPageStatuses, setResultsPageStatuses] = useState<ResultsPageStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMonitoringData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch integration health data (existing functionality)
      const healthResponse = await fetch('/api/opal/agent-data?agent=integration_health');
      const healthData = await healthResponse.json();

      if (healthData.success) {
        setHealthData(healthData);
      }

      // Fetch latest workflow run
      try {
        const latestWorkflowData = await getLatestWorkflowRun();
        setLatestWorkflow(latestWorkflowData);

        // If we have a workflow, fetch results page statuses
        if (latestWorkflowData) {
          const resultsData = await getResultsPageStatuses(latestWorkflowData.workflow_id);
          setResultsPageStatuses(resultsData);
        }
      } catch (workflowErr) {
        console.warn('Workflow data fetch failed:', workflowErr);
        // Don't fail the entire page if workflow data is unavailable
      }

      // Only set error if integration health also failed
      if (!healthData.success && !latestWorkflow) {
        setError('Admin monitoring is temporarily unavailable');
      }
    } catch (err) {
      console.error('Monitoring data fetch error:', err);
      setError('Admin monitoring is temporarily unavailable');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMonitoringData();
  }, []);

  const getHealthStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'healthy':
        return 'text-green-600 bg-green-100';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      case 'error':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getHealthIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'healthy':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default:
        return <Activity className="h-5 w-5 text-gray-600" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-b-2 border-blue-600 rounded-full mx-auto mb-3"></div>
          <p className="text-sm text-gray-600">Loading OPAL integration health...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">No Integration Health Data Available</CardTitle>
            <CardDescription className="text-red-600">{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => fetchMonitoringData()}
              className="flex items-center gap-2"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!healthData) {
    return (
      <div className="p-8">
        <Card>
          <CardHeader>
            <CardTitle>No Integration Health Data Available</CardTitle>
            <CardDescription>No agent data available. Please check the integration or try again later.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => fetchMonitoringData()}
              className="flex items-center gap-2"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="text-center py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">OPAL Monitoring Dashboard</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Monitor the health and performance of your OPAL Strategy Assistant integration with Optimizely DXP.
        </p>
      </div>

      {/* System Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            System Status
          </CardTitle>
          <CardDescription>
            Current workflow status and system health indicators
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-600">Latest Workflow</p>
              <p className="text-lg font-semibold text-gray-900">
                {latestWorkflow ? latestWorkflow.workflow_id : 'None'}
              </p>
              <Badge className={latestWorkflow ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                {latestWorkflow ? latestWorkflow.status : 'No workflows found'}
              </Badge>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-600">OPAL Integration</p>
              <div className="flex items-center gap-2">
                {latestWorkflow ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <Badge className="bg-green-100 text-green-800">✅ Connected</Badge>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <Badge className="bg-red-100 text-red-800">❌ No data</Badge>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-600">Data Storage</p>
              <div className="flex items-center gap-2">
                {resultsPageStatuses.some(page => page.has_required_data) ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <Badge className="bg-green-100 text-green-800">✅ Operational</Badge>
                  </>
                ) : latestWorkflow ? (
                  <>
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    <Badge className="bg-yellow-100 text-yellow-800">⚠️ Limited data</Badge>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <Badge className="bg-red-100 text-red-800">❌ No data</Badge>
                  </>
                )}
              </div>
            </div>
          </div>

          {!latestWorkflow && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>No workflow runs found yet.</strong> Trigger the canonical workflow, then refresh this page.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Workflow Details */}
      {latestWorkflow && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-purple-600" />
              Workflow Details
            </CardTitle>
            <CardDescription>
              Details about the most recent workflow execution
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-600">Workflow ID</p>
                  <p className="text-sm text-gray-900 font-mono">{latestWorkflow.workflow_id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Started At</p>
                  <p className="text-sm text-gray-900">
                    <SafeDate date={latestWorkflow.started_at} format="datetime" />
                  </p>
                </div>
                {latestWorkflow.completed_at && (
                  <div>
                    <p className="text-sm font-medium text-gray-600">Completed At</p>
                    <p className="text-sm text-gray-900">
                      <SafeDate date={latestWorkflow.completed_at} format="datetime" />
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-600">Agent Progress</p>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-blue-600">
                      {latestWorkflow.agents_completed}/{latestWorkflow.agents_expected}
                    </span>
                    <span className="text-sm text-gray-600">agents completed</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Status</p>
                  <Badge className={
                    latestWorkflow.status === 'completed' ? 'bg-green-100 text-green-800' :
                    latestWorkflow.status === 'running' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }>
                    {latestWorkflow.status}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Pages Status */}
      {resultsPageStatuses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5 text-green-600" />
              Results Pages Status
            </CardTitle>
            <CardDescription>
              Status of individual results pages and their data availability
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-2 font-medium text-gray-600">Page</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-600">Status</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-600">Notes</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-600">Link</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {resultsPageStatuses.map((page, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="py-3 px-2 font-medium text-gray-900">{page.page}</td>
                      <td className="py-3 px-2">
                        {page.has_required_data ? (
                          <Badge className="bg-green-100 text-green-800">✅ Ready</Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-800">❌ Missing data</Badge>
                        )}
                      </td>
                      <td className="py-3 px-2 text-gray-600">{page.notes}</td>
                      <td className="py-3 px-2">
                        <Link
                          href={page.route}
                          className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                        >
                          View
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Integration Status Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Status</p>
                <div className="flex items-center gap-2 mt-2">
                  {getHealthIcon(healthData.dataSentToOSA.integration_status)}
                  <Badge className={getHealthStatusColor(healthData.dataSentToOSA.integration_status)}>
                    {healthData.dataSentToOSA.integration_status}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Health Score</p>
                <div className="flex items-center gap-2 mt-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  <p className="text-2xl font-bold text-gray-900">
                    {healthData.dataSentToOSA.health_score}/100
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Uptime</p>
                <div className="flex items-center gap-2 mt-2">
                  <Server className="h-5 w-5 text-green-600" />
                  <p className="text-2xl font-bold text-gray-900">
                    {healthData.dataSentToOSA.uptime_percentage}%
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Last Sync</p>
                <div className="flex items-center gap-2 mt-2">
                  <Clock className="h-5 w-5 text-gray-600" />
                  <p className="text-sm text-gray-900">
                    <SafeDate date={healthData.dataSentToOSA.last_sync} format="datetime" />
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* API Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-600" />
            API Performance
          </CardTitle>
          <CardDescription>
            Response times across Optimizely DXP services
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {Object.entries(healthData.dataSentToOSA.api_response_times).map(([service, time]) => (
              <div key={service} className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm font-medium text-gray-900 mb-1 capitalize">
                  {service.replace('_', ' ')}
                </div>
                <div className="text-2xl font-bold text-blue-600">{time}</div>
                <div className="text-xs text-gray-500 mt-1">
                  Error Rate: {(healthData.dataSentToOSA.error_rates[service] * 100).toFixed(2)}%
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Connected Tools */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-purple-600" />
            Connected DXP Tools
          </CardTitle>
          <CardDescription>
            Optimizely DXP tools currently integrated with OPAL
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {healthData.optimizelyDxpTools.map((tool, index) => (
              <Badge key={index} variant="outline" className="bg-purple-50 text-purple-800 border-purple-200">
                {tool}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Explore Agent Data</CardTitle>
            <CardDescription>
              View detailed insights from all 8 OPAL strategy assistant agents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/engine/admin/opal-monitoring/agent-data/content">
              <Button className="w-full flex items-center gap-2">
                View Agent Data
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Integration Health Details</CardTitle>
            <CardDescription>
              View comprehensive integration health monitoring and metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full flex items-center gap-2"
                onClick={() => window.open('/api/opal/agent-data?agent=integration_health', '_blank')}
              >
                View Raw Data
                <ExternalLink className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => fetchMonitoringData()}
              >
                Refresh Data
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer Info */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-6">
          <div className="text-sm text-blue-800">
            <strong>About OPAL Integration:</strong> This dashboard shows the real-time health status
            of your OPAL (Optimized Performance & Analytics Layer) integration with Optimizely DXP.
            The system continuously monitors API performance, uptime, and data synchronization to ensure
            optimal performance of your strategy assistant workflows.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}