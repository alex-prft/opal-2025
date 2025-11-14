'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle,
  AlertTriangle,
  Clock,
  MapPin,
  ArrowRight,
  Calendar,
  Target
} from 'lucide-react';

interface RoadmapPhase {
  phase: string;
  status: string;
}

interface ResultsRoadmapProps {
  data?: RoadmapPhase[];
  isLoading?: boolean;
}

export default function ResultsRoadmap({ data = [], isLoading = false }: ResultsRoadmapProps) {
  // Parse status to get emoji and status type
  const parseStatus = (status: string) => {
    if (status.includes('✅') || status.toLowerCase().includes('complete')) {
      return { type: 'complete', emoji: '✅', label: 'Complete', color: 'green' };
    } else if (status.includes('⚠️') || status.toLowerCase().includes('progress')) {
      return { type: 'in_progress', emoji: '⚠️', label: 'In Progress', color: 'yellow' };
    } else if (status.includes('⏳') || status.toLowerCase().includes('planned')) {
      return { type: 'planned', emoji: '⏳', label: 'Planned', color: 'gray' };
    } else {
      return { type: 'unknown', emoji: '❓', label: 'Unknown', color: 'gray' };
    }
  };

  // Calculate overall progress
  const calculateProgress = () => {
    if (data.length === 0) return 0;

    const completeCount = data.filter(phase =>
      parseStatus(phase.status).type === 'complete'
    ).length;

    const inProgressCount = data.filter(phase =>
      parseStatus(phase.status).type === 'in_progress'
    ).length;

    // Complete phases count as 100%, in-progress as 50%
    const totalProgress = (completeCount * 100) + (inProgressCount * 50);
    const maxProgress = data.length * 100;

    return Math.round((totalProgress / maxProgress) * 100);
  };

  // Get color classes for status
  const getStatusColors = (type: string) => {
    switch (type) {
      case 'complete':
        return {
          badge: 'bg-green-100 text-green-800 border-green-200',
          progress: 'bg-green-500',
          card: 'border-green-200 bg-green-50'
        };
      case 'in_progress':
        return {
          badge: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          progress: 'bg-yellow-500',
          card: 'border-yellow-200 bg-yellow-50'
        };
      case 'planned':
        return {
          badge: 'bg-gray-100 text-gray-800 border-gray-200',
          progress: 'bg-gray-300',
          card: 'border-gray-200 bg-gray-50'
        };
      default:
        return {
          badge: 'bg-gray-100 text-gray-600 border-gray-200',
          progress: 'bg-gray-300',
          card: 'border-gray-200'
        };
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Results Roadmap</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading roadmap data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const overallProgress = calculateProgress();
  const completedPhases = data.filter(phase => parseStatus(phase.status).type === 'complete').length;
  const totalPhases = data.length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Development Roadmap
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Implementation progress and upcoming milestones
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">{overallProgress}%</div>
            <div className="text-xs text-gray-600">Complete</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {data.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No roadmap data available</p>
          </div>
        ) : (
          <>
            {/* Overall Progress Summary */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-sm flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Overall Progress
                </h3>
                <span className="text-sm text-blue-700">
                  {completedPhases} of {totalPhases} phases complete
                </span>
              </div>
              <Progress value={overallProgress} className="h-3" />
              <div className="flex justify-between text-xs text-gray-600 mt-1">
                <span>Started</span>
                <span>{overallProgress}% Complete</span>
                <span>Planned Completion</span>
              </div>
            </div>

            {/* Phase Timeline */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Phase Timeline
              </h3>

              <div className="space-y-3">
                {data.map((phase, index) => {
                  const statusInfo = parseStatus(phase.status);
                  const colors = getStatusColors(statusInfo.type);
                  const isLast = index === data.length - 1;

                  return (
                    <div key={index} className="relative">
                      {/* Timeline line */}
                      {!isLast && (
                        <div className="absolute left-6 top-12 w-0.5 h-8 bg-gray-200" />
                      )}

                      {/* Phase card */}
                      <div className={`border rounded-lg p-4 ${colors.card}`}>
                        <div className="flex items-start gap-4">
                          {/* Status icon */}
                          <div className={`flex-shrink-0 w-12 h-12 rounded-full border-2 flex items-center justify-center ${
                            statusInfo.type === 'complete' ? 'border-green-500 bg-green-100' :
                            statusInfo.type === 'in_progress' ? 'border-yellow-500 bg-yellow-100' :
                            'border-gray-300 bg-gray-100'
                          }`}>
                            <span className="text-lg">{statusInfo.emoji}</span>
                          </div>

                          {/* Phase content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-sm">{phase.phase}</h4>
                              <Badge
                                variant="outline"
                                className={`text-xs ${colors.badge}`}
                              >
                                {statusInfo.label}
                              </Badge>
                            </div>

                            {/* Phase description based on type */}
                            <p className="text-xs text-gray-600 mb-3">
                              {phase.phase.includes('Tier-specific') &&
                                'Core rendering system for tier-based navigation structure'}
                              {phase.phase.includes('Real data integration') &&
                                'Integration with Optimizely APIs and live data sources'}
                              {phase.phase.includes('Interactive visualizations') &&
                                'Advanced charts, graphs, and interactive dashboard components'}
                              {phase.phase.includes('Tier 3 specialization') &&
                                'Specialized views and functionality for individual tier 3 pages'}
                            </p>

                            {/* Progress bar for individual phase */}
                            <div className="space-y-1">
                              <Progress
                                value={statusInfo.type === 'complete' ? 100 :
                                       statusInfo.type === 'in_progress' ? 60 : 0}
                                className="h-2"
                              />
                              <div className="flex justify-between text-xs text-gray-500">
                                <span>Phase {index + 1}</span>
                                <span>
                                  {statusInfo.type === 'complete' ? '100% Complete' :
                                   statusInfo.type === 'in_progress' ? '60% Complete' :
                                   'Not Started'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Arrow to next phase */}
                          {!isLast && (
                            <div className="flex-shrink-0">
                              <ArrowRight className="h-4 w-4 text-gray-400" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Key Milestones */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-sm mb-3 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Key Milestones
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">Phases Complete:</span>
                  <span className="font-medium">{completedPhases}/{totalPhases}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Overall Progress:</span>
                  <span className="font-medium">{overallProgress}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Current Phase:</span>
                  <span className="font-medium">
                    {data.find(p => parseStatus(p.status).type === 'in_progress')?.phase.split('(')[0] || 'Planning'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Next Milestone:</span>
                  <span className="font-medium">
                    {data.find(p => parseStatus(p.status).type === 'planned')?.phase.split('(')[0] || 'All Complete'}
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}