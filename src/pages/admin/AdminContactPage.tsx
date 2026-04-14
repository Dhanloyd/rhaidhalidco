import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import LocationPicker from "@/components/LocationPicker";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const defaultContent = {
  hero_title: "Contact Us",
  hero_subtitle: "Get in touch",
  address: "Davao City",
  phone: "",
  email: "",

  map_lat: 7.0731,
  map_lng: 125.6128,
  map_address: "Davao City",

  is_deleted: false,
};

export default function AdminContactPage() {
  const [data, setData] = useState(defaultContent);
  const [recordId, setRecordId] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("page_content")
      .select("*")
      .eq("page", "contact")
      .eq("is_deleted", false)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;

        setRecordId(data.id);

        // 🔥 IMPORTANT FIX: content may be inside JSON
        const content = data.content ?? data;

        setData((prev) => ({
          ...prev,
          ...content,
        }));
      });
  }, []);

  const save = async () => {
    const payload = {
      page: "contact",
      content: data,
      is_deleted: false,
    };

    if (recordId) {
      await supabase.from("page_content").update(payload).eq("id", recordId);
    } else {
      const { data: row } = await supabase
        .from("page_content")
        .insert(payload)
        .select()
        .single();

      if (row) setRecordId(row.id);
    }

    toast.success("Saved!");
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Admin Contact Page</h1>

      {/* CONTACT */}
      <div className="space-y-2">
        <Input
          placeholder="Address"
          value={data.address}
          onChange={(e) =>
            setData({ ...data, address: e.target.value })
          }
        />
      </div>

      {/* MAP SEARCH */}
      <div className="space-y-2">
        <Input
          placeholder="Search location..."
          onKeyDown={async (e) => {
            if (e.key !== "Enter") return;

            const q = (e.target as HTMLInputElement).value;

            const res = await fetch(
              `https://nominatim.openstreetmap.org/search?format=json&q=${q}`
            );
            const result = await res.json();

            if (result.length > 0) {
              const place = result[0];

              setData({
                ...data,
                map_lat: parseFloat(place.lat),
                map_lng: parseFloat(place.lon),
                map_address: place.display_name,
              });
            }
          }}
        />
      </div>

      {/* MAP */}
      <LocationPicker
        lat={data.map_lat}
        lng={data.map_lng}
        setLocation={(lat, lng) =>
          setData({ ...data, map_lat: lat, map_lng: lng })
        }
      />

      <Button onClick={save}>Save</Button>
    </div>
  );
}