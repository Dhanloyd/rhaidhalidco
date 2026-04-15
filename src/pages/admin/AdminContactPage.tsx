import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Save, RotateCcw, Eye, EyeOff, Search } from "lucide-react";

const defaultContent = {
  hero_title: "Contact Us",
  hero_subtitle: "Get in touch with RaidKhalid & Co.",
  address: "RK Arena, 123 Basketball Blvd, Manila, Philippines",
  phone: "+63 912 345 6789",
  email: "hello@raidkhalid.co",
  location_search: "",
  map_embed_url:
    "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3861.802548850607!2d120.9822!3d14.5547!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTTCsDMzJzE3LjAiTiAxMjDCsDU4JzU2LjAiRQ!5e0!3m2!1sen!2sph!4v1",
  is_deleted: false,
};

type ContentType = typeof defaultContent;

const buildMapEmbedUrl = (query: string): string => {
  const encoded = encodeURIComponent(query.trim());
  return `https://maps.google.com/maps?q=${encoded}&z=15&output=embed`;
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
  const [data, setData] = useState<ContentType>(defaultContent);
  const [recordId, setRecordId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [locationSearch, setLocationSearch] = useState("");

  const dataRef = useRef<ContentType>(data);
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  // ── Load from DB ──────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data: row, error } = await supabase
        .from("page_content")
        .select("*")
        .eq("page", "contact")
        .maybeSingle();

      if (error) {
        console.error("Failed to load contact page content:", error);
        toast.error("Failed to load saved content.");
      }

      if (row?.id) {
        setRecordId(row.id);
        const content: ContentType = {
          ...defaultContent,
          ...(row.content as ContentType),
        };
        setData(content);
        dataRef.current = content;
        setLocationSearch(content.location_search || "");
      }

      setLoading(false);
    };

    load();
  }, []);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const applyPatch = (patch: Partial<ContentType>): ContentType => {
    const next = { ...dataRef.current, ...patch };
    dataRef.current = next;
    setData(next);
    return next;
  };

const persist = async (payload: ContentType): Promise<boolean> => {
  setSaving(true);

  try {
    const jsonPayload = JSON.parse(JSON.stringify(payload));

    const upsertData = {
      page_key: "contact",
      section_key: "main",
      title: "Contact Page",
      content: jsonPayload,
      image_url: null,
      metadata: {},
    };

    const { data, error } = await supabase
      .from("page_content")
      .upsert(upsertData, {
        onConflict: "page_key,section_key",
      })
      .select("id")
      .single();

    if (error) throw error;

    if (data?.id) setRecordId(data.id);

    return true;
  } catch (err) {
    console.error("Save error FULL:", err);
    toast.error("Failed to save.");
    return false;
  } finally {
    setSaving(false);
  }
};
  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleSearchLocation = () => {
    const query = locationSearch.trim();
    if (!query) return;
    applyPatch({
      map_embed_url: buildMapEmbedUrl(query),
      location_search: query,
    });
    toast.info("Map preview updated. Click Save Changes to publish.");
  };

  const handleSave = async () => {
    const payload: ContentType = {
      ...dataRef.current,
      location_search: locationSearch,
    };
    dataRef.current = payload;
    const ok = await persist(payload);
    if (ok) toast.success("Contact page saved!");
  };

  const handleReset = async () => {
    const ok = await persist(defaultContent);
    if (ok) {
      dataRef.current = defaultContent;
      setData(defaultContent);
      setLocationSearch("");
      toast.success("Reset to defaults.");
    }
  };

  const handleToggleDelete = async () => {
    const updated = applyPatch({ is_deleted: !dataRef.current.is_deleted });
    const ok = await persist(updated);
    if (ok) {
      toast.success(
        updated.is_deleted
          ? "Contact info hidden from public page."
          : "Contact info visible on public page."
      );
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-heading text-2xl uppercase tracking-wider text-foreground">
            Contact Page
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Edit the public Contact page content
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            onClick={handleToggleDelete}
            disabled={saving}
            className={`gap-2 font-heading uppercase tracking-wider ${
              data.is_deleted
                ? "border-green-500 text-green-600"
                : "border-red-500 text-red-500"
            }`}
          >
            {data.is_deleted ? (
              <><Eye size={14} /> Show on Site</>
            ) : (
              <><EyeOff size={14} /> Hide from Site</>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={saving}
            className="gap-2 font-heading uppercase tracking-wider"
          >
            <RotateCcw size={14} /> Reset
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="gap-2 bg-primary text-primary-foreground font-heading uppercase tracking-wider"
          >
            <Save size={16} /> {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {data.is_deleted && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">
          ⚠️ Contact info is currently <strong>hidden</strong> from the public page.
          Click "Show on Site" to make it visible again.
        </div>
      )}

      <Card>
        <CardContent className="pt-6 space-y-8">

          {/* Hero */}
          <div className="space-y-4">
            <SectionHeading>Hero Section</SectionHeading>
            <div>
              <Label>Page Title</Label>
              <Input
                value={data.hero_title}
                onChange={(e) => applyPatch({ hero_title: e.target.value })}
              />
            </div>
            <div>
              <Label>Subtitle</Label>
              <Textarea
                rows={2}
                value={data.hero_subtitle}
                onChange={(e) => applyPatch({ hero_subtitle: e.target.value })}
              />
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <SectionHeading>Contact Information</SectionHeading>
            <div>
              <Label>Address</Label>
              <Input
                value={data.address}
                onChange={(e) => applyPatch({ address: e.target.value })}
              />
            </div>
            <div>
              <Label>Phone</Label>
              <Input
                value={data.phone}
                onChange={(e) => applyPatch({ phone: e.target.value })}
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={data.email}
                onChange={(e) => applyPatch({ email: e.target.value })}
              />
            </div>
          </div>

          {/* Map */}
          <div className="space-y-3">
            <SectionHeading>Map Location</SectionHeading>

            <div>
              <Label>
                Google Maps Embed URL{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  — paste the <code>src</code> from Google Maps → Share → Embed a map
                </span>
              </Label>
              <Input
                value={data.map_embed_url}
                onChange={(e) => applyPatch({ map_embed_url: e.target.value })}
                placeholder="https://www.google.com/maps/embed?pb=..."
              />
            </div>

            <div>
              <Label>Or search by place name</Label>
              <div className="flex gap-2">
                <Input
                  value={locationSearch}
                  onChange={(e) => setLocationSearch(e.target.value)}
                  placeholder="e.g. Ipil, Zamboanga Sibugay"
                  onKeyDown={(e) => e.key === "Enter" && handleSearchLocation()}
                />
                <Button
                  onClick={handleSearchLocation}
                  variant="outline"
                  className="gap-2 shrink-0"
                >
                  <Search size={16} /> Search
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">
                After searching, click <strong>Save Changes</strong> to publish.
              </p>
            </div>

            {data.map_embed_url && (
              <div className="rounded-xl overflow-hidden border border-border/50">
                <iframe
                  key={data.map_embed_url}
                  src={data.map_embed_url}
                  width="100%"
                  height="260"
                  style={{ border: 0 }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Map preview"
                />
              </div>
            )}
          </div>

        </CardContent>
      </Card>
    </div>
  );
};

export default AdminContactPage;
