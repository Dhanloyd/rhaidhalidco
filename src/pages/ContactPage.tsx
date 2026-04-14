import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Send, MapPin, Phone, Mail, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────
interface ContactContent {
  hero_title: string;
  hero_subtitle: string;
  address: string;
  phone: string;
  email: string;
  map_embed_url: string;
}

// ─── Fallback (matches admin defaults) ───────────────────────────────────────
const fallback: ContactContent = {
  hero_title: "Contact Us",
  hero_subtitle: "Get in touch with RaidKhalid & Co.",
  address: "RK Arena, 123 Basketball Blvd, Manila, Philippines",
  phone: "+63 912 345 6789",
  email: "hello@raidkhalid.co",
  map_embed_url:
    "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3861.8024767809896!2d120.97878531484!3d14.554735789812!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3397c99161090cd3%3A0x8b47420f32b26e6!2sRizal%20Park!5e0!3m2!1sen!2sph!4v1680000000000!5m2!1sen!2sph",
};

// ─── Component ────────────────────────────────────────────────────────────────
const ContactPage = () => {
  const [content, setContent] = useState<ContactContent>(fallback);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  // Load CMS content from Supabase
  useEffect(() => {
    supabase
      .from("page_content")
      .select("content")
      .eq("page", "contact")
      .maybeSingle()
      .then(({ data: row }) => {
        if (row?.content) {
          setContent({ ...fallback, ...(row.content as ContactContent) });
        }
        setLoading(false);
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

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  // ── Page ───────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Hero — driven by CMS */}
      <section className="gradient-navy section-padding pt-24 md:pt-32">
        <div className="container mx-auto text-center">
          <h1 className="font-heading text-4xl md:text-6xl uppercase tracking-wider text-primary-foreground mb-4">
            {content.hero_title}
          </h1>
          <p className="text-primary-foreground/70 max-w-2xl mx-auto text-lg">
            {content.hero_subtitle}
          </p>
        </div>
      </section>

      <section className="section-padding">
        <div className="container mx-auto max-w-5xl">
          <div className="grid lg:grid-cols-2 gap-12">

            {/* ── Contact Form (static) ────────────────────────────────────── */}
            <div>
              <h2 className="font-heading text-2xl uppercase tracking-wider text-foreground mb-6">
                Send a Message
              </h2>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Name *</label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Email *</label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Message *</label>
                  <Textarea
                    rows={5}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
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

            {/* ── Find Us — all driven by CMS ─────────────────────────────── */}
            <div>
              <h2 className="font-heading text-2xl uppercase tracking-wider text-foreground mb-6">
                Find Us
              </h2>

              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <MapPin size={18} className="text-primary mt-1 shrink-0" />
                  <p className="text-muted-foreground text-sm">{content.address}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Phone size={18} className="text-primary shrink-0" />
                  <a
                    href={`tel:${content.phone.replace(/\s/g, "")}`}
                    className="text-muted-foreground text-sm hover:text-primary transition-colors"
                  >
                    {content.phone}
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <Mail size={18} className="text-primary shrink-0" />
                  <a
                    href={`mailto:${content.email}`}
                    className="text-muted-foreground text-sm hover:text-primary transition-colors"
                  >
                    {content.email}
                  </a>
                </div>
              </div>

              {/* Google Map — src comes from CMS */}
              <div className="rounded-xl overflow-hidden border border-border/50">
                {content.map_embed_url ? (
                  <iframe
                    src={content.map_embed_url}
                    width="100%"
                    height="300"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="RaidKhalid Location"
                  />
                ) : (
                  <div className="h-[300px] flex items-center justify-center bg-muted text-muted-foreground text-sm">
                    Map not configured
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
};

export default ContactPage;
