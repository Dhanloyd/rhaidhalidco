import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DollarSign, ShoppingCart, Package, AlertTriangle, TrendingUp, ArrowUpRight, RefreshCw, Activity, Flame, PhilippinePesoIcon } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { toast } from "sonner";

const DashboardPage = () => {
  const [stats, setStats] = useState({ completedRevenue: 0, completedOrders: 0, totalProducts: 0, lowStockCount: 0 });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [ordersByStatus, setOrdersByStatus] = useState<any[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    setRefreshing(true);
    const [ordersRes, productsRes] = await Promise.all([
      supabase.from("orders").select("*").order("created_at", { ascending: false }),
      supabase.from("products").select("id, name, stock_quantity, low_stock_threshold, sold_count, image_url"),
    ]);

    const orders = ordersRes.data || [];
    const products = productsRes.data || [];

    const completedOrders = orders.filter((o) => o.status === "completed");
    const completedRevenue = completedOrders.reduce((sum, o) => sum + Number(o.total), 0);
    const lowStock = products.filter((p) => p.stock_quantity <= p.low_stock_threshold && p.stock_quantity > 0);
    const outOfStock = products.filter((p) => p.stock_quantity === 0);

    if (lowStock.length > 0) toast.warning(`${lowStock.length} product(s) running low on stock!`);
    if (outOfStock.length > 0) toast.error(`${outOfStock.length} product(s) are out of stock!`);

    setStats({ completedRevenue, completedOrders: completedOrders.length, totalProducts: products.length, lowStockCount: lowStock.length + outOfStock.length });
    setRecentOrders(orders.slice(0, 5));
    setLowStockProducts([...outOfStock, ...lowStock].slice(0, 5));

    const statusCounts: Record<string, number> = {};
    orders.forEach((o) => { statusCounts[o.status] = (statusCounts[o.status] || 0) + 1; });
    setOrdersByStatus(Object.entries(statusCounts).map(([name, value]) => ({ name, value })));

    // ── Most purchased: tally from order items ──
    const productSales: Record<string, { name: string; qty: number; image_url?: string }> = {};
    orders.forEach((order) => {
      const items = Array.isArray(order.items) ? order.items : [];
      items.forEach((item: any) => {
        const id = item.id || item.product_id;
        if (!id) return;
        if (!productSales[id]) {
          // find matching product for image
          const prod = products.find((p) => p.id === id);
          productSales[id] = { name: item.name || "Unknown", qty: 0, image_url: prod?.image_url };
        }
        productSales[id].qty += Number(item.quantity) || 0;
      });
    });

    // Fallback: use sold_count from products table if no order items data
    if (Object.keys(productSales).length === 0) {
      const sorted = [...products]
        .filter((p) => p.sold_count > 0)
        .sort((a, b) => b.sold_count - a.sold_count)
        .slice(0, 6)
        .map((p) => ({ name: p.name, qty: p.sold_count, image_url: p.image_url }));
      setTopProducts(sorted);
    } else {
      const sorted = Object.values(productSales)
        .sort((a, b) => b.qty - a.qty)
        .slice(0, 6);
      setTopProducts(sorted);
    }

    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  const statCards = [
    { title: "Total Revenue", value: `₱${stats.completedRevenue.toLocaleString()}`, icon: PhilippinePesoIcon, iconBg: "bg-emerald-500/20", iconColor: "text-emerald-400" },
    { title: "Completed Orders", value: stats.completedOrders, icon: ShoppingCart, iconBg: "bg-blue-500/20", iconColor: "text-blue-400" },
    { title: "Total Products", value: stats.totalProducts, icon: Package, iconBg: "bg-violet-500/20", iconColor: "text-violet-400" },
    { title: "Stock Alerts", value: stats.lowStockCount, icon: AlertTriangle, iconBg: "bg-amber-500/20", iconColor: "text-amber-400" },
  ];

  const PIE_COLORS = ["#34d399", "#60a5fa", "#a78bfa", "#fb923c", "#f472b6", "#f87171"];
  const BAR_COLORS = ["#6366f1", "#8b5cf6", "#a78bfa", "#60a5fa", "#34d399", "#fb923c"];

  const statusStyles: Record<string, string> = {
    completed: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20",
    pending:   "bg-amber-500/15 text-amber-400 border border-amber-500/20",
    cancelled: "bg-red-500/15 text-red-400 border border-red-500/20",
    shipped:   "bg-blue-500/15 text-blue-400 border border-blue-500/20",
  };

  const cardStyle = {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    backdropFilter: "blur(20px)",
    boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
  };

  return (
    <div className="min-h-screen p-6 space-y-6 relative"
      style={{ background: "linear-gradient(135deg, #040d36 0%, #141824 50%, #0f1117 100%)" }} >

      {/* Background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #6366f1, transparent 70%)" }} />
        <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #10b981, transparent 70%)" }} />
        <div className="absolute top-[40%] right-[20%] w-[300px] h-[300px] rounded-full opacity-5"
          style={{ background: "radial-gradient(circle, #f59e0b, transparent 70%)" }} />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between relative z-10" style={{ animation: "fadeUp 0.5s ease forwards" }}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-emerald-400 font-medium tracking-widest uppercase">Live</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Executive Overview</h1>
          <p className="text-sm text-slate-400 mt-0.5">RaidKhalid & Co. · Admin Panel</p>
        </div>
        <button onClick={fetchDashboardData} disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-slate-300 hover:text-white transition-all duration-200"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(10px)" }}>
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
        {statCards.map((s, i) => (
          <div key={s.title} className="group rounded-2xl p-5 cursor-default transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl opacity-0"
            style={{ ...cardStyle, animation: `fadeUp 0.5s ease ${i * 0.08}s forwards` }}>
            <div className="flex items-start justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.iconBg}`}>
                <s.icon size={18} className={s.iconColor} />
              </div>
              <div className="flex items-center gap-1 text-xs text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <TrendingUp size={12} /><span>Live</span>
              </div>
            </div>
            <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">{s.title}</p>
            <p className="text-2xl font-bold text-white">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Middle Row */}
      <div className="grid lg:grid-cols-2 gap-6 relative z-10">
        {/* Orders by Status — Pie */}
        <div className="rounded-2xl p-6 opacity-0" style={{ ...cardStyle, animation: "fadeUp 0.5s ease 0.35s forwards" }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-sm font-semibold text-white tracking-wide">Orders by Status</h2>
              <p className="text-xs text-slate-500 mt-0.5">Distribution overview</p>
            </div>
            <Activity size={16} className="text-slate-500" />
          </div>
          {ordersByStatus.length > 0 ? (
            <div className="flex items-center gap-4">
              <div className="h-52 flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={ordersByStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
                      {ordersByStatus.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="transparent" />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "rgba(15,17,23,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: "#fff", fontSize: "12px" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 min-w-[100px]">
                {ordersByStatus.map((s, i) => (
                  <div key={s.name} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <div>
                      <p className="text-xs text-slate-300 capitalize">{s.name}</p>
                      <p className="text-xs text-slate-500">{s.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-52 flex items-center justify-center text-slate-500 text-sm">No orders yet</div>
          )}
        </div>

        {/* Recent Orders */}
        <div className="rounded-2xl p-6 opacity-0" style={{ ...cardStyle, animation: "fadeUp 0.5s ease 0.4s forwards" }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-sm font-semibold text-white tracking-wide">Recent Activity</h2>
              <p className="text-xs text-slate-500 mt-0.5">Latest orders</p>
            </div>
            <button className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1">
              View All <ArrowUpRight size={12} />
            </button>
          </div>
          {recentOrders.length > 0 ? (
            <div className="space-y-2">
              {recentOrders.map((order, i) => (
                <div key={order.id} className="flex items-center justify-between p-3 rounded-xl transition-all duration-200 hover:scale-[1.01] cursor-default"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style={{ background: `linear-gradient(135deg, ${PIE_COLORS[i % PIE_COLORS.length]}40, ${PIE_COLORS[(i+1) % PIE_COLORS.length]}20)` }}>
                      {order.customer_name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{order.customer_name}</p>
                      <p className="text-xs text-slate-500">{new Date(order.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    <p className="text-sm font-bold text-white">₱{Number(order.total).toLocaleString()}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium capitalize ${statusStyles[order.status] || "bg-slate-500/15 text-slate-400 border border-slate-500/20"}`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center text-slate-500 text-sm">No orders yet</div>
          )}
        </div>
      </div>

      {/* ── Most Purchased Products ── */}
      <div className="rounded-2xl p-6 opacity-0 relative z-10 overflow-hidden"
        style={{ ...cardStyle, border: "1px solid rgba(99,102,241,0.2)", animation: "fadeUp 0.5s ease 0.45s forwards" }}>
        {/* top accent line */}
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent, rgba(99,102,241,0.6), transparent)" }} />

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
              <Flame size={15} className="text-indigo-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white tracking-wide">Most Purchased Products</h2>
              <p className="text-xs text-slate-500 mt-0.5">Ranked by total units sold</p>
            </div>
          </div>
        </div>

        {topProducts.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-slate-500 text-sm">No sales data yet</div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-6 items-start">
            {/* Bar chart */}
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProducts} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} barSize={20}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 10 }} tickLine={false} axisLine={false}
                    tickFormatter={(v) => v.length > 8 ? v.slice(0, 8) + "…" : v} />
                  <YAxis tick={{ fill: "#64748b", fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ background: "rgba(15,17,23,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: "#fff", fontSize: "12px" }}
                    formatter={(value: any) => [`${value} units`, "Sold"]}
                  />
                  <Bar dataKey="qty" radius={[6, 6, 0, 0]}>
                    {topProducts.map((_, i) => (
                      <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Ranked list */}
            <div className="space-y-2">
              {topProducts.map((p, i) => {
                const maxQty = topProducts[0]?.qty || 1;
                const pct = Math.round((p.qty / maxQty) * 100);
                return (
                  <div key={p.name} className="flex items-center gap-3 p-2.5 rounded-xl transition-all hover:scale-[1.01]"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                    {/* Rank badge */}
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      i === 0 ? "bg-yellow-500/20 text-yellow-400" :
                      i === 1 ? "bg-slate-400/20 text-slate-300" :
                      i === 2 ? "bg-orange-600/20 text-orange-400" :
                      "bg-white/5 text-slate-500"
                    }`}>
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                    </div>

                    {/* Product image or placeholder */}
                    {p.image_url
                      ? <img src={p.image_url} alt={p.name} className="w-8 h-8 rounded-lg object-cover shrink-0" />
                      : <div className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center"
                          style={{ background: `${BAR_COLORS[i % BAR_COLORS.length]}20` }}>
                          <Package size={14} style={{ color: BAR_COLORS[i % BAR_COLORS.length] }} />
                        </div>
                    }

                    {/* Name + bar */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-200 truncate mb-1">{p.name}</p>
                      <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${pct}%`, background: BAR_COLORS[i % BAR_COLORS.length] }} />
                      </div>
                    </div>

                    {/* Units */}
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-white">{p.qty}</p>
                      <p className="text-[10px] text-slate-500">units</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Low Stock Alerts */}
      {lowStockProducts.length > 0 && (
        <div className="rounded-2xl p-6 opacity-0 relative z-10 overflow-hidden"
          style={{ background: "rgba(251,146,60,0.05)", border: "1px solid rgba(251,146,60,0.2)", backdropFilter: "blur(20px)", boxShadow: "0 8px 32px rgba(0,0,0,0.3)", animation: "fadeUp 0.5s ease 0.55s forwards" }}>
          <div className="absolute top-0 left-0 right-0 h-px"
            style={{ background: "linear-gradient(90deg, transparent, rgba(251,146,60,0.5), transparent)" }} />
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <AlertTriangle size={15} className="text-amber-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Stock Alerts</h2>
              <p className="text-xs text-slate-500">{lowStockProducts.length} item(s) need attention</p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {lowStockProducts.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-3 rounded-xl transition-all duration-200 hover:scale-[1.02]"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: p.stock_quantity === 0 ? "#f87171" : "#fb923c" }} />
                  <span className="text-sm text-slate-200 truncate">{p.name}</span>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ml-2 ${
                  p.stock_quantity === 0 ? "bg-red-500/15 text-red-400 border border-red-500/20" : "bg-amber-500/15 text-amber-400 border border-amber-500/20"
                }`}>
                  {p.stock_quantity === 0 ? "Out" : `${p.stock_quantity} left`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default DashboardPage;
