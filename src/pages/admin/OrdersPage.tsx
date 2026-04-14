import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Search, Filter, Eye, Trash2, ShoppingCart, TrendingUp, CheckCircle, ChevronRight, Truck } from "lucide-react";

const statusFlow = ["pending", "confirmed", "packed", "shipped", "delivered", "completed", "cancelled"];

const COURIERS = [
  { id: "jnt",      name: "J&T Express", url: "https://www.jnt.com.ph/tracking?awb=" },
  { id: "lbc",      name: "LBC",         url: "https://www.lbcexpress.com/track/?tracking_no=" },
  { id: "ninjavan", name: "Ninja Van",   url: "https://www.ninjavan.co/en-ph/tracking?id=" },
  { id: "grab",     name: "GrabExpress", url: "" },
  { id: "lalamove", name: "Lalamove",    url: "" },
  { id: "other",    name: "Other",       url: "" },
];

const STATUS_COLORS: Record<string, string> = {
  pending:   "bg-amber-500/15 text-amber-400 border border-amber-500/20",
  confirmed: "bg-blue-500/15 text-blue-400 border border-blue-500/20",
  packed:    "bg-violet-500/15 text-violet-400 border border-violet-500/20",
  shipped:   "bg-indigo-500/15 text-indigo-400 border border-indigo-500/20",
  delivered: "bg-cyan-500/15 text-cyan-400 border border-cyan-500/20",
  completed: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20",
  cancelled: "bg-red-500/15 text-red-400 border border-red-500/20",
};

const card = "bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl";

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewOrder, setViewOrder] = useState<any>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [shippingModal, setShippingModal] = useState<any>(null);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [courier, setCourier] = useState("jnt");

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    // Only fetch orders that are not soft-deleted
    const { data } = await supabase
      .from("orders")
      .select("*")
      .eq("is_deleted", false)
      .order("created_at", { ascending: false });
    setOrders(data || []);
  };

  // ── Soft delete ──
  const deleteOrder = async (id: string) => {
    if (!confirm("Remove this order from view? It will be kept in the database.")) return;
    const { error } = await supabase.from("orders").update({ is_deleted: true }).eq("id", id);
    if (error) { toast.error("Failed to remove order"); return; }
    toast.success("Order removed from view");
    setOrders((prev) => prev.filter((o) => o.id !== id));
  };

  const updateStatus = async (id: string, newStatus: string) => {
    if (newStatus === "shipped") { const order = orders.find((o) => o.id === id); setShippingModal(order); return; }
    setUpdatingId(id);
    const now = new Date().toISOString();
    const order = orders.find((o) => o.id === id);
    const history = [...(order?.status_history || []), { status: newStatus, timestamp: now }];
    const { error } = await supabase.from("orders").update({ status: newStatus, status_history: history }).eq("id", id);
    if (error) { toast.error("Failed to update status"); }
    else {
      toast.success(`Order marked as ${newStatus}`);
      setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status: newStatus, status_history: history } : o));
      if (viewOrder?.id === id) setViewOrder((p: any) => ({ ...p, status: newStatus, status_history: history }));
    }
    setUpdatingId(null);
  };

  const confirmShipping = async () => {
    if (!trackingNumber.trim()) { toast.error("Please enter a tracking number"); return; }
    const now = new Date().toISOString();
    const history = [...(shippingModal?.status_history || []), { status: "shipped", timestamp: now }];
    const courierInfo = COURIERS.find((c) => c.id === courier);
    const { error } = await supabase.from("orders").update({
      status: "shipped", status_history: history, tracking_number: trackingNumber,
      courier: courierInfo?.name, courier_url: courierInfo?.url ? `${courierInfo.url}${trackingNumber}` : null,
    }).eq("id", shippingModal.id);
    if (error) { toast.error("Failed to update shipping"); return; }
    toast.success("Order marked as shipped!");
    const updated = { status: "shipped", status_history: history, tracking_number: trackingNumber, courier: courierInfo?.name, courier_url: courierInfo?.url ? `${courierInfo.url}${trackingNumber}` : null };
    setOrders((prev) => prev.map((o) => o.id === shippingModal.id ? { ...o, ...updated } : o));
    if (viewOrder?.id === shippingModal.id) setViewOrder((p: any) => ({ ...p, ...updated }));
    setShippingModal(null); setTrackingNumber(""); setCourier("jnt");
  };

  const getNextStatus = (current: string) => {
    const idx = statusFlow.indexOf(current);
    if (idx === -1 || current === "cancelled" || current === "completed") return null;
    return statusFlow[idx + 1] === "cancelled" ? null : statusFlow[idx + 1];
  };

  const filtered = orders.filter((o) =>
    (o.customer_name || "").toLowerCase().includes(search.toLowerCase()) &&
    (statusFilter === "all" || o.status === statusFilter)
  );

  const totalRevenue = orders.reduce((s, o) => s + Number(o.total || 0), 0);
  const completed = orders.filter((o) => o.status === "completed").length;

  return (
    <div className="min-h-screen p-6 space-y-6 text-white"
      style={{ background: "linear-gradient(135deg,#0f1117,#141824,#0f1117)" }}>
      <div>
        <h1 className="text-2xl font-bold tracking-wide">Orders</h1>
        <p className="text-xs text-slate-400">Manage & track all orders</p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Total Orders", value: orders.length, icon: ShoppingCart, color: "text-blue-400" },
          { label: "Revenue", value: `₱${totalRevenue.toLocaleString()}`, icon: TrendingUp, color: "text-emerald-400" },
          { label: "Completed", value: completed, icon: CheckCircle, color: "text-green-400" },
        ].map((kpi) => (
          <div key={kpi.label} className={`${card} p-5 transition-all hover:scale-[1.03]`}>
            <div className="flex justify-between items-center">
              <kpi.icon className={kpi.color} />
              <span className="text-xs text-slate-400">{kpi.label}</span>
            </div>
            <h2 className="text-2xl font-bold mt-2">{kpi.value}</h2>
          </div>
        ))}
      </div>

      {/* TABLE */}
      <div className={`${card} p-5`}>
        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <Input placeholder="Search orders..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-white/5 border-white/10" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px] bg-white/5 border-white/10">
              <Filter size={14} /><SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {statusFlow.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10">
                <TableHead>ID</TableHead><TableHead>Customer</TableHead><TableHead>Total</TableHead>
                <TableHead>Status</TableHead><TableHead>Tracking</TableHead><TableHead>Date</TableHead><TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-12 text-slate-500">No orders found</TableCell></TableRow>
              ) : filtered.map((o) => {
                const next = getNextStatus(o.status);
                return (
                  <TableRow key={o.id} className="border-white/5 hover:bg-white/5 transition-all">
                    <TableCell className="font-mono text-xs text-indigo-400">#{o.id.slice(0, 8)}</TableCell>
                    <TableCell><p className="text-sm">{o.customer_name}</p><p className="text-xs text-slate-500">{o.customer_email}</p></TableCell>
                    <TableCell className="font-bold">₱{Number(o.total).toLocaleString()}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[o.status] || "bg-white/10 text-white"}`}>{o.status}</span>
                    </TableCell>
                    <TableCell className="text-xs">
                      {o.tracking_number ? (
                        <div><p className="font-mono text-indigo-300">{o.tracking_number}</p><p className="text-slate-500">{o.courier}</p></div>
                      ) : <span className="text-slate-600">—</span>}
                    </TableCell>
                    <TableCell className="text-slate-400 text-xs">{new Date(o.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {next && (
                          <Button size="sm" variant="ghost" disabled={updatingId === o.id}
                            onClick={() => updateStatus(o.id, next)}
                            className="text-xs h-7 px-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 gap-1">
                            <ChevronRight size={12} />{next === "shipped" ? "Ship" : next.charAt(0).toUpperCase() + next.slice(1)}
                          </Button>
                        )}
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setViewOrder(o)}><Eye size={13} /></Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 hover:text-red-400" onClick={() => deleteOrder(o.id)}><Trash2 size={13} /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* VIEW ORDER MODAL */}
      <Dialog open={!!viewOrder} onOpenChange={() => setViewOrder(null)}>
        <DialogContent className="bg-[#111827] text-white border-white/10 max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogTitle>Order Details</DialogTitle>
          {viewOrder && (
            <div className="text-sm space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div><p className="text-xs text-slate-400">Order ID</p><p className="font-mono text-indigo-400">#{viewOrder.id?.slice(0, 8).toUpperCase()}</p></div>
                <div><p className="text-xs text-slate-400">Date</p><p>{new Date(viewOrder.created_at).toLocaleDateString()}</p></div>
                <div><p className="text-xs text-slate-400">Customer</p><p>{viewOrder.customer_name}</p></div>
                <div><p className="text-xs text-slate-400">Email</p><p className="truncate">{viewOrder.customer_email}</p></div>
                <div><p className="text-xs text-slate-400">Total</p><p className="font-bold text-emerald-400">₱{Number(viewOrder.total).toLocaleString()}</p></div>
                <div><p className="text-xs text-slate-400">Payment</p><p className="capitalize">{viewOrder.payment_method} · {viewOrder.payment_status}</p></div>
              </div>
              {viewOrder.tracking_number && (
                <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                  <p className="text-xs text-slate-400 mb-1 flex items-center gap-1"><Truck size={12} /> Tracking Info</p>
                  <p className="font-mono text-indigo-300 font-bold">{viewOrder.tracking_number}</p>
                  <p className="text-xs text-slate-400">{viewOrder.courier}</p>
                  {viewOrder.courier_url && <a href={viewOrder.courier_url} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-400 underline mt-1 inline-block">Track Package →</a>}
                </div>
              )}
              <div>
                <p className="text-xs text-slate-400 mb-3">Order Timeline</p>
                {statusFlow.filter((s) => s !== "cancelled").map((s, i, arr) => {
                  const history = viewOrder.status_history || [];
                  const entry = history.find((h: any) => h.status === s);
                  const currentIdx = statusFlow.indexOf(viewOrder.status);
                  const stepIdx = statusFlow.indexOf(s);
                  const isDone = currentIdx >= stepIdx && viewOrder.status !== "cancelled";
                  const isCurrent = viewOrder.status === s;
                  return (
                    <div key={s} className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full mt-0.5 shrink-0 ${isCurrent ? "bg-indigo-400 ring-2 ring-indigo-400/30" : isDone ? "bg-emerald-400" : "bg-white/10"}`} />
                        {i < arr.length - 1 && <div className={`w-px h-6 ${isDone ? "bg-emerald-400/40" : "bg-white/10"}`} />}
                      </div>
                      <div className="pb-1">
                        <p className={`text-xs capitalize font-medium ${isCurrent ? "text-indigo-400" : isDone ? "text-emerald-400" : "text-slate-600"}`}>{s}</p>
                        {entry?.timestamp && <p className="text-[10px] text-slate-500">{new Date(entry.timestamp).toLocaleString()}</p>}
                      </div>
                    </div>
                  );
                })}
                {viewOrder.status === "cancelled" && (
                  <div className="flex items-center gap-2 mt-1"><div className="w-3 h-3 rounded-full bg-red-400 shrink-0" /><p className="text-xs text-red-400 font-medium">Cancelled</p></div>
                )}
              </div>
              {getNextStatus(viewOrder.status) && (
                <Button className="w-full bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/20"
                  onClick={() => updateStatus(viewOrder.id, getNextStatus(viewOrder.status)!)}>
                  Mark as {getNextStatus(viewOrder.status)} →
                </Button>
              )}
              {!["completed", "cancelled"].includes(viewOrder.status) && (
                <Button variant="ghost" className="w-full text-red-400 hover:bg-red-500/10"
                  onClick={() => { updateStatus(viewOrder.id, "cancelled"); setViewOrder(null); }}>
                  Cancel Order
                </Button>
              )}
              {viewOrder.shipping_address && (
                <div><p className="text-xs text-slate-400 mb-1">Shipping Address</p><p className="text-slate-300">{viewOrder.shipping_address}</p></div>
              )}
              {Array.isArray(viewOrder.items) && viewOrder.items.length > 0 && (
                <div>
                  <p className="text-xs text-slate-400 mb-2">Items</p>
                  <div className="space-y-1.5">
                    {viewOrder.items.map((item: any, i: number) => (
                      <div key={i} className="flex justify-between text-xs p-2 rounded-lg bg-white/5">
                        <span className="text-slate-300">{item.name}</span>
                        <span className="text-slate-400">x{item.quantity} · ₱{Number(item.price).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* SHIPPING MODAL */}
      <Dialog open={!!shippingModal} onOpenChange={() => { setShippingModal(null); setTrackingNumber(""); }}>
        <DialogContent className="bg-[#111827] text-white border-white/10 max-w-sm">
          <DialogTitle className="flex items-center gap-2"><Truck size={16} /> Ship Order</DialogTitle>
          <div className="space-y-4 text-sm">
            <p className="text-slate-400">Enter tracking details for <span className="text-white font-medium">{shippingModal?.customer_name}</span>'s order.</p>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Courier</label>
              <Select value={courier} onValueChange={setCourier}>
                <SelectTrigger className="bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                <SelectContent>{COURIERS.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Tracking Number</label>
              <Input value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} placeholder="e.g. 1234567890" className="bg-white/5 border-white/10" />
            </div>
            <div className="flex gap-2">
              <Button className="flex-1 bg-indigo-600 hover:bg-indigo-500" onClick={confirmShipping}>Confirm Shipment</Button>
              <Button variant="ghost" className="flex-1 border border-white/10" onClick={() => { setShippingModal(null); setTrackingNumber(""); }}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
