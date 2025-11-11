'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart } from 'lucide-react';

export default function PerformancePage() {
  const [webhookStats, setWebhookStats] = useState({
    total_received: 0,
    successful: 0,
    failed: 0,
    last_24h: 0
  });

  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');

  // Fetch webhook statistics
  const fetchWebhookStats = async () => {
    try {
      const response = await fetch('/api/webhook-events/stats?hours=24');
      const data = await response.json();

      if (data.success) {
        setWebhookStats(data.stats);
        setConnectionStatus(data.status.connection_status);
      } else {
        setConnectionStatus('disconnected');
      }
    } catch (error) {
      console.error('Error fetching webhook stats:', error);
      setConnectionStatus('disconnected');
    }
  };

  useEffect(() => {
    fetchWebhookStats();
    const interval = setInterval(fetchWebhookStats, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6" id="performance-page">
      {/* Header */}
      <div id="page-header">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <BarChart className="h-8 w-8 text-blue-600" />
          Performance Metrics
        </h1>
        <p className="text-gray-600 mt-1">
          System performance and resource utilization metrics
        </p>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" id="performance-metrics-overview">
        <Card id="response-time-card">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold">
                {webhookStats.total_received > 0 ? '< 1s' : '--'}
              </p>
              <p className="text-sm text-gray-600">Avg Response Time</p>
            </div>
          </CardContent>
        </Card>
        <Card id="success-rate-card">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold">
                {webhookStats.total_received > 0
                  ? `${Math.round((webhookStats.successful / webhookStats.total_received) * 100)}%`
                  : '0%'
                }
              </p>
              <p className="text-sm text-gray-600">Success Rate</p>
            </div>
          </CardContent>
        </Card>
        <Card id="events-per-day-card">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{webhookStats.last_24h}</p>
              <p className="text-sm text-gray-600">Events/24h</p>
            </div>
          </CardContent>
        </Card>
        <Card id="connection-health-card">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold">
                {connectionStatus === 'connected' ? '100%' :
                 connectionStatus === 'connecting' ? '50%' : '0%'}
              </p>
              <p className="text-sm text-gray-600">Connection Status</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Charts */}
      <Card id="performance-charts-card">
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
          <CardDescription>
            System performance and resource utilization over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg" id="charts-placeholder">
            <div className="text-center text-gray-500">
              <BarChart className="h-12 w-12 mx-auto mb-2" />
              <p>Performance charts would be rendered here</p>
              <p className="text-sm">Integration with monitoring service (e.g., DataDog, New Relic)</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}