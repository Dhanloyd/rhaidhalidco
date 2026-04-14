import { useEffect, useState } from "react";
import { Send, MapPin, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const ContactPage = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    message: "",
  });

  const [content, setContent] = useState<any>(null);

  // ✅ FETCH DATA FROM SUPABASE
  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from("page_content")
        .select("content")
        .eq("page", "contact")
        .maybeSingle();

      if (error) {
        console.error("Fetch error:", error);
        return;
      }

      if (data?.content) {
        setContent(data.content);
      }
    };

    fetchData();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name || !form.email || !form.message) {
      toast.error("Please fill in all required fields.");
      return;
    }

    toast.success("Message sent! We'll get back to you soon.");
    setForm({ name: "", email: "", message: "" });
  };

  // ✅ MAP FROM DB
  const mapUrl = content?.location_query
    ? `https://www.google.com/maps?q=${encodeURIComponent(
        content.location_query
      )}&output=embed`
    : "";

  return (
    <div>
      {/* HERO */}
      <section className="gradient-navy section-padding pt-24 md:pt-32">
        <div className="container mx-auto text-center">
          <h1 className="font-heading text-4xl md:text-6xl uppercase tracking-wider text-primary-foreground mb-4">
            {content?.hero_title}
          </h1>

          <p className="text-primary-foreground/70 max-w-2xl mx-auto text-lg">
            {content?.hero_subtitle}
          </p>
        </div>
      </section>

      {/* BODY */}
      <section className="section-padding">
        <div className="container mx-auto max-w-5xl">
          <div className="grid lg:grid-cols-2 gap-12">

            {/* FORM */}
            <div>
              <h2 className="font-heading text-2xl uppercase mb-6">
                Send a Message
              </h2>

              <form onSubmit={handleSubmit} className="space-y-5">
                <Input
                  placeholder="Name"
                  value={form.name}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                />

                <Input
                  placeholder="Email"
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm({ ...form, email: e.target.value })
                  }
                />

                <Textarea
                  placeholder="Message"
                  rows={5}
                  value={form.message}
                  onChange={(e) =>
                    setForm({ ...form, message: e.target.value })
                  }
                />

                <Button type="submit">
                  <Send size={16} /> Send Message
                </Button>
              </form>
            </div>

            {/* INFO */}
            <div>
              <h2 className="font-heading text-2xl uppercase mb-6">
                Find Us
              </h2>

              <div className="space-y-4 mb-6">
                <div className="flex gap-2">
                  <MapPin className="text-primary" />
                  <p>{content?.address}</p>
                </div>

                <div className="flex gap-2">
                  <Phone className="text-primary" />
                  <p>{content?.phone}</p>
                </div>

                <div className="flex gap-2">
                  <Mail className="text-primary" />
                  <p>{content?.email}</p>
                </div>
              </div>

              {/* MAP */}
              {mapUrl && (
                <iframe
                  src={mapUrl}
                  width="100%"
                  height="300"
                  style={{ border: 0 }}
                  loading="lazy"
                  title="Map"
                />
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ContactPage;