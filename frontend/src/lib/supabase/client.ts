import { createClient } from '@supabase/supabase-js';
import { SUPABASE_CONFIG, isSupabaseConfigured } from './config';
import type { Database } from './types';

/**
 * Supabase Client
 * ---------------
 * חיבור למסד הנתונים
 */

// Create client only if configured
let supabase: ReturnType<typeof createClient<Database>> | null = null;

export const getSupabase = () => {
  if (!supabase) {
    if (!isSupabaseConfigured()) {
      console.warn('⚠️ Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env file');
      return null;
    }
    
    supabase = createClient<Database>(
      SUPABASE_CONFIG.url,
      SUPABASE_CONFIG.anonKey,
      {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
        },
      }
    );
  }
  return supabase;
};

// Export for direct use (when you're sure it's configured)
export const supabaseClient = getSupabase();

// Helper to check if connected
export const isConnected = async (): Promise<boolean> => {
  const client = getSupabase();
  if (!client) return false;
  
  try {
    const { error } = await client.from('categories').select('id').limit(1);
    return !error;
  } catch {
    return false;
  }
};
