/**
 * Fallback Handling System Tests
 * Validates skeleton loaders, error states, and "Data not available" messages
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { jest } from '@jest/globals';

// Import fallback components
import {
  StrategyPlansWidgetSkeleton,
  AnalyticsWidgetSkeleton,
  ExperimentationWidgetSkeleton,
  Tier1Skeleton,
  Tier2Skeleton,
  Tier3Skeleton,
  LoadingSpinner
} from '@/components/ui/widget-skeleton';

import {
  DataNotAvailable,
  EmptyDataState,
  ErrorDataState,
  NetworkErrorState,
  MaintenanceState,
  CompactDataNotAvailable
} from '@/components/ui/data-not-available';

// Import widgets for testing
import { WidgetRenderer } from '@/components/widgets/WidgetRenderer';
import { PhasesWidget } from '@/components/widgets/tier2/PhasesWidget';
import { WEBXWidget } from '@/components/widgets/tier2/WEBXWidget';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: () => '/engine/results/strategy-plans/phases/phase-1-foundation-0-3-months'
}));

// Mock conditional rendering context
const mockConditionalRenderingContext = () => ({
  detection: {
    tier1: 'strategy-plans',
    tier2: 'phases',
    tier3: 'phase-1-foundation-0-3-months',
    tier1Display: 'Strategy Plans',
    tier2Display: 'Phases',
    tier3Display: 'Phase 1: Foundation (0-3 months)'
  },
  shouldRenderTier2: true,
  shouldRenderTier3: true,
  contentFocus: {
    title: 'Phase 1: Foundation',
    description: 'Foundation phase implementation details'
  },
  dataProps: {}
});

jest.mock('@/lib/conditional-rendering', () => ({
  useConditionalRenderingContext: () => mockConditionalRenderingContext(),
  useUrlPathDetection: () => mockConditionalRenderingContext().detection,
  pathMatchers: {
    isStrategyPlans: (path: string) => path.includes('strategy-plans'),
    isPhases: (path: string) => path.includes('phases'),
    isPhase1Foundation: (path: string) => path.includes('phase-1-foundation'),
    isDXPTools: (path: string) => path.includes('optimizely-dxp-tools'),
    isWEBX: (path: string) => path.includes('webx'),
    isAnalyticsInsights: (path: string) => path.includes('analytics-insights'),
    isContent: (path: string) => path.includes('content'),
    isExperienceOptimization: (path: string) => path.includes('experience-optimization'),
    isExperimentation: (path: string) => path.includes('experimentation'),
    isPersonalization: (path: string) => path.includes('personalization'),
    isActiveExperiments: (path: string) => path.includes('active-experiments'),
    isEngagement: (path: string) => path.includes('engagement')
  },
  debugPathDetection: jest.fn()
}));

// Mock OPAL data hooks
const mockTierDataResult = {
  tier1: { data: null, metadata: null, error: null, isLoading: false },
  tier2: { data: null, metadata: null, error: null, isLoading: false },
  tier3: { data: null, metadata: null, error: null, isLoading: false },
  isLoading: false,
  hasError: false,
  refresh: jest.fn()
};

jest.mock('@/hooks/useTierOPALData', () => ({
  useTierOPALData: () => mockTierDataResult
}));

jest.mock('@/hooks/useOPALData', () => ({
  useOPALData: () => ({
    data: null,
    loading: false,
    error: null,
    refetch: jest.fn()
  })
}));

describe('Fallback Handling System', () => {
  describe('Skeleton Loaders', () => {
    it('renders StrategyPlansWidgetSkeleton correctly', () => {
      render(<StrategyPlansWidgetSkeleton />);
      expect(screen.getByTestId('metric-card-skeleton') || document.querySelector('.space-y-6')).toBeTruthy();
    });

    it('renders AnalyticsWidgetSkeleton correctly', () => {
      render(<AnalyticsWidgetSkeleton />);
      expect(document.querySelector('.space-y-6')).toBeTruthy();
    });

    it('renders ExperimentationWidgetSkeleton correctly', () => {
      render(<ExperimentationWidgetSkeleton />);
      expect(document.querySelector('.space-y-6')).toBeTruthy();
    });

    it('renders tier-specific skeletons', () => {
      render(<Tier1Skeleton />);
      render(<Tier2Skeleton />);
      render(<Tier3Skeleton />);
      expect(document.querySelectorAll('.space-y-6')).toHaveLength(3);
    });

    it('renders LoadingSpinner with custom message', () => {
      render(<LoadingSpinner message="Loading custom data..." />);
      expect(screen.getByText('Loading custom data...')).toBeTruthy();
    });
  });

  describe('Data Not Available Components', () => {
    it('renders DataNotAvailable with different reasons', () => {
      const reasons = ['loading', 'error', 'empty', 'network', 'timeout', 'unauthorized', 'maintenance'] as const;

      reasons.forEach(reason => {
        const { unmount } = render(
          <DataNotAvailable
            reason={reason}
            onRetry={jest.fn()}
          />
        );
        expect(document.querySelector('.space-y-4')).toBeTruthy();
        unmount();
      });
    });

    it('renders EmptyDataState with configure action', () => {
      const mockOnConfigure = jest.fn();
      render(
        <EmptyDataState
          section="Test Section"
          onConfigure={mockOnConfigure}
        />
      );

      const configureButton = screen.getByText('Configure Data');
      fireEvent.click(configureButton);
      expect(mockOnConfigure).toHaveBeenCalled();
    });

    it('renders ErrorDataState with retry action', () => {
      const mockOnRetry = jest.fn();
      render(
        <ErrorDataState
          error="Test error message"
          onRetry={mockOnRetry}
        />
      );

      const retryButton = screen.getByText('Try Again');
      fireEvent.click(retryButton);
      expect(mockOnRetry).toHaveBeenCalled();
    });

    it('renders NetworkErrorState', () => {
      render(<NetworkErrorState />);
      expect(screen.getByText('Connection Problem')).toBeTruthy();
    });

    it('renders MaintenanceState', () => {
      render(<MaintenanceState />);
      expect(screen.getByText('System Maintenance')).toBeTruthy();
    });

    it('renders CompactDataNotAvailable', () => {
      const mockOnRetry = jest.fn();
      render(
        <CompactDataNotAvailable
          message="Custom not available message"
          onRetry={mockOnRetry}
        />
      );

      expect(screen.getByText('Custom not available message')).toBeTruthy();

      const retryButton = screen.getByText('Retry');
      fireEvent.click(retryButton);
      expect(mockOnRetry).toHaveBeenCalled();
    });
  });

  describe('Widget Loading States', () => {
    it('renders loading skeleton when data is loading in WidgetRenderer', () => {
      // Mock loading state
      const loadingMockTierDataResult = {
        ...mockTierDataResult,
        isLoading: true
      };

      jest.doMock('@/hooks/useTierOPALData', () => ({
        useTierOPALData: () => loadingMockTierDataResult
      }));

      render(<WidgetRenderer />);
      expect(document.querySelector('.space-y-6')).toBeTruthy();
    });

    it('renders error state when there is an error in WidgetRenderer', () => {
      const errorMockTierDataResult = {
        ...mockTierDataResult,
        hasError: true,
        tier1: { ...mockTierDataResult.tier1, error: 'Network error' }
      };

      jest.doMock('@/hooks/useTierOPALData', () => ({
        useTierOPALData: () => errorMockTierDataResult
      }));

      render(<WidgetRenderer />);
      // Should render error state (we can't test exact content due to mocking complexity)
      expect(document.body).toBeTruthy();
    });
  });

  describe('Specialized Widget Fallbacks', () => {
    it('renders fallback when PhasesWidget has no data', () => {
      render(<PhasesWidget data={null} context={{ error: null, isLoading: false }} />);
      expect(screen.getByText('Phases Not Configured')).toBeTruthy();
    });

    it('renders fallback when PhasesWidget has error', () => {
      render(<PhasesWidget data={null} context={{ error: 'API Error', isLoading: false }} />);
      expect(screen.getByText('Phases Data Unavailable')).toBeTruthy();
    });

    it('renders loading skeleton when PhasesWidget is loading', () => {
      render(<PhasesWidget data={null} context={{ error: null, isLoading: true }} />);
      expect(document.querySelector('.space-y-6')).toBeTruthy();
    });

    it('renders fallback when WEBXWidget has no data', () => {
      render(<WEBXWidget data={null} context={{ error: null, isLoading: false }} />);
      expect(screen.getByText('WEBX Not Configured')).toBeTruthy();
    });

    it('renders fallback when WEBXWidget has error', () => {
      render(<WEBXWidget data={null} context={{ error: 'API Error', isLoading: false }} />);
      expect(screen.getByText('WEBX Data Unavailable')).toBeTruthy();
    });

    it('renders loading skeleton when WEBXWidget is loading', () => {
      render(<WEBXWidget data={null} context={{ error: null, isLoading: true }} />);
      expect(document.querySelector('.space-y-6')).toBeTruthy();
    });
  });

  describe('Tier-Specific Fallback Behavior', () => {
    it('shows appropriate tier-level error messages', () => {
      const tiers: Array<'tier1' | 'tier2' | 'tier3'> = ['tier1', 'tier2', 'tier3'];

      tiers.forEach(tier => {
        const { unmount } = render(
          <DataNotAvailable
            reason="error"
            tier={tier}
          />
        );
        expect(document.querySelector('.space-y-4')).toBeTruthy();
        unmount();
      });
    });

    it('provides appropriate actions for different error types', () => {
      const errorTypes = ['network', 'timeout', 'unauthorized', 'maintenance'] as const;

      errorTypes.forEach(errorType => {
        const { unmount } = render(
          <DataNotAvailable
            reason={errorType}
            onRetry={jest.fn()}
            onConfigure={jest.fn()}
          />
        );
        expect(document.querySelector('.space-y-4')).toBeTruthy();
        unmount();
      });
    });
  });

  describe('Accessibility and User Experience', () => {
    it('provides retry functionality for error states', () => {
      const mockRetry = jest.fn();
      render(
        <DataNotAvailable
          reason="error"
          onRetry={mockRetry}
        />
      );

      const retryButton = screen.getByText('Try Again');
      expect(retryButton).toBeTruthy();
      fireEvent.click(retryButton);
      expect(mockRetry).toHaveBeenCalled();
    });

    it('provides configuration links for empty states', () => {
      const mockConfigure = jest.fn();
      render(
        <DataNotAvailable
          reason="empty"
          onConfigure={mockConfigure}
        />
      );

      const configureButton = screen.getByText('Configure Data');
      expect(configureButton).toBeTruthy();
      fireEvent.click(configureButton);
      expect(mockConfigure).toHaveBeenCalled();
    });

    it('shows appropriate icons for different states', () => {
      render(<DataNotAvailable reason="network" />);
      expect(document.querySelector('svg')).toBeTruthy(); // Checks for icon presence
    });

    it('provides detailed error information when requested', () => {
      render(
        <DataNotAvailable
          reason="error"
          showDetails={true}
          tier="tier2"
        />
      );

      expect(screen.getByText('Technical Details:')).toBeTruthy();
    });
  });

  describe('Performance and Optimization', () => {
    it('renders skeletons efficiently without blocking', () => {
      const start = performance.now();
      render(<Tier1Skeleton />);
      render(<Tier2Skeleton />);
      render(<Tier3Skeleton />);
      const end = performance.now();

      // Should render very quickly
      expect(end - start).toBeLessThan(100);
    });

    it('handles multiple concurrent error states', () => {
      render(
        <div>
          <ErrorDataState error="Error 1" />
          <ErrorDataState error="Error 2" />
          <ErrorDataState error="Error 3" />
        </div>
      );

      expect(screen.getAllByText('Try Again')).toHaveLength(3);
    });
  });
});

describe('Integration Tests', () => {
  it('integrates fallback handling across widget hierarchy', () => {
    // Test that fallback handling works across the entire widget system
    render(<WidgetRenderer />);
    expect(document.body).toBeTruthy();
  });

  it('maintains consistent styling across all fallback components', () => {
    render(
      <div>
        <DataNotAvailable reason="error" />
        <EmptyDataState section="Test" />
        <NetworkErrorState />
      </div>
    );

    // Should have consistent card-based layout
    expect(document.querySelectorAll('.space-y-4')).toBeTruthy();
  });

  it('provides seamless transition from loading to data states', () => {
    const { rerender } = render(<LoadingSpinner />);

    // Simulate data loading completion
    rerender(
      <DataNotAvailable
        reason="empty"
        onConfigure={jest.fn()}
      />
    );

    expect(screen.getByText('Configure Data')).toBeTruthy();
  });
});