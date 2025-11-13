/**
 * Agent Performance Analytics API
 * Real-time agent execution metrics and performance analysis
 */

import { NextRequest, NextResponse } from 'next/server';
import { AdminAuthUtils } from '@/lib/auth/oauth-pkce';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface AgentPerformanceMetrics {
  agents: {
    name: string;
    totalExecutions: number;
    successRate: number;
    averageExecutionTime: number;
    lastExecution: string;
    status: 'healthy' | 'degraded' | 'error';
    errorRate: number;
    throughput: number;
    peakExecutionTime: number;
  }[];
  timeSeriesData: {
    timestamp: string;
    executionTimes: Record<string, number>;
    successRates: Record<string, number>;
    throughput: Record<string, number>;
  }[];
  topPerformers: {
    agent: string;
    metric: string;
    value: number;
    trend: 'up' | 'down' | 'stable';
  }[];
  systemWideMetrics: {
    totalAgentExecutions: number;
    overallSuccessRate: number;
    averageSystemLatency: number;
    activeAgents: number;
    queuedTasks: number;
  };
}

export async function GET(request: NextRequest) {
  try {
    // Require admin access
    const auth = await AdminAuthUtils.requireAnyAdmin(request);
    if (!auth.isAuthorized) {
      return NextResponse.json({
        error: auth.error || 'Unauthorized access to agent performance data'
      }, { status: 401 });
    }

    const url = new URL(request.url);
    const timeRange = url.searchParams.get('timeRange') || '24h';

    // Generate mock agent performance data
    const metrics: AgentPerformanceMetrics = {
      agents: [
        {
          name: 'content_review',
          totalExecutions: 2847,
          successRate: 0.956,
          averageExecutionTime: 1240,
          lastExecution: new Date(Date.now() - 15000).toISOString(),
          status: 'healthy',
          errorRate: 0.044,
          throughput: 125.3,
          peakExecutionTime: 3200
        },
        {
          name: 'audience_suggester',
          totalExecutions: 1923,
          successRate: 0.923,
          averageExecutionTime: 890,
          lastExecution: new Date(Date.now() - 8000).toISOString(),
          status: 'healthy',
          errorRate: 0.077,
          throughput: 98.7,
          peakExecutionTime: 2100
        },
        {
          name: 'experiment_blueprinter',
          totalExecutions: 1456,
          successRate: 0.887,
          averageExecutionTime: 2340,
          lastExecution: new Date(Date.now() - 25000).toISOString(),
          status: 'degraded',
          errorRate: 0.113,
          throughput: 67.2,
          peakExecutionTime: 5800
        },
        {
          name: 'integration_health',
          totalExecutions: 3251,
          successRate: 0.978,
          averageExecutionTime: 450,
          lastExecution: new Date(Date.now() - 5000).toISOString(),
          status: 'healthy',
          errorRate: 0.022,
          throughput: 189.4,
          peakExecutionTime: 1200
        },
        {
          name: 'performance_analyzer',
          totalExecutions: 987,
          successRate: 0.834,
          averageExecutionTime: 3100,
          lastExecution: new Date(Date.now() - 120000).toISOString(),
          status: 'error',
          errorRate: 0.166,
          throughput: 34.2,
          peakExecutionTime: 8900
        }
      ],
      timeSeriesData: generateTimeSeriesData(timeRange),
      topPerformers: [
        {
          agent: 'integration_health',
          metric: 'Success Rate',
          value: 97.8,
          trend: 'up'
        },
        {
          agent: 'integration_health',
          metric: 'Throughput',
          value: 189.4,
          trend: 'stable'
        },
        {
          agent: 'content_review',
          metric: 'Reliability',
          value: 95.6,
          trend: 'up'
        },
        {
          agent: 'audience_suggester',
          metric: 'Response Time',
          value: 890,
          trend: 'down'
        }
      ],
      systemWideMetrics: {
        totalAgentExecutions: 10464,
        overallSuccessRate: 0.916,
        averageSystemLatency: 1404,
        activeAgents: 4,
        queuedTasks: 23
      }
    };

    return NextResponse.json({
      success: true,
      data: metrics,
      meta: {
        timestamp: new Date().toISOString(),
        timeRange,
        refreshInterval: 10000 // 10 seconds
      }
    });

  } catch (error) {
    console.error('[Agent Performance] Error fetching metrics:', error);

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch agent performance metrics',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function generateTimeSeriesData(timeRange: string): AgentPerformanceMetrics['timeSeriesData'] {
  const agents = ['content_review', 'audience_suggester', 'experiment_blueprinter', 'integration_health', 'performance_analyzer'];
  const data = [];

  const intervals = timeRange === '1h' ? 12 : timeRange === '24h' ? 24 : 48;
  const intervalMs = timeRange === '1h' ? 300000 : timeRange === '24h' ? 3600000 : 1800000;

  for (let i = intervals; i >= 0; i--) {
    const timestamp = new Date(Date.now() - (i * intervalMs)).toISOString();

    const executionTimes: Record<string, number> = {};
    const successRates: Record<string, number> = {};
    const throughput: Record<string, number> = {};

    agents.forEach(agent => {
      // Add some realistic variance
      const baseExecutionTime = {
        content_review: 1240,
        audience_suggester: 890,
        experiment_blueprinter: 2340,
        integration_health: 450,
        performance_analyzer: 3100
      }[agent] || 1000;

      const baseSuccessRate = {
        content_review: 0.956,
        audience_suggester: 0.923,
        experiment_blueprinter: 0.887,
        integration_health: 0.978,
        performance_analyzer: 0.834
      }[agent] || 0.9;

      const baseThroughput = {
        content_review: 125.3,
        audience_suggester: 98.7,
        experiment_blueprinter: 67.2,
        integration_health: 189.4,
        performance_analyzer: 34.2
      }[agent] || 100;

      executionTimes[agent] = Math.max(100, baseExecutionTime + (Math.random() - 0.5) * 400);
      successRates[agent] = Math.min(1, Math.max(0.5, baseSuccessRate + (Math.random() - 0.5) * 0.1));
      throughput[agent] = Math.max(10, baseThroughput + (Math.random() - 0.5) * 30);
    });

    data.push({
      timestamp,
      executionTimes,
      successRates,
      throughput
    });
  }

  return data;
}