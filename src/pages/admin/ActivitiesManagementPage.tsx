import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  AlertCircle,
  RefreshCw,
  Calendar,
  MapPin,
  ImageOff,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Activity {
  id: string;
  title: string;
  description: string | null;
  event_date: string | null;
  location: string | null;
  image_url: string | null;
  display_order: number;
  active: boolean;
}

interface FormState {
  title: string;
  description: string;
  event_date: string;
  location: string;
  image_url: string;
  display_order: number;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const cardStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.08)",
  backdropFilter: "blur(20px)",
  boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
};

const emptyForm: FormState = {
  title: "",
  description: "",
  event_date: "",
  location: "",
  image_url: "",
  display_order: 0,
};

// ── Helpers ───────────────────────────────────────────────────────────────────
/**
 * Parse a date string without UTC-shift.
 * new Date("2024-06-01") is UTC midnight → renders as May 31 in UTC+ zones.
 * Appending T00:00:00 forces local-time interpretation.
 */
function parseLocalDate(dateStr: string): Date {
  if (dateStr.includes("T") || dateStr.includes(" ")) return new Date(dateStr);
  return new Date(dateStr + "T00:00:00");
}

/**
 * Format a date string to a human-readable Philippine English string.
 */
function formatDate(dateStr: string): string {
  return parseLocalDate(dateStr).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Return today as a YYYY-MM-DD string in local time.
 * Used for upcoming/past comparisons so we compare dates, not datetimes,
 * avoiding events "today" from being miscounted depending on current time.
 */
function todayLocalISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Safely extract just the YYYY-MM-DD portion from any date string so it
 * works correctly in <input type="date"> regardless of timezone.
 */
function toDateInputValue(dateStr: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  return parseLocalDate(dateStr).toISOString().split("T")[0];
}

// ── Delete Confirm Modal ──────────────────────────────────────────────────────
interface DeleteModalProps {
  activity: Activity | null;
  onClose: () => void;
  onConfirm: (activity: Activity) => void;
}

function DeleteModal({ activity, onClose, onConfirm }: DeleteModalProps) {
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
            <p className="text-[11px] text-slate-400 font-normal mt-0.5">
              This action cannot be undone
            </p>
          </div>
        </DialogTitle>

        <div
          className="p-3 rounded-xl text-sm"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Activity</p>
          <p className="font-medium text-white">{activity.title}</p>
          {activity.event_date && (
            <p className="text-xs text-slate-400 mt-0.5">
              {formatDate(activity.event_date)}
            </p>
          )}
        </div>

        <div
          className="p-3.5 rounded-xl text-sm space-y-1"
          style={{
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.2)",
          }}
        >
          <p className="text-red-300 font-medium text-xs">This will permanently delete:</p>
          <ul className="text-slate-400 text-xs space-y-0.5 list-disc list-inside">
            <li>Activity record and all its data</li>
            <li>Associated image and description</li>
          </ul>
        </div>

        <div className="flex gap-2">
          <Button
            className="flex-1 bg-red-600 hover:bg-red-500 text-white gap-1.5 text-sm"
            onClick={() => {
              onConfirm(activity);
              onClose();
            }}
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
interface ActivityFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: FormState;
  setForm: (form: FormState) => void;
  editId: string | null;
  imagePreview: string | null;
  setImageFile: (file: File | null) => void;
  setImagePreview: (url: string | null) => void;
  onSave: () => void;
  saving: boolean;
}

function ActivityFormModal({
  open,
  onOpenChange,
  form,
  setForm,
  editId,
  imagePreview,
  setImageFile,
  setImagePreview,
  onSave,
  saving,
}: ActivityFormModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#111827] text-white border-white/10 max-w-md">
        <DialogTitle className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
            {editId ? (
              <Pencil size={14} className="text-indigo-400" />
            ) : (
              <Plus size={14} className="text-indigo-400" />
            )}
          </div>
          <div>
            <p className="text-sm font-semibold">
              {editId ? "Edit Activity" : "Add Activity"}
            </p>
            <p className="text-[11px] text-slate-400 font-normal mt-0.5">
              {editId ? "Update activity details" : "Create a new activity"}
            </p>
          </div>
        </DialogTitle>

        <div className="space-y-3 mt-1">
          {/* Title */}
          <div>
            <label className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">
              Title *
            </label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Enter title"
              className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-indigo-500/50"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">
              Description
            </label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Enter description"
              className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-slate-600 resize-none focus:border-indigo-500/50"
              rows={3}
            />
          </div>

          {/* Date + Location */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">
                Date
              </label>
              <Input
                type="date"
                value={form.event_date}
                onChange={(e) => setForm({ ...form, event_date: e.target.value })}
                className="mt-1 bg-white/5 border-white/10 text-white focus:border-indigo-500/50"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">
                Location
              </label>
              <Input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="Enter location"
                className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-indigo-500/50"
              />
            </div>
          </div>

          {/* Display Order */}
          <div>
            <label className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">
              Display Order
            </label>
            <Input
              type="number"
              value={form.display_order}
              onChange={(e) =>
                setForm({ ...form, display_order: Number(e.target.value) || 0 })
              }
              placeholder="0"
              className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-indigo-500/50"
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">
              Image
            </label>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                if (file) {
                  setImageFile(file);
                  setImagePreview(URL.createObjectURL(file));
                }
              }}
              className="mt-1 bg-white/5 border-white/10 text-white"
            />
            {imagePreview && (
              <img
                src={imagePreview}
                alt="Preview"
                className="mt-2 w-full h-32 object-cover rounded-xl"
                style={{ border: "1px solid rgba(255,255,255,0.1)" }}
              />
            )}
          </div>

          {/* Save Button */}
          <Button
            onClick={onSave}
            disabled={saving}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold mt-1"
          >
            {saving ? (
              <>
                <RefreshCw size={14} className="animate-spin mr-2" />
                Saving...
              </>
            ) : editId ? (
              "Update Activity"
            ) : (
              "Create Activity"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
const ActivitiesManagementPage = () => {
  const [items, setItems] = useState<Activity[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteModal, setDeleteModal] = useState<Activity | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ── Fetch ──
  const fetchActivities = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("activities")
      .select("*")
      .order("display_order");
    if (error) {
      toast.error("Failed to load: " + error.message);
      setLoading(false);
      return;
    }
    setItems((data as Activity[]) || []);
    setLoading(false);
  }, []);

  // ── Realtime subscription ──
  useEffect(() => {
    fetchActivities();

    const channel = supabase
      .channel("activities-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "activities" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setItems((prev) => [...prev, payload.new as Activity]);
          }
          if (payload.eventType === "UPDATE") {
            const row = payload.new as Activity;
            setItems((prev) => prev.map((a) => (a.id === row.id ? row : a)));
          }
          if (payload.eventType === "DELETE") {
            setItems((prev) => prev.filter((a) => a.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchActivities]);

  // ── Reset form helper ──
  const resetForm = () => {
    setForm(emptyForm);
    setEditId(null);
    setImageFile(null);
    setImagePreview(null);
  };

  // ── Image upload ──
  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return null;
    const ext = imageFile.name.split(".").pop();
    const fileName = `${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("activities")
      .upload(fileName, imageFile, { upsert: false });
    if (error) {
      toast.error("Image upload failed: " + error.message);
      return null;
    }
    const { data } = supabase.storage.from("activities").getPublicUrl(fileName);
    return data.publicUrl;
  };

  // ── Save (create / update) ──
  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    setSaving(true);

    // Determine final image URL
    let finalImageUrl: string | null = editId ? form.image_url || null : null;
    if (imageFile) {
      const uploaded = await uploadImage();
      if (!uploaded) {
        setSaving(false);
        return;
      }
      finalImageUrl = uploaded;
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      event_date: form.event_date || null,
      location: form.location.trim() || null,
      image_url: finalImageUrl,
      display_order: Number(form.display_order) || 0,
    };

    if (editId) {
      const { error } = await supabase
        .from("activities")
        .update(payload)
        .eq("id", editId);
      if (error) {
        toast.error("Update failed: " + error.message);
        setSaving(false);
        return;
      }
      toast.success("Activity updated");
    } else {
      const { error } = await supabase.from("activities").insert(payload);
      if (error) {
        toast.error("Create failed: " + error.message);
        setSaving(false);
        return;
      }
      toast.success("Activity created");
    }

    resetForm();
    setDialogOpen(false);
    setSaving(false);
  };

  // ── Edit ──
  const handleEdit = (item: Activity) => {
    setForm({
      title: item.title,
      description: item.description ?? "",
      event_date: item.event_date ? toDateInputValue(item.event_date) : "",
      location: item.location ?? "",
      image_url: item.image_url ?? "",
      display_order: item.display_order,
    });
    setImagePreview(item.image_url ?? null);
    setEditId(item.id);
    setDialogOpen(true);
  };

  // ── Delete ──
  const handleDelete = async (activity: Activity) => {
    setDeletingId(activity.id);
    const { error } = await supabase
      .from("activities")
      .delete()
      .eq("id", activity.id);
    if (error) {
      toast.error("Delete failed: " + error.message);
      setDeletingId(null);
      return;
    }
    toast.success("Activity permanently deleted");
    setDeletingId(null);
  };

  // ── Derived state ──
  const todayISO = todayLocalISO();
  const filtered = items.filter((a) =>
    a.title.toLowerCase().includes(search.toLowerCase())
  );

  const stats = [
    {
      label: "Total Activities",
      value: items.length,
      color: "text-indigo-400",
      bg: "bg-indigo-500/20",
    },
    {
      label: "Upcoming",
      value: items.filter(
        (a) => a.event_date && toDateInputValue(a.event_date) >= todayISO
      ).length,
      color: "text-emerald-400",
      bg: "bg-emerald-500/20",
    },
    {
      label: "Past Events",
      value: items.filter(
        (a) => a.event_date && toDateInputValue(a.event_date) < todayISO
      ).length,
      color: "text-amber-400",
      bg: "bg-amber-500/20",
    },
  ];

  // ── Render ──
  return (
    <div
      className="min-h-screen p-6 space-y-6 relative"
      style={{
        background:
          "linear-gradient(135deg,#0f1117 0%,#141824 50%,#0f1117 100%)",
      }}
    >
      {/* Background glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full opacity-10"
          style={{
            background: "radial-gradient(circle,#6366f1,transparent 70%)",
          }}
        />
        <div
          className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full opacity-10"
          style={{
            background: "radial-gradient(circle,#10b981,transparent 70%)",
          }}
        />
      </div>

      {/* Modals */}
      <DeleteModal
        activity={deleteModal}
        onClose={() => setDeleteModal(null)}
        onConfirm={handleDelete}
      />

      <ActivityFormModal
        open={dialogOpen}
        onOpenChange={(o) => {
          setDialogOpen(o);
          if (!o) resetForm();
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
            <span className="text-xs text-indigo-400 font-medium tracking-widest uppercase">
              Live
            </span>
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
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
          <button
            onClick={() => setDialogOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white transition-all hover:bg-indigo-500"
            style={{
              background: "#4f46e5",
              border: "1px solid rgba(99,102,241,0.4)",
            }}
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
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl p-5 flex items-center gap-4"
            style={cardStyle}
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.bg} shrink-0`}
            >
              <span className={`text-lg font-bold ${s.color}`}>{s.value}</span>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-widest">
                {s.label}
              </p>
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
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
        />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search activities..."
          className="w-full pl-9 pr-4 py-2 rounded-xl text-sm text-slate-200 placeholder-slate-600 outline-none focus:ring-1 focus:ring-indigo-500/50"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
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
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px dashed rgba(255,255,255,0.08)",
          }}
        >
          <AlertCircle
            size={32}
            className="mx-auto mb-3 text-slate-600 opacity-40"
          />
          <p className="text-slate-500 text-sm">No activities found</p>
          <button
            onClick={() => setDialogOpen(true)}
            className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-indigo-300 mx-auto transition-all hover:bg-indigo-500/20"
            style={{
              background: "rgba(99,102,241,0.1)",
              border: "1px solid rgba(99,102,241,0.25)",
            }}
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
              {/* Card image */}
              {a.image_url ? (
                <img
                  src={a.image_url}
                  alt={a.title}
                  className="w-full h-44 object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                <div
                  className="w-full h-44 flex flex-col items-center justify-center gap-2"
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <ImageOff size={28} className="text-slate-600 opacity-40" />
                  <p className="text-xs text-slate-600">No image</p>
                </div>
              )}

              <div className="p-4 space-y-3">
                <div>
                  <p className="font-semibold text-sm text-white leading-snug">
                    {a.title}
                  </p>
                  {a.description && (
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                      {a.description}
                    </p>
                  )}
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-2">
                  {a.event_date && (
                    <span
                      className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wide"
                      style={{
                        background: "rgba(99,102,241,0.15)",
                        border: "1px solid rgba(99,102,241,0.25)",
                        color: "#a5b4fc",
                      }}
                    >
                      <Calendar size={9} />
                      {formatDate(a.event_date)}
                    </span>
                  )}
                  {a.location && (
                    <span
                      className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wide"
                      style={{
                        background: "rgba(16,185,129,0.12)",
                        border: "1px solid rgba(16,185,129,0.25)",
                        color: "#6ee7b7",
                      }}
                    >
                      <MapPin size={9} /> {a.location}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => handleEdit(a)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold text-indigo-300 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    style={{
                      background: "rgba(99,102,241,0.12)",
                      border: "1px solid rgba(99,102,241,0.25)",
                    }}
                  >
                    <Pencil size={11} /> Edit
                  </button>
                  <button
                    onClick={() => setDeleteModal(a)}
                    disabled={deletingId === a.id}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold text-red-400 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                    style={{
                      background: "rgba(239,68,68,0.12)",
                      border: "1px solid rgba(239,68,68,0.25)",
                    }}
                  >
                    {deletingId === a.id ? (
                      <>
                        <RefreshCw size={11} className="animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 size={11} /> Delete
                      </>
                    )}
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
