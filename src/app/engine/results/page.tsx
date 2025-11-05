'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { DateRangePicker } from '@/components/DateRangePicker';
import ModernMaturityPlanDisplay from '@/components/ModernMaturityPlanDisplay';
import MaturityAnalyticsDashboard from '@/components/MaturityAnalyticsDashboard';
import EnhancedAnalyticsDashboard from '@/components/EnhancedAnalyticsDashboard';
import ABTestBlueprintGenerator from '@/components/ABTestBlueprintGenerator';
import AudienceSyncRecommendations from '@/components/AudienceSyncRecommendations';
import ContentPerformanceScoring from '@/components/ContentPerformanceScoring';
import AEOAuditDashboard from '@/components/AEOAuditDashboard';
import AIExperimentationRecommendations from '@/components/AIExperimentationRecommendations';
import AIPersonalizationRecommendations from '@/components/AIPersonalizationRecommendations';
import DataInsightsDashboard from '@/components/DataInsightsDashboard';
import LoadingResultsPage from '@/components/LoadingResultsPage';
import PasswordProtection from '@/components/PasswordProtection';
import { ServiceStatusProvider, useServiceErrorListener } from '@/components/ServiceStatusProvider';
import ServiceStatusFooter from '@/components/ServiceStatusFooter';
import { PMGWorkflowOutput } from '@/lib/types/maturity';
import {
  Sparkles,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Settings
} from 'lucide-react';
import Link from 'next/link';

function ResultsPageContent() {
  const [workflowResult, setWorkflowResult] = useState<PMGWorkflowOutput | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    to: new Date()
  });

  // Initialize service error listener
  useServiceErrorListener();

  useEffect(() => {
    // Try to get results from sessionStorage or URL params
    const searchParams = new URLSearchParams(window.location.search);
    const resultId = searchParams.get('id');

    if (resultId) {
      // In a real app, you'd fetch the result by ID from your API
      // For now, check sessionStorage
      const savedResult = sessionStorage.getItem(`pmg_result_${resultId}`);
      if (savedResult) {
        try {
          setWorkflowResult(JSON.parse(savedResult));
        } catch (error) {
          console.error('Failed to parse saved result:', error);
        }
      }
    } else {
      // Check for the latest result in sessionStorage
      const latestResult = sessionStorage.getItem('pmg_latest_result');
      if (latestResult) {
        try {
          setWorkflowResult(JSON.parse(latestResult));
        } catch (error) {
          console.error('Failed to parse latest result:', error);
        }
      }
    }

    setIsLoading(false);
  }, []);

  const handleAuthenticated = () => {
    setIsAuthenticated(true);
  };

  if (!isAuthenticated) {
    return (
      <PasswordProtection onAuthenticated={handleAuthenticated}>
        <div />
      </PasswordProtection>
    );
  }

  if (isLoading) {
    return <LoadingResultsPage onComplete={() => setIsLoading(false)} />;
  }

  if (!workflowResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
        {/* Header */}
        <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <Link href="/">
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg p-3 cursor-pointer hover:shadow-lg transition-shadow">
                    <Sparkles className="h-6 w-6" />
                  </div>
                </Link>
                <div>
                  <h1 className="text-xl font-bold">Strategy Results</h1>
                  <p className="text-muted-foreground text-sm">Opal Assistant for IFPA</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* No Results Message */}
        <main className="container mx-auto px-4 py-16 text-center">
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                  <Sparkles className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">No Results Found</h3>
                  <p className="text-muted-foreground mb-6">
                    It looks like you haven't generated a strategy yet. Let's create one!
                  </p>
                  <Link href="/engine">
                    <Button className="gap-2">
                      <Sparkles className="h-4 w-4" />
                      Generate Strategy
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg p-3 cursor-pointer hover:shadow-lg transition-shadow">
                  <Sparkles className="h-6 w-6" />
                </div>
              </Link>
              <div>
                <h1 className="text-xl font-bold">Strategy Results</h1>
                <p className="text-muted-foreground text-sm">Opal Assistant for IFPA</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <DateRangePicker
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
              />

              <Link href="/engine/admin">
                <Button variant="outline" size="sm" className="gap-2">
                  <Settings className="h-4 w-4" />
                  Admin
                </Button>
              </Link>

              <Link href="/engine">
                <Button variant="outline" className="gap-2">
                  <ArrowRight className="h-4 w-4" />
                  Generate New Strategy
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-8">
        <Tabs defaultValue="strategy" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="strategy">Strategy</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="experimentation">Experimentation</TabsTrigger>
            <TabsTrigger value="personalization">Personalization</TabsTrigger>
            <TabsTrigger value="data-insights">Data Insights</TabsTrigger>
            <TabsTrigger value="more">More</TabsTrigger>
          </TabsList>

          <TabsContent value="strategy">
            <div className="space-y-6">
              <ModernMaturityPlanDisplay workflowResult={workflowResult} />
              <MaturityAnalyticsDashboard workflowResult={workflowResult} />
            </div>
          </TabsContent>

          <TabsContent value="content">
            <div className="space-y-6">
              <AEOAuditDashboard workflowResult={workflowResult} />
              <ContentPerformanceScoring />
            </div>
          </TabsContent>

          <TabsContent value="experimentation">
            <div className="space-y-6">
              <ABTestBlueprintGenerator />
              <AIExperimentationRecommendations />
            </div>
          </TabsContent>

          <TabsContent value="personalization">
            <div className="space-y-6">
              <AIPersonalizationRecommendations />
            </div>
          </TabsContent>

          <TabsContent value="data-insights">
            <DataInsightsDashboard />
          </TabsContent>

          <TabsContent value="more">
            <div className="space-y-6">
              <EnhancedAnalyticsDashboard workflowResult={workflowResult} />
              <AudienceSyncRecommendations />
            </div>
          </TabsContent>

        </Tabs>
      </main>
      <ServiceStatusFooter />
    </div>
  );
}

export default function EngineResultsPage() {
  return (
    <ServiceStatusProvider>
      <ResultsPageContent />
    </ServiceStatusProvider>
  );
}