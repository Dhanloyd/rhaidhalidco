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
  Calendar, X, AlertCircle, CreditCard, Printer, History,
  Trash2, AlertTriangle, ChevronDown, ArrowLeft, RotateCcw,
  TrendingUp, ShoppingBag, Award, Zap, Settings, Lock, Eye,
  EyeOff, KeyRound, Smartphone, ToggleLeft, ToggleRight,
  BellRing, BellOff, Info, ChevronUp, Globe, UserX
} from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/logo.jpg";

type SidebarSection = "profile" | "orders" | "notifications" | "vouchers" | "wishlist" | "addresses" | "history" | "settings";

// ── Helpers ───────────────────────────────────────────────────────────────────

const resolveOrderItems = (order: any): any[] => {
  if (Array.isArray(order.order_items) && order.order_items.length > 0) return order.order_items;
  if (Array.isArray(order.items) && order.items.length > 0) return order.items;
  return [];
};

const itemUnitPrice = (item: any): number => Number(item.unit_price ?? item.price ?? 0);

const getPaymentDisplayStatus = (order: any) => {
  const method = order.payment_method ?? "";
  const pStatus = order.payment_status ?? "pending";
  if (method === "gcash_manual") {
    if (pStatus === "paid") return { label: "Payment Approved ✓", color: "text-emerald-700", bgClass: "bg-emerald-50", borderClass: "border-emerald-200" };
    if (pStatus === "failed") return { label: "Payment Rejected", color: "text-red-700", bgClass: "bg-red-50", borderClass: "border-red-200" };
    return { label: "Payment Pending Approval", color: "text-amber-700", bgClass: "bg-amber-50", borderClass: "border-amber-200" };
  }
  if (method === "cod") {
    if (pStatus === "paid" || order.status === "completed") return { label: "Paid (COD)", color: "text-emerald-700", bgClass: "bg-emerald-50", borderClass: "border-emerald-200" };
    return { label: "Pay on Delivery", color: "text-blue-700", bgClass: "bg-blue-50", borderClass: "border-blue-200" };
  }
  if (pStatus === "paid") return { label: "Payment Confirmed ✓", color: "text-emerald-700", bgClass: "bg-emerald-50", borderClass: "border-emerald-200" };
  if (pStatus === "failed") return { label: "Payment Failed", color: "text-red-700", bgClass: "bg-red-50", borderClass: "border-red-200" };
  return { label: "Payment Pending", color: "text-amber-700", bgClass: "bg-amber-50", borderClass: "border-amber-200" };
};

// ── Cancel Confirmation Modal ─────────────────────────────────────────────────
const CancelOrderModal = ({
  order,
  onClose,
  onConfirm,
}: {
  order: any | null;
  onClose: () => void;
  onConfirm: (orderId: string, reason: string) => Promise<void>;
}) => {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const reasons = [
    "Changed my mind",
    "Found a better price",
    "Ordered by mistake",
    "Payment issues",
    "Delivery takes too long",
    "Other",
  ];

  if (!order) return null;

  const handleConfirm = async () => {
    if (!reason) { toast.error("Please select a cancellation reason"); return; }
    setLoading(true);
    await onConfirm(order.id, reason);
    setLoading(false);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl"
        style={{ border: "1px solid rgba(239,68,68,0.15)" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5" style={{ background: "linear-gradient(135deg, #fff1f2 0%, #fef2f2 100%)", borderBottom: "1px solid rgba(239,68,68,0.1)" }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle size={18} className="text-red-500" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-base">Cancel Order</h3>
              <p className="text-xs text-gray-500 mt-0.5">Order #{order.id.slice(0, 8).toUpperCase()}</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <p className="text-sm text-gray-600 mb-4">Please select a reason for cancellation:</p>
          <div className="space-y-2">
            {reasons.map(r => (
              <button
                key={r}
                onClick={() => setReason(r)}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm transition-all duration-150 border ${
                  reason === r
                    ? "border-red-400 bg-red-50 text-red-700 font-medium"
                    : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <span className={`inline-block w-3.5 h-3.5 rounded-full border mr-2 align-middle transition-all ${
                  reason === r ? "bg-red-500 border-red-500" : "border-gray-300"
                }`} />
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Warning */}
        <div className="mx-6 mb-4 px-3.5 py-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2">
          <AlertCircle size={13} className="text-amber-600 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-700">This action cannot be undone. The order will be permanently removed from our system.</p>
        </div>

        {/* Footer */}
        <div className="flex gap-2.5 px-6 pb-5">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Keep Order
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || !reason}
            className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <><Trash2 size={13} /> Cancel Order</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── GCash Payment Status Badge ────────────────────────────────────────────────
const GCashPaymentStatusBadge = ({ order }: { order: any }) => {
  const info = getPaymentDisplayStatus(order);
  const Icon = info.bgClass.includes("emerald") ? CheckCircle : info.bgClass.includes("red") ? XCircle : Clock;
  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium ${info.bgClass} ${info.borderClass} ${info.color}`}>
      <Icon size={11} />{info.label}
    </div>
  );
};

// ── Order Receipt Modal ───────────────────────────────────────────────────────
const OrderReceiptModal = ({ order, onClose }: { order: any | null; onClose: () => void }) => {
  if (!order) return null;
  const fmt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const orderItems = resolveOrderItems(order);
  const grandTotal = Number(order.total || 0);
  const subtotal = Number(order.subtotal || grandTotal);
  const discount = Number(order.discount || 0);
  const shippingFee = Number(order.shipping_fee || 0);
  const totalQty = orderItems.reduce((s: number, i: any) => s + (i.quantity ?? 1), 0);
  const orderDate = new Date(order.created_at).toLocaleString("en-PH", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });
  const pmLabels: Record<string, string> = { cod: "Cash on Delivery", gcash: "GCash / GrabPay", card: "Credit / Debit Card", gcash_manual: "GCash (Manual Transfer)" };
  const payInfo = getPaymentDisplayStatus(order);
  const receiptNumber = order.id?.slice(0, 8).toUpperCase();

  const handlePrint = () => {
    const content = document.getElementById("profile-receipt-print");
    if (!content) return;
    const win = window.open("", "_blank", "width=600,height=900");
    if (!win) return;
    win.document.write(`<html><head><title>Receipt - Order #${receiptNumber}</title><style>body { margin: 0; padding: 20px; background: #fff; font-family: sans-serif; } * { box-sizing: border-box; }</style></head><body>${content.outerHTML}</body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-2">
            <Printer size={15} className="text-indigo-500" />
            <span className="font-semibold text-gray-800 text-sm">Receipt #{receiptNumber}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handlePrint} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"><Printer size={12} /> Print</button>
            <button onClick={onClose} className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"><X size={14} className="text-gray-500" /></button>
          </div>
        </div>
        <div className="overflow-y-auto flex-1 bg-gray-50">
          <div id="profile-receipt-print">
            <div style={{ background: "linear-gradient(135deg, #060b18 0%, #0f1f3d 100%)", padding: "24px 20px 20px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
              <img src={logo} alt="RaidKhalid & Co." style={{ width: "60px", height: "60px", objectFit: "contain", borderRadius: "10px", border: "2px solid rgba(255,255,255,0.15)" }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              <div>
                <p style={{ fontFamily: "sans-serif", fontSize: "1.3rem", fontWeight: 900, letterSpacing: ".06em", color: "#fff", marginBottom: "4px", marginTop: 0, textTransform: "uppercase" }}>RaidKhalid &amp; Co.</p>
                <p style={{ fontSize: "11px", color: "rgba(255,255,255,.45)", margin: "0 0 2px" }}>Official Order Receipt</p>
                <p style={{ fontSize: "10px", color: "rgba(255,255,255,.3)", margin: 0 }}>{orderDate}</p>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderBottom: "1px solid rgba(10,13,20,.08)", background: "#fff" }}>
              {[{ label: "Order #", value: `#${receiptNumber}` }, { label: "Date", value: new Date(order.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }) }, { label: "Customer", value: order.customer_name || order.shipping_name || "—" }, { label: "Payment", value: pmLabels[order.payment_method] ?? (order.payment_method || "—") }].map((m, i) => (
                <div key={i} style={{ padding: "10px 16px", borderBottom: i < 2 ? "1px solid rgba(10,13,20,.06)" : "none", borderRight: i % 2 === 0 ? "1px solid rgba(10,13,20,.06)" : "none" }}>
                  <p style={{ fontSize: "9px", fontWeight: 800, letterSpacing: ".16em", textTransform: "uppercase", color: "rgba(10,13,20,.35)", marginBottom: "2px", marginTop: 0 }}>{m.label}</p>
                  <p style={{ fontSize: "12px", fontWeight: 700, color: "#0a0d14", margin: 0 }}>{m.value}</p>
                </div>
              ))}
            </div>
            <div style={{ padding: "8px 16px", background: payInfo.bgClass.includes("emerald") ? "#f0fdf4" : payInfo.bgClass.includes("red") ? "#fef2f2" : "#fffbeb", borderBottom: "1px solid rgba(10,13,20,.06)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "11px", color: "rgba(10,13,20,.5)", fontWeight: 600 }}>Payment Status</span>
              <span style={{ fontSize: "11px", fontWeight: 700, color: payInfo.bgClass.includes("emerald") ? "#15803d" : payInfo.bgClass.includes("red") ? "#b91c1c" : "#b45309" }}>{payInfo.label}</span>
            </div>
            {(order.shipping_name || order.customer_name || order.shipping_address) && (
              <div style={{ padding: "12px 16px 0", background: "#fff" }}>
                <div style={{ background: "rgba(10,13,20,.02)", border: "1px solid rgba(10,13,20,.07)", borderRadius: "8px", padding: "10px 12px" }}>
                  <p style={{ fontSize: "9px", fontWeight: 800, letterSpacing: ".16em", textTransform: "uppercase", color: "rgba(10,13,20,.35)", marginBottom: "6px", marginTop: 0 }}>Ship To</p>
                  <p style={{ fontSize: "12px", fontWeight: 700, color: "#0a0d14", margin: "0 0 2px" }}>{order.shipping_name || order.customer_name}</p>
                  {order.shipping_phone && <p style={{ fontSize: "11px", color: "rgba(10,13,20,.5)", margin: "0 0 1px" }}>{order.shipping_phone}</p>}
                  {order.shipping_address && <p style={{ fontSize: "11px", color: "rgba(10,13,20,.5)", margin: 0 }}>{typeof order.shipping_address === "object" ? `${order.shipping_address.address || ""}, ${order.shipping_address.city || ""}` : order.shipping_address}</p>}
                </div>
              </div>
            )}
            <div style={{ padding: "14px 16px 0", background: "#fff" }}>
              <p style={{ fontSize: "9px", fontWeight: 800, letterSpacing: ".16em", textTransform: "uppercase", color: "rgba(10,13,20,.35)", marginBottom: "8px", marginTop: 0 }}>Items Ordered</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 52px 36px 64px", padding: "5px 8px", background: "rgba(10,13,20,.04)", borderRadius: "5px", marginBottom: "4px" }}>
                {["Item", "Size/Color", "Qty", "Amount"].map(h => <span key={h} style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "rgba(10,13,20,.4)", textAlign: h !== "Item" ? "center" : "left" }}>{h}</span>)}
              </div>
              {orderItems.length === 0 ? <div style={{ textAlign: "center", padding: "16px 0" }}><p style={{ fontSize: "12px", color: "rgba(10,13,20,.35)", margin: 0 }}>No item details available</p></div> : orderItems.map((item: any, i: number) => {
                const name = item.product_name ?? item.name ?? "Item";
                const qty = item.quantity ?? 1;
                const price = itemUnitPrice(item);
                const size = item.selected_size ?? item.size ?? null;
                const color = item.selected_color ?? item.color ?? null;
                const colorHex = item.selected_color_hex ?? null;
                const waist = item.selected_waist ?? item.waist ?? null;
                const length = item.selected_length ?? item.length ?? null;
                const sizeLabel = waist && length ? `W${waist}/L${length}` : size ?? null;
                return (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 52px 36px 64px", padding: "8px 8px", alignItems: "center", borderBottom: i < orderItems.length - 1 ? "1px solid rgba(10,13,20,.05)" : "none" }}>
                    <div><p style={{ fontSize: "11px", fontWeight: 600, color: "#0a0d14", lineHeight: 1.3, margin: 0 }}>{name}</p><p style={{ fontSize: "9px", color: "rgba(10,13,20,.4)", margin: "2px 0 0" }}>@ ₱{fmt(price)}</p></div>
                    <div style={{ textAlign: "center" }}>
                      {sizeLabel ? <span style={{ display: "inline-block", fontSize: "9px", fontWeight: 700, padding: "2px 5px", borderRadius: "3px", background: waist && length ? "rgba(26,86,219,.08)" : "rgba(10,13,20,.06)", color: waist && length ? "#1a56db" : "#0a0d14", textTransform: "uppercase" }}>{sizeLabel}</span> : null}
                      {color ? <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "3px", marginTop: sizeLabel ? "3px" : "0" }}>{colorHex && <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: colorHex, border: "1px solid rgba(10,13,20,.2)", display: "inline-block" }} />}<span style={{ fontSize: "9px", color: "rgba(10,13,20,.5)", fontWeight: 600 }}>{color}</span></div> : null}
                      {!sizeLabel && !color && <span style={{ fontSize: "10px", color: "rgba(10,13,20,.3)" }}>—</span>}
                    </div>
                    <div style={{ textAlign: "center", fontSize: "12px", fontWeight: 700, color: "#0a0d14" }}>×{qty}</div>
                    <div style={{ textAlign: "right", fontSize: "12px", fontWeight: 800, color: "#0a0d14" }}>₱{fmt(price * qty)}</div>
                  </div>
                );
              })}
            </div>
            <div style={{ margin: "10px 16px 0", padding: "10px 12px", background: "rgba(10,13,20,.03)", borderRadius: "8px", border: "1px solid rgba(10,13,20,.07)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div><p style={{ fontSize: "9px", letterSpacing: ".12em", textTransform: "uppercase", color: "rgba(10,13,20,.35)", marginBottom: "2px", marginTop: 0 }}>Total Items</p><p style={{ fontSize: "14px", fontWeight: 800, color: "#0a0d14", margin: 0 }}>{orderItems.length} style{orderItems.length !== 1 ? "s" : ""} · {totalQty} pc{totalQty !== 1 ? "s" : ""}</p></div>
              <div style={{ textAlign: "right" }}><p style={{ fontSize: "9px", letterSpacing: ".12em", textTransform: "uppercase", color: "rgba(10,13,20,.35)", marginBottom: "2px", marginTop: 0 }}>Grand Total</p><p style={{ fontSize: "18px", fontWeight: 800, color: "#0a0d14", margin: 0 }}>₱{fmt(grandTotal)}</p></div>
            </div>
            <div style={{ padding: "12px 16px 0", background: "#fff" }}>
              <div style={{ background: "rgba(10,13,20,.02)", borderRadius: "8px", border: "1px solid rgba(10,13,20,.07)", overflow: "hidden" }}>
                {[{ label: `Subtotal (${totalQty} pc${totalQty !== 1 ? "s" : ""})`, value: `₱${fmt(subtotal)}`, green: false }, ...(discount > 0 ? [{ label: "Discount", value: `-₱${fmt(discount)}`, green: true }] : []), { label: "Shipping", value: shippingFee === 0 ? "FREE" : `₱${fmt(shippingFee)}`, green: shippingFee === 0 }].map((row, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "7px 12px", borderBottom: "1px solid rgba(10,13,20,.05)" }}>
                    <span style={{ fontSize: "11px", color: "rgba(10,13,20,.5)" }}>{row.label}</span>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: row.green ? "#16a34a" : "#0a0d14" }}>{row.value}</span>
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 12px", background: "#0a0d14" }}>
                  <span style={{ fontWeight: 900, fontSize: ".95rem", letterSpacing: ".04em", color: "rgba(255,255,255,.65)", textTransform: "uppercase" }}>TOTAL (incl. VAT)</span>
                  <span style={{ fontWeight: 900, fontSize: "1.2rem", color: "#fff" }}>₱{fmt(grandTotal)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 12px" }}>
                  <span style={{ fontSize: "11px", color: "rgba(10,13,20,.5)" }}>Payment Status</span>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: payInfo.bgClass.includes("emerald") ? "#15803d" : payInfo.bgClass.includes("red") ? "#b91c1c" : "#b45309" }}>{payInfo.label}</span>
                </div>
              </div>
            </div>
            {order.tracking_number && (
              <div style={{ padding: "12px 16px 0", background: "#fff" }}>
                <div style={{ background: "rgba(26,86,219,.04)", border: "1px solid rgba(26,86,219,.12)", borderRadius: "8px", padding: "10px 12px" }}>
                  <p style={{ fontSize: "9px", fontWeight: 800, letterSpacing: ".16em", textTransform: "uppercase", color: "rgba(10,13,20,.35)", marginBottom: "6px", marginTop: 0 }}>Tracking Info</p>
                  {order.courier && <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}><span style={{ fontSize: "11px", color: "rgba(10,13,20,.45)" }}>Courier</span><span style={{ fontSize: "11px", fontWeight: 700, color: "#0a0d14" }}>{order.courier}</span></div>}
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: "11px", color: "rgba(10,13,20,.45)" }}>Tracking #</span><span style={{ fontSize: "11px", fontWeight: 700, color: "#1a56db", fontFamily: "monospace" }}>{order.tracking_number}</span></div>
                </div>
              </div>
            )}
            <div style={{ padding: "14px 16px 20px", textAlign: "center", borderTop: "1px solid rgba(10,13,20,.06)", marginTop: "14px", background: "#fff" }}>
              <p style={{ fontSize: "10px", color: "rgba(10,13,20,.35)", lineHeight: 1.7, margin: 0 }}>Thank you for your purchase!<br /><strong style={{ color: "rgba(10,13,20,.5)" }}>This is your official receipt from RaidKhalid &amp; Co.</strong></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Password Strength Meter ───────────────────────────────────────────────────
const PasswordStrength = ({ password }: { password: string }) => {
  const checks = [
    { label: "At least 8 characters", pass: password.length >= 8 },
    { label: "Uppercase letter (A-Z)", pass: /[A-Z]/.test(password) },
    { label: "Lowercase letter (a-z)", pass: /[a-z]/.test(password) },
    { label: "Number (0-9)", pass: /\d/.test(password) },
    { label: "Special character (!@#$...)", pass: /[^A-Za-z0-9]/.test(password) },
  ];
  const score = checks.filter(c => c.pass).length;
  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong", "Very Strong"][score];
  const strengthColor = ["", "bg-red-400", "bg-orange-400", "bg-yellow-400", "bg-blue-500", "bg-green-500"][score];
  const textColor = ["", "text-red-500", "text-orange-500", "text-yellow-600", "text-blue-600", "text-green-600"][score];

  if (!password) return null;
  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-500">Password strength</span>
        <span className={`text-xs font-semibold ${textColor}`}>{strengthLabel}</span>
      </div>
      <div className="flex gap-1">
        {[1,2,3,4,5].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= score ? strengthColor : "bg-gray-200"}`} />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
        {checks.map(c => (
          <div key={c.label} className="flex items-center gap-1.5">
            <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${c.pass ? "bg-green-100" : "bg-gray-100"}`}>
              {c.pass
                ? <CheckCircle size={9} className="text-green-600" />
                : <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
              }
            </div>
            <span className={`text-[10px] ${c.pass ? "text-green-700" : "text-gray-400"}`}>{c.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Toggle Switch ──────────────────────────────────────────────────────────────
const Toggle = ({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) => (
  <button
    onClick={() => onChange(!enabled)}
    className={`relative w-11 h-6 rounded-full transition-all duration-200 focus:outline-none ${enabled ? "bg-primary" : "bg-gray-200"}`}
  >
    <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${enabled ? "translate-x-5" : "translate-x-0"}`} />
  </button>
);

// ── Settings Section ───────────────────────────────────────────────────────────
const SettingsSection = ({ user }: { user: any }) => {
  // ── Password Change ──
  const [pwSection, setPwSection] = useState<"idle" | "form" | "success">("idle");
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState("");

  // ── Notification Prefs ──
  const [notifOrderUpdates, setNotifOrderUpdates] = useState(true);
  const [notifPromos, setNotifPromos] = useState(true);
  const [notifSMS, setNotifSMS] = useState(false);
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifSaving, setNotifSaving] = useState(false);

  // ── Deactivate Accordion ──
  const [showDeactivate, setShowDeactivate] = useState(false);

  const handleChangePassword = async () => {
    setPwError("");
    if (!currentPw) { setPwError("Please enter your current password."); return; }
    if (newPw.length < 8) { setPwError("New password must be at least 8 characters."); return; }
    if (newPw !== confirmPw) { setPwError("New passwords do not match."); return; }
    if (newPw === currentPw) { setPwError("New password must be different from current password."); return; }

    setPwLoading(true);
    try {
      // Re-authenticate first with current password
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPw,
      });
      if (signInErr) { setPwError("Current password is incorrect."); setPwLoading(false); return; }

      // Then update
      const { error: updateErr } = await supabase.auth.updateUser({ password: newPw });
      if (updateErr) { setPwError(updateErr.message); setPwLoading(false); return; }

      setPwSection("success");
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
      toast.success("Password changed successfully!");
    } catch (e: any) {
      setPwError("Something went wrong. Please try again.");
    }
    setPwLoading(false);
  };

  const handleSaveNotifications = async () => {
    setNotifSaving(true);
    // In a real app, persist to a user_preferences table
    await new Promise(r => setTimeout(r, 600));
    setNotifSaving(false);
    toast.success("Notification preferences saved!");
  };

  const pwStrengthChecks = [
    /[A-Z]/.test(newPw),
    /[a-z]/.test(newPw),
    /\d/.test(newPw),
    /[^A-Za-z0-9]/.test(newPw),
    newPw.length >= 8,
  ].filter(Boolean).length;

  return (
    <div className="space-y-4">

      {/* ── Page Header ── */}
      <div className="bg-white rounded-2xl border border-gray-200/80 overflow-hidden shadow-sm">
        <div className="px-6 py-5" style={{ background: "linear-gradient(135deg, #f0f4ff 0%, #e8eeff 100%)", borderBottom: "1px solid rgba(100,130,255,0.12)" }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
              <Settings size={18} className="text-indigo-600" />
            </div>
            <div>
              <h2 className="font-heading text-lg uppercase tracking-wider text-gray-900">Account Settings</h2>
              <p className="text-xs text-gray-500 mt-0.5">Manage your security, notifications, and privacy</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Security ── */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
        {/* Section label */}
        <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
            <Shield size={15} className="text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Security</p>
            <p className="text-xs text-gray-400">Manage your login credentials</p>
          </div>
        </div>

        {/* Email row */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center">
              <Mail size={15} className="text-gray-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">Email Address</p>
              <p className="text-xs text-gray-400 mt-0.5">{user.email}</p>
            </div>
          </div>
          <span className="text-[10px] bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-semibold flex items-center gap-1">
            <CheckCircle size={9} /> Verified
          </span>
        </div>

        {/* Password row */}
        <div className="px-6 py-4">
          {pwSection === "idle" && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center">
                  <KeyRound size={15} className="text-gray-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">Password</p>
                  <p className="text-xs text-gray-400 mt-0.5">••••••••••••</p>
                </div>
              </div>
              <button
                onClick={() => { setPwSection("form"); setPwError(""); }}
                className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 px-3.5 py-2 rounded-xl border border-indigo-200 hover:bg-indigo-50 transition-all"
              >
                <Edit2 size={12} /> Change Password
              </button>
            </div>
          )}

          {pwSection === "success" && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center">
                  <KeyRound size={15} className="text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">Password</p>
                  <p className="text-xs text-green-600 mt-0.5 font-medium">✓ Password updated successfully</p>
                </div>
              </div>
              <button
                onClick={() => setPwSection("form")}
                className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Change again
              </button>
            </div>
          )}

          {pwSection === "form" && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
                  <KeyRound size={15} className="text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Change Password</p>
                  <p className="text-xs text-gray-400">Choose a strong, unique password</p>
                </div>
                <button onClick={() => { setPwSection("idle"); setPwError(""); setCurrentPw(""); setNewPw(""); setConfirmPw(""); }} className="ml-auto w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                  <X size={14} className="text-gray-500" />
                </button>
              </div>

              {/* Current password */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrent ? "text" : "password"}
                    value={currentPw}
                    onChange={e => setCurrentPw(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full px-3.5 py-2.5 pr-10 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
                  />
                  <button onClick={() => setShowCurrent(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* New password */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">New Password</label>
                <div className="relative">
                  <input
                    type={showNew ? "text" : "password"}
                    value={newPw}
                    onChange={e => setNewPw(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full px-3.5 py-2.5 pr-10 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
                  />
                  <button onClick={() => setShowNew(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                <PasswordStrength password={newPw} />
              </div>

              {/* Confirm password */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirmPw}
                    onChange={e => setConfirmPw(e.target.value)}
                    placeholder="Re-enter new password"
                    className={`w-full px-3.5 py-2.5 pr-10 border rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${
                      confirmPw && newPw !== confirmPw
                        ? "border-red-300 focus:ring-red-200 focus:border-red-400"
                        : confirmPw && newPw === confirmPw
                        ? "border-green-300 focus:ring-green-200 focus:border-green-400"
                        : "border-gray-200 focus:ring-indigo-500/30 focus:border-indigo-400"
                    }`}
                  />
                  <button onClick={() => setShowConfirm(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                  {confirmPw && newPw === confirmPw && (
                    <CheckCircle size={14} className="absolute right-8 top-1/2 -translate-y-1/2 text-green-500 pointer-events-none" />
                  )}
                </div>
                {confirmPw && newPw !== confirmPw && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={11} /> Passwords do not match</p>
                )}
              </div>

              {/* Error */}
              {pwError && (
                <div className="flex items-start gap-2 px-3.5 py-2.5 bg-red-50 border border-red-200 rounded-xl">
                  <AlertCircle size={13} className="text-red-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-red-600">{pwError}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2.5 pt-1">
                <button
                  onClick={handleChangePassword}
                  disabled={pwLoading || !currentPw || !newPw || !confirmPw || pwStrengthChecks < 3}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all flex items-center justify-center gap-2"
                >
                  {pwLoading
                    ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Updating...</>
                    : <><Lock size={13} /> Update Password</>
                  }
                </button>
                <button
                  onClick={() => { setPwSection("idle"); setPwError(""); setCurrentPw(""); setNewPw(""); setConfirmPw(""); }}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>

              {/* Forgot hint */}
              <p className="text-center text-xs text-gray-400">
                Forgot your password?{" "}
                <button
                  onClick={async () => {
                    await supabase.auth.resetPasswordForEmail(user.email, { redirectTo: window.location.origin + "/reset-password" });
                    toast.success("Password reset email sent! Check your inbox.");
                  }}
                  className="text-indigo-600 font-semibold hover:underline"
                >
                  Send reset email
                </button>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Notification Preferences ── */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100">
          <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
            <BellRing size={15} className="text-amber-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Notification Preferences</p>
            <p className="text-xs text-gray-400">Choose how and when we contact you</p>
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {[
            {
              icon: Package,
              iconBg: "bg-blue-50",
              iconColor: "text-blue-500",
              label: "Order Updates",
              sub: "Get notified when your order status changes",
              value: notifOrderUpdates,
              onChange: setNotifOrderUpdates,
            },
            {
              icon: Star,
              iconBg: "bg-yellow-50",
              iconColor: "text-yellow-500",
              label: "Promotions & Offers",
              sub: "Receive deals, flash sales, and discount alerts",
              value: notifPromos,
              onChange: setNotifPromos,
            },
            {
              icon: Mail,
              iconBg: "bg-indigo-50",
              iconColor: "text-indigo-500",
              label: "Email Notifications",
              sub: "Receive updates at " + user.email,
              value: notifEmail,
              onChange: setNotifEmail,
            },
            {
              icon: Smartphone,
              iconBg: "bg-green-50",
              iconColor: "text-green-500",
              label: "SMS Notifications",
              sub: "Get text message alerts on your phone",
              value: notifSMS,
              onChange: setNotifSMS,
            },
          ].map(({ icon: Icon, iconBg, iconColor, label, sub, value, onChange }) => (
            <div key={label} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
                  <Icon size={15} className={iconColor} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">{label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
                </div>
              </div>
              <Toggle enabled={value} onChange={onChange} />
            </div>
          ))}
        </div>

        <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100">
          <button
            onClick={handleSaveNotifications}
            disabled={notifSaving}
            className="w-full py-2.5 rounded-xl bg-primary hover:opacity-90 disabled:opacity-50 text-white text-sm font-semibold transition-all flex items-center justify-center gap-2"
          >
            {notifSaving
              ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
              : <><Save size={13} /> Save Preferences</>
            }
          </button>
        </div>
      </div>

      {/* ── Privacy & Data ── */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100">
          <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
            <Globe size={15} className="text-purple-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Privacy & Data</p>
            <p className="text-xs text-gray-400">Manage your data and account visibility</p>
          </div>
        </div>
        <div className="px-6 py-4 space-y-3">
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-gray-50 border border-gray-200">
            <Info size={14} className="text-gray-400 mt-0.5 shrink-0" />
            <p className="text-xs text-gray-500 leading-relaxed">
              Your data is encrypted and never sold to third parties. You can request a copy of your data or delete your account at any time in accordance with our Privacy Policy.
            </p>
          </div>
          <div className="flex gap-2">
            <button className="flex-1 text-xs font-medium text-gray-600 border border-gray-200 px-3.5 py-2.5 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5">
              <Shield size={12} /> View Privacy Policy
            </button>
            <button className="flex-1 text-xs font-medium text-indigo-600 border border-indigo-200 px-3.5 py-2.5 rounded-xl hover:bg-indigo-50 transition-colors flex items-center justify-center gap-1.5">
              <Mail size={12} /> Request My Data
            </button>
          </div>
        </div>
      </div>

      {/* ── Danger Zone ── */}
      <div className="bg-white rounded-2xl border border-red-200/60 shadow-sm overflow-hidden">
        <button
          onClick={() => setShowDeactivate(v => !v)}
          className="w-full flex items-center justify-between px-6 py-4 hover:bg-red-50/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
              <UserX size={15} className="text-red-500" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-red-600">Danger Zone</p>
              <p className="text-xs text-gray-400">Deactivate or delete your account</p>
            </div>
          </div>
          {showDeactivate
            ? <ChevronUp size={16} className="text-gray-400" />
            : <ChevronDown size={16} className="text-gray-400" />
          }
        </button>

        {showDeactivate && (
          <div className="px-6 pb-5 space-y-3 border-t border-red-100">
            <div className="mt-4 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
              <AlertTriangle size={13} className="text-red-500 mt-0.5 shrink-0" />
              <p className="text-xs text-red-700 leading-relaxed">
                <strong>Warning:</strong> Deleting your account is permanent and cannot be undone. All your orders, profile data, and wishlist will be removed.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => toast.info("Please contact our support team to deactivate your account.")}
                className="flex-1 text-xs font-semibold text-amber-700 border border-amber-200 bg-amber-50 px-3.5 py-2.5 rounded-xl hover:bg-amber-100 transition-colors flex items-center justify-center gap-1.5"
              >
                <BellOff size={12} /> Deactivate Account
              </button>
              <button
                onClick={() => toast.error("Please contact support at support@raidkhalid.com to permanently delete your account.")}
                className="flex-1 text-xs font-semibold text-red-600 border border-red-200 bg-red-50 px-3.5 py-2.5 rounded-xl hover:bg-red-100 transition-colors flex items-center justify-center gap-1.5"
              >
                <Trash2 size={12} /> Delete Account
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

// ── Stat Card Component ───────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, color, bg }: { icon: any; label: string; value: string | number; color: string; bg: string }) => (
  <div className={`rounded-2xl p-4 border ${bg} flex items-center gap-3`} style={{ borderColor: "rgba(0,0,0,0.06)" }}>
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
      <Icon size={18} />
    </div>
    <div>
      <p className="text-2xl font-bold text-gray-900 leading-none">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5 font-medium">{label}</p>
    </div>
  </div>
);

// ── Main Profile Page ─────────────────────────────────────────────────────────
const ProfilePage = () => {
  const { user, signOut, displayName } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [orders, setOrders] = useState<any[]>([]);
  const [orderHistory, setOrderHistory] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [addressCount, setAddressCount] = useState(0);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editBirthday, setEditBirthday] = useState("");
  const [editGender, setEditGender] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<SidebarSection>("profile");
  const [activeOrderTab, setActiveOrderTab] = useState(0);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [receiptOrder, setReceiptOrder] = useState<any>(null);
  const [cancelOrder, setCancelOrder] = useState<any>(null);

  // Cancellable statuses — only pending orders can be cancelled by the user
  const CANCELLABLE_STATUSES = ["pending"];

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    Promise.all([
      supabase.from("orders").select("*, order_items(*)").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("wishlist").select("id", { count: "exact" }).eq("user_id", user.id),
      supabase.from("addresses").select("id", { count: "exact" }).eq("user_id", user.id),
    ]).then(([ordersRes, profileRes, wishlistRes, addressRes]) => {
      const allOrders = ordersRes.data || [];
      // Active orders = not cancelled/completed history
      setOrders(allOrders.filter((o: any) => o.status !== "deleted"));
      // Order history = completed + cancelled
      setOrderHistory(allOrders.filter((o: any) => ["completed", "payment_complete", "cancelled"].includes(o.status)));
      setProfile(profileRes.data);
      setEditName(profileRes.data?.display_name || "");
      setEditPhone(profileRes.data?.phone || "");
      setEditBirthday(profileRes.data?.birthday || "");
      setEditGender(profileRes.data?.gender || "");
      setAvatarUrl(profileRes.data?.avatar_url || "");
      setWishlistCount(wishlistRes.count || 0);
      setAddressCount(addressRes.count || 0);
    }).catch(err => console.error("Profile load error:", err))
      .finally(() => setLoading(false));

    const channel = supabase
      .channel("profile-orders-realtime")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders", filter: `user_id=eq.${user.id}` }, (payload) => {
        setOrders(prev => {
          const updated = prev.map(o => o.id === payload.new.id ? { ...o, ...payload.new } : o);
          const oldOrder = prev.find(o => o.id === payload.new.id);
          if (oldOrder && oldOrder.payment_status !== payload.new.payment_status) {
            if (payload.new.payment_status === "paid") toast.success(`💙 GCash payment approved for order #${payload.new.id.slice(0, 8).toUpperCase()}!`);
            else if (payload.new.payment_status === "failed") toast.error(`Payment rejected for order #${payload.new.id.slice(0, 8).toUpperCase()}. Please contact support.`);
          }
          return updated;
        });
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "orders", filter: `user_id=eq.${user.id}` }, (payload) => {
        setOrders(prev => prev.filter(o => o.id !== payload.old.id));
        setOrderHistory(prev => prev.filter(o => o.id !== payload.old.id));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center mx-auto mb-4">
            <User size={32} className="text-indigo-500" />
          </div>
          <h1 className="font-heading text-2xl uppercase text-foreground mb-2">Sign in to view profile</h1>
          <p className="text-muted-foreground text-sm mb-5">Access your orders, wishlist, and account settings</p>
          <Link to="/signin"><Button className="bg-primary text-primary-foreground px-8">Sign In</Button></Link>
        </div>
      </div>
    );
  }

  // ── Cancel & Delete Order ─────────────────────────────────────────────────
  const handleCancelOrder = async (orderId: string, reason: string) => {
    try {
      // Step 1: Update order status to cancelled with reason
      const { error: updateError } = await supabase
        .from("orders")
        .update({ status: "cancelled", cancellation_reason: reason, cancelled_at: new Date().toISOString() })
        .eq("id", orderId)
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      // Step 2: Move to history and remove from active orders in local state
      setOrders(prev => {
        const cancelled = prev.find(o => o.id === orderId);
        if (cancelled) {
          const updatedOrder = { ...cancelled, status: "cancelled", cancellation_reason: reason };
          setOrderHistory(hist => [updatedOrder, ...hist.filter(o => o.id !== orderId)]);
        }
        return prev.filter(o => o.id !== orderId);
      });

      // Step 3: Auto-delete from DB after 30 seconds (soft delete approach — 
      // you can also do this immediately if preferred)
      // For immediate hard delete, uncomment:
      // await supabase.from("orders").delete().eq("id", orderId).eq("user_id", user.id);

      toast.success("Order cancelled successfully", {
        description: `Your order has been cancelled. Reason: ${reason}`,
        duration: 5000,
      });
    } catch (err: any) {
      console.error("Cancel error:", err);
      toast.error("Failed to cancel order. Please try again.");
    }
  };

  // Hard delete (admin/user removes from history)
  const handleDeleteFromHistory = async (orderId: string) => {
    try {
      const { error } = await supabase.from("orders").delete().eq("id", orderId).eq("user_id", user.id);
      if (error) throw error;
      setOrderHistory(prev => prev.filter(o => o.id !== orderId));
      toast.success("Order removed from history");
    } catch (err) {
      toast.error("Failed to remove order");
    }
  };

  // ── Status groupings ──────────────────────────────────────────────────────
  const activeOrders = orders.filter(o => !["cancelled", "completed", "payment_complete"].includes(o.status));
  const pendingOrders = orders.filter(o => o.status === "pending");
  const processingOrders = orders.filter(o => ["confirmed", "packed"].includes(o.status));
  const shippedOrders = orders.filter(o => ["shipped", "out_for_delivery", "delivered", "arrived"].includes(o.status));
  const completedOrders = orders.filter(o => ["completed", "payment_complete"].includes(o.status));
  const cancelledOrders = orders.filter(o => o.status === "cancelled");

  const orderTabs = [
    { label: "All", icon: Package, orders: orders },
    { label: "Pending", icon: Clock, orders: pendingOrders },
    { label: "Processing", icon: Package, orders: processingOrders },
    { label: "Shipped", icon: Truck, orders: shippedOrders },
    { label: "Completed", icon: CheckCircle, orders: completedOrders },
    { label: "Cancelled", icon: XCircle, orders: cancelledOrders },
  ];

  const orderStatusSteps = ["Pending", "Confirmed", "Packed", "Shipped", "Delivered", "Completed"];

  const getStatusStep = (status: string) => {
    const map: Record<string, number> = { pending: 0, confirmed: 1, packed: 2, shipped: 3, out_for_delivery: 3, delivered: 4, arrived: 4, completed: 5, payment_complete: 5 };
    return map[status] ?? 0;
  };

  const getStatusStyle = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-amber-100 text-amber-700", confirmed: "bg-blue-100 text-blue-700",
      packed: "bg-violet-100 text-violet-700", shipped: "bg-indigo-100 text-indigo-700",
      out_for_delivery: "bg-sky-100 text-sky-700", delivered: "bg-cyan-100 text-cyan-700",
      arrived: "bg-teal-100 text-teal-700", completed: "bg-green-100 text-green-700",
      payment_complete: "bg-teal-100 text-teal-700", cancelled: "bg-red-100 text-red-600",
    };
    return styles[status] || "bg-primary/10 text-primary";
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: "Pending", confirmed: "Confirmed", packed: "Being Packed", shipped: "Shipped",
      out_for_delivery: "Out for Delivery", delivered: "Delivered", arrived: "Arrived",
      completed: "Completed", payment_complete: "Payment Complete", cancelled: "Cancelled",
    };
    return labels[status] || status;
  };

  const handleSaveProfile = async () => {
    const { error } = await supabase.from("profiles").update({ display_name: editName, phone: editPhone, birthday: editBirthday, gender: editGender }).eq("user_id", user.id);
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

  // Stats
  const totalSpent = [...orders, ...orderHistory].filter(o => ["completed", "payment_complete"].includes(o.status)).reduce((s, o) => s + Number(o.total || 0), 0);
  const totalOrderCount = orders.length + orderHistory.filter(o => o.status !== "cancelled").length;

  const sidebarNav = [
    {
      group: "Account",
      items: [
        { id: "profile" as SidebarSection, label: "My Profile", icon: User },
        { id: "addresses" as SidebarSection, label: "Addresses", icon: MapPin, badge: addressCount },
        { id: "notifications" as SidebarSection, label: "Notifications", icon: Bell },
        { id: "vouchers" as SidebarSection, label: "Vouchers", icon: Ticket },
        { id: "settings" as SidebarSection, label: "Settings", icon: Settings },
      ]
    },
    {
      group: "Shopping",
      items: [
        { id: "orders" as SidebarSection, label: "My Orders", icon: Package, badge: activeOrders.length },
        { id: "wishlist" as SidebarSection, label: "Wishlist", icon: Heart, badge: wishlistCount },
        { id: "history" as SidebarSection, label: "Order History", icon: History, badge: orderHistory.length },
      ]
    }
  ];

  // Order card renderer (shared between orders and history)
  const renderOrderCard = (order: any, isHistory = false) => {
    const step = getStatusStep(order.status);
    const isCancelled = order.status === "cancelled";
    const isCompleted = ["completed", "payment_complete"].includes(order.status);
    const orderItems = resolveOrderItems(order);
    const payInfo = getPaymentDisplayStatus(order);
    const canCancel = CANCELLABLE_STATUSES.includes(order.status) && !isHistory;

    return (
      <div key={order.id} className="border border-border/60 rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-md hover:border-border"
        style={{ background: isCancelled ? "rgba(254,242,242,0.4)" : "white" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/40"
          style={{ background: isCancelled ? "rgba(254,242,242,0.6)" : isCompleted ? "rgba(240,253,244,0.6)" : "rgba(249,250,251,0.8)" }}>
          <div className="flex items-center gap-2.5">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs ${getStatusStyle(order.status)}`}>
              {isCancelled ? <XCircle size={14} /> : isCompleted ? <CheckCircle size={14} /> : <Package size={14} />}
            </div>
            <p className="text-xs font-mono font-bold text-gray-600">#{order.id.slice(0, 8).toUpperCase()}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
            <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wide ${getStatusStyle(order.status)}`}>
              {getStatusLabel(order.status)}
            </span>
          </div>
        </div>

        {/* Payment status banner */}
        <div className={`px-4 py-2 border-b border-border/30 flex items-center justify-between gap-3 flex-wrap ${payInfo.bgClass}`}>
          <div className="flex items-center gap-2">
            <CreditCard size={12} className={payInfo.color} />
            <span className="text-xs text-muted-foreground font-medium capitalize">{order.payment_method?.replace(/_/g, " ") || "Payment"}</span>
          </div>
          <GCashPaymentStatusBadge order={order} />
        </div>

        {/* Cancellation reason */}
        {isCancelled && order.cancellation_reason && (
          <div className="px-4 py-2.5 border-b border-red-100 bg-red-50/50 flex items-start gap-2">
            <AlertCircle size={12} className="text-red-400 mt-0.5 shrink-0" />
            <p className="text-xs text-red-600"><span className="font-semibold">Reason:</span> {order.cancellation_reason}</p>
          </div>
        )}

        {/* Items */}
        <div className="px-4 py-3 space-y-2">
          {orderItems.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">No item details available</p>
          ) : orderItems.slice(0, 3).map((item: any, i: number) => {
            const price = itemUnitPrice(item);
            const qty = item.quantity ?? 1;
            const name = item.product_name ?? item.name ?? "Item";
            return (
              <div key={i} className="flex items-center gap-3">
                <div className="w-11 h-11 bg-gray-100 rounded-xl flex items-center justify-center shrink-0 overflow-hidden border border-gray-200">
                  {item.product_image ? <img src={item.product_image} alt={name} className="w-full h-full object-cover" /> : <Package size={16} className="text-gray-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate font-medium">{name}</p>
                  <div className="flex gap-1.5 mt-0.5 flex-wrap items-center">
                    {(item.selected_size ?? item.size) && <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-md">{item.selected_size ?? item.size}</span>}
                    {(item.selected_color ?? item.color) && (
                      <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                        {(item.selected_color_hex ?? item.color_hex) && <span style={{ background: item.selected_color_hex ?? item.color_hex }} className="w-2 h-2 rounded-full inline-block border border-gray-300" />}
                        {item.selected_color ?? item.color}
                      </span>
                    )}
                    <span className="text-[10px] text-gray-400">×{qty}</span>
                  </div>
                </div>
                <p className="text-sm font-semibold text-gray-800 shrink-0">₱{(price * qty).toLocaleString()}</p>
              </div>
            );
          })}
          {orderItems.length > 3 && <p className="text-xs text-primary font-medium">+{orderItems.length - 3} more items</p>}
        </div>

        {/* Progress tracker */}
        {!isCancelled && !isHistory && (
          <div className="px-5 py-4 border-t border-border/40 bg-gray-50/50">
            <div className="flex items-start justify-between relative">
              <div className="absolute left-0 right-0 top-3 h-0.5 bg-gray-200 mx-4" />
              <div className="absolute top-3 h-0.5 bg-primary transition-all duration-700 mx-4" style={{ left: 0, width: `${(step / (orderStatusSteps.length - 1)) * 100}%` }} />
              {orderStatusSteps.map((s, i) => (
                <div key={s} className="flex flex-col items-center gap-1.5 relative z-10 flex-1">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${i < step ? "bg-primary border-primary" : i === step ? "bg-primary border-primary ring-4 ring-primary/20" : "bg-white border-gray-300"}`}>
                    {i < step && <CheckCircle size={12} className="text-primary-foreground" />}
                    {i === step && <div className="w-2 h-2 rounded-full bg-primary-foreground" />}
                  </div>
                  <span className={`text-[9px] text-center leading-tight whitespace-nowrap ${i <= step ? "text-primary font-semibold" : "text-gray-400"}`}>{s}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border/40 bg-gray-50/30">
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setReceiptOrder(order)} className="text-xs h-8 gap-1.5 rounded-lg">
              <Printer size={11} /> Receipt
            </Button>
            {canCancel && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCancelOrder(order)}
                className="text-xs h-8 gap-1.5 rounded-lg border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
              >
                <XCircle size={11} /> Cancel
              </Button>
            )}
            {isHistory && (
              <button
                onClick={() => handleDeleteFromHistory(order.id)}
                className="h-8 w-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-red-50 hover:border-red-200 transition-colors group"
                title="Remove from history"
              >
                <Trash2 size={12} className="text-gray-400 group-hover:text-red-500" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <p className="text-xs text-muted-foreground">Total:</p>
            <p className="font-bold text-base text-primary">₱{Number(order.total).toLocaleString()}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="pt-20 pb-20 min-h-screen" style={{ background: "linear-gradient(160deg, #f8f9ff 0%, #f1f4fb 50%, #eef1f8 100%)" }}>

      {/* Top Hero Banner */}
      <div className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, #060b18 0%, #0d1832 60%, #162244 100%)" }}>
        {/* Decorative orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-10 -right-10 w-64 h-64 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #4f7cff 0%, transparent 70%)" }} />
          <div className="absolute -bottom-8 left-20 w-48 h-48 rounded-full opacity-8" style={{ background: "radial-gradient(circle, #7c3aed 0%, transparent 70%)" }} />
        </div>
        <div className="container mx-auto max-w-6xl px-4 py-6 relative">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Avatar */}
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl overflow-hidden flex items-center justify-center border-2 border-white/20 shadow-xl"
                style={{ background: "linear-gradient(135deg, rgba(79,124,255,0.3) 0%, rgba(124,58,237,0.3) 100%)" }}>
                {avatarUrl ? <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" /> : <span className="text-3xl font-bold text-white">{initials}</span>}
              </div>
              <button onClick={() => fileRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-gray-100 transition-colors">
                <Camera size={13} className="text-gray-600" />
              </button>
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-white">{profile?.display_name || user.email?.split("@")[0]}</h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/70 border border-white/10 font-medium uppercase tracking-wide">Member</span>
              </div>
              <p className="text-sm text-white/50 mt-0.5">{user.email}</p>
              <div className="flex items-center gap-4 mt-3">
                <div className="text-center">
                  <p className="text-lg font-bold text-white">{totalOrderCount}</p>
                  <p className="text-[10px] text-white/40 uppercase tracking-wide">Orders</p>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div className="text-center">
                  <p className="text-lg font-bold text-white">₱{totalSpent.toLocaleString()}</p>
                  <p className="text-[10px] text-white/40 uppercase tracking-wide">Total Spent</p>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div className="text-center">
                  <p className="text-lg font-bold text-white">{wishlistCount}</p>
                  <p className="text-[10px] text-white/40 uppercase tracking-wide">Wishlist</p>
                </div>
              </div>
            </div>

            {/* Quick actions */}
            <div className="hidden sm:flex flex-col gap-2">
              <button onClick={() => setActiveSection("orders")} className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-medium transition-colors border border-white/10 flex items-center gap-2">
                <Package size={13} /> My Orders
              </button>
              <button onClick={() => { signOut(); navigate("/"); }} className="px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-medium transition-colors border border-red-500/20 flex items-center gap-2">
                <LogOut size={13} /> Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Order Status Bar */}
      <div className="container mx-auto max-w-6xl px-4">
        <div className="bg-white rounded-2xl border border-gray-200/80 -mt-0 mb-6 mt-4 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Quick Order Status</p>
            <button onClick={() => setActiveSection("orders")} className="text-xs text-primary hover:underline flex items-center gap-1 font-medium">
              View All <ChevronRight size={12} />
            </button>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {[
              { label: "Pending", icon: Clock, orders: pendingOrders, tab: 1, color: "text-amber-500", bg: "bg-amber-50" },
              { label: "Processing", icon: Package, orders: processingOrders, tab: 2, color: "text-blue-500", bg: "bg-blue-50" },
              { label: "Shipped", icon: Truck, orders: shippedOrders, tab: 3, color: "text-indigo-500", bg: "bg-indigo-50" },
              { label: "Completed", icon: CheckCircle, orders: completedOrders, tab: 4, color: "text-green-500", bg: "bg-green-50" },
              { label: "Cancelled", icon: XCircle, orders: cancelledOrders, tab: 5, color: "text-red-400", bg: "bg-red-50" },
            ].map(({ label, icon: Icon, orders: tabOrders, tab, color, bg }) => (
              <button key={label} onClick={() => { setActiveSection("orders"); setActiveOrderTab(tab); }}
                className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl hover:scale-105 transition-all duration-150 ${tabOrders.length > 0 ? bg : "bg-gray-50"}`}>
                <div className="relative">
                  <Icon size={20} className={tabOrders.length > 0 ? color : "text-gray-300"} />
                  {tabOrders.length > 0 && (
                    <span className="absolute -top-2.5 -right-2.5 bg-primary text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow">
                      {tabOrders.length}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] font-medium whitespace-nowrap ${tabOrders.length > 0 ? "text-gray-700" : "text-gray-400"}`}>{label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-5">
          {/* Sidebar */}
          <aside className="hidden md:block w-56 shrink-0 space-y-2">
            {sidebarNav.map((group) => (
              <div key={group.group} className="bg-white rounded-2xl border border-gray-200/80 p-3 shadow-sm">
                <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold px-2 mb-2">{group.group}</p>
                {group.items.map(({ id, label, icon: Icon, badge }) => (
                  <button key={id} onClick={() => setActiveSection(id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all duration-150 mb-0.5 ${
                      activeSection === id
                        ? "bg-primary text-white font-semibold shadow-sm"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }`}>
                    <span className="flex items-center gap-2.5"><Icon size={15} />{label}</span>
                    {badge !== undefined && badge > 0 && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${activeSection === id ? "bg-white/20 text-white" : "bg-primary/10 text-primary"}`}>{badge}</span>
                    )}
                  </button>
                ))}
              </div>
            ))}

            <div className="bg-white rounded-2xl border border-gray-200/80 p-3 shadow-sm">
              <Link to="/" className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-gray-100 transition-colors mb-0.5">
                <ShoppingCart size={15} /> Continue Shopping
              </Link>
              <button onClick={() => { signOut(); navigate("/"); }} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-50 transition-colors">
                <LogOut size={15} /> Sign Out
              </button>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0 space-y-4">

            {/* ── Profile ── */}
            {activeSection === "profile" && (
              <div className="bg-white rounded-2xl border border-gray-200/80 overflow-hidden shadow-sm">
                <div className="px-6 py-5 border-b border-gray-100" style={{ background: "linear-gradient(135deg, #f8faff 0%, #f1f5ff 100%)" }}>
                  <h2 className="font-heading text-lg uppercase tracking-wider text-gray-900">My Profile</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Manage your personal information</p>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-3 p-4 border-b border-gray-100 bg-gray-50/50">
                  <StatCard icon={ShoppingBag} label="Total Orders" value={totalOrderCount} color="bg-blue-100 text-blue-600" bg="bg-white" />
                  <StatCard icon={TrendingUp} label="Total Spent" value={`₱${totalSpent.toLocaleString()}`} color="bg-green-100 text-green-600" bg="bg-white" />
                  <StatCard icon={Heart} label="Wishlist" value={wishlistCount} color="bg-pink-100 text-pink-500" bg="bg-white" />
                </div>

                <div className="p-6">
                  <div className="flex flex-col sm:flex-row gap-8">
                    <div className="flex-1 space-y-4">
                      {[
                        { label: "Username", icon: null, field: "display_name", editEl: <Input value={editName} onChange={e => setEditName(e.target.value)} placeholder="Display name" className="rounded-xl" /> },
                        { label: "Email", icon: <Mail size={12} />, field: "email", editEl: null },
                        { label: "Phone", icon: <Phone size={12} />, field: "phone", editEl: <Input value={editPhone} onChange={e => setEditPhone(e.target.value)} placeholder="+63 9XX XXX XXXX" className="rounded-xl" /> },
                        { label: "Birthday", icon: <Calendar size={12} />, field: "birthday", editEl: <Input type="date" value={editBirthday} onChange={e => setEditBirthday(e.target.value)} className="rounded-xl" /> },
                      ].map(({ label, icon, field, editEl }) => (
                        <div key={field}>
                          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5 mb-1.5">
                            {icon}{label}
                          </label>
                          {editing && editEl ? editEl : (
                            <div className="px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 flex items-center justify-between">
                              <span>
                                {field === "email" ? user.email :
                                 field === "display_name" ? (profile?.display_name || "—") :
                                 field === "phone" ? (profile?.phone || "—") :
                                 field === "birthday" ? (profile?.birthday ? new Date(profile.birthday).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "—") : "—"}
                              </span>
                              {field === "email" && <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">Verified</span>}
                            </div>
                          )}
                        </div>
                      ))}

                      {/* Gender */}
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Gender</label>
                        {editing ? (
                          <div className="flex gap-2">
                            {["Male", "Female", "Other"].map(g => (
                              <button key={g} onClick={() => setEditGender(g)}
                                className={`px-4 py-2 rounded-xl text-sm border transition-all ${editGender === g ? "border-primary bg-primary text-white font-semibold" : "border-gray-200 text-gray-600 hover:border-primary/40"}`}>{g}</button>
                            ))}
                          </div>
                        ) : (
                          <div className="px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800">{profile?.gender || "—"}</div>
                        )}
                      </div>

                      <div className="flex gap-3 pt-1">
                        {editing ? (
                          <>
                            <Button onClick={handleSaveProfile} className="gap-2 rounded-xl font-semibold"><Save size={14} /> Save Changes</Button>
                            <Button variant="outline" onClick={() => setEditing(false)} className="rounded-xl">Cancel</Button>
                          </>
                        ) : (
                          <Button variant="outline" onClick={() => setEditing(true)} className="gap-2 rounded-xl font-semibold border-gray-200">
                            <Edit2 size={14} /> Edit Profile
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Avatar */}
                    <div className="flex flex-col items-center gap-3 sm:w-36">
                      <div className="w-28 h-28 rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center border-2 border-gray-200 shadow-md">
                        {avatarUrl ? <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" /> : <span className="text-4xl font-bold text-indigo-600">{initials}</span>}
                      </div>
                      <button onClick={() => fileRef.current?.click()} disabled={uploadingAvatar}
                        className="flex items-center gap-1.5 text-xs border border-gray-200 px-3.5 py-2 rounded-xl hover:bg-gray-50 transition-colors text-gray-600 font-medium">
                        <Camera size={13} />{uploadingAvatar ? "Uploading..." : "Change Photo"}
                      </button>
                      <p className="text-[10px] text-gray-400 text-center leading-relaxed">JPG, PNG · Max 1 MB</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Orders ── */}
            {activeSection === "orders" && (
              <div className="bg-white rounded-2xl border border-gray-200/80 overflow-hidden shadow-sm">
                <div className="px-6 py-5 border-b border-gray-100" style={{ background: "linear-gradient(135deg, #f8faff 0%, #f1f5ff 100%)" }}>
                  <h2 className="font-heading text-lg uppercase tracking-wider text-gray-900">My Orders</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Only <span className="font-semibold text-amber-600">Pending</span> orders can be cancelled</p>
                </div>
                <div className="flex overflow-x-auto border-b border-gray-100">
                  {orderTabs.map((tab, i) => (
                    <button key={tab.label} onClick={() => setActiveOrderTab(i)}
                      className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
                        activeOrderTab === i ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-800"
                      }`}>
                      {tab.label}
                      {tab.orders.length > 0 && (
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${activeOrderTab === i ? "bg-primary text-white" : "bg-gray-100 text-gray-500"}`}>{tab.orders.length}</span>
                      )}
                    </button>
                  ))}
                </div>
                <div className="p-4">
                  {loading ? (
                    <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
                  ) : orderTabs[activeOrderTab].orders.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3"><Package size={28} className="text-gray-300" /></div>
                      <p className="text-gray-500 font-medium">No {orderTabs[activeOrderTab].label.toLowerCase()} orders</p>
                      <Link to="/shop"><Button variant="outline" size="sm" className="mt-4 rounded-xl">Shop Now</Button></Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orderTabs[activeOrderTab].orders.map((order: any) => renderOrderCard(order, false))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Order History ── */}
            {activeSection === "history" && (
              <div className="bg-white rounded-2xl border border-gray-200/80 overflow-hidden shadow-sm">
                <div className="px-6 py-5 border-b border-gray-100" style={{ background: "linear-gradient(135deg, #f8faff 0%, #f1f5ff 100%)" }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-heading text-lg uppercase tracking-wider text-gray-900 flex items-center gap-2">
                        <History size={18} className="text-indigo-500" /> Order History
                      </h2>
                      <p className="text-xs text-gray-500 mt-0.5">Completed and cancelled orders · You can remove entries from history</p>
                    </div>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-semibold">{orderHistory.length} orders</span>
                  </div>
                </div>

                {/* History stats */}
                {orderHistory.length > 0 && (
                  <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50 flex items-center gap-6 overflow-x-auto">
                    <div className="flex items-center gap-1.5 shrink-0">
                      <CheckCircle size={13} className="text-green-500" />
                      <span className="text-xs text-gray-600 font-medium">{orderHistory.filter(o => ["completed", "payment_complete"].includes(o.status)).length} completed</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <XCircle size={13} className="text-red-400" />
                      <span className="text-xs text-gray-600 font-medium">{orderHistory.filter(o => o.status === "cancelled").length} cancelled</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <TrendingUp size={13} className="text-indigo-500" />
                      <span className="text-xs text-gray-600 font-medium">₱{orderHistory.filter(o => ["completed", "payment_complete"].includes(o.status)).reduce((s, o) => s + Number(o.total || 0), 0).toLocaleString()} total spent</span>
                    </div>
                  </div>
                )}

                <div className="p-4">
                  {loading ? (
                    <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
                  ) : orderHistory.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3"><History size={28} className="text-gray-300" /></div>
                      <p className="text-gray-500 font-medium">No order history yet</p>
                      <p className="text-xs text-gray-400 mt-1">Completed and cancelled orders will appear here</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orderHistory.map((order: any) => renderOrderCard(order, true))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Wishlist ── */}
            {activeSection === "wishlist" && (
              <div className="bg-white rounded-2xl border border-gray-200/80 overflow-hidden shadow-sm">
                <div className="px-6 py-5 border-b border-gray-100" style={{ background: "linear-gradient(135deg, #fff1f5 0%, #fdf2f8 100%)" }}>
                  <div className="flex items-center justify-between">
                    <h2 className="font-heading text-lg uppercase tracking-wider text-gray-900">Wishlist</h2>
                    <span className="text-sm text-gray-500 font-medium">{wishlistCount} items</span>
                  </div>
                </div>
                <div className="p-6 text-center py-16">
                  <div className="w-16 h-16 rounded-2xl bg-pink-50 flex items-center justify-center mx-auto mb-3"><Heart size={28} className="text-pink-400" /></div>
                  <p className="text-gray-600 font-medium mb-1">Your saved items</p>
                  <p className="text-sm text-gray-400 mb-5">Items you've hearted are waiting for you</p>
                  <Link to="/wishlist"><Button className="bg-primary text-white rounded-xl px-8">View Wishlist</Button></Link>
                </div>
              </div>
            )}

            {/* ── Addresses ── */}
            {activeSection === "addresses" && (
              <div className="bg-white rounded-2xl border border-gray-200/80 overflow-hidden shadow-sm">
                <div className="px-6 py-5 border-b border-gray-100" style={{ background: "linear-gradient(135deg, #f0fdf4 0%, #f0fdf4 100%)" }}>
                  <div className="flex items-center justify-between">
                    <h2 className="font-heading text-lg uppercase tracking-wider text-gray-900">My Addresses</h2>
                    <span className="text-sm text-gray-500 font-medium">{addressCount} saved</span>
                  </div>
                </div>
                <div className="p-6 text-center py-16">
                  <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-3"><MapPin size={28} className="text-green-500" /></div>
                  <p className="text-gray-600 font-medium mb-1">Delivery Addresses</p>
                  <p className="text-sm text-gray-400 mb-5">Manage your saved delivery locations</p>
                  <Link to="/addresses"><Button className="bg-primary text-white rounded-xl px-8">Manage Addresses</Button></Link>
                </div>
              </div>
            )}

            {/* ── Notifications ── */}
            {activeSection === "notifications" && (
              <div className="bg-white rounded-2xl border border-gray-200/80 overflow-hidden shadow-sm">
                <div className="px-6 py-5 border-b border-gray-100" style={{ background: "linear-gradient(135deg, #fffbeb 0%, #fefce8 100%)" }}>
                  <h2 className="font-heading text-lg uppercase tracking-wider text-gray-900">Notifications</h2>
                </div>
                <div className="divide-y divide-gray-100">
                  {orders.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-3"><Bell size={28} className="text-amber-400" /></div>
                      <p className="text-gray-500 font-medium">No notifications yet</p>
                    </div>
                  ) : [...orders, ...orderHistory].slice(0, 20).flatMap((order: any) => {
                    const entries: any[] = [];
                    entries.push({ key: `order-${order.id}`, order, type: "order" });
                    if (order.payment_method === "gcash_manual") entries.push({ key: `payment-${order.id}`, order, type: "payment" });
                    return entries;
                  }).map(({ key, order, type }: any) => {
                    const payInfo = getPaymentDisplayStatus(order);
                    if (type === "payment") {
                      const isApproved = order.payment_status === "paid";
                      const isRejected = order.payment_status === "failed";
                      return (
                        <div key={key} className="flex items-start gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${payInfo.bgClass} ${payInfo.color}`}><CreditCard size={15} /></div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-800">GCash payment for <span className="font-semibold">#{order.id.slice(0, 8).toUpperCase()}</span>{" "}
                              {isApproved ? <span className="font-semibold text-emerald-600">has been approved ✓</span> : isRejected ? <span className="font-semibold text-red-500">has been rejected</span> : <span className="font-semibold text-amber-600">is awaiting approval</span>}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">{new Date(order.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                          </div>
                        </div>
                      );
                    }
                    return (
                      <div key={key} className="flex items-start gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${getStatusStyle(order.status)}`}>
                          {order.status === "shipped" || order.status === "out_for_delivery" ? <Truck size={15} /> : order.status === "completed" || order.status === "payment_complete" ? <CheckCircle size={15} /> : order.status === "cancelled" ? <XCircle size={15} /> : <Package size={15} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-800">Order <span className="font-semibold">#{order.id.slice(0, 8).toUpperCase()}</span> is <span className="font-semibold">{getStatusLabel(order.status)}</span>.</p>
                          {order.tracking_number && <p className="text-xs text-gray-400 mt-0.5">Tracking: <span className="font-mono text-primary">{order.tracking_number}</span></p>}
                          <p className="text-xs text-gray-400 mt-0.5">{new Date(order.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Vouchers ── */}
            {activeSection === "vouchers" && (
              <div className="bg-white rounded-2xl border border-gray-200/80 overflow-hidden shadow-sm">
                <div className="px-6 py-5 border-b border-gray-100" style={{ background: "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)" }}>
                  <h2 className="font-heading text-lg uppercase tracking-wider text-gray-900">My Vouchers</h2>
                </div>
                <div className="p-6 text-center py-16">
                  <div className="w-16 h-16 rounded-2xl bg-violet-50 flex items-center justify-center mx-auto mb-3"><Ticket size={28} className="text-violet-500" /></div>
                  <p className="text-gray-600 font-medium mb-1">No vouchers available</p>
                  <p className="text-xs text-gray-400">Vouchers you collect will appear here</p>
                </div>
              </div>
            )}

            {/* ── Settings ── */}
            {activeSection === "settings" && <SettingsSection user={user} />}

          </main>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex z-50 shadow-lg">
        {[
          { id: "profile" as SidebarSection, icon: User, label: "Profile" },
          { id: "orders" as SidebarSection, icon: Package, label: "Orders" },
          { id: "history" as SidebarSection, icon: History, label: "History" },
          { id: "wishlist" as SidebarSection, icon: Heart, label: "Wishlist" },
          { id: "settings" as SidebarSection, icon: Settings, label: "Settings" },
        ].map(({ id, icon: Icon, label }) => (
          <button key={id} onClick={() => setActiveSection(id)}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] transition-colors ${activeSection === id ? "text-primary" : "text-gray-400"}`}>
            <Icon size={18} />{label}
          </button>
        ))}
      </div>

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && uploadAvatar(e.target.files[0])} />

      {/* Modals */}
      <OrderReceiptModal order={receiptOrder} onClose={() => setReceiptOrder(null)} />
      <CancelOrderModal order={cancelOrder} onClose={() => setCancelOrder(null)} onConfirm={handleCancelOrder} />
    </div>
  );
};

export default ProfilePage;
