// ReceiptSettingsTab.tsx
// Required Supabase setup:
// 1. Table (run once in SQL editor):
// CREATE TABLE receipt_settings (
//   id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
//   company_name text NOT NULL DEFAULT 'My Company',
//   address text DEFAULT '',
//   tin_no text DEFAULT '',
//   vat_rate numeric NOT NULL DEFAULT 12,
//   logo_url text DEFAULT NULL,
//   updated_at timestamptz DEFAULT now()
// );
// INSERT INTO receipt_settings (company_name) VALUES ('My Company');
//
// 2. Storage bucket (run once in SQL editor):
// INSERT INTO storage.buckets (id, name, public) VALUES ('receipt-logos', 'receipt-logos', true);
// CREATE POLICY "Public read" ON storage.objects FOR SELECT USING (bucket_id = 'receipt-logos');
// CREATE POLICY "Admin upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'receipt-logos');
// CREATE POLICY "Admin update" ON storage.objects FOR UPDATE USING (bucket_id = 'receipt-logos');
// CREATE POLICY "Admin delete" ON storage.objects FOR DELETE USING (bucket_id = 'receipt-logos');

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Receipt, Save, Building2, MapPin, Hash, Percent, ImageIcon, Upload, X, Loader2 } from "lucide-react";

interface ReceiptSettings {
  id: string;
  company_name: string;
  address: string;
  tin_no: string;
  vat_rate: number;
  logo_url: string | null;
}

const ReceiptSettingsTab = () => {
  const [settings, setSettings] = useState<ReceiptSettings>({
    id: "",
    company_name: "",
    address: "",
    tin_no: "",
    vat_rate: 12,
    logo_url: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const { data, error } = await supabase
      .from("receipt_settings")
      .select("*")
      .limit(1)
      .single();

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

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be smaller than 2MB");
      return;
    }

    // Show local preview immediately while uploading
    const localUrl = URL.createObjectURL(file);
    setLogoPreview(localUrl);
    setUploadingLogo(true);

    try {
      const ext = file.name.split(".").pop();
      const fileName = `logo-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("receipt-logos")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("receipt-logos")
        .getPublicUrl(fileName);

      setSettings((prev) => ({ ...prev, logo_url: urlData.publicUrl }));
      setLogoPreview(urlData.publicUrl);
      toast.success("Logo uploaded!");
    } catch {
      toast.error("Logo upload failed. Check your Supabase storage bucket.");
      setLogoPreview(settings.logo_url);
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveLogo = () => {
    setLogoPreview(null);
    setSettings((prev) => ({ ...prev, logo_url: null }));
  };

  const handleSave = async () => {
    setSaving(true);

    const payload = {
      company_name: settings.company_name,
      address: settings.address,
      tin_no: settings.tin_no,
      vat_rate: settings.vat_rate,
      logo_url: settings.logo_url,
      updated_at: new Date().toISOString(),
    };

    let error;
    if (settings.id) {
      ({ error } = await supabase
        .from("receipt_settings")
        .update(payload)
        .eq("id", settings.id));
    } else {
      const { data, error: insertError } = await supabase
        .from("receipt_settings")
        .insert(payload)
        .select()
        .single();
      error = insertError;
      if (data) setSettings(data);
    }

    if (error) {
      toast.error("Failed to save settings");
    } else {
      toast.success("Receipt settings saved!");
    }
    setSaving(false);
  };

  // Live preview data
  const now = new Date().toLocaleString();
  const sampleItems = [
    { name: "Sample Item A", qty: 2, price: 150 },
    { name: "Sample Item B", qty: 1, price: 320 },
  ];
  const subtotal = sampleItems.reduce((s, i) => s + i.price * i.qty, 0);
  const vatAmount = subtotal * ((settings.vat_rate || 0) / 100);
  const total = subtotal + vatAmount;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground text-sm animate-pulse">Loading receipt settings...</p>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* ── Settings Form ── */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base uppercase tracking-wider flex items-center gap-2">
            <Receipt size={16} /> Receipt Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">

          {/* ── Logo Upload ── */}
          <div className="space-y-2">
            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <ImageIcon size={12} /> Company Logo
            </Label>

            {logoPreview ? (
              /* Preview with remove + change buttons */
              <div className="space-y-2">
                <div className="relative w-fit">
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="h-20 max-w-[200px] object-contain rounded-lg border border-border bg-muted/30 p-2"
                  />
                  {uploadingLogo && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50">
                      <Loader2 size={20} className="text-white animate-spin" />
                    </div>
                  )}
                  {!uploadingLogo && (
                    <button
                      onClick={handleRemoveLogo}
                      title="Remove logo"
                      className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5 hover:opacity-80 transition-opacity"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
                {!uploadingLogo && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload size={12} className="mr-1.5" /> Change Logo
                  </Button>
                )}
              </div>
            ) : (
              /* Drop zone */
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-lg p-8 cursor-pointer hover:border-primary/50 hover:bg-muted/20 transition-all select-none"
              >
                {uploadingLogo ? (
                  <Loader2 size={28} className="text-muted-foreground animate-spin" />
                ) : (
                  <>
                    <div className="p-3 rounded-full bg-muted">
                      <Upload size={20} className="text-muted-foreground" />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-medium text-foreground">Click to upload logo</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">PNG, JPG, SVG, WEBP · Max 2MB</p>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
              className="hidden"
              onChange={handleLogoChange}
            />
          </div>

          {/* Company Name */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Building2 size={12} /> Company Name
            </Label>
            <Input
              value={settings.company_name}
              onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
              placeholder="e.g. RaidKhalid & Co."
            />
          </div>

          {/* Address */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <MapPin size={12} /> Address
            </Label>
            <Input
              value={settings.address}
              onChange={(e) => setSettings({ ...settings, address: e.target.value })}
              placeholder="e.g. 123 Main St, Cagayan de Oro City"
            />
          </div>

          {/* TIN No */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Hash size={12} /> TIN No.
            </Label>
            <Input
              value={settings.tin_no}
              onChange={(e) => setSettings({ ...settings, tin_no: e.target.value })}
              placeholder="e.g. 000-123-456-000"
            />
          </div>

          {/* VAT Rate */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Percent size={12} /> VAT Rate (%)
            </Label>
            <Input
              type="number"
              min={0}
              max={100}
              value={settings.vat_rate}
              onChange={(e) => setSettings({ ...settings, vat_rate: parseFloat(e.target.value) || 0 })}
              placeholder="12"
            />
          </div>

          <Button
            onClick={handleSave}
            disabled={saving || uploadingLogo}
            className="w-full font-heading uppercase tracking-wider"
          >
            <Save size={14} className="mr-2" />
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </CardContent>
      </Card>

      {/* ── Live Receipt Preview ── */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base uppercase tracking-wider flex items-center gap-2">
            <Receipt size={16} /> Receipt Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="mx-auto font-mono text-xs text-foreground border border-dashed border-border rounded-lg p-5 space-y-3 bg-white dark:bg-zinc-950"
            style={{ maxWidth: 300 }}
          >
            <div className="text-center space-y-1 pb-2 border-b border-dashed border-border">
              {logoPreview && (
                <img
                  src={logoPreview}
                  alt="Logo"
                  className="h-14 object-contain mx-auto mb-1"
                />
              )}
              <p className="font-bold text-sm leading-tight">
                {settings.company_name || "Company Name"}
              </p>
              {settings.tin_no && (
                <p className="text-[10px] text-muted-foreground">TIN: {settings.tin_no}</p>
              )}
              {settings.address && (
                <p className="text-[10px] text-muted-foreground">{settings.address}</p>
              )}
              <p className="text-[10px] text-muted-foreground">{now}</p>
              <p className="text-[10px] text-muted-foreground">Receipt: POS-PREVIEW</p>
            </div>

            <p className="text-center font-bold text-xs tracking-widest uppercase">
              Official Receipt
            </p>

            <div className="flex justify-between text-[10px] font-bold border-b border-border pb-1">
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

            <div className="border-t border-dashed border-border pt-2 space-y-0.5">
              <div className="flex justify-between text-[10px]">
                <span>Subtotal</span>
                <span>₱{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span>VAT ({settings.vat_rate}%)</span>
                <span>₱{vatAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-xs pt-1 border-t border-border">
                <span>Total</span>
                <span>₱{total.toFixed(2)}</span>
              </div>
            </div>

            <p className="text-center text-[10px] text-muted-foreground pt-1">
              Thank you for your purchase!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReceiptSettingsTab;
