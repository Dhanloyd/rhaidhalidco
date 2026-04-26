import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Printer, Download, FileText, TrendingUp, TrendingDown,
  ShoppingBag, Users, DollarSign, Filter, FileSpreadsheet,
  PhilippinePesoIcon, CheckCircle, Clock, Truck, XCircle,
  BarChart3, RefreshCw, ChevronDown, ArrowUpRight, Package,
  CalendarDays, SlidersHorizontal, X
} from "lucide-react";
import * as XLSX from "xlsx";

// ── Tiny helpers ──────────────────────────────────────────────────────────────
const fmt = (n: number) => `₱${Number(n).toLocaleString("en-PH", { minimumFractionDigits: 0 })}`;
const pct = (n: number, total: number) => total > 0 ? `${((n / total) * 100).toFixed(1)}%` : "0%";

const STATUS_META: Record<string, { label: string; dot: string; pill: string }> = {
  pending:          { label: "Pending",       dot: "bg-amber-400",  pill: "bg-amber-50 text-amber-700 border-amber-200"   },
  confirmed:        { label: "Confirmed",     dot: "bg-blue-400",   pill: "bg-blue-50 text-blue-700 border-blue-200"      },
  packed:           { label: "Packed",        dot: "bg-violet-400", pill: "bg-violet-50 text-violet-700 border-violet-200"},
  shipped:          { label: "Shipped",       dot: "bg-indigo-400", pill: "bg-indigo-50 text-indigo-700 border-indigo-200"},
  out_for_delivery: { label: "Out Delivery",  dot: "bg-sky-400",    pill: "bg-sky-50 text-sky-700 border-sky-200"         },
  delivered:        { label: "Delivered",     dot: "bg-teal-400",   pill: "bg-teal-50 text-teal-700 border-teal-200"      },
  completed:        { label: "Completed",     dot: "bg-green-500",  pill: "bg-green-50 text-green-700 border-green-200"   },
  payment_complete: { label: "Paid",          dot: "bg-emerald-500",pill: "bg-emerald-50 text-emerald-700 border-emerald-200"},
  cancelled:        { label: "Cancelled",     dot: "bg-red-400",    pill: "bg-red-50 text-red-600 border-red-200"         },
};

const PM_LABELS: Record<string, string> = {
  cod:          "Cash on Delivery",
  gcash:        "GCash",
  card:         "Credit Card",
  gcash_manual: "GCash Manual",
};

const AdminReportsPage = () => {
  const [orders, setOrders]           = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [dateFrom, setDateFrom]       = useState("");
  const [dateTo, setDateTo]           = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [filterOpen, setFilterOpen]   = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    let q = supabase.from("orders").select("*").order("created_at", { ascending: false });
    if (dateFrom) q = q.gte("created_at", dateFrom);
    if (dateTo)   q = q.lte("created_at", dateTo + "T23:59:59");
    if (statusFilter !== "all") q = q.eq("status", statusFilter);
    const { data } = await q;
    setOrders(data || []);
    isRefresh ? setRefreshing(false) : setLoading(false);
  };

  // ── Derived stats ─────────────────────────────────────────────────────────
  const totalRevenue   = orders.reduce((s, o) => s + (o.total || 0), 0);
  const totalOrders    = orders.length;
  const avgOrder       = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const pendingCount   = orders.filter(o => o.status === "pending").length;
  const completedCount = orders.filter(o => ["completed","payment_complete"].includes(o.status)).length;
  const shippedCount   = orders.filter(o => ["shipped","out_for_delivery","delivered"].includes(o.status)).length;
  const cancelledCount = orders.filter(o => o.status === "cancelled").length;

  // Payment breakdown
  const paymentMap: Record<string, { count: number; total: number }> = {};
  orders.forEach(o => {
    const pm = o.payment_method || "unknown";
    if (!paymentMap[pm]) paymentMap[pm] = { count: 0, total: 0 };
    paymentMap[pm].count++;
    paymentMap[pm].total += o.total || 0;
  });

  // ── Excel Export ──────────────────────────────────────────────────────────
  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    const summaryData = [
      ["RaidKhalid & Co. — Orders Report"],
      [`Generated: ${new Date().toLocaleString()}`],
      [`Date Range: ${dateFrom || "All"} to ${dateTo || "All"}`],
      [`Status Filter: ${statusFilter === "all" ? "All Statuses" : statusFilter}`],
      [],
      ["SUMMARY"],
      ["Metric", "Value"],
      ["Total Revenue",       `₱${totalRevenue.toLocaleString()}`],
      ["Total Orders",        totalOrders],
      ["Average Order Value", `₱${Math.round(avgOrder).toLocaleString()}`],
      ["Pending Orders",      pendingCount],
      ["Completed Orders",    completedCount],
      ["Shipped Orders",      shippedCount],
      ["Cancelled Orders",    cancelledCount],
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    wsSummary["!cols"] = [{ wch: 25 }, { wch: 20 }];
    wsSummary["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }];
    XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

    const orderHeaders = ["Order ID","Customer Name","Email","Phone","Shipping Address","Subtotal (₱)","Discount (₱)","Shipping Fee (₱)","Total (₱)","Status","Payment Method","Payment Reference","Order Type","Date","Time"];
    const orderRows = orders.map(o => {
      const d = new Date(o.created_at);
      return [o.id?.slice(0,8).toUpperCase(), o.customer_name||"", o.customer_email||"", o.shipping_phone||"", o.shipping_address||"", o.subtotal??o.total??0, o.discount??0, o.shipping_fee??0, o.total??0, o.status||"", o.payment_method||"", o.payment_reference||"", o.order_type||"", d.toLocaleDateString(), d.toLocaleTimeString()];
    });
    const totalsRow = ["TOTAL","","","","", orders.reduce((s,o)=>s+(o.subtotal??o.total??0),0), orders.reduce((s,o)=>s+(o.discount??0),0), orders.reduce((s,o)=>s+(o.shipping_fee??0),0), totalRevenue,"","","","","",""];
    const wsOrders = XLSX.utils.aoa_to_sheet([orderHeaders, ...orderRows, [], totalsRow]);
    wsOrders["!cols"] = [{wch:12},{wch:22},{wch:28},{wch:15},{wch:35},{wch:14},{wch:14},{wch:14},{wch:14},{wch:12},{wch:16},{wch:20},{wch:12},{wch:14},{wch:12}];
    XLSX.utils.book_append_sheet(wb, wsOrders, "Orders");

    const paymentData = [["Payment Method Breakdown"],[],["Payment Method","Order Count","Total Revenue (₱)","% of Revenue"],...Object.entries(paymentMap).map(([pm,{count,total}])=>[pm.toUpperCase(),count,total,totalRevenue>0?`${((total/totalRevenue)*100).toFixed(1)}%`:"0%"]),[],["TOTAL",totalOrders,totalRevenue,"100%"]];
    const wsPayment = XLSX.utils.aoa_to_sheet(paymentData);
    wsPayment["!cols"] = [{wch:20},{wch:14},{wch:20},{wch:15}];
    wsPayment["!merges"] = [{s:{r:0,c:0},e:{r:0,c:3}}];
    XLSX.utils.book_append_sheet(wb, wsPayment, "Payment Breakdown");

    const statusData = [["Order Status Breakdown"],[],["Status","Count","% of Orders"],["Pending",pendingCount,pct(pendingCount,totalOrders)],["Completed",completedCount,pct(completedCount,totalOrders)],["Shipped",shippedCount,pct(shippedCount,totalOrders)],["Cancelled",cancelledCount,pct(cancelledCount,totalOrders)],[],["TOTAL",totalOrders,"100%"]];
    const wsStatus = XLSX.utils.aoa_to_sheet(statusData);
    wsStatus["!cols"] = [{wch:16},{wch:10},{wch:15}];
    wsStatus["!merges"] = [{s:{r:0,c:0},e:{r:0,c:2}}];
    XLSX.utils.book_append_sheet(wb, wsStatus, "Status Breakdown");

    XLSX.writeFile(wb, `raidkhalid-report-${new Date().toISOString().slice(0,10)}.xlsx`);
    toast.success("Excel report exported — 4 sheets!");
  };

  // ── CSV Export ─────────────────────────────────────────────────────────────
  const exportCSV = () => {
    const headers = ["Order ID","Customer","Email","Phone","Address","Subtotal","Discount","Shipping Fee","Total","Status","Payment","Reference","Date"];
    const rows = orders.map(o => [o.id?.slice(0,8).toUpperCase(), o.customer_name, o.customer_email, o.shipping_phone||"", o.shipping_address||"", o.subtotal??o.total??0, o.discount??0, o.shipping_fee??0, o.total??0, o.status, o.payment_method, o.payment_reference||"", new Date(o.created_at).toLocaleDateString()]);
    const csv = [headers,...rows].map(r=>r.map(c=>`"${c??""}"`) .join(",")).join("\n");
    const blob = new Blob([csv], { type:"text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `raidkhalid-orders-${new Date().toISOString().slice(0,10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast.success("CSV exported!");
  };

  // ── Print ──────────────────────────────────────────────────────────────────
  const handlePrint = () => {
    const content = printRef.current?.innerHTML;
    if (!content) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<html><head><title>Orders Report — RaidKhalid & Co.</title><style>*{margin:0;padding:0;box-sizing:border-box;}body{font-family:Arial,sans-serif;font-size:11px;color:#111;padding:24px;}h1{font-size:17px;font-weight:900;text-transform:uppercase;letter-spacing:2px;margin-bottom:4px;}p.meta{font-size:10px;color:#666;margin-bottom:18px;}.stats{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-bottom:16px;}.stat-card{border:1px solid #e5e7eb;border-radius:8px;padding:10px;}.stat-label{font-size:8px;color:#9ca3af;text-transform:uppercase;letter-spacing:.1em;margin-bottom:4px;}.stat-value{font-size:18px;font-weight:800;}table{width:100%;border-collapse:collapse;margin-top:12px;}th{background:#060b18;color:#fff;text-align:left;padding:7px 10px;font-size:9px;text-transform:uppercase;letter-spacing:.12em;}td{padding:5px 10px;border-bottom:1px solid #f3f4f6;font-size:10px;}tr:nth-child(even) td{background:#fafafa;}.tfoot-row td{background:#f1f5f9;font-weight:800;border-top:2px solid #060b18;}.badge{display:inline-block;padding:2px 7px;border-radius:20px;font-size:8px;font-weight:700;text-transform:uppercase;}.pending{background:#fef3c7;color:#92400e;}.completed{background:#dcfce7;color:#166534;}.shipped{background:#dbeafe;color:#1e40af;}.cancelled{background:#fee2e2;color:#991b1b;}.footer{margin-top:20px;text-align:center;font-size:9px;color:#9ca3af;border-top:1px solid #e5e7eb;padding-top:10px;}</style></head><body>${content}</body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 500);
  };

  const activeFilters = [dateFrom && `From: ${dateFrom}`, dateTo && `To: ${dateTo}`, statusFilter !== "all" && `Status: ${statusFilter}`].filter(Boolean);

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(160deg, #060b18 0%, #0d1530 40%, #0f1d3a 100%)" }}>

      {/* ── Top Header ────────────────────────────────────────────────────── */}
      <div className="px-6 pt-6 pb-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <BarChart3 size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-heading text-xl uppercase tracking-widest text-white">Reports</h1>
              <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>Orders summary &amp; export</p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => fetchOrders(true)}
              disabled={refreshing}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}
            >
              <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
              Refresh
            </button>
            <button
              onClick={exportCSV}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-90"
              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}
            >
              <Download size={13} /> CSV
            </button>
            <button
              onClick={exportExcel}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-90"
              style={{ background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.25)", color: "#4ade80" }}
            >
              <FileSpreadsheet size={13} /> Excel
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #4f7cff 0%, #7c3aed 100%)", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              <Printer size={13} /> Print
            </button>
          </div>
        </div>

        {/* ── Stat Cards ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
          {[
            { label: "Total Revenue",   value: fmt(totalRevenue),               sub: `${totalOrders} orders`,          icon: PhilippinePesoIcon, accent: "from-green-500/20 to-emerald-500/10", border: "border-green-500/20", iconColor: "text-green-400", subColor: "text-green-400/60" },
            { label: "Avg. Order",      value: fmt(Math.round(avgOrder)),        sub: "per transaction",                icon: TrendingUp,         accent: "from-blue-500/20 to-blue-500/10",    border: "border-blue-500/20",  iconColor: "text-blue-400",  subColor: "text-blue-400/60"  },
            { label: "Pending",         value: pendingCount,                     sub: pct(pendingCount, totalOrders),   icon: Clock,              accent: "from-amber-500/20 to-amber-500/10",  border: "border-amber-500/20", iconColor: "text-amber-400", subColor: "text-amber-400/60" },
            { label: "Completed",       value: completedCount,                   sub: pct(completedCount, totalOrders), icon: CheckCircle,        accent: "from-emerald-500/20 to-teal-500/10", border: "border-emerald-500/20",iconColor: "text-emerald-400",subColor:"text-emerald-400/60"},
            { label: "Cancelled",       value: cancelledCount,                   sub: pct(cancelledCount, totalOrders), icon: XCircle,            accent: "from-red-500/20 to-red-500/10",      border: "border-red-500/20",   iconColor: "text-red-400",   subColor: "text-red-400/60"   },
          ].map(({ label, value, sub, icon: Icon, accent, border, iconColor, subColor }) => (
            <div key={label} className={`rounded-2xl p-4 bg-gradient-to-br ${accent} border ${border}`} style={{ backdropFilter: "blur(8px)" }}>
              <div className="flex items-start justify-between mb-3">
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.45)" }}>{label}</p>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <Icon size={14} className={iconColor} />
                </div>
              </div>
              <p className="text-2xl font-bold text-white leading-none mb-1">{value}</p>
              <p className={`text-xs font-medium ${subColor}`}>{sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Body (white card) ─────────────────────────────────────────────── */}
      <div className="mx-4 mb-6 rounded-3xl overflow-hidden shadow-2xl" style={{ background: "#f8f9ff", border: "1px solid rgba(255,255,255,0.15)" }}>

        {/* ── Filter Bar ──────────────────────────────────────────────────── */}
        <div className="px-5 py-4 border-b border-gray-200/80 flex items-center justify-between gap-3 flex-wrap" style={{ background: "#fff" }}>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <CalendarDays size={14} className="text-gray-400" />
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Filter</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 bg-gray-100 rounded-xl px-3 py-1.5">
                <span className="text-xs text-gray-500">From</span>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={e => setDateFrom(e.target.value)}
                  className="text-xs font-medium text-gray-800 bg-transparent border-none outline-none w-28"
                />
              </div>
              <div className="flex items-center gap-1.5 bg-gray-100 rounded-xl px-3 py-1.5">
                <span className="text-xs text-gray-500">To</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={e => setDateTo(e.target.value)}
                  className="text-xs font-medium text-gray-800 bg-transparent border-none outline-none w-28"
                />
              </div>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="text-xs font-medium text-gray-800 bg-gray-100 border-none rounded-xl px-3 py-1.5 outline-none cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="packed">Packed</option>
                <option value="shipped">Shipped</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            {activeFilters.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                {activeFilters.map(f => (
                  <span key={f} className="text-[10px] font-semibold bg-indigo-50 text-indigo-600 border border-indigo-200 px-2 py-0.5 rounded-full">{f}</span>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => fetchOrders()}
              className="px-4 py-1.5 rounded-xl text-xs font-semibold text-white transition-all"
              style={{ background: "linear-gradient(135deg, #060b18 0%, #1a2e5a 100%)" }}
            >
              Apply
            </button>
            {activeFilters.length > 0 && (
              <button
                onClick={() => { setDateFrom(""); setDateTo(""); setStatusFilter("all"); setTimeout(() => fetchOrders(), 0); }}
                className="px-3 py-1.5 rounded-xl text-xs font-medium text-gray-500 hover:bg-gray-100 transition-colors flex items-center gap-1"
              >
                <X size={11} /> Clear
              </button>
            )}
          </div>
        </div>

        {/* ── Printable content ───────────────────────────────────────────── */}
        <div ref={printRef}>
          {/* Print-only header */}
          <div className="hidden print:block mb-4 px-6 pt-4">
            <h1>RaidKhalid &amp; Co. — Orders Report</h1>
            <p className="meta">Generated: {new Date().toLocaleString()} &nbsp;|&nbsp; Range: {dateFrom||"All"} – {dateTo||"All"} &nbsp;|&nbsp; Status: {statusFilter==="all"?"All":statusFilter}</p>
          </div>

          {/* ── Payment breakdown mini-row ──────────────────────────────── */}
          {Object.keys(paymentMap).length > 0 && (
            <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-6 overflow-x-auto" style={{ background: "rgba(249,250,255,0.8)" }}>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide shrink-0">Payment Mix</span>
              {Object.entries(paymentMap).map(([pm, { count, total }]) => (
                <div key={pm} className="flex items-center gap-2 shrink-0">
                  <div className="w-2 h-2 rounded-full bg-indigo-400" />
                  <span className="text-xs font-semibold text-gray-700">{PM_LABELS[pm] || pm.toUpperCase()}</span>
                  <span className="text-xs text-gray-400">{count} orders</span>
                  <span className="text-xs font-bold text-gray-800">{fmt(total)}</span>
                  <span className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded-full font-semibold">{pct(total, totalRevenue)}</span>
                </div>
              ))}
            </div>
          )}

          {/* ── Print stat cards (print-only) ─────────────────────────── */}
          <div className="hidden print:flex stats px-6 py-3 gap-4">
            {[
              { label: "Total Revenue", value: fmt(totalRevenue) },
              { label: "Total Orders",  value: totalOrders },
              { label: "Avg Order",     value: fmt(Math.round(avgOrder)) },
              { label: "Completed",     value: completedCount },
              { label: "Cancelled",     value: cancelledCount },
            ].map(s => (
              <div key={s.label} className="stat-card flex-1">
                <p className="stat-label">{s.label}</p>
                <p className="stat-value">{s.value}</p>
              </div>
            ))}
          </div>

          {/* ── Table ───────────────────────────────────────────────────── */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                <p className="text-sm text-gray-400 font-medium">Loading orders...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
                  <Package size={24} className="text-gray-300" />
                </div>
                <p className="text-sm text-gray-500 font-medium">No orders found</p>
                <p className="text-xs text-gray-400">Try adjusting your filters</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "linear-gradient(90deg, #060b18 0%, #0f1d3a 100%)" }}>
                    {["Order ID", "Customer", "Email", "Subtotal", "Discount", "Shipping", "Total", "Status", "Payment", "Date"].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-widest whitespace-nowrap" style={{ color: "rgba(255,255,255,0.5)" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o, idx) => {
                    const meta = STATUS_META[o.status] || { label: o.status, dot: "bg-gray-400", pill: "bg-gray-100 text-gray-600 border-gray-200" };
                    return (
                      <tr
                        key={o.id}
                        className="border-b border-gray-100 transition-colors hover:bg-indigo-50/30"
                        style={{ background: idx % 2 === 0 ? "#fff" : "rgba(248,249,255,0.6)" }}
                      >
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                            #{o.id?.slice(0, 8).toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-semibold text-gray-900 whitespace-nowrap">{o.customer_name || "—"}</p>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400 max-w-[160px] truncate">{o.customer_email || "—"}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-700">{fmt(o.subtotal ?? o.total ?? 0)}</td>
                        <td className="px-4 py-3">
                          {(o.discount ?? 0) > 0
                            ? <span className="text-xs font-semibold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-md">-{fmt(o.discount)}</span>
                            : <span className="text-xs text-gray-300">—</span>
                          }
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">{fmt(o.shipping_fee ?? 0)}</td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-bold text-gray-900">{fmt(o.total ?? 0)}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border capitalize ${meta.pill} badge ${o.status}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                            {meta.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-medium text-gray-500 capitalize">{PM_LABELS[o.payment_method] || o.payment_method || "—"}</span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                          {new Date(o.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ background: "linear-gradient(90deg, #060b18 0%, #0f1d3a 100%)" }} className="tfoot-row">
                    <td colSpan={3} className="px-4 py-3">
                      <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.5)" }}>
                        Totals · {totalOrders} orders
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-white">{fmt(orders.reduce((s,o)=>s+(o.subtotal??o.total??0),0))}</td>
                    <td className="px-4 py-3 text-sm font-bold text-green-400">-{fmt(orders.reduce((s,o)=>s+(o.discount??0),0))}</td>
                    <td className="px-4 py-3 text-sm font-bold text-white">{fmt(orders.reduce((s,o)=>s+(o.shipping_fee??0),0))}</td>
                    <td className="px-4 py-3">
                      <span className="text-base font-bold" style={{ color: "#7dd3fc" }}>{fmt(totalRevenue)}</span>
                    </td>
                    <td colSpan={3} />
                  </tr>
                </tfoot>
              </table>
            )}
          </div>

          {/* Print footer */}
          <div className="hidden print:block footer mt-4 px-6 pb-4">
            RaidKhalid &amp; Co. · Confidential · {new Date().toLocaleString()}
          </div>
        </div>

        {/* ── Table footer ────────────────────────────────────────────────── */}
        {orders.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between" style={{ background: "#fff" }}>
            <p className="text-xs text-gray-400 font-medium">
              Showing <span className="font-bold text-gray-700">{totalOrders}</span> order{totalOrders !== 1 ? "s" : ""}
              {activeFilters.length > 0 && " (filtered)"}
            </p>
            <p className="text-xs text-gray-500">
              Grand total: <span className="font-bold text-gray-900">{fmt(totalRevenue)}</span>
            </p>
          </div>
        )}
      </div>

    </div>
  );
};

export default AdminReportsPage;
