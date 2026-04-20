import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, Ticket, ChevronRight, Play, ExternalLink, ArrowUpRight, Star, Heart, Eye, Zap, Trophy, Users, Calendar } from "lucide-react";
import heroBanner from "@/assets/hero-banner.jpg";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

/* ─── Social platform icons ─── */
const FacebookIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const InstagramIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
  </svg>
);

const XIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.259 5.632 5.905-5.632zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const getSocialIcon = (platform: string) => {
  const p = platform.toLowerCase();
  if (p.includes("facebook") || p.includes("fb")) return <FacebookIcon />;
  if (p.includes("instagram") || p.includes("ig")) return <InstagramIcon />;
  if (p.includes("twitter") || p.includes("x")) return <XIcon />;
  return <ExternalLink size={14} />;
};

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
    --r: 10px;
    --r-lg: 16px;
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  @keyframes fadeUp {
    from { opacity:0; transform:translateY(32px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes fadeIn { from{opacity:0} to{opacity:1} }
  @keyframes heroKen {
    0%,100% { transform:scale(1) translateX(0); }
    50%      { transform:scale(1.07) translateX(-1.2%); }
  }
  @keyframes float {
    0%,100% { transform:translateY(0); }
    50%      { transform:translateY(-8px); }
  }
  @keyframes marquee {
    from { transform:translateX(0); }
    to   { transform:translateX(-50%); }
  }
  @keyframes spin-slow { to { transform:rotate(360deg); } }
  @keyframes pulse-ring {
    0%   { box-shadow: 0 0 0 0 rgba(26,86,219,.55); }
    70%  { box-shadow: 0 0 0 14px rgba(26,86,219,0); }
    100% { box-shadow: 0 0 0 0 rgba(26,86,219,0); }
  }
  @keyframes shimmer {
    0%   { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  @keyframes badge-pop {
    0%   { transform:scale(0) rotate(-12deg); opacity:0; }
    80%  { transform:scale(1.12) rotate(3deg); }
    100% { transform:scale(1) rotate(0); opacity:1; }
  }

  .animate-fade-up   { animation:fadeUp .7s cubic-bezier(.22,1,.36,1) both; }
  .animate-fade-in   { animation:fadeIn .6s ease both; }
  .hero-img          { animation:heroKen 22s ease-in-out infinite; }

  .section-reveal {
    opacity:0; transform:translateY(40px);
    transition:opacity .9s cubic-bezier(.22,1,.36,1), transform .9s cubic-bezier(.22,1,.36,1);
  }
  .section-reveal.visible { opacity:1; transform:translateY(0); }

  /* ─ Card hovers ─ */
  .card-rise {
    transition:transform .35s cubic-bezier(.22,1,.36,1), box-shadow .35s ease;
  }
  .card-rise:hover {
    transform:translateY(-6px);
    box-shadow: 0 20px 48px -12px rgba(6,11,24,.16), 0 0 0 1px rgba(26,86,219,.15);
  }

  .card-rise-dark {
    transition:transform .35s cubic-bezier(.22,1,.36,1), box-shadow .35s ease;
  }
  .card-rise-dark:hover {
    transform:translateY(-6px);
    box-shadow: 0 20px 48px -12px rgba(0,0,0,.5), 0 0 0 1px rgba(96,165,250,.2);
  }

  .img-zoom { transition:transform .7s cubic-bezier(.22,1,.36,1); }
  .group:hover .img-zoom { transform:scale(1.08); }

  /* ─ Product card — compact & minimal ─ */
  .product-card {
    position:relative; background:#fff;
    border-radius:var(--r); overflow:hidden;
    border:1px solid rgba(6,11,24,.06);
    transition:transform .35s cubic-bezier(.22,1,.36,1), box-shadow .35s ease, border-color .35s ease;
    cursor:pointer;
  }
  .product-card:hover {
    transform:translateY(-4px);
    box-shadow:0 16px 40px -10px rgba(6,11,24,.14);
    border-color:rgba(26,86,219,.18);
  }
  .product-card .product-img-wrap {
    position:relative; overflow:hidden;
    background:#f5f5f5;
  }
  .product-card .product-img-wrap img {
    width:100%; height:100%; object-fit:cover;
    transition:transform .6s cubic-bezier(.22,1,.36,1);
  }
  .product-card:hover .product-img-wrap img { transform:scale(1.06); }

  .product-card .product-actions {
    position:absolute; bottom:0; left:0; right:0;
    padding:10px;
    transform:translateY(100%);
    transition:transform .3s cubic-bezier(.22,1,.36,1);
    background:linear-gradient(to top, rgba(6,11,24,.65) 0%, transparent 100%);
  }
  .product-card:hover .product-actions { transform:translateY(0); }

  .product-card .wishlist-btn {
    position:absolute; top:8px; right:8px;
    width:30px; height:30px; border-radius:50%;
    background:rgba(255,255,255,.92); backdrop-filter:blur(6px);
    border:none; cursor:pointer;
    display:flex; align-items:center; justify-content:center;
    opacity:0; transition:opacity .25s ease, transform .2s ease;
    z-index:2;
  }
  .product-card:hover .wishlist-btn { opacity:1; }
  .product-card .wishlist-btn:hover { transform:scale(1.12); }

  .product-card .view-btn {
    position:absolute; top:46px; right:8px;
    width:30px; height:30px; border-radius:50%;
    background:rgba(255,255,255,.92); backdrop-filter:blur(6px);
    border:none; cursor:pointer;
    display:flex; align-items:center; justify-content:center;
    opacity:0; transition:opacity .25s ease .04s, transform .2s ease;
    z-index:2;
  }
  .product-card:hover .view-btn { opacity:1; }
  .product-card .view-btn:hover { transform:scale(1.12); }

  .add-to-bag {
    width:100%; padding:8px 0; border-radius:6px;
    background:#060b18; color:#fff;
    font-family:'Outfit',sans-serif; font-weight:700; font-size:11px; letter-spacing:.08em; text-transform:uppercase;
    border:none; cursor:pointer;
    transition:background .2s ease;
    display:flex; align-items:center; justify-content:center; gap:5px;
  }
  .add-to-bag:hover { background:#1a56db; }

  /* ─ Marquee ticker ─ */
  .ticker-track {
    display:flex; width:max-content;
    animation:marquee 28s linear infinite;
  }
  .ticker-track:hover { animation-play-state:paused; }

  /* ─ Buttons ─ */
  .btn-primary {
    display:inline-flex; align-items:center; gap:8px;
    padding:13px 28px; border-radius:999px;
    background:var(--blue); color:#fff;
    font-family:'Outfit',sans-serif; font-weight:700; font-size:12px; letter-spacing:.06em; text-transform:uppercase;
    border:none; cursor:pointer; text-decoration:none;
    box-shadow:0 8px 28px -6px rgba(26,86,219,.55);
    transition:transform .22s ease, box-shadow .22s ease, background .22s ease;
  }
  .btn-primary:hover {
    transform:translateY(-2px); background:#1440c4;
    box-shadow:0 14px 36px -6px rgba(26,86,219,.65);
  }

  .btn-ghost-dark {
    display:inline-flex; align-items:center; gap:8px;
    padding:12px 24px; border-radius:999px;
    background:transparent; color:var(--ink);
    font-family:'Outfit',sans-serif; font-weight:700; font-size:12px; letter-spacing:.06em; text-transform:uppercase;
    border:1.5px solid rgba(6,11,24,.16); cursor:pointer; text-decoration:none;
    transition:transform .22s ease, background .22s ease, border-color .22s ease;
  }
  .btn-ghost-dark:hover {
    transform:translateY(-2px);
    background:rgba(6,11,24,.04); border-color:rgba(6,11,24,.3);
  }

  .btn-ghost-light {
    display:inline-flex; align-items:center; gap:8px;
    padding:12px 24px; border-radius:999px;
    background:rgba(255,255,255,.08); color:#fff;
    font-family:'Outfit',sans-serif; font-weight:700; font-size:12px; letter-spacing:.06em; text-transform:uppercase;
    border:1.5px solid rgba(255,255,255,.2); cursor:pointer; text-decoration:none;
    backdrop-filter:blur(12px);
    transition:transform .22s ease, background .22s ease, border-color .22s ease;
  }
  .btn-ghost-light:hover {
    transform:translateY(-2px);
    background:rgba(255,255,255,.15); border-color:rgba(255,255,255,.44);
  }

  /* ─ Eyebrow label ─ */
  .eyebrow {
    display:inline-flex; align-items:center; gap:8px;
    font-family:'Outfit',sans-serif; font-size:10px; font-weight:700;
    letter-spacing:.24em; text-transform:uppercase;
  }
  .eyebrow::before {
    content:''; display:block; width:24px; height:2px; border-radius:2px;
    background:currentColor; opacity:.6;
  }

  /* ─ Diagonal sections ─ */
  .clip-diag-b  { clip-path:polygon(0 0,100% 0,100% 90%,0 100%); }
  .clip-diag-t  { clip-path:polygon(0 10%,100% 0,100% 100%,0 100%); }
  .clip-diag-tb { clip-path:polygon(0 6%,100% 0,100% 94%,0 100%); }

  /* ─ Stagger ─ */
  .s1{animation-delay:.05s} .s2{animation-delay:.15s} .s3{animation-delay:.26s} .s4{animation-delay:.37s}

  /* ─ News card ─ */
  .news-card {
    border-radius:var(--r-lg); overflow:hidden;
    border:1px solid rgba(6,11,24,.06);
    background:var(--white);
    transition:transform .35s cubic-bezier(.22,1,.36,1), box-shadow .35s ease, border-color .35s ease;
  }
  .news-card:hover {
    transform:translateY(-6px);
    box-shadow:0 20px 50px -12px rgba(6,11,24,.13);
    border-color:rgba(26,86,219,.22);
  }

  /* ─ Spin badge ─ */
  .spin-badge { animation:spin-slow 14s linear infinite; }

  /* ─ Grid bg ─ */
  .grid-bg {
    background-image:
      linear-gradient(rgba(6,11,24,.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(6,11,24,.03) 1px, transparent 1px);
    background-size:48px 48px;
  }
  .grid-bg-dark {
    background-image:
      linear-gradient(rgba(255,255,255,.02) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,.02) 1px, transparent 1px);
    background-size:48px 48px;
  }

  /* ─ Stats ─ */
  .stat-num {
    font-family:'Bebas Neue',sans-serif;
    font-size:clamp(2.6rem,7vw,5rem);
    line-height:1; letter-spacing:.03em;
  }

  /* ─ Player card ─ */
  .player-wrap {
    transition:transform .4s cubic-bezier(.22,1,.36,1), box-shadow .4s ease;
  }
  .player-wrap:hover {
    transform:translateY(-10px);
    box-shadow:0 36px 80px -18px rgba(0,0,0,.6);
  }

  /* ─ Social pill ─ */
  .social-pill {
    transition:transform .28s ease, background .28s ease, border-color .28s ease;
  }
  .social-pill:hover {
    transform:translateY(-3px) scale(1.05);
    background:var(--white) !important; color:var(--ink) !important;
    border-color:var(--white) !important;
  }
  .social-pill:hover svg { color:var(--ink) !important; }

  /* ─ Highlight card ─ */
  .hl-card {
    transition:transform .35s cubic-bezier(.22,1,.36,1), box-shadow .35s ease;
  }
  .hl-card:hover {
    transform:translateY(-8px);
    box-shadow:0 28px 60px -14px rgba(0,0,0,.55), 0 0 0 1px rgba(96,165,250,.25);
  }

  .play-overlay {
    opacity:0; transition:opacity .3s ease;
    background:radial-gradient(circle, rgba(6,11,24,.5) 0%, rgba(6,11,24,.1) 100%);
  }
  .hl-card:hover .play-overlay { opacity:1; }

  /* ─ Noise texture overlay ─ */
  .noise::after {
    content:''; position:absolute; inset:0; pointer-events:none; z-index:1;
    opacity:.025;
    background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    background-size:180px 180px;
  }

  /* ─ Category pill ─ */
  .cat-pill {
    display:inline-flex; align-items:center; gap:5px;
    padding:6px 16px; border-radius:999px;
    font-family:'Outfit',sans-serif; font-weight:600; font-size:11px; letter-spacing:.04em;
    text-transform:uppercase; cursor:pointer; text-decoration:none;
    transition:transform .22s ease, background .22s ease, color .22s ease, box-shadow .22s ease;
  }
  .cat-pill:hover {
    transform:translateY(-2px);
    box-shadow:0 6px 18px -4px rgba(26,86,219,.3);
  }

  /* ─ Review stars ─ */
  .stars { display:flex; gap:2px; }

  /* ─ Product badge ─ */
  .prod-badge {
    position:absolute; top:8px; left:8px;
    padding:3px 8px; border-radius:4px;
    font-family:'Outfit',sans-serif; font-weight:800; font-size:9px; letter-spacing:.08em; text-transform:uppercase;
    z-index:3; animation:badge-pop .35s cubic-bezier(.22,1,.36,1) both;
  }

  /* ─ Founder card ─ */
  .founder-card {
    transition:transform .35s cubic-bezier(.22,1,.36,1), box-shadow .35s ease;
    cursor:default;
  }
  .founder-card:hover {
    transform:translateY(-6px);
    box-shadow:0 22px 50px -12px rgba(6,11,24,.13);
  }

  /* ─ Activity card clickable ─ */
  .activity-card {
    border-radius:var(--r-lg); overflow:hidden;
    background:#111827; border:1px solid rgba(255,255,255,.06);
    cursor:pointer;
    transition:transform .35s cubic-bezier(.22,1,.36,1), box-shadow .35s ease, border-color .35s ease;
    text-decoration:none; display:block;
  }
  .activity-card:hover {
    transform:translateY(-6px);
    box-shadow: 0 20px 48px -12px rgba(0,0,0,.5), 0 0 0 1px rgba(96,165,250,.2);
    border-color:rgba(96,165,250,.22);
  }
  .activity-card:hover .activity-arrow {
    transform:translate(3px,-3px);
  }
  .activity-arrow {
    transition:transform .25s ease;
    display:inline-flex;
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
      { threshold: 0.05 }
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
      <Star key={n} size={10}
        fill={n <= Math.floor(rating) ? "#f59e0b" : n - 0.5 <= rating ? "#fcd34d" : "none"}
        color={n <= rating ? "#f59e0b" : "#d1d5db"}
        strokeWidth={1.5}
      />
    ))}
  </div>
);

const HomePage = () => {
  const navigate = useNavigate();
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
    const id = "rk-v4-styles";
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

      {/* ══ HERO ═════════════════════════════════════════════════════════════ */}
      <section className="relative flex items-center justify-center overflow-hidden noise" style={{ minHeight: "100svh" }}>
        <img
          src={heroBanner}
          alt="RaidKhalid & Co."
          className="hero-img absolute inset-0 w-full h-full object-cover"
          style={{ transformOrigin: "65% center" }}
        />
        <div className="absolute inset-0" style={{
          background: "linear-gradient(120deg, rgba(6,11,24,.97) 0%, rgba(6,11,24,.82) 38%, rgba(6,11,24,.4) 68%, transparent 88%), linear-gradient(to top, rgba(6,11,24,.95) 0%, rgba(6,11,24,.3) 45%, transparent 65%)"
        }} />
        <div className="absolute inset-0 grid-bg-dark" style={{ zIndex: 1 }} />
        <div className="absolute left-0 top-0 bottom-0" style={{
          width: "3px",
          background: "linear-gradient(to bottom, transparent 0%, #1a56db 20%, #3b82f6 50%, #1a56db 80%, transparent 100%)",
          zIndex: 2
        }} />
        <div className="absolute" style={{ top: "7%", right: "4%", zIndex: 3, opacity: .28 }}>
          <svg className="spin-badge" width="120" height="120" viewBox="0 0 120 120">
            <path id="circ2" fill="none" d="M60,14 a46,46 0 1,1 -0.01,0" />
            <text style={{ fill: "#60a5fa", fontSize: 11, fontWeight: 700, letterSpacing: 3, fontFamily: "'Outfit',sans-serif" }}>
              <textPath href="#circ2">OFFICIAL BASKETBALL BRAND · EST. 2024 · </textPath>
            </text>
          </svg>
          <div style={{
            position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
            width: 32, height: 32, borderRadius: "50%",
            background: "linear-gradient(135deg, #1a56db, #60a5fa)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Trophy size={14} color="#fff" />
          </div>
        </div>

        <div className="relative container mx-auto px-6" style={{ zIndex: 4 }}>
          <div style={{ maxWidth: "600px" }}>
            <p className="eyebrow animate-fade-in s1" style={{ color: "#60a5fa", marginBottom: "20px" }}>Official Basketball Brand</p>
            <h1 className="animate-fade-up s2" style={{
              fontFamily: "'Bebas Neue',sans-serif",
              fontSize: "clamp(4rem,12vw,8.5rem)",
              lineHeight: .88, letterSpacing: ".015em",
              color: "#fff", marginBottom: "4px",
            }}>
              RaidKhalid
            </h1>
            <h1 className="animate-fade-up s3" style={{
              fontFamily: "'Bebas Neue',sans-serif",
              fontSize: "clamp(4rem,12vw,8.5rem)",
              lineHeight: .88, letterSpacing: ".015em",
              color: "#1a56db", marginBottom: "28px",
            }}>
              &amp; Co.
            </h1>
            <p className="animate-fade-up s3" style={{
              fontSize: "clamp(.95rem,1.8vw,1.1rem)",
              color: "rgba(255,255,255,.55)",
              lineHeight: 1.8, maxWidth: "400px",
              marginBottom: "36px",
              borderLeft: "2px solid #1a56db",
              paddingLeft: "18px",
              fontStyle: "italic",
            }}>
              Elevating basketball culture through passion, excellence, and community.
            </p>
            <div className="flex flex-wrap gap-3 animate-fade-up s4">
              <Link to="/shop" className="btn-primary">
                <ShoppingCart size={14} /> Shop Now
              </Link>
              <Link to="/activities" className="btn-ghost-light">
                <Ticket size={14} /> Get Tickets
              </Link>
            </div>
            <div className="flex flex-wrap gap-3 animate-fade-in" style={{ marginTop: "40px", animationDelay: ".9s" }}>
              {[
                { icon: <Trophy size={12} />, label: "Champions" },
                { icon: <Users size={12} />, label: "200+ Members" },
                { icon: <Star size={12} />, label: "Top Brand" },
              ].map((chip, i) => (
                <div key={i} style={{
                  display: "inline-flex", alignItems: "center", gap: "6px",
                  padding: "7px 14px", borderRadius: "999px",
                  background: "rgba(255,255,255,.05)",
                  border: "1px solid rgba(255,255,255,.1)",
                  color: "rgba(255,255,255,.65)",
                  fontSize: "11px", fontWeight: 600, letterSpacing: ".04em",
                }}>
                  {chip.icon} {chip.label}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-fade-in"
          style={{ animationDelay: "1.5s", opacity: 0, animationFillMode: "both", zIndex: 4 }}>
          <span style={{ fontSize: "8px", letterSpacing: ".24em", color: "rgba(255,255,255,.25)", textTransform: "uppercase" }}>Scroll</span>
          <div style={{ width: "1px", height: "44px", background: "linear-gradient(to bottom, rgba(96,165,250,.7), transparent)", animation: "float 2s ease-in-out infinite" }} />
        </div>
      </section>

      {/* ══ TICKER ═══════════════════════════════════════════════════════════ */}
      <div style={{
        background: "linear-gradient(90deg, #1440c4 0%, #1a56db 50%, #1440c4 100%)",
        overflow: "hidden", padding: "13px 0",
        borderTop: "1px solid rgba(255,255,255,.1)",
        borderBottom: "1px solid rgba(255,255,255,.1)",
      }}>
        <div className="ticker-track">
          {["RAIDKHALID & CO.", "OFFICIAL BASKETBALL BRAND", "ELEVATE THE GAME", "SHOP NOW", "GET TICKETS", "WATCH HIGHLIGHTS", "NEW COLLECTION",
            "RAIDKHALID & CO.", "OFFICIAL BASKETBALL BRAND", "ELEVATE THE GAME", "SHOP NOW", "GET TICKETS", "WATCH HIGHLIGHTS", "NEW COLLECTION"].map((t, i) => (
            <span key={i} style={{
              fontFamily: "'Bebas Neue',sans-serif",
              fontSize: "14px", letterSpacing: ".18em",
              color: "rgba(255,255,255,.85)", whiteSpace: "nowrap",
              padding: "0 32px",
            }}>
              {t} <span style={{ color: "rgba(255,255,255,.28)" }}>◆</span>
            </span>
          ))}
        </div>
      </div>

      {/* ══ STATS BAR ════════════════════════════════════════════════════════ */}
      <Reveal style={{ background: "#fff", borderBottom: "1px solid rgba(6,11,24,.06)" }}>
        <div className="container mx-auto px-6 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-0">
            {[
              { num: "200+", label: "Active Members", icon: <Users size={18} /> },
              { num: "50+", label: "Games Played", icon: <Trophy size={18} /> },
              { num: "3×", label: "Championship Wins", icon: <Star size={18} /> },
              { num: "10K+", label: "Community Fans", icon: <Zap size={18} /> },
            ].map((stat, i) => (
              <div key={i} className="text-center animate-fade-up" style={{
                animationDelay: `${i * 0.1}s`,
                borderRight: i < 3 ? "1px solid rgba(6,11,24,.06)" : "none",
                padding: "8px 12px",
              }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: "8px", color: "#1a56db" }}>{stat.icon}</div>
                <div className="stat-num" style={{ color: "#060b18" }}>{stat.num}</div>
                <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: ".1em", color: "rgba(6,11,24,.4)", textTransform: "uppercase", marginTop: "4px" }}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      {/* ══ LATEST NEWS ══════════════════════════════════════════════════════ */}
      {news.length > 0 && (
        <Reveal style={{ background: "var(--cream)", position: "relative", overflow: "hidden" }}>
          <div className="grid-bg" style={{ position: "absolute", inset: 0 }} />
          <div className="container mx-auto px-6 py-18 relative" style={{ zIndex: 1, paddingTop: "72px", paddingBottom: "72px" }}>
            <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12 gap-4">
              <div>
                <p className="eyebrow animate-fade-up s1" style={{ color: "#1a56db", marginBottom: "12px" }}>Latest Updates</p>
                <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(2.4rem,6vw,4.4rem)", lineHeight: .9, color: "#060b18", letterSpacing: ".02em" }}>
                  Latest News
                </h2>
              </div>
              <Link to="/news" className="btn-ghost-dark">All Articles <ArrowUpRight size={13} /></Link>
            </div>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
              {news.map((item: any, i: number) => (
                <div key={item.id} className={`news-card animate-fade-up s${i + 1}`}>
                  {item.image_url && (
                    <div className="group overflow-hidden" style={{ height: "180px" }}>
                      <img src={item.image_url} alt={item.title} className="w-full h-full object-cover img-zoom" loading="lazy" />
                    </div>
                  )}
                  <div style={{ height: "3px", background: "linear-gradient(90deg, #1a56db 0%, #60a5fa 50%, #1a56db 100%)" }} />
                  <div className="p-5">
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                      <p style={{ fontSize: "10px", color: "#1a56db", fontWeight: 800, letterSpacing: ".14em", textTransform: "uppercase" }}>
                        {new Date(item.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                      <span style={{
                        padding: "2px 8px", borderRadius: "4px",
                        background: "rgba(26,86,219,.07)", color: "#1a56db",
                        fontSize: "9px", fontWeight: 800, letterSpacing: ".12em", textTransform: "uppercase",
                      }}>News</span>
                    </div>
                    <h3 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "1.3rem", letterSpacing: ".03em", color: "#060b18", lineHeight: 1.1, marginBottom: "8px" }}>
                      {item.title}
                    </h3>
                    <p className="line-clamp-2" style={{ color: "rgba(6,11,24,.48)", fontSize: "13px", lineHeight: 1.65 }}>{item.excerpt}</p>
                    <div style={{
                      marginTop: "14px", paddingTop: "12px",
                      borderTop: "1px solid rgba(6,11,24,.06)",
                      display: "flex", alignItems: "center", gap: "5px",
                      color: "#1a56db", fontSize: "11px", fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase",
                    }}>
                      Read More <ArrowUpRight size={12} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      )}

      {/* ══ HIGHLIGHTS ═══════════════════════════════════════════════════════ */}
      {highlights.length > 0 && (
        <Reveal className="clip-diag-tb grid-bg-dark" style={{ background: "#0b1220", paddingTop: "100px", paddingBottom: "100px" }}>
          <div className="container mx-auto px-6">
            <div className="text-center mb-12">
              <p className="eyebrow animate-fade-up s1" style={{ color: "#60a5fa", justifyContent: "center", marginBottom: "12px" }}>Watch & Replay</p>
              <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(2.4rem,6vw,4.4rem)", letterSpacing: ".02em", color: "#fff", lineHeight: .9 }}>
                Player Highlights
              </h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {highlights.map((h: any, i: number) => (
                <div key={h.id} className={`hl-card group rounded-2xl overflow-hidden animate-fade-up s${(i % 3) + 1}`}
                  style={{ background: "#111827", border: "1px solid rgba(255,255,255,.05)" }}>
                  <div className="relative overflow-hidden" style={{ height: "200px" }}>
                    {h.image_url && <img src={h.image_url} alt={h.title} className="w-full h-full object-cover img-zoom" loading="lazy" />}
                    <div className="play-overlay absolute inset-0 flex items-center justify-center">
                      {h.link_url && (
                        <div style={{
                          width: 56, height: 56, borderRadius: "50%",
                          background: "#1a56db",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          animation: "pulse-ring 2.5s ease-in-out infinite",
                        }}>
                          <Play size={20} color="#fff" style={{ marginLeft: 2 }} />
                        </div>
                      )}
                    </div>
                    <div className="prod-badge" style={{ background: "#1a56db", color: "#fff" }}>Highlight</div>
                    <div style={{
                      position: "absolute", bottom: 8, right: 8, zIndex: 3,
                      background: "rgba(6,11,24,.65)", backdropFilter: "blur(6px)",
                      borderRadius: "4px", padding: "2px 7px",
                      fontSize: "10px", fontWeight: 700, color: "#fff",
                    }}>#{i + 1}</div>
                  </div>
                  <div className="p-4">
                    <h3 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "1.2rem", color: "#fff", letterSpacing: ".03em", marginBottom: "6px" }}>{h.title}</h3>
                    {h.description && <p className="line-clamp-2" style={{ color: "rgba(255,255,255,.38)", fontSize: "12px", lineHeight: 1.6, marginBottom: "12px" }}>{h.description}</p>}
                    {h.link_url && (
                      <a href={h.link_url} target="_blank" rel="noopener noreferrer"
                        style={{
                          display: "inline-flex", alignItems: "center", gap: "5px",
                          color: "#60a5fa", fontSize: "11px", fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", textDecoration: "none",
                        }}>
                        Watch Full Clip <ExternalLink size={11} />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      )}

      {/* ══ FEATURED PLAYERS ═════════════════════════════════════════════════ */}
      {players.length > 0 && (
        <Reveal style={{ background: "var(--cream)", position: "relative", overflow: "hidden" }}>
          <div className="grid-bg" style={{ position: "absolute", inset: 0 }} />
          <div style={{
            position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
            fontFamily: "'Bebas Neue',sans-serif",
            fontSize: "clamp(8rem,20vw,18rem)",
            color: "rgba(6,11,24,.03)",
            whiteSpace: "nowrap", letterSpacing: ".05em",
            pointerEvents: "none", userSelect: "none", zIndex: 0,
          }}>ROSTER</div>
          <div className="container mx-auto px-6 relative" style={{ zIndex: 1, paddingTop: "80px", paddingBottom: "80px" }}>
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
              <div>
                <p className="eyebrow animate-fade-up s1" style={{ color: "#1a56db", marginBottom: "12px" }}>The Roster</p>
                <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(2.4rem,6vw,4.4rem)", lineHeight: .9, color: "#060b18", letterSpacing: ".02em" }}>
                  Top Players
                </h2>
              </div>
              <Link to="/players" className="btn-primary">View All <ChevronRight size={14} /></Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {players.map((player: any, i: number) => (
                <Link key={player.id} to="/players" style={{ textDecoration: "none" }}>
                  <div className={`player-wrap rounded-2xl overflow-hidden animate-fade-up s${i + 1}`}
                    style={{ background: "#060b18", position: "relative" }}>
                    <div style={{
                      position: "absolute", top: "8px", right: "14px", zIndex: 2,
                      fontFamily: "'Bebas Neue',sans-serif",
                      fontSize: "4.5rem", lineHeight: 1,
                      color: "rgba(255,255,255,.05)",
                      pointerEvents: "none",
                    }}>
                      {player.jersey_number || "00"}
                    </div>
                    {player.image_url ? (
                      <div className="group overflow-hidden" style={{ height: "clamp(180px,22vw,240px)" }}>
                        <img src={player.image_url} alt={player.name} className="w-full h-full object-contain img-zoom" loading="lazy" />
                      </div>
                    ) : (
                      <div style={{
                        height: "clamp(180px,22vw,240px)", background: "#111827",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "6rem", color: "rgba(96,165,250,.1)" }}>
                          #{player.jersey_number}
                        </span>
                      </div>
                    )}
                    <div style={{
                      padding: "10px 12px 12px",
                      background: "linear-gradient(to bottom, #0b1220, #060b18)",
                      borderTop: "2px solid rgba(26,86,219,.3)",
                    }}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                        <div>
                          <p style={{ fontSize: "8px", color: "#60a5fa", fontWeight: 800, letterSpacing: ".13em", textTransform: "uppercase", marginBottom: "3px" }}>
                            {player.jersey_number && `#${player.jersey_number}`}{player.position && ` · ${player.position}`}
                          </p>
                          <h3 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "1.25rem", color: "#fff", letterSpacing: ".03em", lineHeight: 1 }}>{player.name}</h3>
                        </div>
                        <div style={{
                          width: 24, height: 24, borderRadius: "50%",
                          background: "linear-gradient(135deg, #1a56db, #3b82f6)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          flexShrink: 0, marginTop: "1px",
                        }}>
                          <ArrowUpRight size={11} color="#fff" />
                        </div>
                      </div>
                      {player.stats && (
                        <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                          {(player.stats as any).ppg && (
                            <div style={{ textAlign: "center" }}>
                              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "1.05rem", color: "#fff", lineHeight: 1 }}>{(player.stats as any).ppg}</div>
                              <div style={{ fontSize: "7px", fontWeight: 700, letterSpacing: ".1em", color: "rgba(255,255,255,.32)", textTransform: "uppercase" }}>PPG</div>
                            </div>
                          )}
                          {(player.stats as any).rpg && (
                            <>
                              <div style={{ width: 1, background: "rgba(255,255,255,.07)" }} />
                              <div style={{ textAlign: "center" }}>
                                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "1.05rem", color: "#fff", lineHeight: 1 }}>{(player.stats as any).rpg}</div>
                                <div style={{ fontSize: "7px", fontWeight: 700, letterSpacing: ".1em", color: "rgba(255,255,255,.32)", textTransform: "uppercase" }}>RPG</div>
                              </div>
                            </>
                          )}
                          {(player.stats as any).apg && (
                            <>
                              <div style={{ width: 1, background: "rgba(255,255,255,.07)" }} />
                              <div style={{ textAlign: "center" }}>
                                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "1.05rem", color: "#fff", lineHeight: 1 }}>{(player.stats as any).apg}</div>
                                <div style={{ fontSize: "7px", fontWeight: 700, letterSpacing: ".1em", color: "rgba(255,255,255,.32)", textTransform: "uppercase" }}>APG</div>
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

      {/* ══ FOUNDERS ══════════════════════════════════════════════════════════ */}
      {founders.length > 0 && (
        <Reveal style={{ background: "#fff" }}>
          <div className="container mx-auto px-6" style={{ paddingTop: "80px", paddingBottom: "80px" }}>
            <div className="text-center mb-14">
              <p className="eyebrow animate-fade-up s1" style={{ color: "#1a56db", justifyContent: "center", marginBottom: "12px" }}>The Visionaries</p>
              <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(2.4rem,6vw,4.4rem)", lineHeight: .9, color: "#060b18", letterSpacing: ".02em" }}>
                Our Founders
              </h2>
              <div style={{ width: "48px", height: "3px", background: "linear-gradient(90deg, #1a56db, #60a5fa)", borderRadius: "2px", margin: "16px auto 0" }} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {founders.map((founder: any, i: number) => (
                <div key={founder.id} className={`founder-card rounded-2xl overflow-hidden animate-fade-up s${i + 1}`}
                  style={{ background: "var(--cream)", border: "1px solid rgba(6,11,24,.06)" }}>
                  <div style={{ position: "relative", height: "190px", background: "linear-gradient(135deg, #0b1220, #1a56db)", overflow: "hidden" }}>
                    {founder.image_url ? (
                      <img src={founder.image_url} alt={founder.name} className="w-full h-full object-cover" loading="lazy"
                        style={{ objectPosition: "center top" }} />
                    ) : (
                      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "4.5rem", color: "rgba(255,255,255,.2)" }}>{founder.name?.charAt(0)}</span>
                      </div>
                    )}
                    <div style={{
                      position: "absolute", bottom: 12, right: 12,
                      display: "flex", alignItems: "center", gap: "5px",
                      background: "rgba(6,11,24,.6)", backdropFilter: "blur(8px)",
                      borderRadius: "999px", padding: "4px 10px",
                      border: "1px solid rgba(255,255,255,.1)",
                    }}>
                      <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e" }} />
                      <span style={{ fontSize: "9px", fontWeight: 700, color: "#fff", letterSpacing: ".06em" }}>Active</span>
                    </div>
                  </div>
                  <div style={{ padding: "18px 20px 22px" }}>
                    <h3 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "1.5rem", color: "#060b18", letterSpacing: ".04em", marginBottom: "3px" }}>{founder.name}</h3>
                    <p style={{ fontSize: "9px", fontWeight: 800, letterSpacing: ".16em", color: "#1a56db", textTransform: "uppercase", marginBottom: "10px" }}>{founder.role}</p>
                    <p className="line-clamp-3" style={{ color: "rgba(6,11,24,.5)", fontSize: "13px", lineHeight: 1.7 }}>{founder.bio}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center mt-12">
              <Link to="/founders" className="btn-ghost-dark">Meet All Founders <ChevronRight size={14} /></Link>
            </div>
          </div>
        </Reveal>
      )}

      {/* ══ ACTIVITIES — fully clickable ══════════════════════════════════════ */}
      {activities.length > 0 && (
        <Reveal className="clip-diag-b grid-bg-dark" style={{ background: "#0b1220", paddingTop: "100px", paddingBottom: "120px" }}>
          <div className="container mx-auto px-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
              <div>
                <p className="eyebrow animate-fade-up s1" style={{ color: "#60a5fa", marginBottom: "12px" }}>Mark Your Calendar</p>
                <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(2.4rem,6vw,4.4rem)", lineHeight: .9, color: "#fff", letterSpacing: ".02em" }}>
                  Upcoming Events
                </h2>
              </div>
              <Link to="/activities" className="btn-ghost-light">View All <ChevronRight size={14} /></Link>
            </div>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {activities.map((act: any, i: number) => (
                <Link
                  key={act.id}
                  to="/activities"
                  className={`activity-card animate-fade-up s${(i % 3) + 1}`}
                >
                  {act.image_url && (
                    <div className="group overflow-hidden" style={{ height: "110px" }}>
                      <img src={act.image_url} alt={act.title} className="w-full h-full object-cover img-zoom" loading="lazy" />
                    </div>
                  )}
                  <div style={{ height: "2px", background: "linear-gradient(90deg, #1a56db, #60a5fa)" }} />
                  <div style={{ padding: "12px 14px 14px" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "8px" }}>
                      <h3 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "1.1rem", letterSpacing: ".03em", color: "#fff", lineHeight: 1.1, flex: 1, paddingRight: "8px" }}>{act.title}</h3>
                      <span className="activity-arrow" style={{ color: "#60a5fa", flexShrink: 0, marginTop: "1px" }}>
                        <ArrowUpRight size={14} />
                      </span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "5px", marginBottom: "8px" }}>
                      {act.event_date && (
                        <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                          <div style={{
                            width: 20, height: 20, borderRadius: "5px",
                            background: "rgba(26,86,219,.16)", border: "1px solid rgba(26,86,219,.25)",
                            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                          }}>
                            <Calendar size={10} color="#60a5fa" />
                          </div>
                          <span style={{ fontSize: "11px", color: "#93c5fd", fontWeight: 600 }}>
                            {new Date(act.event_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </span>
                        </div>
                      )}
                      {act.location && (
                        <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                          <div style={{
                            width: 20, height: 20, borderRadius: "5px",
                            background: "rgba(96,165,250,.08)",
                            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                            fontSize: "10px",
                          }}>📍</div>
                          <span style={{ fontSize: "11px", color: "rgba(255,255,255,.42)", fontWeight: 500 }}>{act.location}</span>
                        </div>
                      )}
                    </div>
                    {act.description && (
                      <p className="line-clamp-1" style={{ color: "rgba(255,255,255,.3)", fontSize: "11px", lineHeight: 1.55 }}>{act.description}</p>
                    )}
                    <div style={{
                      marginTop: "10px", paddingTop: "8px",
                      borderTop: "1px solid rgba(255,255,255,.05)",
                      display: "flex", alignItems: "center", gap: "4px",
                      color: "#60a5fa", fontSize: "10px", fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase",
                    }}>
                      <Ticket size={10} /> View Details
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </Reveal>
      )}

      {/* ══ SHOP — compact Zalora-style ═══════════════════════════════════════ */}
      {featuredProducts.length > 0 && (
        <Reveal style={{ background: "#f7f7f7", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0 }}>
            <div style={{
              position: "absolute", top: "-10%", right: "-5%",
              width: "500px", height: "500px", borderRadius: "50%",
              background: "radial-gradient(circle, rgba(26,86,219,.05) 0%, transparent 70%)",
            }} />
          </div>
          <div className="container mx-auto px-6 relative" style={{ zIndex: 1, paddingTop: "72px", paddingBottom: "72px" }}>
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-4">
              <div>
                <p className="eyebrow animate-fade-up s1" style={{ color: "#1a56db", marginBottom: "12px" }}>Official Merch</p>
                <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(2.4rem,6vw,4.4rem)", lineHeight: .9, color: "#060b18", letterSpacing: ".02em" }}>
                  Shop Collection
                </h2>
              </div>
              <Link to="/shop" className="btn-primary">Visit Full Shop <ArrowUpRight size={14} /></Link>
            </div>

            {/* Category pills */}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "22px" }}>
              {["All", "Jerseys", "Shorts", "Accessories", "Footwear"].map((cat, i) => (
                <button key={cat} className="cat-pill" style={{
                  background: i === 0 ? "#1a56db" : "#fff",
                  color: i === 0 ? "#fff" : "#060b18",
                  border: i === 0 ? "1.5px solid #1a56db" : "1.5px solid rgba(6,11,24,.09)",
                }}>
                  {cat}
                </button>
              ))}
            </div>

            {/* Product grid — compact */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
              gap: "12px",
            }}>
              {featuredProducts.map((product: any, i: number) => (
                <Link key={product.id} to="/shop" style={{ textDecoration: "none" }}>
                  <div className={`product-card animate-fade-up s${(i % 4) + 1}`}>
                    {/* Image area — compact height */}
                    <div className="product-img-wrap" style={{ height: "clamp(200px,22vw,260px)" }}>
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} loading="lazy" />
                      ) : (
                        <div style={{
                          width: "100%", height: "100%",
                          background: "linear-gradient(135deg, #e8f0fe, #f3f4f6)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          <ShoppingCart size={28} style={{ color: "rgba(6,11,24,.12)" }} />
                        </div>
                      )}
                      <button className="wishlist-btn" onClick={(e) => { e.preventDefault(); toggleWishlist(product.id); }}>
                        <Heart
                          size={13}
                          fill={wishlist.has(product.id) ? "#ef4444" : "none"}
                          color={wishlist.has(product.id) ? "#ef4444" : "#060b18"}
                          strokeWidth={1.8}
                        />
                      </button>
                      <button className="view-btn" onClick={(e) => { e.preventDefault(); }}>
                        <Eye size={12} color="#060b18" strokeWidth={1.8} />
                      </button>
                      {product.badge && (
                        <div className="prod-badge" style={{
                          background: product.badge === "hot" ? "#ef4444" : product.badge === "new" ? "#1a56db" : "#f59e0b",
                          color: "#fff",
                        }}>
                          {product.badge === "hot" ? "HOT" : product.badge === "new" ? "NEW" : "TOP"}
                        </div>
                      )}
                      {product.sold_count > 50 && (
                        <div style={{
                          position: "absolute", bottom: 8, left: 8, zIndex: 3,
                          background: "rgba(6,11,24,.72)", backdropFilter: "blur(4px)",
                          borderRadius: "4px", padding: "2px 7px",
                          fontSize: "9px", fontWeight: 700, color: "rgba(255,255,255,.82)",
                        }}>
                          🔥 {product.sold_count}+ sold
                        </div>
                      )}
                      <div className="product-actions">
                        <button className="add-to-bag" onClick={(e) => e.preventDefault()}>
                          <ShoppingCart size={11} /> Add to Bag
                        </button>
                      </div>
                    </div>

                    {/* Info area — tight */}
                    <div style={{ padding: "11px 13px 14px" }}>
                      <p style={{
                        fontSize: "9px", fontWeight: 800, letterSpacing: ".14em",
                        color: "#1a56db", textTransform: "uppercase", marginBottom: "4px",
                      }}>RaidKhalid</p>
                      <h3 className="line-clamp-2" style={{
                        fontFamily: "'Outfit',sans-serif",
                        fontSize: "13px", fontWeight: 600,
                        color: "#060b18", lineHeight: 1.35, marginBottom: "7px",
                        minHeight: "2.7em",
                      }}>
                        {product.name}
                      </h3>
                      <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "8px" }}>
                        <Stars rating={product.rating || 4.5} />
                        <span style={{ fontSize: "10px", color: "rgba(6,11,24,.38)", fontWeight: 500 }}>
                          ({product.review_count || Math.floor(Math.random() * 80 + 10)})
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                        <span style={{ fontWeight: 800, color: "#060b18", fontSize: "14px" }}>
                          ₱{Number(product.price).toLocaleString()}
                        </span>
                        {product.original_price && Number(product.original_price) > Number(product.price) && (
                          <>
                            <span style={{ fontSize: "11px", color: "rgba(6,11,24,.32)", textDecoration: "line-through", fontWeight: 500 }}>
                              ₱{Number(product.original_price).toLocaleString()}
                            </span>
                            <span style={{
                              fontSize: "10px", fontWeight: 800,
                              color: "#fff", background: "#ef4444",
                              padding: "1px 5px", borderRadius: "3px",
                            }}>
                              -{Math.round((1 - product.price / product.original_price) * 100)}%
                            </span>
                          </>
                        )}
                      </div>
                      {Number(product.price) >= 500 && (
                        <div style={{
                          marginTop: "6px",
                          display: "inline-flex", alignItems: "center", gap: "3px",
                          fontSize: "9px", fontWeight: 700,
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

            <div style={{ textAlign: "center", marginTop: "32px" }}>
              <Link to="/shop" className="btn-ghost-dark">Browse Full Collection <ChevronRight size={14} /></Link>
            </div>
          </div>
        </Reveal>
      )}

      {/* ══ SOCIAL CTA — with real icons ═════════════════════════════════════ */}
      {socialLinks.length > 0 && (
        <Reveal style={{ background: "#060b18", borderTop: "1px solid rgba(255,255,255,.04)" }}>
          <div className="container mx-auto px-6 text-center" style={{ paddingTop: "72px", paddingBottom: "72px" }}>
            <p className="eyebrow animate-fade-up s1" style={{ color: "#60a5fa", justifyContent: "center", marginBottom: "12px" }}>Stay Connected</p>
            <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(2.2rem,5vw,3.6rem)", letterSpacing: ".03em", color: "#fff", marginBottom: "32px", lineHeight: .95 }}>
              Follow Us
            </h2>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "10px" }}>
              {socialLinks.map((link: any) => (
                <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer"
                  className="social-pill"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "8px",
                    padding: "12px 22px", borderRadius: "999px",
                    background: "rgba(255,255,255,.06)",
                    border: "1px solid rgba(255,255,255,.12)",
                    color: "#f1f5f9", textDecoration: "none",
                    fontWeight: 700, fontSize: "12px", letterSpacing: ".05em", textTransform: "uppercase",
                  }}>
                  {getSocialIcon(link.platform)}
                  {link.platform}
                </a>
              ))}
            </div>
          </div>
        </Reveal>
      )}

      {/* ══ LOADING ═══════════════════════════════════════════════════════════ */}
      {loading && (
        <section style={{ background: "#060b18", padding: "80px 0", display: "flex", justifyContent: "center", alignItems: "center", gap: "12px" }}>
          {[0, 0.16, 0.32].map((d, i) => (
            <div key={i} style={{
              width: 9, height: 9, borderRadius: "50%",
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
