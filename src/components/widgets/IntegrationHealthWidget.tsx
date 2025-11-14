/**
 * Integration Health Widget
 * Displays real-time status of Optimizely DXP Tools integrations
 */

'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { LineChart } from '@/components/charts/LineChart';
import { OPALData } from '@/lib/widget-config';
import { CheckCircle, AlertCircle, XCircle, Activity } from 'lucide-react';

export interface IntegrationHealthWidgetProps {
  data: OPALData;
  className?: string;
}

export function IntegrationHealthWidget({ data, className = '' }: IntegrationHealthWidgetProps) {
  const {
    integrationStatus,
    performanceData,
    freshnessMetrics
  } = data;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
      case 'healthy':
      case 'active':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'error':
      case 'disconnected':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Activity className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
      case 'healthy':
      case 'active':
        return 'default';
      case 'warning':
        return 'secondary';
      case 'error':
      case 'disconnected':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with overall status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Integration Health Dashboard
            {integrationStatus && (
              <Badge variant={getStatusColor(integrationStatus.overall)}>
                {integrationStatus.overall}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Real-time monitoring of Optimizely DXP Tools integration status
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Main content tabs */}
      <Tabs defaultValue="status" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="status">Status Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="freshness">Data Freshness</TabsTrigger>
        </TabsList>

        {/* Status Overview */}
        <TabsContent value="status">
          <div className="grid gap-4">
            {integrationStatus ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* SDK Status */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center space-x-2">
                      {getStatusIcon(integrationStatus.sdk?.status)}
                      <span>SDK Connection</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Badge variant={getStatusColor(integrationStatus.sdk?.status)}>
                        {integrationStatus.sdk?.status}
                      </Badge>
                      {integrationStatus.sdk?.latency && (
                        <p className="text-xs text-gray-600">
                          Latency: {integrationStatus.sdk.latency}ms
                        </p>
                      )}
                      {integrationStatus.sdk?.uptime && (
                        <p className="text-xs text-gray-600">
                          Uptime: {integrationStatus.sdk.uptime}%
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* API Status */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center space-x-2">
                      {getStatusIcon(integrationStatus.api?.status)}
                      <span>API Gateway</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Badge variant={getStatusColor(integrationStatus.api?.status)}>
                        {integrationStatus.api?.status}
                      </Badge>
                      {integrationStatus.api?.responseTime && (
                        <p className="text-xs text-gray-600">
                          Response: {integrationStatus.api.responseTime}ms
                        </p>
                      )}
                      {integrationStatus.api?.errorRate && (
                        <p className="text-xs text-gray-600">
                          Error Rate: {(integrationStatus.api.errorRate * 100).toFixed(2)}%
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Webhook Status */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center space-x-2">
                      {getStatusIcon(integrationStatus.webhook?.status)}
                      <span>Webhooks</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Badge variant={getStatusColor(integrationStatus.webhook?.status)}>
                        {integrationStatus.webhook?.status}
                      </Badge>
                      {integrationStatus.webhook?.eventsPerHour && (
                        <p className="text-xs text-gray-600">
                          Events: {integrationStatus.webhook.eventsPerHour}/hr
                        </p>
                      )}
                      {integrationStatus.webhook?.successRate && (
                        <p className="text-xs text-gray-600">
                          Success: {integrationStatus.webhook.successRate}%
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* SSE Status */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center space-x-2">
                      {getStatusIcon(integrationStatus.sse?.status)}
                      <span>Real-time Events</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Badge variant={getStatusColor(integrationStatus.sse?.status)}>
                        {integrationStatus.sse?.status}
                      </Badge>
                      {integrationStatus.sse?.connections && (
                        <p className="text-xs text-gray-600">
                          Connections: {integrationStatus.sse.connections}
                        </p>
                      )}
                      {integrationStatus.sse?.avgLatency && (
                        <p className="text-xs text-gray-600">
                          Avg Latency: {integrationStatus.sse.avgLatency}ms
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-gray-500 text-center">No integration status data available</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Performance Metrics */}
        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>
                System throughput, error rates, and response times
              </CardDescription>
            </CardHeader>
            <CardContent>
              {performanceData ? (
                <div className="space-y-6">
                  {/* Throughput */}
                  {performanceData.throughput && (
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-2">Throughput</h4>
                      <div className="flex items-center space-x-4">
                        <div className="flex-1">
                          <Progress
                            value={(performanceData.throughput.current / performanceData.throughput.max) * 100}
                            className="mb-2"
                          />
                        </div>
                        <div className="text-right">
                          <p className="text-sm">
                            {performanceData.throughput.current} / {performanceData.throughput.max}
                            <span className="text-gray-500 ml-1">{performanceData.throughput.unit}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Error Rates */}
                  {performanceData.errorRates && performanceData.errorRates.length > 0 && (
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-3">Error Rates by Service</h4>
                      <div className="space-y-3">
                        {performanceData.errorRates.map((service: any, index: number) => (
                          <div key={index} className="flex items-center justify-between">
                            <span className="text-sm">{service.service}</span>
                            <div className="flex items-center space-x-2">
                              <Progress
                                value={service.rate * 100}
                                className="w-24"
                              />
                              <span className="text-xs text-gray-600 w-12">
                                {(service.rate * 100).toFixed(2)}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Response Time Percentiles */}
                  {performanceData.responseTime && (
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-3">Response Time Percentiles</h4>
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="p-3 bg-blue-50 rounded">
                          <p className="text-2xl font-bold text-blue-700">{performanceData.responseTime.p50}ms</p>
                          <p className="text-xs text-blue-600">50th percentile</p>
                        </div>
                        <div className="p-3 bg-yellow-50 rounded">
                          <p className="text-2xl font-bold text-yellow-700">{performanceData.responseTime.p95}ms</p>
                          <p className="text-xs text-yellow-600">95th percentile</p>
                        </div>
                        <div className="p-3 bg-red-50 rounded">
                          <p className="text-2xl font-bold text-red-700">{performanceData.responseTime.p99}ms</p>
                          <p className="text-xs text-red-600">99th percentile</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500">No performance data available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Freshness */}
        <TabsContent value="freshness">
          <Card>
            <CardHeader>
              <CardTitle>Data Freshness</CardTitle>
              <CardDescription>
                Real-time data synchronization status and data age
              </CardDescription>
            </CardHeader>
            <CardContent>
              {freshnessMetrics ? (
                <div className="space-y-6">
                  {/* Data Age */}
                  {freshnessMetrics.dataAge && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {Object.entries(freshnessMetrics.dataAge).map(([type, age]: [string, any]) => (
                        <Card key={type}>
                          <CardContent className="pt-6 text-center">
                            <p className="text-2xl font-bold">{age}</p>
                            <p className="text-sm text-gray-600 capitalize">{type} Data</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  {/* Sync Status */}
                  {freshnessMetrics.syncStatus && (
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-3">Synchronization Status</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Last Sync:</span>
                          <span className="text-sm font-medium">
                            {new Date(freshnessMetrics.syncStatus.lastSync).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Next Sync:</span>
                          <span className="text-sm font-medium">
                            {new Date(freshnessMetrics.syncStatus.nextSync).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500">No freshness data available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}