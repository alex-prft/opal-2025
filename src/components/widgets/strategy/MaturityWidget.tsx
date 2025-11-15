/**
 * Maturity Assessment Widget
 * Comprehensive widget for digital optimization maturity analysis
 * Implements all content suggestions for maturity assessment and improvement pathways
 */

'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Activity,
  BarChart3,
  Target,
  TrendingUp,
  Users,
  Database,
  Settings,
  Award,
  ArrowUp,
  ArrowDown,
  Minus,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  Layers,
  Compass,
  Zap
} from 'lucide-react';

export interface MaturityWidgetProps {
  data: any;
  context?: any;
  className?: string;
}

export function MaturityWidget({ data, context, className = '' }: MaturityWidgetProps) {
  // Extract data with safe defaults
  const overallMaturityLevel = data?.overallMaturityLevel || 3.2;
  const maturityOutOf5 = Math.round(overallMaturityLevel * 10) / 10;

  // Maturity dimensions with radar chart data
  const maturityDimensions = data?.maturityDimensions || {
    'Technology Stack': { current: 3.5, target: 4.5, gap: 1.0 },
    'Data Governance': { current: 2.8, target: 4.0, gap: 1.2 },
    'Process Maturity': { current: 3.2, target: 4.2, gap: 1.0 },
    'Team Capabilities': { current: 3.8, target: 4.5, gap: 0.7 },
    'Customer Experience': { current: 3.0, target: 4.3, gap: 1.3 },
    'Analytics & Insights': { current: 2.9, target: 4.1, gap: 1.2 }
  };

  // Maturity level definitions
  const maturityLevels = [
    {
      level: 1,
      name: 'Initial',
      description: 'Basic digital presence with manual processes',
      criteria: ['Basic website', 'Manual reporting', 'Ad-hoc campaigns'],
      color: 'bg-red-100 text-red-700'
    },
    {
      level: 2,
      name: 'Developing',
      description: 'Some automation and structured processes',
      criteria: ['Basic analytics', 'Email automation', 'Standard processes'],
      color: 'bg-orange-100 text-orange-700'
    },
    {
      level: 3,
      name: 'Defined',
      description: 'Systematic approach with integrated tools',
      criteria: ['Advanced analytics', 'A/B testing', 'Cross-team collaboration'],
      color: 'bg-yellow-100 text-yellow-700'
    },
    {
      level: 4,
      name: 'Managed',
      description: 'Data-driven optimization with advanced capabilities',
      criteria: ['Personalization', 'Predictive analytics', 'Automated optimization'],
      color: 'bg-blue-100 text-blue-700'
    },
    {
      level: 5,
      name: 'Optimizing',
      description: 'Industry-leading innovation and continuous improvement',
      criteria: ['AI-driven insights', 'Real-time personalization', 'Predictive experiences'],
      color: 'bg-green-100 text-green-700'
    }
  ];

  // Peer comparison data
  const peerComparison = data?.peerComparison || {
    industry: 'E-commerce',
    industryAverage: 2.8,
    topPerformers: 4.2,
    yourScore: overallMaturityLevel,
    rank: 'Top 35%'
  };

  // Gap analysis priorities
  const gapAnalysis = data?.gapAnalysis || [
    {
      dimension: 'Customer Experience',
      currentScore: 3.0,
      targetScore: 4.3,
      gap: 1.3,
      priority: 'Critical',
      impact: 'High',
      effort: 'High',
      timeframe: '6-9 months'
    },
    {
      dimension: 'Data Governance',
      currentScore: 2.8,
      targetScore: 4.0,
      gap: 1.2,
      priority: 'High',
      impact: 'High',
      effort: 'Medium',
      timeframe: '3-6 months'
    },
    {
      dimension: 'Analytics & Insights',
      currentScore: 2.9,
      targetScore: 4.1,
      gap: 1.2,
      priority: 'High',
      impact: 'Medium',
      effort: 'Medium',
      timeframe: '4-7 months'
    }
  ];

  // Improvement pathway
  const improvementPathway = data?.improvementPathway || [
    {
      phase: 'Foundation (0-6 months)',
      objectives: ['Establish data governance', 'Implement basic analytics', 'Team training'],
      expectedMaturity: 3.5,
      keyMilestones: ['Data quality framework', 'Analytics platform setup', 'Team certification']
    },
    {
      phase: 'Growth (6-12 months)',
      objectives: ['Advanced personalization', 'Predictive analytics', 'Process automation'],
      expectedMaturity: 4.0,
      keyMilestones: ['ML model implementation', 'Automated workflows', 'Customer journey mapping']
    },
    {
      phase: 'Optimization (12-18 months)',
      objectives: ['AI-driven insights', 'Real-time optimization', 'Innovation lab'],
      expectedMaturity: 4.5,
      keyMilestones: ['AI platform integration', 'Real-time personalization', 'Innovation processes']
    }
  ];

  // Industry benchmarking
  const benchmarkData = data?.benchmarkData || [
    { industry: 'E-commerce', average: 2.8, topQuartile: 4.1, leader: 4.7 },
    { industry: 'Technology', average: 3.2, topQuartile: 4.3, leader: 4.8 },
    { industry: 'Financial Services', average: 3.0, topQuartile: 4.2, leader: 4.6 },
    { industry: 'Healthcare', average: 2.5, topQuartile: 3.8, leader: 4.4 }
  ];

  const getMaturityColor = (score: number) => {
    if (score >= 4.5) return 'text-green-600 bg-green-50';
    if (score >= 3.5) return 'text-blue-600 bg-blue-50';
    if (score >= 2.5) return 'text-yellow-600 bg-yellow-50';
    if (score >= 1.5) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className={`maturity-widget-container space-y-6 ${className}`}>
      {/* Hero Section with Overall Maturity Score */}
      <Card className="maturity-hero-section">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Activity className="h-6 w-6 text-blue-600" />
                Digital Optimization Maturity Assessment
              </CardTitle>
              <CardDescription className="text-lg mt-2">
                Comprehensive capability evaluation across multiple dimensions with strategic advancement pathways
              </CardDescription>
            </div>
            <div className="text-center">
              <div className="relative w-32 h-32 mx-auto">
                <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="3"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="3"
                    strokeDasharray={`${(maturityOutOf5 / 5) * 100}, 100`}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-gray-900">{maturityOutOf5}</span>
                  <span className="text-sm text-gray-600">out of 5.0</span>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-2">Overall Maturity Level</p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Maturity Dimension Radar */}
      <Card className="maturity-dimensions">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Compass className="h-5 w-5 text-blue-600" />
            Maturity Dimension Assessment
          </CardTitle>
          <CardDescription>
            Multi-faceted capability evaluation across key digital optimization areas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(maturityDimensions).map(([dimension, scores]) => (
              <div key={dimension} className="p-4 border rounded-lg">
                <h4 className="font-semibold text-sm mb-3">{dimension}</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Current</span>
                    <Badge className={getMaturityColor(scores.current)}>
                      {scores.current}/5.0
                    </Badge>
                  </div>
                  <Progress value={(scores.current / 5) * 100} className="h-2" />
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Target</span>
                    <span className="font-medium">{scores.target}/5.0</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Gap</span>
                    <span className="font-medium text-red-600">-{scores.gap}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Peer Comparison and Growth Trajectory */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="peer-comparison">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              Industry Benchmarking
            </CardTitle>
            <CardDescription>
              Performance relative to industry peers and leaders
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">Your Position</span>
                  <Badge variant="outline" className="text-blue-600 bg-blue-50">
                    {peerComparison.rank}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Your Score:</span>
                    <span className="font-bold text-blue-600">{peerComparison.yourScore}/5.0</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Industry Average:</span>
                    <span>{peerComparison.industryAverage}/5.0</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Top Performers:</span>
                    <span className="text-green-600">{peerComparison.topPerformers}/5.0</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                {benchmarkData.map((benchmark, index) => (
                  <div key={index} className="flex justify-between items-center p-2 rounded">
                    <span className="text-sm font-medium">{benchmark.industry}</span>
                    <div className="flex gap-2 text-xs">
                      <span className="text-gray-500">{benchmark.average}</span>
                      <span className="text-blue-600">{benchmark.topQuartile}</span>
                      <span className="text-green-600">{benchmark.leader}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="growth-trajectory">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Growth Trajectory
            </CardTitle>
            <CardDescription>
              Projected path from current to desired maturity state
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {improvementPathway.map((phase, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-sm">{phase.phase}</h4>
                    <Badge className={getMaturityColor(phase.expectedMaturity)}>
                      {phase.expectedMaturity}/5.0
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Key Objectives:</p>
                      <ul className="text-xs space-y-1">
                        {phase.objectives.map((objective, objIndex) => (
                          <li key={objIndex} className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            {objective}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gap Analysis Priorities */}
      <Card className="gap-analysis">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-red-600" />
            Priority Gap Analysis
          </CardTitle>
          <CardDescription>
            Most critical capability gaps requiring immediate attention
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {gapAnalysis.map((gap, index) => (
              <Card key={index} className="gap-item">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-semibold">{gap.dimension}</h4>
                    <div className="flex gap-2">
                      <Badge className={getPriorityColor(gap.priority)}>
                        {gap.priority} Priority
                      </Badge>
                      <Badge variant="outline">{gap.timeframe}</Badge>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Current Score</span>
                      <p className="font-medium">{gap.currentScore}/5.0</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Target Score</span>
                      <p className="font-medium text-green-600">{gap.targetScore}/5.0</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Gap Size</span>
                      <p className="font-medium text-red-600">-{gap.gap}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Impact vs Effort</span>
                      <p className="font-medium">{gap.impact} / {gap.effort}</p>
                    </div>
                  </div>
                  <Progress value={(gap.currentScore / gap.targetScore) * 100} className="h-2 mt-3" />
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Maturity Level Framework */}
      <Card className="maturity-framework">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-indigo-600" />
            Maturity Level Framework
          </CardTitle>
          <CardDescription>
            Structured advancement methodology with clear criteria for each level
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {maturityLevels.map((level, index) => (
              <Card key={index} className={`maturity-level ${
                Math.floor(overallMaturityLevel) === level.level ? 'ring-2 ring-blue-500' : ''
              }`}>
                <CardContent className="p-4">
                  <div className="text-center mb-3">
                    <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center text-lg font-bold ${level.color}`}>
                      {level.level}
                    </div>
                    <h4 className="font-semibold mt-2">{level.name}</h4>
                  </div>
                  <p className="text-xs text-gray-600 mb-3">{level.description}</p>
                  <ul className="text-xs space-y-1">
                    {level.criteria.map((criterion, critIndex) => (
                      <li key={critIndex} className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3 text-gray-400" />
                        {criterion}
                      </li>
                    ))}
                  </ul>
                  {Math.floor(overallMaturityLevel) === level.level && (
                    <Badge className="w-full mt-2" variant="default">
                      Current Level
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Navigation to Detailed Sections */}
      <Card className="maturity-navigation">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5 text-blue-600" />
            Detailed Analysis Sections
          </CardTitle>
          <CardDescription>
            Explore comprehensive maturity analysis and improvement planning
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            {[
              { title: 'Current State', icon: BarChart3, description: 'Comprehensive evaluation' },
              { title: 'Framework', icon: Layers, description: 'Structured methodology' },
              { title: 'Gap Analysis', icon: Target, description: 'Critical improvement areas' },
              { title: 'Improvement Path', icon: TrendingUp, description: 'Strategic roadmap' },
              { title: 'Benchmarking', icon: Award, description: 'Industry comparisons' }
            ].map((section, index) => (
              <Card key={index} className="nav-section hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-3 text-center">
                  <section.icon className="h-6 w-6 mx-auto text-blue-600 mb-2" />
                  <h4 className="font-semibold text-sm mb-1">{section.title}</h4>
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