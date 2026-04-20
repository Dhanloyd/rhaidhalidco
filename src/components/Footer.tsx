import { Link } from "react-router-dom";
import { Mail, ArrowUpRight, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";
import { categoryLabels } from "@/data/products";
import { supabase } from "@/integrations/supabase/client";

/* ─── Platform SVG icons ─── */
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

const TikTokIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.75a4.85 4.85 0 01-1.01-.06z"/>
  </svg>
);

const YouTubeIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

const ShopeeIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 4.5a3 3 0 110 6 3 3 0 010-6zm5.5 14H6.5a1 1 0 01-.99-1.14l1-7A1 1 0 017.5 9.5h9a1 1 0 01.99.86l1 7A1 1 0 0117.5 18.5z"/>
  </svg>
);

function getPlatformIcon(platform: string) {
  const p = platform.toLowerCase().trim();
  if (p.includes("facebook") || p === "fb") return <FacebookIcon />;
  if (p.includes("instagram") || p === "ig") return <InstagramIcon />;
  if (p.includes("twitter") || p === "x") return <XIcon />;
  if (p.includes("tiktok")) return <TikTokIcon />;
  if (p.includes("youtube")) return <YouTubeIcon />;
  if (p.includes("shopee")) return <ShopeeIcon />;
  return <ExternalLink size={14} />;
}

/* ─── Platform color map ─── */
const PLATFORM_COLORS: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  facebook:  { bg: "rgba(24,119,242,0.12)",  border: "rgba(24,119,242,0.25)",  text: "#93c5fd", dot: "#1877f2" },
  instagram: { bg: "rgba(225,48,108,0.12)",  border: "rgba(225,48,108,0.25)",  text: "#f9a8d4", dot: "#e1306c" },
  tiktok:    { bg: "rgba(255,255,255,0.07)", border: "rgba(255,255,255,0.15)", text: "#e2e8f0", dot: "#444" },
  twitter:   { bg: "rgba(29,161,242,0.12)",  border: "rgba(29,161,242,0.25)",  text: "#93c5fd", dot: "#1da1f2" },
  x:         { bg: "rgba(255,255,255,0.07)", border: "rgba(255,255,255,0.15)", text: "#e2e8f0", dot: "#333" },
  youtube:   { bg: "rgba(255,0,0,0.10)",     border: "rgba(255,0,0,0.22)",     text: "#fca5a5", dot: "#ff0000" },
  shopee:    { bg: "rgba(238,77,45,0.10)",   border: "rgba(238,77,45,0.22)",   text: "#fdba74", dot: "#ee4d2d" },
  lazada:    { bg: "rgba(14,31,140,0.14)",   border: "rgba(99,102,241,0.25)",  text: "#a5b4fc", dot: "#6366f1" },
  default:   { bg: "rgba(255,255,255,0.06)", border: "rgba(255,255,255,0.12)", text: "#94a3b8", dot: "#64748b" },
};

function getSocialStyle(platform: string) {
  const key = platform.toLowerCase().trim();
  // match partial names too
  for (const [k, v] of Object.entries(PLATFORM_COLORS)) {
    if (key.includes(k)) return v;
  }
  return PLATFORM_COLORS.default;
}

const Footer = () => {
  const [email, setEmail] = useState("");
  const [socialLinks, setSocialLinks] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("social_links").select("*").eq("active", true).order("display_order")
      .then(({ data }) => setSocialLinks(data || []));
  }, []);

  return (
    <footer className="bg-footer text-footer-foreground">
      <div className="container mx-auto px-4 py-10 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-12">

          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <h3 className="font-heading text-lg sm:text-xl text-primary-foreground mb-3 uppercase tracking-wider">RaidKhalid & Co.</h3>
            <p className="text-sm leading-relaxed opacity-70">Elevating basketball culture through excellence, community, and innovation.</p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-heading text-sm text-primary-foreground mb-3 uppercase tracking-wider">Quick Links</h4>
            <ul className="space-y-1.5">
              {[{ l: "Home", p: "/" }, { l: "About Us", p: "/about" }, { l: "Players", p: "/players" }, { l: "Activities", p: "/activities" }, { l: "Contact", p: "/contact" }].map((item) => (
                <li key={item.l}><Link to={item.p} className="text-sm opacity-70 hover:opacity-100 transition-opacity duration-200">{item.l}</Link></li>
              ))}
            </ul>
          </div>

          {/* Shop Categories */}
          <div className="hidden lg:block">
            <h4 className="font-heading text-sm text-primary-foreground mb-3 uppercase tracking-wider">Shop Categories</h4>
            <ul className="space-y-1.5">
              {Object.values(categoryLabels).slice(0, 5).map((label) => (
                <li key={label}><Link to="/shop" className="text-sm opacity-70 hover:opacity-100 transition-opacity duration-200">{label}</Link></li>
              ))}
            </ul>
          </div>

          {/* Stay Connected */}
          <div>
            <h4 className="font-heading text-sm text-primary-foreground mb-3 uppercase tracking-wider">Stay Connected</h4>

            {/* Email subscription */}
            <div className="flex gap-2 mb-4">
              <input
                type="email"
                placeholder="Your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 min-w-0 bg-primary-dark/50 border border-primary-light/20 rounded-md px-3 py-2 text-sm text-primary-foreground placeholder:text-footer-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary-light"
              />
              <button className="bg-primary hover:bg-primary-light text-primary-foreground px-3 py-2 rounded-md text-sm font-medium transition-colors flex-shrink-0">
                <Mail size={15} />
              </button>
            </div>

            {/* Social link cards with icons */}
            {socialLinks.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {socialLinks.map((link) => {
                  const s = getSocialStyle(link.platform);
                  return (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "9px 11px",
                        background: s.bg,
                        border: `1px solid ${s.border}`,
                        borderRadius: "10px",
                        textDecoration: "none",
                        transition: "transform .2s ease, border-color .2s ease",
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                        (e.currentTarget as HTMLElement).style.borderColor = s.dot + "88";
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                        (e.currentTarget as HTMLElement).style.borderColor = s.border;
                      }}
                    >
                      {/* Icon circle */}
                      <div style={{
                        width: 26, height: 26, borderRadius: "7px",
                        background: s.dot,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0,
                        color: "#fff",
                      }}>
                        {getPlatformIcon(link.platform)}
                      </div>

                      <span style={{ fontSize: "12px", fontWeight: 600, color: s.text, flex: 1, textTransform: "capitalize" }}>
                        {link.platform}
                      </span>

                      <ArrowUpRight size={11} style={{ color: s.text, opacity: 0.5 }} />
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-primary-light/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs opacity-60">© 2026 RaidKhalid & Co. All Rights Reserved.</p>
          <div className="flex gap-4 text-xs opacity-60">
            <a href="#" className="hover:opacity-100 transition-opacity">Privacy Policy</a>
            <a href="#" className="hover:opacity-100 transition-opacity">Terms of Service</a>
            <Link to="/admin/login" className="hover:opacity-100 transition-opacity">Admin</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
