import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  CreditCard, TrendingUp, CheckCircle, XCircle, Clock,
  RefreshCw, Search, Filter, ArrowUpRight, Download,
  Wallet, Ban, AlertCircle
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell
} from "recharts";

const cardStyle = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.08)",
  backdropFilter: "blur(20px)",
  boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
};

const STATUS_STYLES: Record<string, string> = {
  paid:      "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20",
  pending:   "bg-amber-500/15 text-amber-400 border border-amber-500/20",
  failed:    "bg-red-500/15 text-red-400 border border-red-500/20",
  refunded:  "bg-violet-500/15 text-violet-400 border border-violet-500/20",
};

const METHOD_ICONS: Record<string, string> = {
  gcash: "📱",
  card:  "💳",
  cod:   "💵",
  grab_pay: "🚗",
};

const BAR_COLORS = ["#6366f1", "#8b5cf6", "#a78bfa", "#60a5fa", "#34d399", "#fb923c"];

export default function TransactionsPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [dailyData, setDailyData] = useState<any[]>([]);
  const [methodData, setMethodData] = useState<any[]>([]);

  const [stats, setStats] = useState({
    totalRevenue: 0,
    paidCount: 0,
    pendingCount: 0,
    failedCount: 0,
    avgOrder: 0,
  });

  const fetchData = useCallback(async () => {
    setRefreshing(true);
    const { data } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    const all = data || [];
    setOrders(all);

    // ── Stats ──
    const paid = all.filter((o) => o.payment_status === "paid" || o.status === "completed");
    const pending = all.filter((o) => o.payment_status === "pending" && o.status !== "cancelled");
    const failed = all.filter((o) => o.payment_status === "failed" || o.status === "cancelled");
    const totalRevenue = paid.reduce((s, o) => s + Number(o.total), 0);

    setStats({
      totalRevenue,
      paidCount: paid.length,
      pendingCount: pending.length,
      failedCount: failed.length,
      avgOrder: paid.length ? Math.round(totalRevenue / paid.length) : 0,
    });

    // ── Daily revenue (last 7 days) ──
    const days: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days[d.toLocaleDateString("en-PH", { month: "short", day: "numeric" })] = 0;
    }
    paid.forEach((o) => {
      const label = new Date(o.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric" });
      if (label in days) days[label] += Number(o.total);
    });
    setDailyData(Object.entries(days).map(([date, amount]) => ({ date, amount })));

    // ── Payment method breakdown ──
    const methodMap: Record<string, number> = {};
    all.forEach((o) => {
      const m = o.payment_method || "unknown";
      methodMap[m] = (methodMap[m] || 0) + 1;
    });
    setMethodData(Object.entries(methodMap).map(([name, count]) => ({ name, count })));

    setRefreshing(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Filter ──
  useEffect(() => {
    let result = [...orders];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((o) =>
        o.customer_name?.toLowerCase().includes(q) ||
        o.customer_email?.toLowerCase().includes(q) ||
        o.id?.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") {
      result = result.filter((o) =>
        statusFilter === "paid"
          ? o.payment_status === "paid" || o.status === "completed"
          : statusFilter === "pending"
          ? o.payment_status === "pending" && o.status !== "cancelled"
          : statusFilter === "failed"
          ? o.payment_status === "failed" || o.status === "cancelled"
          : true
      );
    }
    if (methodFilter !== "all") {
      result = result.filter((o) => o.payment_method === methodFilter);
    }
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
      ...filtered.map((o) => [
        o.id?.slice(0, 8).toUpperCase(),
        o.customer_name,
        o.customer_email,
        o.total,
        o.payment_method,
        getPaymentStatus(o),
        new Date(o.created_at).toLocaleDateString(),
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "transactions.csv";
    a.click();
  };

  const statCards = [
    { title: "Total Revenue", value: `₱${stats.totalRevenue.toLocaleString()}`, icon: Wallet, iconBg: "bg-emerald-500/20", iconColor: "text-emerald-400", accent: "#34d399" },
    { title: "Paid", value: stats.paidCount, icon: CheckCircle, iconBg: "bg-blue-500/20", iconColor: "text-blue-400", accent: "#60a5fa" },
    { title: "Pending", value: stats.pendingCount, icon: Clock, iconBg: "bg-amber-500/20", iconColor: "text-amber-400", accent: "#fb923c" },
    { title: "Failed / Cancelled", value: stats.failedCount, icon: Ban, iconBg: "bg-red-500/20", iconColor: "text-red-400", accent: "#f87171" },
    { title: "Avg. Order Value", value: `₱${stats.avgOrder.toLocaleString()}`, icon: TrendingUp, iconBg: "bg-violet-500/20", iconColor: "text-violet-400", accent: "#a78bfa" },
  ];

  return (
    <div className="min-h-screen p-6 space-y-6 relative"
      style={{ background: "linear-gradient(135deg, #0f1117 0%, #141824 50%, #0f1117 100%)" }}>

      {/* Background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #6366f1, transparent 70%)" }} />
        <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #10b981, transparent 70%)" }} />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between relative z-10"
        style={{ animation: "fadeUp 0.5s ease forwards" }}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-emerald-400 font-medium tracking-widest uppercase">Live</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Payment Transactions</h1>
          <p className="text-sm text-slate-400 mt-0.5">All payment activity · RaidKhalid & Co.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-slate-300 hover:text-white transition-all duration-200"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <Download size={14} /> Export CSV
          </button>
          <button onClick={fetchData} disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-slate-300 hover:text-white transition-all duration-200"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 relative z-10">
        {statCards.map((s, i) => (
          <div key={s.title} className="group rounded-2xl p-5 cursor-default transition-all duration-300 hover:scale-[1.02] opacity-0"
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

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-6 relative z-10">
        {/* Revenue chart */}
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
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: "#64748b", fontSize: 10 }} tickLine={false} axisLine={false}
                  tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ background: "rgba(15,17,23,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: "#fff", fontSize: "12px" }}
                  formatter={(v: any) => [`₱${Number(v).toLocaleString()}`, "Revenue"]} />
                <Area type="monotone" dataKey="amount" stroke="#6366f1" strokeWidth={2} fill="url(#revenueGrad)" dot={{ fill: "#6366f1", r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment method breakdown */}
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

      {/* Filters + Table */}
      <div className="rounded-2xl overflow-hidden opacity-0 relative z-10"
        style={{ ...cardStyle, animation: "fadeUp 0.5s ease 0.45s forwards" }}>

        {/* Filter bar */}
        <div className="p-4 flex flex-wrap items-center gap-3"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email, order ID…"
              className="w-full pl-9 pr-4 py-2 rounded-xl text-sm text-slate-200 placeholder-slate-600 outline-none focus:ring-1 focus:ring-indigo-500/50"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }} />
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
            {["all", "paid", "pending", "failed"].map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                  statusFilter === s ? "bg-indigo-500/30 text-indigo-300" : "text-slate-500 hover:text-slate-300"
                }`}>
                {s}
              </button>
            ))}
          </div>

          {/* Method filter */}
          <select value={methodFilter} onChange={(e) => setMethodFilter(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs text-slate-300 outline-none"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <option value="all">All Methods</option>
            <option value="gcash">GCash</option>
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
                {["Order ID", "Customer", "Amount", "Method", "Payment", "Order Status", "Date"].map((h) => (
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
                          o.status === "cancelled" ? "bg-red-500/15 text-red-400 border border-red-500/20" :
                          o.status === "shipped"   ? "bg-blue-500/15 text-blue-400 border border-blue-500/20" :
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

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        select option { background: #141824; color: #cbd5e1; }
      `}</style>
    </div>
  );
}
