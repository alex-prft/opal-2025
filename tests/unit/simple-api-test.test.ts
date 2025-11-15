/**
 * Simple test to verify the bulletproof API works
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

// Mock the agent coordinator properly
vi.mock('@/lib/orchestration/agent-coordinator', () => ({
  agentCoordinator: {
    executeWithCoordination: vi.fn(),
    getCachedResult: vi.fn(),
    forceRefresh: vi.fn()
  }
}));

import { GET } from '@/app/api/opal/workflows/[agent]/output/route';
import { agentCoordinator } from '@/lib/orchestration/agent-coordinator';

describe('Simple API Test', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 200 when everything works', async () => {
    // Mock successful responses
    (agentCoordinator.getCachedResult as any).mockResolvedValue(null);
    (agentCoordinator.executeWithCoordination as any).mockResolvedValue({
      success: true,
      data: { test: 'success' },
      confidence_score: 0.8
    });

    const mockRequest = new NextRequest('http://localhost:3000/api/opal/workflows/strategy_workflow/output?page_id=test-page');
    const response = await GET(mockRequest, { params: { agent: 'strategy_workflow' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    console.log('Success case - fallback_used:', data.metadata.fallback_used);
  });

  it('should return 200 when agent coordinator fails', async () => {
    // Mock failures
    (agentCoordinator.getCachedResult as any).mockResolvedValue(null);
    (agentCoordinator.executeWithCoordination as any).mockRejectedValue(new Error('Coordinator failed'));

    const mockRequest = new NextRequest('http://localhost:3000/api/opal/workflows/strategy_workflow/output?page_id=test-page');
    const response = await GET(mockRequest, { params: { agent: 'strategy_workflow' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    console.log('Failure case - fallback_used:', data.metadata.fallback_used);
    console.log('Failure case - data:', JSON.stringify(data.data, null, 2));
  });
});