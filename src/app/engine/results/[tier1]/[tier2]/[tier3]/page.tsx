'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getTier3ItemsForTier2, getMappingForTier1, urlToTier2Name, urlToTier1Name, getTier2ItemsForTier1 } from '@/data/opal-mapping';
import { generateResultsPageTitle, updateDocumentTitle } from '@/lib/utils/page-titles';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import ResultsSidebar from '@/components/ResultsSidebar';
import ServiceStatusFooter from '@/components/ServiceStatusFooter';
import { ServiceStatusProvider } from '@/components/ServiceStatusProvider';
import BreadcrumbSearchHeader from '@/components/shared/BreadcrumbSearchHeader';
import MegaMenuDropdown from '@/components/shared/MegaMenuDropdown';
import Tier2SubNavigation from '@/components/shared/Tier2SubNavigation';
import ContentRenderer from '@/components/opal/ContentRenderer';
import { ArrowLeft, BarChart3, Activity, Settings, TrendingUp, Target } from 'lucide-react';
import { notFound, redirect } from 'next/navigation';
import { AskAssistantProvider } from '@/lib/askAssistant/context';
import { getResultsSectionKey, getSourcePath } from '@/lib/askAssistant/sectionMapping';

// Icon mapping for tier2 sections
const tier2IconMapping = {
  'OSA': BarChart3,
  'Content': Activity,
  'Audiences': Activity,
  'CX': Activity,
  'Experimentation': Activity,
  'Personalization': Activity,
  'Quick Wins': TrendingUp,
  'Maturity': Activity,
  'Phases': Activity,
  'Roadmap': Activity,
  'Content Recs': Activity,
  'CMS': Settings,
  'ODP': Activity,
  'WEBX': Activity,
  'CMP': Settings,
  'UX': Activity,
  'Technology': Settings
} as const;

function Tier3PageContent() {
  const params = useParams();

  // Decode URL parameters
  const tier1 = decodeURIComponent(params.tier1 as string);
  const tier2 = decodeURIComponent(params.tier2 as string);
  const tier3 = decodeURIComponent(params.tier3 as string);

  // Handle 301 redirects for old phase URLs
  if (tier1 === 'strategy-plans' && tier2 === 'phases') {
    const phaseRedirects: Record<string, string> = {
      'phase-1-foundation-0-3-months': 'phase-1',
      'phase-2-growth-3-6-months': 'phase-2',
      'phase-3-optimization-6-9-months': 'phase-3',
      'phase-4-scale-9-12-months': 'phase-4',
      'cross-phase-analysis': 'cross-phase-analysis'
    };

    if (phaseRedirects[tier3]) {
      const newUrl = `/engine/results/${tier1}/${tier2}/${phaseRedirects[tier3]}`;
      redirect(newUrl);
    }
  }

  // Convert URL segments back to proper names using mapping-aware functions
  const tier1Name = urlToTier1Name(tier1);
  const tier2Name = urlToTier2Name(tier1Name, tier2);

  const tier3Name = tier3.split('-').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');

  // Validate that this is a valid route
  const tier1Section = getMappingForTier1(tier1Name);
  const tier2Items = getTier2ItemsForTier1(tier1Name);
  const tier3Items = getTier3ItemsForTier2(tier1Name, tier2Name);

  // Check if the tier3 item exists (case-insensitive match)
  const validTier3 = tier3Items.find(item =>
    item.toLowerCase().replace(/\s+/g, '-') === tier3.toLowerCase()
  );

  // Show 404 if invalid route
  if (!tier1Section || !validTier3) {
    notFound();
  }

  // Add tier3 class to body and update page title
  useEffect(() => {
    document.body.classList.add('results-tier3');

    // Update page title with hierarchical structure
    const pageTitle = generateResultsPageTitle(tier1, tier2, tier3);
    updateDocumentTitle(pageTitle);

    return () => {
      document.body.classList.remove('results-tier3');
    };
  }, [tier1, tier2, tier3]);

  // Calculate Ask Assistant section key and source path
  const sectionKey = getResultsSectionKey(tier1, tier2, tier3, `/engine/results/${tier1}/${tier2}/${tier3}`);
  const sourcePath = getSourcePath(tier1, tier2, tier3, `/engine/results/${tier1}/${tier2}/${tier3}`);

  // Debug logging for development
  if (process.env.NODE_ENV === 'development') {
    console.log('[TIER3 ASK ASSISTANT DEBUG]', {
      tier1, tier2, tier3,
      tier1Name, tier2Name, tier3Name: validTier3,
      sectionKey, sourcePath,
      configExists: true, // Always true now with fallback
      configComplete: true // Always true now with fallback
    });
  }

  const content = (
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

            {/* Mega Menu Navigation */}
            <MegaMenuDropdown
              tier1Name={tier1Name}
              tier2Name={tier2Name}
              tier3Name={validTier3}
              currentTier1Url={tier1.toLowerCase()}
              currentTier2Url={tier2.toLowerCase()}
              currentTier3Url={tier3.toLowerCase()}
            />

            {/* Sub Navigation for Tier 3 Items */}
            <Tier2SubNavigation
              tier1Name={tier1Name}
              tier2Name={tier2Name}
              currentTier1Url={tier1.toLowerCase()}
              currentTier2Url={tier2.toLowerCase()}
              currentTier3Url={tier3.toLowerCase().replace(/[()]/g, '')}
            />

            <div className="max-w-7xl mx-auto p-6">

        {/* Page Header */}
        <div id="tier3-page-header" className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-start gap-6">
            <div className="p-4 bg-blue-50 rounded-xl shadow-sm">
              <BarChart3 className="h-10 w-10 text-blue-600" />
            </div>
            <div className="flex-1">
              <h1 className="font-bold text-gray-900 mb-3" style={{fontSize: '18px'}}>
                {tier1Name} → {tier2Name} → {validTier3}
              </h1>
              <p className="text-gray-700 leading-relaxed">
                Detailed insights and analytics for {validTier3} within {tier2Name}. Access comprehensive analysis and real-time data.
              </p>
            </div>
          </div>
        </div>


        {/* Main Content */}
        <div id="tier3-main-content">
          <ContentRenderer
            tier1Name={tier1Name}
            tier2Name={tier2Name}
            tier3Name={validTier3}
            mappingType={tier1Name as 'Strategy Plans' | 'Optimizely DXP Tools' | 'Analytics Insights' | 'Experience Optimization'}
          />
        </div>
            </div>
          </main>
        </div>
      </div>
      <ServiceStatusFooter />
    </>
  );

  // Always provide Ask Assistant context - fallback config available for all sections
  return (
    <AskAssistantProvider sectionKey={sectionKey} sourcePath={sourcePath}>
      {content}
    </AskAssistantProvider>
  );
}

export default function Tier3Page() {
  return (
    <ServiceStatusProvider>
      <Tier3PageContent />
    </ServiceStatusProvider>
  );
}