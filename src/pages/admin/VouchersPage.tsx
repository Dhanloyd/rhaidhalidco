import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Plus, Pencil, Trash2, Search, Ticket,
  RefreshCw, AlertCircle, CheckCircle, Tag, ToggleLeft, ToggleRight,
} from "lucide-react";

// ── Shared card style ────────────────────────────────────────────────────────
const cardStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.08)",
  backdropFilter: "blur(20px)",
  boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
};

const emptyForm = {
  code: "",
  discount_type: "percentage",
  discount_value: 0,
  min_spend: 0,
  max_uses: null as number | null,
  expiry_date: "",
  active: true,
};

// ── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, type, onDone }: { msg: string; type: "success" | "error"; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t); }, [onDone]);
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-2xl text-sm font-medium shadow-2xl"
      style={{
        background: type === "success" ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
        border: `1px solid ${type === "success" ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
        backdropFilter: "blur(20px)",
        color: type === "success" ? "#34d399" : "#f87171",
        animation: "fadeUp 0.3s ease forwards",
      }}>
      {type === "success" ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
      {msg}
    </div>
  );
}

// ── Delete Modal ─────────────────────────────────────────────────────────────
function DeleteModal({ code, onClose, onConfirm }: { code: string | null; onClose: () => void; onConfirm: () => void }) {
  if (!code) return null;
  return (
    <Dialog open={!!code} onOpenChange={onClose}>
      <DialogContent className="bg-[#111827] text-white border-white/10 max-w-sm">
        <DialogTitle className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-red-500/15 border border-red-500/25 flex items-center justify-center shrink-0">
            <Trash2 size={15} className="text-red-400" />
          </div>
          <div>
            <p className="text-sm font-semibold">Delete voucher</p>
            <p className="text-[11px] text-slate-400 font-normal mt-0.5">This action cannot be undone</p>
          </div>
        </DialogTitle>
        <div className="p-3 rounded-xl bg-white/5 border border-white/[0.08] text-sm">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Voucher Code</p>
          <p className="font-mono font-bold text-amber-300 tracking-widest">{code}</p>
        </div>
        <div className="flex gap-2">
          <button className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-500 transition-colors"
            onClick={onConfirm}>
            <Trash2 size={13} /> Yes, delete
          </button>
          <button className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white transition-colors"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
            onClick={onClose}>Cancel</button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Voucher Modal ────────────────────────────────────────────────────────────
function VoucherModal({ open, editId, form, setForm, onClose, onSave }: {
  open: boolean;
  editId: string | null;
  form: typeof emptyForm;
  setForm: (f: typeof emptyForm) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  const inp = (hasErr?: boolean): React.CSSProperties => ({
    background: "rgba(255,255,255,0.05)",
    border: `1px solid ${hasErr ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)"}`,
    borderRadius: 12, color: "#e2e8f0", padding: "10px 14px",
    fontSize: 13, outline: "none", width: "100%", transition: "border-color 0.2s",
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#111827] text-white border-white/10 max-w-md">
        <DialogTitle className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-amber-500/15 border border-amber-500/25 flex items-center justify-center shrink-0">
            {editId ? <Pencil size={15} className="text-amber-400" /> : <Plus size={15} className="text-amber-400" />}
          </div>
          <div>
            <p className="text-sm font-semibold">{editId ? "Edit Voucher" : "New Voucher"}</p>
            <p className="text-[11px] text-slate-400 font-normal mt-0.5">
              {editId ? "Update voucher details" : "Create a new discount voucher"}
            </p>
          </div>
        </DialogTitle>

        <div className="space-y-4 py-1">
          <div className="space-y-1.5">
            <label className="text-[11px] text-slate-400 uppercase tracking-widest font-medium">Code *</label>
            <input style={inp()} value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="SAVE20" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] text-slate-400 uppercase tracking-widest font-medium">Type</label>
              <select value={form.discount_type} onChange={e => setForm({ ...form, discount_type: e.target.value })}
                style={{ ...inp(), appearance: "none" as any }}>
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed (₱)</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] text-slate-400 uppercase tracking-widest font-medium">Value *</label>
              <input type="number" style={inp()} value={form.discount_value}
                onChange={e => setForm({ ...form, discount_value: parseFloat(e.target.value) || 0 })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] text-slate-400 uppercase tracking-widest font-medium">Min Spend (₱)</label>
              <input type="number" style={inp()} value={form.min_spend}
                onChange={e => setForm({ ...form, min_spend: parseFloat(e.target.value) || 0 })} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] text-slate-400 uppercase tracking-widest font-medium">Max Uses</label>
              <input type="number" style={inp()} value={form.max_uses || ""}
                onChange={e => setForm({ ...form, max_uses: parseInt(e.target.value) || null })}
                placeholder="Unlimited" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] text-slate-400 uppercase tracking-widest font-medium">Expiry Date</label>
            <input type="date" style={inp()} value={form.expiry_date}
              onChange={e => setForm({ ...form, expiry_date: e.target.value })} />
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-xl"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div>
              <p className="text-sm font-medium text-slate-200">Active</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Inactive vouchers cannot be applied</p>
            </div>
            <button type="button" onClick={() => setForm({ ...form, active: !form.active })}
              className={`relative w-11 h-6 rounded-full transition-all duration-300 ${form.active ? "bg-amber-500" : "bg-slate-700"}`}>
              <span className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300"
                style={{ transform: form.active ? "translateX(20px)" : "translateX(0)" }} />
            </button>
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <button className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.01] active:scale-[0.99]"
            style={{ background: "rgba(245,158,11,0.3)", border: "1px solid rgba(245,158,11,0.4)" }}
            onClick={onSave}>
            {editId ? <><CheckCircle size={13} /> Update Voucher</> : <><Plus size={13} /> Create Voucher</>}
          </button>
          <button className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white transition-colors"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
            onClick={onClose}>Cancel</button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
const VouchersPage = () => {
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [deleteCode, setDeleteCode] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [toastState, setToastState] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => setToastState({ msg, type });

  useEffect(() => { fetchVouchers(); }, []);

  const fetchVouchers = async () => {
    setLoading(true);
    const { data } = await supabase.from("vouchers").select("*").order("created_at", { ascending: false });
    setVouchers(data || []);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!form.code || form.discount_value <= 0) { showToast("Code and discount value required", "error"); return; }
    const payload = { ...form, code: form.code.toUpperCase(), expiry_date: form.expiry_date || null, max_uses: form.max_uses || null };
    if (editId) {
      const { error } = await supabase.from("vouchers").update(payload).eq("id", editId);
      if (error) { showToast("Failed to update", "error"); return; }
      showToast(`Voucher "${payload.code}" updated`);
    } else {
      const { error } = await supabase.from("vouchers").insert(payload);
      if (error) { showToast("Failed to create", "error"); return; }
      showToast(`Voucher "${payload.code}" created`);
    }
    setForm(emptyForm); setEditId(null); setDialogOpen(false); fetchVouchers();
  };

  const handleEdit = (v: any) => {
    setForm({ code: v.code, discount_type: v.discount_type, discount_value: v.discount_value, min_spend: v.min_spend, max_uses: v.max_uses, expiry_date: v.expiry_date?.slice(0, 10) || "", active: v.active });
    setEditId(v.id); setDialogOpen(true);
  };

  const confirmDelete = (v: any) => { setDeleteCode(v.code); setDeleteId(v.id); };

  const handleDelete = async () => {
    if (!deleteId) return;
    await supabase.from("vouchers").delete().eq("id", deleteId);
    showToast(`Voucher "${deleteCode}" deleted`);
    setDeleteCode(null); setDeleteId(null); fetchVouchers();
  };

  const filtered = vouchers.filter(v => {
    const matchSearch = v.code.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || v.discount_type === typeFilter;
    return matchSearch && matchType;
  });

  // Stats
  const activeCount = vouchers.filter(v => v.active).length;
  const pctCount = vouchers.filter(v => v.discount_type === "percentage").length;
  const fixedCount = vouchers.filter(v => v.discount_type === "fixed").length;

  const statCards = [
    { title: "Total Vouchers", value: vouchers.length, iconBg: "bg-amber-500/20", iconColor: "text-amber-400", dot: "#f59e0b" },
    { title: "Active",         value: activeCount,     iconBg: "bg-emerald-500/20", iconColor: "text-emerald-400", dot: "#22c55e" },
    { title: "Percentage",     value: pctCount,        iconBg: "bg-indigo-500/20",  iconColor: "text-indigo-400",  dot: "#6366f1" },
    { title: "Fixed Amount",   value: fixedCount,      iconBg: "bg-violet-500/20",  iconColor: "text-violet-400",  dot: "#8b5cf6" },
  ];

  const typeTabs = [
    { key: "all",        label: "All",        count: vouchers.length },
    { key: "percentage", label: "Percentage", count: pctCount },
    { key: "fixed",      label: "Fixed",      count: fixedCount },
  ];

  return (
    <div className="min-h-screen p-6 space-y-6 relative"
      style={{ background: "linear-gradient(135deg,#0f1117 0%,#141824 50%,#0f1117 100%)" }}>

      {/* Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full opacity-10"
          style={{ background: "radial-gradient(circle,#f59e0b,transparent 70%)" }} />
        <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full opacity-10"
          style={{ background: "radial-gradient(circle,#f97316,transparent 70%)" }} />
      </div>

      {toastState && <Toast msg={toastState.msg} type={toastState.type} onDone={() => setToastState(null)} />}

      <VoucherModal open={dialogOpen} editId={editId} form={form} setForm={setForm}
        onClose={() => { setDialogOpen(false); setForm(emptyForm); setEditId(null); }}
        onSave={handleSave} />

      <DeleteModal code={deleteCode} onClose={() => { setDeleteCode(null); setDeleteId(null); }} onConfirm={handleDelete} />

      {/* Header */}
      <div className="flex items-center justify-between relative z-10 opacity-0"
        style={{ animation: "fadeUp 0.5s ease forwards" }}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-xs text-amber-400 font-medium tracking-widest uppercase">Promotions</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Ticket size={22} /> Vouchers
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">Manage discount codes and promotions</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchVouchers} disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-slate-300 hover:text-white transition-all"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
          <button onClick={() => { setForm(emptyForm); setEditId(null); setDialogOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: "rgba(245,158,11,0.3)", border: "1px solid rgba(245,158,11,0.4)" }}>
            <Plus size={14} /> Add Voucher
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
        {statCards.map((s, i) => (
          <div key={s.title}
            className="group rounded-2xl p-5 cursor-default transition-all duration-300 hover:scale-[1.02] opacity-0"
            style={{ ...cardStyle, animation: `fadeUp 0.5s ease ${i * 0.07}s forwards` }}>
            <div className="flex items-start justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.iconBg}`}>
                <Tag size={18} className={s.iconColor} />
              </div>
              <div className="w-2 h-2 rounded-full mt-1" style={{ background: s.dot, boxShadow: `0 0 8px ${s.dot}` }} />
            </div>
            <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">{s.title}</p>
            <p className="text-2xl font-bold text-white">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden opacity-0 relative z-10"
        style={{ ...cardStyle, animation: "fadeUp 0.5s ease 0.3s forwards" }}>

        {/* Filter bar */}
        <div className="p-4 flex flex-wrap items-center gap-3"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-1 p-1 rounded-xl"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
            {typeTabs.map(tab => (
              <button key={tab.key} onClick={() => setTypeFilter(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all flex items-center gap-1.5 ${typeFilter === tab.key ? "bg-amber-500/30 text-amber-300" : "text-slate-500 hover:text-slate-300"}`}>
                {tab.label}
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${typeFilter === tab.key ? "bg-amber-500/40" : "bg-white/10"}`}>{tab.count}</span>
              </button>
            ))}
          </div>
          <div className="relative ml-auto">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search vouchers…"
              className="pl-9 pr-4 py-2 rounded-xl text-sm text-slate-200 placeholder-slate-600 outline-none"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", width: 220 }} />
          </div>
          <span className="text-xs text-slate-500">{filtered.length} voucher{filtered.length !== 1 ? "s" : ""}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                {["Code", "Type", "Value", "Min Spend", "Usage", "Expiry", "Status", "Actions"].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs text-slate-500 uppercase tracking-widest font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-16">
                  <div className="flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400" /></div>
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-16 text-slate-500">
                  <AlertCircle size={32} className="mx-auto mb-3 opacity-30" />
                  {search || typeFilter !== "all" ? "No vouchers match your filters" : "No vouchers yet. Click 'Add Voucher' to get started."}
                </td></tr>
              ) : filtered.map((v, i) => (
                <tr key={v.id}
                  className="transition-all duration-150 hover:bg-white/[0.03] cursor-default"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", animation: `fadeUp 0.3s ease ${i * 0.04}s both` }}>

                  <td className="px-5 py-4">
                    <span className="font-mono font-bold text-amber-300 tracking-widest text-sm">{v.code}</span>
                  </td>

                  <td className="px-5 py-4">
                    <span className={`text-[11px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wide ${
                      v.discount_type === "percentage"
                        ? "bg-indigo-500/15 text-indigo-400 border border-indigo-500/20"
                        : "bg-violet-500/15 text-violet-400 border border-violet-500/20"
                    }`}>
                      {v.discount_type === "percentage" ? "% Percent" : "₱ Fixed"}
                    </span>
                  </td>

                  <td className="px-5 py-4 font-bold text-white">
                    {v.discount_type === "percentage" ? `${v.discount_value}%` : `₱${v.discount_value}`}
                  </td>

                  <td className="px-5 py-4 text-sm text-slate-400">₱{v.min_spend}</td>

                  <td className="px-5 py-4 text-sm text-slate-400">
                    {v.used_count ?? 0}{v.max_uses ? ` / ${v.max_uses}` : ""}
                  </td>

                  <td className="px-5 py-4 text-xs text-slate-500">
                    {v.expiry_date ? new Date(v.expiry_date).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                  </td>

                  <td className="px-5 py-4">
                    <span className={`text-[11px] px-2.5 py-1 rounded-full font-medium ${
                      v.active
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                        : "bg-red-500/15 text-red-400 border border-red-500/20"
                    }`}>
                      {v.active ? "● Active" : "○ Inactive"}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => handleEdit(v)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-amber-400 hover:text-amber-300 transition-all hover:scale-[1.03] active:scale-[0.98]"
                        style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)" }}>
                        <Pencil size={11} /> Edit
                      </button>
                      <button onClick={() => confirmDelete(v)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-red-400 hover:text-red-300 transition-all hover:scale-[1.03] active:scale-[0.98]"
                        style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
                        <Trash2 size={11} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        select option { background: #141824; color: #cbd5e1; }
      `}</style>
    </div>
  );
};

export default VouchersPage;
