/**
 * OPAL Data Fetching Hook
 * Handles API integration for widget data
 */

import { useState, useEffect } from 'react';
import { OPALData } from '@/lib/widget-config';

export interface UseOPALDataResult {
  data: OPALData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useOPALData(section: string, tier2?: string, tier3?: string): UseOPALDataResult {
  const [data, setData] = useState<OPALData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Construct API endpoint based on section and tiers
      let endpoint = `/api/opal/data/${section}`;
      if (tier2) endpoint += `/${tier2}`;
      if (tier3) endpoint += `/${tier3}`;

      const response = await fetch(endpoint);

      if (!response.ok) {
        // Fallback to mock data if API not available
        const mockData = await generateMockData(section);
        setData(mockData);
        return;
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      console.warn(`OPAL API not available for ${section}, using mock data`);
      // Fallback to mock data
      const mockData = await generateMockData(section);
      setData(mockData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [section, tier2, tier3]);

  return {
    data,
    loading,
    error,
    refetch: fetchData
  };
}

/**
 * Generate mock data for development and testing
 */
async function generateMockData(section: string): Promise<OPALData> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  const baseData: OPALData = {};

  switch (section) {
    case 'strategy-plans':
      return {
        ...baseData,
        confidenceScore: 85,
        roadmapData: [
          { phase: 'Foundation', duration: '0-3 months', status: 'in-progress', confidence: 90 },
          { phase: 'Growth', duration: '3-6 months', status: 'planned', confidence: 75 },
          { phase: 'Optimization', duration: '6-12 months', status: 'planned', confidence: 60 },
          { phase: 'Innovation', duration: '12+ months', status: 'planned', confidence: 45 }
        ],
        maturityData: {
          currentLevel: 'Developing',
          targetLevel: 'Optimizing',
          assessment: {
            strategy: 7,
            technology: 6,
            data: 5,
            organization: 6,
            governance: 4
          },
          gaps: [
            { area: 'Data Governance', priority: 'high', effort: 'medium' },
            { area: 'Advanced Analytics', priority: 'medium', effort: 'high' }
          ]
        },
        performanceMetrics: [
          { metric: 'Engagement Rate', current: 3.2, target: 4.5, trend: 'up' },
          { metric: 'Conversion Rate', current: 2.8, target: 3.5, trend: 'up' },
          { metric: 'Page Load Speed', current: 2.1, target: 1.5, trend: 'down' }
        ],
        phaseData: [
          {
            phase: 1,
            name: 'Foundation',
            milestones: ['OPAL Setup', 'Data Integration', 'Basic Analytics'],
            progress: 75,
            risks: ['Data Quality', 'Resource Allocation']
          },
          {
            phase: 2,
            name: 'Growth',
            milestones: ['Personalization', 'A/B Testing', 'Advanced Segmentation'],
            progress: 25,
            risks: ['Technical Complexity', 'Change Management']
          }
        ]
      };

    case 'optimizely-dxp-tools':
      return {
        ...baseData,
        integrationStatus: {
          overall: 'healthy',
          sdk: { status: 'connected', latency: 45, uptime: 99.8 },
          api: { status: 'connected', responseTime: 120, errorRate: 0.02 },
          webhook: { status: 'active', eventsPerHour: 1250, successRate: 99.5 },
          sse: { status: 'connected', connections: 42, avgLatency: 35 }
        },
        performanceData: {
          throughput: { current: 1500, max: 2000, unit: 'requests/min' },
          errorRates: [
            { service: 'Content Recs', rate: 0.01 },
            { service: 'CMS', rate: 0.02 },
            { service: 'ODP', rate: 0.005 },
            { service: 'WebX', rate: 0.015 }
          ],
          responseTime: { p50: 85, p95: 180, p99: 320 }
        },
        freshnessMetrics: {
          dataAge: { content: '2 minutes', analytics: '5 minutes', experiments: '30 seconds' },
          syncStatus: { lastSync: '2024-11-13T10:30:00Z', nextSync: '2024-11-13T11:00:00Z' }
        }
      };

    case 'analytics-insights':
      return {
        ...baseData,
        analyticsData: {
          totalPageViews: 125000,
          uniqueVisitors: 45000,
          averageSessionDuration: 185,
          bounceRate: 35.2,
          conversionRate: 2.8
        },
        contentTopics: [
          { topic: 'Product Features', count: 45, engagement: 4.2 },
          { topic: 'Customer Success', count: 32, engagement: 3.8 },
          { topic: 'Technical Guides', count: 28, engagement: 4.5 },
          { topic: 'Industry Trends', count: 22, engagement: 3.1 }
        ],
        topContent: [
          { title: 'Getting Started Guide', views: 8500, engagement: 4.7, lastUpdated: '2024-11-10' },
          { title: 'Advanced Features', views: 6200, engagement: 4.2, lastUpdated: '2024-11-08' },
          { title: 'Best Practices', views: 5800, engagement: 4.0, lastUpdated: '2024-11-12' }
        ],
        userInteractions: {
          clickHeatmap: [
            { x: 150, y: 200, intensity: 85 },
            { x: 300, y: 150, intensity: 72 },
            { x: 450, y: 300, intensity: 91 }
          ],
          scrollDepth: { avg: 65, segments: [45, 65, 85, 95] }
        },
        engagementTrends: [
          { date: '2024-11-01', engagement: 3.2, sessions: 1200 },
          { date: '2024-11-02', engagement: 3.5, sessions: 1350 },
          { date: '2024-11-03', engagement: 3.8, sessions: 1180 }
        ],
        visibilityMetrics: {
          searchVisibility: 78,
          aiVisibility: 65,
          semanticMatches: 142,
          keywordRankings: [
            { keyword: 'personalization platform', position: 3, volume: 5400 },
            { keyword: 'content optimization', position: 7, volume: 2800 }
          ]
        },
        semanticData: {
          concepts: [
            { concept: 'User Experience', relevance: 0.95, entities: 28 },
            { concept: 'Digital Marketing', relevance: 0.88, entities: 35 }
          ],
          relationships: [
            { from: 'Personalization', to: 'Conversion', strength: 0.82 },
            { from: 'Content Quality', to: 'Engagement', strength: 0.91 }
          ]
        },
        geoData: {
          regions: [
            { country: 'United States', visitors: 15000, engagement: 4.2 },
            { country: 'United Kingdom', visitors: 8500, engagement: 3.9 },
            { country: 'Germany', visitors: 6200, engagement: 4.0 }
          ],
          cities: [
            { city: 'New York', visitors: 3200, conversionRate: 3.1 },
            { city: 'London', visitors: 2800, conversionRate: 2.9 },
            { city: 'San Francisco', visitors: 2400, conversionRate: 3.8 }
          ]
        }
      };

    case 'experience-optimization':
      return {
        ...baseData,
        experimentPlans: [
          {
            id: 'exp-001',
            name: 'Homepage Hero Optimization',
            hypothesis: 'Changing CTA button color will increase conversions',
            status: 'running',
            confidence: 95,
            uplift: 12.5,
            variants: ['Control', 'Blue Button', 'Green Button']
          },
          {
            id: 'exp-002',
            name: 'Product Page Layout',
            hypothesis: 'Sidebar testimonials will build trust',
            status: 'planned',
            expectedLift: 8.0,
            variants: ['Current', 'With Testimonials']
          }
        ],
        testResults: [
          {
            experiment: 'Navigation Simplification',
            winner: 'Variant B',
            improvement: 15.2,
            significance: 99.1,
            sampleSize: 25000
          }
        ],
        businessImpact: {
          totalUplift: 18.7,
          revenueImpact: 125000,
          conversionsAdded: 450,
          experimentsRun: 12,
          winRate: 67
        },
        personalizationRules: [
          {
            id: 'rule-001',
            name: 'Returning Visitor Welcome',
            audience: 'Returning Visitors',
            active: true,
            performance: { ctr: 4.2, engagement: 3.8 }
          },
          {
            id: 'rule-002',
            name: 'Geographic Product Recommendations',
            audience: 'EU Visitors',
            active: true,
            performance: { ctr: 3.1, engagement: 4.1 }
          }
        ],
        uxMetrics: {
          userSatisfaction: 4.2,
          taskCompletionRate: 87,
          timeToComplete: 145,
          errorRate: 2.1,
          pathAnalysis: [
            { path: 'Home → Product → Purchase', users: 1200, conversionRate: 12.5 },
            { path: 'Home → Search → Product → Purchase', users: 800, conversionRate: 8.3 }
          ]
        },
        testSchedule: [
          {
            week: 'Week 1',
            tests: ['Homepage CTA', 'Product Gallery'],
            status: 'completed',
            results: ['14% uplift', 'No significant change']
          },
          {
            week: 'Week 2',
            tests: ['Checkout Flow', 'Mobile Navigation'],
            status: 'running',
            expectedCompletion: '2024-11-20'
          }
        ]
      };

    default:
      return baseData;
  }
}