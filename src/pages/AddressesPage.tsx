import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { MapPin, Plus, Pencil, Trash2, Star } from "lucide-react";

const emptyForm = { label: "Home", full_name: "", phone: "", address_line: "", city: "", province: "", zip_code: "", is_default: false };

const AddressesPage = () => {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<any[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (user) fetchAddresses(); }, [user]);

  const fetchAddresses = async () => {
    const { data } = await supabase.from("addresses").select("*").eq("user_id", user!.id).order("is_default", { ascending: false });
    setAddresses(data || []); setLoading(false);
  };

  const handleSave = async () => {
    if (!form.full_name || !form.phone || !form.address_line || !form.city) { toast.error("Fill required fields"); return; }
    const payload = { ...form, user_id: user!.id, province: form.province || null, zip_code: form.zip_code || null };

    if (form.is_default) {
      await supabase.from("addresses").update({ is_default: false }).eq("user_id", user!.id);
    }

    if (editId) {
      await supabase.from("addresses").update(payload).eq("id", editId);
      toast.success("Address updated");
    } else {
      await supabase.from("addresses").insert(payload);
      toast.success("Address added");
    }
    setForm(emptyForm); setEditId(null); setDialogOpen(false); fetchAddresses();
  };

  const handleEdit = (a: any) => {
    setForm({ label: a.label, full_name: a.full_name, phone: a.phone, address_line: a.address_line, city: a.city, province: a.province || "", zip_code: a.zip_code || "", is_default: a.is_default });
    setEditId(a.id); setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("addresses").delete().eq("id", id);
    toast.success("Address deleted"); fetchAddresses();
  };

  if (!user) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="text-center">
          <MapPin size={48} className="mx-auto text-muted-foreground mb-4" />
          <h1 className="font-heading text-2xl uppercase text-foreground mb-2">Sign in to manage addresses</h1>
          <Link to="/signin"><Button className="bg-primary text-primary-foreground">Sign In</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-16 px-4">
      <div className="container mx-auto max-w-3xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-heading text-3xl uppercase tracking-wider text-foreground">My Addresses</h1>
          <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) { setForm(emptyForm); setEditId(null); } }}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-primary text-primary-foreground font-heading uppercase tracking-wider"><Plus size={16} /> Add</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle className="font-heading uppercase tracking-wider">{editId ? "Edit Address" : "New Address"}</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-sm font-medium text-foreground block mb-1">Label</label><Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="Home, Office..." /></div>
                  <div><label className="text-sm font-medium text-foreground block mb-1">Full Name *</label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
                </div>
                <div><label className="text-sm font-medium text-foreground block mb-1">Phone *</label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                <div><label className="text-sm font-medium text-foreground block mb-1">Address *</label><Input value={form.address_line} onChange={(e) => setForm({ ...form, address_line: e.target.value })} /></div>
                <div className="grid grid-cols-3 gap-4">
                  <div><label className="text-sm font-medium text-foreground block mb-1">City *</label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
                  <div><label className="text-sm font-medium text-foreground block mb-1">Province</label><Input value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })} /></div>
                  <div><label className="text-sm font-medium text-foreground block mb-1">ZIP</label><Input value={form.zip_code} onChange={(e) => setForm({ ...form, zip_code: e.target.value })} /></div>
                </div>
                <label className="flex items-center gap-2 text-sm font-medium text-foreground"><input type="checkbox" checked={form.is_default} onChange={(e) => setForm({ ...form, is_default: e.target.checked })} className="rounded" /> Set as default</label>
                <Button onClick={handleSave} className="w-full bg-primary text-primary-foreground font-heading uppercase tracking-wider">{editId ? "Update" : "Save"}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
        ) : addresses.length === 0 ? (
          <div className="text-center py-16">
            <MapPin size={48} className="mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No saved addresses</p>
          </div>
        ) : (
          <div className="space-y-4">
            {addresses.map((a) => (
              <Card key={a.id}>
                <CardContent className="p-5 flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-heading text-foreground">{a.label}</span>
                      {a.is_default && <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium flex items-center gap-1"><Star size={10} /> Default</span>}
                    </div>
                    <p className="text-sm text-foreground">{a.full_name} · {a.phone}</p>
                    <p className="text-sm text-muted-foreground">{a.address_line}, {a.city}{a.province ? `, ${a.province}` : ""}{a.zip_code ? ` ${a.zip_code}` : ""}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(a)}><Pencil size={14} /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(a.id)}><Trash2 size={14} /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AddressesPage;
