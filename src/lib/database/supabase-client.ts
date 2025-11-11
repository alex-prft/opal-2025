// Supabase Client for Opal Database Operations
// Handles database connections for workflow management and DXP insights storage

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/types/database';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

// Check if we have real database configuration
const isDatabaseConfigured = supabaseUrl !== 'https://placeholder.supabase.co' &&
                           supabaseUrl !== 'https://your-supabase-project.supabase.co' &&
                           supabaseAnonKey !== 'placeholder-key' &&
                           supabaseAnonKey !== 'your-supabase-anon-key-here';

// Create Supabase client with proper typing and connection pooling
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // For server-side usage
    autoRefreshToken: false,
    detectSessionInUrl: false
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'x-connection-pool': 'optimized-osa'
    }
  },
  realtime: {
    params: {
      eventsPerSecond: 10 // Rate limiting for realtime events
    }
  }
});

// Check if database is available for use
export const isDatabaseAvailable = (): boolean => {
  return isDatabaseConfigured;
};

// Create admin client for server-side operations
export const createSupabaseAdmin = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-key';

  // If database is not configured, return a mock client that will fail gracefully
  if (!isDatabaseConfigured) {
    console.log('📝 [Database] Using placeholder configuration, operations will fall back to file storage');
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    },
    db: {
      schema: 'public'
    },
    global: {
      headers: {
        'x-connection-pool': 'admin-osa',
        'x-client-info': 'osa-admin-service'
      }
    },
    realtime: {
      params: {
        eventsPerSecond: 5 // Lower rate for admin operations
      }
    }
  });
};

// Utility function for handling database errors
export const handleDatabaseError = (error: any, operation: string, allowFallback: boolean = true): never => {
  console.error(`❌ [Database] ${operation} failed:`, error);

  // Log detailed error information for debugging
  console.error(`❌ [Database] Error details:`, {
    message: error.message,
    details: error.details || 'No details available',
    hint: error.hint || '',
    code: error.code || ''
  });

  if (allowFallback) {
    console.log(`⚠️ [Database] ${operation} unavailable, system will continue with fallback behavior`);
  }

  if (error.code) {
    throw new Error(`Database ${operation} failed: ${error.message} (Code: ${error.code})`);
  }

  throw new Error(`Database ${operation} failed: ${error.message || 'Unknown error'}`);
};

// Connection health check
export const checkDatabaseConnection = async (): Promise<boolean> => {
  try {
    const { error } = await supabase.from('opal_workflow_executions').select('count').limit(1);

    if (error) {
      console.error('❌ [Database] Connection check failed:', error);
      return false;
    }

    console.log('✅ [Database] Connection healthy');
    return true;
  } catch (error) {
    console.error('❌ [Database] Connection check error:', error);
    return false;
  }
};