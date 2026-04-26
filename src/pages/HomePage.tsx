import { Link, useNavigate } from "react-router-dom";
import {
  ShoppingCart, Ticket, ChevronRight, Play, ExternalLink,
  ArrowUpRight, Star, Heart, Eye, Trophy, Calendar,
  TrendingUp, Users, Award, Zap, MapPin, Clock
} from "lucide-react";
import heroBanner from "@/assets/hero-banner.jpg";
import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

/* ─── Social Icons ─── */
const FacebookIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);
const InstagramIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
  </svg>
);
const XIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.259 5.632 5.905-5.632zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const getSocialIcon = (platform: string) => {
  const p = platform.toLowerCase();
  if (p.includes("facebook") || p.includes("fb")) return <FacebookIcon />;
  if (p.includes("instagram") || p.includes("ig")) return <InstagramIcon />;
  if (p.includes("twitter") || p.includes("x")) return <XIcon />;
  return <ExternalLink size={13} />;
};

/* ─── Global Styles ─── */
const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Outfit:wght@300;400;500;600;700;800&family=DM+Serif+Display:ital@0;1&display=swap');

  :root {
    --ink: #05090f;
    --ink-soft: #0d1425;
    --blue: #1847d4;
    --blue-mid: #2563eb;
    --blue-bright: #3b82f6;
    --blue-glow: #60a5fa;
    --gold: #f59e0b;
    --gold-light: #fcd34d;
    --cream: #f8f5ef;
    --cream-dark: #ede8de;
    --white: #ffffff;
    --r: 12px;
    --r-lg: 18px;
    --r-xl: 24px;
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  @keyframes fadeUp   { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
  @keyframes heroKen  { 0%,100%{transform:scale(1) translateX(0)} 50%{transform:scale(1.06) translateX(-1%)} }
  @keyframes float    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-9px)} }
  @keyframes marquee  { from{transform:translateX(0)} to{transform:translateX(-50%)} }
  @keyframes spinSlow { to{transform:rotate(360deg)} }
  @keyframes pulseRing{
    0%  {box-shadow:0 0 0 0 rgba(24,71,212,.6)}
    70% {box-shadow:0 0 0 16px rgba(24,71,212,0)}
    100%{box-shadow:0 0 0 0 rgba(24,71,212,0)}
  }
  @keyframes shimmer  { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
  @keyframes badgePop {
    0%  {transform:scale(0) rotate(-10deg);opacity:0}
    80% {transform:scale(1.1) rotate(2deg)}
    100%{transform:scale(1) rotate(0);opacity:1}
  }
  @keyframes countUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes scanLine { 0%{top:-100%} 100%{top:200%} }
  @keyframes gradShift {
    0%,100%{background-position:0% 50%}
    50%{background-position:100% 50%}
  }

  .animate-fade-up { animation:fadeUp .75s cubic-bezier(.22,1,.36,1) both; }
  .animate-fade-in { animation:fadeIn .6s ease both; }
  .hero-img        { animation:heroKen 24s ease-in-out infinite; }

  .section-reveal {
    opacity:0; transform:translateY(36px);
    transition:opacity .9s cubic-bezier(.22,1,.36,1), transform .9s cubic-bezier(.22,1,.36,1);
  }
  .section-reveal.visible { opacity:1; transform:translateY(0); }

  /* ─ Cards ─ */
  .card-rise {
    transition:transform .35s cubic-bezier(.22,1,.36,1), box-shadow .35s ease;
  }
  .card-rise:hover {
    transform:translateY(-7px);
    box-shadow:0 24px 52px -14px rgba(5,9,15,.15), 0 0 0 1px rgba(24,71,212,.12);
  }
  .card-rise-dark {
    transition:transform .35s cubic-bezier(.22,1,.36,1), box-shadow .35s ease;
  }
  .card-rise-dark:hover {
    transform:translateY(-7px);
    box-shadow:0 24px 52px -14px rgba(0,0,0,.55), 0 0 0 1px rgba(96,165,250,.22);
  }
  .img-zoom { transition:transform .75s cubic-bezier(.22,1,.36,1); }
  .group:hover .img-zoom { transform:scale(1.09); }

  /* ─ Product Card ─ */
  .product-card {
    position:relative; background:#fff;
    border-radius:var(--r-lg); overflow:hidden;
    border:1px solid rgba(5,9,15,.06);
    transition:transform .35s cubic-bezier(.22,1,.36,1), box-shadow .35s ease, border-color .35s ease;
    cursor:pointer;
  }
  .product-card:hover {
    transform:translateY(-5px);
    box-shadow:0 20px 44px -12px rgba(5,9,15,.15);
    border-color:rgba(24,71,212,.2);
  }
  .product-card .product-img-wrap {
    position:relative; overflow:hidden; background:#f3f4f6;
  }
  .product-card .product-img-wrap img {
    width:100%; height:100%; object-fit:cover;
    transition:transform .65s cubic-bezier(.22,1,.36,1);
  }
  .product-card:hover .product-img-wrap img { transform:scale(1.07); }
  .product-card .product-overlay {
    position:absolute; inset:0;
    background:linear-gradient(to top, rgba(5,9,15,.62) 0%, rgba(5,9,15,.08) 55%, transparent 100%);
    opacity:0; transition:opacity .3s ease;
  }
  .product-card:hover .product-overlay { opacity:1; }
  .product-card .product-actions {
    position:absolute; bottom:0; left:0; right:0; padding:12px;
    transform:translateY(100%); transition:transform .32s cubic-bezier(.22,1,.36,1);
  }
  .product-card:hover .product-actions { transform:translateY(0); }
  .product-card .float-btn {
    position:absolute; top:10px; right:10px;
    width:32px; height:32px; border-radius:50%;
    background:rgba(255,255,255,.94); backdrop-filter:blur(8px);
    border:none; cursor:pointer;
    display:flex; align-items:center; justify-content:center;
    opacity:0; transition:opacity .25s ease, transform .2s ease;
    z-index:3; box-shadow:0 2px 8px rgba(5,9,15,.14);
  }
  .product-card:hover .float-btn { opacity:1; }
  .product-card .float-btn:hover { transform:scale(1.14); }
  .product-card .float-btn.view-btn { top:50px; }
  .add-to-bag {
    width:100%; padding:9px 0; border-radius:8px;
    background:#05090f; color:#fff;
    font-family:'Outfit',sans-serif; font-weight:800; font-size:10px;
    letter-spacing:.1em; text-transform:uppercase;
    border:none; cursor:pointer;
    transition:background .2s ease;
    display:flex; align-items:center; justify-content:center; gap:6px;
  }
  .add-to-bag:hover { background:#1847d4; }

  /* ─ Ticker ─ */
  .ticker-track { display:flex; width:max-content; animation:marquee 30s linear infinite; }
  .ticker-track:hover { animation-play-state:paused; }

  /* ─ Buttons ─ */
  .btn-primary {
    display:inline-flex; align-items:center; gap:8px;
    padding:14px 30px; border-radius:999px;
    background:var(--blue); color:#fff;
    font-family:'Outfit',sans-serif; font-weight:800; font-size:11px;
    letter-spacing:.08em; text-transform:uppercase;
    border:none; cursor:pointer; text-decoration:none;
    box-shadow:0 8px 28px -6px rgba(24,71,212,.58);
    transition:transform .22s ease, box-shadow .22s ease, background .22s ease;
    position:relative; overflow:hidden;
  }
  .btn-primary::before {
    content:''; position:absolute; inset:0;
    background:linear-gradient(135deg, rgba(255,255,255,.18) 0%, transparent 60%);
    opacity:0; transition:opacity .22s ease;
  }
  .btn-primary:hover { transform:translateY(-2px); background:#1440c4; box-shadow:0 14px 36px -6px rgba(24,71,212,.68); }
  .btn-primary:hover::before { opacity:1; }

  .btn-ghost-dark {
    display:inline-flex; align-items:center; gap:8px;
    padding:13px 26px; border-radius:999px;
    background:transparent; color:var(--ink);
    font-family:'Outfit',sans-serif; font-weight:800; font-size:11px;
    letter-spacing:.08em; text-transform:uppercase;
    border:1.5px solid rgba(5,9,15,.18); cursor:pointer; text-decoration:none;
    transition:transform .22s ease, background .22s ease, border-color .22s ease;
  }
  .btn-ghost-dark:hover { transform:translateY(-2px); background:rgba(5,9,15,.05); border-color:rgba(5,9,15,.32); }

  .btn-ghost-light {
    display:inline-flex; align-items:center; gap:8px;
    padding:13px 26px; border-radius:999px;
    background:rgba(255,255,255,.08); color:#fff;
    font-family:'Outfit',sans-serif; font-weight:800; font-size:11px;
    letter-spacing:.08em; text-transform:uppercase;
    border:1.5px solid rgba(255,255,255,.22); cursor:pointer; text-decoration:none;
    backdrop-filter:blur(14px);
    transition:transform .22s ease, background .22s ease, border-color .22s ease;
  }
  .btn-ghost-light:hover { transform:translateY(-2px); background:rgba(255,255,255,.16); border-color:rgba(255,255,255,.48); }

  /* ─ Eyebrow ─ */
  .eyebrow {
    display:inline-flex; align-items:center; gap:10px;
    font-family:'Outfit',sans-serif; font-size:10px; font-weight:800;
    letter-spacing:.26em; text-transform:uppercase;
  }
  .eyebrow::before {
    content:''; display:block; width:28px; height:2px; border-radius:2px; background:currentColor; opacity:.55;
  }

  /* ─ Clip paths ─ */
  .clip-diag-b  { clip-path:polygon(0 0,100% 0,100% 92%,0 100%); }
  .clip-diag-t  { clip-path:polygon(0 8%,100% 0,100% 100%,0 100%); }
  .clip-diag-tb { clip-path:polygon(0 5%,100% 0,100% 95%,0 100%); }

  /* ─ Stagger ─ */
  .s1{animation-delay:.06s} .s2{animation-delay:.14s} .s3{animation-delay:.24s} .s4{animation-delay:.34s} .s5{animation-delay:.44s}



  /* ─ News card ─ */
  .news-card {
    border-radius:var(--r-xl); overflow:hidden;
    border:1px solid rgba(5,9,15,.07);
    background:var(--white);
    transition:transform .35s cubic-bezier(.22,1,.36,1), box-shadow .35s ease, border-color .35s ease;
  }
  .news-card:hover {
    transform:translateY(-7px);
    box-shadow:0 22px 52px -13px rgba(5,9,15,.13);
    border-color:rgba(24,71,212,.24);
  }

  /* ─ Grid bgs ─ */
  .grid-bg {
    background-image:
      linear-gradient(rgba(5,9,15,.032) 1px, transparent 1px),
      linear-gradient(90deg, rgba(5,9,15,.032) 1px, transparent 1px);
    background-size:52px 52px;
  }
  .grid-bg-dark {
    background-image:
      linear-gradient(rgba(255,255,255,.022) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,.022) 1px, transparent 1px);
    background-size:52px 52px;
  }

  /* ─ Stats ─ */
  .stat-num {
    font-family:'Bebas Neue',sans-serif;
    font-size:clamp(2.8rem,7vw,5.2rem);
    line-height:1; letter-spacing:.03em;
  }

  /* ─ Player card ─ */
  .player-wrap {
    transition:transform .4s cubic-bezier(.22,1,.36,1), box-shadow .4s ease;
    border-radius:var(--r-xl); overflow:hidden;
  }
  .player-wrap:hover {
    transform:translateY(-10px);
    box-shadow:0 36px 80px -18px rgba(0,0,0,.62);
  }

  /* ─ Social pill ─ */
  .social-pill {
    transition:transform .28s ease, background .28s ease, border-color .28s ease, color .28s ease;
  }
  .social-pill:hover {
    transform:translateY(-3px) scale(1.04);
    background:var(--white) !important; color:var(--ink) !important;
    border-color:var(--white) !important;
  }

  /* ─ Highlight card ─ */
  .hl-card { transition:transform .35s cubic-bezier(.22,1,.36,1), box-shadow .35s ease; border-radius:var(--r-xl); overflow:hidden; }
  .hl-card:hover {
    transform:translateY(-8px);
    box-shadow:0 30px 64px -16px rgba(0,0,0,.58), 0 0 0 1px rgba(96,165,250,.28);
  }
  .play-overlay { opacity:0; transition:opacity .3s ease; }
  .hl-card:hover .play-overlay { opacity:1; }

  /* ─ Prod badge ─ */
  .prod-badge {
    position:absolute; top:10px; left:10px;
    padding:4px 9px; border-radius:5px;
    font-family:'Outfit',sans-serif; font-weight:900; font-size:9px;
    letter-spacing:.1em; text-transform:uppercase; z-index:3;
    animation:badgePop .38s cubic-bezier(.22,1,.36,1) both;
  }

  /* ─ Activity card ─ */
  .activity-card {
    border-radius:var(--r-xl); overflow:hidden;
    background:#0f1a2e; border:1px solid rgba(255,255,255,.06);
    cursor:pointer;
    transition:transform .35s cubic-bezier(.22,1,.36,1), box-shadow .35s ease, border-color .35s ease;
    text-decoration:none; display:block;
  }
  .activity-card:hover {
    transform:translateY(-7px);
    box-shadow:0 22px 50px -12px rgba(0,0,0,.52), 0 0 0 1px rgba(96,165,250,.22);
    border-color:rgba(96,165,250,.24);
  }
  .activity-arrow { transition:transform .25s ease; display:inline-flex; }
  .activity-card:hover .activity-arrow { transform:translate(3px,-3px); }

  /* ─ Founder card ─ */
  .founder-card {
    transition:transform .35s cubic-bezier(.22,1,.36,1), box-shadow .35s ease;
    border-radius:var(--r-xl); overflow:hidden; cursor:default;
  }
  .founder-card:hover { transform:translateY(-7px); box-shadow:0 24px 52px -13px rgba(5,9,15,.14); }

  /* ─ Noise ─ */
  .noise::after {
    content:''; position:absolute; inset:0; pointer-events:none; z-index:1; opacity:.028;
    background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    background-size:200px 200px;
  }

  /* ─ Cat pills ─ */
  .cat-pill {
    display:inline-flex; align-items:center; gap:5px;
    padding:7px 18px; border-radius:999px;
    font-family:'Outfit',sans-serif; font-weight:700; font-size:11px;
    letter-spacing:.04em; text-transform:uppercase;
    cursor:pointer; text-decoration:none;
    transition:transform .22s ease, background .22s ease, color .22s ease, box-shadow .22s ease;
  }
  .cat-pill:hover { transform:translateY(-2px); box-shadow:0 6px 18px -4px rgba(24,71,212,.32); }

  /* ─ Stats bar card ─ */
  .stat-card {
    position:relative; overflow:hidden;
    transition:transform .32s cubic-bezier(.22,1,.36,1), box-shadow .32s ease;
  }
  .stat-card:hover { transform:translateY(-4px); box-shadow:0 18px 40px -10px rgba(5,9,15,.12); }
  .stat-card::before {
    content:''; position:absolute; bottom:0; left:0; right:0; height:3px;
    background:linear-gradient(90deg, var(--blue) 0%, var(--blue-glow) 100%);
    transform:scaleX(0); transform-origin:left;
    transition:transform .35s cubic-bezier(.22,1,.36,1);
  }
  .stat-card:hover::before { transform:scaleX(1); }

  /* ─ Shimmer skeleton ─ */
  .shimmer {
    background:linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%);
    background-size:200% 100%; animation:shimmer 1.5s infinite;
  }

  /* ─ Spin badge ─ */
  .spin-badge { animation:spinSlow 14s linear infinite; }

  /* ─ Scroll indicator ─ */
  @keyframes scrollBounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(6px)} }
  .scroll-indicator { animation:scrollBounce 1.8s ease-in-out infinite; }

  /* ─ Gradient text ─ */
  .gradient-text {
    background:linear-gradient(135deg, var(--blue-glow) 0%, #a78bfa 100%);
    -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
  }
`;

/* ─── Reveal Hook ─── */
function useReveal() {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { el.classList.add("visible"); obs.disconnect(); } },
      { threshold: 0.04 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

const Reveal = ({ children, className = "", style = {} }: {
  children: React.ReactNode; className?: string; style?: React.CSSProperties;
}) => {
  const ref = useReveal() as React.RefObject<HTMLElement>;
  return <section ref={ref} className={`section-reveal ${className}`} style={style}>{children}</section>;
};

/* ─── Stars ─── */
const Stars = ({ rating = 4.5 }: { rating?: number }) => (
  <div style={{ display: "flex", gap: "2px" }}>
    {[1,2,3,4,5].map(n => (
      <Star key={n} size={10}
        fill={n <= Math.floor(rating) ? "#f59e0b" : n - 0.5 <= rating ? "#fcd34d" : "none"}
        color={n <= rating ? "#f59e0b" : "#d1d5db"} strokeWidth={1.5} />
    ))}
  </div>
);

/* ─── Skeleton Card ─── */
const SkeletonCard = () => (
  <div style={{ borderRadius: 18, overflow: "hidden", background: "#fff", border: "1px solid rgba(5,9,15,.06)" }}>
    <div className="shimmer" style={{ height: 220 }} />
    <div style={{ padding: "14px" }}>
      <div className="shimmer" style={{ height: 10, borderRadius: 6, marginBottom: 8, width: "60%" }} />
      <div className="shimmer" style={{ height: 14, borderRadius: 6, marginBottom: 6 }} />
      <div className="shimmer" style={{ height: 14, borderRadius: 6, width: "80%" }} />
    </div>
  </div>
);

/* ─── Stat Counter ─── */
const StatCounter = ({ value, suffix = "", prefix = "" }: { value: number; suffix?: string; prefix?: string }) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true;
        const duration = 1600;
        const start = performance.now();
        const step = (now: number) => {
          const p = Math.min((now - start) / duration, 1);
          const ease = 1 - Math.pow(1 - p, 3);
          setCount(Math.round(ease * value));
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
        obs.disconnect();
      }
    }, { threshold: 0.5 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [value]);
  return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>;
};

/* ═══════════════════════════════════════ HOMEPAGE ═══════════════════════════ */
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
  const [activeCategory, setActiveCategory] = useState("All");

  const toggleWishlist = useCallback((id: string) => {
    setWishlist(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  useEffect(() => {
    const id = "rk-v5-styles";
    if (!document.getElementById(id)) {
      const style = document.createElement("style");
      style.id = id; style.textContent = GLOBAL_STYLES;
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
 {/* ════════════ stats════════════ */}
  const STATS = [
      ];

  const CATEGORIES = ["All", "Jerseys", "Shorts", "Accessories", "Footwear"];

  return (
    <div style={{ fontFamily: "'Outfit',sans-serif", background: "#05090f", overflowX: "hidden" }}>

      {/* ════════════ HERO ════════════ */}
      <section className="relative flex items-center justify-center overflow-hidden noise" style={{ minHeight: "100svh" }}>
        <img src={heroBanner} alt="RaidKhalid & Co." className="hero-img absolute inset-0 w-full h-full object-cover"
          style={{ transformOrigin: "65% center" }} />

        {/* Multi-layer gradient overlay */}
        <div className="absolute inset-0" style={{
          background: "linear-gradient(115deg, rgba(5,9,15,.96) 0%, rgba(5,9,15,.84) 36%, rgba(5,9,15,.42) 65%, transparent 85%), linear-gradient(to top, rgba(5,9,15,.98) 0%, rgba(5,9,15,.35) 40%, transparent 60%)"
        }} />
        <div className="absolute inset-0 grid-bg-dark" style={{ zIndex: 1 }} />

        {/* Blue accent line */}
        <div className="absolute left-0 top-0 bottom-0" style={{
          width: "3px", zIndex: 2,
          background: "linear-gradient(to bottom, transparent 0%, #1847d4 18%, #3b82f6 50%, #1847d4 82%, transparent 100%)",
        }} />

        {/* Ambient glow */}
        <div className="absolute" style={{
          top: "20%", left: "35%", width: "500px", height: "500px", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(24,71,212,.12) 0%, transparent 70%)",
          zIndex: 1, pointerEvents: "none",
        }} />

        {/* Spin badge */}
        <div className="absolute" style={{ top: "7%", right: "4%", zIndex: 3, opacity: .32 }}>
          <svg className="spin-badge" width="116" height="116" viewBox="0 0 120 120">
            <path id="circ2" fill="none" d="M60,14 a46,46 0 1,1 -0.01,0" />
            <text style={{ fill: "#60a5fa", fontSize: 10.5, fontWeight: 700, letterSpacing: 3.2, fontFamily: "'Outfit',sans-serif" }}>
              <textPath href="#circ2">OFFICIAL BASKETBALL BRAND · EST. 2024 · </textPath>
            </text>
          </svg>
          <div style={{
            position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
            width: 34, height: 34, borderRadius: "50%",
            background: "linear-gradient(135deg, #1847d4, #60a5fa)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 0 6px rgba(24,71,212,.18)",
          }}>
            <Trophy size={15} color="#fff" />
          </div>
        </div>

        {/* Hero content */}
        <div className="relative container mx-auto px-6" style={{ zIndex: 4 }}>
          <div style={{ maxWidth: "620px" }}>
            <p className="eyebrow animate-fade-in s1" style={{ color: "#60a5fa", marginBottom: "22px" }}>
              Official Basketball Brand · Philippines
            </p>
            <h1 className="animate-fade-up s2" style={{
              fontFamily: "'Bebas Neue',sans-serif",
              fontSize: "clamp(4.2rem,13vw,9rem)",
              lineHeight: .86, letterSpacing: ".015em",
              color: "#fff", marginBottom: "2px",
            }}>RaidKhalid</h1>
            <h1 className="animate-fade-up s3" style={{
              fontFamily: "'Bebas Neue',sans-serif",
              fontSize: "clamp(4.2rem,13vw,9rem)",
              lineHeight: .86, letterSpacing: ".015em",
              color: "#1847d4", marginBottom: "30px",
              textShadow: "0 0 60px rgba(24,71,212,.35)",
            }}>&amp; Co.</h1>

            <p className="animate-fade-up s3" style={{
              fontSize: "clamp(.95rem,1.7vw,1.08rem)",
              color: "rgba(255,255,255,.52)",
              lineHeight: 1.85, maxWidth: "420px",
              marginBottom: "38px",
              borderLeft: "2px solid #1847d4",
              paddingLeft: "20px",
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

            {/* Quick stats inline */}
            <div className="animate-fade-up s5" style={{
              display: "flex", gap: "28px", marginTop: "44px",
              paddingTop: "28px", borderTop: "1px solid rgba(255,255,255,.08)",
            }}>
             
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          style={{ zIndex: 4, opacity: 0, animation: "fadeIn .6s ease 1.6s both" }}>
          <span style={{ fontSize: "8px", letterSpacing: ".24em", color: "rgba(255,255,255,.22)", textTransform: "uppercase" }}>Scroll</span>
          <div className="scroll-indicator" style={{
            width: 28, height: 44, borderRadius: 14,
            border: "1.5px solid rgba(255,255,255,.18)",
            display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "8px 0",
          }}>
            <div style={{ width: 4, height: 8, borderRadius: 2, background: "rgba(96,165,250,.7)" }} />
          </div>
        </div>
      </section>

      {/* ════════════ TICKER ════════════ */}
     {/* ════════════ TICKER ════════════ */}
<div style={{
  background: "linear-gradient(90deg, #1440c4 0%, #1847d4 50%, #1440c4 100%)",
  overflow: "hidden", padding: "14px 0",
  borderTop: "1px solid rgba(255,255,255,.1)",
  borderBottom: "1px solid rgba(255,255,255,.08)",
}}>
  <div className="ticker-track">
    {Array.from({ length: 2 }).flatMap((_, outerIndex) =>
      ["RAIDKHALID & CO.", "OFFICIAL BASKETBALL BRAND", "ELEVATE THE GAME", "SHOP NOW", "GET TICKETS", "WATCH HIGHLIGHTS", "NEW COLLECTION"].map((t, i) => (
        <span key={`${outerIndex}-${t}-${i}`} style={{
          fontFamily: "'Bebas Neue',sans-serif",
          fontSize: "13px", letterSpacing: ".2em",
          color: "rgba(255,255,255,.82)", whiteSpace: "nowrap",
          padding: "0 34px",
        }}>
          {t} <span style={{ color: "rgba(255,255,255,.24)" }}>◆</span>
        </span>
      ))
    )}
  </div>
</div>

      {/* ════════════ STATS BAR ════════════ */}
      <Reveal style={{ background: "#fff", borderBottom: "1px solid rgba(5,9,15,.06)" }}>
        <div className="container mx-auto px-6 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {STATS.map((s, i) => (
              <div key={s.label} className={`stat-card rounded-2xl p-6 animate-fade-up s${i + 1}`}
                style={{ background: "#f9f9fb", border: "1px solid rgba(5,9,15,.06)" }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10, marginBottom: 16,
                  background: `${s.color}18`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <s.icon size={18} color={s.color} />
                </div>
                <div className="stat-num" style={{ color: "#05090f" }}>
                  <StatCounter value={s.value} suffix={s.suffix} />
                </div>
                <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: ".1em", color: "rgba(5,9,15,.4)", textTransform: "uppercase", marginTop: "6px" }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      {/* ════════════ LATEST NEWS ════════════ */}
      {news.length > 0 && (
        <Reveal style={{ background: "var(--cream)", position: "relative", overflow: "hidden" }}>
          <div className="grid-bg" style={{ position: "absolute", inset: 0 }} />
          <div className="container mx-auto px-6 relative" style={{ zIndex: 1, paddingTop: "80px", paddingBottom: "80px" }}>
            <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-14 gap-4">
              <div>
                <p className="eyebrow animate-fade-up s1" style={{ color: "#1847d4", marginBottom: "14px" }}>Latest Updates</p>
                <h2 style={{
                  fontFamily: "'Bebas Neue',sans-serif",
                  fontSize: "clamp(2.6rem,6vw,4.6rem)", lineHeight: .88,
                  color: "#05090f", letterSpacing: ".02em",
                }}>Latest News</h2>
              </div>
              <Link to="/news" className="btn-ghost-dark">All Articles <ArrowUpRight size={13} /></Link>
            </div>

            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
              {news.map((item: any, i: number) => (
                <div key={item.id} className={`news-card animate-fade-up s${i + 1} group`} style={{ cursor: "pointer" }}>
                  {item.image_url && (
                    <div style={{ height: "196px", overflow: "hidden" }}>
                      <img src={item.image_url} alt={item.title}
                        className="w-full h-full object-cover img-zoom" loading="lazy" />
                    </div>
                  )}
                  <div style={{ height: "3px", background: "linear-gradient(90deg, #1847d4 0%, #60a5fa 50%, #1847d4 100%)" }} />
                  <div style={{ padding: "22px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                      <p style={{ fontSize: "10px", color: "#1847d4", fontWeight: 800, letterSpacing: ".14em", textTransform: "uppercase" }}>
                        {new Date(item.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                      <span style={{
                        padding: "3px 9px", borderRadius: "5px",
                        background: "rgba(24,71,212,.08)", color: "#1847d4",
                        fontSize: "9px", fontWeight: 800, letterSpacing: ".12em", textTransform: "uppercase",
                      }}>News</span>
                    </div>
                    <h3 style={{
                      fontFamily: "'Bebas Neue',sans-serif",
                      fontSize: "1.4rem", letterSpacing: ".03em",
                      color: "#05090f", lineHeight: 1.08, marginBottom: "10px",
                    }}>{item.title}</h3>
                    <p className="line-clamp-2" style={{ color: "rgba(5,9,15,.45)", fontSize: "13px", lineHeight: 1.7 }}>{item.excerpt}</p>
                    <div style={{
                      marginTop: "16px", paddingTop: "14px",
                      borderTop: "1px solid rgba(5,9,15,.06)",
                      display: "flex", alignItems: "center", gap: "5px",
                      color: "#1847d4", fontSize: "11px", fontWeight: 800, letterSpacing: ".07em", textTransform: "uppercase",
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

      {/* ════════════ HIGHLIGHTS ════════════ */}
      {highlights.length > 0 && (
        <Reveal className="clip-diag-tb grid-bg-dark" style={{ background: "#0a1322", paddingTop: "108px", paddingBottom: "108px" }}>
          <div className="container mx-auto px-6">
            <div className="text-center mb-14">
              <p className="eyebrow animate-fade-up s1" style={{ color: "#60a5fa", justifyContent: "center", marginBottom: "14px" }}>Watch & Replay</p>
              <h2 style={{
                fontFamily: "'Bebas Neue',sans-serif",
                fontSize: "clamp(2.6rem,6vw,4.6rem)", letterSpacing: ".02em",
                color: "#fff", lineHeight: .88,
              }}>Player Highlights</h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {highlights.map((h: any, i: number) => (
                <div key={h.id} className={`hl-card group animate-fade-up s${(i % 3) + 1}`}
                  style={{ background: "#111827", border: "1px solid rgba(255,255,255,.05)" }}>
                  <div className="relative overflow-hidden" style={{ height: "210px" }}>
                    {h.image_url && <img src={h.image_url} alt={h.title} className="w-full h-full object-cover img-zoom" loading="lazy" />}
                    <div className="play-overlay absolute inset-0 flex items-center justify-center"
                      style={{ background: "radial-gradient(circle, rgba(5,9,15,.55) 0%, rgba(5,9,15,.12) 100%)" }}>
                      {h.link_url && (
                        <a href={h.link_url} target="_blank" rel="noopener noreferrer"
                          style={{
                            width: 60, height: 60, borderRadius: "50%",
                            background: "#1847d4",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            animation: "pulseRing 2.5s ease-in-out infinite",
                            textDecoration: "none",
                          }}>
                          <Play size={22} color="#fff" style={{ marginLeft: 3 }} />
                        </a>
                      )}
                    </div>
                    <div className="prod-badge" style={{ background: "#1847d4", color: "#fff" }}>Highlight</div>
                    <div style={{
                      position: "absolute", bottom: 10, right: 10, zIndex: 3,
                      background: "rgba(5,9,15,.68)", backdropFilter: "blur(8px)",
                      borderRadius: "5px", padding: "3px 8px",
                      fontSize: "10px", fontWeight: 800, color: "rgba(255,255,255,.85)",
                    }}>#{i + 1}</div>
                  </div>
                  <div style={{ padding: "18px" }}>
                    <h3 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "1.25rem", color: "#fff", letterSpacing: ".03em", marginBottom: "7px" }}>{h.title}</h3>
                    {h.description && <p className="line-clamp-2" style={{ color: "rgba(255,255,255,.36)", fontSize: "12.5px", lineHeight: 1.65, marginBottom: "13px" }}>{h.description}</p>}
                    {h.link_url && (
                      <a href={h.link_url} target="_blank" rel="noopener noreferrer"
                        style={{
                          display: "inline-flex", alignItems: "center", gap: "6px",
                          color: "#60a5fa", fontSize: "11px", fontWeight: 800,
                          letterSpacing: ".08em", textTransform: "uppercase", textDecoration: "none",
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

      {/* ════════════ PLAYERS ════════════ */}
      {players.length > 0 && (
        <Reveal style={{ background: "var(--cream)", position: "relative", overflow: "hidden" }}>
          <div className="grid-bg" style={{ position: "absolute", inset: 0 }} />
          <div style={{
            position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
            fontFamily: "'Bebas Neue',sans-serif",
            fontSize: "clamp(8rem,22vw,20rem)",
            color: "rgba(5,9,15,.028)", whiteSpace: "nowrap", letterSpacing: ".05em",
            pointerEvents: "none", userSelect: "none", zIndex: 0,
          }}>ROSTER</div>
          <div className="container mx-auto px-6 relative" style={{ zIndex: 1, paddingTop: "88px", paddingBottom: "88px" }}>
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-14 gap-4">
              <div>
                <p className="eyebrow animate-fade-up s1" style={{ color: "#1847d4", marginBottom: "14px" }}>The Roster</p>
                <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(2.6rem,6vw,4.6rem)", lineHeight: .88, color: "#05090f", letterSpacing: ".02em" }}>
                  Top Players
                </h2>
              </div>
              <Link to="/players" className="btn-primary">View All <ChevronRight size={14} /></Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {players.map((player: any, i: number) => (
                <Link key={player.id} to="/players" style={{ textDecoration: "none" }}>
                  <div className={`player-wrap animate-fade-up s${i + 1}`} style={{ background: "#05090f", position: "relative" }}>
                    <div style={{
                      position: "absolute", top: 10, right: 16, zIndex: 2,
                      fontFamily: "'Bebas Neue',sans-serif",
                      fontSize: "5rem", lineHeight: 1, color: "rgba(255,255,255,.04)", pointerEvents: "none",
                    }}>{player.jersey_number || "00"}</div>
                    {player.image_url ? (
                      <div className="group overflow-hidden" style={{ height: "clamp(190px,23vw,252px)" }}>
                        <img src={player.image_url} alt={player.name} className="w-full h-full object-contain img-zoom" loading="lazy" />
                      </div>
                    ) : (
                      <div style={{ height: "clamp(190px,23vw,252px)", background: "#0f1a2e", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "6rem", color: "rgba(96,165,250,.08)" }}>
                          #{player.jersey_number}
                        </span>
                      </div>
                    )}
                    <div style={{
                      padding: "12px 16px 16px",
                      background: "linear-gradient(to bottom, #0d1527, #05090f)",
                      borderTop: "2px solid rgba(24,71,212,.32)",
                    }}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                        <div>
                          <p style={{ fontSize: "8px", color: "#60a5fa", fontWeight: 800, letterSpacing: ".14em", textTransform: "uppercase", marginBottom: "4px" }}>
                            {player.jersey_number && `#${player.jersey_number}`}{player.position && ` · ${player.position}`}
                          </p>
                          <h3 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "1.3rem", color: "#fff", letterSpacing: ".03em", lineHeight: 1 }}>{player.name}</h3>
                        </div>
                        <div style={{
                          width: 26, height: 26, borderRadius: "50%",
                          background: "linear-gradient(135deg, #1847d4, #3b82f6)",
                          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                        }}>
                          <ArrowUpRight size={12} color="#fff" />
                        </div>
                      </div>
                      {player.stats && (
                        <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                          {["ppg","rpg","apg"].map((key, ki) => (player.stats as any)[key] ? (
                            <div key={key} style={{ display: "flex", alignItems: "center", gap: ki > 0 ? "10px" : 0 }}>
                              {ki > 0 && <div style={{ width: 1, height: 24, background: "rgba(255,255,255,.07)" }} />}
                              <div style={{ textAlign: "center" }}>
                                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "1.1rem", color: "#fff", lineHeight: 1 }}>{(player.stats as any)[key]}</div>
                                <div style={{ fontSize: "7px", fontWeight: 800, letterSpacing: ".12em", color: "rgba(255,255,255,.3)", textTransform: "uppercase" }}>{key.toUpperCase()}</div>
                              </div>
                            </div>
                          ) : null)}
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

      {/* ════════════ FOUNDERS ════════════ */}
      {founders.length > 0 && (
        <Reveal style={{ background: "#fff" }}>
          <div className="container mx-auto px-6" style={{ paddingTop: "88px", paddingBottom: "88px" }}>
            <div className="text-center mb-16">
              <p className="eyebrow animate-fade-up s1" style={{ color: "#1847d4", justifyContent: "center", marginBottom: "14px" }}>The Visionaries</p>
              <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(2.6rem,6vw,4.6rem)", lineHeight: .88, color: "#05090f", letterSpacing: ".02em" }}>
                Our Founders
              </h2>
              <div style={{ width: "52px", height: "3px", background: "linear-gradient(90deg, #1847d4, #60a5fa)", borderRadius: "2px", margin: "18px auto 0" }} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-7 max-w-4xl mx-auto">
              {founders.map((founder: any, i: number) => (
                <div key={founder.id} className={`founder-card animate-fade-up s${i + 1}`}
                  style={{ background: "var(--cream)", border: "1px solid rgba(5,9,15,.07)" }}>
                  <div style={{ position: "relative", height: "200px", background: "linear-gradient(135deg, #0d1527, #1847d4)", overflow: "hidden" }}>
                    {founder.image_url ? (
                      <img src={founder.image_url} alt={founder.name}
                        className="w-full h-full object-cover" loading="lazy"
                        style={{ objectPosition: "center top" }} />
                    ) : (
                      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "5rem", color: "rgba(255,255,255,.18)" }}>{founder.name?.charAt(0)}</span>
                      </div>
                    )}
                    {/* Gradient overlay */}
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(5,9,15,.5) 0%, transparent 60%)" }} />
                    <div style={{
                      position: "absolute", bottom: 12, right: 12,
                      display: "flex", alignItems: "center", gap: "5px",
                      background: "rgba(5,9,15,.62)", backdropFilter: "blur(10px)",
                      borderRadius: "999px", padding: "4px 10px",
                      border: "1px solid rgba(255,255,255,.1)",
                    }}>
                      <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e" }} />
                      <span style={{ fontSize: "9px", fontWeight: 700, color: "#fff", letterSpacing: ".06em" }}>Active</span>
                    </div>
                  </div>
                  <div style={{ padding: "20px 22px 24px" }}>
                    <h3 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "1.55rem", color: "#05090f", letterSpacing: ".04em", marginBottom: "4px" }}>{founder.name}</h3>
                    <p style={{ fontSize: "9px", fontWeight: 800, letterSpacing: ".18em", color: "#1847d4", textTransform: "uppercase", marginBottom: "12px" }}>{founder.role}</p>
                    <p className="line-clamp-3" style={{ color: "rgba(5,9,15,.48)", fontSize: "13px", lineHeight: 1.75 }}>{founder.bio}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center mt-14">
              <Link to="/founders" className="btn-ghost-dark">Meet All Founders <ChevronRight size={14} /></Link>
            </div>
          </div>
        </Reveal>
      )}

      {/* ════════════ ACTIVITIES ════════════ */}
      {activities.length > 0 && (
        <Reveal className="clip-diag-b grid-bg-dark" style={{ background: "#0a1322", paddingTop: "108px", paddingBottom: "128px" }}>
          <div className="container mx-auto px-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-14 gap-4">
              <div>
                <p className="eyebrow animate-fade-up s1" style={{ color: "#60a5fa", marginBottom: "14px" }}>Mark Your Calendar</p>
                <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(2.6rem,6vw,4.6rem)", lineHeight: .88, color: "#fff", letterSpacing: ".02em" }}>
                  Upcoming Events
                </h2>
              </div>
              <Link to="/activities" className="btn-ghost-light">View All <ChevronRight size={14} /></Link>
            </div>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
              {activities.map((act: any, i: number) => (
                <Link key={act.id} to="/activities" className={`activity-card animate-fade-up s${(i % 3) + 1}`}>
                  {act.image_url && (
                    <div className="group overflow-hidden" style={{ height: "118px" }}>
                      <img src={act.image_url} alt={act.title} className="w-full h-full object-cover img-zoom" loading="lazy" />
                    </div>
                  )}
                  <div style={{ height: "2px", background: "linear-gradient(90deg, #1847d4, #60a5fa)" }} />
                  <div style={{ padding: "16px 18px 18px" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "10px" }}>
                      <h3 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "1.15rem", letterSpacing: ".03em", color: "#fff", lineHeight: 1.1, flex: 1, paddingRight: "8px" }}>{act.title}</h3>
                      <span className="activity-arrow" style={{ color: "#60a5fa", flexShrink: 0, marginTop: "1px" }}>
                        <ArrowUpRight size={14} />
                      </span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "10px" }}>
                      {act.event_date && (
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <div style={{
                            width: 22, height: 22, borderRadius: "6px",
                            background: "rgba(24,71,212,.18)", border: "1px solid rgba(24,71,212,.28)",
                            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                          }}>
                            <Calendar size={11} color="#60a5fa" />
                          </div>
                          <span style={{ fontSize: "11.5px", color: "#93c5fd", fontWeight: 600 }}>
                            {new Date(act.event_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </span>
                        </div>
                      )}
                      {act.location && (
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <div style={{
                            width: 22, height: 22, borderRadius: "6px",
                            background: "rgba(96,165,250,.08)",
                            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                          }}>
                            <MapPin size={11} color="#60a5fa" />
                          </div>
                          <span style={{ fontSize: "11.5px", color: "rgba(255,255,255,.4)", fontWeight: 500 }}>{act.location}</span>
                        </div>
                      )}
                    </div>
                    {act.description && (
                      <p className="line-clamp-1" style={{ color: "rgba(255,255,255,.28)", fontSize: "11.5px", lineHeight: 1.55 }}>{act.description}</p>
                    )}
                    <div style={{
                      marginTop: "12px", paddingTop: "10px",
                      borderTop: "1px solid rgba(255,255,255,.05)",
                      display: "flex", alignItems: "center", gap: "5px",
                      color: "#60a5fa", fontSize: "10px", fontWeight: 800, letterSpacing: ".07em", textTransform: "uppercase",
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

      {/* ════════════ SHOP ════════════ */}
      {(featuredProducts.length > 0 || loading) && (
        <Reveal style={{ background: "#f5f5f7", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: "-8%", right: "-4%", width: "480px", height: "480px", borderRadius: "50%", pointerEvents: "none",
            background: "radial-gradient(circle, rgba(24,71,212,.055) 0%, transparent 68%)" }} />
          <div className="container mx-auto px-6 relative" style={{ zIndex: 1, paddingTop: "80px", paddingBottom: "80px" }}>
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
              <div>
                <p className="eyebrow animate-fade-up s1" style={{ color: "#1847d4", marginBottom: "14px" }}>Official Merch</p>
                <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(2.6rem,6vw,4.6rem)", lineHeight: .88, color: "#05090f", letterSpacing: ".02em" }}>
                  Shop Collection
                </h2>
              </div>
              <Link to="/shop" className="btn-primary">Visit Full Shop <ArrowUpRight size={14} /></Link>
            </div>

            {/* Category pills */}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "24px" }}>
              {CATEGORIES.map((cat) => (
                <button key={cat} className="cat-pill" onClick={() => setActiveCategory(cat)} style={{
                  background: activeCategory === cat ? "#1847d4" : "#fff",
                  color: activeCategory === cat ? "#fff" : "#05090f",
                  border: activeCategory === cat ? "1.5px solid #1847d4" : "1.5px solid rgba(5,9,15,.1)",
                }}>{cat}</button>
              ))}
            </div>

            {/* Product grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(185px, 1fr))", gap: "14px" }}>
              {loading
                ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
                : featuredProducts.map((product: any, i: number) => (
                  <Link key={product.id} to="/shop" style={{ textDecoration: "none" }}>
                    <div className={`product-card animate-fade-up s${(i % 4) + 1}`}>
                      <div className="product-img-wrap" style={{ height: "clamp(210px,22vw,270px)" }}>
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.name} loading="lazy" />
                        ) : (
                          <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, #e8f0fe, #f1f5f9)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <ShoppingCart size={30} style={{ color: "rgba(5,9,15,.1)" }} />
                          </div>
                        )}
                        <div className="product-overlay" />
                        <button className="float-btn" onClick={(e) => { e.preventDefault(); toggleWishlist(product.id); }}>
                          <Heart size={13}
                            fill={wishlist.has(product.id) ? "#ef4444" : "none"}
                            color={wishlist.has(product.id) ? "#ef4444" : "#05090f"}
                            strokeWidth={1.8} />
                        </button>
                        <button className="float-btn view-btn" onClick={(e) => { e.preventDefault(); }}>
                          <Eye size={12} color="#05090f" strokeWidth={1.8} />
                        </button>
                        {product.badge && (
                          <div className="prod-badge" style={{
                            background: product.badge === "hot" ? "#ef4444" : product.badge === "new" ? "#1847d4" : "#f59e0b",
                            color: "#fff",
                          }}>
                            {product.badge === "hot" ? "HOT" : product.badge === "new" ? "NEW" : "TOP"}
                          </div>
                        )}
                        {product.sold_count > 50 && (
                          <div style={{
                            position: "absolute", bottom: 10, left: 10, zIndex: 3,
                            background: "rgba(5,9,15,.74)", backdropFilter: "blur(6px)",
                            borderRadius: "5px", padding: "3px 8px",
                            fontSize: "9px", fontWeight: 800, color: "rgba(255,255,255,.85)",
                          }}>🔥 {product.sold_count}+ sold</div>
                        )}
                        <div className="product-actions">
                          <button className="add-to-bag" onClick={(e) => e.preventDefault()}>
                            <ShoppingCart size={11} /> Add to Bag
                          </button>
                        </div>
                      </div>
                      <div style={{ padding: "13px 15px 16px" }}>
                        <p style={{ fontSize: "9px", fontWeight: 800, letterSpacing: ".15em", color: "#1847d4", textTransform: "uppercase", marginBottom: "5px" }}>RaidKhalid</p>
                        <h3 className="line-clamp-2" style={{ fontFamily: "'Outfit',sans-serif", fontSize: "13px", fontWeight: 600, color: "#05090f", lineHeight: 1.38, marginBottom: "8px", minHeight: "2.76em" }}>
                          {product.name}
                        </h3>
                        <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "9px" }}>
                          <Stars rating={product.rating || 4.5} />
                          <span style={{ fontSize: "10px", color: "rgba(5,9,15,.36)", fontWeight: 500 }}>
                            ({product.review_count || Math.floor(Math.random() * 80 + 10)})
                          </span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "7px", flexWrap: "wrap" }}>
                          <span style={{ fontWeight: 800, color: "#05090f", fontSize: "14.5px" }}>
                            ₱{Number(product.price).toLocaleString()}
                          </span>
                          {product.original_price && Number(product.original_price) > Number(product.price) && (
                            <>
                              <span style={{ fontSize: "11px", color: "rgba(5,9,15,.3)", textDecoration: "line-through", fontWeight: 500 }}>
                                ₱{Number(product.original_price).toLocaleString()}
                              </span>
                              <span style={{ fontSize: "9px", fontWeight: 900, color: "#fff", background: "#ef4444", padding: "2px 6px", borderRadius: "4px" }}>
                                -{Math.round((1 - product.price / product.original_price) * 100)}%
                              </span>
                            </>
                          )}
                        </div>
                        {Number(product.price) >= 500 && (
                          <div style={{ marginTop: "7px", display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "9px", fontWeight: 800, color: "#16a34a" }}>
                            ✓ Free Shipping
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                ))
              }
            </div>
            <div style={{ textAlign: "center", marginTop: "36px" }}>
              <Link to="/shop" className="btn-ghost-dark">Browse Full Collection <ChevronRight size={14} /></Link>
            </div>
          </div>
        </Reveal>
      )}

      {/* ════════════ SOCIAL CTA ════════════ */}
      {socialLinks.length > 0 && (
        <Reveal style={{ background: "#05090f", borderTop: "1px solid rgba(255,255,255,.04)" }}>
          <div className="container mx-auto px-6 text-center" style={{ paddingTop: "80px", paddingBottom: "80px" }}>
            <p className="eyebrow animate-fade-up s1" style={{ color: "#60a5fa", justifyContent: "center", marginBottom: "14px" }}>Stay Connected</p>
            <h2 style={{
              fontFamily: "'Bebas Neue',sans-serif",
              fontSize: "clamp(2.4rem,5.5vw,3.8rem)", letterSpacing: ".03em",
              color: "#fff", marginBottom: "36px", lineHeight: .92,
            }}>Follow Us</h2>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "10px" }}>
              {socialLinks.map((link: any) => (
                <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer"
                  className="social-pill"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "9px",
                    padding: "13px 24px", borderRadius: "999px",
                    background: "rgba(255,255,255,.06)",
                    border: "1px solid rgba(255,255,255,.12)",
                    color: "#f1f5f9", textDecoration: "none",
                    fontWeight: 800, fontSize: "12px", letterSpacing: ".06em", textTransform: "uppercase",
                  }}>
                  {getSocialIcon(link.platform)}
                  {link.platform}
                </a>
              ))}
            </div>
          </div>
        </Reveal>
      )}
    </div>
  );
};

export default HomePage;
