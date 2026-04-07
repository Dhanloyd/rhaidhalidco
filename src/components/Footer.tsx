import { Link } from "react-router-dom";
import { Mail, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";
import { categoryLabels } from "@/data/products";
import { supabase } from "@/integrations/supabase/client";

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
            {socialLinks.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {socialLinks.map((link) => (
                  <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-full bg-primary-dark/40 hover:bg-primary/60 text-footer-foreground hover:text-primary-foreground transition-all duration-200 text-xs font-medium flex items-center gap-1">
                    {link.platform} <ExternalLink size={10} />
                  </a>
                ))}
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
