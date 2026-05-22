import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, MapPin, X, ArrowUpRight, Trophy, Clock } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface DbActivity {
  id: string;
  title: string;
  description: string | null;
  event_date: string | null;
  location: string | null;
  image_url: string | null;
  active: boolean;
  display_order: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function parseLocalDate(dateStr: string): Date {
  if (dateStr.includes("T") || dateStr.includes(" ")) return new Date(dateStr);
  return new Date(dateStr + "T00:00:00");
}

function formatDate(dateStr: string): string {
  return parseLocalDate(dateStr).toLocaleDateString(undefined, {
    month: "long", day: "numeric", year: "numeric",
  });
}

function formatDateShort(dateStr: string): { day: string; month: string; year: string } {
  const d = parseLocalDate(dateStr);
  return {
    day: d.toLocaleDateString(undefined, { day: "2-digit" }),
    month: d.toLocaleDateString(undefined, { month: "short" }).toUpperCase(),
    year: d.toLocaleDateString(undefined, { year: "numeric" }),
  };
}

function isUpcoming(dateStr: string): boolean {
  return parseLocalDate(dateStr) >= new Date();
}

// ── Styles ────────────────────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800;900&family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap');

  @keyframes fadeUp    {from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)}}
  @keyframes fadeIn    {from{opacity:0} to{opacity:1}}
  @keyframes shimmer   {0%{background-position:-200% 0} 100%{background-position:200% 0}}
  @keyframes spin      {to{transform:rotate(360deg)}}
  @keyframes dot       {0%,100%{opacity:.3} 50%{opacity:.9}}
  @keyframes ticker    {from{transform:translateX(0)} to{transform:translateX(-50%)}}
  @keyframes cardIn    {from{opacity:0;transform:translateY(28px) scale(.97)} to{opacity:1;transform:none}}
  @keyframes overlayIn {from{opacity:0} to{opacity:1}}
  @keyframes modalIn   {from{opacity:0;transform:scale(.96) translateY(12px)} to{opacity:1;transform:scale(1) translateY(0)}}
  @keyframes numberUp  {from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)}}
  @keyframes lineGrow  {from{transform:scaleX(0)} to{transform:scaleX(1)}}
  @keyframes glowPulse {0%,100%{box-shadow:0 0 0 0 rgba(37,99,235,.4)} 50%{box-shadow:0 0 0 12px rgba(37,99,235,0)}}

  .a-up {animation:fadeUp .8s cubic-bezier(.22,1,.36,1) both}
  .a-in {animation:fadeIn .6s ease both}
  .d1{animation-delay:.08s}.d2{animation-delay:.18s}.d3{animation-delay:.3s}
  .d4{animation-delay:.42s}.d5{animation-delay:.54s}

  .reveal{opacity:0;transform:translateY(28px);transition:opacity .9s cubic-bezier(.22,1,.36,1),transform .9s cubic-bezier(.22,1,.36,1)}
  .reveal.in{opacity:1;transform:none}

  .disp{font-family:'Barlow Condensed',sans-serif;font-weight:800;line-height:.92;letter-spacing:-.01em}
  .label-tag{display:inline-flex;align-items:center;gap:7px;font-family:'Syne',sans-serif;font-size:10px;font-weight:700;letter-spacing:.22em;text-transform:uppercase}
  .label-dot{width:5px;height:5px;border-radius:50%;background:currentColor;flex-shrink:0;animation:dot 2.2s ease-in-out infinite}

  .dots-dk{background-image:radial-gradient(circle,rgba(255,255,255,.04) 1px,transparent 1px);background-size:26px 26px}
  .lines-dk{background-image:linear-gradient(rgba(255,255,255,.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.02) 1px,transparent 1px);background-size:48px 48px}

  .ticker-row{display:flex;width:max-content;animation:ticker 30s linear infinite}
  .ticker-row:hover{animation-play-state:paused}

  /* ── Activity Card ── */
  .act-card{position:relative;border-radius:24px;overflow:hidden;background:linear-gradient(160deg,#111827 0%,#0C1020 100%);border:1px solid rgba(255,255,255,.07);cursor:pointer;transition:transform .42s cubic-bezier(.22,1,.36,1),box-shadow .42s ease,border-color .38s ease;display:flex;flex-direction:column;animation:cardIn .7s cubic-bezier(.22,1,.36,1) both}
  .act-card:hover{transform:translateY(-10px) scale(1.015);box-shadow:0 40px 80px -18px rgba(0,0,0,.7),0 0 0 1px rgba(59,130,246,.28),0 0 50px -16px rgba(37,99,235,.22);border-color:rgba(59,130,246,.3)}

  .act-photo{position:relative;height:220px;overflow:hidden;flex-shrink:0}
  .act-photo img{width:100%;height:100%;object-fit:cover;transition:transform .85s cubic-bezier(.22,1,.36,1)}
  .act-card:hover .act-photo img{transform:scale(1.07)}
  .act-vignette{position:absolute;inset:0;background:linear-gradient(to top,rgba(8,10,18,.9) 0%,rgba(8,10,18,.2) 50%,transparent 100%)}
  .act-side-glow{position:absolute;inset:0;background:linear-gradient(270deg,rgba(37,99,235,.16) 0%,transparent 45%);opacity:0;transition:opacity .4s}
  .act-card:hover .act-side-glow{opacity:1}
  .act-shine{position:absolute;inset:0;background:linear-gradient(125deg,rgba(255,255,255,.05) 0%,transparent 40%);opacity:0;transition:opacity .4s}
  .act-card:hover .act-shine{opacity:1}

  /* Date badge floating on image */
  .act-date-badge{position:absolute;top:14px;left:14px;z-index:4;padding:8px 14px;border-radius:12px;background:rgba(8,10,18,.75);backdrop-filter:blur(14px);border:1px solid rgba(255,255,255,.1);text-align:center;min-width:52px}
  .act-date-badge .day{font-family:'Barlow Condensed',sans-serif;font-size:1.6rem;font-weight:900;color:#fff;line-height:1}
  .act-date-badge .mon{font-family:'Syne',sans-serif;font-size:8px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:#3B82F6;margin-top:1px}

  /* Upcoming pill */
  .upcoming-pill{position:absolute;top:14px;right:14px;z-index:4;padding:5px 12px;border-radius:999px;background:rgba(37,99,235,.85);backdrop-filter:blur(10px);border:1px solid rgba(59,130,246,.5);font-family:'Syne',sans-serif;font-size:9px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#fff;display:flex;align-items:center;gap:5px}
  .upcoming-dot{width:5px;height:5px;border-radius:50%;background:#60A5FA;animation:dot 1.6s ease-in-out infinite}

  /* Past pill */
  .past-pill{position:absolute;top:14px;right:14px;z-index:4;padding:5px 12px;border-radius:999px;background:rgba(255,255,255,.07);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,.1);font-family:'Syne',sans-serif;font-size:9px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.4)}

  .act-body{padding:18px 20px 20px;position:relative;z-index:2;flex:1;display:flex;flex-direction:column}
  .act-title{font-family:'Barlow Condensed',sans-serif;font-weight:900;font-size:clamp(1.4rem,2.8vw,1.75rem);line-height:.95;color:#fff;letter-spacing:-.01em;margin-bottom:8px}
  .act-desc{font-family:'DM Sans',sans-serif;font-size:13px;color:rgba(255,255,255,.38);line-height:1.75;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;margin-bottom:14px;flex:1}
  .act-meta{display:flex;flex-direction:column;gap:6px;padding-top:14px;border-top:1px solid rgba(255,255,255,.05)}
  .act-meta-row{display:flex;align-items:center;gap:8px;font-family:'DM Sans',sans-serif;font-size:12px;color:rgba(255,255,255,.32)}
  .act-meta-row svg{flex-shrink:0;color:#3B82F6}

  .act-footer{display:flex;align-items:center;justify-content:space-between;padding-top:14px;margin-top:8px}
  .act-cta{font-family:'Syne',sans-serif;font-size:9px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#3B82F6}
  .act-arrow{width:32px;height:32px;border-radius:50%;background:rgba(37,99,235,.15);border:1px solid rgba(37,99,235,.3);display:flex;align-items:center;justify-content:center;transition:background .25s,transform .25s;flex-shrink:0}
  .act-card:hover .act-arrow{background:#2563EB;transform:rotate(45deg)}

  /* No-image placeholder */
  .act-no-img{width:100%;height:220px;background:linear-gradient(135deg,#111827,#1e3a8a);display:flex;align-items:center;justify-content:center;flex-shrink:0;position:relative}
  .act-no-img-text{font-family:'Barlow Condensed',sans-serif;font-size:5rem;font-weight:900;color:rgba(96,165,250,.07);line-height:1}

  /* ── Skeleton ── */
  .sk{background:linear-gradient(90deg,rgba(255,255,255,.04) 25%,rgba(255,255,255,.07) 50%,rgba(255,255,255,.04) 75%);background-size:200% 100%;animation:shimmer 1.6s infinite;border-radius:10px}

  /* ── Modal ── */
  .modal-overlay{position:fixed;inset:0;z-index:50;background:rgba(8,10,15,.82);backdrop-filter:blur(12px);display:flex;align-items:center;justify-content:center;padding:16px;animation:overlayIn .3s ease both}
  .modal-box{background:linear-gradient(160deg,#111827 0%,#0C1020 100%);border-radius:24px;max-width:540px;width:100%;max-height:90vh;overflow-y:auto;border:1px solid rgba(255,255,255,.08);box-shadow:0 60px 120px -20px rgba(0,0,0,.8),0 0 0 1px rgba(59,130,246,.12);animation:modalIn .38s cubic-bezier(.22,1,.36,1) both;scrollbar-width:thin;scrollbar-color:rgba(37,99,235,.3) transparent}
  .modal-box::-webkit-scrollbar{width:4px}
  .modal-box::-webkit-scrollbar-track{background:transparent}
  .modal-box::-webkit-scrollbar-thumb{background:rgba(37,99,235,.3);border-radius:4px}

  /* ── Filter tabs ── */
  .filter-pill{padding:8px 18px;border-radius:999px;font-family:'Syne',sans-serif;font-weight:700;font-size:11px;letter-spacing:.06em;text-transform:uppercase;cursor:pointer;transition:transform .2s,background .2s,box-shadow .2s,border-color .2s;border:1.5px solid rgba(255,255,255,.1);background:rgba(255,255,255,.03);color:rgba(255,255,255,.55)}
  .filter-pill:hover{transform:translateY(-2px);border-color:rgba(59,130,246,.4);color:rgba(255,255,255,.8)}
  .filter-pill.active{background:rgba(37,99,235,.9);border-color:#2563EB;color:#fff;box-shadow:0 6px 20px -6px rgba(37,99,235,.55)}

  .accent-line{display:block;height:3px;width:48px;background:linear-gradient(90deg,#2563EB,#60A5FA);border-radius:2px;margin-top:14px;animation:lineGrow .9s cubic-bezier(.22,1,.36,1) .3s both;transform-origin:left}
`;

// ── Reveal hook ───────────────────────────────────────────────────────────────
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

const Reveal = ({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) => {
  const ref = useReveal() as React.RefObject<HTMLElement>;
  return <section ref={ref} className="reveal" style={style}>{children}</section>;
};

const SkeletonCard = () => (
  <div style={{ borderRadius: 24, overflow: "hidden", background: "linear-gradient(160deg,#111827,#0C1020)", border: "1px solid rgba(255,255,255,.05)" }}>
    <div className="sk" style={{ height: 220 }} />
    <div style={{ padding: "18px 20px 20px" }}>
      {[45, 80, 60, 35].map((w, i) => (
        <div key={i} className="sk" style={{ height: i === 1 ? 24 : 10, marginBottom: 10, width: `${w}%` }} />
      ))}
    </div>
  </div>
);

// ── Component ─────────────────────────────────────────────────────────────────
const ActivitiesPage = () => {
  const [activities, setActivities] = useState<DbActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<DbActivity | null>(null);
  const [filter, setFilter] = useState<"all" | "upcoming" | "past">("all");

  useEffect(() => {
    const id = "rk-activities-v1";
    if (!document.getElementById(id)) {
      const s = document.createElement("style");
      s.id = id;
      s.textContent = STYLES;
      document.head.appendChild(s);
    }
  }, []);

  useEffect(() => {
    supabase
      .from("activities")
      .select("*")
      .eq("active", true)
      .order("display_order", { ascending: true })
      .then(({ data, error }) => {
        if (error) console.error("Fetch error:", error);
        setActivities((data as DbActivity[]) || []);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    document.body.style.overflow = selected ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [selected]);

  const filtered = activities.filter((a) => {
    if (filter === "all") return true;
    if (!a.event_date) return filter === "all";
    return filter === "upcoming" ? isUpcoming(a.event_date) : !isUpcoming(a.event_date);
  });

  const upcomingCount = activities.filter(a => a.event_date && isUpcoming(a.event_date)).length;
  const pastCount = activities.filter(a => a.event_date && !isUpcoming(a.event_date)).length;

  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif", background: "#080A0F", overflowX: "hidden" }}>

      {/* ══ HERO ══ */}
      <section style={{ minHeight: "52vh", position: "relative", display: "flex", alignItems: "flex-end" }}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg,#080A0F 0%,#0C1020 40%,#0d1630 100%)" }} />
        <div className="dots-dk" style={{ position: "absolute", inset: 0 }} />

        {/* Watermark */}
        <div style={{
          position: "absolute", top: "50%", right: "4%", transform: "translateY(-50%)",
          fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900,
          fontSize: "clamp(7rem,20vw,17rem)", lineHeight: 1,
          color: "rgba(255,255,255,.018)", userSelect: "none", pointerEvents: "none", letterSpacing: ".04em",
        }}>EVENTS</div>

        {/* Left accent stripe */}
        <div style={{ position: "absolute", left: 0, top: "20%", bottom: "20%", width: 2, background: "linear-gradient(to bottom,transparent,#2563EB 30%,#60A5FA 70%,transparent)", opacity: .6 }} />

        {/* Glow orbs */}
        <div style={{ position: "absolute", top: "25%", right: "22%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle,rgba(37,99,235,.09) 0%,transparent 65%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: 0, left: "25%", width: 380, height: 180, background: "radial-gradient(ellipse,rgba(37,99,235,.06) 0%,transparent 70%)", pointerEvents: "none" }} />

        {/* Spinning badge */}
        <div style={{ position: "absolute", top: "8%", right: "5%", opacity: .22, zIndex: 2 }}>
          <svg style={{ animation: "spin 24s linear infinite" }} width="110" height="110" viewBox="0 0 120 120">
            <path id="ac" fill="none" d="M60,13 a47,47 0 1,1 -0.01,0" />
            <text style={{ fill: "#60A5FA", fontSize: 10, fontWeight: 700, letterSpacing: 3.5, fontFamily: "'Syne',sans-serif" }}>
              <textPath href="#ac">EVENTS & ACTIVITIES · RAIDKHALID · PH · </textPath>
            </text>
          </svg>
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#2563EB,#60A5FA)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 0 7px rgba(37,99,235,.15)" }}>
            <Calendar size={14} color="#fff" />
          </div>
        </div>

        <div className="container mx-auto" style={{ padding: "120px 24px 64px", position: "relative", zIndex: 3 }}>
          <div className="label-tag a-in d1" style={{ color: "#60A5FA", marginBottom: 16 }}>
            <span className="label-dot" /> On the Calendar
          </div>
          <h1 className="disp a-up d2" style={{ fontSize: "clamp(4rem,12vw,9rem)", color: "#fff", marginBottom: 6 }}>Events &amp;</h1>
          <h1 className="disp a-up d3" style={{ fontSize: "clamp(4rem,12vw,9rem)", color: "#2563EB", marginBottom: 20, textShadow: "0 0 80px rgba(37,99,235,.3)" }}>Activities</h1>
          <p className="a-up d4" style={{ fontSize: "clamp(.9rem,1.5vw,1rem)", color: "rgba(255,255,255,.4)", lineHeight: 1.9, maxWidth: "360px", fontStyle: "italic", borderLeft: "2px solid rgba(37,99,235,.5)", paddingLeft: 16 }}>
            Games, clinics, community drives — everything happening in the RaidKhalid &amp; Co. universe.
          </p>

          {/* Live stat pills */}
          {!loading && activities.length > 0 && (
            <div className="a-up d5" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 28 }}>
              {[
                { label: "Total Events", val: activities.length },
                { label: "Upcoming", val: upcomingCount },
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
            ["RAIDKHALID & CO.", "UPCOMING EVENTS", "COMMUNITY FIRST", "GAME DAY", "YOUTH CLINICS", "PH BASKETBALL", "FRANCHISE EVENTS"].map((t, i) => (
              <span key={`${oi}-${i}`} style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "13px", fontWeight: 700, letterSpacing: ".22em", color: "rgba(255,255,255,.82)", whiteSpace: "nowrap", padding: "0 28px" }}>
                {t} <span style={{ color: "rgba(255,255,255,.28)" }}>●</span>
              </span>
            ))
          )}
        </div>
      </div>

      {/* ══ FILTER BAR ══ */}
      <div style={{ background: "#0C0F18", borderBottom: "1px solid rgba(255,255,255,.05)", position: "sticky", top: 0, zIndex: 30, backdropFilter: "blur(12px)" }}>
        <div className="container mx-auto" style={{ padding: "14px 24px", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontFamily: "'Syne',sans-serif", fontSize: "10px", fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: "rgba(255,255,255,.25)", marginRight: 4 }}>Show</span>
          {([
            { key: "all", label: `All (${activities.length})` },
            { key: "upcoming", label: `Upcoming (${upcomingCount})` },
            { key: "past", label: `Past (${pastCount})` },
          ] as const).map(({ key, label }) => (
            <button key={key} className={`filter-pill${filter === key ? " active" : ""}`} onClick={() => setFilter(key)}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ══ GRID ══ */}
      <Reveal style={{ background: "#080A0F", paddingTop: "72px", paddingBottom: "96px", position: "relative", overflow: "hidden" }}>
        <div className="dots-dk" style={{ position: "absolute", inset: 0 }} />
        <div style={{ position: "absolute", top: "12%", left: "-8%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle,rgba(37,99,235,.07) 0%,transparent 68%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "8%", right: "-5%", width: 360, height: 360, borderRadius: "50%", background: "radial-gradient(circle,rgba(96,165,250,.04) 0%,transparent 68%)", pointerEvents: "none" }} />

        <div className="container mx-auto" style={{ padding: "0 24px", position: "relative", zIndex: 1 }}>

          {/* Section heading */}
          <div style={{ marginBottom: 40, display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div className="label-tag" style={{ color: "#60A5FA", marginBottom: 12 }}>
                <span className="label-dot" />
                {filter === "all" ? "All Events" : filter === "upcoming" ? "Coming Up" : "Past Events"}
              </div>
              <h2 className="disp" style={{ fontSize: "clamp(2.4rem,5vw,4rem)", color: "#fff" }}>
                {filter === "all" ? "Full Calendar" : filter === "upcoming" ? "Upcoming" : "Archive"}
              </h2>
            </div>
            {!loading && (
              <span style={{ fontFamily: "'Syne',sans-serif", fontSize: "11px", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "rgba(255,255,255,.22)", alignSelf: "flex-end", paddingBottom: 4 }}>
                {filtered.length} {filtered.length === 1 ? "event" : "events"}
              </span>
            )}
          </div>

          {loading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 20 }}>
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "80px 0" }}>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "6rem", fontWeight: 900, color: "rgba(255,255,255,.04)", marginBottom: 12 }}>—</div>
              <p className="disp" style={{ fontSize: "1.6rem", color: "rgba(255,255,255,.25)", marginBottom: 8 }}>No Events Found</p>
              <p style={{ color: "rgba(255,255,255,.18)", fontSize: 13 }}>Nothing in this category yet.</p>
              <button onClick={() => setFilter("all")} style={{ marginTop: 24, padding: "11px 24px", borderRadius: 999, background: "rgba(37,99,235,.15)", border: "1px solid rgba(37,99,235,.3)", color: "#60A5FA", fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: ".1em", textTransform: "uppercase", cursor: "pointer" }}>
                Show All
              </button>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 20 }}>
              {filtered.map((act, i) => {
                const dateParts = act.event_date ? formatDateShort(act.event_date) : null;
                const upcoming = act.event_date ? isUpcoming(act.event_date) : false;
                return (
                  <button
                    key={act.id}
                    className="act-card"
                    onClick={() => setSelected(act)}
                    style={{ animationDelay: `${(i % 6) * 0.07}s`, textAlign: "left", width: "100%" }}
                  >
                    {/* Photo */}
                    {act.image_url ? (
                      <div className="act-photo">
                        <img src={act.image_url} alt={act.title} loading="lazy" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                        <div className="act-vignette" />
                        <div className="act-side-glow" />
                        <div className="act-shine" />
                      </div>
                    ) : (
                      <div className="act-no-img">
                        <span className="act-no-img-text">RK</span>
                        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top,rgba(8,10,18,.8) 0%,transparent 60%)" }} />
                      </div>
                    )}

                    {/* Date badge */}
                    {dateParts && (
                      <div className="act-date-badge">
                        <div className="day">{dateParts.day}</div>
                        <div className="mon">{dateParts.month}</div>
                      </div>
                    )}

                    {/* Status pill */}
                    {act.event_date && (
                      upcoming
                        ? <div className="upcoming-pill"><span className="upcoming-dot" />Upcoming</div>
                        : <div className="past-pill">Past</div>
                    )}

                    {/* Body */}
                    <div className="act-body">
                      <div className="act-title">{act.title}</div>
                      {act.description && <p className="act-desc">{act.description}</p>}
                      <div className="act-meta">
                        {act.event_date && (
                          <div className="act-meta-row">
                            <Calendar size={12} />
                            <span>{formatDate(act.event_date)}</span>
                          </div>
                        )}
                        {act.location && (
                          <div className="act-meta-row">
                            <MapPin size={12} />
                            <span>{act.location}</span>
                          </div>
                        )}
                      </div>
                      <div className="act-footer">
                        <span className="act-cta">View Details</span>
                        <div className="act-arrow">
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

      {/* ══ MODAL ══ */}
      {selected && (() => {
        const dateParts = selected.event_date ? formatDateShort(selected.event_date) : null;
        const upcoming = selected.event_date ? isUpcoming(selected.event_date) : false;
        return (
          <div className="modal-overlay" onClick={() => setSelected(null)}>
            <div className="modal-box" onClick={(e) => e.stopPropagation()}>

              {/* Modal hero */}
              <div style={{ position: "relative", height: 280, flexShrink: 0 }}>
                {selected.image_url ? (
                  <img src={selected.image_url} alt={selected.title} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", borderRadius: "24px 24px 0 0" }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                ) : (
                  <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg,#111827,#1e3a8a)", borderRadius: "24px 24px 0 0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span className="disp" style={{ fontSize: "7rem", color: "rgba(96,165,250,.07)" }}>RK</span>
                  </div>
                )}
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top,rgba(8,10,18,.96) 0%,rgba(8,10,18,.25) 55%,transparent 100%)", borderRadius: "24px 24px 0 0" }} />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(270deg,rgba(37,99,235,.12) 0%,transparent 50%)", borderRadius: "24px 24px 0 0" }} />

                {/* Close */}
                <button onClick={() => setSelected(null)}
                  style={{ position: "absolute", top: 14, right: 14, width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,.09)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,.1)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "background .2s" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(239,68,68,.3)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,.09)")}>
                  <X size={16} color="#fff" />
                </button>

                {/* Date badge in modal */}
                {dateParts && (
                  <div style={{ position: "absolute", top: 14, left: 14, padding: "8px 14px", borderRadius: 12, background: "rgba(8,10,18,.75)", backdropFilter: "blur(14px)", border: "1px solid rgba(255,255,255,.1)", textAlign: "center", minWidth: 52 }}>
                    <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "1.6rem", fontWeight: 900, color: "#fff", lineHeight: 1 }}>{dateParts.day}</div>
                    <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "8px", fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: "#3B82F6", marginTop: 1 }}>{dateParts.month}</div>
                  </div>
                )}

                {/* Title overlay */}
                <div style={{ position: "absolute", bottom: 20, left: 22, right: 60 }}>
                  {selected.event_date && (
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 11px", borderRadius: 999, background: upcoming ? "rgba(37,99,235,.85)" : "rgba(255,255,255,.07)", border: `1px solid ${upcoming ? "rgba(59,130,246,.5)" : "rgba(255,255,255,.1)"}`, marginBottom: 8 }}>
                      {upcoming && <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#60A5FA", animation: "dot 1.6s ease-in-out infinite" }} />}
                      <span style={{ fontFamily: "'Syne',sans-serif", fontSize: "9px", fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: upcoming ? "#fff" : "rgba(255,255,255,.4)" }}>{upcoming ? "Upcoming" : "Past Event"}</span>
                    </div>
                  )}
                  <h2 className="disp" style={{ fontSize: "clamp(1.8rem,5vw,2.6rem)", color: "#fff" }}>{selected.title}</h2>
                  <p style={{ fontFamily: "'Syne',sans-serif", fontSize: "9px", fontWeight: 700, letterSpacing: ".2em", color: "#3B82F6", textTransform: "uppercase", marginTop: 3 }}>RaidKhalid &amp; Co.</p>
                </div>
              </div>

              {/* Modal content */}
              <div style={{ padding: "24px 22px 28px" }}>

                {/* Meta pills */}
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
                  {selected.event_date && (
                    <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 14px", borderRadius: 10, background: "rgba(37,99,235,.1)", border: "1px solid rgba(37,99,235,.2)" }}>
                      <Calendar size={12} color="#3B82F6" />
                      <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "12px", color: "rgba(255,255,255,.6)" }}>{formatDate(selected.event_date)}</span>
                    </div>
                  )}
                  {selected.location && (
                    <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 14px", borderRadius: 10, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)" }}>
                      <MapPin size={12} color="#3B82F6" />
                      <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "12px", color: "rgba(255,255,255,.6)" }}>{selected.location}</span>
                    </div>
                  )}
                </div>

                <div style={{ height: 1, background: "rgba(255,255,255,.05)", marginBottom: 18 }} />

                {/* Description */}
                {selected.description && (
                  <p style={{ color: "rgba(255,255,255,.45)", lineHeight: 1.85, fontSize: "14px", whiteSpace: "pre-line" }}>
                    {selected.description}
                  </p>
                )}

                {/* Close button */}
                <button onClick={() => setSelected(null)} style={{
                  marginTop: 28, width: "100%", padding: "13px", borderRadius: 14,
                  background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.09)",
                  color: "rgba(255,255,255,.5)", fontFamily: "'Syne',sans-serif", fontSize: "11px",
                  fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", cursor: "pointer",
                  transition: "background .2s,border-color .2s,color .2s",
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(37,99,235,.12)"; e.currentTarget.style.borderColor = "rgba(37,99,235,.3)"; e.currentTarget.style.color = "#60A5FA"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,.04)"; e.currentTarget.style.borderColor = "rgba(255,255,255,.09)"; e.currentTarget.style.color = "rgba(255,255,255,.5)"; }}>
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default ActivitiesPage;