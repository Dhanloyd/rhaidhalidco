import { Link } from "react-router-dom";
import { ShoppingCart, Ticket, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroBanner from "@/assets/hero-banner.jpg";
import { products } from "@/data/products";
import { players } from "@/data/players";

const HomePage = () => {
  const featuredProducts = products.filter((p) => p.badge === "featured").slice(0, 3);
  const topPlayers = players.slice(0, 3);

  const news = [
    { title: "RaidKhalid Wins Championship Title", date: "Mar 28, 2026", excerpt: "An incredible season finale that brought the trophy home." },
    { title: "New Season Jerseys Now Available", date: "Mar 20, 2026", excerpt: "Fresh designs for the upcoming season – shop now." },
    { title: "Community Basketball Camp Announced", date: "Mar 15, 2026", excerpt: "Free basketball camp for youth players this summer." },
  ];

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
              <Link to="/shop">
                <Button size="lg" className="font-heading uppercase tracking-wider gap-2" style={{ backgroundColor: "hsl(218 60% 50%)", color: "hsl(0 0% 100%)" }}>
                  <ShoppingCart size={18} /> Shop Now
                </Button>
              </Link>
              <Link to="/activities">
                <Button size="lg" variant="outline" className="font-heading uppercase tracking-wider gap-2 bg-transparent hover:bg-white/10" style={{ borderColor: "hsl(0 0% 100% / 0.5)", color: "hsl(0 0% 100%)" }}>
                  <Ticket size={18} /> Get Tickets
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Latest News */}
      <section className="section-padding bg-muted">
        <div className="container mx-auto">
          <h2 className="font-heading text-3xl md:text-4xl uppercase tracking-wider text-foreground mb-10 text-center">Latest News</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {news.map((item, i) => (
              <div key={i} className="bg-card rounded-xl p-6 hover-lift border border-border/50">
                <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">{item.date}</p>
                <h3 className="font-heading text-lg uppercase mb-2 text-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.excerpt}</p>
                <button className="mt-4 text-sm text-primary font-medium flex items-center gap-1 hover:gap-2 transition-all">
                  Read More <ChevronRight size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

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
            <Link to="/players">
              <Button variant="outline" className="font-heading uppercase tracking-wider">View All Players <ChevronRight size={16} /></Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Shop Highlights */}
      <section className="section-padding gradient-navy">
        <div className="container mx-auto">
          <h2 className="font-heading text-3xl md:text-4xl uppercase tracking-wider text-primary-foreground mb-10 text-center">Shop Highlights</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {featuredProducts.map((product) => (
              <Link key={product.id} to="/shop" className="group">
                <div className="bg-card/10 backdrop-blur-sm rounded-xl overflow-hidden border border-primary-foreground/10 hover-lift">
                  <div className="relative">
                    <img src={product.image} alt={product.name} className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" width={400} height={400} />
                    {product.badge && (
                      <span className={`absolute top-3 right-3 ${product.badge === "hot" ? "badge-hot" : "badge-featured"}`}>
                        {product.badge === "hot" ? "🔥 Hot" : "⭐ Featured"}
                      </span>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="font-heading text-lg uppercase text-primary-foreground">{product.name}</h3>
                    <p className="text-primary-foreground/70 font-semibold mt-1">₱{product.price.toLocaleString()}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link to="/shop">
              <Button size="lg" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-heading uppercase tracking-wider">
                Visit Shop <ChevronRight size={16} />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
