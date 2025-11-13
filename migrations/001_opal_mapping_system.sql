-- OPAL Mapping System Database Migration
-- Version: 1.0.0
-- Date: 2025-11-12
-- Description: Create tables for enhanced OPAL mapping system with consolidated schema support

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create enum types for validation
CREATE TYPE mapping_type_enum AS ENUM (
  'strategy-plans',
  'dxp-tools',
  'analytics-insights',
  'experience-optimization'
);

CREATE TYPE api_status_enum AS ENUM (
  'connected',
  'testing',
  'error',
  'disconnected'
);

CREATE TYPE optimization_domain_enum AS ENUM (
  'content',
  'experimentation',
  'personalization',
  'ux',
  'technology',
  'cross-domain'
);

-- OPAL Mapping Configurations Table
-- Stores consolidated mapping configurations for all four mapping types
CREATE TABLE opal_mapping_configurations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mapping_type mapping_type_enum NOT NULL,
  strategy_dashboard_area VARCHAR(100) NOT NULL,
  version VARCHAR(20) NOT NULL DEFAULT '1.0.0',
  configuration JSONB NOT NULL,

  -- Metadata fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by VARCHAR(100),
  updated_by VARCHAR(100),

  -- Validation and health fields
  is_active BOOLEAN NOT NULL DEFAULT true,
  validation_errors JSONB DEFAULT '[]'::jsonb,
  last_validation_at TIMESTAMPTZ,

  -- Performance tracking
  api_status api_status_enum DEFAULT 'testing',
  last_refresh TIMESTAMPTZ,
  data_freshness VARCHAR(50) DEFAULT 'stale',
  response_time_ms INTEGER,

  -- Ensure unique mapping type per active configuration
  CONSTRAINT unique_active_mapping_type UNIQUE (mapping_type, is_active)
    DEFERRABLE INITIALLY DEFERRED
);

-- Optimization Metrics Table
-- Tracks KPIs, confidence scores, and performance metrics for all optimization domains
CREATE TABLE optimization_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mapping_configuration_id UUID NOT NULL REFERENCES opal_mapping_configurations(id) ON DELETE CASCADE,

  -- Domain and metric identification
  optimization_domain optimization_domain_enum NOT NULL,
  kpi_name VARCHAR(100) NOT NULL,
  view_name VARCHAR(100),
  agent_name VARCHAR(50),

  -- Metric values and confidence
  metric_value DECIMAL(15,4),
  confidence_score DECIMAL(5,4) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  success_probability DECIMAL(5,4) CHECK (success_probability >= 0 AND success_probability <= 1),
  data_quality_score DECIMAL(5,4) CHECK (data_quality_score >= 0 AND data_quality_score <= 1),

  -- Business alignment
  business_impact_score DECIMAL(5,4),
  roi_projection DECIMAL(15,4),
  implementation_difficulty INTEGER CHECK (implementation_difficulty >= 1 AND implementation_difficulty <= 10),

  -- Temporal tracking
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,

  -- Metadata and context
  measurement_context JSONB DEFAULT '{}'::jsonb,
  tags TEXT[] DEFAULT '{}',

  -- Performance tracking
  processing_time_ms INTEGER,
  source_system VARCHAR(50)
);

-- Personalization Rules Table
-- Stores dynamic personalization rules with trigger conditions and data sources
CREATE TABLE personalization_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mapping_configuration_id UUID NOT NULL REFERENCES opal_mapping_configurations(id) ON DELETE CASCADE,

  -- Rule identification
  rule_name VARCHAR(100) NOT NULL,
  rule_type VARCHAR(50) DEFAULT 'conditional',
  priority INTEGER NOT NULL DEFAULT 1,

  -- Rule logic
  trigger_conditions JSONB NOT NULL DEFAULT '[]'::jsonb,
  data_sources JSONB NOT NULL DEFAULT '[]'::jsonb,
  actions JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Rule status and performance
  is_active BOOLEAN NOT NULL DEFAULT true,
  execution_count INTEGER DEFAULT 0,
  success_rate DECIMAL(5,4) DEFAULT 0,
  average_processing_time_ms INTEGER DEFAULT 0,

  -- Temporal tracking
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_executed_at TIMESTAMPTZ,

  -- Validation
  validation_errors JSONB DEFAULT '[]'::jsonb,

  CONSTRAINT unique_rule_name_per_mapping UNIQUE (mapping_configuration_id, rule_name)
);

-- Cross-Domain Coordination Settings Table
-- Manages coordination and insight sharing between different mapping domains
CREATE TABLE cross_domain_coordination (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Source and target domains
  source_mapping_type mapping_type_enum NOT NULL,
  target_mapping_type mapping_type_enum NOT NULL,

  -- Coordination configuration
  coordination_type VARCHAR(50) NOT NULL, -- 'insight_sharing', 'kpi_alignment', 'resource_coordination'
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  priority_weight DECIMAL(3,2) DEFAULT 1.0 CHECK (priority_weight >= 0 AND priority_weight <= 10),

  -- Coordination rules
  sharing_rules JSONB NOT NULL DEFAULT '{}'::jsonb,
  data_filters JSONB DEFAULT '{}'::jsonb,

  -- Performance tracking
  coordination_count INTEGER DEFAULT 0,
  success_rate DECIMAL(5,4) DEFAULT 0,
  average_processing_time_ms INTEGER DEFAULT 0,

  -- Temporal tracking
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_coordination_at TIMESTAMPTZ,

  CONSTRAINT unique_domain_coordination UNIQUE (source_mapping_type, target_mapping_type, coordination_type)
);

-- Admin Configuration Settings Table
-- Stores admin-level configuration settings for the mapping system
CREATE TABLE admin_configuration_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Setting identification
  setting_category VARCHAR(50) NOT NULL, -- 'security', 'performance', 'business_alignment', 'personalization'
  setting_key VARCHAR(100) NOT NULL,
  setting_value JSONB NOT NULL,

  -- Access control
  access_level VARCHAR(20) NOT NULL DEFAULT 'admin', -- 'admin', 'super_admin', 'data_admin', 'technical_admin'

  -- Setting metadata
  description TEXT,
  data_type VARCHAR(20) NOT NULL DEFAULT 'json', -- 'string', 'number', 'boolean', 'json', 'array'
  validation_schema JSONB,

  -- Status tracking
  is_active BOOLEAN NOT NULL DEFAULT true,
  requires_restart BOOLEAN NOT NULL DEFAULT false,

  -- Temporal tracking
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by VARCHAR(100),
  updated_by VARCHAR(100),

  CONSTRAINT unique_setting_key UNIQUE (setting_category, setting_key)
);

-- Create indexes for performance optimization
CREATE INDEX idx_opal_mapping_configurations_type ON opal_mapping_configurations(mapping_type);
CREATE INDEX idx_opal_mapping_configurations_active ON opal_mapping_configurations(is_active);
CREATE INDEX idx_opal_mapping_configurations_updated ON opal_mapping_configurations(updated_at);

CREATE INDEX idx_optimization_metrics_domain ON optimization_metrics(optimization_domain);
CREATE INDEX idx_optimization_metrics_kpi ON optimization_metrics(kpi_name);
CREATE INDEX idx_optimization_metrics_recorded ON optimization_metrics(recorded_at);
CREATE INDEX idx_optimization_metrics_mapping_id ON optimization_metrics(mapping_configuration_id);

CREATE INDEX idx_personalization_rules_mapping_id ON personalization_rules(mapping_configuration_id);
CREATE INDEX idx_personalization_rules_active ON personalization_rules(is_active);
CREATE INDEX idx_personalization_rules_priority ON personalization_rules(priority);

CREATE INDEX idx_cross_domain_coordination_source ON cross_domain_coordination(source_mapping_type);
CREATE INDEX idx_cross_domain_coordination_target ON cross_domain_coordination(target_mapping_type);
CREATE INDEX idx_cross_domain_coordination_enabled ON cross_domain_coordination(is_enabled);

CREATE INDEX idx_admin_configuration_settings_category ON admin_configuration_settings(setting_category);
CREATE INDEX idx_admin_configuration_settings_key ON admin_configuration_settings(setting_key);
CREATE INDEX idx_admin_configuration_settings_active ON admin_configuration_settings(is_active);

-- Create GIN indexes for JSONB columns
CREATE INDEX idx_opal_mapping_configurations_config ON opal_mapping_configurations USING GIN (configuration);
CREATE INDEX idx_optimization_metrics_context ON optimization_metrics USING GIN (measurement_context);
CREATE INDEX idx_personalization_rules_conditions ON personalization_rules USING GIN (trigger_conditions);
CREATE INDEX idx_cross_domain_coordination_rules ON cross_domain_coordination USING GIN (sharing_rules);

-- Create triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_opal_mapping_configurations_updated_at
  BEFORE UPDATE ON opal_mapping_configurations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_personalization_rules_updated_at
  BEFORE UPDATE ON personalization_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cross_domain_coordination_updated_at
  BEFORE UPDATE ON cross_domain_coordination
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_configuration_settings_updated_at
  BEFORE UPDATE ON admin_configuration_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin configuration settings
INSERT INTO admin_configuration_settings (setting_category, setting_key, setting_value, access_level, description, data_type) VALUES
('security', 'oauth_enabled', '"true"'::jsonb, 'technical_admin', 'Enable OAuth 2.0 + PKCE authentication', 'boolean'),
('security', 'webhook_signature_validation', '"true"'::jsonb, 'technical_admin', 'Enable HMAC-SHA256 webhook signature validation', 'boolean'),
('security', 'rate_limiting_enabled', '"true"'::jsonb, 'technical_admin', 'Enable API rate limiting', 'boolean'),
('performance', 'cache_enabled', '"true"'::jsonb, 'technical_admin', 'Enable caching layer', 'boolean'),
('performance', 'target_response_time_ms', '85'::jsonb, 'data_admin', 'Target API response time in milliseconds', 'number'),
('performance', 'connection_pool_size', '20'::jsonb, 'technical_admin', 'Database connection pool size', 'number'),
('business_alignment', 'kpi_tracking_enabled', '"true"'::jsonb, 'admin', 'Enable business KPI tracking', 'boolean'),
('business_alignment', 'roi_calculation_enabled', '"true"'::jsonb, 'admin', 'Enable ROI calculation for optimization metrics', 'boolean'),
('personalization', 'rules_enabled', '"true"'::jsonb, 'super_admin', 'Enable personalization rules engine', 'boolean'),
('personalization', 'cross_domain_coordination_enabled', '"true"'::jsonb, 'super_admin', 'Enable cross-domain insight sharing', 'boolean');

-- Insert default cross-domain coordination settings
INSERT INTO cross_domain_coordination (source_mapping_type, target_mapping_type, coordination_type, is_enabled, priority_weight, sharing_rules) VALUES
('analytics-insights', 'experience-optimization', 'insight_sharing', true, 1.0, '{"insights": ["engagement_patterns", "performance_metrics"], "frequency": "real-time"}'::jsonb),
('experience-optimization', 'strategy-plans', 'kpi_alignment', true, 0.8, '{"kpis": ["optimization_roi", "implementation_success"], "frequency": "daily"}'::jsonb),
('dxp-tools', 'experience-optimization', 'resource_coordination', true, 0.9, '{"resources": ["api_capacity", "processing_power"], "frequency": "hourly"}'::jsonb),
('strategy-plans', 'analytics-insights', 'insight_sharing', true, 0.7, '{"insights": ["strategic_priorities", "business_objectives"], "frequency": "weekly"}'::jsonb);

COMMENT ON TABLE opal_mapping_configurations IS 'Consolidated mapping configurations for all OPAL mapping types with validation and health tracking';
COMMENT ON TABLE optimization_metrics IS 'KPI tracking, confidence scores, and performance metrics for all optimization domains';
COMMENT ON TABLE personalization_rules IS 'Dynamic personalization rules with trigger conditions and performance tracking';
COMMENT ON TABLE cross_domain_coordination IS 'Cross-domain coordination settings for insight sharing and resource allocation';
COMMENT ON TABLE admin_configuration_settings IS 'Admin-level configuration settings with access control and validation';