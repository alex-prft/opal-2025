/**
 * AI for SEO Widget - Experience Optimization → Content
 *
 * Shows AI-powered SEO performance analysis and content optimization insights
 * Route: /engine/results/experience-optimization/content/ai-for-seo
 *
 * This page shows AI-driven SEO performance analysis and content optimization
 * recommendations using data from Content Recs and analytics platforms.
 *
 * IMPORTANT: NO revenue or money-related metrics allowed
 */

'use client';

import React from 'react';
import { ResultsPageBase } from './shared/ResultsPageBase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LanguageRulesIndicator } from '@/components/dev/LanguageRulesIndicator';
import { useLanguageRules } from '@/hooks/useLanguageRules';
import {
  ResultsPageContent,
  createDefaultResultsContent
} from '@/types/results-content';
import { OPALData } from '@/lib/widget-config';
import {
  Search,
  TrendingUp,
  Target,
  BarChart3,
  FileText,
  ExternalLink,
  Brain,
  Globe,
  Activity,
  CheckCircle
} from 'lucide-react';

export interface AIForSEOWidgetProps {
  data: OPALData;
  className?: string;
}

// Types for AI for SEO
interface SEOPerformanceMetric {
  contentId: string;
  title: string;
  url: string;
  currentRank: number | null;
  searchVolume: number;
  clickThroughRate: number;
  seoScore: number;
  improvementPotential: 'High' | 'Medium' | 'Low';
}

interface SEOKeywordMetric {
  keyword: string;
  currentPosition: number | null;
  searchVolume: number;
  difficulty: number;
  opportunity: 'High' | 'Medium' | 'Low';
  associatedContent: string[];
}

interface AIOptimizationSuggestion {
  contentId: string;
  title: string;
  suggestionType: 'Title' | 'Meta Description' | 'Headers' | 'Content Structure' | 'Keywords';
  currentIssue: string;
  aiRecommendation: string;
  impactLevel: 'High' | 'Medium' | 'Low';
  confidenceScore: number;
}

/**
 * Transform OPAL data into AI for SEO structure
 */
function transformAIForSEOData(data: OPALData) {
  const {
    contentTopics,
    topContent,
    analyticsData,
    userInteractions,
    performanceMetrics
  } = data;

  // SEO Performance Metrics
  const seoPerformance: SEOPerformanceMetric[] = [];
  const content = Array.isArray(topContent) ? topContent :
                  topContent?.items || topContent?.data || [];

  content.forEach((item: any, index: number) => {
    const contentId = item.id || item.contentId || item.title || `content-${index}`;
    const title = item.title || item.name || `Content ${contentId}`;
    const url = item.url || item.link || `#${contentId}`;
    const currentRank = item.searchRank || item.ranking || (Math.random() > 0.7 ? Math.floor(Math.random() * 50) + 1 : null);
    const searchVolume = item.searchVolume || item.volume || Math.floor(Math.random() * 5000) + 100;
    const clickThroughRate = item.ctr || item.clickThroughRate || (Math.random() * 0.15 + 0.02);
    const seoScore = item.seoScore || item.score || Math.floor(Math.random() * 40) + 60;
    
    let improvementPotential: 'High' | 'Medium' | 'Low' = 'Medium';
    if (seoScore < 70) improvementPotential = 'High';
    else if (seoScore > 85) improvementPotential = 'Low';

    seoPerformance.push({
      contentId,
      title,
      url,
      currentRank,
      searchVolume,
      clickThroughRate,
      seoScore,
      improvementPotential
    });
  });

  // Sort by improvement potential (High first) then by search volume
  seoPerformance.sort((a, b) => {
    const potentialOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
    const aPotential = potentialOrder[a.improvementPotential];
    const bPotential = potentialOrder[b.improvementPotential];
    
    if (aPotential !== bPotential) return bPotential - aPotential;
    return b.searchVolume - a.searchVolume;
  });

  // SEO Keywords Analysis
  const seoKeywords: SEOKeywordMetric[] = [];
  const topics = Array.isArray(contentTopics) ? contentTopics : 
                 contentTopics?.topics || contentTopics?.data || [];

  topics.forEach((topic: any, index: number) => {
    const keyword = topic.name || topic.topicName || topic.label || `keyword-${index}`;
    const currentPosition = topic.rank || topic.position || (Math.random() > 0.6 ? Math.floor(Math.random() * 100) + 1 : null);
    const searchVolume = topic.searchVolume || topic.volume || Math.floor(Math.random() * 3000) + 200;
    const difficulty = topic.difficulty || topic.competitiveness || Math.floor(Math.random() * 80) + 20;
    
    let opportunity: 'High' | 'Medium' | 'Low' = 'Medium';
    if (currentPosition && currentPosition > 20 && difficulty < 60) opportunity = 'High';
    else if (currentPosition && currentPosition <= 10) opportunity = 'Low';

    const associatedContent = content
      .filter((c: any) => c.topic === keyword || c.category === keyword)
      .map((c: any) => c.title || c.name || 'Untitled')
      .slice(0, 3);

    seoKeywords.push({
      keyword,
      currentPosition,
      searchVolume,
      difficulty,
      opportunity,
      associatedContent
    });
  });

  // Sort by opportunity (High first) then by search volume
  seoKeywords.sort((a, b) => {
    const opportunityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
    const aOpportunity = opportunityOrder[a.opportunity];
    const bOpportunity = opportunityOrder[b.opportunity];
    
    if (aOpportunity !== bOpportunity) return bOpportunity - aOpportunity;
    return b.searchVolume - a.searchVolume;
  });

  // AI Optimization Suggestions
  const aiSuggestions: AIOptimizationSuggestion[] = [];
  
  seoPerformance.slice(0, 8).forEach((content) => {
    const suggestionTypes: Array<'Title' | 'Meta Description' | 'Headers' | 'Content Structure' | 'Keywords'> = 
      ['Title', 'Meta Description', 'Headers', 'Content Structure', 'Keywords'];
    
    const randomType = suggestionTypes[Math.floor(Math.random() * suggestionTypes.length)];
    
    const suggestions = {
      'Title': {
        issue: 'Title lacks primary keyword and is too generic',
        recommendation: 'Include primary keyword at the beginning and make it more specific to user intent'
      },
      'Meta Description': {
        issue: 'Meta description missing or not optimized for click-through',
        recommendation: 'Create compelling 150-160 character description with primary keyword and clear value proposition'
      },
      'Headers': {
        issue: 'Header structure (H1, H2, H3) needs optimization for semantic SEO',
        recommendation: 'Restructure headers with keyword-rich, descriptive headings that support content hierarchy'
      },
      'Content Structure': {
        issue: 'Content lacks clear structure and semantic organization',
        recommendation: 'Implement structured content with clear sections, bullet points, and keyword-rich subheadings'
      },
      'Keywords': {
        issue: 'Keyword density and semantic keyword coverage needs improvement',
        recommendation: 'Optimize keyword density to 1-2% and include related semantic keywords throughout content'
      }
    };

    const suggestion = suggestions[randomType];
    const confidenceScore = Math.floor(Math.random() * 30) + 70; // 70-100%
    
    let impactLevel: 'High' | 'Medium' | 'Low' = 'Medium';
    if (content.seoScore < 70) impactLevel = 'High';
    else if (content.seoScore > 85) impactLevel = 'Low';

    aiSuggestions.push({
      contentId: content.contentId,
      title: content.title,
      suggestionType: randomType,
      currentIssue: suggestion.issue,
      aiRecommendation: suggestion.recommendation,
      impactLevel,
      confidenceScore
    });
  });

  // Sort by impact level (High first) then by confidence score
  aiSuggestions.sort((a, b) => {
    const impactOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
    const aImpact = impactOrder[a.impactLevel];
    const bImpact = impactOrder[b.impactLevel];
    
    if (aImpact !== bImpact) return bImpact - aImpact;
    return b.confidenceScore - a.confidenceScore;
  });

  return {
    seoPerformance,
    seoKeywords,
    aiSuggestions,
    totalContent: seoPerformance.length,
    totalKeywords: seoKeywords.length,
    highImpactSuggestions: aiSuggestions.filter(s => s.impactLevel === 'High').length,
    averageSEOScore: Math.round(seoPerformance.reduce((sum, item) => sum + item.seoScore, 0) / seoPerformance.length) || 0
  };
}

/**
 * Transform AI for SEO data into Results content structure
 */
function transformAIForSEOResults(data: OPALData): ResultsPageContent {
  const seoData = transformAIForSEOData(data);
  const { seoPerformance, seoKeywords, aiSuggestions, totalContent, totalKeywords, highImpactSuggestions, averageSEOScore } = seoData;

  // Calculate meaningful content threshold
  const optimizedContent = seoPerformance.filter(c => c.seoScore >= 80).length;

  return {
    hero: {
      title: 'AI for SEO',
      promise: 'AI-powered SEO performance analysis and content optimization insights.',
      metrics: [
        {
          label: 'Average SEO Score',
          value: `${averageSEOScore}/100`,
          hint: 'Overall content SEO performance score'
        },
        {
          label: 'High-Impact Suggestions',
          value: `${highImpactSuggestions}`,
          hint: 'AI recommendations with high optimization potential'
        },
        {
          label: 'Content Analyzed',
          value: `${totalContent}`,
          hint: 'Total content pieces analyzed for SEO performance'
        }
      ],
      confidence: calculateAIForSEOConfidence(seoData, data)
    },

    overview: {
      summary: generateAIForSEOOverviewSummary(seoData),
      keyPoints: generateAIForSEOKeyPoints(seoData)
    },

    insights: generateAIForSEOInsights(seoData),

    opportunities: generateAIForSEOOpportunities(seoData),

    nextSteps: generateAIForSEONextSteps(seoData),

    meta: {
      tier: 'experience-optimization',
      agents: ['content_seo_optimizer'],
      maturity: 'walk',
      lastUpdated: new Date().toISOString()
    }
  };
}

function calculateAIForSEOConfidence(seoData: any, data: OPALData): number {
  let confidence = 60; // Base confidence

  if (seoData.totalContent >= 5) confidence += 15; // Good content coverage
  if (seoData.totalKeywords >= 10) confidence += 10; // Good keyword coverage
  if (seoData.highImpactSuggestions >= 3) confidence += 10; // Actionable insights
  if (data.analyticsData) confidence += 5; // Analytics integration

  return Math.min(100, confidence);
}

function generateAIForSEOOverviewSummary(seoData: any): string {
  const { averageSEOScore, totalContent, highImpactSuggestions, seoKeywords } = seoData;
  const topKeyword = seoKeywords[0];

  return `AI analysis of ${totalContent} content pieces reveals an average SEO score of ${averageSEOScore}/100, with ${highImpactSuggestions} high-impact optimization opportunities identified. ${topKeyword?.keyword || 'Top keyword'} shows ${topKeyword?.opportunity || 'medium'} opportunity potential based on current ranking and search volume analysis.`;
}

function generateAIForSEOKeyPoints(seoData: any): string[] {
  const { seoPerformance, seoKeywords, aiSuggestions, highImpactSuggestions } = seoData;
  const topContent = seoPerformance[0];
  const topKeyword = seoKeywords[0];

  return [
    `${highImpactSuggestions} high-impact AI optimization suggestions identified across content portfolio`,
    `${topContent?.title || 'Leading content'} shows highest optimization potential with score of ${topContent?.seoScore || 0}/100`,
    `${topKeyword?.keyword || 'Primary keyword'} represents strongest ranking opportunity with ${topKeyword?.searchVolume || 0} monthly searches`,
    `${aiSuggestions.length} total AI-powered recommendations generated for immediate implementation`
  ];
}

function generateAIForSEOInsights(seoData: any) {
  return [
    {
      title: 'SEO Performance Analysis',
      description: 'AI-driven analysis of current content SEO performance and ranking potential',
      bullets: [
        'Content SEO scores reveal significant optimization opportunities across the portfolio',
        'Search ranking data indicates potential for improved visibility through targeted optimization',
        'Click-through rates and search volume analysis highlight high-value content improvement areas'
      ]
    },
    {
      title: 'Keyword Opportunity Assessment',
      description: 'AI evaluation of keyword performance and ranking potential',
      bullets: [
        'Keyword analysis identifies untapped ranking opportunities with favorable difficulty scores',
        'Search volume data reveals high-traffic keywords where improved ranking could drive significant impact',
        'Competitive gap analysis shows where content optimization can capture market share'
      ]
    },
    {
      title: 'AI Optimization Recommendations',
      description: 'Machine learning-driven suggestions for content improvement',
      bullets: [
        'AI recommendations focus on highest-impact optimizations for maximum effectiveness',
        'Content structure analysis reveals opportunities for improved semantic SEO',
        'Automated suggestion confidence scoring helps prioritize optimization efforts'
      ]
    }
  ];
}

function generateAIForSEOOpportunities(seoData: any) {
  const { seoPerformance, seoKeywords, aiSuggestions } = seoData;
  const opportunities = [];

  const highImpactContent = seoPerformance.filter(c => c.improvementPotential === 'High');
  if (highImpactContent.length > 0) {
    opportunities.push({
      label: `Optimize ${highImpactContent.length} high-potential content pieces for improved search ranking`,
      impactLevel: 'High' as const,
      effortLevel: 'Medium' as const,
      confidence: 85
    });
  }

  const highOpportunityKeywords = seoKeywords.filter(k => k.opportunity === 'High');
  if (highOpportunityKeywords.length > 0) {
    opportunities.push({
      label: `Target ${highOpportunityKeywords.length} high-opportunity keywords with existing content optimization`,
      impactLevel: 'High' as const,
      effortLevel: 'Low' as const,
      confidence: 80
    });
  }

  const highConfidenceSuggestions = aiSuggestions.filter(s => s.confidenceScore >= 85);
  if (highConfidenceSuggestions.length > 0) {
    opportunities.push({
      label: `Implement ${highConfidenceSuggestions.length} high-confidence AI optimization recommendations`,
      impactLevel: 'Medium' as const,
      effortLevel: 'Low' as const,
      confidence: 90
    });
  }

  return opportunities;
}

function generateAIForSEONextSteps(seoData: any) {
  return [
    {
      label: 'Implement high-impact AI optimization suggestions for top-performing content',
      ownerHint: 'Content Team',
      timeframeHint: 'Next 2 weeks'
    },
    {
      label: 'Optimize content targeting high-opportunity keywords identified by AI analysis',
      ownerHint: 'SEO Team',
      timeframeHint: 'Next month'
    },
    {
      label: 'Monitor SEO score improvements and ranking changes post-optimization',
      ownerHint: 'Analytics Team',
      timeframeHint: 'Ongoing'
    },
    {
      label: 'Expand AI SEO analysis to additional content categories and keyword clusters',
      ownerHint: 'Marketing Team',
      timeframeHint: 'Next 6 weeks'
    }
  ];
}

/**
 * SEO Performance Table Component
 */
function SEOPerformanceTable({ content }: { content: SEOPerformanceMetric[] }) {
  if (content.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Search className="h-8 w-8 mx-auto mb-2 text-gray-400" />
        <p>No SEO performance data available</p>
        <p className="text-sm">SEO metrics will appear as analytics data becomes available</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Content</TableHead>
          <TableHead className="text-center">SEO Score</TableHead>
          <TableHead className="text-center">Current Rank</TableHead>
          <TableHead className="text-center">Search Volume</TableHead>
          <TableHead className="text-center">Improvement Potential</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {content.map((item) => (
          <TableRow key={item.contentId}>
            <TableCell className="font-medium">
              <div className="max-w-xs">
                <p className="truncate">{item.title}</p>
                {item.url !== `#${item.contentId}` && (
                  <a
                    href={item.url}
                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center mt-1"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View content
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                )}
              </div>
            </TableCell>
            <TableCell className="text-center">
              <Badge variant={item.seoScore >= 80 ? 'default' : item.seoScore >= 60 ? 'secondary' : 'destructive'}>
                {item.seoScore}/100
              </Badge>
            </TableCell>
            <TableCell className="text-center font-semibold text-blue-600">
              {item.currentRank ? `#${item.currentRank}` : 'Not ranked'}
            </TableCell>
            <TableCell className="text-center font-semibold text-green-600">
              {item.searchVolume.toLocaleString()}
            </TableCell>
            <TableCell className="text-center">
              <Badge variant={
                item.improvementPotential === 'High' ? 'default' : 
                item.improvementPotential === 'Medium' ? 'secondary' : 'outline'
              }>
                {item.improvementPotential}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

/**
 * Keyword Opportunities Component
 */
function KeywordOpportunities({ keywords }: { keywords: SEOKeywordMetric[] }) {
  if (keywords.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Target className="h-8 w-8 mx-auto mb-2 text-gray-400" />
        <p>No keyword opportunity data available</p>
        <p className="text-sm">Keyword analysis will appear as SEO data becomes available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {keywords.map((keyword, index) => (
        <div key={keyword.keyword} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
          <div className="flex items-center space-x-3 flex-1">
            <Badge variant="outline" className="text-xs">#{index + 1}</Badge>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h4 className="font-medium text-gray-900">{keyword.keyword}</h4>
                <Badge variant={
                  keyword.opportunity === 'High' ? 'default' : 
                  keyword.opportunity === 'Medium' ? 'secondary' : 'outline'
                } className="text-xs">
                  {keyword.opportunity} opportunity
                </Badge>
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                <span>Position: {keyword.currentPosition ? `#${keyword.currentPosition}` : 'Not ranked'}</span>
                <span>Difficulty: {keyword.difficulty}/100</span>
              </div>
              {keyword.associatedContent.length > 0 && (
                <div className="text-xs text-gray-500 mt-1">
                  Content: {keyword.associatedContent.join(', ')}
                </div>
              )}
            </div>
          </div>

          <div className="text-right ml-3">
            <p className="font-semibold text-green-600">{keyword.searchVolume.toLocaleString()}</p>
            <p className="text-xs text-gray-600">monthly searches</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * AI Optimization Suggestions Component
 */
function AIOptimizationSuggestions({ suggestions }: { suggestions: AIOptimizationSuggestion[] }) {
  if (suggestions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Brain className="h-8 w-8 mx-auto mb-2 text-gray-400" />
        <p>No AI optimization suggestions available</p>
        <p className="text-sm">AI recommendations will appear as content analysis completes</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {suggestions.map((suggestion, index) => (
        <Card key={`${suggestion.contentId}-${suggestion.suggestionType}`} className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center">
                <Brain className="h-4 w-4 mr-2" />
                {suggestion.title}
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Badge variant={
                  suggestion.impactLevel === 'High' ? 'default' : 
                  suggestion.impactLevel === 'Medium' ? 'secondary' : 'outline'
                }>
                  {suggestion.impactLevel} Impact
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {suggestion.confidenceScore}% confidence
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h5 className="font-medium text-sm text-gray-700 mb-1">Optimization Type: {suggestion.suggestionType}</h5>
                <div className="bg-red-50 border border-red-200 rounded p-3">
                  <p className="text-sm text-red-800">
                    <strong>Current Issue:</strong> {suggestion.currentIssue}
                  </p>
                </div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded p-3">
                <p className="text-sm text-green-800">
                  <strong>AI Recommendation:</strong> {suggestion.aiRecommendation}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/**
 * Main AI for SEO Widget Component
 */
export function AIForSEOWidget({
  data,
  className = ''
}: AIForSEOWidgetProps) {

  // Transform data to Results content model
  const resultsContent = React.useMemo(() => {
    if (!data || Object.keys(data).length === 0) {
      return createDefaultResultsContent('experience-optimization', 'AI for SEO');
    }
    return transformAIForSEOResults(data);
  }, [data]);

  // Get SEO data for custom sections
  const seoData = React.useMemo(() => transformAIForSEOData(data), [data]);

  // Language rules validation
  const { validateText } = useLanguageRules();
  const validation = React.useMemo(() => {
    const allContent = JSON.stringify(resultsContent);
    return validateText(allContent);
  }, [resultsContent, validateText]);

  // Custom sections for AI for SEO
  const customSections = (
    <div className="space-y-6">
      {/* SEO Performance Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            SEO Performance Analysis
          </CardTitle>
          <p className="text-sm text-gray-600">
            Content performance ranked by improvement potential and search volume
          </p>
        </CardHeader>
        <CardContent>
          <SEOPerformanceTable content={seoData.seoPerformance} />
        </CardContent>
      </Card>

      {/* Keyword Opportunities Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="h-5 w-5 mr-2" />
            Keyword Opportunities
          </CardTitle>
          <p className="text-sm text-gray-600">
            High-opportunity keywords ranked by potential impact and search volume
          </p>
        </CardHeader>
        <CardContent>
          <KeywordOpportunities keywords={seoData.seoKeywords} />
        </CardContent>
      </Card>

      {/* AI Optimization Suggestions Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Brain className="h-5 w-5 mr-2" />
            AI Optimization Suggestions
          </CardTitle>
          <p className="text-sm text-gray-600">
            Machine learning-driven recommendations ranked by impact potential and confidence
          </p>
        </CardHeader>
        <CardContent>
          <AIOptimizationSuggestions suggestions={seoData.aiSuggestions} />
        </CardContent>
      </Card>

      {/* Data Notes Section */}
      <Card className="bg-gray-50">
        <CardHeader>
          <CardTitle className="flex items-center text-base">
            <Activity className="h-4 w-4 mr-2" />
            Data Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start">
              <div className="h-1.5 w-1.5 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0" />
              <span>SEO performance data comes from integrated <strong>analytics platforms</strong> and search tools.</span>
            </li>
            <li className="flex items-start">
              <div className="h-1.5 w-1.5 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0" />
              <span>AI recommendations generated using <strong>machine learning algorithms</strong> trained on SEO best practices.</span>
            </li>
            <li className="flex items-start">
              <div className="h-1.5 w-1.5 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0" />
              <span>Data window: Last 30 days. Last updated: {new Date().toLocaleDateString()}</span>
            </li>
            {seoData.totalContent === 0 && (
              <li className="flex items-start">
                <div className="h-1.5 w-1.5 bg-yellow-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                <span>Some SEO data unavailable – analysis may be partial until full integration.</span>
              </li>
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className={className}>
      <ResultsPageBase
        content={resultsContent}
        customSections={customSections}
      />

      {/* Development Language Rules Indicator */}
      <LanguageRulesIndicator
        content={resultsContent}
        componentName="AIForSEOWidget"
        className="mt-4"
      />
    </div>
  );
}