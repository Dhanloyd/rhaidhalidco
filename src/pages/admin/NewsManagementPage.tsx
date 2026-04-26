import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search, Eye, EyeOff, Newspaper, RefreshCw } from "lucide-react";

const emptyForm = { title: "", content: "", excerpt: "", image_url: "", published: false };

const NewsManagementPage = () => {
  const [news, setNews]           = useState<any[]>([]);
  const [form, setForm]           = useState(emptyForm);
  const [editId, setEditId]       = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch]       = useState("");
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => { fetchNews(); }, []);

  const fetchNews = async () => {
    const { data } = await supabase.from("news").select("*").order("created_at", { ascending: false });
    setNews(data || []);
    setLoading(false);
  };

  const uploadImage = async () => {
    if (!imageFile) return form.image_url;
    const fileName = `news/${Date.now()}-${imageFile.name}`;
    const { error } = await supabase.storage.from("news").upload(fileName, imageFile);
    if (error) { toast.error("Image upload failed"); return null; }
    const { data } = supabase.storage.from("news").getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleSave = async () => {
    if (!form.title) { toast.error("Title required"); return; }
    setSaving(true);
    const imageUrl = await uploadImage();
    const payload = { title: form.title, content: form.content || null, excerpt: form.excerpt || null, image_url: imageUrl || form.image_url || null, published: form.published };

    if (editId) {
      const { error } = await supabase.from("news").update(payload).eq("id", editId);
      if (error) { toast.error("Update failed"); setSaving(false); return; }
      toast.success("News updated");
    } else {
      const { error } = await supabase.from("news").insert(payload);
      if (error) { toast.error("Create failed"); setSaving(false); return; }
      toast.success("News created");
    }
    setSaving(false);
    setForm(emptyForm); setEditId(null); setImageFile(null); setDialogOpen(false);
    fetchNews();
  };

  const handleEdit = (item: any) => {
    setForm({ title: item.title, content: item.content || "", excerpt: item.excerpt || "", image_url: item.image_url || "", published: item.published });
    setEditId(item.id); setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this news article?")) return;
    const { error } = await supabase.from("news").delete().eq("id", id);
    if (error) { toast.error("Delete failed"); return; }
    toast.success("News deleted"); fetchNews();
  };

  const togglePublish = async (id: string, published: boolean) => {
    await supabase.from("news").update({ published: !published }).eq("id", id);
    fetchNews();
  };

  const filtered = news.filter(n => n.title.toLowerCase().includes(search.toLowerCase()));

  const glass = {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    backdropFilter: "blur(20px)",
    boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
  };

  const inputDark = {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "#fff",
  };

  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: "11px", fontWeight: 700,
    color: "rgba(148,163,184,0.6)", marginBottom: "6px",
    textTransform: "uppercase", letterSpacing: ".08em",
  };

  return (
    <div style={{ minHeight: "100vh", padding: "24px", display: "flex", flexDirection: "column", gap: "24px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "14px", opacity: 0, animation: "fadeUp 0.5s ease forwards" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#34d399", animation: "pulse 2s infinite" }} />
            <span style={{ fontSize: "11px", color: "#34d399", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase" }}>Live</span>
          </div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>News Management</h1>
          <p style={{ fontSize: "12px", color: "rgba(148,163,184,0.7)", marginTop: "2px", fontWeight: 500 }}>
            {news.length} article{news.length !== 1 ? "s" : ""} · {news.filter(n => n.published).length} published
          </p>
        </div>
        <button onClick={() => { setForm(emptyForm); setEditId(null); setImageFile(null); setDialogOpen(true); }} style={{
          display: "inline-flex", alignItems: "center", gap: "8px",
          padding: "11px 22px", borderRadius: "12px",
          background: "rgba(52,211,153,0.9)", color: "#001a0f",
          fontWeight: 800, fontSize: "12px", letterSpacing: ".06em", textTransform: "uppercase",
          border: "none", cursor: "pointer",
          boxShadow: "0 6px 22px -5px rgba(52,211,153,0.35)",
          transition: "transform .2s ease, box-shadow .2s ease",
        }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = ""; }}
        >
          <Plus size={15} /> Add News
        </button>
      </div>

      {/* Search */}
      <div style={{ position: "relative", maxWidth: "360px", opacity: 0, animation: "fadeUp 0.5s ease 0.08s forwards" }}>
        <Search size={14} style={{ position: "absolute", left: "13px", top: "50%", transform: "translateY(-50%)", color: "rgba(148,163,184,0.45)", zIndex: 1 }} />
        <Input placeholder="Search news…" value={search} onChange={e => setSearch(e.target.value)}
          style={{ ...inputDark, paddingLeft: "40px" }} />
      </div>

      {/* Table */}
      <div style={{
        ...glass, borderRadius: "20px", overflow: "hidden",
        opacity: 0, animation: "fadeUp 0.5s ease 0.16s forwards",
      }}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "60px 0", gap: "12px" }}>
            {[0, 0.15, 0.3].map((d, i) => (
              <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: i === 0 ? "#34d399" : i === 1 ? "#60a5fa" : "#a78bfa", animation: `bounce 0.7s ease ${d}s infinite alternate` }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <Newspaper size={36} style={{ display: "block", margin: "0 auto 12px", color: "rgba(148,163,184,0.2)" }} />
            <p style={{ fontWeight: 600, color: "rgba(148,163,184,0.4)" }}>No news articles found</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  {["Title", "Excerpt", "Status", "Date", "Actions"].map(h => (
                    <th key={h} style={{
                      padding: "14px 16px", textAlign: "left",
                      fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
                      color: "rgba(148,163,184,0.55)", whiteSpace: "nowrap",
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(item => (
                  <tr key={item.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", transition: "background .18s ease" }}
                    onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = "rgba(255,255,255,0.03)"}
                    onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = ""}
                  >
                    {/* Title */}
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.title} style={{ width: 40, height: 40, objectFit: "cover", borderRadius: "8px", flexShrink: 0, border: "1px solid rgba(255,255,255,0.1)" }} />
                        ) : (
                          <div style={{ width: 40, height: 40, borderRadius: "8px", flexShrink: 0, background: "rgba(96,165,250,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Newspaper size={16} color="#60a5fa" />
                          </div>
                        )}
                        <span style={{ fontWeight: 700, fontSize: "13px", color: "#fff", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</span>
                      </div>
                    </td>

                    {/* Excerpt */}
                    <td style={{ padding: "12px 16px", maxWidth: "220px" }}>
                      <span style={{ fontSize: "12px", color: "rgba(148,163,184,0.6)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>
                        {item.excerpt || "—"}
                      </span>
                    </td>

                    {/* Status */}
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: "5px",
                        padding: "4px 10px", borderRadius: "999px", fontSize: "10px", fontWeight: 700,
                        background: item.published ? "rgba(52,211,153,0.15)" : "rgba(148,163,184,0.1)",
                        border: `1px solid ${item.published ? "rgba(52,211,153,0.3)" : "rgba(148,163,184,0.2)"}`,
                        color: item.published ? "#34d399" : "#94a3b8",
                      }}>
                        <div style={{ width: 5, height: 5, borderRadius: "50%", background: "currentColor" }} />
                        {item.published ? "Published" : "Draft"}
                      </span>
                    </td>

                    {/* Date */}
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ fontSize: "12px", color: "rgba(148,163,184,0.5)" }}>
                        {new Date(item.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", gap: "6px" }}>
                        {/* Toggle publish */}
                        <button onClick={() => togglePublish(item.id, item.published)} title={item.published ? "Unpublish" : "Publish"} style={{
                          width: 30, height: 30, borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center",
                          border: `1px solid ${item.published ? "rgba(251,146,60,0.2)" : "rgba(52,211,153,0.2)"}`,
                          cursor: "pointer",
                          background: item.published ? "rgba(251,146,60,0.1)" : "rgba(52,211,153,0.1)",
                          color: item.published ? "#fb923c" : "#34d399",
                          transition: "background .18s ease, transform .18s ease",
                        }}
                          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.1)"; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = ""; }}
                        >
                          {item.published ? <EyeOff size={13} /> : <Eye size={13} />}
                        </button>

                        {/* Edit */}
                        <button onClick={() => handleEdit(item)} title="Edit" style={{
                          width: 30, height: 30, borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center",
                          border: "1px solid rgba(96,165,250,0.2)", cursor: "pointer",
                          background: "rgba(96,165,250,0.1)", color: "#60a5fa",
                          transition: "background .18s ease, transform .18s ease",
                        }}
                          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(96,165,250,0.22)"; (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.1)"; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(96,165,250,0.1)"; (e.currentTarget as HTMLButtonElement).style.transform = ""; }}
                        >
                          <Pencil size={13} />
                        </button>

                        {/* Delete */}
                        <button onClick={() => handleDelete(item.id)} title="Delete" style={{
                          width: 30, height: 30, borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center",
                          border: "1px solid rgba(248,113,113,0.2)", cursor: "pointer",
                          background: "rgba(248,113,113,0.1)", color: "#f87171",
                          transition: "background .18s ease, transform .18s ease",
                        }}
                          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(248,113,113,0.22)"; (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.1)"; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(248,113,113,0.1)"; (e.currentTarget as HTMLButtonElement).style.transform = ""; }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={o => { setDialogOpen(o); if (!o) { setForm(emptyForm); setEditId(null); setImageFile(null); } }}>
        <DialogContent style={{
          maxWidth: "500px", maxHeight: "92vh", overflowY: "auto",
          background: "rgba(10,15,30,0.97)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(30px)",
        }}>
          <DialogHeader>
            <DialogTitle style={{ fontSize: "1.2rem", fontWeight: 800, color: "#fff" }}>
              {editId ? "Edit Article" : "New Article"}
            </DialogTitle>
          </DialogHeader>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "8px" }}>
            <div>
              <label style={labelStyle}>Title *</label>
              <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Article title…" style={inputDark} />
            </div>

            <div>
              <label style={labelStyle}>Excerpt</label>
              <Input value={form.excerpt} onChange={e => setForm({ ...form, excerpt: e.target.value })} placeholder="Short description…" style={inputDark} />
            </div>

            <div>
              <label style={labelStyle}>Content</label>
              <Textarea rows={5} value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} placeholder="Full article content…"
                style={{ ...inputDark, resize: "vertical" }} />
            </div>

            <div>
              <label style={labelStyle}>Image</label>
              <Input type="file" accept="image/*" onChange={e => {
                if (e.target.files?.[0]) {
                  setImageFile(e.target.files[0]);
                  setForm({ ...form, image_url: URL.createObjectURL(e.target.files[0]) });
                }
              }} style={{ ...inputDark, cursor: "pointer" }} />
              {form.image_url && (
                <div style={{ marginTop: "10px", position: "relative" }}>
                  <img src={form.image_url} style={{ width: "100%", height: "140px", objectFit: "cover", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.1)" }} />
                  <button onClick={() => setForm({ ...form, image_url: "" })} style={{
                    position: "absolute", top: 8, right: 8, width: 26, height: 26, borderRadius: "50%",
                    background: "rgba(248,113,113,0.9)", color: "#fff", border: "none", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px",
                  }}>×</button>
                </div>
              )}
            </div>

            <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
              <div style={{ position: "relative" }}>
                <input type="checkbox" checked={form.published} onChange={e => setForm({ ...form, published: e.target.checked })}
                  style={{ opacity: 0, position: "absolute", width: 0, height: 0 }} />
                <div style={{
                  width: 36, height: 20, borderRadius: "999px",
                  background: form.published ? "rgba(52,211,153,0.8)" : "rgba(255,255,255,0.1)",
                  border: `1px solid ${form.published ? "rgba(52,211,153,0.5)" : "rgba(255,255,255,0.15)"}`,
                  transition: "background .2s ease",
                  display: "flex", alignItems: "center", padding: "2px",
                  cursor: "pointer",
                }} onClick={() => setForm({ ...form, published: !form.published })}>
                  <div style={{
                    width: 14, height: 14, borderRadius: "50%", background: "#fff",
                    transform: form.published ? "translateX(16px)" : "translateX(0)",
                    transition: "transform .2s ease",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
                  }} />
                </div>
              </div>
              <span style={{ fontSize: "13px", fontWeight: 600, color: form.published ? "#34d399" : "rgba(148,163,184,0.7)" }}>
                {form.published ? "Published" : "Draft"}
              </span>
            </label>

            <button onClick={handleSave} disabled={saving} style={{
              width: "100%", padding: "13px", borderRadius: "12px",
              background: saving ? "rgba(52,211,153,0.5)" : "rgba(52,211,153,0.9)",
              color: "#001a0f", fontWeight: 800, fontSize: "13px",
              letterSpacing: ".06em", textTransform: "uppercase",
              border: "none", cursor: saving ? "not-allowed" : "pointer",
              boxShadow: "0 6px 22px -5px rgba(52,211,153,0.3)",
            }}>
              {saving ? "Saving…" : editId ? "Update Article" : "Create Article"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes bounce { from { transform: translateY(0); } to { transform: translateY(-8px); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </div>
  );
};

export default NewsManagementPage;
