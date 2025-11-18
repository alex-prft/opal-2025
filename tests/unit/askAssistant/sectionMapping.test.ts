/**
 * Unit tests for Ask Assistant Section Mapping
 *
 * These tests prevent regression of the bug where section mapping
 * returned incorrect keys due to overly broad pathname matching.
 */

import { getResultsSectionKey, getSourcePath } from '@/lib/askAssistant/sectionMapping';

describe('Ask Assistant Section Mapping', () => {
  describe('getResultsSectionKey', () => {
    describe('Strategy Plans mapping', () => {
      it('should return strategy:quick-wins for quick-wins tier2', () => {
        const result = getResultsSectionKey('strategy-plans', 'quick-wins', undefined, '/engine/results/strategy-plans/quick-wins');
        expect(result).toBe('strategy:quick-wins');
      });

      it('should return strategy:osa for osa tier2', () => {
        const result = getResultsSectionKey('strategy-plans', 'osa', undefined, '/engine/results/strategy-plans/osa');
        expect(result).toBe('strategy:osa');
      });

      it('should return strategy:maturity for maturity tier2', () => {
        const result = getResultsSectionKey('strategy-plans', 'maturity', undefined, '/engine/results/strategy-plans/maturity');
        expect(result).toBe('strategy:maturity');
      });

      it('should return strategy:phases for phases tier2', () => {
        const result = getResultsSectionKey('strategy-plans', 'phases', undefined, '/engine/results/strategy-plans/phases');
        expect(result).toBe('strategy:phases');
      });

      it('should return strategy:roadmap for roadmap tier2', () => {
        const result = getResultsSectionKey('strategy-plans', 'roadmap', undefined, '/engine/results/strategy-plans/roadmap');
        expect(result).toBe('strategy:roadmap');
      });

      it('should default to strategy:osa when tier2 is not provided', () => {
        const result = getResultsSectionKey('strategy-plans', undefined, undefined, '/engine/results/strategy-plans');
        expect(result).toBe('strategy:osa');
      });

      it('should default to strategy:osa for unknown tier2', () => {
        const result = getResultsSectionKey('strategy-plans', 'unknown-section', undefined, '/engine/results/strategy-plans/unknown-section');
        expect(result).toBe('strategy:osa');
      });
    });

    describe('Direct pathname mapping (exact matches only)', () => {
      it('should return strategy:osa for exact /engine/results/strategy path', () => {
        const result = getResultsSectionKey(undefined, undefined, undefined, '/engine/results/strategy');
        expect(result).toBe('strategy:osa');
      });

      it('should return analytics:content for exact /engine/results/insights path', () => {
        const result = getResultsSectionKey(undefined, undefined, undefined, '/engine/results/insights');
        expect(result).toBe('analytics:content');
      });

      it('should NOT use direct pathname mapping for nested paths', () => {
        // This should use tier-based routing, not direct pathname mapping
        const result = getResultsSectionKey('strategy-plans', 'quick-wins', undefined, '/engine/results/strategy-plans/quick-wins');
        expect(result).toBe('strategy:quick-wins');
        expect(result).not.toBe('strategy:osa');
      });
    });

    describe('Regression test for pathname matching bug', () => {
      it('should NOT incorrectly return strategy:osa for strategy-plans/quick-wins URL', () => {
        // This was the original bug - pathname contained '/results/strategy'
        // so it returned 'strategy:osa' instead of using tier-based logic
        const result = getResultsSectionKey('strategy-plans', 'quick-wins', undefined, '/engine/results/strategy-plans/quick-wins');

        expect(result).toBe('strategy:quick-wins');
        expect(result).not.toBe('strategy:osa');
      });

      it('should use tier-based routing for all nested strategy pages', () => {
        const testCases = [
          { tier1: 'strategy-plans', tier2: 'quick-wins', expected: 'strategy:quick-wins' },
          { tier1: 'strategy-plans', tier2: 'maturity', expected: 'strategy:maturity' },
          { tier1: 'strategy-plans', tier2: 'phases', expected: 'strategy:phases' },
          { tier1: 'strategy-plans', tier2: 'roadmap', expected: 'strategy:roadmap' },
        ];

        testCases.forEach(({ tier1, tier2, expected }) => {
          const pathname = `/engine/results/${tier1}/${tier2}`;
          const result = getResultsSectionKey(tier1, tier2, undefined, pathname);

          expect(result).toBe(expected);
          expect(result).not.toBe('strategy:osa'); // Should not default to OSA
        });
      });
    });

    describe('Analytics section mapping', () => {
      it('should return analytics:content for content tier2', () => {
        const result = getResultsSectionKey('analytics-insights', 'content', undefined, '/engine/results/analytics-insights/content');
        expect(result).toBe('analytics:content');
      });

      it('should return analytics:audiences for audiences tier2', () => {
        const result = getResultsSectionKey('analytics-insights', 'audiences', undefined, '/engine/results/analytics-insights/audiences');
        expect(result).toBe('analytics:audiences');
      });
    });

    describe('Experience Optimization section mapping', () => {
      it('should return experience:content for content tier2', () => {
        const result = getResultsSectionKey('experience-optimization', 'content', undefined, '/engine/results/experience-optimization/content');
        expect(result).toBe('experience:content');
      });

      it('should return experience:content:ai-for-seo for ai-for-seo tier3', () => {
        const result = getResultsSectionKey('experience-optimization', 'content', 'ai-for-seo', '/engine/results/experience-optimization/content/ai-for-seo');
        expect(result).toBe('experience:content:ai-for-seo');
      });
    });

    describe('DXP Tools section mapping', () => {
      it('should return dxp:content-recs for content-recs tier2', () => {
        const result = getResultsSectionKey('optimizely-dxp-tools', 'content-recs', undefined, '/engine/results/optimizely-dxp-tools/content-recs');
        expect(result).toBe('dxp:content-recs');
      });
    });

    describe('Edge cases', () => {
      it('should return null when no tier1 is provided and pathname does not match', () => {
        const result = getResultsSectionKey(undefined, undefined, undefined, '/some/other/path');
        expect(result).toBeNull();
      });

      it('should handle empty strings gracefully', () => {
        const result = getResultsSectionKey('', '', undefined, '');
        expect(result).toBeNull();
      });

      it('should be case insensitive for tier parameters', () => {
        const result = getResultsSectionKey('STRATEGY-PLANS', 'QUICK-WINS', undefined, '/engine/results/strategy-plans/quick-wins');
        expect(result).toBe('strategy:quick-wins');
      });
    });
  });

  describe('getSourcePath', () => {
    it('should construct correct path from tier parameters', () => {
      const result = getSourcePath('strategy-plans', 'quick-wins', undefined, undefined);
      expect(result).toBe('/engine/results/strategy-plans/quick-wins');
    });

    it('should return provided pathname if it starts with /engine/results/', () => {
      const pathname = '/engine/results/strategy-plans/quick-wins';
      const result = getSourcePath('strategy-plans', 'quick-wins', undefined, pathname);
      expect(result).toBe(pathname);
    });

    it('should handle tier3 parameter', () => {
      const result = getSourcePath('experience-optimization', 'content', 'ai-for-seo', undefined);
      expect(result).toBe('/engine/results/experience-optimization/content/ai-for-seo');
    });
  });
});