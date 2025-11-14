/**
 * SOP-Compliant OPAL Data Integration Service
 *
 * Integrates SOP validation middleware to ensure zero mock data in production
 * and proper agent source attribution for all content
 */

import { sopValidation, SOPValidationMiddleware, SOPViolationError, AgentOutput } from './sop-validation-middleware';

export interface SOPCompliantTierDataResponse<T = any> {
  data: T;
  metadata: {
    tier: 'tier1' | 'tier2' | 'tier3';
    source: 'opal_agent' | 'cache' | 'development_fallback';
    timestamp: string;
    freshness: 'fresh' | 'stale' | 'expired';
    agent_source: string;
    confidence_score: number;
    sop_compliance: {
      compliant: boolean;
      score: number;
      violations: string[];
    };
    nextRefresh?: string;
  };
  error?: string;
}

export interface CachedAgentOutput {
  data: any;
  agent_source: string;
  confidence_score: number;
  timestamp: number;
  ttl: number;
  sop_validated: boolean;
}

/**
 * SOP-Compliant OPAL Data Service
 * Replaces mock data patterns with SOP validation and real agent outputs
 */
export class SOPCompliantOpalDataService {
  private cache = new Map<string, CachedAgentOutput>();
  private sopValidator: SOPValidationMiddleware;

  // SOP-compliant cache TTL (per SOP requirements)
  private readonly CACHE_TTL = {
    tier1: 300000,  // 5 minutes (executive summaries)
    tier2: 600000,  // 10 minutes (section KPIs)
    tier3: 900000   // 15 minutes (detailed content)
  };

  // Valid agent mappings per SOP
  private readonly AGENT_MAPPINGS = {
    // Strategy pages
    'strategy-plans': ['strategy_workflow', 'roadmap_generator'],
    'strategy-osa': ['strategy_workflow'],
    'strategy-quick-wins': ['strategy_workflow', 'roadmap_generator'],
    'strategy-maturity': ['personalization_idea_generator'],
    'strategy-roadmap': ['roadmap_generator'],

    // Analytics pages
    'insights-content': ['content_review'],
    'insights-audiences': ['audience_suggester'],
    'insights-cx': ['customer_journey'],

    // Optimization pages
    'optimization-experimentation': ['experiment_blueprinter'],
    'optimization-personalization': ['personalization_idea_generator'],
    'optimization-ux': ['customer_journey'],

    // DXP Tools pages
    'dxptools-webx': ['integration_health'],
    'dxptools-content-recs': ['content_review', 'integration_health'],
    'dxptools-cms': ['integration_health'],
    'dxptools-odp': ['integration_health'],
    'dxptools-cmp': ['cmp_organizer']
  };

  constructor() {
    this.sopValidator = SOPValidationMiddleware.getInstance();
  }

  /**
   * Check if SOP is currently enabled via the admin toggle
   */
  private isSOPEnabled(): boolean {
    if (typeof window !== 'undefined') {
      return (window as any).__OPAL_SOP_ENABLED ?? true;
    }
    return true; // Default to enabled on server-side
  }

  /**
   * Primary data fetch method with SOP validation
   */
  async fetchTierData<T>(
    tier1: string,
    tier2?: string,
    tier3?: string
  ): Promise<SOPCompliantTierDataResponse<T>> {
    const pageId = this.constructPageId(tier1, tier2, tier3);
    const tierLevel = tier3 ? 'tier3' : tier2 ? 'tier2' : 'tier1';
    const cacheKey = `${tierLevel}:${pageId}`;

    try {
      // Step 1: Check for valid cached agent output
      const cachedOutput = this.getCachedAgentOutput(cacheKey);
      if (cachedOutput && this.isCacheFresh(cachedOutput, tierLevel)) {
        return this.createSOPCompliantResponse(cachedOutput, 'cache', tierLevel, pageId);
      }

      // Step 2: Fetch from OPAL agent workflow
      const agentOutput = await this.fetchFromOPALAgent(pageId, tierLevel);

      // Step 3: SOP validation (critical step)
      const validationResult = this.sopValidator.validateDataSource(
        agentOutput,
        pageId,
        `OPALDataService.fetchTierData.${tierLevel}`
      );

      if (!validationResult.compliant) {
        console.error('[SOP Violation]', validationResult.violations);

        // In production, critical violations block execution (only if SOP is enabled)
        if (process.env.NODE_ENV === 'production' && this.isSOPEnabled()) {
          const criticalViolations = validationResult.violations.filter(v => v.severity === 'CRITICAL');
          if (criticalViolations.length > 0) {
            throw new SOPViolationError(
              `Critical SOP violations prevent data loading: ${criticalViolations.map(v => v.message).join(', ')}`,
              criticalViolations[0],
              `fetchTierData.${tierLevel}`
            );
          }
        }
      }

      // Step 4: Cache validated agent output
      this.setCachedAgentOutput(cacheKey, agentOutput, tierLevel);

      // Step 5: Return SOP-compliant response
      return this.createSOPCompliantResponse(agentOutput, 'opal_agent', tierLevel, pageId, validationResult);

    } catch (error) {
      console.error(`[SOP Data Service] Error fetching ${tierLevel} data for ${pageId}:`, error);

      // SOP-compliant fallback strategy
      if (process.env.NODE_ENV === 'production') {
        // Production: Try cached data first, then fail
        const staleCache = this.getCachedAgentOutput(cacheKey);
        if (staleCache) {
          console.warn('[SOP Fallback] Using stale cached data in production');
          return this.createSOPCompliantResponse(staleCache, 'cache', tierLevel, pageId);
        }

        // No fallback to mock data in production per SOP (only if SOP is enabled)
        if (this.isSOPEnabled()) {
          throw new SOPViolationError(
            'No real agent data available and mock data not permitted in production',
            {
              type: 'MOCK_DATA_DETECTED',
              severity: 'CRITICAL',
              message: 'Production deployment blocked: No real OPAL agent data available',
              action: 'BLOCK_DEPLOYMENT'
            }
          );
        } else {
          // SOP is disabled, allow fallback with warning
          console.warn('[SOP Disabled] Using development fallback data in production - SOP toggle is OFF');
          const developmentData = await this.createDevelopmentFallback(pageId, tierLevel);
          return this.createSOPCompliantResponse(developmentData, 'development_fallback', tierLevel, pageId);
        }
      } else {
        // Development: Allow fallback with clear marking
        console.warn('[SOP Development] Using development fallback data - NOT for production');
        const developmentData = await this.createDevelopmentFallback(pageId, tierLevel);
        return this.createSOPCompliantResponse(developmentData, 'development_fallback', tierLevel, pageId);
      }
    }
  }

  /**
   * Fetch data from actual OPAL agent workflow
   */
  private async fetchFromOPALAgent(pageId: string, tierLevel: string): Promise<AgentOutput> {
    const primaryAgent = this.getPrimaryAgentForPage(pageId);

    try {
      // Attempt to fetch from OPAL workflow API
      const response = await fetch(`/api/opal/workflows/${primaryAgent}/output`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-SOP-Validation': 'required',
          'X-Page-ID': pageId
        },
        body: JSON.stringify({
          page_id: pageId,
          tier_level: tierLevel,
          agent_source: primaryAgent
        })
      });

      if (response.ok) {
        const workflowOutput = await response.json();

        // Transform to SOP-compliant agent output
        return SOPValidationMiddleware.createSOPCompliantOutput(
          primaryAgent as any,
          workflowOutput,
          workflowOutput.confidence_score || 85
        );
      }

      throw new Error(`OPAL API returned ${response.status}: ${response.statusText}`);
    } catch (error) {
      console.error(`[OPAL Agent Fetch] Failed to fetch from ${primaryAgent}:`, error);

      // Try alternative agents for this page
      const alternativeAgents = this.getAlternativeAgentsForPage(pageId);
      for (const agent of alternativeAgents) {
        try {
          const altResponse = await this.fetchAlternativeAgent(agent, pageId, tierLevel);
          if (altResponse) return altResponse;
        } catch (altError) {
          console.warn(`[OPAL Alternative] ${agent} also failed:`, altError);
        }
      }

      throw error;
    }
  }

  /**
   * Construct unique pageId per SOP format: ${tier1}-${tier2}-${tier3}
   */
  private constructPageId(tier1: string, tier2?: string, tier3?: string): string {
    if (tier3) {
      return `${tier1}-${tier2}-${tier3}`;
    } else if (tier2) {
      return `${tier1}-${tier2}-overview`;
    } else {
      return `${tier1}-summary-main`;
    }
  }

  /**
   * Get primary OPAL agent for a page based on SOP mappings
   */
  private getPrimaryAgentForPage(pageId: string): string {
    // Extract base page identifier
    const basePageId = pageId.split('-').slice(0, 2).join('-');
    const agents = this.AGENT_MAPPINGS[basePageId as keyof typeof this.AGENT_MAPPINGS];

    if (!agents || agents.length === 0) {
      // Default fallback agents per SOP
      if (pageId.includes('strategy')) return 'strategy_workflow';
      if (pageId.includes('insights')) return 'content_review';
      if (pageId.includes('optimization')) return 'experiment_blueprinter';
      if (pageId.includes('dxptools')) return 'integration_health';

      throw new Error(`No OPAL agent mapping found for page: ${pageId}`);
    }

    return agents[0]; // Primary agent
  }

  /**
   * Get alternative agents for fallback
   */
  private getAlternativeAgentsForPage(pageId: string): string[] {
    const basePageId = pageId.split('-').slice(0, 2).join('-');
    const agents = this.AGENT_MAPPINGS[basePageId as keyof typeof this.AGENT_MAPPINGS];
    return agents ? agents.slice(1) : []; // Alternative agents
  }

  /**
   * Fetch from alternative OPAL agent
   */
  private async fetchAlternativeAgent(agent: string, pageId: string, tierLevel: string): Promise<AgentOutput | null> {
    try {
      const response = await fetch(`/api/opal/workflows/${agent}/output`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-SOP-Validation': 'required',
          'X-Page-ID': pageId,
          'X-Alternative-Agent': 'true'
        },
        body: JSON.stringify({
          page_id: pageId,
          tier_level: tierLevel,
          agent_source: agent
        })
      });

      if (response.ok) {
        const workflowOutput = await response.json();
        return SOPValidationMiddleware.createSOPCompliantOutput(
          agent as any,
          workflowOutput,
          (workflowOutput.confidence_score || 75) - 10 // Slightly lower confidence for alternative
        );
      }
    } catch (error) {
      console.warn(`[Alternative Agent] ${agent} fetch failed:`, error);
    }

    return null;
  }

  /**
   * Create development fallback data (only for non-production)
   */
  private async createDevelopmentFallback(pageId: string, tierLevel: string): Promise<AgentOutput> {
    if (process.env.NODE_ENV === 'production' && this.isSOPEnabled()) {
      throw new SOPViolationError(
        'Development fallback not allowed in production',
        {
          type: 'MOCK_DATA_DETECTED',
          severity: 'CRITICAL',
          message: 'Attempted to use development fallback in production environment',
          action: 'BLOCK_DEPLOYMENT'
        }
      );
    }

    const agent = this.getPrimaryAgentForPage(pageId);

    // Create clearly marked development data
    const developmentData = {
      _development_notice: 'This is development fallback data - NOT for production use',
      _page_id: pageId,
      _tier_level: tierLevel,
      _timestamp: new Date().toISOString(),

      // Minimal data structure for development
      summary: `Development data for ${pageId}`,
      metrics: {
        placeholder_metric_1: 0,
        placeholder_metric_2: 0,
        development_mode: true
      },
      recommendations: [
        {
          title: 'Connect Real OPAL Agent',
          description: `Configure ${agent} agent to provide real data for ${pageId}`,
          priority: 'critical',
          type: 'development_setup'
        }
      ]
    };

    return SOPValidationMiddleware.createSOPCompliantOutput(
      agent as any,
      developmentData,
      25 // Very low confidence for development data
    );
  }

  /**
   * Cache management with SOP validation
   */
  private getCachedAgentOutput(cacheKey: string): CachedAgentOutput | null {
    const cached = this.cache.get(cacheKey);
    if (!cached) return null;

    // Validate cached data still meets SOP requirements
    if (cached.sop_validated) {
      return cached;
    }

    // Re-validate if not previously validated
    try {
      const validation = this.sopValidator.validateDataSource(cached.data, cacheKey);
      if (validation.compliant) {
        cached.sop_validated = true;
        this.cache.set(cacheKey, cached);
        return cached;
      }
    } catch (error) {
      console.warn('[SOP Cache Validation] Cached data failed SOP validation, removing:', error);
      this.cache.delete(cacheKey);
    }

    return null;
  }

  /**
   * Set cached agent output with SOP validation
   */
  private setCachedAgentOutput(cacheKey: string, agentOutput: AgentOutput, tierLevel: string): void {
    const ttl = this.CACHE_TTL[tierLevel as keyof typeof this.CACHE_TTL];

    const cachedOutput: CachedAgentOutput = {
      data: agentOutput.data,
      agent_source: agentOutput.agent_source,
      confidence_score: agentOutput.confidence_score,
      timestamp: Date.now(),
      ttl,
      sop_validated: true // Already validated before caching
    };

    this.cache.set(cacheKey, cachedOutput);

    // Clean up expired cache entries
    this.cleanExpiredCache();
  }

  /**
   * Check if cached data is fresh per SOP requirements
   */
  private isCacheFresh(cached: CachedAgentOutput, tierLevel: string): boolean {
    const maxAge = this.CACHE_TTL[tierLevel as keyof typeof this.CACHE_TTL];
    const age = Date.now() - cached.timestamp;
    return age < maxAge;
  }

  /**
   * Create SOP-compliant response structure
   */
  private createSOPCompliantResponse<T>(
    agentOutput: CachedAgentOutput | AgentOutput,
    source: 'opal_agent' | 'cache' | 'development_fallback',
    tierLevel: string,
    pageId: string,
    validationResult?: any
  ): SOPCompliantTierDataResponse<T> {
    const isAgentOutput = 'agent_source' in agentOutput;

    return {
      data: agentOutput.data,
      metadata: {
        tier: tierLevel as 'tier1' | 'tier2' | 'tier3',
        source,
        timestamp: isAgentOutput ? agentOutput.timestamp : new Date(agentOutput.timestamp).toISOString(),
        freshness: source === 'cache' ? 'stale' : 'fresh',
        agent_source: agentOutput.agent_source,
        confidence_score: agentOutput.confidence_score,
        sop_compliance: {
          compliant: validationResult ? validationResult.compliant : true,
          score: validationResult ? validationResult.complianceScore : 100,
          violations: validationResult ? validationResult.violations.map((v: any) => v.message) : []
        },
        nextRefresh: source === 'opal_agent' ?
          new Date(Date.now() + this.CACHE_TTL[tierLevel as keyof typeof this.CACHE_TTL]).toISOString() :
          undefined
      }
    };
  }

  /**
   * Clean expired cache entries
   */
  private cleanExpiredCache(): void {
    const now = Date.now();

    for (const [key, cached] of this.cache.entries()) {
      if (now - cached.timestamp > cached.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get SOP compliance metrics
   */
  getSOPComplianceMetrics() {
    return {
      cacheSize: this.cache.size,
      validationMetrics: this.sopValidator.getComplianceMetrics(),
      agentMappings: Object.keys(this.AGENT_MAPPINGS).length,
      lastUpdate: new Date().toISOString()
    };
  }

  /**
   * Force refresh cache (admin override)
   */
  async forceRefresh(pageId?: string): Promise<void> {
    if (pageId) {
      // Clear specific page cache
      for (const key of this.cache.keys()) {
        if (key.includes(pageId)) {
          this.cache.delete(key);
        }
      }
    } else {
      // Clear all cache
      this.cache.clear();
    }

    console.info('[SOP Data Service] Cache cleared for', pageId || 'all pages');
  }

  /**
   * Validate page configuration
   */
  validatePageConfiguration(pageId: string): { valid: boolean; issues: string[] } {
    const issues: string[] = [];

    // Check if page has agent mapping
    const basePageId = pageId.split('-').slice(0, 2).join('-');
    if (!this.AGENT_MAPPINGS[basePageId as keyof typeof this.AGENT_MAPPINGS]) {
      issues.push(`No OPAL agent mapping configured for ${basePageId}`);
    }

    // Check pageId format
    if (!/^[a-z]+(-[a-z]+){2}$/.test(pageId)) {
      issues.push(`PageId format invalid: ${pageId} (expected: tier1-tier2-tier3)`);
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }
}

// Export singleton instance
export const sopCompliantOpalService = new SOPCompliantOpalDataService();

// Convenience functions
export async function fetchSOPCompliantTierData<T>(
  tier1: string,
  tier2?: string,
  tier3?: string
): Promise<SOPCompliantTierDataResponse<T>> {
  return sopCompliantOpalService.fetchTierData<T>(tier1, tier2, tier3);
}

export function getSOPComplianceStatus() {
  return sopCompliantOpalService.getSOPComplianceMetrics();
}