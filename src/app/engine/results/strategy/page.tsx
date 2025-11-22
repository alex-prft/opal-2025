'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { generatePageTitle, updateDocumentTitle } from '@/lib/utils/page-titles';
import ResultsSidebar from '@/components/ResultsSidebar';
import EngineActionsSummary from '@/components/EngineActionsSummary';
import BreadcrumbSearchHeader from '@/components/shared/BreadcrumbSearchHeader';
import { ServiceStatusProvider } from '@/components/ServiceStatusProvider';
import { EnhancedResultsRenderer } from '@/components/results/EnhancedResultsRenderer';
import { AskAssistantProvider } from '@/lib/askAssistant/context';
import { getResultsSectionKey, getSourcePath } from '@/lib/askAssistant/sectionMapping';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Target } from 'lucide-react';
import { loadWorkflowResults } from '@/lib/loaders/workflow-data-loader';
import type { OSAWorkflowOutput } from '@/lib/types/maturity';

// Component that uses useSearchParams (needs Suspense boundary)
function StrategyPageWithSearchParams() {
  const searchParams = useSearchParams();
  const workflowId = searchParams.get('workflow_id');

  return <StrategyPageContent workflowId={workflowId} />;
}

function StrategyPageContent({ workflowId }: { workflowId: string | null }) {
  // CRITICAL: React hook safety during Next.js static generation
  // During static generation, React can be null, so check before using hooks
  if (typeof window === 'undefined' && (!useEffect)) {
    // Return a safe fallback component during static generation to prevent build failures
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="container mx-auto p-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-600" />
                Strategy Plans
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-muted-foreground">Loading strategy content...</div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Workflow data loading (safe hooks usage after static generation check)
  const [workflowOutput, setWorkflowOutput] = useState<OSAWorkflowOutput | null>(null);
  const [isLoadingWorkflow, setIsLoadingWorkflow] = useState(true);

  // Add tier2 class to body and set page title
  useEffect(() => {
    document.body.classList.add('results-tier2');

    // Set page title
    const pageTitle = generatePageTitle({
      pageTitle: 'Strategy'
    });
    updateDocumentTitle(pageTitle);

    return () => {
      document.body.classList.remove('results-tier2');
    };
  }, []);

  // Load workflow data if workflow_id is provided
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const result = await loadWorkflowResults(workflowId);
        if (!cancelled) {
          setWorkflowOutput(result);
          setIsLoadingWorkflow(false);
        }
      } catch (error) {
        console.error('Error loading workflow results:', error);
        if (!cancelled) {
          setWorkflowOutput(null);
          setIsLoadingWorkflow(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [workflowId]);

  // Get section key and source path for Ask Assistant
  const sectionKey = getResultsSectionKey('strategy', undefined, undefined, '/engine/results/strategy');
  const sourcePath = getSourcePath('strategy', undefined, undefined, '/engine/results/strategy');

  if (!sectionKey) {
    // Fallback if section key can't be determined
    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
          <div className="flex">
            {/* Sidebar Navigation */}
            <ResultsSidebar />

            {/* Main Content */}
            <main className="flex-1 bg-gradient-to-br from-slate-50 via-white to-slate-100">
              <BreadcrumbSearchHeader
                onSearch={(query) => console.log('Search query:', query)}
                searchPlaceholder="Search Your Data"
              />

              <div className="max-w-7xl mx-auto p-6">
                {/* Page Header */}
                <Card className="mb-6">
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <Target className="h-8 w-8 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl">Strategy Plans</CardTitle>
                        <p className="text-gray-600 mt-1">
                          Comprehensive strategic planning and roadmap analysis for Optimizely implementation
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                {/* Enhanced Results Content System - Phase 4 Integration */}
                <EnhancedResultsRenderer
                  className="space-y-6"
                  tier1="strategy-plans"
                  tier2="strategy"
                  workflowOutput={workflowOutput ?? undefined}
                  isLoadingWorkflow={isLoadingWorkflow}
                />

                {/* Engine Actions Summary */}
                <div className="mt-8">
                  <EngineActionsSummary />
                </div>
              </div>
            </main>
          </div>
        </div>
      </>
    );
  }

  return (
    <AskAssistantProvider sectionKey={sectionKey} sourcePath={sourcePath}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="flex">
          {/* Sidebar Navigation */}
          <ResultsSidebar />

          {/* Main Content */}
          <main className="flex-1 bg-gradient-to-br from-slate-50 via-white to-slate-100">
            <BreadcrumbSearchHeader
              onSearch={(query) => console.log('Search query:', query)}
              searchPlaceholder="Search Your Data"
            />

            <div className="max-w-7xl mx-auto p-6">
              {/* Page Header */}
              <Card className="mb-6">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <Target className="h-8 w-8 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl">Strategy Plans</CardTitle>
                      <p className="text-gray-600 mt-1">
                        Comprehensive strategic planning and roadmap analysis for Optimizely implementation
                      </p>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* Enhanced Results Content System - Phase 4 Integration */}
              <EnhancedResultsRenderer
                className="space-y-6"
                tier1="strategy-plans"
                tier2="strategy"
                workflowOutput={workflowOutput ?? undefined}
                isLoadingWorkflow={isLoadingWorkflow}
              />

              {/* Engine Actions Summary */}
              <div className="mt-8">
                <EngineActionsSummary />
              </div>
            </div>
          </main>
        </div>
      </div>
    </AskAssistantProvider>
  );
}

export default function StrategyPage() {
  return (
    <ServiceStatusProvider>
      <Suspense fallback={
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
          <div className="container mx-auto p-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-600" />
                  Strategy Plans
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-muted-foreground">Loading strategy content...</div>
              </CardContent>
            </Card>
          </div>
        </div>
      }>
        <StrategyPageWithSearchParams />
      </Suspense>
    </ServiceStatusProvider>
  );
}