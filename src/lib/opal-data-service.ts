/**
 * Enhanced OPAL Data Integration Service
 * Tier-specific data fetching with fallback strategies and caching
 */

export interface TierDataRequest {
  tier1: string;
  tier2?: string;
  tier3?: string;
  timestamp?: string;
}

export interface TierDataResponse<T = any> {
  data: T;
  metadata: {
    tier: 'tier1' | 'tier2' | 'tier3';
    source: 'api' | 'cache' | 'mock';
    timestamp: string;
    freshness: 'fresh' | 'stale' | 'expired';
    nextRefresh?: string;
  };
  error?: string;
}

export interface Tier1SummaryMetrics {
  // High-level organizational metrics
  overallHealth: {
    score: number;
    status: 'excellent' | 'good' | 'warning' | 'critical';
    trend: 'improving' | 'stable' | 'declining';
  };
  keyMetrics: {
    totalUsers: number;
    engagementRate: number;
    conversionRate: number;
    revenueImpact: number;
    experimentVelocity: number;
  };
  systemStatus: {
    apiHealth: 'healthy' | 'degraded' | 'down';
    dataFreshness: 'real-time' | 'near-real-time' | 'delayed';
    integrationStatus: 'connected' | 'partial' | 'disconnected';
  };
  alerts: Array<{
    type: 'info' | 'warning' | 'error' | 'critical';
    message: string;
    timestamp: string;
    actionRequired?: boolean;
  }>;
}

export interface Tier2SectionKPIs {
  // Section-specific performance indicators
  sectionId: string;
  sectionName: string;
  kpis: {
    primary: Array<{
      name: string;
      value: number;
      unit: string;
      target?: number;
      trend: number;
      trendDirection: 'up' | 'down' | 'stable';
    }>;
    secondary: Array<{
      name: string;
      value: number | string;
      context?: string;
    }>;
  };
  performance: {
    score: number;
    benchmarks: {
      industry: number;
      internal: number;
      target: number;
    };
  };
  insights: Array<{
    type: 'opportunity' | 'risk' | 'trend';
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    impact: string;
  }>;
}

export interface Tier3DetailedContent {
  // Page-specific detailed data
  pageId: string;
  pageName: string;
  contentType: 'analytics' | 'experiments' | 'strategy' | 'tools';
  data: {
    charts: Array<{
      id: string;
      type: 'line' | 'bar' | 'area' | 'pie' | 'heatmap';
      title: string;
      data: any[];
      config?: any;
    }>;
    tables: Array<{
      id: string;
      title: string;
      headers: string[];
      rows: any[][];
      sortable?: boolean;
    }>;
    metrics: Array<{
      id: string;
      name: string;
      value: number | string;
      format: 'number' | 'percentage' | 'currency' | 'duration';
      comparison?: {
        previous: number | string;
        change: number;
        changeType: 'absolute' | 'percentage';
      };
    }>;
    content: {
      summary?: string;
      recommendations?: Array<{
        title: string;
        description: string;
        priority: 'low' | 'medium' | 'high';
        actionItems: string[];
      }>;
      alerts?: Array<{
        type: 'info' | 'warning' | 'error';
        message: string;
        dismissible: boolean;
      }>;
    };
  };
  enrichment: {
    aiInsights?: Array<{
      type: 'prediction' | 'anomaly' | 'correlation' | 'recommendation';
      title: string;
      description: string;
      confidence: number;
      source: string;
    }>;
    contextualData?: {
      relatedPages: string[];
      dependencies: string[];
      tags: string[];
    };
  };
}

class OPALDataService {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private readonly CACHE_TTL = {
    tier1: 5 * 60 * 1000,  // 5 minutes
    tier2: 2 * 60 * 1000,  // 2 minutes
    tier3: 1 * 60 * 1000,  // 1 minute
  };

  /**
   * Fetch Tier-1 Summary Metrics
   */
  async fetchTier1Data(tier1: string): Promise<TierDataResponse<Tier1SummaryMetrics>> {
    const cacheKey = `tier1:${tier1}`;

    // Check cache first
    const cached = this.getCachedData(cacheKey);
    if (cached) {
      return {
        data: cached.data,
        metadata: {
          tier: 'tier1',
          source: 'cache',
          timestamp: new Date(cached.timestamp).toISOString(),
          freshness: this.getFreshness(cached.timestamp, this.CACHE_TTL.tier1)
        }
      };
    }

    try {
      const response = await fetch(`/api/opal/tier1/${tier1}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-OPAL-Tier': '1'
        }
      });

      if (response.ok) {
        const data = await response.json();
        this.setCacheData(cacheKey, data, this.CACHE_TTL.tier1);

        return {
          data,
          metadata: {
            tier: 'tier1',
            source: 'api',
            timestamp: new Date().toISOString(),
            freshness: 'fresh',
            nextRefresh: new Date(Date.now() + this.CACHE_TTL.tier1).toISOString()
          }
        };
      }
    } catch (error) {
      console.warn(`Tier-1 API error for ${tier1}:`, error);
    }

    // Fallback to mock data
    const mockData = await this.generateTier1MockData(tier1);
    return {
      data: mockData,
      metadata: {
        tier: 'tier1',
        source: 'mock',
        timestamp: new Date().toISOString(),
        freshness: 'fresh'
      }
    };
  }

  /**
   * Fetch Tier-2 Section KPIs
   */
  async fetchTier2Data(tier1: string, tier2: string): Promise<TierDataResponse<Tier2SectionKPIs>> {
    const cacheKey = `tier2:${tier1}:${tier2}`;

    const cached = this.getCachedData(cacheKey);
    if (cached) {
      return {
        data: cached.data,
        metadata: {
          tier: 'tier2',
          source: 'cache',
          timestamp: new Date(cached.timestamp).toISOString(),
          freshness: this.getFreshness(cached.timestamp, this.CACHE_TTL.tier2)
        }
      };
    }

    try {
      const response = await fetch(`/api/opal/tier2/${tier1}/${tier2}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-OPAL-Tier': '2'
        }
      });

      if (response.ok) {
        const data = await response.json();
        this.setCacheData(cacheKey, data, this.CACHE_TTL.tier2);

        return {
          data,
          metadata: {
            tier: 'tier2',
            source: 'api',
            timestamp: new Date().toISOString(),
            freshness: 'fresh',
            nextRefresh: new Date(Date.now() + this.CACHE_TTL.tier2).toISOString()
          }
        };
      }
    } catch (error) {
      console.warn(`Tier-2 API error for ${tier1}/${tier2}:`, error);
    }

    // Fallback to mock data
    const mockData = await this.generateTier2MockData(tier1, tier2);
    return {
      data: mockData,
      metadata: {
        tier: 'tier2',
        source: 'mock',
        timestamp: new Date().toISOString(),
        freshness: 'fresh'
      }
    };
  }

  /**
   * Fetch Tier-3 Detailed Content
   */
  async fetchTier3Data(tier1: string, tier2: string, tier3: string): Promise<TierDataResponse<Tier3DetailedContent>> {
    const cacheKey = `tier3:${tier1}:${tier2}:${tier3}`;

    const cached = this.getCachedData(cacheKey);
    if (cached) {
      return {
        data: cached.data,
        metadata: {
          tier: 'tier3',
          source: 'cache',
          timestamp: new Date(cached.timestamp).toISOString(),
          freshness: this.getFreshness(cached.timestamp, this.CACHE_TTL.tier3)
        }
      };
    }

    try {
      const response = await fetch(`/api/opal/tier3/${tier1}/${tier2}/${tier3}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-OPAL-Tier': '3'
        }
      });

      if (response.ok) {
        const data = await response.json();
        this.setCacheData(cacheKey, data, this.CACHE_TTL.tier3);

        return {
          data,
          metadata: {
            tier: 'tier3',
            source: 'api',
            timestamp: new Date().toISOString(),
            freshness: 'fresh',
            nextRefresh: new Date(Date.now() + this.CACHE_TTL.tier3).toISOString()
          }
        };
      }
    } catch (error) {
      console.warn(`Tier-3 API error for ${tier1}/${tier2}/${tier3}:`, error);
    }

    // Fallback to mock data
    const mockData = await this.generateTier3MockData(tier1, tier2, tier3);
    return {
      data: mockData,
      metadata: {
        tier: 'tier3',
        source: 'mock',
        timestamp: new Date().toISOString(),
        freshness: 'fresh'
      }
    };
  }

  /**
   * Fetch all tier data in a single request (optimized for performance)
   */
  async fetchAllTierData(request: TierDataRequest): Promise<{
    tier1: TierDataResponse<Tier1SummaryMetrics>;
    tier2?: TierDataResponse<Tier2SectionKPIs>;
    tier3?: TierDataResponse<Tier3DetailedContent>;
  }> {
    const results: any = {};

    // Always fetch tier-1
    results.tier1 = await this.fetchTier1Data(request.tier1);

    // Fetch tier-2 if specified
    if (request.tier2) {
      results.tier2 = await this.fetchTier2Data(request.tier1, request.tier2);
    }

    // Fetch tier-3 if specified
    if (request.tier3 && request.tier2) {
      results.tier3 = await this.fetchTier3Data(request.tier1, request.tier2, request.tier3);
    }

    return results;
  }

  // Cache management methods
  private getCachedData(key: string) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached;
    }
    return null;
  }

  private setCacheData(key: string, data: any, ttl: number) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  private getFreshness(timestamp: number, ttl: number): 'fresh' | 'stale' | 'expired' {
    const age = Date.now() - timestamp;
    if (age < ttl * 0.5) return 'fresh';
    if (age < ttl) return 'stale';
    return 'expired';
  }

  // Mock data generators for each tier
  private async generateTier1MockData(tier1: string): Promise<Tier1SummaryMetrics> {
    await new Promise(resolve => setTimeout(resolve, 300)); // Simulate network delay

    const baseMetrics = {
      'strategy-plans': {
        score: 78,
        status: 'good' as const,
        trend: 'improving' as const,
        totalUsers: 12500,
        engagementRate: 68.4,
        conversionRate: 4.2,
        revenueImpact: 1250000,
        experimentVelocity: 8
      },
      'optimizely-dxp-tools': {
        score: 92,
        status: 'excellent' as const,
        trend: 'stable' as const,
        totalUsers: 45000,
        engagementRate: 74.2,
        conversionRate: 6.1,
        revenueImpact: 2800000,
        experimentVelocity: 15
      },
      'analytics-insights': {
        score: 84,
        status: 'good' as const,
        trend: 'improving' as const,
        totalUsers: 28000,
        engagementRate: 71.8,
        conversionRate: 5.3,
        revenueImpact: 1950000,
        experimentVelocity: 12
      },
      'experience-optimization': {
        score: 89,
        status: 'excellent' as const,
        trend: 'improving' as const,
        totalUsers: 35000,
        engagementRate: 76.3,
        conversionRate: 7.2,
        revenueImpact: 3200000,
        experimentVelocity: 18
      }
    };

    const metrics = baseMetrics[tier1 as keyof typeof baseMetrics] || baseMetrics['strategy-plans'];

    return {
      overallHealth: {
        score: metrics.score,
        status: metrics.status,
        trend: metrics.trend
      },
      keyMetrics: {
        totalUsers: metrics.totalUsers,
        engagementRate: metrics.engagementRate,
        conversionRate: metrics.conversionRate,
        revenueImpact: metrics.revenueImpact,
        experimentVelocity: metrics.experimentVelocity
      },
      systemStatus: {
        apiHealth: 'healthy',
        dataFreshness: 'near-real-time',
        integrationStatus: 'connected'
      },
      alerts: [
        {
          type: 'info',
          message: `${tier1.replace(/-/g, ' ')} system operating normally`,
          timestamp: new Date().toISOString()
        }
      ]
    };
  }

  private async generateTier2MockData(tier1: string, tier2: string): Promise<Tier2SectionKPIs> {
    await new Promise(resolve => setTimeout(resolve, 200));

    // Generate section-specific KPIs based on tier1 and tier2
    const sectionMetrics = {
      'strategy-plans': {
        'phases': {
          primary: [
            { name: 'Phase Completion Rate', value: 75, unit: '%', target: 80, trend: 8.2, trendDirection: 'up' as const },
            { name: 'Milestone Achievement', value: 12, unit: 'milestones', target: 15, trend: 2, trendDirection: 'up' as const },
            { name: 'Risk Mitigation Score', value: 87, unit: 'score', target: 90, trend: -1.5, trendDirection: 'down' as const }
          ],
          score: 82
        },
        'osa': {
          primary: [
            { name: 'Integration Health', value: 94, unit: '%', target: 95, trend: 2.1, trendDirection: 'up' as const },
            { name: 'Data Sync Rate', value: 99.2, unit: '%', target: 99.5, trend: 0.8, trendDirection: 'up' as const }
          ],
          score: 91
        }
      },
      'optimizely-dxp-tools': {
        'webx': {
          primary: [
            { name: 'Active Experiments', value: 6, unit: 'experiments', target: 8, trend: 1, trendDirection: 'up' as const },
            { name: 'Statistical Power', value: 85, unit: '%', target: 80, trend: 5.2, trendDirection: 'up' as const },
            { name: 'Conversion Uplift', value: 12.3, unit: '%', target: 10, trend: 3.1, trendDirection: 'up' as const }
          ],
          score: 88
        }
      },
      'analytics-insights': {
        'content': {
          primary: [
            { name: 'Content Engagement', value: 68.4, unit: '%', target: 70, trend: 4.2, trendDirection: 'up' as const },
            { name: 'Topic Coverage', value: 142, unit: 'topics', target: 150, trend: 12, trendDirection: 'up' as const }
          ],
          score: 79
        }
      }
    };

    const tierData = sectionMetrics[tier1 as keyof typeof sectionMetrics];
    const sectionData = tierData?.[tier2 as keyof typeof tierData] || {
      primary: [
        { name: 'Performance Score', value: 75, unit: 'score', target: 80, trend: 2.1, trendDirection: 'up' as const }
      ],
      score: 75
    };

    return {
      sectionId: `${tier1}-${tier2}`,
      sectionName: tier2.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      kpis: {
        primary: sectionData.primary,
        secondary: [
          { name: 'Last Updated', value: '2 minutes ago' },
          { name: 'Data Quality', value: '99.1%' },
          { name: 'Active Users', value: '1,247' }
        ]
      },
      performance: {
        score: sectionData.score,
        benchmarks: {
          industry: 71,
          internal: 78,
          target: 85
        }
      },
      insights: [
        {
          type: 'opportunity',
          title: 'Optimization Potential Identified',
          description: `${tier2} section shows potential for 15% improvement through enhanced targeting`,
          priority: 'medium',
          impact: 'Could increase conversion rate by 1.8%'
        }
      ]
    };
  }

  private async generateTier3MockData(tier1: string, tier2: string, tier3: string): Promise<Tier3DetailedContent> {
    await new Promise(resolve => setTimeout(resolve, 150));

    return {
      pageId: `${tier1}-${tier2}-${tier3}`,
      pageName: tier3.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      contentType: this.inferContentType(tier1),
      data: {
        charts: [
          {
            id: 'trend-chart',
            type: 'line',
            title: 'Performance Trend',
            data: Array.from({ length: 30 }, (_, i) => ({
              date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              value: Math.floor(Math.random() * 20) + 60 + Math.sin(i / 5) * 10
            }))
          },
          {
            id: 'distribution-chart',
            type: 'bar',
            title: 'Distribution Analysis',
            data: [
              { category: 'Category A', value: 45 },
              { category: 'Category B', value: 32 },
              { category: 'Category C', value: 28 },
              { category: 'Category D', value: 19 }
            ]
          }
        ],
        tables: [
          {
            id: 'performance-table',
            title: 'Performance Breakdown',
            headers: ['Metric', 'Current', 'Previous', 'Change'],
            rows: [
              ['Conversion Rate', '4.2%', '3.8%', '+10.5%'],
              ['Engagement Score', '78.4', '74.1', '+5.8%'],
              ['User Satisfaction', '4.3/5', '4.1/5', '+4.9%']
            ],
            sortable: true
          }
        ],
        metrics: [
          {
            id: 'primary-metric',
            name: 'Performance Score',
            value: 84.2,
            format: 'number',
            comparison: {
              previous: 79.1,
              change: 5.1,
              changeType: 'percentage'
            }
          },
          {
            id: 'revenue-metric',
            name: 'Revenue Impact',
            value: 125000,
            format: 'currency',
            comparison: {
              previous: 118500,
              change: 6500,
              changeType: 'absolute'
            }
          }
        ],
        content: {
          summary: `Detailed analysis of ${tier3} performance within ${tier2} section of ${tier1}.`,
          recommendations: [
            {
              title: 'Optimize Performance',
              description: 'Implement advanced targeting to improve conversion rates',
              priority: 'high',
              actionItems: [
                'Review current segmentation strategy',
                'A/B test new targeting parameters',
                'Monitor performance metrics closely'
              ]
            }
          ]
        }
      },
      enrichment: {
        aiInsights: [
          {
            type: 'prediction',
            title: 'Performance Forecast',
            description: 'Based on current trends, expect 12% improvement over next 30 days',
            confidence: 87,
            source: 'AI Predictive Model v2.1'
          }
        ],
        contextualData: {
          relatedPages: [`${tier1}-${tier2}-related`, `${tier1}-overview`],
          dependencies: ['data-sync-service', 'analytics-engine'],
          tags: [tier1, tier2, tier3, 'performance', 'optimization']
        }
      }
    };
  }

  private inferContentType(tier1: string): Tier3DetailedContent['contentType'] {
    if (tier1.includes('analytics')) return 'analytics';
    if (tier1.includes('experiment') || tier1.includes('optimization')) return 'experiments';
    if (tier1.includes('strategy')) return 'strategy';
    return 'tools';
  }

  /**
   * Clear cache (useful for testing or forced refresh)
   */
  clearCache(pattern?: string) {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      memory: JSON.stringify(Array.from(this.cache.entries())).length
    };
  }
}

// Export singleton instance
export const opalDataService = new OPALDataService();