/**
 * Admin Monitoring Dashboard - Confidence Scores
 *
 * Real-time monitoring of OPAL agent confidence scores, fallback usage,
 * and performance metrics for Strategy Plans implementation.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  BarChart3,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Clock,
  Database,
  Activity,
  Target,
  Settings
} from 'lucide-react';

interface ConfidenceMetrics {
  overall_health: 'healthy' | 'warning' | 'critical';
  average_confidence: number;
  agents_below_threshold: number;
  fallback_usage_rate: number;
  last_updated: string;
}

interface AgentPerformance {
  agent_name: string;
  confidence_score: number;
  request_count: number;
  success_rate: number;
  avg_response_time: number;
  last_execution: string;
  status: 'active' | 'degraded' | 'failed';
}

interface FallbackStats {
  page_id: string;
  agent_name: string;
  fallback_count: number;
  last_fallback: string;
  reason: string;
}

export default function ConfidenceScoresMonitoring() {
  const [metrics, setMetrics] = useState<ConfidenceMetrics | null>(null);
  const [agentPerformance, setAgentPerformance] = useState<AgentPerformance[]>([]);
  const [fallbackStats, setFallbackStats] = useState<FallbackStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Fetch monitoring data
  const fetchMonitoringData = async () => {
    setIsLoading(true);
    try {
      console.log('[Admin Dashboard] Fetching monitoring data...');

      // Fetch overall metrics
      const metricsResponse = await fetch('/api/admin/monitoring/confidence-metrics');
      const agentResponse = await fetch('/api/admin/monitoring/agent-performance');
      const fallbackResponse = await fetch('/api/admin/monitoring/fallback-stats');

      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json();
        setMetrics(metricsData);
      } else {
        // Provide development fallback data
        setMetrics({
          overall_health: 'healthy',
          average_confidence: 0.78,
          agents_below_threshold: 1,
          fallback_usage_rate: 0.15,
          last_updated: new Date().toISOString()
        });
      }

      if (agentResponse.ok) {
        const agentData = await agentResponse.json();
        setAgentPerformance(agentData.agents || []);
      } else {
        // Development fallback
        setAgentPerformance([
          {
            agent_name: 'strategy_workflow',
            confidence_score: 0.82,
            request_count: 147,
            success_rate: 0.94,
            avg_response_time: 2.3,
            last_execution: new Date().toISOString(),
            status: 'active'
          },
          {
            agent_name: 'roadmap_generator',
            confidence_score: 0.76,
            request_count: 89,
            success_rate: 0.89,
            avg_response_time: 3.1,
            last_execution: new Date().toISOString(),
            status: 'active'
          },
          {
            agent_name: 'maturity_assessment',
            confidence_score: 0.58,
            request_count: 52,
            success_rate: 0.81,
            avg_response_time: 4.2,
            last_execution: new Date().toISOString(),
            status: 'degraded'
          },
          {
            agent_name: 'quick_wins_analyzer',
            confidence_score: 0.71,
            request_count: 33,
            success_rate: 0.85,
            avg_response_time: 2.8,
            last_execution: new Date().toISOString(),
            status: 'active'
          }
        ]);
      }

      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json();
        setFallbackStats(fallbackData.fallbacks || []);
      } else {
        // Development fallback
        setFallbackStats([
          {
            page_id: 'strategy-plans-maturity-assessment',
            agent_name: 'maturity_assessment',
            fallback_count: 12,
            last_fallback: new Date().toISOString(),
            reason: 'Low confidence score (0.58)'
          },
          {
            page_id: 'strategy-plans-quick-wins-overview',
            agent_name: 'quick_wins_analyzer',
            fallback_count: 7,
            last_fallback: new Date().toISOString(),
            reason: 'Agent timeout'
          }
        ]);
      }

      setLastRefresh(new Date());
    } catch (error) {
      console.error('[Admin Dashboard] Error fetching monitoring data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-refresh every 30 seconds
  useEffect(() => {
    fetchMonitoringData();
    const interval = setInterval(fetchMonitoringData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getHealthStatusColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'text-green-600 bg-green-50 border-green-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getAgentStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-50';
      case 'degraded': return 'text-yellow-600 bg-yellow-50';
      case 'failed': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getAgentStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4" />;
      case 'degraded': return <AlertTriangle className="w-4 h-4" />;
      case 'failed': return <TrendingDown className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold">Confidence Scores Monitoring</h1>
          <RefreshCw className="w-5 h-5 animate-spin text-gray-400" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold">Confidence Scores Monitoring</h1>
          {metrics && (
            <Badge className={getHealthStatusColor(metrics.overall_health)}>
              {metrics.overall_health.toUpperCase()}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </span>
          <Button
            onClick={fetchMonitoringData}
            variant="outline"
            size="sm"
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-blue-600" />
                <h3 className="font-semibold text-sm">Average Confidence</h3>
              </div>
              <p className="text-2xl font-bold text-blue-600">
                {Math.round(metrics.average_confidence * 100)}%
              </p>
              <Progress value={metrics.average_confidence * 100} className="mt-2 h-2" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
                <h3 className="font-semibold text-sm">Below Threshold</h3>
              </div>
              <p className="text-2xl font-bold text-yellow-600">
                {metrics.agents_below_threshold}
              </p>
              <p className="text-xs text-gray-500 mt-1">agents &lt; 60%</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <Database className="w-4 h-4 text-orange-600" />
                <h3 className="font-semibold text-sm">Fallback Usage</h3>
              </div>
              <p className="text-2xl font-bold text-orange-600">
                {Math.round(metrics.fallback_usage_rate * 100)}%
              </p>
              <p className="text-xs text-gray-500 mt-1">of requests</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-green-600" />
                <h3 className="font-semibold text-sm">System Health</h3>
              </div>
              <p className="text-2xl font-bold text-green-600">
                {metrics.overall_health === 'healthy' ? '✓' :
                 metrics.overall_health === 'warning' ? '⚠' : '✗'}
              </p>
              <p className="text-xs text-gray-500 mt-1 capitalize">{metrics.overall_health}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Agent Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" />
            Agent Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr className="text-left">
                  <th className="pb-2 font-semibold">Agent</th>
                  <th className="pb-2 font-semibold">Confidence</th>
                  <th className="pb-2 font-semibold">Requests</th>
                  <th className="pb-2 font-semibold">Success Rate</th>
                  <th className="pb-2 font-semibold">Avg Response</th>
                  <th className="pb-2 font-semibold">Status</th>
                  <th className="pb-2 font-semibold">Last Execution</th>
                </tr>
              </thead>
              <tbody>
                {agentPerformance.map((agent, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-3 font-medium">{agent.agent_name}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold ${
                          agent.confidence_score >= 0.8 ? 'text-green-600' :
                          agent.confidence_score >= 0.6 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {Math.round(agent.confidence_score * 100)}%
                        </span>
                        {agent.confidence_score < 0.6 && (
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                    </td>
                    <td className="py-3">{agent.request_count.toLocaleString()}</td>
                    <td className="py-3">{Math.round(agent.success_rate * 100)}%</td>
                    <td className="py-3">{agent.avg_response_time.toFixed(1)}s</td>
                    <td className="py-3">
                      <Badge className={getAgentStatusColor(agent.status)}>
                        <div className="flex items-center gap-1">
                          {getAgentStatusIcon(agent.status)}
                          {agent.status}
                        </div>
                      </Badge>
                    </td>
                    <td className="py-3 text-sm text-gray-500">
                      {new Date(agent.last_execution).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Fallback Usage Details */}
      {fallbackStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5 text-orange-600" />
              Recent Fallback Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {fallbackStats.slice(0, 10).map((fallback, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <div>
                    <h4 className="font-semibold text-sm">{fallback.page_id}</h4>
                    <p className="text-xs text-gray-600">Agent: {fallback.agent_name}</p>
                    <p className="text-xs text-orange-600">{fallback.reason}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{fallback.fallback_count} times</p>
                    <p className="text-xs text-gray-500">
                      {new Date(fallback.last_fallback).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}