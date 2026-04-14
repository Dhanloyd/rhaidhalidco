import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Package, AlertTriangle, TrendingDown, DollarSign, Search, Plus, Minus, History, PhilippinePesoIcon } from "lucide-react";

const InventoryPage = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [adjustDialog, setAdjustDialog] = useState(false);
  const [logsDialog, setLogsDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [adjustQty, setAdjustQty] = useState(0);
  const [adjustType, setAdjustType] = useState("added");
  const [adjustNotes, setAdjustNotes] = useState("");

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    const { data } = await supabase.from("products").select("*").order("name");
    setProducts(data || []);
    setLoading(false);
  };

  const totalProducts = products.length;
  const lowStock = products.filter((p) => p.stock_quantity <= p.low_stock_threshold && p.stock_quantity > 0).length;
  const outOfStock = products.filter((p) => p.stock_quantity === 0).length;
  const inventoryValue = products.reduce((s, p) => s + p.price * p.stock_quantity, 0);
  const totalCost = products.reduce((s, p) => s + p.cost_price * p.stock_quantity, 0);
  const potentialProfit = inventoryValue - totalCost;

  const openAdjust = (product: any) => {
    setSelectedProduct(product);
    setAdjustQty(0);
    setAdjustType("added");
    setAdjustNotes("");
    setAdjustDialog(true);
  };

  const handleAdjust = async () => {
    if (!selectedProduct || adjustQty === 0) return;
    const change = adjustType === "added" || adjustType === "returned" ? adjustQty : -adjustQty;
    const newQty = Math.max(0, selectedProduct.stock_quantity + change);

    const { error: logError } = await supabase.from("inventory_logs").insert({
      product_id: selectedProduct.id,
      change_type: adjustType,
      quantity_change: change,
      quantity_before: selectedProduct.stock_quantity,
      quantity_after: newQty,
      notes: adjustNotes || null,
    });
    if (logError) { toast.error("Failed to log adjustment"); return; }

    const { error } = await supabase.from("products").update({ stock_quantity: newQty, in_stock: newQty > 0 }).eq("id", selectedProduct.id);
    if (error) { toast.error("Failed to update stock"); return; }
    toast.success(`Stock updated: ${selectedProduct.name} → ${newQty}`);
    setAdjustDialog(false);
    fetchProducts();
  };

  const viewLogs = async (product: any) => {
    setSelectedProduct(product);
    const { data } = await supabase.from("inventory_logs").select("*").eq("product_id", product.id).order("created_at", { ascending: false }).limit(20);
    setLogs(data || []);
    setLogsDialog(true);
  };

  const filtered = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.sku?.toLowerCase().includes(search.toLowerCase()));

  const stats = [
    { label: "Total Products", value: totalProducts, icon: Package, color: "text-primary" },
    { label: "Low Stock", value: lowStock, icon: AlertTriangle, color: "text-yellow-500" },
    { label: "Out of Stock", value: outOfStock, icon: TrendingDown, color: "text-destructive" },
    { label: "Inventory Value", value: `₱${inventoryValue.toLocaleString()}`, icon: PhilippinePesoIcon, color: "text-green-600" },
    { label: "Total Cost", value: `₱${totalCost.toLocaleString()}`, icon: PhilippinePesoIcon, color: "text-orange-500" },
    { label: "Potential Profit", value: `₱${potentialProfit.toLocaleString()}`, icon: PhilippinePesoIcon, color: "text-primary" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl uppercase tracking-wider text-foreground text-white">Inventory Management</h1>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 mb-1">
                <s.icon size={16} className={s.color} />
                <span className="text-xs text-muted-foreground">{s.label}</span>
              </div>
              <p className="text-xl font-heading text-foreground">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search by name or SKU..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Threshold</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Sold</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((p) => {
                    const isLow = p.stock_quantity > 0 && p.stock_quantity <= p.low_stock_threshold;
                    const isOut = p.stock_quantity === 0;
                    return (
                      <TableRow key={p.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {p.image_url && <img src={p.image_url} alt={p.name} className="w-10 h-10 rounded-lg object-cover" />}
                            <span className="font-medium text-foreground">{p.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{p.sku || "—"}</TableCell>
                        <TableCell>
                          <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${isOut ? "bg-red-100 text-red-700" : isLow ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}`}>
                            {p.stock_quantity}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{p.low_stock_threshold}</TableCell>
                        <TableCell className="text-sm">₱{Number(p.cost_price).toLocaleString()}</TableCell>
                        <TableCell className="font-heading text-sm">₱{Number(p.price).toLocaleString()}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{p.sold_count}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="outline" size="sm" className="h-8 gap-1 text-xs" onClick={() => openAdjust(p)}>
                              <Plus size={12} /> Adjust
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs" onClick={() => viewLogs(p)}>
                              <History size={12} /> Log
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Adjust Stock Dialog */}
      <Dialog open={adjustDialog} onOpenChange={setAdjustDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-heading uppercase tracking-wider">Adjust Stock — {selectedProduct?.name}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">Current stock: <strong>{selectedProduct?.stock_quantity}</strong></p>
            <Select value={adjustType} onValueChange={setAdjustType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="added">Add Stock</SelectItem>
                <SelectItem value="sold">Mark as Sold</SelectItem>
                <SelectItem value="returned">Returned</SelectItem>
                <SelectItem value="adjusted">Manual Adjustment</SelectItem>
              </SelectContent>
            </Select>
            <Input type="number" min={1} placeholder="Quantity" value={adjustQty || ""} onChange={(e) => setAdjustQty(parseInt(e.target.value) || 0)} />
            <Input placeholder="Notes (optional)" value={adjustNotes} onChange={(e) => setAdjustNotes(e.target.value)} />
            <Button onClick={handleAdjust} className="w-full bg-primary text-primary-foreground font-heading uppercase tracking-wider">Apply Adjustment</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Stock Movement Logs */}
      <Dialog open={logsDialog} onOpenChange={setLogsDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="font-heading uppercase tracking-wider">Stock History — {selectedProduct?.name}</DialogTitle></DialogHeader>
          <div className="mt-4 max-h-[400px] overflow-y-auto space-y-2">
            {logs.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No stock movement history</p>
            ) : logs.map((log) => (
              <div key={log.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    log.change_type === "added" ? "bg-green-100 text-green-700" :
                    log.change_type === "sold" ? "bg-blue-100 text-blue-700" :
                    log.change_type === "returned" ? "bg-yellow-100 text-yellow-700" :
                    "bg-muted text-muted-foreground"
                  }`}>{log.change_type}</span>
                  <span className="text-sm ml-2 text-foreground">{log.quantity_change > 0 ? "+" : ""}{log.quantity_change}</span>
                  {log.notes && <p className="text-xs text-muted-foreground mt-1">{log.notes}</p>}
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <p>{log.quantity_before} → {log.quantity_after}</p>
                  <p>{new Date(log.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InventoryPage;
