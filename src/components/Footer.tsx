import { Link } from "react-router-dom";
import { Mail, ArrowUpRight } from "lucide-react";
import { useState, useEffect } from "react";
import { categoryLabels } from "@/data/products";
import { supabase } from "@/integrations/supabase/client";

// NEW: platform color map for modern social link cards
const PLATFORM_COLORS: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  facebook:  { bg: "rgba(24,119,242,0.12)",  border: "rgba(24,119,242,0.25)",  text: "#93c5fd", dot: "#1877f2" },
  instagram: { bg: "rgba(225,48,108,0.12)",  border: "rgba(225,48,108,0.25)",  text: "#f9a8d4", dot: "#e1306c" },
  tiktok:    { bg: "rgba(255,255,255,0.07)", border: "rgba(255,255,255,0.15)", text: "#e2e8f0", dot: "#333333" },
  twitter:   { bg: "rgba(29,161,242,0.12)",  border: "rgba(29,161,242,0.25)",  text: "#93c5fd", dot: "#1da1f2" },
  x:         { bg: "rgba(255,255,255,0.07)", border: "rgba(255,255,255,0.15)", text: "#e2e8f0", dot: "#333333" },
  youtube:   { bg: "rgba(255,0,0,0.10)",     border: "rgba(255,0,0,0.22)",     text: "#fca5a5", dot: "#ff0000" },
  shopee:    { bg: "rgba(238,77,45,0.10)",   border: "rgba(238,77,45,0.22)",   text: "#fdba74", dot: "#ee4d2d" },
  lazada:    { bg: "rgba(14,31,140,0.14)",   border: "rgba(99,102,241,0.25)",  text: "#a5b4fc", dot: "#6366f1" },
  default:   { bg: "rgba(255,255,255,0.06)", border: "rgba(255,255,255,0.12)", text: "#94a3b8", dot: "#64748b" },
};

function getSocialStyle(platform: string) {
  return PLATFORM_COLORS[platform.toLowerCase().trim()] ?? PLATFORM_COLORS.default;
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
          <div className="col-span-2 md:col-span-1">
            <h3 className="font-heading text-lg sm:text-xl text-primary-foreground mb-3 uppercase tracking-wider">RaidKhalid & Co.</h3>
            <p className="text-sm leading-relaxed opacity-70">Elevating basketball culture through excellence, community, and innovation.</p>
          </div>
          <div>
            <h4 className="font-heading text-sm text-primary-foreground mb-3 uppercase tracking-wider">Quick Links</h4>
            <ul className="space-y-1.5">
              {[{ l: "Home", p: "/" }, { l: "About Us", p: "/about" }, { l: "Players", p: "/players" }, { l: "Activities", p: "/activities" }, { l: "Contact", p: "/contact" }].map((item) => (
                <li key={item.l}><Link to={item.p} className="text-sm opacity-70 hover:opacity-100 transition-opacity duration-200">{item.l}</Link></li>
              ))}
            </ul>
          </div>
          <div className="hidden lg:block">
            <h4 className="font-heading text-sm text-primary-foreground mb-3 uppercase tracking-wider">Shop Categories</h4>
            <ul className="space-y-1.5">
              {Object.values(categoryLabels).slice(0, 5).map((label) => (
                <li key={label}><Link to="/shop" className="text-sm opacity-70 hover:opacity-100 transition-opacity duration-200">{label}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-heading text-sm text-primary-foreground mb-3 uppercase tracking-wider">Stay Connected</h4>
            <div className="flex gap-2 mb-4">
              <input type="email" placeholder="Your email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="flex-1 min-w-0 bg-primary-dark/50 border border-primary-light/20 rounded-md px-3 py-2 text-sm text-primary-foreground placeholder:text-footer-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary-light" />
              <button className="bg-primary hover:bg-primary-light text-primary-foreground px-3 py-2 rounded-md text-sm font-medium transition-colors flex-shrink-0"><Mail size={16} /></button>
            </div>

            {/* UPDATED: modern platform cards instead of plain pills */}
            {socialLinks.length > 0 && (
              <div className="flex flex-col gap-2">
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
                        padding: "10px 12px",
                        background: s.bg,
                        border: `1px solid ${s.border}`,
                        borderRadius: "12px",
                        textDecoration: "none",
                        transition: "transform .2s ease, border-color .2s ease",
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                        (e.currentTarget as HTMLElement).style.borderColor = s.dot + "66";
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                        (e.currentTarget as HTMLElement).style.borderColor = s.border;
                      }}
                    >
                      {/* Platform initial avatar */}
                      <div style={{
                        width: 28, height: 28, borderRadius: "8px",
                        background: s.dot,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "11px", fontWeight: 800, color: "#fff",
                        flexShrink: 0, textTransform: "uppercase",
                        fontFamily: "inherit",
                      }}>
                        {link.platform.charAt(0)}
                      </div>
                      <span style={{ fontSize: "13px", fontWeight: 600, color: s.text, flex: 1 }}>
                        {link.platform}
                      </span>
                      <ArrowUpRight size={12} style={{ color: s.text, opacity: 0.55 }} />
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        </div>
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
