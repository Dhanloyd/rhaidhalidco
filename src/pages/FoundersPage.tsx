import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Star, ArrowUpRight, X } from "lucide-react";

/* ─── Types ─── */
interface Founder {
  id: string;
  name: string;
  role?: string;
  image_url?: string;
  bio?: string;
  active: boolean;
  display_order?: number;
}

/* ─── Styles — mirrors PlayersPage design system ─── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800;900&family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap');

  @keyframes heroIn   {from{opacity:0;transform:scale(1.05)} to{opacity:1;transform:scale(1)}}
  @keyframes fadeUp   {from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)}}
  @keyframes fadeIn   {from{opacity:0} to{opacity:1}}
  @keyframes shimmer  {0%{background-position:-200% 0} 100%{background-position:200% 0}}
  @keyframes spin     {to{transform:rotate(360deg)}}
  @keyframes dot      {0%,100%{opacity:.3} 50%{opacity:.9}}
  @keyframes ticker   {from{transform:translateX(0)} to{transform:translateX(-50%)}}
  @keyframes modalIn  {from{opacity:0;transform:scale(.96) translateY(14px)} to{opacity:1;transform:scale(1) translateY(0)}}
  @keyframes overlayIn{from{opacity:0} to{opacity:1}}
  @keyframes cardIn   {from{opacity:0;transform:translateY(30px) scale(.97)} to{opacity:1;transform:none}}
  @keyframes lineGrow {from{transform:scaleX(0)} to{transform:scaleX(1)}}
  @keyframes arcSpin  {to{stroke-dashoffset:-350}}
  @keyframes bounce   {0%,100%{transform:translateY(0);opacity:.5} 50%{transform:translateY(-8px);opacity:1}}

  .fnd-a-in  {animation:fadeIn .6s ease both}
  .fnd-a-up  {animation:fadeUp .8s cubic-bezier(.22,1,.36,1) both}
  .fnd-d1{animation-delay:.08s}.fnd-d2{animation-delay:.18s}.fnd-d3{animation-delay:.3s}
  .fnd-d4{animation-delay:.42s}.fnd-d5{animation-delay:.54s}

  .fnd-reveal{opacity:0;transform:translateY(28px);transition:opacity .9s cubic-bezier(.22,1,.36,1),transform .9s cubic-bezier(.22,1,.36,1)}
  .fnd-reveal.in{opacity:1;transform:none}

  .fnd-disp{font-family:'Barlow Condensed',sans-serif;font-weight:800;line-height:.92;letter-spacing:-.01em}
  .fnd-label{display:inline-flex;align-items:center;gap:7px;font-family:'Syne',sans-serif;font-size:10px;font-weight:700;letter-spacing:.22em;text-transform:uppercase}
  .fnd-ldot{width:5px;height:5px;border-radius:50%;background:currentColor;flex-shrink:0;animation:dot 2.2s ease-in-out infinite}

  .fnd-dots{background-image:radial-gradient(circle,rgba(255,255,255,.04) 1px,transparent 1px);background-size:26px 26px}
  .fnd-lines{background-image:linear-gradient(rgba(255,255,255,.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.02) 1px,transparent 1px);background-size:48px 48px}

  .fnd-ticker-row{display:flex;width:max-content;animation:ticker 32s linear infinite}
  .fnd-ticker-row:hover{animation-play-state:paused}

  /* ── Founder Card ── */
  .fnd-card{position:relative;border-radius:28px;overflow:hidden;background:linear-gradient(160deg,#111827 0%,#0C1020 100%);border:1px solid rgba(255,255,255,.07);cursor:pointer;transition:transform .42s cubic-bezier(.22,1,.36,1),box-shadow .42s ease,border-color .38s ease;display:flex;flex-direction:column;animation:cardIn .7s cubic-bezier(.22,1,.36,1) both;text-align:left;width:100%}
  .fnd-card:hover{transform:translateY(-12px) scale(1.02);box-shadow:0 48px 96px -20px rgba(0,0,0,.7),0 0 0 1px rgba(59,130,246,.3),0 0 60px -20px rgba(37,99,235,.25);border-color:rgba(59,130,246,.32)}

  .fnd-photo{position:relative;height:clamp(260px,28vw,340px);overflow:hidden;flex-shrink:0}
  .fnd-photo img{width:100%;height:100%;object-fit:cover;object-position:center top;transition:transform .85s cubic-bezier(.22,1,.36,1)}
  .fnd-card:hover .fnd-photo img{transform:scale(1.08)}
  .fnd-vignette{position:absolute;inset:0;background:radial-gradient(ellipse 90% 80% at 50% 100%,rgba(8,10,18,.95) 0%,rgba(8,10,18,.3) 55%,transparent 100%)}
  .fnd-side-glow{position:absolute;inset:0;background:linear-gradient(270deg,rgba(37,99,235,.18) 0%,transparent 45%);opacity:0;transition:opacity .4s ease}
  .fnd-card:hover .fnd-side-glow{opacity:1}
  .fnd-shine{position:absolute;inset:0;background:linear-gradient(125deg,rgba(255,255,255,.06) 0%,transparent 40%);opacity:0;transition:opacity .4s ease}
  .fnd-card:hover .fnd-shine{opacity:1}
  .fnd-cut{position:absolute;bottom:-1px;left:0;right:0;height:80px;background:linear-gradient(160deg,#111827 0%,#0C1020 100%);clip-path:polygon(0 60%,100% 0%,100% 100%,0% 100%)}

  .fnd-photo-placeholder{width:100%;height:100%;background:linear-gradient(135deg,#111827,#1e3a8a);display:flex;align-items:center;justify-content:center}

  /* Arc ring around placeholder initial */
  .fnd-arc-wrap{position:relative;width:96px;height:96px}
  .fnd-arc-bg{position:absolute;inset:0;border-radius:50%;background:rgba(37,99,235,.12)}
  .fnd-arc-letter{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:'Barlow Condensed',sans-serif;font-size:3.5rem;font-weight:900;color:rgba(59,130,246,.25);line-height:1}
  .fnd-arc-svg{position:absolute;inset:-8px;animation:spin 10s linear infinite}

  /* Role badge */
  .fnd-role-badge{position:absolute;top:14px;left:14px;z-index:4;padding:5px 13px;border-radius:8px;background:rgba(8,10,18,.7);backdrop-filter:blur(14px);border:1px solid rgba(255,255,255,.1);font-family:'Syne',sans-serif;font-size:9px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:rgba(255,255,255,.65)}
  .fnd-star-badge{position:absolute;top:14px;right:14px;z-index:4;width:38px;height:38px;border-radius:10px;background:linear-gradient(135deg,rgba(37,99,235,.9),rgba(29,78,216,.95));border:1px solid rgba(59,130,246,.45);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 18px -4px rgba(37,99,235,.6)}

  /* Card body */
  .fnd-body{padding:0 20px 22px;position:relative;z-index:2;margin-top:-38px;flex:1;display:flex;flex-direction:column}
  .fnd-name{font-family:'Barlow Condensed',sans-serif;font-weight:900;font-size:clamp(1.6rem,3vw,2rem);line-height:.92;color:#fff;letter-spacing:-.01em;margin-bottom:4px;transition:color .3s}
  .fnd-card:hover .fnd-name{color:#60A5FA}
  .fnd-brand{font-family:'Syne',sans-serif;font-size:9px;font-weight:700;letter-spacing:.2em;color:#3B82F6;text-transform:uppercase;margin-bottom:12px}
  .fnd-bio{font-family:'DM Sans',sans-serif;font-size:12.5px;font-weight:300;line-height:1.8;color:rgba(255,255,255,.32);margin-bottom:16px;flex:1;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
  .fnd-footer{display:flex;align-items:center;justify-content:space-between;padding-top:14px;border-top:1px solid rgba(255,255,255,.05);margin-top:auto}
  .fnd-cta{display:inline-flex;align-items:center;gap:6px;font-family:'Syne',sans-serif;font-size:9px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#3B82F6}
  .fnd-arrow{width:32px;height:32px;border-radius:50%;background:rgba(37,99,235,.15);border:1px solid rgba(37,99,235,.3);display:flex;align-items:center;justify-content:center;transition:background .25s,transform .25s;flex-shrink:0}
  .fnd-card:hover .fnd-arrow{background:#2563EB;transform:rotate(45deg)}

  /* Bottom accent line */
  .fnd-line{position:absolute;bottom:0;left:50%;translate:-50% 0;height:2px;width:0;border-radius:999px;background:linear-gradient(90deg,transparent,#2563EB,transparent);transition:width .5s ease}
  .fnd-card:hover .fnd-line{width:70%}

  /* Skeleton */
  .fnd-sk{background:linear-gradient(90deg,rgba(255,255,255,.04) 25%,rgba(255,255,255,.07) 50%,rgba(255,255,255,.04) 75%);background-size:200% 100%;animation:shimmer 1.6s infinite;border-radius:12px}

  /* ── Modal ── */
  .fnd-overlay{position:fixed;inset:0;z-index:50;background:rgba(8,10,15,.82);backdrop-filter:blur(12px);display:flex;align-items:center;justify-content:center;padding:16px;animation:overlayIn .3s ease both}
  .fnd-modal{background:linear-gradient(160deg,#111827 0%,#0C1020 100%);border-radius:24px;max-width:480px;width:100%;max-height:90vh;overflow-y:auto;border:1px solid rgba(255,255,255,.08);box-shadow:0 60px 120px -20px rgba(0,0,0,.8),0 0 0 1px rgba(59,130,246,.12);animation:modalIn .38s cubic-bezier(.22,1,.36,1) both;scrollbar-width:thin;scrollbar-color:rgba(37,99,235,.3) transparent}
  .fnd-modal::-webkit-scrollbar{width:4px}
  .fnd-modal::-webkit-scrollbar-thumb{background:rgba(37,99,235,.3);border-radius:4px}

  /* Loader dots */
  .fnd-loader{display:flex;justify-content:center;align-items:center;gap:.4rem;padding:5rem 0}
  .fnd-ldot-bounce{width:8px;height:8px;border-radius:50%;background:rgba(59,130,246,.5);animation:bounce .9s ease infinite}
  .fnd-ldot-bounce:nth-child(2){animation-delay:.15s}
  .fnd-ldot-bounce:nth-child(3){animation-delay:.3s}

  /* Accent line */
  .fnd-accent-line{display:block;height:3px;width:48px;background:linear-gradient(90deg,#2563EB,#60A5FA);border-radius:2px;margin-top:14px;animation:lineGrow .9s cubic-bezier(.22,1,.36,1) .3s both;transform-origin:left}
`;

/* ─── Reveal hook ─── */
function useReveal() {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { el.classList.add("in"); obs.disconnect(); } },
      { threshold: 0.05 }
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
  return <section ref={ref} className={`fnd-reveal ${className}`} style={style}>{children}</section>;
};

/* ─── Skeleton ─── */
const SkeletonCard = () => (
  <div style={{ borderRadius: 28, overflow: "hidden", background: "linear-gradient(160deg,#111827,#0C1020)", border: "1px solid rgba(255,255,255,.05)" }}>
    <div className="fnd-sk" style={{ height: 300 }} />
    <div style={{ padding: "16px 20px 22px" }}>
      {[55, 85, 65, 45].map((w, i) => (
        <div key={i} className="fnd-sk" style={{ height: i === 1 ? 26 : 10, marginBottom: 10, width: `${w}%` }} />
      ))}
    </div>
  </div>
);

/* ══════════════════════ MAIN ══════════════════════ */
const FoundersPage = () => {
  const [founders, setFounders] = useState<Founder[]>([]);
  const [selected, setSelected] = useState<Founder | null>(null);
  const [loading, setLoading] = useState(true);

  /* Inject styles */
  useEffect(() => {
    const id = "rk-founders-v1";
    if (!document.getElementById(id)) {
      const s = document.createElement("style");
      s.id = id; s.textContent = STYLES;
      document.head.appendChild(s);
    }
  }, []);

  useEffect(() => {
    supabase.from("founder_profiles").select("*").eq("active", true).order("display_order")
      .then(({ data }) => { setFounders((data as unknown as Founder[]) || []); setLoading(false); });
  }, []);

  /* Lock scroll when modal open */
  useEffect(() => {
    document.body.style.overflow = selected ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [selected]);

  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif", background: "#080A0F", overflowX: "hidden" }}>

      {/* ══ HERO ══ */}
      <section style={{ minHeight: "56vh", position: "relative", display: "flex", alignItems: "flex-end" }}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg,#080A0F 0%,#0C1020 40%,#0d1630 100%)" }} />
        <div className="fnd-dots" style={{ position: "absolute", inset: 0 }} />

        {/* BG wordmark */}
        <div style={{
          position: "absolute", top: "50%", right: "4%", transform: "translateY(-50%)",
          fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900,
          fontSize: "clamp(7rem,20vw,18rem)", lineHeight: 1,
          color: "rgba(255,255,255,.018)", userSelect: "none", pointerEvents: "none", letterSpacing: ".04em",
        }}>FOUND</div>

        {/* Left accent bar */}
        <div style={{ position: "absolute", left: 0, top: "20%", bottom: "20%", width: 2, background: "linear-gradient(to bottom,transparent,#2563EB 30%,#60A5FA 70%,transparent)", opacity: .6 }} />
        {/* Radial glow */}
        <div style={{ position: "absolute", top: "30%", right: "20%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle,rgba(37,99,235,.1) 0%,transparent 65%)", pointerEvents: "none" }} />

        {/* Spinning badge */}
        <div style={{ position: "absolute", top: "8%", right: "5%", opacity: .22, zIndex: 2 }}>
          <svg style={{ animation: "spin 22s linear infinite" }} width="110" height="110" viewBox="0 0 120 120">
            <path id="fpc" fill="none" d="M60,13 a47,47 0 1,1 -0.01,0" />
            <text style={{ fill: "#60A5FA", fontSize: 10, fontWeight: 700, letterSpacing: 3.5, fontFamily: "'Syne',sans-serif" }}>
              <textPath href="#fpc">RAIDKHALID & CO. · FOUNDERS · PH · </textPath>
            </text>
          </svg>
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#2563EB,#60A5FA)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 0 7px rgba(37,99,235,.15)" }}>
            <Star size={14} color="#fff" fill="#fff" />
          </div>
        </div>

        <div className="container mx-auto" style={{ padding: "120px 24px 64px", position: "relative", zIndex: 3 }}>
          <div className="fnd-label fnd-a-in fnd-d1" style={{ color: "#60A5FA", marginBottom: 16 }}>
            <span className="fnd-ldot" /> The Leadership
          </div>
          <h1 className="fnd-disp fnd-a-up fnd-d2" style={{ fontSize: "clamp(4rem,12vw,9rem)", color: "#fff", marginBottom: 6 }}>Our</h1>
          <h1 className="fnd-disp fnd-a-up fnd-d3" style={{ fontSize: "clamp(4rem,12vw,9rem)", color: "#2563EB", marginBottom: 20, textShadow: "0 0 80px rgba(37,99,235,.3)" }}>Founders</h1>
          <p className="fnd-a-up fnd-d4" style={{ fontSize: "clamp(.9rem,1.5vw,1rem)", color: "rgba(255,255,255,.4)", lineHeight: 1.9, maxWidth: "360px", fontStyle: "italic", borderLeft: "2px solid rgba(37,99,235,.5)", paddingLeft: 16 }}>
            The visionaries behind RaidKhalid &amp; Co. — building the brand from the ground up.
          </p>

          {!loading && founders.length > 0 && (
            <div className="fnd-a-up fnd-d5" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 28 }}>
              {[{ label: "Founders", val: founders.length }].map(({ label, val }) => (
                <div key={label} style={{ padding: "10px 20px", borderRadius: 999, background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.09)", display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: "1.4rem", color: "#60A5FA", lineHeight: 1 }}>{val}</span>
                  <span style={{ fontFamily: "'Syne',sans-serif", fontSize: "10px", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "rgba(255,255,255,.35)" }}>{label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 80, background: "linear-gradient(to top,#080A0F,transparent)", pointerEvents: "none" }} />
      </section>

      {/* ══ TICKER ══ */}
      <div style={{ background: "#2563EB", overflow: "hidden", padding: "13px 0", borderTop: "1px solid rgba(255,255,255,.08)" }}>
        <div className="fnd-ticker-row">
          {Array.from({ length: 2 }).flatMap((_, oi) =>
            ["RAIDKHALID & CO.", "MEET THE FOUNDERS", "VISIONARIES", "LEADERSHIP TEAM", "PH BASKETBALL BRAND", "BUILT FROM THE GROUND UP"].map((t, i) => (
              <span key={`${oi}-${i}`} style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "13px", fontWeight: 700, letterSpacing: ".22em", color: "rgba(255,255,255,.82)", whiteSpace: "nowrap", padding: "0 28px" }}>
                {t} <span style={{ color: "rgba(255,255,255,.28)" }}>●</span>
              </span>
            ))
          )}
        </div>
      </div>

      {/* ══ FOUNDERS GRID ══ */}
      <Reveal style={{ background: "#080A0F", paddingTop: "72px", paddingBottom: "96px", position: "relative", overflow: "hidden" }}>
        <div className="fnd-dots" style={{ position: "absolute", inset: 0 }} />
        <div style={{ position: "absolute", top: "15%", left: "-8%", width: 520, height: 520, borderRadius: "50%", background: "radial-gradient(circle,rgba(37,99,235,.07) 0%,transparent 68%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "10%", right: "-6%", width: 380, height: 380, borderRadius: "50%", background: "radial-gradient(circle,rgba(96,165,250,.04) 0%,transparent 68%)", pointerEvents: "none" }} />

        <div className="container mx-auto" style={{ padding: "0 24px", position: "relative", zIndex: 1 }}>
          {/* Section heading */}
          <div style={{ marginBottom: 40, display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div className="fnd-label" style={{ color: "#60A5FA", marginBottom: 12 }}>
                <span className="fnd-ldot" /> Leadership
              </div>
              <h2 className="fnd-disp" style={{ fontSize: "clamp(2.4rem,5vw,4rem)", color: "#fff" }}>
                Meet The <span style={{ color: "#2563EB" }}>Team</span>
              </h2>
            </div>
            {!loading && (
              <span style={{ fontFamily: "'Syne',sans-serif", fontSize: "11px", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "rgba(255,255,255,.22)", alignSelf: "flex-end", paddingBottom: 4 }}>
                {founders.length} {founders.length === 1 ? "founder" : "founders"}
              </span>
            )}
          </div>

          {loading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 20 }}>
              {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : founders.length === 0 ? (
            <div style={{ textAlign: "center", padding: "80px 0" }}>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "6rem", fontWeight: 900, color: "rgba(255,255,255,.04)", marginBottom: 12 }}>—</div>
              <p className="fnd-disp" style={{ fontSize: "1.6rem", color: "rgba(255,255,255,.25)" }}>No Founders Added Yet</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 20 }}>
              {founders.map((founder, i) => (
                <button
                  key={founder.id}
                  className="fnd-card"
                  onClick={() => setSelected(founder)}
                  style={{ animationDelay: `${(i % 6) * 0.07}s` }}
                >
                  {/* Photo */}
                  <div className="fnd-photo">
                    {founder.image_url ? (
                      <img src={founder.image_url} alt={founder.name} loading="lazy" />
                    ) : (
                      <div className="fnd-photo-placeholder">
                        <div className="fnd-arc-wrap">
                          <div className="fnd-arc-bg" />
                          <div className="fnd-arc-letter">{founder.name?.charAt(0)}</div>
                          <svg className="fnd-arc-svg" viewBox="0 0 112 112" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ position: "absolute", inset: -8, width: "calc(100% + 16px)", height: "calc(100% + 16px)" }}>
                            <circle cx="56" cy="56" r="52" stroke="rgba(59,130,246,.3)" strokeWidth="1.2" strokeDasharray="55 272" strokeLinecap="round" />
                          </svg>
                        </div>
                      </div>
                    )}
                    <div className="fnd-vignette" />
                    <div className="fnd-side-glow" />
                    <div className="fnd-shine" />
                    <div className="fnd-cut" />
                  </div>

                  {/* Badges */}
                  {founder.role && <div className="fnd-role-badge">{founder.role}</div>}
                  <div className="fnd-star-badge">
                    <Star size={14} color="#60A5FA" fill="rgba(96,165,250,.3)" />
                  </div>

                  {/* Body */}
                  <div className="fnd-body">
                    <div className="fnd-name">{founder.name}</div>
                    <div className="fnd-brand">RaidKhalid &amp; Co.</div>
                    {founder.bio && <p className="fnd-bio">{founder.bio}</p>}
                    <div className="fnd-footer">
                      <span className="fnd-cta">View Profile</span>
                      <div className="fnd-arrow">
                        <ArrowUpRight size={14} color="#60A5FA" />
                      </div>
                    </div>
                  </div>

                  <div className="fnd-line" />
                </button>
              ))}
            </div>
          )}
        </div>
      </Reveal>

      {/* ══ ETHOS BAND ══ */}
      <Reveal style={{ background: "#0C0F18", padding: "72px 0", borderTop: "1px solid rgba(255,255,255,.04)", position: "relative", overflow: "hidden" }}>
        <div className="fnd-lines" style={{ position: "absolute", inset: 0 }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(108deg,transparent 46%,rgba(37,99,235,.04) 46%,rgba(37,99,235,.04) 52%,transparent 52%)", pointerEvents: "none" }} />
        <div className="container mx-auto" style={{ padding: "0 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px 80px", alignItems: "center", position: "relative", zIndex: 1 }}>
          <div>
            <div className="fnd-label" style={{ color: "#60A5FA", marginBottom: 16 }}>
              <span className="fnd-ldot" /> Our Foundation
            </div>
            <h2 className="fnd-disp" style={{ fontSize: "clamp(2.4rem,5vw,4rem)", color: "#fff", marginBottom: 6 }}>
              Built with<br /><span style={{ color: "#2563EB" }}>Purpose.</span>
            </h2>
            <span className="fnd-accent-line" />
            <p style={{ marginTop: 24, fontSize: "14.5px", color: "rgba(255,255,255,.38)", lineHeight: 1.9, maxWidth: 380, fontFamily: "'DM Sans',sans-serif" }}>
              Every decision we make traces back to the vision our founders set in motion. RaidKhalid &amp; Co. was built on passion for the game and a relentless drive to elevate Philippine basketball.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              { label: "Vision-Led", desc: "Every initiative is tied directly to a long-term vision for PH basketball." },
              { label: "Community First", desc: "Built from the ground up with players, fans, and partners in mind." },
              { label: "Brand Integrity", desc: "Authenticity and identity are non-negotiable at every level." },
              { label: "Relentless Growth", desc: "From concept to execution — we scale with purpose and precision." },
            ].map(({ label, desc }) => (
              <div key={label} style={{ padding: "18px 16px", borderRadius: 16, background: "rgba(255,255,255,.025)", border: "1px solid rgba(255,255,255,.06)" }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#2563EB", marginBottom: 10 }} />
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "10px", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "#60A5FA", marginBottom: 6 }}>{label}</div>
                <p style={{ fontSize: "12px", color: "rgba(255,255,255,.32)", lineHeight: 1.75, fontFamily: "'DM Sans',sans-serif" }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      {/* ══ MODAL ══ */}
      {selected && (
        <div className="fnd-overlay" onClick={() => setSelected(null)}>
          <div className="fnd-modal" onClick={(e) => e.stopPropagation()}>
            {/* Hero image */}
            <div style={{ position: "relative", height: 260, flexShrink: 0 }}>
              {selected.image_url ? (
                <img src={selected.image_url} alt={selected.name} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top", borderRadius: "24px 24px 0 0" }} />
              ) : (
                <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg,#111827,#1e3a8a)", borderRadius: "24px 24px 0 0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "7rem", fontWeight: 900, color: "rgba(96,165,250,.09)" }}>{selected.name?.charAt(0)}</span>
                </div>
              )}
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top,rgba(8,10,18,.96) 0%,rgba(8,10,18,.3) 55%,transparent 100%)", borderRadius: "24px 24px 0 0" }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(270deg,rgba(37,99,235,.14) 0%,transparent 50%)", borderRadius: "24px 24px 0 0" }} />

              {/* Close button */}
              <button
                onClick={() => setSelected(null)}
                style={{ position: "absolute", top: 14, right: 14, width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,.09)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,.1)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "background .2s" }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(239,68,68,.3)")}
                onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,.09)")}
              >
                <X size={16} color="#fff" />
              </button>

              <div style={{ position: "absolute", bottom: 20, left: 22, right: 22 }}>
                {selected.role && (
                  <span style={{ display: "inline-block", marginBottom: 8, padding: "4px 11px", borderRadius: 7, background: "rgba(8,10,18,.7)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,.1)", fontFamily: "'Syne',sans-serif", fontSize: "9px", fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: "rgba(255,255,255,.6)" }}>
                    {selected.role}
                  </span>
                )}
                <h2 className="fnd-disp" style={{ fontSize: "clamp(2rem,7vw,2.8rem)", color: "#fff" }}>{selected.name}</h2>
                <p style={{ fontFamily: "'Syne',sans-serif", fontSize: "9px", fontWeight: 700, letterSpacing: ".2em", color: "#3B82F6", textTransform: "uppercase", marginTop: 3 }}>RaidKhalid &amp; Co.</p>
              </div>
            </div>

            {/* Body */}
            <div style={{ padding: "24px 22px 28px" }}>
              {selected.bio && (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <Star size={12} color="#60A5FA" />
                    <span style={{ fontFamily: "'Syne',sans-serif", fontSize: "9px", fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: "rgba(255,255,255,.3)" }}>About</span>
                  </div>
                  <p style={{ fontFamily: "'DM Sans',sans-serif", color: "rgba(255,255,255,.45)", lineHeight: 1.85, fontSize: "13.5px" }}>{selected.bio}</p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FoundersPage;