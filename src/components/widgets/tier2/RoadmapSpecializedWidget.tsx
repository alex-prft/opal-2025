/**
 * Roadmap Specialized Widget - Crawl-Walk-Run-Fly Methodology
 *
 * Displays strategic roadmap using the four-phase framework:
 * - Crawl (0-3 months): Foundation building and quick wins
 * - Walk (3-8 months): Advanced personalization and testing
 * - Run (8-15 months): AI-driven optimization and cross-channel
 * - Fly (15+ months): Innovation and industry leadership
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Calendar,
  Target,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertTriangle,
  Users,
  DollarSign,
  BarChart3
} from 'lucide-react';

interface RoadmapPhase {
  name: string;
  duration: string;
  focus: string;
  status: 'not-started' | 'in-progress' | 'completed' | 'at-risk';
  progress: number;
  milestones: string[];
  success_criteria: string[];
  resource_requirements: string[];
  key_deliverables?: string[];
}

interface RoadmapData {
  phases?: {
    crawl?: RoadmapPhase;
    walk?: RoadmapPhase;
    run?: RoadmapPhase;
    fly?: RoadmapPhase;
  };
  overall_timeline?: string;
  total_investment?: string;
  expected_roi?: string;
  critical_dependencies?: string[];
}

interface RoadmapSpecializedWidgetProps {
  data: RoadmapData;
  className?: string;
}

export function RoadmapSpecializedWidget({ data, className = '' }: RoadmapSpecializedWidgetProps) {
  const [selectedPhase, setSelectedPhase] = useState<string | null>('crawl');

  // Default phases if not provided in data
  const defaultPhases: Record<string, RoadmapPhase> = {
    crawl: {
      name: 'Crawl Phase',
      duration: '0-3 months',
      focus: 'Foundation building and quick wins',
      status: 'in-progress',
      progress: 65,
      milestones: [
        'Basic personalization setup',
        'A/B testing infrastructure',
        'Data collection framework',
        'Initial content optimization'
      ],
      success_criteria: [
        'Personalization platform deployed',
        'First A/B tests launched',
        'Data pipeline established',
        '15% engagement improvement'
      ],
      resource_requirements: [
        '2 Front-end developers',
        '1 Data engineer',
        '1 UX designer',
        '$50K platform licensing'
      ]
    },
    walk: {
      name: 'Walk Phase',
      duration: '3-8 months',
      focus: 'Advanced personalization and testing',
      status: 'not-started',
      progress: 0,
      milestones: [
        'Dynamic content delivery',
        'Behavioral targeting system',
        'Advanced analytics dashboard',
        'Multi-variant testing'
      ],
      success_criteria: [
        '5+ active experiments running',
        'Behavioral segments defined',
        'Real-time personalization active',
        '25% conversion improvement'
      ],
      resource_requirements: [
        '3 Full-stack developers',
        '1 Data scientist',
        '1 Product manager',
        '$100K additional tooling'
      ]
    },
    run: {
      name: 'Run Phase',
      duration: '8-15 months',
      focus: 'AI-driven optimization and cross-channel',
      status: 'not-started',
      progress: 0,
      milestones: [
        'Machine learning models deployed',
        'Cross-channel orchestration',
        'Predictive analytics implementation',
        'Advanced automation workflows'
      ],
      success_criteria: [
        'AI models in production',
        'Cross-channel campaigns live',
        'Predictive targeting active',
        '40% efficiency improvement'
      ],
      resource_requirements: [
        '2 ML engineers',
        '1 DevOps engineer',
        '1 Campaign manager',
        '$200K ML infrastructure'
      ]
    },
    fly: {
      name: 'Fly Phase',
      duration: '15+ months',
      focus: 'Innovation and industry leadership',
      status: 'not-started',
      progress: 0,
      milestones: [
        'AI-powered automation at scale',
        'Advanced experimentation platform',
        'Industry leadership positioning',
        'Innovation lab initiatives'
      ],
      success_criteria: [
        'Fully automated personalization',
        'Industry recognition achieved',
        'Innovation pipeline established',
        '60% total ROI improvement'
      ],
      resource_requirements: [
        '1 Innovation lead',
        '2 Research engineers',
        '1 Strategy consultant',
        '$300K innovation budget'
      ]
    }
  };

  // Merge provided data with defaults
  const phases = {
    crawl: { ...defaultPhases.crawl, ...(data.phases?.crawl || {}) },
    walk: { ...defaultPhases.walk, ...(data.phases?.walk || {}) },
    run: { ...defaultPhases.run, ...(data.phases?.run || {}) },
    fly: { ...defaultPhases.fly, ...(data.phases?.fly || {}) }
  };

  const getPhaseIcon = (phaseName: string) => {
    switch (phaseName) {
      case 'crawl': return '🐛';
      case 'walk': return '🚶';
      case 'run': return '🏃';
      case 'fly': return '🚀';
      default: return '📊';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in-progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'at-risk': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'in-progress': return <Clock className="w-4 h-4" />;
      case 'at-risk': return <AlertTriangle className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            Strategic Roadmap: Crawl-Walk-Run-Fly Methodology
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-sm">
                <strong>Timeline:</strong> {data.overall_timeline || '18+ months'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-gray-500" />
              <span className="text-sm">
                <strong>Investment:</strong> {data.total_investment || '$650K+'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-gray-500" />
              <span className="text-sm">
                <strong>Expected ROI:</strong> {data.expected_roi || '60%+'}
              </span>
            </div>
          </div>

          {/* Phase Timeline */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Object.entries(phases).map(([phaseKey, phase]) => (
              <Card
                key={phaseKey}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedPhase === phaseKey ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => setSelectedPhase(phaseKey)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{getPhaseIcon(phaseKey)}</span>
                    <h3 className="font-semibold text-sm">{phase.name}</h3>
                  </div>

                  <p className="text-xs text-gray-600 mb-2">{phase.duration}</p>

                  <div className="flex items-center gap-2 mb-3">
                    {getStatusIcon(phase.status)}
                    <Badge className={`text-xs ${getStatusColor(phase.status)}`}>
                      {phase.status.replace('-', ' ')}
                    </Badge>
                  </div>

                  <Progress value={phase.progress} className="h-2" />
                  <p className="text-xs text-gray-500 mt-1">{phase.progress}% complete</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Phase View */}
      {selectedPhase && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-xl">{getPhaseIcon(selectedPhase)}</span>
              {phases[selectedPhase as keyof typeof phases].name} Details
            </CardTitle>
            <p className="text-gray-600">
              {phases[selectedPhase as keyof typeof phases].focus}
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Key Milestones */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Key Milestones
                </h4>
                <ul className="space-y-2">
                  {phases[selectedPhase as keyof typeof phases].milestones.map((milestone, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      {milestone}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Success Criteria */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Success Criteria
                </h4>
                <ul className="space-y-2">
                  {phases[selectedPhase as keyof typeof phases].success_criteria.map((criteria, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <Target className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      {criteria}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Resource Requirements */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Resource Requirements
                </h4>
                <ul className="space-y-2">
                  {phases[selectedPhase as keyof typeof phases].resource_requirements.map((resource, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <DollarSign className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      {resource}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Progress & Timeline */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Progress & Timeline
                </h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Overall Progress</span>
                      <span>{phases[selectedPhase as keyof typeof phases].progress}%</span>
                    </div>
                    <Progress value={phases[selectedPhase as keyof typeof phases].progress} className="h-2" />
                  </div>

                  <div className="text-sm text-gray-600">
                    <p><strong>Duration:</strong> {phases[selectedPhase as keyof typeof phases].duration}</p>
                    <p><strong>Status:</strong>
                      <Badge className={`ml-2 text-xs ${getStatusColor(phases[selectedPhase as keyof typeof phases].status)}`}>
                        {phases[selectedPhase as keyof typeof phases].status.replace('-', ' ')}
                      </Badge>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Critical Dependencies */}
      {data.critical_dependencies && data.critical_dependencies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              Critical Dependencies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {data.critical_dependencies.map((dependency, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                  {dependency}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}