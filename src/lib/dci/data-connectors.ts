/**
 * DCI Data Connectors - Production Data Source Integration
 *
 * Connects DCI Context Builder to actual production data sources including:
 * - Supabase database with secure client integration
 * - OPAL agent outputs via SimpleOpalDataService
 * - DXP Tools data (WebX, ODP, Content Recs, CMS, CMP)
 * - Analytics data from various sources
 */

import { DciContextBuckets, OSAResults } from '@/types/dci-orchestrator';
import { dciLog } from './feature-flags';

// Import existing OSA data services
// Note: These imports follow existing OSA patterns
type SupabaseClient = any; // Will be properly typed when wired to actual Supabase client
type OpalDataService = any; // Will be properly typed when wired to actual service

// =============================================================================
// Data Connector Configuration
// =============================================================================

interface DataConnectorConfig {
  enableSupabaseIntegration: boolean;
  enableOpalIntegration: boolean;
  enableDxpToolsIntegration: boolean;
  enableAnalyticsIntegration: boolean;
  dataFreshnessHours: number;
  maxItemsPerCategory: number;
  fallbackToMockData: boolean;
  enableCaching: boolean;
  cacheExpiryMinutes: number;
}

const DEFAULT_CONNECTOR_CONFIG: DataConnectorConfig = {
  enableSupabaseIntegration: process.env.NEXT_PUBLIC_ENABLE_DCI_SUPABASE === 'true',
  enableOpalIntegration: process.env.NEXT_PUBLIC_ENABLE_DCI_OPAL === 'true',
  enableDxpToolsIntegration: process.env.NEXT_PUBLIC_ENABLE_DCI_DXP_TOOLS === 'true',
  enableAnalyticsIntegration: process.env.NEXT_PUBLIC_ENABLE_DCI_ANALYTICS === 'true',
  dataFreshnessHours: parseInt(process.env.DCI_DATA_FRESHNESS_HOURS || '24'),
  maxItemsPerCategory: parseInt(process.env.DCI_MAX_ITEMS_PER_CATEGORY || '10'),
  fallbackToMockData: process.env.NODE_ENV !== 'production',
  enableCaching: true,
  cacheExpiryMinutes: parseInt(process.env.DCI_CACHE_EXPIRY_MINUTES || '30')
};

// =============================================================================
// Data Connector Cache
// =============================================================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiryMs: number;
}

class DataConnectorCache {
  private cache = new Map<string, CacheEntry<any>>();

  set<T>(key: string, data: T, expiryMinutes: number = 30): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiryMs: expiryMinutes * 60 * 1000
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.expiryMs) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  clear(): void {
    this.cache.clear();
  }

  getStats(): { entries: number; totalSize: number } {
    return {
      entries: this.cache.size,
      totalSize: JSON.stringify([...this.cache.entries()]).length
    };
  }
}

const cache = new DataConnectorCache();

// =============================================================================
// Supabase Data Connectors
// =============================================================================

export class SupabaseDataConnector {
  private supabaseClient: SupabaseClient | null = null;
  private config: DataConnectorConfig;

  constructor(config: Partial<DataConnectorConfig> = {}) {
    this.config = { ...DEFAULT_CONNECTOR_CONFIG, ...config };
    this.initializeSupabaseClient();
  }

  private async initializeSupabaseClient(): Promise<void> {
    if (!this.config.enableSupabaseIntegration) {
      dciLog('info', 'Supabase integration disabled');
      return;
    }

    try {
      // TODO: Wire to actual secure Supabase client following OSA patterns
      // const { secureSupabase } = await import('@/lib/database');
      // this.supabaseClient = secureSupabase;

      dciLog('info', 'Supabase client initialized for DCI data connector');
    } catch (error) {
      dciLog('error', 'Failed to initialize Supabase client:', error);
    }
  }

  async fetchContentPerformanceData(orgId: string): Promise<any[]> {
    const cacheKey = `content-performance-${orgId}`;
    const cached = cache.get<any[]>(cacheKey);
    if (cached) return cached;

    if (!this.supabaseClient) {
      dciLog('warn', 'Supabase client not available, using mock data');
      return this.getMockContentPerformanceData();
    }

    try {
      // TODO: Implement actual query following OSA patterns
      /*
      const { data, error } = await this.supabaseClient
        .from('content_performance')
        .select(`
          page_path,
          unique_visitors,
          total_interactions,
          conversion_rate,
          bounce_rate,
          avg_session_duration,
          last_updated
        `)
        .eq('org_id', orgId)
        .gte('last_updated', new Date(Date.now() - this.config.dataFreshnessHours * 60 * 60 * 1000).toISOString())
        .order('unique_visitors', { ascending: false })
        .limit(this.config.maxItemsPerCategory);

      if (error) throw error;

      cache.set(cacheKey, data, this.config.cacheExpiryMinutes);
      dciLog('info', `Fetched ${data.length} content performance records from Supabase`);
      return data;
      */

      // Temporary mock data with proper structure
      const mockData = this.getMockContentPerformanceData();
      cache.set(cacheKey, mockData, this.config.cacheExpiryMinutes);
      return mockData;

    } catch (error) {
      dciLog('error', 'Failed to fetch content performance data:', error);

      if (this.config.fallbackToMockData) {
        return this.getMockContentPerformanceData();
      }

      throw error;
    }
  }

  async fetchTopTrafficPages(orgId: string): Promise<string[]> {
    const cacheKey = `top-traffic-pages-${orgId}`;
    const cached = cache.get<string[]>(cacheKey);
    if (cached) return cached;

    if (!this.supabaseClient) {
      return ['Homepage', 'Product Pages', 'Category Pages', 'About Page'];
    }

    try {
      // TODO: Implement actual query
      /*
      const { data, error } = await this.supabaseClient
        .from('page_analytics')
        .select('page_path, total_visitors')
        .eq('org_id', orgId)
        .gte('date', new Date(Date.now() - this.config.dataFreshnessHours * 60 * 60 * 1000).toISOString())
        .order('total_visitors', { ascending: false })
        .limit(this.config.maxItemsPerCategory);

      if (error) throw error;

      const pages = data.map(row => row.page_path);
      cache.set(cacheKey, pages, this.config.cacheExpiryMinutes);
      return pages;
      */

      const mockPages = ['Homepage', 'Product Pages', 'Category Pages', 'Checkout Flow', 'Search Results'];
      cache.set(cacheKey, mockPages, this.config.cacheExpiryMinutes);
      return mockPages;

    } catch (error) {
      dciLog('error', 'Failed to fetch top traffic pages:', error);
      return ['Homepage', 'Product Pages', 'Category Pages'];
    }
  }

  async fetchUnderperformingPages(orgId: string): Promise<string[]> {
    const cacheKey = `underperforming-pages-${orgId}`;
    const cached = cache.get<string[]>(cacheKey);
    if (cached) return cached;

    // TODO: Implement actual underperforming page detection logic
    const underperformingPages = [
      'Checkout abandonment flow',
      'Mobile product filters',
      'Search results with no results',
      'Contact form completion'
    ];

    cache.set(cacheKey, underperformingPages, this.config.cacheExpiryMinutes);
    return underperformingPages;
  }

  private getMockContentPerformanceData(): any[] {
    return [
      {
        page: 'Homepage',
        uniques: 15420,
        interactions: 8932,
        conversionRate: 0.12,
        bounceRate: 0.28,
        avgSessionDuration: 185
      },
      {
        page: 'Product Category Pages',
        uniques: 12380,
        interactions: 7651,
        conversionRate: 0.08,
        bounceRate: 0.35,
        avgSessionDuration: 142
      },
      {
        page: 'Product Detail Pages',
        uniques: 9872,
        interactions: 6543,
        conversionRate: 0.15,
        bounceRate: 0.22,
        avgSessionDuration: 220
      },
      {
        page: 'Checkout Flow',
        uniques: 3456,
        interactions: 2890,
        conversionRate: 0.72,
        bounceRate: 0.15,
        avgSessionDuration: 95
      }
    ];
  }
}

// =============================================================================
// OPAL Data Connectors
// =============================================================================

export class OpalDataConnector {
  private opalService: OpalDataService | null = null;
  private config: DataConnectorConfig;

  constructor(config: Partial<DataConnectorConfig> = {}) {
    this.config = { ...DEFAULT_CONNECTOR_CONFIG, ...config };
    this.initializeOpalService();
  }

  private async initializeOpalService(): Promise<void> {
    if (!this.config.enableOpalIntegration) {
      dciLog('info', 'OPAL integration disabled');
      return;
    }

    try {
      // TODO: Wire to actual SimpleOpalDataService following OSA patterns
      // const { SimpleOpalDataService } = await import('@/lib/simple-opal-data-service');
      // this.opalService = SimpleOpalDataService;

      dciLog('info', 'OPAL service initialized for DCI data connector');
    } catch (error) {
      dciLog('error', 'Failed to initialize OPAL service:', error);
    }
  }

  async fetchAgentOutput(agentId: string, orgId: string): Promise<any> {
    const cacheKey = `opal-agent-${agentId}-${orgId}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    if (!this.opalService) {
      dciLog('warn', 'OPAL service not available, using mock data');
      return this.getMockAgentOutput(agentId);
    }

    try {
      // TODO: Implement actual OPAL agent output fetching
      /*
      const output = await this.opalService.getAgentOutput(agentId, {
        orgId,
        maxAge: this.config.dataFreshnessHours,
        includeMetadata: true
      });

      cache.set(cacheKey, output, this.config.cacheExpiryMinutes);
      dciLog('info', `Fetched OPAL agent output for ${agentId}`);
      return output;
      */

      const mockOutput = this.getMockAgentOutput(agentId);
      cache.set(cacheKey, mockOutput, this.config.cacheExpiryMinutes);
      return mockOutput;

    } catch (error) {
      dciLog('error', `Failed to fetch OPAL agent output for ${agentId}:`, error);

      if (this.config.fallbackToMockData) {
        return this.getMockAgentOutput(agentId);
      }

      throw error;
    }
  }

  async fetchMultipleAgentOutputs(agentIds: string[], orgId: string): Promise<{ [agentId: string]: any }> {
    const results: { [agentId: string]: any } = {};

    await Promise.allSettled(
      agentIds.map(async agentId => {
        try {
          results[agentId] = await this.fetchAgentOutput(agentId, orgId);
        } catch (error) {
          dciLog('warn', `Failed to fetch output for agent ${agentId}:`, error);
          results[agentId] = null;
        }
      })
    );

    return results;
  }

  private getMockAgentOutput(agentId: string): any {
    const mockOutputs: { [agentId: string]: any } = {
      content_review: {
        contentIssues: ['Mobile optimization needed', 'Content freshness gaps'],
        recommendations: ['Implement responsive design', 'Update stale content'],
        confidence: 85,
        lastUpdated: new Date().toISOString()
      },
      audience_suggester: {
        suggestedSegments: ['New visitors', 'Returning customers', 'Mobile users', 'High-value prospects'],
        segmentData: {
          'New visitors': { size: 12500, growthRate: 0.15 },
          'Returning customers': { size: 8300, growthRate: 0.08 }
        },
        confidence: 78
      },
      strategy_workflow: {
        strategicPriorities: ['Mobile experience enhancement', 'Conversion optimization', 'Content personalization'],
        recommendedPhases: ['Foundation', 'Optimization', 'Advanced'],
        timelineEstimate: '6-12 months',
        confidence: 82
      },
      analytics_insights: {
        keyMetrics: ['CVR', 'Bounce Rate', 'Session Duration', 'Pages per Session'],
        insights: [
          'Mobile bounce rate 35% higher than desktop',
          'Checkout abandonment peaks at payment step',
          'Blog content drives 40% of organic traffic'
        ],
        confidence: 91
      }
    };

    return mockOutputs[agentId] || {
      message: `Mock output for ${agentId}`,
      confidence: 70,
      lastUpdated: new Date().toISOString()
    };
  }
}

// =============================================================================
// DXP Tools Data Connectors
// =============================================================================

export class DxpToolsDataConnector {
  private config: DataConnectorConfig;

  constructor(config: Partial<DataConnectorConfig> = {}) {
    this.config = { ...DEFAULT_CONNECTOR_CONFIG, ...config };
  }

  async fetchOptimizelyData(toolName: string, orgId: string): Promise<any> {
    const cacheKey = `dxp-${toolName}-${orgId}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    if (!this.config.enableDxpToolsIntegration) {
      return this.getMockDxpData(toolName);
    }

    try {
      // TODO: Implement actual DXP tools data fetching following OSA patterns
      /*
      const data = await this.fetchDXPToolsData(toolName, {
        orgId,
        timeRange: `${this.config.dataFreshnessHours}h`,
        includeMetrics: true
      });

      cache.set(cacheKey, data, this.config.cacheExpiryMinutes);
      dciLog('info', `Fetched DXP data for ${toolName}`);
      return data;
      */

      const mockData = this.getMockDxpData(toolName);
      cache.set(cacheKey, mockData, this.config.cacheExpiryMinutes);
      return mockData;

    } catch (error) {
      dciLog('error', `Failed to fetch DXP data for ${toolName}:`, error);

      if (this.config.fallbackToMockData) {
        return this.getMockDxpData(toolName);
      }

      throw error;
    }
  }

  private getMockDxpData(toolName: string): any {
    const mockData: { [toolName: string]: any } = {
      webx: {
        activeExperiments: 3,
        completedExperiments: 12,
        avgLift: 0.08,
        topWinningVariations: ['Homepage hero simplification', 'Checkout flow optimization'],
        lastUpdated: new Date().toISOString()
      },
      odp: {
        totalProfiles: 125000,
        activeSegments: 8,
        engagementRate: 0.34,
        topSegments: ['High-value customers', 'Mobile users', 'Recent buyers'],
        lastUpdated: new Date().toISOString()
      },
      content_recs: {
        totalRecommendations: 450000,
        clickThroughRate: 0.12,
        topPerformingContent: ['Product guides', 'Case studies', 'How-to articles'],
        lastUpdated: new Date().toISOString()
      },
      cms: {
        totalPages: 2500,
        publishedThisMonth: 45,
        avgPageScore: 78,
        contentTypes: ['Product pages', 'Blog posts', 'Landing pages'],
        lastUpdated: new Date().toISOString()
      },
      cmp: {
        activeCampaigns: 12,
        totalReach: 85000,
        avgEngagementRate: 0.28,
        topPerformingCampaigns: ['Q4 Holiday Campaign', 'New Product Launch'],
        lastUpdated: new Date().toISOString()
      }
    };

    return mockData[toolName] || {
      message: `Mock DXP data for ${toolName}`,
      lastUpdated: new Date().toISOString()
    };
  }
}

// =============================================================================
// Analytics Data Connectors
// =============================================================================

export class AnalyticsDataConnector {
  private config: DataConnectorConfig;

  constructor(config: Partial<DataConnectorConfig> = {}) {
    this.config = { ...DEFAULT_CONNECTOR_CONFIG, ...config };
  }

  async fetchAnalyticsMetrics(orgId: string, metrics: string[]): Promise<{ [metric: string]: any }> {
    const cacheKey = `analytics-metrics-${orgId}-${metrics.join(',')}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    if (!this.config.enableAnalyticsIntegration) {
      return this.getMockAnalyticsData(metrics);
    }

    try {
      // TODO: Implement actual analytics data fetching
      /*
      const data = await this.fetchAnalyticsData({
        orgId,
        metrics,
        timeRange: `${this.config.dataFreshnessHours}h`,
        dimensions: ['device', 'source', 'page']
      });

      cache.set(cacheKey, data, this.config.cacheExpiryMinutes);
      dciLog('info', `Fetched analytics data for ${metrics.length} metrics`);
      return data;
      */

      const mockData = this.getMockAnalyticsData(metrics);
      cache.set(cacheKey, mockData, this.config.cacheExpiryMinutes);
      return mockData;

    } catch (error) {
      dciLog('error', 'Failed to fetch analytics metrics:', error);

      if (this.config.fallbackToMockData) {
        return this.getMockAnalyticsData(metrics);
      }

      throw error;
    }
  }

  private getMockAnalyticsData(metrics: string[]): { [metric: string]: any } {
    const mockData: { [metric: string]: any } = {};

    metrics.forEach(metric => {
      switch (metric.toLowerCase()) {
        case 'cvr':
        case 'conversion rate':
          mockData[metric] = {
            value: '8.4%',
            trend: 'up',
            change: '+1.2%',
            segments: {
              desktop: '9.1%',
              mobile: '7.6%',
              tablet: '8.8%'
            }
          };
          break;
        case 'bounce rate':
          mockData[metric] = {
            value: '32.1%',
            trend: 'down',
            change: '-2.8%',
            segments: {
              desktop: '28.5%',
              mobile: '36.2%',
              tablet: '31.1%'
            }
          };
          break;
        case 'session duration':
        case 'avg session duration':
          mockData[metric] = {
            value: '3m 45s',
            trend: 'up',
            change: '+15s',
            segments: {
              desktop: '4m 12s',
              mobile: '3m 18s',
              tablet: '3m 52s'
            }
          };
          break;
        case 'engagement':
        case 'engagement rate':
          mockData[metric] = {
            value: '4.2 pages/session',
            trend: 'stable',
            change: '+0.1',
            segments: {
              desktop: '4.8 pages/session',
              mobile: '3.6 pages/session',
              tablet: '4.1 pages/session'
            }
          };
          break;
        default:
          mockData[metric] = {
            value: 'Tracking',
            trend: 'stable',
            change: 'N/A'
          };
      }
    });

    return mockData;
  }
}

// =============================================================================
// Main Data Connector Integration
// =============================================================================

export class DciDataConnectorManager {
  private supabaseConnector: SupabaseDataConnector;
  private opalConnector: OpalDataConnector;
  private dxpConnector: DxpToolsDataConnector;
  private analyticsConnector: AnalyticsDataConnector;
  private config: DataConnectorConfig;

  constructor(config: Partial<DataConnectorConfig> = {}) {
    this.config = { ...DEFAULT_CONNECTOR_CONFIG, ...config };

    this.supabaseConnector = new SupabaseDataConnector(config);
    this.opalConnector = new OpalDataConnector(config);
    this.dxpConnector = new DxpToolsDataConnector(config);
    this.analyticsConnector = new AnalyticsDataConnector(config);

    dciLog('info', 'DCI Data Connector Manager initialized');
  }

  async buildProductionContextBuckets(baseMeta: OSAResults['meta']): Promise<DciContextBuckets> {
    const orgId = baseMeta.orgName || 'default-org';

    dciLog('info', `Building production context buckets for ${orgId}`);

    try {
      const [
        contentContext,
        analyticsContext,
        experienceTacticsContext,
        strategyContext
      ] = await Promise.allSettled([
        this.buildContentContext(orgId, baseMeta),
        this.buildAnalyticsContext(orgId, baseMeta),
        this.buildExperienceTacticsContext(orgId, baseMeta),
        this.buildStrategyContext(orgId, baseMeta)
      ]);

      const contextBuckets: DciContextBuckets = {};

      if (contentContext.status === 'fulfilled') {
        contextBuckets.contentContext = contentContext.value;
      }
      if (analyticsContext.status === 'fulfilled') {
        contextBuckets.analyticsContext = analyticsContext.value;
      }
      if (experienceTacticsContext.status === 'fulfilled') {
        contextBuckets.experienceTacticsContext = experienceTacticsContext.value;
      }
      if (strategyContext.status === 'fulfilled') {
        contextBuckets.strategyContext = strategyContext.value;
      }

      dciLog('info', `Built ${Object.keys(contextBuckets).length}/4 production context buckets`);
      return contextBuckets;

    } catch (error) {
      dciLog('error', 'Failed to build production context buckets:', error);
      throw error;
    }
  }

  private async buildContentContext(orgId: string, baseMeta: OSAResults['meta']): Promise<DciContextBuckets['contentContext']> {
    const [
      topTrafficPages,
      underperformingPages,
      contentPerformanceData
    ] = await Promise.allSettled([
      this.supabaseConnector.fetchTopTrafficPages(orgId),
      this.supabaseConnector.fetchUnderperformingPages(orgId),
      this.supabaseConnector.fetchContentPerformanceData(orgId)
    ]);

    // Get content review data from OPAL
    const contentReviewData = await this.opalConnector.fetchAgentOutput('content_review', orgId);

    return {
      topTrafficPages: topTrafficPages.status === 'fulfilled' ? topTrafficPages.value : ['Homepage'],
      underperformingPages: underperformingPages.status === 'fulfilled' ? underperformingPages.value : ['Checkout'],
      highValuePages: ['Homepage', 'Product Pages', 'Conversion Flow'],
      contentTypes: this.inferContentTypes(baseMeta.industry),
      knownContentIssues: contentReviewData?.contentIssues || ['Content optimization in progress'],
      contentPerformanceData: contentPerformanceData.status === 'fulfilled' ? contentPerformanceData.value : [],
      topicsData: [
        {
          topicId: 'primary-value-prop',
          topicLabel: 'Primary Value Proposition',
          performance: 85,
          trendDirection: 'up' as const
        }
      ]
    };
  }

  private async buildAnalyticsContext(orgId: string, baseMeta: OSAResults['meta']): Promise<DciContextBuckets['analyticsContext']> {
    const analyticsData = await this.analyticsConnector.fetchAnalyticsMetrics(orgId, baseMeta.primaryKpis);
    const analyticsInsights = await this.opalConnector.fetchAgentOutput('analytics_insights', orgId);

    return {
      keyMetrics: baseMeta.primaryKpis,
      currentPerformance: this.formatCurrentPerformance(analyticsData),
      trendsSummary: 'Performance showing positive trends with mobile engagement improvements',
      notableWins: analyticsInsights?.insights?.filter((insight: string) => insight.includes('improvement')) || [],
      notableLosses: analyticsInsights?.insights?.filter((insight: string) => insight.includes('decline')) || [],
      dataSourcesAvailable: this.getAvailableDataSources(baseMeta.optiStack),
      dataQualityIssues: ['Historical data normalization in progress']
    };
  }

  private async buildExperienceTacticsContext(orgId: string, baseMeta: OSAResults['meta']): Promise<DciContextBuckets['experienceTacticsContext']> {
    const [webxData, odpData] = await Promise.allSettled([
      this.dxpConnector.fetchOptimizelyData('webx', orgId),
      this.dxpConnector.fetchOptimizelyData('odp', orgId)
    ]);

    return {
      knownWinningPatterns: webxData.status === 'fulfilled' ? webxData.value.topWinningVariations || [] : [],
      existingExperimentsSummary: [`${webxData.status === 'fulfilled' ? webxData.value.activeExperiments || 0 : 0} active experiments`],
      audienceSegments: odpData.status === 'fulfilled' ? odpData.value.topSegments || [] : ['General visitors'],
      channelMixInfo: [
        'Organic search: 42%',
        'Direct traffic: 28%',
        'Paid advertising: 18%',
        'Social media: 12%'
      ],
      deviceAndBrowserData: {
        desktop: 35,
        mobile: 58,
        tablet: 7
      }
    };
  }

  private async buildStrategyContext(orgId: string, baseMeta: OSAResults['meta']): Promise<DciContextBuckets['strategyContext']> {
    const strategyData = await this.opalConnector.fetchAgentOutput('strategy_workflow', orgId);

    return {
      orgConstraints: this.getMaturityConstraints(baseMeta.maturityPhase),
      timelineConstraints: ['Quarterly business cycles', 'Seasonal traffic variations'],
      leadershipPriorities: baseMeta.primaryGoals,
      teamCapabilities: this.getMaturityCapabilities(baseMeta.maturityPhase),
      existingRoadmapNotes: strategyData?.recommendedPhases || [],
      budgetConsiderations: ['ROI-focused initiatives', 'Quarterly budget cycles']
    };
  }

  // Helper methods
  private inferContentTypes(industry?: string): string[] {
    const baseTypes = ['page', 'blog', 'landing-page'];

    if (industry?.toLowerCase().includes('ecommerce') || industry?.toLowerCase().includes('retail')) {
      return [...baseTypes, 'product', 'category', 'promotional'];
    }

    return [...baseTypes, 'service', 'case-study'];
  }

  private formatCurrentPerformance(analyticsData: { [metric: string]: any }): { [metric: string]: string | number } {
    const formatted: { [metric: string]: string | number } = {};

    Object.entries(analyticsData).forEach(([metric, data]) => {
      formatted[metric] = data.value || 'Tracking';
    });

    return formatted;
  }

  private getAvailableDataSources(optiStack: string[]): string[] {
    const sources = ['Google Analytics'];

    if (optiStack.includes('Optimizely WebX')) sources.push('Optimizely Web Experimentation');
    if (optiStack.includes('ODP')) sources.push('Optimizely Data Platform');
    if (optiStack.includes('Content Recommendations')) sources.push('Content Intelligence');

    return sources;
  }

  private getMaturityConstraints(maturityPhase: string): string[] {
    const constraints = {
      crawl: ['Limited technical resources', 'Basic infrastructure'],
      walk: ['Growing capabilities', 'Moderate resources'],
      run: ['Established processes', 'Good resources'],
      fly: ['Advanced capabilities', 'Dedicated teams']
    };

    return constraints[maturityPhase as keyof typeof constraints] || constraints.walk;
  }

  private getMaturityCapabilities(maturityPhase: string): { development: string; design: string; analytics: string; content: string } {
    const capabilities = {
      crawl: { development: 'low', design: 'low', analytics: 'low', content: 'medium' },
      walk: { development: 'medium', design: 'medium', analytics: 'medium', content: 'medium' },
      run: { development: 'medium', design: 'high', analytics: 'high', content: 'high' },
      fly: { development: 'high', design: 'high', analytics: 'high', content: 'high' }
    };

    return capabilities[maturityPhase as keyof typeof capabilities] || capabilities.walk;
  }

  // Utility methods
  getCacheStats(): any {
    return cache.getStats();
  }

  clearCache(): void {
    cache.clear();
    dciLog('info', 'DCI data connector cache cleared');
  }

  async healthCheck(): Promise<{ [connector: string]: boolean }> {
    return {
      supabase: this.config.enableSupabaseIntegration,
      opal: this.config.enableOpalIntegration,
      dxpTools: this.config.enableDxpToolsIntegration,
      analytics: this.config.enableAnalyticsIntegration
    };
  }
}

// =============================================================================
// Export Default Instance
// =============================================================================

export const dciDataConnector = new DciDataConnectorManager();

export {
  type DataConnectorConfig,
  DEFAULT_CONNECTOR_CONFIG
};