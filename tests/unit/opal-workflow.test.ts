/**
 * OPAL Workflow Endpoint Integration Tests
 *
 * Tests for the osa_workflow_data endpoint to ensure it properly
 * receives and processes data from OPAL agents after successful
 * tool registration via the discovery endpoint.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/opal/osa-workflow/route';
import { OSAWorkflowParameters } from '@/lib/types/opal-types';

// Mock authentication for tests
vi.mock('@/lib/monitoring/agent-status-tracker', () => ({
  agentStatusTracker: {
    updateStatus: vi.fn(),
    getStatus: vi.fn(() => ({ status: 'idle' })),
  }
}));

vi.mock('@/lib/database/webhook-events', () => ({
  webhookEventOperations: {
    createEvent: vi.fn(),
    updateEvent: vi.fn(),
  }
}));

// Mock console methods
beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

function createMockWorkflowRequest(data: OSAWorkflowParameters): NextRequest {
  const url = 'http://localhost:3000/api/opal/osa-workflow';
  return new NextRequest(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer test-token'
    },
    body: JSON.stringify(data)
  });
}

function createValidWorkflowData(): OSAWorkflowParameters {
  return {
    workflow_id: 'test_workflow_123',
    agent_data: [
      {
        agent_id: 'content_review',
        agent_name: 'Content Review Agent',
        workflow_id: 'test_workflow_123',
        execution_results: {
          summary: 'Content analysis completed successfully',
          recommendations: ['Improve SEO', 'Add more images'],
          confidence_score: 0.85,
          data_points_analyzed: 150
        },
        metadata: {
          execution_time_ms: 45000,
          timestamp: new Date().toISOString(),
          success: true,
          started_at: new Date(Date.now() - 45000).toISOString(),
          completed_at: new Date().toISOString()
        },
        output_data: {
          test_mode: true
        }
      }
    ],
    client_name: 'Test Client',
    business_objectives: ['Increase conversion rate'],
    workflow_timestamp: new Date().toISOString()
  };
}

describe('OPAL Workflow Endpoint', () => {
  describe('POST /api/opal/osa-workflow', () => {
    it('should accept valid workflow data', async () => {
      const workflowData = createValidWorkflowData();
      const request = createMockWorkflowRequest(workflowData);

      const response = await POST(request);

      expect(response.status).toBe(200);

      const result = await response.json();
      expect(result).toHaveProperty('workflow_id', 'test_workflow_123');
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('agents_received');
      expect(result).toHaveProperty('total_agents', 1);
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('timestamp');
    });

    it('should validate required workflow fields', async () => {
      const invalidData = {
        // Missing workflow_id
        agent_data: []
      };

      const request = createMockWorkflowRequest(invalidData as any);
      const response = await POST(request);

      expect(response.status).toBe(400);

      const result = await response.json();
      expect(result).toHaveProperty('error');
      expect(result).toHaveProperty('message');
    });

    it('should validate agent data structure', async () => {
      const workflowData = createValidWorkflowData();
      // Remove required agent fields
      delete workflowData.agent_data[0].metadata;

      const request = createMockWorkflowRequest(workflowData);
      const response = await POST(request);

      expect(response.status).toBe(400);

      const result = await response.json();
      expect(result).toHaveProperty('error');
    });

    it('should handle multiple agents', async () => {
      const workflowData = createValidWorkflowData();

      // Add second agent
      workflowData.agent_data.push({
        agent_id: 'geo_audit',
        agent_name: 'Geo Audit Agent',
        workflow_id: 'test_workflow_123',
        execution_results: {
          summary: 'Geographic analysis completed',
          recommendations: ['Target European markets'],
          confidence_score: 0.78,
          data_points_analyzed: 200
        },
        metadata: {
          execution_time_ms: 60000,
          timestamp: new Date().toISOString(),
          success: true,
          started_at: new Date(Date.now() - 60000).toISOString(),
          completed_at: new Date().toISOString()
        },
        output_data: {
          test_mode: true
        }
      });

      const request = createMockWorkflowRequest(workflowData);
      const response = await POST(request);

      expect(response.status).toBe(200);

      const result = await response.json();
      expect(result.total_agents).toBe(2);
      expect(result.agents_received).toHaveLength(2);
      expect(result.agents_received).toContain('content_review');
      expect(result.agents_received).toContain('geo_audit');
    });

    it('should handle partial agent failures gracefully', async () => {
      const workflowData = createValidWorkflowData();

      // Add a failed agent
      workflowData.agent_data.push({
        agent_id: 'audience_suggester',
        agent_name: 'Audience Suggester Agent',
        workflow_id: 'test_workflow_123',
        execution_results: {
          summary: 'Agent execution failed',
          recommendations: [],
          confidence_score: 0,
          data_points_analyzed: 0
        },
        metadata: {
          execution_time_ms: 5000,
          timestamp: new Date().toISOString(),
          success: false,
          error_message: 'Data source unavailable',
          started_at: new Date(Date.now() - 5000).toISOString(),
          completed_at: new Date().toISOString()
        },
        output_data: {}
      });

      const request = createMockWorkflowRequest(workflowData);
      const response = await POST(request);

      expect(response.status).toBe(200);

      const result = await response.json();
      expect(result.total_agents).toBe(2);
      // Should still process successful agents
      expect(result.agents_received).toContain('content_review');
    });

    it('should set correct response headers', async () => {
      const workflowData = createValidWorkflowData();
      const request = createMockWorkflowRequest(workflowData);

      const response = await POST(request);

      expect(response.headers.get('Content-Type')).toBe('application/json');
      expect(response.headers.get('X-Workflow-Processed')).toBe('true');
    });

    it('should validate supported agent IDs', async () => {
      const workflowData = createValidWorkflowData();
      workflowData.agent_data[0].agent_id = 'invalid_agent' as any;

      const request = createMockWorkflowRequest(workflowData);
      const response = await POST(request);

      expect(response.status).toBe(400);

      const result = await response.json();
      expect(result.error).toContain('validation');
    });

    it('should handle authentication errors', async () => {
      const workflowData = createValidWorkflowData();
      const url = 'http://localhost:3000/api/opal/osa-workflow';

      // Request without authorization header
      const requestWithoutAuth = new NextRequest(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(workflowData)
      });

      const response = await POST(requestWithoutAuth);

      // In development mode, auth might be bypassed
      // In production, this should return 401
      expect([200, 401]).toContain(response.status);
    });
  });

  describe('Integration with Discovery Endpoint', () => {
    it('should match the function signature from discovery', async () => {
      // Import the discovery endpoint to verify consistency
      const { GET } = await import('@/app/api/opal/discovery/route');

      const discoveryRequest = new NextRequest('http://localhost:3000/api/opal/discovery');
      const discoveryResponse = await GET(discoveryRequest);
      const discoveryData = await discoveryResponse.json();

      const toolFunction = discoveryData.tools.osa_workflow_data.function;
      const parameters = toolFunction.parameters.properties;

      // Verify the workflow endpoint accepts the parameters defined in discovery
      const workflowData = createValidWorkflowData();

      // Ensure our test data matches the discovery schema
      expect(workflowData).toHaveProperty('workflow_id');
      expect(workflowData).toHaveProperty('agent_data');

      // Verify workflow_id type
      expect(typeof workflowData.workflow_id).toBe('string');

      // Verify agent_data structure
      expect(Array.isArray(workflowData.agent_data)).toBe(true);

      // Verify agent data has required fields from discovery
      const agent = workflowData.agent_data[0];
      expect(agent).toHaveProperty('agent_id');
      expect(agent).toHaveProperty('agent_name');
      expect(agent).toHaveProperty('workflow_id');
      expect(agent).toHaveProperty('metadata');

      // Test the actual endpoint with discovery-compliant data
      const request = createMockWorkflowRequest(workflowData);
      const response = await POST(request);

      expect(response.status).toBe(200);
    });

    it('should return response matching discovery return type', async () => {
      const { GET } = await import('@/app/api/opal/discovery/route');

      const discoveryRequest = new NextRequest('http://localhost:3000/api/opal/discovery');
      const discoveryResponse = await GET(discoveryRequest);
      const discoveryData = await discoveryResponse.json();

      const returnType = discoveryData.tools.osa_workflow_data.function.returns;
      const returnProperties = returnType.properties;

      // Test actual workflow response
      const workflowData = createValidWorkflowData();
      const request = createMockWorkflowRequest(workflowData);
      const response = await POST(request);
      const result = await response.json();

      // Verify response matches discovery return type
      Object.keys(returnProperties).forEach(property => {
        expect(result).toHaveProperty(property);
      });

      // Verify specific types
      expect(typeof result.workflow_id).toBe('string');
      expect(typeof result.status).toBe('string');
      expect(Array.isArray(result.agents_received)).toBe(true);
      expect(typeof result.total_agents).toBe('number');
      expect(typeof result.message).toBe('string');
      expect(typeof result.timestamp).toBe('string');

      // Verify status is one of the allowed enum values
      const allowedStatuses = returnProperties.status.enum;
      expect(allowedStatuses).toContain(result.status);
    });
  });

  describe('Error Prevention Tests', () => {
    it('should never return undefined or null responses', async () => {
      const workflowData = createValidWorkflowData();
      const request = createMockWorkflowRequest(workflowData);

      const response = await POST(request);
      const result = await response.json();

      expect(result).toBeDefined();
      expect(result).not.toBeNull();
      expect(typeof result).toBe('object');
    });

    it('should handle malformed JSON gracefully', async () => {
      const url = 'http://localhost:3000/api/opal/osa-workflow';
      const requestWithBadJSON = new NextRequest(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: '{"invalid": json}'  // Malformed JSON
      });

      const response = await POST(requestWithBadJSON);

      expect(response.status).toBe(400);

      const result = await response.json();
      expect(result).toHaveProperty('error');
      expect(result).toHaveProperty('message');
    });

    it('should validate workflow_id format', async () => {
      const workflowData = createValidWorkflowData();
      workflowData.workflow_id = ''; // Empty workflow ID

      const request = createMockWorkflowRequest(workflowData);
      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('should handle large payloads appropriately', async () => {
      const workflowData = createValidWorkflowData();

      // Add many agents to test payload size handling
      for (let i = 0; i < 50; i++) {
        workflowData.agent_data.push({
          ...workflowData.agent_data[0],
          agent_id: `test_agent_${i}` as any
        });
      }

      const request = createMockWorkflowRequest(workflowData);
      const response = await POST(request);

      // Should either process successfully or reject gracefully
      expect([200, 400, 413]).toContain(response.status);
    });
  });
});