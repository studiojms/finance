import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { APP_CONFIG } from './config';

let supabaseClient: SupabaseClient | null = null;

if (APP_CONFIG.backend === 'supabase' && APP_CONFIG.supabase.url && APP_CONFIG.supabase.anonKey) {
  supabaseClient = createClient(APP_CONFIG.supabase.url, APP_CONFIG.supabase.anonKey);
}

export const supabase = supabaseClient;
