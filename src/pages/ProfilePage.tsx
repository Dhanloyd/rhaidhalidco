import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { User, Package, Truck, CheckCircle, ShoppingCart, Heart, MapPin, LogOut, Clock, XCircle, ChevronRight, Edit2, Save } from "lucide-react";
import { toast } from "sonner";

const ProfilePage = () => {
  const { user, signOut, displayName } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [addressCount, setAddressCount] = useState(0);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("orders").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("wishlist").select("id", { count: "exact" }).eq("user_id", user.id),
      supabase.from("addresses").select("id", { count: "exact" }).eq("user_id", user.id),
    ]).then(([ordersRes, profileRes, wishlistRes, addressRes]) => {
      setOrders(ordersRes.data || []);
      setProfile(profileRes.data);
      setEditName(profileRes.data?.display_name || "");
      setEditPhone(profileRes.data?.phone || "");
      setWishlistCount(wishlistRes.count || 0);
      setAddressCount(addressRes.count || 0);
      setLoading(false);
    });
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

  const pendingOrders = orders.filter(o => o.status === "pending");
  const processingOrders = orders.filter(o => o.status === "processing");
  const shippedOrders = orders.filter(o => o.status === "shipped");
  const completedOrders = orders.filter(o => o.status === "completed");
  const cancelledOrders = orders.filter(o => o.status === "cancelled");

  const handleSaveProfile = async () => {
    const { error } = await supabase.from("profiles").update({ display_name: editName, phone: editPhone }).eq("user_id", user.id);
    if (error) { toast.error("Failed to update profile"); return; }
    toast.success("Profile updated!");
    setEditing(false);
    setProfile({ ...profile, display_name: editName, phone: editPhone });
  };

  const orderTabs = [
    { label: "Pending", icon: Clock, count: pendingOrders.length, color: "text-yellow-600 bg-yellow-50", orders: pendingOrders },
    { label: "Processing", icon: Package, count: processingOrders.length, color: "text-blue-600 bg-blue-50", orders: processingOrders },
    { label: "Shipped", icon: Truck, count: shippedOrders.length, color: "text-purple-600 bg-purple-50", orders: shippedOrders },
    { label: "Completed", icon: CheckCircle, count: completedOrders.length, color: "text-green-600 bg-green-50", orders: completedOrders },
    { label: "Cancelled", icon: XCircle, count: cancelledOrders.length, color: "text-red-600 bg-red-50", orders: cancelledOrders },
  ];

  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="pt-20 pb-16 px-4 bg-muted min-h-screen">
      <div className="container mx-auto max-w-4xl">
        {/* Profile Header */}
        <Card className="mb-6">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <User size={32} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                {editing ? (
                  <div className="space-y-3">
                    <Input value={editName} onChange={e => setEditName(e.target.value)} placeholder="Display Name" className="max-w-xs" />
                    <Input value={editPhone} onChange={e => setEditPhone(e.target.value)} placeholder="Phone Number" className="max-w-xs" />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSaveProfile} className="gap-1 bg-primary text-primary-foreground"><Save size={14} /> Save</Button>
                      <Button size="sm" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h2 className="font-heading text-xl sm:text-2xl uppercase text-foreground truncate">{profile?.display_name || user.email}</h2>
                    <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                    {profile?.phone && <p className="text-sm text-muted-foreground">📞 {profile.phone}</p>}
                    <button onClick={() => setEditing(true)} className="mt-2 text-sm text-primary flex items-center gap-1 hover:underline"><Edit2 size={14} /> Edit Profile</button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <Link to="/cart">
            <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
              <CardContent className="p-4 text-center">
                <ShoppingCart size={24} className="mx-auto text-primary mb-2" />
                <p className="text-sm font-medium text-foreground">Cart</p>
                <p className="text-lg font-heading text-primary">{totalItems}</p>
              </CardContent>
            </Card>
          </Link>
          <Link to="/wishlist">
            <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
              <CardContent className="p-4 text-center">
                <Heart size={24} className="mx-auto text-primary mb-2" />
                <p className="text-sm font-medium text-foreground">Wishlist</p>
                <p className="text-lg font-heading text-primary">{wishlistCount}</p>
              </CardContent>
            </Card>
          </Link>
          <Link to="/addresses">
            <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
              <CardContent className="p-4 text-center">
                <MapPin size={24} className="mx-auto text-primary mb-2" />
                <p className="text-sm font-medium text-foreground">Addresses</p>
                <p className="text-lg font-heading text-primary">{addressCount}</p>
              </CardContent>
            </Card>
          </Link>
          <Card className="hover:border-destructive/50 transition-colors cursor-pointer h-full" onClick={() => { signOut(); navigate("/"); }}>
            <CardContent className="p-4 text-center">
              <LogOut size={24} className="mx-auto text-destructive mb-2" />
              <p className="text-sm font-medium text-destructive">Sign Out</p>
            </CardContent>
          </Card>
        </div>

        {/* Order Tracking Tabs */}
        <Card>
          <CardContent className="p-0">
            <div className="flex overflow-x-auto border-b border-border">
              {orderTabs.map((tab, i) => (
                <button key={tab.label} onClick={() => setActiveTab(i)}
                  className={`flex-1 min-w-[80px] flex flex-col items-center gap-1 py-3 px-2 text-xs sm:text-sm font-medium transition-colors border-b-2 ${activeTab === i ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                  <tab.icon size={18} />
                  <span className="whitespace-nowrap">{tab.label}</span>
                  {tab.count > 0 && <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${tab.color}`}>{tab.count}</span>}
                </button>
              ))}
            </div>
            <div className="p-4">
              {loading ? (
                <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
              ) : orderTabs[activeTab].orders.length === 0 ? (
                <div className="text-center py-8">
                  <Package size={40} className="mx-auto text-muted-foreground/40 mb-3" />
                  <p className="text-sm text-muted-foreground">No {orderTabs[activeTab].label.toLowerCase()} orders</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {orderTabs[activeTab].orders.map((order: any) => (
                    <div key={order.id} className="p-3 sm:p-4 rounded-lg bg-muted/50 border border-border/50">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-mono text-muted-foreground">#{order.id.slice(0, 8)}</p>
                        <p className="font-heading text-base sm:text-lg text-primary">₱{Number(order.total).toLocaleString()}</p>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{new Date(order.created_at).toLocaleDateString()}</p>
                      <div className="space-y-0.5">
                        {(Array.isArray(order.items) ? order.items : []).slice(0, 3).map((item: any, i: number) => (
                          <p key={i} className="text-xs sm:text-sm text-muted-foreground truncate">{item.quantity}× {item.name}</p>
                        ))}
                        {(order.items as any[])?.length > 3 && <p className="text-xs text-primary">+{(order.items as any[]).length - 3} more items</p>}
                      </div>
                      {order.tracking_number && <p className="mt-2 text-xs text-primary">📦 Tracking: {order.tracking_number}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfilePage;
