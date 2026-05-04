import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";

// ─── Types ──────────────────────────────────────────────────────────────────

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image_url?: string;
}

interface ShippingSettings {
  flat_rate: number;
  free_shipping_threshold: number;
  free_shipping_enabled: boolean;
}

interface Voucher {
  id: string;
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  min_spend: number;
  max_uses: number | null;
  used_count: number;
  expiry_date: string | null;
  free_shipping: boolean;
  active: boolean;
}

interface UserVoucher {
  voucher_id: string;
  is_used: boolean;
  vouchers: Voucher;
}

interface CheckoutSummaryProps {
  cartItems: CartItem[];
  userId: string;
  onPlaceOrder: (orderData: OrderData) => void;
}

export interface OrderData {
  subtotal: number;
  discountAmount: number;
  discountedSubtotal: number;
  shippingFee: number;
  finalTotal: number;
  appliedVoucher: Voucher | null;
  isFreeShipping: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const calcDiscount = (voucher: Voucher, subtotal: number): number => {
  if (voucher.discount_type === "percentage") {
    return parseFloat(((subtotal * voucher.discount_value) / 100).toFixed(2));
  }
  return Math.min(voucher.discount_value, subtotal);
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function CheckoutSummary({ cartItems, userId, onPlaceOrder }: CheckoutSummaryProps) {
  const [shippingSettings, setShippingSettings] = useState<ShippingSettings | null>(null);
  const [myVouchers, setMyVouchers] = useState<Voucher[]>([]);
  const [voucherCode, setVoucherCode] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState<Voucher | null>(null);
  const [voucherError, setVoucherError] = useState("");
  const [voucherSuccess, setVoucherSuccess] = useState("");
  const [validating, setValidating] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [showMyVouchers, setShowMyVouchers] = useState(false);

  // ── Subtotal ────────────────────────────────────────────────────────────
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // ── Discount ────────────────────────────────────────────────────────────
  const discountAmount = appliedVoucher ? calcDiscount(appliedVoucher, subtotal) : 0;
  const discountedSubtotal = Math.max(subtotal - discountAmount, 0);

  // ── Shipping ────────────────────────────────────────────────────────────
  const isFreeShipping = (() => {
    if (!shippingSettings) return false;
    if (appliedVoucher?.free_shipping) return true;
    if (!shippingSettings.free_shipping_enabled) return false;
    return discountedSubtotal >= shippingSettings.free_shipping_threshold;
  })();

  const shippingFee = isFreeShipping ? 0 : (shippingSettings?.flat_rate ?? 80);
  const finalTotal = discountedSubtotal + shippingFee;

  // ── Fetch on mount ───────────────────────────────────────────────────────
  useEffect(() => {
    fetchShippingSettings();
    if (userId) fetchMyVouchers();
  }, [userId]);

  const fetchShippingSettings = async () => {
    const { data } = await supabase.from("shipping_settings").select("*").single();
    if (data) setShippingSettings(data);
  };

  const fetchMyVouchers = async () => {
    const { data } = await supabase
      .from("user_vouchers")
      .select("voucher_id, is_used, vouchers(*)")
      .eq("user_id", userId)
      .eq("is_used", false);
    if (data) {
      setMyVouchers(
        data
          .map((uv: UserVoucher) => uv.vouchers)
          .filter((v: Voucher) => v.active && (!v.expiry_date || new Date(v.expiry_date) > new Date()))
      );
    }
  };

  // ── Voucher validation ───────────────────────────────────────────────────
  const validateVoucher = useCallback(async (code?: string) => {
    const codeToCheck = (code ?? voucherCode).trim().toUpperCase();
    if (!codeToCheck) return;

    setValidating(true);
    setVoucherError("");
    setVoucherSuccess("");
    setAppliedVoucher(null);

    const { data: voucher, error } = await supabase
      .from("vouchers")
      .select("*")
      .eq("code", codeToCheck)
      .single();

    setValidating(false);

    if (error || !voucher) {
      setVoucherError("Voucher code not found.");
      return;
    }
    if (!voucher.active) {
      setVoucherError("This voucher is no longer active.");
      return;
    }
    if (voucher.expiry_date && new Date(voucher.expiry_date) < new Date()) {
      setVoucherError("This voucher has expired.");
      return;
    }
    if (voucher.max_uses !== null && voucher.used_count >= voucher.max_uses) {
      setVoucherError("This voucher has reached its maximum uses.");
      return;
    }
    if (subtotal < voucher.min_spend) {
      setVoucherError(`Minimum spend of ₱${voucher.min_spend.toLocaleString()} required.`);
      return;
    }

    setAppliedVoucher(voucher);
    const disc = calcDiscount(voucher, subtotal);
    const msg = voucher.free_shipping && voucher.discount_value === 0
      ? "Free shipping applied!"
      : `Voucher applied! You save ₱${disc.toFixed(2)}${voucher.free_shipping ? " + free shipping" : ""}.`;
    setVoucherSuccess(msg);
  }, [voucherCode, subtotal]);

  const applyMyVoucher = (v: Voucher) => {
    setVoucherCode(v.code);
    setShowMyVouchers(false);
    validateVoucher(v.code);
  };

  const removeVoucher = () => {
    setAppliedVoucher(null);
    setVoucherCode("");
    setVoucherError("");
    setVoucherSuccess("");
  };

  // ── Place order ──────────────────────────────────────────────────────────
  const handlePlaceOrder = async () => {
    setPlacingOrder(true);

    // Mark voucher as used
    if (appliedVoucher && userId) {
      await supabase
        .from("user_vouchers")
        .update({ is_used: true, used_at: new Date().toISOString() })
        .eq("user_id", userId)
        .eq("voucher_id", appliedVoucher.id);

      await supabase
        .from("vouchers")
        .update({ used_count: appliedVoucher.used_count + 1 })
        .eq("id", appliedVoucher.id);
    }

    onPlaceOrder({
      subtotal,
      discountAmount,
      discountedSubtotal,
      shippingFee,
      finalTotal,
      appliedVoucher,
      isFreeShipping,
    });

    setPlacingOrder(false);
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm space-y-5 max-w-md w-full">
      <h2 className="text-lg font-bold text-white">Order Summary</h2>

      {/* Cart Items */}
      <div className="space-y-2 max-h-48 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10">
        {cartItems.map((item) => (
          <div key={item.id} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              {item.image_url && (
                <img src={item.image_url} alt={item.name} className="w-8 h-8 rounded-lg object-cover opacity-80" />
              )}
              <span className="text-gray-300 truncate max-w-[160px]">{item.name}</span>
              <span className="text-gray-500 text-xs">×{item.quantity}</span>
            </div>
            <span className="text-white font-medium">₱{(item.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
      </div>

      <div className="border-t border-white/10" />

      {/* Voucher Input */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-300">Voucher Code</label>
          {myVouchers.length > 0 && (
            <button
              onClick={() => setShowMyVouchers(!showMyVouchers)}
              className="text-xs text-cyan-400 hover:text-cyan-300 transition"
            >
              My Vouchers ({myVouchers.length})
            </button>
          )}
        </div>

        {/* My Vouchers Dropdown */}
        {showMyVouchers && (
          <div className="mb-3 bg-white/5 border border-white/10 rounded-xl p-3 space-y-2">
            {myVouchers.map((v) => (
              <button
                key={v.id}
                onClick={() => applyMyVoucher(v)}
                className="w-full flex items-center justify-between text-left px-3 py-2 rounded-lg
                  hover:bg-white/10 transition group"
              >
                <div>
                  <p className="text-xs font-mono font-bold text-cyan-400">{v.code}</p>
                  <p className="text-xs text-gray-400">
                    {v.free_shipping && v.discount_value === 0
                      ? "Free Shipping"
                      : v.discount_type === "percentage"
                      ? `${v.discount_value}% off`
                      : `₱${v.discount_value} off`}
                    {v.min_spend > 0 && ` · Min ₱${v.min_spend}`}
                  </p>
                </div>
                <span className="text-xs text-cyan-400 opacity-0 group-hover:opacity-100 transition">Apply →</span>
              </button>
            ))}
          </div>
        )}

        {appliedVoucher ? (
          <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-3">
            <div>
              <p className="text-xs text-emerald-400 font-semibold">{appliedVoucher.code}</p>
              <p className="text-xs text-emerald-300 mt-0.5">{voucherSuccess}</p>
            </div>
            <button onClick={removeVoucher} className="text-gray-500 hover:text-red-400 transition text-lg leading-none">×</button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              value={voucherCode}
              onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && validateVoucher()}
              placeholder="Enter code..."
              className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm
                placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 focus:bg-white/10 transition font-mono"
            />
            <button
              onClick={() => validateVoucher()}
              disabled={!voucherCode || validating}
              className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white text-sm font-semibold
                transition disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
            >
              {validating ? "..." : "Apply"}
            </button>
          </div>
        )}

        {voucherError && (
          <p className="text-xs text-red-400 mt-2 flex items-center gap-1">
            <span>⚠</span> {voucherError}
          </p>
        )}
      </div>

      <div className="border-t border-white/10" />

      {/* Price Breakdown */}
      <div className="space-y-2.5 text-sm">
        <div className="flex justify-between text-gray-400">
          <span>Subtotal</span>
          <span className="text-white">₱{subtotal.toFixed(2)}</span>
        </div>

        {discountAmount > 0 && (
          <div className="flex justify-between text-emerald-400">
            <span>Voucher Discount</span>
            <span>−₱{discountAmount.toFixed(2)}</span>
          </div>
        )}

        {discountAmount > 0 && (
          <div className="flex justify-between text-gray-400">
            <span>Discounted Subtotal</span>
            <span className="text-white">₱{discountedSubtotal.toFixed(2)}</span>
          </div>
        )}

        <div className="flex justify-between">
          <span className="text-gray-400">Shipping</span>
          <span className={isFreeShipping ? "text-emerald-400 font-medium" : "text-white"}>
            {isFreeShipping ? "FREE" : `₱${shippingFee.toFixed(2)}`}
          </span>
        </div>

        {isFreeShipping && !appliedVoucher?.free_shipping && shippingSettings && (
          <p className="text-xs text-emerald-400/70">
            Your order qualifies for free shipping (≥₱{shippingSettings.free_shipping_threshold.toLocaleString()})
          </p>
        )}

        {!isFreeShipping && shippingSettings?.free_shipping_enabled && (
          <p className="text-xs text-gray-500">
            Add ₱{Math.max(shippingSettings.free_shipping_threshold - discountedSubtotal, 0).toFixed(2)} more for free shipping
          </p>
        )}
      </div>

      <div className="border-t border-white/10" />

      {/* Total */}
      <div className="flex justify-between items-center">
        <span className="text-white font-bold text-base">Total</span>
        <span className="text-xl font-black text-white">₱{finalTotal.toFixed(2)}</span>
      </div>

      {/* Place Order */}
      <button
        onClick={handlePlaceOrder}
        disabled={placingOrder || cartItems.length === 0}
        className="w-full py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 active:scale-95
          text-white font-bold text-sm transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {placingOrder ? "Placing Order..." : `Place Order · ₱${finalTotal.toFixed(2)}`}
      </button>
    </div>
  );
}
