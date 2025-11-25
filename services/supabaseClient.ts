import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isValidUrl = (url: string) => {
  try {
    return new URL(url).protocol.startsWith('http');
  } catch {
    return false;
  }
};

const isConfigured = supabaseUrl && isValidUrl(supabaseUrl) && supabaseAnonKey;

if (!isConfigured) {
  console.warn('Supabase is not properly configured. Job alerts will be disabled.');
}

// Export a safe client that warns if used when not configured, or the real client
export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : {
      from: () => ({
        insert: async () => ({ error: new Error('Supabase not configured') }),
        select: async () => ({ error: new Error('Supabase not configured'), data: [] }),
      }),
    } as any;
