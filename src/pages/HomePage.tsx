import { Link } from "react-router-dom";
import { ShoppingCart, Ticket, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroBanner from "@/assets/hero-banner.jpg";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { players } from "@/data/players";

const HomePage = () => {
  const [news, setNews] = useState<any[]>([]);
  const [highlights, setHighlights] = useState<any[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const topPlayers = players.slice(0, 3);

  useEffect(() => {
    supabase.from("news").select("*").eq("published", true).order("created_at", { ascending: false }).limit(3)
      .then(({ data }) => setNews(data || []));
    supabase.from("highlights").select("*").eq("active", true).order("display_order").limit(6)
      .then(({ data }) => setHighlights(data || []));
    supabase.from("products").select("*").eq("badge", "featured").eq("in_stock", true).limit(3)
      .then(({ data }) => setFeaturedProducts(data || []));
  }, []);

  const fallbackNews = [
    { title: "RaidKhalid Wins Championship Title", created_at: "2026-03-28", excerpt: "An incredible season finale that brought the trophy home." },
    { title: "New Season Jerseys Now Available", created_at: "2026-03-20", excerpt: "Fresh designs for the upcoming season – shop now." },
    { title: "Community Basketball Camp Announced", created_at: "2026-03-15", excerpt: "Free basketball camp for youth players this summer." },
  ];

  const displayNews = news.length > 0 ? news : fallbackNews;

  return (
    <div>
      {/* Hero */}
      <section className="relative h-[90vh] min-h-[600px] flex items-center justify-center overflow-hidden">
        <img src={heroBanner} alt="RaidKhalid & Co. in action" className="absolute inset-0 w-full h-full object-cover" width={1920} height={800} />
        <div className="absolute inset-0 bg-gradient-to-r from-[hsl(218_65%_10%/0.9)] via-[hsl(218_65%_14%/0.7)] to-transparent" />
        <div className="relative container mx-auto px-4 z-10">
          <div className="max-w-2xl">
            <h1 className="font-heading text-5xl md:text-7xl lg:text-8xl uppercase leading-none tracking-tight mb-4 animate-fade-in-up" style={{ color: "hsl(0 0% 100%)" }}>
              RaidKhalid<br /><span style={{ color: "hsl(210 100% 75%)" }}>&amp; Co.</span>
            </h1>
            <p className="text-lg md:text-xl mb-8 max-w-lg animate-fade-in-up" style={{ color: "hsl(0 0% 90%)", animationDelay: "0.2s" }}>
              Elevating basketball culture through passion, excellence, and community.
            </p>
            <div className="flex flex-wrap gap-4 animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
              <Link to="/shop"><Button size="lg" className="font-heading uppercase tracking-wider gap-2" style={{ backgroundColor: "hsl(218 60% 50%)", color: "hsl(0 0% 100%)" }}><ShoppingCart size={18} /> Shop Now</Button></Link>
              <Link to="/activities"><Button size="lg" variant="outline" className="font-heading uppercase tracking-wider gap-2 bg-transparent hover:bg-white/10" style={{ borderColor: "hsl(0 0% 100% / 0.5)", color: "hsl(0 0% 100%)" }}><Ticket size={18} /> Get Tickets</Button></Link>
            </div>
          </div>
        </div>
      </section>

      {/* Latest News */}
      <section className="section-padding bg-muted">
        <div className="container mx-auto">
          <h2 className="font-heading text-3xl md:text-4xl uppercase tracking-wider text-foreground mb-10 text-center">Latest News</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {displayNews.map((item: any, i: number) => (
              <div key={i} className="bg-card rounded-xl p-6 hover-lift border border-border/50">
                {item.image_url && <img src={item.image_url} alt={item.title} className="w-full h-40 object-cover rounded-lg mb-4" />}
                <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">{new Date(item.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                <h3 className="font-heading text-lg uppercase mb-2 text-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.excerpt}</p>
                <button className="mt-4 text-sm text-primary font-medium flex items-center gap-1 hover:gap-2 transition-all">Read More <ChevronRight size={14} /></button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Highlights */}
      {highlights.length > 0 && (
        <section className="section-padding">
          <div className="container mx-auto">
            <h2 className="font-heading text-3xl md:text-4xl uppercase tracking-wider text-foreground mb-10 text-center">Highlights</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {highlights.map((h: any) => (
                <div key={h.id} className="bg-card rounded-xl overflow-hidden hover-lift border border-border/50">
                  {h.image_url && <img src={h.image_url} alt={h.title} className="w-full h-48 object-cover" />}
                  <div className="p-5">
                    <h3 className="font-heading text-lg uppercase text-foreground mb-2">{h.title}</h3>
                    {h.description && <p className="text-sm text-muted-foreground">{h.description}</p>}
                    {h.link_url && (
                      <Link to={h.link_url} className="mt-3 text-sm text-primary font-medium flex items-center gap-1 hover:gap-2 transition-all">View <ChevronRight size={14} /></Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Top Players */}
      <section className="section-padding">
        <div className="container mx-auto">
          <h2 className="font-heading text-3xl md:text-4xl uppercase tracking-wider text-foreground mb-10 text-center">Top Players</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {topPlayers.map((player) => (
              <Link key={player.id} to="/players" className="group">
                <div className="relative rounded-xl overflow-hidden hover-lift">
                  <img src={player.image} alt={player.name} className="w-full h-80 object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" width={400} height={500} />
                  <div className="absolute inset-0 bg-gradient-to-t from-[hsl(218_65%_10%/0.9)] via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <p className="text-primary-light text-sm font-medium">#{player.number} · {player.position}</p>
                    <h3 className="font-heading text-2xl uppercase text-primary-foreground">{player.name}</h3>
                    <p className="text-primary-foreground/70 text-sm mt-1">{player.stats.ppg} PPG · {player.stats.rpg} RPG · {player.stats.apg} APG</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link to="/players"><Button variant="outline" className="font-heading uppercase tracking-wider">View All Players <ChevronRight size={16} /></Button></Link>
          </div>
        </div>
      </section>

      {/* Shop Highlights */}
      <section className="section-padding gradient-navy">
        <div className="container mx-auto">
          <h2 className="font-heading text-3xl md:text-4xl uppercase tracking-wider text-primary-foreground mb-10 text-center">Shop Highlights</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {featuredProducts.map((product: any) => (
              <Link key={product.id} to="/shop" className="group">
                <div className="bg-card/10 backdrop-blur-sm rounded-xl overflow-hidden border border-primary-foreground/10 hover-lift">
                  <div className="relative">
                    {product.image_url && <img src={product.image_url} alt={product.name} className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />}
                    {product.badge && (
                      <span className={`absolute top-3 right-3 ${product.badge === "hot" ? "badge-hot" : "badge-featured"}`}>
                        {product.badge === "hot" ? "🔥 Hot" : "⭐ Featured"}
                      </span>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="font-heading text-lg uppercase text-primary-foreground">{product.name}</h3>
                    <p className="text-primary-foreground/70 font-semibold mt-1">₱{Number(product.price).toLocaleString()}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link to="/shop"><Button size="lg" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-heading uppercase tracking-wider">Visit Shop <ChevronRight size={16} /></Button></Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
