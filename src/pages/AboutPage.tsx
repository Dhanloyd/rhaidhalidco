import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Target, Eye, Heart, Trophy, ArrowUpRight, Star, Users, Calendar, MapPin, Zap } from "lucide-react";

/* ─────────────────────────── STYLES ─────────────────────────── */
const ABOUT_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800;900&family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap');

  :root {
    --void:#080A0F; --deep:#0C0F18; --surface:#111520; --panel:#161B28;
    --edge:rgba(255,255,255,0.06); --edge2:rgba(255,255,255,0.11);
    --blue:#2563EB; --blue-hi:#3B82F6; --blue-lo:#1D4ED8;
    --gold:#F0A500; --gold-lo:#B07800;
    --light:#F7F8FA; --white:#FFFFFF;
    --red:#EF4444;
  }
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

  /* ── Animations ── */
  @keyframes heroIn   {from{opacity:0;transform:scale(1.06)} to{opacity:1;transform:scale(1)}}
  @keyframes fadeUp   {from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)}}
  @keyframes fadeIn   {from{opacity:0} to{opacity:1}}
  @keyframes shimmer  {0%{background-position:-200% 0} 100%{background-position:200% 0}}
  @keyframes lineGrow {from{transform:scaleX(0)} to{transform:scaleX(1)}}
  @keyframes spin     {to{transform:rotate(360deg)}}
  @keyframes dot      {0%,100%{opacity:.3} 50%{opacity:.9}}
  @keyframes ticker   {from{transform:translateX(0)} to{transform:translateX(-50%)}}
  @keyframes pulse    {0%,100%{opacity:.6;transform:scale(1)} 50%{opacity:1;transform:scale(1.04)}}
  @keyframes float    {0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)}}
  @keyframes barIn    {from{transform:scaleX(0)} to{transform:scaleX(1)}}
  @keyframes countUp  {from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)}}
  @keyframes glowPulse{0%,100%{box-shadow:0 0 0 0 rgba(37,99,235,.4)} 50%{box-shadow:0 0 0 14px rgba(37,99,235,0)}}
  @keyframes gridFade {from{opacity:0} to{opacity:1}}

  .a-in  {animation:fadeIn .7s ease both}
  .a-up  {animation:fadeUp .9s cubic-bezier(.22,1,.36,1) both}
  .a-hero{animation:heroIn 1.3s cubic-bezier(.22,1,.36,1) both}
  .d1{animation-delay:.06s}.d2{animation-delay:.18s}.d3{animation-delay:.32s}
  .d4{animation-delay:.46s}.d5{animation-delay:.62s}.d6{animation-delay:.78s}

  .reveal{opacity:0;transform:translateY(30px);transition:opacity .95s cubic-bezier(.22,1,.36,1),transform .95s cubic-bezier(.22,1,.36,1)}
  .reveal.in{opacity:1;transform:none}

  /* ── Typography ── */
  .disp{font-family:'Barlow Condensed',sans-serif;font-weight:800;line-height:.92;letter-spacing:-.01em}
  .label-tag{display:inline-flex;align-items:center;gap:7px;font-family:'Syne',sans-serif;font-size:10px;font-weight:700;letter-spacing:.22em;text-transform:uppercase}
  .label-dot{width:5px;height:5px;border-radius:50%;background:currentColor;flex-shrink:0;animation:dot 2.2s ease-in-out infinite}

  /* ── Textures ── */
  .dots-dk{background-image:radial-gradient(circle,rgba(255,255,255,.04) 1px,transparent 1px);background-size:26px 26px}
  .lines-dk{background-image:linear-gradient(rgba(255,255,255,.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.02) 1px,transparent 1px);background-size:48px 48px}
  .noise{background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.04'/%3E%3C/svg%3E");background-size:200px 200px;opacity:.5}

  /* ── Ticker ── */
  .ticker-row{display:flex;width:max-content;animation:ticker 30s linear infinite}
  .ticker-row:hover{animation-play-state:paused}

  /* ── Value Cards ── */
  .val-card{position:relative;border-radius:24px;overflow:hidden;background:linear-gradient(160deg,#111827 0%,#0C1020 100%);border:1px solid rgba(255,255,255,.06);padding:32px 28px;transition:transform .4s cubic-bezier(.22,1,.36,1),box-shadow .4s ease,border-color .35s ease;cursor:default}
  .val-card::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(37,99,235,.07) 0%,transparent 60%);opacity:0;transition:opacity .4s ease}
  .val-card:hover{transform:translateY(-10px) scale(1.01);box-shadow:0 40px 80px -20px rgba(0,0,0,.65),0 0 0 1px rgba(59,130,246,.25),0 0 50px -15px rgba(37,99,235,.2);border-color:rgba(59,130,246,.28)}
  .val-card:hover::before{opacity:1}
  .val-icon-wrap{width:56px;height:56px;border-radius:16px;background:rgba(37,99,235,.12);border:1px solid rgba(37,99,235,.22);display:flex;align-items:center;justify-content:center;margin-bottom:20px;transition:background .3s,box-shadow .3s}
  .val-card:hover .val-icon-wrap{background:rgba(37,99,235,.22);box-shadow:0 0 24px -6px rgba(37,99,235,.5)}
  .val-num{position:absolute;bottom:-10px;right:4px;font-family:'Barlow Condensed',sans-serif;font-size:6rem;font-weight:900;color:rgba(255,255,255,.025);line-height:1;pointer-events:none;transition:color .4s}
  .val-card:hover .val-num{color:rgba(59,130,246,.055)}

  /* ── Timeline ── */
  .tl-item{display:grid;grid-template-columns:80px 1fr;gap:0 28px;position:relative}
  .tl-item + .tl-item{margin-top:0}
  .tl-line{position:absolute;left:79px;top:32px;bottom:-32px;width:1px;background:linear-gradient(to bottom,rgba(37,99,235,.5),rgba(37,99,235,.08))}
  .tl-item:last-child .tl-line{display:none}
  .tl-dot{width:14px;height:14px;border-radius:50%;background:linear-gradient(135deg,#2563EB,#60A5FA);border:3px solid #080A0F;box-shadow:0 0 0 6px rgba(37,99,235,.15);margin:10px auto 0;flex-shrink:0;position:relative;z-index:1;animation:glowPulse 3s ease-in-out infinite}
  .tl-year{font-family:'Barlow Condensed',sans-serif;font-size:1.35rem;font-weight:900;color:#3B82F6;line-height:1;padding-top:8px;text-align:right}
  .tl-content{padding:8px 0 40px 0}
  .tl-title{font-family:'Barlow Condensed',sans-serif;font-size:1.4rem;font-weight:800;color:#fff;line-height:1;margin-bottom:6px}
  .tl-desc{font-family:'DM Sans',sans-serif;font-size:13.5px;color:rgba(255,255,255,.38);line-height:1.85}

  /* ── Stat counters ── */
  .stat-counter{text-align:center;padding:28px 20px}
  .stat-val{font-family:'Barlow Condensed',sans-serif;font-size:clamp(2.8rem,5vw,4rem);font-weight:900;color:#fff;line-height:1;animation:countUp .8s cubic-bezier(.22,1,.36,1) both}
  .stat-unit{color:#3B82F6}
  .stat-lbl{font-family:'Syne',sans-serif;font-size:9px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:rgba(255,255,255,.28);margin-top:6px}
  .stat-divider{width:1px;background:rgba(255,255,255,.06);align-self:stretch;margin:16px 0}

  /* ── Pillar cards ── */
  .pillar{padding:28px;border-radius:20px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.06);transition:border-color .3s,background .3s}
  .pillar:hover{border-color:rgba(59,130,246,.22);background:rgba(37,99,235,.04)}

  /* ── Accent heading line ── */
  .accent-line{display:block;height:3px;width:48px;background:linear-gradient(90deg,#2563EB,#60A5FA);border-radius:2px;margin-top:14px;animation:lineGrow .9s cubic-bezier(.22,1,.36,1) .3s both;transform-origin:left}

  /* ── Scroll hint dot ── */
  @keyframes scrollDot{0%,100%{transform:translateY(0);opacity:.7}55%{transform:translateY(8px);opacity:.15}}
`;

/* ─── Hooks ─── */
function useReveal() {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { el.classList.add("in"); obs.disconnect(); } },
      { threshold: 0.06 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

const Reveal = ({ children, className = "", style = {} }: {
  children: React.ReactNode; className?: string; style?: React.CSSProperties
}) => {
  const ref = useReveal() as React.RefObject<HTMLElement>;
  return <section ref={ref} className={`reveal ${className}`} style={style}>{children}</section>;
};

/* ─────────────────────────── DATA ─────────────────────────── */
const VALUES = [
  {
    icon: Target,
    title: "Mission",
    desc: "To build a world-class basketball organization that inspires greatness on and off the court — raising the standard for Philippine basketball.",
    accent: "#2563EB",
  },
  {
    icon: Eye,
    title: "Vision",
    desc: "To become the most respected basketball franchise in the region, known for excellence, integrity, and a culture that outlasts trophies.",
    accent: "#3B82F6",
  },
  {
    icon: Heart,
    title: "Community",
    desc: "We believe in giving back — developing youth talent and strengthening our community through the universal language of sport.",
    accent: "#60A5FA",
  },
  {
    icon: Trophy,
    title: "Excellence",
    desc: "Every game, every practice, every interaction — we pursue excellence with obsessive attention to detail and relentless competitive spirit.",
    accent: "#F0A500",
  },
];

const TIMELINE = [
  {
    year: "2018",
    title: "The Beginning",
    desc: "Founded by a group of basketball fanatics. What started as weekly pickup games on local courts became the seed of something far bigger.",
  },
  {
    year: "2019",
    title: "First Organized League",
    desc: "RaidKhalid & Co. entered its first regional league, finishing runner-up and announcing the franchise's competitive ambitions to the region.",
  },
  {
    year: "2021",
    title: "Merchandise & Brand",
    desc: "Launched the official merchandise line. Jerseys sold out in 48 hours. The brand took on a life of its own far beyond the basketball court.",
  },
  {
    year: "2023",
    title: "Youth Development",
    desc: "Established our grassroots program, reaching over 400 young athletes across three provinces with free coaching clinics and training camps.",
  },
  {
    year: "2025",
    title: "Franchise Status",
    desc: "Officially registered as a professional franchise. The movement became an institution. The dream became the standard.",
  },
];

const STATS = [
  { val: "7", unit: "+", label: "Years Active" },
  { val: "400", unit: "+", label: "Youth Athletes" },
  { val: "12", unit: "", label: "Franchise Players" },
  { val: "3", unit: "×", label: "League Finals" },
];

const PILLARS = [
  { icon: Zap, label: "Relentless Preparation" },
  { icon: Users, label: "Brotherhood First" },
  { icon: Star, label: "Elite Standards" },
  { icon: MapPin, label: "Rooted in PH" },
  { icon: Calendar, label: "Long-term Vision" },
  { icon: Trophy, label: "Win with Honour" },
];

/* ═══════════════════════ COMPONENT ═══════════════════════ */
const AboutPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const id = "rk-about-v3";
    if (!document.getElementById(id)) {
      const s = document.createElement("style");
      s.id = id;
      s.textContent = ABOUT_STYLES;
      document.head.appendChild(s);
    }
  }, []);

  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif", background: "#080A0F", overflowX: "hidden", color: "#fff" }}>

      {/* ══ HERO ══ */}
      <section style={{ minHeight: "60vh", position: "relative", display: "flex", alignItems: "flex-end", paddingBottom: 0 }}>
        {/* BG layers */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg,#080A0F 0%,#0C1020 45%,#0d1630 100%)" }} />
        <div className="dots-dk" style={{ position: "absolute", inset: 0 }} />

        {/* Watermark text */}
        <div style={{
          position: "absolute", top: "50%", right: "3%", transform: "translateY(-50%)",
          fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900,
          fontSize: "clamp(7rem,20vw,18rem)", lineHeight: 1,
          color: "rgba(255,255,255,.018)", userSelect: "none", pointerEvents: "none",
          letterSpacing: ".05em",
        }}>ABOUT</div>

        {/* Left accent stripe */}
        <div style={{ position: "absolute", left: 0, top: "15%", bottom: "15%", width: 2, background: "linear-gradient(to bottom,transparent,#2563EB 30%,#60A5FA 70%,transparent)", opacity: .6 }} />

        {/* Glow orbs */}
        <div style={{ position: "absolute", top: "20%", right: "25%", width: 560, height: 560, borderRadius: "50%", background: "radial-gradient(circle,rgba(37,99,235,.09) 0%,transparent 65%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: 0, left: "20%", width: 400, height: 200, background: "radial-gradient(ellipse,rgba(37,99,235,.06) 0%,transparent 70%)", pointerEvents: "none" }} />

        {/* Spinning badge */}
        <div style={{ position: "absolute", top: "8%", right: "5%", opacity: .2, zIndex: 2 }}>
          <svg style={{ animation: "spin 26s linear infinite" }} width="110" height="110" viewBox="0 0 120 120">
            <path id="arc" fill="none" d="M60,13 a47,47 0 1,1 -0.01,0" />
            <text style={{ fill: "#60A5FA", fontSize: 10, fontWeight: 700, letterSpacing: 3.5, fontFamily: "'Syne',sans-serif" }}>
              <textPath href="#arc">RAIDKHALID & CO · SINCE 2018 · PH · </textPath>
            </text>
          </svg>
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#2563EB,#60A5FA)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 0 7px rgba(37,99,235,.15)" }}>
            <Star size={14} color="#fff" />
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto" style={{ padding: "130px 24px 72px", position: "relative", zIndex: 3 }}>
          <div className="label-tag a-in d1" style={{ color: "#60A5FA", marginBottom: 18 }}>
            <span className="label-dot" /> Our Story
          </div>
          <h1 className="disp a-up d2" style={{ fontSize: "clamp(3.5rem,11vw,8.5rem)", color: "#fff", marginBottom: 4 }}>
            More Than
          </h1>
          <h1 className="disp a-up d3" style={{ fontSize: "clamp(3.5rem,11vw,8.5rem)", color: "#2563EB", marginBottom: 22, textShadow: "0 0 80px rgba(37,99,235,.3)" }}>
            A Team.
          </h1>
          <p className="a-up d4" style={{
            fontSize: "clamp(.9rem,1.4vw,1rem)", color: "rgba(255,255,255,.38)",
            lineHeight: 1.95, maxWidth: "400px",
            borderLeft: "2px solid rgba(37,99,235,.5)", paddingLeft: 18,
            fontStyle: "italic",
          }}>
            The story behind RaidKhalid &amp; Co. — a franchise built on passion, discipline, and the relentless love of basketball.
          </p>

          {/* Founding pill */}
          <div className="a-up d5" style={{ marginTop: 30, display: "inline-flex", alignItems: "center", gap: 10, padding: "10px 20px", borderRadius: 999, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)" }}>
            <Calendar size={13} color="#60A5FA" />
            <span style={{ fontFamily: "'Syne',sans-serif", fontSize: "10px", fontWeight: 700, letterSpacing: ".15em", textTransform: "uppercase", color: "rgba(255,255,255,.45)" }}>
              Founded 2018 · Philippines
            </span>
          </div>
        </div>

        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 80, background: "linear-gradient(to top,#080A0F,transparent)", pointerEvents: "none" }} />
      </section>

      {/* ══ TICKER ══ */}
      <div style={{ background: "#2563EB", overflow: "hidden", padding: "12px 0", borderTop: "1px solid rgba(255,255,255,.08)" }}>
        <div className="ticker-row">
          {Array.from({ length: 2 }).flatMap((_, oi) =>
            ["RAIDKHALID & CO.", "SINCE 2018", "FRANCHISE BASKETBALL", "BUILT ON PASSION", "PH PRIDE", "ELEVATE THE GAME", "COMMUNITY FIRST"].map((t, i) => (
              <span key={`${oi}-${i}`} style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "13px", fontWeight: 700, letterSpacing: ".22em", color: "rgba(255,255,255,.82)", whiteSpace: "nowrap", padding: "0 28px" }}>
                {t} <span style={{ color: "rgba(255,255,255,.28)" }}>●</span>
              </span>
            ))
          )}
        </div>
      </div>

      {/* ══ STATS BAND ══ */}
      <Reveal>
        <div style={{ background: "#0C0F18", borderBottom: "1px solid rgba(255,255,255,.05)" }}>
          <div className="container mx-auto" style={{ padding: "0 24px" }}>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center" }}>
              {STATS.map(({ val, unit, label }, i) => (
                <div key={label} style={{ flex: "1 1 140px", display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div className="stat-counter">
                    <div className="stat-val" style={{ animationDelay: `${i * .1}s` }}>
                      {val}<span className="stat-unit">{unit}</span>
                    </div>
                    <p className="stat-lbl">{label}</p>
                  </div>
                  {i < STATS.length - 1 && (
                    <div className="stat-divider" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Reveal>

      {/* ══ OUR STORY (split layout) ══ */}
      <Reveal style={{ background: "#080A0F", padding: "96px 0", position: "relative", overflow: "hidden" }}>
        <div className="dots-dk" style={{ position: "absolute", inset: 0, opacity: .6 }} />
        <div style={{ position: "absolute", top: "10%", right: "-8%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle,rgba(37,99,235,.06) 0%,transparent 65%)", pointerEvents: "none" }} />

        <div className="container mx-auto" style={{ padding: "0 24px", position: "relative", zIndex: 1 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "80px 60px", alignItems: "start" }}>

            {/* Left: Heading + intro */}
            <div>
              <div className="label-tag" style={{ color: "#60A5FA", marginBottom: 16 }}>
                <span className="label-dot" /> The Origin
              </div>
              <h2 className="disp" style={{ fontSize: "clamp(2.6rem,5.5vw,4.4rem)", color: "#fff", marginBottom: 16 }}>
                Our<br /><span style={{ color: "#2563EB" }}>Story</span>
              </h2>
              <span className="accent-line" />

              {/* Decorative large year */}
              <div style={{ marginTop: 36, fontFamily: "'Barlow Condensed',sans-serif", fontSize: "clamp(4rem,8vw,7rem)", fontWeight: 900, color: "rgba(37,99,235,.08)", lineHeight: 1, userSelect: "none" }}>2018</div>
              <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "15px", color: "rgba(255,255,255,.35)", lineHeight: 1.9, marginTop: -10, fontStyle: "italic" }}>
                The year everything started.
              </p>

              {/* Pillars */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 32 }}>
                {PILLARS.map(({ icon: Icon, label }) => (
                  <div key={label} className="pillar" style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Icon size={13} color="#3B82F6" style={{ flexShrink: 0 }} />
                    <span style={{ fontFamily: "'Syne',sans-serif", fontSize: "10px", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "rgba(255,255,255,.45)" }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Prose + Timeline */}
            <div>
              <p style={{ fontSize: "15.5px", color: "rgba(255,255,255,.5)", lineHeight: 1.95, marginBottom: 18 }}>
                Founded in 2018, RaidKhalid &amp; Co. began as a dream shared by a small group of basketball fanatics who believed they could build something that went far beyond wins and losses. What started as spirited pickup games on sun-bleached courts quietly evolved into an organized franchise with a dedicated fanbase and a name that echoed across regional hardwood.
              </p>
              <p style={{ fontSize: "15.5px", color: "rgba(255,255,255,.5)", lineHeight: 1.95, marginBottom: 40 }}>
                Today, RaidKhalid &amp; Co. stands as a symbol of perseverance, brotherhood, and community. With a roster of elite players, a thriving merchandise line, and youth programs reaching hundreds of young athletes, we continue to push what a basketball organization can mean — on and off the court.
              </p>

              {/* Timeline */}
              <div style={{ position: "relative" }}>
                {TIMELINE.map((item, i) => (
                  <div key={item.year} className="tl-item" style={{ position: "relative" }}>
                    <div className="tl-line" />
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                      <div className="tl-year">{item.year}</div>
                    </div>
                    <div style={{ position: "relative", paddingLeft: 28 }}>
                      <div className="tl-dot" style={{ position: "absolute", left: 0, top: 10 }} />
                      <div className="tl-content">
                        <div className="tl-title">{item.title}</div>
                        <p className="tl-desc">{item.desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Reveal>

      {/* ══ VALUES ══ */}
      <Reveal style={{ background: "#0C0F18", padding: "96px 0", position: "relative", overflow: "hidden" }}>
        <div className="lines-dk" style={{ position: "absolute", inset: 0 }} />
        <div style={{ position: "absolute", bottom: "5%", left: "30%", width: 440, height: 220, background: "radial-gradient(ellipse,rgba(37,99,235,.06) 0%,transparent 70%)", pointerEvents: "none" }} />

        <div className="container mx-auto" style={{ padding: "0 24px", position: "relative", zIndex: 1 }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <div className="label-tag" style={{ color: "#60A5FA", marginBottom: 16, justifyContent: "center" }}>
              <span className="label-dot" /> What We Stand For
            </div>
            <h2 className="disp" style={{ fontSize: "clamp(2.6rem,5.5vw,4.4rem)", color: "#fff" }}>
              Our <span style={{ color: "#2563EB" }}>Values</span>
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 20 }}>
            {VALUES.map(({ icon: Icon, title, desc, accent }, idx) => (
              <div key={title} className="val-card">
                <div className="val-num">0{idx + 1}</div>
                <div className="val-icon-wrap">
                  <Icon size={22} color={accent} />
                </div>
                <h3 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "1.7rem", fontWeight: 900, color: "#fff", marginBottom: 10, lineHeight: 1 }}>
                  {title}
                </h3>
                <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "13.5px", color: "rgba(255,255,255,.38)", lineHeight: 1.85 }}>
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      {/* ══ CLOSING CTA BAND ══ */}
      <Reveal style={{ background: "#080A0F", padding: "96px 0 112px", position: "relative", overflow: "hidden" }}>
        <div className="dots-dk" style={{ position: "absolute", inset: 0, opacity: .5 }} />
        {/* Big diagonal stripe */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(108deg,transparent 48%,rgba(37,99,235,.04) 48%,rgba(37,99,235,.04) 52%,transparent 52%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: "20%", left: "50%", transform: "translateX(-50%)", width: 700, height: 350, background: "radial-gradient(ellipse,rgba(37,99,235,.08) 0%,transparent 65%)", pointerEvents: "none" }} />

        <div className="container mx-auto" style={{ padding: "0 24px", textAlign: "center", position: "relative", zIndex: 1 }}>
          <div className="label-tag" style={{ color: "#60A5FA", marginBottom: 20, justifyContent: "center" }}>
            <span className="label-dot" /> Be Part of It
          </div>
          <h2 className="disp" style={{ fontSize: "clamp(3rem,7vw,6rem)", color: "#fff", marginBottom: 6 }}>
            The Movement
          </h2>
          <h2 className="disp" style={{ fontSize: "clamp(3rem,7vw,6rem)", color: "#2563EB", marginBottom: 24, textShadow: "0 0 60px rgba(37,99,235,.3)" }}>
            Continues.
          </h2>
          <p style={{ maxWidth: 440, margin: "0 auto 36px", fontSize: "clamp(.88rem,1.3vw,.97rem)", color: "rgba(255,255,255,.35)", lineHeight: 1.95, fontStyle: "italic" }}>
            Follow the franchise. Support the players. Wear the brand. Join a community that believes basketball is more than a game.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "14px 28px", borderRadius: 999,
              background: "linear-gradient(135deg,#2563EB,#1D4ED8)",
              border: "none", color: "#fff",
              fontFamily: "'Syne',sans-serif", fontSize: "11px", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase",
              cursor: "pointer", boxShadow: "0 8px 28px -6px rgba(37,99,235,.55)",
              transition: "transform .2s,box-shadow .2s",
            }}
              onClick={() => navigate("/players")}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 14px 36px -6px rgba(37,99,235,.7)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = ""; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 28px -6px rgba(37,99,235,.55)"; }}
            >
              Meet the Players <ArrowUpRight size={14} />
            </button>
            <button style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "14px 28px", borderRadius: 999,
              background: "rgba(255,255,255,.04)",
              border: "1.5px solid rgba(255,255,255,.1)", color: "rgba(255,255,255,.6)",
              fontFamily: "'Syne',sans-serif", fontSize: "11px", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase",
              cursor: "pointer", transition: "border-color .2s,color .2s",
            }}
              onClick={() => navigate("/shop")}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(59,130,246,.4)"; (e.currentTarget as HTMLButtonElement).style.color = "#fff"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,.1)"; (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,.6)"; }}
            >
              Shop Merch
            </button>
          </div>
        </div>
      </Reveal>

    </div>
  );
};

export default AboutPage;