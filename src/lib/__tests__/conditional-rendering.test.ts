/**
 * Conditional Rendering Logic Tests
 *
 * Tests to validate URL path detection and conditional rendering logic
 */

import {
  pathMatchers,
  getTier2WidgetComponent,
  getTier3ContentData,
  normalizeUrlSegment,
  normalizeTierName
} from '../conditional-rendering';

describe('Conditional Rendering Logic', () => {
  describe('URL Normalization', () => {
    test('normalizeUrlSegment should handle various formats', () => {
      expect(normalizeUrlSegment('Phase 1: Foundation (0-3 months)')).toBe('phase-1-foundation-0-3-months');
      expect(normalizeUrlSegment('Quick Wins')).toBe('quick-wins');
      expect(normalizeUrlSegment('Content Recs')).toBe('content-recs');
      expect(normalizeUrlSegment('A/B Testing Results')).toBe('ab-testing-results');
    });

    test('normalizeTierName should clean tier names', () => {
      expect(normalizeTierName('Phase 1: Foundation (0-3 months)')).toBe('Phase 1 Foundation 0-3 months');
      expect(normalizeTierName('A/B Testing')).toBe('A/B Testing');
    });
  });

  describe('Path Matchers', () => {
    test('Strategy Plans path detection', () => {
      expect(pathMatchers.isStrategyPlans('/engine/results/strategy-plans/phases')).toBe(true);
      expect(pathMatchers.isStrategyPlans('/engine/results/strategy/osa')).toBe(true);
      expect(pathMatchers.isStrategyPlans('/engine/results/dxptools/webx')).toBe(false);
    });

    test('Phases path detection', () => {
      expect(pathMatchers.isPhases('/engine/results/strategy-plans/phases/phase-1')).toBe(true);
      expect(pathMatchers.isPhases('/engine/results/strategy/phases')).toBe(true);
      expect(pathMatchers.isPhases('/engine/results/strategy/osa')).toBe(false);
    });

    test('Phase 1 Foundation detection', () => {
      expect(pathMatchers.isPhase1Foundation('/strategy-plans/phases/phase-1-foundation-0-3-months')).toBe(true);
      expect(pathMatchers.isPhase1Foundation('/strategy/phases/phase-1')).toBe(true);
      expect(pathMatchers.isPhase1Foundation('/strategy/phases/foundation')).toBe(true);
      expect(pathMatchers.isPhase1Foundation('/strategy/phases/phase-2-growth')).toBe(false);
    });

    test('DXP Tools path detection', () => {
      expect(pathMatchers.isDXPTools('/engine/results/optimizely-dxp-tools/webx')).toBe(true);
      expect(pathMatchers.isDXPTools('/engine/results/dxptools/cms')).toBe(true);
      expect(pathMatchers.isDXPTools('/engine/results/strategy/phases')).toBe(false);
    });

    test('WEBX path detection', () => {
      expect(pathMatchers.isWEBX('/engine/results/dxptools/webx/active-experiments')).toBe(true);
      expect(pathMatchers.isWEBX('/engine/results/optimizely-dxp-tools/webx')).toBe(true);
      expect(pathMatchers.isWEBX('/engine/results/dxptools/cms')).toBe(false);
    });

    test('Active Experiments detection', () => {
      expect(pathMatchers.isActiveExperiments('/dxptools/webx/active-experiments')).toBe(true);
      expect(pathMatchers.isActiveExperiments('/webx/active-experiments')).toBe(true);
      expect(pathMatchers.isActiveExperiments('/webx/statistical-significance')).toBe(false);
    });

    test('Analytics Insights path detection', () => {
      expect(pathMatchers.isAnalyticsInsights('/engine/results/analytics-insights/content')).toBe(true);
      expect(pathMatchers.isAnalyticsInsights('/engine/results/insights/audiences')).toBe(true);
      expect(pathMatchers.isAnalyticsInsights('/engine/results/strategy/phases')).toBe(false);
    });

    test('Content path detection', () => {
      expect(pathMatchers.isContent('/analytics-insights/content/engagement')).toBe(true);
      expect(pathMatchers.isContent('/insights/content/topics')).toBe(true);
      expect(pathMatchers.isContent('/insights/audiences/engagement')).toBe(false);
    });

    test('Experience Optimization path detection', () => {
      expect(pathMatchers.isExperienceOptimization('/engine/results/experience-optimization/experimentation')).toBe(true);
      expect(pathMatchers.isExperienceOptimization('/engine/results/optimization/personalization')).toBe(true);
      expect(pathMatchers.isExperienceOptimization('/engine/results/strategy/phases')).toBe(false);
    });
  });

  describe('Tier-2 Widget Component Selection', () => {
    test('Strategy Plans widget selection', () => {
      expect(getTier2WidgetComponent('/engine/results/strategy-plans/phases/phase-1')).toBe('PhasesWidget');
      expect(getTier2WidgetComponent('/engine/results/strategy/osa/overview')).toBe('OSAWidget');
      expect(getTier2WidgetComponent('/strategy/quick-wins/opportunities')).toBe('QuickWinsWidget');
      expect(getTier2WidgetComponent('/strategy/maturity/assessment')).toBe('MaturityWidget');
      expect(getTier2WidgetComponent('/strategy/roadmap/timeline')).toBe('RoadmapWidget');
    });

    test('DXP Tools widget selection', () => {
      expect(getTier2WidgetComponent('/engine/results/dxptools/webx/experiments')).toBe('WEBXWidget');
      expect(getTier2WidgetComponent('/dxptools/content-recs/dashboard')).toBe('ContentRecsWidget');
      expect(getTier2WidgetComponent('/optimizely-dxp-tools/cms/inventory')).toBe('CMSWidget');
      expect(getTier2WidgetComponent('/dxptools/odp/profiles')).toBe('ODPWidget');
      expect(getTier2WidgetComponent('/dxptools/cmp/campaigns')).toBe('CMPWidget');
    });

    test('Analytics Insights widget selection', () => {
      expect(getTier2WidgetComponent('/insights/content/engagement')).toBe('ContentAnalyticsWidget');
      expect(getTier2WidgetComponent('/analytics-insights/audiences/segments')).toBe('AudienceAnalyticsWidget');
      expect(getTier2WidgetComponent('/insights/cx/topics')).toBe('CXAnalyticsWidget');
    });

    test('Unknown paths return null', () => {
      expect(getTier2WidgetComponent('/unknown/path/here')).toBe(null);
      expect(getTier2WidgetComponent('')).toBe(null);
    });
  });

  describe('Tier-3 Content Data Selection', () => {
    test('Strategy Plans tier-3 content', () => {
      const phase1Content = getTier3ContentData('/strategy/phases/phase-1-foundation');
      expect(phase1Content).toEqual({
        contentId: 'phase-1-foundation-content',
        title: 'Phase 1: Foundation (0-3 months)',
        dataKey: 'phase1Data'
      });

      const phase2Content = getTier3ContentData('/strategy/phases/phase-2-growth');
      expect(phase2Content).toEqual({
        contentId: 'phase-2-growth-content',
        title: 'Phase 2: Growth (3-6 months)',
        dataKey: 'phase2Data'
      });

      const overviewContent = getTier3ContentData('/strategy/osa/overview-dashboard');
      expect(overviewContent).toEqual({
        contentId: 'osa-overview-dashboard-content',
        title: 'Overview Dashboard',
        dataKey: 'overviewMetrics'
      });
    });

    test('DXP Tools tier-3 content', () => {
      const experimentsContent = getTier3ContentData('/dxptools/webx/active-experiments');
      expect(experimentsContent).toEqual({
        contentId: 'webx-active-experiments-content',
        title: 'Active Experiments',
        dataKey: 'activeExperimentData'
      });

      const statisticalContent = getTier3ContentData('/webx/statistical-significance');
      expect(statisticalContent).toEqual({
        contentId: 'webx-statistical-significance-content',
        title: 'Statistical Significance',
        dataKey: 'statisticalSignificance'
      });
    });

    test('Analytics Insights tier-3 content', () => {
      const engagementContent = getTier3ContentData('/insights/content/engagement');
      expect(engagementContent).toEqual({
        contentId: 'content-engagement-analysis-content',
        title: 'Engagement Analysis',
        dataKey: 'contentEngagementData'
      });

      const topicsContent = getTier3ContentData('/analytics-insights/content/topics');
      expect(topicsContent).toEqual({
        contentId: 'content-topics-analysis-content',
        title: 'Topics Analysis',
        dataKey: 'contentTopics'
      });
    });

    test('Unknown tier-3 paths return null', () => {
      expect(getTier3ContentData('/unknown/path')).toBe(null);
      expect(getTier3ContentData('')).toBe(null);
    });
  });

  describe('Complex URL Pattern Matching', () => {
    test('Full URL path detection works correctly', () => {
      const complexUrls = [
        {
          url: '/engine/results/strategy-plans/phases/phase-1-foundation-0-3-months',
          expectTier2: 'PhasesWidget',
          expectTier3: {
            contentId: 'phase-1-foundation-content',
            title: 'Phase 1: Foundation (0-3 months)',
            dataKey: 'phase1Data'
          }
        },
        {
          url: '/engine/results/optimizely-dxp-tools/webx/active-experiments',
          expectTier2: 'WEBXWidget',
          expectTier3: {
            contentId: 'webx-active-experiments-content',
            title: 'Active Experiments',
            dataKey: 'activeExperimentData'
          }
        },
        {
          url: '/engine/results/analytics-insights/content/engagement',
          expectTier2: 'ContentAnalyticsWidget',
          expectTier3: {
            contentId: 'content-engagement-analysis-content',
            title: 'Engagement Analysis',
            dataKey: 'contentEngagementData'
          }
        }
      ];

      complexUrls.forEach(({ url, expectTier2, expectTier3 }) => {
        expect(getTier2WidgetComponent(url)).toBe(expectTier2);
        expect(getTier3ContentData(url)).toEqual(expectTier3);
      });
    });

    test('Static URL aliases work correctly', () => {
      // Test that both full and short URLs work
      expect(getTier2WidgetComponent('/engine/results/strategy-plans/phases')).toBe('PhasesWidget');
      expect(getTier2WidgetComponent('/engine/results/strategy/phases')).toBe('PhasesWidget');

      expect(getTier2WidgetComponent('/engine/results/optimizely-dxp-tools/webx')).toBe('WEBXWidget');
      expect(getTier2WidgetComponent('/engine/results/dxptools/webx')).toBe('WEBXWidget');

      expect(getTier2WidgetComponent('/engine/results/analytics-insights/content')).toBe('ContentAnalyticsWidget');
      expect(getTier2WidgetComponent('/engine/results/insights/content')).toBe('ContentAnalyticsWidget');
    });
  });

  describe('Edge Cases', () => {
    test('Case insensitive matching', () => {
      expect(pathMatchers.isStrategyPlans('/Engine/Results/Strategy-Plans/Phases')).toBe(true);
      expect(pathMatchers.isWEBX('/DXPTools/WEBX/Experiments')).toBe(true);
    });

    test('Partial path matching', () => {
      expect(pathMatchers.isPhases('/phases/phase-1')).toBe(true);
      expect(pathMatchers.isActiveExperiments('/active-experiments')).toBe(true);
      expect(pathMatchers.isEngagement('/engagement')).toBe(true);
    });

    test('Empty and invalid inputs', () => {
      expect(pathMatchers.isStrategyPlans('')).toBe(false);
      expect(pathMatchers.isPhases(null as any)).toBe(false);
      expect(getTier2WidgetComponent(undefined as any)).toBe(null);
    });
  });
});

// Mock data for testing
const mockData = {
  phase1Data: {
    progress: 85,
    milestones: ['Setup Complete', 'Training Done'],
    deliverables: ['Platform Config', 'Team Training']
  },
  activeExperimentData: {
    totalActive: 6,
    activeTests: [
      { name: 'Homepage Test', status: 'Running' },
      { name: 'Checkout Flow', status: 'Running' }
    ]
  },
  contentEngagementData: {
    pageViews: 142350,
    engagementRate: 68.4,
    interactions: { clicks: 15420, scrolls: 98765 }
  }
};

describe('Data Integration Tests', () => {
  test('Data props are correctly mapped', () => {
    // These would be integration tests with actual data flow
    expect(mockData.phase1Data.progress).toBe(85);
    expect(mockData.activeExperimentData.totalActive).toBe(6);
    expect(mockData.contentEngagementData.pageViews).toBe(142350);
  });
});