/**
 * Results Content Renderer - New Architecture Integration
 *
 * This component connects the existing Results pages to the new
 * getResultsContentForRoute system, providing unique, context-appropriate
 * content for every Results page.
 */

'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { getResultsContentForRoute } from '@/lib/results/getResultsContentForRoute';
import type { ResultsPageContent } from '@/types/resultsContent';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2, Database, Settings, TrendingUp, Target } from 'lucide-react';

interface ResultsContentRendererProps {
  className?: string;
  tier1?: string;
  tier2?: string;
  tier3?: string;
}

export function ResultsContentRenderer({
  className = '',
  tier1,
  tier2,
  tier3
}: ResultsContentRendererProps) {
  // CRITICAL: React hook safety during Next.js static generation
  // During static generation, React can be null, so check before using hooks
  if (typeof window === 'undefined' && (!React || !useState)) {
    // Return a safe fallback component during static generation to prevent build failures
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Results Content
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground">Loading results content...</div>
        </CardContent>
      </Card>
    );
  }

  const pathname = usePathname();
  const [content, setContent] = useState<ResultsPageContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadContent() {
      try {
        setLoading(true);
        setError(null);

        // Use the sophisticated content resolution system
        const resultsContent = await getResultsContentForRoute(pathname, {
          tier1: tier1 || 'strategy-plans', // Default tier1
          tier2: tier2 || 'content', // Default tier2
          tier3: tier3 || undefined
        });

        setContent(resultsContent);
      } catch (err) {
        console.error('Failed to load Results content:', err);
        setError(err instanceof Error ? err.message : 'Failed to load content');
      } finally {
        setLoading(false);
      }
    }

    loadContent();
  }, [pathname, tier1, tier2, tier3]);

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <ResultsContentSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            Failed to load Results content: {error}
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
                <h3 className="text-lg font-semibold text-gray-900">No Content Available</h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  Results content is not available for this page. The OPAL integration may need configuration.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Overview Section */}
      {content.overview && (
        <Card id={`widget-overview-${Date.now()}`}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Target className="h-5 w-5 text-blue-600" />
              </div>
              <CardTitle className="text-lg">Overview</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ResultsSection content={content.overview} />
          </CardContent>
        </Card>
      )}

      {/* Insights Section */}
      {content.insights && (
        <Card id={`widget-insights-${Date.now()}`}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <CardTitle className="text-lg">Insights</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ResultsSection content={content.insights} />
          </CardContent>
        </Card>
      )}

      {/* Opportunities Section */}
      {content.opportunities && (
        <Card id={`widget-opportunities-${Date.now()}`}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-50 rounded-lg">
                <Settings className="h-5 w-5 text-purple-600" />
              </div>
              <CardTitle className="text-lg">Opportunities</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ResultsSection content={content.opportunities} />
          </CardContent>
        </Card>
      )}

      {/* Next Steps Section */}
      {content.nextSteps && (
        <Card id={`widget-next-steps-${Date.now()}`}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-50 rounded-lg">
                <Target className="h-5 w-5 text-orange-600" />
              </div>
              <CardTitle className="text-lg">Next Steps</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ResultsSection content={content.nextSteps} />
          </CardContent>
        </Card>
      )}

      {/* Content Quality Indicator */}
      {content.metadata && (
        <div className="text-xs text-gray-500 text-center">
          Content confidence: {Math.round(content.metadata.confidence * 100)}% |
          Source: {content.metadata.source} |
          Generated: {new Date(content.metadata.timestamp).toLocaleString()}
        </div>
      )}
    </div>
  );
}

/**
 * Renders individual section content with proper formatting
 */
function ResultsSection({ content }: { content: any }) {
  if (typeof content === 'string') {
    return <p className="text-gray-700">{content}</p>;
  }

  if (Array.isArray(content)) {
    return (
      <ul className="space-y-2">
        {content.map((item, index) => (
          <li key={index} className="flex items-start gap-2">
            <span className="text-blue-600 mt-1">•</span>
            <span className="text-gray-700">{typeof item === 'string' ? item : JSON.stringify(item)}</span>
          </li>
        ))}
      </ul>
    );
  }

  if (typeof content === 'object' && content !== null) {
    return (
      <div className="space-y-3">
        {Object.entries(content).map(([key, value]) => (
          <div key={key}>
            <h4 className="font-medium text-gray-900 capitalize mb-1">
              {key.replace(/([A-Z])/g, ' $1').trim()}
            </h4>
            <ResultsSection content={value} />
          </div>
        ))}
      </div>
    );
  }

  return <p className="text-gray-700">{String(content)}</p>;
}

/**
 * Loading skeleton for Results content
 */
function ResultsContentSkeleton() {
  return (
    <>
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-lg" />
              <Skeleton className="h-6 w-24" />
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