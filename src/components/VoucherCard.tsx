import { useCountdown } from "../hooks/useCountdown";

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

interface VoucherCardProps {
  voucher: Voucher;
  claimed: boolean;
  claiming: boolean;
  onClaim: () => void;
}

export default function VoucherCard({ voucher, claimed, claiming, onClaim }: VoucherCardProps) {
  const countdown = useCountdown(voucher.expiry_date);

  const isExpired = countdown?.isExpired ?? false;
  const isUrgent  = countdown?.isUrgent ?? false;
  const isMaxed   = voucher.max_uses !== null && voucher.used_count >= voucher.max_uses;
  const unavailable = isExpired || isMaxed || !voucher.active;

  const formatDiscount = () => {
    if (voucher.free_shipping && voucher.discount_value === 0) return "Free Shipping";
    if (voucher.discount_type === "percentage") return `${voucher.discount_value}% OFF`;
    return `₱${voucher.discount_value} OFF`;
  };

  const getBadgeStyle = () => {
    if (voucher.free_shipping) return "bg-sky-500/20 border-sky-500/30 text-sky-300";
    if (voucher.discount_type === "percentage") return "bg-violet-500/20 border-violet-500/30 text-violet-300";
    return "bg-emerald-500/20 border-emerald-500/30 text-emerald-300";
  };

  // Countdown block colors
  const countdownColor = isUrgent
    ? "text-red-400 border-red-500/30 bg-red-500/10"
    : "text-amber-400 border-amber-500/30 bg-amber-500/10";

  return (
    <div
      className={`relative bg-white/5 border rounded-2xl overflow-hidden backdrop-blur-sm transition-all duration-200
        ${unavailable
          ? "opacity-50 border-white/5"
          : "border-white/10 hover:border-white/20 hover:bg-white/[0.07]"
        }`}
    >
      {/* Coupon notch decorations */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-3 h-6 bg-[#0f172a] rounded-r-full z-10" />
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-6 bg-[#0f172a] rounded-l-full z-10" />

      {/* Urgent pulse ring */}
      {isUrgent && !isExpired && !unavailable && (
        <div className="absolute inset-0 rounded-2xl border border-red-500/40 animate-pulse pointer-events-none" />
      )}

      {/* Top section */}
      <div className="px-6 pt-5 pb-4 border-b border-dashed border-white/10">
        <div className="flex items-center justify-between mb-2">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${getBadgeStyle()}`}>
            {voucher.free_shipping ? "🚚 FREE SHIP" : voucher.discount_type === "percentage" ? "% DISCOUNT" : "₱ DISCOUNT"}
          </span>

          {/* Status badge */}
          {isExpired && (
            <span className="text-xs font-semibold text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full">
              Expired
            </span>
          )}
          {isMaxed && !isExpired && (
            <span className="text-xs font-semibold text-gray-500 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
              Sold out
            </span>
          )}
          {!voucher.active && !isExpired && !isMaxed && (
            <span className="text-xs font-semibold text-gray-500 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
              Unavailable
            </span>
          )}
        </div>

        <div className="text-3xl font-black text-white tracking-tight mt-3">
          {formatDiscount()}
        </div>
        {voucher.description && (
          <p className="text-gray-400 text-sm mt-1">{voucher.description}</p>
        )}
      </div>

      {/* Bottom section */}
      <div className="px-6 py-4 space-y-3">

        {/* Code + min spend */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Code</p>
            <p className="text-sm font-mono font-bold text-cyan-400 tracking-widest">{voucher.code}</p>
          </div>
          {voucher.min_spend > 0 && (
            <div className="text-right">
              <p className="text-xs text-gray-500 mb-0.5">Min. spend</p>
              <p className="text-sm font-medium text-white">₱{voucher.min_spend.toLocaleString()}</p>
            </div>
          )}
        </div>

        {/* Countdown timer */}
        {voucher.expiry_date && countdown && !isExpired && (
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium ${countdownColor}`}>
            {/* Flashing dot for urgency */}
            {isUrgent && (
              <span className="relative flex w-2 h-2 flex-shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full w-2 h-2 bg-red-500" />
              </span>
            )}
            {!isUrgent && <span className="text-amber-400">⏱</span>}
            <span>{countdown.label}</span>

            {/* Digit breakdown when urgent */}
            {isUrgent && (
              <div className="ml-auto flex items-center gap-1 font-mono">
                <span className="bg-black/20 px-1.5 py-0.5 rounded">
                  {String(countdown.hours).padStart(2, "0")}
                </span>
                <span className="opacity-60">:</span>
                <span className="bg-black/20 px-1.5 py-0.5 rounded">
                  {String(countdown.minutes).padStart(2, "0")}
                </span>
                <span className="opacity-60">:</span>
                <span className="bg-black/20 px-1.5 py-0.5 rounded">
                  {String(countdown.seconds).padStart(2, "0")}
                </span>
              </div>
            )}
          </div>
        )}

        {/* No expiry_date label */}
        {!voucher.expiry_date && (
          <p className="text-xs text-gray-600">No expiry_date date</p>
        )}

        {/* Claim button */}
        <button
          onClick={onClaim}
          disabled={claimed || unavailable || claiming}
          className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 active:scale-95
            ${claimed
              ? "bg-white/5 border border-white/10 text-gray-500 cursor-default"
              : unavailable
              ? "bg-white/5 border border-white/5 text-gray-600 cursor-not-allowed"
              : "bg-cyan-500 hover:bg-cyan-400 text-white cursor-pointer shadow-lg shadow-cyan-500/10"
            }`}
        >
          {claiming ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Claiming...
            </span>
          ) : claimed ? (
            "✓ Claimed"
          ) : (
            "Claim Voucher"
          )}
        </button>
      </div>
    </div>
  );
}
