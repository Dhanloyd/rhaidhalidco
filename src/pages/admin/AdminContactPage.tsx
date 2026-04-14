import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Save, RotateCcw } from "lucide-react";
import LocationPicker from "@/components/LocationPicker";

const defaultContent = {
  hero_title: "Contact Us",
  hero_subtitle: "Get in touch with RaidKhalid & Co.",
  address: "Davao City, Philippines",
  phone: "+63 912 345 6789",
  email: "hello@raidkhalid.co",
  map_lat: 7.0731,
  map_lng: 125.6128,
  map_address: "Davao City, Philippines",
};

const Label = ({ children }: any) => (
  <label className="text-sm font-medium text-foreground block mb-1">{children}</label>
);

const SectionHeading = ({ children }: any) => (
  <h3 className="font-heading text-base uppercase tracking-wider mb-4 border-b pb-2">
    {children}
  </h3>
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

  useEffect(() => {
    supabase
      .from("page_content")
      .select("*")
      .eq("page", "contact")
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

  const persist = async (payload: typeof defaultContent) => {
    setSaving(true);
    if (recordId) {
      await supabase
        .from("page_content")
        .update({ content: payload })
        .eq("id", recordId);
    } else {
      const { data: row } = await supabase
        .from("page_content")
        .insert({ page: "contact", content: payload })
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Contact Page</h1>

        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset} disabled={saving}>
            <RotateCcw size={14} /> Reset
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save size={16} /> {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="space-y-6 pt-6">
          {/* Contact Info */}
          <div>
            <SectionHeading>Contact Info</SectionHeading>

            <Label>Address</Label>
            <Input value={data.address} onChange={(e) => set("address", e.target.value)} />

            <Label>Phone</Label>
            <Input value={data.phone} onChange={(e) => set("phone", e.target.value)} />

            <Label>Email</Label>
            <Input value={data.email} onChange={(e) => set("email", e.target.value)} />
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