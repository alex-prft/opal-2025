/**
 * Experimentation Widget - Enhanced
 * Comprehensive experimentation dashboard with advanced personalization integration
 */

'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { LineChart } from '@/components/charts/LineChart';
import { PersonalizationWidget } from './optimization/PersonalizationWidget';
import { OPALData } from '@/lib/widget-config';
import {
  Beaker,
  Target,
  Users,
  TrendingUp,
  Calendar,
  Award,
  BarChart3,
  Settings,
  Brain
} from 'lucide-react';

export interface ExperimentationWidgetProps {
  data: OPALData;
  className?: string;
}

export function ExperimentationWidget({ data, className = '' }: ExperimentationWidgetProps) {
  const {
    experimentPlans,
    testResults,
    businessImpact,
    personalizationRules,
    uxMetrics,
    testSchedule
  } = data;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Beaker className="w-4 h-4 text-blue-500" />;
      case 'completed':
        return <Award className="w-4 h-4 text-green-500" />;
      case 'planned':
        return <Calendar className="w-4 h-4 text-orange-500" />;
      default:
        return <Settings className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'default';
      case 'completed':
        return 'secondary';
      case 'planned':
        return 'outline';
      default:
        return 'destructive';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with business impact summary */}
      {businessImpact && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <TrendingUp className="w-8 h-8 mx-auto mb-2 text-green-500" />
              <p className="text-2xl font-bold">{businessImpact.totalUplift}%</p>
              <p className="text-sm text-gray-600">Total Uplift</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Target className="w-8 h-8 mx-auto mb-2 text-blue-500" />
              <p className="text-2xl font-bold">${businessImpact.revenueImpact?.toLocaleString()}</p>
              <p className="text-sm text-gray-600">Revenue Impact</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Users className="w-8 h-8 mx-auto mb-2 text-purple-500" />
              <p className="text-2xl font-bold">{businessImpact.conversionsAdded}</p>
              <p className="text-sm text-gray-600">Conversions Added</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Beaker className="w-8 h-8 mx-auto mb-2 text-orange-500" />
              <p className="text-2xl font-bold">{businessImpact.experimentsRun}</p>
              <p className="text-sm text-gray-600">Experiments Run</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Award className="w-8 h-8 mx-auto mb-2 text-red-500" />
              <p className="text-2xl font-bold">{businessImpact.winRate}%</p>
              <p className="text-sm text-gray-600">Win Rate</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Enhanced experimentation tabs with AI Personalization */}
      <Tabs defaultValue="experiments" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="experiments">Experiments</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="personalization">Basic Rules</TabsTrigger>
          <TabsTrigger value="ai-personalization">AI Personalization</TabsTrigger>
          <TabsTrigger value="ux">UX Metrics</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
        </TabsList>

        {/* Active Experiments */}
        <TabsContent value="experiments">
          <Card>
            <CardHeader>
              <CardTitle>Experiment Portfolio</CardTitle>
              <CardDescription>
                Current and planned experiments with hypotheses and progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              {experimentPlans && experimentPlans.length > 0 ? (
                <div className="space-y-4">
                  {experimentPlans.map((experiment: any, index: number) => (
                    <Card key={index}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              {getStatusIcon(experiment.status)}
                              <h4 className="font-semibold">{experiment.name}</h4>
                              <Badge variant={getStatusColor(experiment.status)}>
                                {experiment.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-3">{experiment.hypothesis}</p>

                            {/* Variants */}
                            <div className="flex flex-wrap gap-2 mb-3">
                              {experiment.variants?.map((variant: string, idx: number) => (
                                <Badge key={idx} variant="outline">{variant}</Badge>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Results (if running) */}
                        {experiment.status === 'running' && experiment.confidence && (
                          <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg">
                            <div>
                              <p className="text-sm text-blue-600">Confidence Level</p>
                              <p className="text-2xl font-bold text-blue-700">{experiment.confidence}%</p>
                            </div>
                            <div>
                              <p className="text-sm text-blue-600">Current Uplift</p>
                              <p className="text-2xl font-bold text-blue-700">+{experiment.uplift}%</p>
                            </div>
                          </div>
                        )}

                        {/* Expected results (if planned) */}
                        {experiment.status === 'planned' && experiment.expectedLift && (
                          <div className="p-4 bg-orange-50 rounded-lg">
                            <p className="text-sm text-orange-600">Expected Lift</p>
                            <p className="text-xl font-bold text-orange-700">+{experiment.expectedLift}%</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No active experiments</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Test Results */}
        <TabsContent value="results">
          <Card>
            <CardHeader>
              <CardTitle>Completed Test Results</CardTitle>
              <CardDescription>
                Statistical analysis and performance outcomes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {testResults && testResults.length > 0 ? (
                <div className="space-y-4">
                  {testResults.map((result: any, index: number) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold">{result.experiment}</h4>
                        <Badge variant="default">Completed</Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-3 bg-green-50 rounded">
                          <p className="text-lg font-bold text-green-700">{result.winner}</p>
                          <p className="text-xs text-green-600">Winning Variant</p>
                        </div>
                        <div className="text-center p-3 bg-blue-50 rounded">
                          <p className="text-lg font-bold text-blue-700">+{result.improvement}%</p>
                          <p className="text-xs text-blue-600">Improvement</p>
                        </div>
                        <div className="text-center p-3 bg-purple-50 rounded">
                          <p className="text-lg font-bold text-purple-700">{result.significance}%</p>
                          <p className="text-xs text-purple-600">Significance</p>
                        </div>
                        <div className="text-center p-3 bg-gray-50 rounded">
                          <p className="text-lg font-bold text-gray-700">{result.sampleSize?.toLocaleString()}</p>
                          <p className="text-xs text-gray-600">Sample Size</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No completed tests available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced AI Personalization Engine */}
        <TabsContent value="ai-personalization">
          <PersonalizationWidget personalizationData={personalizationRules} />
        </TabsContent>

        {/* Basic Personalization Rules */}
        <TabsContent value="personalization">
          <Card>
            <CardHeader>
              <CardTitle>Personalization Rules</CardTitle>
              <CardDescription>
                Active personalization campaigns and their performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              {personalizationRules && personalizationRules.length > 0 ? (
                <div className="space-y-4">
                  {personalizationRules.map((rule: any, index: number) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-semibold">{rule.name}</h4>
                          <p className="text-sm text-gray-600">Target: {rule.audience}</p>
                        </div>
                        <Badge variant={rule.active ? 'default' : 'secondary'}>
                          {rule.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>

                      {rule.performance && (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-3 bg-blue-50 rounded">
                            <p className="text-lg font-bold text-blue-700">{rule.performance.ctr}%</p>
                            <p className="text-xs text-blue-600">Click-through Rate</p>
                          </div>
                          <div className="text-center p-3 bg-green-50 rounded">
                            <p className="text-lg font-bold text-green-700">{rule.performance.engagement}</p>
                            <p className="text-xs text-green-600">Engagement Score</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No personalization rules configured</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* UX Metrics */}
        <TabsContent value="ux">
          <div className="grid gap-4">
            {uxMetrics && (
              <>
                {/* Key UX Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <p className="text-2xl font-bold">{uxMetrics.userSatisfaction}/5</p>
                      <p className="text-sm text-gray-600">User Satisfaction</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <p className="text-2xl font-bold">{uxMetrics.taskCompletionRate}%</p>
                      <p className="text-sm text-gray-600">Task Completion</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <p className="text-2xl font-bold">{uxMetrics.timeToComplete}s</p>
                      <p className="text-sm text-gray-600">Time to Complete</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <p className="text-2xl font-bold">{uxMetrics.errorRate}%</p>
                      <p className="text-sm text-gray-600">Error Rate</p>
                    </CardContent>
                  </Card>
                </div>

                {/* User Path Analysis */}
                {uxMetrics.pathAnalysis && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <BarChart3 className="w-5 h-5" />
                        <span>User Journey Analysis</span>
                      </CardTitle>
                      <CardDescription>
                        Most common user paths and their conversion rates
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {uxMetrics.pathAnalysis.map((path: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex-1">
                              <h4 className="font-medium mb-1">{path.path}</h4>
                              <p className="text-sm text-gray-600">{path.users?.toLocaleString()} users</p>
                            </div>
                            <div className="flex items-center space-x-3">
                              <Progress value={path.conversionRate * 8} className="w-24" />
                              <Badge variant={path.conversionRate > 10 ? 'default' : 'secondary'}>
                                {path.conversionRate}% conversion
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        </TabsContent>

        {/* Test Schedule */}
        <TabsContent value="schedule">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="w-5 h-5" />
                <span>Experimentation Timeline</span>
              </CardTitle>
              <CardDescription>
                Planned and completed experiments schedule
              </CardDescription>
            </CardHeader>
            <CardContent>
              {testSchedule && testSchedule.length > 0 ? (
                <div className="space-y-4">
                  {testSchedule.map((week: any, index: number) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold">{week.week}</h4>
                        <Badge variant={getStatusColor(week.status)}>
                          {week.status}
                        </Badge>
                      </div>

                      {/* Tests */}
                      <div className="mb-3">
                        <h5 className="font-medium mb-2">Tests:</h5>
                        <div className="flex flex-wrap gap-2">
                          {week.tests?.map((test: string, idx: number) => (
                            <Badge key={idx} variant="outline">{test}</Badge>
                          ))}
                        </div>
                      </div>

                      {/* Results or Expected Completion */}
                      {week.status === 'completed' && week.results ? (
                        <div>
                          <h5 className="font-medium mb-2">Results:</h5>
                          <div className="flex flex-wrap gap-2">
                            {week.results.map((result: string, idx: number) => (
                              <Badge key={idx} variant="secondary">{result}</Badge>
                            ))}
                          </div>
                        </div>
                      ) : week.expectedCompletion ? (
                        <div>
                          <p className="text-sm text-gray-600">
                            Expected completion: {new Date(week.expectedCompletion).toLocaleDateString()}
                          </p>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No test schedule available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}