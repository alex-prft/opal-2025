/**
 * Strategy Plans Widget - Enhanced with SOP Compliance
 * Main widget for strategy planning sections with integrated roadmap and maturity components
 * Now includes SOP validation middleware integration
 */

'use client';

import React from 'react';
import { ResultsPageBase } from './shared/ResultsPageBase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { LineChart } from '@/components/charts/LineChart';
import ConfidenceGauge from '@/components/opal/ConfidenceGauge';
import { LanguageRulesIndicator } from '@/components/dev/LanguageRulesIndicator';
import { useStrategyLanguageRules } from '@/hooks/useLanguageRules';
import { RoadmapTimeline } from './strategy/RoadmapTimeline';
import { MaturityScoreCard } from './strategy/MaturityScoreCard';
import {
  ResultsPageContent,
  createDefaultResultsContent,
  ensureContentNeverBlank
} from '@/types/results-content';
import { OPALData } from '@/lib/widget-config';
import { Target, TrendingUp, Users, Calendar, BarChart3, Map, Clock } from 'lucide-react';

export interface StrategyPlansWidgetProps {
  data: OPALData;
  className?: string;
}

export function StrategyPlansWidget({ data, className = '' }: StrategyPlansWidgetProps) {
  // Transform data to Results content model
  const resultsContent = React.useMemo((): ResultsPageContent => {
    if (!data || Object.keys(data).length === 0) {
      return createDefaultResultsContent('strategy', 'Strategic Planning Overview');
    }
    return transformStrategyPlanningData(data);
  }, [data]);

  // Language rules validation for Strategy content
  const { validateText, validateContent } = useStrategyLanguageRules();
  const languageValidation = React.useMemo(() => {
    return validateContent(resultsContent);
  }, [resultsContent, validateContent]);

  // Custom sections for Strategy-specific functionality
  const customSections = React.useMemo(() => (
    <StrategyPlanningCustomSections data={data} resultsContent={resultsContent} />
  ), [data, resultsContent]);

  return (
    <div className={className}>
      <ResultsPageBase
        content={resultsContent}
        customSections={customSections}
      />

      {/* Development Language Rules Indicator */}
      <LanguageRulesIndicator
        content={resultsContent}
        componentName="StrategyPlansWidget"
        className="mt-4"
      />
    </div>
  );
}

/**
 * Transform Strategy Planning data into Results content structure
 */
function transformStrategyPlanningData(data: OPALData): ResultsPageContent {
  const {
    confidenceScore,
    roadmapData,
    maturityData,
    performanceMetrics,
    phaseData
  } = data;

  // Calculate hero metrics with confidence handling
  const overallProgress = calculateOverallProgress(phaseData);
  const timelineConfidence = calculateTimelineConfidence(roadmapData, phaseData);
  const planConfidence = Math.max(confidenceScore || 35, 35);

  return {
    hero: {
      title: 'Strategic Planning Overview',
      promise: 'Comprehensive strategic planning insights with roadmap progression and maturity assessment.',
      metrics: [
        {
          label: 'Overall Progress',
          value: `${overallProgress}%`,
          hint: 'Cross-phase strategic initiative completion'
        },
        {
          label: 'Timeline Confidence',
          value: `${timelineConfidence}%`,
          hint: 'Schedule adherence and milestone tracking'
        },
        {
          label: 'Plan Confidence Index',
          value: `${planConfidence}/100`,
          hint: 'Strategic plan validation and data quality'
        }
      ],
      confidence: planConfidence,
      confidenceNote: planConfidence < 60 ? 'Building strategic confidence as milestone data accumulates' : undefined
    },

    overview: {
      summary: generateStrategyOverviewSummary(data, overallProgress, timelineConfidence),
      keyPoints: generateStrategyKeyPoints(data, overallProgress)
    },

    insights: generateStrategyInsights(data),

    opportunities: generateStrategyOpportunities(data),

    nextSteps: generateStrategyNextSteps(data),

    meta: {
      tier: 'strategy',
      agents: ['strategy_workflow', 'roadmap_generator', 'maturity_assessment'],
      maturity: getStrategyMaturity(maturityData),
      lastUpdated: new Date().toISOString()
    }
  };
}

/**
 * Calculate overall progress across all phases
 */
function calculateOverallProgress(phaseData: any): number {
  if (!phaseData || !Array.isArray(phaseData) || phaseData.length === 0) {
    return 25; // Default foundation phase progress
  }

  const totalProgress = phaseData.reduce((sum: number, phase: any) => {
    return sum + (phase.progress || 0);
  }, 0);

  return Math.round(totalProgress / phaseData.length);
}

/**
 * Calculate timeline confidence based on roadmap and phase data
 */
function calculateTimelineConfidence(roadmapData: any, phaseData: any): number {
  let confidence = 50; // Base confidence

  // Boost for roadmap completeness
  if (roadmapData?.milestones && roadmapData.milestones.length > 0) {
    confidence += 20;
  }

  // Boost for phase tracking
  if (phaseData && Array.isArray(phaseData) && phaseData.length > 0) {
    const avgPhaseProgress = phaseData.reduce((sum: number, phase: any) => sum + (phase.progress || 0), 0) / phaseData.length;
    confidence += Math.round(avgPhaseProgress * 0.3); // Up to 30% boost based on progress
  }

  return Math.min(95, confidence);
}

/**
 * Generate strategy overview summary
 */
function generateStrategyOverviewSummary(data: OPALData, progress: number, timelineConfidence: number): string {
  const { phaseData, maturityData } = data;
  const currentMaturity = maturityData?.currentPhase || 'walk';
  const activePhases = phaseData?.filter((p: any) => p.progress > 0 && p.progress < 100).length || 1;

  return `Your strategic implementation is ${progress}% complete across ${activePhases} active phase${activePhases !== 1 ? 's' : ''}. Timeline confidence stands at ${timelineConfidence}% based on milestone tracking and phase progression. Current maturity level (${currentMaturity}) guides strategic priorities and resource allocation decisions.`;
}

/**
 * Generate strategy key points
 */
function generateStrategyKeyPoints(data: OPALData, progress: number): string[] {
  const { phaseData, roadmapData, performanceMetrics } = data;

  return [
    `Strategic implementation shows ${progress}% completion with systematic phase-based progression`,
    `${phaseData?.length || 4} implementation phases tracked with milestone-based progress validation`,
    `${roadmapData?.milestones?.length || 'Multiple'} strategic milestones defined for systematic execution`,
    `${performanceMetrics?.length || 'Key'} performance indicators actively monitored for strategic alignment`
  ];
}

/**
 * Generate strategy insights
 */
function generateStrategyInsights(data: OPALData) {
  return [
    {
      title: 'Strategic Phase Analysis',
      description: 'Current implementation phase progress and milestone achievement patterns',
      bullets: [
        'Phase-based implementation approach ensures systematic strategic execution',
        'Milestone tracking provides measurable progress indicators and accountability',
        'Cross-phase dependencies managed through structured roadmap coordination'
      ]
    },
    {
      title: 'Maturity Assessment Impact',
      description: 'How current organizational maturity influences strategic planning and execution',
      bullets: [
        'Maturity-aligned strategy ensures realistic goal-setting and resource planning',
        'Capability-based phasing matches organizational readiness with strategic ambitions',
        'Progressive maturity advancement built into long-term strategic roadmap'
      ]
    }
  ];
}

/**
 * Generate strategy opportunities
 */
function generateStrategyOpportunities(data: OPALData) {
  const opportunities = [];
  const { phaseData, performanceMetrics, roadmapData } = data;

  // Phase acceleration opportunities
  const completedPhases = phaseData?.filter((p: any) => p.progress >= 90).length || 0;
  const activePhases = phaseData?.filter((p: any) => p.progress > 0 && p.progress < 90).length || 1;

  if (activePhases > 0) {
    opportunities.push({
      label: 'Accelerate current phase completion through focused milestone prioritization',
      impactLevel: 'High' as const,
      effortLevel: 'Medium' as const,
      confidence: 85
    });
  }

  // Performance optimization opportunities
  if (performanceMetrics && performanceMetrics.length > 0) {
    const underperformingMetrics = performanceMetrics.filter((m: any) => 
      m.current && m.target && (m.current / m.target) < 0.8
    );

    if (underperformingMetrics.length > 0) {
      opportunities.push({
        label: 'Optimize underperforming strategic metrics through targeted intervention',
        impactLevel: 'Medium' as const,
        effortLevel: 'Medium' as const,
        confidence: 75
      });
    }
  }

  // Roadmap optimization opportunities
  if (roadmapData?.risks && roadmapData.risks.length > 0) {
    opportunities.push({
      label: 'Implement proactive risk mitigation for identified roadmap dependencies',
      impactLevel: 'High' as const,
      effortLevel: 'Low' as const,
      confidence: 80
    });
  }

  return opportunities;
}

/**
 * Generate strategy next steps
 */
function generateStrategyNextSteps(data: OPALData) {
  return [
    {
      label: 'Review current phase milestone completion and identify acceleration opportunities',
      ownerHint: 'Strategy Team',
      timeframeHint: 'Next 2 weeks'
    },
    {
      label: 'Conduct strategic performance review and adjust targets based on progress data',
      ownerHint: 'Leadership Team',
      timeframeHint: 'Monthly'
    },
    {
      label: 'Update roadmap timeline based on phase completion rates and milestone achievement',
      ownerHint: 'Project Management',
      timeframeHint: 'Next month'
    },
    {
      label: 'Assess maturity advancement opportunities and plan capability development',
      ownerHint: 'Strategy Team',
      timeframeHint: 'Quarterly'
    }
  ];
}

/**
 * Get strategy maturity level
 */
function getStrategyMaturity(maturityData: any): 'crawl' | 'walk' | 'run' | 'fly' {
  if (!maturityData?.currentPhase) return 'walk';
  
  const phase = maturityData.currentPhase.toLowerCase();
  if (['crawl', 'walk', 'run', 'fly'].includes(phase)) {
    return phase as 'crawl' | 'walk' | 'run' | 'fly';
  }
  
  return 'walk';
}

/**
 * Custom sections component for Strategy-specific functionality
 */
interface StrategyPlanningCustomSectionsProps {
  data: OPALData;
  resultsContent: ResultsPageContent;
}

function StrategyPlanningCustomSections({ data }: StrategyPlanningCustomSectionsProps) {
  const {
    roadmapData,
    maturityData,
    performanceMetrics,
    phaseData
  } = data;

  return (
    <div className="space-y-6">
      {/* Strategic Roadmap & Phase Tracking */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Map className="h-5 w-5 mr-2" />
            Strategic Implementation Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="roadmap" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="roadmap">Roadmap</TabsTrigger>
              <TabsTrigger value="maturity">Maturity</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="phases">Phases</TabsTrigger>
            </TabsList>

            {/* Enhanced Roadmap Timeline */}
            <TabsContent value="roadmap">
              <RoadmapTimeline roadmapData={roadmapData} />
            </TabsContent>

            {/* Enhanced Maturity Assessment */}
            <TabsContent value="maturity">
              <MaturityScoreCard maturityData={maturityData} />
            </TabsContent>

            {/* Performance Metrics */}
            <TabsContent value="performance">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Strategic Performance Metrics
                  </CardTitle>
                  <CardDescription>
                    Key performance indicators and trends for strategic initiatives
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {performanceMetrics && performanceMetrics.length > 0 ? (
                    <div className="space-y-4">
                      {/* Metrics Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {performanceMetrics.map((metric: any, index: number) => (
                          <div key={index} className="p-4 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold text-sm">{metric.metric}</h4>
                              <Badge variant={metric.trend === 'up' ? 'default' : 'secondary'}>
                                {metric.trend || 'stable'}
                              </Badge>
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span>Current:</span>
                                <span className="font-medium">{metric.current || 'Processing...'}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span>Target:</span>
                                <span className="font-medium">{metric.target || 'Setting...'}</span>
                              </div>
                              <Progress
                                value={metric.current && metric.target ? (metric.current / metric.target) * 100 : 25}
                                className="h-2 mt-2"
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Performance Chart */}
                      <div className="mt-6">
                        <LineChart
                          data={performanceMetrics.map((m: any, i: number) => ({
                            name: m.metric,
                            current: m.current || 0,
                            target: m.target || 100,
                            index: i
                          }))}
                          xDataKey="name"
                          lines={[
                            { dataKey: 'current', stroke: '#3b82f6', name: 'Current' },
                            { dataKey: 'target', stroke: '#10b981', name: 'Target' }
                          ]}
                          height={250}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <BarChart3 className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p>Strategic performance metrics are being established</p>
                      <p className="text-sm mt-1">Performance tracking will appear as strategic initiatives progress</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Phase Details */}
            <TabsContent value="phases">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    Implementation Phase Details
                  </CardTitle>
                  <CardDescription>
                    Detailed phase breakdown with milestones, progress, and risk management
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {phaseData && phaseData.length > 0 ? (
                    <div className="space-y-6">
                      {phaseData.map((phase: any, index: number) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex-1">
                              <h4 className="font-semibold">Phase {phase.phase}: {phase.name}</h4>
                              <div className="flex items-center space-x-4 mt-2">
                                <Progress value={phase.progress || 25} className="w-48" />
                                <span className="text-sm text-gray-600">{phase.progress || 25}% complete</span>
                              </div>
                            </div>
                          </div>

                          {/* Milestones */}
                          <div className="mb-4">
                            <h5 className="font-medium mb-2">Key Milestones</h5>
                            <div className="flex flex-wrap gap-2">
                              {phase.milestones && phase.milestones.length > 0 ? (
                                phase.milestones.map((milestone: string, idx: number) => (
                                  <Badge key={idx} variant="outline">{milestone}</Badge>
                                ))
                              ) : (
                                <Badge variant="outline">Milestone planning in progress</Badge>
                              )}
                            </div>
                          </div>

                          {/* Risks */}
                          {phase.risks && phase.risks.length > 0 && (
                            <div>
                              <h5 className="font-medium mb-2">Risk Factors</h5>
                              <div className="flex flex-wrap gap-2">
                                {phase.risks.map((risk: string, idx: number) => (
                                  <Badge key={idx} variant="secondary">{risk}</Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Clock className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p>Strategic phases are being planned and organized</p>
                      <p className="text-sm mt-1">Phase details will appear as strategic roadmap is developed</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}