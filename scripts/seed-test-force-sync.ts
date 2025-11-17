#!/usr/bin/env tsx
/**
 * Seed Test Force Sync Data
 * Creates a test Force Sync workflow record for validation demonstration
 */

import { createSupabaseAdmin } from '../src/lib/database/supabase-client';

async function seedTestData() {
  const supabase = createSupabaseAdmin();

  console.log('🌱 Seeding test Force Sync data for ws_abc123...\n');

  // Create Force Sync run record
  const { data: forceSyncRun, error: forceSyncError } = await supabase
    .from('force_sync_runs')
    .insert({
      force_sync_workflow_id: 'ws_abc123',
      opal_correlation_id: 'opal_corr_abc123',
      tenant_id: 'demo_tenant',
      status: 'completed',
      validation_status: 'pending',
      initiated_by: 'system',
      execution_duration_ms: 45000, // 45 seconds (within SLA)
      agent_count: 9,
      created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
      completed_at: new Date(Date.now() - 5 * 60 * 1000 + 45000).toISOString()
    })
    .select()
    .single();

  if (forceSyncError) {
    console.error('❌ Error creating Force Sync run:', forceSyncError);
  } else {
    console.log('✅ Created Force Sync run:', forceSyncRun.force_sync_workflow_id);
  }

  // Create webhook events for OPAL agents
  const agents = [
    'integration_health',
    'content_review',
    'geo_audit',
    'experimentation_strategy',
    'personalization_roadmap',
    'content_optimization',
    'audience_segmentation',
    'tech_stack_assessment',
    'quick_wins_identification'
  ];

  for (const agent of agents) {
    const { error: webhookError } = await supabase
      .from('webhook_events')
      .insert({
        event_type: 'opal.agent.response',
        source: 'opal',
        agent_id: agent,
        status: 'success',
        workflow_id: 'ws_abc123',
        correlation_id: 'opal_corr_abc123',
        tenant_id: 'demo_tenant',
        payload: {
          agent,
          status: 'success',
          response: { data: 'Agent response data' }
        },
        signature_valid: true,
        created_at: new Date(Date.now() - 4 * 60 * 1000).toISOString() // 4 minutes ago
      });

    if (webhookError) {
      console.error(`❌ Error creating webhook event for ${agent}:`, webhookError);
    }
  }

  console.log(`✅ Created ${agents.length} webhook events for OPAL agents\n`);

  // Create OSA workflow data
  const { error: osaError } = await supabase
    .from('osa_workflow_data')
    .insert({
      workflow_id: 'ws_abc123',
      tenant_id: 'demo_tenant',
      data_blob: {
        agents: agents.map(a => ({ name: a, status: 'success' })),
        summary: 'All agents completed successfully'
      },
      created_at: new Date(Date.now() - 3 * 60 * 1000).toISOString() // 3 minutes ago
    });

  if (osaError) {
    console.error('❌ Error creating OSA workflow data:', osaError);
  } else {
    console.log('✅ Created OSA workflow data\n');
  }

  console.log('🎉 Test data seeding complete!\n');
}

seedTestData()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  });
