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
  hero_subtitle: "Get in touch with us",
  address: "RK Arena, Manila",
  phone: "+63 912 345 6789",
  email: "hello@email.com",
  location_query: "RK Arena Manila Philippines",
};

const Label = ({ children }: any) => (
  <label className="text-sm font-medium block mb-1">{children}</label>
);

const SectionHeading = ({ children }: any) => (
  <h3 className="text-base font-bold uppercase mb-3 border-b pb-2">
    {children}
  </h3>
);

export default function AdminContactPage() {
  const [data, setData] = useState(defaultContent);
  const [recordId, setRecordId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // LOAD
  useEffect(() => {
    supabase
      .from("page_content")
      .select("*")
      .eq("page", "contact")
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setRecordId(data.id);
          setData({ ...defaultContent, ...data.content });
        }
      });
  }, []);

  const set = (key: string, value: string) =>
    setData((prev) => ({ ...prev, [key]: value }));

  // SAVE
  const save = async (payload: any) => {
    setSaving(true);

    const body = {
      page: "contact",
      content: payload,
    };

    if (recordId) {
      await supabase.from("page_content").update(body).eq("id", recordId);
    } else {
      const { data } = await supabase
        .from("page_content")
        .insert(body)
        .select()
        .single();

      if (data) setRecordId(data.id);
    }

    setSaving(false);
    toast.success("Saved successfully!");
  };

  const reset = async () => {
    setData(defaultContent);
    await save(defaultContent);
    toast.success("Reset done!");
  };

  const mapUrl = data.location_query
    ? `https://www.google.com/maps?q=${encodeURIComponent(
        data.location_query
      )}&output=embed`
    : "";

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold">Contact Page Admin</h1>

        <div className="flex gap-2">
          <Button onClick={reset} variant="outline">
            <RotateCcw size={14} /> Reset
          </Button>

          <Button onClick={() => save(data)} disabled={saving}>
            <Save size={14} /> {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="space-y-6 pt-6">
          {/* HERO */}
          <SectionHeading>Hero</SectionHeading>

          <div>
            <Label>Title</Label>
            <Input
              value={data.hero_title}
              onChange={(e) => set("hero_title", e.target.value)}
            />
          </div>

          <div>
            <Label>Subtitle</Label>
            <Textarea
              value={data.hero_subtitle}
              onChange={(e) => set("hero_subtitle", e.target.value)}
            />
          </div>

          {/* CONTACT */}
          <SectionHeading>Contact Info</SectionHeading>

          <Input
            placeholder="Address"
            value={data.address}
            onChange={(e) => set("address", e.target.value)}
          />

          <Input
            placeholder="Phone"
            value={data.phone}
            onChange={(e) => set("phone", e.target.value)}
          />

          <Input
            placeholder="Email"
            value={data.email}
            onChange={(e) => set("email", e.target.value)}
          />

          {/* LOCATION */}
          <SectionHeading>Location Search</SectionHeading>

          <Input
            placeholder="Search location (e.g. Manila Mall)"
            value={data.location_query}
            onChange={(e) => set("location_query", e.target.value)}
          />

          {mapUrl && (
            <iframe
              src={mapUrl}
              width="100%"
              height="250"
              style={{ border: 0 }}
              loading="lazy"
              title="Map"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}