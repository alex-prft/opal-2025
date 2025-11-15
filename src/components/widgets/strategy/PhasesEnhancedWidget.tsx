/**
 * Phases Enhanced Widget
 * Comprehensive widget for multi-phase implementation strategy
 * Implements all content suggestions for phases from foundation to innovation
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Calendar,
  Target,
  Users,
  Settings,
  TrendingUp,
  Zap,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowRight,
  Layers,
  Network,
  BarChart3,
  ExternalLink,
  PlayCircle,
  PauseCircle
} from 'lucide-react';

export interface PhasesEnhancedWidgetProps {
  data: any;
  context?: any;
  className?: string;
}

export function PhasesEnhancedWidget({ data, context, className = '' }: PhasesEnhancedWidgetProps) {
  const [selectedPhase, setSelectedPhase] = useState('overview');

  // Extract data with safe defaults
  const currentPhase = data?.currentPhase || 1;
  const overallProgress = data?.overallProgress || 23;

  // Phase definitions with comprehensive details
  const phases = [
    {
      id: 1,
      name: 'Phase 1: Foundation',
      timeframe: '0-3 months',
      description: 'Foundation building and infrastructure setup',
      objectives: [
        'Establish core digital optimization capabilities',
        'Set up technical platform and infrastructure',
        'Implement data governance and quality frameworks',
        'Build team capabilities and assign roles',
        'Deploy basic optimization and testing tools'
      ],
      keyMilestones: [
        'Analytics platform implementation',
        'Data quality framework establishment',
        'Team training and certification',
        'Basic A/B testing setup',
        'Performance baseline documentation'
      ],
      deliverables: [
        'Technical architecture blueprint',
        'Data governance documentation',
        'Team capability matrix',
        'Initial optimization results',
        'Phase 1 success validation'
      ],
      successMetrics: [
        { metric: 'Platform uptime', target: '99.5%', current: '98.2%' },
        { metric: 'Data quality score', target: '85%', current: '72%' },
        { metric: 'Team certification', target: '100%', current: '60%' },
        { metric: 'Testing velocity', target: '5 tests/week', current: '2 tests/week' }
      ],
      risks: [
        { risk: 'Technical integration delays', probability: 'Medium', impact: 'High', mitigation: 'Dedicated technical team' },
        { risk: 'Team skill gaps', probability: 'High', impact: 'Medium', mitigation: 'Accelerated training program' }
      ],
      budget: 125000,
      teamSize: 6,
      status: currentPhase === 1 ? 'active' : currentPhase > 1 ? 'completed' : 'planned',
      progress: currentPhase === 1 ? 75 : currentPhase > 1 ? 100 : 0
    },
    {
      id: 2,
      name: 'Phase 2: Growth',
      timeframe: '3-6 months',
      description: 'Scaling and expansion of optimization capabilities',
      objectives: [
        'Scale optimization activities across channels',
        'Implement advanced personalization features',
        'Increase experimentation velocity and complexity',
        'Expand system integrations and data sources',
        'Optimize workflows and introduce automation'
      ],
      keyMilestones: [
        'Advanced personalization deployment',
        'Multi-channel optimization setup',
        'Automated workflow implementation',
        'Performance scaling validation',
        'ROI measurement framework'
      ],
      deliverables: [
        'Personalization engine configuration',
        'Multi-channel testing framework',
        'Automated optimization workflows',
        'Expanded integration architecture',
        'Performance scaling documentation'
      ],
      successMetrics: [
        { metric: 'Conversion rate lift', target: '25%', current: '12%' },
        { metric: 'Testing velocity', target: '20 tests/week', current: '8 tests/week' },
        { metric: 'Personalization coverage', target: '80%', current: '35%' },
        { metric: 'Automation percentage', target: '60%', current: '25%' }
      ],
      risks: [
        { risk: 'Scaling performance issues', probability: 'Medium', impact: 'High', mitigation: 'Load testing and monitoring' },
        { risk: 'Data integration complexity', probability: 'High', impact: 'Medium', mitigation: 'Phased integration approach' }
      ],
      budget: 180000,
      teamSize: 8,
      status: currentPhase === 2 ? 'active' : currentPhase > 2 ? 'completed' : 'planned',
      progress: currentPhase === 2 ? 45 : currentPhase > 2 ? 100 : 0
    },
    {
      id: 3,
      name: 'Phase 3: Optimization',
      timeframe: '6-12 months',
      description: 'Advanced optimization and refinement',
      objectives: [
        'Deploy sophisticated analytics and ML capabilities',
        'Implement AI-driven optimization features',
        'Establish omnichannel experience coordination',
        'Deploy advanced behavioral segmentation',
        'Enable real-time dynamic optimization'
      ],
      keyMilestones: [
        'ML model deployment and validation',
        'Real-time personalization engine',
        'Predictive analytics implementation',
        'Omnichannel orchestration platform',
        'Advanced segmentation models'
      ],
      deliverables: [
        'AI/ML optimization platform',
        'Real-time decisioning engine',
        'Omnichannel experience framework',
        'Predictive customer models',
        'Advanced analytics dashboard'
      ],
      successMetrics: [
        { metric: 'AI model accuracy', target: '85%', current: '0%' },
        { metric: 'Real-time response', target: '<100ms', current: 'N/A' },
        { metric: 'Cross-channel consistency', target: '90%', current: '45%' },
        { metric: 'Predictive lift', target: '35%', current: '0%' }
      ],
      risks: [
        { risk: 'AI model complexity', probability: 'High', impact: 'High', mitigation: 'Expert consultation and phased rollout' },
        { risk: 'Real-time performance', probability: 'Medium', impact: 'High', mitigation: 'Performance optimization and caching' }
      ],
      budget: 250000,
      teamSize: 10,
      status: currentPhase === 3 ? 'active' : currentPhase > 3 ? 'completed' : 'planned',
      progress: currentPhase === 3 ? 20 : currentPhase > 3 ? 100 : 0
    },
    {
      id: 4,
      name: 'Phase 4: Innovation',
      timeframe: '12+ months',
      description: 'Innovation and market leadership positioning',
      objectives: [
        'Establish cutting-edge competitive advantages',
        'Integrate next-generation technologies',
        'Deploy predictive customer experience features',
        'Achieve industry-leading capability levels',
        'Create continuous innovation processes'
      ],
      keyMilestones: [
        'Innovation lab establishment',
        'Next-gen technology integration',
        'Predictive experience platform',
        'Market leadership validation',
        'Continuous improvement automation'
      ],
      deliverables: [
        'Innovation strategy framework',
        'Emerging technology integration',
        'Predictive experience engine',
        'Market leadership metrics',
        'Future-proofing architecture'
      ],
      successMetrics: [
        { metric: 'Innovation index', target: '95th percentile', current: 'N/A' },
        { metric: 'Tech adoption speed', target: '< 30 days', current: 'N/A' },
        { metric: 'Predictive accuracy', target: '90%+', current: 'N/A' },
        { metric: 'Market position', target: 'Top 5%', current: 'Top 35%' }
      ],
      risks: [
        { risk: 'Technology adoption challenges', probability: 'Medium', impact: 'Medium', mitigation: 'Technology roadmap planning' },
        { risk: 'Market disruption', probability: 'Low', impact: 'High', mitigation: 'Continuous market monitoring' }
      ],
      budget: 350000,
      teamSize: 12,
      status: 'planned',
      progress: 0
    }
  ];

  // Cross-phase dependencies
  const dependencies = [
    {
      from: 'Phase 1',
      to: 'Phase 2',
      dependency: 'Data platform readiness',
      criticality: 'Critical',
      status: 'On Track'
    },
    {
      from: 'Phase 1',
      to: 'Phase 3',
      dependency: 'Team capability baseline',
      criticality: 'High',
      status: 'At Risk'
    },
    {
      from: 'Phase 2',
      to: 'Phase 3',
      dependency: 'Personalization framework',
      criticality: 'Critical',
      status: 'Planned'
    },
    {
      from: 'Phase 3',
      to: 'Phase 4',
      dependency: 'AI/ML platform maturity',
      criticality: 'Critical',
      status: 'Planned'
    }
  ];

  // Resource allocation across phases
  const resourceAllocation = {
    totalBudget: phases.reduce((sum, phase) => sum + phase.budget, 0),
    totalTeamSize: Math.max(...phases.map(phase => phase.teamSize)),
    phaseDistribution: phases.map(phase => ({
      phase: phase.name,
      budget: phase.budget,
      percentage: Math.round((phase.budget / phases.reduce((sum, p) => sum + p.budget, 0)) * 100)
    }))
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50';
      case 'active': return 'text-blue-600 bg-blue-50';
      case 'at-risk': return 'text-yellow-600 bg-yellow-50';
      case 'blocked': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getCriticalityColor = (criticality: string) => {
    switch (criticality.toLowerCase()) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className={`phases-enhanced-widget-container space-y-6 ${className}`}>
      {/* Hero Section with Phase Overview Timeline */}
      <Card className="phases-hero-section">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Layers className="h-6 w-6 text-purple-600" />
            Multi-Phase Implementation Strategy
          </CardTitle>
          <CardDescription className="text-lg mt-2">
            Strategic 12+ month implementation journey from foundation to innovation leadership
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium">Overall Progress</span>
            <span className="text-sm text-gray-600">{overallProgress}% Complete</span>
          </div>
          <Progress value={overallProgress} className="h-3 mb-6" />

          {/* Phase Timeline */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {phases.map((phase, index) => (
              <div key={phase.id} className="relative">
                <Card className={`phase-card ${phase.status === 'active' ? 'ring-2 ring-blue-500' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge className={getStatusColor(phase.status)}>
                        {phase.status}
                      </Badge>
                      <span className="text-xs text-gray-500">{phase.timeframe}</span>
                    </div>
                    <h4 className="font-semibold text-sm mb-2">{phase.name}</h4>
                    <Progress value={phase.progress} className="h-2 mb-2" />
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>${(phase.budget / 1000).toFixed(0)}K</span>
                      <span>{phase.teamSize} team</span>
                    </div>
                  </CardContent>
                </Card>
                {index < phases.length - 1 && (
                  <ArrowRight className="hidden md:block absolute -right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Phase Selection and Details */}
      <Tabs value={selectedPhase} onValueChange={setSelectedPhase} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="phase-1">Phase 1</TabsTrigger>
          <TabsTrigger value="phase-2">Phase 2</TabsTrigger>
          <TabsTrigger value="phase-3">Phase 3</TabsTrigger>
          <TabsTrigger value="phase-4">Phase 4</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="resource-allocation">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-600" />
                  Resource Allocation Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">Total Investment</span>
                      <span className="text-xl font-bold text-purple-600">
                        ${(resourceAllocation.totalBudget / 1000).toFixed(0)}K
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Peak Team Size</span>
                      <span className="text-xl font-bold text-purple-600">
                        {resourceAllocation.totalTeamSize} people
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {resourceAllocation.phaseDistribution.map((phase, index) => (
                      <div key={index} className="flex justify-between items-center p-2 rounded">
                        <span className="text-sm font-medium">{phase.phase}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">${(phase.budget / 1000).toFixed(0)}K</span>
                          <Badge variant="outline">{phase.percentage}%</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="cross-phase-dependencies">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Network className="h-5 w-5 text-red-600" />
                  Cross-Phase Dependencies
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dependencies.map((dep, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">{dep.dependency}</span>
                        <div className="flex gap-2">
                          <Badge className={getCriticalityColor(dep.criticality)}>
                            {dep.criticality}
                          </Badge>
                          <Badge variant="outline">{dep.status}</Badge>
                        </div>
                      </div>
                      <div className="text-xs text-gray-600">
                        {dep.from} → {dep.to}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Individual Phase Tabs */}
        {phases.map((phase) => (
          <TabsContent key={phase.id} value={`phase-${phase.id}`}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <Card className="phase-objectives">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-blue-600" />
                      {phase.name} Objectives
                    </CardTitle>
                    <CardDescription>{phase.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {phase.objectives.map((objective, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{objective}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card className="phase-milestones">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-green-600" />
                      Key Milestones
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {phase.keyMilestones.map((milestone, index) => (
                        <div key={index} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
                          <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                            <span className="text-xs font-bold text-green-600">{index + 1}</span>
                          </div>
                          <span className="text-sm">{milestone}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="phase-metrics">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-purple-600" />
                      Success Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {phase.successMetrics.map((metric, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium">{metric.metric}</span>
                            <span className="text-gray-600">Target: {metric.target}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Current: {metric.current}</span>
                          </div>
                          {metric.current !== 'N/A' && (
                            <Progress
                              value={phase.status === 'planned' ? 0 : 70}
                              className="h-2"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="phase-risks">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-yellow-600" />
                      Risk Assessment
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {phase.risks.map((risk, index) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <div className="flex items-start justify-between mb-2">
                            <span className="text-sm font-medium">{risk.risk}</span>
                            <div className="flex gap-1">
                              <Badge variant="outline" className="text-xs">
                                P: {risk.probability}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                I: {risk.impact}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-xs text-gray-600">
                            <strong>Mitigation:</strong> {risk.mitigation}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Navigation to Individual Phase Pages */}
      <Card className="phase-navigation">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5 text-blue-600" />
            Detailed Phase Analysis
          </CardTitle>
          <CardDescription>
            Access comprehensive phase-specific planning and execution details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
            {[
              { title: 'Foundation (0-3M)', icon: Settings, description: 'Infrastructure setup' },
              { title: 'Growth (3-6M)', icon: TrendingUp, description: 'Capability scaling' },
              { title: 'Optimization (6-12M)', icon: Zap, description: 'Advanced features' },
              { title: 'Innovation (12M+)', icon: Target, description: 'Market leadership' },
              { title: 'Dependencies', icon: Network, description: 'Critical path analysis' },
              { title: 'Success Criteria', icon: CheckCircle, description: 'Validation framework' }
            ].map((section, index) => (
              <Card key={index} className="nav-section hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-3 text-center">
                  <section.icon className="h-6 w-6 mx-auto text-blue-600 mb-2" />
                  <h4 className="font-semibold text-xs mb-1">{section.title}</h4>
                  <p className="text-xs text-gray-600">{section.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}