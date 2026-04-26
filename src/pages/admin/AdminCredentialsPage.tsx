import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Shield, Plus, Search, RefreshCw, Eye, EyeOff,
  Trash2, Pencil, AlertCircle, CheckCircle,
  ShieldCheck, ShieldAlert, KeyRound, UserCog,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

// ── Shared card style (matches TransactionsPage) ──────────────────────────────
const cardStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.08)",
  backdropFilter: "blur(20px)",
  boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
};

// ── Types ─────────────────────────────────────────────────────────────────────
interface AdminAccount {
  id: string;
  username: string;
  password_hash: string; // store bcrypt hash in production; plain for demo
  role: "super_admin" | "admin";
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

type ModalMode = "add" | "edit" | "delete" | null;

// ── Password strength ─────────────────────────────────────────────────────────
const getStrength = (pw: string) => {
  if (!pw) return { label: "", pct: 0, color: "transparent" };
  let s = 0;
  if (pw.length >= 8)           s++;
  if (/[A-Z]/.test(pw))        s++;
  if (/[0-9]/.test(pw))        s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  const map = [
    { label: "Weak",   pct: 25,  color: "#ef4444" },
    { label: "Fair",   pct: 50,  color: "#f59e0b" },
    { label: "Good",   pct: 75,  color: "#3b82f6" },
    { label: "Strong", pct: 100, color: "#22c55e" },
  ];
  return map[s - 1] ?? map[0];
};

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({
  msg,
  type,
  onDone,
}: {
  msg: string;
  type: "success" | "error";
  onDone: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div
      className="fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-2xl text-sm font-medium shadow-2xl"
      style={{
        background:
          type === "success" ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
        border: `1px solid ${
          type === "success" ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"
        }`,
        backdropFilter: "blur(20px)",
        color: type === "success" ? "#34d399" : "#f87171",
        animation: "fadeUp 0.3s ease forwards",
      }}
    >
      {type === "success" ? (
        <CheckCircle size={15} />
      ) : (
        <AlertCircle size={15} />
      )}
      {msg}
    </div>
  );
}

// ── Delete Confirm Modal ──────────────────────────────────────────────────────
function DeleteModal({
  account,
  onClose,
  onConfirm,
}: {
  account: AdminAccount | null;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!account) return null;
  return (
    <Dialog open={!!account} onOpenChange={onClose}>
      <DialogContent className="bg-[#111827] text-white border-white/10 max-w-sm">
        <DialogTitle className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-red-500/15 border border-red-500/25 flex items-center justify-center shrink-0">
            <Trash2 size={15} className="text-red-400" />
          </div>
          <div>
            <p className="text-sm font-semibold">Delete admin account</p>
            <p className="text-[11px] text-slate-400 font-normal mt-0.5">
              This action cannot be undone
            </p>
          </div>
        </DialogTitle>

        <div className="p-3 rounded-xl bg-white/5 border border-white/[0.08] text-sm">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">
            Account
          </p>
          <p className="font-semibold text-white">{account.username}</p>
          <p className="text-xs text-slate-400 capitalize mt-0.5">
            {account.role.replace("_", " ")}
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-red-500/8 border border-red-500/20 text-xs text-red-300 space-y-1">
          <p className="font-medium">This will permanently delete:</p>
          <ul className="text-slate-400 space-y-0.5 list-disc list-inside">
            <li>
              Login credentials for{" "}
              <strong className="text-slate-300">{account.username}</strong>
            </li>
            <li>All access to the admin panel</li>
          </ul>
        </div>

        <div className="flex gap-2">
          <Button
            className="flex-1 bg-red-600 hover:bg-red-500 text-white gap-1.5 text-sm"
            onClick={onConfirm}
          >
            <Trash2 size={13} /> Yes, delete account
          </Button>
          <Button
            variant="ghost"
            className="flex-1 border border-white/10 text-sm"
            onClick={onClose}
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Add / Edit Modal ──────────────────────────────────────────────────────────
function AccountModal({
  mode,
  account,
  onClose,
  onSave,
}: {
  mode: ModalMode;
  account: AdminAccount | null;
  onClose: () => void;
  onSave: (data: {
    username: string;
    password: string;
    role: AdminAccount["role"];
    is_active: boolean;
  }) => void;
}) {
  const [username,    setUsername]    = useState(account?.username  ?? "");
  const [password,    setPassword]    = useState("");
  const [confirm,     setConfirm]     = useState("");
  const [role,        setRole]        = useState<AdminAccount["role"]>(account?.role ?? "admin");
  const [isActive,    setIsActive]    = useState(account?.is_active ?? true);
  const [showPw,      setShowPw]      = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors,      setErrors]      = useState<Record<string, string>>({});

  const strength = getStrength(password);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!username.trim())                 e.username = "Username is required.";
    if (mode === "add" && !password)      e.password = "Password is required.";
    if (password && password.length < 8)  e.password = "At least 8 characters required.";
    if (password && password !== confirm) e.confirm  = "Passwords do not match.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave({ username: username.trim(), password, role, is_active: isActive });
  };

  const inputStyle = (hasErr?: boolean): React.CSSProperties => ({
    background: "rgba(255,255,255,0.05)",
    border: `1px solid ${hasErr ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)"}`,
    borderRadius: 12,
    color: "#e2e8f0",
    padding: "10px 14px",
    fontSize: 13,
    outline: "none",
    width: "100%",
    transition: "border-color 0.2s",
  });

  return (
    <Dialog open={mode === "add" || mode === "edit"} onOpenChange={onClose}>
      <DialogContent className="bg-[#111827] text-white border-white/10 max-w-md">
        <DialogTitle className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center shrink-0">
            {mode === "add" ? (
              <Plus size={15} className="text-indigo-400" />
            ) : (
              <Pencil size={15} className="text-indigo-400" />
            )}
          </div>
          <div>
            <p className="text-sm font-semibold">
              {mode === "add" ? "Add New Admin Account" : "Edit Admin Account"}
            </p>
            <p className="text-[11px] text-slate-400 font-normal mt-0.5">
              {mode === "add"
                ? "Create credentials for admin panel access"
                : `Editing: ${account?.username}`}
            </p>
          </div>
        </DialogTitle>

        <div className="space-y-4 py-1">
          {/* Username */}
          <div className="space-y-1.5">
            <label className="text-[11px] text-slate-400 uppercase tracking-widest font-medium">
              Username
            </label>
            <input
              style={inputStyle(!!errors.username)}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. admin_john"
            />
            {errors.username && (
              <p className="text-[11px] text-red-400">{errors.username}</p>
            )}
          </div>

          {/* Role */}
          <div className="space-y-1.5">
            <label className="text-[11px] text-slate-400 uppercase tracking-widest font-medium">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as AdminAccount["role"])}
              style={{ ...inputStyle(), appearance: "none" as any }}
            >
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-[11px] text-slate-400 uppercase tracking-widest font-medium">
              {mode === "edit"
                ? "New Password (leave blank to keep current)"
                : "Password"}
            </label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                style={{ ...inputStyle(!!errors.password), paddingRight: 40 }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            {password && (
              <div className="flex items-center gap-2 mt-1">
                <div
                  className="flex-1 h-1.5 rounded-full"
                  style={{ background: "rgba(255,255,255,0.08)" }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${strength.pct}%`, background: strength.color }}
                  />
                </div>
                <span
                  className="text-[11px] font-semibold"
                  style={{ color: strength.color }}
                >
                  {strength.label}
                </span>
              </div>
            )}
            {errors.password && (
              <p className="text-[11px] text-red-400">{errors.password}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label className="text-[11px] text-slate-400 uppercase tracking-widest font-medium">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                style={{ ...inputStyle(!!errors.confirm), paddingRight: 40 }}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            {errors.confirm && (
              <p className="text-[11px] text-red-400">{errors.confirm}</p>
            )}
          </div>

          {/* Active toggle */}
          <div
            className="flex items-center justify-between p-3.5 rounded-xl"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <div>
              <p className="text-sm font-medium text-slate-200">Account Active</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Inactive accounts cannot log in
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsActive((v) => !v)}
              className={`relative w-11 h-6 rounded-full transition-all duration-300 ${
                isActive ? "bg-indigo-500" : "bg-slate-700"
              }`}
            >
              <span
                className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300"
                style={{ transform: isActive ? "translateX(20px)" : "translateX(0)" }}
              />
            </button>
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <Button
            className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white gap-1.5 text-sm"
            onClick={handleSave}
          >
            {mode === "add" ? (
              <>
                <Plus size={13} /> Create Account
              </>
            ) : (
              <>
                <CheckCircle size={13} /> Save Changes
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            className="flex-1 border border-white/10 text-sm"
            onClick={onClose}
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminCredentialsPage() {
  const [accounts,     setAccounts]     = useState<AdminAccount[]>([]);
  const [filtered,     setFiltered]     = useState<AdminAccount[]>([]);
  const [loading,      setLoading]      = useState(false);
  const [search,       setSearch]       = useState("");
  const [roleFilter,   setRoleFilter]   = useState("all");
  const [modalMode,    setModalMode]    = useState<ModalMode>(null);
  const [selected,     setSelected]     = useState<AdminAccount | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminAccount | null>(null);
  const [revealedIds,  setRevealedIds]  = useState<Set<string>>(new Set());
  const [toast,        setToast]        = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") =>
    setToast({ msg, type });

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("admin_accounts")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error) setAccounts(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAccounts();
    const channel = supabase
      .channel("admin-accounts-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "admin_accounts" },
        fetchAccounts
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchAccounts]);

  // ── Filter ────────────────────────────────────────────────────────────────
  useEffect(() => {
    let result = [...accounts];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((a) => a.username.toLowerCase().includes(q));
    }
    if (roleFilter !== "all") result = result.filter((a) => a.role === roleFilter);
    setFiltered(result);
  }, [accounts, search, roleFilter]);

  // ── Save (add / edit) ─────────────────────────────────────────────────────
  const handleSave = async (data: {
    username: string;
    password: string;
    role: AdminAccount["role"];
    is_active: boolean;
  }) => {
    if (modalMode === "add") {
      const { error } = await supabase.from("admin_accounts").insert([{
        username:      data.username,
        password_hash: data.password, // hash server-side in production
        role:          data.role,
        is_active:     data.is_active,
      }]);
      if (error) { showToast("Failed to create account.", "error"); return; }
      showToast(`Account "${data.username}" created successfully.`);
    } else if (modalMode === "edit" && selected) {
      const updates: any = {
        username:   data.username,
        role:       data.role,
        is_active:  data.is_active,
        updated_at: new Date().toISOString(),
      };
      if (data.password) updates.password_hash = data.password;
      const { error } = await supabase
        .from("admin_accounts")
        .update(updates)
        .eq("id", selected.id);
      if (error) { showToast("Failed to update account.", "error"); return; }
      showToast(`Account "${data.username}" updated.`);
    }
    setModalMode(null);
    setSelected(null);
    fetchAccounts();
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase
      .from("admin_accounts")
      .delete()
      .eq("id", deleteTarget.id);
    if (error) showToast("Failed to delete account.", "error");
    else       showToast(`Account "${deleteTarget.username}" deleted.`);
    setDeleteTarget(null);
    fetchAccounts();
  };

  // ── Toggle reveal password ────────────────────────────────────────────────
  const toggleReveal = (id: string) => {
    setRevealedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ── Stats ─────────────────────────────────────────────────────────────────
  const totalAdmins   = accounts.length;
  const superAdmins   = accounts.filter((a) => a.role === "super_admin").length;
  const activeCount   = accounts.filter((a) => a.is_active).length;
  const inactiveCount = accounts.filter((a) => !a.is_active).length;

  const statCards = [
    { title: "Total Accounts", value: totalAdmins,   icon: UserCog,     iconBg: "bg-indigo-500/20",  iconColor: "text-indigo-400"  },
    { title: "Super Admins",   value: superAdmins,   icon: ShieldCheck, iconBg: "bg-violet-500/20",  iconColor: "text-violet-400"  },
    { title: "Active",         value: activeCount,   icon: Shield,      iconBg: "bg-emerald-500/20", iconColor: "text-emerald-400" },
    { title: "Inactive",       value: inactiveCount, icon: ShieldAlert, iconBg: "bg-red-500/20",     iconColor: "text-red-400"     },
  ];

  const roleTabs = [
    { key: "all",         label: "All",         count: accounts.length },
    { key: "super_admin", label: "Super Admin", count: superAdmins },
    { key: "admin",       label: "Admin",       count: accounts.filter((a) => a.role === "admin").length },
  ];

  return (
    <div
      className="min-h-screen p-6 space-y-6 relative"
      style={{ background: "linear-gradient(135deg,#0f1117 0%,#141824 50%,#0f1117 100%)" }}
    >
      {/* Ambient orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full opacity-10"
          style={{ background: "radial-gradient(circle,#6366f1,transparent 70%)" }}
        />
        <div
          className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full opacity-10"
          style={{ background: "radial-gradient(circle,#8b5cf6,transparent 70%)" }}
        />
      </div>

      {/* Toast */}
      {toast && (
        <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />
      )}

      {/* Modals */}
      <AccountModal
        mode={modalMode}
        account={selected}
        onClose={() => { setModalMode(null); setSelected(null); }}
        onSave={handleSave}
      />
      <DeleteModal
        account={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />

      {/* ── Header ── */}
      <div
        className="flex items-center justify-between relative z-10 opacity-0"
        style={{ animation: "fadeUp 0.5s ease forwards" }}
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            <span className="text-xs text-indigo-400 font-medium tracking-widest uppercase">
              Admin Panel
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Admin Credentials
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Manage admin accounts and login access
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchAccounts}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-slate-300 hover:text-white transition-all"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
          <button
            onClick={() => { setSelected(null); setModalMode("add"); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: "rgba(99,102,241,0.3)",
              border: "1px solid rgba(99,102,241,0.4)",
            }}
          >
            <Plus size={14} /> Add Admin
          </button>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
        {statCards.map((s, i) => (
          <div
            key={s.title}
            className="group rounded-2xl p-5 cursor-default transition-all duration-300 hover:scale-[1.02] opacity-0"
            style={{ ...cardStyle, animation: `fadeUp 0.5s ease ${i * 0.07}s forwards` }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.iconBg}`}>
                <s.icon size={18} className={s.iconColor} />
              </div>
              <KeyRound
                size={13}
                className="text-slate-600 group-hover:text-slate-400 transition-colors"
              />
            </div>
            <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">{s.title}</p>
            <p className="text-2xl font-bold text-white">{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── Table card ── */}
      <div
        className="rounded-2xl overflow-hidden opacity-0 relative z-10"
        style={{ ...cardStyle, animation: "fadeUp 0.5s ease 0.3s forwards" }}
      >
        {/* Filters bar */}
        <div
          className="p-4 flex flex-wrap items-center gap-3"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          {/* Role pills */}
          <div
            className="flex items-center gap-1 p-1 rounded-xl"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            {roleTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setRoleFilter(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all flex items-center gap-1.5 ${
                  roleFilter === tab.key
                    ? "bg-indigo-500/30 text-indigo-300"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {tab.label}
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    roleFilter === tab.key ? "bg-indigo-500/40" : "bg-white/10"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative ml-auto">
            <Search
              size={13}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search username…"
              className="pl-9 pr-4 py-2 rounded-xl text-sm text-slate-200 placeholder-slate-600 outline-none"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                width: 220,
              }}
            />
          </div>

          <span className="text-xs text-slate-500">
            {filtered.length} account{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                {[
                  "Username",
                  "Role",
                  "Password",
                  "Status",
                  "Created",
                  "Last Updated",
                  "Actions",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left px-5 py-3 text-xs text-slate-500 uppercase tracking-widest font-medium"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-slate-500">
                    <AlertCircle size={32} className="mx-auto mb-3 opacity-30" />
                    {search || roleFilter !== "all"
                      ? "No accounts match your filters"
                      : "No admin accounts yet. Click 'Add Admin' to get started."}
                  </td>
                </tr>
              ) : (
                filtered.map((account, i) => {
                  const revealed = revealedIds.has(account.id);
                  return (
                    <tr
                      key={account.id}
                      className="transition-all duration-150 hover:bg-white/[0.03] cursor-default"
                      style={{
                        borderBottom: "1px solid rgba(255,255,255,0.04)",
                        animation: `fadeUp 0.3s ease ${i * 0.04}s both`,
                      }}
                    >
                      {/* Username */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                            style={{
                              background:
                                account.role === "super_admin"
                                  ? "rgba(139,92,246,0.2)"
                                  : "rgba(99,102,241,0.2)",
                              color:
                                account.role === "super_admin"
                                  ? "#a78bfa"
                                  : "#818cf8",
                              border: `1px solid ${
                                account.role === "super_admin"
                                  ? "rgba(139,92,246,0.3)"
                                  : "rgba(99,102,241,0.3)"
                              }`,
                            }}
                          >
                            {account.username.slice(0, 2).toUpperCase()}
                          </div>
                          <p className="text-slate-200 font-semibold">
                            {account.username}
                          </p>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-5 py-4">
                        <span
                          className={`text-[11px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wide ${
                            account.role === "super_admin"
                              ? "bg-violet-500/15 text-violet-400 border border-violet-500/20"
                              : "bg-indigo-500/15 text-indigo-400 border border-indigo-500/20"
                          }`}
                        >
                          {account.role === "super_admin"
                            ? "⚡ Super Admin"
                            : "Admin"}
                        </span>
                      </td>

                      {/* Password masked / revealed */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-slate-400">
                            {revealed ? account.password_hash : "••••••••••••"}
                          </span>
                          <button
                            onClick={() => toggleReveal(account.id)}
                            className="text-slate-600 hover:text-slate-300 transition-colors"
                          >
                            {revealed ? <EyeOff size={13} /> : <Eye size={13} />}
                          </button>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <span
                          className={`text-[11px] px-2.5 py-1 rounded-full font-medium ${
                            account.is_active
                              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                              : "bg-red-500/15 text-red-400 border border-red-500/20"
                          }`}
                        >
                          {account.is_active ? "● Active" : "○ Inactive"}
                        </span>
                      </td>

                      {/* Created */}
                      <td className="px-5 py-4 text-xs text-slate-500">
                        {new Date(account.created_at).toLocaleDateString("en-PH", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>

                      {/* Updated */}
                      <td className="px-5 py-4 text-xs text-slate-500">
                        {account.updated_at
                          ? new Date(account.updated_at).toLocaleDateString("en-PH", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "—"}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              setSelected(account);
                              setModalMode("edit");
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-all hover:scale-[1.03] active:scale-[0.98]"
                            style={{
                              background: "rgba(99,102,241,0.1)",
                              border: "1px solid rgba(99,102,241,0.2)",
                            }}
                          >
                            <Pencil size={11} /> Edit
                          </button>
                          <button
                            onClick={() => setDeleteTarget(account)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-red-400 hover:text-red-300 transition-all hover:scale-[1.03] active:scale-[0.98]"
                            style={{
                              background: "rgba(239,68,68,0.1)",
                              border: "1px solid rgba(239,68,68,0.2)",
                            }}
                          >
                            <Trash2 size={11} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Security note */}
      <div
        className="flex items-start gap-3 p-4 rounded-2xl relative z-10 opacity-0"
        style={{
          ...cardStyle,
          animation: "fadeUp 0.5s ease 0.45s forwards",
          borderColor: "rgba(99,102,241,0.2)",
        }}
      >
        <AlertCircle size={15} className="text-indigo-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-semibold text-indigo-300 mb-0.5">
            Security Note
          </p>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Passwords are shown for demo purposes. In production, store only bcrypt
            hashes via a secure server-side Supabase RPC — never plain text. The
            admin login page should validate credentials against the{" "}
            <code className="text-slate-400">admin_accounts</code> table using a
            secure compare function.
          </p>
        </div>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        select option { background: #141824; color: #cbd5e1; }
      `}</style>
    </div>
  );
}
