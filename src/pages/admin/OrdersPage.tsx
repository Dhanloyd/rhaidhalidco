import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Search, Filter, Eye, Trash2, ShoppingCart,
  TrendingUp, CheckCircle, ChevronRight, Truck,
  MapPin, Clock, RotateCcw, Package, AlertCircle, EyeOff,
} from "lucide-react";

const statusFlow = [
  "pending","confirmed","packed","shipped",
  "out_for_delivery","delivered","arrived","completed","cancelled",
];

const COURIERS = [
  { id:"jnt",      name:"J&T Express", url:"https://www.jnt.com.ph/tracking?awb=" },
  { id:"lbc",      name:"LBC",         url:"https://www.lbcexpress.com/track/?tracking_no=" },
  { id:"ninjavan", name:"Ninja Van",   url:"https://www.ninjavan.co/en-ph/tracking?id=" },
  { id:"grab",     name:"GrabExpress", url:"" },
  { id:"lalamove", name:"Lalamove",    url:"" },
  { id:"other",    name:"Other",       url:"" },
];

const STATUS_COLORS: Record<string, string> = {
  pending:          "bg-amber-500/15 text-amber-400 border border-amber-500/20",
  confirmed:        "bg-blue-500/15 text-blue-400 border border-blue-500/20",
  packed:           "bg-violet-500/15 text-violet-400 border border-violet-500/20",
  shipped:          "bg-indigo-500/15 text-indigo-400 border border-indigo-500/20",
  out_for_delivery: "bg-sky-500/15 text-sky-400 border border-sky-500/20",
  delivered:        "bg-cyan-500/15 text-cyan-400 border border-cyan-500/20",
  arrived:          "bg-teal-500/15 text-teal-400 border border-teal-500/20",
  completed:        "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20",
  cancelled:        "bg-red-500/15 text-red-400 border border-red-500/20",
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  pending:          <Clock size={11} />,
  confirmed:        <CheckCircle size={11} />,
  packed:           <Package size={11} />,
  shipped:          <Truck size={11} />,
  out_for_delivery: <Truck size={11} />,
  delivered:        <MapPin size={11} />,
  arrived:          <MapPin size={11} />,
  completed:        <CheckCircle size={11} />,
  cancelled:        <AlertCircle size={11} />,
};

const card = "bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl";

const TIMELINE_MESSAGES: Record<string, string> = {
  pending:          "Order placed successfully",
  confirmed:        "Order confirmed by seller",
  packed:           "Your order is being packed",
  shipped:          "Order has been shipped",
  out_for_delivery: "Out for delivery",
  delivered:        "Package has been delivered",
  arrived:          "Package has arrived",
  completed:        "Order completed. Thank you!",
  cancelled:        "Order was cancelled",
};

// ─── Delete confirmation modal ────────────────────────────────────────────────
// FIXED: properly distinguishes between hiding (is_deleted toggle) and hard delete
function DeleteConfirmModal({
  order,
  onClose,
  onHide,
  onDeletePermanently,
}: {
  order: any | null;
  onClose: () => void;
  onHide: (order: any) => void;
  onDeletePermanently: (order: any) => void;
}) {
  const [step, setStep] = useState<"choose" | "confirm">("choose");

  // Reset step whenever a new order is passed in
  useEffect(() => { if (order) setStep("choose"); }, [order]);

  if (!order) return null;

  const handleClose = () => { setStep("choose"); onClose(); };

  return (
    <Dialog open={!!order} onOpenChange={handleClose}>
      <DialogContent className="bg-[#111827] text-white border-white/10 max-w-sm">
        {step === "choose" ? (
          <>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-red-500/15 border border-red-500/25 flex items-center justify-center shrink-0">
                <Trash2 size={15} className="text-red-400" />
              </div>
              <div>
                <p className="text-sm font-semibold">Remove order</p>
                <p className="text-[11px] text-slate-400 font-normal mt-0.5">Choose how to remove this order</p>
              </div>
            </DialogTitle>

            {/* Order preview */}
            <div className="p-3 rounded-xl bg-white/5 border border-white/8 text-sm">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">
                Order #{order.id?.slice(0, 8).toUpperCase()}
              </p>
              <p className="font-medium">{order.customer_name}</p>
              <p className="text-xs text-emerald-400">₱{Number(order.total).toLocaleString()} · {order.status}</p>
            </div>

            <div className="flex flex-col gap-2.5">
              {/* Hide — only shown when the order is NOT already hidden */}
              {!order.is_deleted && (
                <button
                  onClick={() => { onHide(order); handleClose(); }}
                  className="flex items-center gap-3 p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/15 transition-all text-left w-full">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center shrink-0">
                    <EyeOff size={14} className="text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-indigo-300">Hide order</p>
                    <p className="text-[11px] text-slate-500">Moves to hidden list · can be restored anytime</p>
                  </div>
                </button>
              )}

              {/* Delete permanently — always available */}
              <button
                onClick={() => setStep("confirm")}
                className="flex items-center gap-3 p-3.5 rounded-xl bg-red-500/8 border border-red-500/20 hover:bg-red-500/12 transition-all text-left w-full">
                <div className="w-8 h-8 rounded-lg bg-red-500/15 flex items-center justify-center shrink-0">
                  <Trash2 size={14} className="text-red-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-red-400">Delete permanently</p>
                  <p className="text-[11px] text-slate-500">Cannot be undone · removes all order data</p>
                </div>
              </button>
            </div>

            <Button variant="ghost" className="w-full border border-white/8 text-slate-400 text-sm"
              onClick={handleClose}>
              Cancel
            </Button>
          </>
        ) : (
          <>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center shrink-0">
                <AlertCircle size={15} className="text-red-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-red-300">Are you absolutely sure?</p>
                <p className="text-[11px] text-slate-400 font-normal mt-0.5">This action cannot be undone</p>
              </div>
            </DialogTitle>

            <div className="p-3.5 rounded-xl bg-red-500/8 border border-red-500/20 text-sm space-y-1">
              <p className="text-red-300 font-medium text-xs">This will permanently delete:</p>
              <ul className="text-slate-400 text-xs space-y-0.5 list-disc list-inside">
                <li>Order #{order.id?.slice(0, 8).toUpperCase()} and all its data</li>
                <li>Order items, timeline, and tracking info</li>
                <li>All associated customer records for this order</li>
              </ul>
            </div>

            <div className="flex gap-2">
              <Button
                className="flex-1 bg-red-600 hover:bg-red-500 text-white gap-1.5 text-sm"
                onClick={() => { onDeletePermanently(order); setStep("choose"); handleClose(); }}>
                <Trash2 size={13} /> Yes, delete permanently
              </Button>
              <Button variant="ghost" className="flex-1 border border-white/10 text-sm"
                onClick={() => setStep("choose")}>
                Go back
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function OrdersPage() {
  const [orders, setOrders]                 = useState<any[]>([]);
  const [search, setSearch]                 = useState("");
  const [statusFilter, setStatusFilter]     = useState("all");
  const [viewOrder, setViewOrder]           = useState<any>(null);
  const [updatingId, setUpdatingId]         = useState<string | null>(null);
  const [shippingModal, setShippingModal]   = useState<any>(null);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [courier, setCourier]               = useState("jnt");
  const [showHidden, setShowHidden]         = useState(false);
  const [deleteModal, setDeleteModal]       = useState<any>(null);

  useEffect(() => {
    fetchOrders();
    const channel = supabase
      .channel("admin-orders-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, fetchOrders)
      .subscribe();

    // Auto-refresh every 30 seconds as backup
    const interval = setInterval(fetchOrders, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from("orders")
      .select("*, order_timeline(*), order_items(*)")
      .order("created_at", { ascending: false });
    if (error) console.error("Fetch orders error:", error);
    setOrders(data || []);
  };

  // Hide (soft-delete): toggles is_deleted flag
  // FIXED: always sets is_deleted = true when hiding from visible list
  const hideOrder = async (id: string) => {
    const { error } = await supabase
      .from("orders")
      .update({ is_deleted: true })
      .eq("id", id);
    if (error) { toast.error("Failed to hide order"); return; }
    toast.success("Order hidden");
    setOrders(prev => prev.map(o => o.id === id ? { ...o, is_deleted: true } : o));
  };

  // Restore: clears is_deleted flag
  const restoreOrder = async (id: string) => {
    const { error } = await supabase
      .from("orders")
      .update({ is_deleted: false })
      .eq("id", id);
    if (error) { toast.error("Failed to restore order"); return; }
    toast.success("Order restored");
    setOrders(prev => prev.map(o => o.id === id ? { ...o, is_deleted: false } : o));
  };

  // Hard delete: permanently removes the row
  const deletePermanently = async (order: any) => {
    const { error } = await supabase.from("orders").delete().eq("id", order.id);
    if (error) { toast.error("Failed to delete order"); return; }
    toast.success("Order permanently deleted");
    setOrders(prev => prev.filter(o => o.id !== order.id));
    if (viewOrder?.id === order.id) setViewOrder(null);
  };

  const updateStatus = async (id: string, newStatus: string) => {
    if (newStatus === "shipped") {
      const order = orders.find(o => o.id === id);
      setShippingModal(order);
      return;
    }

    setUpdatingId(id);
    const now   = new Date().toISOString();
    const order = orders.find(o => o.id === id);

    const history = [
      ...(order?.status_history ?? []),
      { status: newStatus, timestamp: now, message: TIMELINE_MESSAGES[newStatus] ?? newStatus },
    ];

    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus, status_history: history })
      .eq("id", id);

    if (error) {
      console.error("Update error:", error);
      toast.error(error.message);
    } else {
      toast.success(`Order marked as ${newStatus.replace(/_/g, " ")}`);
      setOrders(prev =>
        prev.map(o => o.id === id ? { ...o, status: newStatus, status_history: history } : o)
      );
      if (viewOrder?.id === id)
        setViewOrder((p: any) => ({ ...p, status: newStatus, status_history: history }));
    }
    setUpdatingId(null);
  };

  const confirmShipping = async () => {
    if (!trackingNumber.trim()) { toast.error("Please enter a tracking number"); return; }
    const now = new Date().toISOString();
    const history = [
      ...(shippingModal?.status_history || []),
      { status: "shipped", timestamp: now, message: "Order has been shipped" },
    ];
    const courierInfo = COURIERS.find(c => c.id === courier);
    const courierUrl  = courierInfo?.url ? `${courierInfo.url}${trackingNumber}` : null;
    const { error } = await supabase.from("orders").update({
      status:          "shipped",
      status_history:  history,
      tracking_number: trackingNumber,
      courier:         courierInfo?.name,
      courier_url:     courierUrl,
    }).eq("id", shippingModal.id);
    if (error) { toast.error("Failed to update shipping"); return; }
    toast.success("Order marked as shipped! 🚚");
    const updated = {
      status: "shipped", status_history: history,
      tracking_number: trackingNumber,
      courier: courierInfo?.name, courier_url: courierUrl,
    };
    setOrders(prev => prev.map(o => o.id === shippingModal.id ? { ...o, ...updated } : o));
    if (viewOrder?.id === shippingModal.id) setViewOrder((p: any) => ({ ...p, ...updated }));
    setShippingModal(null); setTrackingNumber(""); setCourier("jnt");
  };

  const getNextStatus = (current: string) => {
    if (current === "cancelled" || current === "completed") return null;
    const idx = statusFlow.indexOf(current);
    if (idx === -1 || idx === statusFlow.length - 1) return null;
    const next = statusFlow[idx + 1];
    return next === "cancelled" ? null : next;
  };

  const filtered = orders.filter(o => {
    const matchSearch = (o.customer_name || "").toLowerCase().includes(search.toLowerCase());
    if (showHidden) return matchSearch && o.is_deleted;
    return matchSearch && !o.is_deleted && (statusFilter === "all" || o.status === statusFilter);
  });

  const visibleOrders  = orders.filter(o => !o.is_deleted);
  const totalRevenue   = visibleOrders.reduce((s, o) => s + Number(o.total || 0), 0);
  const completed      = visibleOrders.filter(o => o.status === "completed").length;
  const pending        = visibleOrders.filter(o => o.status === "pending").length;
  const shipped        = visibleOrders.filter(o => ["shipped","out_for_delivery"].includes(o.status)).length;
  const hiddenCount    = orders.filter(o => o.is_deleted).length;

  return (
    <div className="min-h-screen p-6 space-y-6 text-white"
      style={{ background: "linear-gradient(135deg,#0f1117,#141824,#0f1117)" }}>

      <div>
        <h1 className="text-2xl font-bold tracking-wide">Orders</h1>
        <p className="text-xs text-slate-400">Manage & track all customer orders · Updates push to customers in real time</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Orders", value: visibleOrders.length,                icon: ShoppingCart, color: "text-blue-400" },
          { label: "Revenue",      value: `₱${totalRevenue.toLocaleString()}`, icon: TrendingUp,   color: "text-emerald-400" },
          { label: "Completed",    value: completed,                            icon: CheckCircle,  color: "text-green-400" },
          { label: "In Transit",   value: shipped,                              icon: Truck,        color: "text-indigo-400" },
        ].map(kpi => (
          <div key={kpi.label} className={`${card} p-5 transition-all hover:scale-[1.03]`}>
            <div className="flex justify-between items-center">
              <kpi.icon className={kpi.color} size={18} />
              <span className="text-xs text-slate-400">{kpi.label}</span>
            </div>
            <h2 className="text-2xl font-bold mt-2">{kpi.value}</h2>
          </div>
        ))}
      </div>

      {/* Pending alert */}
      {pending > 0 && !showHidden && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <Clock size={16} className="text-amber-400 shrink-0" />
          <p className="text-sm text-amber-300">
            <span className="font-bold">{pending} order{pending > 1 ? "s" : ""}</span> waiting for confirmation
          </p>
        </div>
      )}

      {/* Hidden orders banner */}
      {showHidden && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
          <Trash2 size={16} className="text-red-400 shrink-0" />
          <p className="text-sm text-red-300">
            Showing <span className="font-bold">{hiddenCount} hidden order{hiddenCount !== 1 ? "s" : ""}</span> — click <RotateCcw size={11} className="inline mx-0.5" /> to restore
          </p>
        </div>
      )}

      {/* Orders table */}
      <div className={`${card} p-5`}>
        <div className="flex gap-3 mb-4 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <Input
              placeholder="Search by customer name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 bg-white/5 border-white/10"
            />
          </div>

          {/* Status filter */}
          {!showHidden && (
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] bg-white/5 border-white/10">
                <Filter size={14} /><SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {statusFlow.map(s => (
                  <SelectItem key={s} value={s} className="capitalize">{s.replace("_", " ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Toggle hidden orders */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setShowHidden(h => !h); setStatusFilter("all"); }}
            className={`gap-1.5 text-xs transition-all ${
              showHidden
                ? "bg-red-500/20 text-red-300 border-red-500/30 hover:bg-red-500/30"
                : "bg-white/5 text-slate-400 border-white/10 hover:bg-white/10"
            }`}>
            {showHidden ? <><RotateCcw size={12} /> Back to Orders</> : <><Trash2 size={12} /> Hidden {hiddenCount > 0 && `(${hiddenCount})`}</>}
          </Button>
        </div>

        <div className="rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10">
                <TableHead className="text-slate-400">ID</TableHead>
                <TableHead className="text-slate-400">Customer</TableHead>
                <TableHead className="text-slate-400">Total</TableHead>
                <TableHead className="text-slate-400">Status</TableHead>
                <TableHead className="text-slate-400">Tracking</TableHead>
                <TableHead className="text-slate-400">Date</TableHead>
                <TableHead className="text-slate-400">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-16 text-slate-500">
                    <Package size={32} className="mx-auto mb-3 opacity-20" />
                    {showHidden ? "No hidden orders" : "No orders found"}
                  </TableCell>
                </TableRow>
              ) : filtered.map(o => {
                const next = getNextStatus(o.status);
                return (
                  <TableRow
                    key={o.id}
                    className={`border-white/5 hover:bg-white/5 transition-all ${o.is_deleted ? "opacity-50" : ""}`}>
                    <TableCell className="font-mono text-xs text-indigo-400">
                      #{o.id.slice(0, 8).toUpperCase()}
                    </TableCell>
                    <TableCell>
                      <p className="text-sm font-medium">{o.customer_name}</p>
                      <p className="text-xs text-slate-500">{o.customer_email}</p>
                    </TableCell>
                    <TableCell className="font-bold">₱{Number(o.total).toLocaleString()}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[o.status] || "bg-white/10 text-white"}`}>
                        {STATUS_ICONS[o.status]} {o.status.replace("_", " ")}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs">
                      {o.tracking_number ? (
                        <div>
                          <p className="font-mono text-indigo-300">{o.tracking_number}</p>
                          <p className="text-slate-500 text-[10px]">{o.courier}</p>
                        </div>
                      ) : <span className="text-slate-600">—</span>}
                    </TableCell>
                    <TableCell className="text-slate-400 text-xs">
                      {new Date(o.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {/* Advance status — only for visible, non-cancelled, non-completed orders */}
                        {!o.is_deleted && next && (
                          <Button size="sm" variant="ghost" disabled={updatingId === o.id}
                            onClick={() => updateStatus(o.id, next)}
                            className="text-xs h-7 px-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 gap-1">
                            <ChevronRight size={12} />
                            {next === "shipped" ? "Ship" : next.replace("_", " ")}
                          </Button>
                        )}
                        {/* View */}
                        {!o.is_deleted && (
                          <Button size="icon" variant="ghost" className="h-7 w-7 hover:text-blue-400"
                            onClick={() => setViewOrder(o)}>
                            <Eye size={13} />
                          </Button>
                        )}
                        {/* Restore (shown only in hidden view) */}
                        {o.is_deleted && (
                          <Button
                            size="icon" variant="ghost"
                            title="Restore order"
                            className="h-7 w-7 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                            onClick={() => restoreOrder(o.id)}>
                            <RotateCcw size={13} />
                          </Button>
                        )}
                        {/* Delete/Hide button — opens modal */}
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Remove order"
                          className="h-7 w-7 text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          onClick={() => setDeleteModal(o)}>
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Delete confirmation modal */}
      <DeleteConfirmModal
        order={deleteModal}
        onClose={() => setDeleteModal(null)}
        onHide={(o) => hideOrder(o.id)}
        onDeletePermanently={deletePermanently}
      />

      {/* View Order Modal */}
      <Dialog open={!!viewOrder} onOpenChange={() => setViewOrder(null)}>
        <DialogContent className="bg-[#111827] text-white border-white/10 max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogTitle className="flex items-center gap-2">
            <Package size={16} className="text-indigo-400" />
            Order #{viewOrder?.id?.slice(0, 8).toUpperCase()}
          </DialogTitle>
          {viewOrder && (
            <div className="text-sm space-y-5">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Customer", value: viewOrder.customer_name },
                  { label: "Email",    value: viewOrder.customer_email, small: true },
                  { label: "Total",    value: `₱${Number(viewOrder.total).toLocaleString()}`, green: true },
                  { label: "Payment",  value: `${viewOrder.payment_method ?? "—"} · ${viewOrder.payment_status ?? "—"}` },
                  { label: "Date",     value: new Date(viewOrder.created_at).toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" }) },
                  { label: "Status",   value: viewOrder.status?.replace("_", " "), badge: true },
                ].map(f => (
                  <div key={f.label}>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">{f.label}</p>
                    {f.badge ? (
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[viewOrder.status]}`}>
                        {STATUS_ICONS[viewOrder.status]} {f.value}
                      </span>
                    ) : (
                      <p className={`text-sm font-medium ${f.green ? "text-emerald-400" : "text-slate-200"} ${f.small ? "truncate text-xs" : ""}`}>{f.value}</p>
                    )}
                  </div>
                ))}
              </div>

              {/* Tracking */}
              {viewOrder.tracking_number && (
                <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <Truck size={11} /> Tracking Info
                  </p>
                  <p className="font-mono text-indigo-300 font-bold text-base">{viewOrder.tracking_number}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{viewOrder.courier}</p>
                  {viewOrder.courier_url && (
                    <a href={viewOrder.courier_url} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-indigo-400 underline mt-1.5 inline-block hover:text-indigo-300">
                      Track Package →
                    </a>
                  )}
                </div>
              )}

              {/* Timeline */}
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-3">Order Timeline</p>
                {viewOrder.order_timeline && viewOrder.order_timeline.length > 0 ? (
                  <div className="space-y-0">
                    {[...viewOrder.order_timeline]
                      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                      .map((entry: any, i: number) => (
                        <div key={entry.id} className="flex items-start gap-3">
                          <div className="flex flex-col items-center">
                            <div className={`w-3 h-3 rounded-full mt-0.5 shrink-0 ring-2 ${i === 0 ? "bg-indigo-400 ring-indigo-400/30" : "bg-emerald-400 ring-emerald-400/20"}`} />
                            {i < viewOrder.order_timeline.length - 1 && <div className="w-px h-6 bg-emerald-400/20" />}
                          </div>
                          <div className="pb-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${STATUS_COLORS[entry.status] || "bg-white/10 text-white"}`}>
                                {STATUS_ICONS[entry.status]} {entry.status.replace("_", " ")}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">{entry.message}</p>
                            <p className="text-[10px] text-slate-600 mt-0.5">
                              {new Date(entry.created_at).toLocaleString("en-PH", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="space-y-0">
                    {statusFlow.filter(s => s !== "cancelled").map((s, i, arr) => {
                      const history    = viewOrder.status_history || [];
                      const entry      = history.find((h: any) => h.status === s);
                      const currentIdx = statusFlow.indexOf(viewOrder.status);
                      const stepIdx    = statusFlow.indexOf(s);
                      const isDone     = currentIdx >= stepIdx && viewOrder.status !== "cancelled";
                      const isCurrent  = viewOrder.status === s;
                      return (
                        <div key={s} className="flex items-start gap-3">
                          <div className="flex flex-col items-center">
                            <div className={`w-3 h-3 rounded-full mt-0.5 shrink-0 ${isCurrent ? "bg-indigo-400 ring-2 ring-indigo-400/30" : isDone ? "bg-emerald-400" : "bg-white/10"}`} />
                            {i < arr.length - 1 && <div className={`w-px h-6 ${isDone ? "bg-emerald-400/40" : "bg-white/10"}`} />}
                          </div>
                          <div className="pb-1">
                            <p className={`text-xs capitalize font-medium ${isCurrent ? "text-indigo-400" : isDone ? "text-emerald-400" : "text-slate-600"}`}>
                              {s.replace("_", " ")}
                            </p>
                            {entry?.timestamp && (
                              <p className="text-[10px] text-slate-500">{new Date(entry.timestamp).toLocaleString()}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Items */}
              {(viewOrder.order_items?.length > 0 || viewOrder.items?.length > 0) && (
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Items</p>
                  <div className="space-y-1.5">
                    {(viewOrder.order_items || viewOrder.items || []).map((item: any, i: number) => (
                      <div key={item.id ?? i} className="flex items-center gap-3 p-2 rounded-lg bg-white/5">
                        {item.product_image && (
                          <img src={item.product_image} alt={item.product_name ?? item.name}
                            className="w-10 h-12 rounded-lg object-cover border border-white/10 shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-slate-200 font-medium truncate">{item.product_name ?? item.name}</p>
                          <div className="flex gap-1.5 mt-0.5 flex-wrap">
                            {item.selected_size && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-slate-400">{item.selected_size}</span>
                            )}
                            {item.selected_color && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-slate-400 flex items-center gap-1">
                                {item.selected_color_hex && (
                                  <span style={{ background: item.selected_color_hex }}
                                    className="w-2 h-2 rounded-full border border-white/20 inline-block" />
                                )}
                                {item.selected_color}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs text-slate-300 font-bold">₱{Number(item.price).toLocaleString()}</p>
                          <p className="text-[10px] text-slate-500">x{item.quantity}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Shipping address */}
              {viewOrder.shipping_address && (
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <MapPin size={10} /> Shipping Address
                  </p>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    {typeof viewOrder.shipping_address === "object"
                      ? `${viewOrder.shipping_address.name}, ${viewOrder.shipping_address.address}, ${viewOrder.shipping_address.city}, ${viewOrder.shipping_address.province} ${viewOrder.shipping_address.zip}`
                      : viewOrder.shipping_address}
                  </p>
                </div>
              )}

              {/* Action buttons — admin manually controls all status changes */}
              <div className="space-y-2 pt-1">
                {getNextStatus(viewOrder.status) && (
                  <Button className="w-full bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/20"
                    onClick={() => updateStatus(viewOrder.id, getNextStatus(viewOrder.status)!)}>
                    <ChevronRight size={14} className="mr-1" />
                    Mark as {getNextStatus(viewOrder.status)?.replace("_", " ")} →
                  </Button>
                )}
                {!["completed", "cancelled"].includes(viewOrder.status) && (
                  <Button variant="ghost" className="w-full text-red-400 hover:bg-red-500/10 border border-red-500/10"
                    onClick={() => { updateStatus(viewOrder.id, "cancelled"); setViewOrder(null); }}>
                    <AlertCircle size={14} className="mr-1" /> Cancel Order
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Shipping Modal */}
      <Dialog open={!!shippingModal} onOpenChange={() => { setShippingModal(null); setTrackingNumber(""); }}>
        <DialogContent className="bg-[#111827] text-white border-white/10 max-w-sm">
          <DialogTitle className="flex items-center gap-2">
            <Truck size={16} className="text-indigo-400" /> Ship Order
          </DialogTitle>
          <div className="space-y-4 text-sm">
            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <p className="text-xs text-slate-400 mb-0.5">Shipping for</p>
              <p className="font-medium">{shippingModal?.customer_name}</p>
              <p className="text-xs text-slate-400">Order #{shippingModal?.id?.slice(0, 8).toUpperCase()}</p>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1.5">Courier</label>
              <Select value={courier} onValueChange={setCourier}>
                <SelectTrigger className="bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {COURIERS.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1.5">Tracking Number</label>
              <Input value={trackingNumber} onChange={e => setTrackingNumber(e.target.value)}
                placeholder="e.g. 1234567890"
                className="bg-white/5 border-white/10 font-mono"
                onKeyDown={e => e.key === "Enter" && confirmShipping()} />
            </div>
            <p className="text-[11px] text-slate-500">
              💡 The customer will see this tracking info instantly on their orders page.
            </p>
            <div className="flex gap-2">
              <Button className="flex-1 bg-indigo-600 hover:bg-indigo-500 gap-2" onClick={confirmShipping}>
                <Truck size={14} /> Confirm Shipment
              </Button>
              <Button variant="ghost" className="flex-1 border border-white/10"
                onClick={() => { setShippingModal(null); setTrackingNumber(""); }}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
