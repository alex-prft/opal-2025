/**
 * Results Page Base Component
 *
 * Standardized base component for all Results widgets ensuring consistent
 * section structure: Overview → Insights → Opportunities → Next Steps
 */

'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ResultsPageContent,
  ConfidenceLevel,
  getConfidenceLevel,
  validateLanguageRules,
  ensureContentNeverBlank
} from '@/types/results-content';
import {
  Target,
  TrendingUp,
  Users,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Info,
  Clock,
  User
} from 'lucide-react';

export interface ResultsPageBaseProps {
  content: ResultsPageContent;
  className?: string;
  customSections?: React.ReactNode; // Additional sections between Insights and Opportunities
}

export function ResultsPageBase({
  content,
  className = '',
  customSections
}: ResultsPageBaseProps) {

  const confidence = content.hero.confidence ? getConfidenceLevel(content.hero.confidence) : null;

  // Validate content for language rules violations
  const languageViolations = React.useMemo(() => {
    const allText = [
      content.hero?.title || '',
      content.hero?.promise || '',
      content.overview?.summary || '',
      ...(content.overview?.keyPoints || []),
      ...(content.insights || []).flatMap(i => [i?.title || '', i?.description || '', ...(i?.bullets || [])]),
      ...(content.opportunities || []).map(o => o?.label || ''),
      ...(content.nextSteps || []).map(n => n?.label || '')
    ].filter(text => text.length > 0).join(' ');

    return validateLanguageRules(allText);
  }, [content]);

  // Apply Never Blank rules to content sections
  const heroContent = React.useMemo(() => {
    const heroCheck = ensureContentNeverBlank(content.hero, 'general');
    const metricsChecked = content.hero.metrics.map(metric => ({
      ...metric,
      value: ensureContentNeverBlank(metric.value, 'metric').value
    }));

    return {
      ...heroCheck.value,
      metrics: metricsChecked,
      confidence: Math.max(content.hero.confidence || 35, heroCheck.confidence)
    };
  }, [content.hero]);

  const overviewContent = React.useMemo(() => {
    const summaryCheck = ensureContentNeverBlank(content.overview.summary, 'general');
    const keyPointsCheck = ensureContentNeverBlank(content.overview.keyPoints, 'list');

    return {
      summary: summaryCheck.value,
      keyPoints: Array.isArray(keyPointsCheck.value) ? keyPointsCheck.value : [keyPointsCheck.value]
    };
  }, [content.overview]);

  const insightsContent = React.useMemo(() => {
    const insightsCheck = ensureContentNeverBlank(content.insights, 'insights');
    return Array.isArray(insightsCheck.value) ? insightsCheck.value : [insightsCheck.value];
  }, [content.insights]);

  const opportunitiesContent = React.useMemo(() => {
    const oppCheck = ensureContentNeverBlank(content.opportunities, 'opportunities');
    return Array.isArray(oppCheck.value) ? oppCheck.value : [oppCheck.value];
  }, [content.opportunities]);

  const nextStepsContent = React.useMemo(() => {
    const stepsCheck = ensureContentNeverBlank(content.nextSteps, 'nextSteps');
    return Array.isArray(stepsCheck.value) ? stepsCheck.value : [stepsCheck.value];
  }, [content.nextSteps]);

  return (
    <div className={`space-y-6 ${className}`}>

      {/* Language Rules Violations (Development Only) */}
      {process.env.NODE_ENV === 'development' && languageViolations.length > 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Language Rules Violations:</strong>
            <ul className="mt-2 list-disc list-inside">
              {languageViolations.map((violation, index) => (
                <li key={index} className="text-sm">{violation}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Hero Section */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-2xl font-bold">{heroContent.title}</CardTitle>
              <CardDescription className="mt-2 text-base">
                {heroContent.promise}
              </CardDescription>
            </div>

            <div className="flex items-start space-x-3">
              {confidence && (
                <div className="text-right">
                  <Badge
                    variant={confidence.level === 'high' ? 'default' :
                             confidence.level === 'medium' ? 'secondary' : 'outline'}
                    className="mb-2"
                  >
                    {confidence.score}% Confidence
                  </Badge>
                </div>
              )}
            </div>
          </div>

          {/* Hero Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            {heroContent.metrics.map((metric: any, index: number) => (
              <Card key={index} className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-blue-600">{metric.value}</div>
                  <div className="text-sm font-medium text-gray-900">{metric.label}</div>
                  {metric.hint && (
                    <div className="text-xs text-gray-500 mt-1">{metric.hint}</div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Confidence Note */}
          {confidence?.showNote && confidence.message && (
            <Alert className="mt-4">
              <Info className="h-4 w-4" />
              <AlertDescription>{confidence.message}</AlertDescription>
            </Alert>
          )}
        </CardHeader>
      </Card>

      {/* 1. Overview Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="h-5 w-5 mr-2" />
            Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 mb-4">{overviewContent.summary}</p>
          <ul className="space-y-2">
            {overviewContent.keyPoints.map((point: string, index: number) => (
              <li key={index} className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                <span className="text-gray-700">{point}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* 2. Insights Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center">
          <TrendingUp className="h-5 w-5 mr-2" />
          Insights
        </h2>

        {insightsContent.map((insight: any, index: number) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="text-lg">{insight.title}</CardTitle>
              {insight.description && (
                <CardDescription>{insight.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {Array.isArray(insight.bullets) ? insight.bullets.map((bullet: string, bulletIndex: number) => (
                  <li key={bulletIndex} className="flex items-start">
                    <div className="h-2 w-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">{bullet}</span>
                  </li>
                )) : (
                  <li className="flex items-start">
                    <div className="h-2 w-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">{insight.bullets}</span>
                  </li>
                )}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Custom Sections (e.g., Content Ideas, Topic Performance) */}
      {customSections}

      {/* 3. Opportunities Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Opportunities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {opportunitiesContent.map((opportunity: any, index: number) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">
                      {opportunity.label || 'Optimization opportunity identified'}
                    </h4>
                    <div className="flex items-center space-x-4 mt-2">
                      <Badge
                        variant={opportunity.impactLevel === 'High' ? 'default' :
                                opportunity.impactLevel === 'Medium' ? 'secondary' : 'outline'}
                      >
                        {opportunity.impactLevel || 'Medium'} Impact
                      </Badge>
                      <Badge
                        variant={opportunity.effortLevel === 'Low' ? 'default' :
                                opportunity.effortLevel === 'Medium' ? 'secondary' : 'outline'}
                      >
                        {opportunity.effortLevel || 'Medium'} Effort
                      </Badge>
                      <div className="text-sm text-gray-600">
                        {opportunity.confidence || 70}% confidence
                      </div>
                    </div>
                  </div>

                  <div className="ml-4">
                    {opportunity.impactLevel === 'High' && opportunity.effortLevel === 'Low' && (
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        Quick Win
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 4. Next Steps Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Next Steps
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {nextStepsContent.map((step: any, index: number) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    {step.label || 'Continue progress tracking and optimization'}
                  </p>
                  <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                    {(step.ownerHint || 'Team') && (
                      <div className="flex items-center">
                        <User className="h-3 w-3 mr-1" />
                        {step.ownerHint || 'Team'}
                      </div>
                    )}
                    {(step.timeframeHint || 'Ongoing') && (
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {step.timeframeHint || 'Ongoing'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Metadata Footer */}
      <Card className="bg-gray-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-4">
              <Badge variant="outline">{content.meta.tier}</Badge>
              <Badge variant="outline">{content.meta.maturity}</Badge>
              {content.meta.agents.length > 0 && (
                <div>
                  Agents: {content.meta.agents.join(', ')}
                </div>
              )}
            </div>
            <div>
              Last updated: {new Date(content.meta.lastUpdated).toLocaleDateString()}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// =============================================================================
// Utility Components for Specific Sections
// =============================================================================

/**
 * Hero Metrics Grid - Standardized hero metrics display
 */
export interface HeroMetricsProps {
  metrics: ResultsPageContent['hero']['metrics'];
  className?: string;
}

export function HeroMetrics({ metrics, className = '' }: HeroMetricsProps) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-${Math.min(metrics.length, 3)} gap-4 ${className}`}>
      {metrics.map((metric, index) => (
        <Card key={index} className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{metric.value}</div>
            <div className="text-sm font-medium text-gray-900">{metric.label}</div>
            {metric.hint && (
              <div className="text-xs text-gray-500 mt-1">{metric.hint}</div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/**
 * Confidence Badge - Standardized confidence display
 */
export interface ConfidenceBadgeProps {
  confidence: number;
  showMessage?: boolean;
  className?: string;
}

export function ConfidenceBadge({ confidence, showMessage = false, className = '' }: ConfidenceBadgeProps) {
  const confidenceLevel = getConfidenceLevel(confidence);

  return (
    <div className={className}>
      <Badge
        variant={confidenceLevel.level === 'high' ? 'default' :
                 confidenceLevel.level === 'medium' ? 'secondary' : 'outline'}
      >
        {confidence}% Confidence
      </Badge>
      {showMessage && confidenceLevel.showNote && confidenceLevel.message && (
        <div className="text-xs text-gray-600 mt-1 max-w-32">
          {confidenceLevel.message}
        </div>
      )}
    </div>
  );
}