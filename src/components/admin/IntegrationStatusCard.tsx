'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, Clock, RefreshCw, ExternalLink } from 'lucide-react';
import { useIntegrationStatus, useForceSyncValidation } from '@/hooks/useIntegrationStatus';
import { formatDistanceToNow } from 'date-fns';

interface IntegrationStatusCardProps {
  forceSyncWorkflowId?: string;
  tenantId?: string;
  showRefresh?: boolean;
  showDetails?: boolean;
  className?: string;
}

const StatusIcon = ({ status }: { status: 'green' | 'red' | 'yellow' }) => {
  switch (status) {
    case 'green':
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case 'yellow':
      return <Clock className="h-5 w-5 text-yellow-500" />;
    case 'red':
      return <AlertCircle className="h-5 w-5 text-red-500" />;
    default:
      return <AlertCircle className="h-5 w-5 text-gray-400" />;
  }
};

const StatusBadge = ({ status }: { status: 'green' | 'red' | 'yellow' }) => {
  const variants = {
    green: 'bg-green-100 text-green-800 border-green-200',
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    red: 'bg-red-100 text-red-800 border-red-200'
  };

  const labels = {
    green: 'Healthy',
    yellow: 'Partial Issues',
    red: 'Critical Issues'
  };

  return (
    <Badge className={`${variants[status]} border`}>
      {labels[status]}
    </Badge>
  );
};

export function IntegrationStatusCard({
  forceSyncWorkflowId,
  tenantId,
  showRefresh = false,
  showDetails = true,
  className = ''
}: IntegrationStatusCardProps) {
  const { data, isLoading, error, refetch } = useIntegrationStatus(
    forceSyncWorkflowId,
    tenantId,
    {
      staleTime: 30 * 1000, // 30 seconds
      refetchInterval: forceSyncWorkflowId ? false : 60 * 1000 // Auto-refresh for general status
    }
  );

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            Loading Integration Status...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (error || !data?.success) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            Integration Status Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            {error?.message || data?.error || 'Unable to load integration status'}
          </p>
          {showRefresh && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => refetch()}
              className="mt-2"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  const status = data.integrationStatus!;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StatusIcon status={status.overallStatus} />
            OPAL Integration Status
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={status.overallStatus} />
            {showRefresh && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => refetch()}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        <p className="text-sm text-gray-700">{status.summary}</p>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <p className="text-xs font-medium text-gray-500">Agent Reception</p>
            <p className="text-sm font-semibold">
              {(status.osa.receptionRate * 100).toFixed(0)}%
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-gray-500">OPAL Agents</p>
            <p className="text-sm font-semibold">
              {status.opal.agentResponseCount}/{status.forceSync.agentCount || 'N/A'}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-gray-500">Health Score</p>
            <p className="text-sm font-semibold">
              {status.health.signatureValidRate ? 
                `${(status.health.signatureValidRate * 100).toFixed(0)}%` : 
                'N/A'
              }
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-gray-500">Last Updated</p>
            <p className="text-sm font-semibold">
              {formatDistanceToNow(new Date(status.validatedAt), { addSuffix: true })}
            </p>
          </div>
        </div>

        {/* Workflow Information */}
        {(status.workflowId || status.correlationId) && (
          <div className="border-t pt-3 space-y-2">
            {status.workflowId && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Workflow ID:</span>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                  {status.workflowId.slice(-8)}
                </code>
              </div>
            )}
            {status.correlationId && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Correlation ID:</span>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                  {status.correlationId.slice(-8)}
                </code>
              </div>
            )}
          </div>
        )}

        {/* Detailed Status (optional) */}
        {showDetails && (
          <div className="border-t pt-3">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="font-medium text-gray-700">Force Sync</p>
                <p className="text-xs text-gray-500">
                  {status.forceSync.status || 'Unknown'}
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-700">OPAL Status</p>
                <p className="text-xs text-gray-500">
                  {status.opal.workflowStatus || 'Unknown'}
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-700">OSA Health</p>
                <p className="text-xs text-gray-500">
                  {status.health.overallStatus || 'Unknown'}
                </p>
              </div>
            </div>

            {/* Error Details */}
            {status.errors && Object.keys(status.errors).length > 0 && (
              <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
                <p className="text-xs font-medium text-red-800 mb-1">Issues Detected:</p>
                <div className="space-y-1">
                  {status.errors.failedAgents?.length > 0 && (
                    <p className="text-xs text-red-700">
                      Failed Agents: {status.errors.failedAgents.join(', ')}
                    </p>
                  )}
                  {status.errors.osaReceptionMissingAgents?.length > 0 && (
                    <p className="text-xs text-red-700">
                      Missing OSA Reception: {status.errors.osaReceptionMissingAgents.length} agents
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Specialized component for monitoring a specific Force Sync workflow
 */
export function ForceSyncValidationCard({
  forceSyncWorkflowId,
  pollUntilComplete = false,
  onValidationComplete,
  className = ''
}: {
  forceSyncWorkflowId: string;
  pollUntilComplete?: boolean;
  onValidationComplete?: (status: any) => void;
  className?: string;
}) {
  const { data, isLoading, error } = useForceSyncValidation(
    forceSyncWorkflowId,
    {
      pollUntilComplete,
      maxPollDuration: 5 * 60 * 1000 // 5 minutes max polling
    }
  );

  React.useEffect(() => {
    if (data?.integrationStatus && onValidationComplete) {
      const status = data.integrationStatus.overallStatus;
      if (status === 'green' || status === 'red') {
        onValidationComplete(data.integrationStatus);
      }
    }
  }, [data?.integrationStatus, onValidationComplete]);

  if (isLoading && !data) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            Validating Force Sync...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Performing end-to-end validation for workflow {forceSyncWorkflowId.slice(-8)}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <IntegrationStatusCard
      forceSyncWorkflowId={forceSyncWorkflowId}
      showRefresh={true}
      showDetails={true}
      className={className}
    />
  );
}