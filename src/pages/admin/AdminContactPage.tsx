import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Save, RotateCcw, EyeOff, Eye } from "lucide-react";
import LocationPicker from "@/components/LocationPicker";

const defaultContent = {
  hero_title: "Contact Us",
  hero_subtitle: "Get in touch with RaidKhalid & Co.",
  address: "Davao City, Philippines",
  phone: "+63 912 345 6789",
  email: "hello@raidkhalid.co",

  // ✅ MAP DATA
  map_lat: 7.0731,
  map_lng: 125.6128,
  map_address: "Davao City, Philippines",

  // ✅ SOFT DELETE
  is_deleted: false,
};

const Label = ({ children }: any) => (
  <label className="text-sm font-medium block mb-1">{children}</label>
);

const SectionHeading = ({ children }: any) => (
  <h3 className="text-base uppercase mb-4 border-b pb-2">{children}</h3>
);

// 🔎 SEARCH FUNCTION
const searchPlace = async (query: string, setData: any) => {
  if (!query) return;

  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${query}`
  );
  const results = await res.json();

  if (results.length > 0) {
    const place = results[0];
    setData((d: any) => ({
      ...d,
      map_lat: parseFloat(place.lat),
      map_lng: parseFloat(place.lon),
      map_address: place.display_name,
    }));
  } else {
    toast.error("Location not found");
  }
};

const AdminContactPage = () => {
  const [data, setData] = useState(defaultContent);
  const [recordId, setRecordId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // ✅ LOAD ONLY NOT DELETED
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
          setData({ ...defaultContent, ...row.content, is_deleted: row.is_deleted });
        }
      });
  }, []);

  const set = (key: string, value: any) =>
    setData((d) => ({ ...d, [key]: value }));

  // ✅ SAVE WITH SOFT DELETE FIELD
  const persist = async (payload: typeof defaultContent) => {
    setSaving(true);

    const dataToSave = {
      page: "contact",
      content: payload,
      is_deleted: payload.is_deleted ?? false,
    };

    if (recordId) {
      await supabase
        .from("page_content")
        .update(dataToSave)
        .eq("id", recordId);
    } else {
      const { data: row } = await supabase
        .from("page_content")
        .insert(dataToSave)
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
    toast.success("Reset complete!");
  };

  // 🔥 SOFT DELETE (HIDE)
  const handleHide = async () => {
    if (!recordId) return;

    await supabase
      .from("page_content")
      .update({ is_deleted: true })
      .eq("id", recordId);

    toast.success("Page hidden (soft deleted)");
    setRecordId(null);
    setData(defaultContent);
  };

  // 🔥 RESTORE
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
        <h1 className="text-2xl font-bold">Contact Page</h1>

        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={handleReset} disabled={saving}>
            <RotateCcw size={14} /> Reset
          </Button>

          <Button onClick={handleSave} disabled={saving}>
            <Save size={16} /> {saving ? "Saving..." : "Save"}
          </Button>

          {/* 🔥 SOFT DELETE */}
          <Button variant="destructive" onClick={handleHide}>
            <EyeOff size={16} /> Hide
          </Button>

          {/* 🔥 RESTORE */}
          <Button variant="outline" onClick={handleRestore}>
            <Eye size={16} /> Restore
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="space-y-6 pt-6">
          {/* CONTACT INFO */}
          <div>
            <SectionHeading>Contact Info</SectionHeading>

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
            <SectionHeading>Map Picker</SectionHeading>

            <Label>Search Location</Label>
            <Input
              placeholder="Type location then press Enter"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  searchPlace((e.target as HTMLInputElement).value, setData);
                }
              }}
            />

            <Label className="mt-3">Selected Address</Label>
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