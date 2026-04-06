import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, ShoppingCart, Package, AlertTriangle } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { toast } from "sonner";

const DashboardPage = () => {
  const [stats, setStats] = useState({ completedRevenue: 0, completedOrders: 0, totalProducts: 0, lowStockCount: 0 });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [ordersByStatus, setOrdersByStatus] = useState<any[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);

  const fetchDashboardData = useCallback(async () => {
    const [ordersRes, productsRes] = await Promise.all([
      supabase.from("orders").select("*").order("created_at", { ascending: false }),
      supabase.from("products").select("id, name, stock_quantity, low_stock_threshold"),
    ]);

    const orders = ordersRes.data || [];
    const products = productsRes.data || [];

    // Only completed orders for revenue
    const completedOrders = orders.filter((o) => o.status === "completed");
    const completedRevenue = completedOrders.reduce((sum, o) => sum + Number(o.total), 0);

    // Low stock products
    const lowStock = products.filter((p) => p.stock_quantity <= p.low_stock_threshold && p.stock_quantity > 0);
    const outOfStock = products.filter((p) => p.stock_quantity === 0);

    if (lowStock.length > 0) {
      toast.warning(`${lowStock.length} product(s) running low on stock!`);
    }
    if (outOfStock.length > 0) {
      toast.error(`${outOfStock.length} product(s) are out of stock!`);
    }

    setStats({
      completedRevenue,
      completedOrders: completedOrders.length,
      totalProducts: products.length,
      lowStockCount: lowStock.length + outOfStock.length,
    });

    setRecentOrders(orders.slice(0, 5));
    setLowStockProducts([...outOfStock, ...lowStock].slice(0, 5));

    const statusCounts: Record<string, number> = {};
    orders.forEach((o) => { statusCounts[o.status] = (statusCounts[o.status] || 0) + 1; });
    setOrdersByStatus(Object.entries(statusCounts).map(([name, value]) => ({ name, value })));
  }, []);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // Auto-refresh every 30s
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  const statCards = [
    { title: "Completed Revenue", value: `₱${stats.completedRevenue.toLocaleString()}`, icon: DollarSign, color: "text-green-600" },
    { title: "Completed Orders", value: stats.completedOrders, icon: ShoppingCart, color: "text-primary" },
    { title: "Total Products", value: stats.totalProducts, icon: Package, color: "text-orange-500" },
    { title: "Low Stock Alerts", value: stats.lowStockCount, icon: AlertTriangle, color: "text-yellow-500" },
  ];

  const PIE_COLORS = ["hsl(218, 60%, 28%)", "hsl(218, 55%, 45%)", "hsl(15, 90%, 55%)", "hsl(120, 40%, 50%)", "hsl(45, 90%, 50%)", "hsl(0, 70%, 50%)"];

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl uppercase tracking-wider text-foreground">Dashboard</h1>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <Card key={s.title} className="hover-lift">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.title}</CardTitle>
              <s.icon className={`h-5 w-5 ${s.color}`} />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-heading text-foreground">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-lg uppercase tracking-wider">Orders by Status</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            {ordersByStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={ordersByStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {ordersByStatus.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">No orders yet</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-lg uppercase tracking-wider">Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {recentOrders.length > 0 ? (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-foreground">{order.customer_name}</p>
                      <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-heading text-foreground">₱{Number(order.total).toLocaleString()}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        order.status === "completed" ? "bg-green-100 text-green-700" :
                        order.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                        order.status === "cancelled" ? "bg-red-100 text-red-700" :
                        "bg-blue-100 text-blue-700"
                      }`}>{order.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-40 flex items-center justify-center text-muted-foreground">No orders yet</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alerts */}
      {lowStockProducts.length > 0 && (
        <Card className="border-yellow-500/30">
          <CardHeader>
            <CardTitle className="font-heading text-lg uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" /> Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lowStockProducts.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm font-medium text-foreground">{p.name}</span>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    p.stock_quantity === 0 ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"
                  }`}>
                    {p.stock_quantity === 0 ? "Out of Stock" : `${p.stock_quantity} left`}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DashboardPage;
