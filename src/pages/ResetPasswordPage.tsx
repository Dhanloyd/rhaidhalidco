import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Lock } from "lucide-react";
import logo from "@/assets/logo.jpg";

const ResetPasswordPage = () => {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setReady(true);
    }
    supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
  }, []);

  const handleReset = async () => {
    if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    if (password !== confirm) { toast.error("Passwords do not match"); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) toast.error(error.message);
    else { toast.success("Password updated!"); navigate("/signin"); }
  };

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-navy px-4">
        <div className="bg-card rounded-2xl shadow-2xl p-8 border border-border/50 text-center">
          <p className="text-muted-foreground">Loading...</p>
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
            <h1 className="font-heading text-2xl uppercase tracking-wider text-foreground">Reset Password</h1>
            <p className="text-sm text-muted-foreground mt-1">Enter your new password</p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">New Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 characters" className="pl-10" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Confirm Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Re-enter password" className="pl-10" />
              </div>
            </div>
            <Button onClick={handleReset} className="w-full bg-primary text-primary-foreground font-heading uppercase tracking-wider" disabled={loading}>
              {loading ? "Updating..." : "Update Password"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
