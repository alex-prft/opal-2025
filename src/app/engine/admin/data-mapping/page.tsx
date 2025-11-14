'use client';

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Map, RefreshCw, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Import admin components
import MappingTable from '@/components/admin/MappingTable';
import ContentBlueprint from '@/components/admin/ContentBlueprint';
import IntegrationStatus from '@/components/admin/IntegrationStatus';
import ResultsRoadmap from '@/components/admin/ResultsRoadmap';
import AuditSummary from '@/components/admin/AuditSummary';
import DownloadFixedMappingButton from '@/components/admin/DownloadFixedMappingButton';
import StrategyAssistantTrigger from '@/components/admin/StrategyAssistantTrigger';
import OpalAgentStatus from '@/components/admin/OpalAgentStatus';

interface AdminDashboardData {
  mapping_table: any[];
  content_blueprint: any;
  integration_status: any;
  results_roadmap: any[];
  mapping_validation_summary: any;
  audit_details?: any;
}

export default function DataMappingPage() {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Fetch admin dashboard data
  const fetchData = async () => {
    try {
      setError(null);
      const response = await fetch('/api/admin/mapping-status', {
        headers: {
          'Cache-Control': 'no-cache'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      setData(result);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to fetch admin data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load admin dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial data load
  useEffect(() => {
    fetchData();
  }, []);

  // Handle refresh
  const handleRefresh = async () => {
    setIsLoading(true);
    await fetchData();
  };

  // Handle when fixes are applied
  const handleFixApplied = () => {
    // Refresh the data after fixes are applied
    setTimeout(fetchData, 1000);
  };

  // Handle integration status refresh
  const handleIntegrationRefresh = async () => {
    // Just refresh the entire dataset for simplicity
    await fetchData();
  };

  // Check if there are issues that can be auto-fixed
  const hasIssues = data?.mapping_validation_summary &&
    (data.mapping_validation_summary.missing_tier3 > 0 ||
     data.mapping_validation_summary.agent_gaps > 0);

  // Error state
  if (error && !data) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Map className="h-8 w-8 text-blue-600" />
            OPAL Admin Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Mapping management and integration monitoring
          </p>
        </div>

        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <p className="font-medium text-red-800">Failed to Load Dashboard</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
                <Button
                  onClick={handleRefresh}
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  disabled={isLoading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Retry
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Map className="h-8 w-8 text-blue-600" />
              OPAL Admin Dashboard
            </h1>
            <p className="text-gray-600 mt-1">
              Mapping configuration, integration health, and development roadmap
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right text-xs text-gray-500">
              <div>Last updated</div>
              <div>{lastUpdated.toLocaleTimeString()}</div>
            </div>
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </div>

      {/* Error Banner (if error but we have cached data) */}
      {error && data && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <p className="text-sm text-yellow-800">
                Warning: {error} (showing cached data)
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="mapping-table" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="mapping-table" className="flex items-center gap-2">
            Mapping Table
          </TabsTrigger>
          <TabsTrigger value="content-blueprint" className="flex items-center gap-2">
            Content Blueprint
          </TabsTrigger>
          <TabsTrigger value="integration-status" className="flex items-center gap-2">
            Integration Status
          </TabsTrigger>
          <TabsTrigger value="webhook-trigger" className="flex items-center gap-2">
            Webhook Trigger
          </TabsTrigger>
          <TabsTrigger value="agent-status" className="flex items-center gap-2">
            Agent Status
          </TabsTrigger>
          <TabsTrigger value="results-roadmap" className="flex items-center gap-2">
            Results Roadmap
          </TabsTrigger>
        </TabsList>

        {/* Mapping Table Tab */}
        <TabsContent value="mapping-table" className="space-y-6">
          <AuditSummary
            data={data?.mapping_validation_summary}
            isLoading={isLoading}
          />
          <DownloadFixedMappingButton
            hasIssues={hasIssues}
            onFixApplied={handleFixApplied}
          />
          <MappingTable
            data={data?.mapping_table || []}
            isLoading={isLoading}
          />
        </TabsContent>

        {/* Content Blueprint Tab */}
        <TabsContent value="content-blueprint">
          <ContentBlueprint
            data={data?.content_blueprint}
            isLoading={isLoading}
          />
        </TabsContent>

        {/* Integration Status Tab */}
        <TabsContent value="integration-status">
          <IntegrationStatus
            data={data?.integration_status}
            isLoading={isLoading}
            onRefresh={handleIntegrationRefresh}
          />
        </TabsContent>

        {/* Strategy Assistant Webhook Trigger Tab */}
        <TabsContent value="webhook-trigger">
          <StrategyAssistantTrigger
            isLoading={isLoading}
            onRefresh={fetchData}
          />
        </TabsContent>

        {/* OPAL Agent Status Tab */}
        <TabsContent value="agent-status">
          <OpalAgentStatus
            isLoading={isLoading}
            onRefresh={fetchData}
          />
        </TabsContent>

        {/* Results Roadmap Tab */}
        <TabsContent value="results-roadmap">
          <ResultsRoadmap
            data={data?.results_roadmap}
            isLoading={isLoading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}