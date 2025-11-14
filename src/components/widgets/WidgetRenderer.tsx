/**
 * Enhanced Widget Renderer with Conditional Rendering Logic
 * Provides precise tier-2 widget containers and tier-3 content areas
 */

'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useConditionalRenderingContext, pathMatchers, debugPathDetection } from '@/lib/conditional-rendering';
import { useSimpleOPALData, useSimpleMultiTierData } from '@/hooks/useSimpleOPALData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2, Target, Settings, BarChart3, TrendingUp } from 'lucide-react';

// Import enhanced fallback components
import {
  StrategyPlansWidgetSkeleton,
  AnalyticsWidgetSkeleton,
  ExperimentationWidgetSkeleton,
  Tier1Skeleton,
  Tier2Skeleton,
  Tier3Skeleton,
  LoadingSpinner
} from '@/components/ui/widget-skeleton';
import {
  DataNotAvailable,
  EmptyDataState,
  ErrorDataState,
  NetworkErrorState,
  MaintenanceState,
  CompactDataNotAvailable
} from '@/components/ui/data-not-available';

// Import SOP-validated widgets
import {
  StrategyPlansWidget,
  IntegrationHealthWidget,
  EngagementAnalyticsWidget,
  ExperimentationWidget
} from './index';

// Import tier-2 specialized widgets
import { PhasesWidget } from './tier2/PhasesWidget';
import { WEBXWidget } from './tier2/WEBXWidget';

// Placeholder components for tier-2 widgets not yet implemented with fallback handling
const OSAWidget = ({ data, context, className }: any) => {
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className={className}>
        <CompactDataNotAvailable
          message="OSA integration data not available"
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  return (
    <div className={className}>
      <StrategyPlansWidget data={data} className="osa-specialized" />
    </div>
  );
};

const QuickWinsWidget = ({ data, context, className }: any) => {
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className={className}>
        <CompactDataNotAvailable
          message="Quick Wins data not available"
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }
  return (
    <div className={className}>
      <StrategyPlansWidget data={data} className="quick-wins-specialized" />
    </div>
  );
};

const MaturityWidget = ({ data, context, className }: any) => {
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className={className}>
        <CompactDataNotAvailable
          message="Maturity Assessment data not available"
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }
  return (
    <div className={className}>
      <StrategyPlansWidget data={data} className="maturity-specialized" />
    </div>
  );
};

const RoadmapWidget = ({ data, context, className }: any) => {
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className={className}>
        <CompactDataNotAvailable
          message="Roadmap data not available"
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }
  return (
    <div className={className}>
      <StrategyPlansWidget data={data} className="roadmap-specialized" />
    </div>
  );
};

const ContentRecsWidget = ({ data, context, className }: any) => {
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className={className}>
        <CompactDataNotAvailable
          message="Content Recommendations data not available"
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }
  return (
    <div className={className}>
      <IntegrationHealthWidget data={data} className="content-recs-specialized" />
    </div>
  );
};

const CMSWidget = ({ data, context, className }: any) => {
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className={className}>
        <CompactDataNotAvailable
          message="CMS integration data not available"
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }
  return (
    <div className={className}>
      <IntegrationHealthWidget data={data} className="cms-specialized" />
    </div>
  );
};

const ODPWidget = ({ data, context, className }: any) => {
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className={className}>
        <CompactDataNotAvailable
          message="ODP platform data not available"
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }
  return (
    <div className={className}>
      <IntegrationHealthWidget data={data} className="odp-specialized" />
    </div>
  );
};

const CMPWidget = ({ data, context, className }: any) => {
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className={className}>
        <CompactDataNotAvailable
          message="CMP integration data not available"
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }
  return (
    <div className={className}>
      <IntegrationHealthWidget data={data} className="cmp-specialized" />
    </div>
  );
};

const ContentAnalyticsWidget = ({ data, context, className }: any) => {
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className={className}>
        <CompactDataNotAvailable
          message="Content Analytics data not available"
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }
  return (
    <div className={className}>
      <EngagementAnalyticsWidget data={data} className="content-analytics-specialized" />
    </div>
  );
};

const AudienceAnalyticsWidget = ({ data, context, className }: any) => {
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className={className}>
        <CompactDataNotAvailable
          message="Audience Analytics data not available"
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }
  return (
    <div className={className}>
      <EngagementAnalyticsWidget data={data} className="audience-analytics-specialized" />
    </div>
  );
};

const CXAnalyticsWidget = ({ data, context, className }: any) => {
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className={className}>
        <CompactDataNotAvailable
          message="Customer Experience Analytics data not available"
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }
  return (
    <div className={className}>
      <EngagementAnalyticsWidget data={data} className="cx-analytics-specialized" />
    </div>
  );
};

const ExperimentationFrameworkWidget = ({ data, context, className }: any) => {
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className={className}>
        <CompactDataNotAvailable
          message="Experimentation Framework data not available"
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }
  return (
    <div className={className}>
      <ExperimentationWidget data={data} className="experimentation-framework-specialized" />
    </div>
  );
};

const PersonalizationFrameworkWidget = ({ data, context, className }: any) => {
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className={className}>
        <CompactDataNotAvailable
          message="Personalization Framework data not available"
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }
  return (
    <div className={className}>
      <ExperimentationWidget data={data} className="personalization-framework-specialized" />
    </div>
  );
};

const UXOptimizationWidget = ({ data, context, className }: any) => {
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className={className}>
        <CompactDataNotAvailable
          message="UX Optimization data not available"
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }
  return (
    <div className={className}>
      <ExperimentationWidget data={data} className="ux-optimization-specialized" />
    </div>
  );
};

export interface WidgetRendererProps {
  tier2?: string;
  tier3?: string;
  className?: string;
}

export function WidgetRenderer({ tier2, tier3, className = '' }: WidgetRendererProps) {
  const pathname = usePathname();
  const context = useConditionalRenderingContext();

  // Debug in development
  if (process.env.NODE_ENV === 'development') {
    debugPathDetection(pathname);
  }

  // Get multi-tier data
  const tierDataResult = useSimpleMultiTierData(
    context.detection.tier1,
    context.detection.tier2,
    context.detection.tier3,
    {
      enableAutoRefresh: true,
      refreshInterval: 60000, // 1 minute
      prefetchTiers: true, // Fetch all applicable tiers in parallel
      retryAttempts: 3,
      retryDelay: 1000
    }
  );

  // Create SOP-compliant merged data structure
  const mergedData = {
    // Enhanced tier-specific data with SOP metadata
    tier1Summary: tierDataResult.tier1.data,
    tier2KPIs: tierDataResult.tier2.data,
    tier3Content: tierDataResult.tier3.data,

    // SOP compliance metadata
    sopCompliance: tierDataResult.sopCompliance,

    // Agent source attribution per SOP requirements
    agent_source: tierDataResult.tier1.metadata.agent_source || tierDataResult.tier2.metadata.agent_source || tierDataResult.tier3.metadata.agent_source,
    confidence_score: Math.max(
      tierDataResult.tier1.metadata.confidence_score || 0,
      tierDataResult.tier2.metadata.confidence_score || 0,
      tierDataResult.tier3.metadata.confidence_score || 0
    ),
    timestamp: new Date().toISOString(),

    // Legacy data structure for widget compatibility
    confidenceScore: Math.max(
      tierDataResult.tier1.metadata.confidence_score || 0,
      tierDataResult.tier2.metadata.confidence_score || 0,
      tierDataResult.tier3.metadata.confidence_score || 0
    ),

    // Merge actual data content
    ...tierDataResult.tier1.data,
    ...tierDataResult.tier2.data,
    ...tierDataResult.tier3.data,

    // Full metadata for debugging and SOP tracking
    dataMetadata: {
      tier1: tierDataResult.tier1.metadata,
      tier2: tierDataResult.tier2.metadata,
      tier3: tierDataResult.tier3.metadata,
      sopCompliance: tierDataResult.sopCompliance
    }
  };

  const isLoading = tierDataResult.isLoading;
  const hasError = tierDataResult.hasError;
  const combinedError = tierDataResult.tier1.error || tierDataResult.tier2.error || tierDataResult.tier3.error;

  // Helper functions for enhanced fallback rendering
  const renderLoadingSkeleton = () => {
    const path = pathname.toLowerCase();

    // Determine appropriate skeleton based on context
    if (pathMatchers.isStrategyPlans(path)) {
      return <StrategyPlansWidgetSkeleton />;
    }

    if (pathMatchers.isAnalyticsInsights(path)) {
      return <AnalyticsWidgetSkeleton />;
    }

    if (pathMatchers.isExperienceOptimization(path)) {
      return <ExperimentationWidgetSkeleton />;
    }

    // Tier-specific skeletons for granular loading
    if (context.shouldRenderTier3 && context.detection.tier3) {
      return <Tier3Skeleton />;
    }

    if (context.shouldRenderTier2 && context.detection.tier2) {
      return <Tier2Skeleton />;
    }

    return <Tier1Skeleton />;
  };

  const renderErrorState = (error: string) => {
    // Determine error type and render appropriate component
    if (error?.includes('network') || error?.includes('connection')) {
      return (
        <NetworkErrorState
          onRetry={() => {
            tierDataResult.refresh();
          }}
        />
      );
    }

    if (error?.includes('timeout')) {
      return (
        <DataNotAvailable
          title="Request Timeout"
          description="The data request took too long to complete. Please try again."
          reason="timeout"
          onRetry={() => {
            tierDataResult.refresh();
          }}
        />
      );
    }

    if (error?.includes('unauthorized') || error?.includes('403') || error?.includes('401')) {
      return (
        <DataNotAvailable
          title="Access Denied"
          description="You do not have permission to view this OPAL data."
          reason="unauthorized"
          onConfigure={() => {
            window.location.href = '/engine/admin';
          }}
        />
      );
    }

    if (error?.includes('maintenance') || error?.includes('503')) {
      return <MaintenanceState />;
    }

    // Generic error state
    return (
      <ErrorDataState
        error={error || 'An unexpected error occurred'}
        onRetry={() => {
          tierDataResult.refresh();
        }}
      />
    );
  };

  const renderNoDataState = () => {
    const sectionName = context.detection.tier1Display || 'this section';

    return (
      <EmptyDataState
        section={sectionName}
        onConfigure={() => {
          window.location.href = '/engine/admin/data-mapping';
        }}
      />
    );
  };

  // Enhanced loading state with widget-specific skeletons
  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        {renderLoadingSkeleton()}
      </div>
    );
  }

  // Enhanced error state with specific error handling
  if (hasError) {
    return (
      <div className={`space-y-6 ${className}`}>
        {renderErrorState(combinedError)}
      </div>
    );
  }

  // Enhanced no data state
  if (!mergedData || (!mergedData.tier1Summary && !mergedData.tier2KPIs && !mergedData.tier3Content)) {
    return (
      <div className={`space-y-6 ${className}`}>
        {renderNoDataState()}
      </div>
    );
  }

  // Enhanced conditional rendering based on full URL path
  const renderConditionalContent = () => {
    if (!context.shouldRenderTier2) {
      return <GenericWidget data={mergedData} section={context.detection.tier1} className={className} />;
    }

    // Render tier-2 widget container with tier-3 content area
    return (
      <div className={`conditional-widget-container ${className}`}>
        {/* Tier-2 Widget Container */}
        <div id="tier2-widget-container">
          {renderTier2WidgetContainer()}
        </div>

        {/* Tier-3 Main Content Area */}
        {context.shouldRenderTier3 && (
          <div id="tier3-main-content" className="tier3-content-area mt-6">
            {renderTier3ContentArea()}
          </div>
        )}
      </div>
    );
  };

  // Render tier-2 widget container based on path detection
  const renderTier2WidgetContainer = () => {
    const path = pathname.toLowerCase();

    // Strategy Plans tier-2 containers
    if (pathMatchers.isStrategyPlans(path)) {
      if (pathMatchers.isPhases(path)) {
        return <PhasesWidget data={mergedData} context={context} className="phases-container" />;
      }
      if (path.includes('osa')) {
        return <OSAWidget data={mergedData} context={context} className="osa-container" />;
      }
      if (path.includes('quick-wins')) {
        return <QuickWinsWidget data={mergedData} context={context} className="quick-wins-container" />;
      }
      if (path.includes('maturity')) {
        return <MaturityWidget data={mergedData} context={context} className="maturity-container" />;
      }
      if (path.includes('roadmap')) {
        return <RoadmapWidget data={mergedData} context={context} className="roadmap-container" />;
      }
      // Fallback to general strategy widget (already SOP-validated via HOC)
      return <StrategyPlansWidget data={mergedData} className={className} pageId={`${context.detection.tier1}-${context.detection.tier2 || 'plans'}-${context.detection.tier3 || 'main'}`} />;
    }

    // Optimizely DXP Tools tier-2 containers
    if (pathMatchers.isDXPTools(path)) {
      if (pathMatchers.isWEBX(path)) {
        return <WEBXWidget data={mergedData} context={context} className="webx-container" />;
      }
      if (path.includes('content-recs')) {
        return <ContentRecsWidget data={mergedData} context={context} className="content-recs-container" />;
      }
      if (path.includes('cms')) {
        return <CMSWidget data={mergedData} context={context} className="cms-container" />;
      }
      if (path.includes('odp')) {
        return <ODPWidget data={mergedData} context={context} className="odp-container" />;
      }
      if (path.includes('cmp')) {
        return <CMPWidget data={mergedData} context={context} className="cmp-container" />;
      }
      // Fallback to general DXP tools widget (already SOP-validated via HOC)
      return <IntegrationHealthWidget data={mergedData} className={className} pageId={`${context.detection.tier1}-${context.detection.tier2 || 'integration'}-${context.detection.tier3 || 'main'}`} />;
    }

    // Analytics Insights tier-2 containers
    if (pathMatchers.isAnalyticsInsights(path)) {
      if (pathMatchers.isContent(path)) {
        return <ContentAnalyticsWidget data={mergedData} context={context} className="content-analytics-container" />;
      }
      if (path.includes('audiences')) {
        return <AudienceAnalyticsWidget data={mergedData} context={context} className="audience-analytics-container" />;
      }
      if (path.includes('cx')) {
        return <CXAnalyticsWidget data={mergedData} context={context} className="cx-analytics-container" />;
      }
      // Fallback to general analytics widget (already SOP-validated via HOC)
      return <EngagementAnalyticsWidget data={mergedData} className={className} pageId={`${context.detection.tier1}-${context.detection.tier2 || 'analytics'}-${context.detection.tier3 || 'main'}`} />;
    }

    // Experience Optimization tier-2 containers
    if (pathMatchers.isExperienceOptimization(path)) {
      if (pathMatchers.isExperimentation(path)) {
        return <ExperimentationFrameworkWidget data={mergedData} context={context} className="experimentation-container" />;
      }
      if (pathMatchers.isPersonalization(path)) {
        return <PersonalizationFrameworkWidget data={mergedData} context={context} className="personalization-container" />;
      }
      if (path.includes('ux')) {
        return <UXOptimizationWidget data={mergedData} context={context} className="ux-container" />;
      }
      // Fallback to general experimentation widget (already SOP-validated via HOC)
      return <ExperimentationWidget data={mergedData} className={className} pageId={`${context.detection.tier1}-${context.detection.tier2 || 'experimentation'}-${context.detection.tier3 || 'main'}`} />;
    }

    // Final fallback (GenericWidget doesn't need SOP validation as it handles no-data cases)
    return <GenericWidget data={mergedData} section={context.detection.tier1} className={className} />;
  };

  // Render tier-3 content area with page-specific data
  const renderTier3ContentArea = () => {
    const path = pathname.toLowerCase();

    // Strategy Plans → Phases tier-3 content
    if (pathMatchers.isStrategyPlans(path) && pathMatchers.isPhases(path)) {
      if (pathMatchers.isPhase1Foundation(path)) {
        return renderTier3Content('Phase 1: Foundation (0-3 months)', mergedData?.phase1Data, 'phase-1-foundation');
      }
      if (pathMatchers.isPhase2Growth(path)) {
        return renderTier3Content('Phase 2: Growth (3-6 months)', mergedData?.phase2Data, 'phase-2-growth');
      }
      if (path.includes('phase-3')) {
        return renderTier3Content('Phase 3: Optimization (6-12 months)', mergedData?.phase3Data, 'phase-3-optimization');
      }
      if (path.includes('phase-4')) {
        return renderTier3Content('Phase 4: Innovation (12+ months)', mergedData?.phase4Data, 'phase-4-innovation');
      }
      if (path.includes('cross-phase')) {
        return renderTier3Content('Cross-phase Dependencies', mergedData?.crossPhaseDependencies, 'cross-phase-dependencies');
      }
    }

    // DXP Tools → WEBX tier-3 content
    if (pathMatchers.isDXPTools(path) && pathMatchers.isWEBX(path)) {
      if (pathMatchers.isActiveExperiments(path)) {
        return renderTier3Content('Active Experiments', mergedData?.activeExperimentData, 'active-experiments');
      }
      if (path.includes('statistical-significance')) {
        return renderTier3Content('Statistical Significance', mergedData?.statisticalSignificance, 'statistical-significance');
      }
      if (path.includes('results-analysis')) {
        return renderTier3Content('Results Analysis', mergedData?.resultsAnalysis, 'results-analysis');
      }
    }

    // Analytics Insights → Content tier-3 content
    if (pathMatchers.isAnalyticsInsights(path) && pathMatchers.isContent(path)) {
      if (pathMatchers.isEngagement(path)) {
        return renderTier3Content('Content Engagement Analysis', mergedData?.contentEngagementData, 'content-engagement');
      }
      if (path.includes('topics')) {
        return renderTier3Content('Content Topics Analysis', mergedData?.contentTopics, 'content-topics');
      }
      if (path.includes('popular')) {
        return renderTier3Content('Popular Content Analysis', mergedData?.popularContent, 'popular-content');
      }
    }

    // Default tier-3 content
    const contentFocus = context.contentFocus;
    if (contentFocus) {
      return renderTier3Content(contentFocus.title, mergedData, 'default-tier3-content');
    }

    return null;
  };

  // Helper function to render tier-3 content with consistent structure and fallbacks
  const renderTier3Content = (title: string, pageData: any, contentId: string) => {
    return (
      <Card id={contentId} className="tier3-content-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getTierIcon()}
            {title}
          </CardTitle>
          {context.contentFocus && (
            <p className="text-gray-600 mt-1">
              {context.contentFocus.description}
            </p>
          )}
        </CardHeader>
        <CardContent>
          {pageData ? (
            <div className="tier3-data-visualization">
              {renderTier3DataVisualization(pageData, contentId)}
            </div>
          ) : tierDataResult.tier3.isLoading ? (
            <Tier3Skeleton />
          ) : tierDataResult.tier3.error ? (
            <CompactDataNotAvailable
              message={`Unable to load ${title} data`}
              onRetry={() => tierDataResult.refresh()}
            />
          ) : (
            <CompactDataNotAvailable
              message={`${title} data not yet configured`}
              onRetry={() => tierDataResult.refresh()}
            />
          )}
        </CardContent>
      </Card>
    );
  };

  // Helper function to render tier-3 data visualization
  const renderTier3DataVisualization = (pageData: any, contentId: string) => {
    if (!pageData) return null;

    return (
      <div className={`data-visualization-${contentId}`}>
        {/* This will be populated with specific chart components based on content type */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(pageData).map(([key, value]) => (
            <Card key={key} className="metric-card">
              <CardContent className="pt-4">
                <h4 className="font-semibold capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</h4>
                <p className="text-2xl font-bold text-blue-600 mt-2">
                  {typeof value === 'number' ? value.toLocaleString() : String(value)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  // Helper function to get appropriate tier icon
  const getTierIcon = () => {
    const path = pathname.toLowerCase();

    if (pathMatchers.isStrategyPlans(path)) return <Target className="h-5 w-5 text-blue-600" />;
    if (pathMatchers.isDXPTools(path)) return <Settings className="h-5 w-5 text-purple-600" />;
    if (pathMatchers.isAnalyticsInsights(path)) return <BarChart3 className="h-5 w-5 text-green-600" />;
    if (pathMatchers.isExperienceOptimization(path)) return <TrendingUp className="h-5 w-5 text-orange-600" />;

    return <BarChart3 className="h-5 w-5 text-gray-600" />;
  };

  return renderConditionalContent();
}

/**
 * Enhanced fallback widget for unrecognized sections with proper data handling
 */
function GenericWidget({ data, section, className = '' }: { data: any; section: string; className?: string }) {
  const sectionDisplay = section.split('-').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');

  // Handle no data case
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className={`space-y-6 ${className}`}>
        <EmptyDataState
          section={sectionDisplay}
          onConfigure={() => {
            window.location.href = '/engine/admin/data-mapping';
          }}
        />
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardContent className="pt-6">
          <h2 className="text-2xl font-bold mb-4">
            {sectionDisplay}
          </h2>
          <p className="text-gray-600 mb-4">
            Specialized widget for this section is being developed.
          </p>

          {/* Show available data keys */}
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold mb-2">Available Data Keys:</h4>
            <div className="flex flex-wrap gap-2">
              {Object.keys(data).map((key) => (
                <span key={key} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                  {key}
                </span>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              This data will be used once the specialized widget is implemented.
            </p>
          </div>

          {/* Development info */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>Development Note:</strong> The {sectionDisplay} widget is currently using generic fallback rendering.
              A specialized widget implementation is planned to provide enhanced visualizations and insights for this section.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}