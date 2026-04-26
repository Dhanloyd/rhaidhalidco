import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search, Star, Link, Hash, Image as ImageIcon } from "lucide-react";

const emptyForm = { title: "", description: "", image_url: "", link_url: "", display_order: 0, active: true };

const HighlightsPage = () => {
  const [highlights, setHighlights] = useState<any[]>([]);
  const [form, setForm]             = useState(emptyForm);
  const [editId, setEditId]         = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch]         = useState("");
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [imageFile, setImageFile]   = useState<File | null>(null);

  useEffect(() => { fetchHighlights(); }, []);

  const fetchHighlights = async () => {
    const { data } = await supabase.from("highlights").select("*").order("display_order");
    setHighlights(data || []);
    setLoading(false);
  };

  const uploadImage = async () => {
    if (!imageFile) return form.image_url;
    const fileName = `${Date.now()}-${imageFile.name}`;
    const { error } = await supabase.storage.from("highlights").upload(fileName, imageFile);
    if (error) { toast.error("Image upload failed"); return null; }
    const { data } = supabase.storage.from("highlights").getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleSave = async () => {
    if (!form.title) { toast.error("Title required"); return; }
    setSaving(true);
    const imageUrl = await uploadImage();
    const payload = { title: form.title, description: form.description || null, image_url: imageUrl || form.image_url || null, link_url: form.link_url || null, display_order: form.display_order, active: form.active };

    if (editId) {
      const { error } = await supabase.from("highlights").update(payload).eq("id", editId);
      if (error) { toast.error("Update failed"); setSaving(false); return; }
      toast.success("Highlight updated");
    } else {
      const { error } = await supabase.from("highlights").insert(payload);
      if (error) { toast.error("Create failed"); setSaving(false); return; }
      toast.success("Highlight created");
    }
    setSaving(false);
    setForm(emptyForm); setEditId(null); setImageFile(null); setDialogOpen(false);
    fetchHighlights();
  };

  const handleEdit = (item: any) => {
    setForm({ title: item.title, description: item.description || "", image_url: item.image_url || "", link_url: item.link_url || "", display_order: item.display_order, active: item.active });
    setEditId(item.id); setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this highlight?")) return;
    const { error } = await supabase.from("highlights").delete().eq("id", id);
    if (error) { toast.error("Delete failed"); return; }
    toast.success("Deleted"); fetchHighlights();
  };

  const filtered = highlights.filter(h => h.title.toLowerCase().includes(search.toLowerCase()));

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

  const ACCENT = ["#34d399", "#60a5fa", "#a78bfa", "#fb923c", "#f472b6", "#f87171"];

  return (
    <div style={{ minHeight: "100vh", padding: "24px", display: "flex", flexDirection: "column", gap: "24px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "14px", opacity: 0, animation: "fadeUp 0.5s ease forwards" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#34d399", animation: "pulse 2s infinite" }} />
            <span style={{ fontSize: "11px", color: "#34d399", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase" }}>Live</span>
          </div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>Highlights</h1>
          <p style={{ fontSize: "12px", color: "rgba(148,163,184,0.7)", marginTop: "2px", fontWeight: 500 }}>
            {highlights.length} highlight{highlights.length !== 1 ? "s" : ""} · {highlights.filter(h => h.active).length} active
          </p>
        </div>
        <button onClick={() => { setForm(emptyForm); setEditId(null); setImageFile(null); setDialogOpen(true); }} style={{
          display: "inline-flex", alignItems: "center", gap: "8px",
          padding: "11px 22px", borderRadius: "12px",
          background: "rgba(52,211,153,0.9)", color: "#001a0f",
          fontWeight: 800, fontSize: "12px", letterSpacing: ".06em", textTransform: "uppercase",
          border: "none", cursor: "pointer",
          boxShadow: "0 6px 22px -5px rgba(52,211,153,0.35)",
          transition: "transform .2s ease",
        }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = ""; }}
        >
          <Plus size={15} /> Add Highlight
        </button>
      </div>

      {/* Search */}
      <div style={{ position: "relative", maxWidth: "360px", opacity: 0, animation: "fadeUp 0.5s ease 0.08s forwards" }}>
        <Search size={14} style={{ position: "absolute", left: "13px", top: "50%", transform: "translateY(-50%)", color: "rgba(148,163,184,0.45)", zIndex: 1 }} />
        <Input placeholder="Search highlights…" value={search} onChange={e => setSearch(e.target.value)}
          style={{ ...inputDark, paddingLeft: "40px" }} />
      </div>

      {/* Card grid (if highlights exist) or table */}
      {!loading && filtered.length > 0 && (
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "14px",
          opacity: 0, animation: "fadeUp 0.5s ease 0.16s forwards",
        }}>
          {filtered.map((item, i) => (
            <div key={item.id} style={{
              ...glass, borderRadius: "18px", overflow: "hidden",
              transition: "transform .3s ease, box-shadow .3s ease, border-color .3s ease",
              cursor: "default",
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = `0 16px 40px rgba(0,0,0,0.4), 0 0 0 1px ${ACCENT[i % ACCENT.length]}30`; (e.currentTarget as HTMLDivElement).style.borderColor = `${ACCENT[i % ACCENT.length]}35`; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ""; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 32px rgba(0,0,0,0.3)"; (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.08)"; }}
            >
              {/* Image */}
              <div style={{ height: "130px", overflow: "hidden", background: `${ACCENT[i % ACCENT.length]}10`, position: "relative" }}>
                {item.image_url ? (
                  <img src={item.image_url} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform .3s ease" }}
                    onMouseEnter={e => (e.currentTarget as HTMLImageElement).style.transform = "scale(1.06)"}
                    onMouseLeave={e => (e.currentTarget as HTMLImageElement).style.transform = ""}
                  />
                ) : (
                  <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Star size={28} color={`${ACCENT[i % ACCENT.length]}60`} />
                  </div>
                )}
                {/* Order badge */}
                <div style={{
                  position: "absolute", top: 8, left: 8,
                  padding: "3px 8px", borderRadius: "999px", fontSize: "10px", fontWeight: 800,
                  background: "rgba(10,15,30,0.75)", color: "rgba(148,163,184,0.8)",
                  backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.1)",
                }}>
                  #{item.display_order}
                </div>
                {/* Status badge */}
                <div style={{
                  position: "absolute", top: 8, right: 8,
                  padding: "3px 8px", borderRadius: "999px", fontSize: "10px", fontWeight: 700,
                  background: item.active ? "rgba(52,211,153,0.2)" : "rgba(148,163,184,0.15)",
                  color: item.active ? "#34d399" : "#94a3b8",
                  backdropFilter: "blur(8px)", border: `1px solid ${item.active ? "rgba(52,211,153,0.3)" : "rgba(148,163,184,0.2)"}`,
                }}>
                  {item.active ? "Active" : "Inactive"}
                </div>
              </div>

              {/* Content */}
              <div style={{ padding: "14px" }}>
                <p style={{ fontWeight: 700, fontSize: "13px", color: "#fff", marginBottom: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</p>
                {item.description && (
                  <p style={{ fontSize: "11px", color: "rgba(148,163,184,0.55)", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", marginBottom: "10px" }}>
                    {item.description}
                  </p>
                )}
                {item.link_url && (
                  <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "10px" }}>
                    <Link size={10} color="rgba(96,165,250,0.6)" />
                    <span style={{ fontSize: "10px", color: "#60a5fa", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.link_url}</span>
                  </div>
                )}

                {/* Action buttons */}
                <div style={{ display: "flex", gap: "6px" }}>
                  <button onClick={() => handleEdit(item)} title="Edit" style={{
                    flex: 1, padding: "7px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", gap: "5px",
                    border: "1px solid rgba(96,165,250,0.2)", cursor: "pointer",
                    background: "rgba(96,165,250,0.1)", color: "#60a5fa",
                    fontWeight: 700, fontSize: "11px",
                    transition: "background .18s ease",
                  }}
                    onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = "rgba(96,165,250,0.2)"}
                    onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = "rgba(96,165,250,0.1)"}
                  >
                    <Pencil size={12} /> Edit
                  </button>
                  <button onClick={() => handleDelete(item.id)} title="Delete" style={{
                    width: 32, height: 32, borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center",
                    border: "1px solid rgba(248,113,113,0.2)", cursor: "pointer",
                    background: "rgba(248,113,113,0.1)", color: "#f87171",
                    transition: "background .18s ease",
                  }}
                    onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = "rgba(248,113,113,0.2)"}
                    onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = "rgba(248,113,113,0.1)"}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty / loading state */}
      {!loading && filtered.length === 0 && (
        <div style={{
          ...glass, borderRadius: "20px", padding: "60px",
          textAlign: "center", opacity: 0, animation: "fadeUp 0.5s ease 0.16s forwards",
        }}>
          <Star size={36} style={{ display: "block", margin: "0 auto 12px", color: "rgba(148,163,184,0.2)" }} />
          <p style={{ fontWeight: 600, color: "rgba(148,163,184,0.4)" }}>No highlights found</p>
        </div>
      )}

      {loading && (
        <div style={{
          ...glass, borderRadius: "20px",
          display: "flex", justifyContent: "center", alignItems: "center", padding: "60px 0", gap: "12px",
        }}>
          {[0, 0.15, 0.3].map((d, i) => (
            <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: i === 0 ? "#34d399" : i === 1 ? "#60a5fa" : "#a78bfa", animation: `bounce 0.7s ease ${d}s infinite alternate` }} />
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={o => { setDialogOpen(o); if (!o) { setForm(emptyForm); setEditId(null); setImageFile(null); } }}>
        <DialogContent style={{
          maxWidth: "500px", maxHeight: "92vh", overflowY: "auto",
          background: "rgba(10,15,30,0.97)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(30px)",
        }}>
          <DialogHeader>
            <DialogTitle style={{ fontSize: "1.2rem", fontWeight: 800, color: "#fff" }}>
              {editId ? "Edit Highlight" : "New Highlight"}
            </DialogTitle>
          </DialogHeader>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "8px" }}>
            <div>
              <label style={labelStyle}>Title *</label>
              <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Highlight title…" style={inputDark} />
            </div>

            <div>
              <label style={labelStyle}>Description</label>
              <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Short description…"
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
                  <img src={form.image_url} style={{ width: "100%", height: "120px", objectFit: "cover", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.1)" }} />
                  <button onClick={() => setForm({ ...form, image_url: "" })} style={{
                    position: "absolute", top: 8, right: 8, width: 26, height: 26, borderRadius: "50%",
                    background: "rgba(248,113,113,0.9)", color: "#fff", border: "none", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px",
                  }}>×</button>
                </div>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={labelStyle}>Link URL</label>
                <Input value={form.link_url} onChange={e => setForm({ ...form, link_url: e.target.value })} placeholder="https://…" style={inputDark} />
              </div>
              <div>
                <label style={labelStyle}>Display Order</label>
                <Input type="number" value={form.display_order} onChange={e => setForm({ ...form, display_order: parseInt(e.target.value) || 0 })} style={inputDark} />
              </div>
            </div>

            {/* Active toggle */}
            <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
              <div style={{ position: "relative" }}>
                <input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })}
                  style={{ opacity: 0, position: "absolute", width: 0, height: 0 }} />
                <div style={{
                  width: 36, height: 20, borderRadius: "999px",
                  background: form.active ? "rgba(52,211,153,0.8)" : "rgba(255,255,255,0.1)",
                  border: `1px solid ${form.active ? "rgba(52,211,153,0.5)" : "rgba(255,255,255,0.15)"}`,
                  transition: "background .2s ease",
                  display: "flex", alignItems: "center", padding: "2px",
                  cursor: "pointer",
                }} onClick={() => setForm({ ...form, active: !form.active })}>
                  <div style={{
                    width: 14, height: 14, borderRadius: "50%", background: "#fff",
                    transform: form.active ? "translateX(16px)" : "translateX(0)",
                    transition: "transform .2s ease",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
                  }} />
                </div>
              </div>
              <span style={{ fontSize: "13px", fontWeight: 600, color: form.active ? "#34d399" : "rgba(148,163,184,0.7)" }}>
                {form.active ? "Active" : "Inactive"}
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
              {saving ? "Saving…" : editId ? "Update Highlight" : "Create Highlight"}
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

export default HighlightsPage;
