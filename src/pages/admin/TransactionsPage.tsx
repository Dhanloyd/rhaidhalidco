import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  CreditCard, TrendingUp, CheckCircle, XCircle, Clock,
  RefreshCw, Search, ArrowUpRight, Download,
  Wallet, Ban, AlertCircle, Eye, X, Trash2, EyeOff, RotateCcw,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell,
} from "recharts";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const cardStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.08)",
  backdropFilter: "blur(20px)",
  boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
};

const STATUS_STYLES: Record<string, string> = {
  paid:             "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20",
  pending:          "bg-amber-500/15 text-amber-400 border border-amber-500/20",
  failed:           "bg-red-500/15 text-red-400 border border-red-500/20",
  refunded:         "bg-violet-500/15 text-violet-400 border border-violet-500/20",
  approved:         "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20",
  rejected:         "bg-red-500/15 text-red-400 border border-red-500/20",
  proof_submitted:  "bg-blue-500/15 text-blue-400 border border-blue-500/20",
  completed:        "bg-teal-500/15 text-teal-400 border border-teal-500/20",
};

const METHOD_ICONS: Record<string, string> = {
  gcash:        "📱",
  card:         "💳",
  cod:          "💵",
  grab_pay:     "🚗",
  gcash_manual: "📲",
};

const BAR_COLORS = ["#6366f1", "#8b5cf6", "#a78bfa", "#60a5fa", "#34d399", "#fb923c"];

// ── Proof Preview Modal ───────────────────────────────────────────────────────
const ProofModal = ({ url, onClose }: { url: string; onClose: () => void }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center p-4"
    style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}
    onClick={onClose}
  >
    <div className="relative max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={onClose}
        className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-slate-300 hover:text-white z-10"
      >
        <X size={14} />
      </button>
      <img src={url} alt="Payment proof" className="w-full rounded-2xl border border-white/10 shadow-2xl" />
    </div>
  </div>
);

// ── GCash Manual Delete Confirm Modal ─────────────────────────────────────────
function GCashDeleteModal({
  payment,
  onClose,
  onHide,
  onDeletePermanently,
}: {
  payment: any | null;
  onClose: () => void;
  onHide: (p: any) => void;
  onDeletePermanently: (p: any) => void;
}) {
  const [step, setStep] = useState<"choose" | "confirm">("choose");
  useEffect(() => { if (payment) setStep("choose"); }, [payment]);
  if (!payment) return null;

  const handleClose = () => { setStep("choose"); onClose(); };

  return (
    <Dialog open={!!payment} onOpenChange={handleClose}>
      <DialogContent className="bg-[#111827] text-white border-white/10 max-w-sm">
        {step === "choose" ? (
          <>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-red-500/15 border border-red-500/25 flex items-center justify-center shrink-0">
                <Trash2 size={15} className="text-red-400" />
              </div>
              <div>
                <p className="text-sm font-semibold">Remove payment</p>
                <p className="text-[11px] text-slate-400 font-normal mt-0.5">Choose how to remove this record</p>
              </div>
            </DialogTitle>

            <div className="p-3 rounded-xl bg-white/5 border border-white/[0.08] text-sm">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">{payment.reference_number}</p>
              <p className="font-medium">{payment.customer_name}</p>
              <p className="text-xs text-emerald-400">₱{Number(payment.amount).toLocaleString()} · {payment.status}</p>
            </div>

            <div className="flex flex-col gap-2.5">
              {!payment.is_deleted && (
                <button
                  onClick={() => { onHide(payment); handleClose(); }}
                  className="flex items-center gap-3 p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/15 transition-all text-left w-full">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center shrink-0">
                    <EyeOff size={14} className="text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-indigo-300">Hide payment</p>
                    <p className="text-[11px] text-slate-500">Moves to hidden list · can be restored anytime</p>
                  </div>
                </button>
              )}
              <button
                onClick={() => setStep("confirm")}
                className="flex items-center gap-3 p-3.5 rounded-xl bg-red-500/8 border border-red-500/20 hover:bg-red-500/12 transition-all text-left w-full">
                <div className="w-8 h-8 rounded-lg bg-red-500/15 flex items-center justify-center shrink-0">
                  <Trash2 size={14} className="text-red-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-red-400">Delete permanently</p>
                  <p className="text-[11px] text-slate-500">Cannot be undone · removes all payment data</p>
                </div>
              </button>
            </div>

            <Button variant="ghost" className="w-full border border-white/8 text-slate-400 text-sm" onClick={handleClose}>
              Cancel
            </Button>
          </>
        ) : (
          <>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center shrink-0">
                <AlertCircle size={15} className="text-red-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-red-300">Are you absolutely sure?</p>
                <p className="text-[11px] text-slate-400 font-normal mt-0.5">This action cannot be undone</p>
              </div>
            </DialogTitle>
            <div className="p-3.5 rounded-xl bg-red-500/8 border border-red-500/20 text-sm space-y-1">
              <p className="text-red-300 font-medium text-xs">This will permanently delete:</p>
              <ul className="text-slate-400 text-xs space-y-0.5 list-disc list-inside">
                <li>Payment record {payment.reference_number}</li>
                <li>Screenshot proof and all associated data</li>
              </ul>
            </div>
            <div className="flex gap-2">
              <Button
                className="flex-1 bg-red-600 hover:bg-red-500 text-white gap-1.5 text-sm"
                onClick={() => { onDeletePermanently(payment); setStep("choose"); handleClose(); }}>
                <Trash2 size={13} /> Yes, delete permanently
              </Button>
              <Button variant="ghost" className="flex-1 border border-white/10 text-sm" onClick={() => setStep("choose")}>
                Go back
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── GCash Manual Panel ────────────────────────────────────────────────────────
const GCashManualPanel = () => {
  const [payments, setPayments]           = useState<any[]>([]);
  const [filtered, setFiltered]           = useState<any[]>([]);
  const [loading, setLoading]             = useState(false);
  const [search, setSearch]               = useState("");
  const [statusFilter, setStatusFilter]   = useState("all");
  const [showHidden, setShowHidden]       = useState(false);
  const [previewUrl, setPreviewUrl]       = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteModal, setDeleteModal]     = useState<any>(null);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("gcash_payments")
      .select("*")
      .order("created_at", { ascending: false });
    setPayments(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPayments();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchPayments, 30000);

    // Real-time subscription
    const channel = supabase
      .channel("gcash-payments-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "gcash_payments" }, fetchPayments)
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [fetchPayments]);

  useEffect(() => {
    let result = payments.filter(p => showHidden ? p.is_deleted : !p.is_deleted);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((p) =>
        p.customer_name?.toLowerCase().includes(q) ||
        p.customer_email?.toLowerCase().includes(q) ||
        p.reference_number?.toLowerCase().includes(q) ||
        p.gcash_number?.includes(q)
      );
    }
    if (!showHidden && statusFilter !== "all") result = result.filter((p) => p.status === statusFilter);
    setFiltered(result);
  }, [payments, search, statusFilter, showHidden]);

  // ── Hide (soft delete) ────────────────────────────────────────────────────
  const hidePayment = async (p: any) => {
    const { error } = await supabase.from("gcash_payments").update({ is_deleted: true }).eq("id", p.id);
    if (error) { console.error(error); return; }
    setPayments(prev => prev.map(x => x.id === p.id ? { ...x, is_deleted: true } : x));
  };

  // ── Restore ───────────────────────────────────────────────────────────────
  const restorePayment = async (p: any) => {
    const { error } = await supabase.from("gcash_payments").update({ is_deleted: false }).eq("id", p.id);
    if (error) { console.error(error); return; }
    setPayments(prev => prev.map(x => x.id === p.id ? { ...x, is_deleted: false } : x));
  };

  // ── Hard delete ───────────────────────────────────────────────────────────
  const deletePaymentPermanently = async (p: any) => {
    const { error } = await supabase.from("gcash_payments").delete().eq("id", p.id);
    if (error) { console.error(error); return; }
    setPayments(prev => prev.filter(x => x.id !== p.id));
  };

  // ── Approve ───────────────────────────────────────────────────────────────
  // CHANGED: When approved, only update payment_status to "paid" on the order.
  // Do NOT change order status — admin controls that manually in OrdersPage.
  const handleApprove = async (payment: any) => {
    setActionLoading(payment.id + "_approve");
    try {
      await supabase
        .from("gcash_payments")
        .update({ status: "approved", approved_at: new Date().toISOString() })
        .eq("id", payment.id);

      // Only update payment_status — leave order status untouched for admin
      if (payment.order_id) {
        await supabase
          .from("orders")
          .update({ payment_status: "paid" })
          .eq("id", payment.order_id);
      }

      setPayments(prev =>
        prev.map(p => p.id === payment.id
          ? { ...p, status: "approved", approved_at: new Date().toISOString() }
          : p
        )
      );
    } catch { /* silent */ } finally {
      setActionLoading(null);
    }
  };

  // ── Reject ────────────────────────────────────────────────────────────────
  // CHANGED: When rejected, only update payment_status to "failed".
  // Do NOT change order status to cancelled — admin controls that manually.
  const handleReject = async (payment: any) => {
    setActionLoading(payment.id + "_reject");
    try {
      await supabase
        .from("gcash_payments")
        .update({ status: "rejected", rejected_at: new Date().toISOString() })
        .eq("id", payment.id);

      // Only update payment_status — leave order status for admin to decide
      if (payment.order_id) {
        await supabase
          .from("orders")
          .update({ payment_status: "failed" })
          .eq("id", payment.order_id);
      }

      setPayments(prev =>
        prev.map(p => p.id === payment.id
          ? { ...p, status: "rejected", rejected_at: new Date().toISOString() }
          : p
        )
      );
    } catch { /* silent */ } finally {
      setActionLoading(null);
    }
  };

  // ── Mark as completed ─────────────────────────────────────────────────────
  // CHANGED: Only marks the payment record as completed.
  // Does NOT auto-complete the order — admin does that in OrdersPage.
  const handleDone = async (payment: any) => {
    setActionLoading(payment.id + "_done");
    try {
      await supabase
        .from("gcash_payments")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", payment.id);

      // Only update payment_status on the order, NOT the order status itself
      if (payment.order_id) {
        await supabase
          .from("orders")
          .update({ payment_status: "paid" })
          .eq("id", payment.order_id);
      }

      setPayments(prev =>
        prev.map(p => p.id === payment.id
          ? { ...p, status: "completed", completed_at: new Date().toISOString() }
          : p
        )
      );
    } catch { /* silent */ } finally {
      setActionLoading(null);
    }
  };

  const visiblePayments = payments.filter(p => !p.is_deleted);
  const hiddenCount     = payments.filter(p => p.is_deleted).length;

  const statusCounts: Record<string, number> = {
    all:             visiblePayments.length,
    pending:         visiblePayments.filter(p => p.status === "pending").length,
    proof_submitted: visiblePayments.filter(p => p.status === "proof_submitted").length,
    approved:        visiblePayments.filter(p => p.status === "approved").length,
    rejected:        visiblePayments.filter(p => p.status === "rejected").length,
    completed:       visiblePayments.filter(p => p.status === "completed").length,
  };

  const filterTabs = [
    { key: "all",             label: "All"             },
    { key: "pending",         label: "Pending"         },
    { key: "proof_submitted", label: "Proof Submitted" },
    { key: "approved",        label: "Approved"        },
    { key: "completed",       label: "Completed"       },
    { key: "rejected",        label: "Rejected"        },
  ];

  return (
    <div className="space-y-4">
      {previewUrl && <ProofModal url={previewUrl} onClose={() => setPreviewUrl(null)} />}

      <GCashDeleteModal
        payment={deleteModal}
        onClose={() => setDeleteModal(null)}
        onHide={hidePayment}
        onDeletePermanently={deletePaymentPermanently}
      />

      {/* Panel Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            📲 GCash Manual Payments
            {statusCounts.proof_submitted > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/20 animate-pulse">
                {statusCounts.proof_submitted} awaiting review
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Manual GCash transfers requiring admin verification</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Toggle hidden */}
          <button
            onClick={() => setShowHidden(h => !h)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              showHidden
                ? "bg-red-500/20 text-red-300 border border-red-500/30"
                : "text-slate-400 hover:text-white"
            }`}
            style={!showHidden ? { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" } : {}}>
            {showHidden ? <><RotateCcw size={12} /> Back</> : <><Trash2 size={12} /> Hidden {hiddenCount > 0 && `(${hiddenCount})`}</>}
          </button>
          <button onClick={fetchPayments} disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-all"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      {/* Hidden banner */}
      {showHidden && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
          <EyeOff size={14} className="text-red-400 shrink-0" />
          <p className="text-sm text-red-300">
            Showing <span className="font-bold">{hiddenCount} hidden payment{hiddenCount !== 1 ? "s" : ""}</span> — click <RotateCcw size={11} className="inline mx-0.5" /> to restore
          </p>
        </div>
      )}

      {/* Filter pills + search — only when not showing hidden */}
      {!showHidden && (
        <div className="flex flex-wrap gap-2">
          {filterTabs.map((s) => (
            <button key={s.key} onClick={() => setStatusFilter(s.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${
                statusFilter === s.key
                  ? "bg-indigo-500/30 text-indigo-300 border border-indigo-500/30"
                  : "text-slate-500 hover:text-slate-300 border border-transparent"
              }`}
              style={statusFilter !== s.key ? { background: "rgba(255,255,255,0.03)" } : {}}>
              {s.label}
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${statusFilter === s.key ? "bg-indigo-500/40" : "bg-white/10"}`}>
                {statusCounts[s.key] ?? 0}
              </span>
            </button>
          ))}
          <div className="relative ml-auto">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, ref, number…"
              className="pl-8 pr-3 py-1.5 rounded-xl text-xs text-slate-200 placeholder-slate-600 outline-none"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", width: "220px" }} />
          </div>
        </div>
      )}

      {/* Cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-500 rounded-2xl"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <AlertCircle size={28} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">{showHidden ? "No hidden payments" : "No GCash payments found"}</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((payment, i) => (
            <div key={payment.id}
              className="rounded-2xl p-4 space-y-3 opacity-0"
              style={{
                ...cardStyle,
                animation: `fadeUp 0.3s ease ${i * 0.04}s forwards`,
                opacity: payment.is_deleted ? 0.5 : undefined,
                border: payment.status === "proof_submitted"
                  ? "1px solid rgba(59,130,246,0.3)"
                  : payment.status === "completed"
                  ? "1px solid rgba(20,184,166,0.25)"
                  : "1px solid rgba(255,255,255,0.08)",
              }}>

              {/* Top row */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-xs text-indigo-400 font-bold">{payment.reference_number}</p>
                  <p className="text-sm font-semibold text-white mt-0.5">{payment.customer_name}</p>
                  <p className="text-xs text-slate-500">{payment.customer_email}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wide whitespace-nowrap ${STATUS_STYLES[payment.status] || STATUS_STYLES.pending}`}>
                    {payment.status === "proof_submitted" ? "Proof ✓" : payment.status}
                  </span>
                  {/* Restore button (only in hidden view) */}
                  {payment.is_deleted && (
                    <button
                      onClick={() => restorePayment(payment)}
                      title="Restore"
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-emerald-400 hover:bg-emerald-500/15 transition-colors">
                      <RotateCcw size={12} />
                    </button>
                  )}
                  {/* Delete / Hide button */}
                  <button
                    onClick={() => setDeleteModal(payment)}
                    title="Remove"
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>

              {/* Details */}
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg p-2.5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <p className="text-[9px] text-slate-500 uppercase tracking-widest mb-1">GCash Number</p>
                  <p className="text-xs font-mono font-bold text-slate-200">{payment.gcash_number}</p>
                </div>
                <div className="rounded-lg p-2.5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <p className="text-[9px] text-slate-500 uppercase tracking-widest mb-1">Amount</p>
                  <p className="text-sm font-bold text-white">₱{Number(payment.amount).toLocaleString()}</p>
                </div>
              </div>

              {/* Screenshot */}
              {payment.proof_url ? (
                <button onClick={() => setPreviewUrl(payment.proof_url)}
                  className="w-full relative rounded-xl overflow-hidden group"
                  style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
                  <img src={payment.proof_url} alt="Payment proof" className="w-full h-24 object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-medium">
                    <Eye size={14} /> View Full Screenshot
                  </div>
                </button>
              ) : (
                <div className="w-full h-16 rounded-xl flex items-center justify-center gap-2 text-slate-600 text-xs"
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.08)" }}>
                  <Clock size={13} /> Awaiting proof upload...
                </div>
              )}

              {/* Date */}
              <p className="text-[10px] text-slate-600">
                {new Date(payment.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                {" · "}
                {new Date(payment.created_at).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })}
              </p>

              {/* Actions — only show when not hidden */}
              {!payment.is_deleted && (
                <>
                  {/* Approve / Reject for pending or proof_submitted */}
                  {(payment.status === "proof_submitted" || payment.status === "pending") && (
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => handleApprove(payment)}
                        disabled={actionLoading === payment.id + "_approve"}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold text-emerald-400 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                        style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)" }}>
                        {actionLoading === payment.id + "_approve"
                          ? <><RefreshCw size={11} className="animate-spin" /> Approving...</>
                          : <><CheckCircle size={11} /> Approve</>}
                      </button>
                      <button
                        onClick={() => handleReject(payment)}
                        disabled={actionLoading === payment.id + "_reject"}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold text-red-400 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                        style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)" }}>
                        {actionLoading === payment.id + "_reject"
                          ? <><RefreshCw size={11} className="animate-spin" /> Rejecting...</>
                          : <><XCircle size={11} /> Reject</>}
                      </button>
                    </div>
                  )}

                  {/* Approved state: show info + Done Payment button */}
                  {payment.status === "approved" && (
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                        <CheckCircle size={12} /> Payment approved — order payment marked as paid
                      </div>
                      <p className="text-[10px] text-slate-500">
                        💡 Go to Orders to manually advance the order status (confirm → pack → ship → etc.)
                      </p>
                      <button
                        onClick={() => handleDone(payment)}
                        disabled={actionLoading === payment.id + "_done"}
                        className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold text-teal-300 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                        style={{ background: "rgba(20,184,166,0.15)", border: "1px solid rgba(20,184,166,0.3)" }}>
                        {actionLoading === payment.id + "_done"
                          ? <><RefreshCw size={11} className="animate-spin" /> Confirming...</>
                          : <>✅ Mark Payment as Completed</>}
                      </button>
                    </div>
                  )}

                  {/* Completed badge */}
                  {payment.status === "completed" && (
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-1.5 text-xs text-teal-400 font-medium">
                        <CheckCircle size={12} /> Payment completed ✓
                      </div>
                      {payment.completed_at && (
                        <span className="text-[10px] text-slate-600">
                          {new Date(payment.completed_at).toLocaleDateString("en-PH", { month: "short", day: "numeric" })}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Rejected badge */}
                  {payment.status === "rejected" && (
                    <div className="flex items-center gap-1.5 text-xs text-red-400 font-medium pt-1">
                      <XCircle size={12} /> Payment rejected — order payment marked as failed
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Main Transactions Page ────────────────────────────────────────────────────
export default function TransactionsPage() {
  const [orders, setOrders]               = useState<any[]>([]);
  const [filtered, setFiltered]           = useState<any[]>([]);
  const [refreshing, setRefreshing]       = useState(false);
  const [search, setSearch]               = useState("");
  const [statusFilter, setStatusFilter]   = useState("all");
  const [methodFilter, setMethodFilter]   = useState("all");
  const [dailyData, setDailyData]         = useState<any[]>([]);
  const [methodData, setMethodData]       = useState<any[]>([]);
  const [activeTab, setActiveTab]         = useState<"all" | "gcash_manual">("all");

  const [stats, setStats] = useState({
    totalRevenue: 0,
    paidCount:    0,
    pendingCount: 0,
    failedCount:  0,
    avgOrder:     0,
  });

  const fetchData = useCallback(async () => {
    setRefreshing(true);
    const { data } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    const all = data || [];
    setOrders(all);

    const paid    = all.filter(o => o.payment_status === "paid" || o.status === "completed");
    const pending = all.filter(o => o.payment_status === "pending" && o.status !== "cancelled");
    const failed  = all.filter(o => o.payment_status === "failed" || o.status === "cancelled");
    const totalRevenue = paid.reduce((s, o) => s + Number(o.total), 0);

    setStats({
      totalRevenue,
      paidCount:    paid.length,
      pendingCount: pending.length,
      failedCount:  failed.length,
      avgOrder: paid.length ? Math.round(totalRevenue / paid.length) : 0,
    });

    const days: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days[d.toLocaleDateString("en-PH", { month: "short", day: "numeric" })] = 0;
    }
    paid.forEach(o => {
      const label = new Date(o.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric" });
      if (label in days) days[label] += Number(o.total);
    });
    setDailyData(Object.entries(days).map(([date, amount]) => ({ date, amount })));

    const methodMap: Record<string, number> = {};
    all.forEach(o => {
      const m = o.payment_method || "unknown";
      methodMap[m] = (methodMap[m] || 0) + 1;
    });
    setMethodData(Object.entries(methodMap).map(([name, count]) => ({ name, count })));
    setRefreshing(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    let result = [...orders];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(o =>
        o.customer_name?.toLowerCase().includes(q) ||
        o.customer_email?.toLowerCase().includes(q) ||
        o.id?.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") {
      result = result.filter(o =>
        statusFilter === "paid"
          ? o.payment_status === "paid" || o.status === "completed"
          : statusFilter === "pending"
          ? o.payment_status === "pending" && o.status !== "cancelled"
          : statusFilter === "failed"
          ? o.payment_status === "failed" || o.status === "cancelled"
          : true
      );
    }
    if (methodFilter !== "all") result = result.filter(o => o.payment_method === methodFilter);
    setFiltered(result);
  }, [orders, search, statusFilter, methodFilter]);

  const getPaymentStatus = (o: any) => {
    if (o.payment_status === "paid" || o.status === "completed") return "paid";
    if (o.payment_status === "failed" || o.status === "cancelled") return "failed";
    return "pending";
  };

  const exportCSV = () => {
    const rows = [
      ["Order ID", "Customer", "Email", "Amount", "Method", "Status", "Date"],
      ...filtered.map(o => [
        o.id?.slice(0, 8).toUpperCase(),
        o.customer_name,
        o.customer_email,
        o.total,
        o.payment_method,
        getPaymentStatus(o),
        new Date(o.created_at).toLocaleDateString(),
      ]),
    ];
    const csv  = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = "transactions.csv"; a.click();
  };

  const statCards = [
    { title: "Total Revenue",      value: `₱${stats.totalRevenue.toLocaleString()}`, icon: Wallet,      iconBg: "bg-emerald-500/20", iconColor: "text-emerald-400" },
    { title: "Paid",               value: stats.paidCount,                           icon: CheckCircle, iconBg: "bg-blue-500/20",    iconColor: "text-blue-400"    },
    { title: "Pending",            value: stats.pendingCount,                        icon: Clock,       iconBg: "bg-amber-500/20",   iconColor: "text-amber-400"   },
    { title: "Failed / Cancelled", value: stats.failedCount,                         icon: Ban,         iconBg: "bg-red-500/20",     iconColor: "text-red-400"     },
    { title: "Avg. Order Value",   value: `₱${stats.avgOrder.toLocaleString()}`,    icon: TrendingUp,  iconBg: "bg-violet-500/20",  iconColor: "text-violet-400"  },
  ];

  return (
    <div className="min-h-screen p-6 space-y-6 relative"
      style={{ background: "linear-gradient(135deg,#0f1117 0%,#141824 50%,#0f1117 100%)" }}>

      {/* Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full opacity-10"
          style={{ background: "radial-gradient(circle,#6366f1,transparent 70%)" }} />
        <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full opacity-10"
          style={{ background: "radial-gradient(circle,#10b981,transparent 70%)" }} />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between relative z-10 opacity-0"
        style={{ animation: "fadeUp 0.5s ease forwards" }}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-emerald-400 font-medium tracking-widest uppercase">Live</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Payment Transactions</h1>
          <p className="text-sm text-slate-400 mt-0.5">All payment activity · RaidKhalid &amp; Co.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-slate-300 hover:text-white transition-all"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <Download size={14} /> Export CSV
          </button>
          <button onClick={fetchData} disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-slate-300 hover:text-white transition-all"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 relative z-10">
        {statCards.map((s, i) => (
          <div key={s.title}
            className="group rounded-2xl p-5 cursor-default transition-all duration-300 hover:scale-[1.02] opacity-0"
            style={{ ...cardStyle, animation: `fadeUp 0.5s ease ${i * 0.07}s forwards` }}>
            <div className="flex items-start justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.iconBg}`}>
                <s.icon size={18} className={s.iconColor} />
              </div>
              <ArrowUpRight size={13} className="text-slate-600 group-hover:text-slate-400 transition-colors" />
            </div>
            <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">{s.title}</p>
            <p className="text-2xl font-bold text-white">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-6 relative z-10">
        <div className="lg:col-span-2 rounded-2xl p-6 opacity-0"
          style={{ ...cardStyle, animation: "fadeUp 0.5s ease 0.35s forwards" }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-sm font-semibold text-white tracking-wide">Revenue — Last 7 Days</h2>
              <p className="text-xs text-slate-500 mt-0.5">Paid orders only</p>
            </div>
            <TrendingUp size={16} className="text-slate-500" />
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyData}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: "#64748b", fontSize: 10 }} tickLine={false} axisLine={false}
                  tickFormatter={v => `₱${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: "rgba(15,17,23,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: "#fff", fontSize: "12px" }}
                  formatter={(v: any) => [`₱${Number(v).toLocaleString()}`, "Revenue"]} />
                <Area type="monotone" dataKey="amount" stroke="#6366f1" strokeWidth={2} fill="url(#revenueGrad)" dot={{ fill: "#6366f1", r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl p-6 opacity-0"
          style={{ ...cardStyle, animation: "fadeUp 0.5s ease 0.4s forwards" }}>
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-white tracking-wide">By Payment Method</h2>
            <p className="text-xs text-slate-500 mt-0.5">Order count per method</p>
          </div>
          <div className="h-32 mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={methodData} barSize={24}>
                <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis hide />
                <Tooltip contentStyle={{ background: "rgba(15,17,23,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: "#fff", fontSize: "12px" }} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {methodData.map((_, i) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2">
            {methodData.map((m, i) => (
              <div key={m.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: BAR_COLORS[i % BAR_COLORS.length] }} />
                  <span className="text-slate-300 capitalize">{METHOD_ICONS[m.name] || "💰"} {m.name}</span>
                </div>
                <span className="text-slate-400 font-medium">{m.count} orders</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-1 p-1 rounded-xl w-fit relative z-10"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
        {[
          { key: "all",          label: "All Transactions" },
          { key: "gcash_manual", label: "📲 GCash Manual"  },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.key
                ? "bg-indigo-500/30 text-indigo-300 border border-indigo-500/20"
                : "text-slate-500 hover:text-slate-300"
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* GCash Manual Panel */}
      {activeTab === "gcash_manual" && (
        <div className="relative z-10 opacity-0" style={{ animation: "fadeUp 0.4s ease forwards" }}>
          <GCashManualPanel />
        </div>
      )}

      {/* All Transactions Table */}
      {activeTab === "all" && (
        <div className="rounded-2xl overflow-hidden opacity-0 relative z-10"
          style={{ ...cardStyle, animation: "fadeUp 0.5s ease 0.45s forwards" }}>

          {/* Filters */}
          <div className="p-4 flex flex-wrap items-center gap-3"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="relative flex-1 min-w-[200px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search name, email, order ID…"
                className="w-full pl-9 pr-4 py-2 rounded-xl text-sm text-slate-200 placeholder-slate-600 outline-none focus:ring-1 focus:ring-indigo-500/50"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }} />
            </div>

            <div className="flex items-center gap-1 p-1 rounded-xl"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
              {["all", "paid", "pending", "failed"].map(s => (
                <button key={s} onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                    statusFilter === s ? "bg-indigo-500/30 text-indigo-300" : "text-slate-500 hover:text-slate-300"
                  }`}>
                  {s}
                </button>
              ))}
            </div>

            <select value={methodFilter} onChange={e => setMethodFilter(e.target.value)}
              className="px-3 py-2 rounded-xl text-xs text-slate-300 outline-none"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <option value="all">All Methods</option>
              <option value="gcash">GCash (PayMongo)</option>
              <option value="gcash_manual">GCash (Manual)</option>
              <option value="card">Card</option>
              <option value="cod">COD</option>
              <option value="grab_pay">GrabPay</option>
            </select>

            <span className="text-xs text-slate-500 ml-auto">{filtered.length} transactions</span>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  {["Order ID", "Customer", "Amount", "Method", "Payment", "Order Status", "Date"].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs text-slate-500 uppercase tracking-widest font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-16 text-slate-500">
                      <AlertCircle size={32} className="mx-auto mb-3 opacity-30" />
                      No transactions found
                    </td>
                  </tr>
                ) : (
                  filtered.map((o, i) => {
                    const pStatus = getPaymentStatus(o);
                    return (
                      <tr key={o.id}
                        className="transition-all duration-150 hover:bg-white/[0.03] cursor-default"
                        style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", animation: `fadeUp 0.3s ease ${i * 0.03}s both` }}>
                        <td className="px-5 py-3.5">
                          <span className="font-mono text-xs text-indigo-400">#{o.id?.slice(0, 8).toUpperCase()}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="text-slate-200 font-medium">{o.customer_name}</p>
                          <p className="text-xs text-slate-500">{o.customer_email}</p>
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="text-white font-bold">₱{Number(o.total).toLocaleString()}</p>
                          {o.discount > 0 && <p className="text-xs text-emerald-500">-₱{Number(o.discount).toLocaleString()} off</p>}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-slate-300 capitalize">
                            {METHOD_ICONS[o.payment_method] || "💰"} {o.payment_method || "—"}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${STATUS_STYLES[pStatus] || STATUS_STYLES.pending}`}>
                            {pStatus}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${
                            o.status === "completed" ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20" :
                            o.status === "cancelled" ? "bg-red-500/15 text-red-400 border border-red-500/20"           :
                            o.status === "shipped"   ? "bg-blue-500/15 text-blue-400 border border-blue-500/20"        :
                            "bg-amber-500/15 text-amber-400 border border-amber-500/20"
                          }`}>
                            {o.status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-slate-500 text-xs">
                          {new Date(o.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                          <p className="text-slate-600">{new Date(o.created_at).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })}</p>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        select option { background: #141824; color: #cbd5e1; }
      `}</style>
    </div>
  );
}
