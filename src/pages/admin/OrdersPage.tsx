import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Card, CardContent
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

import {
  Search, Filter, Eye, Trash2,
  ShoppingCart, TrendingUp,
  CheckCircle, Clock
} from "lucide-react";

import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip
} from "recharts";

const statusFlow = ["pending", "confirmed", "packed", "shipped", "delivered", "completed", "cancelled"];

const COLORS = ["#34d399", "#60a5fa", "#a78bfa", "#fb923c", "#f472b6", "#f87171"];

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewOrder, setViewOrder] = useState<any>(null);

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
    setOrders(data || []);
  };

  const deleteOrder = async (id: string) => {
    if (!confirm("Are you sure you want to delete this order?")) return;
    const { error } = await supabase.from("orders").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete order");
    } else {
      toast.success("Order deleted");
      setOrders((prev) => prev.filter((o) => o.id !== id));
    }
  };

  const filtered = orders.filter(o => {
    return (
      (o.customer_name || "").toLowerCase().includes(search.toLowerCase()) &&
      (statusFilter === "all" || o.status === statusFilter)
    );
  });

  const totalRevenue = orders.reduce((s, o) => s + Number(o.total || 0), 0);
  const completed = orders.filter(o => o.status === "completed").length;
  const pending = orders.filter(o => o.status === "pending").length;

  const statusData = [
    { name: "Completed", value: completed },
    { name: "Pending", value: pending },
    { name: "Others", value: orders.length - completed - pending }
  ];

  const card =
    "bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl";

  return (
    <div className="min-h-screen p-6 space-y-6 text-white
      animate-[fadeIn_0.6s_ease-out]"
      style={{
        background: "linear-gradient(135deg,#0f1117,#141824,#0f1117)"
      }}>

      {/* HEADER */}
      <div className="flex justify-between items-center animate-[slideDown_0.6s_ease-out]">
        <div>
          <h1 className="text-2xl font-bold tracking-wide">Orders Analytics</h1>
          <p className="text-xs text-slate-400">Power BI Executive Dashboard</p>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Orders", value: orders.length, icon: ShoppingCart, color: "text-blue-400" },
          { label: "Revenue", value: `₱${totalRevenue.toLocaleString()}`, icon: TrendingUp, color: "text-emerald-400" },
          { label: "Completed", value: completed, icon: CheckCircle, color: "text-green-400" },
        ].map((kpi, i) => (
          <div
            key={kpi.label}
            className={`${card} p-5 transition-all duration-300
              hover:scale-[1.03] hover:shadow-[0_0_25px_rgba(99,102,241,0.25)]
              animate-[fadeUp_0.5s_ease-out]`}
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            <div className="flex justify-between items-center">
              <kpi.icon className={`${kpi.color} transition-transform duration-300 group-hover:scale-110`} />
              <span className="text-xs text-slate-400">{kpi.label}</span>
            </div>
            <h2 className="text-2xl font-bold mt-2">{kpi.value}</h2>
          </div>
        ))}
      </div>

      {/* CHART + FILTER */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* FILTER + TABLE */}
        <div className={`${card} p-5 lg:col-span-3 animate-[fadeUp_0.8s_ease-out]`}>

          {/* FILTERS */}
          <div className="flex gap-3 mb-4">
            <Input
              placeholder="Search orders..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-white/5 border-white/10 transition-all focus:scale-[1.02]"
            />

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] bg-white/5 border-white/10">
                <Filter size={14} />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {statusFlow.map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* TABLE */}
          <div className="rounded-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10">
                  <TableHead>ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>

              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                      No orders found
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((o, i) => (
                    <TableRow
                      key={o.id}
                      className="border-white/5 transition-all duration-300
                      hover:bg-white/5 hover:scale-[1.01]
                      animate-[fadeUp_0.4s_ease-out]"
                      style={{ animationDelay: `${i * 0.03}s` }}
                    >
                      <TableCell className="font-mono text-xs">
                        {o.id.slice(0, 8)}
                      </TableCell>

                      <TableCell>{o.customer_name}</TableCell>

                      <TableCell className="font-bold">
                        ₱{Number(o.total).toLocaleString()}
                      </TableCell>

                      <TableCell>
                        <span className="px-2 py-1 rounded-full text-xs bg-white/10">
                          {o.status}
                        </span>
                      </TableCell>

                      <TableCell className="text-slate-400 text-sm">
                        {new Date(o.created_at).toLocaleDateString()}
                      </TableCell>

                      <TableCell className="flex gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="hover:scale-110 transition"
                          onClick={() => setViewOrder(o)}
                        >
                          <Eye size={14} />
                        </Button>

                        <Button
                          size="icon"
                          variant="ghost"
                          className="hover:scale-110 hover:text-red-400 transition"
                          onClick={() => deleteOrder(o.id)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* MODAL */}
      <Dialog open={!!viewOrder} onOpenChange={() => setViewOrder(null)}>
        <DialogContent className="bg-[#111827] text-white border-white/10 max-w-lg">
          <DialogTitle>Order Details</DialogTitle>
          {viewOrder && (
            <div className="text-sm space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs text-slate-400">Order ID</p>
                  <p className="font-mono text-indigo-400">#{viewOrder.id?.slice(0, 8).toUpperCase()}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Date</p>
                  <p>{new Date(viewOrder.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Customer</p>
                  <p>{viewOrder.customer_name}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Email</p>
                  <p>{viewOrder.customer_email}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Total</p>
                  <p className="font-bold text-emerald-400">₱{Number(viewOrder.total).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Status</p>
                  <span className="px-2 py-0.5 rounded-full text-xs bg-white/10">{viewOrder.status}</span>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Payment Method</p>
                  <p className="capitalize">{viewOrder.payment_method || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Payment Status</p>
                  <p className="capitalize">{viewOrder.payment_status || "—"}</p>
                </div>
              </div>

              {viewOrder.shipping_address && (
                <div>
                  <p className="text-xs text-slate-400 mb-1">Shipping Address</p>
                  <p className="text-slate-300">{viewOrder.shipping_address}</p>
                </div>
              )}

              {Array.isArray(viewOrder.items) && viewOrder.items.length > 0 && (
                <div>
                  <p className="text-xs text-slate-400 mb-2">Items</p>
                  <div className="space-y-1.5">
                    {viewOrder.items.map((item: any, i: number) => (
                      <div key={i} className="flex justify-between text-xs p-2 rounded-lg bg-white/5">
                        <span className="text-slate-300">{item.name}</span>
                        <span className="text-slate-400">x{item.quantity} · ₱{Number(item.price).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ANIMATIONS */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0 }
          to { opacity: 1 }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px) }
          to { opacity: 1; transform: translateY(0) }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-20px) }
          to { opacity: 1; transform: translateY(0) }
        }
      `}</style>
    </div>
  );
}
