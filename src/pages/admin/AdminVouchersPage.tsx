import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useCountdown } from "../../hooks/useCountdown";

interface Voucher {
  id: string;
  code: string;
  description: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  min_spend: number;
  max_uses: number | null;
  used_count: number;
  active: boolean;
  expiry_date: string | null;
  free_shipping: boolean;
  created_at: string;
}

const EMPTY_FORM = {
  code: "",
  description: "",
  discount_type: "percentage" as "percentage" | "fixed",
  discount_value: 0,
  min_spend: 0,
  max_uses: "",
  // Date and time stored separately for the UI, merged on save
  expires_date: "",   // e.g. "2025-12-31"
  expires_time: "",   // e.g. "23:59"
  free_shipping: false,
  active: true,
};

// Merge date + time into ISO string for Supabase
const toISO = (date: string, time: string): string | null => {
  if (!date) return null;
  const t = time || "23:59";
  return new Date(`${date}T${t}:00`).toISOString();
};

// Split ISO back to date + time for editing
const fromISO = (iso: string | null) => {
  if (!iso) return { date: "", time: "" };
  const d = new Date(iso);
  const date = d.toISOString().split("T")[0];
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return { date, time: `${h}:${m}` };
};

// Small inline countdown for the table row
function RowCountdown({ expiresAt }: { expiresAt: string | null }) {
  const cd = useCountdown(expiresAt);
  if (!expiresAt) return <span className="text-gray-600">—</span>;
  if (!cd) return null;
  if (cd.isExpired) return <span className="text-red-400 text-xs font-medium">Expired</span>;
  return (
    <span className={`text-xs font-medium ${cd.isUrgent ? "text-red-400" : "text-amber-400"}`}>
      {cd.label}
    </span>
  );
}

export default function AdminVouchersPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Live preview of the expiry_date the admin is typing
  const previewISO = toISO(form.expires_date, form.expires_time);
  const previewCountdown = useCountdown(previewISO);

  useEffect(() => { fetchVouchers(); }, []);

  const fetchVouchers = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("vouchers")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setVouchers(data);
    setLoading(false);
  };

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSubmit = async () => {
    if (!form.code.trim()) return showToast("error", "Voucher code is required.");
    setSaving(true);

    const payload = {
      code: form.code.trim().toUpperCase(),
      description: form.description,
      discount_type: form.discount_type,
      discount_value: form.free_shipping && !form.discount_value ? 0 : Number(form.discount_value),
      min_spend: Number(form.min_spend),
      max_uses: form.max_uses ? Number(form.max_uses) : null,
      expiry_date: toISO(form.expires_date, form.expires_time),
      free_shipping: form.free_shipping,
      active: form.active,
    };

    let error;
    if (editingId) {
      ({ error } = await supabase.from("vouchers").update(payload).eq("id", editingId));
    } else {
      ({ error } = await supabase.from("vouchers").insert({ ...payload, used_count: 0 }));
    }

    setSaving(false);
    if (error) {
      showToast("error", error.message.includes("unique") ? "Code already exists." : "Failed to save.");
    } else {
      showToast("success", editingId ? "Voucher updated!" : "Voucher created!");
      resetForm();
      fetchVouchers();
    }
  };

  const handleEdit = (v: Voucher) => {
    const { date, time } = fromISO(v.expiry_date);
    setForm({
      code: v.code,
      description: v.description,
      discount_type: v.discount_type,
      discount_value: v.discount_value,
      min_spend: v.min_spend,
      max_uses: v.max_uses ? String(v.max_uses) : "",
      expires_date: date,
      expires_time: time,
      free_shipping: v.free_shipping,
      active: v.active,
    });
    setEditingId(v.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleActive = async (v: Voucher) => {
    await supabase.from("vouchers").update({ active: !v.active }).eq("id", v.id);
    fetchVouchers();
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setShowForm(false);
    setEditingId(null);
  };

  const inputClass = "w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 transition";
  const Toggle = ({ value, onChange, color = "bg-cyan-500" }: { value: boolean; onChange: () => void; color?: string }) => (
    <button type="button" onClick={onChange}
      className={`relative w-10 h-5 rounded-full transition-colors ${value ? color : "bg-white/10"}`}>
      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${value ? "translate-x-5" : "translate-x-0.5"}`} />
    </button>
  );

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-lg
          ${toast.type === "success"
            ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-300"
            : "bg-red-500/20 border border-red-500/40 text-red-300"}`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Vouchers</h1>
          <p className="text-gray-400 text-sm mt-1">Create time-limited discount vouchers for your customers.</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(!showForm); }}
          className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white text-sm font-semibold transition active:scale-95"
        >
          {showForm && !editingId ? "Cancel" : "+ New Voucher"}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8 backdrop-blur-sm">
          <h2 className="text-base font-semibold text-white mb-5">
            {editingId ? "Edit Voucher" : "New Voucher"}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Code */}
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Voucher Code *</label>
              <input className={inputClass + " font-mono tracking-widest"} placeholder="e.g. FLASH50"
                value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} />
            </div>

            {/* Description */}
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Description</label>
              <input className={inputClass} placeholder="e.g. Flash sale - 50% off"
                value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>

            {/* Discount Type */}
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Discount Type</label>
              <select className={inputClass + " bg-[#1e293b]"} value={form.discount_type}
                onChange={(e) => setForm({ ...form, discount_type: e.target.value as "percentage" | "fixed" })}>
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (₱)</option>
              </select>
            </div>

            {/* Discount Value */}
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">
                Discount Value {form.discount_type === "percentage" ? "(%)" : "(₱)"}
              </label>
              <input type="number" className={inputClass} placeholder="0" value={form.discount_value}
                onChange={(e) => setForm({ ...form, discount_value: parseFloat(e.target.value) })} />
            </div>

            {/* Min Spend */}
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Min. Spend (₱)</label>
              <input type="number" className={inputClass} placeholder="0" value={form.min_spend}
                onChange={(e) => setForm({ ...form, min_spend: parseFloat(e.target.value) })} />
            </div>

            {/* Max Uses */}
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Max Uses (blank = unlimited)</label>
              <input type="number" className={inputClass} placeholder="unlimited" value={form.max_uses}
                onChange={(e) => setForm({ ...form, max_uses: e.target.value })} />
            </div>

            {/* Expiry Date */}
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Expiry Date</label>
              <input type="date" className={inputClass + " bg-[#1e293b]"} value={form.expires_date}
                onChange={(e) => setForm({ ...form, expires_date: e.target.value })} />
            </div>

            {/* Expiry Time */}
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">
                Expiry Time <span className="text-gray-600">(default: 23:59)</span>
              </label>
              <input type="time" className={inputClass + " bg-[#1e293b]"} value={form.expires_time}
                onChange={(e) => setForm({ ...form, expires_time: e.target.value })} />
            </div>
          </div>

          {/* Countdown preview */}
          {form.expires_date && previewCountdown && (
            <div className={`mt-4 flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm
              ${previewCountdown.isExpired
                ? "bg-red-500/10 border-red-500/30 text-red-400"
                : previewCountdown.isUrgent
                ? "bg-red-500/10 border-red-500/30 text-red-400"
                : "bg-amber-500/10 border-amber-500/20 text-amber-400"}`}>
              <span>⏱</span>
              <span className="font-medium">
                {previewCountdown.isExpired
                  ? "⚠ This expiry date is already in the past!"
                  : `Voucher will expire in ${previewCountdown.label}`}
              </span>
              {!previewCountdown.isExpired && (
                <span className="ml-auto text-xs opacity-60">
                  {new Date(previewISO!).toLocaleString("en-PH")}
                </span>
              )}
            </div>
          )}

          {/* Toggles */}
          <div className="flex flex-wrap gap-6 mt-5">
            <label className="flex items-center gap-3 cursor-pointer">
              <Toggle value={form.free_shipping} onChange={() => setForm({ ...form, free_shipping: !form.free_shipping })} color="bg-sky-500" />
              <span className="text-sm text-gray-300">Includes Free Shipping</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <Toggle value={form.active} onChange={() => setForm({ ...form, active: !form.active })} color="bg-emerald-500" />
              <span className="text-sm text-gray-300">Active</span>
            </label>
          </div>

          <div className="flex gap-3 mt-6">
            <button onClick={handleSubmit} disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white text-sm font-semibold transition active:scale-95 disabled:opacity-50">
              {saving ? "Saving..." : editingId ? "Update Voucher" : "Create Voucher"}
            </button>
            <button onClick={resetForm}
              className="px-6 py-2.5 rounded-xl border border-white/10 text-gray-400 hover:text-white text-sm transition">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : vouchers.length === 0 ? (
        <div className="text-center py-16 text-gray-500">No vouchers yet.</div>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-gray-400 text-xs uppercase tracking-wider">
                <th className="text-left px-5 py-3">Code</th>
                <th className="text-left px-5 py-3">Discount</th>
                <th className="text-left px-5 py-3 hidden sm:table-cell">Min Spend</th>
                <th className="text-left px-5 py-3 hidden md:table-cell">Uses</th>
                <th className="text-left px-5 py-3">Time Left</th>
                <th className="text-left px-5 py-3">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {vouchers.map((v, i) => (
                <tr key={v.id}
                  className={`border-b border-white/5 hover:bg-white/5 transition ${i === vouchers.length - 1 ? "border-b-0" : ""}`}>
                  <td className="px-5 py-3.5">
                    <p className="font-mono font-bold text-cyan-400 tracking-widest">{v.code}</p>
                    {v.free_shipping && <span className="text-xs text-sky-400">+ free ship</span>}
                  </td>
                  <td className="px-5 py-3.5 text-white">
                    {v.discount_value === 0 && v.free_shipping
                      ? <span className="text-sky-400">Free Shipping</span>
                      : v.discount_type === "percentage"
                      ? `${v.discount_value}% off`
                      : `₱${v.discount_value} off`}
                  </td>
                  <td className="px-5 py-3.5 text-gray-400 hidden sm:table-cell">
                    {v.min_spend > 0 ? `₱${v.min_spend}` : "—"}
                  </td>
                  <td className="px-5 py-3.5 text-gray-400 hidden md:table-cell">
                    {v.used_count}/{v.max_uses ?? "∞"}
                  </td>
                  <td className="px-5 py-3.5">
                    <RowCountdown expiresAt={v.expiry_date} />
                  </td>
                  <td className="px-5 py-3.5">
                    <button onClick={() => toggleActive(v)}
                      className={`text-xs px-3 py-1 rounded-full font-medium transition border
                        ${v.active
                          ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30"
                          : "bg-white/5 text-gray-500 border-white/10 hover:bg-white/10"}`}>
                      {v.active ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="px-5 py-3.5">
                    <button onClick={() => handleEdit(v)} className="text-gray-500 hover:text-white transition text-xs">
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
