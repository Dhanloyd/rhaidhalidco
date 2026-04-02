import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, ShoppingCart } from "lucide-react";
import logo from "@/assets/logo.jpg";

const navLinks = [
  { label: "Home", path: "/" },
  { label: "About Us", path: "/about" },
  { label: "Founders", path: "/founders" },
  { label: "Activities", path: "/activities" },
  { label: "Players", path: "/players" },
  { label: "Shop", path: "/shop" },
  { label: "Contact", path: "/contact" },
];

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-nav/95 backdrop-blur-md border-b border-primary-light/10">
      <div className="container mx-auto flex items-center justify-between h-16 md:h-20 px-4">
        <Link to="/" className="flex items-center gap-3">
          <img src={logo} alt="RaidKhalid & Co." className="h-10 md:h-14 rounded" width={56} height={56} />
        </Link>

        {/* Desktop */}
        <div className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`px-3 py-2 text-sm font-medium tracking-wide uppercase transition-colors duration-200 rounded-md ${
                location.pathname === link.path
                  ? "text-primary-foreground bg-primary/20"
                  : "text-nav-foreground/80 hover:text-primary-foreground hover:bg-primary/10"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Link to="/shop" className="ml-3 p-2 text-nav-foreground/80 hover:text-primary-foreground transition-colors">
            <ShoppingCart size={20} />
          </Link>
        </div>

        {/* Mobile toggle */}
        <button onClick={() => setOpen(!open)} className="lg:hidden text-nav-foreground p-2">
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="lg:hidden bg-nav border-t border-primary-light/10 animate-fade-in">
          <div className="container mx-auto px-4 py-4 flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setOpen(false)}
                className={`px-4 py-3 text-sm font-medium tracking-wide uppercase rounded-md transition-colors ${
                  location.pathname === link.path
                    ? "text-primary-foreground bg-primary/20"
                    : "text-nav-foreground/70 hover:text-primary-foreground hover:bg-primary/10"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
