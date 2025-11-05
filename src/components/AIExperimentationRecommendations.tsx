'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import LoadingAnimation, { LoadingPresets } from '@/components/LoadingAnimation';
import {
  Brain,
  TrendingUp,
  Target,
  Clock,
  Users,
  BarChart3,
  Lightbulb,
  RefreshCw,
  Download,
  AlertCircle
} from 'lucide-react';

interface ExperimentRecommendation {
  id: string;
  title: string;
  description: string;
  hypothesis: string;
  tactic: string;
  priority: 'High' | 'Medium' | 'Low';
  effort: 'Low' | 'Medium' | 'High';
  expected_lift: string;
  duration: string;
  success_metrics: string[];
  implementation_steps: string[];
  ai_confidence: number;
}

interface AIExperimentationData {
  recommendations: ExperimentRecommendation[];
  tactics: {
    name: string;
    count: number;
    avg_lift: string;
  }[];
  insights: string[];
  last_generated: string;
}

export default function AIExperimentationRecommendations() {
  const [experimentData, setExperimentData] = useState<AIExperimentationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(false);

  const fetchExperimentRecommendations = async () => {
    const controller = new AbortController();
    setAbortController(controller);
    setIsLoading(true);
    setShowLoadingOverlay(true);

    try {
      const response = await fetch('/api/tools/ai_experimentation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer opal-personalization-secret-2025'
        },
        body: JSON.stringify({
          generate_recommendations: true,
          include_tactics: true,
          confidence_threshold: 0.7
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`AI Experimentation failed: ${response.status}`);
      }

      const result = await response.json();
      setExperimentData(result.data);
      setShowLoadingOverlay(false);
    } catch (error) {
      setShowLoadingOverlay(false);

      if (error instanceof Error && error.name === 'AbortError') {
        console.log('AI Experimentation generation was cancelled by user');
        return;
      }

      // Report error to service status system
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('serviceError', {
          detail: {
            service: 'AI Experimentation',
            issue: error instanceof Error ? error.message : 'Service temporarily unavailable',
            severity: 'medium' as const
          }
        });
        window.dispatchEvent(event);
      }

      // Fallback to demo data
      setExperimentData({
        recommendations: [
          {
            id: 'exp-001',
            title: 'Membership Tier CTA Optimization',
            description: 'Test different membership tier presentations on homepage to increase premium conversions',
            hypothesis: 'Highlighting premium benefits prominently will increase premium membership signups by 15%',
            tactic: 'Landing Page Optimization',
            priority: 'High',
            effort: 'Low',
            expected_lift: '15-20%',
            duration: '2 weeks',
            success_metrics: ['Premium conversion rate', 'Click-through rate on CTA', 'Time on pricing page'],
            implementation_steps: [
              'Create 3 variations of membership tier presentation',
              'Set up tracking for premium CTA clicks',
              'Configure A/B test in Optimizely',
              'Monitor for statistical significance'
            ],
            ai_confidence: 92
          },
          {
            id: 'exp-002',
            title: 'Event Registration Flow Simplification',
            description: 'Streamline event registration process to reduce abandonment',
            hypothesis: 'Reducing registration steps from 5 to 3 will decrease abandonment by 25%',
            tactic: 'Conversion Funnel Optimization',
            priority: 'High',
            effort: 'Medium',
            expected_lift: '20-30%',
            duration: '3 weeks',
            success_metrics: ['Registration completion rate', 'Form abandonment rate', 'Time to complete'],
            implementation_steps: [
              'Analyze current funnel drop-off points',
              'Design simplified 3-step flow',
              'Implement progressive disclosure',
              'Test mobile-optimized version'
            ],
            ai_confidence: 88
          },
          {
            id: 'exp-003',
            title: 'Personalized Content Recommendations',
            description: 'Test AI-driven content recommendations vs. manual curation',
            hypothesis: 'AI-powered content recommendations will increase engagement by 35%',
            tactic: 'Content Personalization',
            priority: 'Medium',
            effort: 'High',
            expected_lift: '30-40%',
            duration: '4 weeks',
            success_metrics: ['Content engagement rate', 'Time on page', 'Return visitor rate'],
            implementation_steps: [
              'Implement Optimizely Content Recommendations',
              'Train AI model on member behavior data',
              'Create fallback manual recommendations',
              'A/B test AI vs manual recommendations'
            ],
            ai_confidence: 85
          }
        ],
        tactics: [
          { name: 'Landing Page Optimization', count: 8, avg_lift: '18%' },
          { name: 'Conversion Funnel Optimization', count: 5, avg_lift: '25%' },
          { name: 'Content Personalization', count: 7, avg_lift: '32%' },
          { name: 'Email Campaign Optimization', count: 4, avg_lift: '22%' },
          { name: 'Mobile Experience Enhancement', count: 6, avg_lift: '28%' }
        ],
        insights: [
          'Member engagement peaks during industry conference seasons (March, September)',
          'Mobile users show 40% higher conversion rates with simplified forms',
          'Premium members are 3x more likely to engage with personalized content',
          'Event registration abandonment is highest at payment step (45% drop-off)',
          'Newer members prefer video content over text-based resources'
        ],
        last_generated: new Date().toISOString()
      });
    } finally {
      setIsLoading(false);
      setAbortController(null);
    }
  };

  const handleCancelGeneration = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
    setShowLoadingOverlay(false);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchExperimentRecommendations();
  }, []);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case 'Low': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'High': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <>
      {showLoadingOverlay && (
        <LoadingAnimation
          title="Generating AI Experiment Recommendations"
          description="Analyzing member behavior patterns and generating personalized experiment suggestions..."
          estimatedTime={15}
          onCancel={handleCancelGeneration}
          variant="overlay"
          cancelButtonText="Cancel Generation"
        />
      )}

      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Brain className="w-6 h-6" />
              AI Experimentation Recommendations
            </h2>
            <p className="text-muted-foreground">AI-generated experiment ideas based on member behavior analysis</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={fetchExperimentRecommendations} variant="outline" size="sm" disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Regenerate
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {experimentData && (
          <>
            {/* Tactics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {experimentData.tactics.map((tactic, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{tactic.count}</div>
                      <div className="text-sm font-medium">{tactic.name}</div>
                      <div className="text-xs text-green-600">Avg. {tactic.avg_lift} lift</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Experiment Recommendations */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Prioritized Experiment Recommendations</h3>
              {experimentData.recommendations.map((experiment) => (
                <Card key={experiment.id} className="border-l-4 border-l-blue-500">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{experiment.title}</CardTitle>
                        <CardDescription>{experiment.description}</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={getPriorityColor(experiment.priority)}>
                          {experiment.priority} Priority
                        </Badge>
                        <Badge className={getEffortColor(experiment.effort)}>
                          {experiment.effort} Effort
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Hypothesis */}
                    <div className="bg-blue-50 p-3 rounded-md">
                      <h4 className="font-medium text-blue-800 mb-1">Hypothesis</h4>
                      <p className="text-sm text-blue-700">{experiment.hypothesis}</p>
                    </div>

                    {/* Key Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <TrendingUp className="h-6 w-6 mx-auto mb-1 text-green-600" />
                        <div className="font-bold text-green-600">{experiment.expected_lift}</div>
                        <div className="text-xs text-muted-foreground">Expected Lift</div>
                      </div>
                      <div className="text-center">
                        <Clock className="h-6 w-6 mx-auto mb-1 text-blue-600" />
                        <div className="font-bold">{experiment.duration}</div>
                        <div className="text-xs text-muted-foreground">Test Duration</div>
                      </div>
                      <div className="text-center">
                        <Target className="h-6 w-6 mx-auto mb-1 text-purple-600" />
                        <div className="font-bold">{experiment.tactic}</div>
                        <div className="text-xs text-muted-foreground">Tactic</div>
                      </div>
                      <div className="text-center">
                        <Brain className="h-6 w-6 mx-auto mb-1 text-orange-600" />
                        <div className="font-bold">{experiment.ai_confidence}%</div>
                        <div className="text-xs text-muted-foreground">AI Confidence</div>
                      </div>
                    </div>

                    {/* Success Metrics */}
                    <div>
                      <h4 className="font-medium mb-2">Success Metrics:</h4>
                      <div className="flex flex-wrap gap-2">
                        {experiment.success_metrics.map((metric, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            <BarChart3 className="h-3 w-3 mr-1" />
                            {metric}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Implementation Steps */}
                    <div>
                      <h4 className="font-medium mb-2">Implementation Steps:</h4>
                      <ol className="space-y-1 text-sm">
                        {experiment.implementation_steps.map((step, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full min-w-[24px] text-center">
                              {idx + 1}
                            </span>
                            <span className="text-muted-foreground">{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2 border-t">
                      <Button size="sm" className="flex-1">
                        Create Experiment
                      </Button>
                      <Button size="sm" variant="outline">
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* AI Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5" />
                  AI-Generated Insights
                </CardTitle>
                <CardDescription>
                  Key behavioral patterns and opportunities identified by AI analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {experimentData.insights.map((insight, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-purple-50 rounded-md">
                      <Brain className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-purple-800">{insight}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </>
  );
}