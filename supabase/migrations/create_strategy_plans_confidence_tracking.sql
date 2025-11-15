-- Strategy Plans Confidence Tracking and Content Governance Tables
-- For Strategy Plans content uniqueness, confidence monitoring, and fallback management
-- Created for 24-hour sprint implementation

-- =====================================================
-- 1. CONFIDENCE SCORE TRACKING TABLE
-- =====================================================

-- Track confidence scores for all Strategy Plans pages with historical data
CREATE TABLE IF NOT EXISTS opal_confidence_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Page identification
    page_id VARCHAR(255) NOT NULL, -- e.g., "strategy-plans/osa/overview-dashboard"
    agent_type VARCHAR(100) NOT NULL, -- strategy_workflow, roadmap_generator, maturity_assessment
    workflow_id UUID REFERENCES opal_workflow_executions(id) ON DELETE CASCADE,

    -- Confidence data
    confidence_score FLOAT NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
    score_threshold FLOAT DEFAULT 0.6, -- Threshold that triggered any actions

    -- Metadata
    agent_execution_id UUID REFERENCES opal_agent_executions(id) ON DELETE CASCADE,
    response_time_ms INTEGER,
    content_hash VARCHAR(64), -- SHA256 hash of content for change tracking

    -- Quality metrics
    quality_indicators JSONB, -- Additional quality metrics from agent
    validation_passed BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. CONTENT VARIATIONS TRACKING TABLE
-- =====================================================

-- Track content uniqueness and enforce 30% semantic difference requirement
CREATE TABLE IF NOT EXISTS opal_content_variations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Content identification
    page_id VARCHAR(255) NOT NULL,
    content_hash VARCHAR(64) NOT NULL, -- SHA256 hash of content
    parent_page_id VARCHAR(255), -- Related page for comparison

    -- Variation analysis
    similarity_score FLOAT CHECK (similarity_score >= 0 AND similarity_score <= 1),
    semantic_difference_percent FLOAT CHECK (semantic_difference_percent >= 0 AND semantic_difference_percent <= 100),
    variation_threshold_met BOOLEAN DEFAULT FALSE, -- True if meets 30% requirement

    -- Content metadata
    content_length INTEGER,
    word_count INTEGER,
    key_topics JSONB, -- Extracted topics/themes for semantic analysis

    -- Governance tracking
    regeneration_required BOOLEAN DEFAULT FALSE,
    regeneration_count INTEGER DEFAULT 0,
    last_regeneration_at TIMESTAMPTZ,

    -- Validation results
    uniqueness_validated_at TIMESTAMPTZ DEFAULT NOW(),
    validation_method VARCHAR(50) DEFAULT 'semantic_analysis', -- semantic_analysis, content_hash, manual

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3. FALLBACK USAGE TRACKING TABLE
-- =====================================================

-- Track when, why, and how often fallback content is used
CREATE TABLE IF NOT EXISTS opal_fallback_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Page and trigger information
    page_id VARCHAR(255) NOT NULL,
    workflow_id UUID REFERENCES opal_workflow_executions(id) ON DELETE CASCADE,
    agent_type VARCHAR(100) NOT NULL,

    -- Fallback trigger details
    trigger_reason VARCHAR(100) NOT NULL, -- low_confidence, api_failure, timeout, content_similarity
    original_confidence_score FLOAT,
    fallback_type VARCHAR(50) NOT NULL, -- cached, alternative_agent, curated_content

    -- Fallback content details
    fallback_source VARCHAR(100), -- Cache key, alternative agent name, or curated source
    fallback_confidence_score FLOAT,
    content_hash VARCHAR(64),

    -- Impact assessment
    user_experience_impact VARCHAR(20) DEFAULT 'minimal', -- minimal, moderate, significant
    transparency_label_shown BOOLEAN DEFAULT TRUE,

    -- Performance tracking
    fallback_response_time_ms INTEGER,
    resolved_successfully BOOLEAN DEFAULT TRUE,

    -- Metadata
    user_agent TEXT,
    session_id VARCHAR(255),

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 4. AGENT COORDINATION LOCKS TABLE
-- =====================================================

-- Redis-like locks for preventing simultaneous agent conflicts
CREATE TABLE IF NOT EXISTS opal_agent_coordination_locks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Lock identification
    lock_key VARCHAR(255) UNIQUE NOT NULL, -- e.g., "agent:strategy_workflow:page:osa"
    lock_holder VARCHAR(100) NOT NULL, -- Process/instance identifier

    -- Lock details
    agent_type VARCHAR(100) NOT NULL,
    page_id VARCHAR(255),
    workflow_id UUID REFERENCES opal_workflow_executions(id) ON DELETE CASCADE,

    -- Lock management
    acquired_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    max_duration_ms INTEGER DEFAULT 300000, -- 5 minutes default

    -- Lock metadata
    lock_purpose VARCHAR(100) DEFAULT 'content_generation', -- content_generation, cache_update, validation
    priority INTEGER DEFAULT 1, -- For queue management

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 5. INDEXES FOR PERFORMANCE
-- =====================================================

-- Confidence Scores Indexes
CREATE INDEX IF NOT EXISTS idx_confidence_scores_page_id ON opal_confidence_scores(page_id);
CREATE INDEX IF NOT EXISTS idx_confidence_scores_agent_type ON opal_confidence_scores(agent_type);
CREATE INDEX IF NOT EXISTS idx_confidence_scores_created_at ON opal_confidence_scores(created_at);
CREATE INDEX IF NOT EXISTS idx_confidence_scores_workflow_id ON opal_confidence_scores(workflow_id);
CREATE INDEX IF NOT EXISTS idx_confidence_scores_score ON opal_confidence_scores(confidence_score);

-- Content Variations Indexes
CREATE INDEX IF NOT EXISTS idx_content_variations_page_id ON opal_content_variations(page_id);
CREATE INDEX IF NOT EXISTS idx_content_variations_content_hash ON opal_content_variations(content_hash);
CREATE INDEX IF NOT EXISTS idx_content_variations_similarity ON opal_content_variations(similarity_score);
CREATE INDEX IF NOT EXISTS idx_content_variations_threshold_met ON opal_content_variations(variation_threshold_met);
CREATE INDEX IF NOT EXISTS idx_content_variations_created_at ON opal_content_variations(created_at);

-- Fallback Usage Indexes
CREATE INDEX IF NOT EXISTS idx_fallback_usage_page_id ON opal_fallback_usage(page_id);
CREATE INDEX IF NOT EXISTS idx_fallback_usage_trigger_reason ON opal_fallback_usage(trigger_reason);
CREATE INDEX IF NOT EXISTS idx_fallback_usage_created_at ON opal_fallback_usage(created_at);
CREATE INDEX IF NOT EXISTS idx_fallback_usage_workflow_id ON opal_fallback_usage(workflow_id);

-- Agent Coordination Locks Indexes
CREATE INDEX IF NOT EXISTS idx_agent_locks_lock_key ON opal_agent_coordination_locks(lock_key);
CREATE INDEX IF NOT EXISTS idx_agent_locks_expires_at ON opal_agent_coordination_locks(expires_at);
CREATE INDEX IF NOT EXISTS idx_agent_locks_agent_type ON opal_agent_coordination_locks(agent_type);
CREATE INDEX IF NOT EXISTS idx_agent_locks_page_id ON opal_agent_coordination_locks(page_id);

-- =====================================================
-- 6. TRIGGERS AND FUNCTIONS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_strategy_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER IF NOT EXISTS trigger_confidence_scores_updated_at
    BEFORE UPDATE ON opal_confidence_scores
    FOR EACH ROW EXECUTE FUNCTION update_strategy_plans_updated_at();

CREATE TRIGGER IF NOT EXISTS trigger_content_variations_updated_at
    BEFORE UPDATE ON opal_content_variations
    FOR EACH ROW EXECUTE FUNCTION update_strategy_plans_updated_at();

-- Function to clean up expired locks automatically
CREATE OR REPLACE FUNCTION cleanup_expired_agent_locks()
RETURNS TRIGGER AS $$
BEGIN
    -- Delete expired locks on any insert/update to keep table clean
    DELETE FROM opal_agent_coordination_locks
    WHERE expires_at < NOW();

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-cleanup expired locks
CREATE TRIGGER IF NOT EXISTS trigger_cleanup_expired_locks
    AFTER INSERT OR UPDATE ON opal_agent_coordination_locks
    FOR EACH STATEMENT EXECUTE FUNCTION cleanup_expired_agent_locks();

-- Function to automatically track content regeneration
CREATE OR REPLACE FUNCTION track_content_regeneration()
RETURNS TRIGGER AS $$
BEGIN
    -- If regeneration_required flag is set, increment counter and update timestamp
    IF NEW.regeneration_required = TRUE AND OLD.regeneration_required = FALSE THEN
        NEW.regeneration_count = COALESCE(OLD.regeneration_count, 0) + 1;
        NEW.last_regeneration_at = NOW();
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for content regeneration tracking
CREATE TRIGGER IF NOT EXISTS trigger_track_regeneration
    BEFORE UPDATE ON opal_content_variations
    FOR EACH ROW EXECUTE FUNCTION track_content_regeneration();

-- =====================================================
-- 7. VIEWS FOR MONITORING AND REPORTING
-- =====================================================

-- View for confidence score trends
CREATE OR REPLACE VIEW opal_confidence_trends AS
SELECT
    page_id,
    agent_type,
    AVG(confidence_score) as avg_confidence,
    MIN(confidence_score) as min_confidence,
    MAX(confidence_score) as max_confidence,
    COUNT(*) as total_scores,
    COUNT(*) FILTER (WHERE confidence_score < 0.6) as low_confidence_count,
    DATE_TRUNC('hour', created_at) as score_hour
FROM opal_confidence_scores
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY page_id, agent_type, DATE_TRUNC('hour', created_at)
ORDER BY score_hour DESC, page_id, agent_type;

-- View for content uniqueness summary
CREATE OR REPLACE VIEW opal_content_uniqueness_summary AS
SELECT
    page_id,
    COUNT(*) as total_variations,
    COUNT(*) FILTER (WHERE variation_threshold_met = TRUE) as unique_variations,
    AVG(semantic_difference_percent) as avg_difference_percent,
    COUNT(*) FILTER (WHERE regeneration_required = TRUE) as regenerations_needed,
    MAX(created_at) as last_validated
FROM opal_content_variations
GROUP BY page_id
ORDER BY avg_difference_percent DESC;

-- View for fallback usage statistics
CREATE OR REPLACE VIEW opal_fallback_statistics AS
SELECT
    page_id,
    trigger_reason,
    fallback_type,
    COUNT(*) as usage_count,
    AVG(fallback_confidence_score) as avg_fallback_confidence,
    COUNT(*) FILTER (WHERE resolved_successfully = FALSE) as failed_fallbacks,
    DATE_TRUNC('day', created_at) as usage_date
FROM opal_fallback_usage
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY page_id, trigger_reason, fallback_type, DATE_TRUNC('day', created_at)
ORDER BY usage_date DESC, usage_count DESC;

-- View for active agent locks
CREATE OR REPLACE VIEW opal_active_agent_locks AS
SELECT
    lock_key,
    agent_type,
    page_id,
    lock_holder,
    acquired_at,
    expires_at,
    (expires_at - NOW()) as time_remaining,
    lock_purpose
FROM opal_agent_coordination_locks
WHERE expires_at > NOW()
ORDER BY acquired_at ASC;

-- =====================================================
-- 8. COMMENTS AND DOCUMENTATION
-- =====================================================

COMMENT ON TABLE opal_confidence_scores IS 'Historical tracking of confidence scores for Strategy Plans content with threshold monitoring';
COMMENT ON TABLE opal_content_variations IS 'Content uniqueness validation and semantic difference tracking for 30% variation enforcement';
COMMENT ON TABLE opal_fallback_usage IS 'Comprehensive tracking of fallback content usage with transparency and impact assessment';
COMMENT ON TABLE opal_agent_coordination_locks IS 'Agent coordination locks to prevent conflicts during simultaneous content generation';

COMMENT ON VIEW opal_confidence_trends IS 'Hourly confidence score trends for monitoring content quality over time';
COMMENT ON VIEW opal_content_uniqueness_summary IS 'Summary of content uniqueness validation results per page';
COMMENT ON VIEW opal_fallback_statistics IS 'Weekly statistics on fallback usage patterns and success rates';
COMMENT ON VIEW opal_active_agent_locks IS 'Currently active agent coordination locks with expiration times';

-- =====================================================
-- 9. INITIAL CONFIGURATION DATA
-- =====================================================

-- Insert initial configuration for Strategy Plans pages
INSERT INTO opal_content_variations (page_id, content_hash, semantic_difference_percent, variation_threshold_met)
SELECT
    'strategy-plans/' || page_name,
    'initial_' || REPLACE(page_name, '/', '_'),
    100.0, -- Initial content is considered 100% unique
    TRUE
FROM (VALUES
    ('osa/overview-dashboard'),
    ('osa/strategic-recommendations'),
    ('osa/performance-metrics'),
    ('osa/data-quality-score'),
    ('osa/workflow-timeline'),
    ('quick-wins/immediate-opportunities'),
    ('quick-wins/implementation-roadmap-(30-day)'),
    ('quick-wins/resource-requirements'),
    ('quick-wins/expected-impact'),
    ('quick-wins/success-metrics'),
    ('maturity/current-state-assessment'),
    ('maturity/maturity-framework'),
    ('maturity/gap-analysis'),
    ('maturity/improvement-pathway'),
    ('maturity/benchmarking-data'),
    ('phases/phase-1:-foundation-(0-3-months)'),
    ('phases/phase-2:-growth-(3-6-months)'),
    ('phases/phase-3:-optimization-(6-12-months)'),
    ('phases/phase-4:-innovation-(12+-months)'),
    ('phases/cross-phase-dependencies'),
    ('roadmap/timeline-view'),
    ('roadmap/milestone-tracking'),
    ('roadmap/resource-allocation'),
    ('roadmap/risk-assessment'),
    ('roadmap/progress-indicators')
) AS pages(page_name)
ON CONFLICT DO NOTHING;