'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, TrendingUp, Target, Lightbulb, BarChart3, CheckCircle } from 'lucide-react';

interface ContentOptimizationWidgetProps {
  data?: any;
  context?: any;
  className?: string;
}

export function ContentOptimizationWidget({ data, context, className = '' }: ContentOptimizationWidgetProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Hero Section */}
      <Card className="bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-orange-600" />
            Experience Optimization → Content
          </CardTitle>
          <p className="text-orange-700 mt-2">
            Comprehensive content strategy and optimization recommendations across your digital experience ecosystem
          </p>
        </CardHeader>
        <CardContent>
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Metric 1: Recommended Content Items */}
            <div className="bg-white rounded-lg p-4 border border-orange-100">
              <h4 className="font-semibold text-blue-900">Recommended New Content Items</h4>
              <div className="text-2xl font-bold text-blue-600">12</div>
              <p className="text-sm text-blue-700">Items in Content Suggestions queue</p>
            </div>

            {/* Metric 2: High-Priority Improvements */}
            <div className="bg-white rounded-lg p-4 border border-orange-100">
              <h4 className="font-semibold text-green-900">High-Priority Improvements</h4>
              <div className="text-2xl font-bold text-green-600">8</div>
              <p className="text-sm text-green-700">Optimization recommendations identified</p>
            </div>

            {/* Metric 3: Tracked Content KPI Types */}
            <div className="bg-white rounded-lg p-4 border border-orange-100">
              <h4 className="font-semibold text-purple-900">Tracked Content KPI Types</h4>
              <div className="text-2xl font-bold text-purple-600">6</div>
              <p className="text-sm text-purple-700">Engagement depth, completion, scroll metrics</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overview Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            Content Strategy Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-gray-700">
              Your content strategy spans multiple optimization areas designed to enhance user engagement, 
              improve content discoverability, and maximize the impact of your content across all digital touchpoints.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Target className="h-5 w-5 text-blue-600 mt-1" />
                <div>
                  <h4 className="font-semibold">Strategic Content Planning</h4>
                  <p className="text-sm text-gray-600">Align content creation with business objectives and user needs</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <TrendingUp className="h-5 w-5 text-green-600 mt-1" />
                <div>
                  <h4 className="font-semibold">Performance Optimization</h4>
                  <p className="text-sm text-gray-600">Improve content engagement and conversion metrics</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Navigation Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Content Strategy Overview Tab */}
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              Content Strategy Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-3">
              Comprehensive view of your content strategy, goals, and current performance metrics
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Strategic alignment assessment</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Content inventory analysis</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI for SEO Tab */}
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              AI for SEO
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-3">
              AI-powered SEO recommendations and performance analytics for content optimization
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Keyword opportunity analysis</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Content optimization suggestions</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content Suggestions Tab */}
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-orange-600" />
              Content Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-3">
              Specific recommendations for improving content performance and engagement
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Engagement improvement tactics</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Content structure optimization</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content Suggestions Tab */}
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              Content Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-3">
              AI-generated content ideas and multi-channel content recommendations
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Topic gap analysis</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Content format recommendations</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content Growth Tab */}
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-green-600" />
              Content Growth
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-3">
              Performance impact analysis and content effectiveness measurement
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Content performance metrics</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Impact measurement framework</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-orange-600" />
            Content Optimization Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Top Performing Content Areas</h4>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Product education content shows 23% higher engagement</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Interactive content formats drive 31% more conversions</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Video content has 2.5x higher completion rates</span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Optimization Opportunities</h4>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-orange-600" />
                  <span className="text-sm">12 content pieces need meta description optimization</span>
                </li>
                <li className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-orange-600" />
                  <span className="text-sm">6 high-traffic pages lack internal linking</span>
                </li>
                <li className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-orange-600" />
                  <span className="text-sm">8 content gaps identified in customer journey</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next Steps Section */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Target className="h-5 w-5 text-blue-600" />
            Recommended Next Steps
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-blue-900 mb-2">Immediate Actions (This Week)</h4>
              <ul className="space-y-1 text-sm">
                <li>• Review Content Strategy Overview for alignment gaps</li>
                <li>• Implement top 3 SEO optimization recommendations</li>
                <li>• Set up tracking for new content KPIs</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-blue-900 mb-2">Strategic Initiatives (Next Month)</h4>
              <ul className="space-y-1 text-sm">
                <li>• Launch AI-powered content suggestions program</li>
                <li>• Implement content optimization workflows</li>
                <li>• Establish content performance measurement framework</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}