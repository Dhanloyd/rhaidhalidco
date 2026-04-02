import { Link } from "react-router-dom";
import { Facebook, Instagram, Twitter, Youtube, Mail } from "lucide-react";
import { useState } from "react";

const Footer = () => {
  const [email, setEmail] = useState("");

  return (
    <footer className="bg-footer text-footer-foreground">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div>
            <h3 className="font-heading text-xl text-primary-foreground mb-4 uppercase tracking-wider">RaidKhalid & Co.</h3>
            <p className="text-sm leading-relaxed opacity-70">
              Elevating basketball culture through excellence, community, and innovation.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-heading text-sm text-primary-foreground mb-4 uppercase tracking-wider">Quick Links</h4>
            <ul className="space-y-2">
              {["Home", "About Us", "Players", "Activities", "Contact"].map((item) => (
                <li key={item}>
                  <Link
                    to={item === "Home" ? "/" : `/${item.toLowerCase().replace(" ", "-").replace("about-us", "about")}`}
                    className="text-sm opacity-70 hover:opacity-100 transition-opacity duration-200"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Shop Categories */}
          <div>
            <h4 className="font-heading text-sm text-primary-foreground mb-4 uppercase tracking-wider">Shop</h4>
            <ul className="space-y-2">
              {["All Products", "Apparel", "Food & Drinks", "New Arrivals", "Hot Items"].map((item) => (
                <li key={item}>
                  <Link to="/shop" className="text-sm opacity-70 hover:opacity-100 transition-opacity duration-200">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter + Social */}
          <div>
            <h4 className="font-heading text-sm text-primary-foreground mb-4 uppercase tracking-wider">Stay Connected</h4>
            <div className="flex gap-2 mb-4">
              <input
                type="email"
                placeholder="Your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 bg-primary-dark/50 border border-primary-light/20 rounded-md px-3 py-2 text-sm text-primary-foreground placeholder:text-footer-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary-light"
              />
              <button className="bg-primary hover:bg-primary-light text-primary-foreground px-4 py-2 rounded-md text-sm font-medium transition-colors">
                <Mail size={16} />
              </button>
            </div>
            <div className="flex gap-3">
              {[Facebook, Instagram, Twitter, Youtube].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="p-2 rounded-full bg-primary-dark/40 hover:bg-primary/60 text-footer-foreground hover:text-primary-foreground transition-all duration-200 hover:scale-110"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-primary-light/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs opacity-60">© 2026 RaidKhalid & Co. All Rights Reserved.</p>
          <div className="flex gap-6 text-xs opacity-60">
            <a href="#" className="hover:opacity-100 transition-opacity">Privacy Policy</a>
            <a href="#" className="hover:opacity-100 transition-opacity">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
