import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";

const platforms = ["Facebook", "Instagram", "Twitter", "TikTok", "YouTube", "LinkedIn"];
const emptyForm = { platform: "Facebook", url: "", icon: "", display_order: 0 };

const SocialLinksPage = () => {
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => { fetch(); }, []);
  const fetch = async () => {
    const { data } = await supabase.from("social_links").select("*").order("display_order");
    setItems(data || []);
  };

  const handleSave = async () => {
    if (!form.url) { toast.error("URL required"); return; }
    const payload = { platform: form.platform, url: form.url, icon: form.icon || null, display_order: form.display_order };
    if (editId) { await supabase.from("social_links").update(payload).eq("id", editId); toast.success("Updated"); }
    else { await supabase.from("social_links").insert(payload); toast.success("Created"); }
    setForm(emptyForm); setEditId(null); setDialogOpen(false); fetch();
  };

  const handleEdit = (s: any) => {
    setForm({ platform: s.platform, url: s.url, icon: s.icon || "", display_order: s.display_order });
    setEditId(s.id); setDialogOpen(true);
  };

  const handleDelete = async (id: string) => { await supabase.from("social_links").delete().eq("id", id); toast.success("Deleted"); fetch(); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="font-heading text-2xl uppercase tracking-wider text-foreground">Social Links</h1>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) { setForm(emptyForm); setEditId(null); } }}>
          <DialogTrigger asChild><Button className="gap-2 bg-primary text-primary-foreground font-heading uppercase tracking-wider"><Plus size={16} /> Add Link</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-heading uppercase tracking-wider">{editId ? "Edit" : "Add"} Social Link</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <div><label className="text-sm font-medium text-foreground block mb-1">Platform</label>
                <Input value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })} list="platforms" />
                <datalist id="platforms">{platforms.map((p) => <option key={p} value={p} />)}</datalist>
              </div>
              <div><label className="text-sm font-medium text-foreground block mb-1">URL *</label><Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://..." /></div>
              <Button onClick={handleSave} className="w-full bg-primary text-primary-foreground font-heading uppercase tracking-wider">{editId ? "Update" : "Create"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <Card><CardContent className="pt-6">
        {items.length === 0 ? <div className="text-center py-12 text-muted-foreground">No social links yet</div> : (
          <Table>
            <TableHeader><TableRow><TableHead>Platform</TableHead><TableHead>URL</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {items.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium text-foreground">{s.platform}</TableCell>
                  <TableCell className="text-muted-foreground truncate max-w-[200px]">{s.url}</TableCell>
                  <TableCell><div className="flex gap-1"><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(s)}><Pencil size={14} /></Button><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(s.id)}><Trash2 size={14} /></Button></div></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent></Card>
    </div>
  );
};

export default SocialLinksPage;
