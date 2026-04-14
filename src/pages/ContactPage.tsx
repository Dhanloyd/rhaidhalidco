import { useEffect, useState } from "react";
import { Send, MapPin, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const ContactPage = () => {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [content, setContent] = useState<any>(null);

  useEffect(() => {
    supabase
      .from("page_content")
      .select("*")
      .eq("page", "contact")
      .maybeSingle()
      .then(({ data }) => {
        if (data?.content) setContent(data.content);
      });
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

  const mapUrl = content?.location_query
    ? `https://www.google.com/maps?q=${encodeURIComponent(
        content.location_query
      )}&output=embed`
    : "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3861.802548850607!2d120.9822!3d14.5547!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTTCsDMzJzE3LjAiTiAxMjDCsDU4JzU2LjAiRQ!5e0!3m2!1sen!2sph!4v1";

  return (
    <div>
      <section className="gradient-navy section-padding pt-24 md:pt-32">
        <div className="container mx-auto text-center">
          <h1 className="font-heading text-4xl md:text-6xl uppercase tracking-wider text-primary-foreground mb-4">
            {content?.hero_title || "Contact Us"}
          </h1>

          <p className="text-primary-foreground/70 max-w-2xl mx-auto text-lg">
            {content?.hero_subtitle || "Get in touch with RaidKhalid & Co."}
          </p>
        </div>
      </section>

      <section className="section-padding">
        <div className="container mx-auto max-w-5xl">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Form */}
            <div>
              <h2 className="font-heading text-2xl uppercase tracking-wider text-foreground mb-6">
                Send a Message
              </h2>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">
                    Name *
                  </label>
                  <Input
                    value={form.name}
                    onChange={(e) =>
                      setForm({ ...form, name: e.target.value })
                    }
                    placeholder="Your full name"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">
                    Email *
                  </label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    placeholder="your@email.com"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">
                    Message *
                  </label>
                  <Textarea
                    rows={5}
                    value={form.message}
                    onChange={(e) =>
                      setForm({ ...form, message: e.target.value })
                    }
                    placeholder="How can we help?"
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="bg-primary text-primary-foreground hover:bg-primary-light font-heading uppercase tracking-wider gap-2 w-full sm:w-auto"
                >
                  <Send size={16} /> Send Message
                </Button>
              </form>
            </div>

            {/* Info + Map */}
            <div>
              <h2 className="font-heading text-2xl uppercase tracking-wider text-foreground mb-6">
                Find Us
              </h2>

              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <MapPin size={18} className="text-primary mt-1 shrink-0" />
                  <p className="text-muted-foreground text-sm">
                    {content?.address || "RK Arena, 123 Basketball Blvd, Manila, Philippines"}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Phone size={18} className="text-primary shrink-0" />
                  <p className="text-muted-foreground text-sm">
                    {content?.phone || "+63 912 345 6789"}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Mail size={18} className="text-primary shrink-0" />
                  <p className="text-muted-foreground text-sm">
                    {content?.email || "hello@raidkhalid.co"}
                  </p>
                </div>
              </div>

              <div className="rounded-xl overflow-hidden border border-border/50">
                <iframe
                  src={mapUrl}
                  width="100%"
                  height="300"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  title="RaidKhalid Location"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ContactPage;