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

  map_lat: 7.0731,
  map_lng: 125.6128,
  map_address: "Davao City, Philippines",

  is_deleted: false,
};

const Label = ({ children }: any) => (
  <label className="text-sm font-medium block mb-1">{children}</label>
);

const Section = ({ children }: any) => (
  <h3 className="text-sm font-semibold uppercase border-b pb-2 mb-4">
    {children}
  </h3>
);

// 🔎 SEARCH LOCATION
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

  // 📥 LOAD
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

  // 💾 SAVE
  const save = async (payload: typeof defaultContent) => {
    setSaving(true);

    const body = {
      page: "contact",
      content: payload,
      is_deleted: payload.is_deleted,
    };

    if (recordId) {
      await supabase.from("page_content").update(body).eq("id", recordId);
    } else {
      const { data: row } = await supabase
        .from("page_content")
        .insert(body)
        .select()
        .single();

      if (row) setRecordId(row.id);
    }

    setSaving(false);
  };

  // 🗑 HIDE
  const hide = async () => {
    if (!recordId) return;

    await supabase
      .from("page_content")
      .update({ is_deleted: true })
      .eq("id", recordId);

    toast.success("Hidden");
    setData(defaultContent);
    setRecordId(null);
  };

  // ♻️ RESTORE
  const restore = async () => {
    await supabase
      .from("page_content")
      .update({ is_deleted: false })
      .eq("page", "contact");

    toast.success("Restored");
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold">Contact Admin</h1>

        <div className="flex gap-2">
          <Button onClick={() => save(data)}>
            <Save size={14} /> Save
          </Button>

          <Button variant="outline" onClick={hide}>
            <EyeOff size={14} /> Hide
          </Button>

          <Button variant="outline" onClick={restore}>
            <Eye size={14} /> Restore
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="space-y-6 pt-6">

          {/* CONTACT */}
          <div>
            <Section>Contact Info</Section>

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

          {/* SEARCH */}
          <div>
            <Section>Search Location</Section>

            <Input
              placeholder="Type place then press Enter"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  searchPlace(
                    (e.target as HTMLInputElement).value,
                    setData
                  );
                }
              }}
            />
          </div>

          {/* MAP */}
          <LocationPicker
            lat={data.map_lat}
            lng={data.map_lng}
            setLocation={(lat, lng) =>
              setData((d) => ({
                ...d,
                map_lat: lat,
                map_lng: lng,
              }))
            }
          />

        </CardContent>
      </Card>
    </div>
  );
};

export default AdminContactPage;