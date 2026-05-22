import { useState, useEffect, useRef } from "react";
import { X, ArrowUpRight, Trophy, Star, Search, ChevronRight, Users, Shield, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

/* ─── Types ─── */
interface Player {
  id: string;
  name: string;
  jersey_number?: number;
  position?: string;
  image_url?: string;
  stats?: {
    ppg?: number; rpg?: number; apg?: number;
    spg?: number; bpg?: number;
    fgp?: number; tpp?: number; ftp?: number;
  };
  bio?: string;
  achievements?: string[];
  active: boolean;
  display_order?: number;
}

/* ─── Styles ─── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800;900&family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap');

  :root {
    --void:#080A0F; --deep:#0C0F18; --surface:#111520; --panel:#161B28;
    --edge:rgba(255,255,255,0.06); --edge2:rgba(255,255,255,0.11);
    --blue:#2563EB; --blue-hi:#3B82F6; --blue-lo:#1D4ED8;
    --gold:#F0A500;
    --light:#F7F8FA; --white:#FFFFFF;
  }
  *,*::before,*::after{box-sizing:border-box}

  @keyframes heroIn   {from{opacity:0;transform:scale(1.05)} to{opacity:1;transform:scale(1)}}
  @keyframes fadeUp   {from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)}}
  @keyframes fadeIn   {from{opacity:0} to{opacity:1}}
  @keyframes shimmer  {0%{background-position:-200% 0} 100%{background-position:200% 0}}
  @keyframes spin     {to{transform:rotate(360deg)}}
  @keyframes dot      {0%,100%{opacity:.3} 50%{opacity:.9}}
  @keyframes ticker   {from{transform:translateX(0)} to{transform:translateX(-50%)}}
  @keyframes glow     {0%,100%{box-shadow:0 0 0 0 rgba(37,99,235,.5)} 50%{box-shadow:0 0 0 10px rgba(37,99,235,0)}}
  @keyframes barFill  {from{transform:scaleX(0)} to{transform:scaleX(1)}}
  @keyframes modalIn  {from{opacity:0;transform:scale(.96) translateY(14px)} to{opacity:1;transform:scale(1) translateY(0)}}
  @keyframes overlayIn{from{opacity:0} to{opacity:1}}
  @keyframes numberUp {from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)}}
  @keyframes cardIn   {from{opacity:0;transform:translateY(30px) scale(.97)} to{opacity:1;transform:none}}
  @keyframes lineGrow {from{transform:scaleX(0)} to{transform:scaleX(1)}}

  .a-hero{animation:heroIn 1.2s cubic-bezier(.22,1,.36,1) both}
  .a-up  {animation:fadeUp .8s cubic-bezier(.22,1,.36,1) both}
  .a-in  {animation:fadeIn .6s ease both}
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

  /* Patterns */
  .dots-dk{background-image:radial-gradient(circle,rgba(255,255,255,.04) 1px,transparent 1px);background-size:26px 26px}
  .lines-dk{background-image:linear-gradient(rgba(255,255,255,.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.02) 1px,transparent 1px);background-size:48px 48px}

  /* ── PLAYER CARD ── */
  .epc{position:relative;border-radius:28px;overflow:hidden;background:linear-gradient(160deg,#111827 0%,#0C1020 100%);border:1px solid rgba(255,255,255,.07);cursor:pointer;transition:transform .42s cubic-bezier(.22,1,.36,1),box-shadow .42s ease,border-color .38s ease;display:flex;flex-direction:column;animation:cardIn .7s cubic-bezier(.22,1,.36,1) both}
  .epc:hover{transform:translateY(-12px) scale(1.02);box-shadow:0 48px 96px -20px rgba(0,0,0,.7),0 0 0 1px rgba(59,130,246,.3),0 0 60px -20px rgba(37,99,235,.25);border-color:rgba(59,130,246,.32)}
  .epc-photo{position:relative;height:clamp(280px,30vw,360px);overflow:hidden;flex-shrink:0}
  .epc-photo img{width:100%;height:100%;object-fit:cover;object-position:center top;transition:transform .85s cubic-bezier(.22,1,.36,1)}
  .epc:hover .epc-photo img{transform:scale(1.08)}
  .epc-vignette{position:absolute;inset:0;background:radial-gradient(ellipse 90% 80% at 50% 100%,rgba(8,10,18,.95) 0%,rgba(8,10,18,.3) 55%,transparent 100%)}
  .epc-side-glow{position:absolute;inset:0;background:linear-gradient(270deg,rgba(37,99,235,.18) 0%,transparent 45%);opacity:0;transition:opacity .4s ease}
  .epc:hover .epc-side-glow{opacity:1}
  .epc-shine{position:absolute;inset:0;background:linear-gradient(125deg,rgba(255,255,255,.06) 0%,transparent 40%);opacity:0;transition:opacity .4s ease}
  .epc:hover .epc-shine{opacity:1}
  .epc-cut{position:absolute;bottom:-1px;left:0;right:0;height:80px;background:linear-gradient(160deg,#111827 0%,#0C1020 100%);clip-path:polygon(0 60%,100% 0%,100% 100%,0% 100%)}
  .epc-num{position:absolute;top:-10px;right:-6px;font-family:'Barlow Condensed',sans-serif;font-size:clamp(5rem,9vw,8rem);font-weight:900;line-height:1;color:rgba(255,255,255,.04);pointer-events:none;transition:color .4s ease;z-index:1}
  .epc:hover .epc-num{color:rgba(59,130,246,.07)}
  .epc-pos-badge{position:absolute;top:14px;left:14px;z-index:4;padding:5px 13px;border-radius:8px;background:rgba(8,10,18,.7);backdrop-filter:blur(14px);border:1px solid rgba(255,255,255,.1);font-family:'Syne',sans-serif;font-size:9px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:rgba(255,255,255,.65)}
  .epc-jersey-badge{position:absolute;top:14px;right:14px;z-index:4;width:40px;height:40px;border-radius:10px;background:linear-gradient(135deg,rgba(37,99,235,.9),rgba(29,78,216,.95));backdrop-filter:blur(10px);border:1px solid rgba(59,130,246,.45);display:flex;align-items:center;justify-content:center;font-family:'Barlow Condensed',sans-serif;font-size:1.25rem;font-weight:900;color:#fff;box-shadow:0 4px 18px -4px rgba(37,99,235,.6)}
  .epc-body{padding:0 20px 22px;position:relative;z-index:2;margin-top:-38px;flex:1;display:flex;flex-direction:column}
  .epc-name{font-family:'Barlow Condensed',sans-serif;font-weight:900;font-size:clamp(1.7rem,3.5vw,2.2rem);line-height:.92;color:#fff;letter-spacing:-.01em;margin-bottom:4px}
  .epc-brand{font-family:'Syne',sans-serif;font-size:9px;font-weight:700;letter-spacing:.2em;color:#3B82F6;text-transform:uppercase;margin-bottom:16px}
  .epc-statbar-wrap{display:flex;flex-direction:column;gap:9px;margin-bottom:16px}
  .epc-statbar{display:flex;align-items:center;gap:10px}
  .epc-statbar-label{font-family:'Syne',sans-serif;font-size:8px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.3);width:26px;flex-shrink:0}
  .epc-statbar-track{flex:1;height:3px;border-radius:2px;background:rgba(255,255,255,.07);overflow:hidden}
  .epc-statbar-fill{height:100%;border-radius:2px;background:linear-gradient(90deg,#2563EB,#60A5FA);transform:scaleX(0);transform-origin:left;transition:transform .9s cubic-bezier(.22,1,.36,1)}
  .epc:hover .epc-statbar-fill{transform:scaleX(1)}
  .epc-statbar-val{font-family:'Barlow Condensed',sans-serif;font-size:1rem;font-weight:800;color:#fff;width:28px;text-align:right;flex-shrink:0;line-height:1}
  .epc-footer{display:flex;align-items:center;justify-content:space-between;padding-top:14px;border-top:1px solid rgba(255,255,255,.05);margin-top:auto}
  .epc-cta{display:inline-flex;align-items:center;gap:6px;font-family:'Syne',sans-serif;font-size:9px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#3B82F6}
  .epc-arrow{width:32px;height:32px;border-radius:50%;background:rgba(37,99,235,.15);border:1px solid rgba(37,99,235,.3);display:flex;align-items:center;justify-content:center;transition:background .25s,transform .25s;flex-shrink:0}
  .epc:hover .epc-arrow{background:var(--blue);transform:rotate(45deg)}

  /* ── MODAL ── */
  .modal-overlay{position:fixed;inset:0;z-index:50;background:rgba(8,10,15,.82);backdrop-filter:blur(12px);display:flex;align-items:center;justify-content:center;padding:16px;animation:overlayIn .3s ease both}
  .modal-box{background:linear-gradient(160deg,#111827 0%,#0C1020 100%);border-radius:24px;max-width:520px;width:100%;max-height:90vh;overflow-y:auto;border:1px solid rgba(255,255,255,.08);box-shadow:0 60px 120px -20px rgba(0,0,0,.8),0 0 0 1px rgba(59,130,246,.12);animation:modalIn .38s cubic-bezier(.22,1,.36,1) both;scrollbar-width:thin;scrollbar-color:rgba(37,99,235,.3) transparent}
  .modal-box::-webkit-scrollbar{width:4px}
  .modal-box::-webkit-scrollbar-track{background:transparent}
  .modal-box::-webkit-scrollbar-thumb{background:rgba(37,99,235,.3);border-radius:4px}
  .modal-stat-box{text-align:center;padding:14px 8px}
  .modal-stat-box .val{font-family:'Barlow Condensed',sans-serif;font-size:1.7rem;font-weight:900;color:#fff;line-height:1;animation:numberUp .5s cubic-bezier(.22,1,.36,1) both}
  .modal-stat-box .lbl{font-family:'Syne',sans-serif;font-size:8px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:rgba(255,255,255,.3);margin-top:4px}

  /* Search */
  .search-wrap{position:relative;flex:1;min-width:0}
  .search-input{width:100%;padding:13px 16px 13px 44px;border-radius:14px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);color:#fff;font-family:'DM Sans',sans-serif;font-size:14px;outline:none;transition:border-color .2s,background .2s}
  .search-input::placeholder{color:rgba(255,255,255,.22)}
  .search-input:focus{border-color:rgba(37,99,235,.5);background:rgba(37,99,235,.06)}
  .search-icon{position:absolute;left:14px;top:50%;transform:translateY(-50%);pointer-events:none}

  .pos-pill{padding:8px 18px;border-radius:999px;font-family:'Syne',sans-serif;font-weight:700;font-size:11px;letter-spacing:.06em;text-transform:uppercase;cursor:pointer;transition:transform .2s,background .2s,box-shadow .2s,border-color .2s;border:1.5px solid rgba(255,255,255,.1);background:rgba(255,255,255,.03);color:rgba(255,255,255,.55)}
  .pos-pill:hover{transform:translateY(-2px);border-color:rgba(59,130,246,.4);color:rgba(255,255,255,.8)}
  .pos-pill.active{background:rgba(37,99,235,.9);border-color:#2563EB;color:#fff;box-shadow:0 6px 20px -6px rgba(37,99,235,.55)}

  .sk{background:linear-gradient(90deg,rgba(255,255,255,.04) 25%,rgba(255,255,255,.07) 50%,rgba(255,255,255,.04) 75%);background-size:200% 100%;animation:shimmer 1.6s infinite;border-radius:12px}

  .stats-grid-modal{display:grid;grid-template-columns:repeat(5,1fr);background:rgba(255,255,255,.03);border-radius:16px;border:1px solid rgba(255,255,255,.06);overflow:hidden}
  .stats-grid-modal .modal-stat-box{border-right:1px solid rgba(255,255,255,.06)}
  .stats-grid-modal .modal-stat-box:last-child{border-right:none}
  .shoot-grid-modal{display:grid;grid-template-columns:repeat(3,1fr);background:rgba(255,255,255,.03);border-radius:16px;border:1px solid rgba(255,255,255,.06);overflow:hidden}
  .shoot-grid-modal .modal-stat-box{border-right:1px solid rgba(255,255,255,.06)}
  .shoot-grid-modal .modal-stat-box:last-child{border-right:none}

  /* ── Position spotlight cards ── */
  .pos-spotlight{padding:20px 22px;border-radius:18px;background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.06);transition:border-color .3s,background .3s,transform .3s}
  .pos-spotlight:hover{border-color:rgba(59,130,246,.22);background:rgba(37,99,235,.05);transform:translateY(-4px)}

  /* ── Accent line ── */
  .accent-line{display:block;height:3px;width:48px;background:linear-gradient(90deg,#2563EB,#60A5FA);border-radius:2px;margin-top:14px;animation:lineGrow .9s cubic-bezier(.22,1,.36,1) .3s both;transform-origin:left}
`;

/* ─── Hooks ─── */
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
  children: React.ReactNode; className?: string; style?: React.CSSProperties
}) => {
  const ref = useReveal() as React.RefObject<HTMLElement>;
  return <section ref={ref} className={`reveal ${className}`} style={style}>{children}</section>;
};

/* ─── Sub-components ─── */
const ModalStatBox = ({ label, value, pct = false, delay = 0 }: {
  label: string; value?: number | null; pct?: boolean; delay?: number
}) => (
  <div className="modal-stat-box">
    <p className="val" style={{ animationDelay: `${delay}s` }}>
      {value != null ? `${value}${pct ? "%" : ""}` : "—"}
    </p>
    <p className="lbl">{label}</p>
  </div>
);

const POSITIONS = ["All", "PG", "SG", "SF", "PF", "C"];
const STAT_DEFS = [
  { key: "ppg", label: "PPG", max: 40 },
  { key: "rpg", label: "RPG", max: 20 },
  { key: "apg", label: "APG", max: 15 },
];

const SkeletonCard = () => (
  <div style={{ borderRadius: 28, overflow: "hidden", background: "linear-gradient(160deg,#111827,#0C1020)", border: "1px solid rgba(255,255,255,.05)" }}>
    <div className="sk" style={{ height: 320 }} />
    <div style={{ padding: "16px 20px 22px" }}>
      {[55, 85, 65].map((w, i) => (
        <div key={i} className="sk" style={{ height: i === 0 ? 10 : i === 1 ? 28 : 10, marginBottom: 10, width: `${w}%` }} />
      ))}
    </div>
  </div>
);

/* Position spotlight metadata */
const POS_META: Record<string, { icon: React.ElementType; color: string; role: string }> = {
  PG: { icon: Zap,     color: "#3B82F6", role: "Floor General" },
  SG: { icon: Star,    color: "#60A5FA", role: "Perimeter Scorer" },
  SF: { icon: Shield,  color: "#93C5FD", role: "Two-Way Wing" },
  PF: { icon: Users,   color: "#BFDBFE", role: "Power Forward" },
  C:  { icon: Trophy,  color: "#F0A500", role: "Anchor" },
};

/* ═══════════════════════ MAIN ═══════════════════════ */
const PlayersPage = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [selected, setSelected] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activePos, setActivePos] = useState("All");

  useEffect(() => {
    const id = "rk-players-v3";
    if (!document.getElementById(id)) {
      const s = document.createElement("style");
      s.id = id;
      s.textContent = STYLES;
      document.head.appendChild(s);
    }
  }, []);

  useEffect(() => {
    supabase
      .from("player_profiles")
      .select("*")
      .eq("active", true)
      .order("display_order")
      .then(({ data }) => {
        setPlayers((data as unknown as Player[]) || []);
        setLoading(false);
      });
  }, []);

  const filtered = players.filter((p) => {
    const matchPos = activePos === "All" || p.position?.toUpperCase() === activePos;
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.position?.toLowerCase().includes(search.toLowerCase());
    return matchPos && matchSearch;
  });

  /* Active positions in roster */
  const rosterPositions = [...new Set(players.map(p => p.position?.toUpperCase()).filter(Boolean))] as string[];

  useEffect(() => {
    document.body.style.overflow = selected ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [selected]);

  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif", background: "#080A0F", overflowX: "hidden" }}>

      {/* ══ HERO ══ */}
      <section style={{ minHeight: "56vh", position: "relative", display: "flex", alignItems: "flex-end" }}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg,#080A0F 0%,#0C1020 40%,#0d1630 100%)" }} />
        <div className="dots-dk" style={{ position: "absolute", inset: 0 }} />

        <div style={{
          position: "absolute", top: "50%", right: "6%", transform: "translateY(-50%)",
          fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900,
          fontSize: "clamp(8rem,22vw,20rem)", lineHeight: 1,
          color: "rgba(255,255,255,.018)", userSelect: "none", pointerEvents: "none", letterSpacing: ".04em",
        }}>SQUAD</div>

        <div style={{ position: "absolute", left: 0, top: "20%", bottom: "20%", width: 2, background: "linear-gradient(to bottom,transparent,#2563EB 30%,#60A5FA 70%,transparent)", opacity: .6 }} />
        <div style={{ position: "absolute", top: "30%", right: "20%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle,rgba(37,99,235,.1) 0%,transparent 65%)", pointerEvents: "none" }} />

        {/* Spinning badge */}
        <div style={{ position: "absolute", top: "8%", right: "5%", opacity: .22, zIndex: 2 }}>
          <svg style={{ animation: "spin 22s linear infinite" }} width="110" height="110" viewBox="0 0 120 120">
            <path id="pc" fill="none" d="M60,13 a47,47 0 1,1 -0.01,0" />
            <text style={{ fill: "#60A5FA", fontSize: 10, fontWeight: 700, letterSpacing: 3.5, fontFamily: "'Syne',sans-serif" }}>
              <textPath href="#pc">FRANCHISE PLAYERS · RAIDKHALID · PH · </textPath>
            </text>
          </svg>
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#2563EB,#60A5FA)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 0 7px rgba(37,99,235,.15)" }}>
            <Trophy size={14} color="#fff" />
          </div>
        </div>

        <div className="container mx-auto" style={{ padding: "120px 24px 64px", position: "relative", zIndex: 3 }}>
          <div className="label-tag a-in d1" style={{ color: "#60A5FA", marginBottom: 16 }}>
            <span className="label-dot" /> The Roster
          </div>
          <h1 className="disp a-up d2" style={{ fontSize: "clamp(4rem,12vw,9rem)", color: "#fff", marginBottom: 6 }}>Franchise</h1>
          <h1 className="disp a-up d3" style={{ fontSize: "clamp(4rem,12vw,9rem)", color: "#2563EB", marginBottom: 20, textShadow: "0 0 80px rgba(37,99,235,.3)" }}>Players</h1>
          <p className="a-up d4" style={{ fontSize: "clamp(.9rem,1.5vw,1rem)", color: "rgba(255,255,255,.4)", lineHeight: 1.9, maxWidth: "360px", fontStyle: "italic", borderLeft: "2px solid rgba(37,99,235,.5)", paddingLeft: 16 }}>
            Meet the athletes who carry the RaidKhalid &amp; Co. banner.
          </p>

          {!loading && players.length > 0 && (
            <div className="a-up d5" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 28 }}>
              {[
                { label: "Total Players", val: players.length },
                { label: "Positions", val: rosterPositions.length },
              ].map(({ label, val }) => (
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
        <div className="ticker-row">
          {Array.from({ length: 2 }).flatMap((_, oi) =>
            ["RAIDKHALID & CO.", "OFFICIAL BASKETBALL BRAND", "FRANCHISE PLAYERS", "ELEVATE THE GAME", "PH BASKETBALL", "TOP ROSTER"].map((t, i) => (
              <span key={`${oi}-${i}`} style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "13px", fontWeight: 700, letterSpacing: ".22em", color: "rgba(255,255,255,.82)", whiteSpace: "nowrap", padding: "0 28px" }}>
                {t} <span style={{ color: "rgba(255,255,255,.28)" }}>●</span>
              </span>
            ))
          )}
        </div>
      </div>

      {/* ══ POSITION SPOTLIGHTS ══ */}
      {!loading && rosterPositions.length > 0 && (
        <Reveal style={{ background: "#0C0F18", padding: "56px 0", borderBottom: "1px solid rgba(255,255,255,.05)" }}>
          <div className="container mx-auto" style={{ padding: "0 24px" }}>
            <div style={{ marginBottom: 24 }}>
              <div className="label-tag" style={{ color: "#60A5FA", marginBottom: 10 }}>
                <span className="label-dot" /> By Position
              </div>
              <h2 className="disp" style={{ fontSize: "clamp(1.8rem,3.5vw,2.6rem)", color: "#fff" }}>
                Squad <span style={{ color: "#2563EB" }}>Breakdown</span>
              </h2>
            </div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {rosterPositions.map((pos) => {
                const meta = POS_META[pos];
                const count = players.filter(p => p.position?.toUpperCase() === pos).length;
                const Icon = meta?.icon || Star;
                return (
                  <button
                    key={pos}
                    className="pos-spotlight"
                    onClick={() => setActivePos(activePos === pos ? "All" : pos)}
                    style={{ display: "flex", alignItems: "center", gap: 14, cursor: "pointer", border: activePos === pos ? "1px solid rgba(59,130,246,.4)" : undefined, background: activePos === pos ? "rgba(37,99,235,.08)" : undefined }}
                  >
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: `rgba(${meta?.color ? "37,99,235" : "96,165,250"},.14)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon size={17} color={meta?.color || "#60A5FA"} />
                    </div>
                    <div>
                      <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: "1.2rem", color: "#fff", lineHeight: 1 }}>{pos}</div>
                      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "9px", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "rgba(255,255,255,.3)", marginTop: 2 }}>
                        {meta?.role} · {count} {count === 1 ? "player" : "players"}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </Reveal>
      )}

      {/* ══ SEARCH & FILTER ══ */}
      <div style={{ background: "#0C0F18", borderBottom: "1px solid rgba(255,255,255,.05)", position: "sticky", top: 0, zIndex: 30, backdropFilter: "blur(12px)" }}>
        <div className="container mx-auto" style={{ padding: "14px 24px", display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <div className="search-wrap">
            <Search size={15} color="rgba(255,255,255,.22)" className="search-icon" />
            <input className="search-input" placeholder="Search players, positions…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap", alignItems: "center" }}>
            {POSITIONS.map((pos) => (
              <button key={pos} className={`pos-pill${activePos === pos ? " active" : ""}`} onClick={() => setActivePos(pos)}>{pos}</button>
            ))}
          </div>
        </div>
      </div>

      {/* ══ GRID ══ */}
      <Reveal style={{ background: "#080A0F", paddingTop: "72px", paddingBottom: "96px", position: "relative", overflow: "hidden" }}>
        <div className="dots-dk" style={{ position: "absolute", inset: 0 }} />
        <div style={{ position: "absolute", top: "15%", left: "-8%", width: 520, height: 520, borderRadius: "50%", background: "radial-gradient(circle,rgba(37,99,235,.07) 0%,transparent 68%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "10%", right: "-6%", width: 380, height: 380, borderRadius: "50%", background: "radial-gradient(circle,rgba(96,165,250,.04) 0%,transparent 68%)", pointerEvents: "none" }} />

        <div className="container mx-auto" style={{ padding: "0 24px", position: "relative", zIndex: 1 }}>
          {/* Section heading */}
          <div style={{ marginBottom: 40, display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div className="label-tag" style={{ color: "#60A5FA", marginBottom: 12 }}>
                <span className="label-dot" /> Active Roster
              </div>
              <h2 className="disp" style={{ fontSize: "clamp(2.4rem,5vw,4rem)", color: "#fff" }}>
                {activePos === "All" ? "All Players" : `${activePos} Players`}
                {search && <span style={{ color: "#3B82F6" }}> · "{search}"</span>}
              </h2>
            </div>
            {!loading && (
              <span style={{ fontFamily: "'Syne',sans-serif", fontSize: "11px", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "rgba(255,255,255,.22)", alignSelf: "flex-end", paddingBottom: 4 }}>
                {filtered.length} {filtered.length === 1 ? "player" : "players"}
              </span>
            )}
          </div>

          {loading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 20 }}>
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "80px 0" }}>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "6rem", fontWeight: 900, color: "rgba(255,255,255,.04)", marginBottom: 12 }}>00</div>
              <p className="disp" style={{ fontSize: "1.6rem", color: "rgba(255,255,255,.25)", marginBottom: 8 }}>No Players Found</p>
              <p style={{ color: "rgba(255,255,255,.18)", fontSize: 13 }}>
                {search ? `No results for "${search}"` : `No ${activePos} players in the roster.`}
              </p>
              <button onClick={() => { setSearch(""); setActivePos("All"); }}
                style={{ marginTop: 24, padding: "11px 24px", borderRadius: 999, background: "rgba(37,99,235,.15)", border: "1px solid rgba(37,99,235,.3)", color: "#60A5FA", fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: ".1em", textTransform: "uppercase", cursor: "pointer" }}>
                Clear Filters
              </button>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 20 }}>
              {filtered.map((player, i) => {
                const s = player.stats || {};
                const activeDefs = STAT_DEFS.filter((d) => s[d.key as keyof typeof s] != null);
                return (
                  <button
                    key={player.id}
                    className="epc"
                    onClick={() => setSelected(player)}
                    style={{ animationDelay: `${(i % 6) * 0.07}s`, textAlign: "left", width: "100%" }}
                  >
                    <div className="epc-num">{player.jersey_number || "00"}</div>
                    <div className="epc-photo">
                      {player.image_url ? (
                        <img src={player.image_url} alt={player.name} loading="lazy" />
                      ) : (
                        <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg,#111827,#1e3a8a)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span className="disp" style={{ fontSize: "6rem", color: "rgba(96,165,250,.09)" }}>
                            #{player.jersey_number || "00"}
                          </span>
                        </div>
                      )}
                      <div className="epc-vignette" />
                      <div className="epc-side-glow" />
                      <div className="epc-shine" />
                      <div className="epc-cut" />
                    </div>

                    {player.position && <div className="epc-pos-badge">{player.position}</div>}
                    {player.jersey_number != null && <div className="epc-jersey-badge">#{player.jersey_number}</div>}

                    <div className="epc-body">
                      <div className="epc-name">{player.name}</div>
                      <div className="epc-brand">RaidKhalid &amp; Co.</div>
                      {activeDefs.length > 0 && (
                        <div className="epc-statbar-wrap">
                          {activeDefs.map((d, si) => {
                            const val = parseFloat(String(s[d.key as keyof typeof s])) || 0;
                            const pct = Math.min(val / d.max, 1);
                            return (
                              <div key={d.key} className="epc-statbar">
                                <span className="epc-statbar-label">{d.label}</span>
                                <div className="epc-statbar-track">
                                  <div className="epc-statbar-fill" style={{ width: `${pct * 100}%`, transitionDelay: `${si * 0.1}s` }} />
                                </div>
                                <span className="epc-statbar-val">{s[d.key as keyof typeof s]}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      <div className="epc-footer">
                        <span className="epc-cta">View Profile</span>
                        <div className="epc-arrow">
                          <ArrowUpRight size={14} color="#60A5FA" />
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </Reveal>

      {/* ══ FRANCHISE ETHOS BAND ══ */}
      <Reveal style={{ background: "#0C0F18", padding: "72px 0", borderTop: "1px solid rgba(255,255,255,.04)", position: "relative", overflow: "hidden" }}>
        <div className="lines-dk" style={{ position: "absolute", inset: 0 }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(108deg,transparent 46%,rgba(37,99,235,.04) 46%,rgba(37,99,235,.04) 52%,transparent 52%)", pointerEvents: "none" }} />
        <div className="container mx-auto" style={{ padding: "0 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px 80px", alignItems: "center", position: "relative", zIndex: 1 }}>
          <div>
            <div className="label-tag" style={{ color: "#60A5FA", marginBottom: 16 }}>
              <span className="label-dot" /> The Standard
            </div>
            <h2 className="disp" style={{ fontSize: "clamp(2.4rem,5vw,4rem)", color: "#fff", marginBottom: 6 }}>
              Built to<br /><span style={{ color: "#2563EB" }}>Compete.</span>
            </h2>
            <span className="accent-line" />
            <p style={{ marginTop: 24, fontSize: "14.5px", color: "rgba(255,255,255,.38)", lineHeight: 1.9, maxWidth: 380 }}>
              Every player in this roster is selected on merit, character, and the drive to be exceptional. RaidKhalid &amp; Co. doesn't just build rosters — we cultivate champions.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              { label: "Elite Scouting", desc: "Players selected through rigorous tryouts and regional networks." },
              { label: "Film Study", desc: "Every game analyzed — weaknesses found, strengths amplified." },
              { label: "Strength & Conditioning", desc: "Year-round athletic development programs for every player." },
              { label: "Mental Edge", desc: "Mindset coaching to perform under pressure, every time." },
            ].map(({ label, desc }) => (
              <div key={label} style={{ padding: "18px 16px", borderRadius: 16, background: "rgba(255,255,255,.025)", border: "1px solid rgba(255,255,255,.06)" }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#2563EB", marginBottom: 10 }} />
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "10px", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "#60A5FA", marginBottom: 6 }}>{label}</div>
                <p style={{ fontSize: "12px", color: "rgba(255,255,255,.32)", lineHeight: 1.75 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      {/* ══ MODAL ══ */}
      {selected && (() => {
        const s = selected.stats || {};
        return (
          <div className="modal-overlay" onClick={() => setSelected(null)}>
            <div className="modal-box" onClick={(e) => e.stopPropagation()}>
              <div style={{ position: "relative", height: 280, flexShrink: 0 }}>
                {selected.image_url ? (
                  <img src={selected.image_url} alt={selected.name} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top", borderRadius: "24px 24px 0 0" }} />
                ) : (
                  <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg,#111827,#1e3a8a)", borderRadius: "24px 24px 0 0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span className="disp" style={{ fontSize: "8rem", color: "rgba(96,165,250,.09)" }}>#{selected.jersey_number || "00"}</span>
                  </div>
                )}
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top,rgba(8,10,18,.96) 0%,rgba(8,10,18,.3) 55%,transparent 100%)", borderRadius: "24px 24px 0 0" }} />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(270deg,rgba(37,99,235,.14) 0%,transparent 50%)", borderRadius: "24px 24px 0 0" }} />

                <button onClick={() => setSelected(null)}
                  style={{ position: "absolute", top: 14, right: 14, width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,.09)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,.1)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "background .2s" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(239,68,68,.3)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,.09)")}>
                  <X size={16} color="#fff" />
                </button>

                <div style={{ position: "absolute", bottom: 20, left: 22, right: 22 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                    {selected.position && (
                      <span style={{ padding: "4px 11px", borderRadius: 7, background: "rgba(8,10,18,.7)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,.1)", fontFamily: "'Syne',sans-serif", fontSize: "9px", fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: "rgba(255,255,255,.6)" }}>{selected.position}</span>
                    )}
                    {selected.jersey_number != null && (
                      <span style={{ width: 36, height: 36, borderRadius: 9, background: "linear-gradient(135deg,rgba(37,99,235,.9),rgba(29,78,216,.95))", border: "1px solid rgba(59,130,246,.4)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Barlow Condensed',sans-serif", fontSize: "1.1rem", fontWeight: 900, color: "#fff" }}>#{selected.jersey_number}</span>
                    )}
                  </div>
                  <h2 className="disp" style={{ fontSize: "clamp(2rem,7vw,3rem)", color: "#fff" }}>{selected.name}</h2>
                  <p style={{ fontFamily: "'Syne',sans-serif", fontSize: "9px", fontWeight: 700, letterSpacing: ".2em", color: "#3B82F6", textTransform: "uppercase", marginTop: 3 }}>RaidKhalid &amp; Co.</p>
                </div>
              </div>

              <div style={{ padding: "24px 22px 28px" }}>
                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontFamily: "'Syne',sans-serif", fontSize: "9px", fontWeight: 700, letterSpacing: ".2em", textTransform: "uppercase", color: "rgba(255,255,255,.25)", textAlign: "center", marginBottom: 10 }}>Per Game Averages</p>
                  <div className="stats-grid-modal">
                    {[{ label: "PPG", val: s.ppg },{ label: "RPG", val: s.rpg },{ label: "APG", val: s.apg },{ label: "SPG", val: s.spg },{ label: "BPG", val: s.bpg }].map(({ label, val }, i) => (
                      <ModalStatBox key={label} label={label} value={val} delay={i * 0.06} />
                    ))}
                  </div>
                </div>
                <div style={{ marginBottom: 20 }}>
                  <p style={{ fontFamily: "'Syne',sans-serif", fontSize: "9px", fontWeight: 700, letterSpacing: ".2em", textTransform: "uppercase", color: "rgba(255,255,255,.25)", textAlign: "center", marginBottom: 10 }}>Shooting</p>
                  <div className="shoot-grid-modal">
                    {[{ label: "FG%", val: s.fgp, pct: true },{ label: "3P%", val: s.tpp, pct: true },{ label: "FT%", val: s.ftp, pct: true }].map(({ label, val, pct }, i) => (
                      <ModalStatBox key={label} label={label} value={val} pct={pct} delay={0.3 + i * 0.06} />
                    ))}
                  </div>
                </div>
                <div style={{ height: 1, background: "rgba(255,255,255,.05)", marginBottom: 18 }} />
                {selected.bio && (
                  <p style={{ color: "rgba(255,255,255,.38)", lineHeight: 1.85, fontSize: "13.5px", marginBottom: 18 }}>{selected.bio}</p>
                )}
                {selected.achievements && (selected.achievements as string[]).length > 0 && (
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                      <Trophy size={12} color="#F0A500" />
                      <span style={{ fontFamily: "'Syne',sans-serif", fontSize: "9px", fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: "rgba(255,255,255,.3)" }}>Achievements</span>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {(selected.achievements as string[]).map((a: string) => (
                        <span key={a} style={{ padding: "6px 14px", borderRadius: 999, background: "rgba(37,99,235,.12)", border: "1px solid rgba(37,99,235,.22)", color: "#60A5FA", fontFamily: "'Syne',sans-serif", fontSize: "10px", fontWeight: 700, letterSpacing: ".08em" }}>{a}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default PlayersPage;