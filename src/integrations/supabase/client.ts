import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: false,   // ❗ STOP auto login
      autoRefreshToken: false, // ❗ STOP silent refresh
      detectSessionInUrl: false, // ❗ IMPORTANT for payment redirects
    },
  }
);