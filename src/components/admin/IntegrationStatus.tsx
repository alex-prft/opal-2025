'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Activity,
  Key,
  Webhook,
  Radio,
  Clock
} from 'lucide-react';

interface IntegrationStatusData {
  sdk_status: 'connected' | 'disconnected' | 'error';
  api_key: 'valid' | 'missing' | 'invalid';
  webhook: 'healthy' | 'unhealthy' | 'not_configured';
  sse: 'active' | 'inactive' | 'error';
  detailed_status?: any;
}

interface IntegrationStatusProps {
  data?: IntegrationStatusData;
  isLoading?: boolean;
  onRefresh?: () => void;
}

export default function IntegrationStatus({
  data,
  isLoading = false,
  onRefresh
}: IntegrationStatusProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (onRefresh && !isRefreshing) {
        handleRefresh();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [onRefresh, isRefreshing]);

  const handleRefresh = async () => {
    if (!onRefresh || isRefreshing) return;

    setIsRefreshing(true);
    try {
      await onRefresh();
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to refresh status:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Status indicator component
  const StatusIndicator = ({
    status,
    successStates = ['connected', 'valid', 'healthy', 'active'],
    warningStates = ['inactive', 'not_configured'],
    label
  }: {
    status: string;
    successStates?: string[];
    warningStates?: string[];
    label: string;
  }) => {
    let icon: React.ReactNode;
    let colorClass: string;
    let bgClass: string;

    if (successStates.includes(status)) {
      icon = <CheckCircle className="h-4 w-4" />;
      colorClass = 'text-green-700';
      bgClass = 'bg-green-100 border-green-200';
    } else if (warningStates.includes(status)) {
      icon = <AlertTriangle className="h-4 w-4" />;
      colorClass = 'text-yellow-700';
      bgClass = 'bg-yellow-100 border-yellow-200';
    } else {
      icon = <XCircle className="h-4 w-4" />;
      colorClass = 'text-red-700';
      bgClass = 'bg-red-100 border-red-200';
    }

    return (
      <div className={`flex items-center justify-between p-4 rounded-lg border ${bgClass}`}>
        <div className="flex items-center gap-3">
          <div className={colorClass}>{icon}</div>
          <div>
            <p className="font-medium text-sm">{label}</p>
            <p className={`text-xs capitalize ${colorClass}`}>{status.replace('_', ' ')}</p>
          </div>
        </div>
        <Badge
          variant="outline"
          className={`${bgClass} ${colorClass} border-0 text-xs font-medium`}
        >
          {status.replace('_', ' ')}
        </Badge>
      </div>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Integration Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Checking integration status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Integration Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-500">No integration status data available</p>
            {onRefresh && (
              <Button
                onClick={handleRefresh}
                variant="outline"
                size="sm"
                className="mt-4"
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh Status
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate overall health
  const statuses = [data.sdk_status, data.api_key, data.webhook, data.sse];
  const healthyCount = statuses.filter(status =>
    ['connected', 'valid', 'healthy', 'active'].includes(status)
  ).length;
  const totalCount = statuses.length;
  const healthPercentage = (healthyCount / totalCount) * 100;

  let overallHealth: 'healthy' | 'warning' | 'critical';
  if (healthPercentage >= 75) overallHealth = 'healthy';
  else if (healthPercentage >= 50) overallHealth = 'warning';
  else overallHealth = 'critical';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Integration Status
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Real-time OPAL integration health monitoring
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right text-xs text-gray-500">
              <div>Last updated</div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {lastUpdated.toLocaleTimeString()}
              </div>
            </div>
            {onRefresh && (
              <Button
                onClick={handleRefresh}
                variant="outline"
                size="sm"
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Overall Health Summary */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-sm">Overall Integration Health</h3>
              <p className="text-xs text-gray-600">
                {healthyCount} of {totalCount} services operational
              </p>
            </div>
            <Badge
              variant="outline"
              className={
                overallHealth === 'healthy'
                  ? 'bg-green-100 text-green-800 border-green-200'
                  : overallHealth === 'warning'
                  ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                  : 'bg-red-100 text-red-800 border-red-200'
              }
            >
              {overallHealth === 'healthy' ? '✅ Healthy' :
               overallHealth === 'warning' ? '⚠️ Warning' : '❌ Critical'}
            </Badge>
          </div>
          <div className="mt-2 bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${
                overallHealth === 'healthy' ? 'bg-green-500' :
                overallHealth === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${healthPercentage}%` }}
            />
          </div>
        </div>

        {/* Individual Service Status */}
        <div className="space-y-3">
          <h3 className="font-medium text-sm">Service Health Checklist</h3>

          <StatusIndicator
            status={data.sdk_status}
            label="OPAL SDK Connection"
            successStates={['connected']}
            warningStates={[]}
          />

          <StatusIndicator
            status={data.api_key}
            label="API Key Configuration"
            successStates={['valid']}
            warningStates={[]}
          />

          <StatusIndicator
            status={data.webhook}
            label="Webhook Health"
            successStates={['healthy']}
            warningStates={['not_configured']}
          />

          <StatusIndicator
            status={data.sse}
            label="Real-time Updates (SSE)"
            successStates={['active']}
            warningStates={['inactive']}
          />
        </div>

        {/* Detailed Status Information */}
        {data.detailed_status && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-sm mb-2">Detailed Metrics</h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              {data.detailed_status.metrics && (
                <>
                  <div>
                    <p className="text-gray-600">24h Events</p>
                    <p className="font-medium">{data.detailed_status.metrics.total_events_24h || 0}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Success Rate</p>
                    <p className="font-medium">
                      {((data.detailed_status.signature_valid_rate || 0) * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Last Event</p>
                    <p className="font-medium">
                      {data.detailed_status.last_webhook_minutes_ago !== null
                        ? `${data.detailed_status.last_webhook_minutes_ago}m ago`
                        : 'None'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Error Rate</p>
                    <p className="font-medium">
                      {((data.detailed_status.error_rate_24h || 0) * 100).toFixed(1)}%
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex gap-2 pt-2 border-t">
          <Button
            onClick={() => window.open('/api/opal/health', '_blank')}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            <Activity className="h-4 w-4 mr-2" />
            View Raw Health Data
          </Button>
          {data.detailed_status?.endpoints?.diagnostics && (
            <Button
              onClick={() => window.open(data.detailed_status.endpoints.diagnostics, '_blank')}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <Webhook className="h-4 w-4 mr-2" />
              Webhook Diagnostics
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}