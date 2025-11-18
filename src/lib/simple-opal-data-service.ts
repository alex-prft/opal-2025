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
   * Fetch data from OPAL agent workflow with robust error handling
   */
  private async fetchFromOPALAgent(pageId: string, tierLevel: string): Promise<CachedOutput> {
    const agentSource = this.getAgentSourceForPage(pageId);
    const maxRetries = 3;
    const retryDelay = 1000; // 1 second

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[OPAL Agent Fetch] Attempt ${attempt}/${maxRetries} - Fetching ${agentSource} for page: ${pageId}`);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

        const response = await fetch(`/api/opal/workflows/${agentSource}/output`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Page-ID': pageId,
            'X-Tier-Level': tierLevel,
            'X-Request-Attempt': attempt.toString(),
            'X-Request-ID': `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          },
          body: JSON.stringify({
            page_id: pageId,
            tier_level: tierLevel,
            force_refresh: attempt > 1, // Force refresh on retry attempts
            use_cache: attempt === 1, // Only use cache on first attempt
            timeout: 120000,
            retry_attempt: attempt
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        // Enhanced response handling with detailed error information
        if (response.ok) {
          const apiResponse = await response.json();

          // Validate response structure
          if (apiResponse && typeof apiResponse === 'object') {
            if (apiResponse.success && apiResponse.data) {
              console.log(`[OPAL Agent Fetch] SUCCESS: ${agentSource} confidence: ${apiResponse.confidence_score}`);

              return this.createAgentOutput(
                agentSource,
                apiResponse.data,
                apiResponse.confidence_score || 0.75
              );
            } else if (apiResponse.success === false) {
              // API explicitly returned failure
              const errorMsg = apiResponse.error || 'Agent execution failed';
              console.warn(`[OPAL Agent Fetch] API returned failure: ${errorMsg}`);

              if (attempt < maxRetries && this.isRetryableError(errorMsg)) {
                console.log(`[OPAL Agent Fetch] Retrying in ${retryDelay}ms due to retryable error: ${errorMsg}`);
                await this.delay(retryDelay * attempt); // Exponential backoff
                continue;
              }

              throw new Error(errorMsg);
            } else {
              // Malformed response structure
              throw new Error('Invalid API response structure');
            }
          } else {
            throw new Error('Invalid API response format');
          }
        }

        // Handle HTTP error status codes
        const errorBody = await response.text().catch(() => 'Unable to read error response');
        const errorMsg = `OPAL API returned ${response.status}: ${response.statusText}`;
        console.warn(`[OPAL Agent Fetch] HTTP Error: ${errorMsg}, Body: ${errorBody}`);

        // Determine if this is a retryable HTTP error
        if (attempt < maxRetries && this.isRetryableHttpStatus(response.status)) {
          console.log(`[OPAL Agent Fetch] Retrying in ${retryDelay}ms due to retryable HTTP status: ${response.status}`);
          await this.delay(retryDelay * attempt);
          continue;
        }

        throw new Error(`${errorMsg} - ${errorBody}`);

      } catch (error) {
        console.error(`[OPAL Agent Fetch] Attempt ${attempt} failed for ${agentSource}:`, error);

        // Don't retry on the final attempt or for non-retryable errors
        if (attempt === maxRetries || !this.isRetryableError(error)) {
          // Enhance error information for debugging
          const enhancedError = error instanceof Error
            ? new Error(`${error.message} (after ${attempt} attempts)`)
            : new Error(`Unknown error occurred (after ${attempt} attempts)`);

          console.error(`[OPAL Agent Fetch] Final failure for ${agentSource} after ${attempt} attempts:`, enhancedError);
          throw enhancedError;
        }

        // Wait before retry with exponential backoff
        await this.delay(retryDelay * attempt);
      }
    }

    // This should never be reached, but included for type safety
    throw new Error(`Maximum retry attempts (${maxRetries}) exceeded`);
  }

  /**
   * Determine if an error is retryable
   */
  private isRetryableError(error: any): boolean {
    if (typeof error === 'string') {
      const retryableMessages = [
        'timeout',
        'network error',
        'connection',
        'unavailable',
        'service temporarily',
        'rate limit',
        'redis',
        'database connection'
      ];
      const errorLower = error.toLowerCase();
      return retryableMessages.some(msg => errorLower.includes(msg));
    }

    if (error instanceof Error) {
      const errorLower = error.message.toLowerCase();
      return this.isRetryableError(errorLower) ||
             error.name === 'AbortError' ||
             error.name === 'TimeoutError';
    }

    return false;
  }

  /**
   * Determine if HTTP status code is retryable
   */
  private isRetryableHttpStatus(status: number): boolean {
    // Retry on 5xx server errors and specific 4xx errors
    return status >= 500 || status === 408 || status === 429;
  }

  /**
   * Utility function for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
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
   * Get agent source for a page with enhanced content page mappings
   */
  private getAgentSourceForPage(pageId: string): string {
    // Strategy Plans specific mappings
    if (pageId.includes('strategy-plans')) {
      // OSA section
      if (pageId.includes('osa')) return 'strategy_workflow';

      // Roadmap section - use roadmap generator
      if (pageId.includes('roadmap')) return 'roadmap_generator';

      // Maturity section - use maturity assessment
      if (pageId.includes('maturity')) return 'maturity_assessment';

      // Quick wins section - use quick wins analyzer
      if (pageId.includes('quick-wins')) return 'quick_wins_analyzer';

      // Phases section - use strategy workflow for phases
      if (pageId.includes('phases')) return 'strategy_workflow';

      // Default for strategy plans
      return 'strategy_workflow';
    }

    // DXP Tools specific mappings
    if (pageId.includes('dxptools') || pageId.includes('optimizely-dxp-tools')) {
      // Content Recommendations → Topic Performance
      if (pageId.includes('content-recs') && pageId.includes('topic-performance')) {
        return 'content_recs_topic_performance';
      }

      // Other Content Recs mappings
      if (pageId.includes('content-recs')) return 'content_review';

      // Default DXP Tools
      return 'strategy_workflow';
    }

    // Experience Optimization specific mappings
    if (pageId.includes('experience-optimization')) {
      // Content page for Experience Optimization
      if (pageId.includes('content')) return 'content_next_best_topics';

      // Experimentation pages
      if (pageId.includes('experimentation')) return 'experiment_blueprinter';

      // Personalization pages
      if (pageId.includes('personalization')) return 'personalization_idea_generator';

      // Default Experience Optimization
      return 'content_review';
    }

    // Other page mappings
    if (pageId.includes('insights')) return 'content_review';
    if (pageId.includes('optimization')) return 'content_review';
    if (pageId.includes('analytics-insights')) return 'content_review';

    // Default fallback
    return 'strategy_workflow';
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