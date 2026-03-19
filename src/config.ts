export const APP_CONFIG = {
  backend: (import.meta.env.VITE_BACKEND || 'firebase') as 'firebase' | 'supabase',
  firebase: {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    databaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID,
  },
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  },
  database: {
    url: import.meta.env.VITE_DATABASE_URL,
  },
};

console.log('Config initialized:', {
  backend: APP_CONFIG.backend,
  hasFirebaseConfig: !!APP_CONFIG.firebase.apiKey,
  hasSupabaseConfig: !!(APP_CONFIG.supabase.url && APP_CONFIG.supabase.anonKey),
});

// Warn about misconfiguration
if (APP_CONFIG.backend === 'firebase' && !APP_CONFIG.firebase.apiKey) {
  console.error('❌ Backend is set to "firebase" but Firebase credentials are missing!');
  console.error('   Either:');
  console.error('   1. Add Firebase credentials to .env, OR');
  console.error('   2. Set VITE_BACKEND=supabase to use Supabase');
}

if (APP_CONFIG.backend === 'supabase' && !APP_CONFIG.supabase.url) {
  console.error('❌ Backend is set to "supabase" but Supabase credentials are missing!');
  console.error('   Either:');
  console.error('   1. Add Supabase credentials to .env, OR');
  console.error('   2. Set VITE_BACKEND=firebase to use Firebase');
}

export const isFirebase = () => APP_CONFIG.backend === 'firebase';
export const isSupabase = () => APP_CONFIG.backend === 'supabase';
