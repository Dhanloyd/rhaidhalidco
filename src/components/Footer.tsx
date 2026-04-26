import { Link } from "react-router-dom";
import { Mail } from "lucide-react";
import { useState } from "react";
import { categoryLabels } from "@/data/products";

/* ─── Platform SVG icons ─── */
const FacebookIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const InstagramIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
  </svg>
);

const XIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.259 5.632 5.905-5.632zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const Footer = () => {
  const [email, setEmail] = useState("");

  return (
    <footer className="bg-footer text-footer-foreground">
      <div className="container mx-auto px-4 py-10 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-12">

          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <h3 className="font-heading text-lg sm:text-xl text-primary-foreground mb-3 uppercase tracking-wider">
              RaidKhalid & Co.
            </h3>
            <p className="text-sm leading-relaxed opacity-70">
              Elevating basketball culture through excellence, community, and innovation.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-heading text-sm text-primary-foreground mb-3 uppercase tracking-wider">
              Quick Links
            </h4>
            <ul className="space-y-1.5">
              {[
                { l: "Home", p: "/" },
                { l: "About Us", p: "/about" },
                { l: "Players", p: "/players" },
                { l: "Activities", p: "/activities" },
                { l: "Contact", p: "/contact" },
              ].map((item) => (
                <li key={item.l}>
                  <Link
                    to={item.p}
                    className="text-sm opacity-70 hover:opacity-100 transition-opacity duration-200"
                  >
                    {item.l}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Shop Categories */}
          <div className="hidden lg:block">
            <h4 className="font-heading text-sm text-primary-foreground mb-3 uppercase tracking-wider">
              Shop Categories
            </h4>
            <ul className="space-y-1.5">
              {Object.values(categoryLabels).slice(0, 5).map((label) => (
                <li key={label}>
                  <Link
                    to="/shop"
                    className="text-sm opacity-70 hover:opacity-100 transition-opacity duration-200"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Stay Connected */}
          <div>
            <h4 className="font-heading text-sm text-primary-foreground mb-3 uppercase tracking-wider">
              Stay Connected
            </h4>

            {/* Email */}
            <div className="flex gap-2 mb-4">
              <input
                type="email"
                placeholder="Your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 min-w-0 bg-primary-dark/50 border border-primary-light/20 rounded-md px-3 py-2 text-sm text-primary-foreground placeholder:text-footer-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary-light"
              />
              <button className="bg-primary hover:bg-primary-light text-primary-foreground px-3 py-2 rounded-md text-sm font-medium transition-colors">
                <Mail size={15} />
              </button>
            </div>

            {/* ✅ Minimal Social Icons */}
            <div className="flex items-center gap-5 text-white/80">
              <a
                href="https://facebook.com/yourpage"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white hover:scale-110 transition-all duration-200"
              >
                <FacebookIcon />
              </a>

              <a
                href="https://instagram.com/yourpage"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white hover:scale-110 transition-all duration-200"
              >
                <InstagramIcon />
              </a>

              <a
                href="https://twitter.com/yourpage"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white hover:scale-110 transition-all duration-200"
              >
                <XIcon />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-10 pt-6 border-t border-primary-light/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs opacity-60">
            © 2026 RaidKhalid & Co. All Rights Reserved.
          </p>

          <div className="flex gap-4 text-xs opacity-60">
            <a href="#" className="hover:opacity-100 transition-opacity">
              Privacy Policy
            </a>
            <a href="#" className="hover:opacity-100 transition-opacity">
              Terms of Service
            </a>
            <Link to="/admin/login" className="hover:opacity-100 transition-opacity">
              Admin
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;