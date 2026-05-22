import { useState, useEffect, useRef } from "react";
import { Send, MapPin, Phone, Mail, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

/* ─── Types ─── */
const defaultContent = {
  hero_title: "Contact Us",
  hero_subtitle: "Get in touch with RaidKhalid & Co.",
  address: "RK Arena, 123 Basketball Blvd, Manila, Philippines",
  phone: "+63 912 345 6789",
  email: "hello@raidkhalid.co",
  location_search: "",
  map_embed_url:
    "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3861.802548850607!2d120.9822!3d14.5547!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTTCsDMzJzE3LjAiTiAxMjDCsDU4JzU2LjAiRQ!5e0!3m2!1sen!2sph!4v1",
  is_deleted: false,
};
type ContentType = typeof defaultContent;

/* ─── Styles ─── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800;900&family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap');

  @keyframes ct-fadeUp  {from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)}}
  @keyframes ct-fadeIn  {from{opacity:0} to{opacity:1}}
  @keyframes ct-spin    {to{transform:rotate(360deg)}}
  @keyframes ct-dot     {0%,100%{opacity:.3} 50%{opacity:.9}}
  @keyframes ct-ticker  {from{transform:translateX(0)} to{transform:translateX(-50%)}}
  @keyframes ct-lineGrow{from{transform:scaleX(0)} to{transform:scaleX(1)}}
  @keyframes ct-bounce  {0%,100%{transform:translateY(0);opacity:.5} 50%{transform:translateY(-8px);opacity:1}}
  @keyframes ct-shimmer {0%{background-position:-200% 0} 100%{background-position:200% 0}}
  @keyframes ct-pulse   {0%,100%{box-shadow:0 0 0 0 rgba(37,99,235,.4)} 50%{box-shadow:0 0 0 8px rgba(37,99,235,0)}}

  .ct-a-in {animation:ct-fadeIn .6s ease both}
  .ct-a-up {animation:ct-fadeUp .8s cubic-bezier(.22,1,.36,1) both}
  .ct-d1{animation-delay:.08s}.ct-d2{animation-delay:.18s}
  .ct-d3{animation-delay:.3s} .ct-d4{animation-delay:.42s}.ct-d5{animation-delay:.54s}

  .ct-reveal{opacity:0;transform:translateY(28px);transition:opacity .9s cubic-bezier(.22,1,.36,1),transform .9s cubic-bezier(.22,1,.36,1)}
  .ct-reveal.in{opacity:1;transform:none}

  .ct-disp{font-family:'Barlow Condensed',sans-serif;font-weight:800;line-height:.92;letter-spacing:-.01em}
  .ct-label{display:inline-flex;align-items:center;gap:7px;font-family:'Syne',sans-serif;font-size:10px;font-weight:700;letter-spacing:.22em;text-transform:uppercase}
  .ct-ldot{width:5px;height:5px;border-radius:50%;background:currentColor;flex-shrink:0;animation:ct-dot 2.2s ease-in-out infinite}

  .ct-dots{background-image:radial-gradient(circle,rgba(255,255,255,.04) 1px,transparent 1px);background-size:26px 26px}
  .ct-lines{background-image:linear-gradient(rgba(255,255,255,.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.02) 1px,transparent 1px);background-size:48px 48px}

  .ct-ticker-row{display:flex;width:max-content;animation:ct-ticker 32s linear infinite}
  .ct-ticker-row:hover{animation-play-state:paused}

  /* ── Form Card ── */
  .ct-form-card{background:linear-gradient(160deg,#111827 0%,#0C1020 100%);border-radius:24px;border:1px solid rgba(255,255,255,.07);padding:36px 32px;position:relative;overflow:hidden}
  .ct-form-card::before{content:"";position:absolute;top:-60px;right:-60px;width:200px;height:200px;border-radius:50%;background:radial-gradient(circle,rgba(37,99,235,.1) 0%,transparent 70%);pointer-events:none}

  /* ── Input ── */
  .ct-field{display:flex;flex-direction:column;gap:8px}
  .ct-label-text{font-family:'Syne',sans-serif;font-size:9px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:rgba(255,255,255,.35)}
  .ct-input{width:100%;padding:13px 16px;border-radius:12px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);color:#fff;font-family:'DM Sans',sans-serif;font-size:14px;outline:none;transition:border-color .2s,background .2s;resize:none}
  .ct-input::placeholder{color:rgba(255,255,255,.2)}
  .ct-input:focus{border-color:rgba(37,99,235,.5);background:rgba(37,99,235,.06)}

  /* ── Submit Button ── */
  .ct-btn{display:inline-flex;align-items:center;gap:8px;padding:14px 28px;border-radius:12px;background:linear-gradient(135deg,#2563EB,#1D4ED8);border:1px solid rgba(59,130,246,.4);color:#fff;font-family:'Syne',sans-serif;font-size:10px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;cursor:pointer;transition:transform .25s,box-shadow .25s,background .25s;width:100%}
  .ct-btn:hover{transform:translateY(-2px);box-shadow:0 12px 32px -8px rgba(37,99,235,.5);background:linear-gradient(135deg,#3B82F6,#2563EB)}
  .ct-btn:active{transform:translateY(0)}
  .ct-btn:disabled{opacity:.5;cursor:not-allowed;transform:none}

  /* ── Info Card ── */
  .ct-info-card{background:linear-gradient(160deg,#111827 0%,#0C1020 100%);border-radius:24px;border:1px solid rgba(255,255,255,.07);overflow:hidden;position:relative}
  .ct-info-card::before{content:"";position:absolute;bottom:-40px;left:-40px;width:200px;height:200px;border-radius:50%;background:radial-gradient(circle,rgba(37,99,235,.08) 0%,transparent 70%);pointer-events:none}

  .ct-info-body{padding:36px 32px}

  /* Contact row */
  .ct-contact-row{display:flex;align-items:flex-start;gap:14px;padding:14px 16px;border-radius:14px;background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.05);transition:border-color .3s,background .3s,transform .3s;cursor:default}
  .ct-contact-row:hover{border-color:rgba(59,130,246,.22);background:rgba(37,99,235,.05);transform:translateX(4px)}
  .ct-contact-icon{width:38px;height:38px;border-radius:10px;background:rgba(37,99,235,.14);border:1px solid rgba(37,99,235,.22);display:flex;align-items:center;justify-content:center;flex-shrink:0}
  .ct-contact-label{font-family:'Syne',sans-serif;font-size:8px;font-weight:700;letter-spacing:.15em;text-transform:uppercase;color:rgba(255,255,255,.28);margin-bottom:4px}
  .ct-contact-value{font-family:'DM Sans',sans-serif;font-size:13.5px;color:rgba(255,255,255,.65);line-height:1.5}

  /* Map */
  .ct-map-wrap{position:relative;height:260px;overflow:hidden;border-top:1px solid rgba(255,255,255,.05)}
  .ct-map-wrap iframe{position:absolute;inset:0;width:100%;height:100%;border:none;filter:grayscale(1) invert(1) contrast(.85) brightness(.9);transition:filter .4s}
  .ct-map-wrap:hover iframe{filter:grayscale(.6) invert(1) contrast(.85) brightness(.9)}
  .ct-map-overlay{position:absolute;inset:0;pointer-events:none;background:linear-gradient(to bottom,rgba(8,10,18,.35) 0%,transparent 30%,transparent 70%,rgba(8,10,18,.35) 100%)}

  /* Loader */
  .ct-loader{display:flex;justify-content:center;align-items:center;gap:.4rem;min-height:100vh}
  .ct-ldot-b{width:8px;height:8px;border-radius:50%;background:rgba(59,130,246,.5);animation:ct-bounce .9s ease infinite}
  .ct-ldot-b:nth-child(2){animation-delay:.15s}
  .ct-ldot-b:nth-child(3){animation-delay:.3s}

  /* Accent line */
  .ct-accent-line{display:block;height:3px;width:48px;background:linear-gradient(90deg,#2563EB,#60A5FA);border-radius:2px;margin-top:14px;animation:ct-lineGrow .9s cubic-bezier(.22,1,.36,1) .3s both;transform-origin:left}

  /* Success state */
  .ct-success{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:48px 24px;text-align:center;gap:16px}
  .ct-success-ring{width:64px;height:64px;border-radius:50%;background:rgba(37,99,235,.12);border:1px solid rgba(37,99,235,.3);display:flex;align-items:center;justify-content:center;animation:ct-pulse 2s ease-in-out infinite}
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
const Reveal = ({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) => {
  const ref = useReveal() as React.RefObject<HTMLElement>;
  return <section ref={ref} className="ct-reveal" style={style}>{children}</section>;
};

/* ══════════════════════ MAIN ══════════════════════ */
const ContactPage = () => {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [content, setContent] = useState<ContentType | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  /* Inject styles */
  useEffect(() => {
    const id = "rk-contact-v1";
    if (!document.getElementById(id)) {
      const s = document.createElement("style"); s.id = id; s.textContent = STYLES;
      document.head.appendChild(s);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("page_content").select("*")
        .eq("page_key", "contact").eq("section_key", "main").single();
      if (error) console.error("Failed to load contact page:", error);
      setContent(data?.content ? { ...defaultContent, ...(data.content as ContentType) } : defaultContent);
      setLoading(false);
    };
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setSending(true);
    await new Promise(r => setTimeout(r, 900));
    setSending(false);
    setSent(true);
    toast.success("Message sent! We'll get back to you soon.");
    setForm({ name: "", email: "", message: "" });
  };

  if (loading || !content) {
    return (
      <div className="ct-loader">
        <div className="ct-ldot-b" /><div className="ct-ldot-b" /><div className="ct-ldot-b" />
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif", background: "#080A0F", overflowX: "hidden" }}>

      {/* ══ HERO ══ */}
      <section style={{ minHeight: "52vh", position: "relative", display: "flex", alignItems: "flex-end" }}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg,#080A0F 0%,#0C1020 40%,#0d1630 100%)" }} />
        <div className="ct-dots" style={{ position: "absolute", inset: 0 }} />

        {/* BG wordmark */}
        <div style={{ position: "absolute", top: "50%", right: "4%", transform: "translateY(-50%)", fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: "clamp(7rem,20vw,18rem)", lineHeight: 1, color: "rgba(255,255,255,.018)", userSelect: "none", pointerEvents: "none", letterSpacing: ".04em" }}>REACH</div>

        {/* Accent bar */}
        <div style={{ position: "absolute", left: 0, top: "20%", bottom: "20%", width: 2, background: "linear-gradient(to bottom,transparent,#2563EB 30%,#60A5FA 70%,transparent)", opacity: .6 }} />
        <div style={{ position: "absolute", top: "30%", right: "20%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle,rgba(37,99,235,.1) 0%,transparent 65%)", pointerEvents: "none" }} />

        {/* Spinning badge */}
        <div style={{ position: "absolute", top: "8%", right: "5%", opacity: .22, zIndex: 2 }}>
          <svg style={{ animation: "ct-spin 22s linear infinite" }} width="110" height="110" viewBox="0 0 120 120">
            <path id="cpc" fill="none" d="M60,13 a47,47 0 1,1 -0.01,0" />
            <text style={{ fill: "#60A5FA", fontSize: 10, fontWeight: 700, letterSpacing: 3.5, fontFamily: "'Syne',sans-serif" }}>
              <textPath href="#cpc">RAIDKHALID & CO. · CONTACT US · PH · </textPath>
            </text>
          </svg>
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#2563EB,#60A5FA)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 0 7px rgba(37,99,235,.15)" }}>
            <Mail size={14} color="#fff" />
          </div>
        </div>

        <div className="container mx-auto" style={{ padding: "120px 24px 64px", position: "relative", zIndex: 3 }}>
          <div className="ct-label ct-a-in ct-d1" style={{ color: "#60A5FA", marginBottom: 16 }}>
            <span className="ct-ldot" /> Get In Touch
          </div>
          <h1 className="ct-disp ct-a-up ct-d2" style={{ fontSize: "clamp(4rem,12vw,9rem)", color: "#fff", marginBottom: 6 }}>
            {content.hero_title?.split(" ")[0] || "Contact"}
          </h1>
          <h1 className="ct-disp ct-a-up ct-d3" style={{ fontSize: "clamp(4rem,12vw,9rem)", color: "#2563EB", marginBottom: 20, textShadow: "0 0 80px rgba(37,99,235,.3)" }}>
            {content.hero_title?.split(" ").slice(1).join(" ") || "Us"}
          </h1>
          <p className="ct-a-up ct-d4" style={{ fontSize: "clamp(.9rem,1.5vw,1rem)", color: "rgba(255,255,255,.4)", lineHeight: 1.9, maxWidth: "360px", fontStyle: "italic", borderLeft: "2px solid rgba(37,99,235,.5)", paddingLeft: 16 }}>
            {content.hero_subtitle}
          </p>
        </div>
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 80, background: "linear-gradient(to top,#080A0F,transparent)", pointerEvents: "none" }} />
      </section>

      {/* ══ TICKER ══ */}
      <div style={{ background: "#2563EB", overflow: "hidden", padding: "13px 0", borderTop: "1px solid rgba(255,255,255,.08)" }}>
        <div className="ct-ticker-row">
          {Array.from({ length: 2 }).flatMap((_, oi) =>
            ["RAIDKHALID & CO.", "LET'S CONNECT", "GET IN TOUCH", "PH BASKETBALL BRAND", "SEND A MESSAGE", "WE'D LOVE TO HEAR FROM YOU"].map((t, i) => (
              <span key={`${oi}-${i}`} style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "13px", fontWeight: 700, letterSpacing: ".22em", color: "rgba(255,255,255,.82)", whiteSpace: "nowrap", padding: "0 28px" }}>
                {t} <span style={{ color: "rgba(255,255,255,.28)" }}>●</span>
              </span>
            ))
          )}
        </div>
      </div>

      {/* ══ MAIN CONTENT ══ */}
      <Reveal style={{ background: "#080A0F", paddingTop: "72px", paddingBottom: "96px", position: "relative", overflow: "hidden" }}>
        <div className="ct-dots" style={{ position: "absolute", inset: 0 }} />
        <div style={{ position: "absolute", top: "10%", left: "-8%", width: 520, height: 520, borderRadius: "50%", background: "radial-gradient(circle,rgba(37,99,235,.07) 0%,transparent 68%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "10%", right: "-6%", width: 380, height: 380, borderRadius: "50%", background: "radial-gradient(circle,rgba(96,165,250,.04) 0%,transparent 68%)", pointerEvents: "none" }} />

        <div className="container mx-auto" style={{ padding: "0 24px", maxWidth: 1000, position: "relative", zIndex: 1 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 24 }}>

            {/* ── Form Card ── */}
            <div className="ct-form-card">
              <div className="ct-label" style={{ color: "#60A5FA", marginBottom: 14 }}>
                <span className="ct-ldot" /> Send a Message
              </div>
              <h2 className="ct-disp" style={{ fontSize: "clamp(1.8rem,3.5vw,2.6rem)", color: "#fff", marginBottom: 28 }}>
                Drop Us a <span style={{ color: "#2563EB" }}>Line</span>
              </h2>

              {sent ? (
                <div className="ct-success">
                  <div className="ct-success-ring">
                    <Send size={22} color="#60A5FA" />
                  </div>
                  <p className="ct-disp" style={{ fontSize: "1.6rem", color: "#fff" }}>Message Sent!</p>
                  <p style={{ color: "rgba(255,255,255,.35)", fontSize: 13, lineHeight: 1.7, maxWidth: 260 }}>Thanks for reaching out. We'll get back to you as soon as possible.</p>
                  <button className="ct-btn" style={{ marginTop: 8, width: "auto" }} onClick={() => setSent(false)}>
                    Send Another
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                  <div className="ct-field">
                    <span className="ct-label-text">Name *</span>
                    <input className="ct-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your full name" />
                  </div>
                  <div className="ct-field">
                    <span className="ct-label-text">Email *</span>
                    <input className="ct-input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="your@email.com" />
                  </div>
                  <div className="ct-field">
                    <span className="ct-label-text">Message *</span>
                    <textarea className="ct-input" rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="How can we help?" />
                  </div>
                  <button type="submit" className="ct-btn" disabled={sending}>
                    {sending ? (
                      <>
                        <span style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(255,255,255,.3)", borderTopColor: "#fff", animation: "ct-spin .7s linear infinite", flexShrink: 0 }} />
                        Sending…
                      </>
                    ) : (
                      <><Send size={14} /> Send Message</>
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* ── Info Card ── */}
            <div className="ct-info-card">
              {content.is_deleted ? (
                <div style={{ padding: "48px 32px", textAlign: "center" }}>
                  <MapPin size={32} color="rgba(255,255,255,.15)" style={{ margin: "0 auto 12px" }} />
                  <p style={{ color: "rgba(255,255,255,.25)", fontSize: 13 }}>Contact information is currently unavailable.</p>
                </div>
              ) : (
                <>
                  <div className="ct-info-body">
                    <div className="ct-label" style={{ color: "#60A5FA", marginBottom: 14 }}>
                      <span className="ct-ldot" /> Find Us
                    </div>
                    <h2 className="ct-disp" style={{ fontSize: "clamp(1.8rem,3.5vw,2.6rem)", color: "#fff", marginBottom: 28 }}>
                      Our <span style={{ color: "#2563EB" }}>Details</span>
                    </h2>

                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {content.address && (
                        <div className="ct-contact-row">
                          <div className="ct-contact-icon"><MapPin size={16} color="#60A5FA" /></div>
                          <div>
                            <div className="ct-contact-label">Address</div>
                            <div className="ct-contact-value">{content.address}</div>
                          </div>
                        </div>
                      )}
                      {content.phone && (
                        <div className="ct-contact-row">
                          <div className="ct-contact-icon"><Phone size={16} color="#60A5FA" /></div>
                          <div>
                            <div className="ct-contact-label">Phone</div>
                            <div className="ct-contact-value">{content.phone}</div>
                          </div>
                        </div>
                      )}
                      {content.email && (
                        <div className="ct-contact-row">
                          <div className="ct-contact-icon"><Mail size={16} color="#60A5FA" /></div>
                          <div>
                            <div className="ct-contact-label">Email</div>
                            <div className="ct-contact-value">{content.email}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {content.map_embed_url && (
                    <div className="ct-map-wrap">
                      <iframe
                        key={content.map_embed_url}
                        src={content.map_embed_url}
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        title={content.location_search || "RaidKhalid Location"}
                      />
                      <div className="ct-map-overlay" />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </Reveal>

      {/* ══ ETHOS BAND ══ */}
      <Reveal style={{ background: "#0C0F18", padding: "72px 0", borderTop: "1px solid rgba(255,255,255,.04)", position: "relative", overflow: "hidden" }}>
        <div className="ct-lines" style={{ position: "absolute", inset: 0 }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(108deg,transparent 46%,rgba(37,99,235,.04) 46%,rgba(37,99,235,.04) 52%,transparent 52%)", pointerEvents: "none" }} />
        <div className="container mx-auto" style={{ padding: "0 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px 80px", alignItems: "center", position: "relative", zIndex: 1 }}>
          <div>
            <div className="ct-label" style={{ color: "#60A5FA", marginBottom: 16 }}>
              <span className="ct-ldot" /> Always Available
            </div>
            <h2 className="ct-disp" style={{ fontSize: "clamp(2.4rem,5vw,4rem)", color: "#fff", marginBottom: 6 }}>
              We're here<br /><span style={{ color: "#2563EB" }}>for you.</span>
            </h2>
            <span className="ct-accent-line" />
            <p style={{ marginTop: 24, fontSize: "14.5px", color: "rgba(255,255,255,.38)", lineHeight: 1.9, maxWidth: 380, fontFamily: "'DM Sans',sans-serif" }}>
              Whether you're a player, partner, or fan — RaidKhalid &amp; Co. is always open to conversation. Reach out and let's build something great together.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              { label: "Fast Response", desc: "We typically reply within 24 hours on all inquiries." },
              { label: "Partnership", desc: "Interested in collaborating? We're always open to partnerships." },
              { label: "Player Tryouts", desc: "Want to join the roster? Send us your details and stats." },
              { label: "Media & Press", desc: "For media inquiries and press coverage, reach out directly." },
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

    </div>
  );
};

export default ContactPage;