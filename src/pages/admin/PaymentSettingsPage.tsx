import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  RefreshCw, Save, Trash2, Upload, CheckCircle,
  AlertCircle, ImageIcon,
} from "lucide-react";
import { toast } from "sonner";

// ─────────────────────────────────────────────────────────────────────────────
// Run this SQL in Supabase SQL Editor:
//
//   CREATE TABLE IF NOT EXISTS payment_settings (
//     id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
//     gcash_number         TEXT,
//     account_name         TEXT,
//     qr_image_url         TEXT,
//     enable_gcash_manual  BOOLEAN DEFAULT true,
//     enable_cod           BOOLEAN DEFAULT true,
//     enable_paymongo      BOOLEAN DEFAULT true,
//     updated_at           TIMESTAMPTZ DEFAULT now()
//   );
//   ALTER TABLE payment_settings ENABLE ROW LEVEL SECURITY;
//   CREATE POLICY "Admin full access" ON payment_settings USING (true) WITH CHECK (true);
//
//   -- Also add completed_at to gcash_payments if not exists:
//   ALTER TABLE gcash_payments ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
// ─────────────────────────────────────────────────────────────────────────────

const cardStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.08)",
  backdropFilter: "blur(20px)",
  boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
};

type FormState = {
  gcash_number: string;
  account_name: string;
  qr_image_url: string;
  enable_gcash_manual: boolean;
  enable_cod: boolean;
  enable_paymongo: boolean;
};

const DEFAULT_FORM: FormState = {
  gcash_number: "",
  account_name: "",
  qr_image_url: "",
  enable_gcash_manual: true,
  enable_cod: true,
  enable_paymongo: true,
};

const Toggle = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
  <button
    type="button"
    onClick={() => onChange(!value)}
    style={{
      position: "relative", width: "44px", height: "24px", borderRadius: "100px",
      background: value ? "rgba(99,102,241,0.4)" : "rgba(255,255,255,0.08)",
      border: value ? "1px solid rgba(99,102,241,0.5)" : "1px solid rgba(255,255,255,0.12)",
      cursor: "pointer", transition: "all 0.2s", flexShrink: 0,
    }}
  >
    <span style={{
      position: "absolute", top: "3px", left: value ? "22px" : "3px",
      width: "16px", height: "16px", borderRadius: "50%",
      background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.35)",
    }} />
  </button>
);

export default function PaymentSettingsPage() {
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [uploading, setUploading]   = useState(false);
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);

  const set = (key: keyof FormState, value: string | boolean) =>
    setForm((f) => ({ ...f, [key]: value }));

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("payment_settings")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) {
        setSettingsId(data.id);
        setForm({
          gcash_number:        data.gcash_number        ?? "",
          account_name:        data.account_name        ?? "",
          qr_image_url:        data.qr_image_url        ?? "",
          enable_gcash_manual: data.enable_gcash_manual ?? true,
          enable_cod:          data.enable_cod           ?? true,
          enable_paymongo:     data.enable_paymongo      ?? true,
        });
      }
    } catch (err: any) {
      toast.error("Failed to load settings: " + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const handleQRUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please upload an image file"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("File must be under 5 MB"); return; }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const filename = `gcash-qr/qr-code-${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("payment-proofs")
        .upload(filename, file, { contentType: file.type, upsert: true });
      if (uploadErr) throw uploadErr;
      const { data: urlData } = supabase.storage.from("payment-proofs").getPublicUrl(filename);
      set("qr_image_url", urlData.publicUrl);
      toast.success("QR code uploaded!");
    } catch (err: any) {
      toast.error("Upload failed: " + err.message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const deleteQR = () => set("qr_image_url", "");

  const handleSave = async () => {
    if (!form.gcash_number.trim()) { toast.error("GCash number is required"); return; }
    setSaving(true);
    try {
      const payload = { ...form, updated_at: new Date().toISOString() };
      if (settingsId) {
        const { error } = await supabase.from("payment_settings").update(payload).eq("id", settingsId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("payment_settings").insert(payload).select("id").single();
        if (error) throw error;
        setSettingsId(data.id);
      }
      toast.success("Payment settings saved!");
    } catch (err: any) {
      toast.error("Save failed: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!settingsId) return;
    if (!confirm("Reset all payment settings to defaults?")) return;
    try {
      const { error } = await supabase.from("payment_settings").delete().eq("id", settingsId);
      if (error) throw error;
      setSettingsId(null);
      setForm(DEFAULT_FORM);
      toast.success("Settings reset");
    } catch (err: any) {
      toast.error("Reset failed: " + err.message);
    }
  };

  const configRows = [
    { label: "GCash Number",  value: form.gcash_number || "Not set",             active: !!form.gcash_number },
    { label: "Account Name",  value: form.account_name || "Not set",             active: !!form.account_name },
    { label: "QR Code Image", value: form.qr_image_url ? "Uploaded ✓" : "Not uploaded", active: !!form.qr_image_url },
  ];

  const methodToggles: { key: "enable_gcash_manual" | "enable_cod" | "enable_paymongo"; label: string; desc: string; icon: string }[] = [
    { key: "enable_gcash_manual", icon: "📲", label: "GCash Manual Transfer",  desc: "Customers send via GCash and upload a screenshot as proof" },
    { key: "enable_cod",          icon: "💵", label: "Cash on Delivery",        desc: "Customer pays when the order physically arrives"            },
    { key: "enable_paymongo",     icon: "💳", label: "PayMongo (GCash / Card)", desc: "Redirect to secure PayMongo checkout page"                  },
  ];

  return (
    <div className="min-h-screen p-6 space-y-6 relative"
      style={{ background: "linear-gradient(135deg,#0f1117 0%,#141824 50%,#0f1117 100%)" }}>

      {/* Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full opacity-10"
          style={{ background: "radial-gradient(circle,#6366f1,transparent 70%)" }} />
        <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full opacity-10"
          style={{ background: "radial-gradient(circle,#10b981,transparent 70%)" }} />
      </div>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 relative z-10 opacity-0"
        style={{ animation: "fadeUp 0.5s ease forwards" }}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-emerald-400 font-medium tracking-widest uppercase">Live Config</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">💳 Payment Settings</h1>
          <p className="text-sm text-slate-400 mt-0.5">Manage GCash QR code, number &amp; payment methods · RaidKhalid &amp; Co.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {settingsId && (
            <button onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
              style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
              <Trash2 size={14} /> Reset
            </button>
          )}
          <button onClick={fetchSettings} disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-slate-300 hover:text-white transition-all"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
          <button onClick={handleSave} disabled={saving || loading}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50"
            style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", boxShadow: "0 4px 16px rgba(99,102,241,0.35)" }}>
            {saving ? <><RefreshCw size={14} className="animate-spin" /> Saving...</> : <><Save size={14} /> Save Changes</>}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-32 relative z-10">
          <RefreshCw size={28} className="animate-spin text-indigo-400" />
        </div>
      ) : (
        <>
          {/* Active Config Summary */}
          <div className="rounded-2xl overflow-hidden relative z-10 opacity-0"
            style={{ ...cardStyle, animation: "fadeUp 0.5s ease 0.07s forwards" }}>
            <div className="px-5 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-xs font-bold tracking-widest text-slate-500 uppercase">Active Configuration</p>
            </div>
            {configRows.map((row, i) => (
              <div key={row.label}
                className="flex items-center justify-between px-5 py-3.5 transition-colors hover:bg-white/[0.02]"
                style={{ borderBottom: i < configRows.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                <p className="text-xs text-slate-500 uppercase tracking-widest font-medium">{row.label}</p>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm text-slate-200 font-bold">{row.value}</span>
                  <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${
                    row.active ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" : "bg-red-500/15 text-red-400 border-red-500/20"
                  }`}>
                    {row.active ? "● Active" : "● Not Set"}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Editor Grid */}
          <div className="grid lg:grid-cols-2 gap-6 relative z-10">

            {/* Left */}
            <div className="space-y-4">

              {/* Account Details */}
              <div className="rounded-2xl p-6 space-y-5 opacity-0"
                style={{ ...cardStyle, animation: "fadeUp 0.5s ease 0.14s forwards" }}>
                <p className="text-xs font-bold tracking-widest text-slate-500 uppercase pb-3"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  GCash Account Details
                </p>
                {[
                  { key: "account_name" as const, label: "Account Name",   placeholder: "e.g. Juan Dela Cruz", hint: "",                                                    max: undefined },
                  { key: "gcash_number" as const, label: "GCash Number *", placeholder: "09XXXXXXXXX",         hint: "Shown to customers on the checkout page", max: 13    },
                ].map((field) => (
                  <div key={field.key} className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block">{field.label}</label>
                    <input
                      value={form[field.key] as string}
                      onChange={(e) => set(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      maxLength={field.max}
                      className="w-full px-4 py-2.5 rounded-xl text-sm text-slate-200 placeholder-slate-600 outline-none font-mono"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", transition: "border-color 0.2s" }}
                      onFocus={(e) => (e.target.style.borderColor = "rgba(99,102,241,0.5)")}
                      onBlur={(e)  => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                    />
                    {field.hint && <p className="text-[10px] text-slate-600">{field.hint}</p>}
                  </div>
                ))}
                {/* Preview chip */}
                <div className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.18)" }}>
                  <div>
                    <p className="text-[9px] text-indigo-400 uppercase tracking-widest font-bold mb-0.5">Checkout Preview</p>
                    <p className="font-mono text-sm font-bold text-indigo-300">{form.gcash_number || "09XX-XXX-XXXX"}</p>
                    {form.account_name && <p className="text-xs text-slate-400 mt-0.5">{form.account_name}</p>}
                  </div>
                </div>
              </div>

              {/* Method Toggles */}
              <div className="rounded-2xl p-6 space-y-4 opacity-0"
                style={{ ...cardStyle, animation: "fadeUp 0.5s ease 0.21s forwards" }}>
                <p className="text-xs font-bold tracking-widest text-slate-500 uppercase pb-3"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  Payment Methods
                </p>
                {methodToggles.map((item) => (
                  <div key={item.key} className="flex items-center justify-between gap-4 p-3 rounded-xl"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{item.icon}</span>
                      <div>
                        <p className="text-sm text-slate-200 font-semibold">{item.label}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                    <Toggle value={form[item.key] as boolean} onChange={(v) => set(item.key, v)} />
                  </div>
                ))}
                <div className="rounded-xl p-3 text-xs text-blue-300/80 leading-relaxed"
                  style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)" }}>
                  ℹ️ Disabled methods are hidden from the checkout payment selector. Changes apply after saving.
                </div>
              </div>
            </div>

            {/* Right: QR Upload */}
            <div className="rounded-2xl p-6 opacity-0"
              style={{ ...cardStyle, animation: "fadeUp 0.5s ease 0.14s forwards" }}>
              <p className="text-xs font-bold tracking-widest text-slate-500 uppercase pb-4 mb-4"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                GCash QR Code
              </p>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleQRUpload} />

              {form.qr_image_url ? (
                <div className="space-y-4">
                  <div className="relative rounded-2xl overflow-hidden group"
                    style={{ border: "1px solid rgba(99,102,241,0.3)" }}>
                    <img src={form.qr_image_url} alt="GCash QR Code" className="w-full object-contain" style={{ maxHeight: "280px" }} />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <button onClick={() => fileRef.current?.click()} disabled={uploading}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white"
                        style={{ background: "rgba(99,102,241,0.85)" }}>
                        <Upload size={12} /> Replace
                      </button>
                      <button onClick={deleteQR}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white"
                        style={{ background: "rgba(239,68,68,0.85)" }}>
                        <Trash2 size={12} /> Remove
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-xl text-xs text-emerald-400 font-medium"
                    style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}>
                    <CheckCircle size={13} /> QR Code active — displayed during GCash checkout
                  </div>
                </div>
              ) : (
                <button onClick={() => fileRef.current?.click()} disabled={uploading}
                  className="w-full rounded-2xl flex flex-col items-center gap-3 text-slate-500 transition-all hover:text-slate-300 disabled:opacity-50"
                  style={{ border: "2px dashed rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.02)", padding: "60px 20px" }}>
                  {uploading
                    ? <><RefreshCw size={28} className="animate-spin opacity-50" /><p className="text-sm">Uploading...</p></>
                    : <>
                        <ImageIcon size={32} className="opacity-30" />
                        <div className="text-center">
                          <p className="text-sm font-semibold text-slate-400">Click to upload QR Code</p>
                          <p className="text-xs mt-1 opacity-60">PNG, JPG · Max 5 MB</p>
                          <p className="text-[10px] mt-2 opacity-40">Displayed on the GCash checkout instructions page</p>
                        </div>
                      </>}
                </button>
              )}

              {/* Preview */}
              <div className="mt-6 rounded-xl p-4 space-y-3"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">How It Looks in Checkout</p>
                <div className="flex gap-4 items-center">
                  <div className="w-24 h-24 rounded-xl shrink-0 overflow-hidden flex items-center justify-center"
                    style={{ border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)" }}>
                    {form.qr_image_url
                      ? <img src={form.qr_image_url} alt="QR preview" className="w-full h-full object-contain" />
                      : <ImageIcon size={20} className="opacity-20 text-slate-400" />}
                  </div>
                  <div className="space-y-2 flex-1">
                    <div className="rounded-lg px-3 py-2"
                      style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)" }}>
                      <p className="text-[9px] text-indigo-400 uppercase tracking-widest font-bold mb-0.5">GCash Number</p>
                      <p className="font-mono text-sm font-bold text-indigo-300">{form.gcash_number || "09XX-XXX-XXXX"}</p>
                    </div>
                    {form.account_name && <p className="text-xs text-slate-500 pl-1">{form.account_name}</p>}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Floating save bar */}
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 opacity-0"
            style={{ animation: "fadeUp 0.5s ease 0.3s forwards" }}>
            {!settingsId && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs text-amber-400"
                style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)" }}>
                <AlertCircle size={12} /> No settings saved yet
              </div>
            )}
            <button onClick={handleSave} disabled={saving || loading}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold text-white transition-all disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", boxShadow: "0 8px 24px rgba(99,102,241,0.45)" }}>
              {saving ? <><RefreshCw size={15} className="animate-spin" /> Saving...</> : <><Save size={15} /> Save Changes</>}
            </button>
          </div>
        </>
      )}

      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
