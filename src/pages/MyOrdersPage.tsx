import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  Package, ShoppingBag, CheckCircle, Truck,
  Clock, XCircle, MapPin, ExternalLink, Box
} from "lucide-react";

const STATUS_FLOW = ["pending", "confirmed", "packed", "shipped", "delivered", "completed"];

const STATUS_CONFIG: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  pending:   { label: "Order Placed",      icon: Clock,        color: "text-amber-500",  bg: "bg-amber-100" },
  confirmed: { label: "Order Confirmed",   icon: CheckCircle,  color: "text-blue-500",   bg: "bg-blue-100" },
  packed:    { label: "Packed",            icon: Box,          color: "text-violet-500", bg: "bg-violet-100" },
  shipped:   { label: "Shipped",           icon: Truck,        color: "text-indigo-500", bg: "bg-indigo-100" },
  delivered: { label: "Out for Delivery",  icon: MapPin,       color: "text-cyan-500",   bg: "bg-cyan-100" },
  completed: { label: "Delivered",         icon: CheckCircle,  color: "text-green-500",  bg: "bg-green-100" },
  cancelled: { label: "Cancelled",         icon: XCircle,      color: "text-red-500",    bg: "bg-red-100" },
};

const TAB_FILTERS = [
  { label: "All",          value: "all" },
  { label: "To Ship",      value: "confirmed,packed" },
  { label: "Shipped",      value: "shipped" },
  { label: "To Receive",   value: "delivered" },
  { label: "Completed",    value: "completed" },
  { label: "Cancelled",    value: "cancelled" },
];

const MyOrdersPage = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [viewOrder, setViewOrder] = useState<any>(null);

  useEffect(() => {
    if (!user) return;

    const fetchOrders = async () => {
      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setOrders(data || []);
      setLoading(false);
    };

    fetchOrders();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchOrders, 30000);

    // Real-time subscription
    const channel = supabase
      .channel("my-orders-realtime")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders" }, fetchOrders)
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [user]);

  const filteredOrders = orders.filter((o) => {
    if (activeTab === "all") return true;
    return activeTab.split(",").includes(o.status);
  });

  const getTabCount = (value: string) => {
    if (value === "all") return orders.length;
    return orders.filter((o) => value.split(",").includes(o.status)).length;
  };

  if (!user) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="text-center">
          <Package size={48} className="mx-auto text-muted-foreground mb-4" />
          <h1 className="font-heading text-2xl uppercase text-foreground mb-2">Sign in to view orders</h1>
          <Link to="/signin"><Button className="bg-primary text-primary-foreground">Sign In</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-16 px-4">
      <div className="container mx-auto max-w-3xl">
        <h1 className="font-heading text-3xl uppercase tracking-wider text-foreground mb-6">My Orders</h1>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          {TAB_FILTERS.map((tab) => {
            const count = getTabCount(tab.value);
            return (
              <button key={tab.value} onClick={() => setActiveTab(tab.value)}
                className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeTab === tab.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}>
                {tab.label}
                {count > 0 && (
                  <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                    activeTab === tab.value ? "bg-white/20" : "bg-primary/10 text-primary"
                  }`}>{count}</span>
                )}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingBag size={48} className="mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No orders here yet</p>
            <Link to="/shop">
              <Button className="bg-primary text-primary-foreground">Start Shopping</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
              const StatusIcon = config.icon;
              const isCancelled = order.status === "cancelled";

              return (
                <Card key={order.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    {/* Order header */}
                    <div className="flex items-center justify-between px-5 py-3 border-b border-border">
                      <div className="flex items-center gap-2">
                        <StatusIcon size={14} className={config.color} />
                        <span className={`text-xs font-semibold ${config.color}`}>{config.label}</span>
                      </div>
                      <span className="text-xs text-muted-foreground font-mono">#{order.id.slice(0, 8).toUpperCase()}</span>
                    </div>

                    {/* Items */}
                    <div className="px-5 py-3 space-y-2">
                      {(Array.isArray(order.items) ? order.items : []).map((item: any, i: number) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
                            {item.image_url
                              ? <img src={item.image_url} alt={item.name} className="w-full h-full object-cover rounded-lg" />
                              : <Package size={18} className="text-muted-foreground" />
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                            <p className="text-xs text-muted-foreground">x{item.quantity} · ₱{Number(item.price).toLocaleString()} each</p>
                          </div>
                          <p className="text-sm font-semibold text-foreground shrink-0">
                            ₱{(item.price * item.quantity).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Tracking info if shipped */}
                    {order.tracking_number && (
                      <div className="mx-5 mb-3 p-3 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Truck size={14} className="text-indigo-500" />
                          <div>
                            <p className="text-xs font-medium text-indigo-700">{order.courier}</p>
                            <p className="text-xs font-mono text-indigo-500">{order.tracking_number}</p>
                          </div>
                        </div>
                        {order.courier_url && (
                          <a href={order.courier_url} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-indigo-600 font-medium hover:underline">
                            Track <ExternalLink size={11} />
                          </a>
                        )}
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-muted/30">
                      <div>
                        <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}</p>
                        <p className="text-sm font-heading font-bold text-foreground">
                          Total: <span className="text-primary">₱{Number(order.total).toLocaleString()}</span>
                        </p>
                      </div>
                      <Button size="sm" variant="outline"
                        className="text-xs font-medium"
                        onClick={() => setViewOrder(order)}>
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      <Dialog open={!!viewOrder} onOpenChange={() => setViewOrder(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogTitle className="font-heading uppercase tracking-wider">Order Details</DialogTitle>
          {viewOrder && (
            <div className="space-y-4 text-sm">
              {/* Status timeline */}
              <div className="p-4 rounded-xl bg-muted/50">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">Order Progress</p>
                {viewOrder.status === "cancelled" ? (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 border border-red-100">
                    <XCircle size={20} className="text-red-500 shrink-0" />
                    <div>
                      <p className="font-medium text-red-700">Order Cancelled</p>
                      <p className="text-xs text-red-500">This order has been cancelled</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-0">
                    {STATUS_FLOW.map((s, i) => {
                      const cfg = STATUS_CONFIG[s];
                      const StepIcon = cfg.icon;
                      const history = viewOrder.status_history || [];
                      const entry = history.find((h: any) => h.status === s);
                      const currentIdx = STATUS_FLOW.indexOf(viewOrder.status);
                      const stepIdx = STATUS_FLOW.indexOf(s);
                      const isDone = currentIdx >= stepIdx;
                      const isCurrent = viewOrder.status === s;

                      return (
                        <div key={s} className="flex items-start gap-3">
                          <div className="flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all ${
                              isCurrent ? `${cfg.bg} ring-2 ring-offset-1 ${cfg.color.replace("text", "ring")}` :
                              isDone ? "bg-green-100" : "bg-muted"
                            }`}>
                              <StepIcon size={14} className={isDone ? cfg.color : "text-muted-foreground"} />
                            </div>
                            {i < STATUS_FLOW.length - 1 && (
                              <div className={`w-0.5 h-6 mt-0.5 ${isDone ? "bg-green-300" : "bg-border"}`} />
                            )}
                          </div>
                          <div className="pt-1.5 pb-3">
                            <p className={`text-sm font-medium ${isCurrent ? cfg.color : isDone ? "text-foreground" : "text-muted-foreground"}`}>
                              {cfg.label}
                            </p>
                            {entry?.timestamp ? (
                              <p className="text-xs text-muted-foreground">
                                {new Date(entry.timestamp).toLocaleString("en-PH", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                              </p>
                            ) : isCurrent ? (
                              <p className="text-xs text-muted-foreground">In progress</p>
                            ) : !isDone ? (
                              <p className="text-xs text-muted-foreground">Pending</p>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Tracking */}
              {viewOrder.tracking_number && (
                <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100">
                  <p className="text-xs font-medium text-indigo-700 mb-1 flex items-center gap-1">
                    <Truck size={12} /> Tracking Information
                  </p>
                  <p className="font-mono text-sm font-bold text-indigo-600">{viewOrder.tracking_number}</p>
                  <p className="text-xs text-indigo-500">{viewOrder.courier}</p>
                  {viewOrder.courier_url && (
                    <a href={viewOrder.courier_url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-indigo-600 font-medium mt-2 hover:underline">
                      Track your package <ExternalLink size={11} />
                    </a>
                  )}
                </div>
              )}

              {/* Order info */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Order ID</span>
                  <span className="font-mono text-xs">#{viewOrder.id?.slice(0, 8).toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date</span>
                  <span>{new Date(viewOrder.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment</span>
                  <span className="capitalize">{viewOrder.payment_method} · {viewOrder.payment_status}</span>
                </div>
                {viewOrder.shipping_address && (
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground shrink-0">Ship to</span>
                    <span className="text-right text-xs">{viewOrder.shipping_address}</span>
                  </div>
                )}
              </div>

              {/* Items */}
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Items</p>
                <div className="space-y-2">
                  {(Array.isArray(viewOrder.items) ? viewOrder.items : []).map((item: any, i: number) => (
                    <div key={i} className="flex justify-between p-2 rounded-lg bg-muted/50 text-xs">
                      <span>{item.quantity}× {item.name}</span>
                      <span className="font-medium">₱{(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="border-t border-border pt-3 flex justify-between font-heading text-base">
                <span>Total</span>
                <span className="text-primary">₱{Number(viewOrder.total).toLocaleString()}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyOrdersPage;
