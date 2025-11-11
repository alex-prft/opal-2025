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

export default function OpalMonitoringPage() {
  const [healthData, setHealthData] = useState<IntegrationHealthData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIntegrationHealth = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/opal/agent-data?agent=integration_health');
      const data = await response.json();

      if (data.success) {
        setHealthData(data);
      } else {
        setError(data.error || 'No agent data available. Please check the integration or try again later.');
      }
    } catch (err) {
      console.error('Integration health fetch error:', err);
      setError('No agent data available. Please check the integration or try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrationHealth();
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
              onClick={() => fetchIntegrationHealth()}
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
              onClick={() => fetchIntegrationHealth()}
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
                onClick={() => fetchIntegrationHealth()}
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