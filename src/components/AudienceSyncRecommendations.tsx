'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Database,
  Link,
  CheckCircle,
  AlertTriangle,
  Clock,
  TrendingUp,
  Settings,
  Zap,
  Shield,
  ArrowRight
} from 'lucide-react';

interface SyncRecommendation {
  id: string;
  title: string;
  description: string;
  priority: 'High' | 'Medium' | 'Low';
  effort: 'Low' | 'Medium' | 'High';
  impact: string;
  current_state: 'Not Connected' | 'Partially Connected' | 'Connected';
  recommended_action: string;
  technical_requirements: string[];
  business_benefits: string[];
  timeline: string;
  data_sources: string[];
}

export default function AudienceSyncRecommendations() {
  const [selectedPriority, setSelectedPriority] = useState<string>('all');

  const syncRecommendations: SyncRecommendation[] = [
    {
      id: 'salesforce-odp-integration',
      title: 'Salesforce CRM → Optimizely Data Platform Sync',
      description: 'Connect IFPA member data from Salesforce to ODP for unified audience segmentation and personalization',
      priority: 'High',
      effort: 'Medium',
      impact: 'Enable personalized experiences based on member type, engagement history, and preferences',
      current_state: 'Not Connected',
      recommended_action: 'Implement real-time data sync using Salesforce Connect and ODP REST API',
      technical_requirements: [
        'Salesforce Connect license and configuration',
        'ODP API credentials and endpoint setup',
        'Data mapping for member attributes',
        'Real-time sync webhook configuration',
        'Data governance and PII handling protocols'
      ],
      business_benefits: [
        'Personalize website content based on member tier',
        'Target events and content to member interests',
        'Reduce member churn through tailored engagement',
        'Increase member portal usage and satisfaction'
      ],
      timeline: '4-6 weeks',
      data_sources: ['Salesforce CRM', 'Member Portal Data', 'Event Registration History']
    },
    {
      id: 'marketing-cloud-odp-sync',
      title: 'Salesforce Marketing Cloud → ODP Email Behavior Sync',
      description: 'Sync email engagement data to enhance audience targeting and personalization triggers',
      priority: 'High',
      effort: 'Low',
      impact: 'Improve email personalization and reduce unsubscribe rates by 30%',
      current_state: 'Partially Connected',
      recommended_action: 'Configure Marketing Cloud Connector for bidirectional data flow',
      technical_requirements: [
        'Marketing Cloud Connector setup',
        'Email engagement event mapping',
        'Audience sync configuration',
        'Preference center integration',
        'Unsubscribe handling automation'
      ],
      business_benefits: [
        'Reduce email fatigue and improve engagement',
        'Create email-behavior-based website personalization',
        'Improve email deliverability scores',
        'Enable cross-channel message suppression'
      ],
      timeline: '2-3 weeks',
      data_sources: ['Email Opens/Clicks', 'Unsubscribe Data', 'Email Preferences']
    },
    {
      id: 'web-behavior-crm-sync',
      title: 'Website Behavior → Salesforce Lead Scoring',
      description: 'Send website engagement signals back to Salesforce for enhanced lead scoring and member insights',
      priority: 'Medium',
      effort: 'Medium',
      impact: 'Improve member lifecycle management and identify high-value prospects',
      current_state: 'Not Connected',
      recommended_action: 'Implement ODP to Salesforce webhook integration for behavioral scoring',
      technical_requirements: [
        'Salesforce webhook receiver setup',
        'Lead scoring model configuration',
        'Website event tracking enhancement',
        'Member identification and matching logic',
        'Data validation and error handling'
      ],
      business_benefits: [
        'Identify high-engagement prospects for sales outreach',
        'Improve member renewal prediction accuracy',
        'Enable proactive member success interventions',
        'Enhance event and program recommendation accuracy'
      ],
      timeline: '3-4 weeks',
      data_sources: ['Page Views', 'Content Downloads', 'Event Registrations', 'Search Queries']
    },
    {
      id: 'event-management-integration',
      title: 'Event Platform → Member Profile Enhancement',
      description: 'Sync event attendance and engagement data to create richer member profiles for personalization',
      priority: 'Medium',
      effort: 'High',
      impact: 'Enable event-based personalization and improve attendee experience',
      current_state: 'Not Connected',
      recommended_action: 'Build custom integration with event management platform API',
      technical_requirements: [
        'Event platform API integration',
        'Attendee matching and deduplication',
        'Session and networking data capture',
        'Real-time attendance tracking',
        'Post-event engagement measurement'
      ],
      business_benefits: [
        'Personalize content based on event attendance history',
        'Recommend relevant future events and sessions',
        'Improve event planning through attendance patterns',
        'Enhance networking and connection opportunities'
      ],
      timeline: '6-8 weeks',
      data_sources: ['Event Registrations', 'Session Attendance', 'Networking Data', 'Feedback Scores']
    },
    {
      id: 'content-engagement-sync',
      title: 'Content Performance → Member Interest Mapping',
      description: 'Track content consumption patterns to build member interest profiles for targeted recommendations',
      priority: 'Low',
      effort: 'Low',
      impact: 'Improve content relevance and member engagement with resources',
      current_state: 'Partially Connected',
      recommended_action: 'Enhance existing content tracking with interest categorization and member mapping',
      technical_requirements: [
        'Content categorization taxonomy',
        'Enhanced analytics event tracking',
        'Interest scoring algorithm',
        'Member preference learning model',
        'Content recommendation engine enhancement'
      ],
      business_benefits: [
        'Deliver more relevant content recommendations',
        'Reduce content discovery time for members',
        'Increase member portal engagement',
        'Improve content ROI measurement'
      ],
      timeline: '2-3 weeks',
      data_sources: ['Content Views', 'Download Behavior', 'Reading Time', 'Content Sharing']
    }
  ];

  const filteredRecommendations = selectedPriority === 'all'
    ? syncRecommendations
    : syncRecommendations.filter(rec => rec.priority === selectedPriority);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-800 border-red-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case 'Low': return 'bg-green-100 text-green-700';
      case 'Medium': return 'bg-yellow-100 text-yellow-700';
      case 'High': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStateIcon = (state: string) => {
    switch (state) {
      case 'Connected':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'Partially Connected':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'Not Connected':
        return <Database className="h-5 w-5 text-gray-400" />;
      default:
        return <Database className="h-5 w-5 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Link className="h-6 w-6" />
            Audience Sync Recommendations
          </h2>
          <p className="text-muted-foreground">
            Strategic data integration opportunities to enhance IFPA's personalization capabilities
          </p>
        </div>
        <Button className="gap-2">
          <Settings className="h-4 w-4" />
          Configure Sync
        </Button>
      </div>

      {/* Priority Filter */}
      <div className="flex gap-2">
        <Button
          variant={selectedPriority === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedPriority('all')}
        >
          All Recommendations ({syncRecommendations.length})
        </Button>
        {['High', 'Medium', 'Low'].map(priority => (
          <Button
            key={priority}
            variant={selectedPriority === priority ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedPriority(priority)}
          >
            {priority} Priority ({syncRecommendations.filter(rec => rec.priority === priority).length})
          </Button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">High Priority</p>
                <p className="text-2xl font-bold text-red-600">
                  {syncRecommendations.filter(r => r.priority === 'High').length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Connected</p>
                <p className="text-2xl font-bold text-green-600">
                  {syncRecommendations.filter(r => r.current_state === 'Connected').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Quick Wins</p>
                <p className="text-2xl font-bold text-blue-600">
                  {syncRecommendations.filter(r => r.effort === 'Low' && r.priority === 'High').length}
                </p>
              </div>
              <Zap className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Timeline</p>
                <p className="text-2xl font-bold text-purple-600">4-5</p>
                <p className="text-xs text-muted-foreground">weeks</p>
              </div>
              <Clock className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendation Cards */}
      <div className="space-y-6">
        {filteredRecommendations.map((recommendation) => (
          <Card key={recommendation.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getStateIcon(recommendation.current_state)}
                    <CardTitle className="text-lg">{recommendation.title}</CardTitle>
                  </div>
                  <CardDescription className="text-base">
                    {recommendation.description}
                  </CardDescription>
                </div>
                <div className="flex gap-2 ml-4">
                  <Badge className={getPriorityColor(recommendation.priority)}>
                    {recommendation.priority} Priority
                  </Badge>
                  <Badge className={getEffortColor(recommendation.effort)}>
                    {recommendation.effort} Effort
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Status and Impact */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-sm text-gray-700 mb-2 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Expected Impact
                  </h4>
                  <p className="text-sm text-gray-600">{recommendation.impact}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-gray-700 mb-2 flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Current State
                  </h4>
                  <div className="flex items-center gap-2">
                    {getStateIcon(recommendation.current_state)}
                    <span className="text-sm">{recommendation.current_state}</span>
                  </div>
                </div>
              </div>

              {/* Recommended Action */}
              <div>
                <h4 className="font-semibold text-sm text-gray-700 mb-2 flex items-center gap-2">
                  <ArrowRight className="h-4 w-4" />
                  Recommended Action
                </h4>
                <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-md border-l-4 border-blue-400">
                  {recommendation.recommended_action}
                </p>
              </div>

              {/* Technical Requirements and Business Benefits */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-sm text-gray-700 mb-3 flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    Technical Requirements
                  </h4>
                  <ul className="space-y-2">
                    {recommendation.technical_requirements.map((req, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-gray-700 mb-3 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Business Benefits
                  </h4>
                  <ul className="space-y-2">
                    {recommendation.business_benefits.map((benefit, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Data Sources and Timeline */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                <div>
                  <h4 className="font-semibold text-sm text-gray-700 mb-2">Data Sources</h4>
                  <div className="flex flex-wrap gap-2">
                    {recommendation.data_sources.map((source, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {source}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-gray-700 mb-2 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Implementation Timeline
                  </h4>
                  <p className="text-sm text-gray-600">{recommendation.timeline}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between items-center pt-4 border-t">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Shield className="h-4 w-4" />
                  <span>Includes data governance and PII protection measures</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    View Technical Spec
                  </Button>
                  <Button size="sm" className="gap-2">
                    <Settings className="h-4 w-4" />
                    Start Implementation
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredRecommendations.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Link className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No recommendations found</h3>
            <p className="text-gray-500">
              Try selecting a different priority level or check back later for new recommendations
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}