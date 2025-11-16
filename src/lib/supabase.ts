/**
 * OSA Supabase Client
 *
 * This module provides database access for the OSA application.
 * Simplified for production deployment compatibility.
 */

// Export working client components
export {
  supabase,
  createSupabaseAdmin,
  handleDatabaseError,
  checkDatabaseConnection,
  isDatabaseAvailable
} from '@/lib/database/supabase-client';

// Export types
export { createClient } from '@supabase/supabase-js';
export type { Database } from '@/lib/types/database';

// Default export for convenience
export { supabase as default } from '@/lib/database/supabase-client';