import { createContext, useContext, useEffect, useState, ReactNode, useRef } from "react";
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
  const initialised = useRef(false);

  const checkAdmin = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    setIsAdmin(!!data);
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
    // ── 1. Get session once on mount ──
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await Promise.all([
          checkAdmin(session.user.id),
          fetchProfile(session.user.id),
        ]);
      }
      setLoading(false);
      initialised.current = true;
    });

    // ── 2. Listen for auth changes (sign in / sign out only) ──
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!initialised.current) return; // skip until getSession is done
        if (event === "SIGNED_OUT") {
          setSession(null);
          setUser(null);
          setIsAdmin(false);
          setDisplayName(null);
          return;
        }
        if (event === "SIGNED_IN" && session?.user) {
          setSession(session);
          setUser(session.user);
          await Promise.all([
            checkAdmin(session.user.id),
            fetchProfile(session.user.id),
          ]);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []); // ← empty deps, runs once only

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
    Object.keys(sessionStorage).forEach((k) => {
      if (k.startsWith("sb-")) sessionStorage.removeItem(k);
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