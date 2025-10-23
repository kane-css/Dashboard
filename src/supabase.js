import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// ✅ Stable Supabase client setup for GitHub Pages (hash routing compatible)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,         // Keeps user logged in across reloads
    autoRefreshToken: true,       // Refresh session automatically
    detectSessionInUrl: false,    // 👈 Prevents hash-based redirect flicker on GitHub Pages
  },
});
