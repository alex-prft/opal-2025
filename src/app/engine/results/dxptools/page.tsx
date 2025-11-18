'use client';

import { useEffect } from 'react';
import ResultsSidebar from '@/components/ResultsSidebar';
import EngineActionsSummary from '@/components/EngineActionsSummary';
import BreadcrumbSearchHeader from '@/components/shared/BreadcrumbSearchHeader';
import { ServiceStatusProvider } from '@/components/ServiceStatusProvider';
import { WidgetRenderer } from '@/components/widgets/WidgetRenderer';
import { AskAssistantProvider } from '@/lib/askAssistant/context';
import { getResultsSectionKey, getSourcePath } from '@/lib/askAssistant/sectionMapping';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings } from 'lucide-react';

function DXPToolsPageContent() {
  // Add tier2 class to body
  useEffect(() => {
    document.body.classList.add('results-tier2');
    return () => {
      document.body.classList.remove('results-tier2');
    };
  }, []);

  // Get section key and source path for Ask Assistant
  const sectionKey = getResultsSectionKey('dxptools', undefined, undefined, '/engine/results/dxptools');
  const sourcePath = getSourcePath('dxptools', undefined, undefined, '/engine/results/dxptools');

  if (!sectionKey) {
    // Fallback if section key can't be determined
    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
          <div className="flex">
            <ResultsSidebar />
            <main className="flex-1 bg-gradient-to-br from-slate-50 via-white to-slate-100">
              <BreadcrumbSearchHeader
                onSearch={(query) => console.log('Search query:', query)}
                searchPlaceholder="Search Your Data"
              />

              <div className="max-w-7xl mx-auto p-6">
                <Card className="mb-6">
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-purple-50 rounded-lg">
                        <Settings className="h-8 w-8 text-purple-600" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl">Optimizely DXP Tools</CardTitle>
                        <p className="text-gray-600 mt-1">
                          Integration health and performance monitoring for Optimizely DXP platform tools
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                <WidgetRenderer className="space-y-6" />

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
          <ResultsSidebar />
          <main className="flex-1 bg-gradient-to-br from-slate-50 via-white to-slate-100">
            <BreadcrumbSearchHeader
              onSearch={(query) => console.log('Search query:', query)}
              searchPlaceholder="Search Your Data"
            />

            <div className="max-w-7xl mx-auto p-6">
              <Card className="mb-6">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <Settings className="h-8 w-8 text-purple-600" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl">Optimizely DXP Tools</CardTitle>
                      <p className="text-gray-600 mt-1">
                        Integration health and performance monitoring for Optimizely DXP platform tools
                      </p>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              <WidgetRenderer className="space-y-6" />

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

export default function DXPToolsPage() {
  return (
    <ServiceStatusProvider>
      <DXPToolsPageContent />
    </ServiceStatusProvider>
  );
}