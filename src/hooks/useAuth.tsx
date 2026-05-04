import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  loading: boolean;
  displayName: string | null;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, displayName?: string, phone?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession]           = useState<Session | null>(null);
  const [user, setUser]                 = useState<User | null>(null);
  const [isAdmin, setIsAdmin]           = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading]           = useState(true);
  const [displayName, setDisplayName]   = useState<string | null>(null);

  const checkRoles = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .in("role", ["admin", "superadmin"]);
    const roles = (data || []).map((r: any) => r.role as string);
    const superAdmin = roles.includes("superadmin");
    setIsSuperAdmin(superAdmin);
    setIsAdmin(superAdmin || roles.includes("admin"));
  };

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("user_id", userId)
      .maybeSingle();
    setDisplayName(data?.display_name || null);
  };

  const applySession = async (s: Session | null) => {
    setSession(s);
    setUser(s?.user ?? null);
    if (s?.user) {
      await Promise.all([checkRoles(s.user.id), fetchProfile(s.user.id)]);
    } else {
      setIsAdmin(false);
      setIsSuperAdmin(false);
      setDisplayName(null);
    }
  };

  useEffect(() => {
    // ── 1. Listen FIRST so we never miss an event ──
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        await applySession(session);
        setLoading(false);
      }
    );

    // ── 2. Then get current session to hydrate immediately ──
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      await applySession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string, name?: string, phone?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email, password,
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
    } catch (_) {}
    Object.keys(localStorage).forEach(k => {
      if (k.startsWith("sb-")) localStorage.removeItem(k);
    });
    setSession(null);
    setUser(null);
    setIsAdmin(false);
    setIsSuperAdmin(false);
    setDisplayName(null);
    window.location.href = "/";
  };

  return (
    <AuthContext.Provider value={{
      session, user, isAdmin, isSuperAdmin, loading, displayName,
      signIn, signUp, signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};