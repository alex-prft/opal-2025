-- OSA Database Schema for Opal Insights and Workflow Management
-- Designed for PostgreSQL / Supabase
-- Created: 2025-01-07

-- =====================================================
-- 1. CORE WORKFLOW MANAGEMENT TABLES
-- =====================================================

-- Workflow Executions - Track each Opal workflow run
CREATE TABLE opal_workflow_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'triggered',
    -- Status: triggered, running, completed, failed, cancelled

    -- Form Data (from /engine submission)
    client_name VARCHAR(500) NOT NULL,
    industry VARCHAR(255),
    company_size VARCHAR(100),
    current_capabilities JSONB,
    business_objectives JSONB,
    additional_marketing_technology JSONB,
    timeline_preference VARCHAR(50),
    budget_range VARCHAR(50),
    recipients JSONB,

    -- Execution Metadata
    triggered_by VARCHAR(100) DEFAULT 'form_submission', -- form_submission, daily_sync, force_sync
    trigger_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,
    error_message TEXT,

    -- Progress Tracking
    current_step VARCHAR(100),
    progress_percentage INTEGER DEFAULT 0,
    expected_agents JSONB, -- Array of agent names
    completed_agents JSONB DEFAULT '[]'::jsonb,
    failed_agents JSONB DEFAULT '[]'::jsonb,

    -- Scheduling
    scheduled_for TIMESTAMPTZ, -- For daily sync at 9am ET
    last_sync_at TIMESTAMPTZ,
    force_sync_requested BOOLEAN DEFAULT false,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent Executions - Track individual agent runs within workflows
CREATE TABLE opal_agent_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID NOT NULL REFERENCES opal_workflow_executions(id) ON DELETE CASCADE,

    agent_name VARCHAR(100) NOT NULL,
    agent_type VARCHAR(50), -- content_review, geo_audit, audience_suggester, etc.
    execution_order INTEGER,

    -- Execution Status
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    -- Status: pending, in_progress, completed, failed, skipped

    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    duration_ms INTEGER,

    -- Input/Output Data
    input_data JSONB,
    output_data JSONB,
    workflow_context JSONB, -- Data received from previous agents

    -- Error Handling
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 2,
    timeout_ms INTEGER DEFAULT 120000, -- 2 minutes default

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. DXP INTEGRATION DATA TABLES
-- =====================================================

-- ODP (Optimizely Data Platform) Insights
CREATE TABLE opal_odp_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID NOT NULL REFERENCES opal_workflow_executions(id) ON DELETE CASCADE,

    -- Audience Segments
    audience_segments JSONB,
    member_behavior_analysis JSONB,
    journey_data JSONB,
    statistical_power_analysis JSONB,

    -- Raw Data Storage
    raw_segments_data JSONB,
    segment_targeting_logic JSONB,

    -- Metadata
    data_collection_timestamp TIMESTAMPTZ DEFAULT NOW(),
    data_freshness_hours INTEGER,
    api_response_time_ms INTEGER,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Content Recommendations Insights
CREATE TABLE opal_content_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID NOT NULL REFERENCES opal_workflow_executions(id) ON DELETE CASCADE,

    -- Content Analysis Results
    website_content_analysis JSONB,
    personalization_opportunities JSONB,
    content_recommendations JSONB,
    performance_assessment JSONB,
    content_matrix JSONB,
    seo_optimization_data JSONB,

    -- Content Quality Metrics
    content_quality_score INTEGER, -- 0-100
    seo_readiness_score INTEGER, -- 0-100
    personalization_potential_score INTEGER, -- 0-100

    -- Metadata
    analyzed_url VARCHAR(1000),
    pages_analyzed INTEGER,
    analysis_depth VARCHAR(50),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CMS (Optimizely CMS) Insights
CREATE TABLE opal_cms_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID NOT NULL REFERENCES opal_workflow_executions(id) ON DELETE CASCADE,

    -- CMS Analysis Results
    content_structure_audit JSONB,
    content_templates JSONB,
    content_variations JSONB,
    governance_framework JSONB,
    performance_metrics JSONB,

    -- CMS Platform Details
    cms_platform_type VARCHAR(100),
    cms_version VARCHAR(50),
    integration_complexity VARCHAR(50),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CMP (Campaign Management Platform) Insights
CREATE TABLE opal_cmp_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID NOT NULL REFERENCES opal_workflow_executions(id) ON DELETE CASCADE,

    -- Strategy Compilation Results
    strategy_brief JSONB,
    executive_summary JSONB,
    campaign_specifications JSONB,
    implementation_timeline JSONB,

    -- CMP Integration
    cmp_deliverables JSONB,
    campaign_export_data JSONB,
    deployment_status VARCHAR(50),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- WebX Technical Analysis (for future use)
CREATE TABLE opal_webx_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID NOT NULL REFERENCES opal_workflow_executions(id) ON DELETE CASCADE,

    -- Technical Analysis Results
    geo_audit_results JSONB,
    core_web_vitals JSONB,
    technical_constraints JSONB,
    schema_markup_analysis JSONB,
    mobile_optimization_audit JSONB,
    performance_baseline JSONB,

    -- Technical Scores
    geo_score INTEGER, -- 0-100
    performance_score INTEGER, -- 0-100
    mobile_score INTEGER, -- 0-100

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3. RAG MODEL AND KNOWLEDGE MANAGEMENT
-- =====================================================

-- RAG Knowledge Base - Store processed insights for the RAG model
CREATE TABLE opal_rag_knowledge (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Source Information
    source_type VARCHAR(50) NOT NULL, -- form_data, odp_insights, content_insights, etc.
    source_id UUID, -- Reference to the source table record
    workflow_id UUID REFERENCES opal_workflow_executions(id) ON DELETE CASCADE,

    -- Knowledge Content
    knowledge_title VARCHAR(500),
    knowledge_summary TEXT,
    knowledge_content JSONB, -- Structured knowledge data
    raw_content TEXT, -- Full text for search

    -- RAG Metadata
    embedding_vector vector(1536), -- OpenAI embedding dimension
    knowledge_type VARCHAR(100), -- audience_insight, content_recommendation, etc.
    confidence_score FLOAT,
    relevance_tags JSONB,

    -- Lifecycle Management
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMPTZ,
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RAG Model Configurations - Track RAG model settings and performance
CREATE TABLE opal_rag_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    config_name VARCHAR(100) UNIQUE NOT NULL,
    model_version VARCHAR(50),
    embedding_model VARCHAR(100),

    -- Model Parameters
    max_tokens INTEGER DEFAULT 4000,
    temperature FLOAT DEFAULT 0.7,
    top_k INTEGER DEFAULT 5,
    similarity_threshold FLOAT DEFAULT 0.8,

    -- Performance Metrics
    avg_response_time_ms INTEGER,
    accuracy_score FLOAT,
    last_evaluation_date TIMESTAMPTZ,

    is_active BOOLEAN DEFAULT false,
    created_by VARCHAR(255),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 4. SYSTEM PERFORMANCE AND MONITORING
-- =====================================================

-- API Performance Logs
CREATE TABLE opal_api_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Request Information
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    workflow_id UUID REFERENCES opal_workflow_executions(id) ON DELETE CASCADE,
    agent_execution_id UUID REFERENCES opal_agent_executions(id) ON DELETE CASCADE,

    -- Performance Metrics
    response_time_ms INTEGER NOT NULL,
    status_code INTEGER,
    payload_size_bytes INTEGER,

    -- DXP Integration Specifics
    dxp_platform VARCHAR(50), -- odp, content_recs, cms, cmp, webx
    api_call_type VARCHAR(100), -- fetch_segments, analyze_content, etc.

    -- Error Information
    error_message TEXT,
    retry_attempt INTEGER DEFAULT 0,

    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- System Health Monitoring
CREATE TABLE opal_system_health (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Health Metrics
    component VARCHAR(100) NOT NULL, -- workflow_engine, rag_model, dxp_integrations
    status VARCHAR(50) NOT NULL, -- healthy, degraded, unhealthy

    -- Performance Data
    response_time_avg_ms INTEGER,
    error_rate_percentage FLOAT,
    throughput_requests_per_minute INTEGER,

    -- Specific Metrics
    active_workflows INTEGER,
    pending_workflows INTEGER,
    failed_workflows_24h INTEGER,

    check_timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 5. INDEXES FOR PERFORMANCE
-- =====================================================

-- Workflow Execution Indexes
CREATE INDEX idx_opal_workflows_status ON opal_workflow_executions(status);
CREATE INDEX idx_opal_workflows_session ON opal_workflow_executions(session_id);
CREATE INDEX idx_opal_workflows_scheduled ON opal_workflow_executions(scheduled_for) WHERE scheduled_for IS NOT NULL;
CREATE INDEX idx_opal_workflows_client ON opal_workflow_executions(client_name);
CREATE INDEX idx_opal_workflows_created ON opal_workflow_executions(created_at);

-- Agent Execution Indexes
CREATE INDEX idx_opal_agents_workflow ON opal_agent_executions(workflow_id);
CREATE INDEX idx_opal_agents_status ON opal_agent_executions(status);
CREATE INDEX idx_opal_agents_name ON opal_agent_executions(agent_name);

-- RAG Knowledge Indexes
CREATE INDEX idx_opal_rag_source ON opal_rag_knowledge(source_type, source_id);
CREATE INDEX idx_opal_rag_workflow ON opal_rag_knowledge(workflow_id);
CREATE INDEX idx_opal_rag_active ON opal_rag_knowledge(is_active) WHERE is_active = true;
CREATE INDEX idx_opal_rag_type ON opal_rag_knowledge(knowledge_type);

-- Performance Monitoring Indexes
CREATE INDEX idx_opal_perf_endpoint ON opal_api_performance(endpoint, timestamp);
CREATE INDEX idx_opal_perf_workflow ON opal_api_performance(workflow_id);
CREATE INDEX idx_opal_health_component ON opal_system_health(component, check_timestamp);

-- =====================================================
-- 6. FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER trigger_opal_workflows_updated_at
    BEFORE UPDATE ON opal_workflow_executions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_opal_agents_updated_at
    BEFORE UPDATE ON opal_agent_executions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_opal_odp_updated_at
    BEFORE UPDATE ON opal_odp_insights
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_opal_content_updated_at
    BEFORE UPDATE ON opal_content_insights
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_opal_cms_updated_at
    BEFORE UPDATE ON opal_cms_insights
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_opal_cmp_updated_at
    BEFORE UPDATE ON opal_cmp_insights
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_opal_webx_updated_at
    BEFORE UPDATE ON opal_webx_insights
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_opal_rag_updated_at
    BEFORE UPDATE ON opal_rag_knowledge
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- 7. INITIAL DATA AND CONFIGURATIONS
-- =====================================================

-- Default RAG Configuration
INSERT INTO opal_rag_configs (
    config_name,
    model_version,
    embedding_model,
    max_tokens,
    temperature,
    top_k,
    similarity_threshold,
    is_active,
    created_by
) VALUES (
    'default_opal_rag',
    'gpt-4',
    'text-embedding-ada-002',
    4000,
    0.7,
    5,
    0.8,
    true,
    'system'
);

-- =====================================================
-- 8. COMMENTS AND DOCUMENTATION
-- =====================================================

COMMENT ON TABLE opal_workflow_executions IS 'Main workflow execution tracking table - stores each Opal workflow run triggered from /engine form or scheduled sync';
COMMENT ON TABLE opal_agent_executions IS 'Individual agent execution tracking within workflows - enables detailed monitoring of each agent step';
COMMENT ON TABLE opal_odp_insights IS 'Processed insights from Optimizely Data Platform - audience segments, behavioral analysis, journey data';
COMMENT ON TABLE opal_content_insights IS 'Content analysis results from Optimizely Content Recommendations - content quality, personalization opportunities';
COMMENT ON TABLE opal_cms_insights IS 'CMS analysis and optimization data from Optimizely CMS platform integration';
COMMENT ON TABLE opal_cmp_insights IS 'Campaign management and strategy compilation results for executive deliverables';
COMMENT ON TABLE opal_webx_insights IS 'Technical web experience analysis - GEO audits, performance metrics, mobile optimization (future use)';
COMMENT ON TABLE opal_rag_knowledge IS 'Processed knowledge base for RAG model - combines all insights for intelligent recommendations';
COMMENT ON TABLE opal_rag_configs IS 'RAG model configuration management and performance tracking';
COMMENT ON TABLE opal_api_performance IS 'API performance monitoring for DXP integrations and system optimization';
COMMENT ON TABLE opal_system_health IS 'System health monitoring and alerting for proactive maintenance';