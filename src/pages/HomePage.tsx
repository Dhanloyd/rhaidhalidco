import { Link } from "react-router-dom";
import { ShoppingCart, Ticket, ChevronRight, Play, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroBanner from "@/assets/hero-banner.jpg";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const HomePage = () => {
  const [news, setNews] = useState<any[]>([]);
  const [highlights, setHighlights] = useState<any[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [founders, setFounders] = useState<any[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [socialLinks, setSocialLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from("news").select("*").eq("published", true).order("created_at", { ascending: false }).limit(3),
      supabase.from("highlights").select("*").eq("active", true).order("display_order").limit(6),
      supabase.from("products").select("*").eq("in_stock", true).order("sold_count", { ascending: false }).limit(4),
      supabase.from("founder_profiles").select("*").eq("active", true).order("display_order").limit(3),
      supabase.from("player_profiles").select("*").eq("active", true).order("display_order").limit(3),
      supabase.from("activities").select("*").eq("active", true).order("display_order").limit(3),
      supabase.from("social_links").select("*").eq("active", true).order("display_order"),
    ]).then(([newsRes, hlRes, prodRes, foundRes, playRes, actRes, socialRes]) => {
      setNews(newsRes.data || []);
      setHighlights(hlRes.data || []);
      setFeaturedProducts(prodRes.data || []);
      setFounders(foundRes.data || []);
      setPlayers(playRes.data || []);
      setActivities(actRes.data || []);
      setSocialLinks(socialRes.data || []);
      setLoading(false);
    });
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="relative h-[70vh] sm:h-[80vh] md:h-[90vh] min-h-[400px] md:min-h-[600px] flex items-center justify-center overflow-hidden">
        <img src={heroBanner} alt="RaidKhalid & Co. in action" className="absolute inset-0 w-full h-full object-cover" width={1920} height={800} />
        <div className="absolute inset-0 bg-gradient-to-r from-[hsl(218_65%_10%/0.9)] via-[hsl(218_65%_14%/0.7)] to-transparent" />
        <div className="relative container mx-auto px-4 z-10">
          <div className="max-w-2xl">
            <h1 className="font-heading text-4xl sm:text-5xl md:text-7xl lg:text-8xl uppercase leading-none tracking-tight mb-4 animate-fade-in-up" style={{ color: "hsl(0 0% 100%)" }}>
              RaidKhalid<br /><span style={{ color: "hsl(210 100% 75%)" }}>&amp; Co.</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl mb-6 md:mb-8 max-w-lg animate-fade-in-up" style={{ color: "hsl(0 0% 90%)", animationDelay: "0.2s" }}>
              Elevating basketball culture through passion, excellence, and community.
            </p>
            <div className="flex flex-wrap gap-3 animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
              <Link to="/shop"><Button size="lg" className="font-heading uppercase tracking-wider gap-2 text-sm sm:text-base bg-primary text-primary-foreground"><ShoppingCart size={18} /> Shop Now</Button></Link>
              <Link to="/activities"><Button size="lg" variant="outline" className="font-heading uppercase tracking-wider gap-2 text-sm sm:text-base bg-transparent hover:bg-white/10 border-white/50 text-white"><Ticket size={18} /> Get Tickets</Button></Link>
            </div>
          </div>
        </div>
      </section>

      {/* Latest News */}
      {news.length > 0 && (
        <section className="section-padding bg-muted">
          <div className="container mx-auto">
            <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl uppercase tracking-wider text-foreground mb-8 md:mb-10 text-center">Latest News</h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {news.map((item: any) => (
                <div key={item.id} className="bg-card rounded-xl overflow-hidden hover-lift border border-border/50">
                  {item.image_url && <img src={item.image_url} alt={item.title} className="w-full h-36 sm:h-40 object-cover" loading="lazy" />}
                  <div className="p-4 sm:p-6">
                    <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">{new Date(item.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                    <h3 className="font-heading text-base sm:text-lg uppercase mb-2 text-foreground line-clamp-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">{item.excerpt}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Highlights - Player Plays */}
      {highlights.length > 0 && (
        <section className="section-padding">
          <div className="container mx-auto">
            <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl uppercase tracking-wider text-foreground mb-8 md:mb-10 text-center">🏀 Player Highlights</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {highlights.map((h: any) => (
                <div key={h.id} className="bg-card rounded-xl overflow-hidden hover-lift border border-border/50 group">
                  <div className="relative">
                    {h.image_url && <img src={h.image_url} alt={h.title} className="w-full h-40 sm:h-48 object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />}
                    {h.link_url && (
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play size={40} className="text-white" />
                      </div>
                    )}
                  </div>
                  <div className="p-4 sm:p-5">
                    <h3 className="font-heading text-base sm:text-lg uppercase text-foreground mb-2">{h.title}</h3>
                    {h.description && <p className="text-sm text-muted-foreground line-clamp-2">{h.description}</p>}
                    {h.link_url && (
                      <a href={h.link_url} target="_blank" rel="noopener noreferrer" className="mt-3 text-sm text-primary font-medium flex items-center gap-1 hover:gap-2 transition-all">
                        Watch <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Players */}
      {players.length > 0 && (
        <section className="section-padding bg-muted">
          <div className="container mx-auto">
            <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl uppercase tracking-wider text-foreground mb-8 md:mb-10 text-center">Top Players</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {players.map((player: any) => (
                <Link key={player.id} to="/players" className="group">
                  <div className="relative rounded-xl overflow-hidden hover-lift bg-card border border-border/50">
                    {/* Player image or fallback */}
                    {player.image_url ? (
                      <img
                        src={player.image_url}
                        alt={player.name}
                        className="w-full h-64 sm:h-80 object-contain group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-64 sm:h-80 bg-primary/10 flex flex-col items-center justify-center gap-2">
                        <span className="font-heading text-6xl text-primary/30">#{player.jersey_number}</span>
                        <span className="font-heading text-sm uppercase text-primary/40 tracking-widest">{player.position}</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[hsl(218_65%_10%/0.9)] via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
                      <p className="text-primary-light text-xs sm:text-sm font-medium">
                        {player.jersey_number && `#${player.jersey_number}`}
                        {player.jersey_number && player.position && " · "}
                        {player.position}
                      </p>
                      <h3 className="font-heading text-xl sm:text-2xl uppercase text-white">{player.name}</h3>
                      {player.stats && (
                        <p className="text-white/70 text-xs sm:text-sm mt-1">
                          {(player.stats as any).ppg && `${(player.stats as any).ppg} PPG`}
                          {(player.stats as any).rpg && ` · ${(player.stats as any).rpg} RPG`}
                          {(player.stats as any).apg && ` · ${(player.stats as any).apg} APG`}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <div className="text-center mt-6 md:mt-8">
              <Link to="/players">
                <Button variant="outline" className="font-heading uppercase tracking-wider">
                  View All Players <ChevronRight size={16} />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Founders */}
      {founders.length > 0 && (
        <section className="section-padding">
          <div className="container mx-auto">
            <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl uppercase tracking-wider text-foreground mb-8 md:mb-10 text-center">Our Founders</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8 max-w-4xl mx-auto">
              {founders.map((founder: any) => (
                <div key={founder.id} className="group text-center">
                  <div className="relative w-32 h-32 sm:w-40 sm:h-40 mx-auto mb-4 rounded-full overflow-hidden border-4 border-primary/20 group-hover:border-primary/60 transition-all duration-300">
                    {founder.image_url ? (
                      <img src={founder.image_url} alt={founder.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
                    ) : (
                      <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                        <span className="font-heading text-2xl text-primary/40">{founder.name?.charAt(0)}</span>
                      </div>
                    )}
                  </div>
                  <h3 className="font-heading text-lg uppercase text-foreground mb-1">{founder.name}</h3>
                  <p className="text-xs text-primary font-medium uppercase tracking-wider mb-2">{founder.role}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto line-clamp-3">{founder.bio}</p>
                </div>
              ))}
            </div>
            <div className="text-center mt-6 md:mt-8">
              <Link to="/founders"><Button variant="outline" className="font-heading uppercase tracking-wider">Meet All Founders <ChevronRight size={16} /></Button></Link>
            </div>
          </div>
        </section>
      )}

      {/* Activities */}
      {activities.length > 0 && (
        <section className="section-padding bg-muted">
          <div className="container mx-auto">
            <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl uppercase tracking-wider text-foreground mb-8 md:mb-10 text-center">Upcoming Activities</h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {activities.map((act: any) => (
                <div key={act.id} className="bg-card rounded-xl overflow-hidden hover-lift border border-border/50">
                  {act.image_url && <img src={act.image_url} alt={act.title} className="w-full h-36 sm:h-40 object-cover" loading="lazy" />}
                  <div className="p-4 sm:p-5">
                    <h3 className="font-heading text-base sm:text-lg uppercase text-foreground mb-2">{act.title}</h3>
                    {act.event_date && (
                      <p className="text-xs text-primary font-medium mb-2">
                        📅 {new Date(act.event_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                      </p>
                    )}
                    {act.location && <p className="text-xs text-muted-foreground mb-2">📍 {act.location}</p>}
                    {act.description && <p className="text-sm text-muted-foreground line-clamp-2">{act.description}</p>}
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center mt-6 md:mt-8">
              <Link to="/activities"><Button variant="outline" className="font-heading uppercase tracking-wider">View All Activities <ChevronRight size={16} /></Button></Link>
            </div>
          </div>
        </section>
      )}

      {/* Shop Highlights */}
      {featuredProducts.length > 0 && (
        <section className="section-padding gradient-navy">
          <div className="container mx-auto">
            <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl uppercase tracking-wider mb-8 md:mb-10 text-center" style={{ color: "hsl(0 0% 95%)" }}>Shop Highlights</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
              {featuredProducts.map((product: any) => (
                <Link key={product.id} to="/shop" className="group">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl overflow-hidden border border-white/10 hover-lift">
                    <div className="relative">
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} className="w-full h-40 sm:h-52 md:h-64 object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                      ) : (
                        <div className="w-full h-40 sm:h-52 md:h-64 bg-white/5 flex items-center justify-center">
                          <ShoppingCart size={32} className="text-white/20" />
                        </div>
                      )}
                      {product.badge && (
                        <span className={`absolute top-2 right-2 ${product.badge === "hot" ? "badge-hot" : "badge-featured"} text-[10px] sm:text-xs`}>
                          {product.badge === "hot" ? "🔥 Hot" : "⭐ Featured"}
                        </span>
                      )}
                    </div>
                    <div className="p-3 sm:p-5">
                      <h3 className="font-heading text-sm sm:text-lg uppercase line-clamp-1" style={{ color: "hsl(0 0% 95%)" }}>{product.name}</h3>
                      <p className="font-semibold mt-1 text-sm sm:text-base" style={{ color: "hsl(0 0% 80%)" }}>₱{Number(product.price).toLocaleString()}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <div className="text-center mt-6 md:mt-8">
              <Link to="/shop"><Button size="lg" className="bg-white text-primary hover:bg-white/90 font-heading uppercase tracking-wider">Visit Shop <ChevronRight size={16} /></Button></Link>
            </div>
          </div>
        </section>
      )}

      {/* Social Links */}
      {socialLinks.length > 0 && (
        <section className="py-10 md:py-16 px-4 bg-muted">
          <div className="container mx-auto text-center">
            <h2 className="font-heading text-xl sm:text-2xl md:text-3xl uppercase tracking-wider text-foreground mb-6">Follow Us</h2>
            <div className="flex flex-wrap justify-center gap-3 md:gap-4">
              {socialLinks.map((link: any) => (
                <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-full bg-card border border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
                  <span className="text-sm sm:text-base font-medium text-foreground">{link.platform}</span>
                  <ExternalLink size={14} className="text-muted-foreground" />
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Loading state */}
      {loading && (
        <section className="py-20 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </section>
      )}
    </div>
  );
};

export default HomePage;
