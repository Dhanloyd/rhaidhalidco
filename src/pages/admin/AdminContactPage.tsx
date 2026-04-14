import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Save, RotateCcw } from "lucide-react";

const defaultContent = {
  hero_title: "Contact Us",
  hero_subtitle: "Get in touch with RaidKhalid & Co.",
  address: "RK Arena, 123 Basketball Blvd, Manila, Philippines",
  phone: "+63 912 345 6789",
  email: "hello@raidkhalid.co",
  map_embed_url: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3861.802548850607!2d120.9822!3d14.5547!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTTCsDMzJzE3LjAiTiAxMjDCsDU4JzU2LjAiRQ!5e0!3m2!1sen!2sph!4v1",
};

const Label = ({ children }: { children: React.ReactNode }) => (
  <label className="text-sm font-medium text-foreground block mb-1">{children}</label>
);

const SectionHeading = ({ children }: { children: React.ReactNode }) => (
  <h3 className="font-heading text-base uppercase tracking-wider text-foreground mb-4 pb-2 border-b border-border/50">
    {children}
  </h3>
);

const AdminContactPage = () => {
  const [data, setData] = useState(defaultContent);
  const [recordId, setRecordId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase
      .from("page_content")
      .select("*")
      .eq("page", "contact")
      .maybeSingle()
      .then(({ data: row }) => {
        if (row) { setRecordId(row.id); setData({ ...defaultContent, ...row.content }); }
      });
  }, []);

  const set = (key: string, value: string) => setData((d) => ({ ...d, [key]: value }));

  const persist = async (payload: typeof defaultContent) => {
    setSaving(true);
    if (recordId) {
      await supabase.from("page_content").update({ content: payload }).eq("id", recordId);
    } else {
      const { data: row } = await supabase.from("page_content").insert({ page: "contact", content: payload }).select().single();
      if (row) setRecordId(row.id);
    }
    setSaving(false);
  };

  const handleSave = async () => { await persist(data); toast.success("Contact page saved!"); };
  const handleReset = async () => { setData(defaultContent); await persist(defaultContent); toast.success("Reset to defaults."); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-heading text-2xl uppercase tracking-wider text-foreground">Contact Page</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Edit the public Contact page content</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset} disabled={saving} className="gap-2 font-heading uppercase tracking-wider">
            <RotateCcw size={14} /> Reset
          </Button>
          <Button onClick={handleSave} disabled={saving} className="gap-2 bg-primary text-primary-foreground font-heading uppercase tracking-wider">
            <Save size={16} /> {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      <Card><CardContent className="pt-6 space-y-8">
        {/* Hero */}
        <div className="space-y-4">
          <SectionHeading>Hero Section</SectionHeading>
          <div><Label>Page Title</Label><Input value={data.hero_title} onChange={(e) => set("hero_title", e.target.value)} /></div>
          <div><Label>Subtitle</Label><Textarea rows={2} value={data.hero_subtitle} onChange={(e) => set("hero_subtitle", e.target.value)} /></div>
        </div>

        {/* Contact Info */}
        <div className="space-y-4">
          <SectionHeading>Contact Information</SectionHeading>
          <div><Label>Address</Label><Input value={data.address} onChange={(e) => set("address", e.target.value)} /></div>
          <div><Label>Phone</Label><Input value={data.phone} onChange={(e) => set("phone", e.target.value)} /></div>
          <div><Label>Email</Label><Input type="email" value={data.email} onChange={(e) => set("email", e.target.value)} /></div>
        </div>

        {/* Map */}
        <div className="space-y-3">
          <SectionHeading>Google Maps Embed</SectionHeading>
          <div>
            <Label>Embed URL</Label>
            <Textarea rows={3} value={data.map_embed_url} onChange={(e) => set("map_embed_url", e.target.value)} placeholder='Paste the src="..." URL from Google Maps embed code' />
            <p className="text-xs text-muted-foreground mt-1.5">
              Google Maps → Share → Embed a map → copy only the <code>src="..."</code> value.
            </p>
          </div>
          {data.map_embed_url && (
            <div className="rounded-xl overflow-hidden border border-border/50">
              <iframe src={data.map_embed_url} width="100%" height="240" style={{ border: 0 }} loading="lazy" title="Map preview" />
            </div>
          )}
        </div>
      </CardContent></Card>
    </div>
  );
};

export default AdminContactPage;
