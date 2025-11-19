/**
 * ODP Widget - Optimizely Data Platform Dashboard Component
 *
 * Renders ODP customer data platform metrics and insights.
 * Supports both live data and mock mode for development.
 *
 * @version 1.0 - Proof of Concept
 */

'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users, 
  Target, 
  Database, 
  AlertCircle, 
  CheckCircle, 
  TrendingUp,
  Activity,
  Settings
} from 'lucide-react';
import { getResultsContentForRoute } from '@/lib/results/getResultsContentForRoute';
import type { ResultsPageContent } from '@/types/resultsContent';

interface ODPWidgetProps {
  className?: string;
  tier2?: string;
  tier3?: string;
}

export function ODPWidget({ className = '', tier2, tier3 }: ODPWidgetProps) {
  const pathname = usePathname();
  const [content, setContent] = useState<ResultsPageContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadODPContent() {
      try {
        setLoading(true);
        setError(null);

        const response = await getResultsContentForRoute(pathname, {
          debugMode: process.env.NODE_ENV === 'development'
        });

        if (response.success) {
          setContent(response.content || null);
        } else {
          setError(response.error || 'Failed to load ODP data');
        }
      } catch (err) {
        console.error('[ODP Widget] Failed to load content:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    loadODPContent();
  }, [pathname]);

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <ODPWidgetSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            ODP Integration Error: {error}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!content) {
    return (
      <div className={className}>
        <Card>
          <CardContent className="p-6 pt-8 pb-8">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="p-3 rounded-full bg-gray-100 text-gray-600">
                  <Database className="h-8 w-8" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-900">ODP Data Unavailable</h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  ODP content is not available. The OPAL integration may need configuration.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isMockData = content.meta?.dataSource === 'mock_data';

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Mock Data Warning */}
      {isMockData && (
        <Alert className="border-blue-200 bg-blue-50">
          <Settings className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Development Mode:</strong> Showing sample ODP data for proof of concept. 
            Connect live ODP credentials to see real customer data.
          </AlertDescription>
        </Alert>
      )}

      {/* Hero Metrics Section */}
      <Card id={`widget-odp-hero-${Date.now()}`}>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Database className="h-5 w-5 text-blue-600" />
            </div>
            <CardTitle className="text-lg">{content.hero?.title}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 mb-4">{content.hero?.promise}</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {content.hero?.metrics.map((metric, index) => (
              <div key={index} className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{metric.value}</div>
                <div className="text-sm font-medium text-gray-900">{metric.label}</div>
                <div className="text-xs text-gray-600">{metric.hint}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Overview Section */}
      {content.overview && (
        <Card id={`widget-odp-overview-${Date.now()}`}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <CardTitle className="text-lg">Data Platform Overview</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 mb-4">{content.overview.summary}</p>
            <ul className="space-y-2">
              {content.overview.keyPoints.map((point, index) => (
                <li key={index} className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-1 flex-shrink-0" />
                  <span className="text-gray-700">{point}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Insights Section */}
      {content.insights && content.insights.length > 0 && (
        <Card id={`widget-odp-insights-${Date.now()}`}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-50 rounded-lg">
                <Activity className="h-5 w-5 text-purple-600" />
              </div>
              <CardTitle className="text-lg">Customer Data Insights</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {content.insights.map((insight, index) => (
              <div key={index} className="border-l-4 border-purple-500 pl-4">
                <h4 className="font-semibold text-gray-900">{insight.title}</h4>
                <p className="text-gray-600 mt-1">{insight.insight}</p>
                <div className="mt-2 flex items-center gap-4 text-sm">
                  <span className={`px-2 py-1 rounded text-xs ${
                    insight.impact === 'high' ? 'bg-red-100 text-red-700' :
                    insight.impact === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {insight.impact} impact
                  </span>
                  <span className="text-gray-500">
                    {Math.round(insight.confidence)}% confidence
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Opportunities Section */}
      {content.opportunities && content.opportunities.length > 0 && (
        <Card id={`widget-odp-opportunities-${Date.now()}`}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-50 rounded-lg">
                <Target className="h-5 w-5 text-orange-600" />
              </div>
              <CardTitle className="text-lg">Optimization Opportunities</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {content.opportunities.map((opportunity, index) => (
              <div key={index} className="border-l-4 border-orange-500 pl-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{opportunity.title}</h4>
                    <p className="text-gray-600 mt-1">{opportunity.description}</p>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    <div>{opportunity.effort} effort</div>
                    <div>{opportunity.timeframe.replace('_', ' ')}</div>
                  </div>
                </div>
                {opportunity.kpis && opportunity.kpis.length > 0 && (
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2">
                    {opportunity.kpis.map((kpi, kpiIndex) => (
                      <div key={kpiIndex} className="text-xs bg-gray-50 p-2 rounded">
                        <div className="font-medium">{kpi.metric}</div>
                        <div className="text-gray-600">Current: {kpi.current}</div>
                        <div className="text-green-600">Target: {kpi.target}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Next Steps Section */}
      {content.nextSteps && content.nextSteps.length > 0 && (
        <Card id={`widget-odp-next-steps-${Date.now()}`}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 rounded-lg">
                <Users className="h-5 w-5 text-indigo-600" />
              </div>
              <CardTitle className="text-lg">Recommended Actions</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {content.nextSteps.map((step, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${
                  step.priority === 'high' ? 'bg-red-100 text-red-600' :
                  step.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                  'bg-green-100 text-green-600'
                }`}>
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <h4 className="font-medium text-gray-900">{step.title}</h4>
                    <span className="text-xs text-gray-500">{step.effort}</span>
                  </div>
                  <p className="text-gray-600 text-sm mt-1">{step.description}</p>
                  {step.successMetrics && step.successMetrics.length > 0 && (
                    <div className="mt-2">
                      <div className="text-xs font-medium text-gray-700">Success Metrics:</div>
                      <ul className="text-xs text-gray-600 list-disc list-inside">
                        {step.successMetrics.map((metric, metricIndex) => (
                          <li key={metricIndex}>{metric}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Footnotes Section */}
      {content.meta?.footnotes && content.meta.footnotes.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 space-y-1">
            {content.meta.footnotes.map((footnote, index) => (
              <div key={index}>{footnote}</div>
            ))}
          </div>
        </div>
      )}

      {/* Debug Information (Development Mode) */}
      {process.env.NODE_ENV === 'development' && content.meta && (
        <Card className="border-dashed border-gray-300">
          <CardHeader>
            <CardTitle className="text-sm text-gray-600">Debug Information</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-gray-500 space-y-1">
            <div>Route: {pathname}</div>
            <div>Data Source: {content.meta.dataSource}</div>
            <div>Agents: {content.meta.agents?.join(', ')}</div>
            <div>Confidence: {Math.round(content.meta.maturity)}%</div>
            <div>Last Updated: {new Date(content.meta.lastUpdated).toLocaleString()}</div>
            <div>Content ID: {content.meta.contentFingerprint}</div>
            <div>Footnotes: {content.meta.footnotes?.length || 0}</div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/**
 * Loading skeleton for ODP Widget
 */
function ODPWidgetSkeleton() {
  return (
    <>
      {/* Hero Metrics Skeleton */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <Skeleton className="h-6 w-48" />
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-full mb-4" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="text-center p-4 border rounded-lg">
                <Skeleton className="h-8 w-16 mx-auto mb-2" />
                <Skeleton className="h-4 w-20 mx-auto mb-1" />
                <Skeleton className="h-3 w-24 mx-auto" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Additional Cards Skeleton */}
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-lg" />
              <Skeleton className="h-6 w-32" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardContent>
        </Card>
      ))}
    </>
  );
}

export default ODPWidget;