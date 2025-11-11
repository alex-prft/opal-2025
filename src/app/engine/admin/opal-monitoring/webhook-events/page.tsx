'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Network, CheckCircle, XCircle } from 'lucide-react';

export default function WebhookEventsPage() {
  const [webhookStats, setWebhookStats] = useState({
    total_received: 0,
    successful: 0,
    failed: 0,
    last_24h: 0
  });

  // Recent webhook events for display
  const [recentEvents, setRecentEvents] = useState<Array<{
    id: string;
    type: string;
    agent: string;
    status: 'success' | 'failed';
    time: string;
    received_at: string;
  }>>([]);

  // Fetch webhook statistics and events
  const fetchWebhookData = async () => {
    try {
      const response = await fetch('/api/webhook-events/stats?hours=24');
      const data = await response.json();

      if (data.success) {
        setWebhookStats(data.stats);
        console.log('📊 Webhook stats updated:', data.stats);
      } else {
        console.error('Failed to fetch webhook stats:', data.error);
      }

      // Fetch recent webhook events for display
      const eventsResponse = await fetch('/api/webhook-events/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workflow_id: 'strategy_assistant',
          limit: 10
        })
      });

      const eventsData = await eventsResponse.json();
      if (eventsData.success && eventsData.events) {
        // Transform events for display
        const transformedEvents = eventsData.events.map((event: any) => ({
          id: event.id,
          type: event.event_type || 'webhook.received',
          agent: event.agent_name || event.agent_id || 'unknown',
          status: event.success ? 'success' as const : 'failed' as const,
          time: event.received_at ? new Date(event.received_at).toLocaleTimeString() : 'unknown',
          received_at: event.received_at
        }));

        setRecentEvents(transformedEvents);
        console.log('📋 Recent events updated:', transformedEvents.length, 'events');
      } else {
        setRecentEvents([]);
      }

    } catch (error) {
      console.error('Error fetching webhook data:', error);
      setRecentEvents([]);
    }
  };

  useEffect(() => {
    // Initial fetch when component mounts
    fetchWebhookData();

    // Set up auto-refresh every 10 seconds
    const interval = setInterval(() => {
      fetchWebhookData();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6" id="webhook-events-page">
      {/* Header */}
      <div id="page-header">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Network className="h-8 w-8 text-blue-600" />
          Webhook Events
        </h1>
        <p className="text-gray-600 mt-1">
          Monitor incoming webhook events and their processing status
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="webhook-stats-overview">
        <Card id="total-received-card">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{webhookStats.total_received}</p>
              <p className="text-sm text-gray-600">Total Received</p>
            </div>
          </CardContent>
        </Card>
        <Card id="successful-events-card">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{webhookStats.successful}</p>
              <p className="text-sm text-gray-600">Successful</p>
            </div>
          </CardContent>
        </Card>
        <Card id="failed-events-card">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{webhookStats.failed}</p>
              <p className="text-sm text-gray-600">Failed</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Events */}
      <Card id="recent-events-card">
        <CardHeader>
          <CardTitle>Recent Webhook Events</CardTitle>
          <CardDescription>
            Live stream of incoming webhook events and processing status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3" id="events-list">
            {recentEvents.length > 0 ? (
              recentEvents.map((event) => (
                <div key={event.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg" id={`webhook-event-${event.id}`}>
                  <div className="flex items-center gap-3">
                    <Badge variant={event.status === 'success' ? 'default' : 'destructive'}>
                      {event.type}
                    </Badge>
                    <span className="text-sm font-medium">{event.agent}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {event.status === 'success' ?
                      <CheckCircle className="h-4 w-4 text-green-600" /> :
                      <XCircle className="h-4 w-4 text-red-600" />
                    }
                    <span className="text-sm text-gray-500">{event.time}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-gray-500" id="no-events-state">
                <XCircle className="h-12 w-12 text-gray-300 mb-3" />
                <p className="text-lg font-medium mb-2">No webhook events received</p>
                <p className="text-sm text-center">
                  No OPAL workflow triggers have been received yet.
                  <br />
                  Use the Force Sync button to test the connection.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}