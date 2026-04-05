import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { categoryLabels } from "@/data/products";

const categories = Object.entries(categoryLabels);
const emptyForm = { name: "", description: "", price: 0, cost_price: 0, discount_price: null as number | null, sku: "", barcode: "", brand: "", category: "fashion-apparel", image_url: "", badge: "", in_stock: true, stock_quantity: 0, low_stock_threshold: 10, status: "active" };

const ProductsPage = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    setProducts(data || []); setLoading(false);
  };

  const handleSave = async () => {
    if (!form.name || form.price <= 0) { toast.error("Name and price required"); return; }
    const payload = {
      name: form.name, description: form.description || null, price: form.price, cost_price: form.cost_price,
      discount_price: form.discount_price || null, sku: form.sku || null, barcode: form.barcode || null,
      brand: form.brand || null, category: form.category, image_url: form.image_url || null,
      badge: form.badge || null, in_stock: form.in_stock, stock_quantity: form.stock_quantity,
      low_stock_threshold: form.low_stock_threshold, status: form.status,
    };
    if (editId) {
      const { error } = await supabase.from("products").update(payload).eq("id", editId);
      if (error) { toast.error("Failed to update"); return; }
      toast.success("Product updated");
    } else {
      const { error } = await supabase.from("products").insert(payload);
      if (error) { toast.error("Failed to create"); return; }
      toast.success("Product created");
    }
    setForm(emptyForm); setEditId(null); setDialogOpen(false); fetchProducts();
  };

  const handleEdit = (p: any) => {
    setForm({
      name: p.name, description: p.description || "", price: p.price, cost_price: p.cost_price || 0,
      discount_price: p.discount_price, sku: p.sku || "", barcode: p.barcode || "", brand: p.brand || "",
      category: p.category, image_url: p.image_url || "", badge: p.badge || "", in_stock: p.in_stock,
      stock_quantity: p.stock_quantity || 0, low_stock_threshold: p.low_stock_threshold || 10, status: p.status || "active",
    });
    setEditId(p.id); setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("products").delete().eq("id", id);
    toast.success("Product deleted"); fetchProducts();
  };

  const filtered = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.sku?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="font-heading text-2xl uppercase tracking-wider text-foreground">Products</h1>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) { setForm(emptyForm); setEditId(null); } }}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-primary text-primary-foreground font-heading uppercase tracking-wider"><Plus size={16} /> Add Product</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle className="font-heading uppercase tracking-wider">{editId ? "Edit Product" : "New Product"}</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div><label className="text-sm font-medium text-foreground block mb-1">Name *</label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div><label className="text-sm font-medium text-foreground block mb-1">Brand</label><Input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} /></div>
              </div>
              <div><label className="text-sm font-medium text-foreground block mb-1">Description</label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div className="grid sm:grid-cols-3 gap-4">
                <div><label className="text-sm font-medium text-foreground block mb-1">Price (₱) *</label><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} /></div>
                <div><label className="text-sm font-medium text-foreground block mb-1">Cost Price (₱)</label><Input type="number" value={form.cost_price} onChange={(e) => setForm({ ...form, cost_price: parseFloat(e.target.value) || 0 })} /></div>
                <div><label className="text-sm font-medium text-foreground block mb-1">Discount Price</label><Input type="number" value={form.discount_price || ""} onChange={(e) => setForm({ ...form, discount_price: parseFloat(e.target.value) || null })} placeholder="Optional" /></div>
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <div><label className="text-sm font-medium text-foreground block mb-1">SKU</label><Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} /></div>
                <div><label className="text-sm font-medium text-foreground block mb-1">Barcode</label><Input value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} /></div>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1">Category</label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{categories.map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div><label className="text-sm font-medium text-foreground block mb-1">Image URL</label><Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." /></div>
              <div className="grid sm:grid-cols-3 gap-4">
                <div><label className="text-sm font-medium text-foreground block mb-1">Stock Qty</label><Input type="number" value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: parseInt(e.target.value) || 0 })} /></div>
                <div><label className="text-sm font-medium text-foreground block mb-1">Low Threshold</label><Input type="number" value={form.low_stock_threshold} onChange={(e) => setForm({ ...form, low_stock_threshold: parseInt(e.target.value) || 10 })} /></div>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1">Badge</label>
                  <Select value={form.badge || "none"} onValueChange={(v) => setForm({ ...form, badge: v === "none" ? "" : v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="none">None</SelectItem><SelectItem value="hot">Hot</SelectItem><SelectItem value="featured">Featured</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1">Status</label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="draft">Draft</SelectItem><SelectItem value="archived">Archived</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <input type="checkbox" checked={form.in_stock} onChange={(e) => setForm({ ...form, in_stock: e.target.checked })} className="rounded" /> In Stock
                  </label>
                </div>
              </div>
              <Button onClick={handleSave} className="w-full bg-primary text-primary-foreground font-heading uppercase tracking-wider">{editId ? "Update" : "Create"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search products or SKU..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No products found</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {p.image_url && <img src={p.image_url} alt={p.name} className="w-10 h-10 rounded-lg object-cover" />}
                          <div>
                            <span className="font-medium text-foreground">{p.name}</span>
                            {p.brand && <p className="text-xs text-muted-foreground">{p.brand}</p>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{p.sku || "—"}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{categoryLabels[p.category as keyof typeof categoryLabels] || p.category}</TableCell>
                      <TableCell>
                        <span className="font-heading">₱{Number(p.price).toLocaleString()}</span>
                        {p.discount_price && <span className="text-xs text-destructive ml-1">₱{p.discount_price}</span>}
                      </TableCell>
                      <TableCell className="text-sm">₱{Number(p.cost_price || 0).toLocaleString()}</TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          p.stock_quantity === 0 ? "bg-red-100 text-red-700" :
                          p.stock_quantity <= p.low_stock_threshold ? "bg-yellow-100 text-yellow-700" :
                          "bg-green-100 text-green-700"
                        }`}>{p.stock_quantity}</span>
                      </TableCell>
                      <TableCell><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.status === "active" ? "bg-green-100 text-green-700" : p.status === "draft" ? "bg-yellow-100 text-yellow-700" : "bg-muted text-muted-foreground"}`}>{p.status}</span></TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(p)}><Pencil size={14} /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(p.id)}><Trash2 size={14} /></Button>
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
    </div>
  );
};

export default ProductsPage;
