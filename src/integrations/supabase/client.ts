import { createClient } from "@supabase/supabase-js";

// Clear old localStorage sessions on every load
Object.keys(localStorage).forEach((k) => {
  if (k.startsWith("sb-")) localStorage.removeItem(k);
});

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY, // ← fix this line
  {
    auth: {
      storage: sessionStorage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  }
);