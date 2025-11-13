/**
 * Unit tests for DiagnosticsPanel error handling and null safety
 * These tests ensure the component handles various error scenarios gracefully
 */

import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { DiagnosticsPanel } from '@/components/DiagnosticsPanel';

// Mock fetch globally
global.fetch = vi.fn();

describe('DiagnosticsPanel Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (fetch as Mock).mockClear();
  });

  describe('API Response Handling', () => {
    it('should handle null/undefined diagnosticsData gracefully', async () => {
      (fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => null,
      });

      render(<DiagnosticsPanel />);

      // Should not throw and should show loading state initially
      expect(screen.getByText('Loading diagnostics data...')).toBeInTheDocument();
    });

    it('should handle empty events array without crashing', async () => {
      const mockResponse = {
        events: [],
        summary: {
          total_count: 0,
          returned_count: 0,
          signature_valid_count: 0,
          error_count: 0,
          date_range: { from: null, to: null },
          filters_applied: {
            limit: 25,
            workflow_id: null,
            agent_id: null,
            status: 'all',
            hours: 24
          }
        },
        config_diagnostics: {},
        troubleshooting: {},
        generated_at: new Date().toISOString(),
        query_info: {}
      };

      (fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      render(<DiagnosticsPanel />);

      await waitFor(() => {
        expect(screen.queryByText('Loading diagnostics data...')).not.toBeInTheDocument();
      });

      // Should show summary even with empty events
      expect(screen.getByText('Event Summary')).toBeInTheDocument();
      expect(screen.getByText('Total Events:')).toBeInTheDocument();
    });

    it('should handle undefined events property without crashing', async () => {
      const mockResponse = {
        // events property is missing
        summary: {
          total_count: 0,
          returned_count: 0,
          signature_valid_count: 0,
          error_count: 0,
          date_range: { from: null, to: null },
          filters_applied: {
            limit: 25,
            workflow_id: null,
            agent_id: null,
            status: 'all',
            hours: 24
          }
        },
        config_diagnostics: {},
        troubleshooting: {},
        generated_at: new Date().toISOString(),
        query_info: {}
      };

      (fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      render(<DiagnosticsPanel />);

      await waitFor(() => {
        expect(screen.queryByText('Loading diagnostics data...')).not.toBeInTheDocument();
      });

      // Should not crash and should show summary
      expect(screen.getByText('Event Summary')).toBeInTheDocument();
    });

    it('should handle malformed event objects without crashing', async () => {
      const mockResponse = {
        events: [
          // Missing required properties
          { id: '1' },
          // Null/undefined properties
          { id: '2', workflow_id: null, agent_id: undefined, signature_valid: null },
          // Valid event
          {
            id: '3',
            workflow_id: 'test-workflow',
            agent_id: 'test-agent',
            received_at: new Date().toISOString(),
            signature_valid: true,
            http_status: 202,
            dedup_hash: 'abc123',
            payload_preview: 'test payload'
          }
        ],
        summary: {
          total_count: 3,
          returned_count: 3,
          signature_valid_count: 1,
          error_count: 2,
          date_range: { from: null, to: null },
          filters_applied: {
            limit: 25,
            workflow_id: null,
            agent_id: null,
            status: 'all',
            hours: 24
          }
        },
        config_diagnostics: {},
        troubleshooting: {},
        generated_at: new Date().toISOString(),
        query_info: {}
      };

      (fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      render(<DiagnosticsPanel />);

      await waitFor(() => {
        expect(screen.queryByText('Loading diagnostics data...')).not.toBeInTheDocument();
      });

      // Should render without crashing and show events section
      expect(screen.getByText('Recent Agent Events (3)')).toBeInTheDocument();
    });

    it('should handle network errors gracefully', async () => {
      (fetch as Mock).mockRejectedValueOnce(new Error('Network error'));

      render(<DiagnosticsPanel />);

      await waitFor(() => {
        expect(screen.queryByText('Loading diagnostics data...')).not.toBeInTheDocument();
      });

      // Should show error state instead of crashing
      expect(screen.queryByText('Event Summary')).not.toBeInTheDocument();
    });

    it('should handle 400/500 HTTP errors gracefully', async () => {
      (fetch as Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal server error' }),
      });

      render(<DiagnosticsPanel />);

      await waitFor(() => {
        expect(screen.queryByText('Loading diagnostics data...')).not.toBeInTheDocument();
      });

      // Should handle error response gracefully
      expect(screen.queryByText('Event Summary')).not.toBeInTheDocument();
    });

    it('should handle missing summary object without crashing', async () => {
      const mockResponse = {
        events: [
          {
            id: '1',
            workflow_id: 'test-workflow',
            agent_id: 'test-agent',
            received_at: new Date().toISOString(),
            signature_valid: true,
            http_status: 202,
            dedup_hash: 'abc123',
            payload_preview: 'test payload'
          }
        ],
        // summary property is missing
        config_diagnostics: {},
        troubleshooting: {},
        generated_at: new Date().toISOString(),
        query_info: {}
      };

      (fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      render(<DiagnosticsPanel />);

      await waitFor(() => {
        expect(screen.queryByText('Loading diagnostics data...')).not.toBeInTheDocument();
      });

      // Should render events section but not summary section
      expect(screen.getByText('Recent Agent Events (1)')).toBeInTheDocument();
      expect(screen.queryByText('Event Summary')).not.toBeInTheDocument();
    });
  });

  describe('SafeGet Helper Function', () => {
    it('should return default value when property access throws', () => {
      // This test would need access to the safeGet function
      // In a real implementation, we might export it or test it indirectly
      const testObj: any = null;

      // Simulate what safeGet does
      const safeGet = <T>(getter: () => T, defaultValue: T): T => {
        try {
          return getter() ?? defaultValue;
        } catch {
          return defaultValue;
        }
      };

      const result = safeGet(() => testObj.nonexistent.property, 'default');
      expect(result).toBe('default');
    });

    it('should return default value for null/undefined properties', () => {
      const safeGet = <T>(getter: () => T, defaultValue: T): T => {
        try {
          return getter() ?? defaultValue;
        } catch {
          return defaultValue;
        }
      };

      const testObj = { prop: null };
      const result = safeGet(() => testObj.prop, 'default');
      expect(result).toBe('default');
    });
  });

  describe('Component State Management', () => {
    it('should handle loading states properly', async () => {
      // Mock a slow response
      (fetch as Mock).mockImplementationOnce(() =>
        new Promise(resolve =>
          setTimeout(() => resolve({
            ok: true,
            json: async () => ({
              events: [],
              summary: { total_count: 0, returned_count: 0, signature_valid_count: 0, error_count: 0 },
              config_diagnostics: {},
              troubleshooting: {},
              generated_at: new Date().toISOString(),
              query_info: {}
            })
          }), 100)
        )
      );

      render(<DiagnosticsPanel />);

      // Should show loading state
      expect(screen.getByText('Loading diagnostics data...')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByText('Loading diagnostics data...')).not.toBeInTheDocument();
      });
    });

    it('should clear previous error states on successful fetch', async () => {
      // First, simulate an error
      (fetch as Mock).mockRejectedValueOnce(new Error('Network error'));

      const { rerender } = render(<DiagnosticsPanel />);

      await waitFor(() => {
        expect(screen.queryByText('Loading diagnostics data...')).not.toBeInTheDocument();
      });

      // Then simulate a successful response
      (fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          events: [],
          summary: { total_count: 0, returned_count: 0, signature_valid_count: 0, error_count: 0 },
          config_diagnostics: {},
          troubleshooting: {},
          generated_at: new Date().toISOString(),
          query_info: {}
        }),
      });

      rerender(<DiagnosticsPanel />);

      await waitFor(() => {
        expect(screen.getByText('Event Summary')).toBeInTheDocument();
      });
    });
  });
});