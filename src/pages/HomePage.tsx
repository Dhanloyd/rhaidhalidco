import { Link } from "react-router-dom";
import {
  ShoppingCart, Ticket, ChevronRight, Play, ExternalLink,
  ArrowUpRight, Star, Heart, Eye, Trophy, Calendar,
  MapPin, Users, Zap, Shield, Target, Flame,
} from "lucide-react";
import heroBanner from "@/assets/hero-banner.jpg";
import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

/* ─── Social Icons ─── */
const FacebookIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);
const InstagramIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
  </svg>
);
const XIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
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

/* ─── Styles ─── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800;900&family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,300&display=swap');

  :root {
    --void:#080A0F; --deep:#0C0F18; --surface:#111520; --panel:#161B28;
    --edge:rgba(255,255,255,0.06); --edge2:rgba(255,255,255,0.11);
    --blue:#2563EB; --blue-hi:#3B82F6; --blue-lo:#1D4ED8;
    --gold:#F0A500;
    --light:#F7F8FA; --white:#FFFFFF;
    --lt-border:rgba(10,15,30,0.07); --lt-text:#0C0F18; --lt-muted:rgba(10,15,30,0.46);
  }
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

  @keyframes heroIn   {from{opacity:0;transform:scale(1.05)} to{opacity:1;transform:scale(1)}}
  @keyframes fadeUp   {from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)}}
  @keyframes fadeIn   {from{opacity:0} to{opacity:1}}
  @keyframes ticker   {from{transform:translateX(0)} to{transform:translateX(-50%)}}
  @keyframes shimmer  {0%{background-position:-200% 0} 100%{background-position:200% 0}}
  @keyframes spin     {to{transform:rotate(360deg)}}
  @keyframes dot      {0%,100%{opacity:.3} 50%{opacity:.9}}
  @keyframes scrollY  {0%,100%{transform:translateY(0);opacity:1} 60%{transform:translateY(7px);opacity:.25}}
  @keyframes glow     {0%,100%{box-shadow:0 0 0 0 rgba(37,99,235,.5)} 50%{box-shadow:0 0 0 10px rgba(37,99,235,0)}}
  @keyframes lineIn   {from{transform:scaleX(0)} to{transform:scaleX(1)}}
  @keyframes slideR   {from{opacity:0;transform:translateX(-18px)} to{opacity:1;transform:translateX(0)}}
  @keyframes numberUp {from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)}}
  @keyframes barIn    {from{transform:scaleX(0)} to{transform:scaleX(1)}}
  @keyframes cardIn   {from{opacity:0;transform:translateY(30px) scale(.97)} to{opacity:1;transform:none}}
  @keyframes overlayIn{from{opacity:0} to{opacity:1}}
  @keyframes pulseRing{0%{box-shadow:0 0 0 0 rgba(37,99,235,.45)} 70%{box-shadow:0 0 0 14px rgba(37,99,235,0)} 100%{box-shadow:0 0 0 0 rgba(37,99,235,0)}}
  @keyframes floatY   {0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)}}
  @keyframes lineGrow {from{transform:scaleX(0)} to{transform:scaleX(1)}}

  .a-hero{animation:heroIn 1.2s cubic-bezier(.22,1,.36,1) both}
  .a-up  {animation:fadeUp .8s cubic-bezier(.22,1,.36,1) both}
  .a-in  {animation:fadeIn .6s ease both}
  .a-r   {animation:slideR .7s cubic-bezier(.22,1,.36,1) both}
  .d1{animation-delay:.08s}.d2{animation-delay:.18s}.d3{animation-delay:.3s}
  .d4{animation-delay:.42s}.d5{animation-delay:.54s}.d6{animation-delay:.66s}

  .reveal{opacity:0;transform:translateY(28px);transition:opacity .9s cubic-bezier(.22,1,.36,1),transform .9s cubic-bezier(.22,1,.36,1)}
  .reveal.in{opacity:1;transform:none}

  /* Typography */
  .disp{font-family:'Barlow Condensed',sans-serif;font-weight:800;line-height:.92;letter-spacing:-.01em}
  .label-tag{display:inline-flex;align-items:center;gap:7px;font-family:'Syne',sans-serif;font-size:10px;font-weight:700;letter-spacing:.22em;text-transform:uppercase}
  .label-dot{width:5px;height:5px;border-radius:50%;background:currentColor;flex-shrink:0;animation:dot 2.2s ease-in-out infinite}

  /* Ticker */
  .ticker-row{display:flex;width:max-content;animation:ticker 32s linear infinite}
  .ticker-row:hover{animation-play-state:paused}

  /* Buttons */
  .btn-blue{display:inline-flex;align-items:center;gap:8px;padding:13px 26px;border-radius:999px;background:var(--blue);color:#fff;font-family:'Syne',sans-serif;font-weight:700;font-size:11px;letter-spacing:.08em;text-transform:uppercase;border:none;cursor:pointer;text-decoration:none;box-shadow:0 8px 28px -8px rgba(37,99,235,.55);transition:transform .22s ease,box-shadow .22s ease,background .22s ease;position:relative;overflow:hidden}
  .btn-blue:hover{transform:translateY(-2px);background:var(--blue-lo);box-shadow:0 14px 36px -8px rgba(37,99,235,.65)}
  .btn-ol-dark{display:inline-flex;align-items:center;gap:8px;padding:12px 24px;border-radius:999px;background:transparent;color:var(--lt-text);font-family:'Syne',sans-serif;font-weight:700;font-size:11px;letter-spacing:.08em;text-transform:uppercase;border:1.5px solid rgba(10,15,30,.14);cursor:pointer;text-decoration:none;transition:transform .22s ease,background .22s ease,border-color .22s ease}
  .btn-ol-dark:hover{transform:translateY(-2px);background:rgba(10,15,30,.05);border-color:rgba(10,15,30,.3)}
  .btn-ol-light{display:inline-flex;align-items:center;gap:8px;padding:12px 24px;border-radius:999px;background:rgba(255,255,255,.07);color:#fff;font-family:'Syne',sans-serif;font-weight:700;font-size:11px;letter-spacing:.08em;text-transform:uppercase;border:1.5px solid rgba(255,255,255,.16);cursor:pointer;text-decoration:none;backdrop-filter:blur(12px);transition:transform .22s ease,background .22s ease}
  .btn-ol-light:hover{transform:translateY(-2px);background:rgba(255,255,255,.14)}

  /* Patterns */
  .dots{background-image:radial-gradient(circle,rgba(10,15,30,.055) 1px,transparent 1px);background-size:26px 26px}
  .dots-dk{background-image:radial-gradient(circle,rgba(255,255,255,.04) 1px,transparent 1px);background-size:26px 26px}
  .lines{background-image:linear-gradient(rgba(10,15,30,.038) 1px,transparent 1px),linear-gradient(90deg,rgba(10,15,30,.038) 1px,transparent 1px);background-size:42px 42px}
  .lines-dk{background-image:linear-gradient(rgba(255,255,255,.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.02) 1px,transparent 1px);background-size:48px 48px}

  /* Shimmer */
  .shimmer{background:linear-gradient(90deg,#f0f1f3 25%,#e8e9ec 50%,#f0f1f3 75%);background-size:200% 100%;animation:shimmer 1.5s infinite}
  .sk{background:linear-gradient(90deg,rgba(255,255,255,.04) 25%,rgba(255,255,255,.07) 50%,rgba(255,255,255,.04) 75%);background-size:200% 100%;animation:shimmer 1.6s infinite;border-radius:12px}

  /* ── HERO STAT PILLS ── */
  .hero-stat-pill{padding:10px 20px;border-radius:999px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.09);display:inline-flex;align-items:center;gap:10px;backdrop-filter:blur(12px);transition:border-color .25s,background .25s}
  .hero-stat-pill:hover{border-color:rgba(59,130,246,.35);background:rgba(37,99,235,.08)}

  /* ── STATS BAND ── */
  .stat-band-item{text-align:center;padding:28px 20px;position:relative}
  .stat-band-item+.stat-band-item::before{content:'';position:absolute;left:0;top:20%;bottom:20%;width:1px;background:rgba(255,255,255,.06)}
  .stat-band-val{font-family:'Barlow Condensed',sans-serif;font-size:clamp(2.4rem,5vw,3.6rem);font-weight:900;color:#fff;line-height:1;animation:numberUp .6s cubic-bezier(.22,1,.36,1) both}
  .stat-band-lbl{font-family:'Syne',sans-serif;font-size:9px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:rgba(255,255,255,.28);margin-top:5px}

  /* ── BRAND SPOTLIGHT (replaces plain ethos) ── */
  .brand-spot{padding:20px 18px;border-radius:18px;background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.06);transition:border-color .3s,background .3s,transform .3s;cursor:default}
  .brand-spot:hover{border-color:rgba(59,130,246,.22);background:rgba(37,99,235,.05);transform:translateY(-5px)}

  /* ── NEWS ── */
  .news-card{border-radius:20px;overflow:hidden;background:#fff;border:1px solid var(--lt-border);cursor:pointer;transition:transform .35s cubic-bezier(.22,1,.36,1),box-shadow .35s ease,border-color .3s ease;animation:cardIn .7s cubic-bezier(.22,1,.36,1) both}
  .news-card:hover{transform:translateY(-6px);box-shadow:0 24px 52px -14px rgba(10,15,30,.12);border-color:rgba(37,99,235,.22)}
  .news-card:hover .read-link{gap:9px}
  .read-link{display:inline-flex;align-items:center;gap:5px;font-family:'Syne',sans-serif;font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--blue);transition:gap .2s ease}

  /* ── HIGHLIGHT ── */
  .hl-card{border-radius:20px;overflow:hidden;background:var(--panel);border:1px solid var(--edge);transition:transform .35s cubic-bezier(.22,1,.36,1),box-shadow .35s ease,border-color .3s ease;cursor:pointer;animation:cardIn .7s cubic-bezier(.22,1,.36,1) both}
  .hl-card:hover{transform:translateY(-7px);box-shadow:0 30px 64px -18px rgba(0,0,0,.55),0 0 0 1px rgba(59,130,246,.2)}
  .hl-overlay{position:absolute;inset:0;background:radial-gradient(circle,rgba(8,10,15,.55) 0%,rgba(8,10,15,.12) 100%);opacity:0;transition:opacity .3s ease;display:flex;align-items:center;justify-content:center}
  .hl-card:hover .hl-overlay{opacity:1}

  /* ── PLAYER CARD v2 ── */
  .pc2{position:relative;border-radius:28px;overflow:hidden;background:linear-gradient(160deg,#111827 0%,#0C1020 100%);border:1px solid rgba(255,255,255,0.07);text-decoration:none;display:block;flex:0 0 clamp(260px,28vw,320px);transition:transform .42s cubic-bezier(.22,1,.36,1),box-shadow .42s ease,border-color .38s ease}
  .pc2:hover{transform:translateY(-12px) scale(1.02);box-shadow:0 48px 96px -20px rgba(0,0,0,.7),0 0 0 1px rgba(59,130,246,.3),0 0 60px -20px rgba(37,99,235,.25);border-color:rgba(59,130,246,.32)}
  .pc2-photo{position:relative;height:clamp(260px,28vw,320px);overflow:hidden}
  .pc2-photo img{width:100%;height:100%;object-fit:cover;object-position:center top;transition:transform .85s cubic-bezier(.22,1,.36,1)}
  .pc2:hover .pc2-photo img{transform:scale(1.08)}
  .pc2-cut{position:absolute;bottom:-1px;left:0;right:0;height:80px;background:linear-gradient(160deg,#111827 0%,#0C1020 100%);clip-path:polygon(0 60%,100% 0%,100% 100%,0% 100%)}
  .pc2-vignette{position:absolute;inset:0;background:radial-gradient(ellipse 90% 80% at 50% 100%,rgba(8,10,18,.95) 0%,rgba(8,10,18,.3) 55%,transparent 100%)}
  .pc2-side-glow{position:absolute;inset:0;background:linear-gradient(270deg,rgba(37,99,235,.18) 0%,transparent 45%);opacity:0;transition:opacity .4s ease}
  .pc2:hover .pc2-side-glow{opacity:1}
  .pc2-shine{position:absolute;inset:0;background:linear-gradient(125deg,rgba(255,255,255,.06) 0%,transparent 40%);opacity:0;transition:opacity .4s ease}
  .pc2:hover .pc2-shine{opacity:1}
  .pc2-num{position:absolute;top:-10px;right:-6px;font-family:'Barlow Condensed',sans-serif;font-size:clamp(5rem,9vw,8rem);font-weight:900;line-height:1;color:rgba(255,255,255,.04);pointer-events:none;transition:color .4s ease;z-index:1}
  .pc2:hover .pc2-num{color:rgba(59,130,246,.07)}
  .pc2-pos{position:absolute;top:14px;left:14px;z-index:4;padding:5px 13px;border-radius:8px;background:rgba(8,10,18,.7);backdrop-filter:blur(14px);border:1px solid rgba(255,255,255,.1);font-family:'Syne',sans-serif;font-size:9px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:rgba(255,255,255,.65)}
  .pc2-jersey{position:absolute;top:14px;right:14px;z-index:4;width:38px;height:38px;border-radius:10px;background:linear-gradient(135deg,rgba(37,99,235,.9),rgba(29,78,216,.95));backdrop-filter:blur(10px);border:1px solid rgba(59,130,246,.45);display:flex;align-items:center;justify-content:center;font-family:'Barlow Condensed',sans-serif;font-size:1.2rem;font-weight:900;color:#fff;box-shadow:0 4px 18px -4px rgba(37,99,235,.6)}
  .pc2-body{padding:0 20px 22px;position:relative;z-index:2;margin-top:-38px}
  .pc2-name{font-family:'Barlow Condensed',sans-serif;font-weight:900;font-size:clamp(1.7rem,3.5vw,2.2rem);line-height:.92;color:#fff;letter-spacing:-.01em;margin-bottom:4px}
  .pc2-sub{font-family:'Syne',sans-serif;font-size:9px;font-weight:700;letter-spacing:.2em;color:#3B82F6;text-transform:uppercase;margin-bottom:16px}
  .pc2-statbar-wrap{display:flex;flex-direction:column;gap:9px;margin-bottom:16px}
  .pc2-statbar{display:flex;align-items:center;gap:10px}
  .pc2-statbar-label{font-family:'Syne',sans-serif;font-size:8px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.3);width:26px;flex-shrink:0}
  .pc2-statbar-track{flex:1;height:3px;border-radius:2px;background:rgba(255,255,255,.07);overflow:hidden}
  .pc2-statbar-fill{height:100%;border-radius:2px;background:linear-gradient(90deg,#2563EB,#60A5FA);transform:scaleX(0);transform-origin:left;transition:transform .9s cubic-bezier(.22,1,.36,1)}
  .pc2:hover .pc2-statbar-fill{transform:scaleX(1)}
  .pc2-statbar-val{font-family:'Barlow Condensed',sans-serif;font-size:1rem;font-weight:800;color:#fff;width:28px;text-align:right;flex-shrink:0;line-height:1}
  .pc2-footer{display:flex;align-items:center;justify-content:space-between;padding-top:14px;border-top:1px solid rgba(255,255,255,.05)}
  .pc2-cta{display:inline-flex;align-items:center;gap:6px;font-family:'Syne',sans-serif;font-size:9px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#3B82F6}
  .pc2-arrow{width:32px;height:32px;border-radius:50%;background:rgba(37,99,235,.15);border:1px solid rgba(37,99,235,.3);display:flex;align-items:center;justify-content:center;transition:background .25s,transform .25s}
  .pc2:hover .pc2-arrow{background:var(--blue);transform:rotate(45deg)}

  /* ── CAROUSEL ── */
  .carousel-track{display:flex;gap:20px;cursor:grab;user-select:none}
  .carousel-track.dragging{cursor:grabbing}
  .carousel-track::-webkit-scrollbar{display:none}
  .carousel-wrap{overflow:hidden;mask-image:linear-gradient(90deg,transparent 0%,#000 5%,#000 95%,transparent 100%);-webkit-mask-image:linear-gradient(90deg,transparent 0%,#000 5%,#000 95%,transparent 100%)}

  /* nav buttons */
  .car-btn{width:46px;height:46px;border-radius:50%;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:background .22s,border-color .22s,transform .22s;backdrop-filter:blur(12px)}
  .car-btn:hover{background:rgba(37,99,235,.35);border-color:rgba(37,99,235,.5);transform:scale(1.07)}
  .car-btn:disabled{opacity:.25;cursor:default;pointer-events:none}

  /* dots */
  .car-dot{width:6px;height:6px;border-radius:3px;background:rgba(255,255,255,.18);border:none;cursor:pointer;padding:0;transition:background .25s,width .35s cubic-bezier(.22,1,.36,1)}
  .car-dot.active{width:22px;background:#2563EB}

  /* ── FOUNDER CARD ── */
  .fc{border-radius:22px;overflow:hidden;background:#fff;border:1px solid var(--lt-border);transition:transform .38s cubic-bezier(.22,1,.36,1),box-shadow .38s ease,border-color .35s ease;cursor:default;animation:cardIn .7s cubic-bezier(.22,1,.36,1) both}
  .fc:hover{transform:translateY(-8px);box-shadow:0 28px 60px -16px rgba(10,15,30,.14);border-color:rgba(37,99,235,.2)}
  .fc .fc-img{position:relative;height:240px;overflow:hidden;background:linear-gradient(135deg,#111520,#1D4ED8)}
  .fc .fc-img img{width:100%;height:100%;object-fit:cover;object-position:center top;transition:transform .7s cubic-bezier(.22,1,.36,1)}
  .fc:hover .fc-img img{transform:scale(1.05)}
  .fc .fc-img-overlay{position:absolute;inset:0;background:linear-gradient(to top,rgba(10,15,30,.62) 0%,transparent 55%)}
  .fc .fc-badge{position:absolute;bottom:14px;left:14px;right:14px;display:flex;align-items:center;justify-content:space-between;gap:8px}
  .fc .fc-role-chip{padding:6px 14px;border-radius:999px;background:rgba(8,10,15,.6);backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,.1);font-family:'Syne',sans-serif;font-size:9px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.8)}
  .fc .fc-active{display:flex;align-items:center;gap:5px;padding:5px 11px;border-radius:999px;background:rgba(8,10,15,.6);backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,.08);font-family:'Syne',sans-serif;font-size:9px;font-weight:700;color:#fff;letter-spacing:.05em}
  .fc .fc-body{padding:22px 24px 26px}
  .fc .fc-name{font-family:'Barlow Condensed',sans-serif;font-weight:800;font-size:1.8rem;line-height:.95;color:var(--lt-text);margin-bottom:8px;letter-spacing:-.01em}
  .fc .fc-bio{color:rgba(10,15,30,.46);font-size:13.5px;line-height:1.78;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
  .fc .fc-accent{position:absolute;bottom:0;left:0;right:0;height:3px;background:linear-gradient(90deg,var(--blue) 0%,var(--blue-hi) 100%);transform:scaleX(0);transform-origin:left;transition:transform .4s cubic-bezier(.22,1,.36,1)}
  .fc:hover .fc-accent{transform:scaleX(1)}

  /* ── ACTIVITY CARD ── */
  .act-card{border-radius:20px;overflow:hidden;background:var(--panel);border:1px solid var(--edge);text-decoration:none;display:block;transition:transform .35s cubic-bezier(.22,1,.36,1),box-shadow .35s ease,border-color .3s ease;animation:cardIn .7s cubic-bezier(.22,1,.36,1) both}
  .act-card:hover{transform:translateY(-6px);box-shadow:0 26px 56px -14px rgba(0,0,0,.5),0 0 0 1px rgba(59,130,246,.2);border-color:rgba(59,130,246,.22)}
  .act-arr{transition:transform .25s ease}
  .act-card:hover .act-arr{transform:translate(3px,-3px)}

  /* ── PRODUCT CARD ── */
  .shop-card{background:#fff;border-radius:20px;overflow:hidden;border:1px solid var(--lt-border);transition:transform .35s cubic-bezier(.22,1,.36,1),box-shadow .35s ease,border-color .3s ease;cursor:pointer;position:relative;animation:cardIn .7s cubic-bezier(.22,1,.36,1) both}
  .shop-card:hover{transform:translateY(-5px);box-shadow:0 22px 50px -12px rgba(10,15,30,.13);border-color:rgba(37,99,235,.2)}
  .shop-card .si{position:relative;overflow:hidden;background:#F3F4F8}
  .shop-card .si img{width:100%;height:100%;object-fit:cover;transition:transform .7s cubic-bezier(.22,1,.36,1)}
  .shop-card:hover .si img{transform:scale(1.07)}
  .shop-card .si-ov{position:absolute;inset:0;background:linear-gradient(to top,rgba(10,15,30,.6) 0%,transparent 55%);opacity:0;transition:opacity .3s ease}
  .shop-card:hover .si-ov{opacity:1}
  .shop-card .si-act{position:absolute;bottom:0;left:0;right:0;padding:11px;transform:translateY(100%);transition:transform .32s cubic-bezier(.22,1,.36,1)}
  .shop-card:hover .si-act{transform:translateY(0)}
  .shop-card .si-btn{position:absolute;top:10px;right:10px;width:32px;height:32px;border-radius:50%;background:rgba(255,255,255,.94);backdrop-filter:blur(12px);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .25s ease,transform .2s ease;z-index:3;box-shadow:0 2px 10px rgba(10,15,30,.12)}
  .shop-card:hover .si-btn{opacity:1}
  .shop-card .si-btn:hover{transform:scale(1.1)}
  .shop-card .si-btn.si-eye{top:48px}
  .add-btn{width:100%;padding:10px 0;border-radius:8px;background:#080A0F;color:#fff;font-family:'Syne',sans-serif;font-weight:700;font-size:10px;letter-spacing:.1em;text-transform:uppercase;border:none;cursor:pointer;transition:background .2s ease;display:flex;align-items:center;justify-content:center;gap:7px}
  .add-btn:hover{background:var(--blue)}

  /* ── POSITION SPOTLIGHT (home) ── */
  .pos-spot-home{padding:18px 20px;border-radius:18px;background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.06);display:flex;align-items:center;gap:14px;cursor:pointer;transition:border-color .3s,background .3s,transform .3s}
  .pos-spot-home:hover{border-color:rgba(59,130,246,.25);background:rgba(37,99,235,.06);transform:translateY(-4px)}

  /* Cat pill */
  .cat-pill{display:inline-flex;align-items:center;padding:8px 18px;border-radius:999px;font-family:'Syne',sans-serif;font-weight:700;font-size:11px;letter-spacing:.04em;text-transform:uppercase;cursor:pointer;transition:transform .2s ease,background .2s ease,box-shadow .2s ease,border-color .2s ease}
  .cat-pill:hover{transform:translateY(-2px)}

  /* Social pill */
  .soc-pill{display:inline-flex;align-items:center;gap:9px;padding:12px 22px;border-radius:999px;font-family:'Syne',sans-serif;font-weight:700;font-size:11px;letter-spacing:.06em;text-transform:uppercase;text-decoration:none;transition:transform .28s ease,background .28s ease,border-color .28s}
  .soc-pill:hover{transform:translateY(-3px);border-color:rgba(59,130,246,.4)!important;background:rgba(37,99,235,.08)!important}

  /* Badge */
  .badge{position:absolute;top:10px;left:10px;padding:4px 10px;border-radius:6px;font-family:'Syne',sans-serif;font-weight:700;font-size:9px;letter-spacing:.1em;text-transform:uppercase;z-index:3}

  /* Stars */
  .stars{display:flex;gap:2px}

  /* ── ACCENT LINE ── */
  .accent-line{display:block;height:3px;width:48px;background:linear-gradient(90deg,#2563EB,#60A5FA);border-radius:2px;margin-top:14px;animation:lineGrow .9s cubic-bezier(.22,1,.36,1) .3s both;transform-origin:left}
`;

/* ─── Hooks / Utils ─── */
function useReveal() {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { el.classList.add("in"); obs.disconnect(); } }, { threshold: 0.05 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

const Reveal = ({ children, className = "", style = {} }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) => {
  const ref = useReveal() as React.RefObject<HTMLElement>;
  return <section ref={ref} className={`reveal ${className}`} style={style}>{children}</section>;
};

const Stars = ({ rating = 4.5 }: { rating?: number }) => (
  <div className="stars">
    {[1,2,3,4,5].map(n => (
      <Star key={n} size={10}
        fill={n <= Math.floor(rating) ? "#F0A500" : n - 0.5 <= rating ? "#FCD34D" : "none"}
        color={n <= rating ? "#F0A500" : "#D1D5DB"} strokeWidth={1.5} />
    ))}
  </div>
);

const SkeletonCard = () => (
  <div style={{ borderRadius: 20, overflow: "hidden", background: "#fff", border: "1px solid rgba(10,15,30,.06)" }}>
    <div className="shimmer" style={{ height: 230 }} />
    <div style={{ padding: "16px" }}>
      {[60, 100, 80].map((w, i) => (
        <div key={i} className="shimmer" style={{ height: i === 0 ? 9 : 13, borderRadius: 6, marginBottom: 8, width: `${w}%` }} />
      ))}
    </div>
  </div>
);

const StatCounter = ({ value, suffix = "" }: { value: number; suffix?: string }) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true;
        const t0 = performance.now();
        const step = (now: number) => {
          const p = Math.min((now - t0) / 1800, 1);
          setCount(Math.round((1 - Math.pow(1 - p, 4)) * value));
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
        obs.disconnect();
      }
    }, { threshold: 0.5 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [value]);
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
};

/* ══════════ PLAYER CAROUSEL ══════════ */
function PlayerCarousel({ players }: { players: any[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef<{ x: number; scrollLeft: number } | null>(null);
  const CARD_W = 340;

  const scrollTo = useCallback((idx: number) => {
    const el = trackRef.current;
    if (!el) return;
    const clamped = Math.max(0, Math.min(idx, players.length - 1));
    setActiveIdx(clamped);
    el.scrollTo({ left: clamped * CARD_W, behavior: "smooth" });
  }, [players.length]);

  const onMouseDown = (e: React.MouseEvent) => {
    const el = trackRef.current; if (!el) return;
    dragStart.current = { x: e.pageX, scrollLeft: el.scrollLeft };
    setIsDragging(true);
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragStart.current || !trackRef.current) return;
    e.preventDefault();
    trackRef.current.scrollLeft = dragStart.current.scrollLeft - (e.pageX - dragStart.current.x);
  };
  const onMouseUp = () => { setIsDragging(false); dragStart.current = null; };
  const onScroll = () => {
    const el = trackRef.current; if (!el) return;
    setActiveIdx(Math.round(el.scrollLeft / CARD_W));
  };

  const STAT_DEFS = [
    { key: "ppg", label: "PPG", max: 40 },
    { key: "rpg", label: "RPG", max: 20 },
    { key: "apg", label: "APG", max: 15 },
  ];

  /* position breakdown for the mini strip above carousel */
  const rosterPositions = [...new Set(players.map(p => p.position?.toUpperCase()).filter(Boolean))] as string[];
  const POS_META: Record<string, { icon: React.ElementType; color: string; role: string }> = {
    PG: { icon: Zap,    color: "#3B82F6", role: "Floor General" },
    SG: { icon: Star,   color: "#60A5FA", role: "Scorer" },
    SF: { icon: Shield, color: "#93C5FD", role: "Two-Way Wing" },
    PF: { icon: Users,  color: "#BFDBFE", role: "Power Forward" },
    C:  { icon: Trophy, color: "#F0A500", role: "Anchor" },
  };

  return (
    <div style={{ position: "relative" }}>
      {/* bg decoration */}
      <div className="dots-dk" style={{ position: "absolute", inset: 0, pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: "clamp(6rem,18vw,16rem)", letterSpacing: ".1em", color: "rgba(255,255,255,.015)", whiteSpace: "nowrap", pointerEvents: "none", userSelect: "none" }}>ROSTER</div>
      <div style={{ position: "absolute", top: "15%", left: "-8%", width: 520, height: 520, borderRadius: "50%", background: "radial-gradient(circle,rgba(37,99,235,.09) 0%,transparent 68%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "10%", right: "-6%", width: 380, height: 380, borderRadius: "50%", background: "radial-gradient(circle,rgba(96,165,250,.05) 0%,transparent 68%)", pointerEvents: "none" }} />

      <div className="container mx-auto px-6 relative" style={{ zIndex: 1 }}>
        {/* header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-5">
          <div>
            <div className="label-tag a-up d1" style={{ color: "#60A5FA", marginBottom: 14 }}>
              <span className="label-dot" /> The Roster
            </div>
            <h2 className="disp a-up d2" style={{ fontSize: "clamp(2.8rem,6vw,4.8rem)", color: "#fff" }}>Top Players</h2>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button className="car-btn" onClick={() => scrollTo(activeIdx - 1)} disabled={activeIdx === 0} aria-label="Previous player">
              <ChevronRight size={18} color="#fff" style={{ transform: "rotate(180deg)" }} />
            </button>
            <button className="car-btn" onClick={() => scrollTo(activeIdx + 1)} disabled={activeIdx >= players.length - 1} aria-label="Next player">
              <ChevronRight size={18} color="#fff" />
            </button>
            <Link to="/players" className="btn-blue" style={{ marginLeft: 6 }}>All Players <ArrowUpRight size={13} /></Link>
          </div>
        </div>

        {/* ── Position Breakdown Strip ── */}
        {rosterPositions.length > 0 && (
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 28 }}>
            {rosterPositions.map((pos) => {
              const meta = POS_META[pos];
              const count = players.filter(p => p.position?.toUpperCase() === pos).length;
              const Icon = meta?.icon || Star;
              return (
                <Link key={pos} to="/players" className="pos-spot-home" style={{ textDecoration: "none" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(37,99,235,.14)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon size={15} color={meta?.color || "#60A5FA"} />
                  </div>
                  <div>
                    <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: "1.1rem", color: "#fff", lineHeight: 1 }}>{pos}</div>
                    <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "9px", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "rgba(255,255,255,.3)", marginTop: 2 }}>
                      {meta?.role} · {count}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* carousel */}
        <div className="carousel-wrap" style={{ marginLeft: "-4px", marginRight: "-4px" }}>
          <div
            ref={trackRef}
            className={`carousel-track${isDragging ? " dragging" : ""}`}
            style={{
              overflowX: "auto",
              paddingLeft: 4,
              paddingRight: 4,
              paddingBottom: 20,
              scrollSnapType: "x mandatory",
              scrollbarWidth: "none",
            }}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onScroll={onScroll}
          >
            {players.map((player: any) => {
              const stats = player.stats || {};
              const activeDefs = STAT_DEFS.filter(s => stats[s.key]);
              return (
                <Link key={player.id} to="/players" className="pc2" style={{ scrollSnapAlign: "start" }} draggable={false}>
                  <div className="pc2-num">{player.jersey_number || "00"}</div>
                  <div className="pc2-photo">
                    {player.image_url
                      ? <img src={player.image_url} alt={player.name} loading="lazy" draggable={false} />
                      : (
                        <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg,#111827,#1e3a8a)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span className="disp" style={{ fontSize: "6rem", color: "rgba(96,165,250,.09)" }}>#{player.jersey_number || "00"}</span>
                        </div>
                      )
                    }
                    <div className="pc2-vignette" />
                    <div className="pc2-side-glow" />
                    <div className="pc2-shine" />
                    <div className="pc2-cut" />
                  </div>
                  {player.position && <div className="pc2-pos">{player.position}</div>}
                  {player.jersey_number && <div className="pc2-jersey">#{player.jersey_number}</div>}
                  <div className="pc2-body">
                    <div className="pc2-name">{player.name}</div>
                    <div className="pc2-sub">RaidKhalid &amp; Co.</div>
                    {activeDefs.length > 0 && (
                      <div className="pc2-statbar-wrap">
                        {activeDefs.map((s, si) => {
                          const val = parseFloat(stats[s.key]) || 0;
                          const pct = Math.min(val / s.max, 1);
                          return (
                            <div key={s.key} className="pc2-statbar">
                              <span className="pc2-statbar-label">{s.label}</span>
                              <div className="pc2-statbar-track">
                                <div className="pc2-statbar-fill" style={{ width: `${pct * 100}%`, transitionDelay: `${si * 0.1}s` }} />
                              </div>
                              <span className="pc2-statbar-val">{stats[s.key]}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <div className="pc2-footer">
                      <span className="pc2-cta">View Profile</span>
                      <div className="pc2-arrow"><ArrowUpRight size={14} color="#60A5FA" /></div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* dot indicators */}
        {players.length > 1 && (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 6, marginTop: 18 }}>
            {players.map((_, i) => (
              <button key={i} className={`car-dot${i === activeIdx ? " active" : ""}`} onClick={() => scrollTo(i)} aria-label={`Go to player ${i + 1}`} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════ HOMEPAGE ═══════════════════════ */
export default function HomePage() {
  const [news, setNews] = useState<any[]>([]);
  const [highlights, setHighlights] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [founders, setFounders] = useState<any[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [socialLinks, setSocialLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());
  const [activeCat, setActiveCat] = useState("All");

  const toggleWish = useCallback((id: string) => setWishlist(prev => {
    const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n;
  }), []);

  useEffect(() => {
    const id = "rk-v9";
    if (!document.getElementById(id)) {
      const s = document.createElement("style"); s.id = id; s.textContent = STYLES;
      document.head.appendChild(s);
    }
    Promise.all([
      supabase.from("news").select("*").eq("published", true).order("created_at", { ascending: false }).limit(3),
      supabase.from("highlights").select("*").eq("active", true).order("display_order").limit(6),
      supabase.from("products").select("*").eq("in_stock", true).order("sold_count", { ascending: false }).limit(8),
      supabase.from("founder_profiles").select("*").eq("active", true).order("display_order").limit(3),
      supabase.from("player_profiles").select("*").eq("active", true).order("display_order"),
      supabase.from("activities").select("*").eq("active", true).order("display_order").limit(3),
      supabase.from("social_links").select("*").eq("active", true).order("display_order"),
    ]).then(([a, b, c, d, e, f, g]) => {
      setNews(a.data || []); setHighlights(b.data || []); setProducts(c.data || []);
      setFounders(d.data || []); setPlayers(e.data || []); setActivities(f.data || []);
      setSocialLinks(g.data || []); setLoading(false);
    });
  }, []);

  const CATS = ["All", "Jerseys", "Shorts", "Accessories", "Footwear"];

  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif", background: "#080A0F", overflowX: "hidden" }}>

      {/* ── HERO ── */}
      <section style={{ minHeight: "100svh", position: "relative", display: "flex", alignItems: "center" }}>
        <img src={heroBanner} alt="" className="a-hero" style={{
          position: "absolute", inset: 0, width: "100%", height: "100%",
          objectFit: "cover", objectPosition: "65% center",
        }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(108deg,rgba(8,10,15,.97) 0%,rgba(8,10,15,.86) 36%,rgba(8,10,15,.38) 68%,rgba(8,10,15,.16) 100%)" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top,rgba(8,10,15,1) 0%,rgba(8,10,15,.38) 28%,transparent 52%)" }} />
        <div className="dots-dk" style={{ position: "absolute", inset: 0 }} />
        <div style={{ position: "absolute", left: 0, top: "18%", bottom: "18%", width: "2px", background: "linear-gradient(to bottom,transparent,#2563EB 28%,#60A5FA 72%,transparent)", opacity: .55 }} />

        {/* Spinning badge */}
        <div style={{ position: "absolute", top: "8%", right: "5%", opacity: .25, zIndex: 2 }}>
          <svg style={{ animation: "spin 22s linear infinite" }} width="110" height="110" viewBox="0 0 120 120">
            <path id="sc" fill="none" d="M60,13 a47,47 0 1,1 -0.01,0" />
            <text style={{ fill: "#60A5FA", fontSize: 10, fontWeight: 700, letterSpacing: 3.5, fontFamily: "'Syne',sans-serif" }}>
              <textPath href="#sc">OFFICIAL · BASKETBALL BRAND · PH · </textPath>
            </text>
          </svg>
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#2563EB,#60A5FA)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 0 7px rgba(37,99,235,.15)", animation: "pulseRing 3s ease-in-out infinite" }}>
            <Trophy size={14} color="#fff" />
          </div>
        </div>

        <div className="container mx-auto px-6" style={{ position: "relative", zIndex: 3 }}>
          <div style={{ maxWidth: "600px" }}>
            <div className="label-tag a-in d1" style={{ color: "#60A5FA", marginBottom: "22px" }}>
              <span className="label-dot" /> Official Basketball Brand · Philippines
            </div>
            <h1 className="disp a-up d2" style={{ fontSize: "clamp(4.5rem,14vw,10rem)", color: "#fff", marginBottom: "4px" }}>RaidKhalid</h1>
            <h1 className="disp a-up d3" style={{ fontSize: "clamp(4.5rem,14vw,10rem)", color: "#2563EB", marginBottom: "30px", textShadow: "0 0 80px rgba(37,99,235,.28)" }}>&amp; Co.</h1>
            <p className="a-up d3" style={{ fontSize: "clamp(.95rem,1.6vw,1.05rem)", color: "rgba(255,255,255,.44)", lineHeight: 1.9, maxWidth: "370px", marginBottom: "38px", fontStyle: "italic", borderLeft: "2px solid rgba(37,99,235,.55)", paddingLeft: "18px" }}>
              Elevating basketball culture through passion, excellence, and community.
            </p>
            <div className="flex flex-wrap gap-3 a-up d4" style={{ marginBottom: 28 }}>
              <Link to="/shop" className="btn-blue"><ShoppingCart size={14} /> Shop Now</Link>
              <Link to="/activities" className="btn-ol-light"><Ticket size={14} /> Get Tickets</Link>
            </div>

            {/* Hero stat pills — same pattern as Players hero */}
            {!loading && players.length > 0 && (
              <div className="a-up d5" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {[
                  { label: "Players", val: players.length },
                  { label: "Products", val: products.length },
                  { label: "Highlights", val: highlights.length },
                ].map(({ label, val }) => (
                  <div key={label} className="hero-stat-pill">
                    <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: "1.4rem", color: "#60A5FA", lineHeight: 1 }}>{val}</span>
                    <span style={{ fontFamily: "'Syne',sans-serif", fontSize: "10px", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "rgba(255,255,255,.35)" }}>{label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Scroll hint */}
        <div style={{ position: "absolute", bottom: 32, left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, zIndex: 4, opacity: 0, animation: "fadeIn .6s ease 1.8s both" }}>
          <span style={{ fontSize: "8px", letterSpacing: ".22em", color: "rgba(255,255,255,.18)", textTransform: "uppercase", fontFamily: "'Syne',sans-serif" }}>scroll</span>
          <div style={{ width: 22, height: 36, borderRadius: 11, border: "1.5px solid rgba(255,255,255,.13)", display: "flex", justifyContent: "center", padding: "6px 0" }}>
            <div style={{ width: 3, height: 7, borderRadius: 2, background: "rgba(96,165,250,.6)", animation: "scrollY 1.8s ease-in-out infinite" }} />
          </div>
        </div>
      </section>

      {/* ── TICKER ── */}
      <div style={{ background: "#2563EB", overflow: "hidden", padding: "13px 0", borderTop: "1px solid rgba(255,255,255,.08)" }}>
        <div className="ticker-row">
          {Array.from({ length: 2 }).flatMap((_, oi) =>
            ["RAIDKHALID & CO.", "OFFICIAL BASKETBALL BRAND", "ELEVATE THE GAME", "SHOP NOW", "GET TICKETS", "WATCH HIGHLIGHTS", "NEW COLLECTION"].map((t, i) => (
              <span key={`${oi}-${i}`} style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "13px", fontWeight: 700, letterSpacing: ".22em", color: "rgba(255,255,255,.82)", whiteSpace: "nowrap", padding: "0 28px" }}>
                {t} <span style={{ color: "rgba(255,255,255,.28)" }}>●</span>
              </span>
            ))
          )}
        </div>
      </div>

      {/* ── STATS BAND ── */}
      <Reveal style={{ background: "#0C0F18", borderBottom: "1px solid rgba(255,255,255,.05)", position: "relative", overflow: "hidden" }}>
        <div className="lines-dk" style={{ position: "absolute", inset: 0 }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(108deg,transparent 46%,rgba(37,99,235,.035) 46%,rgba(37,99,235,.035) 52%,transparent 52%)", pointerEvents: "none" }} />
        <div className="container mx-auto px-6 relative" style={{ zIndex: 1 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)" }}>
            {[
              { label: "Players", value: players.length || 12, suffix: "+" },
              { label: "Highlights", value: highlights.length || 24, suffix: "" },
              { label: "Products", value: products.length || 8, suffix: "" },
              { label: "Events", value: activities.length || 6, suffix: "+" },
            ].map(({ label, value, suffix }, i) => (
              <div key={label} className="stat-band-item" style={{ animationDelay: `${i * 0.12}s` }}>
                <div className="stat-band-val" style={{ animationDelay: `${i * 0.12}s` }}>
                  <StatCounter value={value} suffix={suffix} />
                </div>
                <div className="stat-band-lbl">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      {/* ── NEWS ── */}
      {news.length > 0 && (
        <Reveal style={{ background: "#F7F8FA", position: "relative", overflow: "hidden" }}>
          <div className="dots" style={{ position: "absolute", inset: 0 }} />
          <div className="container mx-auto px-6 relative" style={{ zIndex: 1, paddingTop: "88px", paddingBottom: "88px" }}>
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-14 gap-5">
              <div>
                <div className="label-tag a-up d1" style={{ color: "#2563EB", marginBottom: "14px" }}><span className="label-dot" /> Latest Updates</div>
                <h2 className="disp a-up d2" style={{ fontSize: "clamp(2.8rem,6vw,4.8rem)", color: "#0C0F18" }}>Latest News</h2>
                <span className="accent-line" style={{ background: "linear-gradient(90deg,#2563EB,#60A5FA)", width: 48, height: 3, display: "block", borderRadius: 2, marginTop: 14, animationDelay: ".4s" }} />
              </div>
              <Link to="/news" className="btn-ol-dark">All Articles <ArrowUpRight size={13} /></Link>
            </div>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
              {news.map((item: any, i: number) => (
                <div key={item.id} className={`news-card a-up d${i + 1} group`} style={{ animationDelay: `${i * 0.1}s` }}>
                  {item.image_url && (
                    <div style={{ height: 198, overflow: "hidden", position: "relative" }}>
                      <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" style={{ transition: "transform .7s cubic-bezier(.22,1,.36,1)" }} loading="lazy" />
                    </div>
                  )}
                  <div style={{ height: 2, background: "linear-gradient(90deg,#2563EB,#60A5FA)" }} />
                  <div style={{ padding: "22px 24px 24px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                      <span style={{ fontFamily: "'Syne',sans-serif", fontSize: "9px", color: "#2563EB", fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase" }}>
                        {new Date(item.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                      <span style={{ padding: "3px 10px", borderRadius: 999, background: "rgba(37,99,235,.08)", color: "#2563EB", fontSize: "9px", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", fontFamily: "'Syne',sans-serif" }}>News</span>
                    </div>
                    <h3 className="disp" style={{ fontSize: "1.5rem", color: "#0C0F18", marginBottom: 10, lineHeight: 1 }}>{item.title}</h3>
                    <p className="line-clamp-2" style={{ color: "rgba(10,15,30,.44)", fontSize: "13.5px", lineHeight: 1.75 }}>{item.excerpt}</p>
                    <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid rgba(10,15,30,.06)" }}>
                      <span className="read-link">Read More <ArrowUpRight size={11} /></span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      )}

      {/* ── HIGHLIGHTS ── */}
      {highlights.length > 0 && (
        <Reveal style={{ background: "#0C0F18", paddingTop: "96px", paddingBottom: "96px", position: "relative", overflow: "hidden" }}>
          <div className="dots-dk" style={{ position: "absolute", inset: 0 }} />
          <div style={{ position: "absolute", top: "40%", left: "50%", transform: "translateX(-50%)", width: 700, height: 280, borderRadius: "50%", background: "radial-gradient(ellipse,rgba(37,99,235,.07) 0%,transparent 70%)", pointerEvents: "none" }} />
          <div className="container mx-auto px-6 relative" style={{ zIndex: 1 }}>
            <div className="text-center mb-14">
              <div className="label-tag a-up d1" style={{ color: "#60A5FA", justifyContent: "center", marginBottom: 14 }}><span className="label-dot" /> Watch &amp; Replay</div>
              <h2 className="disp a-up d2" style={{ fontSize: "clamp(2.8rem,6vw,4.8rem)", color: "#fff" }}>Player Highlights</h2>
              <div style={{ width: 44, height: 2, background: "linear-gradient(90deg,#2563EB,#60A5FA)", borderRadius: 2, margin: "16px auto 0", animation: "lineIn .9s cubic-bezier(.22,1,.36,1) .4s both", transformOrigin: "left" }} />
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {highlights.map((h: any, i: number) => (
                <div key={h.id} className={`hl-card group a-up d${(i % 3) + 1}`} style={{ animationDelay: `${i * 0.09}s` }}>
                  <div style={{ position: "relative", height: 215, overflow: "hidden" }}>
                    {h.image_url && <img src={h.image_url} alt={h.title} className="w-full h-full object-cover" style={{ transition: "transform .75s cubic-bezier(.22,1,.36,1)" }} loading="lazy" />}
                    <div className="hl-overlay">
                      {h.link_url && (
                        <a href={h.link_url} target="_blank" rel="noopener noreferrer" style={{ width: 54, height: 54, borderRadius: "50%", background: "#2563EB", border: "2px solid rgba(255,255,255,.2)", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none", animation: "glow 2.4s ease-in-out infinite" }}>
                          <Play size={20} color="#fff" style={{ marginLeft: 3 }} />
                        </a>
                      )}
                    </div>
                    <div className="badge" style={{ background: "rgba(37,99,235,.88)", color: "#fff", backdropFilter: "blur(8px)" }}>Highlight</div>
                    <div style={{ position: "absolute", bottom: 10, right: 10, zIndex: 2, background: "rgba(8,10,15,.65)", backdropFilter: "blur(8px)", borderRadius: 6, padding: "3px 9px", fontFamily: "'Syne',sans-serif", fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,.75)", border: "1px solid rgba(255,255,255,.08)" }}>#{i + 1}</div>
                  </div>
                  <div style={{ padding: "18px 20px 20px" }}>
                    <h3 className="disp" style={{ fontSize: "1.3rem", color: "#fff", marginBottom: 8 }}>{h.title}</h3>
                    {h.description && <p className="line-clamp-2" style={{ color: "rgba(255,255,255,.3)", fontSize: "12.5px", lineHeight: 1.7, marginBottom: 13 }}>{h.description}</p>}
                    {h.link_url && (
                      <a href={h.link_url} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#60A5FA", fontSize: "10px", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", textDecoration: "none", fontFamily: "'Syne',sans-serif" }}>
                        Watch Full Clip <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      )}

      {/* ══════════ PLAYERS CAROUSEL ══════════ */}
      {players.length > 0 && (
        <Reveal style={{ background: "#080A0F", paddingTop: "96px", paddingBottom: "96px", position: "relative", overflow: "hidden" }}>
          <PlayerCarousel players={players} />
        </Reveal>
      )}

      {/* ══════════ BRAND ETHOS BAND ══════════ */}
      <Reveal style={{ background: "#0C0F18", padding: "80px 0", borderTop: "1px solid rgba(255,255,255,.04)", position: "relative", overflow: "hidden" }}>
        <div className="lines-dk" style={{ position: "absolute", inset: 0 }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(108deg,transparent 46%,rgba(37,99,235,.04) 46%,rgba(37,99,235,.04) 52%,transparent 52%)", pointerEvents: "none" }} />
        <div className="container mx-auto px-6 relative" style={{ zIndex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px 80px", alignItems: "center" }}>
          <div>
            <div className="label-tag" style={{ color: "#60A5FA", marginBottom: 16 }}>
              <span className="label-dot" /> The Standard
            </div>
            <h2 className="disp" style={{ fontSize: "clamp(2.4rem,5vw,4rem)", color: "#fff", marginBottom: 6 }}>
              Built to<br /><span style={{ color: "#2563EB" }}>Win.</span>
            </h2>
            <span className="accent-line" />
            <p style={{ marginTop: 24, fontSize: "14.5px", color: "rgba(255,255,255,.38)", lineHeight: 1.9, maxWidth: 380 }}>
              RaidKhalid &amp; Co. is more than a brand — it's a movement. Every product, every player, every event is built around the relentless pursuit of excellence on and off the court.
            </p>
            <div style={{ marginTop: 28 }}>
              <Link to="/founders" className="btn-ol-light">Meet the Founders <ChevronRight size={14} /></Link>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              { icon: Target,  label: "Elite Scouting",   desc: "Players selected through rigorous tryouts and regional networks." },
              { icon: Zap,     label: "High Performance", desc: "Year-round conditioning programs for every athlete on the roster." },
              { icon: Shield,  label: "Two-Way Culture",  desc: "We develop players who defend as hard as they score." },
              { icon: Flame,   label: "Mental Edge",      desc: "Mindset coaching to perform under pressure, every time." },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="brand-spot">
                <div style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(37,99,235,.14)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                  <Icon size={15} color="#60A5FA" />
                </div>
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "10px", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "#60A5FA", marginBottom: 6 }}>{label}</div>
                <p style={{ fontSize: "12px", color: "rgba(255,255,255,.32)", lineHeight: 1.75 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      {/* ══════════ FOUNDERS ══════════ */}
      {founders.length > 0 && (
        <Reveal style={{ background: "#F7F8FA", position: "relative", overflow: "hidden" }}>
          <div className="lines" style={{ position: "absolute", inset: 0 }} />
          <div style={{ position: "absolute", top: "-12%", right: "-8%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle,rgba(37,99,235,.055) 0%,transparent 65%)", pointerEvents: "none" }} />
          <div className="container mx-auto px-6 relative" style={{ zIndex: 1, paddingTop: "96px", paddingBottom: "96px" }}>
            <div className="text-center mb-16">
              <div className="label-tag a-up d1" style={{ color: "#2563EB", justifyContent: "center", marginBottom: 14 }}><span className="label-dot" /> The Visionaries</div>
              <h2 className="disp a-up d2" style={{ fontSize: "clamp(2.8rem,6vw,4.8rem)", color: "#0C0F18" }}>Our Founders</h2>
              <div style={{ width: 44, height: 2, background: "linear-gradient(90deg,#2563EB,#60A5FA)", borderRadius: 2, margin: "16px auto 0", animation: "lineIn .9s cubic-bezier(.22,1,.36,1) .4s both", transformOrigin: "center" }} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-7 max-w-4xl mx-auto">
              {founders.map((f: any, i: number) => (
                <div key={f.id} className={`fc a-up d${i + 1}`} style={{ position: "relative", animationDelay: `${i * 0.1}s` }}>
                  <div className="fc-img">
                    {f.image_url
                      ? <img src={f.image_url} alt={f.name} loading="lazy" />
                      : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span className="disp" style={{ fontSize: "5rem", color: "rgba(255,255,255,.14)" }}>{f.name?.charAt(0)}</span>
                        </div>
                    }
                    <div className="fc-img-overlay" />
                    <div className="fc-badge">
                      <span className="fc-role-chip">{f.role}</span>
                      <span className="fc-active">
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22C55E", animation: "dot 2.5s ease-in-out infinite" }} />
                        Active
                      </span>
                    </div>
                  </div>
                  <div className="fc-body">
                    <div className="fc-name">{f.name}</div>
                    <p className="fc-bio">{f.bio}</p>
                  </div>
                  <div className="fc-accent" />
                </div>
              ))}
            </div>
            <div className="text-center mt-14">
              <Link to="/founders" className="btn-ol-dark">Meet All Founders <ChevronRight size={14} /></Link>
            </div>
          </div>
        </Reveal>
      )}

      {/* ── ACTIVITIES ── */}
      {activities.length > 0 && (
        <Reveal style={{ background: "#0C0F18", paddingTop: "96px", paddingBottom: "96px", position: "relative", overflow: "hidden" }}>
          <div className="dots-dk" style={{ position: "absolute", inset: 0 }} />
          <div className="container mx-auto px-6 relative" style={{ zIndex: 1 }}>
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-14 gap-5">
              <div>
                <div className="label-tag a-up d1" style={{ color: "#60A5FA", marginBottom: 14 }}><span className="label-dot" /> Mark Your Calendar</div>
                <h2 className="disp a-up d2" style={{ fontSize: "clamp(2.8rem,6vw,4.8rem)", color: "#fff" }}>Upcoming Events</h2>
                <span className="accent-line" style={{ background: "linear-gradient(90deg,#2563EB,#60A5FA)", display: "block", width: 48, height: 3, borderRadius: 2, marginTop: 14 }} />
              </div>
              <Link to="/activities" className="btn-ol-light">View All <ChevronRight size={14} /></Link>
            </div>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
              {activities.map((act: any, i: number) => (
                <Link key={act.id} to="/activities" className={`act-card a-up d${(i % 3) + 1}`} style={{ animationDelay: `${i * 0.09}s` }}>
                  {act.image_url && (
                    <div className="group overflow-hidden" style={{ height: 124 }}>
                      <img src={act.image_url} alt={act.title} className="w-full h-full object-cover" style={{ transition: "transform .7s cubic-bezier(.22,1,.36,1)" }} loading="lazy" />
                    </div>
                  )}
                  <div style={{ height: 2, background: "linear-gradient(90deg,#2563EB,#60A5FA)" }} />
                  <div style={{ padding: "18px 20px 20px" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 11 }}>
                      <h3 className="disp" style={{ fontSize: "1.2rem", color: "#fff", lineHeight: 1.05, flex: 1, paddingRight: 10 }}>{act.title}</h3>
                      <span className="act-arr" style={{ color: "#60A5FA", flexShrink: 0 }}><ArrowUpRight size={14} /></span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 11 }}>
                      {act.event_date && (
                        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                          <div style={{ width: 22, height: 22, borderRadius: 6, background: "rgba(37,99,235,.16)", border: "1px solid rgba(37,99,235,.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Calendar size={10} color="#60A5FA" /></div>
                          <span style={{ fontSize: "11.5px", color: "#93C5FD", fontWeight: 500 }}>{new Date(act.event_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                        </div>
                      )}
                      {act.location && (
                        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                          <div style={{ width: 22, height: 22, borderRadius: 6, background: "rgba(255,255,255,.04)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><MapPin size={10} color="rgba(255,255,255,.28)" /></div>
                          <span style={{ fontSize: "11.5px", color: "rgba(255,255,255,.36)", fontWeight: 400 }}>{act.location}</span>
                        </div>
                      )}
                    </div>
                    <div style={{ paddingTop: 11, borderTop: "1px solid rgba(255,255,255,.05)", display: "flex", alignItems: "center", gap: 6, color: "#60A5FA", fontSize: "10px", fontWeight: 700, letterSpacing: ".09em", textTransform: "uppercase", fontFamily: "'Syne',sans-serif" }}>
                      <Ticket size={10} /> View Details
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </Reveal>
      )}

      {/* ── SHOP PREVIEW ── */}
      {(products.length > 0 || loading) && (
        <Reveal style={{ background: "#F7F8FA", position: "relative", overflow: "hidden" }}>
          <div className="dots" style={{ position: "absolute", inset: 0 }} />
          <div style={{ position: "absolute", top: "-10%", right: "-6%", width: 520, height: 520, borderRadius: "50%", background: "radial-gradient(circle,rgba(37,99,235,.05) 0%,transparent 68%)", pointerEvents: "none" }} />
          <div className="container mx-auto px-6 relative" style={{ zIndex: 1, paddingTop: "88px", paddingBottom: "88px" }}>
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-5">
              <div>
                <div className="label-tag a-up d1" style={{ color: "#2563EB", marginBottom: 14 }}><span className="label-dot" /> Official Merch</div>
                <h2 className="disp a-up d2" style={{ fontSize: "clamp(2.8rem,6vw,4.8rem)", color: "#0C0F18" }}>Shop Collection</h2>
                <span className="accent-line" style={{ background: "linear-gradient(90deg,#2563EB,#60A5FA)", display: "block", width: 48, height: 3, borderRadius: 2, marginTop: 14 }} />
              </div>
              <Link to="/shop" className="btn-blue">Visit Full Shop <ArrowUpRight size={14} /></Link>
            </div>
            {/* Category pills */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 26 }}>
              {CATS.map(cat => (
                <button key={cat} className="cat-pill" onClick={() => setActiveCat(cat)} style={{ background: activeCat === cat ? "#0C0F18" : "#fff", color: activeCat === cat ? "#fff" : "#0C0F18", border: activeCat === cat ? "1.5px solid #0C0F18" : "1.5px solid rgba(10,15,30,.12)", boxShadow: activeCat === cat ? "0 4px 14px -4px rgba(10,15,30,.28)" : "none" }}>
                  {cat}
                </button>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(188px,1fr))", gap: 14 }}>
              {loading
                ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
                : products.map((p: any, i: number) => (
                  <Link key={p.id} to="/shop" style={{ textDecoration: "none" }}>
                    <div className={`shop-card a-up d${(i % 4) + 1}`} style={{ animationDelay: `${i * 0.07}s` }}>
                      <div className="si" style={{ height: "clamp(215px,22vw,270px)" }}>
                        {p.image_url
                          ? <img src={p.image_url} alt={p.name} loading="lazy" />
                          : <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg,#EEF2FF,#F1F5F9)", display: "flex", alignItems: "center", justifyContent: "center" }}><ShoppingCart size={28} color="rgba(10,15,30,.1)" /></div>
                        }
                        <div className="si-ov" />
                        <button className="si-btn" onClick={e => { e.preventDefault(); toggleWish(p.id); }}>
                          <Heart size={13} fill={wishlist.has(p.id) ? "#EF4444" : "none"} color={wishlist.has(p.id) ? "#EF4444" : "#0C0F18"} strokeWidth={1.8} />
                        </button>
                        <button className="si-btn si-eye" onClick={e => e.preventDefault()}><Eye size={12} color="#0C0F18" strokeWidth={1.8} /></button>
                        {p.badge && <div className="badge" style={{ background: p.badge === "hot" ? "#EF4444" : p.badge === "new" ? "#2563EB" : "#F0A500", color: "#fff" }}>{p.badge === "hot" ? "HOT" : p.badge === "new" ? "NEW" : "TOP"}</div>}
                        {p.sold_count > 50 && <div style={{ position: "absolute", bottom: 10, left: 10, zIndex: 3, background: "rgba(8,10,15,.72)", backdropFilter: "blur(6px)", borderRadius: 6, padding: "3px 9px", fontSize: "9px", fontWeight: 700, color: "rgba(255,255,255,.85)", fontFamily: "'Syne',sans-serif" }}>🔥 {p.sold_count}+ sold</div>}
                        <div className="si-act">
                          <button className="add-btn" onClick={e => e.preventDefault()}><ShoppingCart size={11} /> Add to Bag</button>
                        </div>
                      </div>
                      <div style={{ padding: "14px 16px 18px" }}>
                        <p style={{ fontFamily: "'Syne',sans-serif", fontSize: "9px", fontWeight: 700, letterSpacing: ".14em", color: "#2563EB", textTransform: "uppercase", marginBottom: 5 }}>RaidKhalid</p>
                        <h3 className="line-clamp-2" style={{ fontSize: "13px", fontWeight: 600, color: "#0C0F18", lineHeight: 1.4, marginBottom: 8, minHeight: "2.8em" }}>{p.name}</h3>
                        <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 9 }}>
                          <Stars rating={p.rating || 4.5} />
                          <span style={{ fontSize: "10px", color: "rgba(10,15,30,.34)" }}>({p.review_count || Math.floor(Math.random() * 80 + 10)})</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                          <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, color: "#0C0F18", fontSize: "15px" }}>₱{Number(p.price).toLocaleString()}</span>
                          {p.original_price && Number(p.original_price) > Number(p.price) && (
                            <><span style={{ fontSize: "11.5px", color: "rgba(10,15,30,.28)", textDecoration: "line-through" }}>₱{Number(p.original_price).toLocaleString()}</span>
                            <span style={{ fontFamily: "'Syne',sans-serif", fontSize: "9px", fontWeight: 800, color: "#fff", background: "#EF4444", padding: "2px 6px", borderRadius: 5 }}>-{Math.round((1 - p.price / p.original_price) * 100)}%</span></>
                          )}
                        </div>
                        {Number(p.price) >= 500 && <div style={{ marginTop: 7, fontFamily: "'Syne',sans-serif", fontSize: "9px", fontWeight: 700, color: "#16A34A" }}>✓ Free Shipping</div>}
                      </div>
                    </div>
                  </Link>
                ))
              }
            </div>
            <div style={{ textAlign: "center", marginTop: 38 }}>
              <Link to="/shop" className="btn-ol-dark">Browse Full Collection <ChevronRight size={14} /></Link>
            </div>
          </div>
        </Reveal>
      )}

      {/* ── SOCIAL ── */}
      {socialLinks.length > 0 && (
        <Reveal style={{ background: "#080A0F", borderTop: "1px solid rgba(255,255,255,.04)" }}>
          <div className="container mx-auto px-6 text-center" style={{ paddingTop: "88px", paddingBottom: "88px" }}>
            <div className="label-tag a-up d1" style={{ color: "#60A5FA", justifyContent: "center", marginBottom: 14 }}><span className="label-dot" /> Stay Connected</div>
            <h2 className="disp a-up d2" style={{ fontSize: "clamp(2.6rem,5.5vw,4.2rem)", color: "#fff", marginBottom: 38 }}>Follow Us</h2>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 10 }}>
              {socialLinks.map((link: any) => (
                <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" className="soc-pill" style={{ background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", color: "rgba(255,255,255,.72)" }}>
                  {getSocialIcon(link.platform)} {link.platform}
                </a>
              ))}
            </div>
          </div>
        </Reveal>
      )}
    </div>
  );
}