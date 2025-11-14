/**
 * MaturityScoreCard Component
 * Comprehensive maturity assessment visualization with scoring and recommendations
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  TrendingUp,
  Target,
  CheckCircle2,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  BarChart3,
  Users,
  Zap,
  Shield,
  Settings,
  Lightbulb,
  ChevronRight
} from 'lucide-react';

export interface MaturityScoreCardProps {
  maturityData?: any;
  className?: string;
}

export function MaturityScoreCard({ maturityData, className = '' }: MaturityScoreCardProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('overview');

  // Use mock data if no real data provided
  const scoreData = maturityData || generateMockMaturityData();

  return (
    <div className={`maturity-score-card ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            Digital Maturity Assessment
          </CardTitle>
          <p className="text-gray-600">
            Comprehensive evaluation of current capabilities and strategic recommendations for improvement
          </p>
        </CardHeader>
        <CardContent>
          {/* Overall Score Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <OverallScoreCard score={scoreData.overallScore} />
            <MaturityLevelCard
              current={scoreData.currentLevel}
              target={scoreData.targetLevel}
            />
            <GapAnalysisCard gaps={scoreData.identifiedGaps} />
            <RecommendationsCard recommendations={scoreData.priorityRecommendations} />
          </div>

          <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="categories">Categories</TabsTrigger>
              <TabsTrigger value="gaps">Gap Analysis</TabsTrigger>
              <TabsTrigger value="roadmap">Improvement Plan</TabsTrigger>
              <TabsTrigger value="benchmarks">Benchmarks</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <OverviewTab data={scoreData} />
            </TabsContent>

            <TabsContent value="categories">
              <CategoriesTab categories={scoreData.categoryScores} />
            </TabsContent>

            <TabsContent value="gaps">
              <GapAnalysisTab gaps={scoreData.detailedGaps} />
            </TabsContent>

            <TabsContent value="roadmap">
              <ImprovementPlanTab plan={scoreData.improvementPlan} />
            </TabsContent>

            <TabsContent value="benchmarks">
              <BenchmarksTab benchmarks={scoreData.industryBenchmarks} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function OverallScoreCard({ score }: { score: number }) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreLevel = (score: number) => {
    if (score >= 80) return 'Advanced';
    if (score >= 60) return 'Intermediate';
    if (score >= 40) return 'Developing';
    return 'Basic';
  };

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
      <CardContent className="pt-6">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-4">
            <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="2"
              />
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray={`${score}, 100`}
                className={getScoreColor(score)}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-2xl font-bold ${getScoreColor(score)}`}>{score}</span>
            </div>
          </div>
          <h3 className="font-semibold text-blue-900">Overall Maturity</h3>
          <p className="text-sm text-blue-700">{getScoreLevel(score)} Level</p>
        </div>
      </CardContent>
    </Card>
  );
}

function MaturityLevelCard({ current, target }: { current: string; target: string }) {
  return (
    <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
      <CardContent className="pt-6">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-700">{current}</p>
              <p className="text-xs text-green-600">Current</p>
            </div>
            <ArrowRight className="h-4 w-4 text-green-500" />
            <div className="text-center">
              <p className="text-2xl font-bold text-green-700">{target}</p>
              <p className="text-xs text-green-600">Target</p>
            </div>
          </div>
          <h3 className="font-semibold text-green-900">Maturity Level</h3>
          <p className="text-sm text-green-700">Progression Path</p>
        </div>
      </CardContent>
    </Card>
  );
}

function GapAnalysisCard({ gaps }: { gaps: number }) {
  return (
    <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
      <CardContent className="pt-6">
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <AlertTriangle className="h-8 w-8 text-yellow-600" />
          </div>
          <p className="text-2xl font-bold text-yellow-700">{gaps}</p>
          <h3 className="font-semibold text-yellow-900">Critical Gaps</h3>
          <p className="text-sm text-yellow-700">Need Attention</p>
        </div>
      </CardContent>
    </Card>
  );
}

function RecommendationsCard({ recommendations }: { recommendations: number }) {
  return (
    <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
      <CardContent className="pt-6">
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Lightbulb className="h-8 w-8 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-purple-700">{recommendations}</p>
          <h3 className="font-semibold text-purple-900">Priority Actions</h3>
          <p className="text-sm text-purple-700">Recommendations</p>
        </div>
      </CardContent>
    </Card>
  );
}

function OverviewTab({ data }: { data: any }) {
  return (
    <div className="space-y-6">
      {/* Maturity Radar */}
      <Card>
        <CardHeader>
          <CardTitle>Capability Assessment Radar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(data.categoryScores).map(([category, score]: [string, any]) => (
              <div key={category} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium capitalize">{category.replace(/([A-Z])/g, ' $1').trim()}</span>
                  <span className="font-bold">{score}/10</span>
                </div>
                <Progress value={score * 10} className="h-3" />
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Basic</span>
                  <span>Advanced</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Key Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Strengths
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.strengths.map((strength: string, index: number) => (
                <div key={index} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-sm">{strength}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Improvement Areas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.improvementAreas.map((area: string, index: number) => (
                <div key={index} className="flex items-center gap-2">
                  <ArrowUp className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm">{area}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function CategoriesTab({ categories }: { categories: any }) {
  const categoryIcons = {
    technology: Settings,
    processes: Target,
    people: Users,
    data: BarChart3,
    security: Shield,
    innovation: Zap
  };

  return (
    <div className="space-y-4">
      {Object.entries(categories).map(([category, score]: [string, any]) => {
        const IconComponent = categoryIcons[category as keyof typeof categoryIcons] || Settings;

        return (
          <Card key={category}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <IconComponent className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold capitalize">
                      {category.replace(/([A-Z])/g, ' $1').trim()}
                    </h3>
                    <div className="flex items-center gap-2">
                      <Badge variant={score >= 7 ? 'default' : score >= 5 ? 'secondary' : 'destructive'}>
                        {score}/10
                      </Badge>
                    </div>
                  </div>
                  <Progress value={score * 10} className="h-3" />
                  <div className="flex justify-between mt-2 text-sm text-gray-600">
                    <span>Needs Development</span>
                    <span>Industry Leading</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function GapAnalysisTab({ gaps }: { gaps: any[] }) {
  return (
    <div className="space-y-4">
      {gaps.map((gap, index) => (
        <Card key={index}>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="font-semibold">{gap.area}</h3>
                <p className="text-sm text-gray-600 mt-1">{gap.description}</p>
              </div>
              <div className="flex flex-col gap-2 ml-4">
                <Badge variant={gap.impact === 'high' ? 'destructive' : gap.impact === 'medium' ? 'secondary' : 'outline'}>
                  {gap.impact} impact
                </Badge>
                <Badge variant="outline">{gap.effort} effort</Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Current State</h4>
                <p className="text-sm text-gray-700">{gap.currentState}</p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Target State</h4>
                <p className="text-sm text-gray-700">{gap.targetState}</p>
              </div>
            </div>

            {gap.recommendations && (
              <div className="mt-4 pt-4 border-t">
                <h4 className="font-medium mb-2">Recommendations</h4>
                <div className="space-y-1">
                  {gap.recommendations.map((rec: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-2">
                      <ChevronRight className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ImprovementPlanTab({ plan }: { plan: any[] }) {
  return (
    <div className="space-y-4">
      {plan.map((initiative, index) => (
        <Card key={index}>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-700 rounded-full text-sm font-bold">
                    {index + 1}
                  </span>
                  <h3 className="font-semibold">{initiative.title}</h3>
                </div>
                <p className="text-sm text-gray-600">{initiative.description}</p>
              </div>
              <Badge variant={initiative.priority === 'high' ? 'destructive' : initiative.priority === 'medium' ? 'secondary' : 'outline'}>
                {initiative.priority} priority
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="font-semibold">{initiative.timeline}</p>
                <p className="text-xs text-gray-600">Timeline</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="font-semibold">${initiative.investment?.toLocaleString()}</p>
                <p className="text-xs text-gray-600">Investment</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="font-semibold">+{initiative.impactScore}</p>
                <p className="text-xs text-gray-600">Impact Score</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="font-semibold">{initiative.resources}</p>
                <p className="text-xs text-gray-600">Resources</p>
              </div>
            </div>

            {initiative.milestones && (
              <div>
                <h4 className="font-medium mb-2">Key Milestones</h4>
                <div className="flex flex-wrap gap-2">
                  {initiative.milestones.map((milestone: string, idx: number) => (
                    <Badge key={idx} variant="outline">{milestone}</Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function BenchmarksTab({ benchmarks }: { benchmarks: any }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Industry Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(benchmarks.industryAverage).map(([category, average]: [string, any]) => {
              const ourScore = benchmarks.ourScores[category];
              const difference = ourScore - average;

              return (
                <div key={category} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium capitalize">{category.replace(/([A-Z])/g, ' $1').trim()}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm ${difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {difference >= 0 ? '+' : ''}{difference.toFixed(1)}
                      </span>
                      {difference >= 0 ?
                        <ArrowUp className="h-4 w-4 text-green-500" /> :
                        <ArrowDown className="h-4 w-4 text-red-500" />
                      }
                    </div>
                  </div>
                  <div className="relative">
                    <Progress value={average * 10} className="h-3 bg-gray-200" />
                    <Progress
                      value={ourScore * 10}
                      className={`h-3 absolute top-0 ${ourScore >= average ? 'opacity-80' : 'opacity-60'}`}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Industry Avg: {average}</span>
                    <span>Our Score: {ourScore}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Performers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {benchmarks.topPerformers.map((company: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div>
                    <p className="font-medium">{company.name}</p>
                    <p className="text-sm text-gray-600">{company.industry}</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">{company.score}/10</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Peer Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {benchmarks.peerComparison.map((peer: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div>
                    <p className="font-medium">{peer.category}</p>
                    <p className="text-sm text-gray-600">Similar organizations</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{peer.average}/10</p>
                    <p className="text-xs text-gray-600">Average</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Mock data generator
function generateMockMaturityData() {
  return {
    overallScore: 72,
    currentLevel: 'Level 3',
    targetLevel: 'Level 4',
    identifiedGaps: 8,
    priorityRecommendations: 12,
    categoryScores: {
      technology: 7.5,
      processes: 6.8,
      people: 7.2,
      data: 6.5,
      security: 8.1,
      innovation: 6.0
    },
    strengths: [
      'Strong security framework implementation',
      'Advanced technology infrastructure',
      'Skilled technical team',
      'Established governance processes'
    ],
    improvementAreas: [
      'Innovation and experimentation culture',
      'Data analytics capabilities',
      'Process automation',
      'Cross-functional collaboration'
    ],
    detailedGaps: [
      {
        area: 'Data Analytics Maturity',
        description: 'Limited advanced analytics capabilities and data-driven decision making',
        impact: 'high',
        effort: 'medium',
        currentState: 'Basic reporting and dashboards with manual analysis',
        targetState: 'Advanced analytics, predictive modeling, and automated insights',
        recommendations: [
          'Implement advanced analytics platform',
          'Hire data science expertise',
          'Establish data governance framework',
          'Create analytics training program'
        ]
      },
      {
        area: 'Innovation Framework',
        description: 'Lack of structured innovation processes and experimentation culture',
        impact: 'medium',
        effort: 'high',
        currentState: 'Ad-hoc innovation initiatives with limited structure',
        targetState: 'Systematic innovation pipeline with dedicated resources',
        recommendations: [
          'Establish innovation lab',
          'Create experimentation framework',
          'Implement idea management system',
          'Develop innovation metrics'
        ]
      }
    ],
    improvementPlan: [
      {
        title: 'Advanced Analytics Implementation',
        description: 'Build comprehensive analytics capabilities to enable data-driven decision making',
        priority: 'high',
        timeline: '6-9 months',
        investment: 250000,
        impactScore: 8.5,
        resources: '3-4 FTE',
        milestones: ['Platform Selection', 'Data Integration', 'Model Development', 'User Training']
      },
      {
        title: 'Innovation Culture Transformation',
        description: 'Establish systematic innovation processes and experimentation mindset',
        priority: 'medium',
        timeline: '9-12 months',
        investment: 150000,
        impactScore: 7.2,
        resources: '2-3 FTE',
        milestones: ['Framework Design', 'Pilot Program', 'Training Rollout', 'Measurement System']
      }
    ],
    industryBenchmarks: {
      ourScores: {
        technology: 7.5,
        processes: 6.8,
        people: 7.2,
        data: 6.5,
        security: 8.1,
        innovation: 6.0
      },
      industryAverage: {
        technology: 6.8,
        processes: 7.1,
        people: 6.9,
        data: 7.2,
        security: 7.5,
        innovation: 6.8
      },
      topPerformers: [
        { name: 'TechCorp Solutions', industry: 'Technology', score: 9.2 },
        { name: 'InnovateCo', industry: 'Digital Services', score: 8.9 },
        { name: 'DataDriven Inc', industry: 'Analytics', score: 8.7 }
      ],
      peerComparison: [
        { category: 'Mid-Market Tech', average: 7.1 },
        { category: 'Similar Size Orgs', average: 6.9 },
        { category: 'Industry Vertical', average: 7.3 }
      ]
    }
  };
}