/**
 * Tests for OPAL Webhook Wrapper Implementation
 * Validates the osa_send_data_to_osa_webhook endpoint functionality
 */

import { NextRequest } from 'next/server';
import { POST, GET } from '@/app/api/tools/osa_send_data_to_osa_webhook/route';

// Mock the enhanced tools endpoint
global.fetch = jest.fn();

describe('OPAL Webhook Wrapper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock successful enhanced tools response by default
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      text: async () => JSON.stringify({
        success: true,
        message: 'Tool executed successfully',
        workflow_id: 'test-workflow-123',
        agent_id: 'audience_suggester'
      })
    });
  });

  describe('POST /api/tools/osa_send_data_to_osa_webhook', () => {
    it('should successfully transform and forward OPAL webhook parameters', async () => {
      const opalPayload = {
        agent_name: 'audience_suggester',
        execution_results: {
          hero: { title: 'Test Results', confidence: 85 },
          overview: { summary: 'Test summary' },
          insights: [{ title: 'Test Insight' }]
        },
        workflow_id: 'test-workflow-123',
        metadata: {
          execution_status: 'completed',
          execution_time_ms: 2500,
          timestamp: '2024-11-20T13:30:00Z',
          success: true
        }
      };

      const request = new NextRequest('http://localhost:3000/api/tools/osa_send_data_to_osa_webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token-123'
        },
        body: JSON.stringify(opalPayload)
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.workflow_id).toBe('test-workflow-123');
      expect(responseData.agent_name).toBe('audience_suggester');

      // Verify enhanced tools was called with transformed parameters
      expect(global.fetch).toHaveBeenCalledTimes(1);
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      expect(fetchCall[0]).toContain('/api/opal/enhanced-tools');

      const enhancedToolsPayload = JSON.parse(fetchCall[1].body);
      expect(enhancedToolsPayload.tool_name).toBe('send_data_to_osa_enhanced');
      expect(enhancedToolsPayload.parameters.workflow_id).toBe('test-workflow-123');
      expect(enhancedToolsPayload.parameters.agent_id).toBe('audience_suggester');
      expect(enhancedToolsPayload.parameters.execution_status).toBe('completed');
      expect(enhancedToolsPayload.parameters.agent_data).toEqual(opalPayload.execution_results);
    });

    it('should handle missing required parameters', async () => {
      const invalidPayload = {
        agent_name: 'audience_suggester',
        // Missing execution_results, workflow_id, metadata
      };

      const request = new NextRequest('http://localhost:3000/api/tools/osa_send_data_to_osa_webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidPayload)
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe('Invalid parameters');
    });

    it('should forward authentication headers correctly', async () => {
      const opalPayload = {
        agent_name: 'audience_suggester',
        execution_results: { test: 'data' },
        workflow_id: 'test-workflow-123',
        metadata: { execution_status: 'completed', success: true }
      };

      const request = new NextRequest('http://localhost:3000/api/tools/osa_send_data_to_osa_webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token-123',
          'X-OSA-Signature': 'sha256=test-signature'
        },
        body: JSON.stringify(opalPayload)
      });

      const response = await POST(request);

      expect(response.status).toBe(200);

      // Verify authentication headers were forwarded
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const headers = fetchCall[1].headers;
      expect(headers['Authorization']).toBe('Bearer test-token-123');
      expect(headers['X-OSA-Signature']).toBe('sha256=test-signature');
    });

    it('should handle enhanced tools failure gracefully', async () => {
      // Mock enhanced tools failure
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: async () => JSON.stringify({
          error: 'Enhanced tools processing failed',
          message: 'Internal server error'
        })
      });

      const opalPayload = {
        agent_name: 'audience_suggester',
        execution_results: { test: 'data' },
        workflow_id: 'test-workflow-123',
        metadata: { execution_status: 'completed', success: true }
      };

      const request = new NextRequest('http://localhost:3000/api/tools/osa_send_data_to_osa_webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(opalPayload)
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe('Enhanced tools execution failed');
    });

    it('should use default execution_status when not provided', async () => {
      const opalPayload = {
        agent_name: 'audience_suggester',
        execution_results: { test: 'data' },
        workflow_id: 'test-workflow-123',
        metadata: {} // No execution_status provided
      };

      const request = new NextRequest('http://localhost:3000/api/tools/osa_send_data_to_osa_webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(opalPayload)
      });

      const response = await POST(request);

      expect(response.status).toBe(200);

      // Verify default execution_status was used
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const enhancedToolsPayload = JSON.parse(fetchCall[1].body);
      expect(enhancedToolsPayload.parameters.execution_status).toBe('completed');
    });
  });

  describe('GET /api/tools/osa_send_data_to_osa_webhook', () => {
    it('should return tool discovery information', async () => {
      const request = new NextRequest('http://localhost:3000/api/tools/osa_send_data_to_osa_webhook', {
        method: 'GET'
      });

      const response = await GET(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.name).toBe('osa_send_data_to_osa_webhook');
      expect(responseData.description).toContain('Send agent data and results to OSA application');
      expect(responseData.version).toBe('1.0.0');
      expect(responseData.input_schema).toBeDefined();
      expect(responseData.input_schema.required).toContain('agent_name');
      expect(responseData.input_schema.required).toContain('execution_results');
      expect(responseData.input_schema.required).toContain('workflow_id');
      expect(responseData.input_schema.required).toContain('metadata');
      expect(responseData.bridge_target).toBe('send_data_to_osa_enhanced');
    });
  });

  describe('Parameter Transformation', () => {
    it('should correctly transform OPAL parameters to enhanced tool format', async () => {
      const opalPayload = {
        agent_name: 'content_review',
        execution_results: {
          hero: { title: 'Content Analysis', confidence: 92 },
          insights: [{ title: 'Content Gap Analysis' }]
        },
        workflow_id: 'content-workflow-456',
        metadata: {
          execution_status: 'partial',
          execution_time_ms: 1800,
          timestamp: '2024-11-20T14:00:00Z',
          success: false,
          quality_score: 0.85
        },
        webhook_endpoint: 'opal/workflow-results'
      };

      const request = new NextRequest('http://localhost:3000/api/tools/osa_send_data_to_osa_webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(opalPayload)
      });

      const response = await POST(request);

      expect(response.status).toBe(200);

      // Verify transformation
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const transformedPayload = JSON.parse(fetchCall[1].body);

      expect(transformedPayload.tool_name).toBe('send_data_to_osa_enhanced');
      expect(transformedPayload.parameters.workflow_id).toBe('content-workflow-456');
      expect(transformedPayload.parameters.agent_id).toBe('content_review');
      expect(transformedPayload.parameters.execution_status).toBe('partial');
      expect(transformedPayload.parameters.agent_data).toEqual(opalPayload.execution_results);
      expect(transformedPayload.parameters.metadata.source).toBe('opal_chat_interface');
      expect(transformedPayload.parameters.metadata.webhook_endpoint).toBe('opal/workflow-results');
      expect(transformedPayload.parameters.metadata.quality_score).toBe(0.85);
    });
  });
});