import { Link } from "react-router-dom";
import { ShoppingCart, Ticket, ChevronRight, Play, ExternalLink, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroBanner from "@/assets/hero-banner.jpg";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

/* ─── Inline global styles ─── */
const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&family=DM+Serif+Display:ital@0;1&display=swap');

  :root {
    --ink: #0a0f1e;
    --ink-soft: #1c2640;
    --blue-vivid: #1d4ed8;
    --blue-mid: #2563eb;
    --blue-light: #60a5fa;
    --cream: #f8f4ef;
    --cream-dark: #ede8e1;
    --white: #ffffff;
    --muted: rgba(10,15,30,.45);
    --radius: 16px;
  }

  @keyframes fadeUp {
    from { opacity:0; transform:translateY(36px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes fadeIn { from{opacity:0} to{opacity:1} }
  @keyframes slideRight {
    from { opacity:0; transform:translateX(-28px); }
    to   { opacity:1; transform:translateX(0); }
  }
  @keyframes heroKen {
    0%,100% { transform:scale(1) translateX(0); }
    50%      { transform:scale(1.06) translateX(-1.5%); }
  }
  @keyframes float {
    0%,100% { transform:translateY(0); }
    50%      { transform:translateY(-9px); }
  }
  @keyframes marquee {
    from { transform:translateX(0); }
    to   { transform:translateX(-50%); }
  }
  @keyframes spin-slow { to { transform:rotate(360deg); } }
  @keyframes ring-pulse {
    0%   { box-shadow: 0 0 0 0 rgba(29,78,216,.5); }
    70%  { box-shadow: 0 0 0 16px rgba(29,78,216,0); }
    100% { box-shadow: 0 0 0 0 rgba(29,78,216,0); }
  }

  .animate-fade-up   { animation:fadeUp .75s cubic-bezier(.22,1,.36,1) both; }
  .animate-fade-in   { animation:fadeIn .6s ease both; }
  .animate-slide-r   { animation:slideRight .6s cubic-bezier(.22,1,.36,1) both; }
  .hero-img          { animation:heroKen 20s ease-in-out infinite; }

  .section-reveal {
    opacity:0; transform:translateY(44px);
    transition:opacity .9s cubic-bezier(.22,1,.36,1), transform .9s cubic-bezier(.22,1,.36,1);
  }
  .section-reveal.visible { opacity:1; transform:translateY(0); }

  /* ─ Card hovers ─ */
  .card-lift {
    transition:transform .35s cubic-bezier(.22,1,.36,1), box-shadow .35s ease;
  }
  .card-lift:hover {
    transform:translateY(-8px) scale(1.015);
    box-shadow: 0 28px 64px -14px rgba(10,15,30,.18), 0 0 0 1.5px rgba(29,78,216,.18);
  }

  .card-lift-dark {
    transition:transform .35s cubic-bezier(.22,1,.36,1), box-shadow .35s ease;
  }
  .card-lift-dark:hover {
    transform:translateY(-8px) scale(1.015);
    box-shadow: 0 28px 64px -14px rgba(0,0,0,.55), 0 0 0 1.5px rgba(96,165,250,.25);
  }

  .img-zoom { transition:transform .7s cubic-bezier(.22,1,.36,1); }
  .group:hover .img-zoom { transform:scale(1.1); }

  .play-overlay {
    opacity:0; transition:opacity .3s ease;
    background:radial-gradient(circle, rgba(10,15,30,.5) 0%, rgba(10,15,30,.15) 100%);
  }
  .group:hover .play-overlay { opacity:1; }

  /* ─ Marquee ticker ─ */
  .ticker-track {
    display:flex; width:max-content;
    animation:marquee 28s linear infinite;
  }
  .ticker-track:hover { animation-play-state:paused; }

  /* ─ Blue CTA button ─ */
  .btn-primary {
    display:inline-flex; align-items:center; gap:8px;
    padding:14px 32px; border-radius:999px;
    background:var(--blue-mid); color:#fff;
    font-family:'DM Sans',sans-serif; font-weight:600; font-size:14px; letter-spacing:.04em; text-transform:uppercase;
    border:none; cursor:pointer; text-decoration:none;
    box-shadow:0 8px 32px -8px rgba(37,99,235,.6);
    transition:transform .2s ease, box-shadow .2s ease, background .2s ease;
  }
  .btn-primary:hover {
    transform:translateY(-3px); background:var(--blue-vivid);
    box-shadow:0 16px 40px -8px rgba(37,99,235,.7);
  }

  /* ─ Ghost button on light bg ─ */
  .btn-ghost-dark {
    display:inline-flex; align-items:center; gap:8px;
    padding:13px 28px; border-radius:999px;
    background:transparent; color:var(--ink);
    font-family:'DM Sans',sans-serif; font-weight:600; font-size:14px; letter-spacing:.04em; text-transform:uppercase;
    border:2px solid rgba(10,15,30,.2); cursor:pointer; text-decoration:none;
    transition:transform .2s ease, background .2s ease, border-color .2s ease;
  }
  .btn-ghost-dark:hover {
    transform:translateY(-2px);
    background:rgba(10,15,30,.06); border-color:rgba(10,15,30,.4);
  }

  /* ─ Ghost on dark bg ─ */
  .btn-ghost-light {
    display:inline-flex; align-items:center; gap:8px;
    padding:13px 28px; border-radius:999px;
    background:rgba(255,255,255,.08); color:#fff;
    font-family:'DM Sans',sans-serif; font-weight:600; font-size:14px; letter-spacing:.04em; text-transform:uppercase;
    border:2px solid rgba(255,255,255,.22); cursor:pointer; text-decoration:none;
    backdrop-filter:blur(12px);
    transition:transform .2s ease, background .2s ease, border-color .2s ease;
  }
  .btn-ghost-light:hover {
    transform:translateY(-2px);
    background:rgba(255,255,255,.16); border-color:rgba(255,255,255,.45);
  }

  /* ─ Section label ─ */
  .eyebrow {
    display:inline-flex; align-items:center; gap:10px;
    font-family:'DM Sans',sans-serif; font-size:11px; font-weight:700;
    letter-spacing:.22em; text-transform:uppercase;
  }
  .eyebrow::before {
    content:''; display:block; width:28px; height:2px; border-radius:2px;
    background:currentColor; opacity:.7;
  }

  /* ─ Diagonal divider ─ */
  .clip-diagonal-bottom { clip-path:polygon(0 0,100% 0,100% 92%,0 100%); }
  .clip-diagonal-top    { clip-path:polygon(0 8%,100% 0,100% 100%,0 100%); }
  .clip-diagonal-both   { clip-path:polygon(0 6%,100% 0,100% 94%,0 100%); }

  /* ─ Stagger delays ─ */
  .s1{animation-delay:.05s} .s2{animation-delay:.15s} .s3{animation-delay:.27s} .s4{animation-delay:.39s}

  /* ─ News card on white ─ */
  .news-card {
    border-radius:var(--radius); overflow:hidden;
    border:1.5px solid rgba(10,15,30,.08);
    background:var(--white);
    transition:transform .35s cubic-bezier(.22,1,.36,1), box-shadow .35s ease, border-color .35s ease;
  }
  .news-card:hover {
    transform:translateY(-6px);
    box-shadow:0 24px 56px -12px rgba(10,15,30,.14);
    border-color:rgba(29,78,216,.25);
  }

  /* ─ Rotating badge ─ */
  .spin-badge { animation:spin-slow 12s linear infinite; }
  .ring-pulse { animation:ring-pulse 2.5s ease-in-out infinite; }

  /* ─ Decorative grid bg ─ */
  .grid-bg {
    background-image:
      linear-gradient(rgba(10,15,30,.045) 1px, transparent 1px),
      linear-gradient(90deg, rgba(10,15,30,.045) 1px, transparent 1px);
    background-size:48px 48px;
  }

  /* ─ Dark grid bg ─ */
  .grid-bg-dark {
    background-image:
      linear-gradient(rgba(255,255,255,.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,.03) 1px, transparent 1px);
    background-size:48px 48px;
  }

  /* ─ Number stat ─ */
  .stat-num {
    font-family:'Bebas Neue',sans-serif;
    font-size:clamp(3rem,7vw,5.5rem);
    line-height:1; letter-spacing:.03em;
  }

  /* ─ Player card ─ */
  .player-card-wrap {
    transition:transform .4s cubic-bezier(.22,1,.36,1), box-shadow .4s ease;
  }
  .player-card-wrap:hover {
    transform:translateY(-10px);
    box-shadow:0 36px 80px -18px rgba(0,0,0,.6);
  }

  /* ─ Social pill ─ */
  .social-pill {
    transition:transform .25s ease, background .25s ease, border-color .25s ease;
  }
  .social-pill:hover {
    transform:translateY(-4px) scale(1.06);
    background:var(--white) !important; color:var(--ink) !important;
    border-color:var(--white) !important;
  }
`;

function useReveal() {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { el.classList.add("visible"); obs.disconnect(); } },
      { threshold: 0.08 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

const Reveal = ({ children, className = "", style = {} }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) => {
  const ref = useReveal() as React.RefObject<HTMLElement>;
  return (
    <section ref={ref} className={`section-reveal ${className}`} style={style}>
      {children}
    </section>
  );
};

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
    const id = "rk-global-styles-v2";
    if (!document.getElementById(id)) {
      const style = document.createElement("style");
      style.id = id;
      style.textContent = GLOBAL_STYLES;
      document.head.appendChild(style);
    }

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
    <div style={{ fontFamily: "'DM Sans',sans-serif", background: "#0a0f1e", overflowX: "hidden" }}>

      {/* ══ HERO ══════════════════════════════════════════════════════════ */}
      <section className="relative flex items-center justify-center overflow-hidden" style={{ minHeight: "100svh" }}>
        <img
          src={heroBanner}
          alt="RaidKhalid & Co."
          className="hero-img absolute inset-0 w-full h-full object-cover"
          style={{ transformOrigin: "60% center" }}
        />

        {/* Dark gradient overlay */}
        <div className="absolute inset-0" style={{
          background: "linear-gradient(110deg, rgba(10,15,30,.96) 0%, rgba(10,15,30,.75) 42%, rgba(10,15,30,.35) 72%, transparent 90%), linear-gradient(to top, rgba(10,15,30,.9) 0%, transparent 55%)"
        }} />

        {/* Grid overlay */}
        <div className="absolute inset-0 grid-bg-dark" style={{ zIndex: 1 }} />

        {/* Accent vertical line */}
        <div className="absolute left-0 top-0 bottom-0 w-1" style={{
          background: "linear-gradient(to bottom, transparent 0%, #2563eb 25%, #2563eb 75%, transparent 100%)",
          zIndex: 2
        }} />

        {/* Rotating circle badge (top-right decorative) */}
        <div className="absolute" style={{ top: "8%", right: "5%", zIndex: 3, opacity: .35 }}>
          <svg className="spin-badge" width="120" height="120" viewBox="0 0 120 120">
            <path id="circ" fill="none" d="M60,14 a46,46 0 1,1 -0.01,0" />
            <text style={{ fill: "#60a5fa", fontSize: 11, fontWeight: 700, letterSpacing: 3 }}>
              <textPath href="#circ">OFFICIAL BASKETBALL BRAND · EST. 2024 · </textPath>
            </text>
          </svg>
        </div>

        <div className="relative container mx-auto px-6" style={{ zIndex: 4 }}>
          <div style={{ maxWidth: "600px" }}>
            {/* Eyebrow */}
            <p className="eyebrow animate-fade-in s1" style={{ color: "#60a5fa", marginBottom: "20px" }}>
              Official Basketball Brand
            </p>

            {/* Big display name */}
            <h1 className="animate-fade-up s2" style={{
              fontFamily: "'Bebas Neue',sans-serif",
              fontSize: "clamp(4rem,12vw,8rem)",
              lineHeight: .92, letterSpacing: ".02em",
              color: "#fff",
              marginBottom: "8px",
            }}>
              RaidKhalid
            </h1>
            <h1 className="animate-fade-up s3" style={{
              fontFamily: "'Bebas Neue',sans-serif",
              fontSize: "clamp(4rem,12vw,8rem)",
              lineHeight: .92, letterSpacing: ".02em",
              color: "#2563eb",
              marginBottom: "28px",
            }}>
              &amp; Co.
            </h1>

            {/* Tagline */}
            <p className="animate-fade-up s3" style={{
              fontSize: "clamp(1rem,2vw,1.15rem)",
              color: "rgba(255,255,255,.65)",
              lineHeight: 1.75, maxWidth: "400px",
              marginBottom: "36px",
              borderLeft: "3px solid #2563eb",
              paddingLeft: "18px",
            }}>
              Elevating basketball culture through passion, excellence, and community.
            </p>

            <div className="flex flex-wrap gap-3 animate-fade-up s4">
              <Link to="/shop" className="btn-primary">
                <ShoppingCart size={16} /> Shop Now
              </Link>
              <Link to="/activities" className="btn-ghost-light">
                <Ticket size={16} /> Get Tickets
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll line */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-fade-in"
          style={{ animationDelay: "1.4s", opacity: 0, animationFillMode: "both", zIndex: 4 }}>
          <span style={{ fontSize: "9px", letterSpacing: ".22em", color: "rgba(255,255,255,.3)", textTransform: "uppercase" }}>Scroll</span>
          <div style={{ width: "1px", height: "44px", background: "linear-gradient(to bottom, rgba(96,165,250,.7), transparent)", animation: "float 2s ease-in-out infinite" }} />
        </div>
      </section>

      {/* ══ TICKER TAPE ════════════════════════════════════════════════════ */}
      <div style={{ background: "#1d4ed8", overflow: "hidden", padding: "14px 0", borderTop: "2px solid #2563eb", borderBottom: "2px solid #2563eb" }}>
        <div className="ticker-track" style={{ gap: "0" }}>
          {["RAIDKHALID & CO.", "OFFICIAL BASKETBALL BRAND", "ELEVATE THE GAME", "SHOP NOW", "GET TICKETS", "WATCH HIGHLIGHTS",
            "RAIDKHALID & CO.", "OFFICIAL BASKETBALL BRAND", "ELEVATE THE GAME", "SHOP NOW", "GET TICKETS", "WATCH HIGHLIGHTS"].map((t, i) => (
            <span key={i} style={{
              fontFamily: "'Bebas Neue',sans-serif",
              fontSize: "16px", letterSpacing: ".18em",
              color: "rgba(255,255,255,.85)", whiteSpace: "nowrap",
              padding: "0 36px",
            }}>
              {t} <span style={{ color: "rgba(255,255,255,.35)", marginLeft: "8px" }}>✦</span>
            </span>
          ))}
        </div>
      </div>

      {/* ══ STATS BAR (white) ═══════════════════════════════════════════════ */}
    

      {/* ══ LATEST NEWS (white with blue accents) ══════════════════════════ */}
      {news.length > 0 && (
        <Reveal style={{ background: "#fff", position: "relative" }}>
          <div className="container mx-auto px-6 py-20">
            {/* Section header */}
            <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12 gap-4">
              <div>
                <p className="eyebrow s1 animate-fade-up" style={{ color: "#2563eb", marginBottom: "12px" }}>Latest Updates</p>
                <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(2.5rem,6vw,4.5rem)", lineHeight: .95, color: "#0a0f1e", letterSpacing: ".02em" }}>
                  Latest News
                </h2>
              </div>
              {/* Decorative line */}
              <div style={{ flex: 1, height: "1px", background: "linear-gradient(90deg, rgba(10,15,30,.12), transparent)", display: "none", maxWidth: "300px" }} className="hidden md:block" />
            </div>

            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
              {news.map((item: any, i: number) => (
                <div key={item.id} className={`news-card animate-fade-up s${i + 1}`}>
                  {item.image_url && (
                    <div className="group overflow-hidden" style={{ height: "190px" }}>
                      <img src={item.image_url} alt={item.title} className="w-full h-full object-cover img-zoom" loading="lazy" />
                    </div>
                  )}
                  {/* Blue top-bar */}
                  <div style={{ height: "3px", background: "linear-gradient(90deg, #2563eb, #60a5fa)" }} />
                  <div className="p-6">
                    <p style={{ fontSize: "10px", color: "#2563eb", fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", marginBottom: "10px" }}>
                      {new Date(item.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                    <h3 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "1.35rem", letterSpacing: ".03em", color: "#0a0f1e", lineHeight: 1.1, marginBottom: "10px" }}>
                      {item.title}
                    </h3>
                    <p className="line-clamp-2" style={{ color: "rgba(10,15,30,.55)", fontSize: "14px", lineHeight: 1.65 }}>{item.excerpt}</p>
                    <div style={{ marginTop: "16px", display: "flex", alignItems: "center", gap: "6px", color: "#2563eb", fontSize: "12px", fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase" }}>
                      Read More <ArrowUpRight size={13} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      )}

      {/* ══ HIGHLIGHTS (dark, diagonal) ════════════════════════════════════ */}
      {highlights.length > 0 && (
        <Reveal className="clip-diagonal-both grid-bg-dark" style={{ background: "#0d1425", paddingTop: "100px", paddingBottom: "100px" }}>
          <div className="container mx-auto px-6">
            <div className="text-center mb-12">
              <p className="eyebrow animate-fade-up s1" style={{ color: "#60a5fa", justifyContent: "center", marginBottom: "14px" }}>Watch &amp; Replay</p>
              <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(2.5rem,6vw,4.5rem)", letterSpacing: ".03em", color: "#fff", lineHeight: .95 }}>
                Player Highlights
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {highlights.map((h: any, i: number) => (
                <div key={h.id} className={`group card-lift-dark rounded-2xl overflow-hidden animate-fade-up s${(i % 3) + 1}`}
                  style={{ background: "#131b30", border: "1px solid rgba(255,255,255,.07)" }}>
                  <div className="relative overflow-hidden" style={{ height: "210px" }}>
                    {h.image_url && <img src={h.image_url} alt={h.title} className="w-full h-full object-cover img-zoom" loading="lazy" />}
                    {h.link_url && (
                      <div className="play-overlay absolute inset-0 flex items-center justify-center">
                        <div className="ring-pulse" style={{
                          width: 60, height: 60, borderRadius: "50%",
                          background: "#2563eb",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          <Play size={22} color="#fff" style={{ marginLeft: 3 }} />
                        </div>
                      </div>
                    )}
                    <div style={{
                      position: "absolute", top: 10, left: 10,
                      background: "#2563eb", color: "#fff",
                      fontSize: "9px", fontWeight: 800, letterSpacing: ".12em", textTransform: "uppercase",
                      padding: "3px 10px", borderRadius: "4px",
                    }}>HIGHLIGHT</div>
                  </div>
                  <div className="p-5">
                    <h3 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "1.25rem", color: "#fff", letterSpacing: ".03em", marginBottom: "6px" }}>{h.title}</h3>
                    {h.description && <p className="line-clamp-2" style={{ color: "rgba(255,255,255,.45)", fontSize: "13px", lineHeight: 1.6, marginBottom: "12px" }}>{h.description}</p>}
                    {h.link_url && (
                      <a href={h.link_url} target="_blank" rel="noopener noreferrer"
                        style={{ display: "inline-flex", alignItems: "center", gap: "5px", color: "#60a5fa", fontSize: "12px", fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", textDecoration: "none" }}>
                        Watch Full Clip <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      )}

      {/* ══ FEATURED PLAYERS (cream bg, editorial) ══════════════════════════ */}
      {players.length > 0 && (
        <Reveal style={{ background: "var(--cream)", position: "relative", overflow: "hidden" }}>
          <div className="grid-bg" style={{ position: "absolute", inset: 0 }} />

          {/* Big background word */}
          <div style={{
            position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
            fontFamily: "'Bebas Neue',sans-serif",
            fontSize: "clamp(8rem,20vw,18rem)",
            color: "rgba(10,15,30,.04)",
            whiteSpace: "nowrap", letterSpacing: ".05em",
            pointerEvents: "none", userSelect: "none", zIndex: 0,
          }}>ROSTER</div>

          <div className="container mx-auto px-6 py-24 relative" style={{ zIndex: 1 }}>
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-14 gap-4">
              <div>
                <p className="eyebrow animate-fade-up s1" style={{ color: "#2563eb", marginBottom: "12px" }}>The Roster</p>
                <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(2.5rem,6vw,4.5rem)", lineHeight: .95, color: "#0a0f1e", letterSpacing: ".02em" }}>
                  Top Players
                </h2>
              </div>
              <Link to="/players" className="btn-primary">
                View All <ChevronRight size={15} />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {players.map((player: any, i: number) => (
                <Link key={player.id} to="/players" style={{ textDecoration: "none" }}>
                  <div className={`player-card-wrap rounded-2xl overflow-hidden animate-fade-up s${i + 1}`}
                    style={{ background: "#0a0f1e", position: "relative" }}>
                    {player.image_url ? (
                      <div className="group overflow-hidden" style={{ height: "clamp(280px,36vw,360px)" }}>
                        <img src={player.image_url} alt={player.name} className="w-full h-full object-contain img-zoom" loading="lazy" />
                      </div>
                    ) : (
                      <div style={{ height: "clamp(280px,36vw,360px)", background: "#131b30", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "6rem", color: "rgba(96,165,250,.15)" }}>#{player.jersey_number}</span>
                      </div>
                    )}
                    {/* Bottom info overlay */}
                    <div style={{ padding: "20px", background: "#0a0f1e" }}>
                      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                        <div>
                          <p style={{ fontSize: "10px", color: "#60a5fa", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", marginBottom: "4px" }}>
                            {player.jersey_number && `#${player.jersey_number}`}{player.position && ` · ${player.position}`}
                          </p>
                          <h3 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "1.7rem", color: "#fff", letterSpacing: ".03em" }}>{player.name}</h3>
                        </div>
                        <div style={{
                          width: 36, height: 36, borderRadius: "50%",
                          background: "#2563eb",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          flexShrink: 0
                        }}>
                          <ArrowUpRight size={16} color="#fff" />
                        </div>
                      </div>
                      {player.stats && (
                        <p style={{ color: "rgba(255,255,255,.4)", fontSize: "12px", marginTop: "6px" }}>
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
          </div>
        </Reveal>
      )}

      {/* ══ FOUNDERS (white bg, generous layout) ═══════════════════════════ */}
      {founders.length > 0 && (
        <Reveal style={{ background: "#fff" }}>
          <div className="container mx-auto px-6 py-24">
            <div className="text-center mb-16">
              <p className="eyebrow animate-fade-up s1" style={{ color: "#2563eb", justifyContent: "center", marginBottom: "12px" }}>The Visionaries</p>
              <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(2.5rem,6vw,4.5rem)", lineHeight: .95, color: "#0a0f1e", letterSpacing: ".02em" }}>
                Our Founders
              </h2>
              {/* Underline bar */}
              <div style={{ width: "60px", height: "4px", background: "#2563eb", borderRadius: "2px", margin: "18px auto 0" }} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10 max-w-4xl mx-auto">
              {founders.map((founder: any, i: number) => (
                <div key={founder.id} className={`text-center animate-fade-up s${i + 1}`}>
                  {/* Avatar */}
                  <div style={{ position: "relative", width: "fit-content", margin: "0 auto 20px" }}>
                    <div style={{
                      width: "clamp(130px,15vw,170px)", height: "clamp(130px,15vw,170px)",
                      borderRadius: "50%", overflow: "hidden",
                      border: "3px solid rgba(10,15,30,.1)",
                      transition: "border-color .3s ease, transform .3s ease",
                    }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#2563eb"; (e.currentTarget as HTMLElement).style.transform = "scale(1.05)"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(10,15,30,.1)"; (e.currentTarget as HTMLElement).style.transform = ""; }}
                    >
                      {founder.image_url ? (
                        <img src={founder.image_url} alt={founder.name} className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <div style={{ width: "100%", height: "100%", background: "#e8f0fe", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Bebas Neue',sans-serif", fontSize: "3rem", color: "#2563eb" }}>
                          {founder.name?.charAt(0)}
                        </div>
                      )}
                    </div>
                    {/* Online dot */}
                    <div style={{ position: "absolute", bottom: "6px", right: "6px", width: 14, height: 14, borderRadius: "50%", background: "#22c55e", border: "3px solid #fff" }} />
                  </div>

                  <h3 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "1.5rem", color: "#0a0f1e", letterSpacing: ".04em", marginBottom: "4px" }}>{founder.name}</h3>
                  <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: ".16em", color: "#2563eb", textTransform: "uppercase", marginBottom: "12px" }}>{founder.role}</p>
                  <p className="line-clamp-3 max-w-xs mx-auto" style={{ color: "rgba(10,15,30,.55)", fontSize: "13.5px", lineHeight: 1.7 }}>{founder.bio}</p>
                </div>
              ))}
            </div>

            <div className="text-center mt-12">
              <Link to="/founders" className="btn-ghost-dark">
                Meet All Founders <ChevronRight size={15} />
              </Link>
            </div>
          </div>
        </Reveal>
      )}

      {/* ══ ACTIVITIES (diagonal dark) ══════════════════════════════════════ */}
      {activities.length > 0 && (
        <Reveal className="clip-diagonal-bottom grid-bg-dark" style={{ background: "#0d1425", paddingTop: "100px", paddingBottom: "120px" }}>
          <div className="container mx-auto px-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
              <div>
                <p className="eyebrow animate-fade-up s1" style={{ color: "#60a5fa", marginBottom: "12px" }}>Mark Your Calendar</p>
                <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(2.5rem,6vw,4.5rem)", lineHeight: .95, color: "#fff", letterSpacing: ".02em" }}>
                  Upcoming Activities
                </h2>
              </div>
              <Link to="/activities" className="btn-ghost-light">
                View All <ChevronRight size={15} />
              </Link>
            </div>

            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
              {activities.map((act: any, i: number) => (
                <div key={act.id}
                  className={`card-lift-dark rounded-2xl overflow-hidden animate-fade-up s${(i % 3) + 1}`}
                  style={{ background: "#131b30", border: "1px solid rgba(255,255,255,.07)" }}>
                  {act.image_url && (
                    <div className="group overflow-hidden" style={{ height: "160px" }}>
                      <img src={act.image_url} alt={act.title} className="w-full h-full object-cover img-zoom" loading="lazy" />
                    </div>
                  )}
                  {/* Colored top border */}
                  <div style={{ height: "3px", background: "linear-gradient(90deg, #2563eb, #60a5fa)" }} />
                  <div className="p-5">
                    <h3 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "1.25rem", letterSpacing: ".03em", color: "#fff", marginBottom: "12px" }}>{act.title}</h3>
                    {act.event_date && (
                      <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(37,99,235,.15)", border: "1px solid rgba(37,99,235,.3)", borderRadius: "8px", padding: "5px 12px", marginBottom: "8px" }}>
                        <span style={{ fontSize: "12px" }}>📅</span>
                        <span style={{ fontSize: "12px", color: "#93c5fd", fontWeight: 600 }}>
                          {new Date(act.event_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                        </span>
                      </div>
                    )}
                    {act.location && (
                      <p style={{ fontSize: "12px", color: "rgba(255,255,255,.4)", display: "flex", alignItems: "center", gap: "5px", marginBottom: "8px" }}>
                        <span>📍</span>{act.location}
                      </p>
                    )}
                    {act.description && (
                      <p className="line-clamp-2" style={{ color: "rgba(255,255,255,.45)", fontSize: "13px", lineHeight: 1.6 }}>{act.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      )}

      {/* ══ SHOP (cream background, editorial product grid) ═════════════════ */}
      {featuredProducts.length > 0 && (
        <Reveal style={{ background: "var(--cream)", position: "relative", overflow: "hidden" }}>
          <div className="grid-bg" style={{ position: "absolute", inset: 0 }} />

          {/* Decorative large circle */}
          <div style={{
            position: "absolute", width: "500px", height: "500px", borderRadius: "50%",
            border: "2px solid rgba(37,99,235,.08)",
            top: "-200px", right: "-200px",
            pointerEvents: "none",
          }} />

          <div className="container mx-auto px-6 py-24 relative" style={{ zIndex: 1 }}>
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
              <div>
                <p className="eyebrow animate-fade-up s1" style={{ color: "#2563eb", marginBottom: "12px" }}>Official Merch</p>
                <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(2.5rem,6vw,4.5rem)", lineHeight: .95, color: "#0a0f1e", letterSpacing: ".02em" }}>
                  Shop Highlights
                </h2>
              </div>
              <Link to="/shop" className="btn-primary">
                Visit Shop <ArrowUpRight size={15} />
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
              {featuredProducts.map((product: any, i: number) => (
                <Link key={product.id} to="/shop" style={{ textDecoration: "none" }}>
                  <div className={`card-lift rounded-2xl overflow-hidden animate-fade-up s${(i % 4) + 1}`}
                    style={{ background: "#fff", border: "1.5px solid rgba(10,15,30,.07)" }}>
                    <div className="group relative overflow-hidden" style={{ height: "clamp(150px,20vw,260px)" }}>
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover img-zoom" loading="lazy" />
                      ) : (
                        <div style={{ width: "100%", height: "100%", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <ShoppingCart size={32} style={{ color: "rgba(10,15,30,.15)" }} />
                        </div>
                      )}
                      {product.badge && (
                        <span style={{
                          position: "absolute", top: 10, right: 10,
                          padding: "4px 12px", borderRadius: "999px",
                          fontSize: "10px", fontWeight: 800, letterSpacing: ".06em",
                          background: product.badge === "hot" ? "#ef4444" : "#2563eb",
                          color: "#fff",
                        }}>
                          {product.badge === "hot" ? "🔥 Hot" : "⭐ Featured"}
                        </span>
                      )}
                    </div>
                    <div style={{ padding: "14px 16px" }}>
                      <h3 className="line-clamp-1" style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "1.1rem", letterSpacing: ".04em", color: "#0a0f1e", marginBottom: "4px" }}>
                        {product.name}
                      </h3>
                      <p style={{ fontWeight: 700, color: "#2563eb", fontSize: "clamp(.85rem,2vw,1rem)" }}>
                        ₱{Number(product.price).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </Reveal>
      )}

      {/* ══ SOCIAL CTA (dark with white pills) ═════════════════════════════ */}
      {socialLinks.length > 0 && (
        <Reveal style={{ background: "#0a0f1e", borderTop: "1px solid rgba(255,255,255,.06)" }}>
          <div className="container mx-auto px-6 py-20 text-center">
            <p className="eyebrow animate-fade-up s1" style={{ color: "#60a5fa", justifyContent: "center", marginBottom: "14px" }}>Stay Connected</p>
            <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(2rem,5vw,3.5rem)", letterSpacing: ".03em", color: "#fff", marginBottom: "32px" }}>
              Follow Us
            </h2>
            <div className="flex flex-wrap justify-center gap-3">
              {socialLinks.map((link: any) => (
                <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer"
                  className="social-pill"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "8px",
                    padding: "12px 24px", borderRadius: "999px",
                    background: "rgba(255,255,255,.07)",
                    border: "1.5px solid rgba(255,255,255,.15)",
                    color: "#f1f5f9", textDecoration: "none",
                    fontWeight: 600, fontSize: "14px", letterSpacing: ".04em",
                    transition: "transform .25s ease, background .25s ease, border-color .25s ease, color .25s ease",
                  }}
                >
                  {link.platform} <ExternalLink size={12} style={{ opacity: .5 }} />
                </a>
              ))}
            </div>
          </div>
        </Reveal>
      )}

      {/* ══ LOADING ════════════════════════════════════════════════════════ */}
      {loading && (
        <section style={{ background: "#0a0f1e", padding: "80px 0", display: "flex", justifyContent: "center", alignItems: "center", gap: "12px" }}>
          {[0, 0.15, 0.3].map((d, i) => (
            <div key={i} style={{
              width: 10, height: 10, borderRadius: "50%",
              background: i === 0 ? "#2563eb" : i === 1 ? "#60a5fa" : "#93c5fd",
              animation: `float 1s ease-in-out ${d}s infinite`,
            }} />
          ))}
        </section>
      )}
    </div>
  );
};

export default HomePage;
