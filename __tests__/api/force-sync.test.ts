/**
 * Force Sync API Test Suite
 * Comprehensive tests for force sync endpoints with production scenarios
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { POST as triggerForceSyncPOST, GET as triggerForceSyncGET } from '@/app/api/force-sync/trigger/route';
import { GET as statusGET, DELETE as statusDELETE } from '@/app/api/force-sync/status/[sessionId]/route';
import { ForceSyncService } from '@/lib/force-sync/force-sync-service';

// Mock dependencies
jest.mock('@/lib/force-sync/force-sync-service');
jest.mock('@/lib/opal/trigger-workflow');

const mockForceSyncService = ForceSyncService as jest.MockedClass<typeof ForceSyncService>;

describe('Force Sync API Endpoints', () => {
  let mockService: jest.Mocked<ForceSyncService>;

  beforeEach(() => {
    mockService = {
      triggerSync: jest.fn(),
      getSessionStatus: jest.fn(),
      getAllActiveSessions: jest.fn(),
      getLastSyncTimestamp: jest.fn(),
      cancelSync: jest.fn(),
    } as any;

    mockForceSyncService.getInstance = jest.fn().mockReturnValue(mockService);

    // Set up environment
    process.env.OPAL_STRATEGY_WORKFLOW_AUTH_KEY = 'test-auth-key';
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.OPAL_STRATEGY_WORKFLOW_AUTH_KEY;
  });

  describe('POST /api/force-sync/trigger', () => {
    it('should successfully trigger a force sync', async () => {
      const mockResult = {
        success: true,
        correlation_id: 'test-correlation-123',
        session_id: 'sync-session-456',
        workflow_id: 'workflow-789',
        polling_url: '/api/force-sync/status/sync-session-456',
        message: 'Force sync initiated successfully',
        duration_ms: 1500,
        timestamp: new Date().toISOString()
      };

      mockService.getAllActiveSessions.mockReturnValue([]);
      mockService.triggerSync.mockResolvedValue(mockResult);

      const request = new NextRequest('http://localhost:3000/api/force-sync/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sync_scope: 'quick',
          client_context: {
            client_name: 'Test Client',
            industry: 'Technology'
          },
          triggered_by: 'unit_test'
        })
      });

      const response = await triggerForceSyncPOST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.correlation_id).toBe('test-correlation-123');
      expect(data.session_id).toBe('sync-session-456');
      expect(mockService.triggerSync).toHaveBeenCalledWith(expect.objectContaining({
        sync_scope: 'quick',
        client_context: expect.objectContaining({
          client_name: 'Test Client',
          industry: 'Technology'
        }),
        triggered_by: 'unit_test'
      }));
    });

    it('should prevent concurrent syncs', async () => {
      const activeSession = {
        id: 'active-session-123',
        status: {
          status: 'in_progress' as const,
          progress: 50,
          message: 'Processing...',
          started_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      };

      mockService.getAllActiveSessions.mockReturnValue([activeSession]);

      const request = new NextRequest('http://localhost:3000/api/force-sync/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sync_scope: 'quick' })
      });

      const response = await triggerForceSyncPOST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Sync Already Active');
      expect(data.active_sync.session_id).toBe('active-session-123');
      expect(mockService.triggerSync).not.toHaveBeenCalled();
    });

    it('should handle missing authentication', async () => {
      delete process.env.OPAL_STRATEGY_WORKFLOW_AUTH_KEY;

      const request = new NextRequest('http://localhost:3000/api/force-sync/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sync_scope: 'quick' })
      });

      const response = await triggerForceSyncPOST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Configuration Error');
      expect(data.message).toBe('OPAL authentication not configured');
    });

    it('should handle force sync service errors', async () => {
      mockService.getAllActiveSessions.mockReturnValue([]);
      mockService.triggerSync.mockRejectedValue(new Error('OPAL workflow failed'));

      const request = new NextRequest('http://localhost:3000/api/force-sync/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sync_scope: 'quick' })
      });

      const response = await triggerForceSyncPOST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Internal Server Error');
      expect(data.message).toContain('Force sync failed: OPAL workflow failed');
    });
  });

  describe('GET /api/force-sync/trigger', () => {
    it('should return active syncs status', async () => {
      const mockActiveSyncs = [{
        id: 'session-123',
        status: {
          status: 'in_progress' as const,
          progress: 75,
          message: 'Finalizing sync...',
          started_at: '2023-01-01T10:00:00Z',
          updated_at: '2023-01-01T10:05:00Z'
        }
      }];

      mockService.getAllActiveSessions.mockReturnValue(mockActiveSyncs);
      mockService.getLastSyncTimestamp.mockReturnValue('2023-01-01T09:00:00Z');

      const request = new NextRequest('http://localhost:3000/api/force-sync/trigger');
      const response = await triggerForceSyncGET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.has_active_sync).toBe(true);
      expect(data.active_syncs).toHaveLength(1);
      expect(data.active_syncs[0].session_id).toBe('session-123');
      expect(data.active_syncs[0].progress).toBe(75);
      expect(data.last_sync_timestamp).toBe('2023-01-01T09:00:00Z');
    });

    it('should return no active syncs', async () => {
      mockService.getAllActiveSessions.mockReturnValue([]);
      mockService.getLastSyncTimestamp.mockReturnValue(null);

      const request = new NextRequest('http://localhost:3000/api/force-sync/trigger');
      const response = await triggerForceSyncGET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.has_active_sync).toBe(false);
      expect(data.active_syncs).toHaveLength(0);
      expect(data.last_sync_timestamp).toBe(null);
    });
  });

  describe('GET /api/force-sync/status/[sessionId]', () => {
    it('should return session status', async () => {
      const mockStatus = {
        status: 'completed' as const,
        progress: 100,
        message: 'Force sync completed successfully',
        started_at: '2023-01-01T10:00:00Z',
        updated_at: '2023-01-01T10:10:00Z',
        details: {
          workflow_id: 'workflow-123',
          agents_processed: 9
        }
      };

      mockService.getSessionStatus.mockReturnValue(mockStatus);

      const request = new NextRequest('http://localhost:3000/api/force-sync/status/session-123');
      const response = await statusGET(request, { params: { sessionId: 'session-123' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.session_id).toBe('session-123');
      expect(data.status).toBe('completed');
      expect(data.progress).toBe(100);
      expect(data.details.workflow_id).toBe('workflow-123');
      expect(data.polling_interval).toBe(null); // No polling needed for completed
    });

    it('should return polling interval for in-progress sync', async () => {
      const mockStatus = {
        status: 'in_progress' as const,
        progress: 45,
        message: 'Processing agents...',
        started_at: '2023-01-01T10:00:00Z',
        updated_at: '2023-01-01T10:05:00Z'
      };

      mockService.getSessionStatus.mockReturnValue(mockStatus);

      const request = new NextRequest('http://localhost:3000/api/force-sync/status/session-123');
      const response = await statusGET(request, { params: { sessionId: 'session-123' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.polling_interval).toBe(2000); // 2 seconds for in-progress
    });

    it('should handle session not found', async () => {
      mockService.getSessionStatus.mockReturnValue(null);

      const request = new NextRequest('http://localhost:3000/api/force-sync/status/nonexistent');
      const response = await statusGET(request, { params: { sessionId: 'nonexistent' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Sync session not found');
      expect(data.session_id).toBe('nonexistent');
    });

    it('should validate session ID parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/force-sync/status/');
      const response = await statusGET(request, { params: { sessionId: '' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Session ID is required');
    });
  });

  describe('DELETE /api/force-sync/status/[sessionId]', () => {
    it('should successfully cancel a sync session', async () => {
      mockService.cancelSync.mockResolvedValue(true);

      const request = new NextRequest('http://localhost:3000/api/force-sync/status/session-123', {
        method: 'DELETE'
      });
      const response = await statusDELETE(request, { params: { sessionId: 'session-123' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.session_id).toBe('session-123');
      expect(data.message).toBe('Sync operation cancelled successfully');
      expect(mockService.cancelSync).toHaveBeenCalledWith('session-123');
    });

    it('should handle cancel failure', async () => {
      mockService.cancelSync.mockResolvedValue(false);

      const request = new NextRequest('http://localhost:3000/api/force-sync/status/session-123', {
        method: 'DELETE'
      });
      const response = await statusDELETE(request, { params: { sessionId: 'session-123' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Cannot cancel sync session');
      expect(data.message).toBe('Session not found or not in cancellable state');
    });

    it('should handle service errors during cancellation', async () => {
      mockService.cancelSync.mockRejectedValue(new Error('Database connection failed'));

      const request = new NextRequest('http://localhost:3000/api/force-sync/status/session-123', {
        method: 'DELETE'
      });
      const response = await statusDELETE(request, { params: { sessionId: 'session-123' } });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to cancel sync');
      expect(data.message).toBe('Database connection failed');
    });
  });
});

describe('Force Sync Integration Tests', () => {
  it('should handle complete sync workflow', async () => {
    const mockService = {
      triggerSync: jest.fn(),
      getSessionStatus: jest.fn(),
      getAllActiveSessions: jest.fn(),
      cancelSync: jest.fn(),
    } as any;

    mockForceSyncService.getInstance = jest.fn().mockReturnValue(mockService);

    // Step 1: Trigger sync
    mockService.getAllActiveSessions.mockReturnValue([]);
    mockService.triggerSync.mockResolvedValue({
      success: true,
      correlation_id: 'test-correlation',
      session_id: 'test-session',
      polling_url: '/api/force-sync/status/test-session',
      message: 'Sync initiated',
      duration_ms: 1000,
      timestamp: new Date().toISOString()
    });

    const triggerRequest = new NextRequest('http://localhost:3000/api/force-sync/trigger', {
      method: 'POST',
      body: JSON.stringify({ sync_scope: 'quick' })
    });

    const triggerResponse = await triggerForceSyncPOST(triggerRequest);
    const triggerData = await triggerResponse.json();

    expect(triggerData.success).toBe(true);
    const sessionId = triggerData.session_id;

    // Step 2: Check status (in progress)
    mockService.getSessionStatus.mockReturnValue({
      status: 'in_progress',
      progress: 50,
      message: 'Processing...',
      started_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    const statusRequest = new NextRequest(`http://localhost:3000/api/force-sync/status/${sessionId}`);
    const statusResponse = await statusGET(statusRequest, { params: { sessionId } });
    const statusData = await statusResponse.json();

    expect(statusData.success).toBe(true);
    expect(statusData.status).toBe('in_progress');
    expect(statusData.polling_interval).toBe(2000);

    // Step 3: Check status (completed)
    mockService.getSessionStatus.mockReturnValue({
      status: 'completed',
      progress: 100,
      message: 'Sync completed successfully',
      started_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      details: { workflow_id: 'completed-workflow' }
    });

    const completedStatusResponse = await statusGET(statusRequest, { params: { sessionId } });
    const completedStatusData = await completedStatusResponse.json();

    expect(completedStatusData.success).toBe(true);
    expect(completedStatusData.status).toBe('completed');
    expect(completedStatusData.progress).toBe(100);
    expect(completedStatusData.polling_interval).toBe(null);
  });
});