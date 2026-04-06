import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Search, Filter, Eye, Trash2 } from "lucide-react";

const statusFlow = ["pending", "confirmed", "packed", "shipped", "delivered", "completed", "cancelled"];

const OrdersPage = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [viewOrder, setViewOrder] = useState<any>(null);

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
    setOrders(data || []); setLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) toast.error("Failed to update");
    else { toast.success(`Status → ${status}`); fetchOrders(); }
  };

  const deleteOrder = async (id: string) => {
    // Delete order items first, then order
    await supabase.from("order_items").delete().eq("order_id", id);
    const { error } = await supabase.from("orders").delete().eq("id", id);
    if (error) toast.error("Failed to delete order");
    else { toast.success("Order deleted"); fetchOrders(); }
  };

  const filtered = orders.filter((o) => {
    const matchSearch = o.customer_name.toLowerCase().includes(search.toLowerCase()) || o.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const statusColor = (s: string) => {
    const map: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-700", confirmed: "bg-blue-100 text-blue-700",
      packed: "bg-indigo-100 text-indigo-700", shipped: "bg-purple-100 text-purple-700",
      delivered: "bg-teal-100 text-teal-700", completed: "bg-green-100 text-green-700",
      cancelled: "bg-red-100 text-red-700",
    };
    return map[s] || "bg-muted text-muted-foreground";
  };

  const computeProfit = (order: any) => {
    const items = Array.isArray(order.items) ? order.items : [];
    return items.reduce((s: number, i: any) => s + (i.price || 0) * (i.quantity || 1), 0) * 0.3;
  };

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl uppercase tracking-wider text-foreground">Orders</h1>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search by name or ID..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]"><Filter size={14} className="mr-2" /><SelectValue placeholder="Filter" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {statusFlow.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No orders found</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Profit (est)</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-xs">{order.id.slice(0, 8)}</TableCell>
                      <TableCell>
                        <p className="font-medium text-foreground">{order.customer_name}</p>
                        {order.customer_email && <p className="text-xs text-muted-foreground">{order.customer_email}</p>}
                      </TableCell>
                      <TableCell><span className="text-xs px-2 py-0.5 rounded-full bg-muted font-medium uppercase">{order.order_type}</span></TableCell>
                      <TableCell className="font-heading">₱{Number(order.total).toLocaleString()}</TableCell>
                      <TableCell className="text-sm text-green-600">₱{Math.round(computeProfit(order)).toLocaleString()}</TableCell>
                      <TableCell className="text-xs uppercase text-muted-foreground">{order.payment_method}</TableCell>
                      <TableCell><span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColor(order.status)}`}>{order.status}</span></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewOrder(order)}><Eye size={14} /></Button>
                          <Select value={order.status} onValueChange={(v) => updateStatus(order.id, v)}>
                            <SelectTrigger className="w-[110px] h-7 text-[10px]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {statusFlow.map((s) => <SelectItem key={s} value={s} className="capitalize text-xs">{s}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { if (confirm("Delete this order?")) deleteOrder(order.id); }}><Trash2 size={14} /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Detail Dialog */}
      <Dialog open={!!viewOrder} onOpenChange={() => setViewOrder(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="font-heading uppercase tracking-wider">Order Details</DialogTitle></DialogHeader>
          {viewOrder && (
            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">Order ID:</span><p className="font-mono text-foreground">{viewOrder.id.slice(0, 12)}</p></div>
                <div><span className="text-muted-foreground">Date:</span><p className="text-foreground">{new Date(viewOrder.created_at).toLocaleString()}</p></div>
                <div><span className="text-muted-foreground">Customer:</span><p className="font-medium text-foreground">{viewOrder.customer_name}</p></div>
                <div><span className="text-muted-foreground">Status:</span><p><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(viewOrder.status)}`}>{viewOrder.status}</span></p></div>
                <div><span className="text-muted-foreground">Payment:</span><p className="text-foreground uppercase text-xs">{viewOrder.payment_method}</p></div>
                {viewOrder.shipping_address && <div className="col-span-2"><span className="text-muted-foreground">Ship To:</span><p className="text-foreground">{viewOrder.shipping_name} · {viewOrder.shipping_phone}<br />{viewOrder.shipping_address}</p></div>}
                {viewOrder.tracking_number && <div><span className="text-muted-foreground">Tracking:</span><p className="font-mono text-foreground">{viewOrder.tracking_number}</p></div>}
              </div>
              <div className="border-t border-border pt-3">
                <p className="text-sm font-medium text-foreground mb-2">Items</p>
                {(Array.isArray(viewOrder.items) ? viewOrder.items : []).map((item: any, i: number) => (
                  <div key={i} className="flex justify-between text-sm py-1">
                    <span className="text-foreground">{item.quantity}× {item.name}</span>
                    <span className="text-muted-foreground">₱{((item.price || 0) * (item.quantity || 1)).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-border pt-3 space-y-1 text-sm">
                {viewOrder.subtotal > 0 && <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>₱{Number(viewOrder.subtotal).toLocaleString()}</span></div>}
                {viewOrder.discount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-₱{Number(viewOrder.discount).toLocaleString()}</span></div>}
                {viewOrder.shipping_fee > 0 && <div className="flex justify-between text-muted-foreground"><span>Shipping</span><span>₱{Number(viewOrder.shipping_fee).toLocaleString()}</span></div>}
                <div className="flex justify-between font-heading text-lg"><span className="text-foreground">Total</span><span className="text-primary">₱{Number(viewOrder.total).toLocaleString()}</span></div>
              </div>
              <div className="flex gap-2">
                {viewOrder.status !== "cancelled" && viewOrder.status !== "completed" && (
                  <Button variant="destructive" size="sm" onClick={() => { updateStatus(viewOrder.id, "cancelled"); setViewOrder(null); }}>Cancel Order</Button>
                )}
                <Button variant="destructive" size="sm" onClick={() => { deleteOrder(viewOrder.id); setViewOrder(null); }}>Delete Order</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrdersPage;
