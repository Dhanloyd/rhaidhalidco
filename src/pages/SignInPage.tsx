import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Lock, Mail, Eye, EyeOff, ArrowLeft } from "lucide-react";
import logo from "@/assets/logo.jpg";

// Floating particle canvas
const Particles = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const particles: {
      x: number; y: number; r: number;
      dx: number; dy: number; opacity: number;
    }[] = Array.from({ length: 55 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 2 + 0.5,
      dx: (Math.random() - 0.5) * 0.4,
      dy: (Math.random() - 0.5) * 0.4,
      opacity: Math.random() * 0.45 + 0.1,
    }));

    let animId: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(180, 160, 255, ${p.opacity})`;
        ctx.fill();
        p.x += p.dx;
        p.y += p.dy;
        if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.dy *= -1;
      });
      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-0" />;
};

const GlowBlobs = () => (
  <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
    <div
      className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-purple-500 blur-3xl"
      style={{ opacity: 0.08, animation: "pulse 4s ease-in-out infinite" }}
    />
    <div
      className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-blue-500 blur-3xl"
      style={{ opacity: 0.08, animation: "pulse 4s ease-in-out infinite", animationDelay: "2s" }}
    />
    <div
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-indigo-400 blur-3xl"
      style={{ opacity: 0.04 }}
    />
  </div>
);

const SignInPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { signIn, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.role === "admin") navigate("/admin", { replace: true });
        else navigate("/", { replace: true });
      });
  }, [user]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error("Please fill in all fields."); return; }
    setIsLoading(true);
    const { error } = await signIn(email, password);
    if (error) {
      toast.error(error.message);
      setIsLoading(false);
      return;
    }
    toast.success("Welcome back!");
  };

  const handleForgotPassword = async () => {
    if (!forgotEmail) { toast.error("Enter your email"); return; }
    setForgotLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setForgotLoading(false);
    if (error) toast.error(error.message);
    else { toast.success("Password reset link sent!"); setShowForgot(false); }
  };

  const cardAnim: React.CSSProperties = {
    opacity: mounted ? 1 : 0,
    transform: mounted ? "translateY(0) scale(1)" : "translateY(28px) scale(0.96)",
    transition: "opacity 0.55s cubic-bezier(0.22,1,0.36,1), transform 0.55s cubic-bezier(0.22,1,0.36,1)",
  };

  const LogoBlock = () => (
    <div className="text-center mb-8">
      <div className="relative inline-block mb-4">
        <div
          className="absolute inset-0 rounded-xl bg-primary/30 blur-lg scale-125"
          style={{ animation: "pulse 3s ease-in-out infinite" }}
        />
        <img src={logo} alt="RaidKhalid & Co." className="relative w-16 h-16 rounded-xl object-cover" />
      </div>
    </div>
  );

  if (showForgot) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-navy px-4 relative overflow-hidden">
        <Particles />
        <GlowBlobs />
        <div className="w-full max-w-md relative z-10">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
            <ArrowLeft size={15} />
            Back to Home
          </Link>
          <div className="bg-card/90 rounded-2xl shadow-2xl p-8 border border-border/50 backdrop-blur-md" style={cardAnim}>
            <LogoBlock />
            <h1 className="font-heading text-2xl uppercase tracking-wider text-foreground text-center -mt-4 mb-1">Forgot Password</h1>
            <p className="text-sm text-muted-foreground text-center mb-6">We'll send a reset link to your email</p>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Email</label>
                <div className="relative group">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} placeholder="you@email.com" className="pl-10" />
                </div>
              </div>
              <Button
                onClick={handleForgotPassword}
                disabled={forgotLoading}
                className="w-full bg-primary text-primary-foreground font-heading uppercase tracking-wider transition-all active:scale-[0.98] hover:shadow-[0_0_20px_hsl(var(--primary)/0.35)]"
              >
                {forgotLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" />
                    Sending...
                  </span>
                ) : "Send Reset Link"}
              </Button>
              <Button variant="ghost" onClick={() => setShowForgot(false)} className="w-full text-muted-foreground hover:text-foreground transition-colors">
                Back to Sign In
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center gradient-navy px-4 relative overflow-hidden">
      <Particles />
      <GlowBlobs />

      <div className="w-full max-w-md relative z-10">
        {/* Back to Home */}
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
          <ArrowLeft size={15} />
          Back to Home
        </Link>

        <div className="bg-card/90 rounded-2xl shadow-2xl p-8 border border-border/50 backdrop-blur-md" style={cardAnim}>
          <LogoBlock />
          <h1 className="font-heading text-2xl uppercase tracking-wider text-foreground text-center -mt-4 mb-1">Sign In</h1>
          <p className="text-sm text-muted-foreground text-center mb-6">Welcome back to RaidKhalid &amp; Co.</p>

          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Email</label>
              <div className="relative group">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  className="pl-10 transition-shadow focus:shadow-[0_0_0_2px_hsl(var(--primary)/0.25)]"
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-sm font-medium text-foreground">Password</label>
                <button type="button" onClick={() => setShowForgot(true)} className="text-xs text-primary hover:underline hover:opacity-80 transition-opacity">
                  Forgot Password?
                </button>
              </div>
              <div className="relative group">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10 pr-10 transition-shadow focus:shadow-[0_0_0_2px_hsl(var(--primary)/0.25)]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary text-primary-foreground hover:bg-primary-light font-heading uppercase tracking-wider transition-all active:scale-[0.98] hover:shadow-[0_0_22px_hsl(var(--primary)/0.4)]"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : "Sign In"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Don't have an account?{" "}
            <Link to="/signup" className="text-primary hover:underline font-medium hover:opacity-80 transition-opacity">Sign Up</Link>
          </p>
          <p className="text-center text-xs text-muted-foreground mt-2">
            <Link to="/admin/login" className="hover:underline hover:opacity-80 transition-opacity">Admin Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignInPage;
