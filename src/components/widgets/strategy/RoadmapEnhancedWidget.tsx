/**
 * Roadmap Enhanced Widget
 * Comprehensive widget for master implementation roadmap
 * Implements all content suggestions for timeline visualization, milestone tracking, and resource management
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
  Clock,
  Users,
  DollarSign,
  Target,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  BarChart3,
  Layers,
  Activity,
  Shield,
  ExternalLink,
  Filter,
  Zap,
  PlayCircle,
  PauseCircle,
  Settings
} from 'lucide-react';

export interface RoadmapEnhancedWidgetProps {
  data: any;
  context?: any;
  className?: string;
}

export function RoadmapEnhancedWidget({ data, context, className = '' }: RoadmapEnhancedWidgetProps) {
  const [selectedView, setSelectedView] = useState('timeline');
  const [timeFilter, setTimeFilter] = useState('all');

  // Extract data with safe defaults
  const overallProgress = data?.overallProgress || 34;
  const totalMilestones = data?.totalMilestones || 24;
  const completedMilestones = data?.completedMilestones || 8;
  const atRiskItems = data?.atRiskItems || 3;

  // Master timeline data
  const timelineData = data?.timeline || [
    {
      quarter: 'Q1 2024',
      months: ['Jan', 'Feb', 'Mar'],
      milestones: [
        { name: 'Analytics Platform Setup', status: 'completed', date: '2024-01-15' },
        { name: 'Team Onboarding Complete', status: 'completed', date: '2024-02-01' },
        { name: 'Data Governance Framework', status: 'active', date: '2024-03-15' }
      ],
      budget: 125000,
      teamSize: 6,
      progress: 85
    },
    {
      quarter: 'Q2 2024',
      months: ['Apr', 'May', 'Jun'],
      milestones: [
        { name: 'Advanced Personalization', status: 'active', date: '2024-04-30' },
        { name: 'Multi-channel Testing', status: 'planned', date: '2024-05-15' },
        { name: 'Automation Workflows', status: 'planned', date: '2024-06-30' }
      ],
      budget: 180000,
      teamSize: 8,
      progress: 45
    },
    {
      quarter: 'Q3 2024',
      months: ['Jul', 'Aug', 'Sep'],
      milestones: [
        { name: 'ML Model Deployment', status: 'planned', date: '2024-07-31' },
        { name: 'Real-time Optimization', status: 'planned', date: '2024-08-30' },
        { name: 'Omnichannel Platform', status: 'planned', date: '2024-09-30' }
      ],
      budget: 250000,
      teamSize: 10,
      progress: 10
    },
    {
      quarter: 'Q4 2024',
      months: ['Oct', 'Nov', 'Dec'],
      milestones: [
        { name: 'Innovation Lab Setup', status: 'planned', date: '2024-10-31' },
        { name: 'Predictive Analytics', status: 'planned', date: '2024-11-30' },
        { name: 'Market Leadership Validation', status: 'planned', date: '2024-12-31' }
      ],
      budget: 350000,
      teamSize: 12,
      progress: 0
    }
  ];

  // Milestone tracking data
  const milestones = data?.milestones || [
    {
      id: 1,
      name: 'Analytics Platform Implementation',
      description: 'Complete setup of advanced analytics platform',
      dueDate: '2024-01-15',
      status: 'completed',
      owner: 'Tech Team',
      dependencies: [],
      deliverables: ['Platform configuration', 'Data connections', 'Initial reports'],
      progress: 100
    },
    {
      id: 2,
      name: 'Data Governance Framework',
      description: 'Establish comprehensive data quality and governance',
      dueDate: '2024-03-15',
      status: 'active',
      owner: 'Data Team',
      dependencies: ['Analytics Platform Implementation'],
      deliverables: ['Governance policies', 'Quality metrics', 'Compliance documentation'],
      progress: 75
    },
    {
      id: 3,
      name: 'Advanced Personalization Engine',
      description: 'Deploy AI-powered personalization capabilities',
      dueDate: '2024-04-30',
      status: 'at-risk',
      owner: 'Product Team',
      dependencies: ['Data Governance Framework'],
      deliverables: ['ML models', 'Recommendation engine', 'A/B testing framework'],
      progress: 25
    }
  ];

  // Resource allocation data
  const resourceAllocation = data?.resourceAllocation || {
    quarters: ['Q1 2024', 'Q2 2024', 'Q3 2024', 'Q4 2024'],
    teams: [
      {
        name: 'Technical Team',
        allocation: [60, 80, 70, 50],
        budget: [45000, 65000, 85000, 70000]
      },
      {
        name: 'Product Team',
        allocation: [40, 60, 80, 90],
        budget: [35000, 50000, 75000, 95000]
      },
      {
        name: 'Data Team',
        allocation: [80, 70, 85, 75],
        budget: [30000, 45000, 60000, 55000]
      },
      {
        name: 'Marketing Team',
        allocation: [20, 40, 50, 80],
        budget: [15000, 20000, 30000, 45000]
      }
    ]
  };

  // Risk assessment data
  const risks = data?.risks || [
    {
      id: 1,
      name: 'Technical Integration Delays',
      probability: 'High',
      impact: 'High',
      status: 'Active',
      mitigation: 'Dedicated integration team and phased rollout',
      owner: 'Tech Lead',
      dueDate: '2024-03-01'
    },
    {
      id: 2,
      name: 'Resource Availability',
      probability: 'Medium',
      impact: 'Medium',
      status: 'Monitored',
      mitigation: 'Cross-training and contractor backup plan',
      owner: 'Project Manager',
      dueDate: '2024-04-15'
    },
    {
      id: 3,
      name: 'Stakeholder Alignment',
      probability: 'Medium',
      impact: 'High',
      status: 'Mitigated',
      mitigation: 'Regular stakeholder reviews and communication',
      owner: 'Program Director',
      dueDate: '2024-02-28'
    }
  ];

  // Progress indicators
  const progressIndicators = data?.progressIndicators || {
    velocity: {
      current: 8.5,
      target: 10,
      trend: 'up',
      description: 'Story points per sprint'
    },
    quality: {
      current: 92,
      target: 95,
      trend: 'up',
      description: 'Deliverable quality score'
    },
    budget: {
      current: 87,
      target: 90,
      trend: 'down',
      description: 'Budget utilization efficiency'
    },
    satisfaction: {
      current: 4.2,
      target: 4.5,
      trend: 'stable',
      description: 'Stakeholder satisfaction (5.0 scale)'
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'text-green-600 bg-green-50';
      case 'active': return 'text-blue-600 bg-blue-50';
      case 'at-risk': return 'text-yellow-600 bg-yellow-50';
      case 'blocked': return 'text-red-600 bg-red-50';
      case 'planned': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getRiskColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down': return <TrendingUp className="h-4 w-4 text-red-600 transform rotate-180" />;
      case 'stable': return <Activity className="h-4 w-4 text-gray-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className={`roadmap-enhanced-widget-container space-y-6 ${className}`}>
      {/* Hero Section with Master Timeline Visualization */}
      <Card className="roadmap-hero-section">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Calendar className="h-6 w-6 text-indigo-600" />
                Master Implementation Roadmap
              </CardTitle>
              <CardDescription className="text-lg mt-2">
                Comprehensive timeline with milestone tracking, resource allocation, and progress monitoring
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-600">{overallProgress}%</div>
                <div className="text-sm text-gray-600">Complete</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{completedMilestones}/{totalMilestones}</div>
                <div className="text-sm text-gray-600">Milestones</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{atRiskItems}</div>
                <div className="text-sm text-gray-600">At Risk</div>
              </div>
            </div>
          </div>
          <Progress value={overallProgress} className="h-3 mt-4" />
        </CardHeader>
      </Card>

      {/* Interactive Timeline View */}
      <Card className="interactive-timeline">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              Interactive Timeline View
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setTimeFilter('quarter')}>
                Quarter View
              </Button>
              <Button variant="outline" size="sm" onClick={() => setTimeFilter('month')}>
                Month View
              </Button>
              <Button variant="outline" size="sm" onClick={() => setTimeFilter('all')}>
                All Time
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {timelineData.map((quarter, index) => (
              <div key={index} className="relative">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-24 text-sm font-semibold text-gray-900">{quarter.quarter}</div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">Progress: {quarter.progress}%</span>
                      <div className="flex gap-4 text-sm text-gray-600">
                        <span>Budget: ${(quarter.budget / 1000).toFixed(0)}K</span>
                        <span>Team: {quarter.teamSize}</span>
                      </div>
                    </div>
                    <Progress value={quarter.progress} className="h-2" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 ml-28">
                  {quarter.milestones.map((milestone, mIndex) => (
                    <Card key={mIndex} className="milestone-card">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between mb-2">
                          <Badge className={getStatusColor(milestone.status)}>
                            {milestone.status}
                          </Badge>
                          <span className="text-xs text-gray-500">{milestone.date}</span>
                        </div>
                        <h4 className="font-semibold text-sm mb-1">{milestone.name}</h4>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                {index < timelineData.length - 1 && (
                  <div className="absolute left-12 top-16 w-px h-12 bg-gray-300"></div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Tabs */}
      <Tabs value={selectedView} onValueChange={setSelectedView} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="risks">Risks</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
        </TabsList>

        {/* Timeline Detail Tab */}
        <TabsContent value="timeline">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="timeline-details">
              <CardHeader>
                <CardTitle>Timeline Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      3 milestones are at risk of delay. Review resource allocation and dependencies.
                    </AlertDescription>
                  </Alert>
                  <div className="space-y-3">
                    {timelineData.slice(0, 2).map((quarter, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-semibold">{quarter.quarter}</span>
                          <Badge variant="outline">{quarter.progress}% complete</Badge>
                        </div>
                        <div className="text-sm text-gray-600">
                          {quarter.milestones.length} milestones • {quarter.teamSize} team members
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="critical-path">
              <CardHeader>
                <CardTitle>Critical Path Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 border-l-4 border-red-500 bg-red-50 rounded">
                    <h4 className="font-semibold text-red-900">High Priority Dependencies</h4>
                    <p className="text-sm text-red-700">Data governance completion blocks personalization engine</p>
                  </div>
                  <div className="p-3 border-l-4 border-yellow-500 bg-yellow-50 rounded">
                    <h4 className="font-semibold text-yellow-900">Medium Priority</h4>
                    <p className="text-sm text-yellow-700">Team scaling impacts Q3 deliveries</p>
                  </div>
                  <div className="p-3 border-l-4 border-green-500 bg-green-50 rounded">
                    <h4 className="font-semibold text-green-900">On Track</h4>
                    <p className="text-sm text-green-700">Infrastructure components ahead of schedule</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Milestones Tab */}
        <TabsContent value="milestones">
          <Card className="milestone-tracking">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-green-600" />
                Milestone Dashboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {milestones.map((milestone, index) => (
                  <Card key={index} className="milestone-detail">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg mb-1">{milestone.name}</h4>
                          <p className="text-gray-600 text-sm mb-2">{milestone.description}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>Due: {milestone.dueDate}</span>
                            <span>Owner: {milestone.owner}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge className={getStatusColor(milestone.status)}>
                            {milestone.status}
                          </Badge>
                          <span className="text-sm font-medium">{milestone.progress}%</span>
                        </div>
                      </div>
                      <Progress value={milestone.progress} className="h-2 mb-3" />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Dependencies:</span>
                          <ul className="mt-1">
                            {milestone.dependencies.length > 0 ? (
                              milestone.dependencies.map((dep, depIndex) => (
                                <li key={depIndex} className="text-gray-600">• {dep}</li>
                              ))
                            ) : (
                              <li className="text-gray-600">None</li>
                            )}
                          </ul>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Deliverables:</span>
                          <ul className="mt-1">
                            {milestone.deliverables.map((deliverable, delIndex) => (
                              <li key={delIndex} className="text-gray-600">• {deliverable}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Resources Tab */}
        <TabsContent value="resources">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="resource-allocation">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-600" />
                  Team Allocation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {resourceAllocation.teams.map((team, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{team.name}</span>
                        <span className="text-sm text-gray-600">
                          Avg: {Math.round(team.allocation.reduce((sum, val) => sum + val, 0) / team.allocation.length)}%
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-1">
                        {team.allocation.map((allocation, qIndex) => (
                          <div key={qIndex} className="text-center">
                            <div className="text-xs text-gray-600 mb-1">
                              {resourceAllocation.quarters[qIndex]}
                            </div>
                            <Progress value={allocation} className="h-2" />
                            <div className="text-xs mt-1">{allocation}%</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="budget-allocation">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  Budget Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {resourceAllocation.teams.map((team, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{team.name}</span>
                        <span className="text-sm text-gray-600">
                          Total: ${(team.budget.reduce((sum, val) => sum + val, 0) / 1000).toFixed(0)}K
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {team.budget.map((budget, qIndex) => (
                          <div key={qIndex} className="text-center p-2 bg-gray-50 rounded">
                            <div className="text-xs text-gray-600">
                              {resourceAllocation.quarters[qIndex]}
                            </div>
                            <div className="font-medium">${(budget / 1000).toFixed(0)}K</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Risks Tab */}
        <TabsContent value="risks">
          <Card className="risk-assessment">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-red-600" />
                Risk Register & Mitigation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {risks.map((risk, index) => (
                  <Card key={index} className="risk-item">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold mb-1">{risk.name}</h4>
                          <p className="text-sm text-gray-600 mb-2">{risk.mitigation}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>Owner: {risk.owner}</span>
                            <span>Review: {risk.dueDate}</span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <div className="flex gap-2">
                            <Badge className={getRiskColor(risk.probability)}>
                              P: {risk.probability}
                            </Badge>
                            <Badge className={getRiskColor(risk.impact)}>
                              I: {risk.impact}
                            </Badge>
                          </div>
                          <Badge variant="outline">{risk.status}</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Progress Tab */}
        <TabsContent value="progress">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(progressIndicators).map(([key, indicator]) => (
              <Card key={key} className="progress-indicator">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold capitalize">{key}</h4>
                    {getTrendIcon(indicator.trend)}
                  </div>
                  <div className="text-2xl font-bold text-blue-600 mb-1">
                    {key === 'satisfaction' ? indicator.current.toFixed(1) :
                     key === 'velocity' ? indicator.current.toFixed(1) :
                     `${indicator.current}%`}
                  </div>
                  <div className="text-xs text-gray-600 mb-2">{indicator.description}</div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Target:</span>
                    <span>
                      {key === 'satisfaction' ? indicator.target.toFixed(1) :
                       key === 'velocity' ? indicator.target.toFixed(1) :
                       `${indicator.target}%`}
                    </span>
                  </div>
                  <Progress
                    value={key === 'satisfaction' ? (indicator.current / 5) * 100 :
                           key === 'velocity' ? (indicator.current / indicator.target) * 100 :
                           (indicator.current / indicator.target) * 100}
                    className="h-2 mt-2"
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Navigation to Detailed Roadmap Sections */}
      <Card className="roadmap-navigation">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5 text-blue-600" />
            Detailed Roadmap Analysis
          </CardTitle>
          <CardDescription>
            Access comprehensive roadmap planning and execution details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            {[
              { title: 'Timeline View', icon: Calendar, description: 'Interactive timeline' },
              { title: 'Milestone Tracking', icon: Target, description: 'Progress monitoring' },
              { title: 'Resource Allocation', icon: Users, description: 'Team and budget planning' },
              { title: 'Risk Assessment', icon: Shield, description: 'Risk management' },
              { title: 'Progress Indicators', icon: BarChart3, description: 'Health metrics' }
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