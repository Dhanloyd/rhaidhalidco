import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Plus, Pencil, Trash2, Search, AlertCircle, RefreshCw, Calendar, MapPin, ImageOff,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const cardStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.08)",
  backdropFilter: "blur(20px)",
  boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
};

const emptyForm = {
  title: "",
  description: "",
  event_date: "",
  location: "",
  image_url: "",
  display_order: 0,
};

// ── Delete Confirm Modal ──────────────────────────────────────────────────────
function DeleteModal({
  activity,
  onClose,
  onConfirm,
}: {
  activity: any | null;
  onClose: () => void;
  onConfirm: (a: any) => void;
}) {
  if (!activity) return null;
  return (
    <Dialog open={!!activity} onOpenChange={onClose}>
      <DialogContent className="bg-[#111827] text-white border-white/10 max-w-sm">
        <DialogTitle className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center shrink-0">
            <AlertCircle size={15} className="text-red-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-red-300">Are you absolutely sure?</p>
            <p className="text-[11px] text-slate-400 font-normal mt-0.5">This action cannot be undone</p>
          </div>
        </DialogTitle>

        <div className="p-3 rounded-xl text-sm" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Activity</p>
          <p className="font-medium text-white">{activity.title}</p>
          {activity.event_date && (
            <p className="text-xs text-slate-400 mt-0.5">
              {new Date(activity.event_date).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
            </p>
          )}
        </div>

        <div className="p-3.5 rounded-xl text-sm space-y-1" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <p className="text-red-300 font-medium text-xs">This will permanently delete:</p>
          <ul className="text-slate-400 text-xs space-y-0.5 list-disc list-inside">
            <li>Activity record and all its data</li>
            <li>Associated image and description</li>
          </ul>
        </div>

        <div className="flex gap-2">
          <Button
            className="flex-1 bg-red-600 hover:bg-red-500 text-white gap-1.5 text-sm"
            onClick={() => { onConfirm(activity); onClose(); }}
          >
            <Trash2 size={13} /> Yes, delete permanently
          </Button>
          <Button
            variant="ghost"
            className="flex-1 text-slate-300 text-sm"
            style={{ border: "1px solid rgba(255,255,255,0.1)" }}
            onClick={onClose}
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Add / Edit Modal ──────────────────────────────────────────────────────────
function ActivityFormModal({
  open, onOpenChange, form, setForm, editId,
  imagePreview, setImageFile, setImagePreview, onSave, saving,
}: any) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#111827] text-white border-white/10 max-w-md">
        <DialogTitle className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
            {editId
              ? <Pencil size={14} className="text-indigo-400" />
              : <Plus size={14} className="text-indigo-400" />}
          </div>
          <div>
            <p className="text-sm font-semibold">{editId ? "Edit Activity" : "Add Activity"}</p>
            <p className="text-[11px] text-slate-400 font-normal mt-0.5">
              {editId ? "Update activity details" : "Create a new activity"}
            </p>
          </div>
        </DialogTitle>

        <div className="space-y-3 mt-1">
          <div>
            <label className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Title *</label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Enter title"
              className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-indigo-500/50"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Description</label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Enter description"
              className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-slate-600 resize-none focus:border-indigo-500/50"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Date</label>
              <Input
                type="date"
                value={form.event_date}
                onChange={(e) => setForm({ ...form, event_date: e.target.value })}
                className="mt-1 bg-white/5 border-white/10 text-white focus:border-indigo-500/50"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Location</label>
              <Input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="Enter location"
                className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-indigo-500/50"
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Image</label>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) { setImageFile(file); setImagePreview(URL.createObjectURL(file)); }
              }}
              className="mt-1 bg-white/5 border-white/10 text-white"
            />
            {imagePreview && (
              <img src={imagePreview} className="mt-2 w-full h-32 object-cover rounded-xl" style={{ border: "1px solid rgba(255,255,255,0.1)" }} />
            )}
          </div>
          <Button
            onClick={onSave}
            disabled={saving}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold mt-1"
          >
            {saving
              ? <><RefreshCw size={14} className="animate-spin mr-2" />Saving...</>
              : editId ? "Update Activity" : "Create Activity"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
const ActivitiesManagementPage = () => {
  const [items, setItems]               = useState<any[]>([]);
  const [form, setForm]                 = useState(emptyForm);
  const [editId, setEditId]             = useState<string | null>(null);
  const [dialogOpen, setDialogOpen]     = useState(false);
  const [search, setSearch]             = useState("");
  const [imageFile, setImageFile]       = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);
  const [deleteModal, setDeleteModal]   = useState<any>(null);
  const [deletingId, setDeletingId]     = useState<string | null>(null);

  const fetchActivities = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("activities")
      .select("*")
      .order("display_order");
    if (error) { toast.error("Failed to load: " + error.message); setLoading(false); return; }
    setItems(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchActivities();

    // ── Realtime is the ONLY place that updates `items` state ──
    const channel = supabase
      .channel("activities-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "activities" }, (payload) => {
        if (payload.eventType === "INSERT") {
          // Simply append — no duplicate guard needed because we no longer
          // do optimistic inserts in handleSave.
          setItems((prev) => [...prev, payload.new as any]);
        }
        if (payload.eventType === "UPDATE") {
          const row = payload.new as any;
          setItems((prev) => prev.map((a) => a.id === row.id ? row : a));
        }
        if (payload.eventType === "DELETE") {
          setItems((prev) => prev.filter((a) => a.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchActivities]);

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return null;
    const fileName = `${Date.now()}-${imageFile.name}`;
    const { error } = await supabase.storage.from("activities").upload(fileName, imageFile);
    if (error) { toast.error("Image upload failed: " + error.message); return null; }
    const { data } = supabase.storage.from("activities").getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleSave = async () => {
    if (!form.title) { toast.error("Title required"); return; }
    setSaving(true);

    let finalImageUrl: string | null = editId ? form.image_url || null : null;
    if (imageFile) {
      const uploaded = await uploadImage();
      if (!uploaded) { setSaving(false); return; }
      finalImageUrl = uploaded;
    }

    const payload = {
      title: form.title,
      description: form.description || null,
      event_date: form.event_date || null,
      location: form.location || null,
      image_url: finalImageUrl,
      display_order: Number(form.display_order) || 0,
    };

    if (editId) {
      const { error } = await supabase.from("activities").update(payload).eq("id", editId);
      if (error) { toast.error("Update failed: " + error.message); setSaving(false); return; }
      // ✅ Don't call setItems here — the realtime UPDATE event handles it
      toast.success("Activity updated");
    } else {
      const { error } = await supabase.from("activities").insert(payload);
      if (error) { toast.error("Create failed: " + error.message); setSaving(false); return; }
      // ✅ Don't call setItems here — the realtime INSERT event handles it
      toast.success("Activity created");
    }

    setForm(emptyForm);
    setEditId(null);
    setImageFile(null);
    setImagePreview(null);
    setDialogOpen(false);
    setSaving(false);
  };

  const handleEdit = (item: any) => {
    setForm({
      title: item.title,
      description: item.description || "",
      event_date: item.event_date ? item.event_date.split("T")[0] : "",
      location: item.location || "",
      image_url: item.image_url || "",
      display_order: item.display_order,
    });
    setImagePreview(item.image_url || null);
    setEditId(item.id);
    setDialogOpen(true);
  };

  const handleDelete = async (activity: any) => {
    setDeletingId(activity.id);
    const { error } = await supabase.from("activities").delete().eq("id", activity.id);
    if (error) {
      toast.error("Delete failed: " + error.message);
      setDeletingId(null);
      return;
    }
    // ✅ Don't call setItems here — the realtime DELETE event handles it
    toast.success("Activity permanently deleted");
    setDeletingId(null);
  };

  const filtered = items.filter((a) =>
    a.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      className="min-h-screen p-6 space-y-6 relative"
      style={{ background: "linear-gradient(135deg,#0f1117 0%,#141824 50%,#0f1117 100%)" }}
    >
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full opacity-10"
          style={{ background: "radial-gradient(circle,#6366f1,transparent 70%)" }}
        />
        <div
          className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full opacity-10"
          style={{ background: "radial-gradient(circle,#10b981,transparent 70%)" }}
        />
      </div>

      <DeleteModal
        activity={deleteModal}
        onClose={() => setDeleteModal(null)}
        onConfirm={handleDelete}
      />

      <ActivityFormModal
        open={dialogOpen}
        onOpenChange={(o: boolean) => {
          setDialogOpen(o);
          if (!o) { setForm(emptyForm); setEditId(null); setImageFile(null); setImagePreview(null); }
        }}
        form={form}
        setForm={setForm}
        editId={editId}
        imagePreview={imagePreview}
        setImageFile={setImageFile}
        setImagePreview={setImagePreview}
        onSave={handleSave}
        saving={saving}
      />

      {/* Header */}
      <div
        className="flex items-center justify-between relative z-10 opacity-0"
        style={{ animation: "fadeUp 0.5s ease forwards" }}
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            <span className="text-xs text-indigo-400 font-medium tracking-widest uppercase">Live</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Activities</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Manage all public activities · {items.length} total
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchActivities}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-slate-300 hover:text-white transition-all disabled:opacity-50"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
          <button
            onClick={() => setDialogOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white transition-all hover:bg-indigo-500"
            style={{ background: "#4f46e5", border: "1px solid rgba(99,102,241,0.4)" }}
          >
            <Plus size={14} /> Add Activity
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div
        className="grid sm:grid-cols-3 gap-4 relative z-10 opacity-0"
        style={{ animation: "fadeUp 0.5s ease 0.07s forwards" }}
      >
        {[
          { label: "Total Activities", value: items.length,                                                    color: "text-indigo-400",  bg: "bg-indigo-500/20"  },
          { label: "Upcoming",         value: items.filter(a => a.event_date && new Date(a.event_date) >= new Date()).length, color: "text-emerald-400", bg: "bg-emerald-500/20" },
          { label: "Past Events",      value: items.filter(a => a.event_date && new Date(a.event_date) < new Date()).length,  color: "text-amber-400",   bg: "bg-amber-500/20"   },
        ].map((s, i) => (
          <div
            key={s.label}
            className="rounded-2xl p-5 flex items-center gap-4"
            style={{ ...cardStyle, animationDelay: `${i * 0.07}s` }}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.bg} shrink-0`}>
              <span className={`text-lg font-bold ${s.color}`}>{s.value}</span>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-widest">{s.label}</p>
              <p className="text-2xl font-bold text-white">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div
        className="relative max-w-sm z-10 opacity-0"
        style={{ animation: "fadeUp 0.5s ease 0.2s forwards" }}
      >
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search activities..."
          className="w-full pl-9 pr-4 py-2 rounded-xl text-sm text-slate-200 placeholder-slate-600 outline-none focus:ring-1 focus:ring-indigo-500/50"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
        />
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-20 relative z-10">
          <RefreshCw size={24} className="animate-spin text-slate-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div
          className="text-center py-20 rounded-2xl relative z-10"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.08)" }}
        >
          <AlertCircle size={32} className="mx-auto mb-3 text-slate-600 opacity-40" />
          <p className="text-slate-500 text-sm">No activities found</p>
          <button
            onClick={() => setDialogOpen(true)}
            className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-indigo-300 mx-auto transition-all hover:bg-indigo-500/20"
            style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.25)" }}
          >
            <Plus size={14} /> Add your first activity
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 relative z-10">
          {filtered.map((a, i) => (
            <div
              key={a.id}
              className="rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.015] opacity-0"
              style={{
                ...cardStyle,
                animation: `fadeUp 0.35s ease ${i * 0.05}s forwards`,
              }}
            >
              {a.image_url ? (
                <img
                  src={a.image_url}
                  className="w-full h-44 object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              ) : (
                <div
                  className="w-full h-44 flex flex-col items-center justify-center gap-2"
                  style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <ImageOff size={28} className="text-slate-600 opacity-40" />
                  <p className="text-xs text-slate-600">No image</p>
                </div>
              )}

              <div className="p-4 space-y-3">
                <div>
                  <p className="font-semibold text-sm text-white leading-snug">{a.title}</p>
                  {a.description && (
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{a.description}</p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {a.event_date && (
                    <span
                      className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wide"
                      style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.25)", color: "#a5b4fc" }}
                    >
                      <Calendar size={9} />
                      {new Date(a.event_date).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  )}
                  {a.location && (
                    <span
                      className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wide"
                      style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)", color: "#6ee7b7" }}
                    >
                      <MapPin size={9} /> {a.location}
                    </span>
                  )}
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => handleEdit(a)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold text-indigo-300 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)" }}
                  >
                    <Pencil size={11} /> Edit
                  </button>
                  <button
                    onClick={() => setDeleteModal(a)}
                    disabled={deletingId === a.id}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold text-red-400 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                    style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)" }}
                  >
                    {deletingId === a.id
                      ? <><RefreshCw size={11} className="animate-spin" /> Deleting...</>
                      : <><Trash2 size={11} /> Delete</>
                    }
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
      `}</style>
    </div>
  );
};

export default ActivitiesManagementPage;
