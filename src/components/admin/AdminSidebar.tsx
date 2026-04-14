import { LayoutDashboard, ShoppingCart, Package, CreditCard, LogOut, Home, Newspaper, Star, Users, UserCheck, Calendar, FileText, Share2, BarChart3, Tag, Zap, Truck, Phone, Info, ClipboardList, Smartphone } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import logo from "@/assets/logo.jpg";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const navItems = [
  { title: "Dashboard",       url: "/admin",              icon: LayoutDashboard },
  { title: "Orders",          url: "/admin/orders",       icon: ShoppingCart },
  { title: "Products",        url: "/admin/products",     icon: Package },
  { title: "Inventory",       url: "/admin/inventory",    icon: Truck },
  { title: "POS",             url: "/admin/pos",          icon: CreditCard },
  { title: "Analytics",       url: "/admin/analytics",    icon: BarChart3 },
  { title: "Vouchers",        url: "/admin/vouchers",     icon: Tag },
  { title: "Flash Sales",     url: "/admin/flash-sales",  icon: Zap },
  { title: "Suppliers",       url: "/admin/suppliers",    icon: Users },
  { title: "Reports",         url: "/admin/reports",      icon: ClipboardList },
{ title: "Transactions",    url: "/admin/transactions",  icon: CreditCard },
  { title: "GCash Settings",  url: "/admin/payment-settings", icon: Smartphone },
];

const cmsItems = [
  { title: "News",         url: "/admin/news",           icon: Newspaper },
  { title: "Highlights",   url: "/admin/highlights",     icon: Star },
  { title: "Founders",     url: "/admin/founders",       icon: UserCheck },
  { title: "Players",      url: "/admin/players",        icon: Users },
  { title: "Activities",   url: "/admin/activities",     icon: Calendar },
  { title: "Page Content", url: "/admin/pages",          icon: FileText },
  { title: "About Page",   url: "/admin/pages/about",    icon: Info },
  { title: "Contact Page", url: "/admin/pages/contact",  icon: Phone },
  { title: "Social Links", url: "/admin/social-links",   icon: Share2 },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  const renderItems = (items: typeof navItems) => items.map((item) => (
    <SidebarMenuItem key={item.title}>
      <SidebarMenuButton asChild isActive={isActive(item.url)}>
        <NavLink to={item.url} end className="hover:bg-muted/50" activeClassName="bg-primary/10 text-primary font-medium">
          <item.icon className="mr-2 h-4 w-4" />
          {!collapsed && <span>{item.title}</span>}
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  ));

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarContent className="bg-card">
        <div className="p-4 flex items-center gap-3 border-b border-border">
          <img src={logo} alt="RK" className="w-9 h-9 rounded-lg object-cover shrink-0" />
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="font-heading text-sm uppercase tracking-wider text-foreground truncate">RaidKhalid</p>
              <p className="text-xs text-muted-foreground truncate">Admin Panel</p>
            </div>
          )}
        </div>
        <SidebarGroup>
          <SidebarGroupLabel>Operations</SidebarGroupLabel>
          <SidebarGroupContent><SidebarMenu>{renderItems(navItems)}</SidebarMenu></SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Content Management</SidebarGroupLabel>
          <SidebarGroupContent><SidebarMenu>{renderItems(cmsItems)}</SidebarMenu></SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="bg-card border-t border-border p-3 space-y-2">
        <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground" onClick={() => navigate("/")}>
          <Home size={16} /> {!collapsed && "Back to Site"}
        </Button>
        <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-destructive hover:text-destructive" onClick={signOut}>
          <LogOut size={16} /> {!collapsed && "Sign Out"}
        </Button>
        {!collapsed && user && <p className="text-xs text-muted-foreground truncate px-2">{user.email}</p>}
      </SidebarFooter>
    </Sidebar>
  );
}