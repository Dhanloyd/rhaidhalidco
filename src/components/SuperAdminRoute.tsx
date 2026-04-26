import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export function SuperAdminRoute({ children }: { children: React.ReactNode }) {
  const { role, loading, user } = useAuth();

  // Wait until localStorage session is fully restored
  if (loading) return null;

  // Resolve role from both state and user object as fallback
  const resolvedRole = role ?? user?.role ?? null;

  if (resolvedRole !== "super_admin") {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
}