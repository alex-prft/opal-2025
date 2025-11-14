/**
 * Health Component Test Page
 * Test and demonstration page for the enhanced health status components
 */

'use client';

import React, { useState } from 'react';
import { HealthStatusDisplay, CompactHealthStatus } from '@/components/shared/HealthStatusDisplay';
import { ImprovedHealthDisplay, InlineHealthDisplay, HealthStatusReplacement } from '@/components/shared/ImprovedHealthDisplay';
import { SafeDate, RelativeTime } from '@/components/shared/SafeDate';

export default function TestHealthComponentPage() {
  const [healthStatus, setHealthStatus] = useState<'healthy' | 'degraded' | 'unhealthy' | 'unknown'>('healthy');
  const [forceSyncTimestamp, setForceSyncTimestamp] = useState<string | null>(new Date().toISOString());
  const [isLoading, setIsLoading] = useState(false);

  const testDates = [
    new Date().toISOString(), // Now
    new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
    new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week ago
    null
  ];

  const refreshHealthStatus = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      // Simulate random health status change
      const statuses: Array<'healthy' | 'degraded' | 'unhealthy' | 'unknown'> = ['healthy', 'degraded', 'unhealthy', 'unknown'];
      setHealthStatus(statuses[Math.floor(Math.random() * statuses.length)]);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Health Status Component Test
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Testing various health status display components and their different states
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Controls</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Health Status
              </label>
              <select
                value={healthStatus}
                onChange={(e) => setHealthStatus(e.target.value as any)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="healthy">Healthy</option>
                <option value="degraded">Degraded</option>
                <option value="unhealthy">Unhealthy</option>
                <option value="unknown">Unknown</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Force Sync Timestamp
              </label>
              <select
                value={forceSyncTimestamp || ''}
                onChange={(e) => setForceSyncTimestamp(e.target.value || null)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="">No timestamp (null)</option>
                <option value={testDates[0] || ''}>Now</option>
                <option value={testDates[1] || ''}>5 minutes ago</option>
                <option value={testDates[2] || ''}>2 hours ago</option>
                <option value={testDates[3] || ''}>1 day ago</option>
                <option value={testDates[4] || ''}>1 week ago</option>
              </select>
            </div>
          </div>
          <button
            onClick={refreshHealthStatus}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Simulate Health Check Refresh
          </button>
        </div>

        {/* Enhanced Health Status Display */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Enhanced Health Status Display</h2>
          <HealthStatusDisplay
            healthStatus={healthStatus}
            forceSyncTimestamp={forceSyncTimestamp}
            lastHealthCheck={new Date().toISOString()}
            isLoading={isLoading}
            onRefresh={refreshHealthStatus}
          />
        </div>

        {/* Compact Health Status */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Compact Health Status</h2>
          <CompactHealthStatus
            healthStatus={healthStatus}
            forceSyncTimestamp={forceSyncTimestamp}
          />
        </div>

        {/* Improved Health Display */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Improved Health Display</h2>
          <ImprovedHealthDisplay
            healthStatus={healthStatus}
            forceSyncTimestamp={forceSyncTimestamp}
          />
        </div>

        {/* Inline Health Display */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Inline Health Display</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-2">
            This is some text with an inline health status: <InlineHealthDisplay
              healthStatus={healthStatus}
              forceSyncTimestamp={forceSyncTimestamp}
            />
          </p>
        </div>

        {/* Original Component Replacement */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Original Component (Drop-in Replacement)</h2>
          <HealthStatusReplacement
            healthStatus={healthStatus}
            forceSyncTimestamp={forceSyncTimestamp}
          />
        </div>

        {/* SafeDate Component Tests */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">SafeDate Component Tests</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Different Formats</h3>
              <div className="space-y-2 text-sm">
                <div>Full: <SafeDate date={forceSyncTimestamp} format="full" /></div>
                <div>Short: <SafeDate date={forceSyncTimestamp} format="short" /></div>
                <div>Time: <SafeDate date={forceSyncTimestamp} format="time" /></div>
                <div>Relative: <SafeDate date={forceSyncTimestamp} format="relative" /></div>
              </div>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Auto-updating Relative Time</h3>
              <div className="text-sm">
                <RelativeTime date={new Date().toISOString()} />
              </div>
            </div>
          </div>
        </div>

        {/* Loading State Test */}
        {isLoading && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Loading State</h2>
            <HealthStatusDisplay
              healthStatus="unknown"
              isLoading={true}
            />
          </div>
        )}
      </div>
    </div>
  );
}