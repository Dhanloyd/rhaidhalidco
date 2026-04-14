import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search, Ticket } from "lucide-react";

const emptyForm = { code: "", discount_type: "percentage", discount_value: 0, min_spend: 0, max_uses: null as number | null, expiry_date: "", active: true };

const VouchersPage = () => {
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchVouchers(); }, []);

  const fetchVouchers = async () => {
    const { data } = await supabase.from("vouchers").select("*").order("created_at", { ascending: false });
    setVouchers(data || []);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!form.code || form.discount_value <= 0) { toast.error("Code and discount value required"); return; }
    const payload = { ...form, code: form.code.toUpperCase(), expiry_date: form.expiry_date || null, max_uses: form.max_uses || null };
    if (editId) {
      const { error } = await supabase.from("vouchers").update(payload).eq("id", editId);
      if (error) { toast.error("Failed to update"); return; }
      toast.success("Voucher updated");
    } else {
      const { error } = await supabase.from("vouchers").insert(payload);
      if (error) { toast.error("Failed to create"); return; }
      toast.success("Voucher created");
    }
    setForm(emptyForm); setEditId(null); setDialogOpen(false); fetchVouchers();
  };

  const handleEdit = (v: any) => {
    setForm({ code: v.code, discount_type: v.discount_type, discount_value: v.discount_value, min_spend: v.min_spend, max_uses: v.max_uses, expiry_date: v.expiry_date?.slice(0, 10) || "", active: v.active });
    setEditId(v.id); setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("vouchers").delete().eq("id", id);
    toast.success("Voucher deleted"); fetchVouchers();
  };

  const filtered = vouchers.filter((v) => v.code.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="font-heading text-2xl uppercase tracking-wider text-foreground flex items-center gap-2 text-white"><Ticket size={24} /> Vouchers</h1>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) { setForm(emptyForm); setEditId(null); } }}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-primary text-primary-foreground font-heading uppercase tracking-wider"><Plus size={16} /> Add Voucher</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-heading uppercase tracking-wider">{editId ? "Edit Voucher" : "New Voucher"}</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <div><label className="text-sm font-medium text-foreground block mb-1">Code *</label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="SAVE20" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1">Type</label>
                  <Select value={form.discount_type} onValueChange={(v) => setForm({ ...form, discount_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="percentage">Percentage (%)</SelectItem><SelectItem value="fixed">Fixed (₱)</SelectItem></SelectContent>
                  </Select>
                </div>
                <div><label className="text-sm font-medium text-foreground block mb-1">Value *</label><Input type="number" value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: parseFloat(e.target.value) || 0 })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm font-medium text-foreground block mb-1">Min Spend (₱)</label><Input type="number" value={form.min_spend} onChange={(e) => setForm({ ...form, min_spend: parseFloat(e.target.value) || 0 })} /></div>
                <div><label className="text-sm font-medium text-foreground block mb-1">Max Uses</label><Input type="number" value={form.max_uses || ""} onChange={(e) => setForm({ ...form, max_uses: parseInt(e.target.value) || null })} placeholder="Unlimited" /></div>
              </div>
              <div><label className="text-sm font-medium text-foreground block mb-1">Expiry Date</label><Input type="date" value={form.expiry_date} onChange={(e) => setForm({ ...form, expiry_date: e.target.value })} /></div>
              <label className="flex items-center gap-2 text-sm font-medium text-foreground"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="rounded" /> Active</label>
              <Button onClick={handleSave} className="w-full bg-primary text-primary-foreground font-heading uppercase tracking-wider">{editId ? "Update" : "Create"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search vouchers..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No vouchers found</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow><TableHead>Code</TableHead><TableHead>Type</TableHead><TableHead>Value</TableHead><TableHead>Min Spend</TableHead><TableHead>Usage</TableHead><TableHead>Expiry</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {filtered.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell className="font-mono font-medium text-foreground">{v.code}</TableCell>
                      <TableCell className="text-sm capitalize text-muted-foreground">{v.discount_type}</TableCell>
                      <TableCell className="font-heading">{v.discount_type === "percentage" ? `${v.discount_value}%` : `₱${v.discount_value}`}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">₱{v.min_spend}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{v.used_count}{v.max_uses ? ` / ${v.max_uses}` : ""}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{v.expiry_date ? new Date(v.expiry_date).toLocaleDateString() : "—"}</TableCell>
                      <TableCell><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${v.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{v.active ? "Active" : "Inactive"}</span></TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(v)}><Pencil size={14} /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(v.id)}><Trash2 size={14} /></Button>
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

export default VouchersPage;
