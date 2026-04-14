import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Lock, Mail, User, Phone, Eye, EyeOff, ArrowLeft } from "lucide-react";
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
      className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-indigo-500 blur-3xl"
      style={{ opacity: 0.08, animation: "pulse 4s ease-in-out infinite" }}
    />
    <div
      className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-violet-500 blur-3xl"
      style={{ opacity: 0.08, animation: "pulse 4s ease-in-out infinite", animationDelay: "2s" }}
    />
    <div
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-blue-400 blur-3xl"
      style={{ opacity: 0.04 }}
    />
  </div>
);

const SignUpPage = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

  const validateStep1 = () => {
    if (!email) { toast.error("Email is required"); return false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast.error("Invalid email format"); return false; }
    if (!password) { toast.error("Password is required"); return false; }
    if (password.length < 6) { toast.error("Password must be at least 6 characters"); return false; }
    if (password !== confirmPassword) { toast.error("Passwords do not match"); return false; }
    return true;
  };

  const validateStep2 = () => {
    if (!displayName.trim()) { toast.error("Full name is required"); return false; }
    if (!phone.trim()) { toast.error("Phone number is required"); return false; }
    if (!agreed) { toast.error("Please agree to the terms"); return false; }
    return true;
  };

  const handleSignUp = async () => {
    if (!validateStep2()) return;
    setIsLoading(true);
    const { error } = await signUp(email, password, displayName, phone);
    setIsLoading(false);
    if (error) toast.error(error.message);
    else { toast.success("Account created! Please check your email to verify."); navigate("/signin"); }
  };

  const cardAnim: React.CSSProperties = {
    opacity: mounted ? 1 : 0,
    transform: mounted ? "translateY(0) scale(1)" : "translateY(28px) scale(0.96)",
    transition: "opacity 0.55s cubic-bezier(0.22,1,0.36,1), transform 0.55s cubic-bezier(0.22,1,0.36,1)",
  };

  // Animate step transition
  const stepAnim: React.CSSProperties = {
    animation: "fadeSlideIn 0.35s cubic-bezier(0.22,1,0.36,1) both",
  };

  return (
    <div className="min-h-screen flex items-center justify-center gradient-navy px-4 relative overflow-hidden">
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateX(18px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>

      <Particles />
      <GlowBlobs />

      <div className="w-full max-w-md relative z-10">
        {/* Back to Home */}
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
          <ArrowLeft size={15} />
          Back to Home
        </Link>

        <div className="bg-card/90 rounded-2xl shadow-2xl p-8 border border-border/50 backdrop-blur-md" style={cardAnim}>
          <div className="text-center mb-6">
            {/* Logo with glow ring */}
            <div className="relative inline-block mb-4">
              <div
                className="absolute inset-0 rounded-xl bg-primary/30 blur-lg scale-125"
                style={{ animation: "pulse 3s ease-in-out infinite" }}
              />
              <img src={logo} alt="RaidKhalid & Co." className="relative w-16 h-16 rounded-xl object-cover" />
            </div>
            <h1 className="font-heading text-2xl uppercase tracking-wider text-foreground">Create Account</h1>
            <p className="text-sm text-muted-foreground mt-1">Step {step} of 2</p>
          </div>

          {/* Animated progress bar */}
          <div className="flex gap-2 mb-6">
            <div
              className="h-1 flex-1 rounded-full bg-primary transition-all duration-500"
              style={{ opacity: step >= 1 ? 1 : 0.2 }}
            />
            <div
              className="h-1 flex-1 rounded-full transition-all duration-500"
              style={{
                background: step >= 2 ? "hsl(var(--primary))" : "hsl(var(--muted))",
                opacity: step >= 2 ? 1 : 0.4,
              }}
            />
          </div>

          {step === 1 && (
            <div className="space-y-4" style={stepAnim}>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Email *</label>
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
                <label className="text-sm font-medium text-foreground mb-1.5 block">Password *</label>
                <div className="relative group">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="pl-10 pr-10 transition-shadow focus:shadow-[0_0_0_2px_hsl(var(--primary)/0.25)]"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {/* Animated strength bar */}
                <div className="mt-1.5 flex gap-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="h-1 flex-1 rounded-full transition-all duration-300"
                      style={{
                        background: password.length >= i * 3
                          ? password.length >= 12 ? "#22c55e" : password.length >= 8 ? "#eab308" : "#ef4444"
                          : "hsl(var(--muted))",
                      }}
                    />
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Confirm Password *</label>
                <div className="relative group">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="pl-10 pr-10 transition-shadow focus:shadow-[0_0_0_2px_hsl(var(--primary)/0.25)]"
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <Button
                onClick={() => { if (validateStep1()) setStep(2); }}
                className="w-full bg-primary text-primary-foreground hover:bg-primary-light font-heading uppercase tracking-wider transition-all active:scale-[0.98] hover:shadow-[0_0_22px_hsl(var(--primary)/0.4)]"
              >
                Next
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4" style={stepAnim}>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Full Name *</label>
                <div className="relative group">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Juan Dela Cruz"
                    className="pl-10 transition-shadow focus:shadow-[0_0_0_2px_hsl(var(--primary)/0.25)]"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Phone Number *</label>
                <div className="relative group">
                  <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+63 9XX XXX XXXX"
                    className="pl-10 transition-shadow focus:shadow-[0_0_0_2px_hsl(var(--primary)/0.25)]"
                  />
                </div>
              </div>
              <label className="flex items-start gap-2 text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5 rounded" />
                <span>I agree to the <span className="text-primary">Terms of Service</span> and <span className="text-primary">Privacy Policy</span></span>
              </label>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1 font-heading uppercase tracking-wider transition-all active:scale-[0.98]"
                >
                  Back
                </Button>
                <Button
                  onClick={handleSignUp}
                  disabled={isLoading}
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary-light font-heading uppercase tracking-wider transition-all active:scale-[0.98] hover:shadow-[0_0_22px_hsl(var(--primary)/0.4)]"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" />
                      Creating...
                    </span>
                  ) : "Sign Up"}
                </Button>
              </div>
            </div>
          )}

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{" "}
            <Link to="/signin" className="text-primary hover:underline font-medium hover:opacity-80 transition-opacity">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
