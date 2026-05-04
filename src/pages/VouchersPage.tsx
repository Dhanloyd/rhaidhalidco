import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import VoucherCard from "../components/VoucherCard";

interface Voucher {
  id: string;
  code: string;
  description: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  min_spend: number;
  max_uses: number | null;
  used_count: number;
  expiry_date: string | null;
  free_shipping: boolean;
  active: boolean;
}

export default function VouchersPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [claimedIds, setClaimedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "discount" | "shipping">("all");

  useEffect(() => { initPage(); }, []);

  const initPage = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
      await Promise.all([fetchVouchers(), fetchClaimedVouchers(user.id)]);
    } else {
      await fetchVouchers();
    }
    setLoading(false);
  };

  const fetchVouchers = async () => {
    const { data } = await supabase
      .from("vouchers")
      .select("*")
      .eq("active", true)
      .order("expiry_date", { ascending: true, nullsFirst: false });
    if (data) setVouchers(data);
  };

  const fetchClaimedVouchers = async (uid: string) => {
    const { data } = await supabase
      .from("user_vouchers")
      .select("voucher_id")
      .eq("user_id", uid);
    if (data) setClaimedIds(new Set(data.map((uv: { voucher_id: string }) => uv.voucher_id)));
  };

  const handleClaim = async (voucher: Voucher) => {
    if (!userId) { showToast("error", "Please log in to claim vouchers."); return; }
    if (claimedIds.has(voucher.id)) return;

    setClaiming(voucher.id);
    const { error } = await supabase.from("user_vouchers").insert({
      user_id: userId,
      voucher_id: voucher.id,
    });
    setClaiming(null);

    if (error) {
      showToast("error", "Failed to claim voucher. Try again.");
    } else {
      setClaimedIds((prev) => new Set([...prev, voucher.id]));
      showToast("success", `"${voucher.code}" saved to your vouchers!`);
    }
  };

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const filtered = vouchers.filter((v) => {
    if (filter === "discount") return !v.free_shipping || v.discount_value > 0;
    if (filter === "shipping") return v.free_shipping;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (a.expiry_date && b.expiry_date) return new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime();
    if (a.expiry_date) return -1;
    if (b.expiry_date) return 1;
    return 0;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-lg
          ${toast.type === "success"
            ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-300"
            : "bg-red-500/20 border border-red-500/40 text-red-300"}`}>
          {toast.msg}
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Voucher Collection</h1>
        <p className="text-gray-400 text-sm mt-1">
          Claim vouchers and use them at checkout. Grab them before they expire!
        </p>
      </div>

      <div className="flex gap-2 mb-6">
        {(["all", "discount", "shipping"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all
              ${filter === f
                ? "bg-cyan-500 text-white"
                : "bg-white/5 border border-white/10 text-gray-400 hover:text-white"}`}
          >
            {f === "all" ? "All Vouchers" : f === "discount" ? "Discounts" : "Free Shipping"}
          </button>
        ))}
        <span className="ml-auto text-xs text-gray-500 self-center">{sorted.length} available</span>
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-16 text-gray-500">No vouchers available right now.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sorted.map((voucher) => (
            <VoucherCard
              key={voucher.id}
              voucher={voucher}
              claimed={claimedIds.has(voucher.id)}
              claiming={claiming === voucher.id}
              onClaim={() => handleClaim(voucher)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
