import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Search, Filter, Eye, Trash2, ShoppingCart,
  TrendingUp, CheckCircle, ChevronRight, Truck,
  MapPin, Clock, RotateCcw, Package, AlertCircle,
  EyeOff, RefreshCw, Printer, Zap,
} from "lucide-react";
import logo from "@/assets/logo.jpg";

// ─── Status flow ───────────────────────────────────────────────────────────────
const statusFlow = [
  "pending", "confirmed", "packed", "shipped",
  "out_for_delivery", "delivered", "arrived", "completed", "cancelled",
];

// ─── Couriers ─────────────────────────────────────────────────────────────────
const COURIERS_DOMESTIC = [
  { id: "jnt",       name: "J&T Express",        url: "https://www.jnt.com.ph/tracking?awb="           },
  { id: "lbc",       name: "LBC",                url: "https://www.lbcexpress.com/track/?tracking_no="  },
  { id: "ninjavan",  name: "Ninja Van",           url: "https://www.ninjavan.co/en-ph/tracking?id="      },
  { id: "grab",      name: "GrabExpress",         url: ""                                                 },
  { id: "lalamove",  name: "Lalamove",            url: ""                                                 },
];

const COURIERS_INTERNATIONAL = [
  { id: "dhl",       name: "DHL",                url: "https://www.dhl.com/ph-en/home/tracking.html?tracking-id=" },
  { id: "fedex",     name: "FedEx",              url: "https://www.fedex.com/fedextrack/?trknbr="       },
  { id: "ups",       name: "UPS",                url: "https://www.ups.com/track?tracknum="             },
  { id: "ems",       name: "EMS (Philippines)",  url: "https://www.phlpost.gov.ph/mail-tracking?q="     },
  { id: "cainiao",   name: "Cainiao / AliExpress", url: "https://global.cainiao.com/detail.htm?mailNoList=" },
  { id: "sfexpress", name: "SF Express",         url: "https://www.sfexpress.com/en/track/?trackingNo=" },
  { id: "yanwen",    name: "Yanwen / 4PX",       url: "https://track.4px.com/#/result/0/"               },
  { id: "spx",       name: "Shopee Xpress Intl", url: "https://spx.ph/track?tn="                        },
  { id: "other",     name: "Other",              url: ""                                                 },
];

const COURIERS = [...COURIERS_DOMESTIC, ...COURIERS_INTERNATIONAL];

// ─── Tracking number generator ────────────────────────────────────────────────
function generateTrackingNumber(courierId: string): string {
  const rand  = (len: number) =>
    Array.from({ length: len }, () => Math.floor(Math.random() * 10)).join("");
  const alpha = (len: number) =>
    Array.from({ length: len }, () =>
      "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)]).join("");
  const alnum = (len: number) =>
    Array.from({ length: len }, () =>
      "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[Math.floor(Math.random() * 36)]).join("");

  switch (courierId) {
    // ── Domestic ────────────────────────────────────────────────────────────
    case "jnt":       return `6${rand(2)}-${rand(4)}-${rand(7)}`;
    case "lbc":       return `1${rand(10)}`;
    case "ninjavan":  return `NVPH-${rand(10)}`;
    case "grab":      return `GRB-${rand(16)}`;
    case "lalamove":  return `LLM-${rand(8)}`;
    // ── International ───────────────────────────────────────────────────────
    case "dhl":       return `JD${rand(18)}`;
    case "fedex":     return rand(12);
    case "ups":       return `1Z${alnum(6)}${rand(2)}${rand(8)}`;
    case "ems":       return `EE${rand(8)}PH`;
    case "cainiao":   return `EA${rand(8)}CN`;
    case "sfexpress": return `SF${rand(10)}`;
    case "yanwen":    return `UE${rand(8)}YP`;
    case "spx":       return `SPX-${rand(12)}`;
    default:          return `TRK-${alpha(4)}${rand(4)}-${rand(6)}`;
  }
}

// ─── Style maps ───────────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  pending:           "bg-amber-500/15 text-amber-400 border border-amber-500/20",
  confirmed:         "bg-blue-500/15 text-blue-400 border border-blue-500/20",
  packed:            "bg-violet-500/15 text-violet-400 border border-violet-500/20",
  shipped:           "bg-indigo-500/15 text-indigo-400 border border-indigo-500/20",
  out_for_delivery:  "bg-sky-500/15 text-sky-400 border border-sky-500/20",
  delivered:         "bg-cyan-500/15 text-cyan-400 border border-cyan-500/20",
  arrived:           "bg-teal-500/15 text-teal-400 border border-teal-500/20",
  completed:         "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20",
  cancelled:         "bg-red-500/15 text-red-400 border border-red-500/20",
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  pending:           <Clock size={11} />,
  confirmed:         <CheckCircle size={11} />,
  packed:            <Package size={11} />,
  shipped:           <Truck size={11} />,
  out_for_delivery:  <Truck size={11} />,
  delivered:         <MapPin size={11} />,
  arrived:           <MapPin size={11} />,
  completed:         <CheckCircle size={11} />,
  cancelled:         <AlertCircle size={11} />,
};

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  paid:    "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20",
  pending: "bg-amber-500/15 text-amber-400 border border-amber-500/20",
  failed:  "bg-red-500/15 text-red-400 border border-red-500/20",
};

const TIMELINE_MESSAGES: Record<string, string> = {
  pending:           "Order placed successfully",
  confirmed:         "Order confirmed by seller",
  packed:            "Your order is being packed",
  shipped:           "Order has been shipped",
  out_for_delivery:  "Out for delivery",
  delivered:         "Package has been delivered",
  arrived:           "Package has arrived",
  completed:         "Order completed. Thank you!",
  cancelled:         "Order was cancelled",
};

const card = "bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl";

// ─── Timeline insert helper ───────────────────────────────────────────────────
async function insertTimeline(orderId: string, status: string, message?: string) {
  const { error } = await supabase.from("order_timeline").insert({
    order_id: orderId,
    status,
    message: message ?? TIMELINE_MESSAGES[status] ?? status,
  });
  if (error) console.warn("order_timeline insert:", error.message);
}

// ─── Format currency ──────────────────────────────────────────────────────────
const fmt = (n: number) =>
  n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ─── OrderReceipt ─────────────────────────────────────────────────────────────
const OrderReceipt = ({ order }: { order: any }) => {
  const items: any[]  = order.order_items || order.items || [];
  const totalQty      = items.reduce((s: number, i: any) => s + (i.quantity ?? 1), 0);
  const subtotal      = Number(order.subtotal || order.total || 0);
  const discount      = Number(order.discount || 0);
  const shippingFee   = Number(order.shipping_fee || 0);
  const grandTotal    = Number(order.total || 0);
  const orderDate     = new Date(order.created_at).toLocaleDateString("en-PH", {
    year: "numeric", month: "long", day: "numeric",
  });

  const pmLabels: Record<string, string> = {
    cod:          "Cash on Delivery",
    gcash:        "GCash / GrabPay",
    card:         "Credit / Debit Card",
    gcash_manual: "GCash (Manual Transfer)",
  };

  return (
    <div id="order-receipt-print" style={{ fontFamily: "'Outfit', system-ui, sans-serif", background: "#fff", maxWidth: "480px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#060b18 0%,#0f1f3d 100%)", padding: "24px 20px 20px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
        <img src={logo} alt="RaidKhalid & Co." style={{ width: "64px", height: "64px", objectFit: "contain", borderRadius: "12px", border: "2px solid rgba(255,255,255,0.15)" }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
        <div>
          <p style={{ fontSize: "1.3rem", fontWeight: 900, letterSpacing: ".06em", color: "#fff", marginBottom: "4px", textTransform: "uppercase" }}>RaidKhalid &amp; Co.</p>
          <p style={{ fontSize: "11px", color: "rgba(255,255,255,.45)", marginBottom: "2px" }}>Admin Order Receipt</p>
          <p style={{ fontSize: "10px", color: "rgba(255,255,255,.3)" }}>{orderDate}</p>
        </div>
      </div>

      {/* Meta grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderBottom: "1px solid rgba(10,13,20,.08)" }}>
        {[
          { label: "Order #",  value: `#${order.id?.slice(0, 8).toUpperCase()}` },
          { label: "Date",     value: orderDate },
          { label: "Customer", value: order.customer_name },
          { label: "Payment",  value: pmLabels[order.payment_method] ?? (order.payment_method || "—") },
        ].map((m, i) => (
          <div key={i} style={{ padding: "10px 16px", borderBottom: i < 2 ? "1px solid rgba(10,13,20,.06)" : "none", borderRight: i % 2 === 0 ? "1px solid rgba(10,13,20,.06)" : "none" }}>
            <p style={{ fontSize: "9px", fontWeight: 800, letterSpacing: ".16em", textTransform: "uppercase", color: "rgba(10,13,20,.35)", marginBottom: "2px" }}>{m.label}</p>
            <p style={{ fontSize: "12px", fontWeight: 700, color: "#0a0d14" }}>{m.value}</p>
          </div>
        ))}
      </div>

      {/* Ship to */}
      <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(10,13,20,.06)", background: "rgba(10,13,20,.02)" }}>
        <p style={{ fontSize: "9px", fontWeight: 800, letterSpacing: ".16em", textTransform: "uppercase", color: "rgba(10,13,20,.35)", marginBottom: "6px" }}>Ship To</p>
        <p style={{ fontSize: "12px", fontWeight: 700, color: "#0a0d14", marginBottom: "2px" }}>{order.shipping_name || order.customer_name}</p>
        {order.shipping_phone && <p style={{ fontSize: "11px", color: "rgba(10,13,20,.5)", marginBottom: "1px" }}>{order.shipping_phone}</p>}
        {order.shipping_address && (
          <p style={{ fontSize: "11px", color: "rgba(10,13,20,.5)", lineHeight: 1.5 }}>
            {typeof order.shipping_address === "object"
              ? `${order.shipping_address.address}, ${order.shipping_address.city}`
              : order.shipping_address}
          </p>
        )}
      </div>

      {/* Items */}
      <div style={{ padding: "14px 16px 0" }}>
        <p style={{ fontSize: "9px", fontWeight: 800, letterSpacing: ".16em", textTransform: "uppercase", color: "rgba(10,13,20,.35)", marginBottom: "8px" }}>Items Ordered</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 60px 40px 64px", padding: "5px 8px", background: "rgba(10,13,20,.04)", borderRadius: "5px", marginBottom: "4px" }}>
          {["Item", "Variant", "Qty", "Amount"].map(h => (
            <span key={h} style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "rgba(10,13,20,.4)", textAlign: h !== "Item" ? "center" : "left" }}>{h}</span>
          ))}
        </div>
        {items.length === 0
          ? <p style={{ fontSize: "12px", color: "rgba(10,13,20,.4)", padding: "8px 0" }}>No item details available</p>
          : items.map((item: any, i: number) => {
            const name  = item.product_name ?? item.name ?? "Item";
            const qty   = item.quantity ?? 1;
            const price = Number(item.unit_price ?? item.price ?? 0);
            return (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 60px 40px 64px", padding: "7px 8px", alignItems: "center", borderBottom: i < items.length - 1 ? "1px solid rgba(10,13,20,.05)" : "none" }}>
                <div>
                  <p style={{ fontSize: "11px", fontWeight: 600, color: "#0a0d14", lineHeight: 1.3 }}>{name}</p>
                  <p style={{ fontSize: "10px", color: "rgba(10,13,20,.4)", marginTop: "1px" }}>@ ₱{fmt(price)}</p>
                </div>
                <div style={{ textAlign: "center" }}>
                  {item.selected_size  && <span style={{ display: "inline-block", fontSize: "9px", fontWeight: 700, padding: "2px 5px", borderRadius: "3px", background: "rgba(26,86,219,.08)", color: "#1a56db", textTransform: "uppercase" }}>{item.selected_size}</span>}
                  {item.selected_color && <p style={{ fontSize: "9px", color: "rgba(10,13,20,.45)", marginTop: "2px" }}>{item.selected_color}</p>}
                  {!item.selected_size && !item.selected_color && <span style={{ fontSize: "10px", color: "rgba(10,13,20,.3)" }}>—</span>}
                </div>
                <div style={{ textAlign: "center", fontSize: "12px", fontWeight: 700, color: "#0a0d14" }}>×{qty}</div>
                <div style={{ textAlign: "right", fontSize: "12px", fontWeight: 800, color: "#0a0d14" }}>₱{fmt(price * qty)}</div>
              </div>
            );
          })}
      </div>

      {/* Totals */}
      <div style={{ margin: "12px 16px 0", background: "rgba(10,13,20,.02)", borderRadius: "8px", border: "1px solid rgba(10,13,20,.07)", overflow: "hidden" }}>
        {[
          { label: `Subtotal (${totalQty} pc${totalQty !== 1 ? "s" : ""})`, value: `₱${fmt(subtotal)}`, green: false },
          ...(discount > 0 ? [{ label: "Discount", value: `-₱${fmt(discount)}`, green: true }] : []),
          { label: "Shipping Fee", value: shippingFee === 0 ? "FREE" : `₱${fmt(shippingFee)}`, green: shippingFee === 0 },
        ].map((row, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "7px 12px", borderBottom: "1px solid rgba(10,13,20,.05)" }}>
            <span style={{ fontSize: "11px", color: "rgba(10,13,20,.5)" }}>{row.label}</span>
            <span style={{ fontSize: "11px", fontWeight: 700, color: row.green ? "#16a34a" : "#0a0d14" }}>{row.value}</span>
          </div>
        ))}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 12px", background: "#0a0d14" }}>
          <span style={{ fontWeight: 900, fontSize: "0.95rem", letterSpacing: ".04em", color: "rgba(255,255,255,.65)", textTransform: "uppercase" }}>TOTAL</span>
          <span style={{ fontWeight: 900, fontSize: "1.2rem", color: "#fff" }}>₱{fmt(grandTotal)}</span>
        </div>
      </div>

      {/* Tracking on receipt */}
      {order.tracking_number && (
        <div style={{ margin: "12px 16px 0", padding: "10px 12px", background: "rgba(26,86,219,.06)", borderRadius: "8px", border: "1px solid rgba(26,86,219,.15)" }}>
          <p style={{ fontSize: "9px", fontWeight: 800, letterSpacing: ".14em", textTransform: "uppercase", color: "rgba(10,13,20,.35)", marginBottom: "4px" }}>Tracking</p>
          <p style={{ fontFamily: "monospace", fontSize: "13px", fontWeight: 700, color: "#1a56db" }}>{order.tracking_number}</p>
          {order.courier && <p style={{ fontSize: "10px", color: "rgba(10,13,20,.45)", marginTop: "2px" }}>{order.courier}</p>}
        </div>
      )}

      {/* Footer */}
      <div style={{ padding: "14px 16px 20px", textAlign: "center", borderTop: "1px solid rgba(10,13,20,.06)", marginTop: "14px" }}>
        <p style={{ fontSize: "11px", color: "rgba(10,13,20,.5)", fontWeight: 700, marginBottom: "4px" }}>
          Payment Status:{" "}
          <span style={{ color: order.payment_status === "paid" ? "#16a34a" : "#f59e0b", textTransform: "uppercase" }}>
            {order.payment_status || "pending"}
          </span>
        </p>
        <p style={{ fontSize: "10px", color: "rgba(10,13,20,.35)", lineHeight: 1.6 }}>
          Thank you for your purchase!<br />
          <strong>This is an official order receipt from RaidKhalid &amp; Co.</strong>
        </p>
      </div>
    </div>
  );
};

// ─── ReceiptModal ─────────────────────────────────────────────────────────────
const ReceiptModal = ({ order, onClose }: { order: any | null; onClose: () => void }) => {
  const handlePrint = () => {
    const content = document.getElementById("order-receipt-print");
    if (!content) return;
    const win = window.open("", "_blank", "width=600,height=800");
    if (!win) return;
    win.document.write(
      `<html><head><title>Receipt - Order #${order?.id?.slice(0, 8).toUpperCase()}</title>` +
      `<style>@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');` +
      `body{margin:0;padding:20px;background:#fff;font-family:'Outfit',sans-serif;}*{box-sizing:border-box;}</style></head>` +
      `<body>${content.outerHTML}</body></html>`
    );
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 500);
  };

  if (!order) return null;
  return (
    <Dialog open={!!order} onOpenChange={onClose}>
      <DialogContent className="bg-[#111827] text-white border-white/10 max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Printer size={16} className="text-indigo-400" />
            Order Receipt #{order?.id?.slice(0, 8).toUpperCase()}
          </span>
          <Button onClick={handlePrint} className="gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-4 py-2 h-8">
            <Printer size={13} /> Print Receipt
          </Button>
        </DialogTitle>
        <div className="rounded-xl overflow-hidden border border-white/10 mt-2">
          <OrderReceipt order={order} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ─── DeleteConfirmModal ───────────────────────────────────────────────────────
function DeleteConfirmModal({
  order, onClose, onHide, onDeletePermanently,
}: {
  order: any | null;
  onClose: () => void;
  onHide: (order: any) => void;
  onDeletePermanently: (order: any) => void;
}) {
  const [step, setStep]         = useState<"choose" | "confirm">("choose");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { if (order) { setStep("choose"); setDeleting(false); } }, [order]);

  if (!order) return null;
  const handleClose = () => { setStep("choose"); setDeleting(false); onClose(); };

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

            <div className="p-3 rounded-xl bg-white/5 border border-white/[0.08] text-sm">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Order #{order.id?.slice(0, 8).toUpperCase()}</p>
              <p className="font-medium">{order.customer_name}</p>
              <p className="text-xs text-emerald-400">₱{Number(order.total).toLocaleString()} · {order.status}</p>
            </div>

            <div className="flex flex-col gap-2.5">
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
              <button
                onClick={() => setStep("confirm")}
                className="flex items-center gap-3 p-3.5 rounded-xl bg-red-500/[0.08] border border-red-500/20 hover:bg-red-500/[0.12] transition-all text-left w-full">
                <div className="w-8 h-8 rounded-lg bg-red-500/15 flex items-center justify-center shrink-0">
                  <Trash2 size={14} className="text-red-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-red-400">Delete permanently</p>
                  <p className="text-[11px] text-slate-500">Cannot be undone · removes all order data</p>
                </div>
              </button>
            </div>

            <Button variant="ghost" className="w-full border border-white/[0.08] text-slate-400 text-sm" onClick={handleClose}>
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

            <div className="p-3.5 rounded-xl bg-red-500/[0.08] border border-red-500/20 text-sm space-y-1">
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
                disabled={deleting}
                onClick={async () => {
                  setDeleting(true);
                  await onDeletePermanently(order);
                  setDeleting(false);
                  handleClose();
                }}>
                {deleting
                  ? <><RefreshCw size={13} className="animate-spin" /> Deleting...</>
                  : <><Trash2 size={13} /> Yes, delete permanently</>}
              </Button>
              <Button variant="ghost" className="flex-1 border border-white/10 text-sm" onClick={() => setStep("choose")}>
                Go back
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Main OrdersPage ──────────────────────────────────────────────────────────
export default function OrdersPage() {
  const [orders, setOrders]                 = useState<any[]>([]);
  const [search, setSearch]                 = useState("");
  const [statusFilter, setStatusFilter]     = useState("all");
  const [viewOrder, setViewOrder]           = useState<any>(null);
  const [receiptOrder, setReceiptOrder]     = useState<any>(null);
  const [updatingId, setUpdatingId]         = useState<string | null>(null);
  const [shippingModal, setShippingModal]   = useState<any>(null);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [courier, setCourier]               = useState("jnt");
  const [showHidden, setShowHidden]         = useState(false);
  const [deleteModal, setDeleteModal]       = useState<any>(null);
  const [refreshing, setRefreshing]         = useState(false);

  // ── Patch helper ─────────────────────────────────────────────────────────────
  const patchOrders = useCallback((id: string, patch: Record<string, any>) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, ...patch } : o));
    setViewOrder((prev: any)    => prev?.id === id ? { ...prev, ...patch } : prev);
    setReceiptOrder((prev: any) => prev?.id === id ? { ...prev, ...patch } : prev);
  }, []);

  // ── Fetch ─────────────────────────────────────────────────────────────────────
  const fetchOrders = useCallback(async (quiet = false) => {
    if (!quiet) setRefreshing(true);
    const { data, error } = await supabase
      .from("orders")
      .select("*, order_timeline(*), order_items(*)")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch orders error:", error);
      if (!quiet) toast.error("Failed to load orders");
    } else {
      setOrders(data || []);
      if (data) {
        setViewOrder((prev: any)    => prev ? (data.find(o => o.id === prev.id) ?? prev) : null);
        setReceiptOrder((prev: any) => prev ? (data.find(o => o.id === prev.id) ?? prev) : null);
      }
    }
    if (!quiet) setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchOrders();
    const channel = supabase
      .channel("admin-orders-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" },         () => fetchOrders(true))
      .on("postgres_changes", { event: "*", schema: "public", table: "order_timeline" }, () => fetchOrders(true))
      .on("postgres_changes", { event: "*", schema: "public", table: "order_items" },    () => fetchOrders(true))
      .on("postgres_changes", { event: "*", schema: "public", table: "gcash_payments" }, () => fetchOrders(true))
      .subscribe();

    const interval = setInterval(() => fetchOrders(true), 30_000);
    return () => { supabase.removeChannel(channel); clearInterval(interval); };
  }, [fetchOrders]);

  // ── Hide ──────────────────────────────────────────────────────────────────────
  const hideOrder = async (id: string) => {
    const { error } = await supabase.from("orders").update({ is_deleted: true }).eq("id", id);
    if (error) { toast.error("Failed to hide order"); return; }
    toast.success("Order hidden");
    patchOrders(id, { is_deleted: true });
  };

  // ── Restore ───────────────────────────────────────────────────────────────────
  const restoreOrder = async (id: string) => {
    const { error } = await supabase.from("orders").update({ is_deleted: false }).eq("id", id);
    if (error) { toast.error("Failed to restore order"); return; }
    toast.success("Order restored");
    patchOrders(id, { is_deleted: false });
  };

  // ── Hard delete ───────────────────────────────────────────────────────────────
  const deletePermanently = async (order: any) => {
    try {
      await Promise.all([
        supabase.from("order_timeline").delete().eq("order_id", order.id),
        supabase.from("order_items").delete().eq("order_id", order.id),
        supabase.from("gcash_payments").delete().eq("order_id", order.id),
      ]);
      const { error } = await supabase.from("orders").delete().eq("id", order.id);
      if (error) { toast.error("Failed to delete order: " + error.message); return; }
      toast.success("Order permanently deleted");
      setOrders(prev => prev.filter(o => o.id !== order.id));
      if (viewOrder?.id   === order.id) setViewOrder(null);
      if (receiptOrder?.id === order.id) setReceiptOrder(null);
    } catch (err: any) {
      console.error("Delete order error:", err);
      toast.error("Failed to delete: " + (err.message || "Unknown error"));
    }
  };

  // ── Update delivery status ────────────────────────────────────────────────────
  const updateStatus = async (id: string, newStatus: string) => {
    if (newStatus === "shipped") {
      setShippingModal(orders.find(o => o.id === id) ?? null);
      return;
    }
    setUpdatingId(id);
    const extraFields: Record<string, any> = { status: newStatus };
    if (newStatus === "completed") extraFields.payment_status = "paid";

    const { error } = await supabase.from("orders").update(extraFields).eq("id", id);
    if (error) {
      toast.error("Failed to update status: " + error.message);
      setUpdatingId(null);
      return;
    }
    await insertTimeline(id, newStatus);
    toast.success(`Order marked as ${newStatus.replace(/_/g, " ")}`);
    await fetchOrders(true);
    setUpdatingId(null);
  };

  // ── Mark payment complete ─────────────────────────────────────────────────────
  const markPaymentComplete = async (id: string) => {
    if (updatingId === id) return;
    setUpdatingId(id);
    const { error } = await supabase.from("orders").update({ payment_status: "paid" }).eq("id", id);
    if (error) {
      toast.error("Failed to update payment: " + error.message);
      setUpdatingId(null);
      return;
    }
    const currentStatus = orders.find(o => o.id === id)?.status ?? "pending";
    await insertTimeline(id, currentStatus, "Payment has been verified and completed");
    toast.success("Payment marked as complete ✓");
    await fetchOrders(true);
    setUpdatingId(null);
  };

  // ── Confirm shipping ──────────────────────────────────────────────────────────
  const confirmShipping = async () => {
    if (!trackingNumber.trim()) { toast.error("Please enter a tracking number"); return; }
    if (!shippingModal) return;

    const courierInfo = COURIERS.find(c => c.id === courier);
    const courierUrl  = courierInfo?.url ? `${courierInfo.url}${trackingNumber.trim()}` : null;

    const { error } = await supabase.from("orders").update({
      status:          "shipped",
      tracking_number: trackingNumber.trim(),
      courier:         courierInfo?.name ?? courier,
      courier_url:     courierUrl,
    }).eq("id", shippingModal.id);

    if (error) { toast.error("Failed to update shipping: " + error.message); return; }

    await insertTimeline(shippingModal.id, "shipped", "Order has been shipped");
    toast.success("Order marked as shipped! 🚚");
    await fetchOrders(true);

    setShippingModal(null);
    setTrackingNumber("");
    setCourier("jnt");
  };

  // ── Close shipping modal helper ───────────────────────────────────────────────
  const closeShippingModal = () => {
    setShippingModal(null);
    setTrackingNumber("");
    setCourier("jnt");
  };

  // ── Next status in flow ───────────────────────────────────────────────────────
  const getNextStatus = (current: string): string | null => {
    if (!current || current === "cancelled" || current === "completed") return null;
    const idx  = statusFlow.indexOf(current);
    if (idx === -1 || idx >= statusFlow.length - 2) return null;
    const next = statusFlow[idx + 1];
    return next === "cancelled" ? null : next;
  };

  // ── Filtered list ─────────────────────────────────────────────────────────────
  const filtered = orders.filter(o => {
    const q = search.toLowerCase();
    const matchSearch =
      (o.customer_name  || "").toLowerCase().includes(q) ||
      (o.customer_email || "").toLowerCase().includes(q) ||
      (o.id             || "").toLowerCase().includes(q);

    if (showHidden) return matchSearch && o.is_deleted;
    return matchSearch && !o.is_deleted && (statusFilter === "all" || o.status === statusFilter);
  });

  const visibleOrders = orders.filter(o => !o.is_deleted);
  const totalRevenue  = visibleOrders.reduce((s, o) => s + Number(o.total || 0), 0);
  const completed     = visibleOrders.filter(o => o.status === "completed").length;
  const pending       = visibleOrders.filter(o => o.status === "pending").length;
  const shipped       = visibleOrders.filter(o => ["shipped", "out_for_delivery"].includes(o.status)).length;
  const hiddenCount   = orders.filter(o => o.is_deleted).length;

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen p-6 space-y-6 text-white"
      style={{ background: "linear-gradient(135deg,#0f1117,#141824,#0f1117)" }}>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-wide">Orders</h1>
          <p className="text-xs text-slate-400">Manage &amp; track all customer orders · Updates push in real time</p>
        </div>
        <button
          onClick={() => fetchOrders()}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-slate-300 hover:text-white transition-all"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Orders", value: visibleOrders.length,                icon: ShoppingCart, color: "text-blue-400"    },
          { label: "Revenue",      value: `₱${totalRevenue.toLocaleString()}`, icon: TrendingUp,   color: "text-emerald-400" },
          { label: "Completed",    value: completed,                            icon: CheckCircle,  color: "text-green-400"   },
          { label: "In Transit",   value: shipped,                              icon: Truck,        color: "text-indigo-400"  },
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

      {/* Hidden banner */}
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
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <Input
              placeholder="Search by name, email, or order ID…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 bg-white/5 border-white/10"
            />
          </div>

          {!showHidden && (
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] bg-white/5 border-white/10">
                <Filter size={14} /><SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {statusFlow.map(s => (
                  <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g, " ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Button variant="outline" size="sm"
            onClick={() => { setShowHidden(h => !h); setStatusFilter("all"); }}
            className={`gap-1.5 text-xs transition-all ${showHidden
              ? "bg-red-500/20 text-red-300 border-red-500/30 hover:bg-red-500/30"
              : "bg-white/5 text-slate-400 border-white/10 hover:bg-white/10"}`}>
            {showHidden
              ? <><RotateCcw size={12} /> Back to Orders</>
              : <><Trash2 size={12} /> Hidden {hiddenCount > 0 && `(${hiddenCount})`}</>}
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
                <TableHead className="text-slate-400">Payment</TableHead>
                <TableHead className="text-slate-400">Tracking</TableHead>
                <TableHead className="text-slate-400">Date</TableHead>
                <TableHead className="text-slate-400">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-16 text-slate-500">
                    <Package size={32} className="mx-auto mb-3 opacity-20" />
                    {showHidden ? "No hidden orders" : "No orders found"}
                  </TableCell>
                </TableRow>
              ) : filtered.map(o => {
                const next       = getNextStatus(o.status);
                const isUpdating = updatingId === o.id;
                return (
                  <TableRow key={o.id}
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
                        {STATUS_ICONS[o.status]} {o.status.replace(/_/g, " ")}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${PAYMENT_STATUS_COLORS[o.payment_status] || "bg-white/10 text-slate-400"}`}>
                        {o.payment_status || "pending"}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs">
                      {o.tracking_number
                        ? <div>
                            <p className="font-mono text-indigo-300">{o.tracking_number}</p>
                            <p className="text-slate-500 text-[10px]">{o.courier}</p>
                          </div>
                        : <span className="text-slate-600">—</span>}
                    </TableCell>
                    <TableCell className="text-slate-400 text-xs">
                      {new Date(o.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 flex-wrap">
                        {!o.is_deleted && next && (
                          <Button size="sm" variant="ghost" disabled={isUpdating}
                            onClick={() => updateStatus(o.id, next)}
                            className="text-xs h-7 px-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 gap-1">
                            {isUpdating ? <RefreshCw size={11} className="animate-spin" /> : <ChevronRight size={12} />}
                            {next === "shipped" ? "Ship" : next.replace(/_/g, " ")}
                          </Button>
                        )}
                        {!o.is_deleted && o.payment_status !== "paid" && o.status !== "cancelled" && (
                          <Button size="sm" variant="ghost" disabled={isUpdating}
                            onClick={() => markPaymentComplete(o.id)}
                            className="text-xs h-7 px-2 text-teal-400 hover:text-teal-300 hover:bg-teal-500/10 gap-1">
                            <CheckCircle size={12} /> Pay ✓
                          </Button>
                        )}
                        {!o.is_deleted && (
                          <Button size="icon" variant="ghost" className="h-7 w-7 hover:text-blue-400" onClick={() => setViewOrder(o)}>
                            <Eye size={13} />
                          </Button>
                        )}
                        {!o.is_deleted && (
                          <Button size="icon" variant="ghost" className="h-7 w-7 hover:text-indigo-400" title="Print Receipt" onClick={() => setReceiptOrder(o)}>
                            <Printer size={13} />
                          </Button>
                        )}
                        {o.is_deleted && (
                          <Button size="icon" variant="ghost" title="Restore order"
                            className="h-7 w-7 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                            onClick={() => restoreOrder(o.id)}>
                            <RotateCcw size={13} />
                          </Button>
                        )}
                        <Button size="icon" variant="ghost" title="Remove order"
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

      {/* ── Modals ── */}
      <ReceiptModal order={receiptOrder} onClose={() => setReceiptOrder(null)} />

      <DeleteConfirmModal
        order={deleteModal}
        onClose={() => setDeleteModal(null)}
        onHide={(o) => hideOrder(o.id)}
        onDeletePermanently={deletePermanently}
      />

      {/* View Order Modal */}
      <Dialog open={!!viewOrder} onOpenChange={() => setViewOrder(null)}>
        <DialogContent className="bg-[#111827] text-white border-white/10 max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Package size={16} className="text-indigo-400" />
              Order #{viewOrder?.id?.slice(0, 8).toUpperCase()}
            </span>
            <Button size="sm" variant="ghost" className="gap-1.5 text-xs text-indigo-400 hover:text-indigo-300"
              onClick={() => setReceiptOrder(viewOrder)}>
              <Printer size={13} /> Receipt
            </Button>
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
                  { label: "Status",   value: viewOrder.status?.replace(/_/g, " "), badge: true },
                ].map(f => (
                  <div key={f.label}>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">{f.label}</p>
                    {f.badge ? (
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[viewOrder.status] || "bg-white/10 text-white"}`}>
                        {STATUS_ICONS[viewOrder.status]} {f.value}
                      </span>
                    ) : (
                      <p className={`text-sm font-medium ${f.green ? "text-emerald-400" : "text-slate-200"} ${f.small ? "truncate text-xs" : ""}`}>{f.value}</p>
                    )}
                  </div>
                ))}
              </div>

              {/* Payment status row */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Payment Status</p>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${PAYMENT_STATUS_COLORS[viewOrder.payment_status] || "bg-white/10 text-slate-400"}`}>
                    {viewOrder.payment_status || "pending"}
                  </span>
                </div>
                {viewOrder.payment_status !== "paid" && viewOrder.status !== "cancelled" && (
                  <Button size="sm" disabled={updatingId === viewOrder.id}
                    className="ml-auto bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/20 text-xs gap-1.5"
                    onClick={() => markPaymentComplete(viewOrder.id)}>
                    {updatingId === viewOrder.id ? <RefreshCw size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                    Mark Payment Complete
                  </Button>
                )}
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
                {viewOrder.order_timeline?.length > 0 ? (
                  <div className="space-y-0">
                    {[...viewOrder.order_timeline]
                      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                      .map((entry: any, i: number, arr: any[]) => (
                        <div key={entry.id ?? i} className="flex items-start gap-3">
                          <div className="flex flex-col items-center">
                            <div className={`w-3 h-3 rounded-full mt-0.5 shrink-0 ring-2 ${i === 0 ? "bg-indigo-400 ring-indigo-400/30" : "bg-emerald-400 ring-emerald-400/20"}`} />
                            {i < arr.length - 1 && <div className="w-px h-6 bg-emerald-400/20" />}
                          </div>
                          <div className="pb-1">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${STATUS_COLORS[entry.status] || "bg-white/10 text-white"}`}>
                              {STATUS_ICONS[entry.status]} {entry.status.replace(/_/g, " ")}
                            </span>
                            {entry.message && <p className="text-xs text-slate-400 mt-0.5">{entry.message}</p>}
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
                      const currentIdx = statusFlow.indexOf(viewOrder.status);
                      const stepIdx    = statusFlow.indexOf(s);
                      const isDone     = viewOrder.status !== "cancelled" && currentIdx >= stepIdx;
                      const isCurrent  = viewOrder.status === s;
                      return (
                        <div key={s} className="flex items-start gap-3">
                          <div className="flex flex-col items-center">
                            <div className={`w-3 h-3 rounded-full mt-0.5 shrink-0 ${isCurrent ? "bg-indigo-400 ring-2 ring-indigo-400/30" : isDone ? "bg-emerald-400" : "bg-white/10"}`} />
                            {i < arr.length - 1 && <div className={`w-px h-6 ${isDone ? "bg-emerald-400/40" : "bg-white/10"}`} />}
                          </div>
                          <div className="pb-1">
                            <p className={`text-xs capitalize font-medium ${isCurrent ? "text-indigo-400" : isDone ? "text-emerald-400" : "text-slate-600"}`}>
                              {s.replace(/_/g, " ")}
                            </p>
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
                            {item.selected_size  && <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-slate-400">{item.selected_size}</span>}
                            {item.selected_color && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-slate-400 flex items-center gap-1">
                                {item.selected_color_hex && <span style={{ background: item.selected_color_hex }} className="w-2 h-2 rounded-full border border-white/20 inline-block" />}
                                {item.selected_color}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs text-slate-300 font-bold">₱{Number(item.unit_price ?? item.price ?? 0).toLocaleString()}</p>
                          <p className="text-[10px] text-slate-500">×{item.quantity}</p>
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
                      ? [
                          viewOrder.shipping_address.name,
                          viewOrder.shipping_address.address,
                          viewOrder.shipping_address.city,
                          viewOrder.shipping_address.province,
                          viewOrder.shipping_address.zip,
                        ].filter(Boolean).join(", ")
                      : viewOrder.shipping_address}
                  </p>
                </div>
              )}

              {/* Action buttons */}
              <div className="space-y-2 pt-1">
                {getNextStatus(viewOrder.status) && (
                  <Button className="w-full bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/20"
                    disabled={updatingId === viewOrder.id}
                    onClick={() => updateStatus(viewOrder.id, getNextStatus(viewOrder.status)!)}>
                    {updatingId === viewOrder.id
                      ? <RefreshCw size={14} className="mr-1 animate-spin" />
                      : <ChevronRight size={14} className="mr-1" />}
                    Mark as {getNextStatus(viewOrder.status)?.replace(/_/g, " ")} →
                  </Button>
                )}
                {!["completed", "cancelled"].includes(viewOrder.status) && (
                  <Button variant="ghost" disabled={updatingId === viewOrder.id}
                    className="w-full text-red-400 hover:bg-red-500/10 border border-red-500/10"
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
      <Dialog open={!!shippingModal} onOpenChange={closeShippingModal}>
        <DialogContent className="bg-[#111827] text-white border-white/10 max-w-sm">
          <DialogTitle className="flex items-center gap-2">
            <Truck size={16} className="text-indigo-400" /> Ship Order
          </DialogTitle>

          <div className="space-y-4 text-sm">
            {/* Order summary */}
            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <p className="text-xs text-slate-400 mb-0.5">Shipping for</p>
              <p className="font-medium">{shippingModal?.customer_name}</p>
              <p className="text-xs text-slate-400">Order #{shippingModal?.id?.slice(0, 8).toUpperCase()}</p>
            </div>

            {/* Courier selector */}
            <div>
              <label className="text-xs text-slate-400 block mb-1.5">Courier</label>
              <Select value={courier} onValueChange={val => { setCourier(val); setTrackingNumber(""); }}>
                <SelectTrigger className="bg-white/5 border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {/* Domestic group */}
                  <div className="px-2 py-1.5 text-[10px] text-slate-500 uppercase tracking-wider">
                    Domestic
                  </div>
                  {COURIERS_DOMESTIC.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                  {/* International group */}
                  <div className="px-2 py-1.5 text-[10px] text-slate-500 uppercase tracking-wider border-t border-white/10 mt-1">
                    International
                  </div>
                  {COURIERS_INTERNATIONAL.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tracking number */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs text-slate-400">Tracking Number</label>
                <button
                  type="button"
                  onClick={() => setTrackingNumber(generateTrackingNumber(courier))}
                  className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                  <Zap size={11} /> Auto-generate
                </button>
              </div>
              <Input
                value={trackingNumber}
                onChange={e => setTrackingNumber(e.target.value)}
                placeholder={
                  courier === "jnt"       ? "e.g. 600-1234-5678901" :
                  courier === "lbc"       ? "e.g. 10000000000"       :
                  courier === "ninjavan"  ? "e.g. NVPH-0000000000"   :
                  courier === "dhl"       ? "e.g. JD000000000000000000" :
                  courier === "fedex"     ? "e.g. 000000000000"      :
                  courier === "ups"       ? "e.g. 1ZXXXXXX0000000000":
                  courier === "ems"       ? "e.g. EE00000000PH"      :
                  courier === "cainiao"   ? "e.g. EA00000000CN"      :
                  courier === "sfexpress" ? "e.g. SF0000000000"      :
                  courier === "yanwen"    ? "e.g. UE00000000YP"      :
                  courier === "spx"       ? "e.g. SPX-000000000000"  :
                  "Enter tracking number"
                }
                className="bg-white/5 border-white/10 font-mono"
                onKeyDown={e => e.key === "Enter" && confirmShipping()}
              />
              {/* Format hint */}
              <p className="text-[10px] text-slate-600 mt-1">
                {courier === "jnt"       && "J&T format: 6XX-XXXX-XXXXXXX"}
                {courier === "lbc"       && "LBC format: 11 digits starting with 1"}
                {courier === "ninjavan"  && "Ninja Van format: NVPH-XXXXXXXXXX"}
                {courier === "grab"      && "GrabExpress internal reference"}
                {courier === "lalamove"  && "Lalamove order reference"}
                {courier === "dhl"       && "DHL eCommerce format: JD + 18 digits"}
                {courier === "fedex"     && "FedEx format: 12 digit number"}
                {courier === "ups"       && "UPS format: 1Z + 6 letters/digits + 10 digits"}
                {courier === "ems"       && "EMS Philippines: EE + 8 digits + PH"}
                {courier === "cainiao"   && "Cainiao/AliExpress: EA + 8 digits + CN"}
                {courier === "sfexpress" && "SF Express: SF + 10 digits"}
                {courier === "yanwen"    && "Yanwen/4PX: UE + 8 digits + YP"}
                {courier === "spx"       && "Shopee Xpress Intl: SPX- + 12 digits"}
              </p>
            </div>

            <p className="text-[11px] text-slate-500">
              💡 The customer will see this tracking info instantly on their orders page.
            </p>

            <div className="flex gap-2">
              <Button
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 gap-2"
                onClick={confirmShipping}
                disabled={!trackingNumber.trim()}>
                <Truck size={14} /> Confirm Shipment
              </Button>
              <Button variant="ghost" className="flex-1 border border-white/10" onClick={closeShippingModal}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}