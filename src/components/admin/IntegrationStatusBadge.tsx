'use client';

import { CheckCircle, XCircle, AlertCircle, Clock, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface IntegrationStatusData {
  overall_status: 'healthy' | 'degraded' | 'failed';
  force_sync_success: boolean | null;
  opal_agents_health: 'all_healthy' | 'some_degraded' | 'all_failed';
  osa_reception_rate: number | null;
  results_generation_success: boolean | null;
  created_at: string;
  workflow_correlation_id?: string | null;
}

interface IntegrationStatusBadgeProps {
  integrationStatus: IntegrationStatusData | null | undefined;
  isLoading: boolean;
  compact?: boolean;
  className?: string;
}

export function IntegrationStatusBadge({
  integrationStatus,
  isLoading,
  compact = false,
  className = '',
}: IntegrationStatusBadgeProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Loader2 className="h-3 w-3 animate-spin text-gray-400" />
        <span className="text-xs text-gray-500">
          {compact ? 'Checking...' : 'Checking integration...'}
        </span>
      </div>
    );
  }

  // No integration status data
  if (!integrationStatus) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <AlertCircle className="h-3 w-3 text-gray-400" />
        <span className="text-xs text-gray-500">
          {compact ? 'No validation' : 'No integration validation'}
        </span>
      </div>
    );
  }

  const {
    overall_status,
    force_sync_success,
    opal_agents_health,
    osa_reception_rate,
    results_generation_success,
    created_at,
  } = integrationStatus;

  // Determine badge appearance based on overall status
  const getStatusConfig = () => {
    switch (overall_status) {
      case 'healthy':
        return {
          icon: CheckCircle,
          label: compact ? 'Integration OK' : 'OPAL Integration Healthy',
          className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          iconColor: 'text-emerald-600',
        };
      case 'degraded':
        return {
          icon: AlertCircle,
          label: compact ? 'Integration Issues' : 'OPAL Integration Degraded',
          className: 'bg-amber-50 text-amber-700 border-amber-200',
          iconColor: 'text-amber-600',
        };
      case 'failed':
        return {
          icon: XCircle,
          label: compact ? 'Integration Failed' : 'OPAL Integration Failed',
          className: 'bg-rose-50 text-rose-700 border-rose-200',
          iconColor: 'text-rose-600',
        };
      default:
        return {
          icon: AlertCircle,
          label: compact ? 'Unknown Status' : 'Integration Status Unknown',
          className: 'bg-gray-50 text-gray-700 border-gray-200',
          iconColor: 'text-gray-400',
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;
  const lastValidation = new Date(created_at);
  const timeSinceValidation = Date.now() - lastValidation.getTime();
  const minutesAgo = Math.floor(timeSinceValidation / (1000 * 60));

  // Determine if validation is stale (older than 30 minutes)
  const isStale = minutesAgo > 30;

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Icon className={`h-3 w-3 ${config.iconColor}`} />
        <Badge 
          variant="outline" 
          className={`text-[10px] px-2 py-[1px] ${config.className}`}
        >
          {config.label}
        </Badge>
        {isStale && (
          <Clock className="h-3 w-3 text-gray-400" title={`Last validation: ${minutesAgo}m ago`} />
        )}
      </div>
    );
  }

  // Full detailed view
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${config.iconColor}`} />
          <span className="text-sm font-medium">{config.label}</span>
        </div>
        <Badge 
          variant="outline" 
          className={`text-xs px-2 py-1 ${config.className}`}
        >
          {overall_status.toUpperCase()}
        </Badge>
      </div>

      {/* Detailed status breakdown */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-1">
          {force_sync_success === true ? (
            <CheckCircle className="h-3 w-3 text-emerald-600" />
          ) : force_sync_success === false ? (
            <XCircle className="h-3 w-3 text-rose-600" />
          ) : (
            <AlertCircle className="h-3 w-3 text-gray-400" />
          )}
          <span className="text-gray-600">Force Sync</span>
        </div>

        <div className="flex items-center gap-1">
          {opal_agents_health === 'all_healthy' ? (
            <CheckCircle className="h-3 w-3 text-emerald-600" />
          ) : opal_agents_health === 'some_degraded' ? (
            <AlertCircle className="h-3 w-3 text-amber-600" />
          ) : opal_agents_health === 'all_failed' ? (
            <XCircle className="h-3 w-3 text-rose-600" />
          ) : (
            <AlertCircle className="h-3 w-3 text-gray-400" />
          )}
          <span className="text-gray-600">OPAL Agents</span>
        </div>

        <div className="flex items-center gap-1">
          {osa_reception_rate !== null && osa_reception_rate >= 0.8 ? (
            <CheckCircle className="h-3 w-3 text-emerald-600" />
          ) : osa_reception_rate !== null && osa_reception_rate >= 0.5 ? (
            <AlertCircle className="h-3 w-3 text-amber-600" />
          ) : osa_reception_rate !== null ? (
            <XCircle className="h-3 w-3 text-rose-600" />
          ) : (
            <AlertCircle className="h-3 w-3 text-gray-400" />
          )}
          <span className="text-gray-600">
            OSA Reception {osa_reception_rate !== null ? `(${Math.round(osa_reception_rate * 100)}%)` : ''}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {results_generation_success === true ? (
            <CheckCircle className="h-3 w-3 text-emerald-600" />
          ) : results_generation_success === false ? (
            <XCircle className="h-3 w-3 text-rose-600" />
          ) : (
            <AlertCircle className="h-3 w-3 text-gray-400" />
          )}
          <span className="text-gray-600">Results Generation</span>
        </div>
      </div>

      {/* Last validation timestamp */}
      <div className="flex items-center gap-1 text-[11px] text-gray-500">
        <Clock className="h-3 w-3" />
        <span>
          Last validated: {minutesAgo < 1 ? 'just now' : `${minutesAgo}m ago`}
          {isStale && ' (stale)'}
        </span>
      </div>
    </div>
  );
}

export default IntegrationStatusBadge;