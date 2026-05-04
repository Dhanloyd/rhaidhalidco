import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  Plus, Trash2, Search, Zap, RefreshCw,
  AlertCircle, CheckCircle, TrendingDown, Clock, PackageOpen,
} from "lucide-react";

// ── Shared card style ────────────────────────────────────────────────────────
const cardStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.08)",
  backdropFilter: "blur(20px)",
  boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
};

const emptyForm = {
  product_id: "",
  sale_price: 0,
  original_price: 0,
  start_date: "",
  end_date: "",
  stock_limit: null as number | null,
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
function DeleteModal({ name, onClose, onConfirm }: { name: string | null; onClose: () => void; onConfirm: () => void }) {
  if (!name) return null;
  return (
    <Dialog open={!!name} onOpenChange={onClose}>
      <DialogContent className="bg-[#111827] text-white border-white/10 max-w-sm">
        <DialogTitle className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-red-500/15 border border-red-500/25 flex items-center justify-center shrink-0">
            <Trash2 size={15} className="text-red-400" />
          </div>
          <div>
            <p className="text-sm font-semibold">Delete flash sale</p>
            <p className="text-[11px] text-slate-400 font-normal mt-0.5">This action cannot be undone</p>
          </div>
        </DialogTitle>
        <div className="p-3 rounded-xl bg-white/5 border border-white/[0.08] text-sm">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Product</p>
          <p className="font-semibold text-white">{name}</p>
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

// ── Flash Sale Modal ─────────────────────────────────────────────────────────
function FlashSaleModal({ open, form, setForm, products, onClose, onSave }: {
  open: boolean;
  form: typeof emptyForm;
  setForm: (f: typeof emptyForm) => void;
  products: any[];
  onClose: () => void;
  onSave: () => void;
}) {
  const inp = (): React.CSSProperties => ({
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 12, color: "#e2e8f0", padding: "10px 14px",
    fontSize: 13, outline: "none", width: "100%", transition: "border-color 0.2s",
  });

  const selectProduct = (id: string) => {
    const prod = products.find(p => p.id === id);
    setForm({ ...form, product_id: id, original_price: prod?.price || 0 });
  };

  const discount = form.original_price > 0
    ? Math.round((1 - form.sale_price / form.original_price) * 100)
    : 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#111827] text-white border-white/10 max-w-md">
        <DialogTitle className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-rose-500/15 border border-rose-500/25 flex items-center justify-center shrink-0">
            <Zap size={15} className="text-rose-400" />
          </div>
          <div>
            <p className="text-sm font-semibold">New Flash Sale</p>
            <p className="text-[11px] text-slate-400 font-normal mt-0.5">Set up a limited-time price drop</p>
          </div>
        </DialogTitle>

        <div className="space-y-4 py-1">
          <div className="space-y-1.5">
            <label className="text-[11px] text-slate-400 uppercase tracking-widest font-medium">Product *</label>
            <select value={form.product_id} onChange={e => selectProduct(e.target.value)}
              style={{ ...inp(), appearance: "none" as any }}>
              <option value="">Select a product…</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name} — ₱{p.price}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] text-slate-400 uppercase tracking-widest font-medium">Original Price</label>
              <input type="number" style={{ ...inp(), color: "#94a3b8" }} value={form.original_price} readOnly />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] text-slate-400 uppercase tracking-widest font-medium">Sale Price *</label>
              <input type="number" style={inp()} value={form.sale_price}
                onChange={e => setForm({ ...form, sale_price: parseFloat(e.target.value) || 0 })} />
            </div>
          </div>

          {discount > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
              <TrendingDown size={14} className="text-rose-400" />
              <span className="text-xs text-rose-300 font-semibold">{discount}% discount applied</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] text-slate-400 uppercase tracking-widest font-medium">Start *</label>
              <input type="datetime-local" style={inp()} value={form.start_date}
                onChange={e => setForm({ ...form, start_date: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] text-slate-400 uppercase tracking-widest font-medium">End *</label>
              <input type="datetime-local" style={inp()} value={form.end_date}
                onChange={e => setForm({ ...form, end_date: e.target.value })} />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] text-slate-400 uppercase tracking-widest font-medium">Stock Limit</label>
            <input type="number" style={inp()} value={form.stock_limit || ""}
              onChange={e => setForm({ ...form, stock_limit: parseInt(e.target.value) || null })}
              placeholder="Unlimited" />
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-xl"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div>
              <p className="text-sm font-medium text-slate-200">Active</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Inactive sales won't show on storefront</p>
            </div>
            <button type="button" onClick={() => setForm({ ...form, active: !form.active })}
              className={`relative w-11 h-6 rounded-full transition-all duration-300 ${form.active ? "bg-rose-500" : "bg-slate-700"}`}>
              <span className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300"
                style={{ transform: form.active ? "translateX(20px)" : "translateX(0)" }} />
            </button>
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <button className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.01] active:scale-[0.99]"
            style={{ background: "rgba(239,68,68,0.3)", border: "1px solid rgba(239,68,68,0.4)" }}
            onClick={onSave}>
            <Zap size={13} /> Launch Flash Sale
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
const FlashSalesPage = () => {
  const [sales, setSales] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [deleteName, setDeleteName] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [toastState, setToastState] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => setToastState({ msg, type });

  useEffect(() => {
    Promise.all([
      supabase.from("flash_sales").select("*, products(name, image_url)").order("created_at", { ascending: false }),
      supabase.from("products").select("id, name, price").order("name"),
    ]).then(([salesRes, prodsRes]) => {
      setSales(salesRes.data || []);
      setProducts(prodsRes.data || []);
      setLoading(false);
    });
  }, []);

  const fetchSales = async () => {
    setLoading(true);
    const { data } = await supabase.from("flash_sales").select("*, products(name, image_url)").order("created_at", { ascending: false });
    setSales(data || []);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!form.product_id || form.sale_price <= 0 || !form.start_date || !form.end_date) {
      showToast("Fill all required fields", "error"); return;
    }
    const { error } = await supabase.from("flash_sales").insert({ ...form, stock_limit: form.stock_limit || null });
    if (error) { showToast("Failed to create flash sale", "error"); return; }
    showToast("Flash sale launched!");
    setForm(emptyForm); setDialogOpen(false); fetchSales();
  };

  const confirmDelete = (s: any) => {
    setDeleteName((s.products as any)?.name || "this product");
    setDeleteId(s.id);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await supabase.from("flash_sales").delete().eq("id", deleteId);
    showToast("Flash sale deleted");
    setDeleteName(null); setDeleteId(null); fetchSales();
  };

  const now = new Date();
  const isLive = (s: any) => s.active && new Date(s.start_date) <= now && new Date(s.end_date) >= now;
  const isUpcoming = (s: any) => s.active && new Date(s.start_date) > now;

  const liveCount = sales.filter(isLive).length;
  const upcomingCount = sales.filter(isUpcoming).length;
  const expiredCount = sales.filter(s => new Date(s.end_date) < now).length;

  const filtered = sales.filter(s => {
    const matchSearch = (s.products as any)?.name?.toLowerCase().includes(search.toLowerCase());
    if (statusFilter === "live")     return matchSearch && isLive(s);
    if (statusFilter === "upcoming") return matchSearch && isUpcoming(s);
    if (statusFilter === "expired")  return matchSearch && new Date(s.end_date) < now;
    return matchSearch;
  });

  const statCards = [
    { title: "Total Sales",  value: sales.length,   iconBg: "bg-rose-500/20",    iconColor: "text-rose-400",    dot: "#f43f5e" },
    { title: "Live Now",     value: liveCount,      iconBg: "bg-emerald-500/20", iconColor: "text-emerald-400", dot: "#22c55e" },
    { title: "Upcoming",     value: upcomingCount,  iconBg: "bg-amber-500/20",   iconColor: "text-amber-400",   dot: "#f59e0b" },
    { title: "Expired",      value: expiredCount,   iconBg: "bg-slate-500/20",   iconColor: "text-slate-400",   dot: "#64748b" },
  ];

  const statusTabs = [
    { key: "all",      label: "All",      count: sales.length },
    { key: "live",     label: "Live",     count: liveCount },
    { key: "upcoming", label: "Upcoming", count: upcomingCount },
    { key: "expired",  label: "Expired",  count: expiredCount },
  ];

  return (
    <div className="min-h-screen p-6 space-y-6 relative"
      style={{ background: "linear-gradient(135deg,#0f1117 0%,#141824 50%,#0f1117 100%)" }}>

      {/* Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full opacity-10"
          style={{ background: "radial-gradient(circle,#f43f5e,transparent 70%)" }} />
        <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full opacity-10"
          style={{ background: "radial-gradient(circle,#fb923c,transparent 70%)" }} />
      </div>

      {toastState && <Toast msg={toastState.msg} type={toastState.type} onDone={() => setToastState(null)} />}

      <FlashSaleModal open={dialogOpen} form={form} setForm={setForm} products={products}
        onClose={() => { setDialogOpen(false); setForm(emptyForm); }}
        onSave={handleSave} />

      <DeleteModal name={deleteName} onClose={() => { setDeleteName(null); setDeleteId(null); }} onConfirm={handleDelete} />

      {/* Header */}
      <div className="flex items-center justify-between relative z-10 opacity-0"
        style={{ animation: "fadeUp 0.5s ease forwards" }}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
            <span className="text-xs text-rose-400 font-medium tracking-widest uppercase">Limited Time Deals</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Zap size={22} className="text-rose-400" /> Flash Sales
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">Manage limited-time price promotions</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchSales} disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-slate-300 hover:text-white transition-all"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
          <button onClick={() => { setForm(emptyForm); setDialogOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: "rgba(244,63,94,0.3)", border: "1px solid rgba(244,63,94,0.4)" }}>
            <Plus size={14} /> Add Flash Sale
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
                <Zap size={18} className={s.iconColor} />
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
            {statusTabs.map(tab => (
              <button key={tab.key} onClick={() => setStatusFilter(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all flex items-center gap-1.5 ${statusFilter === tab.key ? "bg-rose-500/30 text-rose-300" : "text-slate-500 hover:text-slate-300"}`}>
                {tab.label}
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${statusFilter === tab.key ? "bg-rose-500/40" : "bg-white/10"}`}>{tab.count}</span>
              </button>
            ))}
          </div>
          <div className="relative ml-auto">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products…"
              className="pl-9 pr-4 py-2 rounded-xl text-sm text-slate-200 placeholder-slate-600 outline-none"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", width: 220 }} />
          </div>
          <span className="text-xs text-slate-500">{filtered.length} sale{filtered.length !== 1 ? "s" : ""}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                {["Product", "Original", "Sale Price", "Discount", "Period", "Sold", "Status", "Actions"].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs text-slate-500 uppercase tracking-widest font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-16">
                  <div className="flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-400" /></div>
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-16 text-slate-500">
                  <AlertCircle size={32} className="mx-auto mb-3 opacity-30" />
                  {search || statusFilter !== "all" ? "No sales match your filters" : "No flash sales yet. Click 'Add Flash Sale' to get started."}
                </td></tr>
              ) : filtered.map((s, i) => {
                const live = isLive(s);
                const upcoming = isUpcoming(s);
                const expired = new Date(s.end_date) < now;
                const discountPct = s.original_price > 0 ? Math.round((1 - s.sale_price / s.original_price) * 100) : 0;

                return (
                  <tr key={s.id}
                    className="transition-all duration-150 hover:bg-white/[0.03] cursor-default"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", animation: `fadeUp 0.3s ease ${i * 0.04}s both` }}>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                          style={{ background: "rgba(244,63,94,0.2)", color: "#fb7185", border: "1px solid rgba(244,63,94,0.3)" }}>
                          {((s.products as any)?.name || "?").slice(0, 2).toUpperCase()}
                        </div>
                        <p className="text-slate-200 font-semibold">{(s.products as any)?.name}</p>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-slate-500 line-through text-sm">₱{s.original_price}</td>

                    <td className="px-5 py-4 font-bold text-rose-400 text-sm">₱{s.sale_price}</td>

                    <td className="px-5 py-4">
                      {discountPct > 0 && (
                        <span className="text-[11px] px-2.5 py-1 rounded-full font-bold bg-rose-500/15 text-rose-400 border border-rose-500/20">
                          -{discountPct}%
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Clock size={11} />
                        <span>{new Date(s.start_date).toLocaleDateString("en-PH", { month: "short", day: "numeric" })} — {new Date(s.end_date).toLocaleDateString("en-PH", { month: "short", day: "numeric" })}</span>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-400">
                      {s.sold_count ?? 0}{s.stock_limit ? ` / ${s.stock_limit}` : ""}
                    </td>

                    <td className="px-5 py-4">
                      {live && (
                        <span className="text-[11px] px-2.5 py-1 rounded-full font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 animate-pulse">
                          ● Live
                        </span>
                      )}
                      {upcoming && (
                        <span className="text-[11px] px-2.5 py-1 rounded-full font-medium bg-amber-500/15 text-amber-400 border border-amber-500/20">
                          ◌ Upcoming
                        </span>
                      )}
                      {expired && (
                        <span className="text-[11px] px-2.5 py-1 rounded-full font-medium bg-slate-500/15 text-slate-500 border border-slate-500/20">
                          ✕ Expired
                        </span>
                      )}
                      {!live && !upcoming && !expired && (
                        <span className="text-[11px] px-2.5 py-1 rounded-full font-medium bg-red-500/15 text-red-400 border border-red-500/20">
                          ○ Inactive
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <button onClick={() => confirmDelete(s)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-red-400 hover:text-red-300 transition-all hover:scale-[1.03] active:scale-[0.98]"
                        style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
                        <Trash2 size={11} /> Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
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

export default FlashSalesPage;
