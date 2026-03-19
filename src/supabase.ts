import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { APP_CONFIG } from './config';

let supabaseClient: SupabaseClient | null = null;

if (APP_CONFIG.backend === 'supabase' && APP_CONFIG.supabase.url && APP_CONFIG.supabase.anonKey) {
  console.log('Initializing Supabase client');
  supabaseClient = createClient(APP_CONFIG.supabase.url, APP_CONFIG.supabase.anonKey);
} else {
  console.log('Supabase client not initialized', {
    backend: APP_CONFIG.backend,
    hasUrl: !!APP_CONFIG.supabase.url,
    hasKey: !!APP_CONFIG.supabase.anonKey,
  });
}

export const supabase = supabaseClient;
