/**
 * Debug test to understand what the API is actually returning
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

// Import the bulletproof handlers
import { GET } from '@/app/api/opal/workflows/[agent]/output/route';

describe('Debug API Response', () => {
  let mockRequest: NextRequest;

  beforeEach(() => {
    mockRequest = new NextRequest('http://localhost:3000/api/opal/workflows/strategy_workflow/output?page_id=test-page');

    // Spy on console to see what's happening
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should show what the API actually returns', async () => {
    const response = await GET(mockRequest, { params: { agent: 'strategy_workflow' } });
    const data = await response.json();

    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));

    // Just verify it's working
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });
});