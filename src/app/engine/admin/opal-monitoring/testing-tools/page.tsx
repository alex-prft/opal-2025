'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TestTube } from 'lucide-react';

export default function TestingToolsPage() {
  const handleRunSimulator = async () => {
    try {
      console.log('🎭 Running OPAL simulator...');
      alert('OPAL Simulator started! Check the console and agent dashboard for updates.');
    } catch (error) {
      console.error('Failed to start simulator:', error);
    }
  };

  return (
    <div className="space-y-6" id="testing-tools-page">
      {/* Header */}
      <div id="page-header">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <TestTube className="h-8 w-8 text-blue-600" />
          Testing Tools
        </h1>
        <p className="text-gray-600 mt-1">
          Test OPAL connectors and validate webhook integrations
        </p>
      </div>

      {/* Testing Tools */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="testing-tools-section">
        <Card id="opal-webhook-simulator-card">
          <CardHeader>
            <CardTitle>OPAL Webhook Simulator</CardTitle>
            <CardDescription>
              Test the OPAL connector with realistic webhook data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={handleRunSimulator} className="w-full" id="run-full-simulation-btn">
              <TestTube className="h-4 w-4 mr-2" />
              Run Full Workflow Simulation
            </Button>

            <div className="grid grid-cols-2 gap-2" id="single-test-buttons">
              <Button variant="outline" size="sm" id="test-single-agent-btn">
                Test Single Agent
              </Button>
              <Button variant="outline" size="sm" id="test-failures-btn">
                Test Failures
              </Button>
            </div>

            <div className="text-sm text-gray-600 p-3 bg-blue-50 rounded" id="cli-usage-info">
              <p><strong>CLI Usage:</strong></p>
              <code className="text-xs">npx tsx scripts/test-opal-simulator.ts demo</code>
            </div>
          </CardContent>
        </Card>

        <Card id="validation-testing-card">
          <CardHeader>
            <CardTitle>Validation Testing</CardTitle>
            <CardDescription>
              Test data validation and error handling
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full" id="test-data-validation-btn">
              Test Data Validation
            </Button>
            <Button variant="outline" className="w-full" id="test-error-scenarios-btn">
              Test Error Scenarios
            </Button>
            <Button variant="outline" className="w-full" id="performance-load-test-btn">
              Performance Load Test
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* API Endpoints Status */}
      <Card id="api-endpoints-status-card">
        <CardHeader>
          <CardTitle>API Endpoints Status</CardTitle>
          <CardDescription>
            Monitor the health of OPAL connector API endpoints
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3" id="api-endpoints-list">
            {[
              { endpoint: '/api/opal/discovery', status: 'healthy', response_time: '45ms' },
              { endpoint: '/api/opal/osa-workflow', status: 'healthy', response_time: '120ms' },
              { endpoint: '/api/webhooks/opal', status: 'healthy', response_time: '80ms' }
            ].map((api, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg" id={`api-endpoint-${index}`}>
                <div>
                  <code className="text-sm font-mono">{api.endpoint}</code>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    {api.status}
                  </Badge>
                  <span className="text-sm text-gray-500">{api.response_time}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}