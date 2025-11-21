/**
 * OPAL Schema Definitions
 * Zod schemas for type-safe OPAL payload validation
 */

import { z } from 'zod';

// Environment validation
export const EnvironmentSchema = z.enum(['development', 'staging', 'production']);

// Base agent data schema
export const AgentDataSchema = z.record(z.unknown()).optional();

// Enhanced tool execution request schema
export const EnhancedToolExecuteSchema = z.object({
  tool_name: z.literal('send_data_to_osa_enhanced'),
  parameters: z.object({
    workflow_id: z.string().min(1, 'workflow_id is required'),
    agent_id: z.string().min(1, 'agent_id is required'),
    agent_data: AgentDataSchema,
    execution_status: z.enum(['success', 'failure', 'pending', 'timeout']),
    target_environment: EnvironmentSchema.optional().default('production'),
    offset: z.number().int().min(0).optional(),
    metadata: z.record(z.unknown()).optional()
  })
});

// Webhook event payload schema (what we receive from OPAL agents)
export const WebhookEventSchema = z.object({
  workflow_id: z.string().min(1),
  agent_id: z.string().min(1),
  agent_data: AgentDataSchema,
  execution_status: z.enum(['success', 'failure', 'pending', 'timeout']),
  offset: z.number().int().min(0).nullable().optional(),
  timestamp: z.string().datetime().optional(),
  metadata: z.record(z.unknown()).optional()
});

// Tool discovery response schema
export const ToolDiscoverySchema = z.object({
  tools: z.array(z.object({
    name: z.string(),
    description: z.string(),
    version: z.string(),
    parameters: z.object({
      type: z.literal('object'),
      properties: z.record(z.object({
        type: z.string(),
        description: z.string(),
        required: z.boolean().optional()
      })),
      required: z.array(z.string()).optional()
    }),
    webhook_target_url: z.string().url(),
    required_headers: z.record(z.string()).optional()
  })),
  base_url: z.string().url(),
  version: z.string(),
  updated_at: z.string().datetime()
});

// Database schemas
export const OpalWebhookEventDbSchema = z.object({
  id: z.string().uuid(),
  workflow_id: z.string(),
  agent_id: z.string(),
  offset: z.number().int().nullable(),
  payload_json: z.record(z.unknown()),
  signature_valid: z.boolean(),
  dedup_hash: z.string(),
  received_at: z.date(),
  http_status: z.number().int(),
  error_text: z.string().nullable()
});

// Health check response schema
export const HealthCheckSchema = z.object({
  overall_status: z.enum(['green', 'yellow', 'red']),
  last_webhook_minutes_ago: z.number().nullable(),
  signature_valid_rate: z.number().min(0).max(1),
  error_rate_24h: z.number().min(0).max(1),
  config_checks: z.object({
    osa_webhook_secret_configured: z.boolean(),
    osa_webhook_url_configured: z.boolean(),
    opal_tools_discovery_url_configured: z.boolean()
  }),
  metrics: z.object({
    total_events_24h: z.number().int(),
    successful_events_24h: z.number().int(),
    failed_events_24h: z.number().int(),
    last_event_timestamp: z.string().datetime().nullable()
  })
});

// Diagnostics response schema
export const DiagnosticsResponseSchema = z.object({
  events: z.array(z.object({
    id: z.string(),
    workflow_id: z.string(),
    agent_id: z.string(),
    received_at: z.string().datetime(),
    signature_valid: z.boolean(),
    http_status: z.number().int(),
    error_text: z.string().nullable(),
    payload_preview: z.string() // Truncated JSON string
  })),
  summary: z.object({
    total_count: z.number().int(),
    returned_count: z.number().int(),
    signature_valid_count: z.number().int(),
    error_count: z.number().int(),
    date_range: z.object({
      from: z.string().datetime().nullable(),
      to: z.string().datetime().nullable()
    })
  })
});

// Type exports for TypeScript
export type EnvironmentType = z.infer<typeof EnvironmentSchema>;
export type AgentData = z.infer<typeof AgentDataSchema>;
export type EnhancedToolExecute = z.infer<typeof EnhancedToolExecuteSchema>;
export type WebhookEvent = z.infer<typeof WebhookEventSchema>;
export type ToolDiscovery = z.infer<typeof ToolDiscoverySchema>;
export type OpalWebhookEventDb = z.infer<typeof OpalWebhookEventDbSchema>;
export type HealthCheck = z.infer<typeof HealthCheckSchema>;
export type DiagnosticsResponse = z.infer<typeof DiagnosticsResponseSchema>;

/**
 * Validate and parse enhanced tool execution request
 */
export function parseEnhancedToolRequest(data: unknown): EnhancedToolExecute {
  return EnhancedToolExecuteSchema.parse(data);
}

/**
 * Validate and parse webhook event
 */
export function parseWebhookEvent(data: unknown): WebhookEvent {
  return WebhookEventSchema.parse(data);
}

/**
 * Generate deduplication hash for webhook event
 * Uses workflow_id, agent_id, offset, and payload hash for uniqueness
 */
export function generateDedupHash(event: WebhookEvent): string {
  const crypto = require('crypto');
  const payloadStr = JSON.stringify(event.agent_data || {}, Object.keys(event.agent_data || {}).sort());
  const dedupData = `${event.workflow_id}|${event.agent_id}|${event.offset || 0}|${payloadStr}`;
  return crypto.createHash('sha256').update(dedupData).digest('hex');
}

/**
 * Truncate payload for preview display
 */
export function truncatePayloadForPreview(payload: unknown, maxLength: number = 200): string {
  const jsonStr = JSON.stringify(payload);
  return jsonStr.length <= maxLength ? jsonStr : jsonStr.substring(0, maxLength) + '...';
}