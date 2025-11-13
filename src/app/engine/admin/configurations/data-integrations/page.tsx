'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Database,
  Activity,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Users,
  Zap,
  TrendingUp,
  TrendingDown,
  Clock,
  Target,
  Brain,
  Network,
  Server,
  Eye,
  PlayCircle,
  PauseCircle
} from 'lucide-react';

// Import chart components
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface StreamData {
  type: string;
  timestamp: string;
  data: any;
}

interface KafkaMetrics {
  topics: any[];
  events: any[];
  throughput: any;
}

interface AgentMetrics {
  agents: any[];
  timeSeriesData: any[];
  topPerformers: any[];
  systemWideMetrics: any;
}

interface RecommendationMetrics {
  liveRecommendations: any[];
  analytics: any;
  impactDistribution: any;
  confidenceDistribution: any;
  trends: any[];
}

interface SystemHealthMetrics {
  prometheus: any;
  services: any[];
  alerts: any[];
  healthIndicators: any;
  trends: any[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function RealTimeAnalyticsDashboard() {
  const [activeTab, setActiveTab] = useState('events');
  const [isConnected, setIsConnected] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [kafkaMetrics, setKafkaMetrics] = useState<KafkaMetrics | null>(null);
  const [agentMetrics, setAgentMetrics] = useState<AgentMetrics | null>(null);
  const [recommendationMetrics, setRecommendationMetrics] = useState<RecommendationMetrics | null>(null);
  const [systemHealthMetrics, setSystemHealthMetrics] = useState<SystemHealthMetrics | null>(null);
  const [streamUpdates, setStreamUpdates] = useState<StreamData[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Set up real-time streaming
  useEffect(() => {
    if (isStreaming) {
      startRealTimeStream();
    } else {
      stopRealTimeStream();
    }

    return () => stopRealTimeStream();
  }, [isStreaming, activeTab]);

  const loadInitialData = async () => {
    setError(null);
    try {
      const [kafkaRes, agentsRes, recommendationsRes, healthRes] = await Promise.all([
        fetch('/api/analytics/kafka-metrics'),
        fetch('/api/analytics/agent-performance'),
        fetch('/api/analytics/recommendations'),
        fetch('/api/analytics/system-health')
      ]);

      const [kafka, agents, recommendations, health] = await Promise.all([
        kafkaRes.json(),
        agentsRes.json(),
        recommendationsRes.json(),
        healthRes.json()
      ]);

      if (kafka.success) setKafkaMetrics(kafka.data);
      if (agents.success) setAgentMetrics(agents.data);
      if (recommendations.success) setRecommendationMetrics(recommendations.data);
      if (health.success) setSystemHealthMetrics(health.data);

      setIsConnected(true);
    } catch (error) {
      console.error('Failed to load initial data:', error);
      setError('Failed to load dashboard data. Please check your connection.');
      setIsConnected(false);
    }
  };

  let eventSource: EventSource | null = null;

  const startRealTimeStream = () => {
    if (eventSource) return;

    try {
      eventSource = new EventSource(`/api/analytics/stream?type=${activeTab === 'events' ? 'kafka' : activeTab === 'agents' ? 'agents' : activeTab === 'recommendations' ? 'recommendations' : 'health'}`);

      eventSource.onopen = () => {
        console.log('SSE connection opened');
        setIsConnected(true);
        setError(null);
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleStreamUpdate(data);
        } catch (error) {
          console.error('Error parsing stream data:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('SSE connection error:', error);
        setIsConnected(false);
        setError('Real-time connection lost. Attempting to reconnect...');
      };

    } catch (error) {
      console.error('Failed to start stream:', error);
      setError('Failed to start real-time updates');
    }
  };

  const stopRealTimeStream = () => {
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
  };

  const handleStreamUpdate = (data: StreamData) => {
    setStreamUpdates(prev => [data, ...prev.slice(0, 49)]); // Keep last 50 updates

    // Update specific metrics based on data type
    switch (data.type) {
      case 'kafka_update':
        if (kafkaMetrics) {
          setKafkaMetrics(prev => ({
            ...prev!,
            throughput: {
              ...prev!.throughput,
              messagesPerMinute: data.data.throughput * 60
            }
          }));
        }
        break;
      case 'agent_update':
        // Update agent metrics with new execution data
        break;
      case 'recommendation_update':
        if (recommendationMetrics && data.data.newRecommendation) {
          setRecommendationMetrics(prev => ({
            ...prev!,
            liveRecommendations: [data.data.newRecommendation, ...prev!.liveRecommendations.slice(0, 19)]
          }));
        }
        break;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': case 'connected': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'degraded': case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'down': case 'error': case 'disconnected': return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <RefreshCw className="h-4 w-4 text-gray-400 animate-spin" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': case 'connected': return 'bg-green-50 text-green-700 border-green-200';
      case 'degraded': case 'warning': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'down': case 'error': case 'disconnected': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-blue-600" />
            Real-Time Analytics Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Live monitoring of OPAL → OSA system performance and insights
          </p>
        </div>

        <div className="flex items-center space-x-4">
          {/* Connection Status */}
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            } ${isConnected ? 'animate-pulse' : ''}`}></div>
            <span className="text-sm text-gray-600">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>

          {/* Stream Toggle */}
          <Button
            variant={isStreaming ? "default" : "outline"}
            size="sm"
            onClick={() => setIsStreaming(!isStreaming)}
          >
            {isStreaming ? (
              <>
                <PauseCircle className="h-4 w-4 mr-2" />
                Stop Stream
              </>
            ) : (
              <>
                <PlayCircle className="h-4 w-4 mr-2" />
                Start Stream
              </>
            )}
          </Button>

          <Button variant="outline" size="sm" onClick={loadInitialData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Main Dashboard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="events" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Event Streams
          </TabsTrigger>
          <TabsTrigger value="agents" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Agent Performance
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Recommendations
          </TabsTrigger>
          <TabsTrigger value="health" className="flex items-center gap-2">
            <Server className="h-4 w-4" />
            System Health
          </TabsTrigger>
        </TabsList>

        {/* Event Streams Tab */}
        <TabsContent value="events">
          {kafkaMetrics ? (
            <div className="space-y-6">
              {/* Throughput Overview */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold">{kafkaMetrics.throughput.messagesPerMinute.toLocaleString()}</p>
                      <p className="text-sm text-gray-600">Messages/Min</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold">{kafkaMetrics.throughput.peakThroughput.toLocaleString()}</p>
                      <p className="text-sm text-gray-600">Peak Throughput</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold">{kafkaMetrics.throughput.averageLatency}ms</p>
                      <p className="text-sm text-gray-600">Avg Latency</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold">{kafkaMetrics.throughput.totalMessages.toLocaleString()}</p>
                      <p className="text-sm text-gray-600">Total Messages</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Kafka Topics Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Network className="h-5 w-5" />
                    Kafka Topics Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {kafkaMetrics.topics.map((topic, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="font-medium">{topic.name}</span>
                            <Badge variant="outline">{topic.partitions} partitions</Badge>
                          </div>
                          <Badge className={topic.consumerLag > 10 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}>
                            Lag: {topic.consumerLag}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Messages/sec</p>
                            <p className="font-semibold">{topic.messagesPerSecond.toFixed(1)}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Bytes/sec</p>
                            <p className="font-semibold">{(topic.bytesPerSecond / 1024).toFixed(1)} KB</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Last Activity</p>
                            <p className="font-semibold">{new Date(topic.lastActivity).toLocaleTimeString()}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Events Stream */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Recent Events
                  </CardTitle>
                  <CardDescription>Live stream of workflow and agent events</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {kafkaMetrics.events.slice(0, 20).map((event, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">{event.eventType}</Badge>
                          <span className="text-sm font-medium">{event.topic}</span>
                          {event.payload.agent && (
                            <Badge className="bg-blue-100 text-blue-800">{event.payload.agent}</Badge>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(event.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          )}
        </TabsContent>

        {/* Agent Performance Tab */}
        <TabsContent value="agents">
          {agentMetrics ? (
            <div className="space-y-6">
              {/* System Overview */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold">{agentMetrics.systemWideMetrics.totalAgentExecutions.toLocaleString()}</p>
                      <p className="text-sm text-gray-600">Total Executions</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold">{(agentMetrics.systemWideMetrics.overallSuccessRate * 100).toFixed(1)}%</p>
                      <p className="text-sm text-gray-600">Success Rate</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold">{agentMetrics.systemWideMetrics.averageSystemLatency}ms</p>
                      <p className="text-sm text-gray-600">Avg Latency</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold">{agentMetrics.systemWideMetrics.activeAgents}</p>
                      <p className="text-sm text-gray-600">Active Agents</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold">{agentMetrics.systemWideMetrics.queuedTasks}</p>
                      <p className="text-sm text-gray-600">Queued Tasks</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Agent Performance Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Agent Performance Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={agentMetrics.timeSeriesData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="timestamp" tickFormatter={(value) => new Date(value).toLocaleTimeString()} />
                      <YAxis />
                      <Tooltip labelFormatter={(value) => new Date(value).toLocaleString()} />
                      {Object.keys(agentMetrics.timeSeriesData[0]?.executionTimes || {}).map((agent, index) => (
                        <Line
                          key={agent}
                          type="monotone"
                          dataKey={`executionTimes.${agent}`}
                          stroke={COLORS[index % COLORS.length]}
                          strokeWidth={2}
                          name={agent}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Individual Agent Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    Agent Status & Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {agentMetrics.agents.map((agent, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            {getStatusIcon(agent.status)}
                            <span className="font-semibold">{agent.name}</span>
                            <Badge className={getStatusColor(agent.status)}>{agent.status}</Badge>
                          </div>
                          <div className="text-sm text-gray-500">
                            Last run: {new Date(agent.lastExecution).toLocaleString()}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Success Rate</p>
                            <p className="font-semibold text-green-600">{(agent.successRate * 100).toFixed(1)}%</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Avg Execution</p>
                            <p className="font-semibold">{agent.averageExecutionTime}ms</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Throughput</p>
                            <p className="font-semibold">{agent.throughput.toFixed(1)}/min</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Total Runs</p>
                            <p className="font-semibold">{agent.totalExecutions.toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          )}
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations">
          {recommendationMetrics ? (
            <div className="space-y-6">
              {/* Recommendations Overview */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold">{recommendationMetrics.analytics.totalRecommendations}</p>
                      <p className="text-sm text-gray-600">Total Generated</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold">{(recommendationMetrics.analytics.implementationRate * 100).toFixed(1)}%</p>
                      <p className="text-sm text-gray-600">Implementation Rate</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold">{(recommendationMetrics.analytics.averageConfidence * 100).toFixed(0)}%</p>
                      <p className="text-sm text-gray-600">Avg Confidence</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold">{recommendationMetrics.analytics.averageImpact.toFixed(1)}</p>
                      <p className="text-sm text-gray-600">Avg Impact Score</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Impact Distribution Chart */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Impact Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'High Impact', value: recommendationMetrics.impactDistribution.high, color: '#0088FE' },
                            { name: 'Medium Impact', value: recommendationMetrics.impactDistribution.medium, color: '#00C49F' },
                            { name: 'Low Impact', value: recommendationMetrics.impactDistribution.low, color: '#FFBB28' }
                          ]}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {[0, 1, 2].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Confidence Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={[
                          { name: 'High Confidence (>80%)', value: recommendationMetrics.confidenceDistribution.confident },
                          { name: 'Medium Confidence (60-80%)', value: recommendationMetrics.confidenceDistribution.moderate },
                          { name: 'Low Confidence (<60%)', value: recommendationMetrics.confidenceDistribution.uncertain }
                        ]}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Live Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Live Recommendations
                  </CardTitle>
                  <CardDescription>Real-time optimization suggestions with confidence scoring</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {recommendationMetrics.liveRecommendations.slice(0, 10).map((rec) => (
                      <div key={rec.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="font-semibold">{rec.title}</h4>
                            <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
                          </div>
                          <div className="ml-4 text-right">
                            <Badge className={
                              rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                              rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }>
                              {rec.priority}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-4">
                            <span>Confidence: <strong>{(rec.confidence * 100).toFixed(0)}%</strong></span>
                            <span>Impact: <strong>{rec.impactScore.toFixed(1)}/10</strong></span>
                            <span>Effort: <strong>{rec.effortScore.toFixed(1)}/10</strong></span>
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(rec.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          )}
        </TabsContent>

        {/* System Health Tab */}
        <TabsContent value="health">
          {systemHealthMetrics ? (
            <div className="space-y-6">
              {/* Health Indicators Overview */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{systemHealthMetrics.healthIndicators.overall}%</p>
                      <p className="text-sm text-gray-600">Overall Health</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold">{systemHealthMetrics.healthIndicators.database}%</p>
                      <p className="text-sm text-gray-600">Database</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold">{systemHealthMetrics.healthIndicators.cache}%</p>
                      <p className="text-sm text-gray-600">Cache</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold">{systemHealthMetrics.healthIndicators.messageQueue}%</p>
                      <p className="text-sm text-gray-600">Message Queue</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold">{systemHealthMetrics.healthIndicators.externalServices}%</p>
                      <p className="text-sm text-gray-600">External Services</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Prometheus Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle>System Metrics (Prometheus)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <p className="text-2xl font-bold">{systemHealthMetrics.prometheus.eventRate}</p>
                      <p className="text-sm text-gray-600">Events/sec</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <p className="text-2xl font-bold">{systemHealthMetrics.prometheus.cpuUsage}%</p>
                      <p className="text-sm text-gray-600">CPU Usage</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <p className="text-2xl font-bold">{systemHealthMetrics.prometheus.memoryUsage}%</p>
                      <p className="text-sm text-gray-600">Memory Usage</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <p className="text-2xl font-bold">{(systemHealthMetrics.prometheus.errorRate * 100).toFixed(2)}%</p>
                      <p className="text-sm text-gray-600">Error Rate</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* System Health Trends */}
              <Card>
                <CardHeader>
                  <CardTitle>System Performance Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={systemHealthMetrics.trends}>
                      <defs>
                        <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorMemory" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="timestamp" tickFormatter={(value) => new Date(value).toLocaleTimeString()} />
                      <YAxis />
                      <CartesianGrid strokeDasharray="3 3" />
                      <Tooltip labelFormatter={(value) => new Date(value).toLocaleString()} />
                      <Area type="monotone" dataKey="cpuUsage" stroke="#8884d8" fillOpacity={1} fill="url(#colorCpu)" name="CPU Usage %" />
                      <Area type="monotone" dataKey="memoryUsage" stroke="#82ca9d" fillOpacity={1} fill="url(#colorMemory)" name="Memory Usage %" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Service Status & Alerts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Server className="h-5 w-5" />
                      Service Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {systemHealthMetrics.services.map((service, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            {getStatusIcon(service.status)}
                            <div>
                              <p className="font-medium">{service.name}</p>
                              <p className="text-xs text-gray-500">v{service.version} • {service.responseTime}ms</p>
                            </div>
                          </div>
                          <Badge className={getStatusColor(service.status)}>
                            {service.uptime.toFixed(2)}% uptime
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      Recent Alerts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                      {systemHealthMetrics.alerts.map((alert) => (
                        <div key={alert.id} className="p-3 border rounded-lg">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {alert.severity === 'critical' && <XCircle className="h-4 w-4 text-red-600" />}
                              {alert.severity === 'warning' && <AlertTriangle className="h-4 w-4 text-yellow-600" />}
                              {alert.severity === 'info' && <CheckCircle className="h-4 w-4 text-blue-600" />}
                              <Badge className={
                                alert.severity === 'critical' ? 'bg-red-100 text-red-800' :
                                alert.severity === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-blue-100 text-blue-800'
                              }>
                                {alert.severity}
                              </Badge>
                            </div>
                            {alert.acknowledged && (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            )}
                          </div>
                          <p className="text-sm mb-2">{alert.message}</p>
                          <div className="flex justify-between items-center text-xs text-gray-500">
                            <span>{alert.source}</span>
                            <span>{new Date(alert.timestamp).toLocaleString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Live Stream Updates (Footer) */}
      {isStreaming && streamUpdates.length > 0 && (
        <Card className="bg-gray-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="h-4 w-4 text-green-600 animate-pulse" />
              Live Updates ({streamUpdates.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex gap-2 flex-wrap">
              {streamUpdates.slice(0, 5).map((update, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {update.type} • {new Date(update.timestamp).toLocaleTimeString()}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}