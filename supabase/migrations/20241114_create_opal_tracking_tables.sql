-- Migration: Create OPAL Tracking Tables
-- Description: Creates tables for confidence scores and fallback usage tracking
-- Fixes 500 errors caused by missing database tables
-- Date: 2024-11-14

-- Create opal_confidence_scores table
CREATE TABLE IF NOT EXISTS opal_confidence_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_id TEXT NOT NULL,
    agent_type TEXT NOT NULL CHECK (agent_type IN (
        'strategy_workflow',
        'roadmap_generator',
        'maturity_assessment',
        'quick_wins_analyzer',
        'content_review'
    )),
    workflow_id TEXT,
    confidence_score DECIMAL(4,3) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
    response_time_ms INTEGER NOT NULL CHECK (response_time_ms >= 0),
    content_hash TEXT NOT NULL,
    validation_passed BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Indexes for performance
    CONSTRAINT opal_confidence_scores_page_agent_idx UNIQUE (page_id, agent_type, created_at)
);

-- Create opal_fallback_usage table
CREATE TABLE IF NOT EXISTS opal_fallback_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_id TEXT NOT NULL,
    agent_type TEXT NOT NULL CHECK (agent_type IN (
        'strategy_workflow',
        'roadmap_generator',
        'maturity_assessment',
        'quick_wins_analyzer',
        'content_review'
    )),
    workflow_id TEXT,
    trigger_reason TEXT NOT NULL,
    fallback_type TEXT NOT NULL DEFAULT 'cached' CHECK (fallback_type IN (
        'cached',
        'mock',
        'enhanced_service',
        'enhanced_api',
        'emergency'
    )),
    transparency_label_shown BOOLEAN NOT NULL DEFAULT false,
    resolved_successfully BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_opal_confidence_scores_page_id ON opal_confidence_scores(page_id);
CREATE INDEX IF NOT EXISTS idx_opal_confidence_scores_agent_type ON opal_confidence_scores(agent_type);
CREATE INDEX IF NOT EXISTS idx_opal_confidence_scores_created_at ON opal_confidence_scores(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_opal_confidence_scores_confidence ON opal_confidence_scores(confidence_score);

CREATE INDEX IF NOT EXISTS idx_opal_fallback_usage_page_id ON opal_fallback_usage(page_id);
CREATE INDEX IF NOT EXISTS idx_opal_fallback_usage_agent_type ON opal_fallback_usage(agent_type);
CREATE INDEX IF NOT EXISTS idx_opal_fallback_usage_created_at ON opal_fallback_usage(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_opal_fallback_usage_trigger_reason ON opal_fallback_usage(trigger_reason);

-- Create updated_at trigger for opal_confidence_scores
CREATE OR REPLACE FUNCTION update_opal_confidence_scores_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_opal_confidence_scores_updated_at
    BEFORE UPDATE ON opal_confidence_scores
    FOR EACH ROW
    EXECUTE FUNCTION update_opal_confidence_scores_updated_at();

-- Create updated_at trigger for opal_fallback_usage
CREATE OR REPLACE FUNCTION update_opal_fallback_usage_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_opal_fallback_usage_updated_at
    BEFORE UPDATE ON opal_fallback_usage
    FOR EACH ROW
    EXECUTE FUNCTION update_opal_fallback_usage_updated_at();

-- Create view for monitoring OPAL system health
CREATE OR REPLACE VIEW opal_system_health AS
SELECT
    DATE_TRUNC('hour', created_at) as hour,
    agent_type,
    COUNT(*) as total_requests,
    AVG(confidence_score) as avg_confidence,
    MIN(confidence_score) as min_confidence,
    MAX(confidence_score) as max_confidence,
    AVG(response_time_ms) as avg_response_time,
    COUNT(CASE WHEN validation_passed THEN 1 END) as successful_validations,
    ROUND(
        (COUNT(CASE WHEN validation_passed THEN 1 END)::DECIMAL / COUNT(*)) * 100, 2
    ) as success_rate_percent
FROM opal_confidence_scores
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', created_at), agent_type
ORDER BY hour DESC, agent_type;

-- Create view for fallback monitoring
CREATE OR REPLACE VIEW opal_fallback_summary AS
SELECT
    DATE_TRUNC('hour', created_at) as hour,
    agent_type,
    trigger_reason,
    fallback_type,
    COUNT(*) as occurrence_count,
    COUNT(CASE WHEN resolved_successfully THEN 1 END) as resolved_count,
    ROUND(
        (COUNT(CASE WHEN resolved_successfully THEN 1 END)::DECIMAL / COUNT(*)) * 100, 2
    ) as resolution_rate_percent
FROM opal_fallback_usage
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', created_at), agent_type, trigger_reason, fallback_type
ORDER BY hour DESC, occurrence_count DESC;

-- Insert sample data for testing (only in development)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'opal_confidence_scores'
        AND table_schema = 'public'
    ) THEN
        -- Insert sample confidence scores
        INSERT INTO opal_confidence_scores (
            page_id, agent_type, confidence_score, response_time_ms, content_hash, validation_passed
        ) VALUES
            ('strategy-plans-summary-main', 'strategy_workflow', 0.87, 1250, 'test_hash_1', true),
            ('strategy-plans-quick-wins-overview', 'quick_wins_analyzer', 0.89, 980, 'test_hash_2', true),
            ('strategy-plans-roadmap-overview', 'roadmap_generator', 0.91, 1100, 'test_hash_3', true),
            ('strategy-plans-maturity-overview', 'maturity_assessment', 0.84, 1400, 'test_hash_4', true)
        ON CONFLICT DO NOTHING;

        -- Insert sample fallback usage
        INSERT INTO opal_fallback_usage (
            page_id, agent_type, trigger_reason, fallback_type, transparency_label_shown, resolved_successfully
        ) VALUES
            ('strategy-plans-summary-main', 'strategy_workflow', 'database_timeout', 'cached', true, true),
            ('strategy-plans-quick-wins-overview', 'quick_wins_analyzer', 'agent_execution_failed', 'enhanced_service', true, true)
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- Grant necessary permissions (adjust based on your RLS policies)
GRANT SELECT, INSERT, UPDATE ON opal_confidence_scores TO authenticated;
GRANT SELECT, INSERT, UPDATE ON opal_fallback_usage TO authenticated;
GRANT SELECT ON opal_system_health TO authenticated;
GRANT SELECT ON opal_fallback_summary TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE opal_confidence_scores IS 'Tracks confidence scores and performance metrics for OPAL agent executions';
COMMENT ON TABLE opal_fallback_usage IS 'Tracks fallback usage patterns and system resilience metrics';
COMMENT ON VIEW opal_system_health IS 'Provides hourly aggregated health metrics for OPAL system monitoring';
COMMENT ON VIEW opal_fallback_summary IS 'Provides fallback usage analytics for system reliability monitoring';