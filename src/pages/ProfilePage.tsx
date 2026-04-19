import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  User, Package, Truck, CheckCircle, ShoppingCart, Heart,
  MapPin, LogOut, Clock, XCircle, Edit2, Save, Bell,
  Shield, Star, Ticket, ChevronRight, Camera, Phone, Mail,
  Calendar, X
} from "lucide-react";
import { toast } from "sonner";

type SidebarSection = "profile" | "orders" | "notifications" | "vouchers" | "wishlist" | "addresses";

const ProfilePage = () => {
  const { user, signOut, displayName } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [orders, setOrders]               = useState<any[]>([]);
  const [profile, setProfile]             = useState<any>(null);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [addressCount, setAddressCount]   = useState(0);
  const [editing, setEditing]             = useState(false);
  const [editName, setEditName]           = useState("");
  const [editPhone, setEditPhone]         = useState("");
  const [editBirthday, setEditBirthday]   = useState("");
  const [editGender, setEditGender]       = useState("");
  const [loading, setLoading]             = useState(true);
  const [activeSection, setActiveSection] = useState<SidebarSection>("profile");
  const [activeOrderTab, setActiveOrderTab] = useState(0);
  const [avatarUrl, setAvatarUrl]         = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    Promise.all([
      supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("wishlist").select("id", { count: "exact" }).eq("user_id", user.id),
      supabase.from("addresses").select("id", { count: "exact" }).eq("user_id", user.id),
    ]).then(([ordersRes, profileRes, wishlistRes, addressRes]) => {
      setOrders(ordersRes.data || []);
      setProfile(profileRes.data);
      setEditName(profileRes.data?.display_name || "");
      setEditPhone(profileRes.data?.phone || "");
      setEditBirthday(profileRes.data?.birthday || "");
      setEditGender(profileRes.data?.gender || "");
      setAvatarUrl(profileRes.data?.avatar_url || "");
      setWishlistCount(wishlistRes.count || 0);
      setAddressCount(addressRes.count || 0);
    }).catch(err => {
      console.error("Profile load error:", err);
    }).finally(() => {
      setLoading(false);
    });

    // ── Realtime: re-fetch orders when admin updates status ──
    const channel = supabase
      .channel("profile-orders-realtime")
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "orders",
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        // Update just the changed order in state instantly
        setOrders(prev =>
          prev.map(o => o.id === payload.new.id ? { ...o, ...payload.new } : o)
        );
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center px-4">
        <div className="text-center">
          <User size={48} className="mx-auto text-muted-foreground mb-4" />
          <h1 className="font-heading text-2xl uppercase text-foreground mb-4">Sign in to view profile</h1>
          <Link to="/signin"><Button className="bg-primary text-primary-foreground">Sign In</Button></Link>
        </div>
      </div>
    );
  }

  // ── Status groupings matching admin's exact status flow ──
  const pendingOrders    = orders.filter(o => o.status === "pending");
  const processingOrders = orders.filter(o => ["confirmed", "packed"].includes(o.status));
  const shippedOrders    = orders.filter(o => ["shipped", "out_for_delivery", "delivered", "arrived"].includes(o.status));
  const completedOrders  = orders.filter(o => o.status === "completed");
  const cancelledOrders  = orders.filter(o => o.status === "cancelled");

  const orderTabs = [
    { label: "All",        icon: Package,     orders: orders },
    { label: "Pending",    icon: Clock,       orders: pendingOrders },
    { label: "Processing", icon: Package,     orders: processingOrders },
    { label: "Shipped",    icon: Truck,       orders: shippedOrders },
    { label: "Completed",  icon: CheckCircle, orders: completedOrders },
    { label: "Cancelled",  icon: XCircle,     orders: cancelledOrders },
  ];

  // ── Progress bar steps matching admin's status flow ──
  const orderStatusSteps = ["Pending", "Confirmed", "Packed", "Shipped", "Delivered", "Completed"];

  const getStatusStep = (status: string) => {
    const map: Record<string, number> = {
      pending:          0,
      confirmed:        1,
      packed:           2,
      shipped:          3,
      out_for_delivery: 3,
      delivered:        4,
      arrived:          4,
      completed:        5,
    };
    return map[status] ?? 0;
  };

  // ── Status label + color for the badge ──
  const getStatusStyle = (status: string) => {
    const styles: Record<string, string> = {
      pending:          "bg-amber-100 text-amber-700",
      confirmed:        "bg-blue-100 text-blue-700",
      packed:           "bg-violet-100 text-violet-700",
      shipped:          "bg-indigo-100 text-indigo-700",
      out_for_delivery: "bg-sky-100 text-sky-700",
      delivered:        "bg-cyan-100 text-cyan-700",
      arrived:          "bg-teal-100 text-teal-700",
      completed:        "bg-green-100 text-green-700",
      cancelled:        "bg-red-100 text-red-600",
    };
    return styles[status] || "bg-primary/10 text-primary";
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending:          "Pending",
      confirmed:        "Confirmed",
      packed:           "Being Packed",
      shipped:          "Shipped",
      out_for_delivery: "Out for Delivery",
      delivered:        "Delivered",
      arrived:          "Arrived",
      completed:        "Completed",
      cancelled:        "Cancelled",
    };
    return labels[status] || status;
  };

  const handleSaveProfile = async () => {
    const { error } = await supabase.from("profiles").update({
      display_name: editName,
      phone: editPhone,
      birthday: editBirthday,
      gender: editGender,
    }).eq("user_id", user.id);
    if (error) { toast.error("Failed to update profile"); return; }
    toast.success("Profile updated!");
    setEditing(false);
    setProfile({ ...profile, display_name: editName, phone: editPhone, birthday: editBirthday, gender: editGender });
  };

  const uploadAvatar = async (file: File) => {
    setUploadingAvatar(true);
    const ext = file.name.split(".").pop();
    const fileName = `avatars/${user.id}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(fileName, file, { upsert: true });
    if (error) { toast.error("Upload failed"); setUploadingAvatar(false); return; }
    const { data } = supabase.storage.from("product-images").getPublicUrl(fileName);
    await supabase.from("profiles").update({ avatar_url: data.publicUrl }).eq("user_id", user.id);
    setAvatarUrl(data.publicUrl);
    setUploadingAvatar(false);
    toast.success("Avatar updated!");
  };

  const initials = (profile?.display_name || user.email || "U").charAt(0).toUpperCase();

  const sidebarNav = [
    {
      group: "Account",
      items: [
        { id: "profile" as SidebarSection,       label: "My Profile",    icon: User },
        { id: "addresses" as SidebarSection,      label: "Addresses",     icon: MapPin,  badge: addressCount },
        { id: "notifications" as SidebarSection,  label: "Notifications", icon: Bell },
        { id: "vouchers" as SidebarSection,       label: "Vouchers",      icon: Ticket },
      ]
    },
    {
      group: "Shopping",
      items: [
        { id: "orders" as SidebarSection,   label: "My Orders", icon: Package, badge: orders.length },
        { id: "wishlist" as SidebarSection, label: "Wishlist",  icon: Heart,   badge: wishlistCount },
      ]
    }
  ];

  return (
    <div className="pt-20 pb-16 bg-muted min-h-screen">
      <div className="container mx-auto max-w-6xl px-4">

        {/* ── Order status bar ── */}
        <div className="bg-card border border-border/50 rounded-xl mb-6 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">My Orders</p>
            <button onClick={() => setActiveSection("orders")} className="text-xs text-primary hover:underline flex items-center gap-1">
              View All <ChevronRight size={12} />
            </button>
          </div>
          <div className="grid grid-cols-5 gap-2 mt-3">
            {[
              { label: "Pending",    icon: Clock,       orders: pendingOrders,    tab: 1 },
              { label: "Processing", icon: Package,     orders: processingOrders, tab: 2 },
              { label: "Shipped",    icon: Truck,       orders: shippedOrders,    tab: 3 },
              { label: "Completed",  icon: CheckCircle, orders: completedOrders,  tab: 4 },
              { label: "Cancelled",  icon: XCircle,     orders: cancelledOrders,  tab: 5 },
            ].map(({ label, icon: Icon, orders: tabOrders, tab }) => (
              <button key={label} onClick={() => { setActiveSection("orders"); setActiveOrderTab(tab); }}
                className="flex flex-col items-center gap-1.5 p-2 rounded-lg hover:bg-muted transition-colors relative">
                <div className="relative">
                  <Icon size={22} className="text-primary" />
                  {tabOrders.length > 0 && (
                    <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                      {tabOrders.length}
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-muted-foreground whitespace-nowrap">{label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-6">
          {/* ── Sidebar ── */}
          <aside className="hidden md:block w-56 shrink-0">
            <div className="flex items-center gap-3 mb-6 px-1">
              <div className="relative shrink-0">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center border-2 border-primary/20">
                  {avatarUrl
                    ? <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                    : <span className="font-heading text-lg text-primary">{initials}</span>
                  }
                </div>
                <button onClick={() => fileRef.current?.click()}
                  className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-card border border-border rounded-full flex items-center justify-center hover:bg-muted transition-colors">
                  <Edit2 size={10} className="text-muted-foreground" />
                </button>
              </div>
              <div className="overflow-hidden">
                <p className="font-medium text-sm text-foreground truncate">{profile?.display_name || user.email?.split("@")[0]}</p>
                <button onClick={() => setActiveSection("profile")} className="text-xs text-muted-foreground hover:text-primary flex items-center gap-0.5">
                  <Edit2 size={10} /> Edit Profile
                </button>
              </div>
            </div>

            {sidebarNav.map((group) => (
              <div key={group.group} className="mb-4">
                <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium px-3 mb-1">{group.group}</p>
                {group.items.map(({ id, label, icon: Icon, badge }) => (
                  <button key={id} onClick={() => setActiveSection(id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors mb-0.5 ${
                      activeSection === id ? "bg-primary/10 text-primary font-medium" : "text-foreground hover:bg-muted"
                    }`}>
                    <span className="flex items-center gap-2.5"><Icon size={16} />{label}</span>
                    {badge !== undefined && badge > 0 && (
                      <span className="bg-primary/10 text-primary text-[10px] font-bold px-1.5 py-0.5 rounded-full">{badge}</span>
                    )}
                  </button>
                ))}
              </div>
            ))}

            <div className="mt-2 border-t border-border/50 pt-3">
              <Link to="/" className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors mb-0.5">
                <ShoppingCart size={16} /> Continue Shopping
              </Link>
              <button onClick={() => { signOut(); navigate("/"); }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-destructive hover:bg-destructive/5 transition-colors">
                <LogOut size={16} /> Sign Out
              </button>
            </div>
          </aside>

          {/* ── Main Content ── */}
          <main className="flex-1 min-w-0">

            {/* ─── Profile Section ─── */}
            {activeSection === "profile" && (
              <div className="bg-card border border-border/50 rounded-xl overflow-hidden">
                <div className="px-6 py-5 border-b border-border/50">
                  <h2 className="font-heading text-lg uppercase tracking-wider text-foreground">My Profile</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">Manage your personal information</p>
                </div>
                <div className="p-6">
                  <div className="flex flex-col sm:flex-row gap-8">
                    <div className="flex-1 space-y-5">
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <label className="text-sm font-medium text-foreground block mb-1.5">Username</label>
                          {editing
                            ? <Input value={editName} onChange={e => setEditName(e.target.value)} placeholder="Display name" />
                            : <div className="px-3 py-2 bg-muted rounded-lg text-sm text-foreground">{profile?.display_name || "—"}</div>
                          }
                        </div>
                        <div>
                          <label className="text-sm font-medium text-foreground block mb-1.5 flex items-center gap-1.5"><Mail size={13} /> Email</label>
                          <div className="px-3 py-2 bg-muted rounded-lg text-sm text-muted-foreground flex items-center justify-between">
                            <span>{user.email}</span>
                            <span className="text-[11px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">Verified</span>
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-foreground block mb-1.5 flex items-center gap-1.5"><Phone size={13} /> Phone</label>
                          {editing
                            ? <Input value={editPhone} onChange={e => setEditPhone(e.target.value)} placeholder="+63 9XX XXX XXXX" />
                            : <div className="px-3 py-2 bg-muted rounded-lg text-sm text-foreground">{profile?.phone || "—"}</div>
                          }
                        </div>
                        <div>
                          <label className="text-sm font-medium text-foreground block mb-1.5 flex items-center gap-1.5"><Calendar size={13} /> Birthday</label>
                          {editing
                            ? <Input type="date" value={editBirthday} onChange={e => setEditBirthday(e.target.value)} />
                            : <div className="px-3 py-2 bg-muted rounded-lg text-sm text-foreground">
                                {profile?.birthday ? new Date(profile.birthday).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "—"}
                              </div>
                          }
                        </div>
                        <div>
                          <label className="text-sm font-medium text-foreground block mb-1.5">Gender</label>
                          {editing
                            ? (
                              <div className="flex gap-3">
                                {["Male", "Female", "Other"].map(g => (
                                  <button key={g} onClick={() => setEditGender(g)}
                                    className={`px-4 py-1.5 rounded-full text-sm border transition-colors ${
                                      editGender === g ? "border-primary bg-primary/10 text-primary font-medium" : "border-border text-muted-foreground hover:border-primary/50"
                                    }`}>{g}</button>
                                ))}
                              </div>
                            )
                            : <div className="px-3 py-2 bg-muted rounded-lg text-sm text-foreground">{profile?.gender || "—"}</div>
                          }
                        </div>
                      </div>
                      <div className="flex gap-3 pt-2">
                        {editing ? (
                          <>
                            <Button onClick={handleSaveProfile} className="gap-2 bg-primary text-primary-foreground font-heading uppercase tracking-wider">
                              <Save size={14} /> Save
                            </Button>
                            <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
                          </>
                        ) : (
                          <Button variant="outline" onClick={() => setEditing(true)} className="gap-2 font-heading uppercase tracking-wider">
                            <Edit2 size={14} /> Edit Profile
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-center gap-3 sm:w-40">
                      <div className="w-24 h-24 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center border-2 border-border">
                        {avatarUrl
                          ? <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                          : <span className="font-heading text-4xl text-primary">{initials}</span>
                        }
                      </div>
                      <button onClick={() => fileRef.current?.click()} disabled={uploadingAvatar}
                        className="flex items-center gap-1.5 text-sm border border-border px-4 py-1.5 rounded-lg hover:bg-muted transition-colors text-foreground">
                        <Camera size={14} /> {uploadingAvatar ? "Uploading..." : "Select Image"}
                      </button>
                      <p className="text-[11px] text-muted-foreground text-center">File size: max 1 MB<br />JPG, PNG supported</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ─── Orders Section ─── */}
            {activeSection === "orders" && (
              <div className="bg-card border border-border/50 rounded-xl overflow-hidden">
                <div className="px-6 py-5 border-b border-border/50">
                  <h2 className="font-heading text-lg uppercase tracking-wider text-foreground">My Orders</h2>
                </div>

                {/* Tabs */}
                <div className="flex overflow-x-auto border-b border-border/50">
                  {orderTabs.map((tab, i) => (
                    <button key={tab.label} onClick={() => setActiveOrderTab(i)}
                      className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
                        activeOrderTab === i ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                      }`}>
                      {tab.label}
                      {tab.orders.length > 0 && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                          activeOrderTab === i ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                        }`}>{tab.orders.length}</span>
                      )}
                    </button>
                  ))}
                </div>

                <div className="p-4">
                  {loading ? (
                    <div className="flex justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                    </div>
                  ) : orderTabs[activeOrderTab].orders.length === 0 ? (
                    <div className="text-center py-16">
                      <Package size={48} className="mx-auto text-muted-foreground/30 mb-3" />
                      <p className="text-muted-foreground">No {orderTabs[activeOrderTab].label.toLowerCase()} orders</p>
                      <Link to="/shop">
                        <Button variant="outline" size="sm" className="mt-4 font-heading uppercase tracking-wider">Shop Now</Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orderTabs[activeOrderTab].orders.map((order: any) => {
                        const step = getStatusStep(order.status);
                        const isCancelled = order.status === "cancelled";
                        const orderItems = Array.isArray(order.order_items) ? order.order_items : [];

                        return (
                          <div key={order.id} className="border border-border/50 rounded-xl overflow-hidden">

                            {/* Order header */}
                            <div className="flex items-center justify-between px-4 py-3 bg-muted/40 border-b border-border/50">
                              <p className="text-xs font-mono text-muted-foreground">
                                Order #{order.id.slice(0, 8).toUpperCase()}
                              </p>
                              <div className="flex items-center gap-3">
                                <p className="text-xs text-muted-foreground">
                                  {new Date(order.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                </p>
                                {/* ── Live status badge matching admin ── */}
                                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full uppercase tracking-wide ${getStatusStyle(order.status)}`}>
                                  {getStatusLabel(order.status)}
                                </span>
                              </div>
                            </div>

                            {/* Items */}
                            <div className="px-4 py-3 space-y-2">
                              {orderItems.slice(0, 3).map((item: any, i: number) => (
                                <div key={i} className="flex items-center gap-3">
                                  <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                                    {item.product_image
                                      ? <img src={item.product_image} alt={item.product_name} className="w-full h-full object-cover" />
                                      : <Package size={18} className="text-muted-foreground/50" />
                                    }
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm text-foreground truncate">{item.product_name}</p>
                                    <div className="flex gap-2 mt-0.5">
                                      {item.selected_size && (
                                        <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                          {item.selected_size}
                                        </span>
                                      )}
                                      {item.selected_color && (
                                        <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded flex items-center gap-1">
                                          {item.selected_color_hex && (
                                            <span style={{ background: item.selected_color_hex }}
                                              className="w-2 h-2 rounded-full inline-block border border-border" />
                                          )}
                                          {item.selected_color}
                                        </span>
                                      )}
                                      <span className="text-[10px] text-muted-foreground">x{item.quantity}</span>
                                    </div>
                                  </div>
                                  <p className="text-sm font-medium text-foreground shrink-0">
                                    ₱{Number(item.price * item.quantity).toLocaleString()}
                                  </p>
                                </div>
                              ))}
                              {orderItems.length > 3 && (
                                <p className="text-xs text-primary">+{orderItems.length - 3} more items</p>
                              )}
                              {orderItems.length === 0 && (
                                <p className="text-xs text-muted-foreground italic">No item details available</p>
                              )}
                            </div>

                            {/* ── Progress tracker ── */}
                            {!isCancelled && (
                              <div className="px-4 py-4 border-t border-border/50 bg-muted/20">
                                <div className="flex items-start justify-between relative">
                                  {/* background line */}
                                  <div className="absolute left-0 right-0 top-3 h-0.5 bg-border mx-3" />
                                  {/* filled line */}
                                  <div
                                    className="absolute top-3 h-0.5 bg-primary transition-all duration-700 mx-3"
                                    style={{
                                      left: 0,
                                      width: `${(step / (orderStatusSteps.length - 1)) * 100}%`,
                                    }}
                                  />
                                  {orderStatusSteps.map((s, i) => (
                                    <div key={s} className="flex flex-col items-center gap-1.5 relative z-10 flex-1">
                                      <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                                        i < step  ? "bg-primary border-primary" :
                                        i === step ? "bg-primary border-primary ring-4 ring-primary/20" :
                                        "bg-card border-border"
                                      }`}>
                                        {i < step && <CheckCircle size={12} className="text-primary-foreground" />}
                                        {i === step && <div className="w-2 h-2 rounded-full bg-primary-foreground" />}
                                      </div>
                                      <span className={`text-[9px] text-center leading-tight whitespace-nowrap ${
                                        i <= step ? "text-primary font-semibold" : "text-muted-foreground"
                                      }`}>{s}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Cancelled banner */}
                            {isCancelled && (
                              <div className="px-4 py-3 border-t border-border/50 bg-red-50 flex items-center gap-2">
                                <XCircle size={14} className="text-red-500 shrink-0" />
                                <p className="text-xs text-red-600 font-medium">This order has been cancelled</p>
                              </div>
                            )}

                            {/* Footer */}
                            <div className="flex items-center justify-between px-4 py-3 border-t border-border/50">
                              <div>
                                {order.tracking_number && (
                                  <p className="text-xs text-muted-foreground">
                                    📦 Tracking: <span className="text-primary font-mono font-medium">{order.tracking_number}</span>
                                    {order.courier && <span className="text-muted-foreground ml-1">· {order.courier}</span>}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <p className="text-xs text-muted-foreground">Total:</p>
                                <p className="font-heading text-base text-primary">₱{Number(order.total).toLocaleString()}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ─── Wishlist ─── */}
            {activeSection === "wishlist" && (
              <div className="bg-card border border-border/50 rounded-xl overflow-hidden">
                <div className="px-6 py-5 border-b border-border/50 flex items-center justify-between">
                  <h2 className="font-heading text-lg uppercase tracking-wider text-foreground">Wishlist</h2>
                  <span className="text-sm text-muted-foreground">{wishlistCount} items</span>
                </div>
                <div className="p-6 text-center py-16">
                  <Heart size={48} className="mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground mb-4">Your saved items are in your wishlist</p>
                  <Link to="/wishlist"><Button className="bg-primary text-primary-foreground font-heading uppercase tracking-wider">View Wishlist</Button></Link>
                </div>
              </div>
            )}

            {/* ─── Addresses ─── */}
            {activeSection === "addresses" && (
              <div className="bg-card border border-border/50 rounded-xl overflow-hidden">
                <div className="px-6 py-5 border-b border-border/50 flex items-center justify-between">
                  <h2 className="font-heading text-lg uppercase tracking-wider text-foreground">My Addresses</h2>
                  <span className="text-sm text-muted-foreground">{addressCount} saved</span>
                </div>
                <div className="p-6 text-center py-16">
                  <MapPin size={48} className="mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground mb-4">Manage your delivery addresses</p>
                  <Link to="/addresses"><Button className="bg-primary text-primary-foreground font-heading uppercase tracking-wider">Manage Addresses</Button></Link>
                </div>
              </div>
            )}

            {/* ─── Notifications ─── */}
            {activeSection === "notifications" && (
              <div className="bg-card border border-border/50 rounded-xl overflow-hidden">
                <div className="px-6 py-5 border-b border-border/50">
                  <h2 className="font-heading text-lg uppercase tracking-wider text-foreground">Notifications</h2>
                </div>
                <div className="divide-y divide-border/50">
                  {orders.length === 0 ? (
                    <div className="text-center py-16">
                      <Bell size={48} className="mx-auto text-muted-foreground/30 mb-3" />
                      <p className="text-muted-foreground">No notifications yet</p>
                    </div>
                  ) : orders.slice(0, 10).map((order: any) => (
                    <div key={order.id} className="flex items-start gap-4 px-6 py-4 hover:bg-muted/30 transition-colors">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${getStatusStyle(order.status)}`}>
                        {order.status === "shipped" || order.status === "out_for_delivery" ? <Truck size={15} /> :
                         order.status === "completed" ? <CheckCircle size={15} /> :
                         order.status === "cancelled" ? <XCircle size={15} /> :
                         <Package size={15} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground">
                          Your order <span className="font-medium">#{order.id.slice(0, 8).toUpperCase()}</span> is{" "}
                          <span className={`font-semibold ${getStatusStyle(order.status).split(" ")[1]}`}>
                            {getStatusLabel(order.status)}
                          </span>.
                        </p>
                        {order.tracking_number && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Tracking: <span className="font-mono text-primary">{order.tracking_number}</span>
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(order.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ─── Vouchers ─── */}
            {activeSection === "vouchers" && (
              <div className="bg-card border border-border/50 rounded-xl overflow-hidden">
                <div className="px-6 py-5 border-b border-border/50">
                  <h2 className="font-heading text-lg uppercase tracking-wider text-foreground">My Vouchers</h2>
                </div>
                <div className="p-6 text-center py-16">
                  <Ticket size={48} className="mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground">No vouchers available</p>
                  <p className="text-xs text-muted-foreground mt-1">Vouchers you collect will appear here</p>
                </div>
              </div>
            )}

          </main>
        </div>

        {/* Mobile bottom nav */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border flex z-50">
          {[
            { id: "profile" as SidebarSection,       icon: User,    label: "Profile" },
            { id: "orders" as SidebarSection,         icon: Package, label: "Orders" },
            { id: "wishlist" as SidebarSection,       icon: Heart,   label: "Wishlist" },
            { id: "addresses" as SidebarSection,      icon: MapPin,  label: "Address" },
            { id: "notifications" as SidebarSection,  icon: Bell,    label: "Alerts" },
          ].map(({ id, icon: Icon, label }) => (
            <button key={id} onClick={() => setActiveSection(id)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] transition-colors ${
                activeSection === id ? "text-primary" : "text-muted-foreground"
              }`}>
              <Icon size={18} />{label}
            </button>
          ))}
        </div>
      </div>

      <input ref={fileRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => e.target.files?.[0] && uploadAvatar(e.target.files[0])} />
    </div>
  );
};

export default ProfilePage;