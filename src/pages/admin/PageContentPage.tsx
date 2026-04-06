import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";

const emptyForm = { page_key: "", section_key: "", title: "", content: "" };

const PageContentPage = () => {
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => { fetch(); }, []);
  const fetch = async () => {
    const { data } = await supabase.from("page_content").select("*").order("page_key");
    setItems(data || []);
  };

  const handleSave = async () => {
    if (!form.page_key || !form.section_key) { toast.error("Page and section keys required"); return; }
    const payload = { page_key: form.page_key, section_key: form.section_key, title: form.title || null, content: form.content || null };
    if (editId) { await supabase.from("page_content").update(payload).eq("id", editId); toast.success("Updated"); }
    else { await supabase.from("page_content").insert(payload); toast.success("Created"); }
    setForm(emptyForm); setEditId(null); setDialogOpen(false); fetch();
  };

  const handleEdit = (p: any) => {
    setForm({ page_key: p.page_key, section_key: p.section_key, title: p.title || "", content: p.content || "" });
    setEditId(p.id); setDialogOpen(true);
  };

  const handleDelete = async (id: string) => { await supabase.from("page_content").delete().eq("id", id); toast.success("Deleted"); fetch(); };

  const pages = ["about", "contact", "home"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="font-heading text-2xl uppercase tracking-wider text-foreground">Page Content</h1>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) { setForm(emptyForm); setEditId(null); } }}>
          <DialogTrigger asChild><Button className="gap-2 bg-primary text-primary-foreground font-heading uppercase tracking-wider"><Plus size={16} /> Add Content</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-heading uppercase tracking-wider">{editId ? "Edit" : "Add"} Content</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm font-medium text-foreground block mb-1">Page *</label>
                  <Input value={form.page_key} onChange={(e) => setForm({ ...form, page_key: e.target.value })} placeholder="about, contact, home" list="pages" />
                  <datalist id="pages">{pages.map((p) => <option key={p} value={p} />)}</datalist>
                </div>
                <div><label className="text-sm font-medium text-foreground block mb-1">Section *</label><Input value={form.section_key} onChange={(e) => setForm({ ...form, section_key: e.target.value })} placeholder="hero, mission, etc." /></div>
              </div>
              <div><label className="text-sm font-medium text-foreground block mb-1">Title</label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
              <div><label className="text-sm font-medium text-foreground block mb-1">Content</label><Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={5} /></div>
              <Button onClick={handleSave} className="w-full bg-primary text-primary-foreground font-heading uppercase tracking-wider">{editId ? "Update" : "Create"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <Card><CardContent className="pt-6">
        {items.length === 0 ? <div className="text-center py-12 text-muted-foreground">No content yet. Add content for About, Contact, or Home pages.</div> : (
          <Table>
            <TableHeader><TableRow><TableHead>Page</TableHead><TableHead>Section</TableHead><TableHead>Title</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {items.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium text-foreground uppercase">{p.page_key}</TableCell>
                  <TableCell className="text-muted-foreground">{p.section_key}</TableCell>
                  <TableCell className="text-foreground">{p.title || "—"}</TableCell>
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

export default PageContentPage;
