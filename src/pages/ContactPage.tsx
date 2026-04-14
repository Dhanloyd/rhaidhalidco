import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// fix marker
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export default function ContactPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    supabase
      .from("page_content")
      .select("*")
      .eq("page", "contact")
      .eq("is_deleted", false)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;

        // 🔥 FIX: content extraction
        setData(data.content ?? data);
      });
  }, []);

  if (!data) return <p>Loading...</p>;

  return (
    <div className="space-y-4">
      <h1>{data.hero_title}</h1>
      <p>{data.hero_subtitle}</p>

      <p>{data.address}</p>

      {/* MAP */}
      {data.map_lat && data.map_lng ? (
        <MapContainer
          center={[data.map_lat, data.map_lng]}
          zoom={15}
          style={{ height: "300px", width: "100%" }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Marker position={[data.map_lat, data.map_lng]} />
        </MapContainer>
      ) : (
        <p>No map location set</p>
      )}
    </div>
  );
}