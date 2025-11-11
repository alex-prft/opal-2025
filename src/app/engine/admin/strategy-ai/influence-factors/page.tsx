'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Users, TrendingUp, Database } from 'lucide-react';

export default function InfluenceFactorsPage() {
  const [influenceFactors] = useState({
    formResponses: {
      currentPhase: 'Explore',
      targetPhase: 'Run',
      industryFocus: 'Fresh Produce',
      teamSize: 8,
      budget: '$50k-100k',
      timeline: '6 months',
      influence: 35
    },
    analyticsData: {
      trafficVolume: 87340,
      conversionRate: 2.4,
      segmentCount: 12,
      influence: 25
    },
    integrationHealth: {
      salesforce: 'healthy' as const,
      ga4: 'healthy' as const,
      optimizely: 'warning' as const,
      sendgrid: 'healthy' as const,
      influence: 40
    }
  });

  const getHealthStatusColor = (status: 'healthy' | 'warning' | 'error') => {
    switch (status) {
      case 'healthy': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getHealthStatusText = (status: 'healthy' | 'warning' | 'error') => {
    switch (status) {
      case 'healthy': return 'Operational';
      case 'warning': return 'Issues Detected';
      case 'error': return 'Connection Error';
      default: return 'Unknown';
    }
  };

  return (
    <div className="space-y-6" id="influence-factors-page">
      {/* Header */}
      <div id="page-header">
        <h1 className="text-3xl font-bold text-gray-900">AI Strategy Influence Factors</h1>
        <p className="text-gray-600 mt-1">
          Configure how different data sources influence AI-powered strategy recommendations
        </p>
      </div>

      {/* Influence Factor Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="influence-factor-cards">
        {/* Form Responses Influence */}
        <Card id="form-responses-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Form Responses
              <Badge variant="secondary">{influenceFactors.formResponses.influence}% influence</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2" id="current-phase-section">
              <Label className="text-sm font-medium">Current Phase</Label>
              <div className="text-2xl font-bold text-blue-600">
                {influenceFactors.formResponses.currentPhase}
              </div>
            </div>

            <div className="space-y-2" id="target-phase-section">
              <Label className="text-sm font-medium">Target Phase</Label>
              <div className="text-2xl font-bold text-green-600">
                {influenceFactors.formResponses.targetPhase}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t" id="form-details-grid">
              <div>
                <Label className="text-xs text-gray-500">Industry</Label>
                <div className="font-medium">{influenceFactors.formResponses.industryFocus}</div>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Team Size</Label>
                <div className="font-medium">{influenceFactors.formResponses.teamSize} people</div>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Budget</Label>
                <div className="font-medium">{influenceFactors.formResponses.budget}</div>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Timeline</Label>
                <div className="font-medium">{influenceFactors.formResponses.timeline}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Analytics Data Influence */}
        <Card id="analytics-data-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Analytics Data
              <Badge variant="secondary">{influenceFactors.analyticsData.influence}% influence</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2" id="monthly-sessions-section">
              <Label className="text-sm font-medium">Monthly Sessions</Label>
              <div className="text-2xl font-bold text-green-600">
                {influenceFactors.analyticsData.trafficVolume.toLocaleString()}
              </div>
            </div>

            <div className="space-y-2" id="conversion-rate-section">
              <Label className="text-sm font-medium">Conversion Rate</Label>
              <div className="text-2xl font-bold text-blue-600">
                {influenceFactors.analyticsData.conversionRate}%
              </div>
            </div>

            <div className="pt-4 border-t" id="segments-section">
              <Label className="text-xs text-gray-500">Active Segments</Label>
              <div className="text-lg font-medium">{influenceFactors.analyticsData.segmentCount} segments</div>
            </div>

            <div className="text-xs text-gray-500" id="data-range-info">
              Data Range: Last 90 Days
            </div>
          </CardContent>
        </Card>

        {/* Integration Health Influence */}
        <Card id="integration-health-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5 text-purple-600" />
              Integration Health
              <Badge variant="secondary">{influenceFactors.integrationHealth.influence}% influence</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div id="integrations-list">
              {Object.entries(influenceFactors.integrationHealth).filter(([key]) => key !== 'influence').map(([integration, status]) => (
                <div key={integration} className="flex items-center justify-between" id={`integration-${integration}`}>
                  <span className="font-medium capitalize">{integration}</span>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${getHealthStatusColor(status as any)}`} />
                    <span className="text-sm text-gray-600">
                      {getHealthStatusText(status as any)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t text-xs text-gray-500" id="integration-info">
              Integration health affects data quality and recommendation confidence
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Influence Weight Distribution */}
      <Card id="influence-distribution-card">
        <CardHeader>
          <CardTitle>Factor Influence Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4" id="distribution-bars">
            <div className="flex items-center justify-between" id="form-responses-bar">
              <span>Form Responses</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${influenceFactors.formResponses.influence}%` }}
                  />
                </div>
                <span className="text-sm font-medium w-12">{influenceFactors.formResponses.influence}%</span>
              </div>
            </div>

            <div className="flex items-center justify-between" id="analytics-data-bar">
              <span>Analytics Data</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: `${influenceFactors.analyticsData.influence}%` }}
                  />
                </div>
                <span className="text-sm font-medium w-12">{influenceFactors.analyticsData.influence}%</span>
              </div>
            </div>

            <div className="flex items-center justify-between" id="integration-health-bar">
              <span>Integration Health</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full"
                    style={{ width: `${influenceFactors.integrationHealth.influence}%` }}
                  />
                </div>
                <span className="text-sm font-medium w-12">{influenceFactors.integrationHealth.influence}%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}