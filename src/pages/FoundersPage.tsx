import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const FoundersPage = () => {
  const [founders, setFounders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("founder_profiles").select("*").eq("active", true).order("display_order")
      .then(({ data }) => { setFounders(data || []); setLoading(false); });
  }, []);

  return (
    <div>
      <section className="gradient-navy section-padding pt-24 md:pt-32">
        <div className="container mx-auto text-center">
          <h1 className="font-heading text-3xl sm:text-4xl md:text-6xl uppercase tracking-wider text-primary-foreground mb-4">Our Founders</h1>
          <p className="text-primary-foreground/70 max-w-2xl mx-auto text-base sm:text-lg">The visionaries behind RaidKhalid & Co.</p>
        </div>
      </section>

      <section className="section-padding">
        <div className="container mx-auto">
          {loading ? (
            <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
          ) : founders.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No founders added yet.</p>
          ) : (
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {founders.map((founder) => (
                <div key={founder.id} className="group text-center">
                  <div className="relative w-36 h-36 sm:w-48 sm:h-48 mx-auto mb-4 sm:mb-6 rounded-full overflow-hidden border-4 border-primary/20 group-hover:border-primary/60 transition-all duration-300">
                    {founder.image_url ? (
                      <img src={founder.image_url} alt={founder.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
                    ) : (
                      <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                        <span className="font-heading text-3xl text-primary/40">{founder.name?.charAt(0)}</span>
                      </div>
                    )}
                  </div>
                  <h3 className="font-heading text-lg sm:text-xl uppercase text-foreground mb-1">{founder.name}</h3>
                  <p className="text-sm text-primary font-medium mb-3 uppercase tracking-wider">{founder.role}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">{founder.bio}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default FoundersPage;
