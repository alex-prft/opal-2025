'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  ExternalLink,
  Users,
  BarChart3,
  Settings,
  Database
} from 'lucide-react';
import {
  getLatestWorkflowRun,
  getResultsPageStatuses,
  getMonitoringHealth,
  type WorkflowRunCard,
  type ResultsPageStatus
} from '@/lib/admin/opal-monitoring-service';

export default function WorkflowXrayPage() {
  const [latestWorkflow, setLatestWorkflow] = useState<WorkflowRunCard | null>(null);
  const [resultsStatuses, setResultsStatuses] = useState<ResultsPageStatus[]>([]);
  const [monitoringHealth, setMonitoringHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch latest workflow
      const workflow = await getLatestWorkflowRun();
      setLatestWorkflow(workflow);

      // If we have a workflow, fetch results page statuses
      if (workflow) {
        const statuses = await getResultsPageStatuses(workflow.workflow_id);
        setResultsStatuses(statuses);
      } else {
        setResultsStatuses([]);
      }

      // Fetch monitoring health
      const health = await getMonitoringHealth();
      setMonitoringHealth(health);

    } catch (err) {
      setError(`Failed to load workflow data: ${err}`);
      console.error('[Workflow X-ray] Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success" className="bg-green-100 text-green-800"><CheckCircle2 className="h-3 w-3 mr-1" />Completed</Badge>;
      case 'running':
      case 'in_progress':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800"><Clock className="h-3 w-3 mr-1" />Running</Badge>;
      case 'failed':
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getDataCompletenessColor = (completeness: number) => {
    if (completeness >= 100) return 'text-green-600';
    if (completeness >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getResultsPageIcon = (pageName: string) => {
    switch (pageName) {
      case 'Strategy': return <Settings className="h-4 w-4" />;
      case 'Insights': return <BarChart3 className="h-4 w-4" />;
      case 'Optimization': return <Users className="h-4 w-4" />;
      case 'DXP Tools': return <Database className="h-4 w-4" />;
      default: return <ExternalLink className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <Clock className="h-6 w-6 animate-spin mr-2" />
          Loading workflow data...
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">OPAL Workflow X-ray</h1>
          <p className="text-muted-foreground mt-1">
            Quick view of latest workflow status and results page readiness for demo confidence
          </p>
        </div>
        <Button onClick={fetchData} variant="outline">
          Refresh Data
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Error Loading Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Latest Workflow Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Latest Canonical Workflow Run
          </CardTitle>
          <CardDescription>
            Most recent workflow execution in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {latestWorkflow ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Workflow ID</p>
                  <p className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                    {latestWorkflow.workflow_id.slice(0, 8)}...
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  {getStatusBadge(latestWorkflow.status)}
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Client</p>
                  <p className="text-sm">{latestWorkflow.client_name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Started</p>
                  <p className="text-sm">
                    {new Date(latestWorkflow.started_at).toLocaleDateString()} {' '}
                    {new Date(latestWorkflow.started_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>

              {/* Agent Status */}
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Agent Status</p>
                <div className="flex flex-wrap gap-2">
                  {latestWorkflow.agents_expected.map(agentName => {
                    const isCompleted = latestWorkflow.agents_completed.includes(agentName);
                    return (
                      <Badge
                        key={agentName}
                        variant={isCompleted ? "default" : "outline"}
                        className={isCompleted ? "bg-green-100 text-green-800" : ""}
                      >
                        {isCompleted && <CheckCircle2 className="h-3 w-3 mr-1" />}
                        {agentName}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Database className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No workflow runs found in the system</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Pages Status */}
      {latestWorkflow && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Results Pages Data Readiness
            </CardTitle>
            <CardDescription>
              Data availability for each results page (workflow: {latestWorkflow.workflow_id.slice(0, 8)}...)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {resultsStatuses.map((pageStatus) => (
                <div
                  key={pageStatus.page_name}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getResultsPageIcon(pageStatus.page_name)}
                      <h4 className="font-medium">{pageStatus.page_name}</h4>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm font-medium ${getDataCompletenessColor(pageStatus.data_completeness)}`}>
                        {pageStatus.data_completeness}%
                      </span>
                      {pageStatus.has_required_data ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    {pageStatus.notes.map((note, index) => (
                      <p key={index} className="text-sm text-muted-foreground">
                        {note}
                      </p>
                    ))}
                  </div>

                  <Link href={pageStatus.route} target="_blank">
                    <Button variant="outline" size="sm" className="w-full">
                      View Page <ExternalLink className="h-3 w-3 ml-1" />
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Health */}
      {monitoringHealth && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle2 className="h-5 w-5 mr-2" />
              Monitoring System Health
            </CardTitle>
            <CardDescription>
              Database connectivity and table accessibility status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">Overall Status</span>
                <Badge
                  variant={monitoringHealth.status === 'healthy' ? 'default' : 'destructive'}
                  className={
                    monitoringHealth.status === 'healthy'
                      ? 'bg-green-100 text-green-800'
                      : monitoringHealth.status === 'degraded'
                      ? 'bg-yellow-100 text-yellow-800'
                      : ''
                  }
                >
                  {monitoringHealth.status}
                </Badge>
              </div>

              <div className="space-y-2">
                {monitoringHealth.checks.map((check: any, index: number) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{check.name}</span>
                    <div className="flex items-center space-x-2">
                      <span className={check.passed ? 'text-green-600' : 'text-red-600'}>
                        {check.message}
                      </span>
                      {check.passed ? (
                        <CheckCircle2 className="h-3 w-3 text-green-600" />
                      ) : (
                        <AlertTriangle className="h-3 w-3 text-red-600" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}