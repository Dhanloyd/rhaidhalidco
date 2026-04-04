import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search, Eye, EyeOff } from "lucide-react";

const emptyForm = { title: "", content: "", excerpt: "", image_url: "", published: false };

const NewsManagementPage = () => {
  const [news, setNews] = useState<any[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchNews(); }, []);

  const fetchNews = async () => {
    const { data } = await supabase.from("news").select("*").order("created_at", { ascending: false });
    setNews(data || []);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!form.title) { toast.error("Title is required"); return; }
    const payload = { title: form.title, content: form.content || null, excerpt: form.excerpt || null, image_url: form.image_url || null, published: form.published };
    if (editId) {
      const { error } = await supabase.from("news").update(payload).eq("id", editId);
      if (error) { toast.error("Failed to update"); return; }
      toast.success("News updated");
    } else {
      const { error } = await supabase.from("news").insert(payload);
      if (error) { toast.error("Failed to create"); return; }
      toast.success("News created");
    }
    setForm(emptyForm); setEditId(null); setDialogOpen(false); fetchNews();
  };

  const handleEdit = (item: any) => {
    setForm({ title: item.title, content: item.content || "", excerpt: item.excerpt || "", image_url: item.image_url || "", published: item.published });
    setEditId(item.id); setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("news").delete().eq("id", id);
    if (error) { toast.error("Failed to delete"); return; }
    toast.success("News deleted"); fetchNews();
  };

  const togglePublish = async (id: string, published: boolean) => {
    await supabase.from("news").update({ published: !published }).eq("id", id);
    fetchNews();
  };

  const filtered = news.filter((n) => n.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="font-heading text-2xl uppercase tracking-wider text-foreground">News Management</h1>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) { setForm(emptyForm); setEditId(null); } }}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary-light font-heading uppercase tracking-wider">
              <Plus size={16} /> Add News
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle className="font-heading uppercase tracking-wider">{editId ? "Edit News" : "New News Article"}</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <div><label className="text-sm font-medium text-foreground block mb-1">Title *</label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
              <div><label className="text-sm font-medium text-foreground block mb-1">Excerpt</label><Input value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} placeholder="Short summary..." /></div>
              <div><label className="text-sm font-medium text-foreground block mb-1">Content</label><Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={5} /></div>
              <div><label className="text-sm font-medium text-foreground block mb-1">Image URL</label><Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." /></div>
              <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} className="rounded" />
                Published
              </label>
              <Button onClick={handleSave} className="w-full bg-primary text-primary-foreground hover:bg-primary-light font-heading uppercase tracking-wider">
                {editId ? "Update" : "Create"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search news..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No news found</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Excerpt</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {filtered.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium text-foreground">{item.title}</TableCell>
                      <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">{item.excerpt}</TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${item.published ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                          {item.published ? "Published" : "Draft"}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{new Date(item.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => togglePublish(item.id, item.published)}>
                            {item.published ? <EyeOff size={14} /> : <Eye size={14} />}
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(item)}><Pencil size={14} /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(item.id)}><Trash2 size={14} /></Button>
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

export default NewsManagementPage;
