/**
 * Unit Tests for useForceSyncUnified Hook Error Scenarios
 *
 * Tests for hook-specific error handling:
 * 1. API call failures
 * 2. Polling interruptions
 * 3. State management edge cases
 * 4. Cleanup failures
 * 5. Concurrent operation handling
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useForceSyncUnified } from '@/hooks/useForceSyncUnified';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock console methods to avoid test output pollution
const mockConsole = {
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn()
};

vi.stubGlobal('console', mockConsole);

describe('useForceSyncUnified Hook Error Scenarios', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();
    mockConsole.log.mockClear();
    mockConsole.error.mockClear();
    mockConsole.warn.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('API Call Failures', () => {
    it('should handle trigger sync API failures', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useForceSyncUnified());

      await act(async () => {
        await expect(result.current.triggerSync()).rejects.toThrow('Network error');
      });

      expect(result.current.error).toBe('Network error');
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isActive).toBe(false);
    });

    it('should handle 404 endpoint not found errors', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response('{"error": "Not Found"}', {
          status: 404,
          statusText: 'Not Found'
        })
      );

      const { result } = renderHook(() => useForceSyncUnified());

      await act(async () => {
        await expect(result.current.triggerSync()).rejects.toThrow();
      });

      expect(result.current.error).toContain('404');
    });

    it('should handle 500 server errors', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response('{"error": "Internal Server Error"}', {
          status: 500,
          statusText: 'Internal Server Error'
        })
      );

      const { result } = renderHook(() => useForceSyncUnified());

      await act(async () => {
        await expect(result.current.triggerSync()).rejects.toThrow();
      });

      expect(result.current.error).toContain('500');
    });

    it('should handle malformed JSON responses', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response('invalid json{', {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      );

      const { result } = renderHook(() => useForceSyncUnified());

      await act(async () => {
        await expect(result.current.triggerSync()).rejects.toThrow();
      });

      expect(result.current.error).toBeTruthy();
    });

    it('should handle timeout errors', async () => {
      // Mock a fetch that times out
      mockFetch.mockImplementationOnce(() =>
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Request timeout')), 100);
        })
      );

      const { result } = renderHook(() => useForceSyncUnified());

      await act(async () => {
        await expect(result.current.triggerSync()).rejects.toThrow('Request timeout');
      });

      expect(result.current.error).toBe('Request timeout');
    });
  });

  describe('Concurrent Operation Handling', () => {
    it('should handle 409 conflict responses (concurrent sync)', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({
          success: false,
          error: 'Sync Already Active',
          message: 'Another force sync is currently in progress',
          active_sync: {
            session_id: 'existing-session-123',
            status: 'in_progress'
          }
        }), { status: 409 })
      );

      const { result } = renderHook(() => useForceSyncUnified());

      await act(async () => {
        await expect(result.current.triggerSync()).rejects.toThrow();
      });

      expect(result.current.error).toContain('Another force sync is currently in progress');
    });

    it('should prevent multiple simultaneous trigger calls', async () => {
      let resolveFirst: (value: any) => void;
      const firstPromise = new Promise(resolve => { resolveFirst = resolve; });

      // First call hangs
      mockFetch.mockImplementationOnce(() => firstPromise);

      const { result } = renderHook(() => useForceSyncUnified());

      // Start first sync
      act(() => {
        result.current.triggerSync();
      });

      expect(result.current.isLoading).toBe(true);

      // Attempt second sync while first is loading
      await act(async () => {
        await expect(result.current.triggerSync()).rejects.toThrow();
      });

      // Resolve first call
      act(() => {
        resolveFirst(new Response(JSON.stringify({
          success: true,
          session_id: 'test-session'
        }), { status: 200 }));
      });
    });
  });

  describe('Polling Failures', () => {
    it('should handle polling API failures', async () => {
      // Successful trigger
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({
          success: true,
          session_id: 'test-session',
          polling_url: '/api/force-sync/status/test-session'
        }), { status: 200 })
      );

      // Failed polling
      mockFetch.mockRejectedValueOnce(new Error('Polling network error'));

      const { result } = renderHook(() => useForceSyncUnified());

      await act(async () => {
        await result.current.triggerSync();
      });

      // Wait for polling to fail
      await waitFor(() => {
        expect(result.current.error).toContain('Polling network error');
      });

      expect(result.current.isActive).toBe(false);
    });

    it('should handle invalid polling responses', async () => {
      // Successful trigger
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({
          success: true,
          session_id: 'test-session'
        }), { status: 200 })
      );

      // Invalid polling response
      mockFetch.mockResolvedValueOnce(
        new Response('invalid json', { status: 200 })
      );

      const { result } = renderHook(() => useForceSyncUnified());

      await act(async () => {
        await result.current.triggerSync();
      });

      // Wait for polling to fail
      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      }, { timeout: 3000 });
    });

    it('should handle polling session not found', async () => {
      // Successful trigger
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({
          success: true,
          session_id: 'test-session'
        }), { status: 200 })
      );

      // Session not found during polling
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({
          success: false,
          error: 'Session not found'
        }), { status: 404 })
      );

      const { result } = renderHook(() => useForceSyncUnified());

      await act(async () => {
        await result.current.triggerSync();
      });

      await waitFor(() => {
        expect(result.current.error).toContain('Session not found');
      });
    });
  });

  describe('Cancellation Failures', () => {
    it('should handle cancel API failures', async () => {
      // Start a sync first
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({
          success: true,
          session_id: 'test-session'
        }), { status: 200 })
      );

      // Mock ongoing polling
      mockFetch.mockResolvedValue(
        new Response(JSON.stringify({
          success: true,
          status: 'in_progress',
          progress: 50
        }), { status: 200 })
      );

      const { result } = renderHook(() => useForceSyncUnified());

      await act(async () => {
        await result.current.triggerSync();
      });

      // Wait for sync to be active
      await waitFor(() => {
        expect(result.current.isActive).toBe(true);
      });

      // Mock cancel failure
      mockFetch.mockRejectedValueOnce(new Error('Cancel failed'));

      await act(async () => {
        await expect(result.current.cancelSync()).rejects.toThrow('Cancel failed');
      });

      expect(result.current.error).toBe('Cancel failed');
    });

    it('should handle cancel when no active session', async () => {
      const { result } = renderHook(() => useForceSyncUnified());

      await act(async () => {
        await expect(result.current.cancelSync()).rejects.toThrow();
      });

      expect(result.current.error).toContain('No active sync');
    });
  });

  describe('Retry Failures', () => {
    it('should handle retry API failures', async () => {
      const { result } = renderHook(() => useForceSyncUnified());

      // Set up error state first
      act(() => {
        (result.current as any).setError('Previous error');
      });

      // Mock retry failure
      mockFetch.mockRejectedValueOnce(new Error('Retry failed'));

      await act(async () => {
        await expect(result.current.retrySync()).rejects.toThrow('Retry failed');
      });

      expect(result.current.error).toBe('Retry failed');
    });

    it('should handle retry when no previous error', async () => {
      const { result } = renderHook(() => useForceSyncUnified());

      await act(async () => {
        await expect(result.current.retrySync()).rejects.toThrow();
      });
    });
  });

  describe('State Management Edge Cases', () => {
    it('should handle component unmount during active sync', async () => {
      // Start sync
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({
          success: true,
          session_id: 'test-session'
        }), { status: 200 })
      );

      // Mock long polling
      mockFetch.mockImplementation(() =>
        new Promise(resolve => {
          setTimeout(() => resolve(new Response(JSON.stringify({
            success: true,
            status: 'in_progress',
            progress: 25
          }), { status: 200 })), 1000);
        })
      );

      const { result, unmount } = renderHook(() => useForceSyncUnified());

      await act(async () => {
        await result.current.triggerSync();
      });

      expect(result.current.isActive).toBe(true);

      // Unmount component
      unmount();

      // Should not cause memory leaks or errors
      expect(true).toBe(true); // Test passes if no errors thrown
    });

    it('should handle rapid state changes', async () => {
      const { result } = renderHook(() => useForceSyncUnified());

      // Rapid succession of calls
      const promises = Array.from({ length: 5 }, (_, i) => {
        mockFetch.mockRejectedValueOnce(new Error(`Error ${i}`));
        return result.current.triggerSync().catch(() => {});
      });

      await act(async () => {
        await Promise.allSettled(promises);
      });

      // Should handle gracefully without crashes
      expect(result.current.error).toBeTruthy();
    });

    it('should handle invalid session state', async () => {
      const { result } = renderHook(() => useForceSyncUnified());

      // Manually corrupt internal state (simulating edge case)
      act(() => {
        (result.current as any).setCurrentSession('invalid-session-id');
      });

      await act(async () => {
        await expect(result.current.cancelSync()).rejects.toThrow();
      });
    });
  });

  describe('Memory and Resource Management', () => {
    it('should clean up polling timers on error', async () => {
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');

      // Start sync
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({
          success: true,
          session_id: 'test-session'
        }), { status: 200 })
      );

      // Fail polling after one attempt
      mockFetch.mockRejectedValueOnce(new Error('Polling error'));

      const { result, unmount } = renderHook(() => useForceSyncUnified());

      await act(async () => {
        await result.current.triggerSync();
      });

      // Wait for error to occur
      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      unmount();

      // Should have cleaned up timers
      expect(clearIntervalSpy).toHaveBeenCalled();
      clearIntervalSpy.mockRestore();
    });

    it('should not leak event listeners', async () => {
      const addEventListenerSpy = vi.spyOn(global, 'addEventListener');
      const removeEventListenerSpy = vi.spyOn(global, 'removeEventListener');

      const { unmount } = renderHook(() => useForceSyncUnified());

      unmount();

      // Should remove any event listeners that were added
      if (addEventListenerSpy.mock.calls.length > 0) {
        expect(removeEventListenerSpy.mock.calls.length).toBeGreaterThan(0);
      }

      addEventListenerSpy.mockRestore();
      removeEventListenerSpy.mockRestore();
    });
  });

  describe('Error Recovery', () => {
    it('should clear error state on successful operation after failure', async () => {
      const { result } = renderHook(() => useForceSyncUnified());

      // First call fails
      mockFetch.mockRejectedValueOnce(new Error('First error'));

      await act(async () => {
        await expect(result.current.triggerSync()).rejects.toThrow();
      });

      expect(result.current.error).toBe('First error');

      // Second call succeeds
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({
          success: true,
          session_id: 'test-session'
        }), { status: 200 })
      );

      await act(async () => {
        await result.current.triggerSync();
      });

      expect(result.current.error).toBeNull();
    });

    it('should maintain error state across multiple failures', async () => {
      const { result } = renderHook(() => useForceSyncUnified());

      // Multiple failures
      const errors = ['Error 1', 'Error 2', 'Error 3'];

      for (const errorMsg of errors) {
        mockFetch.mockRejectedValueOnce(new Error(errorMsg));

        await act(async () => {
          await expect(result.current.triggerSync()).rejects.toThrow();
        });

        expect(result.current.error).toBe(errorMsg);
      }
    });
  });
});