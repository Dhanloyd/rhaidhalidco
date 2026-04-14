import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// Clear old localStorage sessions on every load
Object.keys(localStorage).forEach((k) => {
  if (k.startsWith("sb-")) localStorage.removeItem(k);
});

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: sessionStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});