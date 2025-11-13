/**
 * System Health Analytics API
 * Prometheus metrics integration and system health monitoring
 */

import { NextRequest, NextResponse } from 'next/server';
import { AdminAuthUtils } from '@/lib/auth/oauth-pkce';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface SystemHealthMetrics {
  prometheus: {
    eventRate: number;
    consumerLag: number;
    errorRate: number;
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    networkThroughput: number;
    activeConnections: number;
  };
  services: {
    name: string;
    status: 'healthy' | 'degraded' | 'down';
    uptime: number;
    responseTime: number;
    errorCount: number;
    lastCheck: string;
    version: string;
    dependencies: string[];
  }[];
  alerts: {
    id: string;
    severity: 'critical' | 'warning' | 'info';
    message: string;
    timestamp: string;
    source: string;
    acknowledged: boolean;
  }[];
  healthIndicators: {
    overall: number; // 0-100
    database: number;
    cache: number;
    messageQueue: number;
    externalServices: number;
  };
  trends: {
    timestamp: string;
    eventRate: number;
    errorRate: number;
    responseTime: number;
    cpuUsage: number;
    memoryUsage: number;
  }[];
}

export async function GET(request: NextRequest) {
  try {
    // Require technical admin access for system health
    const auth = await AdminAuthUtils.requireTechnicalAdmin(request);
    if (!auth.isAuthorized) {
      return NextResponse.json({
        error: auth.error || 'Unauthorized access to system health data'
      }, { status: 401 });
    }

    const url = new URL(request.url);
    const timeRange = url.searchParams.get('timeRange') || '1h';

    // Mock Prometheus and system health data
    const metrics: SystemHealthMetrics = {
      prometheus: {
        eventRate: 156.7, // events/second
        consumerLag: 23, // messages
        errorRate: 0.0023, // 0.23%
        cpuUsage: 34.2, // percentage
        memoryUsage: 67.8, // percentage
        diskUsage: 45.1, // percentage
        networkThroughput: 1247.8, // MB/s
        activeConnections: 89
      },
      services: [
        {
          name: 'OPAL API Gateway',
          status: 'healthy',
          uptime: 99.97,
          responseTime: 23.4,
          errorCount: 0,
          lastCheck: new Date(Date.now() - 30000).toISOString(),
          version: '2.1.0',
          dependencies: ['database', 'redis', 'kafka']
        },
        {
          name: 'OSA Agent Manager',
          status: 'healthy',
          uptime: 99.89,
          responseTime: 45.7,
          errorCount: 2,
          lastCheck: new Date(Date.now() - 15000).toISOString(),
          version: '1.8.2',
          dependencies: ['kafka', 'ml-models']
        },
        {
          name: 'Kafka Message Broker',
          status: 'degraded',
          uptime: 98.23,
          responseTime: 67.1,
          errorCount: 12,
          lastCheck: new Date(Date.now() - 20000).toISOString(),
          version: '3.5.1',
          dependencies: ['zookeeper']
        },
        {
          name: 'PostgreSQL Database',
          status: 'healthy',
          uptime: 99.99,
          responseTime: 12.8,
          errorCount: 0,
          lastCheck: new Date(Date.now() - 10000).toISOString(),
          version: '15.4',
          dependencies: []
        },
        {
          name: 'Redis Cache',
          status: 'healthy',
          uptime: 99.95,
          responseTime: 3.2,
          errorCount: 1,
          lastCheck: new Date(Date.now() - 25000).toISOString(),
          version: '7.2',
          dependencies: []
        },
        {
          name: 'ML Model Service',
          status: 'healthy',
          uptime: 97.45,
          responseTime: 234.5,
          errorCount: 8,
          lastCheck: new Date(Date.now() - 45000).toISOString(),
          version: '0.9.1',
          dependencies: ['gpu-cluster']
        }
      ],
      alerts: generateRecentAlerts(),
      healthIndicators: {
        overall: 96,
        database: 99,
        cache: 97,
        messageQueue: 89,
        externalServices: 94
      },
      trends: generateHealthTrends(timeRange)
    };

    return NextResponse.json({
      success: true,
      data: metrics,
      meta: {
        timestamp: new Date().toISOString(),
        timeRange,
        refreshInterval: 30000 // 30 seconds
      }
    });

  } catch (error) {
    console.error('[System Health] Error fetching metrics:', error);

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch system health metrics',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function generateRecentAlerts(): SystemHealthMetrics['alerts'] {
  const alerts = [
    {
      id: 'alert_001',
      severity: 'warning' as const,
      message: 'Kafka consumer lag above threshold (23 messages)',
      timestamp: new Date(Date.now() - 300000).toISOString(),
      source: 'kafka-monitor',
      acknowledged: false
    },
    {
      id: 'alert_002',
      severity: 'info' as const,
      message: 'ML model retrained successfully - accuracy improved to 94.2%',
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      source: 'ml-service',
      acknowledged: true
    },
    {
      id: 'alert_003',
      severity: 'critical' as const,
      message: 'Database connection pool exhausted',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      source: 'database-monitor',
      acknowledged: true
    },
    {
      id: 'alert_004',
      severity: 'warning' as const,
      message: 'High memory usage detected on agent-worker-03 (89.4%)',
      timestamp: new Date(Date.now() - 14400000).toISOString(),
      source: 'system-monitor',
      acknowledged: false
    },
    {
      id: 'alert_005',
      severity: 'info' as const,
      message: 'Scheduled maintenance completed - all services operational',
      timestamp: new Date(Date.now() - 21600000).toISOString(),
      source: 'maintenance-scheduler',
      acknowledged: true
    }
  ];

  return alerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

function generateHealthTrends(timeRange: string): SystemHealthMetrics['trends'] {
  const trends = [];
  const intervals = timeRange === '1h' ? 12 : timeRange === '24h' ? 24 : 48;
  const intervalMs = timeRange === '1h' ? 300000 : timeRange === '24h' ? 3600000 : 1800000;

  for (let i = intervals; i >= 0; i--) {
    const timestamp = new Date(Date.now() - (i * intervalMs)).toISOString();

    // Add realistic variance and trends
    const baseEventRate = 156.7;
    const baseErrorRate = 0.0023;
    const baseResponseTime = 23.4;
    const baseCpuUsage = 34.2;
    const baseMemoryUsage = 67.8;

    trends.push({
      timestamp,
      eventRate: Math.max(0, baseEventRate + (Math.random() - 0.5) * 50),
      errorRate: Math.max(0, baseErrorRate + (Math.random() - 0.5) * 0.002),
      responseTime: Math.max(5, baseResponseTime + (Math.random() - 0.5) * 20),
      cpuUsage: Math.min(100, Math.max(10, baseCpuUsage + (Math.random() - 0.5) * 30)),
      memoryUsage: Math.min(95, Math.max(30, baseMemoryUsage + (Math.random() - 0.5) * 20))
    });
  }

  return trends;
}

// POST endpoint for alert acknowledgment
export async function POST(request: NextRequest) {
  try {
    const auth = await AdminAuthUtils.requireTechnicalAdmin(request);
    if (!auth.isAuthorized) {
      return NextResponse.json({
        error: auth.error || 'Unauthorized'
      }, { status: 401 });
    }

    const { alertId, action } = await request.json();

    if (action === 'acknowledge') {
      // Mock acknowledgment - in real implementation, update alert status
      return NextResponse.json({
        success: true,
        message: `Alert ${alertId} acknowledged successfully`,
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action'
    }, { status: 400 });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to process alert action'
    }, { status: 500 });
  }
}