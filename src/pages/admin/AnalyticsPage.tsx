import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, ShoppingCart, TrendingUp, BarChart3, Package } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";

const AnalyticsPage = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  const completedOrders = orders.filter((o) => o.status === "completed");
  const totalRevenue = completedOrders.reduce((s, o) => s + Number(o.total), 0);
  const totalCost = completedOrders.reduce((s, o) => {
    const items = Array.isArray(o.items) ? o.items : [];
    return s + items.reduce((is: number, i: any) => {
      const prod = products.find((p) => p.id === i.id);
      return is + (prod ? Number(prod.cost_price) * (i.quantity || 1) : 0);
    }, 0);
  }, 0);
  const totalProfit = totalRevenue - totalCost;
  const avgOrderValue = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;

  // Daily sales (last 14 days)
  const dailySales: Record<string, number> = {};
  const now = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now); d.setDate(d.getDate() - i);
    dailySales[d.toISOString().slice(0, 10)] = 0;
  }
  completedOrders.forEach((o) => {
    const day = o.created_at.slice(0, 10);
    if (dailySales[day] !== undefined) dailySales[day] += Number(o.total);
  });
  const dailyData = Object.entries(dailySales).map(([date, revenue]) => ({ date: date.slice(5), revenue }));

  // Category performance
  const catPerf: Record<string, number> = {};
  completedOrders.forEach((o) => {
    (Array.isArray(o.items) ? o.items : []).forEach((i: any) => {
      const prod = products.find((p) => p.id === i.id);
      if (prod) catPerf[prod.category] = (catPerf[prod.category] || 0) + Number(i.price || 0) * (i.quantity || 1);
    });
  });
  const catData = Object.entries(catPerf).map(([name, value]) => ({ name: name.replace(/-/g, " "), value: Math.round(value) }));

  // Top selling products
  const prodSales: Record<string, { name: string; qty: number; revenue: number }> = {};
  completedOrders.forEach((o) => {
    (Array.isArray(o.items) ? o.items : []).forEach((i: any) => {
      if (!prodSales[i.id]) prodSales[i.id] = { name: i.name, qty: 0, revenue: 0 };
      prodSales[i.id].qty += i.quantity || 1;
      prodSales[i.id].revenue += (i.price || 0) * (i.quantity || 1);
    });
  });
  const topProducts = Object.values(prodSales).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  const PIE_COLORS = ["hsl(218, 60%, 28%)", "hsl(218, 55%, 45%)", "hsl(15, 90%, 55%)", "hsl(120, 40%, 50%)", "hsl(45, 80%, 50%)", "hsl(280, 50%, 50%)"];

  const stats = [
    { title: "Total Revenue", value: `₱${totalRevenue.toLocaleString()}`, icon: DollarSign, color: "text-green-600" },
    { title: "Total Profit", value: `₱${totalProfit.toLocaleString()}`, icon: TrendingUp, color: "text-primary" },
    { title: "Total Orders", value: orders.length, icon: ShoppingCart, color: "text-blue-500" },
    { title: "Avg Order Value", value: `₱${Math.round(avgOrderValue).toLocaleString()}`, icon: BarChart3, color: "text-orange-500" },
    { title: "Products", value: products.length, icon: Package, color: "text-purple-500" },
  ];

  if (loading) {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl uppercase tracking-wider text-foreground text-white">Analytics</h1>

      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((s) => (
          <Card key={s.title} className="hover-lift">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">{s.title}</span>
                <s.icon size={16} className={s.color} />
              </div>
              <p className="text-2xl font-heading text-foreground">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Daily Sales */}
        <Card>
          <CardHeader><CardTitle className="font-heading text-lg uppercase tracking-wider">Daily Sales (14 Days)</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(218, 20%, 88%)" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => [`₱${v.toLocaleString()}`, "Revenue"]} />
                <Bar dataKey="revenue" fill="hsl(218, 60%, 28%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Performance */}
        <Card>
          <CardHeader><CardTitle className="font-heading text-lg uppercase tracking-wider">Category Performance</CardTitle></CardHeader>
          <CardContent className="h-72">
            {catData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={catData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {catData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => `₱${v.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            ) : <div className="h-full flex items-center justify-center text-muted-foreground">No data yet</div>}
          </CardContent>
        </Card>
      </div>

      {/* Top Selling Products */}
      <Card>
        <CardHeader><CardTitle className="font-heading text-lg uppercase tracking-wider">Top Selling Products</CardTitle></CardHeader>
        <CardContent>
          {topProducts.length > 0 ? (
            <div className="space-y-3">
              {topProducts.map((p, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">{i + 1}</span>
                    <span className="font-medium text-foreground">{p.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-heading text-sm text-foreground">₱{p.revenue.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{p.qty} sold</p>
                  </div>
                </div>
              ))}
            </div>
          ) : <div className="text-center py-8 text-muted-foreground">No sales data yet</div>}
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsPage;
