import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Zap } from "lucide-react";

const FlashSalesPage = () => {
  const [sales, setSales] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [form, setForm] = useState({ product_id: "", sale_price: 0, original_price: 0, start_date: "", end_date: "", stock_limit: null as number | null, active: true });
  const [editId, setEditId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from("flash_sales").select("*, products(name, image_url)").order("created_at", { ascending: false }),
      supabase.from("products").select("id, name, price").order("name"),
    ]).then(([salesRes, prodsRes]) => {
      setSales(salesRes.data || []);
      setProducts(prodsRes.data || []);
      setLoading(false);
    });
  }, []);

  const fetchSales = async () => {
    const { data } = await supabase.from("flash_sales").select("*, products(name, image_url)").order("created_at", { ascending: false });
    setSales(data || []);
  };

  const selectProduct = (id: string) => {
    const prod = products.find((p) => p.id === id);
    setForm({ ...form, product_id: id, original_price: prod?.price || 0 });
  };

  const handleSave = async () => {
    if (!form.product_id || form.sale_price <= 0 || !form.start_date || !form.end_date) { toast.error("Fill all required fields"); return; }
    const payload = { ...form, stock_limit: form.stock_limit || null };
    if (editId) {
      await supabase.from("flash_sales").update(payload).eq("id", editId);
      toast.success("Flash sale updated");
    } else {
      await supabase.from("flash_sales").insert(payload);
      toast.success("Flash sale created");
    }
    setForm({ product_id: "", sale_price: 0, original_price: 0, start_date: "", end_date: "", stock_limit: null, active: true });
    setEditId(null); setDialogOpen(false); fetchSales();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("flash_sales").delete().eq("id", id);
    toast.success("Deleted"); fetchSales();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="font-heading text-2xl uppercase tracking-wider text-foreground flex items-center gap-2 text-white"><Zap size={24} /> Flash Sales</h1>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) { setEditId(null); } }}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-primary text-primary-foreground font-heading uppercase tracking-wider"><Plus size={16} /> Add Flash Sale</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-heading uppercase tracking-wider">{editId ? "Edit" : "New"} Flash Sale</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium text-foreground block mb-1">Product *</label>
                <Select value={form.product_id} onValueChange={selectProduct}>
                  <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                  <SelectContent>{products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name} — ₱{p.price}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm font-medium text-foreground block mb-1">Original Price</label><Input type="number" value={form.original_price} readOnly className="bg-muted" /></div>
                <div><label className="text-sm font-medium text-foreground block mb-1">Sale Price *</label><Input type="number" value={form.sale_price} onChange={(e) => setForm({ ...form, sale_price: parseFloat(e.target.value) || 0 })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm font-medium text-foreground block mb-1">Start *</label><Input type="datetime-local" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></div>
                <div><label className="text-sm font-medium text-foreground block mb-1">End *</label><Input type="datetime-local" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></div>
              </div>
              <div><label className="text-sm font-medium text-foreground block mb-1">Stock Limit</label><Input type="number" value={form.stock_limit || ""} onChange={(e) => setForm({ ...form, stock_limit: parseInt(e.target.value) || null })} placeholder="Unlimited" /></div>
              <label className="flex items-center gap-2 text-sm font-medium text-foreground"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="rounded" /> Active</label>
              <Button onClick={handleSave} className="w-full bg-primary text-primary-foreground font-heading uppercase tracking-wider">{editId ? "Update" : "Create"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
          ) : sales.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No flash sales</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow><TableHead>Product</TableHead><TableHead>Original</TableHead><TableHead>Sale Price</TableHead><TableHead>Period</TableHead><TableHead>Sold</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {sales.map((s) => {
                    const now = new Date();
                    const isActive = s.active && new Date(s.start_date) <= now && new Date(s.end_date) >= now;
                    return (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium text-foreground">{(s.products as any)?.name}</TableCell>
                        <TableCell className="text-muted-foreground line-through">₱{s.original_price}</TableCell>
                        <TableCell className="font-heading text-destructive">₱{s.sale_price}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{new Date(s.start_date).toLocaleDateString()} — {new Date(s.end_date).toLocaleDateString()}</TableCell>
                        <TableCell>{s.sold_count}{s.stock_limit ? ` / ${s.stock_limit}` : ""}</TableCell>
                        <TableCell><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isActive ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>{isActive ? "Live" : "Inactive"}</span></TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(s.id)}><Trash2 size={14} /></Button>
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
    </div>
  );
};

export default FlashSalesPage;
