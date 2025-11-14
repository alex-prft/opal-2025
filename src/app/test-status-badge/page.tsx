/**
 * Status Badge Test Page
 * Test and demonstration page for the StatusBadge component
 */

'use client';

import React, { useState, useEffect } from 'react';
import { StatusBadge, AgentStatusBadge, getStatusColor, type AgentStatus } from '@/components/shared/StatusBadge';

export default function TestStatusBadgePage() {
  const [selectedStatus, setSelectedStatus] = useState<AgentStatus>('healthy');
  const [selectedSize, setSelectedSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [selectedVariant, setSelectedVariant] = useState<'filled' | 'outline' | 'soft'>('filled');
  const [showIcon, setShowIcon] = useState(true);

  // Simulate loading status change
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulatedStatus, setSimulatedStatus] = useState<AgentStatus>('pending');

  const allStatuses: AgentStatus[] = ['healthy', 'degraded', 'error', 'loading', 'unknown', 'pending', 'success', 'warning'];

  useEffect(() => {
    if (isSimulating) {
      const statuses: AgentStatus[] = ['loading', 'pending', 'success'];
      let currentIndex = 0;

      const interval = setInterval(() => {
        setSimulatedStatus(statuses[currentIndex]);
        currentIndex = (currentIndex + 1) % statuses.length;

        if (currentIndex === 0 && statuses[currentIndex] === 'loading') {
          clearInterval(interval);
          setIsSimulating(false);
          setSimulatedStatus('success');
        }
      }, 1500);

      return () => clearInterval(interval);
    }
  }, [isSimulating]);

  const startSimulation = () => {
    setIsSimulating(true);
    setSimulatedStatus('loading');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Status Badge Component Test
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Testing the StatusBadge component with different states and configurations
          </p>
        </div>

        {/* Original Problem Demo */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Original Problem vs Solution</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-red-600 dark:text-red-400">❌ Problematic Approach</h3>
              <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <code className="text-sm text-red-800 dark:text-red-200">
                  {`const statusColors = {
  healthy: 'green',
  degraded: 'orange',
  error: 'red'
};

<div className={\`status-badge bg-\${statusColors[agentStatus]}\`}>
  {agentStatus}
</div>`}
                </code>
                <p className="text-sm text-red-700 dark:text-red-300 mt-2">
                  ⚠️ This approach may fail in production due to CSS purging
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium text-green-600 dark:text-green-400">✅ Safe Solution</h3>
              <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <code className="text-sm text-green-800 dark:text-green-200">
                  {`// Import the component
import { StatusBadge } from '@/components/shared/StatusBadge';

// Use with type safety
<StatusBadge status="healthy" />
<StatusBadge status="degraded" />
<StatusBadge status="error" />`}
                </code>
                <p className="text-sm text-green-700 dark:text-green-300 mt-2">
                  ✅ All classes are explicitly defined and won't be purged
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Controls */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Interactive Configuration</h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as AgentStatus)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                {allStatuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Size
              </label>
              <select
                value={selectedSize}
                onChange={(e) => setSelectedSize(e.target.value as 'sm' | 'md' | 'lg')}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="sm">Small</option>
                <option value="md">Medium</option>
                <option value="lg">Large</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Variant
              </label>
              <select
                value={selectedVariant}
                onChange={(e) => setSelectedVariant(e.target.value as 'filled' | 'outline' | 'soft')}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="filled">Filled</option>
                <option value="outline">Outline</option>
                <option value="soft">Soft</option>
              </select>
            </div>

            <div className="flex items-end">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={showIcon}
                  onChange={(e) => setShowIcon(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Show Icon</span>
              </label>
            </div>
          </div>

          <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Preview:</h3>
            <StatusBadge
              status={selectedStatus}
              size={selectedSize}
              variant={selectedVariant}
              showIcon={showIcon}
            />
          </div>
        </div>

        {/* All Status Types */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">All Status Types</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(['filled', 'outline', 'soft'] as const).map(variant => (
              <div key={variant} className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 capitalize">{variant} Variant</h3>
                <div className="space-y-2">
                  {allStatuses.map(status => (
                    <div key={status} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">{status}:</span>
                      <StatusBadge status={status} variant={variant} size="sm" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Size Variations */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Size Variations</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(['sm', 'md', 'lg'] as const).map(size => (
              <div key={size} className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{size.toUpperCase()} Size</h3>
                <div className="space-y-2">
                  <StatusBadge status="healthy" size={size} />
                  <StatusBadge status="warning" size={size} />
                  <StatusBadge status="error" size={size} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Legacy Component Support */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Legacy Component (Drop-in Replacement)</h2>

          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              The <code>AgentStatusBadge</code> component provides backward compatibility with existing code:
            </p>

            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
              <code className="text-sm">
                {`// Your original code:
const statusColors = {
  healthy: 'green',
  degraded: 'orange',
  error: 'red'
};
<div className={\`status-badge bg-\${statusColors[agentStatus]}\`}>{agentStatus}</div>

// Replace with:
<AgentStatusBadge agentStatus={agentStatus} />`}
              </code>
            </div>

            <div className="flex flex-wrap gap-4">
              <AgentStatusBadge agentStatus="healthy" />
              <AgentStatusBadge agentStatus="degraded" />
              <AgentStatusBadge agentStatus="error" />
              <AgentStatusBadge agentStatus="failed" />
              <AgentStatusBadge agentStatus="completed" />
              <AgentStatusBadge agentStatus="loading" />
            </div>
          </div>
        </div>

        {/* Status Simulation */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Status Simulation</h2>

          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              Watch how status badges handle state transitions:
            </p>

            <div className="flex items-center space-x-4">
              <button
                onClick={startSimulation}
                disabled={isSimulating}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSimulating ? 'Simulating...' : 'Start Simulation'}
              </button>

              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Current Status:</span>
                <StatusBadge status={simulatedStatus} />
              </div>
            </div>
          </div>
        </div>

        {/* Utility Function Demo */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Utility Function</h2>

          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              Use <code>getStatusColor()</code> for other components that need status colors:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {allStatuses.map(status => (
                <div key={status} className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <span className="text-sm capitalize">{status}</span>
                  <span className="text-sm font-mono bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded">
                    {getStatusColor(status)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}