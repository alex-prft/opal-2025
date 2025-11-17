/**
 * OPAL Client for Results Content Optimizer
 *
 * Provides read-only access to OPAL instructions, agent outputs, and DXP tool data
 * for the results-content-optimizer agent.
 */

import {
  OpalInstructions,
  OpalAgentOutput,
  DXPToolData,
  ContentRecsData,
  ContentGenerationContext
} from '../../results/schemas/ResultPage';

// =============================================================================
// OPAL Client Configuration
// =============================================================================

interface OpalClientConfig {
  baseUrl: string;
  apiKey: string;
  timeout: number;
  retryAttempts: number;
}

const DEFAULT_CONFIG: OpalClientConfig = {
  baseUrl: process.env.OPAL_API_BASE_URL || 'http://localhost:3000/api/opal',
  apiKey: process.env.OPAL_API_KEY || '',
  timeout: 30000,
  retryAttempts: 3
};

// =============================================================================
// OPAL Agent Definitions
// =============================================================================

export const OPAL_AGENTS = {
  // Strategy & Planning Agents
  STRATEGY_WORKFLOW: 'strategy_workflow',
  ROADMAP_GENERATOR: 'roadmap_generator',
  MATURITY_ASSESSMENT: 'maturity_assessment',
  QUICK_WINS_ANALYZER: 'quick_wins_analyzer',

  // Content & Analysis Agents
  CONTENT_REVIEW: 'content_review',
  CONTENT_NEXT_BEST_TOPICS: 'content_next_best_topics',
  CONTENT_RECS_TOPIC_PERFORMANCE: 'content_recs_topic_performance',

  // Audience & Personalization Agents
  AUDIENCE_SUGGESTER: 'audience_suggester',
  PERSONALIZATION_IDEA_GENERATOR: 'personalization_idea_generator',
  CUSTOMER_JOURNEY: 'customer_journey',

  // Experimentation & Optimization Agents
  EXPERIMENT_BLUEPRINTER: 'experiment_blueprinter',
  GEO_AUDIT: 'geo_audit',

  // Integration & Technical Agents
  INTEGRATION_HEALTH: 'integration_health',
  CMP_ORGANIZER: 'cmp_organizer'
} as const;

export type OpalAgentId = typeof OPAL_AGENTS[keyof typeof OPAL_AGENTS];

// =============================================================================
// DXP Tools Configuration
// =============================================================================

export const DXP_TOOLS = {
  CONTENT_RECS: 'content_recs',
  CMS: 'cms',
  ODP: 'odp',
  WEBX: 'webx',
  CMP: 'cmp'
} as const;

export type DXPToolId = typeof DXP_TOOLS[keyof typeof DXP_TOOLS];

// =============================================================================
// Main OPAL Client Class
// =============================================================================

export class OpalClient {
  private config: OpalClientConfig;
  private cache: Map<string, { data: any; timestamp: number; ttl: number }>;

  constructor(config?: Partial<OpalClientConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.cache = new Map();
  }

  // ===========================================================================
  // OPAL Instructions Methods
  // ===========================================================================

  /**
   * Fetch OPAL instructions for the current tenant
   * Includes personas, tone guidelines, KPIs, and maturity rubric
   */
  async getOpalInstructions(): Promise<OpalInstructions> {
    const cacheKey = 'opal-instructions';
    const cached = this.getCachedData(cacheKey, 300000); // 5 minute cache

    if (cached) {
      return cached;
    }

    try {
      const response = await this.makeRequest('/instructions');
      const instructions: OpalInstructions = {
        personas: response.personas || [],
        tone: response.tone || {
          preferredTerms: {},
          avoidedTerms: [],
          forbiddenMetrics: ['revenue', 'roi', 'profit', '$', '€', '£'],
          voiceDescription: 'Professional, data-driven, actionable'
        },
        kpis: response.kpis || [],
        maturityRubric: response.maturityRubric || this.getDefaultMaturityRubric(),
        version: response.version || '1.0.0',
        lastUpdated: response.lastUpdated || new Date().toISOString()
      };

      this.setCachedData(cacheKey, instructions, 300000);
      return instructions;
    } catch (error) {
      console.warn('[OpalClient] Failed to fetch OPAL instructions:', error);
      return this.getDefaultOpalInstructions();
    }
  }

  // ===========================================================================
  // Agent Output Methods
  // ===========================================================================

  /**
   * Fetch output from a specific OPAL agent
   */
  async getAgentOutput(agentId: OpalAgentId, context?: any): Promise<OpalAgentOutput | null> {
    const cacheKey = `agent-output-${agentId}`;
    const cached = this.getCachedData(cacheKey, 600000); // 10 minute cache

    if (cached) {
      return cached;
    }

    try {
      const response = await this.makeRequest(`/agents/${agentId}/output`, {
        method: 'POST',
        body: JSON.stringify({ context: context || {} })
      });

      const agentOutput: OpalAgentOutput = {
        agentId,
        output: response.output || {},
        confidence: response.confidence || 0,
        timestamp: response.timestamp || new Date().toISOString(),
        version: response.version
      };

      this.setCachedData(cacheKey, agentOutput, 600000);
      return agentOutput;
    } catch (error) {
      console.warn(`[OpalClient] Failed to fetch agent output for ${agentId}:`, error);
      return null;
    }
  }

  /**
   * Fetch outputs from multiple agents in parallel
   */
  async getMultipleAgentOutputs(agentIds: OpalAgentId[], context?: any): Promise<OpalAgentOutput[]> {
    const promises = agentIds.map(agentId => this.getAgentOutput(agentId, context));
    const results = await Promise.allSettled(promises);

    return results
      .filter((result): result is PromiseFulfilledResult<OpalAgentOutput | null> =>
        result.status === 'fulfilled' && result.value !== null
      )
      .map(result => result.value as OpalAgentOutput);
  }

  // ===========================================================================
  // DXP Tool Data Methods
  // ===========================================================================

  /**
   * Fetch data from a specific DXP tool via OPAL
   */
  async getDXPToolData(toolId: DXPToolId, context?: any): Promise<DXPToolData | null> {
    const cacheKey = `dxp-tool-${toolId}`;
    const cached = this.getCachedData(cacheKey, 900000); // 15 minute cache

    if (cached) {
      return cached;
    }

    try {
      const response = await this.makeRequest(`/dxp-tools/${toolId}/data`, {
        method: 'POST',
        body: JSON.stringify({ context: context || {} })
      });

      const toolData: DXPToolData = {
        toolName: toolId as any,
        data: response.data || {},
        lastUpdated: response.lastUpdated || new Date().toISOString(),
        confidence: response.confidence || 0
      };

      this.setCachedData(cacheKey, toolData, 900000);
      return toolData;
    } catch (error) {
      console.warn(`[OpalClient] Failed to fetch DXP tool data for ${toolId}:`, error);
      return null;
    }
  }

  /**
   * Specialized method for Content Recommendations data
   */
  async getContentRecsData(context?: any): Promise<ContentRecsData | null> {
    const toolData = await this.getDXPToolData(DXP_TOOLS.CONTENT_RECS, context);

    if (!toolData || toolData.toolName !== 'content_recs') {
      return null;
    }

    return toolData as ContentRecsData;
  }

  // ===========================================================================
  // Page-Specific Data Methods
  // ===========================================================================

  /**
   * Get all relevant data for a specific Results page
   */
  async getPageGenerationContext(
    pageId: string,
    tier: 1 | 2 | 3,
    mode: 'preview' | 'apply' = 'preview'
  ): Promise<ContentGenerationContext> {
    const section = this.extractSectionFromPageId(pageId);
    const relevantAgents = this.getRelevantAgentsForPage(pageId);
    const relevantTools = this.getRelevantToolsForPage(pageId);

    // Fetch all data in parallel
    const [opalInstructions, agentOutputs, dxpDataResults] = await Promise.all([
      this.getOpalInstructions(),
      this.getMultipleAgentOutputs(relevantAgents, { pageId, tier }),
      Promise.allSettled(
        relevantTools.map(toolId => this.getDXPToolData(toolId, { pageId, tier }))
      )
    ]);

    // Filter successful DXP data results
    const dxpData = dxpDataResults
      .filter((result): result is PromiseFulfilledResult<DXPToolData | null> =>
        result.status === 'fulfilled' && result.value !== null
      )
      .map(result => result.value as DXPToolData);

    return {
      pageId,
      tier,
      section,
      opalInstructions,
      agentOutputs,
      dxpData,
      generationMode: mode,
      confidenceThreshold: 0.7 // Default threshold
    };
  }

  // ===========================================================================
  // Helper Methods
  // ===========================================================================

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.config.baseUrl}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
          'X-Client': 'results-content-optimizer',
          ...options.headers
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  private getCachedData(key: string, maxAge: number): any | null {
    const cached = this.cache.get(key);
    if (cached && (Date.now() - cached.timestamp) < maxAge) {
      return cached.data;
    }
    return null;
  }

  private setCachedData(key: string, data: any, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  private extractSectionFromPageId(pageId: string): any {
    if (pageId.includes('strategy-plans')) return 'strategy-plans';
    if (pageId.includes('optimizely-dxp-tools')) return 'optimizely-dxp-tools';
    if (pageId.includes('analytics-insights')) return 'analytics-insights';
    if (pageId.includes('experience-optimization')) return 'experience-optimization';
    return 'strategy-plans'; // Default fallback
  }

  private getRelevantAgentsForPage(pageId: string): OpalAgentId[] {
    // Strategy Plans pages
    if (pageId.includes('strategy-plans')) {
      if (pageId.includes('osa')) return [OPAL_AGENTS.STRATEGY_WORKFLOW];
      if (pageId.includes('roadmap')) return [OPAL_AGENTS.ROADMAP_GENERATOR];
      if (pageId.includes('maturity')) return [OPAL_AGENTS.MATURITY_ASSESSMENT];
      if (pageId.includes('quick-wins')) return [OPAL_AGENTS.QUICK_WINS_ANALYZER];
      if (pageId.includes('phases')) return [OPAL_AGENTS.STRATEGY_WORKFLOW];
      return [OPAL_AGENTS.STRATEGY_WORKFLOW];
    }

    // DXP Tools pages
    if (pageId.includes('optimizely-dxp-tools')) {
      if (pageId.includes('content-recs')) {
        return [OPAL_AGENTS.CONTENT_RECS_TOPIC_PERFORMANCE, OPAL_AGENTS.CONTENT_REVIEW];
      }
      return [OPAL_AGENTS.INTEGRATION_HEALTH];
    }

    // Analytics Insights pages
    if (pageId.includes('analytics-insights')) {
      return [OPAL_AGENTS.CONTENT_REVIEW, OPAL_AGENTS.AUDIENCE_SUGGESTER];
    }

    // Experience Optimization pages
    if (pageId.includes('experience-optimization')) {
      if (pageId.includes('content')) return [OPAL_AGENTS.CONTENT_NEXT_BEST_TOPICS];
      if (pageId.includes('experimentation')) return [OPAL_AGENTS.EXPERIMENT_BLUEPRINTER];
      if (pageId.includes('personalization')) return [OPAL_AGENTS.PERSONALIZATION_IDEA_GENERATOR];
      return [OPAL_AGENTS.CONTENT_REVIEW];
    }

    return [OPAL_AGENTS.STRATEGY_WORKFLOW]; // Default
  }

  private getRelevantToolsForPage(pageId: string): DXPToolId[] {
    const tools: DXPToolId[] = [];

    // Always include integration health for monitoring
    tools.push(DXP_TOOLS.CMP);

    // Add specific tools based on page context
    if (pageId.includes('content')) {
      tools.push(DXP_TOOLS.CONTENT_RECS, DXP_TOOLS.CMS);
    }

    if (pageId.includes('audience') || pageId.includes('personalization')) {
      tools.push(DXP_TOOLS.ODP);
    }

    if (pageId.includes('experimentation')) {
      tools.push(DXP_TOOLS.WEBX);
    }

    return tools;
  }

  private getDefaultOpalInstructions(): OpalInstructions {
    return {
      personas: [
        {
          id: 'marketing-manager',
          name: 'Marketing Manager',
          description: 'Strategic marketing professional focused on campaign performance and audience engagement',
          isPrimary: true,
          characteristics: ['Data-driven', 'Strategic', 'ROI-focused']
        }
      ],
      tone: {
        preferredTerms: { 'effect': 'impact', 'improvement': 'optimization' },
        avoidedTerms: ['synergy', 'leverage', 'somewhat'],
        forbiddenMetrics: ['revenue', 'roi', 'profit', '$', '€', '£'],
        voiceDescription: 'Professional, data-driven, actionable'
      },
      kpis: [],
      maturityRubric: this.getDefaultMaturityRubric(),
      version: '1.0.0',
      lastUpdated: new Date().toISOString()
    };
  }

  private getDefaultMaturityRubric(): any {
    return {
      crawl: {
        name: 'Crawl Phase',
        description: 'Foundation building and basic implementation',
        capabilities: ['Basic tracking', 'Simple content', 'Manual processes'],
        timeframe: '0-3 months',
        kpiFocus: ['Setup completion', 'Data collection']
      },
      walk: {
        name: 'Walk Phase',
        description: 'Systematic optimization and process improvement',
        capabilities: ['Automated workflows', 'A/B testing', 'Segmentation'],
        timeframe: '3-6 months',
        kpiFocus: ['Engagement rates', 'Conversion improvement']
      },
      run: {
        name: 'Run Phase',
        description: 'Advanced optimization and scaling',
        capabilities: ['Personalization', 'Multi-variate testing', 'Advanced analytics'],
        timeframe: '6-12 months',
        kpiFocus: ['Performance optimization', 'Scale efficiency']
      },
      fly: {
        name: 'Fly Phase',
        description: 'Innovation and competitive advantage',
        capabilities: ['AI-driven optimization', 'Predictive analytics', 'Automated decisioning'],
        timeframe: '12+ months',
        kpiFocus: ['Innovation metrics', 'Competitive advantage']
      }
    };
  }
}

// =============================================================================
// Singleton Instance Export
// =============================================================================

export const opalClient = new OpalClient();

// =============================================================================
// Convenience Functions
// =============================================================================

export async function getPageContext(
  pageId: string,
  tier: 1 | 2 | 3,
  mode: 'preview' | 'apply' = 'preview'
): Promise<ContentGenerationContext> {
  return opalClient.getPageGenerationContext(pageId, tier, mode);
}

export async function getOpalInstructions(): Promise<OpalInstructions> {
  return opalClient.getOpalInstructions();
}

export async function getAgentOutputs(agentIds: OpalAgentId[]): Promise<OpalAgentOutput[]> {
  return opalClient.getMultipleAgentOutputs(agentIds);
}

export { OPAL_AGENTS, DXP_TOOLS };
export type { OpalAgentId, DXPToolId };