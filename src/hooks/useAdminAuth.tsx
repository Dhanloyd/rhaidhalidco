import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AdminUser {
  id: string;
  username: string;
  role: "admin" | "super_admin";
  is_active: boolean;
}

interface AdminAuthContextType {
  adminUser: AdminUser | null;
  loading: boolean;
  signIn: (username: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

const STORAGE_KEY = "admin_session";

export const AdminAuthProvider = ({ children }: { children: ReactNode }) => {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [loading, setLoading]     = useState(true);

  // Restore session from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setAdminUser(JSON.parse(raw));
    } catch {}
    setLoading(false);
  }, []);

  const signIn = async (
    username: string,
    password: string
  ): Promise<{ error: string | null }> => {
    // 1. Fetch account by username
    const { data, error } = await supabase
      .from("admin_accounts")
      .select("id, username, password_hash, role, is_active")
      .eq("username", username.trim())
      .maybeSingle();

    if (error || !data) return { error: "Invalid username or password." };
    if (!data.is_active) return { error: "This account has been deactivated." };

    // 2. Compare password (plain comparison — swap for bcrypt RPC in production)
    if (data.password_hash !== password)
      return { error: "Invalid username or password." };

    // 3. Persist session
    const session: AdminUser = {
      id:        data.id,
      username:  data.username,
      role:      data.role,
      is_active: data.is_active,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    setAdminUser(session);
    return { error: null };
  };

  const signOut = () => {
    localStorage.removeItem(STORAGE_KEY);
    setAdminUser(null);
  };

  return (
    <AdminAuthContext.Provider value={{ adminUser, loading, signIn, signOut }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return ctx;
};