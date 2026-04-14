import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  displayName: string | null;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, displayName?: string, phone?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState<string | null>(null);

  const checkAdmin = async (userId: string): Promise<boolean> => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    const admin = !!data;
    setIsAdmin(admin);
    return admin;
  };

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("user_id", userId)
      .maybeSingle();
    setDisplayName(data?.display_name || null);
  };

  useEffect(() => {
  let initialised = false;

  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        await Promise.all([
          checkAdmin(session.user.id),
          fetchProfile(session.user.id),
        ]);
      } else {
        setIsAdmin(false);
        setDisplayName(null);
      }

      if (initialised) {
        setLoading(false);
      }
    }
  );

  supabase.auth.getSession().then(async ({ data: { session } }) => {
    // ✅ If session is expired, sign out automatically
    if (session) {
      const expiresAt = session.expires_at ?? 0;
      const now = Math.floor(Date.now() / 1000);
      if (expiresAt < now) {
        await supabase.auth.signOut({ scope: "local" });
        Object.keys(localStorage).forEach((k) => {
          if (k.startsWith("sb-")) localStorage.removeItem(k);
        });
        setSession(null);
        setUser(null);
        setIsAdmin(false);
        setDisplayName(null);
        setLoading(false);
        initialised = true;
        return;
      }
    }

    setSession(session);
    setUser(session?.user ?? null);

    if (session?.user) {
      await Promise.all([
        checkAdmin(session.user.id),
        fetchProfile(session.user.id),
      ]);
    }

    setLoading(false);
    initialised = true;
  });

  return () => subscription.unsubscribe();
}, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signUp = async (
    email: string,
    password: string,
    name?: string,
    phone?: string,
  ) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { display_name: name || email, phone: phone || "" },
      },
    });
    if (!error && data.user && phone) {
      await supabase.from("profiles").update({ phone }).eq("user_id", data.user.id);
    }
    return { error: error as Error | null };
  };

 const signOut = async () => {
  try {
    await supabase.auth.signOut({ scope: "local" });
  } catch (_) {
    // ignore errors — we still want to clear state
  }
  // Clear all supabase keys from localStorage
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith("sb-")) localStorage.removeItem(key);
  });
  setSession(null);
  setUser(null);
  setIsAdmin(false);
  setDisplayName(null);
  window.location.href = "/";
};

  return (
    <AuthContext.Provider value={{ session, user, isAdmin, loading, displayName, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};