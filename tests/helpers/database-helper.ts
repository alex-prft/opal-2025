/**
 * Database Helper for Integration Tests
 * Provides utilities for setting up and tearing down test database
 */

import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/types/database';

let testClient: ReturnType<typeof createClient<Database>> | null = null;

export async function setupTestDatabase(): Promise<void> {
  // Use test-specific environment variables or create test client
  const supabaseUrl = process.env.TEST_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.TEST_SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.warn('[Test DB] Supabase credentials not available - tests will run in fallback mode');
    return;
  }

  try {
    testClient = createClient<Database>(supabaseUrl, supabaseKey);

    // Verify connection
    const { error } = await testClient.from('opal_confidence_scores').select('count', { count: 'exact', head: true });

    if (error && !error.message.includes('relation "opal_confidence_scores" does not exist')) {
      throw error;
    }

    console.log('[Test DB] Database setup completed');

    // Create test tables if they don't exist
    await createTestTables();

  } catch (error) {
    console.warn('[Test DB] Database setup failed:', error);
    testClient = null;
  }
}

export async function cleanupTestDatabase(): Promise<void> {
  if (!testClient) return;

  try {
    // Clean up test data
    await testClient.from('opal_confidence_scores').delete().ilike('page_id', '%test%');
    await testClient.from('opal_fallback_usage').delete().ilike('page_id', '%test%');

    console.log('[Test DB] Database cleanup completed');
  } catch (error) {
    console.warn('[Test DB] Database cleanup failed:', error);
  }
}

async function createTestTables(): Promise<void> {
  if (!testClient) return;

  try {
    // Check if tables exist, create if they don't
    const { error: confidenceError } = await testClient
      .from('opal_confidence_scores')
      .select('count', { count: 'exact', head: true });

    if (confidenceError && confidenceError.message.includes('relation "opal_confidence_scores" does not exist')) {
      console.log('[Test DB] Creating test tables...');

      // Tables will be created by the migration
      // This is just a verification step
      console.log('[Test DB] Please ensure database migrations have been run');
    }

  } catch (error) {
    console.warn('[Test DB] Error checking/creating tables:', error);
  }
}

export async function insertTestData(): Promise<void> {
  if (!testClient) return;

  try {
    // Insert sample test data
    await testClient.from('opal_confidence_scores').insert([
      {
        page_id: 'test-confidence-1',
        agent_type: 'strategy_workflow',
        confidence_score: 0.85,
        response_time_ms: 1200,
        content_hash: 'test_hash_1',
        validation_passed: true
      },
      {
        page_id: 'test-confidence-2',
        agent_type: 'quick_wins_analyzer',
        confidence_score: 0.92,
        response_time_ms: 980,
        content_hash: 'test_hash_2',
        validation_passed: true
      }
    ]).select();

    await testClient.from('opal_fallback_usage').insert([
      {
        page_id: 'test-fallback-1',
        agent_type: 'maturity_assessment',
        trigger_reason: 'test_timeout',
        fallback_type: 'cached',
        transparency_label_shown: true,
        resolved_successfully: true
      }
    ]).select();

    console.log('[Test DB] Test data inserted');

  } catch (error) {
    console.warn('[Test DB] Failed to insert test data:', error);
  }
}

export async function clearTestData(): Promise<void> {
  if (!testClient) return;

  try {
    await testClient.from('opal_confidence_scores').delete().ilike('page_id', 'test-%');
    await testClient.from('opal_fallback_usage').delete().ilike('page_id', 'test-%');

    console.log('[Test DB] Test data cleared');

  } catch (error) {
    console.warn('[Test DB] Failed to clear test data:', error);
  }
}

export function getTestClient() {
  return testClient;
}

export async function verifyDatabaseHealth(): Promise<boolean> {
  if (!testClient) return false;

  try {
    const { error } = await testClient.from('opal_confidence_scores').select('count', { count: 'exact', head: true });
    return !error;
  } catch (error) {
    return false;
  }
}