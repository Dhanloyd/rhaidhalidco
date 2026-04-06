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

const emptyForm = { name: "", position: "", jersey_number: 0, bio: "", image_url: "", display_order: 0 };

const PlayersManagementPage = () => {
  const [players, setPlayers] = useState<any[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetch(); }, []);
  const fetch = async () => {
    const { data } = await supabase.from("player_profiles").select("*").order("display_order");
    setPlayers(data || []);
  };

  const uploadImage = async (file: File) => {
    setUploading(true);
    const fileName = `players/${Date.now()}.${file.name.split(".").pop()}`;
    const { error } = await supabase.storage.from("product-images").upload(fileName, file);
    if (error) { toast.error("Upload failed"); setUploading(false); return; }
    const { data } = supabase.storage.from("product-images").getPublicUrl(fileName);
    setForm({ ...form, image_url: data.publicUrl });
    setUploading(false);
  };

  const handleSave = async () => {
    if (!form.name) { toast.error("Name required"); return; }
    const payload = { name: form.name, position: form.position || null, jersey_number: form.jersey_number || null, bio: form.bio || null, image_url: form.image_url || null, display_order: form.display_order };
    if (editId) { await supabase.from("player_profiles").update(payload).eq("id", editId); toast.success("Updated"); }
    else { await supabase.from("player_profiles").insert(payload); toast.success("Created"); }
    setForm(emptyForm); setEditId(null); setDialogOpen(false); fetch();
  };

  const handleEdit = (p: any) => {
    setForm({ name: p.name, position: p.position || "", jersey_number: p.jersey_number || 0, bio: p.bio || "", image_url: p.image_url || "", display_order: p.display_order });
    setEditId(p.id); setDialogOpen(true);
  };

  const handleDelete = async (id: string) => { await supabase.from("player_profiles").delete().eq("id", id); toast.success("Deleted"); fetch(); };
  const filtered = players.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="font-heading text-2xl uppercase tracking-wider text-foreground">Players</h1>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) { setForm(emptyForm); setEditId(null); } }}>
          <DialogTrigger asChild><Button className="gap-2 bg-primary text-primary-foreground font-heading uppercase tracking-wider"><Plus size={16} /> Add Player</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-heading uppercase tracking-wider">{editId ? "Edit" : "Add"} Player</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm font-medium text-foreground block mb-1">Name *</label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div><label className="text-sm font-medium text-foreground block mb-1">Position</label><Input value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} /></div>
              </div>
              <div><label className="text-sm font-medium text-foreground block mb-1">Jersey #</label><Input type="number" value={form.jersey_number} onChange={(e) => setForm({ ...form, jersey_number: parseInt(e.target.value) || 0 })} /></div>
              <div><label className="text-sm font-medium text-foreground block mb-1">Bio</label><Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3} /></div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-1">Photo</label>
                {form.image_url ? (
                  <div className="relative"><img src={form.image_url} className="w-full h-32 object-cover rounded-lg" /><Button variant="destructive" size="sm" className="absolute top-2 right-2" onClick={() => setForm({ ...form, image_url: "" })}>Remove</Button></div>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading} className="gap-2"><Upload size={14} /> {uploading ? "Uploading..." : "Upload"}</Button>
                )}
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0])} />
              </div>
              <div><label className="text-sm font-medium text-foreground block mb-1">Display Order</label><Input type="number" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value) || 0 })} /></div>
              <Button onClick={handleSave} className="w-full bg-primary text-primary-foreground font-heading uppercase tracking-wider">{editId ? "Update" : "Create"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="relative max-w-md"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" /></div>
      <Card><CardContent className="pt-6">
        {filtered.length === 0 ? <div className="text-center py-12 text-muted-foreground">No players yet</div> : (
          <Table>
            <TableHeader><TableRow><TableHead>Photo</TableHead><TableHead>Name</TableHead><TableHead>Position</TableHead><TableHead>#</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{p.image_url ? <img src={p.image_url} className="w-10 h-10 rounded-full object-cover" /> : "—"}</TableCell>
                  <TableCell className="font-medium text-foreground">{p.name}</TableCell>
                  <TableCell className="text-muted-foreground">{p.position || "—"}</TableCell>
                  <TableCell>{p.jersey_number || "—"}</TableCell>
                  <TableCell><div className="flex gap-1"><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(p)}><Pencil size={14} /></Button><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(p.id)}><Trash2 size={14} /></Button></div></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent></Card>
    </div>
  );
};

export default PlayersManagementPage;
