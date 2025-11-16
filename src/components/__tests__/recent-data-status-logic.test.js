/**
 * @jest-environment jsdom
 */

// Extract the status logic for testing (this mirrors the component logic)
function getDisplayStatus(isLoading, error, osaStatus) {
  if (error) return 'failed';
  if (isLoading && !osaStatus) return 'processing';
  if (!osaStatus) return 'none';

  switch (osaStatus.lastWorkflowStatus) {
    case 'running':
      return 'processing';
    case 'completed':
      return 'success';
    case 'failed':
      return 'failed';
    case 'idle':
    default:
      return osaStatus.lastWebhookAt || osaStatus.lastAgentDataAt ? 'success' : 'none';
  }
}

function getLastActivityTime(osaStatus) {
  if (!osaStatus) return null;

  const times = [
    osaStatus.lastWebhookAt,
    osaStatus.lastAgentDataAt,
    osaStatus.lastForceSyncAt,
  ].filter(Boolean);

  if (times.length === 0) return null;

  times.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  return times[0];
}

describe('RecentDataComponent Status Logic', () => {
  describe('getDisplayStatus', () => {
    test('should return failed when there is an error', () => {
      const error = new Error('Test error');
      const status = getDisplayStatus(false, error, null);
      expect(status).toBe('failed');
    });

    test('should return processing when loading and no osa status', () => {
      const status = getDisplayStatus(true, null, null);
      expect(status).toBe('processing');
    });

    test('should return none when no osa status and not loading', () => {
      const status = getDisplayStatus(false, null, null);
      expect(status).toBe('none');
    });

    test('should return processing when workflow status is running', () => {
      const osaStatus = {
        lastWebhookAt: null,
        lastAgentDataAt: null,
        lastForceSyncAt: null,
        lastWorkflowStatus: 'running'
      };
      const status = getDisplayStatus(false, null, osaStatus);
      expect(status).toBe('processing');
    });

    test('should return success when workflow status is completed', () => {
      const osaStatus = {
        lastWebhookAt: null,
        lastAgentDataAt: null,
        lastForceSyncAt: null,
        lastWorkflowStatus: 'completed'
      };
      const status = getDisplayStatus(false, null, osaStatus);
      expect(status).toBe('success');
    });

    test('should return failed when workflow status is failed', () => {
      const osaStatus = {
        lastWebhookAt: null,
        lastAgentDataAt: null,
        lastForceSyncAt: null,
        lastWorkflowStatus: 'failed'
      };
      const status = getDisplayStatus(false, null, osaStatus);
      expect(status).toBe('failed');
    });

    test('should return success for idle status with recent webhook data', () => {
      const osaStatus = {
        lastWebhookAt: '2025-11-16T20:00:00Z',
        lastAgentDataAt: null,
        lastForceSyncAt: null,
        lastWorkflowStatus: 'idle'
      };
      const status = getDisplayStatus(false, null, osaStatus);
      expect(status).toBe('success');
    });

    test('should return success for idle status with recent agent data', () => {
      const osaStatus = {
        lastWebhookAt: null,
        lastAgentDataAt: '2025-11-16T20:00:00Z',
        lastForceSyncAt: null,
        lastWorkflowStatus: 'idle'
      };
      const status = getDisplayStatus(false, null, osaStatus);
      expect(status).toBe('success');
    });

    test('should return none for idle status with no recent data', () => {
      const osaStatus = {
        lastWebhookAt: null,
        lastAgentDataAt: null,
        lastForceSyncAt: '2025-11-16T20:00:00Z', // Force sync alone doesn't count as "recent data"
        lastWorkflowStatus: 'idle'
      };
      const status = getDisplayStatus(false, null, osaStatus);
      expect(status).toBe('none');
    });
  });

  describe('getLastActivityTime', () => {
    test('should return null when no osa status', () => {
      const result = getLastActivityTime(null);
      expect(result).toBe(null);
    });

    test('should return null when all timestamps are null', () => {
      const osaStatus = {
        lastWebhookAt: null,
        lastAgentDataAt: null,
        lastForceSyncAt: null,
        lastWorkflowStatus: 'idle'
      };
      const result = getLastActivityTime(osaStatus);
      expect(result).toBe(null);
    });

    test('should return the most recent timestamp', () => {
      const osaStatus = {
        lastWebhookAt: '2025-11-16T18:00:00Z',
        lastAgentDataAt: '2025-11-16T19:00:00Z', // Most recent
        lastForceSyncAt: '2025-11-16T17:00:00Z',
        lastWorkflowStatus: 'idle'
      };
      const result = getLastActivityTime(osaStatus);
      expect(result).toBe('2025-11-16T19:00:00Z');
    });

    test('should handle mixed null and timestamp values', () => {
      const osaStatus = {
        lastWebhookAt: null,
        lastAgentDataAt: '2025-11-16T19:00:00Z',
        lastForceSyncAt: '2025-11-16T20:00:00Z', // Most recent
        lastWorkflowStatus: 'idle'
      };
      const result = getLastActivityTime(osaStatus);
      expect(result).toBe('2025-11-16T20:00:00Z');
    });
  });

  describe('Real-world scenarios', () => {
    test('should handle typical success scenario', () => {
      const osaStatus = {
        lastWebhookAt: '2025-11-15T18:41:29.945118+00:00',
        lastAgentDataAt: '2025-11-15T18:41:29.945118+00:00',
        lastForceSyncAt: '2025-11-16T20:37:17.986635+00:00',
        lastWorkflowStatus: 'idle'
      };

      const status = getDisplayStatus(false, null, osaStatus);
      const lastActivity = getLastActivityTime(osaStatus);

      expect(status).toBe('success');
      expect(lastActivity).toBe('2025-11-16T20:37:17.986635+00:00');
    });

    test('should handle fresh system with no data', () => {
      const osaStatus = {
        lastWebhookAt: null,
        lastAgentDataAt: null,
        lastForceSyncAt: null,
        lastWorkflowStatus: 'idle'
      };

      const status = getDisplayStatus(false, null, osaStatus);
      const lastActivity = getLastActivityTime(osaStatus);

      expect(status).toBe('none');
      expect(lastActivity).toBe(null);
    });

    test('should handle active workflow processing', () => {
      const osaStatus = {
        lastWebhookAt: '2025-11-16T20:00:00Z',
        lastAgentDataAt: '2025-11-16T20:00:00Z',
        lastForceSyncAt: '2025-11-16T20:05:00Z',
        lastWorkflowStatus: 'running'
      };

      const status = getDisplayStatus(false, null, osaStatus);
      const lastActivity = getLastActivityTime(osaStatus);

      expect(status).toBe('processing');
      expect(lastActivity).toBe('2025-11-16T20:05:00Z');
    });
  });
});