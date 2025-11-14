/**
 * Data Not Available Component
 * Provides graceful fallback displays when OPAL data is missing or unavailable
 */

'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Database,
  AlertCircle,
  RefreshCw,
  Settings,
  ExternalLink,
  Info,
  WifiOff,
  Clock,
  FileX
} from 'lucide-react';

export interface DataNotAvailableProps {
  title?: string;
  description?: string;
  reason?: 'loading' | 'error' | 'empty' | 'network' | 'timeout' | 'unauthorized' | 'maintenance';
  tier?: 'tier1' | 'tier2' | 'tier3';
  onRetry?: () => void;
  onConfigure?: () => void;
  showDetails?: boolean;
  className?: string;
}

export function DataNotAvailable({
  title,
  description,
  reason = 'empty',
  tier,
  onRetry,
  onConfigure,
  showDetails = false,
  className = ''
}: DataNotAvailableProps) {

  // Default configurations based on tier
  const tierConfigs = {
    tier1: {
      title: 'Summary Metrics Unavailable',
      description: 'High-level organizational metrics could not be loaded at this time.',
      icon: Database
    },
    tier2: {
      title: 'Section KPIs Unavailable',
      description: 'Section-specific performance indicators are currently unavailable.',
      icon: Settings
    },
    tier3: {
      title: 'Detailed Content Unavailable',
      description: 'Page-specific data and insights could not be retrieved.',
      icon: FileX
    }
  };

  // Reason-specific configurations
  const reasonConfigs = {
    loading: {
      title: 'Loading Data',
      description: 'Please wait while we fetch the latest information.',
      icon: Clock,
      variant: 'info' as const,
      showRetry: false
    },
    error: {
      title: 'Data Loading Error',
      description: 'An error occurred while retrieving data from OPAL.',
      icon: AlertCircle,
      variant: 'destructive' as const,
      showRetry: true
    },
    empty: {
      title: 'No Data Available',
      description: 'No data has been configured for this section yet.',
      icon: Database,
      variant: 'default' as const,
      showRetry: false,
      showConfigure: true
    },
    network: {
      title: 'Connection Issue',
      description: 'Unable to connect to OPAL data services.',
      icon: WifiOff,
      variant: 'destructive' as const,
      showRetry: true
    },
    timeout: {
      title: 'Request Timeout',
      description: 'The data request took too long to complete.',
      icon: Clock,
      variant: 'destructive' as const,
      showRetry: true
    },
    unauthorized: {
      title: 'Access Denied',
      description: 'You do not have permission to view this data.',
      icon: AlertCircle,
      variant: 'destructive' as const,
      showRetry: false,
      showConfigure: true
    },
    maintenance: {
      title: 'System Maintenance',
      description: 'OPAL services are temporarily unavailable for maintenance.',
      icon: Settings,
      variant: 'default' as const,
      showRetry: false
    }
  };

  // Get configurations
  const tierConfig = tier ? tierConfigs[tier] : null;
  const reasonConfig = reasonConfigs[reason];

  // Determine final values
  const finalTitle = title || reasonConfig.title || tierConfig?.title || 'Data Not Available';
  const finalDescription = description || reasonConfig.description || tierConfig?.description || 'The requested data could not be loaded.';
  const IconComponent = reasonConfig.icon || tierConfig?.icon || Database;

  return (
    <div className={`space-y-4 ${className}`}>
      <Card>
        <CardContent className="pt-8 pb-8">
          <div className="text-center space-y-4">
            {/* Icon */}
            <div className="flex justify-center">
              <div className={`p-3 rounded-full ${
                reasonConfig.variant === 'destructive'
                  ? 'bg-red-100 text-red-600'
                  : reasonConfig.variant === 'info'
                  ? 'bg-blue-100 text-blue-600'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                <IconComponent className="h-8 w-8" />
              </div>
            </div>

            {/* Title and Description */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900">
                {finalTitle}
              </h3>
              <p className="text-gray-600 max-w-md mx-auto">
                {finalDescription}
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              {(reasonConfig.showRetry !== false && onRetry) && (
                <Button
                  onClick={onRetry}
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              )}

              {(reasonConfig.showConfigure && onConfigure) && (
                <Button
                  onClick={onConfigure}
                  variant="default"
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Configure Data
                </Button>
              )}

              {reason === 'maintenance' && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto"
                  asChild
                >
                  <a href="/engine/admin" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    System Status
                  </a>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Details */}
      {showDetails && (
        <Alert variant={reasonConfig.variant}>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">Technical Details:</p>
              <ul className="text-sm space-y-1 ml-4">
                <li>• Tier Level: {tier || 'Unknown'}</li>
                <li>• Reason: {reason}</li>
                <li>• Timestamp: {new Date().toLocaleString()}</li>
                {tier && (
                  <li>• Expected Data: {tierConfig?.description}</li>
                )}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

// Specialized components for different scenarios
export function EmptyDataState({
  section,
  onConfigure,
  className = ''
}: {
  section: string;
  onConfigure?: () => void;
  className?: string;
}) {
  return (
    <DataNotAvailable
      title={`No ${section} Data`}
      description={`${section} data has not been configured yet. Set up your OPAL integration to see metrics here.`}
      reason="empty"
      onConfigure={onConfigure}
      className={className}
    />
  );
}

export function ErrorDataState({
  error,
  onRetry,
  className = ''
}: {
  error: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <DataNotAvailable
      title="Loading Error"
      description={error}
      reason="error"
      onRetry={onRetry}
      showDetails={true}
      className={className}
    />
  );
}

export function NetworkErrorState({
  onRetry,
  className = ''
}: {
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <DataNotAvailable
      title="Connection Problem"
      description="Unable to reach OPAL services. Please check your network connection."
      reason="network"
      onRetry={onRetry}
      className={className}
    />
  );
}

export function MaintenanceState({ className = '' }: { className?: string }) {
  return (
    <DataNotAvailable
      title="System Maintenance"
      description="OPAL services are temporarily offline for scheduled maintenance. Please check back shortly."
      reason="maintenance"
      className={className}
    />
  );
}

// Compact versions for smaller spaces
export function CompactDataNotAvailable({
  message = "Data not available",
  onRetry,
  className = ''
}: {
  message?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div className={`p-4 text-center text-gray-500 space-y-2 ${className}`}>
      <Database className="h-6 w-6 mx-auto text-gray-400" />
      <p className="text-sm">{message}</p>
      {onRetry && (
        <Button
          onClick={onRetry}
          variant="ghost"
          size="sm"
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Retry
        </Button>
      )}
    </div>
  );
}