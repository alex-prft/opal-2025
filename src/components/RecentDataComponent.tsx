'use client';

import { Activity, Calendar, RefreshCw, CheckCircle, XCircle, AlertCircle, ExternalLink, Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useRecentOsaStatus } from '@/hooks/useRecentOsaStatus';
import type { UseQueryResult } from '@tanstack/react-query';

type DisplayStatus = 'none' | 'processing' | 'success' | 'failed';

interface RecentDataComponentProps {
  className?: string;
  compact?: boolean;
}

interface OsaRecentStatus {
  lastWebhookAt: string | null;
  lastAgentDataAt: string | null;
  lastForceSyncAt: string | null;
  lastWorkflowStatus: 'idle' | 'running' | 'completed' | 'failed';
}

export default function RecentDataComponent({
  className = '',
  compact = false,
}: RecentDataComponentProps) {
  const {
    data: osaStatus,
    isLoading,
    error,
    refetch,
  }: UseQueryResult<OsaRecentStatus, Error> = useRecentOsaStatus();

  const displayStatus: DisplayStatus = getDisplayStatus(isLoading, error, osaStatus);
  const lastActivity = getLastActivityTime(osaStatus);

  // ─────────────────────────────────────
  // Compact variant
  // ─────────────────────────────────────
  if (compact) {
    return (
      <Card id="recent-data" className={className}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-semibold">Recent Data</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              className="h-6 w-6 p-0"
              disabled={isLoading}
            >
              <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-xs">
              <StatusIcon status={displayStatus} />
              <span className="text-gray-700">
                {getStatusLabel(displayStatus, osaStatus)}
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Calendar className="h-3 w-3" />
              {lastActivity ? formatRelativeTime(lastActivity) : 'Never'}
            </div>
          </div>

          {error && (
            <div className="mt-2 rounded bg-red-50 text-[11px] text-red-700 p-2">
              Error loading status: {error.message}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // ─────────────────────────────────────
  // Full variant
  // ─────────────────────────────────────
  return (
    <div id="recent-data" className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            OSA Strategy Assistant Status
          </CardTitle>
          <CardDescription>
            Real-time health monitoring for personalization workflows and content strategy
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Top row: status + last activity + refresh */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-sm">
                <StatusIcon status={displayStatus} />
                <span className="font-medium">
                  {getStatusTitle(displayStatus)}
                </span>
                <StatusBadge status={displayStatus} />
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <Calendar className="h-3 w-3" />
                <span className="font-medium">Last activity:</span>
                <span>
                  {lastActivity ? formatRelativeTime(lastActivity) : 'No recent activity'}
                </span>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="flex items-center gap-2"
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Raw timestamps summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <TimestampPill
              label="Last Webhook"
              value={osaStatus?.lastWebhookAt}
            />
            <TimestampPill
              label="Last Agent Data"
              value={osaStatus?.lastAgentDataAt}
            />
            <TimestampPill
              label="Last Force Sync"
              value={osaStatus?.lastForceSyncAt}
            />
          </div>

          {/* Marketing-focused status explanation */}
          <div className="border-t border-gray-100 pt-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                {getMarketingStatusTitle(displayStatus)}
              </h4>
              <p className="text-xs text-gray-600 mb-3">
                {getMarketingStatusDescription(displayStatus)}
              </p>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => window.open('/engine/admin', '_blank')}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  View OSA Logs
                </Button>

                {displayStatus === 'failed' || displayStatus === 'none' ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs text-blue-700 border-blue-200 hover:bg-blue-50"
                    onClick={() => window.open('/engine/admin#force-sync', '_blank')}
                  >
                    <Zap className="h-3 w-3 mr-1" />
                    Run Force Sync
                  </Button>
                ) : null}

                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-gray-600"
                  onClick={() => refetch()}
                  disabled={isLoading}
                >
                  <RefreshCw className={`h-3 w-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh Status
                </Button>
              </div>
            </div>
          </div>

          {/* Error block */}
          {error && (
            <div className="mt-2 rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-800">
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle className="h-4 w-4" />
                <span className="font-semibold">Error loading OSA status</span>
              </div>
              <p>{error.message}</p>
            </div>
          )}

          {/* Helper copy */}
          <div className="mt-2 text-[11px] text-gray-500">
            Status is computed from the most recent workflow state combined with the latest
            webhook, agent data, and Force Sync timestamps exposed by
            <code className="ml-1 rounded bg-gray-100 px-1 py-[1px]">
              /api/admin/osa/recent-status
            </code>.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────
// Helpers
// ─────────────────────────────────────

function getDisplayStatus(
  isLoading: boolean,
  error: Error | null | undefined,
  osaStatus: OsaRecentStatus | undefined | null
): DisplayStatus {
  if (error) return 'failed';
  if (isLoading && !osaStatus) return 'processing';
  if (!osaStatus) return 'none';

  switch (osaStatus.lastWorkflowStatus) {
    case 'running':
      return 'processing';
    case 'completed':
      return 'success';
    case 'failed':
      return 'failed';
    case 'idle':
    default:
      return osaStatus.lastWebhookAt || osaStatus.lastAgentDataAt ? 'success' : 'none';
  }
}

function getLastActivityTime(osaStatus?: OsaRecentStatus | null): string | null {
  if (!osaStatus) return null;

  const times = [
    osaStatus.lastWebhookAt,
    osaStatus.lastAgentDataAt,
    osaStatus.lastForceSyncAt,
  ].filter(Boolean) as string[];

  if (times.length === 0) return null;

  times.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  return times[0];
}

function formatRelativeTime(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleString();
  } catch {
    return timestamp;
  }
}

function getStatusLabel(status: DisplayStatus, osaStatus?: OsaRecentStatus | null): string {
  switch (status) {
    case 'success':
      return 'OSA is active and recently received data';
    case 'processing':
      return 'Workflow currently processing or status refreshing';
    case 'failed':
      return 'Failed to load workflow status';
    case 'none':
    default:
      return osaStatus
        ? 'No recent workflow activity detected'
        : 'No status data available yet';
  }
}

function getStatusTitle(status: DisplayStatus): string {
  switch (status) {
    case 'success':
      return 'OSA workflow healthy';
    case 'processing':
      return 'OSA workflow in progress';
    case 'failed':
      return 'OSA workflow error';
    case 'none':
    default:
      return 'No recent OSA workflow';
  }
}

function StatusIcon({ status }: { status: DisplayStatus }) {
  if (status === 'success') {
    return <CheckCircle className="h-4 w-4 text-emerald-600" />;
  }
  if (status === 'processing') {
    return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
  }
  if (status === 'failed') {
    return <XCircle className="h-4 w-4 text-rose-600" />;
  }
  return <AlertCircle className="h-4 w-4 text-gray-400" />;
}

function StatusBadge({ status }: { status: DisplayStatus }) {
  const labelMap: Record<DisplayStatus, string> = {
    none: 'No recent workflow',
    processing: 'Processing…',
    success: 'OK',
    failed: 'Failed',
  };

  const variantClasses: Record<DisplayStatus, string> = {
    none: 'bg-slate-100 text-slate-700 border-slate-200',
    processing: 'bg-amber-50 text-amber-700 border-amber-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    failed: 'bg-rose-50 text-rose-700 border-rose-200',
  };

  return (
    <Badge
      variant="outline"
      className={`px-2 py-[1px] text-[11px] font-medium ${variantClasses[status]}`}
    >
      {labelMap[status]}
    </Badge>
  );
}

function TimestampPill({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
      <div className="text-[11px] font-medium text-gray-600 mb-1">{label}</div>
      <div className="text-[11px] text-gray-800">
        {value ? new Date(value).toLocaleString() : 'No data'}
      </div>
    </div>
  );
}

function getMarketingStatusTitle(status: DisplayStatus): string {
  switch (status) {
    case 'success':
      return '✅ Personalization Engine Active';
    case 'processing':
      return '⚡ Strategy Updates in Progress';
    case 'failed':
      return '⚠️ Personalization System Needs Attention';
    case 'none':
    default:
      return '💤 No Recent Strategy Activity';
  }
}

function getMarketingStatusDescription(status: DisplayStatus): string {
  switch (status) {
    case 'success':
      return 'Your personalization strategy is running smoothly. New content, experiments, and audience insights are flowing into the Strategy Assistant. Customer experiences are being optimized in real-time.';
    case 'processing':
      return 'The system is actively processing new data and generating fresh strategy recommendations. This typically takes a few minutes to complete.';
    case 'failed':
      return 'There\'s an issue with the personalization workflow. Customer data and strategy updates may be delayed. Use the Force Sync button or check logs to investigate.';
    case 'none':
    default:
      return 'No recent personalization activity detected. This means new customer insights, content recommendations, and A/B test data aren\'t flowing into your strategy. Consider running a Force Sync to refresh the system.';
  }
}