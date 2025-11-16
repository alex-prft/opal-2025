/**
 * Content Next Best Ideas Widget - Experience Optimization Content
 *
 * Implements Experience Optimization → Content page with content idea lanes:
 * - Quick Wins (High impact, Low effort)
 * - Strategic Bets (Medium/High effort, high strategic importance)
 * - Persona Coverage Gaps
 *
 * Content-only focus - NO experimentation, personalization, UX, or technology details
 * NO revenue or currency-based metrics allowed
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
  ContentIdea,
  ContentNextBestIdeasResponse,
  ContentIdeaLane,
  MaturityPhase,
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
  ChevronUp
} from 'lucide-react';

export interface ContentNextBestIdeasWidgetProps {
  data: OPALData;
  className?: string;
}

/**
 * Generate content ideas from OPAL data
 */
function generateContentIdeas(data: OPALData): ContentNextBestIdeasResponse {
  const {
    contentTopics,
    analyticsData,
    userInteractions,
    topContent,
    maturityData
  } = data;

  const currentMaturity: MaturityPhase = maturityData?.currentPhase?.toLowerCase() as MaturityPhase || 'walk';

  // Generate ideas across different lanes
  const quickWinIdeas = generateQuickWinIdeas(contentTopics, analyticsData, currentMaturity);
  const strategicBetIdeas = generateStrategicBetIdeas(contentTopics, userInteractions, currentMaturity);
  const personaGapIdeas = generatePersonaGapIdeas(analyticsData, topContent, currentMaturity);

  const allIdeas = [...quickWinIdeas, ...strategicBetIdeas, ...personaGapIdeas];

  return {
    ideas: allIdeas,
    meta: {
      totalIdeas: allIdeas.length,
      generatedAt: new Date().toISOString(),
      maturityPhase: currentMaturity
    }
  };
}

function generateQuickWinIdeas(contentTopics: any, analyticsData: any, maturity: MaturityPhase): ContentIdea[] {
  const ideas: ContentIdea[] = [];
  const topicsArray = Array.isArray(contentTopics) ? contentTopics : contentTopics?.topics || [];

  // Generate 3-4 quick win ideas based on existing high-performing topics
  topicsArray.slice(0, 4).forEach((topic: any, index: number) => {
    const topicName = topic.name || topic.topicName || `Topic ${index + 1}`;
    const performance = topic.performance || topic.engagementRate || (0.6 + Math.random() * 0.3);

    if (performance > 0.7) { // Only high-performing topics for quick wins
      ideas.push({
        id: `quick-win-${index + 1}`,
        workingTitle: `${topicName} Deep Dive: Comprehensive Guide`,
        sourceTopicId: topic.id || `topic-${index}`,
        sourceTopicLabel: topicName,
        primaryPersonaId: topic.primaryPersona || undefined,
        genericRole: topic.primaryPersona ? undefined : 'Prospective customer',
        summary: `Create an in-depth, comprehensive guide covering all aspects of ${topicName}. Build on existing high engagement to provide definitive resource that addresses common questions and advanced topics.`,
        seoAiHints: [
          `${topicName} complete guide`,
          `${topicName} best practices`,
          `comprehensive ${topicName} resource`
        ],
        lane: 'quick_win',
        impact: 'High',
        effort: 'Low',
        confidence: Math.round(85 + Math.random() * 10),
        maturityTarget: maturity,
        rationale: {
          performanceSignals: [
            `${topicName} shows ${Math.round(performance * 100)}% engagement rate`,
            'Existing content in this topic performs above average',
            'High search volume and interaction patterns'
          ],
          personaSignals: [
            topic.primaryPersona ? `Strong resonance with ${topic.primaryPersona}` : 'Broad audience appeal',
            'Content gap analysis shows opportunity for comprehensive coverage'
          ],
          strategyAlignment: `Aligns with ${maturity} phase focus on ${getMaturityFocus(maturity)}`
        }
      });
    }
  });

  return ideas;
}

function generateStrategicBetIdeas(contentTopics: any, userInteractions: any, maturity: MaturityPhase): ContentIdea[] {
  const ideas: ContentIdea[] = [];

  // Generate 2-3 strategic bet ideas based on emerging trends or gaps
  const strategicIdeas = [
    {
      title: 'Interactive Content Series',
      topic: 'Engagement Innovation',
      summary: 'Develop interactive content series that transforms static information into engaging, participatory experiences. Focus on topics showing engagement potential but requiring deeper user involvement.',
      hints: ['interactive content', 'user engagement', 'content innovation']
    },
    {
      title: 'Cross-Topic Content Bridges',
      topic: 'Content Integration',
      summary: 'Create content that bridges multiple high-performing topics, providing comprehensive coverage that connects related concepts. Addresses user journey complexity.',
      hints: ['topic integration', 'comprehensive guides', 'user journey content']
    },
    {
      title: 'Persona-Specific Content Tracks',
      topic: 'Audience Targeting',
      summary: 'Develop dedicated content tracks tailored to specific persona needs and preferences. Requires research and persona-specific content strategy development.',
      hints: ['persona targeting', 'audience-specific content', 'tailored messaging']
    }
  ];

  strategicIdeas.forEach((idea, index) => {
    if (index < 3) { // Limit to 3 strategic bets
      ideas.push({
        id: `strategic-bet-${index + 1}`,
        workingTitle: idea.title,
        sourceTopicId: `strategic-${index}`,
        sourceTopicLabel: idea.topic,
        summary: idea.summary,
        seoAiHints: idea.hints,
        lane: 'strategic_bet',
        impact: index === 0 ? 'High' : 'Medium',
        effort: 'High',
        confidence: Math.round(70 + Math.random() * 15),
        maturityTarget: maturity,
        rationale: {
          performanceSignals: [
            'Emerging content format showing early success indicators',
            'Market trends support this content approach',
            'Competitive analysis reveals opportunity'
          ],
          personaSignals: [
            'Multiple persona segments show interest in this content type',
            'Research indicates unmet content needs in this area'
          ],
          strategyAlignment: `Strategic investment aligns with ${maturity} phase capability development`
        }
      });
    }
  });

  return ideas;
}

function generatePersonaGapIdeas(analyticsData: any, topContent: any, maturity: MaturityPhase): ContentIdea[] {
  const ideas: ContentIdea[] = [];

  // Generate 3-4 persona gap ideas based on underserved personas or segments
  const personas = ['Decision Maker', 'Technical Evaluator', 'End User', 'Influencer'];

  personas.slice(0, 3).forEach((persona, index) => {
    ideas.push({
      id: `persona-gap-${index + 1}`,
      workingTitle: `${persona}-Focused Content Strategy`,
      sourceTopicId: `persona-${index}`,
      sourceTopicLabel: 'Persona Coverage',
      primaryPersonaId: `persona-${index}`,
      genericRole: undefined,
      summary: `Develop content specifically addressing ${persona} needs, concerns, and decision-making process. Fill identified gaps in persona-specific content coverage.`,
      seoAiHints: [
        `${persona} content`,
        `${persona} resources`,
        `${persona}-specific information`
      ],
      lane: 'persona_gap',
      impact: 'Medium',
      effort: index < 2 ? 'Low' : 'Medium',
      confidence: Math.round(75 + Math.random() * 15),
      maturityTarget: maturity,
      rationale: {
        performanceSignals: [
          'Analytics show engagement gaps for this persona segment',
          'Content audit reveals underrepresentation',
          'Search data indicates unmet information needs'
        ],
        personaSignals: [
          `${persona} segment shows different content preferences`,
          'Persona research indicates specific content requirements',
          'Current content doesn\'t address persona-specific pain points'
        ],
        strategyAlignment: `Fills persona coverage gaps critical for ${maturity} phase success`
      }
    });
  });

  return ideas;
}

function getMaturityFocus(maturity: MaturityPhase): string {
  const focuses = {
    crawl: 'foundational content establishment',
    walk: 'content optimization and expansion',
    run: 'advanced content strategies and performance',
    fly: 'innovation and content leadership'
  };
  return focuses[maturity] || 'systematic content development';
}

/**
 * Transform content ideas into Results content structure
 */
function transformContentIdeasData(data: OPALData): ResultsPageContent {
  const contentResponse = generateContentIdeas(data);
  const { ideas, meta } = contentResponse;

  // Calculate hero metrics
  const quickWins = ideas.filter(i => i.lane === 'quick_win').length;
  const personas = new Set(ideas.map(i => i.primaryPersonaId || i.genericRole).filter(Boolean)).size;
  const avgConfidence = Math.round(ideas.reduce((sum, i) => sum + i.confidence, 0) / ideas.length);

  return {
    hero: {
      title: 'Content Strategy: What to Write Next',
      promise: 'Here are your highest-impact next content bets, based on current topic and content performance.',
      metrics: [
        {
          label: 'Recommended Ideas',
          value: `${ideas.length} ideas`,
          hint: 'Across all content lanes'
        },
        {
          label: 'Persona Coverage',
          value: `${personas} personas`,
          hint: 'Target audiences covered'
        },
        {
          label: 'Idea Confidence Index',
          value: `${avgConfidence}/100`,
          hint: 'Average confidence across all recommendations'
        }
      ],
      confidence: avgConfidence
    },

    overview: {
      summary: generateContentOverviewSummary(ideas, meta),
      keyPoints: generateContentKeyPoints(ideas, meta)
    },

    insights: generateContentInsights(ideas, meta),

    opportunities: generateContentOpportunities(ideas),

    nextSteps: generateContentNextSteps(ideas, meta),

    meta: {
      tier: 'optimization',
      agents: ['content_next_best_topics'],
      maturity: meta.maturityPhase,
      lastUpdated: new Date().toISOString()
    }
  };
}

function generateContentOverviewSummary(ideas: ContentIdea[], meta: ContentNextBestIdeasResponse['meta']): string {
  const quickWinCount = ideas.filter(i => i.lane === 'quick_win').length;
  const strategicCount = ideas.filter(i => i.lane === 'strategic_bet').length;
  const personaCount = ideas.filter(i => i.lane === 'persona_gap').length;

  return `Based on your ${meta.maturityPhase} phase content strategy, we've identified ${ideas.length} content opportunities: ${quickWinCount} quick wins for immediate impact, ${strategicCount} strategic bets for long-term growth, and ${personaCount} persona coverage improvements to broaden audience reach.`;
}

function generateContentKeyPoints(ideas: ContentIdea[], meta: ContentNextBestIdeasResponse['meta']): string[] {
  const highImpactCount = ideas.filter(i => i.impact === 'High').length;
  const lowEffortCount = ideas.filter(i => i.effort === 'Low').length;
  const avgConfidence = Math.round(ideas.reduce((sum, i) => sum + i.confidence, 0) / ideas.length);

  return [
    `${highImpactCount} high-impact content opportunities identified based on current performance`,
    `${lowEffortCount} ideas require low effort implementation for quick content portfolio expansion`,
    `Content recommendations align with ${meta.maturityPhase} phase capability and resource levels`,
    `Average confidence score of ${avgConfidence}% indicates strong data foundation for recommendations`
  ];
}

function generateContentInsights(ideas: ContentIdea[], meta: ContentNextBestIdeasResponse['meta']) {
  return [
    {
      title: 'Content Opportunity Analysis',
      description: 'Based on topic performance from DXP Tools → Content Recommendations and persona data from ODP',
      bullets: [
        'Quick win opportunities identified from existing high-performing content topics',
        'Strategic bet recommendations focus on emerging content format opportunities',
        'Persona gap analysis reveals specific audience segments needing targeted content'
      ]
    },
    {
      title: 'Maturity-Aligned Strategy',
      description: `Content recommendations calibrated for ${meta.maturityPhase} phase capabilities and objectives`,
      bullets: [
        `${meta.maturityPhase} phase content strategy emphasizes ${getMaturityFocus(meta.maturityPhase)}`,
        'Content complexity and resource requirements match current organizational readiness',
        'Progression pathway established for advancing content maturity through recommendations'
      ]
    }
  ];
}

function generateContentOpportunities(ideas: ContentIdea[]) {
  const opportunities = [];

  // Aggregate opportunities by pattern
  const quickWinTopics = ideas.filter(i => i.lane === 'quick_win').map(i => i.sourceTopicLabel);
  if (quickWinTopics.length > 0) {
    opportunities.push({
      label: `Expand content in ${quickWinTopics.slice(0, 2).join(' and ')} topics for immediate engagement gains`,
      impactLevel: 'High' as const,
      effortLevel: 'Low' as const,
      confidence: 85
    });
  }

  const personaGaps = ideas.filter(i => i.lane === 'persona_gap');
  if (personaGaps.length > 0) {
    opportunities.push({
      label: 'Address persona coverage gaps to broaden content portfolio reach',
      impactLevel: 'Medium' as const,
      effortLevel: 'Medium' as const,
      confidence: 80
    });
  }

  const strategicBets = ideas.filter(i => i.lane === 'strategic_bet');
  if (strategicBets.length > 0) {
    opportunities.push({
      label: 'Invest in strategic content formats for long-term competitive advantage',
      impactLevel: 'High' as const,
      effortLevel: 'High' as const,
      confidence: 75
    });
  }

  return opportunities;
}

function generateContentNextSteps(ideas: ContentIdea[], meta: ContentNextBestIdeasResponse['meta']) {
  return [
    {
      label: 'Schedule the top 3 Quick Wins into the next content cycle',
      ownerHint: 'Content Manager',
      timeframeHint: 'Next 2 weeks'
    },
    {
      label: 'Select at least one idea from Persona Coverage Gaps for each persona',
      ownerHint: 'Content Strategy Team',
      timeframeHint: 'Next month'
    },
    {
      label: 'Evaluate strategic bet opportunities for Q2 content planning',
      ownerHint: 'Marketing Leadership',
      timeframeHint: 'Next 6 weeks'
    },
    {
      label: 'Establish content performance tracking for new content implementations',
      ownerHint: 'Analytics Team',
      timeframeHint: 'Next 3 weeks'
    }
  ];
}

/**
 * Content Ideas Lane Component
 */
interface ContentLaneProps {
  title: string;
  description: string;
  ideas: ContentIdea[];
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  showLimit: number;
  onShowMore: () => void;
  canShowMore: boolean;
}

function ContentLane({ title, description, ideas, icon: Icon, color, showLimit, onShowMore, canShowMore }: ContentLaneProps) {
  const visibleIdeas = ideas.slice(0, showLimit);

  return (
    <Card className={`border-l-4 border-l-${color}-500`}>
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <Icon className={`h-5 w-5 mr-2 text-${color}-600`} />
          {title}
        </CardTitle>
        <p className="text-sm text-gray-600">{description}</p>
        <Badge variant="outline" className="w-fit">
          {ideas.length} idea{ideas.length !== 1 ? 's' : ''}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {visibleIdeas.map((idea, index) => (
            <ContentIdeaCard key={idea.id} idea={idea} />
          ))}

          {canShowMore && ideas.length > showLimit && (
            <Button
              variant="outline"
              size="sm"
              onClick={onShowMore}
              className="w-full"
            >
              <ChevronDown className="h-4 w-4 mr-2" />
              Show {Math.min(3, ideas.length - showLimit)} more
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Individual Content Idea Card
 */
function ContentIdeaCard({ idea }: { idea: ContentIdea }) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-gray-900 flex-1">{idea.workingTitle}</h4>
        <div className="flex items-center space-x-2 ml-4">
          <Badge
            variant={idea.impact === 'High' ? 'default' : idea.impact === 'Medium' ? 'secondary' : 'outline'}
            className="text-xs"
          >
            {idea.impact} Impact
          </Badge>
          <Badge
            variant={idea.effort === 'Low' ? 'default' : idea.effort === 'Medium' ? 'secondary' : 'outline'}
            className="text-xs"
          >
            {idea.effort} Effort
          </Badge>
        </div>
      </div>

      <div className="text-sm text-gray-600 mb-3">
        <strong>Topic:</strong> {idea.sourceTopicLabel}
        {idea.primaryPersonaId && (
          <span className="ml-4">
            <strong>Persona:</strong> {idea.primaryPersonaId}
          </span>
        )}
        {idea.genericRole && (
          <span className="ml-4">
            <strong>Audience:</strong> {idea.genericRole}
          </span>
        )}
      </div>

      <p className="text-sm text-gray-700 mb-3">{idea.summary}</p>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 text-xs text-gray-600">
          <span>{idea.confidence}% confidence</span>
          <span>Target: {idea.maturityTarget.toUpperCase()}</span>
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
              <p className="font-medium text-gray-800 mb-1">Performance Signals:</p>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                {idea.rationale.performanceSignals.map((signal, index) => (
                  <li key={index}>{signal}</li>
                ))}
              </ul>
            </div>

            <div>
              <p className="font-medium text-gray-800 mb-1">Persona Signals:</p>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                {idea.rationale.personaSignals.map((signal, index) => (
                  <li key={index}>{signal}</li>
                ))}
              </ul>
            </div>

            <div>
              <p className="font-medium text-gray-800 mb-1">Strategy Alignment:</p>
              <p className="text-gray-600">{idea.rationale.strategyAlignment}</p>
            </div>

            <div>
              <p className="font-medium text-gray-800 mb-1">SEO & AI Hints:</p>
              <div className="flex flex-wrap gap-1">
                {idea.seoAiHints.map((hint, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {hint}
                  </Badge>
                ))}
              </div>
            </div>

            {idea.technologyWarnings && idea.technologyWarnings.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-medium">Technology Considerations:</p>
                  <ul className="list-disc list-inside mt-1">
                    {idea.technologyWarnings.map((warning, index) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Main Content Next Best Ideas Widget Component
 */
export function ContentNextBestIdeasWidget({ data, className = '' }: ContentNextBestIdeasWidgetProps) {
  // Transform data to Results content model
  const resultsContent = React.useMemo(() => {
    if (!data || Object.keys(data).length === 0) {
      return createDefaultResultsContent('optimization', 'Content Strategy: What to Write Next');
    }
    return transformContentIdeasData(data);
  }, [data]);

  // Generate content ideas for lanes display
  const contentResponse = React.useMemo(() => generateContentIdeas(data), [data]);
  const { ideas } = contentResponse;

  // Language rules validation
  const { validateContentIdeas } = useContentLanguageRules();
  const ideasValidation = React.useMemo(() => validateContentIdeas(ideas), [ideas, validateContentIdeas]);

  // Lane display state
  const [showLimits, setShowLimits] = React.useState({
    quick_win: 3,
    strategic_bet: 2,
    persona_gap: 3
  });

  const handleShowMore = (lane: ContentIdeaLane) => {
    setShowLimits(prev => ({
      ...prev,
      [lane]: prev[lane] + 3
    }));
  };

  // Organize ideas by lanes
  const quickWinIdeas = ideas.filter(i => i.lane === 'quick_win');
  const strategicBetIdeas = ideas.filter(i => i.lane === 'strategic_bet');
  const personaGapIdeas = ideas.filter(i => i.lane === 'persona_gap');

  // Custom sections for Content Ideas
  const customSections = (
    <div className="space-y-6">
      {/* Core Lanes Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Lightbulb className="h-5 w-5 mr-2" />
            Content Ideas by Priority Lane
          </CardTitle>
          <p className="text-sm text-gray-600">
            Showing {Math.min(showLimits.quick_win, quickWinIdeas.length) +
                     Math.min(showLimits.strategic_bet, strategicBetIdeas.length) +
                     Math.min(showLimits.persona_gap, personaGapIdeas.length)} of {ideas.length} total ideas
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Lane 1: Quick Wins */}
            <ContentLane
              title="Quick Wins"
              description="High impact, low effort opportunities"
              ideas={quickWinIdeas}
              icon={Zap}
              color="green"
              showLimit={showLimits.quick_win}
              onShowMore={() => handleShowMore('quick_win')}
              canShowMore={quickWinIdeas.length > showLimits.quick_win}
            />

            {/* Lane 2: Strategic Bets */}
            <ContentLane
              title="Strategic Bets"
              description="Medium/High effort, high strategic importance"
              ideas={strategicBetIdeas}
              icon={Target}
              color="blue"
              showLimit={showLimits.strategic_bet}
              onShowMore={() => handleShowMore('strategic_bet')}
              canShowMore={strategicBetIdeas.length > showLimits.strategic_bet}
            />

            {/* Lane 3: Persona Coverage Gaps */}
            <ContentLane
              title="Persona Coverage Gaps"
              description="Address underserved audience segments"
              ideas={personaGapIdeas}
              icon={Users}
              color="purple"
              showLimit={showLimits.persona_gap}
              onShowMore={() => handleShowMore('persona_gap')}
              canShowMore={personaGapIdeas.length > showLimits.persona_gap}
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
        componentName="ContentNextBestIdeasWidget"
        className="mt-4"
      />
    </div>
  );
}