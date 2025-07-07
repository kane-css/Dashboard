// src/supabase.js

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// This is the most important line. Make sure it says 'export const supabase'.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);