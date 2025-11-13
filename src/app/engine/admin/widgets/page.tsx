/**
 * Phase 3 Demo Widgets - Real-time Agent Updates Dashboard
 *
 * Widget A: Real-time Agent Progress
 * Widget B: Incremental Recommendations Preview
 *
 * Uses Server-Sent Events for live updates every 5 seconds
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';

// Types for SSE data
interface AgentUpdate {
  workflow_id: string;
  agent_id: string;
  progress: number;
  status: 'running' | 'completed' | 'failed';
  partial_recommendation?: string;
}

interface AgentState {
  [key: string]: AgentUpdate;
}

interface RecommendationPreview {
  agent_id: string;
  recommendation: string;
  confidence: number;
  timestamp: string;
}

export default function WidgetsPage() {
  const [agentStates, setAgentStates] = useState<AgentState>({});
  const [recommendations, setRecommendations] = useState<RecommendationPreview[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [workflowId] = useState('demo-workflow-' + Date.now());
  const eventSourceRef = useRef<EventSource | null>(null);

  // Initialize SSE connection
  useEffect(() => {
    console.log('📺 [Widgets] Initializing SSE connection...');

    setConnectionStatus('connecting');

    const eventSource = new EventSource(`/api/stream/agent-updates?workflow_id=${workflowId}`);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log('📺 [Widgets] SSE connection opened');
      setConnectionStatus('connected');
    };

    eventSource.addEventListener('connection', (event) => {
      const data = JSON.parse(event.data);
      console.log('📺 [Widgets] Connection confirmed:', data);
    });

    eventSource.addEventListener('agent_update', (event) => {
      const update: AgentUpdate = JSON.parse(event.data);
      console.log('📡 [Widgets] Agent update received:', update);

      // Update agent states
      setAgentStates(prev => ({
        ...prev,
        [update.agent_id]: update
      }));

      // Add to recommendations if there's a partial recommendation
      if (update.partial_recommendation) {
        const preview: RecommendationPreview = {
          agent_id: update.agent_id,
          recommendation: update.partial_recommendation,
          confidence: Math.round((update.progress / 100) * 95) / 100, // Convert progress to confidence
          timestamp: new Date().toISOString()
        };

        setRecommendations(prev => {
          // Keep only the latest 10 recommendations
          const newRecs = [preview, ...prev.slice(0, 9)];
          return newRecs;
        });
      }
    });

    eventSource.addEventListener('error', (event) => {
      console.error('❌ [Widgets] SSE error:', event);
      const errorData = JSON.parse((event as any).data || '{}');
      console.error('Error details:', errorData);
    });

    eventSource.onerror = (error) => {
      console.error('❌ [Widgets] SSE connection error:', error);
      setConnectionStatus('disconnected');
    };

    // Cleanup on unmount
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [workflowId]);

  // Agent display names mapping
  const agentDisplayNames: { [key: string]: string } = {
    experiment_blueprinter: 'Experiment Blueprinter',
    audience_suggester: 'Audience Suggester',
    content_review: 'Content Review',
    roadmap_generator: 'Roadmap Generator',
    integration_health: 'Integration Health',
    personalization_idea_generator: 'Personalization Ideas',
    cmp_organizer: 'Campaign Organizer',
    customer_journey: 'Customer Journey',
    geo_audit: 'Geographic Audit'
  };

  // Get status color for progress bars
  const getStatusColor = (status: string, progress: number) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      case 'running':
        if (progress >= 90) return 'bg-blue-500';
        if (progress >= 60) return 'bg-yellow-500';
        return 'bg-gray-500';
      default: return 'bg-gray-300';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✅';
      case 'failed': return '❌';
      case 'running': return '🔄';
      default: return '⏸️';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Phase 3 Demo Widgets - Real-time Agent Updates
          </h1>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-500' :
                connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
              }`}></div>
              <span className="text-gray-600">
                SSE Connection: {connectionStatus}
              </span>
            </div>
            <div className="text-gray-600">
              Workflow ID: <code className="bg-gray-100 px-2 py-1 rounded text-xs">{workflowId}</code>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Widget A: Real-time Agent Progress */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                Widget A: Real-time Agent Progress
              </h2>
              <p className="text-gray-600 text-sm">
                Live updates from all 9 OPAL agents with progress tracking and status monitoring
              </p>
            </div>

            <div className="space-y-4">
              {Object.entries(agentStates).length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="animate-spin w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full mx-auto mb-4"></div>
                  Waiting for agent updates...
                </div>
              ) : (
                Object.entries(agentStates).map(([agentId, state]) => (
                  <div key={agentId} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">
                          {getStatusIcon(state.status)}
                        </span>
                        <span className="font-medium text-gray-800">
                          {agentDisplayNames[agentId] || agentId}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-600">
                          {state.progress}% Complete
                        </div>
                        <div className="text-xs text-gray-500 capitalize">
                          {state.status}
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-3">
                      <div
                        className={`h-2.5 rounded-full transition-all duration-500 ${getStatusColor(state.status, state.progress)}`}
                        style={{ width: `${state.progress}%` }}
                      ></div>
                    </div>

                    {/* Partial Recommendation */}
                    {state.partial_recommendation && (
                      <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded">
                        <div className="text-xs font-medium text-blue-800 mb-1">
                          Preliminary Finding:
                        </div>
                        <div className="text-sm text-blue-700">
                          {state.partial_recommendation}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Widget B: Incremental Recommendations Preview */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                Widget B: Incremental Recommendations Preview
              </h2>
              <p className="text-gray-600 text-sm">
                Real-time preview of recommendations with confidence scores as agents complete analysis
              </p>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {recommendations.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-4">💡</div>
                  No recommendations yet...
                  <div className="text-xs mt-2">
                    Recommendations will appear as agents complete their analysis
                  </div>
                </div>
              ) : (
                recommendations.map((rec, index) => (
                  <div
                    key={`${rec.agent_id}-${rec.timestamp}`}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium text-gray-700">
                          {agentDisplayNames[rec.agent_id] || rec.agent_id}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {Math.round(rec.confidence * 100)}% confidence
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(rec.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-800">
                      {rec.recommendation}
                    </div>
                  </div>
                ))
              )}
            </div>

            {recommendations.length > 0 && (
              <div className="mt-4 text-center">
                <button
                  onClick={() => setRecommendations([])}
                  className="text-sm text-gray-500 hover:text-gray-700 underline"
                >
                  Clear all recommendations
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Technical Details */}
        <div className="mt-8 bg-gray-100 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Phase 3 Technical Implementation Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Streaming Infrastructure:</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Server-Sent Events (SSE) for one-way updates</li>
                <li>• 5-second update frequency for active workflows</li>
                <li>• Automatic reconnection handling</li>
                <li>• File-based persistence for streaming events</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Agent Simulation:</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• All 9 OPAL agents with realistic outputs</li>
                <li>• Progress percentages and status updates</li>
                <li>• Preliminary findings and recommendations</li>
                <li>• Confidence scoring based on completion</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}