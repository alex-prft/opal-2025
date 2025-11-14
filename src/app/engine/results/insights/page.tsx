'use client';

import { useEffect } from 'react';
import ResultsSidebar from '@/components/ResultsSidebar';
import EngineActionsSummary from '@/components/EngineActionsSummary';
import BreadcrumbSearchHeader from '@/components/shared/BreadcrumbSearchHeader';
import ServiceStatusFooter from '@/components/ServiceStatusFooter';
import { ServiceStatusProvider } from '@/components/ServiceStatusProvider';
import { WidgetRenderer } from '@/components/widgets/WidgetRenderer';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';

function AnalyticsInsightsPageContent() {
  // Add tier2 class to body
  useEffect(() => {
    document.body.classList.add('results-tier2');
    return () => {
      document.body.classList.remove('results-tier2');
    };
  }, []);

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
                    <div className="p-3 bg-green-50 rounded-lg">
                      <BarChart3 className="h-8 w-8 text-green-600" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl">Analytics Insights</CardTitle>
                      <p className="text-gray-600 mt-1">
                        Advanced analytics and data insights with AI-powered visibility and engagement analysis
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
      <ServiceStatusFooter />
    </>
  );
}

export default function AnalyticsInsightsPage() {
  return (
    <ServiceStatusProvider>
      <AnalyticsInsightsPageContent />
    </ServiceStatusProvider>
  );
}