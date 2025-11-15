/**
 * Unit Tests for NaN Children Fix
 *
 * Tests to ensure that numeric formatting utilities prevent NaN from being rendered
 * as React children, which would cause console warnings.
 */

import { describe, it, expect } from 'vitest';
import {
  safeRound,
  safeFloor,
  safeCeil,
  safePercentage,
  safeConfidenceScore,
  safeNumericDisplay,
  safeAverage,
  safeScoreDisplay,
  isSafeForRendering,
  makeSafeForChildren
} from '@/lib/utils/number-formatting';

describe('Number Formatting Utilities - NaN Prevention', () => {
  describe('safeRound', () => {
    it('should handle valid numbers correctly', () => {
      expect(safeRound(3.14159)).toBe(3);
      expect(safeRound(2.7)).toBe(3);
      expect(safeRound(0.3)).toBe(0);
    });

    it('should return fallback for NaN inputs', () => {
      expect(safeRound(NaN)).toBe(0);
      expect(safeRound(NaN, 42)).toBe(42);
    });

    it('should return fallback for Infinity inputs', () => {
      expect(safeRound(Infinity)).toBe(0);
      expect(safeRound(-Infinity)).toBe(0);
    });

    it('should return fallback for non-number inputs', () => {
      expect(safeRound('not a number')).toBe(0);
      expect(safeRound(undefined)).toBe(0);
      expect(safeRound(null)).toBe(0);
      expect(safeRound({})).toBe(0);
    });
  });

  describe('safeConfidenceScore', () => {
    it('should format decimal confidence scores correctly', () => {
      expect(safeConfidenceScore(0.85)).toBe('85%');
      expect(safeConfidenceScore(0.42)).toBe('42%');
      expect(safeConfidenceScore(1.0)).toBe('100%');
    });

    it('should format percentage confidence scores correctly', () => {
      expect(safeConfidenceScore(85)).toBe('85%');
      expect(safeConfidenceScore(42)).toBe('42%');
      expect(safeConfidenceScore(100)).toBe('100%');
    });

    it('should handle NaN inputs gracefully', () => {
      expect(safeConfidenceScore(NaN)).toBe('75%');
      expect(safeConfidenceScore(NaN, 90)).toBe('90%');
    });

    it('should handle invalid inputs gracefully', () => {
      expect(safeConfidenceScore('invalid')).toBe('75%');
      expect(safeConfidenceScore(undefined)).toBe('75%');
      expect(safeConfidenceScore(null)).toBe('75%');
    });

    it('should clamp values to reasonable bounds', () => {
      expect(safeConfidenceScore(-10)).toBe('0%');
      expect(safeConfidenceScore(150)).toBe('100%');
      expect(safeConfidenceScore(1.5)).toBe('100%'); // 1.5 * 100 = 150%, clamped to 100%
    });
  });

  describe('safeAverage', () => {
    it('should calculate valid averages correctly', () => {
      expect(safeAverage([1, 2, 3, 4, 5])).toBe(3);
      expect(safeAverage([10, 20])).toBe(15);
      expect(safeAverage([0.5, 0.7, 0.9])).toBeCloseTo(0.7, 10);
    });

    it('should handle arrays with NaN values', () => {
      expect(safeAverage([1, NaN, 3])).toBe(2); // Average of [1, 3]
      expect(safeAverage([NaN, NaN, NaN])).toBe(0); // All invalid, use fallback
    });

    it('should handle mixed invalid values', () => {
      expect(safeAverage([1, 'invalid', 3, Infinity, 5])).toBe(3); // Average of [1, 3, 5]
    });

    it('should handle empty arrays', () => {
      expect(safeAverage([])).toBe(0);
      expect(safeAverage([], 42)).toBe(42);
    });

    it('should handle non-arrays gracefully', () => {
      expect(safeAverage('not an array')).toBe(0);
      expect(safeAverage(null)).toBe(0);
    });
  });

  describe('makeSafeForChildren', () => {
    it('should pass through valid numbers', () => {
      expect(makeSafeForChildren(42)).toBe(42);
      expect(makeSafeForChildren(0)).toBe(0);
      expect(makeSafeForChildren(-5.5)).toBe(-5.5);
    });

    it('should replace NaN with fallback', () => {
      expect(makeSafeForChildren(NaN)).toBe(0);
      expect(makeSafeForChildren(NaN, 'fallback')).toBe('fallback');
    });

    it('should replace Infinity with fallback', () => {
      expect(makeSafeForChildren(Infinity)).toBe(0);
      expect(makeSafeForChildren(-Infinity)).toBe(0);
    });

    it('should pass through non-numbers safely', () => {
      expect(makeSafeForChildren('hello')).toBe('hello');
      expect(makeSafeForChildren(true)).toBe(true);
      expect(makeSafeForChildren(null)).toBe(null);
    });
  });

  describe('isSafeForRendering', () => {
    it('should identify safe numbers', () => {
      expect(isSafeForRendering(42)).toBe(true);
      expect(isSafeForRendering(0)).toBe(true);
      expect(isSafeForRendering(-3.14)).toBe(true);
    });

    it('should identify unsafe numbers', () => {
      expect(isSafeForRendering(NaN)).toBe(false);
      expect(isSafeForRendering(Infinity)).toBe(false);
      expect(isSafeForRendering(-Infinity)).toBe(false);
    });

    it('should consider non-numbers as safe', () => {
      expect(isSafeForRendering('text')).toBe(true);
      expect(isSafeForRendering(true)).toBe(true);
      expect(isSafeForRendering({})).toBe(true);
      expect(isSafeForRendering(null)).toBe(true);
    });
  });

  describe('Edge Cases and Integration', () => {
    it('should handle division by zero gracefully', () => {
      const result = safeRound(5 / 0); // Results in Infinity
      expect(result).toBe(0); // Fallback value
    });

    it('should handle Math operations that result in NaN', () => {
      const result = safeRound(Math.sqrt(-1)); // Results in NaN
      expect(result).toBe(0); // Fallback value
    });

    it('should handle undefined properties from API responses', () => {
      const apiResponse: any = { someValue: undefined };
      expect(safeConfidenceScore(apiResponse.someValue)).toBe('75%');
      expect(safeRound(apiResponse.confidence_score)).toBe(0);
    });

    it('should handle null values from database queries', () => {
      const dbResult: any = { confidence: null, score: null };
      expect(safeConfidenceScore(dbResult.confidence)).toBe('75%');
      expect(safeScoreDisplay(dbResult.score, 100)).toBe('0/100');
    });
  });

  describe('Real-world OPAL scenarios', () => {
    it('should handle confidence score calculations with missing data', () => {
      const scores = [0.85, undefined, NaN, 0.72];
      const average = safeAverage(scores); // Should only use 0.85 and 0.72
      expect(average).toBeCloseTo(0.785, 2);
    });

    it('should handle Math.round chains that could produce NaN', () => {
      const confidence = NaN;
      const percentage = safeRound(confidence * 100, 75);
      expect(percentage).toBe(75);
    });

    it('should handle complex calculations safely', () => {
      const data: any = {
        tier1: { metadata: { confidence_score: undefined } },
        tier2: { metadata: { confidence_score: NaN } },
        tier3: { metadata: { confidence_score: 0.88 } }
      };

      const scores = [
        data.tier1.metadata?.confidence_score,
        data.tier2.metadata?.confidence_score,
        data.tier3.metadata?.confidence_score
      ];

      const overallConfidence = safeAverage(scores, 0.75);
      expect(overallConfidence).toBe(0.88); // Only tier3 has valid data
    });
  });
});

describe('React Children Safety', () => {
  it('should never produce values that would cause React warnings', () => {
    const problematicInputs = [
      NaN,
      Infinity,
      -Infinity,
      undefined,
      null,
      'not a number',
      {},
      []
    ];

    problematicInputs.forEach(input => {
      const safeValue = makeSafeForChildren(input, 0);
      expect(isSafeForRendering(safeValue)).toBe(true);
    });
  });

  it('should handle confidence score rendering scenarios', () => {
    const testCases = [
      { input: NaN, expected: '75%' },
      { input: undefined, expected: '75%' },
      { input: 'invalid', expected: '75%' },
      { input: Infinity, expected: '75%' },
      { input: 0.85, expected: '85%' },
      { input: 95, expected: '95%' }
    ];

    testCases.forEach(({ input, expected }) => {
      const result = safeConfidenceScore(input);
      expect(result).toBe(expected);
    });
  });
});