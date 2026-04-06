import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Lock, Mail, User, Phone, Eye, EyeOff } from "lucide-react";
import logo from "@/assets/logo.jpg";

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
  const { signUp } = useAuth();
  const navigate = useNavigate();

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

  return (
    <div className="min-h-screen flex items-center justify-center gradient-navy px-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-2xl shadow-2xl p-8 border border-border/50">
          <div className="text-center mb-6">
            <img src={logo} alt="RaidKhalid & Co." className="w-16 h-16 rounded-xl mx-auto mb-4 object-cover" />
            <h1 className="font-heading text-2xl uppercase tracking-wider text-foreground">Create Account</h1>
            <p className="text-sm text-muted-foreground mt-1">Step {step} of 2</p>
          </div>

          {/* Progress bar */}
          <div className="flex gap-2 mb-6">
            <div className={`h-1 flex-1 rounded-full ${step >= 1 ? "bg-primary" : "bg-muted"}`} />
            <div className={`h-1 flex-1 rounded-full ${step >= 2 ? "bg-primary" : "bg-muted"}`} />
          </div>

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Email *</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" className="pl-10" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Password *</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 characters" className="pl-10 pr-10" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <div className="mt-1.5 flex gap-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className={`h-1 flex-1 rounded-full ${password.length >= i * 3 ? (password.length >= 12 ? "bg-green-500" : password.length >= 8 ? "bg-yellow-500" : "bg-red-500") : "bg-muted"}`} />
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Confirm Password *</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input type={showConfirm ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter password" className="pl-10 pr-10" />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <Button onClick={() => { if (validateStep1()) setStep(2); }} className="w-full bg-primary text-primary-foreground hover:bg-primary-light font-heading uppercase tracking-wider">
                Next
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Full Name *</label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Juan Dela Cruz" className="pl-10" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Phone Number *</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+63 9XX XXX XXXX" className="pl-10" />
                </div>
              </div>
              <label className="flex items-start gap-2 text-sm text-muted-foreground cursor-pointer">
                <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5 rounded" />
                <span>I agree to the <span className="text-primary">Terms of Service</span> and <span className="text-primary">Privacy Policy</span></span>
              </label>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1 font-heading uppercase tracking-wider">Back</Button>
                <Button onClick={handleSignUp} className="flex-1 bg-primary text-primary-foreground hover:bg-primary-light font-heading uppercase tracking-wider" disabled={isLoading}>
                  {isLoading ? "Creating..." : "Sign Up"}
                </Button>
              </div>
            </div>
          )}

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{" "}
            <Link to="/signin" className="text-primary hover:underline font-medium">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
