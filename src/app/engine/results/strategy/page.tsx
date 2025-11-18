'use client';

import { useEffect } from 'react';
import { generatePageTitle, updateDocumentTitle } from '@/lib/utils/page-titles';
import ResultsSidebar from '@/components/ResultsSidebar';
import EngineActionsSummary from '@/components/EngineActionsSummary';
import BreadcrumbSearchHeader from '@/components/shared/BreadcrumbSearchHeader';
import { ServiceStatusProvider } from '@/components/ServiceStatusProvider';
import { WidgetRenderer } from '@/components/widgets/WidgetRenderer';
import { AskAssistantProvider } from '@/lib/askAssistant/context';
import { getResultsSectionKey, getSourcePath } from '@/lib/askAssistant/sectionMapping';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Target } from 'lucide-react';

function StrategyPageContent() {
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

                {/* OPAL Widget Renderer */}
                <WidgetRenderer className="space-y-6" />

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

              {/* OPAL Widget Renderer */}
              <WidgetRenderer className="space-y-6" />

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
      <StrategyPageContent />
    </ServiceStatusProvider>
  );
}