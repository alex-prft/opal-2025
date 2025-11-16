-- ===============================
-- Fix OPAL Webhook Events Table Schema
-- Adds missing processed_at column and index
-- Date: 2024-11-15
-- ===============================

-- Add missing processed_at column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'opal_webhook_events'
        AND column_name = 'processed_at'
    ) THEN
        ALTER TABLE opal_webhook_events
        ADD COLUMN processed_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Create the missing index
CREATE INDEX IF NOT EXISTS idx_opal_webhook_events_processed_at ON opal_webhook_events(processed_at);

COMMENT ON COLUMN opal_webhook_events.processed_at IS 'Timestamp when the webhook event was processed';