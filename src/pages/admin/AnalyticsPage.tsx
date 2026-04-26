import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DollarSign, ShoppingCart, TrendingUp, BarChart3, Package, Activity } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from "recharts";

const AnalyticsPage = () => {
  const [orders, setOrders]     = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from("orders").select("*").order("created_at", { ascending: false }),
      supabase.from("products").select("*"),
    ]).then(([ordersRes, productsRes]) => {
      setOrders(ordersRes.data || []);
      setProducts(productsRes.data || []);
      setLoading(false);
    });
  }, []);

  const completedOrders  = orders.filter(o => o.status === "completed");
  const totalRevenue     = completedOrders.reduce((s, o) => s + Number(o.total), 0);
  const totalCost        = completedOrders.reduce((s, o) => {
    const items = Array.isArray(o.items) ? o.items : [];
    return s + items.reduce((is: number, i: any) => {
      const prod = products.find(p => p.id === i.id);
      return is + (prod ? Number(prod.cost_price) * (i.quantity || 1) : 0);
    }, 0);
  }, 0);
  const totalProfit    = totalRevenue - totalCost;
  const avgOrderValue  = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;

  // Daily sales (last 14 days)
  const dailySales: Record<string, number> = {};
  const now = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now); d.setDate(d.getDate() - i);
    dailySales[d.toISOString().slice(0, 10)] = 0;
  }
  completedOrders.forEach(o => {
    const day = o.created_at.slice(0, 10);
    if (dailySales[day] !== undefined) dailySales[day] += Number(o.total);
  });
  const dailyData = Object.entries(dailySales).map(([date, revenue]) => ({ date: date.slice(5), revenue }));

  // Category performance
  const catPerf: Record<string, number> = {};
  completedOrders.forEach(o => {
    (Array.isArray(o.items) ? o.items : []).forEach((i: any) => {
      const prod = products.find(p => p.id === i.id);
      if (prod) catPerf[prod.category] = (catPerf[prod.category] || 0) + Number(i.price || 0) * (i.quantity || 1);
    });
  });
  const catData = Object.entries(catPerf).map(([name, value]) => ({ name: name.replace(/-/g, " "), value: Math.round(value) }));

  // Top selling products
  const prodSales: Record<string, { name: string; qty: number; revenue: number }> = {};
  completedOrders.forEach(o => {
    (Array.isArray(o.items) ? o.items : []).forEach((i: any) => {
      if (!prodSales[i.id]) prodSales[i.id] = { name: i.name, qty: 0, revenue: 0 };
      prodSales[i.id].qty     += i.quantity || 1;
      prodSales[i.id].revenue += (i.price || 0) * (i.quantity || 1);
    });
  });
  const topProducts = Object.values(prodSales).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  const PIE_COLORS  = ["#34d399", "#60a5fa", "#a78bfa", "#fb923c", "#f472b6", "#f87171"];
  const BAR_COLORS  = ["#6366f1", "#8b5cf6", "#a78bfa", "#60a5fa", "#34d399", "#fb923c"];

  const glass = {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    backdropFilter: "blur(20px)",
    boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
  };

  const statCards = [
    { title: "Total Revenue",   value: `₱${totalRevenue.toLocaleString()}`,          icon: DollarSign,  iconBg: "rgba(52,211,153,0.2)",   iconColor: "#34d399" },
    { title: "Total Profit",    value: `₱${totalProfit.toLocaleString()}`,            icon: TrendingUp,  iconBg: "rgba(96,165,250,0.2)",   iconColor: "#60a5fa" },
    { title: "Total Orders",    value: orders.length,                                 icon: ShoppingCart,iconBg: "rgba(167,139,250,0.2)",  iconColor: "#a78bfa" },
    { title: "Avg Order Value", value: `₱${Math.round(avgOrderValue).toLocaleString()}`, icon: BarChart3,iconBg: "rgba(251,146,60,0.2)",  iconColor: "#fb923c" },
    { title: "Products",        value: products.length,                               icon: Package,     iconBg: "rgba(244,114,182,0.2)",  iconColor: "#f472b6" },
  ];

  const tooltipStyle = {
    contentStyle: {
      background: "rgba(15,17,23,0.95)",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: "12px", color: "#fff", fontSize: "12px",
    },
  };

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "80px 0", gap: "12px" }}>
      {[0, 0.15, 0.3].map((d, i) => (
        <div key={i} style={{
          width: 8, height: 8, borderRadius: "50%",
          background: i === 0 ? "#34d399" : i === 1 ? "#60a5fa" : "#a78bfa",
          animation: `bounce 0.7s ease ${d}s infinite alternate`,
        }} />
      ))}
      <style>{`@keyframes bounce{from{transform:translateY(0)}to{transform:translateY(-8px)}}`}</style>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", padding: "24px", display: "flex", flexDirection: "column", gap: "24px" }}>

      {/* Header */}
      <div style={{ opacity: 0, animation: "fadeUp 0.5s ease forwards" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#34d399", animation: "pulse 2s infinite" }} />
          <span style={{ fontSize: "11px", color: "#34d399", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase" }}>Live</span>
        </div>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>Analytics</h1>
        <p style={{ fontSize: "12px", color: "rgba(148,163,184,0.7)", marginTop: "2px", fontWeight: 500 }}>
          {completedOrders.length} completed orders · all time
        </p>
      </div>

      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: "14px" }}>
        {statCards.map((s, i) => (
          <div key={s.title} style={{
            ...glass, borderRadius: "16px", padding: "20px",
            cursor: "default", opacity: 0,
            animation: `fadeUp 0.5s ease ${i * 0.08}s forwards`,
            transition: "transform .3s ease, box-shadow .3s ease",
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ""; }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "16px" }}>
              <div style={{ width: 40, height: 40, borderRadius: "12px", background: s.iconBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <s.icon size={18} color={s.iconColor} />
              </div>
            </div>
            <p style={{ fontSize: "10px", color: "rgba(148,163,184,0.7)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "4px", fontWeight: 600 }}>{s.title}</p>
            <p style={{ fontSize: "1.5rem", fontWeight: 800, color: "#fff", lineHeight: 1.1 }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>

        {/* Daily Sales Bar Chart */}
        <div style={{
          ...glass, borderRadius: "20px", padding: "24px",
          opacity: 0, animation: "fadeUp 0.5s ease 0.45s forwards",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
            <div>
              <h2 style={{ fontSize: "13px", fontWeight: 700, color: "#fff", letterSpacing: ".02em" }}>Daily Sales</h2>
              <p style={{ fontSize: "11px", color: "rgba(148,163,184,0.5)", marginTop: "2px" }}>Last 14 days</p>
            </div>
            <Activity size={15} color="rgba(148,163,184,0.4)" />
          </div>
          <div style={{ height: "220px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} barSize={18}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: "#64748b", fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip
                  {...tooltipStyle}
                  formatter={(v: number) => [`₱${v.toLocaleString()}`, "Revenue"]}
                />
                <Bar dataKey="revenue" fill="#6366f1" radius={[6, 6, 0, 0]}>
                  {dailyData.map((_, i) => (
                    <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Pie Chart */}
        <div style={{
          ...glass, borderRadius: "20px", padding: "24px",
          opacity: 0, animation: "fadeUp 0.5s ease 0.5s forwards",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
            <div>
              <h2 style={{ fontSize: "13px", fontWeight: 700, color: "#fff", letterSpacing: ".02em" }}>Category Performance</h2>
              <p style={{ fontSize: "11px", color: "rgba(148,163,184,0.5)", marginTop: "2px" }}>Revenue by category</p>
            </div>
          </div>
          {catData.length > 0 ? (
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ height: "220px", flex: 1 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={catData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
                      {catData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="transparent" />)}
                    </Pie>
                    <Tooltip {...tooltipStyle} formatter={(v: number) => `₱${v.toLocaleString()}`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", minWidth: "110px" }}>
                {catData.map((c, i) => (
                  <div key={c.name} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: PIE_COLORS[i % PIE_COLORS.length], flexShrink: 0 }} />
                    <div>
                      <p style={{ fontSize: "11px", color: "rgba(203,213,225,0.9)", textTransform: "capitalize" }}>{c.name}</p>
                      <p style={{ fontSize: "10px", color: "rgba(148,163,184,0.5)" }}>₱{c.value.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ height: "220px", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(148,163,184,0.4)", fontSize: "13px" }}>
              No data yet
            </div>
          )}
        </div>
      </div>

      {/* Top Selling Products */}
      <div style={{
        ...glass, borderRadius: "20px", padding: "24px",
        opacity: 0, animation: "fadeUp 0.5s ease 0.55s forwards",
        position: "relative", overflow: "hidden",
        border: "1px solid rgba(99,102,241,0.2)",
      }}>
        {/* top accent */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1px", background: "linear-gradient(90deg, transparent, rgba(99,102,241,0.6), transparent)" }} />

        <div style={{ marginBottom: "20px" }}>
          <h2 style={{ fontSize: "13px", fontWeight: 700, color: "#fff" }}>Top Selling Products</h2>
          <p style={{ fontSize: "11px", color: "rgba(148,163,184,0.5)", marginTop: "2px" }}>Ranked by total revenue</p>
        </div>

        {topProducts.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {topProducts.map((p, i) => {
              const maxRev = topProducts[0]?.revenue || 1;
              const pct    = Math.round((p.revenue / maxRev) * 100);
              return (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: "12px",
                  padding: "12px 14px", borderRadius: "14px",
                  background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)",
                  transition: "background .18s ease",
                }}
                  onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.06)"}
                  onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.03)"}
                >
                  {/* Rank */}
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px",
                    background: i === 0 ? "rgba(251,191,36,0.15)" : i === 1 ? "rgba(148,163,184,0.1)" : i === 2 ? "rgba(234,88,12,0.15)" : "rgba(255,255,255,0.05)",
                    color: i === 0 ? "#fbbf24" : i === 1 ? "#94a3b8" : i === 2 ? "#fb923c" : "rgba(148,163,184,0.5)",
                  }}>
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                  </div>

                  {/* Name + bar */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "13px", fontWeight: 600, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: "6px" }}>{p.name}</p>
                    <div style={{ height: "4px", borderRadius: "999px", background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                      <div style={{ height: "100%", borderRadius: "999px", width: `${pct}%`, background: PIE_COLORS[i % PIE_COLORS.length], transition: "width .8s cubic-bezier(.22,1,.36,1)" }} />
                    </div>
                  </div>

                  {/* Stats */}
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <p style={{ fontSize: "14px", fontWeight: 800, color: "#fff" }}>₱{p.revenue.toLocaleString()}</p>
                    <p style={{ fontSize: "10px", color: "rgba(148,163,184,0.5)", marginTop: "2px" }}>{p.qty} sold</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "40px 0", color: "rgba(148,163,184,0.4)", fontSize: "13px" }}>No sales data yet</div>
        )}
      </div>

      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes bounce { from { transform: translateY(0); } to { transform: translateY(-8px); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </div>
  );
};

export default AnalyticsPage;
