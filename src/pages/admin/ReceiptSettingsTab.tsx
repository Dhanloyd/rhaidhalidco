

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Receipt, Save, Building2, MapPin, Hash, Percent, ImageIcon } from "lucide-react";

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
    }
    setLoading(false);
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

  // Live receipt preview
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

          {/* Logo URL */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <ImageIcon size={12} /> Logo URL (optional)
            </Label>
            <Input
              value={settings.logo_url || ""}
              onChange={(e) => setSettings({ ...settings, logo_url: e.target.value || null })}
              placeholder="https://your-domain.com/logo.png"
            />
            {settings.logo_url && (
              <img
                src={settings.logo_url}
                alt="Logo preview"
                className="h-14 object-contain rounded border border-border mt-1"
              />
            )}
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full font-heading uppercase tracking-wider">
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
            {/* Header */}
            <div className="text-center space-y-1 pb-2 border-b border-dashed border-border">
              {settings.logo_url && (
                <img
                  src={settings.logo_url}
                  alt="Logo"
                  className="h-12 object-contain mx-auto mb-1"
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

            {/* Title */}
            <p className="text-center font-bold text-xs tracking-widest uppercase">
              Official Receipt
            </p>

            {/* Items header */}
            <div className="flex justify-between text-[10px] font-bold border-b border-border pb-1">
              <span className="flex-1">Item</span>
              <span className="w-8 text-center">Qty</span>
              <span className="w-16 text-right">Amount</span>
            </div>

            {/* Items */}
            <div className="space-y-0.5">
              {sampleItems.map((item, i) => (
                <div key={i} className="flex justify-between text-[10px]">
                  <span className="flex-1 truncate">{item.name}</span>
                  <span className="w-8 text-center">{item.qty}</span>
                  <span className="w-16 text-right">₱{(item.price * item.qty).toLocaleString()}</span>
                </div>
              ))}
            </div>

            {/* Totals */}
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
