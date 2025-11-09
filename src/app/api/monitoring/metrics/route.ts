import { NextRequest, NextResponse } from 'next/server';
import { agentStatusTracker } from '@/lib/monitoring/agent-status-tracker';

/**
 * GET /api/monitoring/metrics
 * Returns comprehensive OPAL monitoring metrics
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const timeframe = searchParams.get('timeframe') || '1h'; // 1h, 6h, 24h, 7d

    // Get current agent statuses
    const agentStatuses = agentStatusTracker.getLatestAgentStatuses();

    // Calculate metrics
    const currentTime = Date.now();
    const metrics = {
      timestamp: new Date().toISOString(),
      timeframe: timeframe,

      // Agent Status Summary
      agentSummary: {
        total: agentStatuses.size,
        idle: 0,
        running: 0,
        completed: 0,
        failed: 0,
        retrying: 0
      },

      // Performance Metrics
      performance: {
        avgExecutionTime: 0,
        totalWorkflows: 0,
        successRate: 0,
        throughputPerHour: 0
      },

      // System Health
      systemHealth: {
        overall: 'healthy',
        apiLatency: Math.random() * 50 + 10, // Mock latency 10-60ms
        memoryUsage: Math.random() * 30 + 60, // Mock 60-90%
        cpuUsage: Math.random() * 40 + 20, // Mock 20-60%
        diskUsage: Math.random() * 20 + 30, // Mock 30-50%
        webhookSuccessRate: 95 + Math.random() * 5 // Mock 95-100%
      },

      // Historical Data (Mock)
      historicalData: {
        executions: generateMockHistoricalData(timeframe),
        errors: generateMockErrorData(timeframe),
        performance: generateMockPerformanceData(timeframe)
      },

      // Error Summary
      errorSummary: {
        total: Math.floor(Math.random() * 5),
        webhookErrors: Math.floor(Math.random() * 2),
        timeoutErrors: Math.floor(Math.random() * 2),
        systemErrors: Math.floor(Math.random() * 2)
      }
    };

    // Count agent statuses
    Array.from(agentStatuses.values()).forEach(status => {
      switch (status.status) {
        case 'idle':
          metrics.agentSummary.idle++;
          break;
        case 'running':
        case 'starting':
          metrics.agentSummary.running++;
          break;
        case 'completed':
          metrics.agentSummary.completed++;
          break;
        case 'failed':
        case 'timeout':
          metrics.agentSummary.failed++;
          break;
        case 'retrying':
          metrics.agentSummary.retrying++;
          break;
      }
    });

    // Calculate success rate
    const total = metrics.agentSummary.completed + metrics.agentSummary.failed;
    metrics.performance.successRate = total > 0 ? (metrics.agentSummary.completed / total) * 100 : 100;

    // Mock some performance data
    metrics.performance.avgExecutionTime = 2500 + Math.random() * 2000; // 2.5-4.5 seconds
    metrics.performance.totalWorkflows = 150 + Math.floor(Math.random() * 50); // 150-200 workflows
    metrics.performance.throughputPerHour = 25 + Math.floor(Math.random() * 15); // 25-40 per hour

    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Failed to get monitoring metrics:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve metrics' },
      { status: 500 }
    );
  }
}

function generateMockHistoricalData(timeframe: string) {
  const points = timeframe === '1h' ? 12 : timeframe === '6h' ? 24 : timeframe === '24h' ? 48 : 168;
  const data = [];

  for (let i = 0; i < points; i++) {
    data.push({
      timestamp: new Date(Date.now() - (points - i) * getTimeInterval(timeframe)).toISOString(),
      executions: Math.floor(Math.random() * 10) + 5,
      successes: Math.floor(Math.random() * 8) + 4,
      failures: Math.floor(Math.random() * 2)
    });
  }

  return data;
}

function generateMockErrorData(timeframe: string) {
  const points = timeframe === '1h' ? 12 : timeframe === '6h' ? 24 : timeframe === '24h' ? 48 : 168;
  const data = [];

  for (let i = 0; i < points; i++) {
    data.push({
      timestamp: new Date(Date.now() - (points - i) * getTimeInterval(timeframe)).toISOString(),
      webhookErrors: Math.floor(Math.random() * 2),
      timeoutErrors: Math.floor(Math.random() * 1),
      systemErrors: Math.floor(Math.random() * 1)
    });
  }

  return data;
}

function generateMockPerformanceData(timeframe: string) {
  const points = timeframe === '1h' ? 12 : timeframe === '6h' ? 24 : timeframe === '24h' ? 48 : 168;
  const data = [];

  for (let i = 0; i < points; i++) {
    data.push({
      timestamp: new Date(Date.now() - (points - i) * getTimeInterval(timeframe)).toISOString(),
      avgResponseTime: Math.random() * 2000 + 1000, // 1-3 seconds
      throughput: Math.random() * 20 + 10, // 10-30 per interval
      memoryUsage: Math.random() * 30 + 60, // 60-90%
      cpuUsage: Math.random() * 40 + 20 // 20-60%
    });
  }

  return data;
}

function getTimeInterval(timeframe: string): number {
  switch (timeframe) {
    case '1h': return 5 * 60 * 1000; // 5 minutes
    case '6h': return 15 * 60 * 1000; // 15 minutes
    case '24h': return 30 * 60 * 1000; // 30 minutes
    case '7d': return 60 * 60 * 1000; // 1 hour
    default: return 5 * 60 * 1000;
  }
}