'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LoadingAnimation, { LoadingPresets } from '@/components/LoadingAnimation';
import { PMGWorkflowOutput } from '@/lib/types/maturity';
import {
  Zap,
  TrendingUp,
  Target,
  Clock,
  DollarSign,
  Users,
  Lightbulb,
  CheckCircle,
  AlertCircle,
  BarChart3,
  RefreshCw,
  Download,
  Sparkles,
  ArrowRight,
  Calendar
} from 'lucide-react';

interface AEOAuditDashboardProps {
  workflowResult?: PMGWorkflowOutput | null;
}

export default function AEOAuditDashboard({ workflowResult }: AEOAuditDashboardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(false);

  const fetchAEOAnalysis = async () => {
    const controller = new AbortController();
    setAbortController(controller);
    setIsLoading(true);
    setShowLoadingOverlay(true);

    try {
      const response = await fetch('/api/tools/aeo_audit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer opal-personalization-secret-2025'
        },
        body: JSON.stringify({
          analyze_optimization: true,
          include_recommendations: true,
          maturity_context: workflowResult?.maturity_plan
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`AEO Audit failed: ${response.status}`);
      }

      const result = await response.json();
      // In a real implementation, you would update state with the result
      setShowLoadingOverlay(false);
    } catch (error) {
      setShowLoadingOverlay(false);

      if (error instanceof Error && error.name === 'AbortError') {
        console.log('AEO Audit analysis was cancelled by user');
        return;
      }

      console.error('AEO Audit error:', error);
    } finally {
      setIsLoading(false);
      setAbortController(null);
    }
  };

  const handleCancelAnalysis = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
    setShowLoadingOverlay(false);
    setIsLoading(false);
  };

  if (!workflowResult?.maturity_plan) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Zap className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No AEO Analysis Available</h3>
          <p className="text-muted-foreground mb-4">
            Generate a strategy first to see Automated Experience Optimization results.
          </p>
          <Button variant="outline" onClick={fetchAEOAnalysis} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Run AEO Analysis
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { maturity_plan } = workflowResult;

  const getPhaseColor = (phase: string) => {
    switch (phase.toLowerCase()) {
      case 'crawl': return 'bg-red-100 text-red-800';
      case 'walk': return 'bg-yellow-100 text-yellow-800';
      case 'run': return 'bg-blue-100 text-blue-800';
      case 'fly': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string | undefined) => {
    if (!priority) return 'bg-gray-100 text-gray-800';
    switch (priority.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <>
      {showLoadingOverlay && (
        <LoadingAnimation
          title="Running AEO Audit Analysis"
          description="Analyzing automated experience optimization opportunities and generating actionable insights..."
          estimatedTime={25}
          onCancel={handleCancelAnalysis}
          variant="overlay"
          cancelButtonText="Cancel Analysis"
        />
      )}

      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Zap className="w-6 h-6" />
              AEO Audit Dashboard
            </h2>
            <p className="text-muted-foreground">Automated Experience Optimization insights from Optimizely Opal</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={fetchAEOAnalysis} variant="outline" size="sm" disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh Analysis
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Maturity Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Current Maturity</p>
                  <p className="text-2xl font-bold capitalize">{maturity_plan.current_phase}</p>
                </div>
                <Badge className={getPhaseColor(maturity_plan.current_phase)}>
                  Phase {maturity_plan.current_phase}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Target Phase</p>
                  <p className="text-2xl font-bold capitalize">{maturity_plan.target_phase}</p>
                </div>
                <Target className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Maturity Score</p>
                  <p className="text-2xl font-bold">{maturity_plan.overall_maturity_score}/5</p>
                </div>
                <BarChart3 className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Budget Est.</p>
                  <p className="text-2xl font-bold">{maturity_plan.budget_estimates?.[0]?.cost_range || 'TBD'}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="roadmap">Roadmap</TabsTrigger>
            <TabsTrigger value="priorities">Priorities</TabsTrigger>
            <TabsTrigger value="recommendations">AI Recommendations</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Executive Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Executive Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {workflowResult.executive_summary}
                </p>
              </CardContent>
            </Card>

            {/* Next Steps */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowRight className="w-5 h-5" />
                  Immediate Next Steps
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(workflowResult.next_steps || []).map((step, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-md">
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full min-w-[24px] text-center">
                        {index + 1}
                      </span>
                      <p className="text-sm">{step}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="roadmap" className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Implementation Roadmap</h3>
              {Object.values(maturity_plan.roadmap || {}).flat().map((item: any, index: number) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="font-semibold text-lg">{item.milestone}</h4>
                        <p className="text-muted-foreground">{item.description}</p>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={getPriorityColor('medium')}>
                          Medium Priority
                        </Badge>
                        <Badge variant="outline">
                          {item.timeline}
                        </Badge>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground">Success Criteria</div>
                        <div className="font-medium">{item.success_criteria?.join(', ') || 'TBD'}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Dependencies</div>
                        <div className="text-sm">{item.dependencies?.join(', ') || 'None'}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Owner</div>
                        <Badge variant="secondary">{item.owner || 'TBD'}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="priorities" className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Strategic Priorities</h3>
              {(maturity_plan.strategic_priorities || []).map((priority: string, index: number) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <h4 className="font-semibold">Priority {index + 1}</h4>
                        <p className="text-muted-foreground">{priority}</p>
                      </div>
                      <Badge className={getPriorityColor('high')}>
                        High Priority
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-6">
            {maturity_plan.intelligent_recommendations && (
              <>
                {/* Quick Wins */}
                {maturity_plan.intelligent_recommendations.quick_wins && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Lightbulb className="w-5 h-5" />
                        Quick Wins
                      </CardTitle>
                      <CardDescription>
                        High-impact, low-effort optimization opportunities
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {(maturity_plan.intelligent_recommendations?.quick_wins || []).map((win, index) => (
                          <div key={index} className="flex items-start gap-3 p-3 bg-green-50 rounded-md">
                            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <h5 className="font-medium">{win.title || `Quick Win ${index + 1}`}</h5>
                              <p className="text-sm text-muted-foreground">{win.description || win}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Technology Synergies */}
                {maturity_plan.intelligent_recommendations.technology_synergies && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Zap className="w-5 h-5" />
                        Technology Synergies
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {(maturity_plan.intelligent_recommendations?.technology_synergies || []).map((synergy, index) => (
                          <Badge key={index} variant="outline">
                            {synergy}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="resources" className="space-y-6">
            {/* Resource Requirements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Resource Requirements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(maturity_plan.resource_requirements || []).map((resource, index) => (
                    <div key={index} className="p-4 border rounded-md">
                      <h4 className="font-medium mb-2">{resource.role}</h4>
                      <p className="text-sm text-muted-foreground mb-2">{resource.skills_needed?.join(', ')}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">FTE Requirement:</span>
                        <Badge variant="secondary">{resource.fte_requirement}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Vendor Recommendations */}
            {maturity_plan.vendor_recommendations && maturity_plan.vendor_recommendations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Recommended Vendors</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(maturity_plan.vendor_recommendations || []).map((vendor, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-md">
                        <div>
                          <h4 className="font-medium">{vendor.vendor_name}</h4>
                          <p className="text-sm text-muted-foreground">{vendor.use_case}</p>
                        </div>
                        <Badge variant="outline">{vendor.category}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}