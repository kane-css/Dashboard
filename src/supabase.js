// src/supabase.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Enable session persistence
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,       // keep session in localStorage
    autoRefreshToken: true,     // refresh expired tokens automatically
    detectSessionInUrl: true,   // detect session from URL after login
  },
});
