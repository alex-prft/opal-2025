'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  Wifi,
  WifiOff,
  RefreshCw,
  ExternalLink,
  Activity
} from 'lucide-react';

interface Integration {
  id: string;
  name: string;
  status: 'healthy' | 'warning' | 'error' | 'offline';
  lastChecked: Date;
  responseTime?: number;
  uptime?: number;
  errorCount?: number;
  description?: string;
  actionUrl?: string;
}

interface IntegrationHealthProps {
  title: string;
  integrations: Integration[];
  onRefresh?: () => void;
  className?: string;
}

export default function IntegrationHealth({
  title,
  integrations,
  onRefresh,
  className = ''
}: IntegrationHealthProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'offline': return <WifiOff className="h-4 w-4 text-gray-500" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'border-green-200 bg-green-50';
      case 'warning': return 'border-yellow-200 bg-yellow-50';
      case 'error': return 'border-red-200 bg-red-50';
      case 'offline': return 'border-gray-200 bg-gray-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return <Badge className="bg-green-100 text-green-800">Healthy</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800">Warning</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800">Error</Badge>;
      case 'offline':
        return <Badge className="bg-gray-100 text-gray-800">Offline</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
    }
  };

  const healthyCount = integrations.filter(i => i.status === 'healthy').length;
  const warningCount = integrations.filter(i => i.status === 'warning').length;
  const errorCount = integrations.filter(i => i.status === 'error').length;
  const offlineCount = integrations.filter(i => i.status === 'offline').length;

  const overallHealth = integrations.length > 0 ?
    (healthyCount / integrations.length) * 100 : 0;

  const getOverallStatus = () => {
    if (errorCount > 0 || offlineCount > 0) return 'critical';
    if (warningCount > 0) return 'warning';
    return 'healthy';
  };

  const overallStatus = getOverallStatus();

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wifi className="h-5 w-5 text-blue-600" />
            {title}
          </div>
          <div className="flex items-center gap-2">
            <Badge
              className={
                overallStatus === 'healthy' ? 'bg-green-100 text-green-800' :
                overallStatus === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }
            >
              {Math.round(overallHealth)}% Healthy
            </Badge>
            {onRefresh && (
              <Button onClick={onRefresh} variant="ghost" size="sm">
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{healthyCount}</div>
              <div className="text-sm text-green-700">Healthy</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{warningCount}</div>
              <div className="text-sm text-yellow-700">Warning</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{errorCount}</div>
              <div className="text-sm text-red-700">Error</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-600">{offlineCount}</div>
              <div className="text-sm text-gray-700">Offline</div>
            </div>
          </div>

          {/* Integration List */}
          <div className="space-y-3">
            {integrations.map((integration) => (
              <div
                key={integration.id}
                className={`p-4 rounded-lg border-2 transition-all hover:shadow-sm ${getStatusColor(integration.status)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="flex-shrink-0 mt-0.5">
                      {getStatusIcon(integration.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="font-medium text-gray-900">
                          {integration.name}
                        </div>
                        {getStatusBadge(integration.status)}
                      </div>

                      {integration.description && (
                        <div className="text-sm text-gray-600 mb-2">
                          {integration.description}
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div>
                          Last checked: {integration.lastChecked.toLocaleTimeString()}
                        </div>

                        {integration.responseTime && (
                          <div>
                            Response: {integration.responseTime}ms
                          </div>
                        )}

                        {integration.uptime !== undefined && (
                          <div>
                            Uptime: {integration.uptime.toFixed(1)}%
                          </div>
                        )}

                        {integration.errorCount !== undefined && integration.errorCount > 0 && (
                          <div className="text-red-600">
                            {integration.errorCount} errors
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {integration.actionUrl && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(integration.actionUrl, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {integrations.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <div className="text-lg font-medium mb-2">No Integrations Configured</div>
              <div className="text-sm">
                Set up integrations to monitor system health and connectivity.
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}