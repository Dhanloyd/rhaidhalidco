import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

type AdminRole = "super_admin" | "admin" | null;

interface AdminSession {
  id: string;
  username: string;
  role: AdminRole;
}

interface AuthContextType {
  user: AdminSession | null;
  role: AdminRole;
  isAdmin: boolean;
  loading: boolean;
  displayName: string | null;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string, displayName?: string, phone?: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_KEY = "rk_admin_session";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user,    setUser]    = useState<AdminSession | null>(null);
  const [role,    setRole]    = useState<AdminRole>(null);
  const [loading, setLoading] = useState(true);

  // Restore session from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      if (stored) {
        const parsed: AdminSession = JSON.parse(stored);
        setUser(parsed);
        setRole(parsed.role);
      }
    } catch {
      localStorage.removeItem(SESSION_KEY);
    } finally {
      // Only set loading false AFTER user and role are set
      setLoading(false);
    }
  }, []);

  const signIn = async (username: string, password: string): Promise<{ error: Error | null }> => {
    const { data, error } = await supabase
      .from("admin_accounts")
      .select("id, username, role, is_active, password_hash")
      .eq("username", username)
      .eq("is_active", true)
      .maybeSingle();

    if (error || !data) {
      return { error: new Error("Invalid credentials.") };
    }

    if (data.password_hash !== password) {
      return { error: new Error("Invalid credentials.") };
    }

    const session: AdminSession = {
      id:       data.id,
      username: data.username,
      role:     data.role as AdminRole,
    };

    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    setUser(session);
    setRole(session.role);

    return { error: null };
  };

  const signOut = async () => {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
    setRole(null);
    window.location.href = "/admin/login";
  };

  const signUp = async (): Promise<{ error: Error | null }> => {
    return { error: new Error("Sign up is not available for admin accounts.") };
  };

  return (
    <AuthContext.Provider value={{
      user,
      role,
      isAdmin:     role === "admin" || role === "super_admin",
      loading,
      displayName: user?.username ?? null,
      signIn,
      signOut,
      signUp,
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