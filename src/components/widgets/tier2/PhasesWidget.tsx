/**
 * Phases Widget - Tier-2 Container for Strategy Plans → Phases
 *
 * This widget serves as the tier-2 container specifically for the Phases section
 * within Strategy Plans, providing specialized functionality for phase management.
 */

'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Target, Clock, Users, CheckCircle } from 'lucide-react';
import type { ConditionalRenderingContext } from '@/lib/conditional-rendering';

// Import fallback components
import { Tier2Skeleton, LoadingSpinner } from '@/components/ui/widget-skeleton';
import { CompactDataNotAvailable, DataNotAvailable } from '@/components/ui/data-not-available';

export interface PhasesWidgetProps {
  data?: any;
  context?: ConditionalRenderingContext;
  className?: string;
}

export function PhasesWidget({ data, context, className = '' }: PhasesWidgetProps) {
  // Handle loading and error states
  if (!data && context?.isLoading) {
    return (
      <div className={className}>
        <Tier2Skeleton />
      </div>
    );
  }

  // Handle error state
  if (context?.error) {
    return (
      <div className={className}>
        <DataNotAvailable
          title="Phases Data Unavailable"
          description="Unable to load strategic implementation phases data."
          reason="error"
          tier="tier2"
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  // Handle no data state
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className={className}>
        <DataNotAvailable
          title="Phases Not Configured"
          description="Strategic implementation phases have not been configured yet."
          reason="empty"
          tier="tier2"
          onConfigure={() => {
            window.location.href = '/engine/admin/data-mapping';
          }}
        />
      </div>
    );
  }

  // Extract phase-specific data
  const phaseData = data?.phaseData || {};
  const phase1Data = data?.phase1Data || generateMockPhase1Data();
  const phase2Data = data?.phase2Data || generateMockPhase2Data();
  const phase3Data = data?.phase3Data || generateMockPhase3Data();
  const phase4Data = data?.phase4Data || generateMockPhase4Data();

  return (
    <div className={`phases-widget-container ${className}`}>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Target className="h-6 w-6 text-blue-600" />
            </div>
            Strategic Implementation Phases
          </CardTitle>
          <p className="text-gray-600">
            Comprehensive phase-based approach to Optimizely implementation from foundation to innovation
          </p>
        </CardHeader>
      </Card>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="phase1">Phase 1</TabsTrigger>
          <TabsTrigger value="phase2">Phase 2</TabsTrigger>
          <TabsTrigger value="phase3">Phase 3</TabsTrigger>
          <TabsTrigger value="phase4">Phase 4</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <PhaseOverviewCard
              phase="Phase 1"
              title="Foundation"
              duration="0-3 months"
              progress={phase1Data.progress || 85}
              status={phase1Data.status || 'In Progress'}
              color="blue"
            />
            <PhaseOverviewCard
              phase="Phase 2"
              title="Growth"
              duration="3-6 months"
              progress={phase2Data.progress || 45}
              status={phase2Data.status || 'Planning'}
              color="green"
            />
            <PhaseOverviewCard
              phase="Phase 3"
              title="Optimization"
              duration="6-12 months"
              progress={phase3Data.progress || 15}
              status={phase3Data.status || 'Future'}
              color="yellow"
            />
            <PhaseOverviewCard
              phase="Phase 4"
              title="Innovation"
              duration="12+ months"
              progress={phase4Data.progress || 5}
              status={phase4Data.status || 'Future'}
              color="purple"
            />
          </div>
        </TabsContent>

        <TabsContent value="phase1">
          <PhaseDetailCard
            phase="Phase 1: Foundation"
            description="Establishing core capabilities and infrastructure"
            data={phase1Data}
            color="blue"
          />
        </TabsContent>

        <TabsContent value="phase2">
          <PhaseDetailCard
            phase="Phase 2: Growth"
            description="Scaling capabilities and expanding implementation"
            data={phase2Data}
            color="green"
          />
        </TabsContent>

        <TabsContent value="phase3">
          <PhaseDetailCard
            phase="Phase 3: Optimization"
            description="Performance tuning and capability refinement"
            data={phase3Data}
            color="yellow"
          />
        </TabsContent>

        <TabsContent value="phase4">
          <PhaseDetailCard
            phase="Phase 4: Innovation"
            description="Advanced capabilities and future-state achievements"
            data={phase4Data}
            color="purple"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper Components
function PhaseOverviewCard({ phase, title, duration, progress, status, color }: {
  phase: string;
  title: string;
  duration: string;
  progress: number;
  status: string;
  color: string;
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200'
  };

  return (
    <Card className={`border-2 ${colorClasses[color as keyof typeof colorClasses]}`}>
      <CardContent className="pt-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">{phase}</h3>
          <Badge variant="outline" className="text-xs">
            {status}
          </Badge>
        </div>
        <h4 className="font-bold text-lg">{title}</h4>
        <p className="text-sm opacity-80 mb-3">{duration}</p>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">Progress</span>
            <span className="text-sm font-semibold">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </CardContent>
    </Card>
  );
}

function PhaseDetailCard({ phase, description, data, color }: {
  phase: string;
  description: string;
  data: any;
  color: string;
}) {
  const milestones = data.milestones || [];
  const deliverables = data.deliverables || [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Clock className="h-5 w-5" />
            {phase}
          </CardTitle>
          <p className="text-gray-600">{description}</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Milestones */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Key Milestones
              </h4>
              <div className="space-y-2">
                {milestones.map((milestone: any, index: number) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className={`w-3 h-3 rounded-full ${milestone.completed ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <div className="flex-1">
                      <p className="font-medium">{milestone.title}</p>
                      <p className="text-sm text-gray-600">{milestone.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Deliverables */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Key Deliverables
              </h4>
              <div className="space-y-2">
                {deliverables.map((deliverable: any, index: number) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <h5 className="font-medium">{deliverable.title}</h5>
                    <p className="text-sm text-gray-600 mt-1">{deliverable.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {deliverable.owner}
                      </Badge>
                      <Badge variant={deliverable.status === 'Complete' ? 'default' : 'secondary'} className="text-xs">
                        {deliverable.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Mock data generators for development
function generateMockPhase1Data() {
  return {
    progress: 85,
    status: 'In Progress',
    milestones: [
      {
        title: 'Infrastructure Setup',
        description: 'Core platform configuration and initial setup',
        completed: true
      },
      {
        title: 'Team Training',
        description: 'Initial team onboarding and capability building',
        completed: true
      },
      {
        title: 'First Implementation',
        description: 'Deploy initial use case and validate approach',
        completed: false
      }
    ],
    deliverables: [
      {
        title: 'Platform Configuration',
        description: 'Complete Optimizely platform setup and configuration',
        owner: 'Technical Team',
        status: 'Complete'
      },
      {
        title: 'Training Materials',
        description: 'Comprehensive training documentation and resources',
        owner: 'Training Team',
        status: 'Complete'
      },
      {
        title: 'Implementation Guide',
        description: 'Step-by-step implementation methodology',
        owner: 'Strategy Team',
        status: 'In Progress'
      }
    ]
  };
}

function generateMockPhase2Data() {
  return {
    progress: 45,
    status: 'Planning',
    milestones: [
      {
        title: 'Capability Expansion',
        description: 'Scale implementation across additional use cases',
        completed: false
      },
      {
        title: 'Performance Optimization',
        description: 'Optimize existing implementations for better performance',
        completed: false
      }
    ],
    deliverables: [
      {
        title: 'Scaling Strategy',
        description: 'Plan for expanding implementation scope',
        owner: 'Strategy Team',
        status: 'Planning'
      }
    ]
  };
}

function generateMockPhase3Data() {
  return {
    progress: 15,
    status: 'Future',
    milestones: [],
    deliverables: []
  };
}

function generateMockPhase4Data() {
  return {
    progress: 5,
    status: 'Future',
    milestones: [],
    deliverables: []
  };
}