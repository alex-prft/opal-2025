'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, BarChart3, RefreshCw, Database, Target, Lightbulb, ArrowRight, Clock, AlertCircle } from 'lucide-react';
import { SafeDate } from '@/lib/utils/date-formatter';

// TypeScript interfaces for API responses
interface AgentDataSummary {
  success: boolean;
  dataSentToOSA?: {
    metrics_count: number;
    last_sent: string;
    data_size_kb: number;
    key_metrics: string[];
  };
  strategyAssistance?: {
    recommendations_count: number;
    last_updated: string;
    priority_recommendations: string[];
  };
  osaSuggestions?: {
    total_suggestions: number;
    recommendation_service: number;
    knowledge_retrieval_service: number;
    preferences_policy_service: number;
    enhancement_areas: string[];
  };
  nextBestActions?: {
    total_actions: number;
    priority_actions: string[];
    last_updated: string;
  };
  metadata?: {
    last_sync: string;
    agent_id: string;
    data_freshness: 'fresh' | 'stale' | 'outdated';
  };
  timestamp: string;
}

interface AgentDataSummaryPanelProps {
  agentId: string;
  className?: string;
}

export function AgentDataSummaryPanel({ agentId, className = '' }: AgentDataSummaryPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [summaryData, setSummaryData] = useState<AgentDataSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch agent data summary
  const fetchAgentDataSummary = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/opal/agent-data?agent=${agentId}&summary=true`);
      const data = await response.json();

      if (data.success) {
        setSummaryData(data);
      } else {
        setError(data.error || 'Failed to fetch agent data summary');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch agent data summary');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-fetch when expanded
  useEffect(() => {
    if (isExpanded && !summaryData) {
      fetchAgentDataSummary();
    }
  }, [isExpanded, agentId]);

  // Get data freshness color and text
  const getDataFreshnessInfo = (freshness?: 'fresh' | 'stale' | 'outdated') => {
    switch (freshness) {
      case 'fresh':
        return { color: 'text-green-600', bg: 'bg-green-50 border-green-200', text: 'Fresh' };
      case 'stale':
        return { color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200', text: 'Stale' };
      case 'outdated':
        return { color: 'text-red-600', bg: 'bg-red-50 border-red-200', text: 'Outdated' };
      default:
        return { color: 'text-gray-600', bg: 'bg-gray-50 border-gray-200', text: 'Unknown' };
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-5 w-5 text-emerald-600" />
            <div>
              <CardTitle className="text-lg">Agent Data Summary</CardTitle>
              <CardDescription>
                Overview of data flow and strategic insights for this agent
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {summaryData?.metadata && (
              <Badge
                variant="outline"
                className={`text-xs ${getDataFreshnessInfo(summaryData.metadata.data_freshness).bg} ${getDataFreshnessInfo(summaryData.metadata.data_freshness).color}`}
              >
                <Clock className="h-3 w-3 mr-1" />
                {getDataFreshnessInfo(summaryData.metadata.data_freshness).text}
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  Hide
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  Show
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent>
          <div className="space-y-4">
            {/* Refresh Control */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Summary for: <code className="bg-gray-100 px-2 py-1 rounded text-xs">{agentId}</code>
              </div>
              <Button
                onClick={fetchAgentDataSummary}
                disabled={isLoading}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                {isLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                {isLoading ? 'Loading...' : 'Refresh'}
              </Button>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <RefreshCw className="h-8 w-8 animate-spin text-emerald-600 mx-auto mb-3" />
                  <p className="text-sm text-gray-600">Loading agent data summary...</p>
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Error:</span>
                </div>
                <div className="text-sm text-red-600 mt-1">{error}</div>
              </div>
            )}

            {/* Summary Data Display */}
            {summaryData && !isLoading && (
              <div className="space-y-4">
                {/* Data Sent to OSA Summary */}
                {summaryData.dataSentToOSA && (
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Database className="h-4 w-4 text-green-600" />
                      <h4 className="text-sm font-semibold text-green-800">Data Sent to OSA</h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="font-medium text-gray-700">Metrics Count</div>
                        <div className="text-green-600 font-semibold">{summaryData.dataSentToOSA.metrics_count}</div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-700">Data Size</div>
                        <div className="text-green-600 font-semibold">{summaryData.dataSentToOSA.data_size_kb} KB</div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-700">Last Sent</div>
                        <div className="text-green-600 font-semibold">
                          <SafeDate date={summaryData.dataSentToOSA.last_sent} format="time" fallback="Never" />
                        </div>
                      </div>
                    </div>
                    {summaryData.dataSentToOSA.key_metrics.length > 0 && (
                      <div className="mt-3">
                        <div className="text-xs font-medium text-gray-700 mb-1">Key Metrics:</div>
                        <div className="flex flex-wrap gap-1">
                          {summaryData.dataSentToOSA.key_metrics.map((metric, index) => (
                            <Badge key={index} variant="secondary" className="text-xs bg-green-100 text-green-700">
                              {metric}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Strategy Assistance Summary */}
                {summaryData.strategyAssistance && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="h-4 w-4 text-blue-600" />
                      <h4 className="text-sm font-semibold text-blue-800">Strategy Assistance</h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="font-medium text-gray-700">Recommendations</div>
                        <div className="text-blue-600 font-semibold">{summaryData.strategyAssistance.recommendations_count}</div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-700">Last Updated</div>
                        <div className="text-blue-600 font-semibold">
                          <SafeDate date={summaryData.strategyAssistance.last_updated} format="time" fallback="Never" />
                        </div>
                      </div>
                    </div>
                    {summaryData.strategyAssistance.priority_recommendations.length > 0 && (
                      <div className="mt-3">
                        <div className="text-xs font-medium text-gray-700 mb-2">Priority Recommendations:</div>
                        <div className="space-y-1">
                          {summaryData.strategyAssistance.priority_recommendations.slice(0, 3).map((rec, index) => (
                            <div key={index} className="flex items-start gap-2 text-xs text-blue-700">
                              <ArrowRight className="h-3 w-3 mt-0.5 flex-shrink-0" />
                              <span>{rec}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* OSA Suggestions Summary */}
                {summaryData.osaSuggestions && (
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="h-4 w-4 text-purple-600" />
                      <h4 className="text-sm font-semibold text-purple-800">OSA Suggestions</h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="font-medium text-gray-700">Total</div>
                        <div className="text-purple-600 font-semibold">{summaryData.osaSuggestions.total_suggestions}</div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-700">Recommendations</div>
                        <div className="text-purple-600 font-semibold">{summaryData.osaSuggestions.recommendation_service}</div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-700">Knowledge</div>
                        <div className="text-purple-600 font-semibold">{summaryData.osaSuggestions.knowledge_retrieval_service}</div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-700">Preferences</div>
                        <div className="text-purple-600 font-semibold">{summaryData.osaSuggestions.preferences_policy_service}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Next Best Actions Summary */}
                {summaryData.nextBestActions && (
                  <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="flex items-center gap-2 mb-2">
                      <ArrowRight className="h-4 w-4 text-orange-600" />
                      <h4 className="text-sm font-semibold text-orange-800">Next Best Actions</h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="font-medium text-gray-700">Total Actions</div>
                        <div className="text-orange-600 font-semibold">{summaryData.nextBestActions.total_actions}</div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-700">Last Updated</div>
                        <div className="text-orange-600 font-semibold">
                          <SafeDate date={summaryData.nextBestActions.last_updated} format="time" fallback="Never" />
                        </div>
                      </div>
                    </div>
                    {summaryData.nextBestActions.priority_actions.length > 0 && (
                      <div className="mt-3">
                        <div className="text-xs font-medium text-gray-700 mb-2">Priority Actions:</div>
                        <div className="space-y-1">
                          {summaryData.nextBestActions.priority_actions.slice(0, 3).map((action, index) => (
                            <div key={index} className="flex items-start gap-2 text-xs text-orange-700">
                              <ArrowRight className="h-3 w-3 mt-0.5 flex-shrink-0" />
                              <span>{action}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Metadata */}
                {summaryData.metadata && (
                  <div className="text-xs text-gray-500 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <span className="font-medium">Last Sync:</span>
                        <span className="ml-2">
                          <SafeDate date={summaryData.metadata.last_sync} format="datetime" fallback="Never" />
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">Data Status:</span>
                        <Badge variant="outline" className={`ml-2 text-xs ${getDataFreshnessInfo(summaryData.metadata.data_freshness).bg} ${getDataFreshnessInfo(summaryData.metadata.data_freshness).color}`}>
                          {getDataFreshnessInfo(summaryData.metadata.data_freshness).text}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Info Section */}
            <div className="text-xs text-gray-500 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="font-medium text-blue-700 mb-1">Data Summary</div>
              This summary provides an overview of the agent's data flow, strategic insights, and integration status.
              Data is fetched from <code>/api/opal/agent-data?agent={agentId}&summary=true</code>.
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

export default AgentDataSummaryPanel;