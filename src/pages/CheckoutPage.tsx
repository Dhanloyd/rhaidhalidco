import { useState, useEffect, useRef } from "react";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import {
  ShoppingCart, MapPin, CreditCard, CheckCircle,
  ChevronRight, ChevronLeft, ExternalLink, Loader2,
  Upload, Copy, Clock, ImageIcon, Printer,
} from "lucide-react";
import logo from "@/assets/logo.jpg";

const steps = ["Shipping", "Review", "Payment", "Confirmation"];
const VERCEL_API = "https://rhaidhalidco-buy3.vercel.app/api/create-paymongo-checkout";

const generateReference = () => "PAY-" + Math.floor(10000 + Math.random() * 90000).toString();

// ── Zalora-style Receipt ─────────────────────────────────────────────────────
const ZaloraReceipt = ({
  orderId, items, shipping, subtotal, discount,
  shippingFee, grandTotal, paymentMethod, userEmail, appliedVoucher,
}: {
  orderId: string;
  items: any[];
  shipping: { full_name: string; phone: string; address_line: string; city: string; province: string; zip_code: string };
  subtotal: number;
  discount: number;
  shippingFee: number;
  grandTotal: number;
  paymentMethod: string;
  userEmail: string;
  appliedVoucher: any;
}) => {
  const orderDate  = new Date().toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" });
  const shortId    = orderId?.slice(0, 8).toUpperCase();
  const vatRate    = 0.12;
  const vatableSales = grandTotal / (1 + vatRate);
  const vatAmount  = grandTotal - vatableSales;
  const totalQty   = items.reduce((sum: number, item: any) => sum + (item.quantity ?? 1), 0);
  const totalStyles = items.length;

  const pmLabels: Record<string, string> = {
    cod:          "Cash on Delivery",

  
    card:         "Credit / Debit Card",
    gcash_manual: "GCash (Manual Transfer)",
  };

  const fmt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const getSizeLabel = (item: any): string => {
    const waist  = item.selected_waist  ?? item.waist  ?? null;
    const length = item.selected_length ?? item.length ?? null;
    if (waist && length) return `W${waist}/L${length}`;
    return item.selected_size ?? item.size ?? "";
  };

  const isBottomItem = (item: any): boolean => {
    const waist  = item.selected_waist  ?? item.waist  ?? null;
    const length = item.selected_length ?? item.length ?? null;
    return !!(waist && length);
  };

  return (
    <div style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
      <div style={{ background: "linear-gradient(135deg,#060b18 0%,#0f1f3d 100%)", padding: "24px 20px 20px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
        <img src={logo} alt="RaidKhalid & Co." style={{ width: "64px", height: "64px", objectFit: "contain", borderRadius: "12px", border: "2px solid rgba(255,255,255,0.15)" }}
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
        <div>
          <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.4rem", letterSpacing: ".08em", color: "#fff", marginBottom: "4px" }}>RaidKhalid &amp; Co.</p>
          <p style={{ fontSize: "11px", color: "rgba(255,255,255,.45)", marginBottom: "2px" }}>Online Order Confirmation</p>
          <p style={{ fontSize: "10px", color: "rgba(255,255,255,.3)" }}>{userEmail}</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderBottom: "1px solid rgba(10,13,20,.08)" }}>
        {[
          { label: "Order #",   value: `#${shortId}` },
          { label: "Date",      value: orderDate },
          { label: "Customer",  value: shipping.full_name },
          { label: "Payment",   value: pmLabels[paymentMethod] ?? paymentMethod },
        ].map((m, i) => (
          <div key={i} style={{ padding: "10px 16px", borderBottom: i < 2 ? "1px solid rgba(10,13,20,.06)" : "none", borderRight: i % 2 === 0 ? "1px solid rgba(10,13,20,.06)" : "none" }}>
            <p style={{ fontSize: "9px", fontWeight: 800, letterSpacing: ".16em", textTransform: "uppercase", color: "rgba(10,13,20,.35)", marginBottom: "2px" }}>{m.label}</p>
            <p style={{ fontSize: "12px", fontWeight: 700, color: "#0a0d14" }}>{m.value}</p>
          </div>
        ))}
      </div>

      <div style={{ padding: "16px 16px 0" }}>
        <p style={{ fontSize: "9px", fontWeight: 800, letterSpacing: ".16em", textTransform: "uppercase", color: "rgba(10,13,20,.35)", marginBottom: "8px" }}>Items Ordered</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 60px 44px 64px", padding: "6px 8px", background: "rgba(10,13,20,.04)", borderRadius: "5px", marginBottom: "4px" }}>
          {["Item", "Size / Color", "Qty", "Amount"].map(h => (
            <span key={h} style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "rgba(10,13,20,.4)", textAlign: h !== "Item" ? "center" : "left" }}>{h}</span>
          ))}
        </div>
        {items.map((item: any, i: number) => {
          const sizeLabel = getSizeLabel(item);
          const isBottom  = isBottomItem(item);
          const waist     = item.selected_waist  ?? item.waist  ?? null;
          const length    = item.selected_length ?? item.length ?? null;
          const color     = item.selected_color  ?? item.color  ?? null;
          const colorHex  = item.selected_color_hex ?? null;
          const unitPrice = item.price ?? item.product?.price ?? 0;
          const qty       = item.quantity ?? 1;
          return (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 60px 44px 64px", padding: "8px 8px", alignItems: "center", borderBottom: i < items.length - 1 ? "1px solid rgba(10,13,20,.05)" : "none" }}>
              <div>
                <p style={{ fontSize: "11px", fontWeight: 600, color: "#0a0d14", lineHeight: 1.3 }}>{item.name ?? item.product?.name}</p>
                <p style={{ fontSize: "10px", color: "rgba(10,13,20,.4)", marginTop: "1px" }}>@ ₱{fmt(unitPrice)}</p>
              </div>
              <div style={{ textAlign: "center" }}>
                {isBottom ? (
                  <span style={{ display: "inline-block", fontSize: "9px", fontWeight: 800, padding: "2px 4px", borderRadius: "3px", background: "rgba(26,86,219,.08)", color: "#1a56db", fontFamily: "monospace" }}>W{waist}<br />L{length}</span>
                ) : sizeLabel ? (
                  <span style={{ display: "inline-block", fontSize: "10px", fontWeight: 700, padding: "2px 6px", borderRadius: "3px", background: "rgba(10,13,20,.06)", color: "#0a0d14", textTransform: "uppercase" }}>{sizeLabel}</span>
                ) : null}
                {color && (
                  <div style={{ marginTop: "4px", display: "flex", alignItems: "center", justifyContent: "center", gap: "3px" }}>
                    {colorHex && <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: colorHex, border: "1px solid rgba(10,13,20,.2)", flexShrink: 0, display: "inline-block" }} />}
                    <span style={{ fontSize: "9px", fontWeight: 600, color: "rgba(10,13,20,.5)" }}>{color}</span>
                  </div>
                )}
                {!sizeLabel && !color && <span style={{ fontSize: "10px", color: "rgba(10,13,20,.3)" }}>—</span>}
              </div>
              <div style={{ textAlign: "center", fontSize: "12px", fontWeight: 700, color: "#0a0d14" }}>×{qty}</div>
              <div style={{ textAlign: "right", fontSize: "12px", fontWeight: 800, color: "#0a0d14" }}>₱{fmt(unitPrice * qty)}</div>
            </div>
          );
        })}
      </div>

      <div style={{ margin: "10px 16px 0", padding: "10px 12px", background: "rgba(10,13,20,.03)", borderRadius: "8px", border: "1px solid rgba(10,13,20,.07)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: "20px" }}>
          <div>
            <p style={{ fontSize: "9px", letterSpacing: ".12em", textTransform: "uppercase", color: "rgba(10,13,20,.35)", marginBottom: "2px" }}>Total Items</p>
            <p style={{ fontSize: "15px", fontWeight: 800, color: "#0a0d14", margin: 0 }}>{totalStyles} style{totalStyles !== 1 ? "s" : ""}</p>
          </div>
          <div>
            <p style={{ fontSize: "9px", letterSpacing: ".12em", textTransform: "uppercase", color: "rgba(10,13,20,.35)", marginBottom: "2px" }}>Total Qty</p>
            <p style={{ fontSize: "15px", fontWeight: 800, color: "#0a0d14", margin: 0 }}>{totalQty} pc{totalQty !== 1 ? "s" : ""}</p>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontSize: "9px", letterSpacing: ".12em", textTransform: "uppercase", color: "rgba(10,13,20,.35)", marginBottom: "2px" }}>Total Amount</p>
          <p style={{ fontSize: "18px", fontWeight: 800, color: "#0a0d14", margin: 0 }}>₱{fmt(grandTotal)}</p>
        </div>
      </div>

      <div style={{ padding: "12px 16px 0" }}>
        <div style={{ background: "rgba(10,13,20,.02)", borderRadius: "8px", border: "1px solid rgba(10,13,20,.07)", overflow: "hidden" }}>
          {[
            { label: `Subtotal (${totalQty} pc${totalQty !== 1 ? "s" : ""} · ${totalStyles} style${totalStyles !== 1 ? "s" : ""})`, value: `₱${fmt(subtotal)}` },
            ...(discount > 0 ? [{ label: `Voucher${appliedVoucher?.code ? ` (${appliedVoucher.code})` : ""}`, value: `-₱${fmt(discount)}`, green: true }] : []),
            { label: "Shipping Fee", value: shippingFee === 0 ? "FREE" : `₱${fmt(shippingFee)}`, green: shippingFee === 0 },
          ].map((row, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", borderBottom: "1px solid rgba(10,13,20,.05)" }}>
              <span style={{ fontSize: "11px", color: "rgba(10,13,20,.5)" }}>{row.label}</span>
              <span style={{ fontSize: "11px", fontWeight: 700, color: (row as any).green ? "#16a34a" : "#0a0d14" }}>{row.value}</span>
            </div>
          ))}
          <div style={{ padding: "8px 12px", background: "rgba(10,13,20,.015)", borderBottom: "1px solid rgba(10,13,20,.05)" }}>
            <p style={{ fontSize: "9px", fontWeight: 800, letterSpacing: ".14em", textTransform: "uppercase", color: "rgba(10,13,20,.35)", marginBottom: "5px" }}>VAT Summary (12%)</p>
            {[
              { label: "VATable Sales (ex-VAT)", value: `₱${vatableSales.toFixed(2)}` },
              { label: "VAT 12%",                value: `₱${vatAmount.toFixed(2)}`    },
              { label: "VAT-Exempt Sales",        value: "₱0.00"                        },
              { label: "Zero-Rated Sales",        value: "₱0.00"                        },
            ].map((v, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
                <span style={{ fontSize: "10px", color: "rgba(10,13,20,.4)" }}>{v.label}</span>
                <span style={{ fontSize: "10px", fontWeight: 600, color: "rgba(10,13,20,.55)" }}>{v.value}</span>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 12px", background: "#0a0d14" }}>
            <div>
              <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1rem", letterSpacing: ".06em", color: "rgba(255,255,255,.65)", display: "block" }}>TOTAL (VAT Incl.)</span>
              <span style={{ fontSize: "10px", color: "rgba(255,255,255,.3)" }}>{totalQty} pc{totalQty !== 1 ? "s" : ""} · {totalStyles} style{totalStyles !== 1 ? "s" : ""}</span>
            </div>
            <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.3rem", color: "#fff" }}>₱{fmt(grandTotal)}</span>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderTop: "1px solid rgba(10,13,20,.08)", marginTop: "14px" }}>
        <div style={{ padding: "14px 16px", borderRight: "1px solid rgba(10,13,20,.08)" }}>
          <p style={{ fontSize: "9px", fontWeight: 800, letterSpacing: ".16em", textTransform: "uppercase", color: "rgba(10,13,20,.35)", marginBottom: "8px" }}>Ship To</p>
          <p style={{ fontSize: "12px", fontWeight: 700, color: "#0a0d14", marginBottom: "2px" }}>{shipping.full_name}</p>
          <p style={{ fontSize: "11px", color: "rgba(10,13,20,.5)", marginBottom: "1px" }}>{shipping.phone}</p>
          <p style={{ fontSize: "11px", color: "rgba(10,13,20,.5)", lineHeight: 1.5 }}>
            {shipping.address_line}<br />
            {shipping.city}{shipping.province ? `, ${shipping.province}` : ""}{shipping.zip_code ? ` ${shipping.zip_code}` : ""}
          </p>
        </div>
        <div style={{ padding: "14px 16px" }}>
          <p style={{ fontSize: "9px", fontWeight: 800, letterSpacing: ".16em", textTransform: "uppercase", color: "rgba(10,13,20,.35)", marginBottom: "8px" }}>Delivery Info</p>
          {[
            { icon: "📦", label: "Processing", value: "1–2 business days" },
            { icon: "🚚", label: "Shipping",   value: "3–7 business days" },
            { icon: "💳", label: "Payment",    value: pmLabels[paymentMethod] ?? paymentMethod },
          ].map(d => (
            <div key={d.label} style={{ display: "flex", gap: "7px", alignItems: "flex-start", marginBottom: "7px" }}>
              <span style={{ fontSize: "13px", flexShrink: 0 }}>{d.icon}</span>
              <div>
                <p style={{ fontSize: "10px", fontWeight: 700, color: "#0a0d14" }}>{d.label}</p>
                <p style={{ fontSize: "10px", color: "rgba(10,13,20,.5)" }}>{d.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: "14px 16px", textAlign: "center", borderTop: "1px solid rgba(10,13,20,.06)" }}>
        <p style={{ fontSize: "10px", color: "rgba(10,13,20,.35)", lineHeight: 1.6 }}>
          Thank you for your purchase!<br />
          <strong style={{ color: "rgba(10,13,20,.5)" }}>This is your official order confirmation.</strong>
        </p>
      </div>
    </div>
  );
};

// ── GCash Manual Instruction Page ────────────────────────────────────────────
const GCashInstructionPage = ({
  referenceNumber, amount, gcashNumber, qrImageUrl, onProofUploaded,
}: {
  referenceNumber: string;
  amount: number;
  gcashNumber: string;
  qrImageUrl: string | null;
  onProofUploaded: (url: string) => void;
}) => {
  const [uploading, setUploading] = useState(false);
  const [proofUrl, setProofUrl]   = useState<string | null>(null);
  const [copied, setCopied]       = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please upload an image file"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("File must be under 5MB"); return; }

    setUploading(true);
    try {
      const ext      = file.name.split(".").pop();
      const filename = `gcash-proofs/${referenceNumber}-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("payment-proofs")
        .upload(filename, file, { contentType: file.type });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("payment-proofs").getPublicUrl(filename);
      const publicUrl = urlData.publicUrl;

      await supabase
        .from("gcash_payments")
        .update({ proof_url: publicUrl, status: "proof_submitted" })
        .eq("reference_number", referenceNumber);

      setProofUrl(publicUrl);
      onProofUploaded(publicUrl);
      toast.success("Proof uploaded! Awaiting admin verification.");
    } catch (err: any) {
      toast.error("Upload failed: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const fmt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="max-w-md mx-auto space-y-4">
      <div className="text-center space-y-2 pb-2">
        <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto text-3xl">📱</div>
        <h2 className="font-heading text-xl uppercase tracking-wider text-foreground">GCash Payment</h2>
        <p className="text-sm text-muted-foreground">Complete your payment by sending via GCash</p>
      </div>

      {/* Reference + Amount */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-5 space-y-3">
          {[
            { label: "Reference Number", value: referenceNumber, copyKey: "ref", mono: true, big: false },
            { label: "Amount to Send", value: `₱${fmt(amount)}`, copyKey: "amt", mono: false, big: true },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between p-3 rounded-xl bg-background border border-border">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-0.5">{row.label}</p>
                <p className={`${row.big ? "text-2xl" : "text-lg"} font-heading font-bold ${row.mono ? "font-mono text-primary" : "text-foreground"}`}>{row.value}</p>
              </div>
              <button onClick={() => copyToClipboard(row.copyKey === "ref" ? referenceNumber : amount.toString(), row.copyKey)}
                className="p-2 rounded-lg hover:bg-primary/10 transition-colors text-muted-foreground hover:text-primary">
                {copied === row.copyKey ? <CheckCircle size={16} className="text-green-500" /> : <Copy size={16} />}
              </button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* QR + Number */}
      <Card>
        <CardContent className="pt-5 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground text-center">Send Payment To</p>

          {/* QR Code — fetched live from payment_settings */}
          <div className="flex justify-center">
            <div className="w-48 h-48 rounded-2xl overflow-hidden border border-border bg-muted/30 flex items-center justify-center">
              {qrImageUrl ? (
                <img src={qrImageUrl} alt="GCash QR Code" className="w-full h-full object-contain" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <ImageIcon size={32} className="opacity-30" />
                  <p className="text-xs text-center px-4 opacity-50">QR code not configured</p>
                </div>
              )}
            </div>
          </div>

          {/* GCash Number */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-0.5">GCash Number</p>
              <p className="font-mono text-base font-bold text-foreground">{gcashNumber || "09XX-XXX-XXXX"}</p>
            </div>
            <button onClick={() => copyToClipboard(gcashNumber, "num")}
              className="p-2 rounded-lg hover:bg-primary/10 transition-colors text-muted-foreground hover:text-primary">
              {copied === "num" ? <CheckCircle size={16} className="text-green-500" /> : <Copy size={16} />}
            </button>
          </div>

          <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 space-y-1.5">
            <p className="text-xs font-bold text-amber-600 uppercase tracking-wide">⚠️ Important</p>
            {[
              "Send the EXACT amount shown above",
              `Include reference number "${referenceNumber}" in the message/notes`,
              "Take a screenshot after sending",
            ].map((tip, i) => (
              <p key={i} className="text-xs text-amber-700/80">• {tip}</p>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Proof Upload */}
      <Card className={proofUrl ? "border-green-500/30 bg-green-500/5" : ""}>
        <CardContent className="pt-5 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            {proofUrl ? <CheckCircle size={16} className="text-green-500" /> : <Upload size={16} className="text-muted-foreground" />}
            <p className="text-sm font-semibold text-foreground">
              {proofUrl ? "Proof Submitted!" : "Upload Payment Screenshot"}
            </p>
          </div>

          {proofUrl ? (
            <div className="space-y-2">
              <img src={proofUrl} alt="Payment proof" className="w-full rounded-xl border border-green-500/20 max-h-48 object-cover" />
              <div className="flex items-center gap-2 p-2 rounded-lg bg-green-500/10 border border-green-500/20">
                <Clock size={13} className="text-green-600" />
                <p className="text-xs text-green-700 font-medium">Awaiting admin verification — usually within 1–2 hours</p>
              </div>
              {/* Done Payment Button - only shown after screenshot upload */}
              <Link to="/my-orders">
                <Button className="w-full bg-green-600 hover:bg-green-500 text-white font-medium">
                  <CheckCircle size={16} className="mr-2" /> Done Payment
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="w-full border-2 border-dashed border-border hover:border-primary/50 rounded-xl p-6 text-center transition-all hover:bg-primary/5 disabled:opacity-50 group">
                {uploading ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 size={24} className="animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Uploading...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload size={24} className="text-muted-foreground group-hover:text-primary transition-colors" />
                    <p className="text-sm font-medium text-foreground">Click to upload screenshot</p>
                    <p className="text-xs text-muted-foreground">PNG, JPG up to 5MB</p>
                  </div>
                )}
              </button>
              {/* No screenshot = no button shown (requirement) */}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// ── Order Summary ─────────────────────────────────────────────────────────────
const OrderSummary = ({ items, subtotal, discount, shippingFee, grandTotal, voucherCode, setVoucherCode, applyVoucher, appliedVoucher }: any) => (
  <Card className="h-fit sticky top-24">
    <CardHeader>
      <CardTitle className="font-heading uppercase tracking-wider text-sm">Order Summary</CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {items.map((item: any) => (
          <div key={item.id} className="flex gap-2 items-center">
            {item.product?.image_url && (
              <img src={item.product.image_url} alt={item.product?.name} className="w-10 h-12 object-cover rounded" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">{item.product?.name}</p>
              <div className="flex gap-1 mt-0.5 flex-wrap items-center">
                {item.selected_size && (
                  <span style={{ fontSize: "9px", fontWeight: 700, padding: "1px 5px", borderRadius: "3px", background: "rgba(26,86,219,.1)", color: "#1a56db", textTransform: "uppercase" }}>
                    {item.selected_size}
                  </span>
                )}
                {item.selected_color && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "3px", fontSize: "9px", fontWeight: 600, color: "rgba(10,13,20,.5)" }}>
                    <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: item.product?.colors?.find((c: any) => c.name === item.selected_color)?.hex ?? "#999", border: "1px solid rgba(10,13,20,.15)", flexShrink: 0 }} />
                    {item.selected_color}
                  </span>
                )}
                <span className="text-[10px] text-muted-foreground">× {item.quantity}</span>
              </div>
            </div>
            <span className="text-xs font-bold text-foreground shrink-0">₱{((item.product?.price ?? 0) * item.quantity).toLocaleString()}</span>
          </div>
        ))}
      </div>
      <div className="space-y-1 text-sm border-t border-border pt-3">
        <div className="flex justify-between text-muted-foreground">
          <span>Subtotal ({items.length} items)</span><span>₱{subtotal.toLocaleString()}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Discount</span><span>-₱{discount.toLocaleString()}</span>
          </div>
        )}
        <div className="flex justify-between text-muted-foreground">
          <span>Shipping</span><span>{shippingFee === 0 ? "Free" : `₱${shippingFee}`}</span>
        </div>
      </div>
      {setVoucherCode && (
        <div className="flex gap-2">
          <Input placeholder="Voucher code" value={voucherCode}
            onChange={(e: any) => setVoucherCode(e.target.value)} className="text-sm" />
          <Button size="sm" variant="outline" onClick={applyVoucher} disabled={!!appliedVoucher}>Apply</Button>
        </div>
      )}
      {appliedVoucher && <p className="text-xs text-green-600">✓ {appliedVoucher.code} applied</p>}
      <div className="border-t border-border pt-3 flex justify-between font-heading text-lg">
        <span className="text-foreground">Total</span>
        <span className="text-primary">₱{grandTotal.toLocaleString()}</span>
      </div>
    </CardContent>
  </Card>
);

// ── Checkout Page ─────────────────────────────────────────────────────────────
const CheckoutPage = () => {
  const { items, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const navigate  = useNavigate();
  const [step, setStep]         = useState(0);
  const [processing, setProcessing] = useState(false);
  const [orderId, setOrderId]   = useState("");
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [voucherCode, setVoucherCode]   = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState<any>(null);
  const [paymentMethod, setPaymentMethod]   = useState("cod");
  const [confirmedItems, setConfirmedItems] = useState<any[]>([]);
  const [capturedTotals, setCapturedTotals] = useState({ subtotal: 0, discount: 0, shippingFee: 0, grandTotal: 0 });

  // ── Payment config fetched from payment_settings ──
  const [paymentConfig, setPaymentConfig] = useState<{
    gcash_number: string;
    account_name: string;
    qr_image_url: string;
    enable_gcash_manual: boolean;
    enable_cod: boolean;
    enable_paymongo: boolean;
  } | null>(null);

  // ── GCash Manual state ──
  const [gcashNumber, setGcashNumber]               = useState("");
  const [gcashReferenceNumber, setGcashReferenceNumber] = useState("");
  const [gcashProofUrl, setGcashProofUrl]           = useState("");
  const [showGcashInstructions, setShowGcashInstructions] = useState(false);

  const [shipping, setShipping] = useState({
    full_name: "", phone: "", address_line: "", city: "", province: "", zip_code: "",
  });

  const shippingFee  = totalPrice >= 2000 ? 0 : 100;
  const discount     = appliedVoucher
    ? appliedVoucher.discount_type === "percentage"
      ? totalPrice * (appliedVoucher.discount_value / 100)
      : appliedVoucher.discount_value
    : 0;
  const grandTotal   = totalPrice - discount + shippingFee;

  // ── Fetch payment config ──────────────────────────────────────────────────
  useEffect(() => {
    supabase
      .from("payment_settings")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setPaymentConfig(data);
      });
  }, []);

  // ── Fetch addresses ───────────────────────────────────────────────────────
  useEffect(() => {
    if (user) {
      supabase.from("addresses").select("*").eq("user_id", user.id).order("is_default", { ascending: false })
        .then(({ data }) => {
          setAddresses(data || []);
          const def = data?.find((a: any) => a.is_default);
          if (def) {
            setSelectedAddressId(def.id);
            setShipping({ full_name: def.full_name, phone: def.phone, address_line: def.address_line, city: def.city, province: def.province || "", zip_code: def.zip_code || "" });
          }
        });
    }
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="text-center">
          <ShoppingCart size={48} className="mx-auto text-muted-foreground mb-4" />
          <h1 className="font-heading text-2xl uppercase text-foreground mb-2">Sign in to checkout</h1>
          <Link to="/signin"><Button className="bg-primary text-primary-foreground">Sign In</Button></Link>
        </div>
      </div>
    );
  }

  if (items.length === 0 && step < 3) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="text-center">
          <ShoppingCart size={48} className="mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">Your cart is empty</p>
          <Link to="/shop"><Button className="bg-primary text-primary-foreground">Browse Shop</Button></Link>
        </div>
      </div>
    );
  }

  const selectAddress = (addr: any) => {
    setSelectedAddressId(addr.id);
    setShipping({ full_name: addr.full_name, phone: addr.phone, address_line: addr.address_line, city: addr.city, province: addr.province || "", zip_code: addr.zip_code || "" });
  };

  const applyVoucher = async () => {
    if (!voucherCode.trim()) return;
    const { data } = await supabase.from("vouchers").select("*").eq("code", voucherCode.toUpperCase()).eq("active", true).maybeSingle();
    if (!data) { toast.error("Invalid voucher code"); return; }
    if (data.expiry_date && new Date(data.expiry_date) < new Date()) { toast.error("Voucher expired"); return; }
    if (data.max_uses && data.used_count >= data.max_uses) { toast.error("Voucher fully redeemed"); return; }
    if (totalPrice < data.min_spend) { toast.error(`Minimum spend ₱${data.min_spend.toLocaleString()}`); return; }
    setAppliedVoucher(data);
    toast.success("Voucher applied!");
  };

  const validateShipping = () => {
    if (!shipping.full_name || !shipping.phone || !shipping.address_line || !shipping.city) {
      toast.error("Please fill all required shipping fields");
      return false;
    }
    return true;
  };

  const createOrder = async () => {
    const orderItemsPayload = items.map((i) => ({
      id:                 i.product_id,
      name:               i.product?.name,
      price:              i.product?.price,
      quantity:           i.quantity,
      selected_size:      i.selected_size  ?? null,
      selected_color:     i.selected_color ?? null,
      selected_color_hex: i.product?.colors?.find((c: any) => c.name === i.selected_color)?.hex ?? null,
    }));

    const { data, error } = await supabase.from("orders").insert({
      user_id:          user.id,
      customer_name:    shipping.full_name,
      customer_email:   user.email,
      items:            orderItemsPayload,
      total:            grandTotal,
      subtotal:         totalPrice,
      discount,
      shipping_fee:     shippingFee,
      shipping_name:    shipping.full_name,
      shipping_phone:   shipping.phone,
      shipping_address: `${shipping.address_line}, ${shipping.city}${shipping.province ? ", " + shipping.province : ""}${shipping.zip_code ? " " + shipping.zip_code : ""}`,
      status:           "pending",
      payment_method:   paymentMethod,
      payment_status:   "pending",
      order_type:       "online",
      voucher_id:       appliedVoucher?.id || null,
    }).select("id").single();

    if (error) throw error;

    const orderItems = items.map((i) => ({
      order_id:      data.id,
      product_id:    i.product_id,
      product_name:  i.product?.name || "",
      quantity:      i.quantity,
      unit_price:    i.product?.price || 0,
      total:         (i.product?.price || 0) * i.quantity,
      selected_size:  i.selected_size  ?? null,
      selected_color: i.selected_color ?? null,
    }));
    await supabase.from("order_items").insert(orderItems);

    if (appliedVoucher) {
      await supabase.from("vouchers").update({ used_count: appliedVoucher.used_count + 1 }).eq("id", appliedVoucher.id);
    }

    setConfirmedItems(orderItemsPayload);
    setCapturedTotals({ subtotal: totalPrice, discount, shippingFee, grandTotal });
    return data.id;
  };

  // ── GCash Manual ──────────────────────────────────────────────────────────
  const handleGCashManual = async () => {
    if (!gcashNumber.trim()) { toast.error("Please enter your GCash number"); return; }
    const phoneRegex = /^(09|\+639)\d{9}$/;
    if (!phoneRegex.test(gcashNumber.replace(/[-\s]/g, ""))) {
      toast.error("Please enter a valid GCash number (e.g. 09171234567)"); return;
    }

    setProcessing(true);
    try {
      const newOrderId = await createOrder();
      const refNum     = generateReference();

      const { error: gcashError } = await supabase.from("gcash_payments").insert({
        order_id:         newOrderId,
        user_id:          user.id,
        customer_name:    shipping.full_name,
        customer_email:   user.email,
        gcash_number:     gcashNumber,
        amount:           grandTotal,
        reference_number: refNum,
        status:           "pending",
        proof_url:        null,
      });

      if (gcashError) throw gcashError;

      await clearCart();
      setOrderId(newOrderId);
      setGcashReferenceNumber(refNum);
      setShowGcashInstructions(true);
      setStep(3);
    } catch (err: any) {
      toast.error(err.message || "Failed to create GCash payment. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  // ── PayMongo ──────────────────────────────────────────────────────────────
  const handlePayMongoCheckout = async () => {
    setProcessing(true);
    let newOrderId: string | null = null;
    try {
      newOrderId = await createOrder();
      setOrderId(newOrderId);
      const response = await fetch(VERCEL_API, {
        method: "POST", mode: "cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: grandTotal, orderId: newOrderId,
          customerName: shipping.full_name, customerEmail: user.email,
          siteUrl: window.location.origin,
          items: items.map((i) => ({ name: i.product?.name || "Item", price: i.product?.price || 0, quantity: i.quantity })),
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.checkoutUrl) throw new Error(data.error || "Failed to create payment session");
      await supabase.from("orders").update({ paymongo_session_id: data.sessionId }).eq("id", newOrderId);
      await clearCart();
      window.location.href = data.checkoutUrl;
    } catch (err: any) {
      if (newOrderId) await supabase.from("orders").update({ status: "cancelled", payment_status: "failed" }).eq("id", newOrderId);
      toast.error(err.message || "Payment failed. Please try again.");
      setProcessing(false);
    }
  };

  // ── COD ───────────────────────────────────────────────────────────────────
  const handleCOD = async () => {
    setProcessing(true);
    try {
      const newOrderId = await createOrder();
      await clearCart();
      setOrderId(newOrderId);
      setStep(3);
    } catch {
      toast.error("Checkout failed. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const displaySubtotal    = capturedTotals.subtotal   || totalPrice;
  const displayDiscount    = capturedTotals.discount   || discount;
  const displayShippingFee = capturedTotals.shippingFee || shippingFee;
  const displayGrandTotal  = capturedTotals.grandTotal  || grandTotal;

  const handlePlaceOrder = () => {
    if (paymentMethod === "cod")          handleCOD();
    else if (paymentMethod === "gcash_manual") handleGCashManual();
    else                                  handlePayMongoCheckout();
  };

  // Build payment methods list from config
  const allPaymentMethods = [
    { id: "cod",          label: "Cash on Delivery",               icon: "💵", desc: "Pay when your order arrives",                                  enabled: paymentConfig?.enable_cod           ?? true },
    { id: "gcash_manual", label: "GCash (Manual Transfer)",        icon: "📲", desc: "Send payment manually via GCash — upload screenshot as proof", enabled: paymentConfig?.enable_gcash_manual  ?? true },
    { id: "gcash",        label: "GCash / GrabPay (via PayMongo)", icon: "📱", desc: "Pay via GCash — redirected to a secure payment page",          enabled: paymentConfig?.enable_paymongo      ?? true },
    { id: "card",         label: "Credit / Debit Card",            icon: "💳", desc: "Visa, Mastercard — secure checkout via PayMongo",              enabled: paymentConfig?.enable_paymongo      ?? true },
  ];
  const paymentMethods = allPaymentMethods.filter((m) => m.enabled);

  return (
    <div className="pt-24 pb-16 px-4">
      <div className="container mx-auto max-w-4xl">

        {/* Stepper */}
        <div className="flex items-center justify-center mb-10 gap-1">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                i === step ? "bg-primary text-primary-foreground" : i < step ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
              }`}>
                {i < step ? <CheckCircle size={16} /> : <span className="w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs">{i + 1}</span>}
                <span className="hidden sm:inline">{s}</span>
              </div>
              {i < steps.length - 1 && <ChevronRight size={16} className="text-muted-foreground mx-1" />}
            </div>
          ))}
        </div>

        {/* Step 0: Shipping */}
        {step === 0 && (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading uppercase tracking-wider flex items-center gap-2">
                    <MapPin size={18} /> Shipping Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {addresses.length > 0 && (
                    <div className="space-y-2 mb-4">
                      <p className="text-sm font-medium text-foreground">Saved Addresses</p>
                      {addresses.map((a) => (
                        <button key={a.id} onClick={() => selectAddress(a)}
                          className={`w-full text-left p-3 rounded-lg border transition-all ${selectedAddressId === a.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}>
                          <p className="font-medium text-sm text-foreground">{a.full_name} · {a.phone}</p>
                          <p className="text-xs text-muted-foreground">{a.address_line}, {a.city}</p>
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-1">Full Name *</label>
                      <Input value={shipping.full_name} onChange={(e) => setShipping({ ...shipping, full_name: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-1">Phone *</label>
                      <Input value={shipping.phone} onChange={(e) => setShipping({ ...shipping, phone: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1">Address *</label>
                    <Input value={shipping.address_line} onChange={(e) => setShipping({ ...shipping, address_line: e.target.value })} />
                  </div>
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-1">City *</label>
                      <Input value={shipping.city} onChange={(e) => setShipping({ ...shipping, city: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-1">Province</label>
                      <Input value={shipping.province} onChange={(e) => setShipping({ ...shipping, province: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-1">ZIP Code</label>
                      <Input value={shipping.zip_code} onChange={(e) => setShipping({ ...shipping, zip_code: e.target.value })} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            <OrderSummary items={items} subtotal={displaySubtotal} discount={displayDiscount} shippingFee={displayShippingFee}
              grandTotal={displayGrandTotal} voucherCode={voucherCode} setVoucherCode={setVoucherCode}
              applyVoucher={applyVoucher} appliedVoucher={appliedVoucher} />
          </div>
        )}

        {/* Step 1: Review */}
        {step === 1 && (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader><CardTitle className="font-heading uppercase tracking-wider">Order Items</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                      {item.product?.image_url && (
                        <img src={item.product.image_url} alt={item.product.name} className="w-16 h-20 object-cover rounded-lg" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{item.product?.name}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {item.selected_size && (
                            <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "4px", background: "rgba(26,86,219,.1)", color: "#1a56db", border: "1px solid rgba(26,86,219,.15)", textTransform: "uppercase" }}>
                              Size: {item.selected_size}
                            </span>
                          )}
                          {item.selected_color && (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "10px", fontWeight: 600, padding: "2px 8px", borderRadius: "4px", background: "rgba(10,13,20,.06)", color: "rgba(10,13,20,.6)", border: "1px solid rgba(10,13,20,.1)" }}>
                              {item.product?.colors?.find((c: any) => c.name === item.selected_color)?.hex && (
                                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: item.product.colors.find((c: any) => c.name === item.selected_color)?.hex, border: "1px solid rgba(10,13,20,.2)", flexShrink: 0 }} />
                              )}
                              {item.selected_color}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">Qty: {item.quantity} × ₱{(item.product?.price || 0).toLocaleString()}</p>
                      </div>
                      <p className="font-heading text-foreground">₱{((item.product?.price || 0) * item.quantity).toLocaleString()}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="font-heading uppercase tracking-wider text-sm">Ship To</CardTitle></CardHeader>
                <CardContent>
                  <p className="font-medium text-foreground">{shipping.full_name}</p>
                  <p className="text-sm text-muted-foreground">{shipping.phone}</p>
                  <p className="text-sm text-muted-foreground">{shipping.address_line}, {shipping.city}</p>
                </CardContent>
              </Card>
            </div>
            <OrderSummary items={items} subtotal={displaySubtotal} discount={displayDiscount} shippingFee={displayShippingFee} grandTotal={displayGrandTotal} />
          </div>
        )}

        {/* Step 2: Payment */}
        {step === 2 && (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading uppercase tracking-wider flex items-center gap-2">
                    <CreditCard size={18} /> Payment Method
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {paymentMethods.map((pm) => (
                    <button key={pm.id} onClick={() => setPaymentMethod(pm.id)}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${paymentMethod === pm.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}>
                      <span className="text-2xl">{pm.icon}</span>
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{pm.label}</p>
                        <p className="text-xs text-muted-foreground">{pm.desc}</p>
                      </div>
                      {paymentMethod === pm.id && <CheckCircle size={18} className="ml-auto text-primary shrink-0" />}
                    </button>
                  ))}

                  {/* GCash manual: number input */}
                  {paymentMethod === "gcash_manual" && (
                    <div className="mt-2 rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 space-y-3">
                      <p className="text-sm font-semibold text-foreground flex items-center gap-2">📲 Enter your GCash number</p>
                      <Input placeholder="09XXXXXXXXX" value={gcashNumber} onChange={(e) => setGcashNumber(e.target.value)} className="font-mono" maxLength={13} />
                      <p className="text-[10px] text-muted-foreground">This is the number you'll send from. You'll get instructions + QR code next.</p>
                    </div>
                  )}

                  {(paymentMethod === "gcash" || paymentMethod === "card") && (
                    <div className="mt-2 rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2">
                      <div className="flex items-start gap-3">
                        <ExternalLink size={18} className="text-primary shrink-0 mt-0.5" />
                        <p className="text-sm font-medium text-foreground">You'll be redirected to a secure payment page</p>
                      </div>
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                        🔒 Secured by <strong>PayMongo</strong> · BSP-regulated · PCI-DSS compliant
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            <OrderSummary items={items} subtotal={displaySubtotal} discount={displayDiscount} shippingFee={displayShippingFee} grandTotal={displayGrandTotal} />
          </div>
        )}

        {/* Step 3: Confirmation */}
      
{step === 3 && (
  <div>
    {showGcashInstructions ? (
      <div>
        <GCashInstructionPage
          referenceNumber={gcashReferenceNumber}
          amount={displayGrandTotal}
          gcashNumber={paymentConfig?.gcash_number || "09XX-XXX-XXXX"}
          qrImageUrl={paymentConfig?.qr_image_url || null}
          onProofUploaded={(url) => setGcashProofUrl(url)}
        />
        <div className="flex justify-center gap-4 mt-6 flex-wrap">
          <Link to="/my-orders">
            <Button className="bg-primary text-primary-foreground font-heading uppercase tracking-wider">View My Orders</Button>
          </Link>
          <Link to="/shop">
            <Button variant="outline" className="font-heading uppercase tracking-wider">Continue Shopping</Button>
          </Link>
        </div>
      </div>
    ) : (
      <div className="max-w-2xl mx-auto">
        <div
          id="checkout-receipt-print"
          style={{ borderRadius: "16px", overflow: "hidden", border: "1px solid rgba(10,13,20,.1)", boxShadow: "0 20px 60px -12px rgba(10,13,20,.15)" }}
        >
          <ZaloraReceipt
            orderId={orderId}
            items={confirmedItems.length > 0 ? confirmedItems : items}
            shipping={shipping}
            subtotal={displaySubtotal}
            discount={displayDiscount}
            shippingFee={displayShippingFee}
            grandTotal={displayGrandTotal}
            paymentMethod={paymentMethod}
            userEmail={user?.email ?? ""}
            appliedVoucher={appliedVoucher}
          />
        </div>
        <div className="flex justify-center gap-4 mt-6 flex-wrap">
          <Link to="/my-orders">
            <Button className="bg-primary text-primary-foreground font-heading uppercase tracking-wider">
              View My Orders
            </Button>
          </Link>
          <Link to="/shop">
            <Button variant="outline" className="font-heading uppercase tracking-wider">
              Continue Shopping
            </Button>
          </Link>
          <Button
  variant="outline"
  className="font-heading uppercase tracking-wider gap-2"
  onClick={() => {
    const content = document.getElementById("checkout-receipt-print");
    if (!content) { window.print(); return; }
    const win = window.open("", "_blank", "width=620,height=900");
    if (!win) { window.print(); return; }
    win.document.write(`...`);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 600);
  }}
>
  <Printer size={15} /> Print Receipt  {/* ← replaces the 🖨️ emoji */}
</Button>
        </div>
      </div>
    )}
  </div>
)}
        {/* Navigation */}
        {step < 3 && (
          <div className="flex justify-between mt-8">
            <Button variant="outline"
              onClick={() => step > 0 ? setStep(step - 1) : navigate("/cart")}
              className="gap-2 font-heading uppercase tracking-wider">
              <ChevronLeft size={16} /> {step === 0 ? "Back to Cart" : "Back"}
            </Button>
            {step < 2 ? (
              <Button
                onClick={() => { if (step === 0 && !validateShipping()) return; setStep(step + 1); }}
                className="gap-2 bg-primary text-primary-foreground font-heading uppercase tracking-wider">
                Continue <ChevronRight size={16} />
              </Button>
            ) : (
              <Button
                onClick={handlePlaceOrder}
                disabled={processing}
                className="gap-2 bg-primary text-primary-foreground font-heading uppercase tracking-wider disabled:opacity-50 min-w-[180px]">
                {processing
                  ? <><Loader2 size={16} className="animate-spin" /> Processing...</>
                  : paymentMethod === "cod"
                  ? `Place Order · ₱${displayGrandTotal.toLocaleString()}`
                  : paymentMethod === "gcash_manual"
                  ? `Proceed to GCash Payment →`
                  : `Pay ₱${displayGrandTotal.toLocaleString()} →`}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckoutPage;
