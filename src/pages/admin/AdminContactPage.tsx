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
  address: "",
  phone: "",
  email: "",
  map_embed_url: "",
};

const AdminContactPage = () => {
  const [data, setData] = useState(defaultContent);
  const [recordId, setRecordId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: row } = await supabase
        .from("page_content")
        .select("*")
        .eq("page", "contact")
        .maybeSingle();

      if (row) {
        setRecordId(row.id);
        setData({
          ...defaultContent,
          ...(row.content ?? {}),
        });
      }
    };

    load();
  }, []);

  const set = (key: string, value: string) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const persist = async (payload: typeof defaultContent) => {
    setSaving(true);

    try {
      const { error } = await supabase.from("page_content").upsert(
        {
          page: "contact",
          content: payload,
        },
        { onConflict: "page" }
      );

      if (error) throw error;

      toast.success("Contact page saved!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    await persist(data);
  };

  const handleReset = async () => {
    setData(defaultContent);
    await persist(defaultContent);
    toast.success("Reset done!");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Contact Page Admin</h1>

        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset} disabled={saving}>
            <RotateCcw size={14} /> Reset
          </Button>

          <Button onClick={handleSave} disabled={saving}>
            <Save size={14} /> {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="space-y-6 pt-6">
          <div>
            <label>Title</label>
            <Input
              value={data.hero_title}
              onChange={(e) => set("hero_title", e.target.value)}
            />
          </div>

          <div>
            <label>Subtitle</label>
            <Textarea
              value={data.hero_subtitle}
              onChange={(e) => set("hero_subtitle", e.target.value)}
            />
          </div>

          <div>
            <label>Address (SEARCHABLE TEXT)</label>
            <Input
              value={data.address}
              onChange={(e) => set("address", e.target.value)}
            />
          </div>

          <div>
            <label>Phone</label>
            <Input
              value={data.phone}
              onChange={(e) => set("phone", e.target.value)}
            />
          </div>

          <div>
            <label>Email</label>
            <Input
              value={data.email}
              onChange={(e) => set("email", e.target.value)}
            />
          </div>

          <div>
            <label>Google Maps Embed URL</label>
            <Textarea
              value={data.map_embed_url}
              onChange={(e) => set("map_embed_url", e.target.value)}
              placeholder="Paste iframe src here"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminContactPage;