/**
 * Supabase Configuration
 * ----------------------
 * הגדרות חיבור ל-Supabase עבור פרויקט Misgarot Online
 * Project: misgarot-online
 * Region: Europe (Frankfurt - eu-central-1)
 */

export const SUPABASE_CONFIG = {
  // Project URL - Supabase Project URL
  url: import.meta.env.VITE_SUPABASE_URL || 'https://ytchxzitnustjwoiqxew.supabase.co',
  
  // Anon Key - Public anonymous key for client-side usage
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0Y2h4eml0bnVzdGp3b2lxeGV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwNDk1NjcsImV4cCI6MjA4MDYyNTU2N30.wzodR_V-gNeZYqNY-nX2PK2axxQbgygTz_2cPvD8K3E',
  
  // Storage bucket names
  storage: {
    frames: 'frames',        // מסגרות מוכנות
    designs: 'designs',      // עיצובים של משתמשים
    avatars: 'avatars',      // תמונות פרופיל
    exports: 'exports',      // קבצים מיוצאים לשליחה במייל
    logos: 'logos',          // לוגואים של צלמים
  },
  
  // API Endpoints
  functions: {
    sendEmail: 'send-designs',  // Edge function לשליחת מיילים
  },
};

/**
 * בדיקה אם ה-Supabase מוגדר כראוי
 */
export const isSupabaseConfigured = (): boolean => {
  return (
    SUPABASE_CONFIG.url !== 'YOUR_SUPABASE_URL' &&
    SUPABASE_CONFIG.anonKey !== 'YOUR_SUPABASE_ANON_KEY' &&
    SUPABASE_CONFIG.url.includes('supabase.co')
  );
};

/**
 * Get Storage URL for a bucket
 */
export const getStorageUrl = (bucket: keyof typeof SUPABASE_CONFIG.storage): string => {
  return `${SUPABASE_CONFIG.url}/storage/v1/object/public/${SUPABASE_CONFIG.storage[bucket]}`;
};
