/**
 * Ask Assistant Results Page
 *
 * Displays Ask Assistant prompt results with tabs for current result and history.
 * Maintains consistent Results page layout and styling.
 */

'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { generatePageTitle, updateDocumentTitle } from '@/lib/utils/page-titles';
import ResultsSidebar from '@/components/ResultsSidebar';
import BreadcrumbSearchHeader from '@/components/shared/BreadcrumbSearchHeader';
import ServiceStatusFooter from '@/components/ServiceStatusFooter';
import { ServiceStatusProvider } from '@/components/ServiceStatusProvider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AskAssistantCurrentResult } from '@/components/ask-assistant/AskAssistantCurrentResult';
import { AskAssistantHistory } from '@/components/ask-assistant/AskAssistantHistory';
import { getAskAssistantConfig, ResultsSectionKey } from '@/lib/askAssistant/config';
import { MessageSquare, Clock, Info, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

function AskAssistantPageContent() {
  const searchParams = useSearchParams();
  const [sectionLabel, setSectionLabel] = useState<string>('');
  const [sourcePath, setSourcePath] = useState<string>('');

  const promptId = searchParams.get('promptId');
  const sectionKey = searchParams.get('sectionKey') as ResultsSectionKey;
  const prompt = searchParams.get('prompt'); // For fallback mode

  useEffect(() => {
    document.body.classList.add('results-tier2');

    // Set page title
    const pageTitle = generatePageTitle({
      pageTitle: 'Ask Assistant'
    });
    updateDocumentTitle(pageTitle);

    // Get section configuration
    if (sectionKey) {
      const config = getAskAssistantConfig(sectionKey);
      setSectionLabel(config?.label || sectionKey);
    }

    // Get source path
    const sourcePathParam = searchParams.get('sourcePath');
    if (sourcePathParam) {
      setSourcePath(sourcePathParam);
    }

    return () => {
      document.body.classList.remove('results-tier2');
    };
  }, [sectionKey, searchParams]);

  if (!promptId || !sectionKey) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="flex">
          <ResultsSidebar />
          <main className="flex-1 bg-gradient-to-br from-slate-50 via-white to-slate-100">
            <BreadcrumbSearchHeader
              onSearch={(query) => console.log('Search query:', query)}
              searchPlaceholder="Search Your Data"
            />
            <div className="max-w-7xl mx-auto p-6">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Invalid Ask Assistant request. Please start from a Results page.
                </AlertDescription>
              </Alert>
              <div className="mt-4">
                <Link href="/engine/results">
                  <Button variant="outline">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Results
                  </Button>
                </Link>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

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
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-purple-50 rounded-lg">
                        <MessageSquare className="h-8 w-8 text-purple-600" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl">Ask Assistant</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-gray-600">
                            AI-powered assistance for your Results analysis
                          </p>
                          {sectionLabel && (
                            <Badge variant="outline" className="ml-2">
                              {sectionLabel}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Back to source link */}
                    {sourcePath && (
                      <Link href={sourcePath}>
                        <Button variant="outline" size="sm">
                          <ArrowLeft className="h-4 w-4 mr-2" />
                          Back to Results
                        </Button>
                      </Link>
                    )}
                  </div>

                  {/* Source context */}
                  {sourcePath && (
                    <Alert className="mt-4">
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Context:</strong> This conversation started from{' '}
                        <Link
                          href={sourcePath}
                          className="text-blue-600 hover:text-blue-800 underline"
                        >
                          <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">
                            {sourcePath}
                          </code>
                        </Link>
                      </AlertDescription>
                    </Alert>
                  )}
                </CardHeader>
              </Card>

              {/* Main Content Tabs */}
              <Tabs defaultValue="current" className="space-y-6">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="current" className="flex items-center">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Current Result
                  </TabsTrigger>
                  <TabsTrigger value="history" className="flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    Previous Prompts
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="current">
                  <AskAssistantCurrentResult
                    promptId={promptId}
                    sectionKey={sectionKey}
                    fallbackPrompt={prompt}
                  />
                </TabsContent>

                <TabsContent value="history">
                  <AskAssistantHistory
                    sectionKey={sectionKey}
                    currentPromptId={promptId}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </main>
        </div>
      </div>
      <ServiceStatusFooter />
    </>
  );
}

function AskAssistantPageWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <MessageSquare className="h-8 w-8 mx-auto mb-4 text-purple-600" />
          <p className="text-gray-600">Loading Ask Assistant...</p>
        </div>
      </div>
    }>
      <AskAssistantPageContent />
    </Suspense>
  );
}

export default function AskAssistantPage() {
  return (
    <ServiceStatusProvider>
      <AskAssistantPageWrapper />
    </ServiceStatusProvider>
  );
}