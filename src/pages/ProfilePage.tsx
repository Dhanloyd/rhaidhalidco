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
  Calendar, X, AlertCircle, CreditCard, Printer
} from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/logo.jpg";

type SidebarSection = "profile" | "orders" | "notifications" | "vouchers" | "wishlist" | "addresses";

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Resolve the item list from an order.
 * Orders can have items in two places:
 *   1. order.order_items  — rows from the order_items table (joined via select)
 *   2. order.items        — JSONB snapshot stored on the order row at checkout time
 * We prefer order_items if it has entries; fall back to the JSONB column.
 */
const resolveOrderItems = (order: any): any[] => {
  if (Array.isArray(order.order_items) && order.order_items.length > 0) {
    return order.order_items;
  }
  if (Array.isArray(order.items) && order.items.length > 0) {
    return order.items;
  }
  return [];
};

/**
 * Returns the unit price from whichever field is available.
 * order_items rows use `unit_price`; JSONB snapshot items use `price`.
 */
const itemUnitPrice = (item: any): number =>
  Number(item.unit_price ?? item.price ?? 0);

/**
 * Determine the "true" payment display status for an order.
 * For GCash manual orders: only show "PAID" when payment_status === "paid" (admin approved).
 * Never show PAID just because the order status moved forward.
 */
const getPaymentDisplayStatus = (order: any): {
  label: string;
  color: string;
  bgClass: string;
  borderClass: string;
} => {
  const method = order.payment_method ?? "";
  const pStatus = order.payment_status ?? "pending";

  // GCash manual — status depends entirely on admin approval
  if (method === "gcash_manual") {
    if (pStatus === "paid") {
      return { label: "Payment Approved ✓", color: "text-emerald-700", bgClass: "bg-emerald-50", borderClass: "border-emerald-200" };
    }
    if (pStatus === "failed") {
      return { label: "Payment Rejected", color: "text-red-700", bgClass: "bg-red-50", borderClass: "border-red-200" };
    }
    // pending / proof_submitted / anything else = still waiting
    return { label: "Payment Pending Approval", color: "text-amber-700", bgClass: "bg-amber-50", borderClass: "border-amber-200" };
  }

  // COD — payment happens on delivery
  if (method === "cod") {
    if (pStatus === "paid" || order.status === "completed") {
      return { label: "Paid (COD)", color: "text-emerald-700", bgClass: "bg-emerald-50", borderClass: "border-emerald-200" };
    }
    return { label: "Pay on Delivery", color: "text-blue-700", bgClass: "bg-blue-50", borderClass: "border-blue-200" };
  }

  // PayMongo (gcash, card, grab_pay) — rely on payment_status field
  if (pStatus === "paid") {
    return { label: "Payment Confirmed ✓", color: "text-emerald-700", bgClass: "bg-emerald-50", borderClass: "border-emerald-200" };
  }
  if (pStatus === "failed") {
    return { label: "Payment Failed", color: "text-red-700", bgClass: "bg-red-50", borderClass: "border-red-200" };
  }
  return { label: "Payment Pending", color: "text-amber-700", bgClass: "bg-amber-50", borderClass: "border-amber-200" };
};

// ── GCash Payment Status Badge ────────────────────────────────────────────────
const GCashPaymentStatusBadge = ({ order }: { order: any }) => {
  const info = getPaymentDisplayStatus(order);
  const Icon =
    info.bgClass.includes("emerald") ? CheckCircle :
    info.bgClass.includes("red")     ? XCircle     :
    Clock;

  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium ${info.bgClass} ${info.borderClass} ${info.color}`}>
      <Icon size={11} />
      {info.label}
    </div>
  );
};

// ── Order Receipt Modal ───────────────────────────────────────────────────────
const OrderReceiptModal = ({ order, onClose }: { order: any | null; onClose: () => void }) => {
  if (!order) return null;

  const fmt = (n: number) =>
    n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // ── Resolve items from both possible sources ──────────────────────────────
  const orderItems  = resolveOrderItems(order);
  const grandTotal  = Number(order.total || 0);
  const subtotal    = Number(order.subtotal || grandTotal);
  const discount    = Number(order.discount || 0);
  const shippingFee = Number(order.shipping_fee || 0);
  const totalQty    = orderItems.reduce((s: number, i: any) => s + (i.quantity ?? 1), 0);

  const orderDate = new Date(order.created_at).toLocaleString("en-PH", {
    year: "numeric", month: "long", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  const pmLabels: Record<string, string> = {
    cod:          "Cash on Delivery",
    gcash:        "GCash / GrabPay",
    card:         "Credit / Debit Card",
    gcash_manual: "GCash (Manual Transfer)",
  };

  const payInfo       = getPaymentDisplayStatus(order);
  const receiptNumber = order.id?.slice(0, 8).toUpperCase();

  const handlePrint = () => {
    const content = document.getElementById("profile-receipt-print");
    if (!content) return;
    const win = window.open("", "_blank", "width=600,height=900");
    if (!win) return;
    win.document.write(`
      <html>
        <head>
          <title>Receipt - Order #${receiptNumber}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');
            body { margin: 0; padding: 20px; background: #fff; font-family: 'Outfit', sans-serif; }
            * { box-sizing: border-box; }
          </style>
        </head>
        <body>${content.outerHTML}</body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 500);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal toolbar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-2">
            <Printer size={15} className="text-indigo-500" />
            <span className="font-semibold text-gray-800 text-sm">
              Receipt #{receiptNumber}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
            >
              <Printer size={12} /> Print
            </button>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            >
              <X size={14} className="text-gray-500" />
            </button>
          </div>
        </div>

        {/* Scrollable receipt */}
        <div className="overflow-y-auto flex-1 bg-gray-50">
          <div id="profile-receipt-print">

            {/* Dark header with logo */}
            <div style={{ background: "linear-gradient(135deg, #060b18 0%, #0f1f3d 100%)", padding: "24px 20px 20px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
              <img
                src={logo}
                alt="RaidKhalid & Co."
                style={{ width: "60px", height: "60px", objectFit: "contain", borderRadius: "10px", border: "2px solid rgba(255,255,255,0.15)" }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
              <div>
                <p style={{ fontFamily: "sans-serif", fontSize: "1.3rem", fontWeight: 900, letterSpacing: ".06em", color: "#fff", marginBottom: "4px", marginTop: 0, textTransform: "uppercase" }}>
                  RaidKhalid &amp; Co.
                </p>
                <p style={{ fontSize: "11px", color: "rgba(255,255,255,.45)", margin: "0 0 2px" }}>Official Order Receipt</p>
                <p style={{ fontSize: "10px", color: "rgba(255,255,255,.3)", margin: 0 }}>{orderDate}</p>
              </div>
            </div>

            {/* Meta grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderBottom: "1px solid rgba(10,13,20,.08)", background: "#fff" }}>
              {[
                { label: "Order #",   value: `#${receiptNumber}` },
                { label: "Date",      value: new Date(order.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }) },
                { label: "Customer",  value: order.customer_name || order.shipping_name || "—" },
                { label: "Payment",   value: pmLabels[order.payment_method] ?? (order.payment_method || "—") },
              ].map((m, i) => (
                <div key={i} style={{
                  padding: "10px 16px",
                  borderBottom: i < 2 ? "1px solid rgba(10,13,20,.06)" : "none",
                  borderRight: i % 2 === 0 ? "1px solid rgba(10,13,20,.06)" : "none",
                }}>
                  <p style={{ fontSize: "9px", fontWeight: 800, letterSpacing: ".16em", textTransform: "uppercase", color: "rgba(10,13,20,.35)", marginBottom: "2px", marginTop: 0 }}>{m.label}</p>
                  <p style={{ fontSize: "12px", fontWeight: 700, color: "#0a0d14", margin: 0 }}>{m.value}</p>
                </div>
              ))}
            </div>

            {/* Payment status banner */}
            <div style={{
              padding: "8px 16px",
              background: payInfo.bgClass.includes("emerald") ? "#f0fdf4" : payInfo.bgClass.includes("red") ? "#fef2f2" : "#fffbeb",
              borderBottom: "1px solid rgba(10,13,20,.06)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <span style={{ fontSize: "11px", color: "rgba(10,13,20,.5)", fontWeight: 600 }}>Payment Status</span>
              <span style={{
                fontSize: "11px", fontWeight: 700,
                color: payInfo.bgClass.includes("emerald") ? "#15803d" : payInfo.bgClass.includes("red") ? "#b91c1c" : "#b45309",
              }}>
                {payInfo.label}
              </span>
            </div>

            {/* Ship To */}
            {(order.shipping_name || order.customer_name || order.shipping_address) && (
              <div style={{ padding: "12px 16px 0", background: "#fff" }}>
                <div style={{ background: "rgba(10,13,20,.02)", border: "1px solid rgba(10,13,20,.07)", borderRadius: "8px", padding: "10px 12px" }}>
                  <p style={{ fontSize: "9px", fontWeight: 800, letterSpacing: ".16em", textTransform: "uppercase", color: "rgba(10,13,20,.35)", marginBottom: "6px", marginTop: 0 }}>Ship To</p>
                  <p style={{ fontSize: "12px", fontWeight: 700, color: "#0a0d14", margin: "0 0 2px" }}>
                    {order.shipping_name || order.customer_name}
                  </p>
                  {order.shipping_phone && (
                    <p style={{ fontSize: "11px", color: "rgba(10,13,20,.5)", margin: "0 0 1px" }}>{order.shipping_phone}</p>
                  )}
                  {order.shipping_address && (
                    <p style={{ fontSize: "11px", color: "rgba(10,13,20,.5)", margin: 0 }}>
                      {typeof order.shipping_address === "object"
                        ? `${order.shipping_address.address || ""}, ${order.shipping_address.city || ""}`
                        : order.shipping_address}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Items section */}
            <div style={{ padding: "14px 16px 0", background: "#fff" }}>
              <p style={{ fontSize: "9px", fontWeight: 800, letterSpacing: ".16em", textTransform: "uppercase", color: "rgba(10,13,20,.35)", marginBottom: "8px", marginTop: 0 }}>
                Items Ordered
              </p>

              {/* Header row */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 52px 36px 64px", padding: "5px 8px", background: "rgba(10,13,20,.04)", borderRadius: "5px", marginBottom: "4px" }}>
                {["Item", "Size/Color", "Qty", "Amount"].map(h => (
                  <span key={h} style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "rgba(10,13,20,.4)", textAlign: h !== "Item" ? "center" : "left" }}>{h}</span>
                ))}
              </div>

              {orderItems.length === 0 ? (
                <div style={{ textAlign: "center", padding: "16px 0" }}>
                  <p style={{ fontSize: "12px", color: "rgba(10,13,20,.35)", margin: 0 }}>No item details available</p>
                </div>
              ) : orderItems.map((item: any, i: number) => {
                const name   = item.product_name ?? item.name ?? "Item";
                const qty    = item.quantity ?? 1;
                const price  = itemUnitPrice(item);
                const size   = item.selected_size ?? item.size ?? null;
                const color  = item.selected_color ?? item.color ?? null;
                const colorHex = item.selected_color_hex ?? null;
                const waist  = item.selected_waist ?? item.waist ?? null;
                const length = item.selected_length ?? item.length ?? null;
                const sizeLabel = waist && length ? `W${waist}/L${length}` : size ?? null;

                return (
                  <div key={i} style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 52px 36px 64px",
                    padding: "8px 8px",
                    alignItems: "center",
                    borderBottom: i < orderItems.length - 1 ? "1px solid rgba(10,13,20,.05)" : "none",
                  }}>
                    {/* Name + price per unit */}
                    <div>
                      <p style={{ fontSize: "11px", fontWeight: 600, color: "#0a0d14", lineHeight: 1.3, margin: 0 }}>{name}</p>
                      <p style={{ fontSize: "9px", color: "rgba(10,13,20,.4)", margin: "2px 0 0" }}>@ ₱{fmt(price)}</p>
                    </div>

                    {/* Size / Color */}
                    <div style={{ textAlign: "center" }}>
                      {sizeLabel ? (
                        <span style={{
                          display: "inline-block",
                          fontSize: "9px", fontWeight: 700,
                          padding: "2px 5px", borderRadius: "3px",
                          background: waist && length ? "rgba(26,86,219,.08)" : "rgba(10,13,20,.06)",
                          color: waist && length ? "#1a56db" : "#0a0d14",
                          fontFamily: waist && length ? "monospace" : "inherit",
                          textTransform: "uppercase",
                        }}>
                          {sizeLabel}
                        </span>
                      ) : null}
                      {color ? (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "3px", marginTop: sizeLabel ? "3px" : "0" }}>
                          {colorHex && (
                            <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: colorHex, border: "1px solid rgba(10,13,20,.2)", flexShrink: 0, display: "inline-block" }} />
                          )}
                          <span style={{ fontSize: "9px", color: "rgba(10,13,20,.5)", fontWeight: 600 }}>{color}</span>
                        </div>
                      ) : null}
                      {!sizeLabel && !color && (
                        <span style={{ fontSize: "10px", color: "rgba(10,13,20,.3)" }}>—</span>
                      )}
                    </div>

                    {/* Qty */}
                    <div style={{ textAlign: "center", fontSize: "12px", fontWeight: 700, color: "#0a0d14" }}>
                      ×{qty}
                    </div>

                    {/* Line total */}
                    <div style={{ textAlign: "right", fontSize: "12px", fontWeight: 800, color: "#0a0d14" }}>
                      ₱{fmt(price * qty)}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary row */}
            <div style={{ margin: "10px 16px 0", padding: "10px 12px", background: "rgba(10,13,20,.03)", borderRadius: "8px", border: "1px solid rgba(10,13,20,.07)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <p style={{ fontSize: "9px", letterSpacing: ".12em", textTransform: "uppercase", color: "rgba(10,13,20,.35)", marginBottom: "2px", marginTop: 0 }}>Total Items</p>
                <p style={{ fontSize: "14px", fontWeight: 800, color: "#0a0d14", margin: 0 }}>{orderItems.length} style{orderItems.length !== 1 ? "s" : ""} · {totalQty} pc{totalQty !== 1 ? "s" : ""}</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: "9px", letterSpacing: ".12em", textTransform: "uppercase", color: "rgba(10,13,20,.35)", marginBottom: "2px", marginTop: 0 }}>Grand Total</p>
                <p style={{ fontSize: "18px", fontWeight: 800, color: "#0a0d14", margin: 0 }}>₱{fmt(grandTotal)}</p>
              </div>
            </div>

            {/* Totals breakdown */}
            <div style={{ padding: "12px 16px 0", background: "#fff" }}>
              <div style={{ background: "rgba(10,13,20,.02)", borderRadius: "8px", border: "1px solid rgba(10,13,20,.07)", overflow: "hidden" }}>
                {[
                  { label: `Subtotal (${totalQty} pc${totalQty !== 1 ? "s" : ""})`, value: `₱${fmt(subtotal)}`, green: false },
                  ...(discount > 0 ? [{ label: "Discount", value: `-₱${fmt(discount)}`, green: true }] : []),
                  { label: "Shipping", value: shippingFee === 0 ? "FREE" : `₱${fmt(shippingFee)}`, green: shippingFee === 0 },
                ].map((row, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "7px 12px", borderBottom: "1px solid rgba(10,13,20,.05)" }}>
                    <span style={{ fontSize: "11px", color: "rgba(10,13,20,.5)" }}>{row.label}</span>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: row.green ? "#16a34a" : "#0a0d14" }}>{row.value}</span>
                  </div>
                ))}

                {/* Grand total dark bar */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 12px", background: "#0a0d14" }}>
                  <span style={{ fontWeight: 900, fontSize: ".95rem", letterSpacing: ".04em", color: "rgba(255,255,255,.65)", textTransform: "uppercase" }}>TOTAL (incl. VAT)</span>
                  <span style={{ fontWeight: 900, fontSize: "1.2rem", color: "#fff" }}>₱{fmt(grandTotal)}</span>
                </div>

                {/* Payment status row — never says PAID for pending GCash */}
                <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 12px" }}>
                  <span style={{ fontSize: "11px", color: "rgba(10,13,20,.5)" }}>Payment Status</span>
                  <span style={{
                    fontSize: "11px", fontWeight: 700,
                    color: payInfo.bgClass.includes("emerald") ? "#15803d" : payInfo.bgClass.includes("red") ? "#b91c1c" : "#b45309",
                  }}>
                    {payInfo.label}
                  </span>
                </div>
              </div>
            </div>

            {/* Tracking */}
            {order.tracking_number && (
              <div style={{ padding: "12px 16px 0", background: "#fff" }}>
                <div style={{ background: "rgba(26,86,219,.04)", border: "1px solid rgba(26,86,219,.12)", borderRadius: "8px", padding: "10px 12px" }}>
                  <p style={{ fontSize: "9px", fontWeight: 800, letterSpacing: ".16em", textTransform: "uppercase", color: "rgba(10,13,20,.35)", marginBottom: "6px", marginTop: 0 }}>Tracking Info</p>
                  {order.courier && (
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                      <span style={{ fontSize: "11px", color: "rgba(10,13,20,.45)" }}>Courier</span>
                      <span style={{ fontSize: "11px", fontWeight: 700, color: "#0a0d14" }}>{order.courier}</span>
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "11px", color: "rgba(10,13,20,.45)" }}>Tracking #</span>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#1a56db", fontFamily: "monospace" }}>{order.tracking_number}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div style={{ padding: "14px 16px 20px", textAlign: "center", borderTop: "1px solid rgba(10,13,20,.06)", marginTop: "14px", background: "#fff" }}>
              <p style={{ fontSize: "10px", color: "rgba(10,13,20,.35)", lineHeight: 1.7, margin: 0 }}>
                Thank you for your purchase!<br />
                <strong style={{ color: "rgba(10,13,20,.5)" }}>This is your official receipt from RaidKhalid &amp; Co.</strong>
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

// ── Main Profile Page ─────────────────────────────────────────────────────────
const ProfilePage = () => {
  const { user, signOut, displayName } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const fileRef  = useRef<HTMLInputElement>(null);

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
  const [receiptOrder, setReceiptOrder]   = useState<any>(null);

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

    // Real-time: re-fetch orders when admin updates status OR payment_status
    const channel = supabase
      .channel("profile-orders-realtime")
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "orders",
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        setOrders(prev => {
          const updated = prev.map(o =>
            o.id === payload.new.id ? { ...o, ...payload.new } : o
          );

          const oldOrder = prev.find(o => o.id === payload.new.id);
          if (oldOrder && oldOrder.payment_status !== payload.new.payment_status) {
            if (payload.new.payment_status === "paid") {
              toast.success(`💙 GCash payment approved for order #${payload.new.id.slice(0, 8).toUpperCase()}!`);
            } else if (payload.new.payment_status === "failed") {
              toast.error(`Payment rejected for order #${payload.new.id.slice(0, 8).toUpperCase()}. Please contact support.`);
            }
          }

          return updated;
        });
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

  // ── Status groupings ──────────────────────────────────────────────────────
  const pendingOrders    = orders.filter(o => o.status === "pending");
  const processingOrders = orders.filter(o => ["confirmed", "packed"].includes(o.status));
  const shippedOrders    = orders.filter(o => ["shipped", "out_for_delivery", "delivered", "arrived"].includes(o.status));
  const completedOrders  = orders.filter(o => ["completed", "payment_complete"].includes(o.status));
  const cancelledOrders  = orders.filter(o => o.status === "cancelled");

  const orderTabs = [
    { label: "All",        icon: Package,     orders: orders           },
    { label: "Pending",    icon: Clock,       orders: pendingOrders    },
    { label: "Processing", icon: Package,     orders: processingOrders },
    { label: "Shipped",    icon: Truck,       orders: shippedOrders    },
    { label: "Completed",  icon: CheckCircle, orders: completedOrders  },
    { label: "Cancelled",  icon: XCircle,     orders: cancelledOrders  },
  ];

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
      payment_complete: 5,
    };
    return map[status] ?? 0;
  };

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
      payment_complete: "bg-teal-100 text-teal-700",
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
      payment_complete: "Payment Complete",
      cancelled:        "Cancelled",
    };
    return labels[status] || status;
  };

  const handleSaveProfile = async () => {
    const { error } = await supabase.from("profiles").update({
      display_name: editName,
      phone:        editPhone,
      birthday:     editBirthday,
      gender:       editGender,
    }).eq("user_id", user.id);
    if (error) { toast.error("Failed to update profile"); return; }
    toast.success("Profile updated!");
    setEditing(false);
    setProfile({ ...profile, display_name: editName, phone: editPhone, birthday: editBirthday, gender: editGender });
  };

  const uploadAvatar = async (file: File) => {
    setUploadingAvatar(true);
    const ext      = file.name.split(".").pop();
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
        { id: "profile"       as SidebarSection, label: "My Profile",    icon: User   },
        { id: "addresses"     as SidebarSection, label: "Addresses",     icon: MapPin,  badge: addressCount },
        { id: "notifications" as SidebarSection, label: "Notifications", icon: Bell   },
        { id: "vouchers"      as SidebarSection, label: "Vouchers",      icon: Ticket },
      ]
    },
    {
      group: "Shopping",
      items: [
        { id: "orders"   as SidebarSection, label: "My Orders", icon: Package, badge: orders.length },
        { id: "wishlist" as SidebarSection, label: "Wishlist",  icon: Heart,   badge: wishlistCount },
      ]
    }
  ];

  return (
    <div className="pt-20 pb-16 bg-muted min-h-screen">
      <div className="container mx-auto max-w-6xl px-4">

        {/* Order status bar */}
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
          {/* Sidebar */}
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

          {/* Main Content */}
          <main className="flex-1 min-w-0">

            {/* Profile Section */}
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

            {/* Orders Section */}
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
                        const step          = getStatusStep(order.status);
                        const isCancelled   = order.status === "cancelled";
                        const isGCashManual = order.payment_method === "gcash_manual";
                        // Use resolved items — handles both order_items rows and JSONB snapshot
                        const orderItems    = resolveOrderItems(order);
                        const payInfo       = getPaymentDisplayStatus(order);

                        return (
                          <div key={order.id} className="border border-border/50 rounded-xl overflow-hidden">

                            {/* Order header */}
                            <div className="flex items-center justify-between px-4 py-3 bg-muted/40 border-b border-border/50">
                              <p className="text-xs font-mono text-muted-foreground">
                                Order #{order.id.slice(0, 8).toUpperCase()}
                              </p>
                              <div className="flex items-center gap-3 flex-wrap justify-end">
                                <p className="text-xs text-muted-foreground">
                                  {new Date(order.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                </p>
                                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full uppercase tracking-wide ${getStatusStyle(order.status)}`}>
                                  {getStatusLabel(order.status)}
                                </span>
                              </div>
                            </div>

                            {/* Payment status banner — always shown, uses the smart helper */}
                            <div className={`px-4 py-2.5 border-b border-border/40 flex items-center justify-between gap-3 flex-wrap ${payInfo.bgClass}`}>
                              <div className="flex items-center gap-2">
                                <CreditCard size={13} className={payInfo.color} />
                                <span className="text-xs text-muted-foreground font-medium capitalize">
                                  {order.payment_method?.replace(/_/g, " ") || "Payment"}
                                </span>
                              </div>
                              <GCashPaymentStatusBadge order={order} />
                            </div>

                            {/* Items */}
                            <div className="px-4 py-3 space-y-2">
                              {orderItems.length === 0 ? (
                                <p className="text-xs text-muted-foreground italic">No item details available</p>
                              ) : orderItems.slice(0, 3).map((item: any, i: number) => {
                                const price = itemUnitPrice(item);
                                const qty   = item.quantity ?? 1;
                                const name  = item.product_name ?? item.name ?? "Item";
                                return (
                                  <div key={i} className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                                      {item.product_image
                                        ? <img src={item.product_image} alt={name} className="w-full h-full object-cover" />
                                        : <Package size={18} className="text-muted-foreground/50" />
                                      }
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm text-foreground truncate">{name}</p>
                                      <div className="flex gap-2 mt-0.5 flex-wrap items-center">
                                        {(item.selected_size ?? item.size) && (
                                          <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                            {item.selected_size ?? item.size}
                                          </span>
                                        )}
                                        {(item.selected_color ?? item.color) && (
                                          <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded flex items-center gap-1">
                                            {(item.selected_color_hex ?? item.color_hex) && (
                                              <span
                                                style={{ background: item.selected_color_hex ?? item.color_hex }}
                                                className="w-2 h-2 rounded-full inline-block border border-border"
                                              />
                                            )}
                                            {item.selected_color ?? item.color}
                                          </span>
                                        )}
                                        <span className="text-[10px] text-muted-foreground">×{qty}</span>
                                      </div>
                                    </div>
                                    <p className="text-sm font-medium text-foreground shrink-0">
                                      ₱{(price * qty).toLocaleString()}
                                    </p>
                                  </div>
                                );
                              })}
                              {orderItems.length > 3 && (
                                <p className="text-xs text-primary">+{orderItems.length - 3} more items</p>
                              )}
                            </div>

                            {/* Progress tracker */}
                            {!isCancelled && (
                              <div className="px-4 py-4 border-t border-border/50 bg-muted/20">
                                <div className="flex items-start justify-between relative">
                                  <div className="absolute left-0 right-0 top-3 h-0.5 bg-border mx-3" />
                                  <div
                                    className="absolute top-3 h-0.5 bg-primary transition-all duration-700 mx-3"
                                    style={{ left: 0, width: `${(step / (orderStatusSteps.length - 1)) * 100}%` }}
                                  />
                                  {orderStatusSteps.map((s, i) => (
                                    <div key={s} className="flex flex-col items-center gap-1.5 relative z-10 flex-1">
                                      <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                                        i < step  ? "bg-primary border-primary" :
                                        i === step ? "bg-primary border-primary ring-4 ring-primary/20" :
                                        "bg-card border-border"
                                      }`}>
                                        {i < step  && <CheckCircle size={12} className="text-primary-foreground" />}
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
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setReceiptOrder(order)}
                                className="text-xs flex items-center gap-1.5"
                              >
                                <Printer size={12} /> View Receipt
                              </Button>
                              <div className="flex items-center gap-1.5">
                                <p className="text-xs text-muted-foreground">Total:</p>
                                <p className="font-heading text-base text-primary">
                                  ₱{Number(order.total).toLocaleString()}
                                </p>
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

            {/* Wishlist */}
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

            {/* Addresses */}
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

            {/* Notifications */}
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
                  ) : orders.slice(0, 20).flatMap((order: any) => {
                    const entries: any[] = [];
                    entries.push({ key: `order-${order.id}`, order, type: "order" });
                    if (order.payment_method === "gcash_manual") {
                      entries.push({ key: `payment-${order.id}`, order, type: "payment" });
                    }
                    return entries;
                  }).map(({ key, order, type }: any) => {
                    const payInfo = getPaymentDisplayStatus(order);
                    if (type === "payment") {
                      const isApproved = order.payment_status === "paid";
                      const isRejected = order.payment_status === "failed";
                      return (
                        <div key={key} className="flex items-start gap-4 px-6 py-4 hover:bg-muted/30 transition-colors">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${payInfo.bgClass} ${payInfo.color}`}>
                            <CreditCard size={15} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-foreground">
                              GCash payment for order{" "}
                              <span className="font-medium">#{order.id.slice(0, 8).toUpperCase()}</span>{" "}
                              {isApproved ? (
                                <span className="font-semibold text-emerald-600">has been approved ✓</span>
                              ) : isRejected ? (
                                <span className="font-semibold text-red-500">has been rejected</span>
                              ) : (
                                <span className="font-semibold text-amber-600">is awaiting approval</span>
                              )}
                            </p>
                            {isRejected && (
                              <p className="text-xs text-muted-foreground mt-0.5">Please contact support if you believe this is an error.</p>
                            )}
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {new Date(order.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </p>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={key} className="flex items-start gap-4 px-6 py-4 hover:bg-muted/30 transition-colors">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${getStatusStyle(order.status)}`}>
                          {order.status === "shipped" || order.status === "out_for_delivery" ? <Truck size={15} /> :
                           order.status === "completed" || order.status === "payment_complete" ? <CheckCircle size={15} /> :
                           order.status === "cancelled"  ? <XCircle size={15} />    :
                           <Package size={15} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground">
                            Your order{" "}
                            <span className="font-medium">#{order.id.slice(0, 8).toUpperCase()}</span>{" "}
                            is{" "}
                            <span className={`font-semibold`}>
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
                    );
                  })}
                </div>
              </div>
            )}

            {/* Vouchers */}
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
            { id: "profile"       as SidebarSection, icon: User,    label: "Profile"  },
            { id: "orders"        as SidebarSection, icon: Package, label: "Orders"   },
            { id: "wishlist"      as SidebarSection, icon: Heart,   label: "Wishlist" },
            { id: "addresses"     as SidebarSection, icon: MapPin,  label: "Address"  },
            { id: "notifications" as SidebarSection, icon: Bell,    label: "Alerts"   },
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

      {/* Receipt Modal */}
      <OrderReceiptModal order={receiptOrder} onClose={() => setReceiptOrder(null)} />
    </div>
  );
};

export default ProfilePage;
