import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search, Upload } from "lucide-react";

const emptyForm = { title: "", description: "", event_date: "", location: "", image_url: "", display_order: 0 };

const ActivitiesManagementPage = () => {
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetch(); }, []);
  const fetch = async () => {
    const { data } = await supabase.from("activities").select("*").order("display_order");
    setItems(data || []);
  };

  const uploadImage = async (file: File) => {
    setUploading(true);
    const fileName = `activities/${Date.now()}.${file.name.split(".").pop()}`;
    const { error } = await supabase.storage.from("product-images").upload(fileName, file);
    if (error) { toast.error("Upload failed"); setUploading(false); return; }
    const { data } = supabase.storage.from("product-images").getPublicUrl(fileName);
    setForm({ ...form, image_url: data.publicUrl });
    setUploading(false);
  };

  const handleSave = async () => {
    if (!form.title) { toast.error("Title required"); return; }
    const payload = { title: form.title, description: form.description || null, event_date: form.event_date || null, location: form.location || null, image_url: form.image_url || null, display_order: form.display_order };
    if (editId) { await supabase.from("activities").update(payload).eq("id", editId); toast.success("Updated"); }
    else { await supabase.from("activities").insert(payload); toast.success("Created"); }
    setForm(emptyForm); setEditId(null); setDialogOpen(false); fetch();
  };

  const handleEdit = (a: any) => {
    setForm({ title: a.title, description: a.description || "", event_date: a.event_date ? a.event_date.split("T")[0] : "", location: a.location || "", image_url: a.image_url || "", display_order: a.display_order });
    setEditId(a.id); setDialogOpen(true);
  };

  const handleDelete = async (id: string) => { await supabase.from("activities").delete().eq("id", id); toast.success("Deleted"); fetch(); };
  const filtered = items.filter((a) => a.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="font-heading text-2xl uppercase tracking-wider text-foreground">Activities</h1>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) { setForm(emptyForm); setEditId(null); } }}>
          <DialogTrigger asChild><Button className="gap-2 bg-primary text-primary-foreground font-heading uppercase tracking-wider"><Plus size={16} /> Add Activity</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-heading uppercase tracking-wider">{editId ? "Edit" : "Add"} Activity</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <div><label className="text-sm font-medium text-foreground block mb-1">Title *</label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
              <div><label className="text-sm font-medium text-foreground block mb-1">Description</label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm font-medium text-foreground block mb-1">Date</label><Input type="date" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} /></div>
                <div><label className="text-sm font-medium text-foreground block mb-1">Location</label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-1">Image</label>
                {form.image_url ? (
                  <div className="relative"><img src={form.image_url} className="w-full h-32 object-cover rounded-lg" /><Button variant="destructive" size="sm" className="absolute top-2 right-2" onClick={() => setForm({ ...form, image_url: "" })}>Remove</Button></div>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading} className="gap-2"><Upload size={14} /> {uploading ? "Uploading..." : "Upload"}</Button>
                )}
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0])} />
              </div>
              <Button onClick={handleSave} className="w-full bg-primary text-primary-foreground font-heading uppercase tracking-wider">{editId ? "Update" : "Create"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="relative max-w-md"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" /></div>
      <Card><CardContent className="pt-6">
        {filtered.length === 0 ? <div className="text-center py-12 text-muted-foreground">No activities yet</div> : (
          <Table>
            <TableHeader><TableRow><TableHead>Image</TableHead><TableHead>Title</TableHead><TableHead>Date</TableHead><TableHead>Location</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {filtered.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>{a.image_url ? <img src={a.image_url} className="w-10 h-10 rounded object-cover" /> : "—"}</TableCell>
                  <TableCell className="font-medium text-foreground">{a.title}</TableCell>
                  <TableCell className="text-muted-foreground">{a.event_date ? new Date(a.event_date).toLocaleDateString() : "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{a.location || "—"}</TableCell>
                  <TableCell><div className="flex gap-1"><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(a)}><Pencil size={14} /></Button><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(a.id)}><Trash2 size={14} /></Button></div></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent></Card>
    </div>
  );
};

export default ActivitiesManagementPage;
