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
import { safeConfidenceScore, safeRound, safeAverage, makeSafeForChildren } from '@/lib/utils/number-formatting';

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
import { RoadmapSpecializedWidget } from './tier2/RoadmapSpecializedWidget';
import { MaturitySpecializedWidget } from './tier2/MaturitySpecializedWidget';
import { OSAWidget } from './strategy/OSAWidget';
import { QuickWinsWidget as QuickWinsEnhancedWidget } from './strategy/QuickWinsWidget';
import { MaturityWidget as MaturityEnhancedWidget } from './strategy/MaturityWidget';
import { PhasesEnhancedWidget } from './strategy/PhasesEnhancedWidget';
import { RoadmapEnhancedWidget } from './strategy/RoadmapEnhancedWidget';
import { ContentOptimizationWidget } from './ContentOptimizationWidget';
import { AIForSEOWidget } from './AIForSEOWidget';
import { ContentOptimizationRecommendationsWidget } from './ContentOptimizationRecommendationsWidget';
import { ContentSuggestionsWidget } from './ContentSuggestionsWidget';
import { ODPWidget } from './ODPWidget';

// Helper function to calculate confidence score and eliminate NaN
function calculateConfidenceScore(scores: (number | undefined)[]): number {
  // Use safe average function to avoid NaN issues
  const validScores = scores
    .filter((score): score is number => typeof score === 'number' && !isNaN(score) && isFinite(score))
    .map(score => {
      // Ensure score is in valid range 0-1
      if (score > 1) return score / 100; // Convert percentage to decimal
      return score;
    });

  if (validScores.length === 0) {
    // No valid scores, return default confidence
    return 0.75; // 75% default confidence
  }

  // Use safe math operations to get the highest confidence
  const maxScore = safeAverage([Math.max(...validScores)], 0.75);

  // Ensure final score is reasonable (between 0.6 and 0.95)
  return Math.min(Math.max(maxScore, 0.6), 0.95);
}

// Placeholder components for tier-2 widgets not yet implemented with fallback handling
const OSAWidgetContainer = ({ data, context, className }: any) => {
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
      <OSAWidget data={data} context={context} className="osa-specialized" />
    </div>
  );
};

const QuickWinsWidgetContainer = ({ data, context, className }: any) => {
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
      <QuickWinsEnhancedWidget data={data} context={context} className="quick-wins-specialized" />
    </div>
  );
};

const MaturityWidgetContainer = ({ data, context, className }: any) => {
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
      <MaturityEnhancedWidget data={data} context={context} className="maturity-specialized" />
    </div>
  );
};

const RoadmapWidgetContainer = ({ data, context, className }: any) => {
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
      <RoadmapEnhancedWidget data={data} context={context} className="roadmap-specialized" />
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

// ODPWidget is now imported from separate file - see imports at top

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

const TrendsAnalyticsWidget = ({ data, context, className }: any) => {
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className={className}>
        <CompactDataNotAvailable
          message="Trends Analytics data not available"
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }
  return (
    <div className={className}>
      <EngagementAnalyticsWidget data={data} className="trends-analytics-specialized" />
    </div>
  );
};

const ExperimentationAnalyticsWidget = ({ data, context, className }: any) => {
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className={className}>
        <CompactDataNotAvailable
          message="Experimentation Analytics data not available"
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }
  return (
    <div className={className}>
      <ExperimentationWidget data={data} className="experimentation-analytics-specialized" />
    </div>
  );
};

const PersonalizationAnalyticsWidget = ({ data, context, className }: any) => {
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className={className}>
        <CompactDataNotAvailable
          message="Personalization Analytics data not available"
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }
  return (
    <div className={className}>
      <EngagementAnalyticsWidget data={data} className="personalization-analytics-specialized" />
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

const ContentOptimizationWidgetContainer = ({ data, context, className }: any) => {
  // Always render the ContentOptimizationWidget as it has built-in fallbacks and shows the hub page
  console.log('[ContentOptimizationWidgetContainer] Rendering with data:', data);
  return (
    <div className={className}>
      <ContentOptimizationWidget data={data} context={context} className="content-optimization-specialized" />
    </div>
  );
};

const AIForSEOWidgetContainer = ({ data, context, className }: any) => {
  // Always render the AIForSEOWidget as it has built-in fallbacks
  console.log('[AIForSEOWidgetContainer] Rendering AI for SEO widget with data:', data);
  return (
    <div className={className}>
      <AIForSEOWidget data={data} context={context} className="ai-for-seo-specialized" />
    </div>
  );
};

const ContentOptimizationRecommendationsWidgetContainer = ({ data, context, className }: any) => {
  // Always render the ContentOptimizationRecommendationsWidget as it has built-in fallbacks
  console.log('[ContentOptimizationRecommendationsWidgetContainer] Rendering Content Optimization Recommendations widget with data:', data);
  return (
    <div className={className}>
      <ContentOptimizationRecommendationsWidget data={data} context={context} className="content-optimization-recommendations-specialized" />
    </div>
  );
};

const ContentSuggestionsWidgetContainer = ({ data, context, className }: any) => {
  // Always render the ContentSuggestionsWidget as it has built-in fallbacks
  console.log('[ContentSuggestionsWidgetContainer] Rendering Content Suggestions widget with data:', data);
  return (
    <div className={className}>
      <ContentSuggestionsWidget data={data} context={context} className="content-suggestions-specialized" />
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
  const context = useConditionalRenderingContext(pathname);

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

    // Simple data service - no compliance metadata needed

    // Agent source attribution
    agent_source: tierDataResult.tier1.metadata?.agent_source || tierDataResult.tier2.metadata?.agent_source || tierDataResult.tier3.metadata?.agent_source || 'unknown',
    confidence_score: calculateConfidenceScore([
      tierDataResult.tier1.metadata?.confidence_score,
      tierDataResult.tier2.metadata?.confidence_score,
      tierDataResult.tier3.metadata?.confidence_score
    ]),
    timestamp: new Date().toISOString(),

    // Legacy data structure for widget compatibility
    confidenceScore: calculateConfidenceScore([
      tierDataResult.tier1.metadata?.confidence_score,
      tierDataResult.tier2.metadata?.confidence_score,
      tierDataResult.tier3.metadata?.confidence_score
    ]),

    // Merge actual data content
    ...tierDataResult.tier1.data,
    ...tierDataResult.tier2.data,
    ...tierDataResult.tier3.data,

    // Full metadata for debugging
    dataMetadata: {
      tier1: tierDataResult.tier1.metadata,
      tier2: tierDataResult.tier2.metadata,
      tier3: tierDataResult.tier3.metadata
    }
  };

  const isLoading = tierDataResult.loading;
  const hasError = !!tierDataResult.error;
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

  // Enhanced no data state - but skip for content optimization paths
  const path = pathname.toLowerCase();
  const isContentOptimization = pathMatchers.isExperienceOptimization(path) && pathMatchers.isContent(path);
  
  if (!isContentOptimization && (!mergedData || (!mergedData.tier1Summary && !mergedData.tier2KPIs && !mergedData.tier3Content))) {
    return (
      <div className={`space-y-6 ${className}`}>
        {renderNoDataState()}
      </div>
    );
  }

  // Enhanced conditional rendering based on full URL path
  const renderConditionalContent = () => {
    // Special case: If tier mapping specifies ContentOptimizationWidget, render tier-2 container
    const hasContentOptimizationWidget = context.detection.tierMapping?.widgets?.primary === 'ContentOptimizationWidget';
    
    if (!context.shouldRenderTier2 && !hasContentOptimizationWidget) {
      return (
        <div className={className}>
          <GenericWidget data={mergedData} section={context.detection.tier1} />
        </div>
      );
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
        return <PhasesEnhancedWidget data={mergedData} context={context} className="phases-container" />;
      }
      if (path.includes('osa')) {
        return <OSAWidgetContainer data={mergedData} context={context} className="osa-container" />;
      }
      if (path.includes('quick-wins')) {
        return <QuickWinsWidgetContainer data={mergedData} context={context} className="quick-wins-container" />;
      }
      if (path.includes('maturity')) {
        return <MaturityWidgetContainer data={mergedData} context={context} className="maturity-container" />;
      }
      if (path.includes('roadmap')) {
        return <RoadmapWidgetContainer data={mergedData} context={context} className="roadmap-container" />;
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
        return <ODPWidget className="odp-container" tier2={context.detection.tier2} tier3={context.detection.tier3} />;
      }
      if (path.includes('cmp')) {
        return <CMPWidget data={mergedData} context={context} className="cmp-container" />;
      }
      // Fallback to general DXP tools widget (already SOP-validated via HOC)
      return <IntegrationHealthWidget data={mergedData} className={className} pageId={`${context.detection.tier1}-${context.detection.tier2 || 'integration'}-${context.detection.tier3 || 'main'}`} />;
    }

    // Analytics Insights tier-2 containers
    if (pathMatchers.isAnalyticsInsights(path)) {
      if (path.includes('osa')) {
        return <OSAWidgetContainer data={mergedData} context={context} className="analytics-osa-container" />;
      }
      if (pathMatchers.isContent(path)) {
        return <ContentAnalyticsWidget data={mergedData} context={context} className="content-analytics-container" />;
      }
      if (path.includes('audiences')) {
        return <AudienceAnalyticsWidget data={mergedData} context={context} className="audience-analytics-container" />;
      }
      if (path.includes('cx')) {
        return <CXAnalyticsWidget data={mergedData} context={context} className="cx-analytics-container" />;
      }
      if (path.includes('trends')) {
        return <TrendsAnalyticsWidget data={mergedData} context={context} className="trends-analytics-container" />;
      }
      if (path.includes('experimentation')) {
        return <ExperimentationAnalyticsWidget data={mergedData} context={context} className="experimentation-analytics-container" />;
      }
      if (path.includes('personalization')) {
        return <PersonalizationAnalyticsWidget data={mergedData} context={context} className="personalization-analytics-container" />;
      }
      // Fallback to general analytics widget (already SOP-validated via HOC)
      return <EngagementAnalyticsWidget data={mergedData} className={className} pageId={`${context.detection.tier1}-${context.detection.tier2 || 'analytics'}-${context.detection.tier3 || 'main'}`} />;
    }

    // Experience Optimization tier-2 containers
    console.log('[WidgetRenderer] Checking Experience Optimization for path:', path);
    if (pathMatchers.isExperienceOptimization(path)) {
      console.log('[WidgetRenderer] Experience Optimization path detected:', path);
      console.log('[WidgetRenderer] isContent check:', pathMatchers.isContent(path));
      
      if (pathMatchers.isContent(path)) {
        console.log('[WidgetRenderer] Rendering ContentOptimizationWidgetContainer');
        return <ContentOptimizationWidgetContainer data={mergedData} context={context} className="content-optimization-container" />;
      }
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
        return renderTier3Content('Phase 1: Foundation (0-3 months)', mergedData?.phase1Data, 'phase-1');
      }
      if (pathMatchers.isPhase2Growth(path)) {
        return renderTier3Content('Phase 2: Growth (3-6 months)', mergedData?.phase2Data, 'phase-2');
      }
      if (path.includes('phase-3')) {
        return renderTier3Content('Phase 3: Optimization (6-12 months)', mergedData?.phase3Data, 'phase-3');
      }
      if (path.includes('phase-4')) {
        return renderTier3Content('Phase 4: Innovation (12+ months)', mergedData?.phase4Data, 'phase-4');
      }
      if (path.includes('cross-phase')) {
        return renderTier3Content('Cross-phase Dependencies', mergedData?.crossPhaseDependencies, 'cross-phase');
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

    // Experience Optimization → Content tier-3 content
    console.log('[WidgetRenderer DEBUG] Path:', path);
    console.log('[WidgetRenderer DEBUG] isExperienceOptimization:', pathMatchers.isExperienceOptimization(path));
    console.log('[WidgetRenderer DEBUG] isContent:', pathMatchers.isContent(path));
    console.log('[WidgetRenderer DEBUG] isContentSuggestions:', pathMatchers.isContentSuggestions(path));
    if (pathMatchers.isExperienceOptimization(path) && pathMatchers.isContent(path)) {
      if (pathMatchers.isAIForSEO(path)) {
        return <AIForSEOWidgetContainer data={mergedData} context={context} className="ai-for-seo-tier3-container" />;
      }
      if (pathMatchers.isContentOptimizationRecommendations(path)) {
        return <ContentOptimizationRecommendationsWidgetContainer data={mergedData} context={context} className="content-optimization-recommendations-tier3-container" />;
      }
      if (pathMatchers.isContentSuggestions(path)) {
        return <ContentSuggestionsWidgetContainer data={mergedData} context={context} className="content-suggestions-tier3-container" />;
      }
      if (pathMatchers.isContentROIAnalysis(path)) {
        return renderTier3Content('Content ROI Analysis', mergedData?.contentROIAnalysis, 'content-roi-analysis');
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