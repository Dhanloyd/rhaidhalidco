import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Lock, Mail, Eye, EyeOff } from "lucide-react";
import logo from "@/assets/logo.jpg";

const SignInPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const { signIn, user } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      supabase.from("profiles").select("display_name").eq("user_id", user.id).maybeSingle().then(({ data }) => {
        if (data?.display_name) setDisplayName(data.display_name);
      });
    }
  }, [user]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error("Please fill in all fields."); return; }
    setIsLoading(true);
    const { error } = await signIn(email, password);
    setIsLoading(false);
    if (error) toast.error(error.message);
    else { toast.success("Welcome back!"); navigate("/"); }
  };

  const handleForgotPassword = async () => {
    if (!forgotEmail) { toast.error("Enter your email"); return; }
    setForgotLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setForgotLoading(false);
    if (error) toast.error(error.message);
    else { toast.success("Password reset link sent to your email!"); setShowForgot(false); }
  };

  if (showForgot) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-navy px-4">
        <div className="w-full max-w-md">
          <div className="bg-card rounded-2xl shadow-2xl p-8 border border-border/50">
            <div className="text-center mb-8">
              <img src={logo} alt="RaidKhalid & Co." className="w-16 h-16 rounded-xl mx-auto mb-4 object-cover" />
              <h1 className="font-heading text-2xl uppercase tracking-wider text-foreground">Forgot Password</h1>
              <p className="text-sm text-muted-foreground mt-1">We'll send a reset link to your email</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Email</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} placeholder="you@email.com" className="pl-10" />
                </div>
              </div>
              <Button onClick={handleForgotPassword} className="w-full bg-primary text-primary-foreground hover:bg-primary-light font-heading uppercase tracking-wider" disabled={forgotLoading}>
                {forgotLoading ? "Sending..." : "Send Reset Link"}
              </Button>
              <Button variant="ghost" onClick={() => setShowForgot(false)} className="w-full text-muted-foreground">
                Back to Sign In
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center gradient-navy px-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-2xl shadow-2xl p-8 border border-border/50">
          <div className="text-center mb-8">
            <img src={logo} alt="RaidKhalid & Co." className="w-16 h-16 rounded-xl mx-auto mb-4 object-cover" />
            <h1 className="font-heading text-2xl uppercase tracking-wider text-foreground">Sign In</h1>
            <p className="text-sm text-muted-foreground mt-1">Welcome back to RaidKhalid & Co.</p>
          </div>
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" className="pl-10" />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-sm font-medium text-foreground">Password</label>
                <button type="button" onClick={() => setShowForgot(true)} className="text-xs text-primary hover:underline">Forgot Password?</button>
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="pl-10 pr-10" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary-light font-heading uppercase tracking-wider" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground mt-6">
            Don't have an account?{" "}
            <Link to="/signup" className="text-primary hover:underline font-medium">Sign Up</Link>
          </p>
          <p className="text-center text-xs text-muted-foreground mt-2">
            <Link to="/admin/login" className="hover:underline">Admin Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignInPage;
