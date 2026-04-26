import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Navigate } from "react-router-dom";
import { ShieldAlert } from "lucide-react";

export const SuperAdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { adminUser, loading } = useAdminAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen"
        style={{ background: "linear-gradient(135deg,#0f1117 0%,#141824 50%,#0f1117 100%)" }}>
        <div className="w-6 h-6 border-2 border-indigo-500/40 border-t-indigo-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (!adminUser) return <Navigate to="/admin/login" replace />;

  if (adminUser.role !== "super_admin") {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-6">
        <div
          className="text-center max-w-sm w-full p-8 rounded-2xl"
          style={{
            background: "rgba(239,68,68,0.06)",
            border: "1px solid rgba(239,68,68,0.2)",
            backdropFilter: "blur(20px)",
          }}
        >
          <div className="w-16 h-16 rounded-full bg-red-500/15 border border-red-500/25 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert size={28} className="text-red-400" />
          </div>
          <h2 className="text-lg font-bold text-white mb-2">Access Denied</h2>
          <p className="text-sm text-slate-400 mb-1">
            This page requires <span className="text-violet-400 font-semibold">Super Admin</span> privileges.
          </p>
          <p className="text-xs text-slate-500 mb-6">
            Your current role is{" "}
            <span className="text-indigo-400 font-medium capitalize">
              {adminUser.role.replace("_", " ")}
            </span>.
          </p>
          <a
            href="/admin"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-indigo-300 transition-all hover:scale-[1.02]"
            style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)" }}
          >
            ← Back to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
