/**
 * Quick Wins Widget
 * Comprehensive widget for Quick Wins section with detailed implementation roadmap
 * Implements all content suggestions for immediate optimization opportunities
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
  TrendingUp,
  Clock,
  DollarSign,
  Target,
  Users,
  Calendar,
  CheckCircle,
  ArrowRight,
  Zap,
  BarChart3,
  Settings,
  AlertTriangle,
  Star,
  ExternalLink
} from 'lucide-react';

export interface QuickWinsWidgetProps {
  data: any;
  context?: any;
  className?: string;
}

export function QuickWinsWidget({ data, context, className = '' }: QuickWinsWidgetProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState('30-day');

  // Extract data with safe defaults
  const quickWinsScore = data?.quickWinsScore || 78;
  const totalOpportunities = data?.totalOpportunities || 12;
  const estimatedImpact = data?.estimatedImpact || 25;

  // Top 3 immediate opportunities
  const topOpportunities = data?.topOpportunities || [
    {
      title: 'Optimize Homepage Load Speed',
      description: 'Implement image compression and CDN optimization',
      impact: 'High',
      effort: 'Low',
      timeline: '2 weeks',
      confidence: 92,
      expectedLift: '15%',
      category: 'Technical'
    },
    {
      title: 'A/B Test CTA Button Colors',
      description: 'Test high-contrast button colors on key conversion pages',
      impact: 'Medium',
      effort: 'Low',
      timeline: '1 week',
      confidence: 88,
      expectedLift: '8%',
      category: 'Content'
    },
    {
      title: 'Enable Basic Personalization',
      description: 'Implement location-based content recommendations',
      impact: 'High',
      effort: 'Medium',
      timeline: '3 weeks',
      confidence: 85,
      expectedLift: '22%',
      category: 'Personalization'
    }
  ];

  // 30-day impact preview
  const impactPreview = {
    conversionRate: { current: 3.2, projected: 4.1, improvement: 28 },
    revenue: { current: 125000, projected: 156250, improvement: 25 },
    engagement: { current: 65, projected: 82, improvement: 26 },
    performance: { current: 78, projected: 91, improvement: 17 }
  };

  // Resource requirements summary
  const resourceSummary = {
    totalHours: 120,
    teamMembers: 4,
    budget: 15000,
    tools: ['Optimizely', 'Google Analytics', 'CDN Service']
  };

  // Success stories from similar customers
  const successStories = [
    {
      company: 'E-commerce Retailer',
      improvement: '35% conversion lift',
      timeframe: '4 weeks',
      initiative: 'Personalized product recommendations'
    },
    {
      company: 'SaaS Platform',
      improvement: '28% engagement increase',
      timeframe: '3 weeks',
      initiative: 'Optimized onboarding flow'
    }
  ];

  const getImpactColor = (impact: string) => {
    switch (impact.toLowerCase()) {
      case 'high': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getEffortColor = (effort: string) => {
    switch (effort.toLowerCase()) {
      case 'low': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'high': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className={`quick-wins-widget-container space-y-6 ${className}`}>
      {/* Hero Section with Quick Wins Score */}
      <Card className="quick-wins-hero-section">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <TrendingUp className="h-6 w-6 text-green-600" />
                Quick Wins Dashboard
              </CardTitle>
              <CardDescription className="text-lg mt-2">
                High-impact, low-effort optimization opportunities ready for immediate implementation
              </CardDescription>
            </div>
            <div className="text-center">
              <div className="relative w-24 h-24 mx-auto">
                <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="3"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="3"
                    strokeDasharray={`${quickWinsScore}, 100`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-bold text-gray-900">{quickWinsScore}</span>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-1">Readiness Score</p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Top 3 Immediate Opportunities */}
      <Card className="top-opportunities-section">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Top 3 Immediate Opportunities
          </CardTitle>
          <CardDescription>
            High-impact initiatives ready for immediate implementation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {topOpportunities.map((opportunity, index) => (
              <Card key={index} className="opportunity-card hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <Badge variant="outline" className={getImpactColor(opportunity.impact)}>
                      {opportunity.impact} Impact
                    </Badge>
                    <Badge variant="outline" className={getEffortColor(opportunity.effort)}>
                      {opportunity.effort} Effort
                    </Badge>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">{opportunity.title}</h4>
                  <p className="text-sm text-gray-600 mb-3">{opportunity.description}</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Timeline:</span>
                      <span className="font-medium">{opportunity.timeline}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Expected Lift:</span>
                      <span className="font-medium text-green-600">{opportunity.expectedLift}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Confidence:</span>
                      <span className="font-medium">{opportunity.confidence}%</span>
                    </div>
                    <Progress value={opportunity.confidence} className="h-2 mt-2" />
                  </div>
                  <Button size="sm" className="w-full mt-3">
                    View Details
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 30-Day Impact Preview */}
      <Card className="impact-preview-section">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            30-Day Impact Preview
          </CardTitle>
          <CardDescription>
            Expected results from quick win implementations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(impactPreview).map(([key, metrics]) => (
              <div key={key} className="p-4 border rounded-lg">
                <h4 className="font-semibold text-sm capitalize mb-2">
                  {key.replace(/([A-Z])/g, ' $1')}
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Current:</span>
                    <span className="font-medium">
                      {key === 'revenue' ? `$${metrics.current.toLocaleString()}` :
                       key === 'conversionRate' ? `${metrics.current}%` :
                       `${metrics.current}%`}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Projected:</span>
                    <span className="font-medium text-green-600">
                      {key === 'revenue' ? `$${metrics.projected.toLocaleString()}` :
                       key === 'conversionRate' ? `${metrics.projected}%` :
                       `${metrics.projected}%`}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Improvement:</span>
                    <span className="font-bold text-green-600">+{metrics.improvement}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Resource Requirement Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="resource-requirements">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              Resource Requirements
            </CardTitle>
            <CardDescription>
              Minimal investment needed for implementation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">Total Hours</span>
                <span className="text-lg font-bold text-purple-600">{resourceSummary.totalHours}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">Team Members</span>
                <span className="text-lg font-bold text-purple-600">{resourceSummary.teamMembers}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">Budget Required</span>
                <span className="text-lg font-bold text-purple-600">${resourceSummary.budget.toLocaleString()}</span>
              </div>
              <div>
                <p className="font-medium mb-2">Required Tools:</p>
                <div className="flex flex-wrap gap-2">
                  {resourceSummary.tools.map((tool, index) => (
                    <Badge key={index} variant="secondary">{tool}</Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="success-stories">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Success Story Examples
            </CardTitle>
            <CardDescription>
              Similar customer achievements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {successStories.map((story, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-sm">{story.company}</h4>
                    <Badge variant="outline" className="text-green-600 bg-green-50">
                      {story.timeframe}
                    </Badge>
                  </div>
                  <p className="text-lg font-bold text-green-600 mb-1">{story.improvement}</p>
                  <p className="text-sm text-gray-600">{story.initiative}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Implementation Difficulty Meter */}
      <Card className="difficulty-meter">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-orange-600" />
            Implementation Difficulty vs Impact Analysis
          </CardTitle>
          <CardDescription>
            Effort vs impact visualization for opportunity prioritization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg text-center">
              <div className="w-16 h-16 mx-auto bg-green-50 rounded-full flex items-center justify-center mb-3">
                <Zap className="h-8 w-8 text-green-600" />
              </div>
              <h4 className="font-semibold mb-1">Low Effort, High Impact</h4>
              <p className="text-2xl font-bold text-green-600 mb-1">5</p>
              <p className="text-sm text-gray-600">Quick wins identified</p>
            </div>
            <div className="p-4 border rounded-lg text-center">
              <div className="w-16 h-16 mx-auto bg-yellow-50 rounded-full flex items-center justify-center mb-3">
                <Target className="h-8 w-8 text-yellow-600" />
              </div>
              <h4 className="font-semibold mb-1">Medium Effort, High Impact</h4>
              <p className="text-2xl font-bold text-yellow-600 mb-1">4</p>
              <p className="text-sm text-gray-600">Strategic initiatives</p>
            </div>
            <div className="p-4 border rounded-lg text-center">
              <div className="w-16 h-16 mx-auto bg-blue-50 rounded-full flex items-center justify-center mb-3">
                <Settings className="h-8 w-8 text-blue-600" />
              </div>
              <h4 className="font-semibold mb-1">Low Effort, Medium Impact</h4>
              <p className="text-2xl font-bold text-blue-600 mb-1">3</p>
              <p className="text-sm text-gray-600">Configuration changes</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation to Detailed Sections */}
      <Card className="navigation-sections">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRight className="h-5 w-5 text-blue-600" />
            Detailed Analysis Sections
          </CardTitle>
          <CardDescription>
            Explore comprehensive quick wins analysis and planning
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            {[
              { title: 'Immediate Opportunities', icon: Zap, description: 'Detailed opportunity analysis' },
              { title: '30-Day Roadmap', icon: Calendar, description: 'Week-by-week implementation plan' },
              { title: 'Resource Requirements', icon: Users, description: 'Skills and budget planning' },
              { title: 'Expected Impact', icon: TrendingUp, description: 'ROI and performance projections' },
              { title: 'Success Metrics', icon: BarChart3, description: 'Measurement framework' }
            ].map((section, index) => (
              <Card key={index} className="nav-section-card hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-3 text-center">
                  <section.icon className="h-6 w-6 mx-auto text-blue-600 mb-2" />
                  <h4 className="font-semibold text-sm mb-1">{section.title}</h4>
                  <p className="text-xs text-gray-600">{section.description}</p>
                  <ExternalLink className="h-3 w-3 mx-auto text-gray-400 mt-2" />
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}