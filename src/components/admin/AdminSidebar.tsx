import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import {
  LayoutDashboard, ShoppingBag, CreditCard, Package,
  BarChart2, Tag, Zap, Truck, Newspaper, Star,
  Users, Activity, FileText, Link2, ClipboardList,
  Receipt, Settings, LogOut, Shield, ShieldCheck, KeyRound,
  MonitorSmartphone,
} from "lucide-react";

const mainNav = [
  { label: "Dashboard",         icon: LayoutDashboard,   path: "/admin"                  },
  { label: "Orders",            icon: ShoppingBag,       path: "/admin/orders"           },
  { label: "Transactions",      icon: CreditCard,        path: "/admin/transactions"     },
  { label: "Products",          icon: Package,           path: "/admin/products"         },
  { label: "Inventory",         icon: ClipboardList,     path: "/admin/inventory"        },
  { label: "POS",               icon: MonitorSmartphone, path: "/admin/pos"              },
  { label: "Analytics",         icon: BarChart2,         path: "/admin/analytics"        },
  { label: "Vouchers",          icon: Tag,               path: "/admin/vouchers"         },
  { label: "Flash Sales",       icon: Zap,               path: "/admin/flash-sales"      },
  { label: "Suppliers",         icon: Truck,             path: "/admin/suppliers"        },
  { label: "Reports",           icon: FileText,          path: "/admin/reports"          },
];

const contentNav = [
  { label: "News",              icon: Newspaper,         path: "/admin/news"             },
  { label: "Highlights",        icon: Star,              path: "/admin/highlights"       },
  { label: "Founders",          icon: Users,             path: "/admin/founders"         },
  { label: "Players",           icon: Users,             path: "/admin/players"          },
  { label: "Activities",        icon: Activity,          path: "/admin/activities"       },
  { label: "Pages",             icon: FileText,          path: "/admin/pages"            },
  { label: "Social Links",      icon: Link2,             path: "/admin/social-links"     },
];

const settingsNav = [
  { label: "Payment Settings",  icon: Settings,          path: "/admin/payment-settings" },
  { label: "Receipt Settings",  icon: Receipt,           path: "/admin/receipt-settings" },
];

const superAdminNav = [
  { label: "Admin Credentials", icon: KeyRound,          path: "/admin/credentials"      },
];

const NavItem = ({ item }: { item: { label: string; icon: any; path: string } }) => {
  const location = useLocation();
  const active = location.pathname === item.path ||
    (item.path !== "/admin" && location.pathname.startsWith(item.path));

  return (
    <Link
      to={item.path}
      className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150"
      style={
        active
          ? { background: "rgba(99,102,241,0.2)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.25)" }
          : { color: "#64748b", border: "1px solid transparent" }
      }
      onMouseEnter={(e) => {
        if (!active) {
          (e.currentTarget as HTMLElement).style.color = "#94a3b8";
          (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          (e.currentTarget as HTMLElement).style.color = "#64748b";
          (e.currentTarget as HTMLElement).style.background = "transparent";
        }
      }}
    >
      <item.icon size={15} />
      {item.label}
    </Link>
  );
};

const SectionLabel = ({ label }: { label: string }) => (
  <p className="text-[10px] text-slate-600 uppercase tracking-widest px-3 pt-3 pb-1 font-semibold">
    {label}
  </p>
);

const Divider = () => (
  <div className="my-1 mx-3 border-t border-white/[0.05]" />
);

export default function AdminSidebar() {
  const { adminUser, signOut } = useAdminAuth();
  const navigate               = useNavigate();

  const isSuperAdmin = adminUser?.role === "super_admin";

  const handleSignOut = () => {
    signOut();
    navigate("/admin/login", { replace: true });
  };

  const RoleBadge = () => (
    <div
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mt-0.5"
      style={
        isSuperAdmin
          ? { background: "rgba(139,92,246,0.2)", border: "1px solid rgba(139,92,246,0.3)", color: "#a78bfa" }
          : { background: "rgba(99,102,241,0.2)",  border: "1px solid rgba(99,102,241,0.3)",  color: "#818cf8" }
      }
    >
      {isSuperAdmin
        ? <><ShieldCheck size={9} /> Super Admin</>
        : <><Shield size={9} /> Admin</>
      }
    </div>
  );

  return (
    <aside
      className="w-56 min-h-screen flex flex-col shrink-0"
      style={{
        background: "rgba(255,255,255,0.02)",
        borderRight: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-4 py-4 shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
          <Shield size={15} className="text-indigo-400" />
        </div>
        <span className="text-sm font-bold text-white tracking-tight">Admin Panel</span>
      </div>

      {/* Admin info card */}
      <div className="px-3 py-3 shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div
          className="flex items-center gap-2.5 p-2.5 rounded-xl"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
            style={{
              background: isSuperAdmin ? "rgba(139,92,246,0.2)" : "rgba(99,102,241,0.2)",
              border: `1px solid ${isSuperAdmin ? "rgba(139,92,246,0.35)" : "rgba(99,102,241,0.35)"}`,
              color: isSuperAdmin ? "#a78bfa" : "#818cf8",
            }}
          >
            {adminUser?.username?.slice(0, 2).toUpperCase() ?? "AD"}
          </div>
          <div className="min-w-0 flex flex-col">
            <p className="text-sm font-semibold text-white truncate leading-tight">
              {adminUser?.username ?? "Admin"}
            </p>
            <RoleBadge />
          </div>
        </div>
      </div>

      {/* Scrollable nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5"
        style={{ scrollbarWidth: "none" }}>
        <SectionLabel label="Main" />
        {mainNav.map((item) => <NavItem key={item.path} item={item} />)}

        <Divider />
        <SectionLabel label="Content" />
        {contentNav.map((item) => <NavItem key={item.path} item={item} />)}

        <Divider />
        <SectionLabel label="Settings" />
        {settingsNav.map((item) => <NavItem key={item.path} item={item} />)}

        {/* Only super_admin sees this section */}
        {isSuperAdmin && (
          <>
            <Divider />
            <SectionLabel label="Super Admin" />
            {superAdminNav.map((item) => <NavItem key={item.path} item={item} />)}
          </>
        )}
      </nav>

      {/* Sign out */}
      <div className="px-2 py-3 shrink-0"
        style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 transition-all"
          style={{ border: "1px solid transparent" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.color = "#f87171";
            (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.08)";
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(239,68,68,0.15)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.color = "#64748b";
            (e.currentTarget as HTMLElement).style.background = "transparent";
            (e.currentTarget as HTMLElement).style.borderColor = "transparent";
          }}
        >
          <LogOut size={15} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
