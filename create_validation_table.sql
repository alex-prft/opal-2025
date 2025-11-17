-- Create opal_integration_validation table manually for development

create table if not exists opal_integration_validation (
  -- Primary identification
  id uuid primary key default gen_random_uuid(),
  tenant_id text,
  force_sync_workflow_id text not null,
  opal_correlation_id text,

  -- Overall validation status
  overall_status text not null check (overall_status in ('green', 'red', 'yellow')),
  summary text,

  -- Force Sync layer metrics
  force_sync_last_at timestamptz,
  force_sync_status text,
  force_sync_agent_count integer,

  -- OPAL layer metrics
  opal_workflow_status text,
  opal_agent_statuses jsonb default '{}'::jsonb,
  opal_agent_response_count integer default 0,

  -- OSA layer metrics
  osa_last_webhook_at timestamptz,
  osa_last_agent_data_at timestamptz,
  osa_last_force_sync_at timestamptz,
  osa_workflow_data jsonb default '{}'::jsonb,
  osa_reception_rate numeric(5,4) default 0,

  -- Health signals
  health_overall_status text,
  health_signature_valid_rate numeric(5,4) default 0,
  health_error_rate_24h numeric(5,4) default 0,
  health_last_webhook_minutes_ago integer,

  -- Error details and diagnostics
  errors jsonb default '{}'::jsonb,

  -- Metadata
  validated_at timestamptz not null default now(),
  validation_status text default 'completed' check (validation_status in ('pending', 'completed', 'failed')),

  -- Constraints
  constraint opal_integration_validation_workflow_id_check
    check (char_length(force_sync_workflow_id) > 0),
  constraint opal_integration_validation_summary_check
    check (char_length(summary) > 0)
);

-- Insert sample data for testing
insert into opal_integration_validation (
  force_sync_workflow_id,
  overall_status,
  summary,
  force_sync_status,
  opal_workflow_status,
  health_overall_status
) values (
  'test-workflow-' || extract(epoch from now())::text,
  'green',
  'Test validation record for development',
  'completed',
  'success',
  'healthy'
) on conflict do nothing;