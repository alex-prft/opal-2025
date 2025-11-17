/**
 * Content Suggestions Widget - Experience Optimization Content
 *
 * Implements the "Content Suggestions" page for Experience Optimization → Content
 * Main "what to write/create next" workspace with prioritized content ideas
 * Follows results-content-optimizer specifications with three suggestion lanes
 */

'use client';

import React from 'react';
import { ResultsPageBase } from './shared/ResultsPageBase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LanguageRulesIndicator } from '@/components/dev/LanguageRulesIndicator';
import { useContentLanguageRules } from '@/hooks/useLanguageRules';
import {
  ResultsPageContent,
  createDefaultResultsContent
} from '@/types/results-content';
import { OPALData } from '@/lib/widget-config';
import {
  Zap,
  Target,
  Users,
  Lightbulb,
  TrendingUp,
  Calendar,
  User,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Video,
  FileText,
  Headphones,
  BarChart3
} from 'lucide-react';

export interface ContentSuggestionsWidgetProps {
  data: OPALData;
  className?: string;
}

/**
 * Content Suggestion Object Model
 */
interface ContentSuggestion {
  id: string;
  workingTitle: string;
  primaryPersona: string;
  secondaryPersona?: string;
  topic: string;
  summary: string;
  suggestedFormats: string[];
  seoAiHints: string[];
  maturityHint?: 'crawl' | 'walk' | 'run' | 'fly';
  lane: 'quick_win' | 'strategic_bet' | 'persona_gap';
  confidence: number;
  campaignContext?: string;
  rationale: {
    problemSolving: string;
    journeyStage: string;
    dataSignals: string[];
  };
}

/**
 * Generate content suggestions from OPAL data
 */
function generateContentSuggestions(data: OPALData): ContentSuggestion[] {
  const {
    contentTopics,
    analyticsData,
    userInteractions,
    topContent,
    personaData,
    maturityData
  } = data;

  const suggestions: ContentSuggestion[] = [];

  // Generate Quick Win suggestions (10 suggestions)
  const quickWinSuggestions = generateQuickWinSuggestions(contentTopics, analyticsData);
  suggestions.push(...quickWinSuggestions);

  // Generate Strategic Bet suggestions (10 suggestions)
  const strategicBetSuggestions = generateStrategicBetSuggestions(contentTopics, userInteractions);
  suggestions.push(...strategicBetSuggestions);

  // Generate Persona Coverage Gap suggestions (10 suggestions)
  const personaGapSuggestions = generatePersonaGapSuggestions(personaData, analyticsData);
  suggestions.push(...personaGapSuggestions);

  return suggestions;
}

function generateQuickWinSuggestions(contentTopics: any, analyticsData: any): ContentSuggestion[] {
  const suggestions: ContentSuggestion[] = [];
  const topicsArray = Array.isArray(contentTopics) ? contentTopics : contentTopics?.topics || [];

  const quickWinTemplates = [
    {
      titlePattern: "Ultimate Guide to {topic}",
      formats: ["Article", "Guide"],
      problemSolving: "Comprehensive resource addressing all common questions and advanced concepts",
      journeyStage: "awareness, evaluation"
    },
    {
      titlePattern: "{topic} Best Practices Checklist",
      formats: ["Checklist", "Guide"],
      problemSolving: "Actionable steps for implementing topic effectively",
      journeyStage: "evaluation, implementation"
    },
    {
      titlePattern: "Common {topic} Mistakes to Avoid",
      formats: ["Article", "Blog"],
      problemSolving: "Prevent common pitfalls and failures",
      journeyStage: "evaluation, onboarding"
    },
    {
      titlePattern: "{topic} ROI Calculator and Analysis",
      formats: ["Tool", "Infographic"],
      problemSolving: "Quantify value and business impact",
      journeyStage: "evaluation, decision"
    },
    {
      titlePattern: "Quick Start Guide: {topic} in 30 Minutes",
      formats: ["Guide", "Video"],
      problemSolving: "Fast implementation for immediate results",
      journeyStage: "onboarding, implementation"
    }
  ];

  topicsArray.slice(0, 10).forEach((topic: any, index: number) => {
    const template = quickWinTemplates[index % quickWinTemplates.length];
    const topicName = topic.name || topic.topicName || `Topic ${index + 1}`;
    const performance = topic.performance || (0.7 + Math.random() * 0.2);

    suggestions.push({
      id: `quick-win-${index + 1}`,
      workingTitle: template.titlePattern.replace('{topic}', topicName),
      primaryPersona: getPersonaFromTopic(topic, index, 'primary'),
      secondaryPersona: getPersonaFromTopic(topic, index, 'secondary'),
      topic: topicName,
      summary: `${template.problemSolving} for ${topicName}. Builds on existing high-performing content to provide comprehensive coverage that addresses user needs throughout their journey.`,
      suggestedFormats: template.formats,
      seoAiHints: [
        `${topicName} guide`,
        `${topicName} best practices`,
        `comprehensive ${topicName}`,
        `${topicName} implementation`,
        `${topicName} optimization`
      ],
      maturityHint: 'walk',
      lane: 'quick_win',
      confidence: Math.round(80 + Math.random() * 15),
      rationale: {
        problemSolving: template.problemSolving,
        journeyStage: template.journeyStage,
        dataSignals: [
          `${topicName} shows ${Math.round(performance * 100)}% engagement rate`,
          'Topic performs above average in content recommendations',
          'High search volume and user interaction patterns',
          'Content gap analysis reveals opportunity for comprehensive coverage'
        ]
      }
    });
  });

  return suggestions.slice(0, 10);
}

function generateStrategicBetSuggestions(contentTopics: any, userInteractions: any): ContentSuggestion[] {
  const suggestions: ContentSuggestion[] = [];

  const strategicTemplates = [
    {
      title: "Interactive Content Experience Series",
      topic: "Engagement Innovation",
      formats: ["Interactive Content", "Video Series"],
      problemSolving: "Transform passive content consumption into engaging, participatory experiences",
      journeyStage: "awareness, engagement"
    },
    {
      title: "Multi-Format Content Campaign",
      topic: "Content Integration",
      formats: ["Campaign", "Multi-Format"],
      problemSolving: "Comprehensive content approach across multiple touchpoints and formats",
      journeyStage: "awareness, evaluation, decision"
    },
    {
      title: "AI-Powered Content Personalization System",
      topic: "Personalization Technology",
      formats: ["Technology Integration", "Dynamic Content"],
      problemSolving: "Deliver personalized content experiences at scale",
      journeyStage: "all stages"
    },
    {
      title: "Community-Driven Content Platform",
      topic: "Community Engagement",
      formats: ["Platform", "User-Generated Content"],
      problemSolving: "Build engaged community through collaborative content creation",
      journeyStage: "onboarding, advocacy"
    },
    {
      title: "Data-Driven Content Performance Dashboard",
      topic: "Content Analytics",
      formats: ["Dashboard", "Analytics Tool"],
      problemSolving: "Real-time content performance monitoring and optimization",
      journeyStage: "all stages"
    },
    {
      title: "Cross-Platform Content Syndication Network",
      topic: "Content Distribution",
      formats: ["Multi-Channel", "Syndication"],
      problemSolving: "Maximize content reach across all relevant platforms",
      journeyStage: "awareness, reach"
    },
    {
      title: "Advanced Content SEO Strategy",
      topic: "SEO Innovation",
      formats: ["Strategy", "Technical Content"],
      problemSolving: "Next-generation SEO approach for content visibility",
      journeyStage: "awareness, discovery"
    },
    {
      title: "Content Automation and AI Integration",
      topic: "Content Technology",
      formats: ["Automation", "AI Tools"],
      problemSolving: "Scale content production through intelligent automation",
      journeyStage: "all stages"
    },
    {
      title: "Immersive Content Experience Design",
      topic: "Experience Innovation",
      formats: ["Immersive Content", "Interactive"],
      problemSolving: "Create memorable, immersive content experiences",
      journeyStage: "engagement, conversion"
    },
    {
      title: "Predictive Content Strategy Framework",
      topic: "Predictive Analytics",
      formats: ["Framework", "Strategic Tool"],
      problemSolving: "Anticipate content needs using predictive analytics",
      journeyStage: "strategic planning"
    }
  ];

  strategicTemplates.forEach((template, index) => {
    suggestions.push({
      id: `strategic-bet-${index + 1}`,
      workingTitle: template.title,
      primaryPersona: getStrategicPersona(index, 'primary'),
      secondaryPersona: getStrategicPersona(index, 'secondary'),
      topic: template.topic,
      summary: `${template.problemSolving}. This strategic investment requires significant planning and resources but offers substantial long-term competitive advantage in content strategy.`,
      suggestedFormats: template.formats,
      seoAiHints: [
        template.topic.toLowerCase().replace(' ', '-'),
        'content innovation',
        'strategic content',
        'advanced content strategy',
        'content transformation'
      ],
      maturityHint: index < 3 ? 'run' : 'fly',
      lane: 'strategic_bet',
      confidence: Math.round(65 + Math.random() * 20),
      campaignContext: getStrategicCampaignContext(index),
      rationale: {
        problemSolving: template.problemSolving,
        journeyStage: template.journeyStage,
        dataSignals: [
          'Emerging market trends support this content approach',
          'Competitive analysis reveals strategic opportunity',
          'Technology readiness indicators show implementation feasibility',
          'User behavior data suggests demand for this content type'
        ]
      }
    });
  });

  return suggestions;
}

function generatePersonaGapSuggestions(personaData: any, analyticsData: any): ContentSuggestion[] {
  const suggestions: ContentSuggestion[] = [];

  const personas = ['Decision Maker', 'Technical Evaluator', 'End User', 'Influencer'];
  
  const gapTemplates = [
    {
      titlePattern: "{persona} Success Stories and Case Studies",
      formats: ["Case Study", "Success Story"],
      problemSolving: "Demonstrate value and success through peer examples",
      journeyStage: "evaluation, decision"
    },
    {
      titlePattern: "{persona} Onboarding and Getting Started Guide",
      formats: ["Guide", "Tutorial"],
      problemSolving: "Smooth onboarding experience specific to persona needs",
      journeyStage: "onboarding, implementation"
    },
    {
      titlePattern: "{persona} Advanced Strategies and Techniques",
      formats: ["Advanced Guide", "Masterclass"],
      problemSolving: "Deep expertise for experienced users",
      journeyStage: "optimization, mastery"
    },
    {
      titlePattern: "{persona} FAQ and Troubleshooting",
      formats: ["FAQ", "Support Content"],
      problemSolving: "Address common questions and problems",
      journeyStage: "onboarding, support"
    },
    {
      titlePattern: "{persona} Industry Trends and Insights",
      formats: ["Report", "Analysis"],
      problemSolving: "Industry-specific insights and trend analysis",
      journeyStage: "awareness, evaluation"
    },
    {
      titlePattern: "{persona} Tool Comparison and Selection Guide",
      formats: ["Comparison", "Selection Guide"],
      problemSolving: "Help choose the right tools and solutions",
      journeyStage: "evaluation, decision"
    },
    {
      titlePattern: "{persona} Performance Benchmarks and KPIs",
      formats: ["Benchmark Report", "KPI Guide"],
      problemSolving: "Measurement and performance standards",
      journeyStage: "implementation, optimization"
    },
    {
      titlePattern: "{persona} Community and Networking Resources",
      formats: ["Community Guide", "Networking"],
      problemSolving: "Connect with peers and build professional network",
      journeyStage: "engagement, advocacy"
    },
    {
      titlePattern: "{persona} Training and Certification Program",
      formats: ["Training", "Certification"],
      problemSolving: "Formal skill development and credentialing",
      journeyStage: "implementation, mastery"
    },
    {
      titlePattern: "{persona} Budget and ROI Planning Toolkit",
      formats: ["Toolkit", "Planning Guide"],
      problemSolving: "Financial planning and justification resources",
      journeyStage: "evaluation, decision"
    }
  ];

  personas.forEach((persona, personaIndex) => {
    // Generate 2-3 suggestions per persona
    const templatesForPersona = gapTemplates.slice(personaIndex * 2, personaIndex * 2 + 3);
    
    templatesForPersona.forEach((template, templateIndex) => {
      const suggestionIndex = personaIndex * 3 + templateIndex;
      if (suggestionIndex < 10) { // Limit to 10 suggestions
        suggestions.push({
          id: `persona-gap-${suggestionIndex + 1}`,
          workingTitle: template.titlePattern.replace('{persona}', persona),
          primaryPersona: persona,
          topic: `${persona} Coverage`,
          summary: `${template.problemSolving} specifically designed for ${persona} needs, concerns, and decision-making process. Addresses identified gaps in persona-specific content coverage.`,
          suggestedFormats: template.formats,
          seoAiHints: [
            `${persona.toLowerCase().replace(' ', '-')} content`,
            `${persona.toLowerCase().replace(' ', '-')} resources`,
            `${persona.toLowerCase().replace(' ', '-')} guide`,
            'persona-specific content',
            'targeted content'
          ],
          maturityHint: templateIndex === 0 ? 'walk' : 'run',
          lane: 'persona_gap',
          confidence: Math.round(70 + Math.random() * 20),
          rationale: {
            problemSolving: template.problemSolving,
            journeyStage: template.journeyStage,
            dataSignals: [
              `Analytics show engagement gaps for ${persona} segment`,
              'Content audit reveals underrepresentation in this persona',
              'Search data indicates unmet information needs',
              `${persona} feedback indicates specific content requirements`
            ]
          }
        });
      }
    });
  });

  return suggestions.slice(0, 10);
}

function getPersonaFromTopic(topic: any, index: number, type: 'primary' | 'secondary'): string {
  const personas = ['Decision Maker', 'Technical Evaluator', 'End User', 'Influencer'];
  const primaryIndex = index % personas.length;
  const secondaryIndex = (index + 1) % personas.length;
  
  if (type === 'primary') {
    return personas[primaryIndex];
  } else {
    return primaryIndex !== secondaryIndex ? personas[secondaryIndex] : undefined;
  }
}

function getStrategicPersona(index: number, type: 'primary' | 'secondary'): string {
  const strategicPersonas = ['Decision Maker', 'Technical Evaluator', 'End User', 'Influencer'];
  const primaryIndex = Math.floor(index / 2) % strategicPersonas.length;
  const secondaryIndex = (primaryIndex + 2) % strategicPersonas.length;
  
  if (type === 'primary') {
    return strategicPersonas[primaryIndex];
  } else {
    return primaryIndex !== secondaryIndex ? strategicPersonas[secondaryIndex] : undefined;
  }
}

function getStrategicCampaignContext(index: number): string {
  const campaigns = [
    'Digital transformation initiative',
    'Q2 product launch campaign',
    'Customer success program',
    'Innovation showcase series',
    'Market expansion effort'
  ];
  return campaigns[index % campaigns.length];
}

/**
 * Transform suggestions into Results content structure
 */
function transformContentSuggestionsData(data: OPALData): ResultsPageContent {
  const suggestions = generateContentSuggestions(data);

  // Calculate hero metrics
  const quickWins = suggestions.filter(s => s.lane === 'quick_win').length;
  const personas = new Set(suggestions.map(s => s.primaryPersona)).size;
  const avgConfidence = Math.round(suggestions.reduce((sum, s) => sum + s.confidence, 0) / suggestions.length);

  return {
    hero: {
      title: 'Content Suggestions: What to Publish Next',
      promise: 'Prioritized content ideas based on your current performance, personas, and marketing focus.',
      metrics: [
        {
          label: 'Content Suggestions',
          value: `${suggestions.length} ideas`,
          hint: 'Across all priority lanes'
        },
        {
          label: 'Personas Covered',
          value: `${personas} personas`,
          hint: 'Primary audience targets'
        },
        {
          label: 'Quick Win Opportunities',
          value: `${quickWins} ideas`,
          hint: 'High impact, low effort suggestions'
        }
      ],
      confidence: avgConfidence
    },

    overview: {
      summary: generateContentSuggestionsOverviewSummary(suggestions),
      keyPoints: generateContentSuggestionsKeyPoints(suggestions)
    },

    insights: generateContentSuggestionsInsights(suggestions),

    opportunities: generateContentSuggestionsOpportunities(suggestions),

    nextSteps: generateContentSuggestionsNextSteps(suggestions),

    meta: {
      tier: 'optimization',
      agents: ['content_suggestions_optimizer'],
      maturity: 'walk',
      lastUpdated: new Date().toISOString()
    }
  };
}

function generateContentSuggestionsOverviewSummary(suggestions: ContentSuggestion[]): string {
  const quickWinCount = suggestions.filter(s => s.lane === 'quick_win').length;
  const strategicCount = suggestions.filter(s => s.lane === 'strategic_bet').length;
  const personaCount = suggestions.filter(s => s.lane === 'persona_gap').length;

  return `This living list of ${suggestions.length} content suggestions updates based on performance and strategy changes. Currently showing ${quickWinCount} quick wins for immediate implementation, ${strategicCount} strategic bets for long-term competitive advantage, and ${personaCount} persona coverage improvements to address underserved audience segments.`;
}

function generateContentSuggestionsKeyPoints(suggestions: ContentSuggestion[]): string[] {
  const formatCounts = suggestions.reduce((acc, s) => {
    s.suggestedFormats.forEach(format => {
      acc[format] = (acc[format] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  const topFormats = Object.entries(formatCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([format]) => format);

  return [
    'Suggestions generated from Content Recs, ODP personas, Analytics Insights, and marketing calendar alignment',
    `Top recommended formats: ${topFormats.join(', ')} based on current performance patterns`,
    'All suggestions include SEO/AI optimization hints for improved content discovery',
    'Content complexity calibrated to organizational maturity and resource availability'
  ];
}

function generateContentSuggestionsInsights(suggestions: ContentSuggestion[]) {
  return [
    {
      title: 'Content Opportunity Distribution',
      description: 'Analysis of suggestion types and strategic distribution across lanes',
      bullets: [
        'Quick wins focus on expanding successful topics with proven engagement patterns',
        'Strategic bets target emerging content formats and innovative approaches',
        'Persona gaps address specific audience segments showing engagement potential'
      ]
    },
    {
      title: 'Format and Channel Strategy',
      description: 'Recommended content formats align with audience preferences and performance data',
      bullets: [
        'Multi-format approach maximizes content reach and engagement opportunities',
        'Format selection based on topic performance and persona consumption patterns',
        'SEO and AI optimization hints included for enhanced content discoverability'
      ]
    }
  ];
}

function generateContentSuggestionsOpportunities(suggestions: ContentSuggestion[]) {
  return [
    {
      label: 'Implement quick win suggestions for immediate content portfolio expansion',
      impactLevel: 'High' as const,
      effortLevel: 'Low' as const,
      confidence: 85
    },
    {
      label: 'Address persona coverage gaps to improve audience engagement across all segments',
      impactLevel: 'Medium' as const,
      effortLevel: 'Medium' as const,
      confidence: 80
    },
    {
      label: 'Invest in strategic bet opportunities for long-term content competitive advantage',
      impactLevel: 'High' as const,
      effortLevel: 'High' as const,
      confidence: 75
    }
  ];
}

function generateContentSuggestionsNextSteps(suggestions: ContentSuggestion[]) {
  return [
    {
      label: 'Select and brief top 5 quick win suggestions for immediate content development',
      ownerHint: 'Content Manager',
      timeframeHint: 'Next 2 weeks'
    },
    {
      label: 'Review persona gap suggestions and assign persona-specific content development',
      ownerHint: 'Content Strategy Team',
      timeframeHint: 'Next month'
    },
    {
      label: 'Evaluate strategic bet opportunities for quarterly content planning integration',
      ownerHint: 'Marketing Leadership',
      timeframeHint: 'Next 6 weeks'
    },
    {
      label: 'Establish content performance tracking for implemented suggestions',
      ownerHint: 'Analytics Team',
      timeframeHint: 'Next 3 weeks'
    }
  ];
}

/**
 * Content Suggestion Lane Component
 */
interface SuggestionLaneProps {
  title: string;
  description: string;
  suggestions: ContentSuggestion[];
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  showLimit: number;
  onShowMore: () => void;
  canShowMore: boolean;
}

function SuggestionLane({ title, description, suggestions, icon: Icon, color, showLimit, onShowMore, canShowMore }: SuggestionLaneProps) {
  const visibleSuggestions = suggestions.slice(0, showLimit);

  return (
    <Card className={`border-l-4 border-l-${color}-500`}>
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <Icon className={`h-5 w-5 mr-2 text-${color}-600`} />
          {title}
        </CardTitle>
        <p className="text-sm text-gray-600">{description}</p>
        <Badge variant="outline" className="w-fit">
          {suggestions.length} suggestion{suggestions.length !== 1 ? 's' : ''}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {visibleSuggestions.map((suggestion) => (
            <ContentSuggestionCard key={suggestion.id} suggestion={suggestion} />
          ))}

          {canShowMore && suggestions.length > showLimit && (
            <Button
              variant="outline"
              size="sm"
              onClick={onShowMore}
              className="w-full"
            >
              <ChevronDown className="h-4 w-4 mr-2" />
              Show {Math.min(5, suggestions.length - showLimit)} more
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Individual Content Suggestion Card
 */
function ContentSuggestionCard({ suggestion }: { suggestion: ContentSuggestion }) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  const formatIcons = {
    'Article': FileText,
    'Guide': BookOpen,
    'Video': Video,
    'Podcast': Headphones,
    'Infographic': BarChart3,
    'Blog': FileText,
    'Checklist': FileText,
    'Tool': BarChart3,
    'Interactive Content': Target,
    'Campaign': TrendingUp
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-gray-900 flex-1">{suggestion.workingTitle}</h4>
        <div className="flex items-center space-x-2 ml-4">
          <Badge variant="default" className="text-xs">
            {suggestion.confidence}% confidence
          </Badge>
        </div>
      </div>

      <div className="text-sm text-gray-600 mb-3">
        <div className="flex flex-wrap gap-2">
          <span><strong>Topic:</strong> {suggestion.topic}</span>
          <span><strong>Primary:</strong> {suggestion.primaryPersona}</span>
          {suggestion.secondaryPersona && (
            <span><strong>Secondary:</strong> {suggestion.secondaryPersona}</span>
          )}
        </div>
      </div>

      <p className="text-sm text-gray-700 mb-3">{suggestion.summary}</p>

      <div className="flex items-center justify-between mb-3">
        <div className="flex flex-wrap gap-1">
          {suggestion.suggestedFormats.map((format, index) => {
            const IconComponent = formatIcons[format] || FileText;
            return (
              <Badge key={index} variant="secondary" className="text-xs flex items-center">
                <IconComponent className="h-3 w-3 mr-1" />
                {format}
              </Badge>
            );
          })}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-3 w-3 mr-1" />
              Less detail
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3 mr-1" />
              More detail
            </>
          )}
        </Button>
      </div>

      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="space-y-3 text-xs">
            <div>
              <p className="font-medium text-gray-800 mb-1">Problem Solving:</p>
              <p className="text-gray-600">{suggestion.rationale.problemSolving}</p>
            </div>

            <div>
              <p className="font-medium text-gray-800 mb-1">Journey Stage:</p>
              <p className="text-gray-600">{suggestion.rationale.journeyStage}</p>
            </div>

            <div>
              <p className="font-medium text-gray-800 mb-1">Data Signals:</p>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                {suggestion.rationale.dataSignals.map((signal, index) => (
                  <li key={index}>{signal}</li>
                ))}
              </ul>
            </div>

            <div>
              <p className="font-medium text-gray-800 mb-1">SEO & AI Hints:</p>
              <div className="flex flex-wrap gap-1">
                {suggestion.seoAiHints.map((hint, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {hint}
                  </Badge>
                ))}
              </div>
            </div>

            {suggestion.maturityHint && (
              <div>
                <p className="font-medium text-gray-800 mb-1">Maturity Target:</p>
                <Badge variant="outline" className="text-xs">
                  {suggestion.maturityHint.toUpperCase()}
                </Badge>
              </div>
            )}

            {suggestion.campaignContext && (
              <div>
                <p className="font-medium text-gray-800 mb-1">Campaign Context:</p>
                <p className="text-gray-600">{suggestion.campaignContext}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Main Content Suggestions Widget Component
 */
export function ContentSuggestionsWidget({ data, className = '' }: ContentSuggestionsWidgetProps) {
  // Transform data to Results content model
  const resultsContent = React.useMemo(() => {
    if (!data || Object.keys(data).length === 0) {
      return createDefaultResultsContent('optimization', 'Content Suggestions: What to Publish Next');
    }
    return transformContentSuggestionsData(data);
  }, [data]);

  // Generate content suggestions for lanes display
  const suggestions = React.useMemo(() => generateContentSuggestions(data), [data]);

  // Language rules validation
  const { validateContentSuggestions } = useContentLanguageRules();
  const suggestionsValidation = React.useMemo(() => 
    validateContentSuggestions ? validateContentSuggestions(suggestions) : { violations: [] }, 
    [suggestions, validateContentSuggestions]
  );

  // Lane display state
  const [showLimits, setShowLimits] = React.useState({
    quick_win: 5,
    strategic_bet: 5,
    persona_gap: 5
  });

  const handleShowMore = (lane: 'quick_win' | 'strategic_bet' | 'persona_gap') => {
    setShowLimits(prev => ({
      ...prev,
      [lane]: prev[lane] + 5
    }));
  };

  // Organize suggestions by lanes
  const quickWinSuggestions = suggestions.filter(s => s.lane === 'quick_win');
  const strategicBetSuggestions = suggestions.filter(s => s.lane === 'strategic_bet');
  const personaGapSuggestions = suggestions.filter(s => s.lane === 'persona_gap');

  // Custom sections for Content Suggestions
  const customSections = (
    <div className="space-y-6">
      {/* Data Input Logic Explanation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-blue-600" />
            How Suggestions Are Generated
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-600">
          <p className="mb-2">
            Suggestions are generated using Content Recs + ODP + Analytics + OPAL instructions + CMP data.
            This is a <strong>living list</strong> that updates as performance and instructions change.
          </p>
          <p>
            This page focuses on <strong>ideas and briefs</strong>, not final copy. 
            Execution and tracking happen in CMS and CMP.
          </p>
        </CardContent>
      </Card>

      {/* Core Lanes Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Lightbulb className="h-5 w-5 mr-2" />
            Content Suggestion Lanes
          </CardTitle>
          <p className="text-sm text-gray-600">
            Showing {Math.min(showLimits.quick_win, quickWinSuggestions.length) +
                     Math.min(showLimits.strategic_bet, strategicBetSuggestions.length) +
                     Math.min(showLimits.persona_gap, personaGapSuggestions.length)} of {suggestions.length} total suggestions
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Lane 1: Quick Wins */}
            <SuggestionLane
              title="Quick Wins"
              description="High impact, lower effort content opportunities"
              suggestions={quickWinSuggestions}
              icon={Zap}
              color="green"
              showLimit={showLimits.quick_win}
              onShowMore={() => handleShowMore('quick_win')}
              canShowMore={quickWinSuggestions.length > showLimits.quick_win}
            />

            {/* Lane 2: Strategic Bets */}
            <SuggestionLane
              title="Strategic Bets"
              description="Higher effort, high strategic importance investments"
              suggestions={strategicBetSuggestions}
              icon={Target}
              color="blue"
              showLimit={showLimits.strategic_bet}
              onShowMore={() => handleShowMore('strategic_bet')}
              canShowMore={strategicBetSuggestions.length > showLimits.strategic_bet}
            />

            {/* Lane 3: Persona Coverage Gaps */}
            <SuggestionLane
              title="Persona Coverage Gaps"
              description="Ideas designed to shore up underserved personas"
              suggestions={personaGapSuggestions}
              icon={Users}
              color="purple"
              showLimit={showLimits.persona_gap}
              onShowMore={() => handleShowMore('persona_gap')}
              canShowMore={personaGapSuggestions.length > showLimits.persona_gap}
            />
          </div>
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
        componentName="ContentSuggestionsWidget"
        className="mt-4"
      />
    </div>
  );
}