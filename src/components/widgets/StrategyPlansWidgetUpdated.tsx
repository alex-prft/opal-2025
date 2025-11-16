/**
 * Strategy Plans Widget - Updated with Shared Results Content Model
 *
 * Implements standardized Strategy Results with required hero metrics:
 * - Overall Progress (phase completion percentage)
 * - Timeline Confidence (schedule adherence score)
 * - Plan Confidence Index (data quality and risk based)
 *
 * NO revenue or currency-based metrics allowed
 */

'use client';

import React from 'react';
import { ResultsPageBase } from './shared/ResultsPageBase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RoadmapTimeline } from './strategy/RoadmapTimeline';
import { MaturityScoreCard } from './strategy/MaturityScoreCard';
import { LanguageRulesIndicator } from '@/components/dev/LanguageRulesIndicator';
import { useStrategyLanguageRules } from '@/hooks/useLanguageRules';
import {
  ResultsPageContent,
  createDefaultResultsContent,
  MaturityPhase
} from '@/types/results-content';
import { OPALData } from '@/lib/widget-config';
import {
  Target,
  Calendar,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertTriangle
} from 'lucide-react';

export interface StrategyPlansWidgetProps {
  data: OPALData;
  className?: string;
}

/**
 * Transforms OPAL data into Strategy Results content structure
 */
function transformStrategyData(data: OPALData): ResultsPageContent {
  const {
    confidenceScore,
    roadmapData,
    maturityData,
    performanceMetrics,
    phaseData
  } = data;

  // Calculate Strategy-specific metrics (NO revenue/currency)
  const overallProgress = calculateOverallProgress(phaseData, roadmapData);
  const timelineConfidence = calculateTimelineConfidence(roadmapData, performanceMetrics);
  const planConfidenceIndex = calculatePlanConfidenceIndex(confidenceScore, data);

  // Map maturity level
  const maturityPhase: MaturityPhase = maturityData?.currentPhase?.toLowerCase() as MaturityPhase || 'crawl';

  return {
    hero: {
      title: 'Strategic Planning Performance',
      promise: 'Track your strategic roadmap progress with confidence insights and timeline adherence.',
      metrics: [
        {
          label: 'Overall Progress',
          value: `${overallProgress.percentage}%`,
          hint: 'Phase completion with trend'
        },
        {
          label: 'Timeline Confidence',
          value: `${timelineConfidence.score}%`,
          hint: 'Schedule adherence'
        },
        {
          label: 'Plan Confidence Index',
          value: `${planConfidenceIndex}/100`,
          hint: 'Confidence in this plan based on current data and risks'
        }
      ],
      confidence: planConfidenceIndex,
      confidenceNote: planConfidenceIndex < 60 ?
        'Building confidence as more data becomes available' : undefined
    },

    overview: {
      summary: generateStrategyOverviewSummary(overallProgress, timelineConfidence, planConfidenceIndex),
      keyPoints: generateStrategyKeyPoints(overallProgress, timelineConfidence, planConfidenceIndex, maturityPhase)
    },

    insights: generateStrategyInsights(roadmapData, maturityData, phaseData),

    opportunities: generateStrategyOpportunities(overallProgress, timelineConfidence, maturityData),

    nextSteps: generateStrategyNextSteps(maturityPhase, overallProgress, roadmapData),

    meta: {
      tier: 'strategy',
      agents: ['strategy_workflow', 'roadmap_generator'],
      maturity: maturityPhase,
      lastUpdated: new Date().toISOString()
    }
  };
}

/**
 * Calculate overall progress from phase and roadmap data
 */
function calculateOverallProgress(phaseData: any, roadmapData: any): {
  percentage: number;
  trend: 'up' | 'down' | 'stable';
  completedPhases: number;
  totalPhases: number;
} {
  if (!phaseData && !roadmapData) {
    return { percentage: 0, trend: 'stable', completedPhases: 0, totalPhases: 4 };
  }

  // Calculate based on maturity phases: CRAWL → WALK → RUN → FLY
  const phases = ['crawl', 'walk', 'run', 'fly'];
  const currentPhaseIndex = phaseData?.currentPhase ?
    phases.indexOf(phaseData.currentPhase.toLowerCase()) : 0;

  const completedPhases = currentPhaseIndex >= 0 ? currentPhaseIndex + 1 : 1;
  const percentage = Math.round((completedPhases / phases.length) * 100);

  // Determine trend from recent progress
  const trend = phaseData?.recentProgress > 0 ? 'up' :
                phaseData?.recentProgress < 0 ? 'down' : 'stable';

  return {
    percentage,
    trend,
    completedPhases,
    totalPhases: phases.length
  };
}

/**
 * Calculate timeline confidence from roadmap and performance data
 */
function calculateTimelineConfidence(roadmapData: any, performanceMetrics: any): {
  score: number;
  status: 'on-track' | 'at-risk' | 'behind';
  milestonesOnTime: number;
  totalMilestones: number;
} {
  if (!roadmapData) {
    return { score: 50, status: 'at-risk', milestonesOnTime: 0, totalMilestones: 0 };
  }

  const milestones = roadmapData.milestones || [];
  const onTimeMilestones = milestones.filter((m: any) => m.status === 'completed' || m.status === 'on-track').length;
  const score = milestones.length > 0 ? Math.round((onTimeMilestones / milestones.length) * 100) : 50;

  const status = score >= 80 ? 'on-track' : score >= 60 ? 'at-risk' : 'behind';

  return {
    score,
    status,
    milestonesOnTime: onTimeMilestones,
    totalMilestones: milestones.length
  };
}

/**
 * Calculate plan confidence index from data quality and risk factors
 */
function calculatePlanConfidenceIndex(confidenceScore: number | undefined, data: any): number {
  let baseConfidence = confidenceScore || 50;

  // Adjust based on data completeness
  const dataCompleteness = calculateDataCompleteness(data);
  const dataAdjustment = (dataCompleteness - 50) * 0.3; // ±15 point adjustment

  // Adjust based on risk factors
  const riskFactors = identifyRiskFactors(data);
  const riskAdjustment = -riskFactors.length * 5; // -5 points per risk factor

  const finalConfidence = Math.max(0, Math.min(100,
    Math.round(baseConfidence + dataAdjustment + riskAdjustment)
  ));

  return finalConfidence;
}

/**
 * Calculate data completeness score
 */
function calculateDataCompleteness(data: any): number {
  const requiredFields = ['roadmapData', 'maturityData', 'phaseData', 'performanceMetrics'];
  const presentFields = requiredFields.filter(field => data[field] && Object.keys(data[field]).length > 0);
  return Math.round((presentFields.length / requiredFields.length) * 100);
}

/**
 * Identify risk factors in the strategy plan
 */
function identifyRiskFactors(data: any): string[] {
  const risks: string[] = [];

  if (!data.roadmapData || !data.roadmapData.milestones) {
    risks.push('Missing roadmap milestones');
  }

  if (!data.maturityData || !data.maturityData.currentPhase) {
    risks.push('Undefined maturity phase');
  }

  if (data.performanceMetrics && data.performanceMetrics.some((m: any) => m.trend === 'down')) {
    risks.push('Declining performance trends');
  }

  return risks;
}

/**
 * Generate strategy overview summary
 */
function generateStrategyOverviewSummary(
  progress: ReturnType<typeof calculateOverallProgress>,
  timeline: ReturnType<typeof calculateTimelineConfidence>,
  confidence: number
): string {
  const progressStatus = progress.percentage >= 75 ? 'excellent progress' :
                        progress.percentage >= 50 ? 'steady progress' : 'early stage progress';

  const timelineStatus = timeline.status === 'on-track' ? 'on schedule' :
                        timeline.status === 'at-risk' ? 'timeline at risk' : 'behind schedule';

  const confidenceStatus = confidence >= 80 ? 'high confidence' :
                          confidence >= 60 ? 'moderate confidence' : 'building confidence';

  return `Your strategic plan shows ${progressStatus} at ${progress.percentage}% completion, with ${timelineStatus} and ${confidenceStatus} in the overall plan direction.`;
}

/**
 * Generate strategy key points based on metrics
 */
function generateStrategyKeyPoints(
  progress: ReturnType<typeof calculateOverallProgress>,
  timeline: ReturnType<typeof calculateTimelineConfidence>,
  confidence: number,
  maturity: MaturityPhase
): string[] {
  const points: string[] = [];

  // Progress point
  if (progress.trend === 'up') {
    points.push(`Currently in ${maturity.toUpperCase()} phase with accelerating progress trends`);
  } else {
    points.push(`Progressing through ${maturity.toUpperCase()} phase with ${progress.completedPhases}/${progress.totalPhases} phases completed`);
  }

  // Timeline point
  if (timeline.status === 'on-track') {
    points.push(`Timeline confidence is strong at ${timeline.score}% with most milestones on track`);
  } else {
    points.push(`Timeline needs attention: ${timeline.milestonesOnTime}/${timeline.totalMilestones} milestones on schedule`);
  }

  // Confidence point
  if (confidence >= 80) {
    points.push('Plan confidence is high based on data quality and low risk factors');
  } else if (confidence >= 60) {
    points.push('Plan confidence is moderate - some areas need additional validation');
  } else {
    points.push('Building plan confidence as more baseline data becomes available');
  }

  // Maturity-specific point
  const maturityGuidance = {
    crawl: 'Focus on foundational setup and initial data collection',
    walk: 'Emphasis on process optimization and capability building',
    run: 'Advanced optimization and performance fine-tuning',
    fly: 'Innovation and scaling successful patterns'
  };

  points.push(maturityGuidance[maturity] || 'Continue systematic progression through maturity phases');

  return points;
}

/**
 * Generate strategy insights
 */
function generateStrategyInsights(roadmapData: any, maturityData: any, phaseData: any) {
  const insights = [];

  if (roadmapData) {
    insights.push({
      title: 'Roadmap Progression',
      description: 'Analysis of milestone completion and timeline adherence patterns',
      bullets: [
        'Milestone completion rate indicates overall execution velocity',
        'Timeline adherence shows planning accuracy and resource allocation',
        'Phase transitions require specific capability prerequisites'
      ]
    });
  }

  if (maturityData) {
    insights.push({
      title: 'Maturity Assessment',
      description: 'Current capabilities and readiness for next phase progression',
      bullets: [
        'Each maturity phase requires different focus areas and capabilities',
        'Progression criteria ensure sustainable advancement through phases',
        'Maturity gaps indicate areas needing additional development'
      ]
    });
  }

  if (phaseData) {
    insights.push({
      title: 'Phase Performance',
      description: 'Detailed analysis of current phase execution and readiness metrics',
      bullets: [
        'Phase completion indicators track specific deliverable progress',
        'Readiness scores determine advancement to next maturity level',
        'Performance trends highlight optimization opportunities'
      ]
    });
  }

  return insights.length > 0 ? insights : [{
    title: 'Strategic Foundation',
    description: 'Building baseline understanding for strategic planning',
    bullets: [
      'Establishing measurement frameworks for progress tracking',
      'Defining maturity phase criteria and progression requirements',
      'Setting up data collection for informed decision making'
    ]
  }];
}

/**
 * Generate strategy opportunities
 */
function generateStrategyOpportunities(
  progress: ReturnType<typeof calculateOverallProgress>,
  timeline: ReturnType<typeof calculateTimelineConfidence>,
  maturityData: any
) {
  const opportunities = [];

  // Progress-based opportunities
  if (progress.trend === 'down' || progress.percentage < 50) {
    opportunities.push({
      label: 'Accelerate current phase completion through focused resource allocation',
      impactLevel: 'High' as const,
      effortLevel: 'Medium' as const,
      confidence: 85
    });
  }

  // Timeline-based opportunities
  if (timeline.status !== 'on-track') {
    opportunities.push({
      label: 'Optimize milestone planning and resource scheduling for timeline recovery',
      impactLevel: 'Medium' as const,
      effortLevel: 'Medium' as const,
      confidence: 75
    });
  }

  // Maturity-based opportunities
  if (maturityData && maturityData.readinessScore < 70) {
    opportunities.push({
      label: 'Address maturity gaps to enable smoother phase progression',
      impactLevel: 'High' as const,
      effortLevel: 'Low' as const,
      confidence: 80
    });
  }

  // Default opportunity if none identified
  if (opportunities.length === 0) {
    opportunities.push({
      label: 'Continue systematic progression through current maturity phase',
      impactLevel: 'Medium' as const,
      effortLevel: 'Low' as const,
      confidence: 90
    });
  }

  return opportunities;
}

/**
 * Generate strategy next steps
 */
function generateStrategyNextSteps(
  maturity: MaturityPhase,
  progress: ReturnType<typeof calculateOverallProgress>,
  roadmapData: any
) {
  const steps = [];

  // Maturity-specific next steps
  const maturitySteps = {
    crawl: [
      {
        label: 'Complete foundational setup and baseline measurement establishment',
        ownerHint: 'Strategy Team',
        timeframeHint: 'Next 2 weeks'
      },
      {
        label: 'Validate initial roadmap milestones and resource allocation',
        ownerHint: 'Project Manager',
        timeframeHint: 'Next week'
      }
    ],
    walk: [
      {
        label: 'Optimize current processes and address identified capability gaps',
        ownerHint: 'Operations Team',
        timeframeHint: 'Next 3 weeks'
      },
      {
        label: 'Prepare advancement criteria assessment for RUN phase transition',
        ownerHint: 'Strategy Team',
        timeframeHint: 'Next month'
      }
    ],
    run: [
      {
        label: 'Implement advanced optimization strategies and performance tuning',
        ownerHint: 'Strategy Team',
        timeframeHint: 'Next 2 weeks'
      },
      {
        label: 'Establish scaling criteria and FLY phase readiness assessment',
        ownerHint: 'Leadership Team',
        timeframeHint: 'Next 6 weeks'
      }
    ],
    fly: [
      {
        label: 'Deploy innovation initiatives and scale successful patterns',
        ownerHint: 'Innovation Team',
        timeframeHint: 'Ongoing'
      },
      {
        label: 'Share learnings and best practices across organization',
        ownerHint: 'Strategy Team',
        timeframeHint: 'Next month'
      }
    ]
  };

  steps.push(...maturitySteps[maturity]);

  // Progress-based steps
  if (progress.percentage < 75) {
    steps.push({
      label: 'Review and accelerate current phase milestone completion',
      ownerHint: 'Project Manager',
      timeframeHint: 'This week'
    });
  }

  return steps;
}

/**
 * Main Strategy Plans Widget Component
 */
export function StrategyPlansWidget({ data, className = '' }: StrategyPlansWidgetProps) {
  // Transform data to Results content model
  const resultsContent = React.useMemo(() => {
    if (!data || Object.keys(data).length === 0) {
      return createDefaultResultsContent('strategy', 'Strategic Planning Performance');
    }
    return transformStrategyData(data);
  }, [data]);

  // Language rules validation
  const { validateStrategyMetrics } = useStrategyLanguageRules();

  const metricsValidation = React.useMemo(() => {
    return validateStrategyMetrics(resultsContent.hero.metrics);
  }, [resultsContent.hero.metrics, validateStrategyMetrics]);

  // Custom sections for Strategy-specific content
  const customSections = (
    <div className="space-y-6">
      {/* Roadmap and Maturity Tabs */}
      <Tabs defaultValue="roadmap" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="roadmap">Roadmap Timeline</TabsTrigger>
          <TabsTrigger value="maturity">Maturity Assessment</TabsTrigger>
        </TabsList>

        <TabsContent value="roadmap">
          {data.roadmapData ? (
            <RoadmapTimeline roadmapData={data.roadmapData} />
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-gray-600">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="font-medium mb-2">Roadmap In Development</h3>
                <p className="text-sm">
                  Roadmap milestones and timeline data will appear here as strategic planning progresses.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="maturity">
          {data.maturityData ? (
            <MaturityScoreCard maturityData={data.maturityData} />
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-gray-600">
                <Target className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="font-medium mb-2">Maturity Assessment In Progress</h3>
                <p className="text-sm">
                  Maturity scoring and phase assessment will display here as evaluation completes.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );

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