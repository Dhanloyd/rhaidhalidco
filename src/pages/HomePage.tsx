import { Link } from "react-router-dom";
import { ShoppingCart, Ticket, ChevronRight, Play, ExternalLink, ArrowUpRight, Star, Heart, Eye, Zap, Trophy, Users, Calendar } from "lucide-react";
import heroBanner from "@/assets/hero-banner.jpg";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

/* ─── Inline global styles ─── */
const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Outfit:wght@300;400;500;600;700&family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,700;1,9..144,300&display=swap');

  :root {
    --ink: #060b18;
    --ink-soft: #111827;
    --blue: #1a56db;
    --blue-bright: #3b82f6;
    --blue-glow: #60a5fa;
    --gold: #f59e0b;
    --gold-light: #fcd34d;
    --cream: #f9f6f0;
    --cream-dark: #ede8df;
    --white: #ffffff;
    --muted: rgba(6,11,24,.42);
    --r: 14px;
    --r-lg: 24px;
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  @keyframes fadeUp {
    from { opacity:0; transform:translateY(40px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes fadeIn { from{opacity:0} to{opacity:1} }
  @keyframes heroKen {
    0%,100% { transform:scale(1) translateX(0); }
    50%      { transform:scale(1.07) translateX(-1.2%); }
  }
  @keyframes float {
    0%,100% { transform:translateY(0); }
    50%      { transform:translateY(-10px); }
  }
  @keyframes marquee {
    from { transform:translateX(0); }
    to   { transform:translateX(-50%); }
  }
  @keyframes spin-slow { to { transform:rotate(360deg); } }
  @keyframes pulse-ring {
    0%   { box-shadow: 0 0 0 0 rgba(26,86,219,.55); }
    70%  { box-shadow: 0 0 0 18px rgba(26,86,219,0); }
    100% { box-shadow: 0 0 0 0 rgba(26,86,219,0); }
  }
  @keyframes shimmer {
    0%   { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  @keyframes count-up {
    from { opacity:0; transform:translateY(20px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes badge-pop {
    0%   { transform:scale(0) rotate(-12deg); opacity:0; }
    80%  { transform:scale(1.12) rotate(3deg); }
    100% { transform:scale(1) rotate(0); opacity:1; }
  }

  .animate-fade-up   { animation:fadeUp .8s cubic-bezier(.22,1,.36,1) both; }
  .animate-fade-in   { animation:fadeIn .7s ease both; }
  .hero-img          { animation:heroKen 22s ease-in-out infinite; }

  .section-reveal {
    opacity:0; transform:translateY(48px);
    transition:opacity 1s cubic-bezier(.22,1,.36,1), transform 1s cubic-bezier(.22,1,.36,1);
  }
  .section-reveal.visible { opacity:1; transform:translateY(0); }

  /* ─ Card hovers ─ */
  .card-rise {
    transition:transform .4s cubic-bezier(.22,1,.36,1), box-shadow .4s ease;
  }
  .card-rise:hover {
    transform:translateY(-10px);
    box-shadow: 0 32px 72px -16px rgba(6,11,24,.22), 0 0 0 1.5px rgba(26,86,219,.2);
  }

  .card-rise-dark {
    transition:transform .4s cubic-bezier(.22,1,.36,1), box-shadow .4s ease;
  }
  .card-rise-dark:hover {
    transform:translateY(-10px);
    box-shadow: 0 32px 72px -16px rgba(0,0,0,.6), 0 0 0 1.5px rgba(96,165,250,.28);
  }

  .img-zoom { transition:transform .8s cubic-bezier(.22,1,.36,1); }
  .group:hover .img-zoom { transform:scale(1.12); }

  /* ─ Zalora product card ─ */
  .product-card {
    position:relative; background:#fff;
    border-radius:var(--r); overflow:hidden;
    transition:transform .4s cubic-bezier(.22,1,.36,1), box-shadow .4s ease;
    cursor:pointer;
  }
  .product-card:hover {
    transform:translateY(-6px);
    box-shadow:0 24px 60px -12px rgba(6,11,24,.18);
  }
  .product-card .product-img-wrap {
    position:relative; overflow:hidden;
    background:#f3f4f6;
  }
  .product-card .product-img-wrap img {
    width:100%; height:100%; object-fit:cover;
    transition:transform .7s cubic-bezier(.22,1,.36,1);
  }
  .product-card:hover .product-img-wrap img {
    transform:scale(1.08);
  }
  .product-card .product-actions {
    position:absolute; bottom:0; left:0; right:0;
    padding:12px;
    display:flex; flex-direction:column; gap:8px;
    transform:translateY(100%);
    transition:transform .35s cubic-bezier(.22,1,.36,1);
    background:linear-gradient(to top, rgba(6,11,24,.7) 0%, transparent 100%);
  }
  .product-card:hover .product-actions { transform:translateY(0); }

  .product-card .wishlist-btn {
    position:absolute; top:12px; right:12px;
    width:36px; height:36px; border-radius:50%;
    background:rgba(255,255,255,.9); backdrop-filter:blur(8px);
    border:none; cursor:pointer;
    display:flex; align-items:center; justify-content:center;
    transition:transform .25s ease, background .25s ease;
    opacity:0;
    transition:opacity .3s ease, transform .25s ease;
    z-index:2;
  }
  .product-card:hover .wishlist-btn { opacity:1; }
  .product-card .wishlist-btn:hover { transform:scale(1.15); background:#fff; }

  .product-card .view-btn {
    position:absolute; top:54px; right:12px;
    width:36px; height:36px; border-radius:50%;
    background:rgba(255,255,255,.9); backdrop-filter:blur(8px);
    border:none; cursor:pointer;
    display:flex; align-items:center; justify-content:center;
    transition:opacity .3s ease .05s, transform .25s ease;
    opacity:0;
    z-index:2;
  }
  .product-card:hover .view-btn { opacity:1; }
  .product-card .view-btn:hover { transform:scale(1.15); background:#fff; }

  .add-to-bag {
    width:100%; padding:10px 0; border-radius:8px;
    background:#060b18; color:#fff;
    font-family:'Outfit',sans-serif; font-weight:600; font-size:12px; letter-spacing:.08em; text-transform:uppercase;
    border:none; cursor:pointer;
    transition:background .2s ease;
    display:flex; align-items:center; justify-content:center; gap:6px;
  }
  .add-to-bag:hover { background:#1a56db; }

  /* ─ Marquee ticker ─ */
  .ticker-track {
    display:flex; width:max-content;
    animation:marquee 30s linear infinite;
  }
  .ticker-track:hover { animation-play-state:paused; }

  /* ─ Buttons ─ */
  .btn-primary {
    display:inline-flex; align-items:center; gap:9px;
    padding:15px 34px; border-radius:999px;
    background:var(--blue); color:#fff;
    font-family:'Outfit',sans-serif; font-weight:700; font-size:13px; letter-spacing:.06em; text-transform:uppercase;
    border:none; cursor:pointer; text-decoration:none;
    box-shadow:0 10px 36px -8px rgba(26,86,219,.65);
    transition:transform .25s ease, box-shadow .25s ease, background .25s ease;
  }
  .btn-primary:hover {
    transform:translateY(-3px); background:#1440c4;
    box-shadow:0 18px 44px -8px rgba(26,86,219,.75);
  }

  .btn-gold {
    display:inline-flex; align-items:center; gap:9px;
    padding:15px 34px; border-radius:999px;
    background:linear-gradient(135deg, #f59e0b, #d97706); color:#fff;
    font-family:'Outfit',sans-serif; font-weight:700; font-size:13px; letter-spacing:.06em; text-transform:uppercase;
    border:none; cursor:pointer; text-decoration:none;
    box-shadow:0 10px 36px -8px rgba(245,158,11,.6);
    transition:transform .25s ease, box-shadow .25s ease;
  }
  .btn-gold:hover { transform:translateY(-3px); box-shadow:0 18px 44px -8px rgba(245,158,11,.7); }

  .btn-ghost-dark {
    display:inline-flex; align-items:center; gap:9px;
    padding:14px 30px; border-radius:999px;
    background:transparent; color:var(--ink);
    font-family:'Outfit',sans-serif; font-weight:700; font-size:13px; letter-spacing:.06em; text-transform:uppercase;
    border:2px solid rgba(6,11,24,.18); cursor:pointer; text-decoration:none;
    transition:transform .25s ease, background .25s ease, border-color .25s ease;
  }
  .btn-ghost-dark:hover {
    transform:translateY(-2px);
    background:rgba(6,11,24,.05); border-color:rgba(6,11,24,.35);
  }

  .btn-ghost-light {
    display:inline-flex; align-items:center; gap:9px;
    padding:14px 30px; border-radius:999px;
    background:rgba(255,255,255,.1); color:#fff;
    font-family:'Outfit',sans-serif; font-weight:700; font-size:13px; letter-spacing:.06em; text-transform:uppercase;
    border:2px solid rgba(255,255,255,.24); cursor:pointer; text-decoration:none;
    backdrop-filter:blur(14px);
    transition:transform .25s ease, background .25s ease, border-color .25s ease;
  }
  .btn-ghost-light:hover {
    transform:translateY(-2px);
    background:rgba(255,255,255,.18); border-color:rgba(255,255,255,.5);
  }

  /* ─ Eyebrow label ─ */
  .eyebrow {
    display:inline-flex; align-items:center; gap:10px;
    font-family:'Outfit',sans-serif; font-size:11px; font-weight:700;
    letter-spacing:.26em; text-transform:uppercase;
  }
  .eyebrow::before {
    content:''; display:block; width:30px; height:2px; border-radius:2px;
    background:currentColor; opacity:.65;
  }

  /* ─ Diagonal sections ─ */
  .clip-diag-b  { clip-path:polygon(0 0,100% 0,100% 90%,0 100%); }
  .clip-diag-t  { clip-path:polygon(0 10%,100% 0,100% 100%,0 100%); }
  .clip-diag-tb { clip-path:polygon(0 7%,100% 0,100% 93%,0 100%); }

  /* ─ Stagger ─ */
  .s1{animation-delay:.06s} .s2{animation-delay:.18s} .s3{animation-delay:.30s} .s4{animation-delay:.42s}

  /* ─ News card ─ */
  .news-card {
    border-radius:var(--r-lg); overflow:hidden;
    border:1.5px solid rgba(6,11,24,.07);
    background:var(--white);
    transition:transform .4s cubic-bezier(.22,1,.36,1), box-shadow .4s ease, border-color .4s ease;
  }
  .news-card:hover {
    transform:translateY(-8px);
    box-shadow:0 28px 64px -14px rgba(6,11,24,.16);
    border-color:rgba(26,86,219,.28);
  }

  /* ─ Spin badge ─ */
  .spin-badge { animation:spin-slow 14s linear infinite; }

  /* ─ Grid bg ─ */
  .grid-bg {
    background-image:
      linear-gradient(rgba(6,11,24,.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(6,11,24,.04) 1px, transparent 1px);
    background-size:52px 52px;
  }
  .grid-bg-dark {
    background-image:
      linear-gradient(rgba(255,255,255,.025) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,.025) 1px, transparent 1px);
    background-size:52px 52px;
  }

  /* ─ Stats ─ */
  .stat-num {
    font-family:'Bebas Neue',sans-serif;
    font-size:clamp(3rem,8vw,6rem);
    line-height:1; letter-spacing:.03em;
  }

  /* ─ Player card ─ */
  .player-wrap {
    transition:transform .45s cubic-bezier(.22,1,.36,1), box-shadow .45s ease;
  }
  .player-wrap:hover {
    transform:translateY(-12px);
    box-shadow:0 40px 90px -20px rgba(0,0,0,.65);
  }

  /* ─ Social pill ─ */
  .social-pill {
    transition:transform .3s ease, background .3s ease, border-color .3s ease, color .3s ease;
  }
  .social-pill:hover {
    transform:translateY(-4px) scale(1.07);
    background:var(--white) !important; color:var(--ink) !important;
    border-color:var(--white) !important;
  }

  /* ─ Highlight card ─ */
  .hl-card {
    transition:transform .4s cubic-bezier(.22,1,.36,1), box-shadow .4s ease;
  }
  .hl-card:hover {
    transform:translateY(-10px);
    box-shadow:0 32px 72px -16px rgba(0,0,0,.6), 0 0 0 1.5px rgba(96,165,250,.3);
  }

  .play-overlay {
    opacity:0; transition:opacity .35s ease;
    background:radial-gradient(circle, rgba(6,11,24,.55) 0%, rgba(6,11,24,.15) 100%);
  }
  .hl-card:hover .play-overlay { opacity:1; }

  /* ─ Noise texture overlay ─ */
  .noise::after {
    content:''; position:absolute; inset:0; pointer-events:none; z-index:1;
    opacity:.028;
    background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    background-size:180px 180px;
  }

  /* ─ Category pill ─ */
  .cat-pill {
    display:inline-flex; align-items:center; gap:6px;
    padding:8px 20px; border-radius:999px;
    font-family:'Outfit',sans-serif; font-weight:600; font-size:12px; letter-spacing:.04em;
    text-transform:uppercase; cursor:pointer; text-decoration:none;
    transition:transform .25s ease, background .25s ease, color .25s ease, box-shadow .25s ease;
  }
  .cat-pill:hover {
    transform:translateY(-3px);
    box-shadow:0 8px 24px -6px rgba(26,86,219,.35);
  }

  /* ─ Review stars ─ */
  .stars { display:flex; gap:2px; }

  /* ─ Product badge ─ */
  .prod-badge {
    position:absolute; top:10px; left:10px;
    padding:4px 10px; border-radius:6px;
    font-family:'Outfit',sans-serif; font-weight:800; font-size:10px; letter-spacing:.08em; text-transform:uppercase;
    z-index:3; animation:badge-pop .4s cubic-bezier(.22,1,.36,1) both;
  }

  /* ─ Founder card ─ */
  .founder-card {
    transition:transform .4s cubic-bezier(.22,1,.36,1), box-shadow .4s ease;
    cursor:default;
  }
  .founder-card:hover {
    transform:translateY(-8px);
    box-shadow:0 28px 64px -14px rgba(6,11,24,.15);
  }

  /* shimmer skeleton */
  .shimmer {
    background:linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
    background-size:200% 100%;
    animation:shimmer 1.5s infinite;
  }
`;

function useReveal() {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { el.classList.add("visible"); obs.disconnect(); } },
      { threshold: 0.06 }
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

/* Star rating component */
const Stars = ({ rating = 4.5 }: { rating?: number }) => (
  <div className="stars">
    {[1, 2, 3, 4, 5].map(n => (
      <Star key={n} size={11}
        fill={n <= Math.floor(rating) ? "#f59e0b" : n - 0.5 <= rating ? "#fcd34d" : "none"}
        color={n <= rating ? "#f59e0b" : "#d1d5db"}
        strokeWidth={1.5}
      />
    ))}
  </div>
);

const HomePage = () => {
  const [news, setNews] = useState<any[]>([]);
  const [highlights, setHighlights] = useState<any[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [founders, setFounders] = useState<any[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [socialLinks, setSocialLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());

  const toggleWishlist = (id: string) => {
    setWishlist(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  useEffect(() => {
    const id = "rk-v3-styles";
    if (!document.getElementById(id)) {
      const style = document.createElement("style");
      style.id = id;
      style.textContent = GLOBAL_STYLES;
      document.head.appendChild(style);
    }

    Promise.all([
      supabase.from("news").select("*").eq("published", true).order("created_at", { ascending: false }).limit(3),
      supabase.from("highlights").select("*").eq("active", true).order("display_order").limit(6),
      supabase.from("products").select("*").eq("in_stock", true).order("sold_count", { ascending: false }).limit(8),
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
    <div style={{ fontFamily: "'Outfit',sans-serif", background: "#060b18", overflowX: "hidden" }}>

      {/* ══ HERO ═══════════════════════════════════════════════════════════ */}
      <section className="relative flex items-center justify-center overflow-hidden noise" style={{ minHeight: "100svh" }}>
        <img
          src={heroBanner}
          alt="RaidKhalid & Co."
          className="hero-img absolute inset-0 w-full h-full object-cover"
          style={{ transformOrigin: "65% center" }}
        />

        {/* Multi-layer overlay */}
        <div className="absolute inset-0" style={{
          background: "linear-gradient(120deg, rgba(6,11,24,.97) 0%, rgba(6,11,24,.82) 38%, rgba(6,11,24,.4) 68%, transparent 88%), linear-gradient(to top, rgba(6,11,24,.95) 0%, rgba(6,11,24,.3) 45%, transparent 65%)"
        }} />
        <div className="absolute inset-0 grid-bg-dark" style={{ zIndex: 1 }} />

        {/* Blue vertical accent */}
        <div className="absolute left-0 top-0 bottom-0" style={{
          width: "3px",
          background: "linear-gradient(to bottom, transparent 0%, #1a56db 20%, #3b82f6 50%, #1a56db 80%, transparent 100%)",
          zIndex: 2
        }} />

        {/* Rotating badge */}
        <div className="absolute" style={{ top: "7%", right: "4%", zIndex: 3, opacity: .3 }}>
          <svg className="spin-badge" width="130" height="130" viewBox="0 0 130 130">
            <path id="circ2" fill="none" d="M65,16 a49,49 0 1,1 -0.01,0" />
            <text style={{ fill: "#60a5fa", fontSize: 11.5, fontWeight: 700, letterSpacing: 3.5, fontFamily: "'Outfit',sans-serif" }}>
              <textPath href="#circ2">OFFICIAL BASKETBALL BRAND · EST. 2024 · </textPath>
            </text>
          </svg>
          <div style={{
            position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
            width: 36, height: 36, borderRadius: "50%",
            background: "linear-gradient(135deg, #1a56db, #60a5fa)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Trophy size={16} color="#fff" />
          </div>
        </div>

        {/* Geometric accent top-left */}
        <div style={{
          position: "absolute", top: "12%", left: "3%", zIndex: 2,
          width: 80, height: 80,
          border: "1.5px solid rgba(96,165,250,.2)",
          borderRadius: "12px",
          transform: "rotate(18deg)",
          opacity: .5,
        }} />
        <div style={{
          position: "absolute", top: "16%", left: "5%", zIndex: 2,
          width: 50, height: 50,
          border: "1.5px solid rgba(96,165,250,.12)",
          borderRadius: "8px",
          transform: "rotate(38deg)",
          opacity: .4,
        }} />

        <div className="relative container mx-auto px-6" style={{ zIndex: 4 }}>
          <div style={{ maxWidth: "640px" }}>
            <p className="eyebrow animate-fade-in s1" style={{ color: "#60a5fa", marginBottom: "24px" }}>
              Official Basketball Brand
            </p>

            <h1 className="animate-fade-up s2" style={{
              fontFamily: "'Bebas Neue',sans-serif",
              fontSize: "clamp(4.5rem,13vw,9rem)",
              lineHeight: .88, letterSpacing: ".015em",
              color: "#fff",
              marginBottom: "6px",
            }}>
              RaidKhalid
            </h1>
            <h1 className="animate-fade-up s3" style={{
              fontFamily: "'Bebas Neue',sans-serif",
              fontSize: "clamp(4.5rem,13vw,9rem)",
              lineHeight: .88, letterSpacing: ".015em",
              color: "#1a56db",
              marginBottom: "32px",
            }}>
              &amp; Co.
            </h1>

            <p className="animate-fade-up s3" style={{
              fontSize: "clamp(1rem,2vw,1.18rem)",
              color: "rgba(255,255,255,.6)",
              lineHeight: 1.8, maxWidth: "420px",
              marginBottom: "40px",
              borderLeft: "3px solid #1a56db",
              paddingLeft: "20px",
              fontStyle: "italic",
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

            {/* Mini stat chips */}
            <div className="flex flex-wrap gap-3 animate-fade-in" style={{ marginTop: "48px", animationDelay: "1s" }}>
              {[
                { icon: <Trophy size={13} />, label: "Champions" },
                { icon: <Users size={13} />, label: "200+ Members" },
                { icon: <Star size={13} />, label: "Top Brand" },
              ].map((chip, i) => (
                <div key={i} style={{
                  display: "inline-flex", alignItems: "center", gap: "7px",
                  padding: "8px 16px", borderRadius: "999px",
                  background: "rgba(255,255,255,.06)",
                  border: "1px solid rgba(255,255,255,.12)",
                  color: "rgba(255,255,255,.7)",
                  fontSize: "12px", fontWeight: 600, letterSpacing: ".04em",
                }}>
                  {chip.icon} {chip.label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-fade-in"
          style={{ animationDelay: "1.6s", opacity: 0, animationFillMode: "both", zIndex: 4 }}>
          <span style={{ fontSize: "8px", letterSpacing: ".26em", color: "rgba(255,255,255,.28)", textTransform: "uppercase" }}>Scroll</span>
          <div style={{ width: "1px", height: "48px", background: "linear-gradient(to bottom, rgba(96,165,250,.8), transparent)", animation: "float 2s ease-in-out infinite" }} />
        </div>
      </section>

      {/* ══ TICKER ══════════════════════════════════════════════════════════ */}
      <div style={{
        background: "linear-gradient(90deg, #1440c4 0%, #1a56db 50%, #1440c4 100%)",
        overflow: "hidden", padding: "16px 0",
        borderTop: "1px solid rgba(255,255,255,.12)",
        borderBottom: "1px solid rgba(255,255,255,.12)",
      }}>
        <div className="ticker-track">
          {["RAIDKHALID & CO.", "OFFICIAL BASKETBALL BRAND", "ELEVATE THE GAME", "SHOP NOW", "GET TICKETS", "WATCH HIGHLIGHTS", "NEW COLLECTION",
            "RAIDKHALID & CO.", "OFFICIAL BASKETBALL BRAND", "ELEVATE THE GAME", "SHOP NOW", "GET TICKETS", "WATCH HIGHLIGHTS", "NEW COLLECTION"].map((t, i) => (
            <span key={i} style={{
              fontFamily: "'Bebas Neue',sans-serif",
              fontSize: "15px", letterSpacing: ".2em",
              color: "rgba(255,255,255,.88)", whiteSpace: "nowrap",
              padding: "0 40px",
            }}>
              {t} <span style={{ color: "rgba(255,255,255,.3)" }}>◆</span>
            </span>
          ))}
        </div>
      </div>

      {/* ══ STATS BAR ════════════════════════════════════════════════════════ */}
      <Reveal style={{ background: "#fff", borderBottom: "1px solid rgba(6,11,24,.07)" }}>
        <div className="container mx-auto px-6 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-0" style={{ divideColor: "rgba(6,11,24,.08)" }}>
            {[
              { num: "200+", label: "Active Members", icon: <Users size={20} /> },
              { num: "50+", label: "Games Played", icon: <Trophy size={20} /> },
              { num: "3×", label: "Championship Wins", icon: <Star size={20} /> },
              { num: "10K+", label: "Community Fans", icon: <Zap size={20} /> },
            ].map((stat, i) => (
              <div key={i} className="text-center animate-fade-up" style={{
                animationDelay: `${i * 0.12}s`,
                borderRight: i < 3 ? "1px solid rgba(6,11,24,.07)" : "none",
                padding: "8px 16px",
              }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: "10px", color: "#1a56db" }}>{stat.icon}</div>
                <div className="stat-num" style={{ color: "#060b18" }}>{stat.num}</div>
                <p style={{ fontSize: "12px", fontWeight: 600, letterSpacing: ".1em", color: "rgba(6,11,24,.45)", textTransform: "uppercase", marginTop: "6px" }}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      {/* ══ LATEST NEWS ════════════════════════════════════════════════════ */}
      {news.length > 0 && (
        <Reveal style={{ background: "var(--cream)", position: "relative", overflow: "hidden" }}>
          <div className="grid-bg" style={{ position: "absolute", inset: 0 }} />
          <div className="container mx-auto px-6 py-20 relative" style={{ zIndex: 1 }}>
            <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-14 gap-4">
              <div>
                <p className="eyebrow animate-fade-up s1" style={{ color: "#1a56db", marginBottom: "14px" }}>Latest Updates</p>
                <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(2.8rem,7vw,5rem)", lineHeight: .9, color: "#060b18", letterSpacing: ".02em" }}>
                  Latest News
                </h2>
              </div>
              <Link to="/news" className="btn-ghost-dark">
                All Articles <ArrowUpRight size={14} />
              </Link>
            </div>

            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
              {news.map((item: any, i: number) => (
                <div key={item.id} className={`news-card animate-fade-up s${i + 1}`}>
                  {item.image_url && (
                    <div className="group overflow-hidden" style={{ height: "200px" }}>
                      <img src={item.image_url} alt={item.title} className="w-full h-full object-cover img-zoom" loading="lazy" />
                    </div>
                  )}
                  <div style={{ height: "4px", background: "linear-gradient(90deg, #1a56db 0%, #60a5fa 50%, #1a56db 100%)" }} />
                  <div className="p-6">
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                      <p style={{ fontSize: "10px", color: "#1a56db", fontWeight: 800, letterSpacing: ".16em", textTransform: "uppercase" }}>
                        {new Date(item.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                      <span style={{
                        padding: "3px 10px", borderRadius: "6px",
                        background: "rgba(26,86,219,.08)", color: "#1a56db",
                        fontSize: "9px", fontWeight: 800, letterSpacing: ".14em", textTransform: "uppercase",
                      }}>News</span>
                    </div>
                    <h3 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "1.45rem", letterSpacing: ".03em", color: "#060b18", lineHeight: 1.1, marginBottom: "10px" }}>
                      {item.title}
                    </h3>
                    <p className="line-clamp-2" style={{ color: "rgba(6,11,24,.5)", fontSize: "13.5px", lineHeight: 1.7 }}>{item.excerpt}</p>
                    <div style={{
                      marginTop: "18px", paddingTop: "16px",
                      borderTop: "1px solid rgba(6,11,24,.07)",
                      display: "flex", alignItems: "center", gap: "6px",
                      color: "#1a56db", fontSize: "12px", fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase",
                    }}>
                      Read More <ArrowUpRight size={13} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      )}

      {/* ══ HIGHLIGHTS (dark diagonal) ════════════════════════════════════ */}
      {highlights.length > 0 && (
        <Reveal className="clip-diag-tb grid-bg-dark" style={{ background: "#0b1220", paddingTop: "110px", paddingBottom: "110px" }}>
          <div className="container mx-auto px-6">
            <div className="text-center mb-14">
              <p className="eyebrow animate-fade-up s1" style={{ color: "#60a5fa", justifyContent: "center", marginBottom: "14px" }}>Watch & Replay</p>
              <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(2.8rem,7vw,5rem)", letterSpacing: ".02em", color: "#fff", lineHeight: .9 }}>
                Player Highlights
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {highlights.map((h: any, i: number) => (
                <div key={h.id} className={`hl-card group rounded-2xl overflow-hidden animate-fade-up s${(i % 3) + 1}`}
                  style={{ background: "#111827", border: "1px solid rgba(255,255,255,.06)" }}>
                  <div className="relative overflow-hidden" style={{ height: "220px" }}>
                    {h.image_url && <img src={h.image_url} alt={h.title} className="w-full h-full object-cover img-zoom" loading="lazy" />}
                    <div className="play-overlay absolute inset-0 flex items-center justify-center">
                      {h.link_url && (
                        <div style={{
                          width: 64, height: 64, borderRadius: "50%",
                          background: "#1a56db",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          animation: "pulse-ring 2.5s ease-in-out infinite",
                        }}>
                          <Play size={24} color="#fff" style={{ marginLeft: 3 }} />
                        </div>
                      )}
                    </div>
                    <div className="prod-badge" style={{ background: "#1a56db", color: "#fff", top: 10, left: 10 }}>Highlight</div>
                    {/* Duration or number */}
                    <div style={{
                      position: "absolute", bottom: 10, right: 10, zIndex: 3,
                      background: "rgba(6,11,24,.7)", backdropFilter: "blur(8px)",
                      borderRadius: "6px", padding: "3px 8px",
                      fontSize: "11px", fontWeight: 700, color: "#fff", letterSpacing: ".04em",
                    }}>#{i + 1}</div>
                  </div>
                  <div className="p-5">
                    <h3 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "1.3rem", color: "#fff", letterSpacing: ".03em", marginBottom: "8px" }}>{h.title}</h3>
                    {h.description && <p className="line-clamp-2" style={{ color: "rgba(255,255,255,.42)", fontSize: "13px", lineHeight: 1.65, marginBottom: "14px" }}>{h.description}</p>}
                    {h.link_url && (
                      <a href={h.link_url} target="_blank" rel="noopener noreferrer"
                        style={{
                          display: "inline-flex", alignItems: "center", gap: "6px",
                          color: "#60a5fa", fontSize: "12px", fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", textDecoration: "none",
                        }}>
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

      {/* ══ FEATURED PLAYERS ══════════════════════════════════════════════ */}
      {players.length > 0 && (
        <Reveal style={{ background: "var(--cream)", position: "relative", overflow: "hidden" }}>
          <div className="grid-bg" style={{ position: "absolute", inset: 0 }} />
          <div style={{
            position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
            fontFamily: "'Bebas Neue',sans-serif",
            fontSize: "clamp(9rem,22vw,20rem)",
            color: "rgba(6,11,24,.035)",
            whiteSpace: "nowrap", letterSpacing: ".05em",
            pointerEvents: "none", userSelect: "none", zIndex: 0,
          }}>ROSTER</div>

          <div className="container mx-auto px-6 py-24 relative" style={{ zIndex: 1 }}>
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-14 gap-4">
              <div>
                <p className="eyebrow animate-fade-up s1" style={{ color: "#1a56db", marginBottom: "14px" }}>The Roster</p>
                <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(2.8rem,7vw,5rem)", lineHeight: .9, color: "#060b18", letterSpacing: ".02em" }}>
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
                  <div className={`player-wrap rounded-2xl overflow-hidden animate-fade-up s${i + 1}`}
                    style={{ background: "#060b18", position: "relative" }}>
                    {/* Jersey number watermark */}
                    <div style={{
                      position: "absolute", top: "10px", right: "16px", zIndex: 2,
                      fontFamily: "'Bebas Neue',sans-serif",
                      fontSize: "5rem", lineHeight: 1,
                      color: "rgba(255,255,255,.06)",
                      pointerEvents: "none",
                    }}>
                      {player.jersey_number || "00"}
                    </div>

                    {player.image_url ? (
                      <div className="group overflow-hidden" style={{ height: "clamp(290px,38vw,380px)" }}>
                        <img src={player.image_url} alt={player.name} className="w-full h-full object-contain img-zoom" loading="lazy" />
                      </div>
                    ) : (
                      <div style={{
                        height: "clamp(290px,38vw,380px)", background: "#111827",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "7rem", color: "rgba(96,165,250,.12)" }}>
                          #{player.jersey_number}
                        </span>
                      </div>
                    )}

                    <div style={{
                      padding: "20px 22px 22px",
                      background: "linear-gradient(to bottom, #0b1220, #060b18)",
                      borderTop: "2px solid rgba(26,86,219,.35)",
                    }}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                        <div>
                          <p style={{ fontSize: "10px", color: "#60a5fa", fontWeight: 800, letterSpacing: ".14em", textTransform: "uppercase", marginBottom: "5px" }}>
                            {player.jersey_number && `#${player.jersey_number}`}{player.position && ` · ${player.position}`}
                          </p>
                          <h3 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "1.85rem", color: "#fff", letterSpacing: ".03em", lineHeight: 1 }}>{player.name}</h3>
                        </div>
                        <div style={{
                          width: 38, height: 38, borderRadius: "50%",
                          background: "linear-gradient(135deg, #1a56db, #3b82f6)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          flexShrink: 0, marginTop: "2px",
                        }}>
                          <ArrowUpRight size={16} color="#fff" />
                        </div>
                      </div>

                      {player.stats && (
                        <div style={{ display: "flex", gap: "12px", marginTop: "14px" }}>
                          {(player.stats as any).ppg && (
                            <div style={{ textAlign: "center" }}>
                              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "1.4rem", color: "#fff", lineHeight: 1 }}>{(player.stats as any).ppg}</div>
                              <div style={{ fontSize: "9px", fontWeight: 700, letterSpacing: ".1em", color: "rgba(255,255,255,.35)", textTransform: "uppercase" }}>PPG</div>
                            </div>
                          )}
                          {(player.stats as any).rpg && (
                            <>
                              <div style={{ width: 1, background: "rgba(255,255,255,.08)" }} />
                              <div style={{ textAlign: "center" }}>
                                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "1.4rem", color: "#fff", lineHeight: 1 }}>{(player.stats as any).rpg}</div>
                                <div style={{ fontSize: "9px", fontWeight: 700, letterSpacing: ".1em", color: "rgba(255,255,255,.35)", textTransform: "uppercase" }}>RPG</div>
                              </div>
                            </>
                          )}
                          {(player.stats as any).apg && (
                            <>
                              <div style={{ width: 1, background: "rgba(255,255,255,.08)" }} />
                              <div style={{ textAlign: "center" }}>
                                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "1.4rem", color: "#fff", lineHeight: 1 }}>{(player.stats as any).apg}</div>
                                <div style={{ fontSize: "9px", fontWeight: 700, letterSpacing: ".1em", color: "rgba(255,255,255,.35)", textTransform: "uppercase" }}>APG</div>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </Reveal>
      )}

      {/* ══ FOUNDERS ════════════════════════════════════════════════════════ */}
      {founders.length > 0 && (
        <Reveal style={{ background: "#fff" }}>
          <div className="container mx-auto px-6 py-24">
            <div className="text-center mb-16">
              <p className="eyebrow animate-fade-up s1" style={{ color: "#1a56db", justifyContent: "center", marginBottom: "14px" }}>The Visionaries</p>
              <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(2.8rem,7vw,5rem)", lineHeight: .9, color: "#060b18", letterSpacing: ".02em" }}>
                Our Founders
              </h2>
              <div style={{ width: "64px", height: "4px", background: "linear-gradient(90deg, #1a56db, #60a5fa)", borderRadius: "2px", margin: "20px auto 0" }} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {founders.map((founder: any, i: number) => (
                <div key={founder.id} className={`founder-card rounded-2xl overflow-hidden animate-fade-up s${i + 1}`}
                  style={{ background: "var(--cream)", border: "1.5px solid rgba(6,11,24,.07)" }}>
                  {/* Avatar area */}
                  <div style={{ position: "relative", height: "200px", background: "linear-gradient(135deg, #0b1220, #1a56db)", overflow: "hidden" }}>
                    {founder.image_url ? (
                      <img src={founder.image_url} alt={founder.name} className="w-full h-full object-cover" loading="lazy"
                        style={{ objectPosition: "center top" }} />
                    ) : (
                      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "5rem", color: "rgba(255,255,255,.25)" }}>{founder.name?.charAt(0)}</span>
                      </div>
                    )}
                    {/* Online indicator */}
                    <div style={{
                      position: "absolute", bottom: 14, right: 14,
                      display: "flex", alignItems: "center", gap: "6px",
                      background: "rgba(6,11,24,.65)", backdropFilter: "blur(10px)",
                      borderRadius: "999px", padding: "5px 12px",
                      border: "1px solid rgba(255,255,255,.12)",
                    }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e" }} />
                      <span style={{ fontSize: "10px", fontWeight: 700, color: "#fff", letterSpacing: ".06em" }}>Active</span>
                    </div>
                  </div>

                  <div style={{ padding: "20px 22px 24px" }}>
                    <h3 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "1.6rem", color: "#060b18", letterSpacing: ".04em", marginBottom: "4px" }}>{founder.name}</h3>
                    <p style={{ fontSize: "10px", fontWeight: 800, letterSpacing: ".18em", color: "#1a56db", textTransform: "uppercase", marginBottom: "12px" }}>{founder.role}</p>
                    <p className="line-clamp-3" style={{ color: "rgba(6,11,24,.52)", fontSize: "13.5px", lineHeight: 1.72 }}>{founder.bio}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center mt-14">
              <Link to="/founders" className="btn-ghost-dark">
                Meet All Founders <ChevronRight size={15} />
              </Link>
            </div>
          </div>
        </Reveal>
      )}

      {/* ══ ACTIVITIES ══════════════════════════════════════════════════════ */}
      {activities.length > 0 && (
        <Reveal className="clip-diag-b grid-bg-dark" style={{ background: "#0b1220", paddingTop: "110px", paddingBottom: "130px" }}>
          <div className="container mx-auto px-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-14 gap-4">
              <div>
                <p className="eyebrow animate-fade-up s1" style={{ color: "#60a5fa", marginBottom: "14px" }}>Mark Your Calendar</p>
                <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(2.8rem,7vw,5rem)", lineHeight: .9, color: "#fff", letterSpacing: ".02em" }}>
                  Upcoming Events
                </h2>
              </div>
              <Link to="/activities" className="btn-ghost-light">
                View All <ChevronRight size={15} />
              </Link>
            </div>

            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
              {activities.map((act: any, i: number) => (
                <div key={act.id}
                  className={`card-rise-dark rounded-2xl overflow-hidden animate-fade-up s${(i % 3) + 1}`}
                  style={{ background: "#111827", border: "1px solid rgba(255,255,255,.06)" }}>
                  {act.image_url && (
                    <div className="group overflow-hidden" style={{ height: "170px" }}>
                      <img src={act.image_url} alt={act.title} className="w-full h-full object-cover img-zoom" loading="lazy" />
                    </div>
                  )}
                  <div style={{ height: "3px", background: "linear-gradient(90deg, #1a56db, #60a5fa)" }} />
                  <div className="p-6">
                    <h3 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "1.35rem", letterSpacing: ".03em", color: "#fff", marginBottom: "14px", lineHeight: 1.1 }}>{act.title}</h3>

                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "14px" }}>
                      {act.event_date && (
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div style={{
                            width: 30, height: 30, borderRadius: "8px",
                            background: "rgba(26,86,219,.18)", border: "1px solid rgba(26,86,219,.3)",
                            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                          }}>
                            <Calendar size={14} color="#60a5fa" />
                          </div>
                          <span style={{ fontSize: "13px", color: "#93c5fd", fontWeight: 600 }}>
                            {new Date(act.event_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                          </span>
                        </div>
                      )}
                      {act.location && (
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div style={{
                            width: 30, height: 30, borderRadius: "8px",
                            background: "rgba(96,165,250,.1)",
                            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                          }}>
                            <span style={{ fontSize: "13px" }}>📍</span>
                          </div>
                          <span style={{ fontSize: "13px", color: "rgba(255,255,255,.5)", fontWeight: 500 }}>{act.location}</span>
                        </div>
                      )}
                    </div>

                    {act.description && (
                      <p className="line-clamp-2" style={{ color: "rgba(255,255,255,.38)", fontSize: "13px", lineHeight: 1.65 }}>{act.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      )}

      {/* ══ SHOP — ZALORA-STYLE ═══════════════════════════════════════════ */}
      {featuredProducts.length > 0 && (
        <Reveal style={{ background: "#f8f8f8", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0 }}>
            <div style={{
              position: "absolute", top: "-10%", right: "-5%",
              width: "600px", height: "600px", borderRadius: "50%",
              background: "radial-gradient(circle, rgba(26,86,219,.06) 0%, transparent 70%)",
            }} />
          </div>

          <div className="container mx-auto px-6 py-20 relative" style={{ zIndex: 1 }}>

            {/* Section header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
              <div>
                <p className="eyebrow animate-fade-up s1" style={{ color: "#1a56db", marginBottom: "14px" }}>Official Merch</p>
                <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(2.8rem,7vw,5rem)", lineHeight: .9, color: "#060b18", letterSpacing: ".02em" }}>
                  Shop Collection
                </h2>
              </div>
              <Link to="/shop" className="btn-primary">
                Visit Full Shop <ArrowUpRight size={15} />
              </Link>
            </div>

            {/* Category pills */}
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "28px" }}>
              {["All", "Jerseys", "Shorts", "Accessories", "Footwear"].map((cat, i) => (
                <button key={cat} className="cat-pill" style={{
                  background: i === 0 ? "#1a56db" : "#fff",
                  color: i === 0 ? "#fff" : "#060b18",
                  border: i === 0 ? "2px solid #1a56db" : "2px solid rgba(6,11,24,.1)",
                }}>
                  {cat}
                </button>
              ))}
            </div>

            {/* Product grid — Zalora style */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: "16px",
            }}>
              {featuredProducts.map((product: any, i: number) => (
                <Link key={product.id} to="/shop" style={{ textDecoration: "none" }}>
                  <div className={`product-card animate-fade-up s${(i % 4) + 1}`}>

                    {/* Image area */}
                    <div className="product-img-wrap" style={{ height: "clamp(240px,28vw,320px)" }}>
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} loading="lazy" />
                      ) : (
                        <div style={{
                          width: "100%", height: "100%",
                          background: "linear-gradient(135deg, #e8f0fe, #f3f4f6)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          <ShoppingCart size={36} style={{ color: "rgba(6,11,24,.15)" }} />
                        </div>
                      )}

                      {/* Wishlist + quick view buttons */}
                      <button className="wishlist-btn" onClick={(e) => { e.preventDefault(); toggleWishlist(product.id); }}>
                        <Heart
                          size={16}
                          fill={wishlist.has(product.id) ? "#ef4444" : "none"}
                          color={wishlist.has(product.id) ? "#ef4444" : "#060b18"}
                          strokeWidth={1.8}
                        />
                      </button>
                      <button className="view-btn" onClick={(e) => { e.preventDefault(); }}>
                        <Eye size={15} color="#060b18" strokeWidth={1.8} />
                      </button>

                      {/* Badge */}
                      {product.badge && (
                        <div className="prod-badge" style={{
                          background: product.badge === "hot" ? "#ef4444" : product.badge === "new" ? "#1a56db" : "#f59e0b",
                          color: "#fff",
                        }}>
                          {product.badge === "hot" ? "HOT" : product.badge === "new" ? "NEW" : "TOP"}
                        </div>
                      )}

                      {/* Sold count ribbon */}
                      {product.sold_count > 50 && (
                        <div style={{
                          position: "absolute", bottom: 10, left: 10, zIndex: 3,
                          background: "rgba(6,11,24,.75)", backdropFilter: "blur(6px)",
                          borderRadius: "6px", padding: "3px 8px",
                          fontSize: "10px", fontWeight: 700, color: "rgba(255,255,255,.85)",
                        }}>
                          🔥 {product.sold_count}+ sold
                        </div>
                      )}

                      {/* Add to bag overlay */}
                      <div className="product-actions">
                        <button className="add-to-bag" onClick={(e) => e.preventDefault()}>
                          <ShoppingCart size={13} /> Add to Bag
                        </button>
                      </div>
                    </div>

                    {/* Info area — Zalora style */}
                    <div style={{ padding: "14px 16px 18px" }}>
                      {/* Brand tag */}
                      <p style={{
                        fontSize: "10px", fontWeight: 800, letterSpacing: ".14em",
                        color: "#1a56db", textTransform: "uppercase", marginBottom: "5px",
                      }}>RaidKhalid</p>

                      {/* Product name */}
                      <h3 className="line-clamp-2" style={{
                        fontFamily: "'Outfit',sans-serif",
                        fontSize: "14px", fontWeight: 600,
                        color: "#060b18", lineHeight: 1.4, marginBottom: "8px",
                        minHeight: "2.8em",
                      }}>
                        {product.name}
                      </h3>

                      {/* Stars + review count */}
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
                        <Stars rating={product.rating || 4.5} />
                        <span style={{ fontSize: "11px", color: "rgba(6,11,24,.4)", fontWeight: 500 }}>
                          ({product.review_count || Math.floor(Math.random() * 80 + 10)})
                        </span>
                      </div>

                      {/* Price row */}
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        <span style={{ fontWeight: 800, color: "#060b18", fontSize: "15px" }}>
                          ₱{Number(product.price).toLocaleString()}
                        </span>
                        {product.original_price && Number(product.original_price) > Number(product.price) && (
                          <>
                            <span style={{ fontSize: "12px", color: "rgba(6,11,24,.35)", textDecoration: "line-through", fontWeight: 500 }}>
                              ₱{Number(product.original_price).toLocaleString()}
                            </span>
                            <span style={{
                              fontSize: "11px", fontWeight: 800,
                              color: "#fff", background: "#ef4444",
                              padding: "2px 6px", borderRadius: "4px", letterSpacing: ".04em",
                            }}>
                              -{Math.round((1 - product.price / product.original_price) * 100)}%
                            </span>
                          </>
                        )}
                      </div>

                      {/* Free shipping chip */}
                      {Number(product.price) >= 500 && (
                        <div style={{
                          marginTop: "8px",
                          display: "inline-flex", alignItems: "center", gap: "4px",
                          fontSize: "10px", fontWeight: 700, letterSpacing: ".05em",
                          color: "#16a34a",
                        }}>
                          ✓ Free Shipping
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Bottom CTA */}
            <div style={{ textAlign: "center", marginTop: "40px" }}>
              <Link to="/shop" className="btn-ghost-dark">
                Browse Full Collection <ChevronRight size={15} />
              </Link>
            </div>
          </div>
        </Reveal>
      )}

      {/* ══ SOCIAL CTA ════════════════════════════════════════════════════ */}
      {socialLinks.length > 0 && (
        <Reveal style={{ background: "#060b18", borderTop: "1px solid rgba(255,255,255,.05)" }}>
          <div className="container mx-auto px-6 py-20 text-center">
            <p className="eyebrow animate-fade-up s1" style={{ color: "#60a5fa", justifyContent: "center", marginBottom: "14px" }}>Stay Connected</p>
            <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(2.5rem,6vw,4rem)", letterSpacing: ".03em", color: "#fff", marginBottom: "36px", lineHeight: .95 }}>
              Follow Us
            </h2>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "12px" }}>
              {socialLinks.map((link: any) => (
                <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer"
                  className="social-pill"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "9px",
                    padding: "13px 26px", borderRadius: "999px",
                    background: "rgba(255,255,255,.07)",
                    border: "1.5px solid rgba(255,255,255,.14)",
                    color: "#f1f5f9", textDecoration: "none",
                    fontWeight: 700, fontSize: "13px", letterSpacing: ".05em", textTransform: "uppercase",
                  }}>
                  {link.platform} <ExternalLink size={12} style={{ opacity: .45 }} />
                </a>
              ))}
            </div>
          </div>
        </Reveal>
      )}

      {/* ══ LOADING ════════════════════════════════════════════════════════ */}
      {loading && (
        <section style={{ background: "#060b18", padding: "100px 0", display: "flex", justifyContent: "center", alignItems: "center", gap: "14px" }}>
          {[0, 0.18, 0.36].map((d, i) => (
            <div key={i} style={{
              width: 11, height: 11, borderRadius: "50%",
              background: i === 0 ? "#1a56db" : i === 1 ? "#3b82f6" : "#60a5fa",
              animation: `float 1s ease-in-out ${d}s infinite`,
            }} />
          ))}
        </section>
      )}
    </div>
  );
};

export default HomePage;
