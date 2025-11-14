/**
 * Strategy Plans Widget - Enhanced with SOP Compliance
 * Main widget for strategy planning sections with integrated roadmap and maturity components
 * Now includes SOP validation middleware integration
 */

'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { LineChart } from '@/components/charts/LineChart';
import ConfidenceGauge from '@/components/opal/ConfidenceGauge';
import { RoadmapTimeline } from './strategy/RoadmapTimeline';
import { MaturityScoreCard } from './strategy/MaturityScoreCard';
import { OPALData } from '@/lib/widget-config';
import { Target, TrendingUp, Users, Calendar } from 'lucide-react';

export interface StrategyPlansWidgetProps {
  data: OPALData;
  className?: string;
}

export function StrategyPlansWidget({ data, className = '' }: StrategyPlansWidgetProps) {
  const {
    confidenceScore,
    roadmapData,
    maturityData,
    performanceMetrics,
    phaseData
  } = data;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with confidence score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Strategic Planning Overview
            <div className="flex items-center space-x-4">
              {confidenceScore && (
                <div className="text-right">
                  <ConfidenceGauge value={confidenceScore} size={80} />
                  <p className="text-sm text-gray-600 mt-1">Confidence Score</p>
                </div>
              )}
            </div>
          </CardTitle>
          <CardDescription>
            Comprehensive strategic planning insights and roadmap progression
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Main content tabs */}
      <Tabs defaultValue="roadmap" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="roadmap">Roadmap</TabsTrigger>
          <TabsTrigger value="maturity">Maturity</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="phases">Phases</TabsTrigger>
        </TabsList>

        {/* Enhanced Roadmap Timeline */}
        <TabsContent value="roadmap">
          <RoadmapTimeline roadmapData={roadmapData} />
        </TabsContent>

        {/* Enhanced Maturity Assessment */}
        <TabsContent value="maturity">
          <MaturityScoreCard maturityData={maturityData} />
        </TabsContent>

        {/* Performance Metrics */}
        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>
                Key performance indicators and trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              {performanceMetrics && performanceMetrics.length > 0 ? (
                <div className="space-y-4">
                  {/* Metrics Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {performanceMetrics.map((metric: any, index: number) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-sm">{metric.metric}</h4>
                          <Badge variant={metric.trend === 'up' ? 'default' : 'destructive'}>
                            {metric.trend}
                          </Badge>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>Current:</span>
                            <span className="font-medium">{metric.current}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Target:</span>
                            <span className="font-medium">{metric.target}</span>
                          </div>
                          <Progress
                            value={(metric.current / metric.target) * 100}
                            className="h-2 mt-2"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Performance Chart */}
                  <div className="mt-6">
                    <LineChart
                      data={performanceMetrics.map((m: any, i: number) => ({
                        name: m.metric,
                        current: m.current,
                        target: m.target,
                        index: i
                      }))}
                      xDataKey="name"
                      lines={[
                        { dataKey: 'current', stroke: '#3b82f6', name: 'Current' },
                        { dataKey: 'target', stroke: '#10b981', name: 'Target' }
                      ]}
                      height={250}
                    />
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">No performance data available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Phase Details */}
        <TabsContent value="phases">
          <Card>
            <CardHeader>
              <CardTitle>Implementation Phases</CardTitle>
              <CardDescription>
                Detailed phase breakdown with milestones and risks
              </CardDescription>
            </CardHeader>
            <CardContent>
              {phaseData && phaseData.length > 0 ? (
                <div className="space-y-6">
                  {phaseData.map((phase: any, index: number) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="font-semibold">Phase {phase.phase}: {phase.name}</h4>
                          <Progress value={phase.progress} className="w-48 mt-2" />
                          <p className="text-xs text-gray-600 mt-1">{phase.progress}% complete</p>
                        </div>
                      </div>

                      {/* Milestones */}
                      <div className="mb-4">
                        <h5 className="font-medium mb-2">Milestones</h5>
                        <div className="flex flex-wrap gap-2">
                          {phase.milestones?.map((milestone: string, idx: number) => (
                            <Badge key={idx} variant="outline">{milestone}</Badge>
                          ))}
                        </div>
                      </div>

                      {/* Risks */}
                      {phase.risks && phase.risks.length > 0 && (
                        <div>
                          <h5 className="font-medium mb-2">Risks</h5>
                          <div className="flex flex-wrap gap-2">
                            {phase.risks.map((risk: string, idx: number) => (
                              <Badge key={idx} variant="destructive">{risk}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No phase data available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}