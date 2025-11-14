/**
 * Simple OPAL Data Integration Service (SOP-Free)
 *
 * Provides data fetching functionality without any SOP validation or restrictions.
 * Allows mock data in all environments and focuses on functionality over compliance.
 */

export interface TierDataResponse<T = any> {
  data: T;
  metadata: {
    tier: 'tier1' | 'tier2' | 'tier3';
    source: 'opal_agent' | 'cache' | 'fallback';
    timestamp: string;
    freshness: 'fresh' | 'stale' | 'expired';
    agent_source: string;
    confidence_score: number;
    nextRefresh?: string;
  };
  error?: string;
}

export interface CachedOutput {
  data: any;
  agent_source: string;
  confidence_score: number;
  timestamp: number;
  ttl: number;
}

/**
 * Simple OPAL Data Service - No validation, just functionality
 */
export class SimpleOpalDataService {
  private cache = new Map<string, CachedOutput>();

  // Standard cache TTL (no restrictions)
  private readonly CACHE_TTL = {
    tier1: 300000,  // 5 minutes
    tier2: 600000,  // 10 minutes
    tier3: 900000   // 15 minutes
  };

  /**
   * Primary data fetch method - simple and unrestricted
   */
  async fetchTierData<T>(
    tier1: string,
    tier2?: string,
    tier3?: string
  ): Promise<TierDataResponse<T>> {
    const pageId = this.constructPageId(tier1, tier2, tier3);
    const tierLevel = tier3 ? 'tier3' : tier2 ? 'tier2' : 'tier1';
    const cacheKey = `${tierLevel}:${pageId}`;

    try {
      // Step 1: Check for cached data
      const cachedOutput = this.getCachedOutput(cacheKey);
      if (cachedOutput && this.isCacheFresh(cachedOutput, tierLevel)) {
        return this.createResponse(cachedOutput, 'cache', tierLevel, pageId);
      }

      // Step 2: Try to fetch from OPAL agent
      const agentOutput = await this.fetchFromOPALAgent(pageId, tierLevel);

      // Step 3: Cache the result
      this.setCachedOutput(cacheKey, agentOutput, tierLevel);

      // Step 4: Return fresh data
      return this.createResponse(agentOutput, 'opal_agent', tierLevel, pageId);

    } catch (error) {
      console.warn(`[Simple Data Service] Error fetching ${tierLevel} data for ${pageId}:`, error);

      // Try stale cache first
      const staleCache = this.getCachedOutput(cacheKey);
      if (staleCache) {
        console.info('[Simple Data Service] Using stale cached data');
        return this.createResponse(staleCache, 'cache', tierLevel, pageId);
      }

      // Fall back to development data (always allowed)
      console.info('[Simple Data Service] Using fallback data');
      const fallbackData = await this.createFallbackData(pageId, tierLevel);
      return this.createResponse(fallbackData, 'fallback', tierLevel, pageId);
    }
  }

  /**
   * Fetch data from OPAL agent workflow
   */
  private async fetchFromOPALAgent(pageId: string, tierLevel: string): Promise<CachedOutput> {
    const agentSource = this.getAgentSourceForPage(pageId);

    try {
      const response = await fetch(`/api/opal/workflows/${agentSource}/output`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Page-ID': pageId
        },
        body: JSON.stringify({
          page_id: pageId,
          tier_level: tierLevel,
          agent_source: agentSource
        })
      });

      if (response.ok) {
        const workflowOutput = await response.json();
        return this.createAgentOutput(agentSource, workflowOutput, workflowOutput.confidence_score || 85);
      }

      throw new Error(`OPAL API returned ${response.status}: ${response.statusText}`);
    } catch (error) {
      console.error(`[OPAL Agent Fetch] Failed to fetch from ${agentSource}:`, error);
      throw error;
    }
  }

  /**
   * Construct pageId format
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
   * Get agent source for a page (simplified mapping)
   */
  private getAgentSourceForPage(pageId: string): string {
    if (pageId.includes('strategy')) return 'strategy_workflow';
    if (pageId.includes('insights')) return 'content_review';
    if (pageId.includes('optimization')) return 'experiment_blueprinter';
    if (pageId.includes('dxptools')) return 'integration_health';
    return 'strategy_workflow'; // default
  }

  /**
   * Create fallback data (always allowed)
   */
  private async createFallbackData(pageId: string, tierLevel: string): Promise<CachedOutput> {
    const agent = this.getAgentSourceForPage(pageId);

    const fallbackData = {
      page_id: pageId,
      tier_level: tierLevel,
      timestamp: new Date().toISOString(),
      summary: `Development data for ${pageId}`,
      metrics: {
        metric_1: Math.floor(Math.random() * 100),
        metric_2: Math.floor(Math.random() * 100),
        development_mode: true
      },
      recommendations: [
        {
          title: 'Sample Recommendation',
          description: `This is sample data for ${pageId}`,
          priority: 'medium',
          type: 'sample'
        }
      ]
    };

    return this.createAgentOutput(agent, fallbackData, 75);
  }

  /**
   * Create agent output structure
   */
  private createAgentOutput(agentSource: string, data: any, confidenceScore: number = 85): CachedOutput {
    return {
      data,
      agent_source: agentSource,
      confidence_score: confidenceScore,
      timestamp: Date.now(),
      ttl: this.CACHE_TTL.tier2
    };
  }

  /**
   * Cache management
   */
  private getCachedOutput(cacheKey: string): CachedOutput | null {
    return this.cache.get(cacheKey) || null;
  }

  private setCachedOutput(cacheKey: string, output: CachedOutput, tierLevel: string): void {
    const ttl = this.CACHE_TTL[tierLevel as keyof typeof this.CACHE_TTL];
    output.ttl = ttl;
    this.cache.set(cacheKey, output);
    this.cleanExpiredCache();
  }

  private isCacheFresh(cached: CachedOutput, tierLevel: string): boolean {
    const maxAge = this.CACHE_TTL[tierLevel as keyof typeof this.CACHE_TTL];
    const age = Date.now() - cached.timestamp;
    return age < maxAge;
  }

  /**
   * Create response structure
   */
  private createResponse<T>(
    output: CachedOutput,
    source: 'opal_agent' | 'cache' | 'fallback',
    tierLevel: string,
    pageId: string
  ): TierDataResponse<T> {
    return {
      data: output.data,
      metadata: {
        tier: tierLevel as 'tier1' | 'tier2' | 'tier3',
        source,
        timestamp: new Date(output.timestamp).toISOString(),
        freshness: source === 'cache' ? 'stale' : 'fresh',
        agent_source: output.agent_source,
        confidence_score: output.confidence_score,
        nextRefresh: source === 'opal_agent' ?
          new Date(Date.now() + output.ttl).toISOString() :
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
   * Force refresh cache
   */
  async forceRefresh(pageId?: string): Promise<void> {
    if (pageId) {
      for (const key of this.cache.keys()) {
        if (key.includes(pageId)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
    console.info('[Simple Data Service] Cache cleared for', pageId || 'all pages');
  }
}

// Export singleton instance
export const simpleOpalService = new SimpleOpalDataService();

// Convenience functions
export async function fetchTierData<T>(
  tier1: string,
  tier2?: string,
  tier3?: string
): Promise<TierDataResponse<T>> {
  return simpleOpalService.fetchTierData<T>(tier1, tier2, tier3);
}

export function getServiceStatus() {
  return {
    service: 'SimpleOpalDataService',
    sop_validation: false,
    restrictions: 'none',
    lastUpdate: new Date().toISOString()
  };
}