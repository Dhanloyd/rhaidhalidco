import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Plus, Pencil, Trash2, Search, AlertCircle, RefreshCw, Upload, ImageOff, Users, ShirtIcon,
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

const emptyStats = { ppg: "", rpg: "", apg: "", spg: "", bpg: "", fgp: "", tpp: "", ftp: "" };
const emptyForm = { name: "", position: "", jersey_number: 0, bio: "", image_url: "", display_order: 0, stats: emptyStats };

// ── Stat Input ────────────────────────────────────────────────────────────────
const StatInput = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
  <div>
    <label className="text-[10px] text-slate-400 uppercase tracking-wider font-medium block mb-1">{label}</label>
    <Input
      type="number"
      step="0.1"
      min="0"
      placeholder="0.0"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="text-center bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-indigo-500/50"
    />
  </div>
);

// ── Delete Confirm Modal ──────────────────────────────────────────────────────
function DeleteModal({
  player,
  onClose,
  onConfirm,
}: {
  player: any | null;
  onClose: () => void;
  onConfirm: (p: any) => void;
}) {
  if (!player) return null;
  return (
    <Dialog open={!!player} onOpenChange={onClose}>
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
          <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Player</p>
          <p className="font-medium text-white">{player.name}</p>
          {player.position && (
            <p className="text-xs text-slate-400 mt-0.5">{player.position} · #{player.jersey_number}</p>
          )}
        </div>

        <div className="p-3.5 rounded-xl text-sm space-y-1" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <p className="text-red-300 font-medium text-xs">This will permanently delete:</p>
          <ul className="text-slate-400 text-xs space-y-0.5 list-disc list-inside">
            <li>Player profile and all data</li>
            <li>Season stats and photo</li>
          </ul>
        </div>

        <div className="flex gap-2">
          <Button
            className="flex-1 bg-red-600 hover:bg-red-500 text-white gap-1.5 text-sm"
            onClick={() => { onConfirm(player); onClose(); }}
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
function PlayerFormModal({
  open, onOpenChange, form, setForm, editId, uploading,
  onSave, saving, onUpload, fileRef,
}: any) {
  const setStat = (key: string, value: string) =>
    setForm((f: any) => ({ ...f, stats: { ...f.stats, [key]: value } }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#111827] text-white border-white/10 max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogTitle className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
            {editId
              ? <Pencil size={14} className="text-indigo-400" />
              : <Plus size={14} className="text-indigo-400" />}
          </div>
          <div>
            <p className="text-sm font-semibold">{editId ? "Edit Player" : "Add Player"}</p>
            <p className="text-[11px] text-slate-400 font-normal mt-0.5">
              {editId ? "Update player details" : "Create a new player profile"}
            </p>
          </div>
        </DialogTitle>

        <div className="space-y-4 mt-1">
          {/* Basic info */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Name *</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Player name" className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-indigo-500/50" />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Position</label>
              <Input value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })}
                placeholder="PG, SG, SF, PF, C" className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-indigo-500/50" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Jersey #</label>
              <Input type="number" value={form.jersey_number}
                onChange={(e) => setForm({ ...form, jersey_number: parseInt(e.target.value) || 0 })}
                className="mt-1 bg-white/5 border-white/10 text-white focus:border-indigo-500/50" />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Display Order</label>
              <Input type="number" value={form.display_order}
                onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value) || 0 })}
                className="mt-1 bg-white/5 border-white/10 text-white focus:border-indigo-500/50" />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Bio</label>
            <Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })}
              placeholder="Player bio..." rows={3}
              className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-slate-600 resize-none focus:border-indigo-500/50" />
          </div>

          {/* Photo */}
          <div>
            <label className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Photo</label>
            {form.image_url ? (
              <div className="relative mt-1">
                <img src={form.image_url} className="w-full h-36 object-cover rounded-xl" style={{ border: "1px solid rgba(255,255,255,0.1)" }} />
                <button
                  onClick={() => setForm({ ...form, image_url: "" })}
                  className="absolute top-2 right-2 px-2 py-1 rounded-lg text-xs font-bold text-red-400"
                  style={{ background: "rgba(239,68,68,0.2)", border: "1px solid rgba(239,68,68,0.3)" }}
                >
                  Remove
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="mt-1 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-slate-300 transition-all disabled:opacity-50"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                {uploading ? <><RefreshCw size={13} className="animate-spin" /> Uploading...</> : <><Upload size={13} /> Upload Photo</>}
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])} />
          </div>

          {/* Stats divider */}
          <div className="flex items-center gap-2">
            <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.08)" }} />
            <span className="text-[10px] text-slate-500 uppercase tracking-widest px-2">Season Stats</span>
            <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.08)" }} />
          </div>

          <div className="grid grid-cols-5 gap-3">
            <StatInput label="PPG" value={form.stats.ppg} onChange={(v) => setStat("ppg", v)} />
            <StatInput label="RPG" value={form.stats.rpg} onChange={(v) => setStat("rpg", v)} />
            <StatInput label="APG" value={form.stats.apg} onChange={(v) => setStat("apg", v)} />
            <StatInput label="SPG" value={form.stats.spg} onChange={(v) => setStat("spg", v)} />
            <StatInput label="BPG" value={form.stats.bpg} onChange={(v) => setStat("bpg", v)} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <StatInput label="FG %" value={form.stats.fgp} onChange={(v) => setStat("fgp", v)} />
            <StatInput label="3P %" value={form.stats.tpp} onChange={(v) => setStat("tpp", v)} />
            <StatInput label="FT %" value={form.stats.ftp} onChange={(v) => setStat("ftp", v)} />
          </div>

          <Button
            onClick={onSave}
            disabled={saving}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold mt-1"
          >
            {saving
              ? <><RefreshCw size={14} className="animate-spin mr-2" />Saving...</>
              : editId ? "Update Player" : "Create Player"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Stat Badge ────────────────────────────────────────────────────────────────
const StatBadge = ({ label, value }: { label: string; value: any }) => (
  <div className="flex flex-col items-center px-2 py-1.5 rounded-lg" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
    <span className="text-[9px] text-slate-500 uppercase tracking-widest">{label}</span>
    <span className="text-xs font-bold text-white mt-0.5">{value != null && value !== "" ? value : "—"}</span>
  </div>
);

// ── Main Page ─────────────────────────────────────────────────────────────────
const PlayersManagementPage = () => {
  const [players, setPlayers]           = useState<any[]>([]);
  const [form, setForm]                 = useState(emptyForm);
  const [editId, setEditId]             = useState<string | null>(null);
  const [dialogOpen, setDialogOpen]     = useState(false);
  const [search, setSearch]             = useState("");
  const [uploading, setUploading]       = useState(false);
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);
  const [deleteModal, setDeleteModal]   = useState<any>(null);
  const [deletingId, setDeletingId]     = useState<string | null>(null);
  const fileRef                         = useRef<HTMLInputElement>(null);

  const fetchPlayers = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("player_profiles")
      .select("*")
      .eq("is_deleted", false)
      .order("display_order");
    if (error) { toast.error("Failed to load: " + error.message); setLoading(false); return; }
    setPlayers(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPlayers();

    const channel = supabase
      .channel("players-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "player_profiles" }, (payload) => {
        if (payload.eventType === "INSERT") {
          setPlayers((prev) => [...prev, payload.new as any]);
        }
        if (payload.eventType === "UPDATE") {
          const row = payload.new as any;
          // if soft-deleted, remove from list
          if (row.is_deleted) {
            setPlayers((prev) => prev.filter((p) => p.id !== row.id));
          } else {
            setPlayers((prev) => prev.map((p) => p.id === row.id ? row : p));
          }
        }
        if (payload.eventType === "DELETE") {
          setPlayers((prev) => prev.filter((p) => p.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchPlayers]);

  const uploadImage = async (file: File) => {
    setUploading(true);
    const fileName = `players/${Date.now()}.${file.name.split(".").pop()}`;
    const { error } = await supabase.storage.from("product-images").upload(fileName, file);
    if (error) { toast.error("Upload failed: " + error.message); setUploading(false); return; }
    const { data } = supabase.storage.from("product-images").getPublicUrl(fileName);
    setForm((f) => ({ ...f, image_url: data.publicUrl }));
    setUploading(false);
  };

  const buildStatsPayload = () => {
    const s = form.stats;
    const obj: Record<string, number | null> = {};
    (["ppg", "rpg", "apg", "spg", "bpg", "fgp", "tpp", "ftp"] as (keyof typeof s)[])
      .forEach((k) => { obj[k] = s[k] !== "" ? parseFloat(s[k]) : null; });
    return obj;
  };

  const handleSave = async () => {
    if (!form.name) { toast.error("Name required"); return; }
    setSaving(true);

    const payload = {
      name: form.name,
      position: form.position || null,
      jersey_number: form.jersey_number || null,
      bio: form.bio || null,
      image_url: form.image_url || null,
      display_order: form.display_order,
      stats: buildStatsPayload(),
    };

    if (editId) {
      const { error } = await supabase.from("player_profiles").update(payload).eq("id", editId);
      if (error) { toast.error("Update failed: " + error.message); setSaving(false); return; }
      toast.success("Player updated");
    } else {
      const { error } = await supabase.from("player_profiles").insert(payload);
      if (error) { toast.error("Create failed: " + error.message); setSaving(false); return; }
      toast.success("Player created");
    }

    setForm(emptyForm); setEditId(null); setDialogOpen(false); setSaving(false);
  };

  const handleEdit = (p: any) => {
    const s = p.stats || {};
    setForm({
      name: p.name, position: p.position || "", jersey_number: p.jersey_number || 0,
      bio: p.bio || "", image_url: p.image_url || "", display_order: p.display_order,
      stats: { ppg: s.ppg ?? "", rpg: s.rpg ?? "", apg: s.apg ?? "", spg: s.spg ?? "",
               bpg: s.bpg ?? "", fgp: s.fgp ?? "", tpp: s.tpp ?? "", ftp: s.ftp ?? "" },
    });
    setEditId(p.id);
    setDialogOpen(true);
  };

  const handleDelete = async (player: any) => {
    setDeletingId(player.id);
    const { error } = await supabase.from("player_profiles").update({ is_deleted: true }).eq("id", player.id);
    if (error) {
      toast.error("Delete failed: " + error.message);
      setDeletingId(null);
      return;
    }
    toast.success("Player removed");
    setDeletingId(null);
  };

  const positions = [...new Set(players.map((p) => p.position).filter(Boolean))];
  const filtered = players.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div
      className="min-h-screen p-6 space-y-6 relative"
      style={{ background: "linear-gradient(135deg,#0f1117 0%,#141824 50%,#0f1117 100%)" }}
    >
      {/* Background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full opacity-10"
          style={{ background: "radial-gradient(circle,#6366f1,transparent 70%)" }} />
        <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full opacity-10"
          style={{ background: "radial-gradient(circle,#10b981,transparent 70%)" }} />
      </div>

      <DeleteModal
        player={deleteModal}
        onClose={() => setDeleteModal(null)}
        onConfirm={handleDelete}
      />

      <PlayerFormModal
        open={dialogOpen}
        onOpenChange={(o: boolean) => {
          setDialogOpen(o);
          if (!o) { setForm(emptyForm); setEditId(null); }
        }}
        form={form}
        setForm={setForm}
        editId={editId}
        uploading={uploading}
        onSave={handleSave}
        saving={saving}
        onUpload={uploadImage}
        fileRef={fileRef}
      />

      {/* Header */}
      <div className="flex items-center justify-between relative z-10 opacity-0" style={{ animation: "fadeUp 0.5s ease forwards" }}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            <span className="text-xs text-indigo-400 font-medium tracking-widest uppercase">Live</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Players</h1>
          <p className="text-sm text-slate-400 mt-0.5">Manage all player profiles · {players.length} total</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchPlayers}
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
            <Plus size={14} /> Add Player
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid sm:grid-cols-3 gap-4 relative z-10 opacity-0" style={{ animation: "fadeUp 0.5s ease 0.07s forwards" }}>
        {[
          { label: "Total Players",  value: players.length,                                          color: "text-indigo-400",  bg: "bg-indigo-500/20"  },
          { label: "Positions",      value: positions.length,                                        color: "text-emerald-400", bg: "bg-emerald-500/20" },
          { label: "Avg PPG",        value: (() => { const vals = players.map(p => p.stats?.ppg).filter(v => v != null); return vals.length ? (vals.reduce((a: number, b: number) => a + b, 0) / vals.length).toFixed(1) : "—"; })(), color: "text-amber-400", bg: "bg-amber-500/20" },
        ].map((s, i) => (
          <div key={s.label} className="rounded-2xl p-5 flex items-center gap-4" style={{ ...cardStyle, animationDelay: `${i * 0.07}s` }}>
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
      <div className="relative max-w-sm z-10 opacity-0" style={{ animation: "fadeUp 0.5s ease 0.2s forwards" }}>
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search players..."
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
        <div className="text-center py-20 rounded-2xl relative z-10"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.08)" }}>
          <Users size={32} className="mx-auto mb-3 text-slate-600 opacity-40" />
          <p className="text-slate-500 text-sm">No players found</p>
          <button
            onClick={() => setDialogOpen(true)}
            className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-indigo-300 mx-auto transition-all hover:bg-indigo-500/20"
            style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.25)" }}
          >
            <Plus size={14} /> Add your first player
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 relative z-10">
          {filtered.map((p, i) => {
            const s = p.stats || {};
            return (
              <div
                key={p.id}
                className="rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.015] opacity-0"
                style={{ ...cardStyle, animation: `fadeUp 0.35s ease ${i * 0.05}s forwards` }}
              >
                {/* Photo */}
                {p.image_url ? (
                  <img src={p.image_url} className="w-full h-44 object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                ) : (
                  <div className="w-full h-44 flex flex-col items-center justify-center gap-2"
                    style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <ImageOff size={28} className="text-slate-600 opacity-40" />
                    <p className="text-xs text-slate-600">No photo</p>
                  </div>
                )}

                <div className="p-4 space-y-3">
                  {/* Name + badges */}
                  <div>
                    <p className="font-semibold text-sm text-white leading-snug">{p.name}</p>
                    {p.bio && <p className="text-xs text-slate-400 mt-1 line-clamp-2">{p.bio}</p>}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {p.position && (
                      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wide"
                        style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.25)", color: "#a5b4fc" }}>
                        {p.position}
                      </span>
                    )}
                    {p.jersey_number != null && (
                      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wide"
                        style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)", color: "#6ee7b7" }}>
                        <ShirtIcon size={9} /> #{p.jersey_number}
                      </span>
                    )}
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-5 gap-1.5">
                    <StatBadge label="PPG" value={s.ppg} />
                    <StatBadge label="RPG" value={s.rpg} />
                    <StatBadge label="APG" value={s.apg} />
                    <StatBadge label="SPG" value={s.spg} />
                    <StatBadge label="BPG" value={s.bpg} />
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    <StatBadge label="FG%" value={s.fgp != null && s.fgp !== "" ? `${s.fgp}%` : null} />
                    <StatBadge label="3P%" value={s.tpp != null && s.tpp !== "" ? `${s.tpp}%` : null} />
                    <StatBadge label="FT%" value={s.ftp != null && s.ftp !== "" ? `${s.ftp}%` : null} />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => handleEdit(p)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold text-indigo-300 transition-all hover:scale-[1.02] active:scale-[0.98]"
                      style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)" }}
                    >
                      <Pencil size={11} /> Edit
                    </button>
                    <button
                      onClick={() => setDeleteModal(p)}
                      disabled={deletingId === p.id}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold text-red-400 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                      style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)" }}
                    >
                      {deletingId === p.id
                        ? <><RefreshCw size={11} className="animate-spin" /> Removing...</>
                        : <><Trash2 size={11} /> Remove</>}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
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

export default PlayersManagementPage;