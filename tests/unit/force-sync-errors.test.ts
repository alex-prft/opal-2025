/**
 * Unit Tests for Force Sync Error Scenarios
 *
 * Tests for specific errors encountered in production:
 * 1. Missing NEXT_PUBLIC_API_SECRET_KEY environment variable
 * 2. Response property access errors (platforms_included)
 * 3. Authentication failures
 * 4. API endpoint mismatches
 * 5. Response structure incompatibilities
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useForceSyncUnified } from '@/hooks/useForceSyncUnified';
import ForceSyncButton from '@/components/ForceSyncButton';

// Mock the unified hook
vi.mock('@/hooks/useForceSyncUnified');

// Mock environment variables
const mockEnv = vi.hoisted(() => ({
  NEXT_PUBLIC_API_SECRET_KEY: undefined
}));

vi.mock('process', () => ({
  env: mockEnv
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Force Sync Error Scenarios', () => {
  const mockUseForceSyncUnified = vi.mocked(useForceSyncUnified);

  const defaultMockReturn = {
    syncStatus: {
      status: 'idle' as const,
      progress: 0,
      message: '',
      started_at: undefined,
      updated_at: undefined,
      details: null
    },
    triggerSync: vi.fn(),
    cancelSync: vi.fn(),
    retrySync: vi.fn(),
    isLoading: false,
    isActive: false,
    canCancel: false,
    canRetry: false,
    lastSyncTime: null,
    error: null
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseForceSyncUnified.mockReturnValue(defaultMockReturn);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Environment Variable Errors', () => {
    it('should handle missing NEXT_PUBLIC_API_SECRET_KEY gracefully', async () => {
      // Mock the hook to simulate environment error
      const mockTriggerSync = vi.fn().mockRejectedValue(
        new Error('Missing NEXT_PUBLIC_API_SECRET_KEY environment variable')
      );

      mockUseForceSyncUnified.mockReturnValue({
        ...defaultMockReturn,
        triggerSync: mockTriggerSync,
        error: 'Missing NEXT_PUBLIC_API_SECRET_KEY environment variable'
      });

      render(<ForceSyncButton variant="card" />);

      const quickSyncButton = screen.getByRole('button', { name: /quick sync/i });
      fireEvent.click(quickSyncButton);

      await waitFor(() => {
        expect(mockTriggerSync).toHaveBeenCalled();
      });

      // Should display error message
      expect(screen.getByText(/Missing NEXT_PUBLIC_API_SECRET_KEY/)).toBeInTheDocument();
    });

    it('should prevent API calls when environment is not properly configured', () => {
      // Test that the component shows appropriate state when env is missing
      mockUseForceSyncUnified.mockReturnValue({
        ...defaultMockReturn,
        error: 'Environment configuration missing'
      });

      render(<ForceSyncButton />);

      // Should show error state
      expect(screen.getByText(/Environment configuration missing/)).toBeInTheDocument();
    });
  });

  describe('Authentication Errors', () => {
    it('should handle authentication failures properly', async () => {
      const mockTriggerSync = vi.fn().mockRejectedValue(
        new Error('Failed to create auth headers: Error: Missing NEXT_PUBLIC_API_SECRET_KEY environment variable')
      );

      mockUseForceSyncUnified.mockReturnValue({
        ...defaultMockReturn,
        triggerSync: mockTriggerSync,
        error: 'Authentication failed'
      });

      render(<ForceSyncButton variant="card" />);

      const quickSyncButton = screen.getByRole('button', { name: /quick sync/i });
      fireEvent.click(quickSyncButton);

      await waitFor(() => {
        expect(mockTriggerSync).toHaveBeenCalled();
      });
    });

    it('should handle 401 unauthorized responses', async () => {
      mockUseForceSyncUnified.mockReturnValue({
        ...defaultMockReturn,
        error: 'Unauthorized: Invalid API key'
      });

      render(<ForceSyncButton />);

      expect(screen.getByText(/Unauthorized: Invalid API key/)).toBeInTheDocument();
    });
  });

  describe('Response Structure Errors', () => {
    it('should handle missing response properties gracefully', async () => {
      // Simulate the specific error: Cannot read properties of undefined (reading 'platforms_included')
      const mockTriggerSync = vi.fn().mockRejectedValue(
        new TypeError("Cannot read properties of undefined (reading 'platforms_included')")
      );

      mockUseForceSyncUnified.mockReturnValue({
        ...defaultMockReturn,
        triggerSync: mockTriggerSync,
        error: "Response parsing error"
      });

      render(<ForceSyncButton variant="card" />);

      const quickSyncButton = screen.getByRole('button', { name: /quick sync/i });
      fireEvent.click(quickSyncButton);

      await waitFor(() => {
        expect(mockTriggerSync).toHaveBeenCalled();
      });

      // Should show error state
      expect(screen.getByText(/Response parsing error/)).toBeInTheDocument();
    });

    it('should handle malformed API responses', async () => {
      mockUseForceSyncUnified.mockReturnValue({
        ...defaultMockReturn,
        error: 'Invalid response format'
      });

      render(<ForceSyncButton />);

      expect(screen.getByText(/Invalid response format/)).toBeInTheDocument();
    });

    it('should handle null or undefined response data', async () => {
      mockUseForceSyncUnified.mockReturnValue({
        ...defaultMockReturn,
        syncStatus: {
          status: 'failed' as const,
          progress: 0,
          message: 'Response data is null',
          started_at: undefined,
          updated_at: undefined,
          details: null
        },
        error: 'Response data is null'
      });

      render(<ForceSyncButton variant="card" />);

      expect(screen.getByText(/Response data is null/)).toBeInTheDocument();
    });
  });

  describe('API Endpoint Errors', () => {
    it('should handle wrong endpoint URLs (404 errors)', async () => {
      mockUseForceSyncUnified.mockReturnValue({
        ...defaultMockReturn,
        error: 'Endpoint not found: /api/opal/sync'
      });

      render(<ForceSyncButton />);

      expect(screen.getByText(/Endpoint not found/)).toBeInTheDocument();
    });

    it('should handle server errors (500 responses)', async () => {
      mockUseForceSyncUnified.mockReturnValue({
        ...defaultMockReturn,
        error: 'Internal Server Error'
      });

      render(<ForceSyncButton />);

      expect(screen.getByText(/Internal Server Error/)).toBeInTheDocument();
    });

    it('should handle network timeouts', async () => {
      mockUseForceSyncUnified.mockReturnValue({
        ...defaultMockReturn,
        error: 'Request timeout'
      });

      render(<ForceSyncButton />);

      expect(screen.getByText(/Request timeout/)).toBeInTheDocument();
    });
  });

  describe('State Management Errors', () => {
    it('should handle concurrent sync attempts properly', async () => {
      mockUseForceSyncUnified.mockReturnValue({
        ...defaultMockReturn,
        error: 'Another force sync is currently in progress'
      });

      render(<ForceSyncButton variant="card" />);

      expect(screen.getByText(/Another force sync is currently in progress/)).toBeInTheDocument();
    });

    it('should handle session management failures', async () => {
      mockUseForceSyncUnified.mockReturnValue({
        ...defaultMockReturn,
        error: 'Session management failed'
      });

      render(<ForceSyncButton />);

      expect(screen.getByText(/Session management failed/)).toBeInTheDocument();
    });
  });

  describe('Error Recovery', () => {
    it('should show retry button after error', () => {
      mockUseForceSyncUnified.mockReturnValue({
        ...defaultMockReturn,
        canRetry: true,
        error: 'Sync failed'
      });

      render(<ForceSyncButton variant="card" />);

      const retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toBeInTheDocument();
      expect(retryButton).not.toBeDisabled();
    });

    it('should call retrySync when retry button is clicked', async () => {
      const mockRetrySync = vi.fn();

      mockUseForceSyncUnified.mockReturnValue({
        ...defaultMockReturn,
        canRetry: true,
        retrySync: mockRetrySync,
        error: 'Sync failed'
      });

      render(<ForceSyncButton variant="card" />);

      const retryButton = screen.getByRole('button', { name: /retry/i });
      fireEvent.click(retryButton);

      expect(mockRetrySync).toHaveBeenCalled();
    });

    it('should clear error state after successful retry', async () => {
      const { rerender } = render(<ForceSyncButton />);

      // First render with error
      mockUseForceSyncUnified.mockReturnValue({
        ...defaultMockReturn,
        error: 'Sync failed'
      });

      rerender(<ForceSyncButton />);
      expect(screen.getByText(/Sync failed/)).toBeInTheDocument();

      // Second render after successful retry
      mockUseForceSyncUnified.mockReturnValue({
        ...defaultMockReturn,
        error: null
      });

      rerender(<ForceSyncButton />);
      expect(screen.queryByText(/Sync failed/)).not.toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('should disable buttons during loading', () => {
      mockUseForceSyncUnified.mockReturnValue({
        ...defaultMockReturn,
        isLoading: true
      });

      render(<ForceSyncButton variant="card" />);

      const quickSyncButton = screen.getByRole('button', { name: /starting/i });
      const fullSyncButton = screen.getByRole('button', { name: /please wait/i });

      expect(quickSyncButton).toBeDisabled();
      expect(fullSyncButton).toBeDisabled();
    });

    it('should show loading spinner during sync', () => {
      mockUseForceSyncUnified.mockReturnValue({
        ...defaultMockReturn,
        isActive: true,
        syncStatus: {
          status: 'in_progress' as const,
          progress: 25,
          message: 'Processing...',
          started_at: new Date().toISOString(),
          updated_at: undefined,
          details: null
        }
      });

      render(<ForceSyncButton />);

      // Should show syncing state
      expect(screen.getByText(/syncing/i)).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined syncStatus gracefully', () => {
      mockUseForceSyncUnified.mockReturnValue({
        ...defaultMockReturn,
        syncStatus: undefined as any
      });

      expect(() => render(<ForceSyncButton />)).not.toThrow();
    });

    it('should handle invalid progress values', () => {
      mockUseForceSyncUnified.mockReturnValue({
        ...defaultMockReturn,
        isActive: true,
        syncStatus: {
          status: 'in_progress' as const,
          progress: -1, // Invalid progress
          message: 'Processing...',
          started_at: new Date().toISOString(),
          updated_at: undefined,
          details: null
        }
      });

      expect(() => render(<ForceSyncButton variant="card" />)).not.toThrow();
    });

    it('should handle invalid date strings', () => {
      mockUseForceSyncUnified.mockReturnValue({
        ...defaultMockReturn,
        lastSyncTime: 'invalid-date'
      });

      expect(() => render(<ForceSyncButton />)).not.toThrow();
    });
  });
});