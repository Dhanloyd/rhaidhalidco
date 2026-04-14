import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Phone, Mail } from "lucide-react";

export default function ContactPage() {
  const [content, setContent] = useState<any>(null);

  useEffect(() => {
    supabase
      .from("page_content")
      .select("*")
      .eq("page", "contact")
      .maybeSingle()
      .then(({ data }) => {
        if (data) setContent(data.content);
      });
  }, []);

  const mapUrl = content?.location_query
    ? `https://www.google.com/maps?q=${encodeURIComponent(
        content.location_query
      )}&output=embed`
    : "";

  return (
    <div className="p-10">
      <h1 className="text-4xl font-bold">
        {content?.hero_title || "Contact Us"}
      </h1>

      <p className="text-gray-500 mt-2">
        {content?.hero_subtitle}
      </p>

      <div className="mt-6 space-y-3">
        <p className="flex gap-2">
          <MapPin /> {content?.address}
        </p>

        <p className="flex gap-2">
          <Phone /> {content?.phone}
        </p>

        <p className="flex gap-2">
          <Mail /> {content?.email}
        </p>
      </div>

      {mapUrl && (
        <iframe
          src={mapUrl}
          width="100%"
          height="300"
          style={{ border: 0 }}
          className="mt-6"
        />
      )}
    </div>
  );
}