'use client';

import React, { useState, useEffect } from 'react';
import { useParams, notFound } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Database,
  Zap,
  Target,
  Settings,
  Brain,
  CheckCircle2,
  Users,
  ArrowRight,
  Download,
  Edit3,
  Save,
  X,
  Clock,
  ExternalLink
} from 'lucide-react';
import { SafeDate } from '@/lib/utils/date-formatter';
import { AgentDataPayload, AGENT_ROUTES, AGENT_NAMES } from '@/types/agent-data';
import { ValidatePayloadPanel, ReplayWorkflowPanel, AgentDataSummaryPanel } from '@/components/agent-monitoring';

interface EditableSection {
  isEditing: boolean;
  content: string[];
}

export default function AgentPage() {
  const params = useParams();
  const agentParam = params.agent as string;

  // Validate agent parameter
  if (!agentParam || !(agentParam in AGENT_ROUTES)) {
    notFound();
  }

  const agentId = AGENT_ROUTES[agentParam as keyof typeof AGENT_ROUTES];
  const agentName = AGENT_NAMES[agentId];

  const [agentData, setAgentData] = useState<AgentDataPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editableSections, setEditableSections] = useState<{
    strategyAssistance: EditableSection;
    osaSuggestions: {
      recommendationService: EditableSection;
      knowledgeRetrievalService: EditableSection;
      preferencesPolicyService: EditableSection;
    };
    useCaseScenarios: EditableSection;
    nextBestActions: EditableSection;
  }>({
    strategyAssistance: { isEditing: false, content: [] },
    osaSuggestions: {
      recommendationService: { isEditing: false, content: [] },
      knowledgeRetrievalService: { isEditing: false, content: [] },
      preferencesPolicyService: { isEditing: false, content: [] }
    },
    useCaseScenarios: { isEditing: false, content: [] },
    nextBestActions: { isEditing: false, content: [] }
  });

  const fetchAgentData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/opal/agent-data?agent=${agentId}`);
      const data = await response.json();

      if (data.success) {
        setAgentData(data);
        // Initialize editable sections with current data
        setEditableSections({
          strategyAssistance: {
            isEditing: false,
            content: data.strategyAssistance?.recommendations || []
          },
          osaSuggestions: {
            recommendationService: {
              isEditing: false,
              content: data.osaSuggestions?.recommendationService || []
            },
            knowledgeRetrievalService: {
              isEditing: false,
              content: data.osaSuggestions?.knowledgeRetrievalService || []
            },
            preferencesPolicyService: {
              isEditing: false,
              content: data.osaSuggestions?.preferencesPolicyService || []
            }
          },
          useCaseScenarios: {
            isEditing: false,
            content: data.useCaseScenarios || []
          },
          nextBestActions: {
            isEditing: false,
            content: data.nextBestActions || []
          }
        });
      } else {
        setError(data.error || 'No agent data available. Please check the integration or try again later.');
      }
    } catch (err) {
      console.error('Agent data fetch error:', err);
      setError('No agent data available. Please check the integration or try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAgentData();
  }, [agentId]);

  const exportData = () => {
    if (!agentData) return;

    const dataStr = JSON.stringify(agentData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

    const exportFileDefaultName = `${agentId}-data-${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleEdit = (section: string, subsection?: string) => {
    setEditableSections(prev => {
      const newState = { ...prev };
      if (subsection) {
        // Handle OSA subsection
        newState.osaSuggestions[subsection as keyof typeof prev.osaSuggestions].isEditing = true;
      } else {
        // Handle main section
        (newState as any)[section].isEditing = true;
      }
      return newState;
    });
  };

  const handleSave = async (section: string, subsection?: string) => {
    try {
      // Get the current content
      const sectionData = subsection
        ? editableSections.osaSuggestions[subsection as keyof typeof editableSections.osaSuggestions]
        : (editableSections as any)[section];

      const content = sectionData?.content || [];

      // Save to admin override system
      const response = await fetch(`/api/opal/agent-data?agent=${agentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          section,
          subsection,
          content
        })
      });

      const result = await response.json();

      if (result.success) {
        // Update editing state to false
        setEditableSections(prev => {
          const newState = { ...prev };
          if (subsection) {
            newState.osaSuggestions[subsection as keyof typeof prev.osaSuggestions].isEditing = false;
          } else {
            (newState as any)[section].isEditing = false;
          }
          return newState;
        });

        // Show success feedback (you could add a toast notification here)
        console.log('Successfully saved:', { section, subsection, agentId });
      } else {
        console.error('Save failed:', result.error);
        // You could show an error message to the user here
      }
    } catch (error) {
      console.error('Save error:', error);
      // You could show an error message to the user here
    }
  };

  const handleCancel = (section: string, subsection?: string) => {
    setEditableSections(prev => {
      const newState = { ...prev };
      if (subsection) {
        newState.osaSuggestions[subsection as keyof typeof prev.osaSuggestions].isEditing = false;
        // Reset content to original
        if (agentData?.osaSuggestions) {
          newState.osaSuggestions[subsection as keyof typeof prev.osaSuggestions].content =
            agentData.osaSuggestions[subsection as keyof typeof agentData.osaSuggestions] || [];
        }
      } else {
        (newState as any)[section].isEditing = false;
        // Reset content to original
        if (agentData) {
          if (section === 'strategyAssistance') {
            newState.strategyAssistance.content = agentData.strategyAssistance?.recommendations || [];
          } else if (section === 'useCaseScenarios') {
            newState.useCaseScenarios.content = agentData.useCaseScenarios || [];
          } else if (section === 'nextBestActions') {
            newState.nextBestActions.content = agentData.nextBestActions || [];
          }
        }
      }
      return newState;
    });
  };

  const updateContent = (section: string, content: string, subsection?: string) => {
    const items = content.split('\n').filter(item => item.trim() !== '');

    setEditableSections(prev => {
      const newState = { ...prev };
      if (subsection) {
        newState.osaSuggestions[subsection as keyof typeof prev.osaSuggestions].content = items;
      } else {
        (newState as any)[section].content = items;
      }
      return newState;
    });
  };

  const renderEditableList = (
    title: string,
    icon: React.ElementType,
    items: string[],
    section: string,
    subsection?: string
  ) => {
    const sectionData = subsection
      ? editableSections.osaSuggestions[subsection as keyof typeof editableSections.osaSuggestions]
      : (editableSections as any)[section];

    const isEditing = sectionData?.isEditing || false;
    const currentItems = sectionData?.content || items;
    const Icon = icon;

    return (
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-lg font-semibold flex items-center gap-2">
            <Icon className="h-5 w-5 text-blue-600" />
            {title}
          </h4>
          {!isEditing ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEdit(section, subsection)}
              className="flex items-center gap-1"
            >
              <Edit3 className="h-3 w-3" />
              Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSave(section, subsection)}
                className="flex items-center gap-1"
              >
                <Save className="h-3 w-3" />
                Save
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCancel(section, subsection)}
                className="flex items-center gap-1"
              >
                <X className="h-3 w-3" />
                Cancel
              </Button>
            </div>
          )}
        </div>

        {isEditing ? (
          <Textarea
            className="min-h-32"
            placeholder="Enter items, one per line"
            value={currentItems.join('\n')}
            onChange={(e) => updateContent(section, e.target.value, subsection)}
          />
        ) : (
          <div className="space-y-2">
            {currentItems.map((item, index) => (
              <div key={index} className="flex items-start gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-600 mt-2 flex-shrink-0"></div>
                <span className="text-sm text-gray-700">{item}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderDataSentToOSA = (data: any) => {
    if (!data) return null;

    return (
      <div className="bg-gray-50 rounded-lg p-4">
        <pre className="text-sm text-gray-700 whitespace-pre-wrap overflow-x-auto">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-b-2 border-blue-600 rounded-full mx-auto mb-3"></div>
          <p className="text-sm text-gray-600">Loading agent data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">No Agent Data Available</CardTitle>
            <CardDescription className="text-red-600">{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => fetchAgentData()}
              className="flex items-center gap-2"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!agentData) {
    return (
      <div className="p-8">
        <Card>
          <CardHeader>
            <CardTitle>No Agent Data Available</CardTitle>
            <CardDescription>No agent data available. Please check the integration or try again later.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => fetchAgentData()}
              className="flex items-center gap-2"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      {/* Page Header */}
      <div className="border-b pb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{agentName}</h1>
            <p className="text-lg text-gray-600">
              Detailed insights and strategic recommendations from the {agentName.toLowerCase()}
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={exportData}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export Data
            </Button>
            <Button
              onClick={() => window.open(`/api/opal/agent-data?agent=${agentId}`, '_blank')}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              View JSON
            </Button>
          </div>
        </div>
      </div>

      {/* OPAL → OSA Monitoring Panels */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <Database className="h-5 w-5 text-blue-600" />
          OPAL → OSA Monitoring & Validation
        </h2>

        <div className="grid gap-4">
          {/* Agent Data Summary Panel */}
          <AgentDataSummaryPanel
            agentId={agentId}
            className="bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200"
          />

          {/* Validate Payload Panel */}
          <ValidatePayloadPanel
            agentId={agentId}
            className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200"
          />

          {/* Replay Workflow Panel */}
          <ReplayWorkflowPanel
            agentId={agentId}
            lastWorkflowId={agentData?.lastWorkflowId}
            className="bg-gradient-to-r from-purple-50 to-violet-50 border-purple-200"
          />
        </div>
      </div>

      <div className="grid gap-8">
        {/* Data Sent to OSA */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-green-600" />
              Data Sent to OSA
            </CardTitle>
            <CardDescription>
              Core operational data and metrics sent to the Optimizely Strategy Assistant
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderDataSentToOSA(agentData.dataSentToOSA)}
          </CardContent>
        </Card>

        {/* Optimizely DXP Tools Used */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-purple-600" />
              Optimizely DXP Tools Used
            </CardTitle>
            <CardDescription>
              Digital Experience Platform tools leveraged by this agent
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {agentData.optimizelyDxpTools.map((tool, index) => (
                <Badge key={index} variant="secondary" className="bg-purple-100 text-purple-800">
                  {tool}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Strategy Assistance - Editable */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-orange-600" />
              Strategy Assistance
            </CardTitle>
            <CardDescription>
              Strategic recommendations and actionable insights (Admin Editable)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderEditableList(
              "Recommendations",
              Target,
              agentData.strategyAssistance?.recommendations || [],
              "strategyAssistance"
            )}
          </CardContent>
        </Card>

        {/* OSA Suggestions - Editable */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-indigo-600" />
              OSA Integration Suggestions
            </CardTitle>
            <CardDescription>
              Recommendations for enhancing OSA service integrations (Admin Editable)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {renderEditableList(
              "Recommendation Service Enhancements",
              ArrowRight,
              agentData.osaSuggestions?.recommendationService || [],
              "osaSuggestions",
              "recommendationService"
            )}

            {renderEditableList(
              "Knowledge Retrieval Service Improvements",
              Database,
              agentData.osaSuggestions?.knowledgeRetrievalService || [],
              "osaSuggestions",
              "knowledgeRetrievalService"
            )}

            {renderEditableList(
              "Preferences Policy Service Updates",
              Settings,
              agentData.osaSuggestions?.preferencesPolicyService || [],
              "osaSuggestions",
              "preferencesPolicyService"
            )}
          </CardContent>
        </Card>

        {/* OPAL Custom Tools Used */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-600" />
              OPAL Custom Tools Used
            </CardTitle>
            <CardDescription>
              Specialized tools and capabilities developed for this agent
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {agentData.opalCustomTools.map((tool, index) => (
                <div key={index} className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    {tool.toolName}
                  </div>
                  <div className="text-sm text-blue-700">
                    {tool.description}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Use Case Scenarios - Editable */}
        {agentData.useCaseScenarios && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-teal-600" />
                Use Case Scenarios
              </CardTitle>
              <CardDescription>
                Real-world applications and implementation scenarios (Admin Editable)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderEditableList(
                "Scenarios",
                Users,
                agentData.useCaseScenarios,
                "useCaseScenarios"
              )}
            </CardContent>
          </Card>
        )}

        {/* Next Best Actions - Editable */}
        {agentData.nextBestActions && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                Next Best Actions
              </CardTitle>
              <CardDescription>
                Recommended immediate next steps and action items (Admin Editable)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderEditableList(
                "Action Items",
                CheckCircle2,
                agentData.nextBestActions,
                "nextBestActions"
              )}
            </CardContent>
          </Card>
        )}

        {/* Metadata */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-gray-600" />
              Metadata
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <div className="font-medium text-gray-900 mb-1">Agent ID</div>
                <div className="text-gray-600">{agentData.agent_id}</div>
              </div>
              <div>
                <div className="font-medium text-gray-900 mb-1">Last Data Sent</div>
                <div className="text-gray-600">
                  {agentData.lastDataSent ? (
                    <SafeDate date={agentData.lastDataSent} format="datetime" />
                  ) : 'N/A'}
                </div>
              </div>
              <div>
                <div className="font-medium text-gray-900 mb-1">Last Updated</div>
                <div className="text-gray-600">
                  <SafeDate date={agentData.timestamp} format="datetime" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}