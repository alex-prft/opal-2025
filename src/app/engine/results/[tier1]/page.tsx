'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getTier2ItemsForTier1, getMappingForTier1, urlToTier1Name } from '@/data/opal-mapping';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Users,
  Eye,
  Heart
} from 'lucide-react';
import ContentRenderer from '@/components/opal/ContentRenderer';
import { notFound } from 'next/navigation';

// Icon mapping for different tier1 areas
const tier1IconMapping = {
  'Strategy Plans': Target,
  'Optimizely DXP Tools': Settings,
  'Analytics Insights': BarChart3,
  'Experience Optimization': TrendingUp
} as const;

// Enhanced descriptions for each tier1 area
const tier1Descriptions = {
  'Strategy Plans': {
    description: 'Comprehensive strategic planning and roadmap analysis for Optimizely implementation. Access detailed OSA insights, quick wins, maturity assessments, implementation phases, and strategic roadmaps.',
    benefits: ['Strategic recommendations', 'Quick win identification', 'Maturity assessment', 'Phase-based implementation', 'Resource planning']
  },
  'Optimizely DXP Tools': {
    description: 'Deep dive into Optimizely Digital Experience Platform tools including Content Recommendations, CMS, ODP, Web Experimentation, and Campaign Management Platform integrations.',
    benefits: ['Content performance analysis', 'Customer data insights', 'Experimentation results', 'Campaign optimization', 'Multi-platform integration']
  },
  'Analytics Insights': {
    description: 'Advanced analytics and data insights across OSA, content performance, audience analysis, and customer experience metrics with AI-powered visibility and semantic analysis.',
    benefits: ['Real-time engagement metrics', 'AI visibility insights', 'Geographic performance', 'Content freshness analysis', 'Semantic topic modeling']
  },
  'Experience Optimization': {
    description: 'Comprehensive experience optimization strategies covering content optimization, experimentation frameworks, personalization, UX improvements, and technology integration.',
    benefits: ['Content strategy optimization', 'A/B testing frameworks', 'Personalization strategies', 'User journey optimization', 'Technology integration guidance']
  }
} as const;

// Icon mapping for tier2 sections
const tier2IconMapping = {
  'OSA': BarChart3,
  'Content': Eye,
  'Audiences': Users,
  'CX': Heart,
  'Quick Wins': TrendingUp,
  'Maturity': Activity,
  'Phases': Activity,
  'Roadmap': Activity,
  'Content Recs': Eye,
  'CMS': Settings,
  'ODP': Users,
  'WEBX': Activity,
  'CMP': Settings,
  'Experimentation': Activity,
  'Personalization': Users,
  'UX': Heart,
  'Technology': Settings
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

function Tier1PageContent() {
  const params = useParams();


  // Decode URL parameters
  const tier1 = decodeURIComponent(params.tier1 as string);

  // Convert URL segments back to proper names using mapping-aware functions
  const tier1Name = urlToTier1Name(tier1);

  // Validate that this is a valid route
  const tier1Section = getMappingForTier1(tier1Name);
  const tier2Items = getTier2ItemsForTier1(tier1Name);

  if (!tier1Section || tier2Items.length === 0) {
    notFound();
  }

  // Add tier1 class to body
  useEffect(() => {
    document.body.classList.add('results-tier1');
    return () => {
      document.body.classList.remove('results-tier1');
    };
  }, []);

  const Icon = tier1IconMapping[tier1Name as keyof typeof tier1IconMapping] || Activity;

  const getColorClass = (tier1Name: string) => {
    switch (tier1Name) {
      case 'Strategy Plans': return 'bg-blue-50 text-blue-700';
      case 'Optimizely DXP Tools': return 'bg-purple-50 text-purple-700';
      case 'Analytics Insights': return 'bg-green-50 text-green-700';
      case 'Experience Optimization': return 'bg-orange-50 text-orange-700';
      default: return 'bg-gray-50 text-gray-700';
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
              currentTier1Url={tier1.toLowerCase()}
            />

            <div className="max-w-7xl mx-auto p-6">

        {/* Page Header */}
        <div id="tier1-page-header" className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-start gap-6">
            <div className={`p-4 rounded-xl ${getColorClass(tier1Name)} bg-opacity-20 shadow-sm`}>
              <Icon className={`h-10 w-10`} />
            </div>
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-gray-900 mb-3">{tier1Name}</h1>
              <p className="text-lg text-gray-700 mb-4 leading-relaxed">
                {tier1Descriptions[tier1Name as keyof typeof tier1Descriptions]?.description ||
                 `Comprehensive insights and analytics for ${tier1Name}`}
              </p>

            </div>
          </div>
        </div>


        {/* Tier 2 Tab Navigation */}
        <div id="tier2-tab-navigation" className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Explore {tier1Name} Sections</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {tier2Items.map((tier2Item, index) => {
                const Tier2Icon = tier2IconMapping[tier2Item as keyof typeof tier2IconMapping] || Activity;

                return (
                  <Link
                    key={index}
                    href={`/engine/results/${tier1.toLowerCase()}/${tier2Item.toLowerCase().replace(/\s+/g, '-')}`}
                    className="flex flex-col items-center gap-2 p-4 rounded-lg border hover:shadow-md hover:border-blue-300 transition-all bg-white group"
                  >
                    <div className="p-3 bg-gray-50 rounded-lg group-hover:bg-blue-50 transition-colors">
                      <Tier2Icon className="h-6 w-6 text-gray-700 group-hover:text-blue-600" />
                    </div>
                    <div className="text-center">
                      <h4 className="font-medium text-gray-900 group-hover:text-blue-900 text-sm">{tier2Item}</h4>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

            </div>
          </main>
        </div>
      </div>
      <ServiceStatusFooter />
    </>
  );
}

export default function Tier1Page() {
  return (
    <ServiceStatusProvider>
      <Tier1PageContent />
    </ServiceStatusProvider>
  );
}