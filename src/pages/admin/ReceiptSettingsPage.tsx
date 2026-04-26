import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Receipt, Save, Building2, MapPin, Hash, Percent,
  ImageIcon, Upload, X, Loader2, AlertCircle,
} from "lucide-react";

interface ReceiptSettings {
  id: string;
  company_name: string;
  address: string;
  tin_no: string;
  vat_rate: number;
  logo_url: string | null;
}

const cardStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.08)",
  backdropFilter: "blur(20px)",
  boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
};

const inputStyle = (hasErr?: boolean): React.CSSProperties => ({
  background: "rgba(255,255,255,0.05)",
  border: `1px solid ${hasErr ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)"}`,
  borderRadius: 12,
  color: "#e2e8f0",
  padding: "10px 14px",
  fontSize: 13,
  outline: "none",
  width: "100%",
  transition: "border-color 0.2s",
});

const ReceiptSettingsPage = () => {
  const [settings, setSettings] = useState<ReceiptSettings>({
    id: "", company_name: "", address: "", tin_no: "", vat_rate: 12, logo_url: null,
  });
  const [loading,       setLoading]       = useState(true);
  const [saving,        setSaving]        = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoPreview,   setLogoPreview]   = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    const { data, error } = await supabase
      .from("receipt_settings").select("*").limit(1).single();
    if (error && error.code !== "PGRST116") {
      toast.error("Failed to load receipt settings");
    } else if (data) {
      setSettings(data);
      setLogoPreview(data.logo_url);
    }
    setLoading(false);
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file"); return; }
    if (file.size > 2 * 1024 * 1024)    { toast.error("Image must be smaller than 2MB"); return; }

    setLogoPreview(URL.createObjectURL(file));
    setUploadingLogo(true);
    try {
      const ext      = file.name.split(".").pop();
      const fileName = `logo-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("receipt-logos").upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("receipt-logos").getPublicUrl(fileName);
      setSettings(prev => ({ ...prev, logo_url: urlData.publicUrl }));
      setLogoPreview(urlData.publicUrl);
      toast.success("Logo uploaded!");
    } catch {
      toast.error("Logo upload failed.");
      setLogoPreview(settings.logo_url);
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      company_name: settings.company_name,
      address:      settings.address,
      tin_no:       settings.tin_no,
      vat_rate:     settings.vat_rate,
      logo_url:     settings.logo_url,
      updated_at:   new Date().toISOString(),
    };
    let error;
    if (settings.id) {
      ({ error } = await supabase.from("receipt_settings").update(payload).eq("id", settings.id));
    } else {
      const { data, error: insertError } = await supabase.from("receipt_settings").insert(payload).select().single();
      error = insertError;
      if (data) setSettings(data);
    }
    if (error) toast.error("Failed to save settings");
    else       toast.success("Receipt settings saved!");
    setSaving(false);
  };

  // Preview calculations
  const sampleItems = [
    { name: "Sample Item A", qty: 2, price: 150 },
    { name: "Sample Item B", qty: 1, price: 320 },
  ];
  const subtotal  = sampleItems.reduce((s, i) => s + i.price * i.qty, 0);
  const vatAmount = subtotal * ((settings.vat_rate || 0) / 100);
  const total     = subtotal + vatAmount;
  const now       = new Date().toLocaleString();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: "linear-gradient(135deg,#0f1117 0%,#141824 50%,#0f1117 100%)" }}>
        <div className="flex items-center gap-3 text-slate-400 text-sm animate-pulse">
          <Loader2 size={16} className="animate-spin" /> Loading receipt settings...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 space-y-6 relative"
      style={{ background: "linear-gradient(135deg,#0f1117 0%,#141824 50%,#0f1117 100%)" }}>

      {/* Ambient orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full opacity-10"
          style={{ background: "radial-gradient(circle,#6366f1,transparent 70%)" }} />
        <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full opacity-10"
          style={{ background: "radial-gradient(circle,#8b5cf6,transparent 70%)" }} />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between relative z-10 opacity-0"
        style={{ animation: "fadeUp 0.5s ease forwards" }}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            <span className="text-xs text-indigo-400 font-medium tracking-widest uppercase">Admin Panel</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Receipt Settings</h1>
          <p className="text-sm text-slate-400 mt-0.5">Configure your receipt appearance and tax settings</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || uploadingLogo}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          style={{ background: "rgba(99,102,241,0.3)", border: "1px solid rgba(99,102,241,0.4)" }}
        >
          {saving
            ? <><Loader2 size={14} className="animate-spin" /> Saving...</>
            : <><Save size={14} /> Save Settings</>}
        </button>
      </div>

      {/* Main grid */}
      <div className="grid lg:grid-cols-2 gap-6 relative z-10">

        {/* ── Settings Form ── */}
        <div className="rounded-2xl p-6 space-y-5 opacity-0"
          style={{ ...cardStyle, animation: "fadeUp 0.5s ease 0.1s forwards" }}>

          {/* Section label */}
          <div className="flex items-center gap-2 pb-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 flex items-center justify-center">
              <Receipt size={15} className="text-indigo-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Receipt Configuration</p>
              <p className="text-[11px] text-slate-500">Company info shown on printed receipts</p>
            </div>
          </div>

          {/* Logo Upload */}
          <div className="space-y-2">
            <label className="text-[11px] text-slate-400 uppercase tracking-widest font-medium flex items-center gap-1.5">
              <ImageIcon size={11} /> Company Logo
            </label>
            {logoPreview ? (
              <div className="space-y-2">
                <div className="relative w-fit">
                  <img src={logoPreview} alt="Logo preview"
                    className="h-20 max-w-[200px] object-contain rounded-xl p-2"
                    style={{ border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)" }} />
                  {uploadingLogo && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/60">
                      <Loader2 size={20} className="text-white animate-spin" />
                    </div>
                  )}
                  {!uploadingLogo && (
                    <button onClick={() => { setLogoPreview(null); setSettings(p => ({ ...p, logo_url: null })); }}
                      className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center bg-red-500 hover:bg-red-400 transition-colors">
                      <X size={11} className="text-white" />
                    </button>
                  )}
                </div>
                {!uploadingLogo && (
                  <button onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-indigo-400 transition-all hover:scale-[1.02]"
                    style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)" }}>
                    <Upload size={11} /> Change Logo
                  </button>
                )}
              </div>
            ) : (
              <div onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-2 p-8 rounded-xl cursor-pointer transition-all"
                style={{ border: "2px dashed rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.02)" }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(99,102,241,0.4)")}
                onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")}>
                {uploadingLogo ? <Loader2 size={24} className="text-slate-500 animate-spin" /> : (
                  <>
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/15 flex items-center justify-center">
                      <Upload size={18} className="text-indigo-400" />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-medium text-slate-300">Click to upload logo</p>
                      <p className="text-[10px] text-slate-600 mt-0.5">PNG, JPG, SVG, WEBP · Max 2MB</p>
                    </div>
                  </>
                )}
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp" className="hidden" onChange={handleLogoChange} />
          </div>

          {/* Company Name */}
          <div className="space-y-1.5">
            <label className="text-[11px] text-slate-400 uppercase tracking-widest font-medium flex items-center gap-1.5">
              <Building2 size={11} /> Company Name
            </label>
            <input style={inputStyle()} value={settings.company_name}
              onChange={e => setSettings({ ...settings, company_name: e.target.value })}
              placeholder="e.g. RaidKhalid & Co." />
          </div>

          {/* Address */}
          <div className="space-y-1.5">
            <label className="text-[11px] text-slate-400 uppercase tracking-widest font-medium flex items-center gap-1.5">
              <MapPin size={11} /> Address
            </label>
            <input style={inputStyle()} value={settings.address}
              onChange={e => setSettings({ ...settings, address: e.target.value })}
              placeholder="e.g. 123 Main St, Cagayan de Oro City" />
          </div>

          {/* TIN */}
          <div className="space-y-1.5">
            <label className="text-[11px] text-slate-400 uppercase tracking-widest font-medium flex items-center gap-1.5">
              <Hash size={11} /> TIN No.
            </label>
            <input style={inputStyle()} value={settings.tin_no}
              onChange={e => setSettings({ ...settings, tin_no: e.target.value })}
              placeholder="e.g. 000-123-456-000" />
          </div>

          {/* VAT Rate */}
          <div className="space-y-1.5">
            <label className="text-[11px] text-slate-400 uppercase tracking-widest font-medium flex items-center gap-1.5">
              <Percent size={11} /> VAT Rate (%)
            </label>
            <input type="number" min={0} max={100} style={inputStyle()} value={settings.vat_rate}
              onChange={e => setSettings({ ...settings, vat_rate: parseFloat(e.target.value) || 0 })}
              placeholder="12" />
          </div>
        </div>

        {/* ── Receipt Preview ── */}
        <div className="rounded-2xl p-6 opacity-0"
          style={{ ...cardStyle, animation: "fadeUp 0.5s ease 0.2s forwards" }}>

          <div className="flex items-center gap-2 pb-4 mb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="w-8 h-8 rounded-xl bg-violet-500/20 flex items-center justify-center">
              <Receipt size={15} className="text-violet-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Live Preview</p>
              <p className="text-[11px] text-slate-500">Updates as you type</p>
            </div>
          </div>

          {/* Receipt paper */}
          <div className="mx-auto font-mono text-xs space-y-3 rounded-2xl p-5"
            style={{ maxWidth: 300, background: "#ffffff", color: "#111827", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>

            <div className="text-center space-y-1 pb-2" style={{ borderBottom: "1px dashed #d1d5db" }}>
              {logoPreview && (
                <img src={logoPreview} alt="Logo" className="h-14 object-contain mx-auto mb-1" />
              )}
              <p className="font-bold text-sm leading-tight">{settings.company_name || "Company Name"}</p>
              {settings.tin_no   && <p className="text-[10px] text-gray-500">TIN: {settings.tin_no}</p>}
              {settings.address  && <p className="text-[10px] text-gray-500">{settings.address}</p>}
              <p className="text-[10px] text-gray-400">{now}</p>
              <p className="text-[10px] text-gray-400">Receipt: POS-PREVIEW</p>
            </div>

            <p className="text-center font-bold text-xs tracking-widest uppercase">Official Receipt</p>

            <div className="flex justify-between text-[10px] font-bold pb-1" style={{ borderBottom: "1px solid #e5e7eb" }}>
              <span className="flex-1">Item</span>
              <span className="w-8 text-center">Qty</span>
              <span className="w-16 text-right">Amount</span>
            </div>

            <div className="space-y-0.5">
              {sampleItems.map((item, i) => (
                <div key={i} className="flex justify-between text-[10px]">
                  <span className="flex-1 truncate">{item.name}</span>
                  <span className="w-8 text-center">{item.qty}</span>
                  <span className="w-16 text-right">₱{(item.price * item.qty).toLocaleString()}</span>
                </div>
              ))}
            </div>

            <div className="pt-2 space-y-0.5" style={{ borderTop: "1px dashed #d1d5db" }}>
              <div className="flex justify-between text-[10px]">
                <span>Subtotal</span><span>₱{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span>VAT ({settings.vat_rate}%)</span><span>₱{vatAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-xs pt-1" style={{ borderTop: "1px solid #e5e7eb" }}>
                <span>Total</span><span>₱{total.toFixed(2)}</span>
              </div>
            </div>

            <p className="text-center text-[10px] text-gray-400 pt-1">Thank you for your purchase!</p>
          </div>
        </div>
      </div>

      {/* Security / info note */}
      <div className="flex items-start gap-3 p-4 rounded-2xl relative z-10 opacity-0"
        style={{ ...cardStyle, animation: "fadeUp 0.5s ease 0.35s forwards", borderColor: "rgba(99,102,241,0.2)" }}>
        <AlertCircle size={15} className="text-indigo-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-semibold text-indigo-300 mb-0.5">Receipt Note</p>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Settings are applied to all POS-generated receipts. The logo is stored in Supabase Storage and served via public URL.
            VAT is calculated on the subtotal and displayed as a separate line on every receipt.
          </p>
        </div>
      </div>

      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
    </div>
  );
};

export default ReceiptSettingsPage;