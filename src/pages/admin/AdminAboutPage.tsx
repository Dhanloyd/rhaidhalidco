import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Save, RotateCcw } from "lucide-react";

const defaultContent = {
  hero_title: "About Us",
  hero_subtitle: "The story behind RaidKhalid & Co. — a franchise built on passion, discipline, and the love of basketball.",
  story_title: "Our Story",
  story_paragraph1: "Founded in 2018, RaidKhalid & Co. began as a dream shared by a group of basketball enthusiasts who wanted to create more than just a team — they wanted to build a movement. What started as pickup games in local courts quickly grew into an organized franchise with a dedicated fanbase.",
  story_paragraph2: "Today, RaidKhalid & Co. stands as a symbol of perseverance, teamwork, and community. With a roster of elite players, a thriving merchandise line, and community programs reaching hundreds of young athletes, we continue to push boundaries and redefine what a basketball organization can be.",
  values_title: "Our Values",
  value1_title: "Mission", value1_desc: "To build a world-class basketball organization that inspires greatness on and off the court.",
  value2_title: "Vision",  value2_desc: "To become the most respected basketball franchise in the region, known for excellence and integrity.",
  value3_title: "Community", value3_desc: "We believe in giving back — developing youth talent and strengthening our community through sport.",
  value4_title: "Excellence", value4_desc: "Every game, every practice, every interaction — we pursue excellence in everything we do.",
};

const Label = ({ children }: { children: React.ReactNode }) => (
  <label className="text-sm font-medium text-foreground block mb-1">{children}</label>
);

const SectionHeading = ({ children }: { children: React.ReactNode }) => (
  <h3 className="font-heading text-base uppercase tracking-wider text-foreground mb-4 pb-2 border-b border-border/50">
    {children}
  </h3>
);

const AdminAboutPage = () => {
  const [data, setData] = useState(defaultContent);
  const [recordId, setRecordId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase
      .from("page_content")
      .select("*")
      .eq("page", "about")
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
      const { data: row } = await supabase.from("page_content").insert({ page: "about", content: payload }).select().single();
      if (row) setRecordId(row.id);
    }
    setSaving(false);
  };

  const handleSave = async () => { await persist(data); toast.success("About page saved!"); };
  const handleReset = async () => { setData(defaultContent); await persist(defaultContent); toast.success("Reset to defaults."); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-heading text-2xl uppercase tracking-wider text-foreground">About Page</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Edit the public About page content</p>
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

        {/* Story */}
        <div className="space-y-4">
          <SectionHeading>Our Story</SectionHeading>
          <div><Label>Section Title</Label><Input value={data.story_title} onChange={(e) => set("story_title", e.target.value)} /></div>
          <div><Label>Paragraph 1</Label><Textarea rows={4} value={data.story_paragraph1} onChange={(e) => set("story_paragraph1", e.target.value)} /></div>
          <div><Label>Paragraph 2</Label><Textarea rows={4} value={data.story_paragraph2} onChange={(e) => set("story_paragraph2", e.target.value)} /></div>
        </div>

        {/* Values */}
        <div className="space-y-4">
          <SectionHeading>Our Values</SectionHeading>
          <div><Label>Section Title</Label><Input value={data.values_title} onChange={(e) => set("values_title", e.target.value)} /></div>
          <div className="grid md:grid-cols-2 gap-4">
            {([1, 2, 3, 4] as const).map((n) => (
              <div key={n} className="bg-muted/50 rounded-xl p-4 border border-border/40 space-y-3">
                <div><Label>Value {n} — Title</Label><Input value={(data as any)[`value${n}_title`]} onChange={(e) => set(`value${n}_title`, e.target.value)} /></div>
                <div><Label>Description</Label><Textarea rows={3} value={(data as any)[`value${n}_desc`]} onChange={(e) => set(`value${n}_desc`, e.target.value)} /></div>
              </div>
            ))}
          </div>
        </div>
      </CardContent></Card>
    </div>
  );
};

export default AdminAboutPage;
