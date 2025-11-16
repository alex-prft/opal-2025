-- ===============================
-- OSA Event Stream Tables
-- Create event streaming infrastructure for microservices communication
-- Date: 2024-11-15
-- ===============================

-- Event stream table for storing all OSA events
CREATE TABLE IF NOT EXISTS osa_event_stream (
    id VARCHAR(255) PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB NOT NULL,
    published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed BOOLEAN DEFAULT FALSE,
    retry_count INTEGER DEFAULT 0,
    dead_letter BOOLEAN DEFAULT FALSE,
    correlation_id VARCHAR(255) NOT NULL,
    causation_id VARCHAR(255),
    trace_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_osa_event_stream_event_type ON osa_event_stream(event_type);
CREATE INDEX IF NOT EXISTS idx_osa_event_stream_published_at ON osa_event_stream(published_at);
CREATE INDEX IF NOT EXISTS idx_osa_event_stream_processed ON osa_event_stream(processed);
CREATE INDEX IF NOT EXISTS idx_osa_event_stream_correlation_id ON osa_event_stream(correlation_id);
CREATE INDEX IF NOT EXISTS idx_osa_event_stream_trace_id ON osa_event_stream(trace_id);
CREATE INDEX IF NOT EXISTS idx_osa_event_stream_retry_count ON osa_event_stream(retry_count);

-- Create composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_osa_event_stream_unprocessed ON osa_event_stream(processed, dead_letter, retry_count) WHERE processed = FALSE AND dead_letter = FALSE;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_osa_event_stream_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_osa_event_stream_updated_at BEFORE UPDATE ON osa_event_stream FOR EACH ROW EXECUTE FUNCTION update_osa_event_stream_updated_at();

-- ===============================
-- ROW LEVEL SECURITY (RLS)
-- ===============================

-- Enable RLS on all tables
ALTER TABLE osa_event_stream ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users (services)
CREATE POLICY "Services can manage events" ON osa_event_stream
    FOR ALL USING (true);

-- ===============================
-- REALTIME SUBSCRIPTIONS
-- ===============================

-- Enable realtime for event stream table
ALTER PUBLICATION supabase_realtime ADD TABLE osa_event_stream;

COMMENT ON TABLE osa_event_stream IS 'Central event store for OSA microservices communication';