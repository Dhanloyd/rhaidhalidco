import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "./AdminSidebar";

const AdminLayout = ({ children }: { children: ReactNode }) => {
  const { user, isAdmin, loading } = useAuth();

  // 1. Still loading — show spinner
  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        
      }}>
        <div style={{
          width: 32, height: 32,
          borderRadius: "50%",
          border: "2px solid transparent",
          borderBottomColor: "#4f78ff",
          animation: "spin 0.7s linear infinite",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // 2. Not logged in at all → sign in
  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  // 3. Logged in but not an admin → back to home
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  // 4. Authenticated admin
  return (
    <SidebarProvider>
      <div style={{
        minHeight: "100vh",
        display: "flex",
        width: "100%",
        // deep navy background matching the screenshot
        background: "radial-gradient(ellipse at 18% 18%, #0f1b3d 0%, #080c1a 55%, #0a0d20 100%)",
      }}>
        <AdminSidebar />

        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

          {/* Top bar */}
          <header style={{
            height: 52,
            display: "flex",
            alignItems: "center",
            padding: "0 20px",
            flexShrink: 0,
            background: "rgba(10,14,35,0.6)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
            boxShadow: "0 1px 0 rgba(255,255,255,0.04)",
          }}>
            <SidebarTrigger
              className="mr-4"
              style={{ color: "rgba(148,163,184,0.7)" }}
            />
            <h2 style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "rgba(148,163,184,0.5)",
            }}>
              Admin Dashboard
            </h2>
          </header>

          {/* Page content */}
          <main style={{
            flex: 1,
            padding: "24px",
            overflowY: "auto",
            // subtle inner glow so content area feels part of the dark theme
            background: "transparent",
          }}>
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminLayout;
