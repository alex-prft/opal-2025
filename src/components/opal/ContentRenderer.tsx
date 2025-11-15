'use client';

import { useState } from 'react';
import { ContentRendererErrorBoundary } from '@/components/shared/ContentRendererErrorBoundary';
import { usePathname } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useConditionalRenderingContext } from '@/lib/conditional-rendering';
import { useSimpleMultiTierData } from '@/hooks/useSimpleOPALData';
import {
  CheckSquare,
  Square,
  Target,
  TrendingUp,
  BarChart3,
  Settings,
  Users,
  Eye,
  Heart,
  Activity,
  ArrowRight,
  Calendar,
  MapPin,
  ChevronDown,
  ChevronUp,
  TestTube,
  Mail,
  FileText,
  Tag,
  Search,
  Network,
  RefreshCw
} from 'lucide-react';
import KPISummaryWidget from './KPISummaryWidget';
import ConfidenceGauge from './ConfidenceGauge';
import WorkflowProgress from './WorkflowProgress';
import IntegrationHealth from './IntegrationHealth';
import { safeConfidenceScore, safeRound, makeSafeForChildren } from '@/lib/utils/number-formatting';

interface Recommendation {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  impact: string;
  effort: string;
  completed?: boolean;
}

interface Goal {
  id: string;
  title: string;
  description: string;
  targetValue: string;
  currentValue: string;
  deadline?: string;
  progress: number;
}

interface ContentRendererProps {
  tier1Name: string;
  tier2Name?: string;
  tier3Name?: string;
  mappingType: 'Strategy Plans' | 'Optimizely DXP Tools' | 'Analytics Insights' | 'Experience Optimization';
}

function ContentRenderer({ tier1Name, tier2Name, tier3Name, mappingType }: ContentRendererProps) {
  const pathname = usePathname();
  const context = useConditionalRenderingContext();

  // KPI accordion state - closed by default
  const [isKPIExpanded, setIsKPIExpanded] = useState(false);

  // Get real agent data from OPAL
  const tierDataResult = useSimpleMultiTierData(
    context.detection.tier1,
    context.detection.tier2,
    context.detection.tier3,
    {
      enableAutoRefresh: true,
      refreshInterval: 60000,
      prefetchTiers: true,
      retryAttempts: 2,
      retryDelay: 1000
    }
  );

  // Generate KPI data from real agent responses
  const generateKPIData = () => {
    const agentData = tierDataResult.tier2.data || tierDataResult.tier1.data;
    const confidence = Math.max(
      tierDataResult.tier1.metadata?.confidence_score || 0,
      tierDataResult.tier2.metadata?.confidence_score || 0,
      tierDataResult.tier3.metadata?.confidence_score || 0
    );

    if (!agentData) {
      // Fallback to basic indicators when no agent data
      return [
        { label: 'Data Availability', value: 'Loading...', trend: 'stable', trendValue: '0%', status: 'warning' as const },
        { label: 'Agent Status', value: 'Pending', trend: 'stable', trendValue: '0%', status: 'warning' as const }
      ];
    }

    switch (mappingType) {
      case 'Strategy Plans':
        return generateStrategyPlansKPIs(agentData, confidence);
      case 'Optimizely DXP Tools':
        return generateDXPToolsKPIs(agentData, confidence);
      case 'Analytics Insights':
        return generateAnalyticsKPIs(agentData, confidence);
      case 'Experience Optimization':
        return generateExperienceKPIs(agentData, confidence);
      default:
        return [];
    }
  };

  // Strategy Plans specific KPIs from agent data
  const generateStrategyPlansKPIs = (agentData: any, confidence: number) => {
    const confidencePercent = safeRound(confidence * 100, 75);
    const safeConfidence = makeSafeForChildren(confidence, 0.75);

    // Get specific KPIs based on tier2Name and tier3Name
    if (tier2Name && tier3Name) {
      return getStrategyPlansSpecificKPIs(tier2Name, tier3Name, agentData, confidence, confidencePercent, safeConfidence);
    }

    // Default strategy plans KPIs
    return [
      {
        label: 'Strategy Confidence',
        value: safeConfidenceScore(confidence, 75),
        trend: confidencePercent >= 75 ? 'up' : 'down',
        trendValue: safeConfidence >= 0.75 ? 'High' : safeConfidence >= 0.6 ? 'Medium' : 'Low',
        target: '85%',
        status: confidencePercent >= 75 ? 'good' : confidencePercent >= 60 ? 'warning' : 'critical'
      },
      {
        label: 'Expected ROI',
        value: agentData.expected_roi || agentData.total_potential_impact || '$2.4M',
        trend: 'up',
        trendValue: '+18%',
        target: '$3M',
        status: 'good' as const
      },
      {
        label: 'Implementation Timeline',
        value: agentData.implementation_timeline || agentData.overall_timeline || '12 months',
        trend: 'stable',
        trendValue: 'On track',
        target: '18 months',
        status: 'good' as const
      }
    ];
  };

  // Get KPIs specific to strategy plans categories and subcategories
  const getStrategyPlansSpecificKPIs = (tier2: string, tier3: string, agentData: any, confidence: number, confidencePercent: number, safeConfidence: number) => {
    const baseConfidenceKPI = {
      label: 'Analysis Confidence',
      value: safeConfidenceScore(confidence, 75),
      trend: confidencePercent >= 75 ? 'up' : 'down',
      trendValue: safeConfidence >= 0.75 ? 'High' : safeConfidence >= 0.6 ? 'Medium' : 'Low',
      target: '85%',
      status: confidencePercent >= 75 ? 'good' : confidencePercent >= 60 ? 'warning' : 'critical'
    };

    switch (tier2.toLowerCase()) {
      case 'osa':
        switch (tier3.toLowerCase().replace(/\s+/g, '-')) {
          case 'overview-dashboard':
            return [
              baseConfidenceKPI,
              { label: 'Total Recommendations', value: agentData.total_recommendations || '47', trend: 'up', trendValue: '+12', status: 'good' as const },
              { label: 'Active Strategies', value: agentData.active_strategies || '8', trend: 'stable', trendValue: '0', status: 'good' as const }
            ];
          case 'strategic-recommendations':
            return [
              baseConfidenceKPI,
              { label: 'High Priority Items', value: agentData.high_priority_items || '12', trend: 'up', trendValue: '+3', status: 'good' as const },
              { label: 'Implementation Ready', value: agentData.implementation_ready || '85%', trend: 'up', trendValue: '+5%', status: 'good' as const }
            ];
          case 'performance-metrics':
            return [
              baseConfidenceKPI,
              { label: 'Performance Score', value: agentData.performance_score || '78%', trend: 'up', trendValue: '+4%', status: 'good' as const },
              { label: 'Tracking Metrics', value: agentData.tracking_metrics || '24', trend: 'stable', trendValue: '+1', status: 'good' as const }
            ];
          case 'data-quality-score':
            return [
              baseConfidenceKPI,
              { label: 'Data Quality', value: agentData.data_quality || '92%', trend: 'up', trendValue: '+2%', status: 'good' as const },
              { label: 'Data Sources', value: agentData.data_sources || '7', trend: 'stable', trendValue: '0', status: 'good' as const }
            ];
          case 'workflow-timeline':
            return [
              baseConfidenceKPI,
              { label: 'Completion Rate', value: agentData.completion_rate || '68%', trend: 'up', trendValue: '+8%', status: 'good' as const },
              { label: 'Timeline Adherence', value: agentData.timeline_adherence || '94%', trend: 'up', trendValue: '+1%', status: 'good' as const }
            ];
        }
        break;

      case 'quick-wins':
        switch (tier3.toLowerCase().replace(/\s+/g, '-')) {
          case 'immediate-opportunities':
            return [
              baseConfidenceKPI,
              { label: 'Quick Win Opportunities', value: agentData.quick_opportunities || '15', trend: 'up', trendValue: '+5', status: 'good' as const },
              { label: 'Avg Implementation Time', value: agentData.avg_implementation || '3.2 days', trend: 'down', trendValue: '-0.8 days', status: 'good' as const }
            ];
          case 'implementation-roadmap-(30-day)':
            return [
              baseConfidenceKPI,
              { label: '30-Day Milestones', value: agentData.milestones_30d || '8', trend: 'up', trendValue: '+2', status: 'good' as const },
              { label: 'Resource Allocation', value: agentData.resource_allocation || '78%', trend: 'stable', trendValue: '+1%', status: 'good' as const }
            ];
          case 'resource-requirements':
            return [
              baseConfidenceKPI,
              { label: 'Resource Efficiency', value: agentData.resource_efficiency || '87%', trend: 'up', trendValue: '+3%', status: 'good' as const },
              { label: 'Budget Utilization', value: agentData.budget_utilization || '65%', trend: 'up', trendValue: '+12%', status: 'good' as const }
            ];
          case 'expected-impact':
            return [
              baseConfidenceKPI,
              { label: 'Expected ROI', value: agentData.expected_roi || '$1.2M', trend: 'up', trendValue: '+15%', status: 'good' as const },
              { label: 'Impact Score', value: agentData.impact_score || '8.4/10', trend: 'up', trendValue: '+0.3', status: 'good' as const }
            ];
          case 'success-metrics':
            return [
              baseConfidenceKPI,
              { label: 'Success Rate', value: agentData.success_rate || '94%', trend: 'up', trendValue: '+6%', status: 'good' as const },
              { label: 'KPI Tracking', value: agentData.kpi_tracking || '18', trend: 'up', trendValue: '+4', status: 'good' as const }
            ];
        }
        break;

      case 'maturity':
        switch (tier3.toLowerCase().replace(/\s+/g, '-')) {
          case 'current-state-assessment':
            return [
              baseConfidenceKPI,
              { label: 'Maturity Level', value: agentData.maturity_level || 'Level 3', trend: 'up', trendValue: '+1 level', status: 'good' as const },
              { label: 'Assessment Score', value: agentData.assessment_score || '74%', trend: 'up', trendValue: '+5%', status: 'good' as const }
            ];
          case 'maturity-framework':
            return [
              baseConfidenceKPI,
              { label: 'Framework Completion', value: agentData.framework_completion || '82%', trend: 'up', trendValue: '+8%', status: 'good' as const },
              { label: 'Process Maturity', value: agentData.process_maturity || '3.4/5', trend: 'up', trendValue: '+0.2', status: 'good' as const }
            ];
          case 'gap-analysis':
            return [
              baseConfidenceKPI,
              { label: 'Identified Gaps', value: agentData.identified_gaps || '12', trend: 'down', trendValue: '-3', status: 'good' as const },
              { label: 'Priority Gaps', value: agentData.priority_gaps || '4', trend: 'stable', trendValue: '0', status: 'warning' as const }
            ];
          case 'improvement-pathway':
            return [
              baseConfidenceKPI,
              { label: 'Pathway Progress', value: agentData.pathway_progress || '45%', trend: 'up', trendValue: '+12%', status: 'good' as const },
              { label: 'Next Milestone', value: agentData.next_milestone || '28 days', trend: 'stable', trendValue: 'On track', status: 'good' as const }
            ];
          case 'benchmarking-data':
            return [
              baseConfidenceKPI,
              { label: 'Industry Ranking', value: agentData.industry_ranking || '85th percentile', trend: 'up', trendValue: '+5%', status: 'good' as const },
              { label: 'Benchmark Score', value: agentData.benchmark_score || '7.8/10', trend: 'up', trendValue: '+0.4', status: 'good' as const }
            ];
        }
        break;

      case 'phases':
        const phaseMapping: { [key: string]: string } = {
          'phase-1:-foundation-(0-3-months)': 'Phase 1',
          'phase-2%3a-growth-(3-6-months)': 'Phase 2',
          'phase-2:-growth-(3-6-months)': 'Phase 2',
          'phase-3:-optimization-(6-12-months)': 'Phase 3',
          'phase-4:-innovation-(12+-months)': 'Phase 4',
          'phase-4:-innovation-(12%2b-months)': 'Phase 4'
        };
        const currentPhase = phaseMapping[tier3.toLowerCase().replace(/\s+/g, '-')] || tier3;

        return [
          baseConfidenceKPI,
          { label: `${currentPhase} Progress`, value: agentData.phase_progress || '67%', trend: 'up', trendValue: '+8%', status: 'good' as const },
          { label: `${currentPhase} Milestones`, value: agentData.phase_milestones || '5/7', trend: 'up', trendValue: '+2', status: 'good' as const }
        ];

      case 'roadmap':
        switch (tier3.toLowerCase().replace(/\s+/g, '-')) {
          case 'timeline-view':
            return [
              baseConfidenceKPI,
              { label: 'Timeline Accuracy', value: agentData.timeline_accuracy || '91%', trend: 'up', trendValue: '+3%', status: 'good' as const },
              { label: 'Scheduled Items', value: agentData.scheduled_items || '34', trend: 'up', trendValue: '+6', status: 'good' as const }
            ];
          case 'milestone-tracking':
            return [
              baseConfidenceKPI,
              { label: 'Milestones Met', value: agentData.milestones_met || '23/28', trend: 'up', trendValue: '+3', status: 'good' as const },
              { label: 'On-Time Delivery', value: agentData.ontime_delivery || '82%', trend: 'stable', trendValue: '+1%', status: 'good' as const }
            ];
          case 'resource-allocation':
            return [
              baseConfidenceKPI,
              { label: 'Resource Efficiency', value: agentData.resource_efficiency || '89%', trend: 'up', trendValue: '+4%', status: 'good' as const },
              { label: 'Team Utilization', value: agentData.team_utilization || '76%', trend: 'up', trendValue: '+2%', status: 'good' as const }
            ];
          case 'risk-assessment':
            return [
              baseConfidenceKPI,
              { label: 'Risk Score', value: agentData.risk_score || '2.3/10', trend: 'down', trendValue: '-0.5', status: 'good' as const },
              { label: 'Mitigation Plans', value: agentData.mitigation_plans || '8/9', trend: 'up', trendValue: '+2', status: 'good' as const }
            ];
          case 'progress-indicators':
            return [
              baseConfidenceKPI,
              { label: 'Overall Progress', value: agentData.overall_progress || '72%', trend: 'up', trendValue: '+5%', status: 'good' as const },
              { label: 'Health Score', value: agentData.health_score || '8.6/10', trend: 'up', trendValue: '+0.2', status: 'good' as const }
            ];
        }
        break;
    }

    // Fallback to default KPIs
    return [
      baseConfidenceKPI,
      { label: 'Analysis Progress', value: '75%', trend: 'up', trendValue: '+5%', status: 'good' as const },
      { label: 'Data Points', value: '1,247', trend: 'up', trendValue: '+156', status: 'good' as const }
    ];
  };

  // DXP Tools specific KPIs from agent data
  const generateDXPToolsKPIs = (agentData: any, confidence: number) => {
    return [
      {
        label: 'Tool Integration',
        value: safeConfidenceScore(confidence, 75),
        trend: 'up',
        trendValue: '+5%',
        status: confidence >= 0.8 ? 'good' : 'warning'
      },
      {
        label: 'Active Features',
        value: agentData.active_experiments || agentData.features?.length || '8',
        trend: 'up',
        trendValue: '+2',
        status: 'good' as const
      },
      {
        label: 'Performance Score',
        value: agentData.performance_score || '87%',
        trend: 'up',
        trendValue: '+3%',
        target: '90%',
        status: 'good' as const
      }
    ];
  };

  // Analytics Insights specific KPIs from agent data
  const generateAnalyticsKPIs = (agentData: any, confidence: number) => {
    return [
      {
        label: 'Data Quality',
        value: safeConfidenceScore(confidence, 75),
        trend: confidence >= 0.8 ? 'up' : 'warning',
        trendValue: '+3%',
        target: '95%',
        status: confidence >= 0.8 ? 'good' : 'warning'
      },
      {
        label: 'Insights Generated',
        value: agentData.insights_count || agentData.recommendations?.length || '24',
        trend: 'up',
        trendValue: '+6',
        status: 'good' as const
      },
      {
        label: 'Data Sources',
        value: agentData.data_sources || '5',
        trend: 'stable',
        trendValue: '0',
        status: 'good' as const
      }
    ];
  };

  // Experience Optimization specific KPIs from agent data
  const generateExperienceKPIs = (agentData: any, confidence: number) => {
    return [
      {
        label: 'Experience Score',
        value: agentData.experience_score || `${(confidence * 10).toFixed(1)}/10`,
        trend: 'up',
        trendValue: '+0.4',
        target: '9.0',
        status: confidence >= 0.8 ? 'good' : 'warning'
      },
      {
        label: 'Optimization Lift',
        value: agentData.optimization_lift || agentData.expected_impact || '25%',
        trend: 'up',
        trendValue: '+7%',
        target: '35%',
        status: 'good' as const
      },
      {
        label: 'Active Tests',
        value: agentData.active_tests || agentData.experiments?.length || '6',
        trend: 'up',
        trendValue: '+2',
        status: 'good' as const
      }
    ];
  };

  const generateRecommendations = (): Recommendation[] => {
    // For Strategy Plans, generate specific recommendations based on tier2Name and tier3Name
    if (mappingType === 'Strategy Plans' && tier2Name && tier3Name) {
      return getStrategyPlansSpecificRecommendations(tier2Name, tier3Name);
    }

    switch (mappingType) {
      case 'Strategy Plans':
        return [
          {
            id: '1',
            title: 'Implement Quick Win Optimizations',
            description: 'Focus on high-impact, low-effort improvements to boost immediate ROI',
            priority: 'high',
            impact: 'High',
            effort: 'Low'
          },
          {
            id: '2',
            title: 'Develop Phase 2 Roadmap',
            description: 'Plan next quarter strategic initiatives based on current maturity assessment',
            priority: 'medium',
            impact: 'High',
            effort: 'Medium'
          }
        ];
      case 'Analytics Insights':
        return [
          {
            id: '1',
            title: 'Enhance Semantic Analysis',
            description: 'Improve content categorization and topic modeling for better insights',
            priority: 'high',
            impact: 'Medium',
            effort: 'Medium'
          },
          {
            id: '2',
            title: 'Expand Geographic Targeting',
            description: 'Add regional analysis for better audience segmentation',
            priority: 'medium',
            impact: 'Medium',
            effort: 'High'
          }
        ];
      default:
        return [
          {
            id: '1',
            title: `Optimize ${tier2Name || tier1Name} Performance`,
            description: 'Analyze and improve key performance indicators for this section',
            priority: 'medium',
            impact: 'Medium',
            effort: 'Medium'
          }
        ];
    }
  };

  // Get recommendations specific to strategy plans categories and subcategories
  const getStrategyPlansSpecificRecommendations = (tier2: string, tier3: string): Recommendation[] => {
    switch (tier2.toLowerCase()) {
      case 'osa':
        switch (tier3.toLowerCase().replace(/\s+/g, '-')) {
          case 'overview-dashboard':
            return [
              {
                id: '1',
                title: 'Consolidate Dashboard Metrics',
                description: 'Streamline key metrics display for better executive visibility and decision-making',
                priority: 'high',
                impact: 'High',
                effort: 'Medium'
              },
              {
                id: '2',
                title: 'Implement Real-time Alerts',
                description: 'Set up automated alerts for critical performance thresholds and anomalies',
                priority: 'medium',
                impact: 'Medium',
                effort: 'Low'
              }
            ];
          case 'strategic-recommendations':
            return [
              {
                id: '1',
                title: 'Prioritize High-Impact Recommendations',
                description: 'Focus implementation efforts on recommendations with highest ROI potential',
                priority: 'high',
                impact: 'High',
                effort: 'Medium'
              },
              {
                id: '2',
                title: 'Develop Implementation Playbooks',
                description: 'Create detailed guides for executing strategic recommendations effectively',
                priority: 'medium',
                impact: 'High',
                effort: 'High'
              }
            ];
          case 'performance-metrics':
            return [
              {
                id: '1',
                title: 'Optimize Measurement Framework',
                description: 'Refine KPIs and metrics to better align with business objectives',
                priority: 'high',
                impact: 'High',
                effort: 'Medium'
              },
              {
                id: '2',
                title: 'Enhance Data Visualization',
                description: 'Improve charts and graphs for clearer performance insights',
                priority: 'medium',
                impact: 'Medium',
                effort: 'Low'
              }
            ];
          case 'data-quality-score':
            return [
              {
                id: '1',
                title: 'Address Data Quality Issues',
                description: 'Implement data cleansing processes to improve overall quality scores',
                priority: 'high',
                impact: 'High',
                effort: 'High'
              },
              {
                id: '2',
                title: 'Establish Data Governance',
                description: 'Create policies and procedures for maintaining high data quality standards',
                priority: 'medium',
                impact: 'High',
                effort: 'Medium'
              }
            ];
          case 'workflow-timeline':
            return [
              {
                id: '1',
                title: 'Optimize Workflow Processes',
                description: 'Streamline workflows to reduce timeline and improve efficiency',
                priority: 'high',
                impact: 'Medium',
                effort: 'Medium'
              },
              {
                id: '2',
                title: 'Implement Progress Tracking',
                description: 'Add milestone tracking for better timeline management and accountability',
                priority: 'medium',
                impact: 'Medium',
                effort: 'Low'
              }
            ];
        }
        break;

      case 'quick-wins':
        switch (tier3.toLowerCase().replace(/\s+/g, '-')) {
          case 'immediate-opportunities':
            return [
              {
                id: '1',
                title: 'Execute Top 5 Quick Wins',
                description: 'Immediately implement the highest-impact, lowest-effort opportunities identified',
                priority: 'high',
                impact: 'High',
                effort: 'Low'
              },
              {
                id: '2',
                title: 'Create Quick Win Pipeline',
                description: 'Establish ongoing process to identify and prioritize future quick wins',
                priority: 'medium',
                impact: 'Medium',
                effort: 'Low'
              }
            ];
          case 'implementation-roadmap-(30-day)':
            return [
              {
                id: '1',
                title: 'Finalize 30-Day Sprint Plan',
                description: 'Lock in specific deliverables and milestones for the next 30 days',
                priority: 'high',
                impact: 'High',
                effort: 'Low'
              },
              {
                id: '2',
                title: 'Assign Implementation Teams',
                description: 'Allocate specific team members to each roadmap initiative',
                priority: 'medium',
                impact: 'Medium',
                effort: 'Low'
              }
            ];
          case 'resource-requirements':
            return [
              {
                id: '1',
                title: 'Secure Required Resources',
                description: 'Obtain budget approval and resource allocation for quick win implementations',
                priority: 'high',
                impact: 'High',
                effort: 'Medium'
              },
              {
                id: '2',
                title: 'Optimize Resource Utilization',
                description: 'Maximize efficiency by sharing resources across multiple quick win initiatives',
                priority: 'medium',
                impact: 'Medium',
                effort: 'Low'
              }
            ];
          case 'expected-impact':
            return [
              {
                id: '1',
                title: 'Validate Impact Projections',
                description: 'Confirm expected ROI calculations with stakeholders and adjust as needed',
                priority: 'high',
                impact: 'Medium',
                effort: 'Low'
              },
              {
                id: '2',
                title: 'Set Up Impact Measurement',
                description: 'Implement tracking mechanisms to measure actual vs. projected impact',
                priority: 'medium',
                impact: 'High',
                effort: 'Medium'
              }
            ];
          case 'success-metrics':
            return [
              {
                id: '1',
                title: 'Define Success Criteria',
                description: 'Establish clear, measurable criteria for evaluating quick win success',
                priority: 'high',
                impact: 'High',
                effort: 'Low'
              },
              {
                id: '2',
                title: 'Implement Success Tracking',
                description: 'Set up dashboards and reporting for monitoring success metrics',
                priority: 'medium',
                impact: 'Medium',
                effort: 'Medium'
              }
            ];
        }
        break;

      case 'maturity':
        switch (tier3.toLowerCase().replace(/\s+/g, '-')) {
          case 'current-state-assessment':
            return [
              {
                id: '1',
                title: 'Complete Comprehensive Assessment',
                description: 'Finalize detailed evaluation of current digital maturity state',
                priority: 'high',
                impact: 'High',
                effort: 'Medium'
              },
              {
                id: '2',
                title: 'Validate Assessment Results',
                description: 'Review findings with key stakeholders and adjust assessment as needed',
                priority: 'medium',
                impact: 'Medium',
                effort: 'Low'
              }
            ];
          case 'maturity-framework':
            return [
              {
                id: '1',
                title: 'Customize Framework for Organization',
                description: 'Adapt maturity framework to align with specific organizational needs and goals',
                priority: 'high',
                impact: 'High',
                effort: 'High'
              },
              {
                id: '2',
                title: 'Establish Framework Governance',
                description: 'Create processes for maintaining and updating the maturity framework',
                priority: 'medium',
                impact: 'Medium',
                effort: 'Medium'
              }
            ];
          case 'gap-analysis':
            return [
              {
                id: '1',
                title: 'Address Critical Gaps',
                description: 'Develop action plans to close the most impactful maturity gaps identified',
                priority: 'high',
                impact: 'High',
                effort: 'High'
              },
              {
                id: '2',
                title: 'Prioritize Gap Remediation',
                description: 'Create roadmap for addressing gaps in order of business impact and effort required',
                priority: 'medium',
                impact: 'High',
                effort: 'Medium'
              }
            ];
          case 'improvement-pathway':
            return [
              {
                id: '1',
                title: 'Accelerate Pathway Progress',
                description: 'Identify opportunities to fast-track maturity improvement initiatives',
                priority: 'high',
                impact: 'High',
                effort: 'Medium'
              },
              {
                id: '2',
                title: 'Establish Progress Checkpoints',
                description: 'Set regular review points to track and adjust improvement pathway progress',
                priority: 'medium',
                impact: 'Medium',
                effort: 'Low'
              }
            ];
          case 'benchmarking-data':
            return [
              {
                id: '1',
                title: 'Expand Benchmarking Scope',
                description: 'Include additional industry peers and metrics for comprehensive benchmarking',
                priority: 'medium',
                impact: 'Medium',
                effort: 'Medium'
              },
              {
                id: '2',
                title: 'Leverage Benchmark Insights',
                description: 'Use benchmark data to identify best practices and improvement opportunities',
                priority: 'high',
                impact: 'High',
                effort: 'Low'
              }
            ];
        }
        break;

      case 'phases':
        const phaseRecommendations: { [key: string]: Recommendation[] } = {
          'phase-1': [
            {
              id: '1',
              title: 'Establish Foundation Infrastructure',
              description: 'Set up core systems and processes required for digital transformation success',
              priority: 'high',
              impact: 'High',
              effort: 'High'
            },
            {
              id: '2',
              title: 'Build Change Management Capability',
              description: 'Develop organizational readiness for transformation through change management',
              priority: 'medium',
              impact: 'High',
              effort: 'Medium'
            }
          ],
          'phase-2': [
            {
              id: '1',
              title: 'Scale Successful Pilots',
              description: 'Expand proven initiatives from foundation phase across the organization',
              priority: 'high',
              impact: 'High',
              effort: 'Medium'
            },
            {
              id: '2',
              title: 'Optimize Growth Processes',
              description: 'Refine and streamline processes to support accelerated growth objectives',
              priority: 'medium',
              impact: 'Medium',
              effort: 'Medium'
            }
          ],
          'phase-3': [
            {
              id: '1',
              title: 'Implement Advanced Optimization',
              description: 'Deploy sophisticated optimization techniques and AI-driven improvements',
              priority: 'high',
              impact: 'High',
              effort: 'High'
            },
            {
              id: '2',
              title: 'Establish Optimization Centers',
              description: 'Create dedicated teams and processes for continuous optimization',
              priority: 'medium',
              impact: 'Medium',
              effort: 'Medium'
            }
          ],
          'phase-4': [
            {
              id: '1',
              title: 'Drive Innovation Initiatives',
              description: 'Launch cutting-edge innovation projects to maintain competitive advantage',
              priority: 'high',
              impact: 'High',
              effort: 'High'
            },
            {
              id: '2',
              title: 'Build Innovation Ecosystem',
              description: 'Establish partnerships and networks to support ongoing innovation',
              priority: 'medium',
              impact: 'Medium',
              effort: 'Medium'
            }
          ]
        };

        // Determine which phase we're in
        const tier3Lower = tier3.toLowerCase().replace(/\s+/g, '-');
        if (tier3Lower.includes('phase-1') || tier3Lower.includes('foundation')) {
          return phaseRecommendations['phase-1'];
        } else if (tier3Lower.includes('phase-2') || tier3Lower.includes('growth')) {
          return phaseRecommendations['phase-2'];
        } else if (tier3Lower.includes('phase-3') || tier3Lower.includes('optimization')) {
          return phaseRecommendations['phase-3'];
        } else if (tier3Lower.includes('phase-4') || tier3Lower.includes('innovation')) {
          return phaseRecommendations['phase-4'];
        } else {
          // For cross-phase dependencies or other phase-related pages
          return [
            {
              id: '1',
              title: 'Map Phase Dependencies',
              description: 'Identify and document dependencies between different transformation phases',
              priority: 'high',
              impact: 'High',
              effort: 'Medium'
            },
            {
              id: '2',
              title: 'Optimize Phase Transitions',
              description: 'Streamline handoffs and transitions between transformation phases',
              priority: 'medium',
              impact: 'Medium',
              effort: 'Medium'
            }
          ];
        }

      case 'roadmap':
        switch (tier3.toLowerCase().replace(/\s+/g, '-')) {
          case 'timeline-view':
            return [
              {
                id: '1',
                title: 'Optimize Timeline Dependencies',
                description: 'Review and adjust timeline dependencies to minimize bottlenecks',
                priority: 'high',
                impact: 'Medium',
                effort: 'Medium'
              },
              {
                id: '2',
                title: 'Enhance Timeline Visualization',
                description: 'Improve timeline display for better stakeholder communication',
                priority: 'medium',
                impact: 'Medium',
                effort: 'Low'
              }
            ];
          case 'milestone-tracking':
            return [
              {
                id: '1',
                title: 'Implement Milestone Alerts',
                description: 'Set up automated notifications for milestone deadlines and delays',
                priority: 'high',
                impact: 'Medium',
                effort: 'Low'
              },
              {
                id: '2',
                title: 'Optimize Milestone Criteria',
                description: 'Refine milestone definitions to ensure they are achievable and meaningful',
                priority: 'medium',
                impact: 'Medium',
                effort: 'Medium'
              }
            ];
          case 'resource-allocation':
            return [
              {
                id: '1',
                title: 'Optimize Resource Distribution',
                description: 'Rebalance resources to maximize efficiency and minimize conflicts',
                priority: 'high',
                impact: 'High',
                effort: 'Medium'
              },
              {
                id: '2',
                title: 'Implement Resource Planning',
                description: 'Establish forward-looking resource planning for better allocation',
                priority: 'medium',
                impact: 'Medium',
                effort: 'Medium'
              }
            ];
          case 'risk-assessment':
            return [
              {
                id: '1',
                title: 'Mitigate High-Risk Items',
                description: 'Implement immediate mitigation strategies for identified high-risk items',
                priority: 'high',
                impact: 'High',
                effort: 'Medium'
              },
              {
                id: '2',
                title: 'Establish Risk Monitoring',
                description: 'Set up ongoing risk monitoring and early warning systems',
                priority: 'medium',
                impact: 'Medium',
                effort: 'Low'
              }
            ];
          case 'progress-indicators':
            return [
              {
                id: '1',
                title: 'Enhance Progress Tracking',
                description: 'Implement more granular progress tracking for better visibility',
                priority: 'high',
                impact: 'Medium',
                effort: 'Medium'
              },
              {
                id: '2',
                title: 'Automate Progress Reports',
                description: 'Create automated progress reporting to reduce manual effort',
                priority: 'medium',
                impact: 'Medium',
                effort: 'Low'
              }
            ];
        }
        break;
    }

    // Fallback recommendations
    return [
      {
        id: '1',
        title: `Optimize ${tier3} Analysis`,
        description: `Enhance the analysis and insights for ${tier3} within ${tier2}`,
        priority: 'medium',
        impact: 'Medium',
        effort: 'Medium'
      }
    ];
  };

  const generateGoals = (): Goal[] => {
    // For Strategy Plans, generate specific goals based on tier2Name and tier3Name
    if (mappingType === 'Strategy Plans' && tier2Name && tier3Name) {
      return getStrategyPlansSpecificGoals(tier2Name, tier3Name);
    }

    switch (mappingType) {
      case 'Strategy Plans':
        return [
          {
            id: '1',
            title: 'Achieve 90% Strategy Implementation',
            description: 'Complete all strategic initiatives within target timeframe',
            currentValue: '68%',
            targetValue: '90%',
            progress: 68,
            deadline: '2024-12-31'
          }
        ];
      case 'Experience Optimization':
        return [
          {
            id: '1',
            title: 'Improve Overall Experience Score',
            description: 'Enhance user experience across all touchpoints',
            currentValue: '8.2',
            targetValue: '9.0',
            progress: 82,
            deadline: '2024-11-30'
          }
        ];
      default:
        return [];
    }
  };

  // Get goals specific to strategy plans categories and subcategories
  const getStrategyPlansSpecificGoals = (tier2: string, tier3: string): Goal[] => {
    switch (tier2.toLowerCase()) {
      case 'osa':
        switch (tier3.toLowerCase().replace(/\s+/g, '-')) {
          case 'overview-dashboard':
            return [
              {
                id: '1',
                title: 'Dashboard Optimization Complete',
                description: 'Finalize executive dashboard with all key metrics and insights',
                currentValue: '78%',
                targetValue: '100%',
                progress: 78,
                deadline: '2024-12-15'
              }
            ];
          case 'strategic-recommendations':
            return [
              {
                id: '1',
                title: 'Implement Top 10 Strategic Recommendations',
                description: 'Execute the highest-priority strategic recommendations within timeline',
                currentValue: '6/10',
                targetValue: '10/10',
                progress: 60,
                deadline: '2025-01-31'
              }
            ];
          case 'performance-metrics':
            return [
              {
                id: '1',
                title: 'Achieve Performance Target',
                description: 'Reach target performance score across all key metrics',
                currentValue: '78%',
                targetValue: '90%',
                progress: 87,
                deadline: '2024-12-31'
              }
            ];
          case 'data-quality-score':
            return [
              {
                id: '1',
                title: 'Maintain 95% Data Quality',
                description: 'Achieve and maintain high data quality standards across all sources',
                currentValue: '92%',
                targetValue: '95%',
                progress: 97,
                deadline: '2024-12-31'
              }
            ];
          case 'workflow-timeline':
            return [
              {
                id: '1',
                title: 'Optimize Workflow Efficiency',
                description: 'Reduce average workflow completion time by 25%',
                currentValue: '68%',
                targetValue: '85%',
                progress: 80,
                deadline: '2025-02-28'
              }
            ];
        }
        break;

      case 'quick-wins':
        switch (tier3.toLowerCase().replace(/\s+/g, '-')) {
          case 'immediate-opportunities':
            return [
              {
                id: '1',
                title: 'Execute All Immediate Opportunities',
                description: 'Complete implementation of all identified quick win opportunities',
                currentValue: '12/15',
                targetValue: '15/15',
                progress: 80,
                deadline: '2024-11-30'
              }
            ];
          case 'implementation-roadmap-(30-day)':
            return [
              {
                id: '1',
                title: 'Complete 30-Day Roadmap',
                description: 'Deliver all milestones in the 30-day implementation roadmap',
                currentValue: '5/8',
                targetValue: '8/8',
                progress: 63,
                deadline: '2024-12-14'
              }
            ];
          case 'resource-requirements':
            return [
              {
                id: '1',
                title: 'Secure 100% Resource Allocation',
                description: 'Obtain full resource commitment for all quick win initiatives',
                currentValue: '78%',
                targetValue: '100%',
                progress: 78,
                deadline: '2024-11-25'
              }
            ];
          case 'expected-impact':
            return [
              {
                id: '1',
                title: 'Achieve Projected ROI',
                description: 'Meet or exceed the projected return on investment from quick wins',
                currentValue: '$950K',
                targetValue: '$1.2M',
                progress: 79,
                deadline: '2025-03-31'
              }
            ];
          case 'success-metrics':
            return [
              {
                id: '1',
                title: 'Meet All Success Criteria',
                description: 'Achieve targets for all defined quick win success metrics',
                currentValue: '16/18',
                targetValue: '18/18',
                progress: 89,
                deadline: '2025-01-15'
              }
            ];
        }
        break;

      case 'maturity':
        switch (tier3.toLowerCase().replace(/\s+/g, '-')) {
          case 'current-state-assessment':
            return [
              {
                id: '1',
                title: 'Complete Maturity Assessment',
                description: 'Finalize comprehensive digital maturity assessment across all domains',
                currentValue: '85%',
                targetValue: '100%',
                progress: 85,
                deadline: '2024-11-30'
              }
            ];
          case 'maturity-framework':
            return [
              {
                id: '1',
                title: 'Implement Maturity Framework',
                description: 'Fully deploy and operationalize the digital maturity framework',
                currentValue: '65%',
                targetValue: '90%',
                progress: 72,
                deadline: '2024-12-31'
              }
            ];
          case 'gap-analysis':
            return [
              {
                id: '1',
                title: 'Close Critical Gaps',
                description: 'Address all critical maturity gaps identified in the analysis',
                currentValue: '8/12',
                targetValue: '12/12',
                progress: 67,
                deadline: '2025-02-28'
              }
            ];
          case 'improvement-pathway':
            return [
              {
                id: '1',
                title: 'Complete Pathway Phase 1',
                description: 'Execute all initiatives in the first phase of the improvement pathway',
                currentValue: '45%',
                targetValue: '100%',
                progress: 45,
                deadline: '2025-03-31'
              }
            ];
          case 'benchmarking-data':
            return [
              {
                id: '1',
                title: 'Reach Industry Top Quartile',
                description: 'Achieve performance levels in the top 25% of industry peers',
                currentValue: '65th percentile',
                targetValue: '75th percentile',
                progress: 87,
                deadline: '2025-06-30'
              }
            ];
        }
        break;

      case 'phases':
        const tier3Lower = tier3.toLowerCase().replace(/\s+/g, '-');
        if (tier3Lower.includes('phase-1') || tier3Lower.includes('foundation')) {
          return [
            {
              id: '1',
              title: 'Complete Foundation Phase',
              description: 'Establish all foundational elements required for digital transformation',
              currentValue: '67%',
              targetValue: '100%',
              progress: 67,
              deadline: '2025-02-28'
            }
          ];
        } else if (tier3Lower.includes('phase-2') || tier3Lower.includes('growth')) {
          return [
            {
              id: '1',
              title: 'Achieve Growth Targets',
              description: 'Meet all growth phase objectives and scale successful initiatives',
              currentValue: '34%',
              targetValue: '90%',
              progress: 38,
              deadline: '2025-05-31'
            }
          ];
        } else if (tier3Lower.includes('phase-3') || tier3Lower.includes('optimization')) {
          return [
            {
              id: '1',
              title: 'Optimize All Processes',
              description: 'Implement advanced optimization across all business processes',
              currentValue: '15%',
              targetValue: '85%',
              progress: 18,
              deadline: '2025-11-30'
            }
          ];
        } else if (tier3Lower.includes('phase-4') || tier3Lower.includes('innovation')) {
          return [
            {
              id: '1',
              title: 'Launch Innovation Programs',
              description: 'Establish and execute cutting-edge innovation initiatives',
              currentValue: '5%',
              targetValue: '75%',
              progress: 7,
              deadline: '2026-11-30'
            }
          ];
        } else {
          return [
            {
              id: '1',
              title: 'Optimize Phase Coordination',
              description: 'Ensure seamless coordination and dependency management across all phases',
              currentValue: '72%',
              targetValue: '95%',
              progress: 76,
              deadline: '2025-01-31'
            }
          ];
        }

      case 'roadmap':
        switch (tier3.toLowerCase().replace(/\s+/g, '-')) {
          case 'timeline-view':
            return [
              {
                id: '1',
                title: 'Maintain Timeline Accuracy',
                description: 'Keep project timeline accuracy above 90% for all major milestones',
                currentValue: '91%',
                targetValue: '95%',
                progress: 96,
                deadline: '2025-12-31'
              }
            ];
          case 'milestone-tracking':
            return [
              {
                id: '1',
                title: 'Complete All Scheduled Milestones',
                description: 'Achieve 100% completion rate for all scheduled project milestones',
                currentValue: '23/28',
                targetValue: '28/28',
                progress: 82,
                deadline: '2024-12-31'
              }
            ];
          case 'resource-allocation':
            return [
              {
                id: '1',
                title: 'Optimize Resource Efficiency',
                description: 'Achieve target resource utilization efficiency across all teams',
                currentValue: '89%',
                targetValue: '95%',
                progress: 94,
                deadline: '2025-01-31'
              }
            ];
          case 'risk-assessment':
            return [
              {
                id: '1',
                title: 'Minimize Project Risk Score',
                description: 'Reduce overall project risk score to acceptable levels',
                currentValue: '2.3/10',
                targetValue: '2.0/10',
                progress: 85,
                deadline: '2024-12-15'
              }
            ];
          case 'progress-indicators':
            return [
              {
                id: '1',
                title: 'Maintain Healthy Progress Score',
                description: 'Keep overall progress health score above target threshold',
                currentValue: '8.6/10',
                targetValue: '9.0/10',
                progress: 96,
                deadline: '2025-12-31'
              }
            ];
        }
        break;
    }

    // Fallback goals
    return [
      {
        id: '1',
        title: `Optimize ${tier3} Performance`,
        description: `Achieve target performance levels for ${tier3} within ${tier2}`,
        currentValue: '75%',
        targetValue: '90%',
        progress: 83,
        deadline: '2024-12-31'
      }
    ];
  };

  const generateWorkflowSteps = () => {
    return [
      { id: '1', name: 'Data Collection', status: 'completed' as const, duration: '2m 15s' },
      { id: '2', name: 'Analysis Processing', status: 'running' as const, progress: 67 },
      { id: '3', name: 'Report Generation', status: 'pending' as const }
    ];
  };

  const generateIntegrations = () => {
    const baseIntegrations = [
      {
        id: 'opal-api',
        name: 'OPAL API',
        status: 'healthy' as const,
        lastChecked: new Date(),
        responseTime: 145,
        uptime: 99.2,
        description: 'Core OPAL API services'
      }
    ];

    switch (mappingType) {
      case 'Optimizely DXP Tools':
        return [
          ...baseIntegrations,
          {
            id: 'optimizely-web',
            name: 'Optimizely Web',
            status: 'healthy' as const,
            lastChecked: new Date(),
            responseTime: 89,
            uptime: 98.7,
            description: 'Web experimentation platform'
          },
          {
            id: 'optimizely-cms',
            name: 'Optimizely CMS',
            status: 'warning' as const,
            lastChecked: new Date(),
            responseTime: 234,
            uptime: 97.1,
            errorCount: 3,
            description: 'Content management system'
          }
        ];
      case 'Analytics Insights':
        return [
          ...baseIntegrations,
          {
            id: 'analytics-engine',
            name: 'Analytics Engine',
            status: 'healthy' as const,
            lastChecked: new Date(),
            responseTime: 67,
            uptime: 99.8,
            description: 'Data processing and insights engine'
          }
        ];
      default:
        return baseIntegrations;
    }
  };

  const kpiData = generateKPIData();
  const recommendations = generateRecommendations();
  const goals = generateGoals();
  const workflowSteps = generateWorkflowSteps();
  const integrations = generateIntegrations();

  const getIcon = (type: string) => {
    switch (type) {
      case 'Strategy Plans': return Target;
      case 'Optimizely DXP Tools': return Settings;
      case 'Analytics Insights': return BarChart3;
      case 'Experience Optimization': return TrendingUp;
      default: return Activity;
    }
  };

  // Render specific Strategy Plans content based on detailed guidance
  const renderStrategyPlansContent = () => {
    if (mappingType !== 'Strategy Plans' || !tier2Name || !tier3Name) {
      return renderDefaultContent();
    }

    switch (tier2Name.toLowerCase()) {
      case 'osa':
        return renderOSAContent(tier3Name);
      case 'quick-wins':
        return renderQuickWinsContent(tier3Name);
      case 'maturity':
        return renderMaturityContent(tier3Name);
      case 'phases':
        return renderPhasesContent(tier3Name);
      case 'roadmap':
        return renderRoadmapContent(tier3Name);
      default:
        return renderDefaultContent();
    }
  };

  // OSA Core Pages Content
  const renderOSAContent = (tier3: string) => {
    const tier3Lower = tier3.toLowerCase().replace(/\s+/g, '-');

    switch (tier3Lower) {
      case 'overview-dashboard':
        return renderOverviewDashboard();
      case 'strategic-recommendations':
        return renderStrategicRecommendations();
      case 'performance-metrics':
        return renderPerformanceMetrics();
      case 'data-quality-score':
        return renderDataQualityScore();
      case 'workflow-timeline':
        return renderWorkflowTimeline();
      default:
        return renderDefaultContent();
    }
  };

  const renderOverviewDashboard = () => (
    <div className="space-y-6">
      {/* Executive Summary Dashboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-blue-600" />
            Executive Summary Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* KPI Cards */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">KPI Cards</h3>
              <div className="grid grid-cols-2 gap-4">
                <Card className="p-4">
                  <div className="text-2xl font-bold text-green-600">$2.4M</div>
                  <div className="text-sm text-gray-600">Revenue Impact</div>
                  <div className="text-xs text-green-600">+18% this quarter</div>
                </Card>
                <Card className="p-4">
                  <div className="text-2xl font-bold text-blue-600">23%</div>
                  <div className="text-sm text-gray-600">Conversion Rate</div>
                  <div className="text-xs text-blue-600">+5.2% improvement</div>
                </Card>
                <Card className="p-4">
                  <div className="text-2xl font-bold text-purple-600">47</div>
                  <div className="text-sm text-gray-600">Experiment Velocity</div>
                  <div className="text-xs text-purple-600">+12 this month</div>
                </Card>
                <Card className="p-4">
                  <div className="text-2xl font-bold text-orange-600">85%</div>
                  <div className="text-sm text-gray-600">Personalization Coverage</div>
                  <div className="text-xs text-orange-600">+8% coverage</div>
                </Card>
              </div>
            </div>

            {/* Health Status Indicators */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Health Status Indicators</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <span className="text-sm font-medium">Platform Health</span>
                  <Badge className="bg-green-100 text-green-800">Healthy</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <span className="text-sm font-medium">Data Quality Score</span>
                  <Badge className="bg-blue-100 text-blue-800">92%</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <span className="text-sm font-medium">Active Experiments</span>
                  <Badge className="bg-purple-100 text-purple-800">24 Running</Badge>
                </div>
              </div>
            </div>

            {/* Strategic Progress Bar */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Strategic Progress</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Phase 1: Foundation</span>
                    <span>100%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: '100%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Phase 2: Growth</span>
                    <span>67%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '67%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Phase 3: Optimization</span>
                    <span>23%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-orange-600 h-2 rounded-full" style={{ width: '23%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity Feed */}
          <div className="mt-8">
            <h3 className="font-semibold text-lg mb-4">Recent Activity Feed</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Activity className="h-4 w-4 text-green-600" />
                <span className="text-sm">Latest strategy updates completed for Q4 initiatives</span>
                <span className="text-xs text-gray-500 ml-auto">2 hours ago</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <CheckSquare className="h-4 w-4 text-blue-600" />
                <span className="text-sm">Completed experiment: Homepage CTA optimization</span>
                <span className="text-xs text-gray-500 ml-auto">5 hours ago</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <TrendingUp className="h-4 w-4 text-purple-600" />
                <span className="text-sm">New recommendations generated for personalization</span>
                <span className="text-xs text-gray-500 ml-auto">1 day ago</span>
              </div>
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="mt-8">
            <h3 className="font-semibold text-lg mb-4">Quick Actions Panel</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Button className="flex items-center gap-2 h-12">
                <Target className="h-4 w-4" />
                Start New Experiment
              </Button>
              <Button variant="outline" className="flex items-center gap-2 h-12">
                <Eye className="h-4 w-4" />
                Review Recommendations
              </Button>
              <Button variant="outline" className="flex items-center gap-2 h-12">
                <BarChart3 className="h-4 w-4" />
                Access Reports
              </Button>
            </div>
          </div>

          {/* Alerts & Notifications */}
          <div className="mt-8">
            <h3 className="font-semibold text-lg mb-4">Alerts & Notifications</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-4 bg-red-50 border-l-4 border-red-400 rounded-lg">
                <div className="flex-1">
                  <div className="font-medium text-red-800">Critical Issue</div>
                  <div className="text-sm text-red-700">Data sync delay detected - some metrics may be outdated</div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg">
                <div className="flex-1">
                  <div className="font-medium text-yellow-800">Opportunity Alert</div>
                  <div className="text-sm text-yellow-700">High-value audience segment identified for targeted campaign</div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-blue-50 border-l-4 border-blue-400 rounded-lg">
                <div className="flex-1">
                  <div className="font-medium text-blue-800">System Update</div>
                  <div className="text-sm text-blue-700">New personalization features available in your dashboard</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderStrategicRecommendations = () => (
    <div className="space-y-6">
      {/* AI-Powered Strategic Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-6 w-6 text-blue-600" />
            AI-Powered Strategic Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Personalization Opportunities */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Personalization Opportunities</h3>
              <div className="space-y-3">
                <div className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">High-Value Customer Targeting</h4>
                    <Badge className="bg-green-100 text-green-800">+23% Expected Lift</Badge>
                  </div>
                  <p className="text-sm text-gray-600">Target customers with 90-day purchase history using dynamic content personalization</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">Geographic Segmentation</h4>
                    <Badge className="bg-blue-100 text-blue-800">+18% Expected Lift</Badge>
                  </div>
                  <p className="text-sm text-gray-600">Implement location-based product recommendations and regional promotions</p>
                </div>
              </div>
            </div>

            {/* Experimentation Priorities */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Experimentation Priorities</h3>
              <div className="space-y-3">
                <div className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">Checkout Flow Optimization</h4>
                    <Badge className="bg-red-100 text-red-800">High Impact</Badge>
                  </div>
                  <p className="text-sm text-gray-600">A/B test simplified checkout process with reduced form fields</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">Product Page Layout</h4>
                    <Badge className="bg-yellow-100 text-yellow-800">Medium Impact</Badge>
                  </div>
                  <p className="text-sm text-gray-600">Test new product image gallery and description layout</p>
                </div>
              </div>
            </div>

            {/* Content Optimization */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Content Optimization</h3>
              <div className="space-y-3">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium">Homepage Hero Content</h4>
                  <p className="text-sm text-gray-600 mb-2">Current conversion rate: 2.3% | Target: 3.1%</p>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-red-600 h-2 rounded-full" style={{ width: '74%' }}></div>
                  </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium">Email Campaign Content</h4>
                  <p className="text-sm text-gray-600 mb-2">Open rate gap: -12% vs industry average</p>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-yellow-600 h-2 rounded-full" style={{ width: '60%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Channel Strategy */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Multi-Channel Strategy</h3>
              <div className="space-y-3">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium">Web & Mobile Alignment</h4>
                  <p className="text-sm text-gray-600">Sync personalization across web and mobile app experiences</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium">Email Integration</h4>
                  <p className="text-sm text-gray-600">Connect web behavior data with email personalization engine</p>
                </div>
              </div>
            </div>
          </div>

          {/* Revenue Impact Predictions */}
          <div className="mt-8">
            <h3 className="font-semibold text-lg mb-4">Revenue Impact Predictions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4 text-center">
                <div className="text-3xl font-bold text-green-600">$1.8M</div>
                <div className="text-sm text-gray-600">Conservative Estimate</div>
                <div className="text-xs text-gray-500">85% confidence</div>
              </Card>
              <Card className="p-4 text-center">
                <div className="text-3xl font-bold text-blue-600">$2.4M</div>
                <div className="text-sm text-gray-600">Expected Impact</div>
                <div className="text-xs text-gray-500">70% confidence</div>
              </Card>
              <Card className="p-4 text-center">
                <div className="text-3xl font-bold text-purple-600">$3.2M</div>
                <div className="text-sm text-gray-600">Optimistic Scenario</div>
                <div className="text-xs text-gray-500">45% confidence</div>
              </Card>
            </div>
          </div>

          {/* Implementation Difficulty Matrix */}
          <div className="mt-8">
            <h3 className="font-semibold text-lg mb-4">Implementation Difficulty vs Impact Matrix</h3>
            <div className="bg-gradient-to-r from-green-50 to-red-50 p-6 rounded-lg">
              <div className="grid grid-cols-2 gap-4 h-64">
                <div className="space-y-2">
                  <div className="text-xs font-medium text-green-700">High Impact, Low Effort (Quick Wins)</div>
                  <div className="space-y-1">
                    <div className="p-2 bg-green-100 rounded text-xs">Checkout Optimization</div>
                    <div className="p-2 bg-green-100 rounded text-xs">Email Personalization</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-xs font-medium text-blue-700">High Impact, High Effort (Strategic)</div>
                  <div className="space-y-1">
                    <div className="p-2 bg-blue-100 rounded text-xs">Mobile App Redesign</div>
                    <div className="p-2 bg-blue-100 rounded text-xs">AI Recommendation Engine</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-xs font-medium text-yellow-700">Low Impact, Low Effort (Fill-ins)</div>
                  <div className="space-y-1">
                    <div className="p-2 bg-yellow-100 rounded text-xs">Footer Links Update</div>
                    <div className="p-2 bg-yellow-100 rounded text-xs">Social Media Icons</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-xs font-medium text-red-700">Low Impact, High Effort (Avoid)</div>
                  <div className="space-y-1">
                    <div className="p-2 bg-red-100 rounded text-xs">Legacy System Migration</div>
                    <div className="p-2 bg-red-100 rounded text-xs">Full Platform Rebuild</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderPerformanceMetrics = () => (
    <div className="space-y-6">
      {/* Comprehensive Performance Analytics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-blue-600" />
            Comprehensive Performance Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {/* Conversion Funnel Analysis */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Conversion Funnel Analysis</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">1</span>
                    </div>
                    <div>
                      <div className="font-medium">Website Visitors</div>
                      <div className="text-sm text-gray-600">100,000 monthly unique visitors</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">100%</div>
                    <div className="text-xs text-green-600">+12% vs last month</div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-purple-600">2</span>
                    </div>
                    <div>
                      <div className="font-medium">Product Page Views</div>
                      <div className="text-sm text-gray-600">45,000 product interactions</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">45%</div>
                    <div className="text-xs text-yellow-600">-3% vs last month</div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-orange-600">3</span>
                    </div>
                    <div>
                      <div className="font-medium">Add to Cart</div>
                      <div className="text-sm text-gray-600">12,000 cart additions</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">12%</div>
                    <div className="text-xs text-red-600">-1% vs last month</div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg bg-green-50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-green-600">4</span>
                    </div>
                    <div>
                      <div className="font-medium">Purchase Completed</div>
                      <div className="text-sm text-gray-600">2,300 successful transactions</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">2.3%</div>
                    <div className="text-xs text-green-600">+0.3% vs last month</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Experiment Performance */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Experiment Performance</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4">
                  <div className="text-2xl font-bold text-green-600">78%</div>
                  <div className="text-sm text-gray-600">Win Rate</div>
                  <div className="text-xs text-gray-500">23 of 29 experiments</div>
                </Card>
                <Card className="p-4">
                  <div className="text-2xl font-bold text-blue-600">95%</div>
                  <div className="text-sm text-gray-600">Statistical Significance</div>
                  <div className="text-xs text-gray-500">Confidence threshold</div>
                </Card>
                <Card className="p-4">
                  <div className="text-2xl font-bold text-purple-600">$1.2M</div>
                  <div className="text-sm text-gray-600">Revenue Attribution</div>
                  <div className="text-xs text-gray-500">From winning tests</div>
                </Card>
              </div>
            </div>

            {/* Audience Performance */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Audience Performance</h3>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">High-Value Customers</span>
                    <Badge className="bg-green-100 text-green-800">+34% conversion</Badge>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: '89%' }}></div>
                  </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">New Visitors</span>
                    <Badge className="bg-blue-100 text-blue-800">+12% engagement</Badge>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '67%' }}></div>
                  </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">Mobile Users</span>
                    <Badge className="bg-purple-100 text-purple-800">+8% retention</Badge>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-600 h-2 rounded-full" style={{ width: '73%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Platform Utilization */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Platform Utilization</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-xl font-bold text-blue-600">85%</div>
                  <div className="text-sm text-gray-600">Experimentation</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-xl font-bold text-green-600">92%</div>
                  <div className="text-sm text-gray-600">Personalization</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-xl font-bold text-purple-600">67%</div>
                  <div className="text-sm text-gray-600">Content Recs</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-xl font-bold text-orange-600">78%</div>
                  <div className="text-sm text-gray-600">Analytics</div>
                </div>
              </div>
            </div>

            {/* Comparative Benchmarks */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Comparative Benchmarks</h3>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Industry Average Conversion</span>
                    <span className="text-gray-600">2.1%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-green-600">Your Performance</span>
                    <span className="text-green-600 font-bold">2.3% (+9.5%)</span>
                  </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Peer Group Average</span>
                    <span className="text-gray-600">$1.8M annual impact</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-blue-600">Your Impact</span>
                    <span className="text-blue-600 font-bold">$2.4M (+33%)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Trend Analysis */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Trend Analysis with Predictive Modeling</h3>
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3">Historical Performance (6 months)</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Jun 2024</span>
                        <span className="font-medium">1.8%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Jul 2024</span>
                        <span className="font-medium">2.0%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Aug 2024</span>
                        <span className="font-medium">2.1%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Sep 2024</span>
                        <span className="font-medium">2.2%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Oct 2024</span>
                        <span className="font-medium">2.3%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Nov 2024</span>
                        <span className="font-medium text-green-600">2.3%</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-3">Predicted Performance (Next 3 months)</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Dec 2024</span>
                        <span className="font-medium text-blue-600">2.4% (±0.1%)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Jan 2025</span>
                        <span className="font-medium text-blue-600">2.5% (±0.2%)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Feb 2025</span>
                        <span className="font-medium text-blue-600">2.6% (±0.2%)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderDataQualityScore = () => (
    <div className="space-y-6">
      {/* Data Health & Quality Assessment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-6 w-6 text-blue-600" />
            Data Health & Quality Assessment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {/* Overall Data Quality Score */}
            <div className="text-center">
              <div className="text-6xl font-bold text-green-600 mb-2">92%</div>
              <div className="text-xl text-gray-600 mb-4">Overall Data Quality Score</div>
              <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
                <div className="bg-green-600 h-4 rounded-full" style={{ width: '92%' }}></div>
              </div>
              <div className="text-sm text-gray-500">Excellent data quality - exceeds industry standards</div>
            </div>

            {/* Category Breakdown */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Quality Breakdown by Category</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="p-4">
                  <div className="text-2xl font-bold text-green-600">95%</div>
                  <div className="text-sm text-gray-600 mb-2">Data Completeness</div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: '95%' }}></div>
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="text-2xl font-bold text-blue-600">89%</div>
                  <div className="text-sm text-gray-600 mb-2">Data Accuracy</div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '89%' }}></div>
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="text-2xl font-bold text-purple-600">93%</div>
                  <div className="text-sm text-gray-600 mb-2">Data Consistency</div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-600 h-2 rounded-full" style={{ width: '93%' }}></div>
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="text-2xl font-bold text-green-600">97%</div>
                  <div className="text-sm text-gray-600 mb-2">Data Timeliness</div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: '97%' }}></div>
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="text-2xl font-bold text-yellow-600">87%</div>
                  <div className="text-sm text-gray-600 mb-2">Data Validity</div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-yellow-600 h-2 rounded-full" style={{ width: '87%' }}></div>
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="text-2xl font-bold text-blue-600">91%</div>
                  <div className="text-sm text-gray-600 mb-2">Data Uniqueness</div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '91%' }}></div>
                  </div>
                </Card>
              </div>
            </div>

            {/* Event Tracking Quality */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Event Tracking Quality</h3>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">Implementation Coverage</span>
                    <Badge className="bg-green-100 text-green-800">94%</Badge>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: '94%' }}></div>
                  </div>
                  <div className="text-sm text-gray-600">847 of 901 required events properly implemented</div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">Accuracy Metrics</span>
                    <Badge className="bg-blue-100 text-blue-800">88%</Badge>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '88%' }}></div>
                  </div>
                  <div className="text-sm text-gray-600">Event parameters correctly formatted and validated</div>
                </div>
              </div>
            </div>

            {/* Audience Data Health */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Audience Data Health</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">96%</div>
                  <div className="text-sm text-gray-600 mb-2">Completeness</div>
                  <div className="text-xs text-gray-500">Profile data coverage</div>
                </div>
                <div className="p-4 border rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600">2.3h</div>
                  <div className="text-sm text-gray-600 mb-2">Freshness</div>
                  <div className="text-xs text-gray-500">Average data age</div>
                </div>
                <div className="p-4 border rounded-lg text-center">
                  <div className="text-2xl font-bold text-purple-600">47</div>
                  <div className="text-sm text-gray-600 mb-2">Segments</div>
                  <div className="text-xs text-gray-500">Active audience segments</div>
                </div>
              </div>
            </div>

            {/* Integration Status */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Integration Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="font-medium">Optimizely Web API</span>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-green-100 text-green-800">Healthy</Badge>
                    <div className="text-xs text-gray-500">99.8% uptime</div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="font-medium">Analytics Integration</span>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-green-100 text-green-800">Synced</Badge>
                    <div className="text-xs text-gray-500">Real-time data flow</div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span className="font-medium">CRM Data Sync</span>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-yellow-100 text-yellow-800">Warning</Badge>
                    <div className="text-xs text-gray-500">15min delay detected</div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="font-medium">Email Platform</span>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-green-100 text-green-800">Connected</Badge>
                    <div className="text-xs text-gray-500">Bi-directional sync</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recommendations Engine */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Data Quality Improvement Recommendations</h3>
              <div className="space-y-3">
                <div className="p-4 bg-red-50 border-l-4 border-red-400 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-red-100 text-red-800">High Priority</Badge>
                    <span className="font-medium">Address CRM Data Sync Delay</span>
                  </div>
                  <div className="text-sm text-gray-700">Resolve 15-minute delay in customer data synchronization to improve real-time personalization accuracy.</div>
                </div>
                <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-yellow-100 text-yellow-800">Medium Priority</Badge>
                    <span className="font-medium">Improve Data Validity Scores</span>
                  </div>
                  <div className="text-sm text-gray-700">Implement additional validation rules for user input fields to increase data validity from 87% to 95%.</div>
                </div>
                <div className="p-4 bg-blue-50 border-l-4 border-blue-400 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-blue-100 text-blue-800">Low Priority</Badge>
                    <span className="font-medium">Enhance Event Tracking Coverage</span>
                  </div>
                  <div className="text-sm text-gray-700">Add tracking for remaining 54 events to achieve 100% implementation coverage.</div>
                </div>
              </div>
            </div>

            {/* Compliance Dashboard */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Compliance Dashboard</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4 border-l-4 border-green-400">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckSquare className="h-5 w-5 text-green-600" />
                    <span className="font-medium">GDPR Compliance</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600">100%</div>
                  <div className="text-sm text-gray-600">All requirements met</div>
                </Card>
                <Card className="p-4 border-l-4 border-green-400">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckSquare className="h-5 w-5 text-green-600" />
                    <span className="font-medium">CCPA Adherence</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600">100%</div>
                  <div className="text-sm text-gray-600">Fully compliant</div>
                </Card>
                <Card className="p-4 border-l-4 border-blue-400">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="h-5 w-5 text-blue-600" />
                    <span className="font-medium">Privacy Controls</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">98%</div>
                  <div className="text-sm text-gray-600">Privacy framework active</div>
                </Card>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderWorkflowTimeline = () => (
    <div className="space-y-6">
      {/* OPAL Workflow Orchestration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-6 w-6 text-blue-600" />
            OPAL Workflow Orchestration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {/* Active Workflows */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Active Workflows</h3>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-medium">Personalization Strategy Workflow</h4>
                      <p className="text-sm text-gray-600">Automated audience analysis and content recommendations</p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Running</Badge>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Progress</span>
                    <span>87%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: '87%' }}></div>
                  </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-medium">A/B Test Optimization Workflow</h4>
                      <p className="text-sm text-gray-600">Continuous experiment monitoring and result analysis</p>
                    </div>
                    <Badge className="bg-blue-100 text-blue-800">Active</Badge>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Progress</span>
                    <span>65%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '65%' }}></div>
                  </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-medium">Content Quality Assessment</h4>
                      <p className="text-sm text-gray-600">Real-time content performance evaluation and recommendations</p>
                    </div>
                    <Badge className="bg-yellow-100 text-yellow-800">Paused</Badge>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Progress</span>
                    <span>42%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-yellow-600 h-2 rounded-full" style={{ width: '42%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline Visualization */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Timeline Visualization</h3>
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-300"></div>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckSquare className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex justify-between items-center mb-1">
                        <h4 className="font-medium">Data Collection Complete</h4>
                        <span className="text-xs text-gray-500">2 hours ago</span>
                      </div>
                      <p className="text-sm text-gray-600">Successfully gathered customer interaction data from all touchpoints</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Activity className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex justify-between items-center mb-1">
                        <h4 className="font-medium">Analysis Processing</h4>
                        <span className="text-xs text-gray-500">In progress</span>
                      </div>
                      <p className="text-sm text-gray-600">AI models analyzing customer behavior patterns and generating insights</p>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: '73%' }}></div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <Calendar className="h-4 w-4 text-gray-400" />
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex justify-between items-center mb-1">
                        <h4 className="font-medium text-gray-500">Strategy Generation</h4>
                        <span className="text-xs text-gray-500">Scheduled for 1 hour</span>
                      </div>
                      <p className="text-sm text-gray-600">Generate personalized strategy recommendations based on analysis results</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <Target className="h-4 w-4 text-gray-400" />
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex justify-between items-center mb-1">
                        <h4 className="font-medium text-gray-500">Implementation Planning</h4>
                        <span className="text-xs text-gray-500">Scheduled for 3 hours</span>
                      </div>
                      <p className="text-sm text-gray-600">Create detailed implementation roadmap with prioritized action items</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Dependency Mapping */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Cross-System Dependencies</h3>
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3">Integration Points</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 p-2 bg-white rounded">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-sm">Optimizely Web → OPAL Analytics</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-white rounded">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-sm">CRM System → Audience Builder</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-white rounded">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        <span className="text-sm">Email Platform → Personalization Engine</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-white rounded">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-sm">Analytics → Reporting Dashboard</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-3">Dependency Status</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center p-2 bg-white rounded">
                        <span className="text-sm">Data Flow Dependencies</span>
                        <Badge className="bg-green-100 text-green-800">Healthy</Badge>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-white rounded">
                        <span className="text-sm">API Rate Limits</span>
                        <Badge className="bg-blue-100 text-blue-800">Normal</Badge>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-white rounded">
                        <span className="text-sm">External Service Availability</span>
                        <Badge className="bg-yellow-100 text-yellow-800">Monitored</Badge>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-white rounded">
                        <span className="text-sm">Workflow Synchronization</span>
                        <Badge className="bg-green-100 text-green-800">Synced</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Workflow Performance Metrics</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">94%</div>
                  <div className="text-sm text-gray-600 mb-1">Success Rate</div>
                  <div className="text-xs text-gray-500">Last 30 days</div>
                </Card>
                <Card className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">2.3m</div>
                  <div className="text-sm text-gray-600 mb-1">Avg Execution Time</div>
                  <div className="text-xs text-gray-500">Per workflow</div>
                </Card>
                <Card className="p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">0.8%</div>
                  <div className="text-sm text-gray-600 mb-1">Error Rate</div>
                  <div className="text-xs text-gray-500">Within SLA</div>
                </Card>
                <Card className="p-4 text-center">
                  <div className="text-2xl font-bold text-orange-600">127</div>
                  <div className="text-sm text-gray-600 mb-1">Daily Executions</div>
                  <div className="text-xs text-gray-500">Average volume</div>
                </Card>
              </div>
            </div>

            {/* Configuration Management */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Workflow Configuration</h3>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium">Trigger Conditions</h4>
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4 mr-2" />
                      Configure
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Data Threshold:</span>
                      <span className="ml-2 font-medium">1,000 events</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Time Interval:</span>
                      <span className="ml-2 font-medium">Every 2 hours</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Quality Gate:</span>
                      <span className="ml-2 font-medium">85% confidence</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Auto-retry:</span>
                      <span className="ml-2 font-medium">3 attempts</span>
                    </div>
                  </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium">Output Destinations</h4>
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4 mr-2" />
                      Manage
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Dashboard Updates</span>
                      <Badge className="bg-green-100 text-green-800">Enabled</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Email Notifications</span>
                      <Badge className="bg-blue-100 text-blue-800">Enabled</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>API Webhooks</span>
                      <Badge className="bg-green-100 text-green-800">Enabled</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Slack Integration</span>
                      <Badge className="bg-gray-100 text-gray-800">Disabled</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Audit Trail */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Workflow Audit Trail</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium">Workflow Configuration Updated</span>
                  </div>
                  <div className="text-xs text-gray-500">2024-11-14 10:30 AM</div>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm font-medium">Automatic Execution Completed</span>
                  </div>
                  <div className="text-xs text-gray-500">2024-11-14 08:15 AM</div>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-sm font-medium">New Workflow Template Created</span>
                  </div>
                  <div className="text-xs text-gray-500">2024-11-13 04:45 PM</div>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span className="text-sm font-medium">Performance Alert Triggered</span>
                  </div>
                  <div className="text-xs text-gray-500">2024-11-13 02:20 PM</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Quick Wins Section Content
  const renderQuickWinsContent = (tier3: string) => {
    const tier3Lower = tier3.toLowerCase().replace(/\s+/g, '-');

    switch (tier3Lower) {
      case 'immediate-opportunities':
        return renderImmediateOpportunities();
      case 'implementation-roadmap-(30-day)':
        return renderImplementationRoadmap();
      case 'resource-requirements':
        return renderResourceRequirements();
      case 'expected-impact':
        return renderExpectedImpact();
      case 'success-metrics':
        return renderSuccessMetrics();
      default:
        return renderDefaultContent();
    }
  };

  const renderImmediateOpportunities = () => (
    <div className="space-y-6">
      {/* 30-Day Impact Opportunities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-blue-600" />
            30-Day Impact Opportunities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {/* Low-Hanging Fruit */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Low-Hanging Fruit: High-Impact, Low-Effort Optimizations</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-4 border-l-4 border-green-400">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-green-800">Checkout Button Color Test</h4>
                    <Badge className="bg-green-100 text-green-800">Ready</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">Change checkout button from blue to orange - historical data shows 15% lift potential</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><strong>Effort:</strong> 2 hours</div>
                    <div><strong>Impact:</strong> +$45K/month</div>
                  </div>
                </Card>
                <Card className="p-4 border-l-4 border-green-400">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-green-800">Header Navigation Cleanup</h4>
                    <Badge className="bg-green-100 text-green-800">Ready</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">Remove underperforming menu items to reduce cognitive load</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><strong>Effort:</strong> 4 hours</div>
                    <div><strong>Impact:</strong> +$28K/month</div>
                  </div>
                </Card>
                <Card className="p-4 border-l-4 border-blue-400">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-blue-800">Social Proof Enhancement</h4>
                    <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">Add customer review count to product listings</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><strong>Effort:</strong> 8 hours</div>
                    <div><strong>Impact:</strong> +$67K/month</div>
                  </div>
                </Card>
                <Card className="p-4 border-l-4 border-yellow-400">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-yellow-800">Mobile Page Speed</h4>
                    <Badge className="bg-yellow-100 text-yellow-800">Planned</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">Compress images and defer non-critical JavaScript</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><strong>Effort:</strong> 12 hours</div>
                    <div><strong>Impact:</strong> +$89K/month</div>
                  </div>
                </Card>
              </div>
            </div>

            {/* A/B Test Quick Wins */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Pre-Validated A/B Test Ideas</h3>
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-medium">Homepage Hero Section Personalization</h4>
                    <Badge className="bg-green-100 text-green-800">85% Success Probability</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">Show different hero messages based on traffic source (organic, paid, social, direct)</p>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <strong className="text-green-600">Expected Lift:</strong>
                      <div>+23% conversion rate</div>
                    </div>
                    <div>
                      <strong className="text-blue-600">Timeline:</strong>
                      <div>5 days setup + 14 days test</div>
                    </div>
                    <div>
                      <strong className="text-purple-600">Revenue Impact:</strong>
                      <div>+$156K annually</div>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-medium">Product Page Trust Signals</h4>
                    <Badge className="bg-blue-100 text-blue-800">78% Success Probability</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">Add security badges, return policy, and shipping information above the fold</p>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <strong className="text-green-600">Expected Lift:</strong>
                      <div>+18% add-to-cart rate</div>
                    </div>
                    <div>
                      <strong className="text-blue-600">Timeline:</strong>
                      <div>3 days setup + 21 days test</div>
                    </div>
                    <div>
                      <strong className="text-purple-600">Revenue Impact:</strong>
                      <div>+$134K annually</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Personalization Activations */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Simple Personalization Activations</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-blue-800">Audience-Based Targeting</h4>
                  <div className="space-y-3">
                    <div className="p-3 border rounded-lg">
                      <div className="font-medium text-sm">Returning Customers</div>
                      <div className="text-xs text-gray-600 mb-2">Show "Welcome Back" with recent order status</div>
                      <div className="text-xs"><strong>Audience Size:</strong> 34% of traffic | <strong>Expected Lift:</strong> +12%</div>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="font-medium text-sm">High-Value Shoppers</div>
                      <div className="text-xs text-gray-600 mb-2">Display premium product recommendations</div>
                      <div className="text-xs"><strong>Audience Size:</strong> 8% of traffic | <strong>Expected Lift:</strong> +28%</div>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="font-medium text-sm">Cart Abandoners</div>
                      <div className="text-xs text-gray-600 mb-2">Show persistent cart reminder with discount</div>
                      <div className="text-xs"><strong>Audience Size:</strong> 23% of traffic | <strong>Expected Lift:</strong> +19%</div>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-medium text-purple-800">Behavioral Triggers</h4>
                  <div className="space-y-3">
                    <div className="p-3 border rounded-lg">
                      <div className="font-medium text-sm">Exit Intent</div>
                      <div className="text-xs text-gray-600 mb-2">Display discount modal on exit intent</div>
                      <div className="text-xs"><strong>Trigger Rate:</strong> 15% of sessions | <strong>Expected Lift:</strong> +7%</div>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="font-medium text-sm">Time on Site</div>
                      <div className="text-xs text-gray-600 mb-2">Show help chat after 3+ minutes browsing</div>
                      <div className="text-xs"><strong>Trigger Rate:</strong> 22% of sessions | <strong>Expected Lift:</strong> +11%</div>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="font-medium text-sm">Page Depth</div>
                      <div className="text-xs text-gray-600 mb-2">Offer newsletter signup after viewing 4+ pages</div>
                      <div className="text-xs"><strong>Trigger Rate:</strong> 18% of sessions | <strong>Expected Lift:</strong> +9%</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Optimizations */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Page-Level Content Improvements</h3>
              <div className="space-y-4">
                <div className="p-4 bg-red-50 border-l-4 border-red-400 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium text-red-800">Product Description Enhancement</h4>
                    <Badge className="bg-red-100 text-red-800">High Priority</Badge>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">Add bullet points and benefits-focused copy to top-selling products</p>
                  <div className="text-xs text-gray-600">Current avg. time on page: 1:23 | Target: 2:15 | Expected conversion lift: +16%</div>
                </div>
                <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium text-yellow-800">FAQ Section Optimization</h4>
                    <Badge className="bg-yellow-100 text-yellow-800">Medium Priority</Badge>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">Reorganize FAQ by customer journey stage and add search functionality</p>
                  <div className="text-xs text-gray-600">Current FAQ usage: 12% | Target: 25% | Expected support reduction: 18%</div>
                </div>
                <div className="p-4 bg-blue-50 border-l-4 border-blue-400 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium text-blue-800">Category Page Filters</h4>
                    <Badge className="bg-blue-100 text-blue-800">Quick Win</Badge>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">Add "Most Popular" and "Best Value" filter options</p>
                  <div className="text-xs text-gray-600">Current filter usage: 34% | Target: 52% | Expected engagement: +21%</div>
                </div>
              </div>
            </div>

            {/* Technical Quick Fixes */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Technical Performance & UX Enhancements</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Form Field Optimization</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Add autofill attributes to checkout form</li>
                    <li>• Implement real-time validation</li>
                    <li>• Reduce required fields from 12 to 8</li>
                  </ul>
                  <div className="text-xs text-green-600 mt-2">Expected completion rate: +24%</div>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Loading Performance</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Optimize product image loading</li>
                    <li>• Implement lazy loading for reviews</li>
                    <li>• Compress CSS and JavaScript files</li>
                  </ul>
                  <div className="text-xs text-blue-600 mt-2">Expected speed improvement: +1.8s</div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="font-medium mb-2">Search Functionality</div>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Add search suggestions dropdown</li>
                    <li>• Implement typo tolerance</li>
                    <li>• Show "no results" alternatives</li>
                  </ul>
                  <div className="text-xs text-purple-600 mt-2">Expected search success: +31%</div>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Mobile Experience</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Increase touch target sizes</li>
                    <li>• Improve thumb-friendly navigation</li>
                    <li>• Optimize modal interactions</li>
                  </ul>
                  <div className="text-xs text-orange-600 mt-2">Expected mobile conversion: +19%</div>
                </div>
              </div>
            </div>

            {/* Revenue Impact Summary */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Expected Financial Returns</h3>
              <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">$1.2M</div>
                    <div className="text-sm text-gray-600">Total Annual Impact</div>
                    <div className="text-xs text-gray-500">All opportunities combined</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">30</div>
                    <div className="text-sm text-gray-600">Days to Implement</div>
                    <div className="text-xs text-gray-500">Average timeline</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600">15</div>
                    <div className="text-sm text-gray-600">Opportunities</div>
                    <div className="text-xs text-gray-500">Ready for execution</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-orange-600">ROI</div>
                    <div className="text-sm text-gray-600">2,400%</div>
                    <div className="text-xs text-gray-500">Return on investment</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderImplementationRoadmap = () => (
    <div className="space-y-6">
      {/* Sprint-Based Implementation Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-6 w-6 text-blue-600" />
            Sprint-Based Implementation Plan (30-Day Roadmap)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {/* Week 1-2 Priorities */}
            <div>
              <h3 className="font-semibold text-lg mb-4 text-green-700">Week 1-2: Immediate Actions & High-Impact Quick Wins</h3>
              <div className="space-y-4">
                <div className="bg-green-50 p-6 rounded-lg border-l-4 border-green-400">
                  <h4 className="font-medium text-green-800 mb-4">Sprint 1: Foundation & Quick Fixes (Days 1-7)</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-white rounded border">
                      <div>
                        <div className="font-medium text-sm">Checkout Button Color Test</div>
                        <div className="text-xs text-gray-600">Change checkout CTA from blue to orange</div>
                      </div>
                      <div className="text-right">
                        <Badge className="bg-green-100 text-green-800">Day 1</Badge>
                        <div className="text-xs text-gray-500 mt-1">2 hours</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white rounded border">
                      <div>
                        <div className="font-medium text-sm">Header Navigation Cleanup</div>
                        <div className="text-xs text-gray-600">Remove underperforming menu items</div>
                      </div>
                      <div className="text-right">
                        <Badge className="bg-green-100 text-green-800">Day 2</Badge>
                        <div className="text-xs text-gray-500 mt-1">4 hours</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white rounded border">
                      <div>
                        <div className="font-medium text-sm">Mobile Page Speed Optimization</div>
                        <div className="text-xs text-gray-600">Compress images and defer non-critical JS</div>
                      </div>
                      <div className="text-right">
                        <Badge className="bg-blue-100 text-blue-800">Days 3-4</Badge>
                        <div className="text-xs text-gray-500 mt-1">12 hours</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white rounded border">
                      <div>
                        <div className="font-medium text-sm">Form Field Optimization</div>
                        <div className="text-xs text-gray-600">Add autofill and reduce required fields</div>
                      </div>
                      <div className="text-right">
                        <Badge className="bg-blue-100 text-blue-800">Days 5-6</Badge>
                        <div className="text-xs text-gray-500 mt-1">8 hours</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white rounded border">
                      <div>
                        <div className="font-medium text-sm">A/B Test Setup: Hero Personalization</div>
                        <div className="text-xs text-gray-600">Configure traffic source-based messaging</div>
                      </div>
                      <div className="text-right">
                        <Badge className="bg-purple-100 text-purple-800">Day 7</Badge>
                        <div className="text-xs text-gray-500 mt-1">6 hours</div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-green-100 rounded">
                    <div className="text-sm font-medium text-green-800">Sprint 1 Targets:</div>
                    <div className="text-xs text-green-700 mt-1">• 5 optimizations implemented • Hero personalization test launched • Expected impact: +$73K monthly</div>
                  </div>
                </div>

                <div className="bg-blue-50 p-6 rounded-lg border-l-4 border-blue-400">
                  <h4 className="font-medium text-blue-800 mb-4">Sprint 2: Trust Signals & Personalization (Days 8-14)</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-white rounded border">
                      <div>
                        <div className="font-medium text-sm">Social Proof Enhancement</div>
                        <div className="text-xs text-gray-600">Add review counts to product listings</div>
                      </div>
                      <div className="text-right">
                        <Badge className="bg-blue-100 text-blue-800">Days 8-9</Badge>
                        <div className="text-xs text-gray-500 mt-1">8 hours</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white rounded border">
                      <div>
                        <div className="font-medium text-sm">Product Page Trust Signals</div>
                        <div className="text-xs text-gray-600">Add security badges and return policy</div>
                      </div>
                      <div className="text-right">
                        <Badge className="bg-blue-100 text-blue-800">Days 10-11</Badge>
                        <div className="text-xs text-gray-500 mt-1">6 hours</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white rounded border">
                      <div>
                        <div className="font-medium text-sm">Returning Customer Personalization</div>
                        <div className="text-xs text-gray-600">Implement "Welcome Back" messaging</div>
                      </div>
                      <div className="text-right">
                        <Badge className="bg-purple-100 text-purple-800">Days 12-13</Badge>
                        <div className="text-xs text-gray-500 mt-1">10 hours</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white rounded border">
                      <div>
                        <div className="font-medium text-sm">Exit Intent Modal Setup</div>
                        <div className="text-xs text-gray-600">Configure discount modal for abandoning users</div>
                      </div>
                      <div className="text-right">
                        <Badge className="bg-purple-100 text-purple-800">Day 14</Badge>
                        <div className="text-xs text-gray-500 mt-1">4 hours</div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-blue-100 rounded">
                    <div className="text-sm font-medium text-blue-800">Sprint 2 Targets:</div>
                    <div className="text-xs text-blue-700 mt-1">• Trust signals deployed • 2 personalization rules active • Product page A/B test launched</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Week 3-4 Goals */}
            <div>
              <h3 className="font-semibold text-lg mb-4 text-purple-700">Week 3-4: Secondary Priorities & Optimization</h3>
              <div className="space-y-4">
                <div className="bg-purple-50 p-6 rounded-lg border-l-4 border-purple-400">
                  <h4 className="font-medium text-purple-800 mb-4">Sprint 3: Content & Search Optimization (Days 15-21)</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-white rounded border">
                      <div>
                        <div className="font-medium text-sm">Product Description Enhancement</div>
                        <div className="text-xs text-gray-600">Add bullet points to top 20 products</div>
                      </div>
                      <div className="text-right">
                        <Badge className="bg-purple-100 text-purple-800">Days 15-17</Badge>
                        <div className="text-xs text-gray-500 mt-1">16 hours</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white rounded border">
                      <div>
                        <div className="font-medium text-sm">Search Functionality Upgrade</div>
                        <div className="text-xs text-gray-600">Add suggestions and typo tolerance</div>
                      </div>
                      <div className="text-right">
                        <Badge className="bg-purple-100 text-purple-800">Days 18-19</Badge>
                        <div className="text-xs text-gray-500 mt-1">12 hours</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white rounded border">
                      <div>
                        <div className="font-medium text-sm">Category Page Filter Enhancement</div>
                        <div className="text-xs text-gray-600">Add "Most Popular" and "Best Value" filters</div>
                      </div>
                      <div className="text-right">
                        <Badge className="bg-blue-100 text-blue-800">Days 20-21</Badge>
                        <div className="text-xs text-gray-500 mt-1">8 hours</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-orange-50 p-6 rounded-lg border-l-4 border-orange-400">
                  <h4 className="font-medium text-orange-800 mb-4">Sprint 4: Advanced Features & Analytics (Days 22-30)</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-white rounded border">
                      <div>
                        <div className="font-medium text-sm">High-Value Customer Segmentation</div>
                        <div className="text-xs text-gray-600">Implement premium product recommendations</div>
                      </div>
                      <div className="text-right">
                        <Badge className="bg-orange-100 text-orange-800">Days 22-24</Badge>
                        <div className="text-xs text-gray-500 mt-1">14 hours</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white rounded border">
                      <div>
                        <div className="font-medium text-sm">FAQ Section Reorganization</div>
                        <div className="text-xs text-gray-600">Restructure by customer journey stage</div>
                      </div>
                      <div className="text-right">
                        <Badge className="bg-orange-100 text-orange-800">Days 25-27</Badge>
                        <div className="text-xs text-gray-500 mt-1">12 hours</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white rounded border">
                      <div>
                        <div className="font-medium text-sm">Performance Monitoring Setup</div>
                        <div className="text-xs text-gray-600">Implement tracking for all optimizations</div>
                      </div>
                      <div className="text-right">
                        <Badge className="bg-green-100 text-green-800">Days 28-30</Badge>
                        <div className="text-xs text-gray-500 mt-1">10 hours</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Resource Allocation */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Resource Allocation & Team Assignments</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-3 text-blue-800">Development Team</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Frontend Developer</span>
                      <Badge className="bg-blue-100 text-blue-800">80% allocation</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Backend Developer</span>
                      <Badge className="bg-green-100 text-green-800">40% allocation</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>DevOps Engineer</span>
                      <Badge className="bg-yellow-100 text-yellow-800">20% allocation</Badge>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-3">Total: 140 hours over 30 days</div>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-3 text-green-800">Marketing Team</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>CRO Specialist</span>
                      <Badge className="bg-green-100 text-green-800">100% allocation</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Content Writer</span>
                      <Badge className="bg-blue-100 text-blue-800">60% allocation</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>UX Designer</span>
                      <Badge className="bg-purple-100 text-purple-800">50% allocation</Badge>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-3">Total: 84 hours over 30 days</div>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-3 text-purple-800">Analytics Team</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Data Analyst</span>
                      <Badge className="bg-purple-100 text-purple-800">70% allocation</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>A/B Test Manager</span>
                      <Badge className="bg-blue-100 text-blue-800">90% allocation</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>QA Specialist</span>
                      <Badge className="bg-green-100 text-green-800">30% allocation</Badge>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-3">Total: 76 hours over 30 days</div>
                </div>
              </div>
            </div>

            {/* Dependency Timeline */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Dependency Timeline & Prerequisites</h3>
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-3 bg-white rounded border">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">Analytics Tracking Setup</div>
                      <div className="text-xs text-gray-600">Must be completed before any A/B tests launch</div>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Day 1 - Prerequisite</Badge>
                  </div>
                  <div className="flex items-center gap-4 p-3 bg-white rounded border">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">Personalization Engine Configuration</div>
                      <div className="text-xs text-gray-600">Required for returning customer and high-value segments</div>
                    </div>
                    <Badge className="bg-blue-100 text-blue-800">Day 3 - Blocks Sprint 2</Badge>
                  </div>
                  <div className="flex items-center gap-4 p-3 bg-white rounded border">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">Content Management System Access</div>
                      <div className="text-xs text-gray-600">Needed for product description updates</div>
                    </div>
                    <Badge className="bg-yellow-100 text-yellow-800">Day 10 - Blocks Sprint 3</Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Risk Mitigation */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Risk Mitigation & Contingency Plans</h3>
              <div className="space-y-4">
                <div className="p-4 bg-red-50 border-l-4 border-red-400 rounded-lg">
                  <div className="font-medium text-red-800 mb-2">High Risk: Development Resource Shortage</div>
                  <div className="text-sm text-red-700 mb-2">Frontend developer unavailability could delay 60% of implementations</div>
                  <div className="text-xs text-red-600">
                    <strong>Mitigation:</strong> Pre-identify backup contractor, prioritize highest-impact items first, prepare simplified fallback versions
                  </div>
                </div>
                <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg">
                  <div className="font-medium text-yellow-800 mb-2">Medium Risk: A/B Test Statistical Significance</div>
                  <div className="text-sm text-yellow-700 mb-2">Low traffic periods could extend test duration beyond 30 days</div>
                  <div className="text-xs text-yellow-600">
                    <strong>Mitigation:</strong> Start tests early in sprint, consider increasing traffic allocation, prepare sequential testing approach
                  </div>
                </div>
                <div className="p-4 bg-blue-50 border-l-4 border-blue-400 rounded-lg">
                  <div className="font-medium text-blue-800 mb-2">Low Risk: Content Creation Delays</div>
                  <div className="text-sm text-blue-700 mb-2">Product description rewrites may take longer than estimated</div>
                  <div className="text-xs text-blue-600">
                    <strong>Mitigation:</strong> Start content creation in Week 1, focus on top 10 products first, use AI assistance for initial drafts
                  </div>
                </div>
              </div>
            </div>

            {/* Success Checkpoints */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Success Checkpoints & Progress Tracking</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-green-800">Weekly Milestones</h4>
                  <div className="space-y-3">
                    <div className="p-3 border rounded-lg">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium text-sm">Week 1 Checkpoint</span>
                        <Badge className="bg-green-100 text-green-800">Target: 35%</Badge>
                      </div>
                      <div className="text-xs text-gray-600">5 quick fixes implemented, hero test launched</div>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium text-sm">Week 2 Checkpoint</span>
                        <Badge className="bg-blue-100 text-blue-800">Target: 60%</Badge>
                      </div>
                      <div className="text-xs text-gray-600">Trust signals deployed, personalization active</div>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium text-sm">Week 3 Checkpoint</span>
                        <Badge className="bg-purple-100 text-purple-800">Target: 80%</Badge>
                      </div>
                      <div className="text-xs text-gray-600">Content optimized, search enhanced</div>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium text-sm">Week 4 Checkpoint</span>
                        <Badge className="bg-orange-100 text-orange-800">Target: 100%</Badge>
                      </div>
                      <div className="text-xs text-gray-600">All features live, tracking implemented</div>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-medium text-blue-800">Success Validation</h4>
                  <div className="space-y-3">
                    <div className="p-3 border rounded-lg">
                      <div className="font-medium text-sm mb-1">Performance Metrics</div>
                      <div className="text-xs text-gray-600">Site speed, conversion rates, engagement tracked daily</div>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="font-medium text-sm mb-1">A/B Test Results</div>
                      <div className="text-xs text-gray-600">Statistical significance monitored, results documented</div>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="font-medium text-sm mb-1">User Feedback</div>
                      <div className="text-xs text-gray-600">Customer support tickets, user surveys analyzed</div>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="font-medium text-sm mb-1">Business Impact</div>
                      <div className="text-xs text-gray-600">Revenue attribution calculated for each optimization</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderResourceRequirements = () => (
    <div className="space-y-6">
      {/* Team & Technology Resource Requirements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-6 w-6 text-blue-600" />
            Team & Technology Resource Requirements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {/* Human Resources */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Human Resources</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-3">Development Resources</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                      <span className="text-sm font-medium">Frontend Developer (Senior)</span>
                      <Badge className="bg-blue-100 text-blue-800">1.0 FTE</Badge>
                    </div>
                    <div className="text-xs text-gray-600 mb-2">
                      <strong>Skills Required:</strong> React, JavaScript, A/B testing platforms, analytics implementation
                    </div>
                    <div className="text-xs text-gray-600 mb-2">
                      <strong>Duration:</strong> 30 days (160 hours)
                    </div>
                    <div className="text-xs text-gray-600">
                      <strong>Key Responsibilities:</strong> UI changes, test implementations, performance optimization
                    </div>
                  </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium text-green-800 mb-3">Marketing Resources</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                      <span className="text-sm font-medium">CRO Specialist</span>
                      <Badge className="bg-green-100 text-green-800">1.0 FTE</Badge>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                      <span className="text-sm font-medium">Content Writer</span>
                      <Badge className="bg-blue-100 text-blue-800">0.6 FTE</Badge>
                    </div>
                    <div className="text-xs text-gray-600">
                      <strong>Skills:</strong> A/B testing, conversion optimization, copywriting, data analysis
                    </div>
                  </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium text-purple-800 mb-3">Analytics Resources</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-2 bg-purple-50 rounded">
                      <span className="text-sm font-medium">Data Analyst</span>
                      <Badge className="bg-purple-100 text-purple-800">0.7 FTE</Badge>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-purple-50 rounded">
                      <span className="text-sm font-medium">A/B Test Manager</span>
                      <Badge className="bg-orange-100 text-orange-800">0.9 FTE</Badge>
                    </div>
                    <div className="text-xs text-gray-600">
                      <strong>Skills:</strong> Statistical analysis, experiment design, reporting, data visualization
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Technology Stack */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Technology Stack Requirements</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-blue-800">Required Tools & Platforms</h4>
                  <div className="space-y-3">
                    <div className="p-3 border rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-sm">Optimizely Web Experimentation</span>
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      </div>
                      <div className="text-xs text-gray-600">A/B testing platform for homepage and product page tests</div>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-sm">Optimizely Personalization</span>
                        <Badge className="bg-yellow-100 text-yellow-800">Setup Required</Badge>
                      </div>
                      <div className="text-xs text-gray-600">For audience-based targeting and behavioral triggers</div>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-sm">Google Analytics 4</span>
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      </div>
                      <div className="text-xs text-gray-600">Enhanced ecommerce tracking and conversion attribution</div>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-sm">Content Management System</span>
                        <Badge className="bg-blue-100 text-blue-800">Access Needed</Badge>
                      </div>
                      <div className="text-xs text-gray-600">For product description and content updates</div>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-medium text-green-800">Development & Integration</h4>
                  <div className="space-y-3">
                    <div className="p-3 border rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-sm">Version Control System</span>
                        <Badge className="bg-green-100 text-green-800">Git/GitHub</Badge>
                      </div>
                      <div className="text-xs text-gray-600">Code repository and deployment pipeline</div>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-sm">Testing Environment</span>
                        <Badge className="bg-yellow-100 text-yellow-800">Setup Required</Badge>
                      </div>
                      <div className="text-xs text-gray-600">Staging environment for pre-launch validation</div>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-sm">Performance Monitoring</span>
                        <Badge className="bg-blue-100 text-blue-800">Lighthouse/GTM</Badge>
                      </div>
                      <div className="text-xs text-gray-600">Page speed and core web vitals tracking</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Budget Estimates */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Budget Estimates & Cost Projections</h3>
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="font-medium text-green-800 mb-4">Personnel Costs (30 Days)</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-2 bg-white rounded">
                        <span className="text-sm">Senior Frontend Developer</span>
                        <span className="font-medium">$24,000</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-white rounded">
                        <span className="text-sm">CRO Specialist</span>
                        <span className="font-medium">$18,000</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-white rounded">
                        <span className="text-sm">Content Writer (60%)</span>
                        <span className="font-medium">$8,400</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-white rounded">
                        <span className="text-sm">Data Analyst (70%)</span>
                        <span className="font-medium">$9,800</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-white rounded">
                        <span className="text-sm">A/B Test Manager (90%)</span>
                        <span className="font-medium">$14,400</span>
                      </div>
                      <div className="border-t pt-2">
                        <div className="flex justify-between items-center font-bold">
                          <span>Total Personnel</span>
                          <span className="text-green-600">$74,600</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-blue-800 mb-4">Tools & Services Costs</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-2 bg-white rounded">
                        <span className="text-sm">Optimizely Platform (monthly)</span>
                        <span className="font-medium">$3,500</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-white rounded">
                        <span className="text-sm">Additional Analytics Tools</span>
                        <span className="font-medium">$800</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-white rounded">
                        <span className="text-sm">Performance Monitoring</span>
                        <span className="font-medium">$400</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-white rounded">
                        <span className="text-sm">External Contractor (backup)</span>
                        <span className="font-medium">$5,000</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-white rounded">
                        <span className="text-sm">Miscellaneous & Buffer</span>
                        <span className="font-medium">$1,300</span>
                      </div>
                      <div className="border-t pt-2">
                        <div className="flex justify-between items-center font-bold">
                          <span>Total Tools & Services</span>
                          <span className="text-blue-600">$11,000</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Total Investment (30 Days)</span>
                    <span className="text-2xl text-green-600">$85,600</span>
                  </div>
                  <div className="text-sm text-gray-600 mt-2">
                    Expected ROI: 2,400% • Payback Period: 2.1 months • Net Annual Benefit: $1,114,400
                  </div>
                </div>
              </div>
            </div>

            {/* Skill Gap Analysis */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Skill Gap Analysis & Training Needs</h3>
              <div className="space-y-4">
                <div className="p-4 bg-red-50 border-l-4 border-red-400 rounded-lg">
                  <div className="font-medium text-red-800 mb-2">Critical Gap: Advanced A/B Testing</div>
                  <div className="text-sm text-red-700 mb-2">Current team lacks statistical analysis expertise for complex multivariate tests</div>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div><strong>Training Required:</strong> 40 hours statistical methods</div>
                    <div><strong>Timeline:</strong> Complete by Day 5</div>
                    <div><strong>Cost:</strong> $2,400 external training</div>
                    <div><strong>Alternative:</strong> Hire external consultant</div>
                  </div>
                </div>
                <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg">
                  <div className="font-medium text-yellow-800 mb-2">Medium Gap: Personalization Platform</div>
                  <div className="text-sm text-yellow-700 mb-2">Limited experience with Optimizely personalization features</div>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div><strong>Training Required:</strong> 16 hours platform training</div>
                    <div><strong>Timeline:</strong> Complete by Day 8</div>
                    <div><strong>Cost:</strong> $800 certification course</div>
                    <div><strong>Impact:</strong> May delay Sprint 2 by 1-2 days</div>
                  </div>
                </div>
                <div className="p-4 bg-blue-50 border-l-4 border-blue-400 rounded-lg">
                  <div className="font-medium text-blue-800 mb-2">Minor Gap: Content Strategy</div>
                  <div className="text-sm text-blue-700 mb-2">Content team needs UX writing and conversion copywriting skills</div>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div><strong>Training Required:</strong> 8 hours UX writing workshop</div>
                    <div><strong>Timeline:</strong> Ongoing during project</div>
                    <div><strong>Cost:</strong> $400 online course</div>
                    <div><strong>Impact:</strong> Minimal, can learn while working</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Vendor Requirements */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Third-Party Services & Partnership Needs</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-purple-800">Required Vendor Services</h4>
                  <div className="space-y-3">
                    <div className="p-3 border rounded-lg">
                      <div className="font-medium text-sm mb-1">Optimizely Technical Support</div>
                      <div className="text-xs text-gray-600 mb-2">Premium support for advanced implementation questions</div>
                      <div className="flex justify-between text-xs">
                        <span><strong>Cost:</strong> $500/month</span>
                        <span><strong>Duration:</strong> 3 months</span>
                      </div>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="font-medium text-sm mb-1">Performance Audit Service</div>
                      <div className="text-xs text-gray-600 mb-2">Third-party site speed and UX analysis</div>
                      <div className="flex justify-between text-xs">
                        <span><strong>Cost:</strong> $2,500 one-time</span>
                        <span><strong>Delivery:</strong> 5 business days</span>
                      </div>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="font-medium text-sm mb-1">Design Consultation</div>
                      <div className="text-xs text-gray-600 mb-2">UX expert for personalization design review</div>
                      <div className="flex justify-between text-xs">
                        <span><strong>Cost:</strong> $150/hour</span>
                        <span><strong>Duration:</strong> 20 hours</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-medium text-orange-800">Partnership Requirements</h4>
                  <div className="space-y-3">
                    <div className="p-3 border rounded-lg">
                      <div className="font-medium text-sm mb-1">IT Department Coordination</div>
                      <div className="text-xs text-gray-600 mb-2">Access to production environments and deployment pipelines</div>
                      <div className="text-xs">
                        <strong>Requirements:</strong> 2 dedicated IT contacts, weekly sync meetings
                      </div>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="font-medium text-sm mb-1">Legal & Compliance Review</div>
                      <div className="text-xs text-gray-600 mb-2">Privacy policy updates for personalization features</div>
                      <div className="text-xs">
                        <strong>Timeline:</strong> 5 business days for review and approval
                      </div>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="font-medium text-sm mb-1">Customer Service Training</div>
                      <div className="text-xs text-gray-600 mb-2">Brief support team on new features and personalization</div>
                      <div className="text-xs">
                        <strong>Time Required:</strong> 2 hour training session + documentation
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline Considerations */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Timeline Considerations & Scheduling Constraints</h3>
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-yellow-800 mb-3">Resource Availability</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Frontend Developer</span>
                        <span className="text-green-600">Available immediately</span>
                      </div>
                      <div className="flex justify-between">
                        <span>CRO Specialist</span>
                        <span className="text-green-600">Available immediately</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Data Analyst</span>
                        <span className="text-yellow-600">Available Day 3</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Content Writer</span>
                        <span className="text-yellow-600">70% available (other projects)</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-orange-800 mb-3">External Dependencies</h4>
                    <div className="space-y-2 text-sm">
                      <div>• IT approval process: 2-3 business days</div>
                      <div>• Legal review completion: 5 business days</div>
                      <div>• External training delivery: 1 week lead time</div>
                      <div>• Vendor onboarding: 3-5 business days</div>
                    </div>
                  </div>
                </div>
                <div className="mt-6 p-4 bg-white rounded border-l-4 border-orange-400">
                  <div className="font-medium text-orange-800 mb-2">Critical Path Considerations</div>
                  <div className="text-sm text-gray-700">
                    The 30-day timeline is achievable with immediate resource allocation and parallel work streams.
                    Key risks include IT approval delays and external training availability. Recommend starting
                    approval processes in parallel with Sprint 1 activities to minimize impact.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderExpectedImpact = () => (
    <div className="space-y-6">
      {/* Business Impact Projections */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-blue-600" />
            Business Impact Projections
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {/* Revenue Forecasts */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Revenue Forecasts with Confidence Intervals</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6 text-center bg-gradient-to-br from-green-50 to-green-100">
                  <div className="text-3xl font-bold text-green-600 mb-2">$1.8M</div>
                  <div className="text-lg font-medium text-green-800">Conservative Estimate</div>
                  <div className="text-sm text-green-700 mb-3">85% Confidence Level</div>
                  <div className="text-xs text-gray-600">
                    Assumes 50% of optimizations achieve target performance with 75% of expected lift
                  </div>
                </Card>
                <Card className="p-6 text-center bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300">
                  <div className="text-3xl font-bold text-blue-600 mb-2">$2.4M</div>
                  <div className="text-lg font-medium text-blue-800">Expected Impact</div>
                  <div className="text-sm text-blue-700 mb-3">70% Confidence Level</div>
                  <div className="text-xs text-gray-600">
                    Primary forecast based on historical A/B test performance and current traffic patterns
                  </div>
                </Card>
                <Card className="p-6 text-center bg-gradient-to-br from-purple-50 to-purple-100">
                  <div className="text-3xl font-bold text-purple-600 mb-2">$3.2M</div>
                  <div className="text-lg font-medium text-purple-800">Optimistic Scenario</div>
                  <div className="text-sm text-purple-700 mb-3">45% Confidence Level</div>
                  <div className="text-xs text-gray-600">
                    Best-case scenario where all tests exceed expectations and traffic increases seasonally
                  </div>
                </Card>
              </div>

              <div className="mt-6 bg-gray-50 p-6 rounded-lg">
                <h4 className="font-medium text-gray-800 mb-4">Revenue Attribution Methodology</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                  <div>
                    <strong className="text-blue-600">Base Calculations:</strong>
                    <ul className="mt-2 space-y-1 text-gray-600">
                      <li>• Current monthly revenue: $8.2M</li>
                      <li>• Average conversion rate: 2.3%</li>
                      <li>• Monthly unique visitors: 850,000</li>
                      <li>• Average order value: $127</li>
                    </ul>
                  </div>
                  <div>
                    <strong className="text-green-600">Impact Drivers:</strong>
                    <ul className="mt-2 space-y-1 text-gray-600">
                      <li>• Conversion rate improvement: +0.8%</li>
                      <li>• Average order value increase: +$23</li>
                      <li>• Customer lifetime value boost: +15%</li>
                      <li>• Return visitor conversion: +34%</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Conversion Improvements */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Expected Conversion Metric Improvements</h3>
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium">Overall Conversion Rate</h4>
                    <Badge className="bg-green-100 text-green-800">Primary KPI</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">2.3%</div>
                      <div className="text-xs text-gray-600">Current</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">3.1%</div>
                      <div className="text-xs text-gray-600">Target</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">+34.8%</div>
                      <div className="text-xs text-gray-600">Relative Lift</div>
                    </div>
                  </div>
                  <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full" style={{ width: '78%' }}></div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-3">Cart Abandonment Reduction</h4>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm">Current Rate: 73.2%</span>
                      <span className="text-sm text-green-600">Target: 61.8%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: '84%' }}></div>
                    </div>
                    <div className="text-xs text-gray-600 mt-2">Expected impact: +$340K annual revenue recovery</div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-3">Mobile Conversion Rate</h4>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm">Current Rate: 1.8%</span>
                      <span className="text-sm text-blue-600">Target: 2.6%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: '69%' }}></div>
                    </div>
                    <div className="text-xs text-gray-600 mt-2">Expected impact: +$580K from mobile traffic optimization</div>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-3">Personalization Performance Lift</h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-xl font-bold text-green-600">+28%</div>
                      <div className="text-xs text-gray-600">High-Value Customers</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-blue-600">+19%</div>
                      <div className="text-xs text-gray-600">Cart Abandoners</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-purple-600">+12%</div>
                      <div className="text-xs text-gray-600">Returning Visitors</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* User Experience Gains */}
            <div>
              <h3 className="font-semibold text-lg mb-4">User Experience & Engagement Improvements</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-green-800">Engagement Metrics</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                      <span className="text-sm font-medium">Average Session Duration</span>
                      <span className="text-green-600 font-bold">+47%</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                      <span className="text-sm font-medium">Pages per Session</span>
                      <span className="text-blue-600 font-bold">+23%</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-purple-50 rounded">
                      <span className="text-sm font-medium">Bounce Rate Reduction</span>
                      <span className="text-purple-600 font-bold">-18%</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-orange-50 rounded">
                      <span className="text-sm font-medium">Return Visitor Rate</span>
                      <span className="text-orange-600 font-bold">+31%</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-medium text-blue-800">User Satisfaction</h4>
                  <div className="space-y-3">
                    <div className="p-3 border rounded-lg">
                      <div className="font-medium text-sm mb-1">Page Load Speed</div>
                      <div className="text-xs text-gray-600 mb-2">Improvement from 3.2s to 1.4s average load time</div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-600 h-2 rounded-full" style={{ width: '91%' }}></div>
                      </div>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="font-medium text-sm mb-1">Search Success Rate</div>
                      <div className="text-xs text-gray-600 mb-2">Users finding desired products increases 31%</div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: '84%' }}></div>
                      </div>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="font-medium text-sm mb-1">Checkout Completion</div>
                      <div className="text-xs text-gray-600 mb-2">Form optimization reduces abandonment by 24%</div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-purple-600 h-2 rounded-full" style={{ width: '76%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Efficiency Benefits */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Operational Efficiency & Time Savings</h3>
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-6 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 mb-2">18%</div>
                    <div className="text-sm font-medium text-gray-800">Customer Support Reduction</div>
                    <div className="text-xs text-gray-600 mt-2">
                      Better FAQ organization and self-service options reduce support tickets
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 mb-2">31 hrs</div>
                    <div className="text-sm font-medium text-gray-800">Weekly Time Savings</div>
                    <div className="text-xs text-gray-600 mt-2">
                      Automated personalization reduces manual campaign management
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600 mb-2">$47K</div>
                    <div className="text-sm font-medium text-gray-800">Annual Operational Savings</div>
                    <div className="text-xs text-gray-600 mt-2">
                      Reduced support costs and improved team efficiency
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Risk Mitigation Benefits */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Risk Mitigation & Downside Protection</h3>
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border-l-4 border-green-400 rounded-lg">
                  <div className="font-medium text-green-800 mb-2">Revenue Diversification</div>
                  <div className="text-sm text-green-700 mb-2">
                    Multiple optimization levers reduce dependency on single traffic sources or campaigns
                  </div>
                  <div className="text-xs text-gray-600">
                    <strong>Protection:</strong> 15% buffer against seasonal traffic fluctuations
                  </div>
                </div>
                <div className="p-4 bg-blue-50 border-l-4 border-blue-400 rounded-lg">
                  <div className="font-medium text-blue-800 mb-2">Competitive Advantage</div>
                  <div className="text-sm text-blue-700 mb-2">
                    Advanced personalization creates barriers to competitive customer acquisition
                  </div>
                  <div className="text-xs text-gray-600">
                    <strong>Protection:</strong> Estimated 23% reduction in customer churn to competitors
                  </div>
                </div>
                <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg">
                  <div className="font-medium text-yellow-800 mb-2">Technology Future-Proofing</div>
                  <div className="text-sm text-yellow-700 mb-2">
                    Modern optimization infrastructure supports future growth and feature development
                  </div>
                  <div className="text-xs text-gray-600">
                    <strong>Protection:</strong> Avoid $200K+ in technical debt and platform migration costs
                  </div>
                </div>
              </div>
            </div>

            {/* Competitive Advantages */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Market Positioning & Differentiation Gains</h3>
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="font-medium text-purple-800 mb-4">Market Advantages</h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-start gap-3">
                        <CheckSquare className="h-4 w-4 text-green-600 mt-0.5" />
                        <span>First-mover advantage in personalized shopping experiences within our market segment</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckSquare className="h-4 w-4 text-blue-600 mt-0.5" />
                        <span>Superior conversion rates strengthen position in paid advertising auctions</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckSquare className="h-4 w-4 text-purple-600 mt-0.5" />
                        <span>Enhanced customer data collection enables more sophisticated targeting</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckSquare className="h-4 w-4 text-orange-600 mt-0.5" />
                        <span>Improved user experience creates word-of-mouth marketing opportunities</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-pink-800 mb-4">Long-term Benefits</h4>
                    <div className="space-y-3 text-sm">
                      <div className="p-3 bg-white rounded border">
                        <div className="font-medium">Customer Lifetime Value</div>
                        <div className="text-xs text-gray-600">Expected increase: +$89 per customer</div>
                      </div>
                      <div className="p-3 bg-white rounded border">
                        <div className="font-medium">Brand Loyalty Score</div>
                        <div className="text-xs text-gray-600">Projected improvement: +27%</div>
                      </div>
                      <div className="p-3 bg-white rounded border">
                        <div className="font-medium">Market Share Growth</div>
                        <div className="text-xs text-gray-600">Conservative estimate: +2.3%</div>
                      </div>
                      <div className="p-3 bg-white rounded border">
                        <div className="font-medium">Innovation Pipeline</div>
                        <div className="text-xs text-gray-600">Platform for future AI/ML initiatives</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderSuccessMetrics = () => (
    <div className="space-y-6">
      {/* Measurement Framework */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-6 w-6 text-blue-600" />
            Success Measurement Framework
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {/* Primary KPIs */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Primary KPIs & Success Criteria</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-green-800">Core Business Metrics</h4>
                  <div className="space-y-3">
                    <div className="p-4 bg-green-50 border-l-4 border-green-400 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-sm">Conversion Rate</span>
                        <Badge className="bg-green-100 text-green-800">Primary KPI</Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div><strong>Baseline:</strong> 2.3%</div>
                        <div><strong>Target:</strong> 3.1%</div>
                        <div><strong>Threshold:</strong> 2.8%</div>
                      </div>
                      <div className="text-xs text-gray-600 mt-2">
                        <strong>Measurement:</strong> Google Analytics enhanced ecommerce, daily tracking
                      </div>
                    </div>
                    <div className="p-4 bg-blue-50 border-l-4 border-blue-400 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-sm">Revenue per Visitor (RPV)</span>
                        <Badge className="bg-blue-100 text-blue-800">Primary KPI</Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div><strong>Baseline:</strong> $2.92</div>
                        <div><strong>Target:</strong> $3.94</div>
                        <div><strong>Threshold:</strong> $3.35</div>
                      </div>
                      <div className="text-xs text-gray-600 mt-2">
                        <strong>Measurement:</strong> Revenue / Unique visitors, weekly segmentation analysis
                      </div>
                    </div>
                    <div className="p-4 bg-purple-50 border-l-4 border-purple-400 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-sm">Average Order Value (AOV)</span>
                        <Badge className="bg-purple-100 text-purple-800">Secondary KPI</Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div><strong>Baseline:</strong> $127</div>
                        <div><strong>Target:</strong> $150</div>
                        <div><strong>Threshold:</strong> $140</div>
                      </div>
                      <div className="text-xs text-gray-600 mt-2">
                        <strong>Measurement:</strong> Total revenue / Number of orders, daily tracking
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-medium text-blue-800">Experience & Engagement</h4>
                  <div className="space-y-3">
                    <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-sm">Page Load Speed</span>
                        <Badge className="bg-yellow-100 text-yellow-800">Technical KPI</Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div><strong>Baseline:</strong> 3.2s</div>
                        <div><strong>Target:</strong> 1.4s</div>
                        <div><strong>Threshold:</strong> 1.8s</div>
                      </div>
                      <div className="text-xs text-gray-600 mt-2">
                        <strong>Measurement:</strong> Core Web Vitals, Lighthouse scores, real user monitoring
                      </div>
                    </div>
                    <div className="p-4 bg-orange-50 border-l-4 border-orange-400 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-sm">Cart Abandonment Rate</span>
                        <Badge className="bg-orange-100 text-orange-800">Behavioral KPI</Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div><strong>Baseline:</strong> 73.2%</div>
                        <div><strong>Target:</strong> 61.8%</div>
                        <div><strong>Threshold:</strong> 67.0%</div>
                      </div>
                      <div className="text-xs text-gray-600 mt-2">
                        <strong>Measurement:</strong> Checkout funnel analysis, exit intent tracking
                      </div>
                    </div>
                    <div className="p-4 bg-red-50 border-l-4 border-red-400 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-sm">Customer Satisfaction</span>
                        <Badge className="bg-red-100 text-red-800">Quality KPI</Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div><strong>Baseline:</strong> 7.8/10</div>
                        <div><strong>Target:</strong> 8.5/10</div>
                        <div><strong>Threshold:</strong> 8.2/10</div>
                      </div>
                      <div className="text-xs text-gray-600 mt-2">
                        <strong>Measurement:</strong> Post-purchase surveys, NPS scores, support ticket sentiment
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Secondary Metrics */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Secondary Metrics & Diagnostic Measures</h3>
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <h4 className="font-medium text-purple-800 mb-3">Traffic & Engagement</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Session Duration</span>
                        <span className="text-gray-600">+47% target</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Pages per Session</span>
                        <span className="text-gray-600">+23% target</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Bounce Rate</span>
                        <span className="text-gray-600">-18% target</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Return Visitor Rate</span>
                        <span className="text-gray-600">+31% target</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-green-800 mb-3">Personalization Performance</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Segment Conversion Lift</span>
                        <span className="text-gray-600">Track by audience</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Personalization Coverage</span>
                        <span className="text-gray-600">85% of traffic</span>
                      </div>
                      <div className="flex justify-between">
                        <span>A/B Test Win Rate</span>
                        <span className="text-gray-600">78% target</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Recommendation CTR</span>
                        <span className="text-gray-600">12% baseline</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-blue-800 mb-3">Technical Performance</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Core Web Vitals</span>
                        <span className="text-gray-600">Pass all metrics</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Error Rate</span>
                        <span className="text-gray-600">&lt;0.1% target</span>
                      </div>
                      <div className="flex justify-between">
                        <span>API Response Time</span>
                        <span className="text-gray-600">&lt;200ms avg</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Uptime</span>
                        <span className="text-gray-600">99.9% SLA</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Measurement Timeline */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Measurement Timeline & Tracking Schedule</h3>
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border">
                  <h4 className="font-medium text-green-800 mb-3">Daily Tracking (Automated)</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <strong>Revenue Metrics</strong>
                      <ul className="text-xs text-gray-600 mt-1">
                        <li>• Conversion rate</li>
                        <li>• Revenue per visitor</li>
                        <li>• Average order value</li>
                      </ul>
                    </div>
                    <div>
                      <strong>Traffic Analysis</strong>
                      <ul className="text-xs text-gray-600 mt-1">
                        <li>• Session metrics</li>
                        <li>• Bounce rates</li>
                        <li>• Page performance</li>
                      </ul>
                    </div>
                    <div>
                      <strong>Technical Health</strong>
                      <ul className="text-xs text-gray-600 mt-1">
                        <li>• Page load speeds</li>
                        <li>• Error rates</li>
                        <li>• API performance</li>
                      </ul>
                    </div>
                    <div>
                      <strong>A/B Test Status</strong>
                      <ul className="text-xs text-gray-600 mt-1">
                        <li>• Statistical significance</li>
                        <li>• Confidence intervals</li>
                        <li>• Sample size progress</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-3">Weekly Reviews</h4>
                    <div className="text-sm text-gray-600 space-y-2">
                      <div>• Comprehensive performance analysis</div>
                      <div>• A/B test results evaluation</div>
                      <div>• Personalization segment performance</div>
                      <div>• Stakeholder progress reporting</div>
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium text-purple-800 mb-3">Monthly Deep Dives</h4>
                    <div className="text-sm text-gray-600 space-y-2">
                      <div>• Customer journey analysis</div>
                      <div>• ROI and revenue attribution</div>
                      <div>• Competitive benchmarking</div>
                      <div>• Strategic recommendations review</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Reporting Schedule */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Dashboard Updates & Stakeholder Communication</h3>
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="font-medium text-blue-800 mb-4">Automated Reporting</h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-2 bg-white rounded">
                        <Badge className="bg-green-100 text-green-800">Real-time</Badge>
                        <span className="text-sm">Executive dashboard updates</span>
                      </div>
                      <div className="flex items-center gap-3 p-2 bg-white rounded">
                        <Badge className="bg-blue-100 text-blue-800">Daily</Badge>
                        <span className="text-sm">Performance summary emails</span>
                      </div>
                      <div className="flex items-center gap-3 p-2 bg-white rounded">
                        <Badge className="bg-purple-100 text-purple-800">Weekly</Badge>
                        <span className="text-sm">Comprehensive analytics reports</span>
                      </div>
                      <div className="flex items-center gap-3 p-2 bg-white rounded">
                        <Badge className="bg-orange-100 text-orange-800">Monthly</Badge>
                        <span className="text-sm">ROI and strategic impact analysis</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-purple-800 mb-4">Stakeholder Communications</h4>
                    <div className="space-y-3 text-sm">
                      <div className="p-3 bg-white rounded border">
                        <div className="font-medium">Executive Team</div>
                        <div className="text-xs text-gray-600">Weekly revenue impact summary + monthly strategic review</div>
                      </div>
                      <div className="p-3 bg-white rounded border">
                        <div className="font-medium">Marketing Team</div>
                        <div className="text-xs text-gray-600">Daily performance alerts + bi-weekly optimization recommendations</div>
                      </div>
                      <div className="p-3 bg-white rounded border">
                        <div className="font-medium">Development Team</div>
                        <div className="text-xs text-gray-600">Technical performance metrics + A/B test status updates</div>
                      </div>
                      <div className="p-3 bg-white rounded border">
                        <div className="font-medium">Customer Service</div>
                        <div className="text-xs text-gray-600">Customer satisfaction trends + feature impact summaries</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Threshold Settings */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Success, Warning & Failure Indicators</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-green-50 border-l-4 border-green-400 rounded-lg">
                  <h4 className="font-medium text-green-800 mb-3">Success Indicators</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Conversion Rate:</span>
                      <span className="text-green-600 font-medium">≥ 2.8%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Revenue Lift:</span>
                      <span className="text-green-600 font-medium">≥ +15%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>A/B Test Win Rate:</span>
                      <span className="text-green-600 font-medium">≥ 70%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Page Load Speed:</span>
                      <span className="text-green-600 font-medium">≤ 1.8s</span>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg">
                  <h4 className="font-medium text-yellow-800 mb-3">Warning Indicators</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Conversion Rate:</span>
                      <span className="text-yellow-600 font-medium">2.4% - 2.7%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Revenue Lift:</span>
                      <span className="text-yellow-600 font-medium">+5% - +14%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>A/B Test Win Rate:</span>
                      <span className="text-yellow-600 font-medium">50% - 69%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Page Load Speed:</span>
                      <span className="text-yellow-600 font-medium">1.9s - 2.5s</span>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-red-50 border-l-4 border-red-400 rounded-lg">
                  <h4 className="font-medium text-red-800 mb-3">Critical Indicators</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Conversion Rate:</span>
                      <span className="text-red-600 font-medium">&lt; 2.4%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Revenue Lift:</span>
                      <span className="text-red-600 font-medium">&lt; +5%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>A/B Test Win Rate:</span>
                      <span className="text-red-600 font-medium">&lt; 50%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Page Load Speed:</span>
                      <span className="text-red-600 font-medium">&gt; 2.5s</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Attribution Models */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Revenue Attribution Models & Impact Measurement</h3>
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-6 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="font-medium text-gray-800 mb-4">Attribution Methodology</h4>
                    <div className="space-y-3 text-sm">
                      <div className="p-3 bg-white rounded border">
                        <div className="font-medium">Direct Attribution (60% weight)</div>
                        <div className="text-xs text-gray-600">Revenue directly measurable from A/B test winners and personalization segments</div>
                      </div>
                      <div className="p-3 bg-white rounded border">
                        <div className="font-medium">Indirect Attribution (30% weight)</div>
                        <div className="text-xs text-gray-600">Improved user experience leading to higher lifetime value and retention</div>
                      </div>
                      <div className="p-3 bg-white rounded border">
                        <div className="font-medium">Operational Attribution (10% weight)</div>
                        <div className="text-xs text-gray-600">Cost savings from reduced support tickets and improved efficiency</div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-blue-800 mb-4">Measurement Framework</h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between items-center p-2 bg-white rounded">
                        <span>Statistical Significance</span>
                        <Badge className="bg-blue-100 text-blue-800">95% confidence</Badge>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-white rounded">
                        <span>Attribution Window</span>
                        <Badge className="bg-green-100 text-green-800">30-day view</Badge>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-white rounded">
                        <span>Baseline Comparison</span>
                        <Badge className="bg-purple-100 text-purple-800">Pre-launch data</Badge>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-white rounded">
                        <span>Cross-channel Impact</span>
                        <Badge className="bg-orange-100 text-orange-800">Full funnel</Badge>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-6 p-4 bg-white rounded border-l-4 border-blue-400">
                  <div className="font-medium text-blue-800 mb-2">Incremental Revenue Calculation</div>
                  <div className="text-sm text-gray-700">
                    Monthly incremental revenue = (Test conversion rate - Control conversion rate) ×
                    Monthly visitors × Average order value × Attribution confidence factor
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Placeholder functions for other sections
  const renderMaturityContent = (tier3: string) => renderDefaultContent();
  const renderPhasesContent = (tier3: string) => renderDefaultContent();
  const renderRoadmapContent = (tier3: string) => renderDefaultContent();

  // Render specific DXP Tools content based on detailed guidance
  const renderDXPToolsContent = () => {
    if (mappingType !== 'Optimizely DXP Tools' || !tier2Name || !tier3Name) {
      return renderDefaultContent();
    }

    switch (tier2Name.toLowerCase()) {
      case 'content-recs':
      case 'content recs':
        return renderContentRecsContent(tier3Name);
      case 'cms':
        return renderCMSContent(tier3Name);
      case 'odp':
        return renderODPContent(tier3Name);
      case 'webx':
        return renderWebXContent(tier3Name);
      case 'cmp':
        return renderCMPContent(tier3Name);
      default:
        return renderDefaultContent();
    }
  };

  // Content Recommendations Section Content
  const renderContentRecsContent = (tier3: string) => {
    const tier3Lower = tier3.toLowerCase().replace(/\s+/g, '-');

    switch (tier3Lower) {
      case 'visitor-analytics-dashboard':
        return renderVisitorAnalyticsDashboard();
      case 'content-performance-metrics':
        return renderContentPerformanceMetrics();
      case 'recommendation-algorithms':
        return renderRecommendationAlgorithms();
      case 'a/b-testing-results':
      case 'ab-testing-results':
        return renderABTestingResults();
      case 'personalization-effectiveness':
        return renderPersonalizationEffectiveness();
      default:
        return renderContentRecsMainPage();
    }
  };

  const renderContentRecsMainPage = () => (
    <div className="space-y-6">
      {/* Executive Summary Widget */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-blue-600" />
            Content Recommendations Executive Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="text-2xl font-bold text-green-600">23.4%</div>
              <div className="text-sm text-gray-600">CTR</div>
              <div className="text-xs text-green-600">+5.2% vs last month</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold text-blue-600">89%</div>
              <div className="text-sm text-gray-600">Engagement Rate</div>
              <div className="text-xs text-blue-600">+3.1% improvement</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold text-purple-600">+34%</div>
              <div className="text-sm text-gray-600">Conversion Lift</div>
              <div className="text-xs text-purple-600">vs. non-personalized</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold text-orange-600">$1.2M</div>
              <div className="text-sm text-gray-600">Revenue Impact</div>
              <div className="text-xs text-orange-600">Last 30 days</div>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* AI-Powered Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-6 w-6 text-green-600" />
            Top 3 AI-Powered Optimization Opportunities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border-l-4 border-green-400 rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium text-green-800">Personalize Product Categories</h4>
                <Badge className="bg-green-100 text-green-800">+28% Expected Lift</Badge>
              </div>
              <p className="text-sm text-gray-600">Machine learning identified opportunity to personalize category recommendations based on browsing history</p>
            </div>
            <div className="p-4 bg-blue-50 border-l-4 border-blue-400 rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium text-blue-800">Optimize Recommendation Timing</h4>
                <Badge className="bg-blue-100 text-blue-800">+19% Expected Lift</Badge>
              </div>
              <p className="text-sm text-gray-600">Show recommendations after 45 seconds instead of immediately for better engagement</p>
            </div>
            <div className="p-4 bg-purple-50 border-l-4 border-purple-400 rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium text-purple-800">Cross-Sell Algorithm Enhancement</h4>
                <Badge className="bg-purple-100 text-purple-800">+15% Expected Lift</Badge>
              </div>
              <p className="text-sm text-gray-600">Implement collaborative filtering to improve cross-sell recommendation accuracy</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions Panel */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button className="flex items-center gap-2 h-12">
              <Target className="h-4 w-4" />
              Create Strategy
            </Button>
            <Button variant="outline" className="flex items-center gap-2 h-12">
              <Eye className="h-4 w-4" />
              Review Results
            </Button>
            <Button variant="outline" className="flex items-center gap-2 h-12">
              <Settings className="h-4 w-4" />
              Configure Rules
            </Button>
            <Button variant="outline" className="flex items-center gap-2 h-12">
              <BarChart3 className="h-4 w-4" />
              View Analytics
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Performance Trend Graph */}
      <Card>
        <CardHeader>
          <CardTitle>30-Day Recommendation Effectiveness Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">+23%</div>
                <div className="text-sm text-gray-600">Week 1-2 Improvement</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">+34%</div>
                <div className="text-sm text-gray-600">Week 3-4 Performance</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">Peak</div>
                <div className="text-sm text-gray-600">Current Performance</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ROI Calculator */}
      <Card>
        <CardHeader>
          <CardTitle>Real-Time Revenue Impact Calculator</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">$1.2M</div>
                <div className="text-sm text-gray-600">Monthly Revenue Impact</div>
                <div className="text-xs text-gray-500">From recommendations</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">4.2x</div>
                <div className="text-sm text-gray-600">ROI Multiple</div>
                <div className="text-xs text-gray-500">Return on investment</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">$89</div>
                <div className="text-sm text-gray-600">Revenue per User</div>
                <div className="text-xs text-gray-500">With recommendations</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderVisitorAnalyticsDashboard = () => (
    <div className="space-y-6">
      {/* Real-Time Visitor Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-6 w-6 text-blue-600" />
            Real-Time Visitor Heatmap
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-4">Geographic Distribution</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                  <span className="text-sm">United States</span>
                  <span className="font-bold">45%</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                  <span className="text-sm">Canada</span>
                  <span className="font-bold">18%</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-purple-50 rounded">
                  <span className="text-sm">United Kingdom</span>
                  <span className="font-bold">12%</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-orange-50 rounded">
                  <span className="text-sm">Australia</span>
                  <span className="font-bold">8%</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="text-sm">Other</span>
                  <span className="font-bold">17%</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-4">Engagement Patterns</h4>
              <div className="space-y-3">
                <div className="p-3 border rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">High Engagement Sessions</span>
                    <Badge className="bg-green-100 text-green-800">2,847</Badge>
                  </div>
                  <div className="text-xs text-gray-600">Users with 5+ page views and 3+ minutes session time</div>
                </div>
                <div className="p-3 border rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Bounce Rate</span>
                    <Badge className="bg-yellow-100 text-yellow-800">23.4%</Badge>
                  </div>
                  <div className="text-xs text-gray-600">Single page visits with no engagement</div>
                </div>
                <div className="p-3 border rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Average Session Duration</span>
                    <Badge className="bg-blue-100 text-blue-800">4m 32s</Badge>
                  </div>
                  <div className="text-xs text-gray-600">Mean time spent across all visitor sessions</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Behavioral Segmentation Matrix */}
      <Card>
        <CardHeader>
          <CardTitle>Behavioral Segmentation Matrix</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 border-l-4 border-green-400 rounded-lg">
              <h4 className="font-medium text-green-800 mb-2">Power Users (12%)</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <div>Recommendation CTR: 34.2%</div>
                <div>Avg. Session: 8m 23s</div>
                <div>Conversion Rate: 8.1%</div>
                <div>Revenue Impact: +127%</div>
              </div>
            </div>
            <div className="p-4 bg-blue-50 border-l-4 border-blue-400 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">Engaged Browsers (45%)</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <div>Recommendation CTR: 18.7%</div>
                <div>Avg. Session: 4m 12s</div>
                <div>Conversion Rate: 3.4%</div>
                <div>Revenue Impact: +23%</div>
              </div>
            </div>
            <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg">
              <h4 className="font-medium text-yellow-800 mb-2">Casual Visitors (43%)</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <div>Recommendation CTR: 8.3%</div>
                <div>Avg. Session: 1m 45s</div>
                <div>Conversion Rate: 1.2%</div>
                <div>Revenue Impact: +8%</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderContentPerformanceMetrics = () => (
    <div className="space-y-6">
      {/* Performance Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-blue-600" />
            Performance Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-green-800 mb-3">Top Performers</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                    <span className="text-sm">Product Carousel #3</span>
                    <Badge className="bg-green-100 text-green-800">98/100</Badge>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                    <span className="text-sm">Homepage Recommendations</span>
                    <Badge className="bg-green-100 text-green-800">94/100</Badge>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                    <span className="text-sm">Cross-sell Widget</span>
                    <Badge className="bg-green-100 text-green-800">87/100</Badge>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-red-800 mb-3">Needs Attention</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-2 bg-red-50 rounded">
                    <span className="text-sm">Category Filter Suggestions</span>
                    <Badge className="bg-red-100 text-red-800">34/100</Badge>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-red-50 rounded">
                    <span className="text-sm">Search Result Recommendations</span>
                    <Badge className="bg-red-100 text-red-800">41/100</Badge>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-yellow-50 rounded">
                    <span className="text-sm">Recently Viewed Items</span>
                    <Badge className="bg-yellow-100 text-yellow-800">58/100</Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderRecommendationAlgorithms = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Algorithm Performance Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 border-l-4 border-blue-400 rounded-lg">
              <h4 className="font-medium text-blue-800">Collaborative Filtering</h4>
              <div className="text-sm text-gray-600 space-y-1 mt-2">
                <div>CTR: 28.4% (+12% vs baseline)</div>
                <div>Precision: 0.847</div>
                <div>Recall: 0.623</div>
                <div>Revenue Lift: +34%</div>
              </div>
            </div>
            <div className="p-4 bg-green-50 border-l-4 border-green-400 rounded-lg">
              <h4 className="font-medium text-green-800">Content-Based Filtering</h4>
              <div className="text-sm text-gray-600 space-y-1 mt-2">
                <div>CTR: 21.7% (+3% vs baseline)</div>
                <div>Precision: 0.712</div>
                <div>Recall: 0.789</div>
                <div>Revenue Lift: +18%</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderABTestingResults = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Statistical Significance Calculator</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">95.3%</div>
              <div className="text-sm text-gray-600">Confidence Level</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">+23.4%</div>
              <div className="text-sm text-gray-600">Performance Lift</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-purple-600">12,847</div>
              <div className="text-sm text-gray-600">Sample Size</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderPersonalizationEffectiveness = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Personalization Lift Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium text-green-800">Personalized Performance</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">CTR</span>
                  <span className="font-medium text-green-600">28.4%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Conversion Rate</span>
                  <span className="font-medium text-green-600">4.7%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Revenue per User</span>
                  <span className="font-medium text-green-600">$127</span>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="font-medium text-gray-800">Generic Performance</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">CTR</span>
                  <span className="font-medium text-gray-600">18.2%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Conversion Rate</span>
                  <span className="font-medium text-gray-600">2.9%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Revenue per User</span>
                  <span className="font-medium text-gray-600">$83</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // CMS Section Content
  const renderCMSContent = (tier3: string) => {
    const tier3Lower = tier3.toLowerCase().replace(/\s+/g, '-');

    switch (tier3Lower) {
      case 'content-inventory':
        return renderContentInventory();
      case 'publishing-workflows':
        return renderPublishingWorkflows();
      case 'content-performance':
        return renderCMSContentPerformance();
      case 'seo-optimization':
        return renderSEOOptimization();
      case 'multi-channel-publishing':
        return renderMultiChannelPublishing();
      default:
        return renderCMSMainPage();
    }
  };

  const renderCMSMainPage = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-blue-600" />
            Content Health Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">87/100</div>
              <div className="text-sm text-gray-600">Overall Content Quality</div>
              <div className="text-xs text-green-600">+5 pts this month</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">1,247</div>
              <div className="text-sm text-gray-600">Active Content Pieces</div>
              <div className="text-xs text-blue-600">+23 new this week</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-purple-600">94%</div>
              <div className="text-sm text-gray-600">Publishing Success Rate</div>
              <div className="text-xs text-purple-600">On-time delivery</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-orange-600">6.2s</div>
              <div className="text-sm text-gray-600">Avg Page Load Time</div>
              <div className="text-xs text-orange-600">-0.3s improvement</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Publishing Pipeline Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-blue-50 border-l-4 border-blue-400 rounded-lg">
              <span className="font-medium">In Review</span>
              <Badge className="bg-blue-100 text-blue-800">12 items</Badge>
            </div>
            <div className="flex justify-between items-center p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg">
              <span className="font-medium">Pending Approval</span>
              <Badge className="bg-yellow-100 text-yellow-800">8 items</Badge>
            </div>
            <div className="flex justify-between items-center p-3 bg-green-50 border-l-4 border-green-400 rounded-lg">
              <span className="font-medium">Ready to Publish</span>
              <Badge className="bg-green-100 text-green-800">5 items</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderContentInventory = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Smart Content Catalog</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Blog Posts</h4>
              <div className="text-2xl font-bold text-blue-600">347</div>
              <div className="text-sm text-gray-600">Published articles</div>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Product Pages</h4>
              <div className="text-2xl font-bold text-green-600">1,234</div>
              <div className="text-sm text-gray-600">Active products</div>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Landing Pages</h4>
              <div className="text-2xl font-bold text-purple-600">89</div>
              <div className="text-sm text-gray-600">Campaign pages</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // ODP Section Content
  const renderODPContent = (tier3: string) => {
    const tier3Lower = tier3.toLowerCase().replace(/\s+/g, '-');

    switch (tier3Lower) {
      case 'customer-profiles':
        return renderCustomerProfiles();
      case 'audience-segments':
        return renderAudienceSegments();
      case 'journey-analytics':
        return renderJourneyAnalytics();
      case 'real-time-events':
        return renderRealTimeEvents();
      case 'data-integration-status':
        return renderDataIntegrationStatus();
      default:
        return renderODPMainPage();
    }
  };

  const renderODPMainPage = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-6 w-6 text-blue-600" />
            Customer Data Platform Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">847K</div>
              <div className="text-sm text-gray-600">Total Profiles</div>
              <div className="text-xs text-blue-600">+12K this month</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">23</div>
              <div className="text-sm text-gray-600">Active Segments</div>
              <div className="text-xs text-green-600">+3 new segments</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-purple-600">98.7%</div>
              <div className="text-sm text-gray-600">Data Quality Score</div>
              <div className="text-xs text-purple-600">Excellent health</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-orange-600">2.3M</div>
              <div className="text-sm text-gray-600">Events/Day</div>
              <div className="text-xs text-orange-600">Real-time processing</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderCustomerProfiles = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Unified Customer View</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-4">Profile Completeness</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Behavioral Data</span>
                  <Badge className="bg-green-100 text-green-800">94%</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Demographic Data</span>
                  <Badge className="bg-yellow-100 text-yellow-800">76%</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Transactional Data</span>
                  <Badge className="bg-green-100 text-green-800">89%</Badge>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-4">Predictive Insights</h4>
              <div className="space-y-3">
                <div className="p-3 border rounded-lg">
                  <div className="text-sm font-medium">Churn Risk</div>
                  <div className="text-xs text-gray-600">12% of customers at high risk</div>
                </div>
                <div className="p-3 border rounded-lg">
                  <div className="text-sm font-medium">Lifetime Value</div>
                  <div className="text-xs text-gray-600">Avg predicted CLV: $1,247</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // WebX Section Content
  const renderWebXContent = (tier3: string) => {
    const tier3Lower = tier3.toLowerCase().replace(/\s+/g, '-');

    switch (tier3Lower) {
      case 'active-experiments':
        return renderActiveExperiments();
      case 'results-analysis':
        return renderResultsAnalysis();
      case 'statistical-significance':
        return renderStatisticalSignificance();
      case 'conversion-impact':
        return renderConversionImpact();
      case 'test-configuration':
        return renderTestConfiguration();
      default:
        return renderWebXMainPage();
    }
  };

  const renderWebXMainPage = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-6 w-6 text-blue-600" />
            Web Experimentation Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">12</div>
              <div className="text-sm text-gray-600">Active Experiments</div>
              <div className="text-xs text-blue-600">3 launching this week</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">87%</div>
              <div className="text-sm text-gray-600">Test Win Rate</div>
              <div className="text-xs text-green-600">Above industry avg</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-purple-600">+23%</div>
              <div className="text-sm text-gray-600">Avg Conversion Lift</div>
              <div className="text-xs text-purple-600">Winning variations</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-orange-600">$1.2M</div>
              <div className="text-sm text-gray-600">Revenue Impact</div>
              <div className="text-xs text-orange-600">Last 6 months</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderActiveExperiments = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Experiment Status Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border-l-4 border-green-400 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-medium text-green-800">Homepage Hero Test</h4>
                  <div className="text-sm text-gray-600">Testing new CTA placement</div>
                </div>
                <Badge className="bg-green-100 text-green-800">95% Power</Badge>
              </div>
            </div>
            <div className="p-4 bg-blue-50 border-l-4 border-blue-400 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-medium text-blue-800">Product Page Layout</h4>
                  <div className="text-sm text-gray-600">Grid vs list view comparison</div>
                </div>
                <Badge className="bg-blue-100 text-blue-800">67% Power</Badge>
              </div>
            </div>
            <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-medium text-yellow-800">Checkout Flow A/B</h4>
                  <div className="text-sm text-gray-600">Single vs multi-step checkout</div>
                </div>
                <Badge className="bg-yellow-100 text-yellow-800">23% Power</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // CMP Section Content
  const renderCMPContent = (tier3: string) => {
    const tier3Lower = tier3.toLowerCase().replace(/\s+/g, '-');

    switch (tier3Lower) {
      case 'campaign-performance':
        return renderCampaignPerformance();
      case 'email-analytics':
        return renderEmailAnalytics();
      case 'automation-workflows':
        return renderAutomationWorkflows();
      case 'audience-targeting':
        return renderAudienceTargeting();
      case 'roi-analysis':
        return renderROIAnalysis();
      default:
        return renderCMPMainPage();
    }
  };

  const renderCMPMainPage = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-6 w-6 text-blue-600" />
            Campaign Management Platform Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">47</div>
              <div className="text-sm text-gray-600">Active Campaigns</div>
              <div className="text-xs text-blue-600">8 launching this week</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">24.7%</div>
              <div className="text-sm text-gray-600">Avg Open Rate</div>
              <div className="text-xs text-green-600">+2.3% vs last month</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-purple-600">3.8%</div>
              <div className="text-sm text-gray-600">Click-Through Rate</div>
              <div className="text-xs text-purple-600">Above industry avg</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-orange-600">$847K</div>
              <div className="text-sm text-gray-600">Revenue Generated</div>
              <div className="text-xs text-orange-600">This quarter</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Campaign Performance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-xl font-bold text-green-600">89%</div>
                <div className="text-sm text-gray-600">Delivery Rate</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-xl font-bold text-blue-600">1.2%</div>
                <div className="text-sm text-gray-600">Bounce Rate</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-xl font-bold text-purple-600">0.3%</div>
                <div className="text-sm text-gray-600">Unsubscribe Rate</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderCampaignPerformance = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Campaign Performance Scorecard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">24.7%</div>
              <div className="text-sm text-gray-600">Open Rate</div>
              <div className="text-xs text-green-600">+2.3% improvement</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">3.8%</div>
              <div className="text-sm text-gray-600">Click-Through Rate</div>
              <div className="text-xs text-blue-600">Above benchmark</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-purple-600">2.1%</div>
              <div className="text-sm text-gray-600">Conversion Rate</div>
              <div className="text-xs text-purple-600">Strong performance</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-orange-600">4.2x</div>
              <div className="text-sm text-gray-600">ROI Multiple</div>
              <div className="text-xs text-orange-600">Excellent return</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Additional CMS sub-page functions
  const renderPublishingWorkflows = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Workflow Efficiency Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">2.3 days</div>
              <div className="text-sm text-gray-600">Avg Time to Publish</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">94%</div>
              <div className="text-sm text-gray-600">On-time Delivery Rate</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-purple-600">3</div>
              <div className="text-sm text-gray-600">Avg Review Cycles</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderCMSContentPerformance = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Performance Trending Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">+23%</div>
              <div className="text-sm text-gray-600">Engagement Growth</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">4.7/5</div>
              <div className="text-sm text-gray-600">Content Quality Score</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-purple-600">87%</div>
              <div className="text-sm text-gray-600">Content Utilization</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-orange-600">12K</div>
              <div className="text-sm text-gray-600">Monthly Page Views</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderSEOOptimization = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>SEO Score Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">92/100</div>
              <div className="text-sm text-gray-600">Overall SEO Score</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">847</div>
              <div className="text-sm text-gray-600">Keywords Ranking</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-purple-600">1.8s</div>
              <div className="text-sm text-gray-600">Page Load Speed</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-orange-600">98%</div>
              <div className="text-sm text-gray-600">Mobile Optimization</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderMultiChannelPublishing = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Channel Performance Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border-l-4 border-blue-400 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">Website</span>
                <Badge className="bg-blue-100 text-blue-800">Primary Channel</Badge>
              </div>
              <div className="text-sm text-gray-600 mt-1">847K monthly visitors, 3.2% conversion rate</div>
            </div>
            <div className="p-4 bg-green-50 border-l-4 border-green-400 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">Email Newsletter</span>
                <Badge className="bg-green-100 text-green-800">High Performance</Badge>
              </div>
              <div className="text-sm text-gray-600 mt-1">23.4% open rate, 4.7% click-through rate</div>
            </div>
            <div className="p-4 bg-purple-50 border-l-4 border-purple-400 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">Social Media</span>
                <Badge className="bg-purple-100 text-purple-800">Growing Channel</Badge>
              </div>
              <div className="text-sm text-gray-600 mt-1">124K followers, 8.3% engagement rate</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Additional ODP sub-page functions
  const renderAudienceSegments = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Segment Performance Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 border-l-4 border-blue-400 rounded-lg">
              <h4 className="font-medium text-blue-800">High-Value Customers</h4>
              <div className="text-sm text-gray-600 mt-2">
                <div>Size: 12,847 profiles</div>
                <div>Avg Order Value: $247</div>
                <div>Conversion Rate: 8.3%</div>
              </div>
            </div>
            <div className="p-4 bg-green-50 border-l-4 border-green-400 rounded-lg">
              <h4 className="font-medium text-green-800">Frequent Buyers</h4>
              <div className="text-sm text-gray-600 mt-2">
                <div>Size: 34,129 profiles</div>
                <div>Avg Order Value: $127</div>
                <div>Conversion Rate: 5.7%</div>
              </div>
            </div>
            <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg">
              <h4 className="font-medium text-yellow-800">New Prospects</h4>
              <div className="text-sm text-gray-600 mt-2">
                <div>Size: 89,234 profiles</div>
                <div>Avg Order Value: $67</div>
                <div>Conversion Rate: 2.1%</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderJourneyAnalytics = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Customer Journey Flow Visualization</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Top Customer Paths</h4>
              <div className="space-y-2">
                <div className="text-sm">Awareness → Consideration → Purchase: 23% of customers</div>
                <div className="text-sm">Direct Purchase → Loyalty: 18% of customers</div>
                <div className="text-sm">Social → Email → Purchase: 15% of customers</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderRealTimeEvents = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Live Event Stream Monitor</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 border rounded-lg">
                <div className="text-2xl font-bold text-blue-600">2.3M</div>
                <div className="text-sm text-gray-600">Events Today</div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-2xl font-bold text-green-600">847</div>
                <div className="text-sm text-gray-600">Events/Minute</div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-2xl font-bold text-purple-600">98.7%</div>
                <div className="text-sm text-gray-600">Processing Success</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderDataIntegrationStatus = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Integration Health Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border-l-4 border-green-400 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium text-green-800">Salesforce CRM</span>
                <Badge className="bg-green-100 text-green-800">Connected</Badge>
              </div>
              <div className="text-xs text-gray-600 mt-1">Last sync: 2 minutes ago</div>
            </div>
            <div className="p-4 bg-green-50 border-l-4 border-green-400 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium text-green-800">Marketing Automation</span>
                <Badge className="bg-green-100 text-green-800">Connected</Badge>
              </div>
              <div className="text-xs text-gray-600 mt-1">Last sync: 5 minutes ago</div>
            </div>
            <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium text-yellow-800">E-commerce Platform</span>
                <Badge className="bg-yellow-100 text-yellow-800">Syncing</Badge>
              </div>
              <div className="text-xs text-gray-600 mt-1">Sync in progress: 67% complete</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Additional WebX sub-page functions
  const renderResultsAnalysis = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Statistical Results Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">95.3%</div>
              <div className="text-sm text-gray-600">Confidence Level</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">+23.4%</div>
              <div className="text-sm text-gray-600">Conversion Lift</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-purple-600">12,847</div>
              <div className="text-sm text-gray-600">Sample Size</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-orange-600">$1.2M</div>
              <div className="text-sm text-gray-600">Revenue Impact</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderStatisticalSignificance = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Significance Monitoring Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border-l-4 border-green-400 rounded-lg">
              <h4 className="font-medium text-green-800">Homepage CTA Test</h4>
              <div className="text-sm text-gray-600 mt-1">Statistical power: 95.3% | p-value: 0.002</div>
              <div className="text-xs text-gray-600">Winner declared with high confidence</div>
            </div>
            <div className="p-4 bg-blue-50 border-l-4 border-blue-400 rounded-lg">
              <h4 className="font-medium text-blue-800">Product Page Layout</h4>
              <div className="text-sm text-gray-600 mt-1">Statistical power: 67.2% | p-value: 0.12</div>
              <div className="text-xs text-gray-600">Test ongoing, more data needed</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderConversionImpact = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Conversion Rate Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium text-green-800">Winning Variations</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Control</span>
                  <span className="font-medium text-gray-600">2.4%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Variation A</span>
                  <span className="font-medium text-green-600">3.1% (+29%)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Variation B</span>
                  <span className="font-medium text-blue-600">2.9% (+21%)</span>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="font-medium text-purple-800">Revenue Impact</h4>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-purple-600">$847K</div>
                <div className="text-sm text-gray-600">Additional revenue from winning variation</div>
                <div className="text-xs text-gray-500">Projected annual impact: $3.2M</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderTestConfiguration = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Experiment Builder Interface</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Active Configuration</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>Traffic Allocation: 50/50 split</div>
                <div>Target Audience: All visitors</div>
                <div>Success Metric: Conversion rate</div>
                <div>Duration: 14 days</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Additional CMP sub-page functions
  const renderEmailAnalytics = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Email Engagement Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">24.7%</div>
              <div className="text-sm text-gray-600">Open Rate</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">3.8%</div>
              <div className="text-sm text-gray-600">Click Rate</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-purple-600">1.2%</div>
              <div className="text-sm text-gray-600">Bounce Rate</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-orange-600">0.3%</div>
              <div className="text-sm text-gray-600">Unsubscribe Rate</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderAutomationWorkflows = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Workflow Performance Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border-l-4 border-green-400 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium text-green-800">Welcome Series</span>
                <Badge className="bg-green-100 text-green-800">Active</Badge>
              </div>
              <div className="text-sm text-gray-600 mt-1">Trigger rate: 89% | Completion rate: 67%</div>
            </div>
            <div className="p-4 bg-blue-50 border-l-4 border-blue-400 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium text-blue-800">Abandoned Cart Recovery</span>
                <Badge className="bg-blue-100 text-blue-800">Active</Badge>
              </div>
              <div className="text-sm text-gray-600 mt-1">Trigger rate: 23% | Recovery rate: 12%</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderAudienceTargeting = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Targeting Effectiveness Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-xl font-bold text-blue-600">High-Value</div>
              <div className="text-sm text-gray-600">Segment Performance</div>
              <div className="text-xs text-blue-600">Open Rate: 32.1%</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-xl font-bold text-green-600">Frequent</div>
              <div className="text-sm text-gray-600">Segment Performance</div>
              <div className="text-xs text-green-600">Open Rate: 28.7%</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-xl font-bold text-purple-600">New</div>
              <div className="text-sm text-gray-600">Segment Performance</div>
              <div className="text-xs text-purple-600">Open Rate: 19.3%</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderROIAnalysis = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Campaign ROI Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">$847K</div>
              <div className="text-sm text-gray-600">Revenue Generated</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">4.2x</div>
              <div className="text-sm text-gray-600">ROI Multiple</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-purple-600">$23.40</div>
              <div className="text-sm text-gray-600">Cost per Acquisition</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-orange-600">$127</div>
              <div className="text-sm text-gray-600">Customer Lifetime Value</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Analytics Insights Content Rendering Functions
  const renderAnalyticsInsightsContent = () => {
    if (mappingType !== 'Analytics Insights' || !tier2Name) {
      return renderDefaultContent();
    }

    switch (tier2Name.toLowerCase()) {
      case 'osa':
        return renderAnalyticsOSAContent(tier3Name);
      case 'content':
        return renderAnalyticsContentContent(tier3Name);
      case 'audiences':
        return renderAnalyticsAudiencesContent(tier3Name);
      case 'cx':
        return renderAnalyticsCXContent(tier3Name);
      case 'experimentation':
        return renderAnalyticsExperimentationContent(tier3Name);
      case 'personalization':
        return renderAnalyticsPersonalizationContent(tier3Name);
      case 'trends':
        return renderAnalyticsTrendsContent(tier3Name);
      default:
        return renderDefaultContent();
    }
  };

  // OSA Analytics Content
  const renderAnalyticsOSAContent = (tier3: string | undefined) => {
    if (!tier3) {
      return renderAnalyticsOSAMainPage();
    }

    const tier3Lower = tier3.toLowerCase().replace(/\s+/g, '-');
    switch (tier3Lower) {
      case 'engagement':
        return renderAnalyticsOSAEngagement();
      case 'topics':
        return renderAnalyticsOSATopics();
      case 'popular':
        return renderAnalyticsOSAPopular();
      case 'ai-visibility':
        return renderAnalyticsOSAAIVisibility();
      case 'semantic':
        return renderAnalyticsOSASemantic();
      case 'geographic':
        return renderAnalyticsOSAGeographic();
      case 'freshness':
        return renderAnalyticsOSAFreshness();
      default:
        return renderAnalyticsOSAMainPage();
    }
  };

  const renderAnalyticsOSAMainPage = () => (
    <div className="space-y-6">
      {/* Strategic OSA Dashboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-blue-600" />
            Strategic OSA Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="text-2xl font-bold text-green-600">95%</div>
              <div className="text-sm text-gray-600">Data Quality Score</div>
              <div className="text-xs text-green-600">+2% this month</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold text-blue-600">24</div>
              <div className="text-sm text-gray-600">Insights Generated</div>
              <div className="text-xs text-blue-600">+6 new insights</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold text-purple-600">5</div>
              <div className="text-sm text-gray-600">Data Sources</div>
              <div className="text-xs text-purple-600">All connected</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold text-orange-600">8</div>
              <div className="text-sm text-gray-600">Strategic Recommendations</div>
              <div className="text-xs text-orange-600">3 high priority</div>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderAnalyticsOSAEngagement = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-6 w-6 text-blue-600" />
            User Engagement Patterns & Behavior Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="text-2xl font-bold text-blue-600">4:32</div>
              <div className="text-sm text-gray-600">Avg Session Duration</div>
              <div className="text-xs text-blue-600">+18s vs last month</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold text-green-600">3.2</div>
              <div className="text-sm text-gray-600">Pages/Session</div>
              <div className="text-xs text-green-600">+0.4 improvement</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold text-purple-600">67.8%</div>
              <div className="text-sm text-gray-600">Engagement Rate</div>
              <div className="text-xs text-purple-600">+5.2% increase</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold text-orange-600">78%</div>
              <div className="text-sm text-gray-600">Scroll Depth</div>
              <div className="text-xs text-orange-600">Above average</div>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderAnalyticsOSATopics = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-6 w-6 text-blue-600" />
            Content Topic Performance & Trending Themes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div>
                    <div className="font-medium text-sm">Product Reviews</div>
                    <div className="text-xs text-gray-600">4.2M views | 78% engagement</div>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Top</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div>
                    <div className="font-medium text-sm">How-to Guides</div>
                    <div className="text-xs text-gray-600">3.8M views | 71% engagement</div>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800">High</Badge>
                </div>
              </div>
              <div className="space-y-3">
                <h4 className="font-medium">Emerging Trends</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-2 border rounded">
                    <span className="text-sm">AI & Automation</span>
                    <span className="text-xs text-green-600">+234% growth</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderAnalyticsOSAPopular = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-blue-600" />
            Most Popular Content & High-Traffic Areas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="text-2xl font-bold text-blue-600">2.4M</div>
              <div className="text-sm text-gray-600">Page Views</div>
              <div className="text-xs text-blue-600">Top content piece</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold text-green-600">890K</div>
              <div className="text-sm text-gray-600">Unique Visitors</div>
              <div className="text-xs text-green-600">Monthly average</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold text-purple-600">23.4%</div>
              <div className="text-sm text-gray-600">Conversion Rate</div>
              <div className="text-xs text-purple-600">Best performing</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold text-orange-600">47K</div>
              <div className="text-sm text-gray-600">Social Shares</div>
              <div className="text-xs text-orange-600">Viral content</div>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderAnalyticsOSAAIVisibility = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-6 w-6 text-blue-600" />
            AI & Search Engine Visibility Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="text-2xl font-bold text-green-600">87%</div>
              <div className="text-sm text-gray-600">Search Visibility Score</div>
              <div className="text-xs text-green-600">+5% improvement</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold text-blue-600">94%</div>
              <div className="text-sm text-gray-600">AI Crawler Access Rate</div>
              <div className="text-xs text-blue-600">Excellent</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold text-purple-600">78%</div>
              <div className="text-sm text-gray-600">Structured Data Coverage</div>
              <div className="text-xs text-purple-600">Above average</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold text-orange-600">156</div>
              <div className="text-sm text-gray-600">Featured Snippets</div>
              <div className="text-xs text-orange-600">+23 this month</div>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderAnalyticsOSASemantic = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-6 w-6 text-blue-600" />
            Semantic Analysis of User Behavior & Content Relationships
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="text-2xl font-bold text-blue-600">92%</div>
              <div className="text-sm text-gray-600">Intent Match Accuracy</div>
              <div className="text-xs text-blue-600">High precision</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold text-green-600">0.87</div>
              <div className="text-sm text-gray-600">Semantic Similarity Scores</div>
              <div className="text-xs text-green-600">Strong correlation</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold text-purple-600">84%</div>
              <div className="text-sm text-gray-600">Journey Coherence</div>
              <div className="text-xs text-purple-600">Above benchmark</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold text-orange-600">15</div>
              <div className="text-sm text-gray-600">Content Clusters</div>
              <div className="text-xs text-orange-600">Well-defined</div>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderAnalyticsOSAGeographic = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-6 w-6 text-blue-600" />
            Geographic Performance & Regional Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="text-2xl font-bold text-blue-600">89%</div>
              <div className="text-sm text-gray-600">US Traffic Share</div>
              <div className="text-xs text-blue-600">Largest market</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold text-green-600">12.4%</div>
              <div className="text-sm text-gray-600">EU Conversion Rate</div>
              <div className="text-xs text-green-600">Best performing</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold text-purple-600">67%</div>
              <div className="text-sm text-gray-600">Mobile Usage (APAC)</div>
              <div className="text-xs text-purple-600">Regional preference</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold text-orange-600">45</div>
              <div className="text-sm text-gray-600">Countries Served</div>
              <div className="text-xs text-orange-600">Global reach</div>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderAnalyticsOSAFreshness = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-6 w-6 text-blue-600" />
            Content Freshness Impact on Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="text-2xl font-bold text-blue-600">65%</div>
              <div className="text-sm text-gray-600">Fresh Content (&lt;30 days)</div>
              <div className="text-xs text-blue-600">Optimal ratio</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold text-green-600">+23%</div>
              <div className="text-sm text-gray-600">Freshness Impact Score</div>
              <div className="text-xs text-green-600">Strong correlation</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold text-purple-600">7.2</div>
              <div className="text-sm text-gray-600">Optimal Update Frequency</div>
              <div className="text-xs text-purple-600">Days between updates</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold text-orange-600">89%</div>
              <div className="text-sm text-gray-600">Update Adoption Rate</div>
              <div className="text-xs text-orange-600">User engagement</div>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Placeholder functions for other Analytics Insights categories
  const renderAnalyticsContentContent = (tier3: string | undefined) => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-6 w-6 text-blue-600" />
            Content Analytics - {tier3 || 'Overview'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="text-2xl font-bold text-green-600">312%</div>
              <div className="text-sm text-gray-600">Content ROI</div>
              <div className="text-xs text-green-600">Excellent performance</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold text-blue-600">4.7%</div>
              <div className="text-sm text-gray-600">Engagement Rate</div>
              <div className="text-xs text-blue-600">Above industry avg</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold text-purple-600">23%</div>
              <div className="text-sm text-gray-600">Conversion Contribution</div>
              <div className="text-xs text-purple-600">Strong impact</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold text-orange-600">15</div>
              <div className="text-sm text-gray-600">Content Velocity (pieces/week)</div>
              <div className="text-xs text-orange-600">Optimal pace</div>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderAnalyticsAudiencesContent = (tier3: string | undefined) => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-6 w-6 text-blue-600" />
            Audiences Analytics - {tier3 || 'Overview'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="text-2xl font-bold text-blue-600">12</div>
              <div className="text-sm text-gray-600">Active Segments</div>
              <div className="text-xs text-blue-600">Well-defined</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold text-green-600">87%</div>
              <div className="text-sm text-gray-600">Segment Coverage</div>
              <div className="text-xs text-green-600">Comprehensive reach</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold text-purple-600">+15%</div>
              <div className="text-sm text-gray-600">High-Value Segment Growth</div>
              <div className="text-xs text-purple-600">Strong growth</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold text-orange-600">34%</div>
              <div className="text-sm text-gray-600">Engagement Variance</div>
              <div className="text-xs text-orange-600">Good diversity</div>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderAnalyticsCXContent = (tier3: string | undefined) => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-blue-600" />
            Customer Experience Analytics - {tier3 || 'Overview'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="text-2xl font-bold text-green-600">8.2/10</div>
              <div className="text-sm text-gray-600">Overall CX Score</div>
              <div className="text-xs text-green-600">Excellent rating</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold text-blue-600">73%</div>
              <div className="text-sm text-gray-600">Journey Completion Rate</div>
              <div className="text-xs text-blue-600">Good completion</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold text-purple-600">4.6/5</div>
              <div className="text-sm text-gray-600">Customer Satisfaction</div>
              <div className="text-xs text-purple-600">High satisfaction</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold text-orange-600">91%</div>
              <div className="text-sm text-gray-600">Experience Consistency</div>
              <div className="text-xs text-orange-600">Very consistent</div>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderAnalyticsExperimentationContent = (tier3: string | undefined) => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-6 w-6 text-blue-600" />
            Experimentation Analytics - {tier3 || 'Overview'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="text-2xl font-bold text-blue-600">15</div>
              <div className="text-sm text-gray-600">Active Experiments</div>
              <div className="text-xs text-blue-600">Healthy pipeline</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold text-green-600">3.2</div>
              <div className="text-sm text-gray-600">Test Velocity (tests/week)</div>
              <div className="text-xs text-green-600">Good pace</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold text-purple-600">95%</div>
              <div className="text-sm text-gray-600">Statistical Confidence</div>
              <div className="text-xs text-purple-600">High confidence</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold text-orange-600">284%</div>
              <div className="text-sm text-gray-600">Program ROI</div>
              <div className="text-xs text-orange-600">Excellent returns</div>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderAnalyticsPersonalizationContent = (tier3: string | undefined) => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-6 w-6 text-blue-600" />
            Personalization Analytics - {tier3 || 'Overview'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="text-2xl font-bold text-purple-600">68%</div>
              <div className="text-sm text-gray-600">Personalization Coverage</div>
              <div className="text-xs text-purple-600">Good coverage</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold text-green-600">92%</div>
              <div className="text-sm text-gray-600">Targeting Accuracy</div>
              <div className="text-xs text-green-600">High precision</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold text-blue-600">8.4/10</div>
              <div className="text-sm text-gray-600">Content Relevance Score</div>
              <div className="text-xs text-blue-600">Highly relevant</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold text-orange-600">156%</div>
              <div className="text-sm text-gray-600">Personalization ROI</div>
              <div className="text-xs text-orange-600">Strong returns</div>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderAnalyticsTrendsContent = (tier3: string | undefined) => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-blue-600" />
            Trends Analytics - {tier3 || 'Overview'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="text-2xl font-bold text-blue-600">23</div>
              <div className="text-sm text-gray-600">Emerging Trends Identified</div>
              <div className="text-xs text-blue-600">Active monitoring</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold text-green-600">87%</div>
              <div className="text-sm text-gray-600">Trend Prediction Accuracy</div>
              <div className="text-xs text-green-600">High accuracy</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold text-purple-600">+156%</div>
              <div className="text-sm text-gray-600">Market Intelligence Growth</div>
              <div className="text-xs text-purple-600">Rapid expansion</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold text-orange-600">12</div>
              <div className="text-sm text-gray-600">Actionable Pattern Insights</div>
              <div className="text-xs text-orange-600">Ready for action</div>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Default content for non-Strategy Plans or when tier info is missing
  const renderDefaultContent = () => (
    <div className="space-y-6">
      {/* KPI Summary - Accordion */}
      <div id="kpi-summary-section" className="border rounded-lg overflow-hidden">
        {/* Accordion Header */}
        <button
          onClick={() => setIsKPIExpanded(!isKPIExpanded)}
          className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            <div>
              <h4 className="font-semibold text-gray-900">Key Performance Indicators</h4>
              <p className="text-sm text-gray-600">
                View current metrics and performance data
              </p>
            </div>
          </div>
          {isKPIExpanded ? (
            <ChevronUp className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-500" />
          )}
        </button>

        {/* Accordion Content */}
        {isKPIExpanded && (
          <div className="border-t bg-gray-50 p-4">
            <KPISummaryWidget
              title=""
              metrics={kpiData}
            />
          </div>
        )}
      </div>

      {/* Tier-specific content */}
      {(
        <div id="tier-specific-content-section" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Confidence Score */}
          <div id="confidence-gauge-section">
            <ConfidenceGauge
              title="Confidence Score"
              score={mappingType === 'Analytics Insights' ? 92 : mappingType === 'Strategy Plans' ? 78 : 85}
              description={
                mappingType === 'Analytics Insights'
                  ? "High confidence in data quality and insights accuracy"
                  : mappingType === 'Strategy Plans'
                  ? "Strategic recommendations based on current analysis"
                  : "Overall system performance and reliability"
              }
              factors={[
                { name: 'Data Quality', score: 95, impact: 'high' },
                { name: 'Sample Size', score: 88, impact: 'medium' },
                { name: 'Time Range', score: 82, impact: 'low' }
              ]}
            />
          </div>

          {/* Workflow Progress */}
          <div id="workflow-progress-section">
            <WorkflowProgress
              title="Current Workflow"
              steps={workflowSteps}
              overallStatus="running"
            />
          </div>
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div id="recommendations-section">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-blue-600" />
                Recommended Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recommendations.map((rec) => (
                  <div key={rec.id} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                    <button className="mt-1">
                      {rec.completed ? (
                        <CheckSquare className="h-4 w-4 text-green-600" />
                      ) : (
                        <Square className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-gray-900">{rec.title}</h4>
                        <Badge
                          className={
                            rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                            rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }
                        >
                          {rec.priority} priority
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{rec.description}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Impact: {rec.impact}</span>
                        <span>Effort: {rec.effort}</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Goals */}
      {goals.length > 0 && (
        <div id="strategic-goals-section">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-600" />
                Strategic Goals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {goals.map((goal) => (
                  <div key={goal.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{goal.title}</h4>
                      {goal.deadline && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Calendar className="h-3 w-3" />
                          {new Date(goal.deadline).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{goal.description}</p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress: {goal.currentValue} / {goal.targetValue}</span>
                        <span>{goal.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${goal.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Integration Health - Show for DXP Tools and Analytics */}
      {(mappingType === 'Optimizely DXP Tools' || mappingType === 'Analytics Insights') && (
        <div id="integration-health-section">
          <IntegrationHealth
            title="Integration Health"
            integrations={integrations}
          />
        </div>
      )}
    </div>
  );

  // Experience Optimization Content Rendering Functions
  const renderExperienceOptimizationContent = () => {
    if (mappingType !== 'Experience Optimization' || !tier2Name) {
      return renderDefaultContent();
    }

    switch (tier2Name.toLowerCase()) {
      case 'content':
        return renderExperienceContentSection(tier3Name);
      case 'experimentation':
        return renderExperienceExperimentationSection(tier3Name);
      case 'personalization':
        return renderExperiencePersonalizationSection(tier3Name);
      case 'ux':
        return renderExperienceUXSection(tier3Name);
      case 'technology':
        return renderExperienceTechnologySection(tier3Name);
      default:
        return renderDefaultContent();
    }
  };

  // Content Section Renderer
  const renderExperienceContentSection = (tier3: string | undefined) => {
    if (!tier3) {
      // Content overview page
      return (
        <div className="space-y-6">
          {/* Executive Summary Dashboard */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-600" />
                Content Strategy Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-900">Content Performance Score</h4>
                  <div className="text-2xl font-bold text-blue-600">87.5%</div>
                  <p className="text-sm text-blue-700">CTR, engagement, conversion rates</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-semibold text-green-900">Content Inventory Health</h4>
                  <div className="text-2xl font-bold text-green-600">92.3%</div>
                  <p className="text-sm text-green-700">Freshness, SEO optimization</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <h4 className="font-semibold text-purple-900">Channel Distribution</h4>
                  <div className="text-2xl font-bold text-purple-600">15</div>
                  <p className="text-sm text-purple-700">Active distribution channels</p>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg">
                  <h4 className="font-semibold text-orange-900">Content Lifecycle</h4>
                  <div className="text-2xl font-bold text-orange-600">234</div>
                  <p className="text-sm text-orange-700">Assets in optimization pipeline</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Strategic Framework Widgets */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Content Audit Findings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-red-50 rounded">
                    <span>Missing meta descriptions</span>
                    <span className="font-bold text-red-600">43 pages</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-yellow-50 rounded">
                    <span>Outdated content (&gt;12 months)</span>
                    <span className="font-bold text-yellow-600">27 assets</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                    <span>High-performing content</span>
                    <span className="font-bold text-blue-600">156 assets</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Content Gap Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Awareness Stage</span>
                    <span className="text-green-600 font-semibold">87% Coverage</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Consideration Stage</span>
                    <span className="text-yellow-600 font-semibold">64% Coverage</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Decision Stage</span>
                    <span className="text-red-600 font-semibold">42% Coverage</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Retention Stage</span>
                    <span className="text-blue-600 font-semibold">78% Coverage</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Implementation Roadmap */}
          <Card>
            <CardHeader>
              <CardTitle>30/60/90-Day Content Optimization Roadmap</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 border-l-4 border-blue-500">
                  <h4 className="font-bold text-blue-900 mb-2">30 Days</h4>
                  <ul className="space-y-1 text-sm">
                    <li>• Complete content audit</li>
                    <li>• Fix critical SEO issues</li>
                    <li>• Implement content governance</li>
                    <li>• Launch A/B testing program</li>
                  </ul>
                </div>
                <div className="p-4 border-l-4 border-purple-500">
                  <h4 className="font-bold text-purple-900 mb-2">60 Days</h4>
                  <ul className="space-y-1 text-sm">
                    <li>• Deploy personalization engine</li>
                    <li>• Optimize content for voice search</li>
                    <li>• Implement content scoring system</li>
                    <li>• Launch content performance dashboard</li>
                  </ul>
                </div>
                <div className="p-4 border-l-4 border-green-500">
                  <h4 className="font-bold text-green-900 mb-2">90 Days</h4>
                  <ul className="space-y-1 text-sm">
                    <li>• Full omnichannel distribution</li>
                    <li>• AI-powered content recommendations</li>
                    <li>• Advanced analytics integration</li>
                    <li>• Content ROI measurement framework</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Handle specific tier3 pages for Content section
    switch (tier3.toLowerCase().replace(/\s+/g, '-')) {
      case 'content-strategy-overview':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Content Philosophy & Brand Alignment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Brand Voice Consistency Score</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Website Content</span>
                        <span className="font-bold text-green-600">94%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Social Media</span>
                        <span className="font-bold text-yellow-600">78%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Email Marketing</span>
                        <span className="font-bold text-blue-600">91%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Product Documentation</span>
                        <span className="font-bold text-red-600">67%</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3">Audience Persona-Content Mapping</h4>
                    <div className="space-y-2">
                      <div className="p-3 bg-blue-50 rounded">
                        <div className="font-semibold">Enterprise Decision Makers</div>
                        <div className="text-sm text-gray-600">87% content coverage | 156 assets</div>
                      </div>
                      <div className="p-3 bg-green-50 rounded">
                        <div className="font-semibold">Technical Implementers</div>
                        <div className="text-sm text-gray-600">92% content coverage | 203 assets</div>
                      </div>
                      <div className="p-3 bg-yellow-50 rounded">
                        <div className="font-semibold">End Users</div>
                        <div className="text-sm text-gray-600">74% content coverage | 134 assets</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">2.7x</div>
                    <div className="text-sm text-blue-800">Content Velocity Increase</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">84%</div>
                    <div className="text-sm text-green-800">Cross-channel Engagement</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">156</div>
                    <div className="text-sm text-purple-800">Days Avg. Content Lifecycle</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">$4.2M</div>
                    <div className="text-sm text-orange-800">Content ROI Attribution</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'performance-analytics':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Real-time Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Content Engagement Heatmap</h4>
                    <div className="bg-gradient-to-r from-blue-100 to-red-100 p-4 rounded-lg">
                      <div className="text-center text-sm font-medium">Top Performing Content Areas</div>
                      <div className="mt-2 space-y-1">
                        <div className="flex justify-between">
                          <span>Blog Posts</span>
                          <span className="text-red-600 font-bold">Hot</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Product Demos</span>
                          <span className="text-orange-600 font-bold">Warm</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Case Studies</span>
                          <span className="text-red-600 font-bold">Hot</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Documentation</span>
                          <span className="text-blue-600 font-bold">Cool</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3">Conversion Funnels</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between p-2 bg-blue-50 rounded">
                        <span>Awareness → Interest</span>
                        <span className="font-bold">67%</span>
                      </div>
                      <div className="flex justify-between p-2 bg-green-50 rounded">
                        <span>Interest → Consideration</span>
                        <span className="font-bold">43%</span>
                      </div>
                      <div className="flex justify-between p-2 bg-yellow-50 rounded">
                        <span>Consideration → Intent</span>
                        <span className="font-bold">28%</span>
                      </div>
                      <div className="flex justify-between p-2 bg-red-50 rounded">
                        <span>Intent → Purchase</span>
                        <span className="font-bold">12%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Predictive Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Content Performance Forecasting</h4>
                    <div className="space-y-3">
                      <div className="p-3 border rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Next 30 Days</span>
                          <span className="text-green-600 font-bold">↗ 12% Growth</span>
                        </div>
                        <div className="text-sm text-gray-600">Projected engagement increase</div>
                      </div>
                      <div className="p-3 border rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Seasonal Trends</span>
                          <span className="text-blue-600 font-bold">Q4 Peak Expected</span>
                        </div>
                        <div className="text-sm text-gray-600">Holiday content optimization</div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3">Content Decay Analysis</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between p-2 bg-red-50 rounded">
                        <span>Requires Immediate Refresh</span>
                        <span className="font-bold text-red-600">23 assets</span>
                      </div>
                      <div className="flex justify-between p-2 bg-yellow-50 rounded">
                        <span>Refresh in 30 days</span>
                        <span className="font-bold text-yellow-600">45 assets</span>
                      </div>
                      <div className="flex justify-between p-2 bg-green-50 rounded">
                        <span>Performing well</span>
                        <span className="font-bold text-green-600">187 assets</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'content-optimization-recommendations':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>AI-Powered Content Suggestions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border-l-4 border-blue-500 bg-blue-50">
                    <h4 className="font-bold text-blue-900">High Priority: SEO Optimization</h4>
                    <ul className="mt-2 space-y-1 text-sm">
                      <li>• Add missing H1 tags to 15 high-traffic pages</li>
                      <li>• Optimize meta descriptions for 32 pages (avg. 12% CTR improvement expected)</li>
                      <li>• Implement schema markup for product pages (estimated 8% visibility boost)</li>
                      <li>• Fix internal linking structure (47 broken links identified)</li>
                    </ul>
                  </div>
                  <div className="p-4 border-l-4 border-green-500 bg-green-50">
                    <h4 className="font-bold text-green-900">Medium Priority: Content Personalization</h4>
                    <ul className="mt-2 space-y-1 text-sm">
                      <li>• Implement dynamic content blocks for returning visitors</li>
                      <li>• Create industry-specific landing page variants</li>
                      <li>• Add behavioral trigger-based content recommendations</li>
                      <li>• Deploy location-based content customization</li>
                    </ul>
                  </div>
                  <div className="p-4 border-l-4 border-purple-500 bg-purple-50">
                    <h4 className="font-bold text-purple-900">Content Variant Testing</h4>
                    <ul className="mt-2 space-y-1 text-sm">
                      <li>• A/B test headline variations for top 10 blog posts</li>
                      <li>• Test CTA button colors and positioning</li>
                      <li>• Compare short vs. long-form content performance</li>
                      <li>• Test video vs. text-based tutorials</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Technical Optimization</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Core Web Vitals Impact</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between p-2 bg-green-50 rounded">
                        <span>Largest Contentful Paint</span>
                        <span className="text-green-600 font-bold">1.8s ✓</span>
                      </div>
                      <div className="flex justify-between p-2 bg-yellow-50 rounded">
                        <span>First Input Delay</span>
                        <span className="text-yellow-600 font-bold">120ms ⚠</span>
                      </div>
                      <div className="flex justify-between p-2 bg-red-50 rounded">
                        <span>Cumulative Layout Shift</span>
                        <span className="text-red-600 font-bold">0.15 ✗</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3">Image Optimization Status</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>WebP Format Adoption</span>
                        <span className="font-bold">67%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Lazy Loading Implemented</span>
                        <span className="font-bold">89%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Responsive Images</span>
                        <span className="font-bold">94%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Alt Text Coverage</span>
                        <span className="font-bold">78%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'multi-channel-content-distribution':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Channel Performance Matrix</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-bold text-blue-900 mb-2">Website</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Engagement Rate</span>
                        <span className="font-bold">4.2%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Avg. Session Duration</span>
                        <span className="font-bold">3:47</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Content Views/Session</span>
                        <span className="font-bold">2.8</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-bold text-green-900 mb-2">Social Media</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Engagement Rate</span>
                        <span className="font-bold">6.7%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Share Rate</span>
                        <span className="font-bold">1.2%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Click-through Rate</span>
                        <span className="font-bold">2.9%</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-bold text-purple-900 mb-2">Email Marketing</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Open Rate</span>
                        <span className="font-bold">24.1%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Click Rate</span>
                        <span className="font-bold">3.8%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Conversion Rate</span>
                        <span className="font-bold">1.4%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cross-channel Content Adaptation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">Automated Content Adaptation</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm font-medium">Format Optimization</div>
                        <ul className="text-sm text-gray-600 mt-1">
                          <li>• Long-form → Social snippets</li>
                          <li>• Blog posts → Email newsletters</li>
                          <li>• Videos → Audio podcasts</li>
                          <li>• PDFs → Interactive web content</li>
                        </ul>
                      </div>
                      <div>
                        <div className="text-sm font-medium">Platform-specific Optimization</div>
                        <ul className="text-sm text-gray-600 mt-1">
                          <li>• LinkedIn: Professional tone, industry insights</li>
                          <li>• Twitter: Concise, hashtag-optimized</li>
                          <li>• Instagram: Visual-first, story format</li>
                          <li>• YouTube: Video descriptions, thumbnails</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'content-roi-analysis':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Financial Impact Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">$127</div>
                    <div className="text-sm text-green-800">Cost per Conversion</div>
                    <div className="text-xs text-green-600 mt-1">↓ 23% vs. last quarter</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">$4.2M</div>
                    <div className="text-sm text-blue-800">Revenue Attribution</div>
                    <div className="text-xs text-blue-600 mt-1">↑ 18% vs. last quarter</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">$89</div>
                    <div className="text-sm text-purple-800">Customer Acquisition Cost</div>
                    <div className="text-xs text-purple-600 mt-1">↓ 15% vs. last quarter</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">$2,340</div>
                    <div className="text-sm text-orange-800">Lifetime Value Impact</div>
                    <div className="text-xs text-orange-600 mt-1">↑ 12% engagement correlation</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Content Type ROI Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <div className="font-semibold">Blog Posts</div>
                      <div className="text-sm text-gray-600">187 assets • $45K investment</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600">ROI: 340%</div>
                      <div className="text-sm text-gray-600">$153K attributed revenue</div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <div className="font-semibold">Video Content</div>
                      <div className="text-sm text-gray-600">42 assets • $89K investment</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-blue-600">ROI: 280%</div>
                      <div className="text-sm text-gray-600">$249K attributed revenue</div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <div className="font-semibold">Interactive Tools</div>
                      <div className="text-sm text-gray-600">12 assets • $67K investment</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-purple-600">ROI: 450%</div>
                      <div className="text-sm text-gray-600">$302K attributed revenue</div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <div className="font-semibold">Case Studies</div>
                      <div className="text-sm text-gray-600">28 assets • $23K investment</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-orange-600">ROI: 520%</div>
                      <div className="text-sm text-gray-600">$119K attributed revenue</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return renderDefaultContent();
    }
  };

  // Experimentation Section Renderer
  const renderExperienceExperimentationSection = (tier3: string | undefined) => {
    if (!tier3) {
      // Experimentation overview page
      return (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-purple-600" />
                Experimentation Strategy Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-purple-50 rounded-lg">
                  <h4 className="font-semibold text-purple-900">Active Experiments</h4>
                  <div className="text-2xl font-bold text-purple-600">23</div>
                  <p className="text-sm text-purple-700">A/B tests and multivariate experiments</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-900">Conversion Lift</h4>
                  <div className="text-2xl font-bold text-blue-600">+12.8%</div>
                  <p className="text-sm text-blue-700">Average improvement from winning tests</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-semibold text-green-900">Statistical Power</h4>
                  <div className="text-2xl font-bold text-green-600">97.2%</div>
                  <p className="text-sm text-green-700">Confidence in experiment results</p>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg">
                  <h4 className="font-semibold text-orange-900">Velocity</h4>
                  <div className="text-2xl font-bold text-orange-600">4.2</div>
                  <p className="text-sm text-orange-700">Tests per week deployment rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Specific experimentation content based on tier3
    switch (tier3.toLowerCase()) {
      case 'ab-testing':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>A/B Testing Dashboard</CardTitle>
              </CardHeader>
              <CardContent>
                <p>A/B testing implementation and results content would go here.</p>
              </CardContent>
            </Card>
          </div>
        );

      case 'multivariate-testing':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Multivariate Testing Dashboard</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Multivariate testing implementation and results content would go here.</p>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return renderDefaultContent();
    }
  };

  // Personalization Section Renderer
  const renderExperiencePersonalizationSection = (tier3: string | undefined) => {
    if (!tier3) {
      // Personalization overview page
      return (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-indigo-600" />
                Personalization Strategy Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-indigo-50 rounded-lg">
                  <h4 className="font-semibold text-indigo-900">Active Segments</h4>
                  <div className="text-2xl font-bold text-indigo-600">47</div>
                  <p className="text-sm text-indigo-700">Defined audience segments</p>
                </div>
                <div className="p-4 bg-cyan-50 rounded-lg">
                  <h4 className="font-semibold text-cyan-900">Personalization Rate</h4>
                  <div className="text-2xl font-bold text-cyan-600">73.4%</div>
                  <p className="text-sm text-cyan-700">Visitors receiving personalized content</p>
                </div>
                <div className="p-4 bg-emerald-50 rounded-lg">
                  <h4 className="font-semibold text-emerald-900">Engagement Lift</h4>
                  <div className="text-2xl font-bold text-emerald-600">+24.1%</div>
                  <p className="text-sm text-emerald-700">Improvement in personalized sessions</p>
                </div>
                <div className="p-4 bg-rose-50 rounded-lg">
                  <h4 className="font-semibold text-rose-900">ML Models</h4>
                  <div className="text-2xl font-bold text-rose-600">12</div>
                  <p className="text-sm text-rose-700">Active recommendation engines</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Specific personalization content based on tier3
    switch (tier3.toLowerCase()) {
      case 'audience-segmentation':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Audience Segmentation Dashboard</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Audience segmentation strategies and performance content would go here.</p>
              </CardContent>
            </Card>
          </div>
        );

      case 'dynamic-content':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Dynamic Content Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Dynamic content personalization and delivery content would go here.</p>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return renderDefaultContent();
    }
  };

  // UX Section Renderer
  const renderExperienceUXSection = (tier3: string | undefined) => {
    if (!tier3) {
      // UX overview page
      return (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-pink-600" />
                User Experience Strategy Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-pink-50 rounded-lg">
                  <h4 className="font-semibold text-pink-900">UX Score</h4>
                  <div className="text-2xl font-bold text-pink-600">8.7/10</div>
                  <p className="text-sm text-pink-700">Overall user experience rating</p>
                </div>
                <div className="p-4 bg-violet-50 rounded-lg">
                  <h4 className="font-semibold text-violet-900">Task Completion Rate</h4>
                  <div className="text-2xl font-bold text-violet-600">89.3%</div>
                  <p className="text-sm text-violet-700">Successfully completed user journeys</p>
                </div>
                <div className="p-4 bg-sky-50 rounded-lg">
                  <h4 className="font-semibold text-sky-900">Time to Value</h4>
                  <div className="text-2xl font-bold text-sky-600">2.4min</div>
                  <p className="text-sm text-sky-700">Average time for users to find value</p>
                </div>
                <div className="p-4 bg-amber-50 rounded-lg">
                  <h4 className="font-semibold text-amber-900">Friction Points</h4>
                  <div className="text-2xl font-bold text-amber-600">7</div>
                  <p className="text-sm text-amber-700">Identified areas for improvement</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Specific UX content based on tier3
    switch (tier3.toLowerCase()) {
      case 'user-journey-mapping':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>User Journey Mapping Dashboard</CardTitle>
              </CardHeader>
              <CardContent>
                <p>User journey analysis, mapping, and optimization content would go here.</p>
              </CardContent>
            </Card>
          </div>
        );

      case 'usability-testing':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Usability Testing Results</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Usability testing methodologies and results content would go here.</p>
              </CardContent>
            </Card>
          </div>
        );

      case 'accessibility-compliance':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Accessibility Compliance Dashboard</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Accessibility audit results and compliance tracking content would go here.</p>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return renderDefaultContent();
    }
  };

  // Technology Section Renderer
  const renderExperienceTechnologySection = (tier3: string | undefined) => {
    if (!tier3) {
      // Technology overview page
      return (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-teal-600" />
                Technology Strategy Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-teal-50 rounded-lg">
                  <h4 className="font-semibold text-teal-900">Page Speed Score</h4>
                  <div className="text-2xl font-bold text-teal-600">94/100</div>
                  <p className="text-sm text-teal-700">Google PageSpeed Insights average</p>
                </div>
                <div className="p-4 bg-cyan-50 rounded-lg">
                  <h4 className="font-semibold text-cyan-900">Core Web Vitals</h4>
                  <div className="text-2xl font-bold text-cyan-600">Pass</div>
                  <p className="text-sm text-cyan-700">LCP, FID, CLS thresholds met</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <h4 className="font-semibold text-slate-900">Uptime</h4>
                  <div className="text-2xl font-bold text-slate-600">99.97%</div>
                  <p className="text-sm text-slate-700">30-day availability average</p>
                </div>
                <div className="p-4 bg-emerald-50 rounded-lg">
                  <h4 className="font-semibold text-emerald-900">Security Score</h4>
                  <div className="text-2xl font-bold text-emerald-600">A+</div>
                  <p className="text-sm text-emerald-700">SSL Labs security rating</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Specific technology content based on tier3
    switch (tier3.toLowerCase()) {
      case 'performance-optimization':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Optimization Dashboard</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Website performance metrics, optimization strategies, and technical improvements would go here.</p>
              </CardContent>
            </Card>
          </div>
        );

      case 'infrastructure-scaling':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Infrastructure Scaling Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Infrastructure monitoring, scaling strategies, and capacity planning content would go here.</p>
              </CardContent>
            </Card>
          </div>
        );

      case 'security-monitoring':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Security Monitoring Dashboard</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Security monitoring, threat detection, and vulnerability management content would go here.</p>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return renderDefaultContent();
    }
  };

  // Main rendering logic - determine what content to show based on mappingType
  if (mappingType === 'Optimizely DXP Tools') {
    return renderDXPToolsContent();
  }

  if (mappingType === 'Analytics Insights') {
    return renderAnalyticsInsightsContent();
  }

  if (mappingType === 'Experience Optimization') {
    return renderExperienceOptimizationContent();
  }

  return renderStrategyPlansContent();
}

// Export ContentRenderer wrapped with error boundary for production safety
const ContentRendererWithErrorBoundary = (props: any) => {
  return (
    <ContentRendererErrorBoundary
      maxRetries={3}
      showErrorDetails={process.env.NODE_ENV === 'development'}
      onError={(error, errorInfo) => {
        // Custom error handling for ContentRenderer-specific errors
        console.error('ContentRenderer Error:', {
          error: error.message,
          props: {
            mappingType: props.mappingType,
            tier1Name: props.tier1Name,
            tier2Name: props.tier2Name,
            tier3Name: props.tier3Name
          },
          componentStack: errorInfo.componentStack
        });

        // Track specific error patterns that we've fixed
        if (error.message.includes('is not defined')) {
          console.error('🚨 CRITICAL: Undefined function error detected', {
            message: error.message,
            stack: error.stack,
            tier2Name: props.tier2Name,
            tier3Name: props.tier3Name
          });
        }
      }}
    >
      <ContentRenderer {...props} />
    </ContentRendererErrorBoundary>
  );
};

export default ContentRendererWithErrorBoundary;