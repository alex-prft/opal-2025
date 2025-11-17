-- Migration: OPAL Integration Validation System
-- Created: 2025-11-16
-- Purpose: Create tables and indexes for end-to-end OPAL pipeline validation

-- =====================================================
-- Table: opal_integration_validation
-- Purpose: Store comprehensive validation results for Force Sync → OPAL → OSA pipelines
-- =====================================================

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
  osa_reception_rate numeric(5,4) default 0, -- e.g., 0.8500 for 85%

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

-- =====================================================
-- Table: force_sync_runs  
-- Purpose: Track Force Sync execution lifecycle for validation coordination
-- =====================================================

create table if not exists force_sync_runs (
  -- Primary identification
  id uuid primary key default gen_random_uuid(),
  force_sync_workflow_id text not null,
  opal_correlation_id text,
  tenant_id text,
  
  -- Status tracking
  status text not null check (status in ('initiated', 'running', 'completed', 'failed', 'timeout')),
  validation_status text not null default 'pending' check (validation_status in ('pending', 'validated', 'failed')),
  
  -- Execution metadata
  initiated_by text, -- user ID or system identifier
  execution_duration_ms integer,
  agent_count integer,
  
  -- Timestamps
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  
  -- Constraints
  constraint force_sync_runs_workflow_id_check 
    check (char_length(force_sync_workflow_id) > 0),
  constraint force_sync_runs_duration_check 
    check (execution_duration_ms is null or execution_duration_ms >= 0)
);

-- =====================================================
-- INDEXES for performance optimization
-- =====================================================

-- Primary lookup: get latest validation per workflow
create index if not exists idx_opal_integration_validation_workflow_latest
  on opal_integration_validation (force_sync_workflow_id, validated_at desc);

-- Status monitoring: find unhealthy integrations
create index if not exists idx_opal_integration_validation_status_time
  on opal_integration_validation (overall_status, validated_at desc);

-- Tenant-based filtering
create index if not exists idx_opal_integration_validation_tenant
  on opal_integration_validation (tenant_id, validated_at desc)
  where tenant_id is not null;

-- Force Sync workflow correlation
create index if not exists idx_opal_integration_validation_correlation
  on opal_integration_validation (opal_correlation_id, validated_at desc)
  where opal_correlation_id is not null;

-- Force Sync runs: primary query patterns
create index if not exists idx_force_sync_runs_status_validation
  on force_sync_runs (status, validation_status, created_at desc);

create index if not exists idx_force_sync_runs_workflow_status
  on force_sync_runs (force_sync_workflow_id, status, updated_at desc);

create index if not exists idx_force_sync_runs_tenant_status
  on force_sync_runs (tenant_id, status, created_at desc)
  where tenant_id is not null;

-- =====================================================
-- ROW LEVEL SECURITY (Optional - for multi-tenant scenarios)
-- =====================================================

-- Enable RLS on both tables
alter table opal_integration_validation enable row level security;
alter table force_sync_runs enable row level security;

-- Policy: Admins can access all records
create policy "Admin access to integration validation" on opal_integration_validation
  for all using (auth.jwt() ->> 'role' = 'admin');

create policy "Admin access to force sync runs" on force_sync_runs
  for all using (auth.jwt() ->> 'role' = 'admin');

-- Policy: Users can only access their tenant's records
create policy "Tenant access to integration validation" on opal_integration_validation
  for select using (
    tenant_id = auth.jwt() ->> 'tenant_id' or 
    tenant_id is null
  );

create policy "Tenant access to force sync runs" on force_sync_runs
  for select using (
    tenant_id = auth.jwt() ->> 'tenant_id' or 
    tenant_id is null
  );

-- =====================================================
-- FUNCTIONS for common operations
-- =====================================================

-- Function: Get latest integration status for a workflow
create or replace function get_latest_integration_status(workflow_id text)
returns opal_integration_validation
language sql
stable
as $$
  select * from opal_integration_validation
  where force_sync_workflow_id = workflow_id
  order by validated_at desc
  limit 1;
$$;

-- Function: Get pending Force Sync runs for validation
create or replace function get_pending_force_sync_validations(limit_count integer default 10)
returns setof force_sync_runs
language sql
stable
as $$
  select * from force_sync_runs
  where status = 'completed' 
    and validation_status = 'pending'
  order by completed_at desc nulls last, created_at desc
  limit limit_count;
$$;

-- Function: Mark Force Sync as validated
create or replace function mark_force_sync_validated(
  workflow_id text,
  validation_record_id uuid default null
)
returns boolean
language plpgsql
as $$
begin
  update force_sync_runs
  set 
    validation_status = 'validated',
    updated_at = now()
  where force_sync_workflow_id = workflow_id;
  
  return found;
end;
$$;

-- =====================================================
-- TRIGGERS for automatic timestamp updates
-- =====================================================

-- Trigger function for updated_at timestamps
create or replace function update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Apply trigger to force_sync_runs
create trigger force_sync_runs_updated_at
  before update on force_sync_runs
  for each row
  execute function update_updated_at_column();

-- =====================================================
-- COMMENTS for documentation
-- =====================================================

comment on table opal_integration_validation is 
  'Comprehensive validation results for Force Sync → OPAL → OSA → Results pipeline';

comment on table force_sync_runs is 
  'Force Sync execution tracking for validation coordination';

comment on column opal_integration_validation.overall_status is 
  'green=healthy, yellow=partial issues, red=critical failures';

comment on column opal_integration_validation.osa_reception_rate is 
  'Percentage of OPAL agents successfully received by OSA (0.0-1.0)';

comment on column force_sync_runs.validation_status is 
  'pending=awaiting validation, validated=validation completed, failed=validation error';

-- =====================================================
-- EXAMPLE QUERIES for testing
-- =====================================================

/*
-- Query: Get latest validation status for all workflows
select 
  force_sync_workflow_id,
  overall_status,
  summary,
  validated_at,
  osa_reception_rate
from opal_integration_validation
where validated_at > now() - interval '24 hours'
order by validated_at desc;

-- Query: Find workflows needing validation
select * from get_pending_force_sync_validations(5);

-- Query: Get integration health summary
select 
  overall_status,
  count(*) as count,
  avg(osa_reception_rate) as avg_reception_rate
from opal_integration_validation
where validated_at > now() - interval '1 hour'
group by overall_status;
*/