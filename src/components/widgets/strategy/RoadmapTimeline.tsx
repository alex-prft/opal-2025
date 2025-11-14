/**
 * RoadmapTimeline Component
 * Enhanced timeline visualization for strategic roadmap progression
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  Target,
  Clock,
  CheckCircle2,
  AlertCircle,
  Users,
  DollarSign,
  TrendingUp,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export interface RoadmapTimelineProps {
  roadmapData?: any[];
  className?: string;
}

export function RoadmapTimeline({ roadmapData, className = '' }: RoadmapTimelineProps) {
  const [expandedPhase, setExpandedPhase] = useState<number | null>(null);

  // Use mock data if no real data provided
  const timelineData = roadmapData || generateMockRoadmapData();

  const togglePhaseExpansion = (index: number) => {
    setExpandedPhase(expandedPhase === index ? null : index);
  };

  return (
    <div className={`roadmap-timeline ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Target className="h-6 w-6 text-blue-600" />
            </div>
            Strategic Roadmap Timeline
          </CardTitle>
          <p className="text-gray-600">
            Phase-by-phase implementation roadmap with detailed milestones and resource allocation
          </p>
        </CardHeader>
        <CardContent>
          {/* Timeline Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <TimelineStatCard
              title="Total Phases"
              value={timelineData.length}
              icon={<Target className="h-4 w-4" />}
              color="blue"
            />
            <TimelineStatCard
              title="Active Phases"
              value={timelineData.filter(p => p.status === 'in-progress').length}
              icon={<Clock className="h-4 w-4" />}
              color="orange"
            />
            <TimelineStatCard
              title="Completed"
              value={timelineData.filter(p => p.status === 'completed').length}
              icon={<CheckCircle2 className="h-4 w-4" />}
              color="green"
            />
            <TimelineStatCard
              title="Overall Progress"
              value={`${Math.round(timelineData.reduce((acc, p) => acc + p.progress, 0) / timelineData.length)}%`}
              icon={<TrendingUp className="h-4 w-4" />}
              color="purple"
            />
          </div>

          {/* Timeline Phases */}
          <div className="space-y-4">
            {timelineData.map((phase, index) => (
              <TimelinePhaseCard
                key={index}
                phase={phase}
                index={index}
                isExpanded={expandedPhase === index}
                onToggle={() => togglePhaseExpansion(index)}
                isLast={index === timelineData.length - 1}
              />
            ))}
          </div>

          {/* Timeline Summary */}
          <div className="mt-8 p-6 bg-gray-50 rounded-lg">
            <h4 className="font-semibold mb-3">Timeline Summary</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Total Duration:</span>
                <p className="font-medium">{calculateTotalDuration(timelineData)}</p>
              </div>
              <div>
                <span className="text-gray-600">Estimated Budget:</span>
                <p className="font-medium">{calculateTotalBudget(timelineData)}</p>
              </div>
              <div>
                <span className="text-gray-600">Key Resources:</span>
                <p className="font-medium">{calculateTotalResources(timelineData)} team members</p>
              </div>
              <div>
                <span className="text-gray-600">Critical Path:</span>
                <p className="font-medium">{identifyCriticalPath(timelineData)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function TimelineStatCard({ title, value, icon, color }: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    orange: 'bg-orange-50 text-orange-700 border-orange-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200'
  };

  return (
    <Card className={`${colorClasses[color as keyof typeof colorClasses]}`}>
      <CardContent className="pt-4">
        <div className="flex items-center gap-2 mb-2">
          {icon}
          <h3 className="font-medium text-sm">{title}</h3>
        </div>
        <p className="text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

function TimelinePhaseCard({ phase, index, isExpanded, onToggle, isLast }: {
  phase: any;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  isLast: boolean;
}) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-gray-100 text-gray-800';
      case 'at-risk': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-50 text-red-700 border-red-200';
      case 'medium': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-green-50 text-green-700 border-green-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="relative">
      {/* Timeline connector */}
      {!isLast && (
        <div className="absolute left-6 top-16 w-0.5 h-16 bg-gray-200 z-0" />
      )}

      <Card className="relative z-10">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            {/* Phase number circle */}
            <div className={`
              flex items-center justify-center w-12 h-12 rounded-full text-white font-bold
              ${phase.status === 'completed' ? 'bg-green-500' :
                phase.status === 'in-progress' ? 'bg-blue-500' :
                phase.status === 'at-risk' ? 'bg-red-500' : 'bg-gray-400'}
            `}>
              {phase.status === 'completed' ? (
                <CheckCircle2 className="h-6 w-6" />
              ) : (
                <span>{index + 1}</span>
              )}
            </div>

            <div className="flex-1">
              {/* Phase header */}
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-lg">{phase.name}</h3>
                  <p className="text-sm text-gray-600">{phase.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(phase.status)}>
                    {phase.status.replace('-', ' ')}
                  </Badge>
                  <Badge className={getPriorityColor(phase.priority)}>
                    {phase.priority} priority
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onToggle}
                    className="ml-2"
                  >
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Phase metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span>{phase.duration}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-gray-500" />
                  <span>{phase.teamSize} members</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="h-4 w-4 text-gray-500" />
                  <span>${phase.budget?.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Target className="h-4 w-4 text-gray-500" />
                  <span>{phase.confidence}% confidence</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span>Progress</span>
                  <span>{phase.progress}%</span>
                </div>
                <Progress value={phase.progress} className="h-3" />
              </div>

              {/* Expanded content */}
              {isExpanded && (
                <div className="mt-6 space-y-4 border-t pt-4">
                  {/* Milestones */}
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Key Milestones
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {phase.milestones?.map((milestone: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          <div className={`w-2 h-2 rounded-full ${milestone.completed ? 'bg-green-500' : 'bg-gray-300'}`} />
                          <span className={milestone.completed ? 'line-through text-gray-500' : ''}>{milestone.name}</span>
                          <Badge variant="outline" className="text-xs">{milestone.date}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Deliverables */}
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      Deliverables
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {phase.deliverables?.map((deliverable: string, idx: number) => (
                        <Badge key={idx} variant="outline">{deliverable}</Badge>
                      ))}
                    </div>
                  </div>

                  {/* Risks */}
                  {phase.risks && phase.risks.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-red-500" />
                        Risks & Mitigation
                      </h4>
                      <div className="space-y-2">
                        {phase.risks.map((risk: any, idx: number) => (
                          <div key={idx} className="p-3 bg-red-50 rounded-lg border border-red-200">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-red-900">{risk.risk}</span>
                              <Badge variant="destructive" className="text-xs">{risk.impact} impact</Badge>
                            </div>
                            <p className="text-sm text-red-700">Mitigation: {risk.mitigation}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Dependencies */}
                  {phase.dependencies && phase.dependencies.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Dependencies
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {phase.dependencies.map((dep: string, idx: number) => (
                          <Badge key={idx} variant="secondary">{dep}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper functions
function calculateTotalDuration(phases: any[]) {
  const totalMonths = phases.reduce((acc, phase) => {
    const duration = parseInt(phase.duration.replace(/[^\d]/g, ''));
    return acc + (duration || 0);
  }, 0);
  return `${totalMonths} months`;
}

function calculateTotalBudget(phases: any[]) {
  const total = phases.reduce((acc, phase) => acc + (phase.budget || 0), 0);
  return `$${total.toLocaleString()}`;
}

function calculateTotalResources(phases: any[]) {
  const maxTeam = Math.max(...phases.map(p => p.teamSize || 0));
  return maxTeam;
}

function identifyCriticalPath(phases: any[]) {
  const criticalPhase = phases.find(p => p.priority === 'high' && p.status === 'in-progress');
  return criticalPhase ? criticalPhase.name : phases.find(p => p.priority === 'high')?.name || 'Phase 1';
}

// Mock data generator
function generateMockRoadmapData() {
  return [
    {
      name: 'Foundation & Discovery',
      description: 'Initial setup, requirements gathering, and strategic alignment',
      status: 'completed',
      priority: 'high',
      progress: 100,
      duration: '2-3 months',
      teamSize: 8,
      budget: 150000,
      confidence: 95,
      milestones: [
        { name: 'Stakeholder Alignment', completed: true, date: 'Jan 15' },
        { name: 'Technical Architecture', completed: true, date: 'Feb 1' },
        { name: 'Resource Planning', completed: true, date: 'Feb 15' }
      ],
      deliverables: ['Strategy Document', 'Technical Specs', 'Resource Plan', 'Risk Assessment'],
      risks: [],
      dependencies: ['Executive Approval', 'Budget Allocation']
    },
    {
      name: 'Platform Setup & Integration',
      description: 'Core platform configuration and initial integrations',
      status: 'in-progress',
      priority: 'high',
      progress: 75,
      duration: '3-4 months',
      teamSize: 12,
      budget: 300000,
      confidence: 85,
      milestones: [
        { name: 'Environment Setup', completed: true, date: 'Mar 1' },
        { name: 'Core Integrations', completed: true, date: 'Mar 15' },
        { name: 'Initial Testing', completed: false, date: 'Apr 1' },
        { name: 'Security Review', completed: false, date: 'Apr 15' }
      ],
      deliverables: ['Platform Configuration', 'Integration Framework', 'Testing Suite', 'Security Protocols'],
      risks: [
        { risk: 'Integration Complexity', impact: 'medium', mitigation: 'Phased approach with fallback options' },
        { risk: 'Resource Availability', impact: 'high', mitigation: 'Cross-training and contractor support' }
      ],
      dependencies: ['Phase 1 Completion', 'Infrastructure Readiness']
    },
    {
      name: 'Feature Development & Optimization',
      description: 'Core feature implementation and performance optimization',
      status: 'pending',
      priority: 'high',
      progress: 25,
      duration: '4-6 months',
      teamSize: 15,
      budget: 450000,
      confidence: 78,
      milestones: [
        { name: 'Core Features MVP', completed: false, date: 'May 1' },
        { name: 'Performance Optimization', completed: false, date: 'Jun 1' },
        { name: 'User Acceptance Testing', completed: false, date: 'Jul 1' },
        { name: 'Production Readiness', completed: false, date: 'Aug 1' }
      ],
      deliverables: ['Feature Set', 'Performance Reports', 'UAT Results', 'Deployment Guide'],
      risks: [
        { risk: 'Feature Complexity', impact: 'high', mitigation: 'Iterative development and regular reviews' },
        { risk: 'Performance Targets', impact: 'medium', mitigation: 'Early performance testing and optimization' }
      ],
      dependencies: ['Phase 2 Completion', 'User Feedback Integration']
    },
    {
      name: 'Launch & Scaling',
      description: 'Production launch, user onboarding, and scaling strategies',
      status: 'pending',
      priority: 'medium',
      progress: 10,
      duration: '2-3 months',
      teamSize: 10,
      budget: 200000,
      confidence: 70,
      milestones: [
        { name: 'Soft Launch', completed: false, date: 'Sep 1' },
        { name: 'Full Production Launch', completed: false, date: 'Sep 15' },
        { name: 'User Onboarding', completed: false, date: 'Oct 1' },
        { name: 'Scaling Implementation', completed: false, date: 'Oct 15' }
      ],
      deliverables: ['Launch Plan', 'User Guides', 'Scaling Strategy', 'Support Documentation'],
      risks: [
        { risk: 'User Adoption', impact: 'high', mitigation: 'Comprehensive training and support programs' },
        { risk: 'Scaling Challenges', impact: 'medium', mitigation: 'Infrastructure monitoring and auto-scaling' }
      ],
      dependencies: ['Phase 3 Completion', 'Change Management Readiness']
    }
  ];
}