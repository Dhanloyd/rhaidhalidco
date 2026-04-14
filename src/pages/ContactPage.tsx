import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Send, MapPin, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const ContactPage = () => {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: row } = await supabase
        .from("page_content")
        .select("*")
        .eq("page", "contact")
        .maybeSingle();

      setData(row?.content || null);
    };

    fetchData();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name || !form.email || !form.message) {
      toast.error("Please fill all fields");
      return;
    }

    toast.success("Message sent!");
    setForm({ name: "", email: "", message: "" });
  };

  return (
    <div>
      {/* HERO */}
      <section className="pt-24 text-center">
        <h1 className="text-4xl font-bold">
          {data?.hero_title || "Contact Us"}
        </h1>
        <p className="text-gray-500 mt-2">
          {data?.hero_subtitle || "Get in touch with us"}
        </p>
      </section>

      {/* CONTENT */}
      <section className="grid md:grid-cols-2 gap-10 p-10">
        {/* FORM */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          <Input
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />

          <Textarea
            placeholder="Message"
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
          />

          <Button type="submit" className="w-full">
            <Send size={16} /> Send
          </Button>
        </form>

        {/* INFO */}
        <div className="space-y-4">
          <div className="flex gap-2 items-start">
            <MapPin />
            <p>{data?.address || "No address set"}</p>
          </div>

          <div className="flex gap-2 items-center">
            <Phone />
            <p>{data?.phone || "No phone set"}</p>
          </div>

          <div className="flex gap-2 items-center">
            <Mail />
            <p>{data?.email || "No email set"}</p>
          </div>

          {/* MAP */}
          <div className="rounded-lg overflow-hidden mt-4">
            {data?.map_embed_url ? (
              <iframe
                src={data.map_embed_url}
                width="100%"
                height="300"
                style={{ border: 0 }}
                loading="lazy"
              />
            ) : (
              <p className="text-sm text-gray-400">No map available</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default ContactPage;