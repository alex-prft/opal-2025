/**
 * OPAL Payload Builder - Production-Ready
 *
 * Builds complete, validated payloads for OPAL strategy_workflow
 * Includes all required fields and proper environment variable integration
 */

export interface OpalWorkflowPayload {
  workflow_name: 'strategy_workflow';
  input_data: {
    client_name: string;
    industry: string;
    company_size: string;
    current_capabilities: string[];
    business_objectives: string[];
    additional_marketing_technology: string[];
    timeline_preference: string;
    budget_range: string;
    recipients: string[];
    triggered_by: string;
    sync_scope?: string;
    force_sync?: boolean;
    [key: string]: any;
  };
  metadata: {
    workspace_id: string;
    trigger_timestamp: string;
    correlation_id: string;
    source_system: string;
    span_id?: string;
    attempt_id?: string;
    retry_count?: number;
    environment?: string;
    version?: string;
    [key: string]: any;
  };
}

export interface PayloadBuilderOptions {
  client_name?: string;
  industry?: string;
  company_size?: string;
  current_capabilities?: string[];
  business_objectives?: string[];
  additional_marketing_technology?: string[];
  timeline_preference?: string;
  budget_range?: string;
  recipients?: string[];
  triggered_by?: string;
  sync_scope?: string;
  force_sync?: boolean;
  correlation_id?: string;
  additional_metadata?: Record<string, any>;
}

/**
 * Validates environment variables and returns configuration
 */
export function validateOpalEnvironment(): {
  isValid: boolean;
  errors: string[];
  config: {
    webhookUrl: string;
    authKey: string;
    workspaceId: string;
  };
} {
  const errors: string[] = [];

  const webhookUrl = process.env.OPAL_WEBHOOK_URL;
  const authKey = process.env.OPAL_STRATEGY_WORKFLOW_AUTH_KEY;
  const workspaceId = process.env.OPAL_WORKSPACE_ID;

  // Validate webhook URL
  if (!webhookUrl) {
    errors.push('OPAL_WEBHOOK_URL not configured');
  } else if (!webhookUrl.startsWith('https://')) {
    errors.push('OPAL_WEBHOOK_URL must use HTTPS');
  }

  // Validate auth key
  if (!authKey) {
    errors.push('OPAL_STRATEGY_WORKFLOW_AUTH_KEY not configured');
  } else if (authKey.length < 32) {
    errors.push('OPAL_STRATEGY_WORKFLOW_AUTH_KEY must be at least 32 characters');
  } else if (authKey.includes('your_') || authKey.includes('placeholder')) {
    errors.push('OPAL_STRATEGY_WORKFLOW_AUTH_KEY contains placeholder values');
  }

  // Validate workspace ID
  if (!workspaceId) {
    errors.push('OPAL_WORKSPACE_ID not configured');
  } else if (workspaceId.includes('your_') || workspaceId.includes('placeholder')) {
    errors.push('OPAL_WORKSPACE_ID contains placeholder values');
  }

  return {
    isValid: errors.length === 0,
    errors,
    config: {
      webhookUrl: webhookUrl || '',
      authKey: authKey || '',
      workspaceId: workspaceId || ''
    }
  };
}

/**
 * Builds complete OPAL workflow payload with all required fields
 */
export function buildOpalWorkflowPayload(options: PayloadBuilderOptions = {}): {
  success: boolean;
  payload?: OpalWorkflowPayload;
  errors?: string[];
  validation?: any;
} {

  // Validate environment first
  const envValidation = validateOpalEnvironment();
  if (!envValidation.isValid) {
    return {
      success: false,
      errors: envValidation.errors,
      validation: envValidation
    };
  }

  // Generate IDs if not provided
  const correlationId = options.correlation_id || `opal-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  const spanId = `span-${Date.now()}-${Math.random().toString(36).substring(7)}`;

  // Build complete payload with defaults
  const payload: OpalWorkflowPayload = {
    workflow_name: 'strategy_workflow',
    input_data: {
      // Required client information
      client_name: options.client_name || 'OPAL Integration Client',
      industry: options.industry || 'Technology',
      company_size: options.company_size || 'Medium',

      // Required capability arrays
      current_capabilities: options.current_capabilities || [
        'Web Analytics',
        'Email Marketing',
        'Content Management'
      ],
      business_objectives: options.business_objectives || [
        'Improve Conversion Rate',
        'Enhance Customer Experience',
        'Increase Revenue'
      ],
      additional_marketing_technology: options.additional_marketing_technology || [
        'Google Analytics',
        'Optimizely Platform'
      ],

      // Required operational fields
      timeline_preference: options.timeline_preference || '6-months',
      budget_range: options.budget_range || '50k-100k',
      recipients: options.recipients || ['admin@example.com'],

      // Trigger context
      triggered_by: options.triggered_by || 'force_sync',
      sync_scope: options.sync_scope || 'priority_platforms',
      force_sync: options.force_sync ?? true
    },
    metadata: {
      // Required metadata
      workspace_id: envValidation.config.workspaceId,
      trigger_timestamp: new Date().toISOString(),
      correlation_id: correlationId,
      source_system: 'OSA-ForceSync-Production',

      // Optional metadata
      span_id: spanId,
      environment: process.env.NODE_ENV || 'development',
      version: '2.0.0',

      // Merge any additional metadata
      ...options.additional_metadata
    }
  };

  return {
    success: true,
    payload,
    validation: envValidation
  };
}

/**
 * Validates a complete OPAL payload before sending
 */
export function validateOpalPayload(payload: any): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate top-level structure
  if (!payload.workflow_name) {
    errors.push('Missing required field: workflow_name');
  } else if (payload.workflow_name !== 'strategy_workflow') {
    errors.push('Invalid workflow_name: must be "strategy_workflow"');
  }

  // Validate input_data
  if (!payload.input_data) {
    errors.push('Missing required object: input_data');
  } else {
    const { input_data } = payload;

    // Required string fields
    const requiredStrings = [
      'client_name', 'industry', 'company_size',
      'timeline_preference', 'budget_range', 'triggered_by'
    ];

    requiredStrings.forEach(field => {
      if (!input_data[field] || typeof input_data[field] !== 'string') {
        errors.push(`Missing or invalid required field: input_data.${field}`);
      }
    });

    // Required array fields
    const requiredArrays = [
      'current_capabilities', 'business_objectives',
      'additional_marketing_technology', 'recipients'
    ];

    requiredArrays.forEach(field => {
      if (!Array.isArray(input_data[field])) {
        errors.push(`Missing or invalid required array: input_data.${field}`);
      } else if (input_data[field].length === 0) {
        warnings.push(`Empty array: input_data.${field}`);
      }
    });
  }

  // Validate metadata
  if (!payload.metadata) {
    errors.push('Missing required object: metadata');
  } else {
    const { metadata } = payload;

    // Required metadata fields
    const requiredMetadata = [
      'workspace_id', 'trigger_timestamp',
      'correlation_id', 'source_system'
    ];

    requiredMetadata.forEach(field => {
      if (!metadata[field]) {
        errors.push(`Missing required field: metadata.${field}`);
      }
    });

    // Check for placeholder values
    if (metadata.workspace_id && (
      metadata.workspace_id.includes('your_') ||
      metadata.workspace_id.includes('placeholder')
    )) {
      errors.push('metadata.workspace_id contains placeholder value');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Enhanced payload builder for Force Sync operations
 */
export function buildForceSyncPayload(options: {
  client_context?: {
    client_name?: string;
    industry?: string;
    recipients?: string[];
  };
  sync_scope?: string;
  triggered_by?: string;
  correlation_id?: string;
  additional_context?: Record<string, any>;
} = {}): { success: boolean; payload?: OpalWorkflowPayload; errors?: string[]; } {

  const { client_context = {}, sync_scope = 'priority_platforms', triggered_by = 'force_sync' } = options;

  return buildOpalWorkflowPayload({
    client_name: client_context.client_name || 'Force Sync Operation',
    industry: client_context.industry || 'Data Synchronization',
    company_size: 'System Operation',
    current_capabilities: ['DXP Integration', 'Data Synchronization', 'RAG Model Updates'],
    business_objectives: ['Update RAG Model', 'Refresh DXP Insights', 'Platform Sync'],
    additional_marketing_technology: ['All Integrated Platforms'],
    timeline_preference: 'Real-time',
    budget_range: 'System Operation',
    recipients: client_context.recipients || ['system@opal.ai'],
    triggered_by,
    sync_scope,
    force_sync: true,
    correlation_id: options.correlation_id,
    additional_metadata: {
      force_sync_operation: true,
      sync_timestamp: new Date().toISOString(),
      ...options.additional_context
    }
  });
}

/**
 * Get sync platforms based on scope
 */
export function getSyncPlatforms(syncScope: string): string[] {
  switch (syncScope) {
    case 'all_platforms':
      return [
        'Optimizely Data Platform (ODP)',
        'Content Recommendations',
        'CMS PaaS v12',
        'Content Marketing Platform (CMP)',
        'WebX Analytics'
      ];
    case 'priority_platforms':
      return [
        'Optimizely Data Platform (ODP)',
        'Content Recommendations',
        'CMS PaaS v12',
        'Content Marketing Platform (CMP)'
      ];
    case 'odp_only':
      return ['Optimizely Data Platform (ODP)'];
    case 'content_platforms':
      return ['Content Recommendations', 'CMS PaaS v12', 'Content Marketing Platform (CMP)'];
    default:
      return ['All Available Platforms'];
  }
}

/**
 * Debug function to log payload structure
 */
export function debugPayload(payload: OpalWorkflowPayload, maskSensitive: boolean = true): void {
  console.log('🔍 [Payload Debug] OPAL Workflow Payload Structure:');

  const debugPayload = maskSensitive ? {
    ...payload,
    metadata: {
      ...payload.metadata,
      workspace_id: payload.metadata.workspace_id ?
        `${payload.metadata.workspace_id.substring(0, 8)}...` : 'NOT_SET'
    }
  } : payload;

  console.log(JSON.stringify(debugPayload, null, 2));

  const validation = validateOpalPayload(payload);
  console.log('✅ Validation Status:', {
    valid: validation.valid,
    errors: validation.errors,
    warnings: validation.warnings
  });
}