import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Save, RotateCcw, EyeOff, Eye } from "lucide-react";
import LocationPicker from "@/components/LocationPicker";

const defaultContent = {
  hero_title: "Contact Us",
  hero_subtitle: "Get in touch with us",
  address: "Davao City, Philippines",
  phone: "+63 900 000 0000",
  email: "hello@email.com",

  // 🗺 MAP DATA
  map_lat: 7.0731,
  map_lng: 125.6128,
  map_address: "Davao City, Philippines",

  // 🗑 SOFT DELETE FLAG
  is_deleted: false,
};

const Label = ({ children }: any) => (
  <label className="text-sm font-medium block mb-1">{children}</label>
);

const SectionTitle = ({ children }: any) => (
  <h3 className="text-base font-semibold uppercase tracking-wide border-b pb-2 mb-4">
    {children}
  </h3>
);

// 🔎 SEARCH LOCATION (FREE OpenStreetMap API)
const searchPlace = async (query: string, setData: any) => {
  if (!query) return;

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${query}`
    );

    const results = await res.json();

    if (results.length > 0) {
      const place = results[0];

      const lat = parseFloat(place.lat);
      const lng = parseFloat(place.lon);

      setData((d: any) => ({
        ...d,
        map_lat: lat,
        map_lng: lng,
        map_address: place.display_name,
      }));
    } else {
      alert("Location not found");
    }
  } catch (err) {
    console.error(err);
  }
};

const AdminContactPage = () => {
  const [data, setData] = useState(defaultContent);
  const [recordId, setRecordId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // 📥 LOAD DATA (only active)
  useEffect(() => {
    supabase
      .from("page_content")
      .select("*")
      .eq("page", "contact")
      .eq("is_deleted", false)
      .maybeSingle()
      .then(({ data: row }) => {
        if (row) {
          setRecordId(row.id);
          setData({ ...defaultContent, ...row.content });
        }
      });
  }, []);

  const set = (key: string, value: any) =>
    setData((d) => ({ ...d, [key]: value }));

  // 💾 SAVE / UPDATE
  const persist = async (payload: typeof defaultContent) => {
    setSaving(true);

    const payloadToSave = {
      page: "contact",
      content: payload,
      is_deleted: payload.is_deleted ?? false,
    };

    if (recordId) {
      await supabase
        .from("page_content")
        .update(payloadToSave)
        .eq("id", recordId);
    } else {
      const { data: row } = await supabase
        .from("page_content")
        .insert(payloadToSave)
        .select()
        .single();

      if (row) setRecordId(row.id);
    }

    setSaving(false);
  };

  const handleSave = async () => {
    await persist(data);
    toast.success("Saved successfully!");
  };

  const handleReset = async () => {
    setData(defaultContent);
    await persist(defaultContent);
    toast.success("Reset done!");
  };

  // 🗑 SOFT DELETE (HIDE)
  const handleHide = async () => {
    if (!recordId) return;

    await supabase
      .from("page_content")
      .update({ is_deleted: true })
      .eq("id", recordId);

    toast.success("Page hidden");
    setRecordId(null);
    setData(defaultContent);
  };

  // ♻️ RESTORE
  const handleRestore = async () => {
    await supabase
      .from("page_content")
      .update({ is_deleted: false })
      .eq("page", "contact");

    toast.success("Page restored!");
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Contact Admin Page</h1>

        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw size={14} /> Reset
          </Button>

          <Button onClick={handleSave}>
            <Save size={14} /> Save
          </Button>

          <Button variant="destructive" onClick={handleHide}>
            <EyeOff size={14} /> Hide
          </Button>

          <Button variant="outline" onClick={handleRestore}>
            <Eye size={14} /> Restore
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="space-y-6 pt-6">

          {/* HERO */}
          <div>
            <SectionTitle>Hero Section</SectionTitle>

            <Label>Title</Label>
            <Input
              value={data.hero_title}
              onChange={(e) => set("hero_title", e.target.value)}
            />

            <Label>Subtitle</Label>
            <Textarea
              value={data.hero_subtitle}
              onChange={(e) => set("hero_subtitle", e.target.value)}
            />
          </div>

          {/* CONTACT */}
          <div>
            <SectionTitle>Contact Info</SectionTitle>

            <Label>Address</Label>
            <Input
              value={data.address}
              onChange={(e) => set("address", e.target.value)}
            />

            <Label>Phone</Label>
            <Input
              value={data.phone}
              onChange={(e) => set("phone", e.target.value)}
            />

            <Label>Email</Label>
            <Input
              value={data.email}
              onChange={(e) => set("email", e.target.value)}
            />
          </div>

          {/* MAP PICKER */}
          <div>
            <SectionTitle>Map Picker</SectionTitle>

            <Label>Search Location</Label>
            <Input
              placeholder="Type location then press Enter"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  searchPlace((e.target as HTMLInputElement).value, setData);
                }
              }}
            />

            <Label>Selected Location</Label>
            <Input value={data.map_address} readOnly />

            <div className="mt-4">
              <LocationPicker
                lat={data.map_lat}
                lng={data.map_lng}
                setLocation={(lat: number, lng: number) =>
                  setData((d) => ({
                    ...d,
                    map_lat: lat,
                    map_lng: lng,
                  }))
                }
              />
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  );
};

export default AdminContactPage;