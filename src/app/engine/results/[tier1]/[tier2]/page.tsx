'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getTier3ItemsForTier2, getMappingForTier1, urlToTier2Name, urlToTier1Name, getTier2ItemsForTier1 } from '@/data/opal-mapping';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import ResultsSidebar from '@/components/ResultsSidebar';
import ServiceStatusFooter from '@/components/ServiceStatusFooter';
import { ServiceStatusProvider } from '@/components/ServiceStatusProvider';
import BreadcrumbSearchHeader from '@/components/shared/BreadcrumbSearchHeader';
import MegaMenuDropdown from '@/components/shared/MegaMenuDropdown';
import {
  ArrowLeft,
  BarChart3,
  Target,
  Settings,
  TrendingUp,
  Activity,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import ContentRenderer from '@/components/opal/ContentRenderer';
import { WidgetRenderer } from '@/components/widgets/WidgetRenderer';
import { notFound } from 'next/navigation';

// Icon mapping for different tier1 areas
const tier1IconMapping = {
  'Strategy Plans': Target,
  'Optimizely DXP Tools': Settings,
  'Analytics Insights': BarChart3,
  'Experience Optimization': TrendingUp
} as const;

// Enhanced descriptions for tier2 sections
const tier2Descriptions = {
  // Strategy Plans tier2 descriptions
  'OSA': {
    description: 'Comprehensive Optimizely Site Analytics with strategic insights, performance metrics, and data quality assessments.',
    keyFeatures: ['Strategic recommendations', 'Performance tracking', 'Data quality scoring', 'Workflow analysis']
  },
  'Quick Wins': {
    description: 'Immediate optimization opportunities with 30-day implementation roadmaps and expected impact analysis.',
    keyFeatures: ['Immediate opportunities', '30-day roadmap', 'Resource planning', 'Impact metrics']
  },
  'Maturity': {
    description: 'Current state assessment with maturity framework analysis, gap identification, and improvement pathways.',
    keyFeatures: ['Maturity assessment', 'Gap analysis', 'Improvement pathway', 'Benchmarking data']
  },
  'Phases': {
    description: 'Strategic implementation phases from foundation to innovation with timeline and dependency mapping.',
    keyFeatures: ['4-phase roadmap', 'Timeline planning', 'Dependencies', 'Progress tracking']
  },
  'Roadmap': {
    description: 'Comprehensive timeline view with milestone tracking, resource allocation, and risk assessment.',
    keyFeatures: ['Timeline visualization', 'Milestone tracking', 'Resource allocation', 'Risk management']
  },

  // Optimizely DXP Tools tier2 descriptions
  'Content Recs': {
    description: 'Advanced content recommendation analytics with visitor insights, A/B testing, and personalization effectiveness.',
    keyFeatures: ['Visitor analytics', 'Content performance', 'A/B testing results', 'Personalization metrics']
  },
  'CMS': {
    description: 'Content management system analytics covering inventory, workflows, performance, and multi-channel publishing.',
    keyFeatures: ['Content inventory', 'Publishing workflows', 'SEO optimization', 'Multi-channel publishing']
  },
  'ODP': {
    description: 'Optimizely Data Platform insights with customer profiles, audience segments, and real-time event tracking.',
    keyFeatures: ['Customer profiles', 'Audience segments', 'Journey analytics', 'Real-time events']
  },
  'WEBX': {
    description: 'Web experimentation platform with active experiments, statistical analysis, and conversion impact measurement.',
    keyFeatures: ['Active experiments', 'Results analysis', 'Statistical significance', 'Conversion tracking']
  },
  'CMP': {
    description: 'Campaign Management Platform analytics with email performance, automation workflows, and ROI analysis.',
    keyFeatures: ['Campaign performance', 'Email analytics', 'Automation workflows', 'ROI analysis']
  },

  // Analytics Insights tier2 descriptions
  'Content': {
    description: 'Deep content analytics with engagement metrics, topic analysis, AI visibility insights, and geographic performance.',
    keyFeatures: ['Engagement tracking', 'Topic modeling', 'AI visibility', 'Geographic analysis']
  },
  'Audiences': {
    description: 'Audience analytics with behavioral insights, engagement patterns, and semantic analysis across user segments.',
    keyFeatures: ['Audience segmentation', 'Behavioral analysis', 'Engagement patterns', 'Semantic insights']
  },
  'CX': {
    description: 'Customer experience analytics with journey mapping, interaction analysis, and experience quality metrics.',
    keyFeatures: ['Experience tracking', 'Journey analysis', 'Interaction metrics', 'Quality assessment']
  },
  'Experimentation': {
    description: 'Experimentation analytics and insights with test performance, statistical analysis, and conversion impact measurement.',
    keyFeatures: ['Test performance', 'Statistical analysis', 'Conversion tracking', 'Impact measurement']
  },
  'Personalization': {
    description: 'Personalization analytics with audience targeting, dynamic content performance, and optimization insights.',
    keyFeatures: ['Audience targeting', 'Content performance', 'Optimization insights', 'Personalization effectiveness']
  },

  // Experience Optimization tier2 descriptions
  'Experimentation': {
    description: 'Comprehensive experimentation framework with hypothesis validation, statistical testing, and impact assessment.',
    keyFeatures: ['Experiment design', 'Statistical testing', 'Hypothesis validation', 'Impact analysis']
  },
  'Personalization': {
    description: 'Personalization strategy and performance with audience segmentation, dynamic content, and real-time optimization.',
    keyFeatures: ['Personalization strategy', 'Dynamic content', 'Audience targeting', 'Real-time optimization']
  },
  'UX': {
    description: 'User experience optimization with journey mapping, usability testing, and conversion path analysis.',
    keyFeatures: ['Journey mapping', 'Usability testing', 'Conversion optimization', 'Experience metrics']
  },
  'Technology': {
    description: 'Technical implementation and integration analytics with architecture insights, performance monitoring, and API analytics.',
    keyFeatures: ['Integration architecture', 'Performance monitoring', 'API analytics', 'Implementation guide']
  }
} as const;

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

function Tier2PageContent() {
  const params = useParams();

  // Accordion state management
  const [expandedAccordions, setExpandedAccordions] = useState<Set<string>>(new Set());
  const [allExpanded, setAllExpanded] = useState(false);

  // Decode URL parameters
  const tier1 = decodeURIComponent(params.tier1 as string);
  const tier2 = decodeURIComponent(params.tier2 as string);

  // Convert URL segments back to proper names using mapping-aware functions
  const tier1Name = urlToTier1Name(tier1);
  const tier2Name = urlToTier2Name(tier1Name, tier2);

  // Validate that this is a valid route
  const tier1Section = getMappingForTier1(tier1Name);
  const tier2Items = getTier2ItemsForTier1(tier1Name);
  const tier3Items = getTier3ItemsForTier2(tier1Name, tier2Name);

  if (!tier1Section || tier3Items.length === 0) {
    notFound();
  }

  // Add tier2 class to body
  useEffect(() => {
    document.body.classList.add('results-tier2');
    return () => {
      document.body.classList.remove('results-tier2');
    };
  }, []);

  const Icon = tier1IconMapping[tier1Name as keyof typeof tier1IconMapping] || Activity;

  // Accordion helper functions
  const toggleAccordion = (tier3Item: string) => {
    const newExpanded = new Set(expandedAccordions);
    if (newExpanded.has(tier3Item)) {
      newExpanded.delete(tier3Item);
    } else {
      newExpanded.add(tier3Item);
    }
    setExpandedAccordions(newExpanded);
  };

  const toggleAllAccordions = () => {
    if (allExpanded) {
      setExpandedAccordions(new Set());
      setAllExpanded(false);
    } else {
      setExpandedAccordions(new Set(tier3Items));
      setAllExpanded(true);
    }
  };

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

            {/* Mega Menu Navigation */}
            <MegaMenuDropdown
              tier1Name={tier1Name}
              tier2Name={tier2Name}
              currentTier1Url={tier1.toLowerCase()}
              currentTier2Url={tier2.toLowerCase()}
            />

            <div className="max-w-7xl mx-auto p-6">

        {/* Page Header */}
        <div id="tier2-page-header" className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-start gap-6">
            <div className="p-4 bg-blue-50 rounded-xl shadow-sm">
              <Icon className="h-10 w-10 text-blue-600" />
            </div>
            <div className="flex-1">
              <h1 className="font-bold text-gray-900 mb-3" style={{fontSize: '18px'}}>
                {tier1Name} → {tier2Name}
              </h1>
              <p className="text-gray-700 leading-relaxed">
                {tier2Descriptions[tier2Name as keyof typeof tier2Descriptions]?.description ||
                 `Comprehensive insights and analytics for ${tier2Name} within ${tier1Name}`}
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div id="tier2-main-content" className="space-y-6">
          {/* OPAL Widget Renderer */}
          <div id="tier2-dynamic-content">
            <div id="tier2-widget-renderer-wrapper" className="space-y-4">
              <WidgetRenderer
                tier2={tier2Name}
                className="space-y-6"
              />
            </div>
          </div>

          {/* Tier 3 Accordions */}
          <Card id="tier2-tier3-navigation-card">
            <CardHeader id="tier2-tier3-navigation-header">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Icon className="h-5 w-5 text-blue-600" />
                  Detailed Analysis Categories
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleAllAccordions}
                  className="flex items-center gap-2"
                >
                  {allExpanded ? (
                    <>
                      <ChevronUp className="h-4 w-4" />
                      Collapse All
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4" />
                      Expand All
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent id="tier2-tier3-navigation-content">
              <p className="text-gray-700 mb-4">
                Explore specific insights and analytics for {tier2Name}. Each category provides detailed analysis and actionable recommendations.
              </p>
              <div id="tier2-tier3-accordions" className="space-y-3">
                {tier3Items.map((tier3Item, index) => {
                  const tier3Url = `/engine/results/${tier1.toLowerCase()}/${tier2.toLowerCase()}/${tier3Item.toLowerCase().replace(/\s+/g, '-')}`;
                  const tier3Id = `tier3-accordion-${tier3Item.toLowerCase().replace(/\s+/g, '-')}`;
                  const isExpanded = expandedAccordions.has(tier3Item);

                  return (
                    <div key={index} id={tier3Id} className="border rounded-lg overflow-hidden">
                      {/* Accordion Header */}
                      <button
                        onClick={() => toggleAccordion(tier3Item)}
                        className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors text-left"
                      >
                        <div className="flex items-center gap-3">
                          <BarChart3 className="h-5 w-5 text-blue-600" />
                          <div>
                            <h4 className="font-semibold text-gray-900">{tier3Item}</h4>
                            <p className="text-sm text-gray-600">
                              Interactive analysis view with real-time data
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Link
                            href={tier3Url}
                            onClick={(e) => e.stopPropagation()}
                            className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                          >
                            Open Analysis
                          </Link>
                          {isExpanded ? (
                            <ChevronUp className="h-5 w-5 text-gray-500" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-gray-500" />
                          )}
                        </div>
                      </button>

                      {/* Accordion Content */}
                      {isExpanded && (
                        <div className="border-t bg-gray-50 p-4">
                          <WidgetRenderer
                            tier2={tier2Name}
                            tier3={tier3Item}
                            className="space-y-4"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
            </div>
          </main>
        </div>
      </div>
      <ServiceStatusFooter />
    </>
  );
}

export default function Tier2Page() {
  return (
    <ServiceStatusProvider>
      <Tier2PageContent />
    </ServiceStatusProvider>
  );
}