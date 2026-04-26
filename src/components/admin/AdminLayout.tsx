import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import AdminSidebar from "./AdminSidebar";

const AdminLayout = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex",
        alignItems: "center", justifyContent: "center",
        background: "radial-gradient(ellipse at 20% 20%, #0f1b3d 0%, #080c1a 60%, #0a0d20 100%)",
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: "50%",
          border: "2px solid transparent", borderBottomColor: "#4f78ff",
          animation: "spin 0.7s linear infinite",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!user) return <Navigate to="/admin/login" replace />;

  return (
    <div className="min-h-screen flex w-full"
      style={{ background: "radial-gradient(ellipse at 18% 18%, #0f1b3d 0%, #080c1a 55%, #0a0d20 100%)" }}>

      {/* Sidebar — hidden on mobile, visible on lg+ */}
      <div className="hidden lg:flex shrink-0">
        <AdminSidebar />
      </div>

      {/* Main content — takes full width on mobile */}
      <div className="flex flex-col flex-1 min-w-0 w-full">

        {/* Top header */}
        <header className="h-13 flex items-center px-4 sm:px-6 shrink-0 gap-3"
          style={{
            height: 52,
            background: "rgba(10,14,35,0.6)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
            boxShadow: "0 1px 0 rgba(255,255,255,0.04)",
          }}>

          {/* Mobile menu button — only shows on mobile */}
          <MobileMenu />

          <h2 style={{
            fontSize: 11, fontWeight: 600, letterSpacing: "0.12em",
            textTransform: "uppercase", color: "rgba(148,163,184,0.5)",
          }}>
            Admin Dashboard
          </h2>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
};

// ── Mobile slide-in menu ──────────────────────────────────────────────────────
import { useState } from "react";
import { Menu, X } from "lucide-react";

function MobileMenu() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Hamburger — only on mobile */}
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden flex items-center justify-center w-9 h-9 rounded-xl transition-all"
        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(148,163,184,0.8)" }}
      >
        <Menu size={16} />
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          style={{ backdropFilter: "blur(4px)" }}
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className="fixed top-0 left-0 h-full z-50 lg:hidden transition-transform duration-300 ease-in-out"
        style={{
          transform: open ? "translateX(0)" : "translateX(-100%)",
          width: 224,
        }}
      >
        {/* Close button */}
        <button
          onClick={() => setOpen(false)}
          className="absolute top-3 right-3 z-10 w-7 h-7 rounded-lg flex items-center justify-center transition-all"
          style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(148,163,184,0.7)" }}
        >
          <X size={13} />
        </button>

        {/* Sidebar content inside drawer */}
        <AdminSidebar />
      </div>
    </>
  );
}

export default AdminLayout;