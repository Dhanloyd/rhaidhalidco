import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search } from "lucide-react";

const emptyForm = {
  title: "",
  description: "",
  event_date: "",
  location: "",
  image_url: "",
  display_order: 0
};

const ActivitiesManagementPage = () => {
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null); // ✅ separate preview state
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    const { data } = await supabase
      .from("activities")
      .select("*")
      .order("display_order");
    setItems(data || []);
    setLoading(false);
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return null;

    // ✅ No "activities/" prefix — bucket name is already set in .from()
    const fileName = `${Date.now()}-${imageFile.name}`;

    const { error } = await supabase.storage
      .from("activities")
      .upload(fileName, imageFile);

    if (error) {
      toast.error("Image upload failed: " + error.message);
      return null;
    }

    const { data } = supabase.storage
      .from("activities")
      .getPublicUrl(fileName);

    return data.publicUrl;
  };

  const handleSave = async () => {
    if (!form.title) {
      toast.error("Title required");
      return;
    }

    // ✅ Only upload if a new file was selected
    let finalImageUrl: string | null = editId ? form.image_url || null : null;

    if (imageFile) {
      const uploaded = await uploadImage();
      if (!uploaded) return; // stop if upload failed
      finalImageUrl = uploaded;
    }

    const payload = {
      title: form.title,
      description: form.description || null,
      event_date: form.event_date || null,
      location: form.location || null,
      image_url: finalImageUrl, // ✅ always a real public URL, never a blob
      display_order: form.display_order,
    };

    if (editId) {
      const { error } = await supabase
        .from("activities")
        .update(payload)
        .eq("id", editId);

      if (error) { toast.error("Update failed"); return; }
      toast.success("Activity updated");
    } else {
      const { error } = await supabase
        .from("activities")
        .insert(payload);

      if (error) { toast.error("Create failed"); return; }
      toast.success("Activity created");
    }

    setForm(emptyForm);
    setEditId(null);
    setImageFile(null);
    setImagePreview(null);
    setDialogOpen(false);
    fetchActivities();
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
    setImagePreview(item.image_url || null); // ✅ show existing image as preview
    setEditId(item.id);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("activities")
      .delete()
      .eq("id", id);

    if (error) { toast.error("Delete failed"); return; }
    toast.success("Deleted");
    fetchActivities();
  };

  const filtered = items.filter((a) =>
    a.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading">Activities</h1>

        <Dialog
          open={dialogOpen}
          onOpenChange={(o) => {
            setDialogOpen(o);
            if (!o) {
              setForm(emptyForm);
              setEditId(null);
              setImageFile(null);
              setImagePreview(null);
            }
          }}
        >
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus size={16} />
              Add Activity
            </Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editId ? "Edit Activity" : "Add Activity"}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              <div>
                <label>Title *</label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>

              <div>
                <label>Description</label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label>Date</label>
                  <Input
                    type="date"
                    value={form.event_date}
                    onChange={(e) => setForm({ ...form, event_date: e.target.value })}
                  />
                </div>
                <div>
                  <label>Location</label>
                  <Input
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label>Upload Image</label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setImageFile(file);
                      // ✅ blob URL only for preview, never saved to DB
                      setImagePreview(URL.createObjectURL(file));
                    }
                  }}
                />
                {/* ✅ preview uses separate state, not form.image_url */}
                {imagePreview && (
                  <img
                    src={imagePreview}
                    className="mt-2 w-full h-32 object-cover rounded"
                  />
                )}
              </div>

              <Button onClick={handleSave} className="w-full">
                {editId ? "Update" : "Create"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" />
        <Input
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">No activities</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Image</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>
                      {a.image_url ? (
                        <img
                          src={a.image_url}
                          className="w-12 h-12 rounded object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      ) : "—"}
                    </TableCell>
                    <TableCell>{a.title}</TableCell>
                    <TableCell>
                      {a.event_date
                        ? new Date(a.event_date).toLocaleDateString()
                        : "—"}
                    </TableCell>
                    <TableCell>{a.location || "—"}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(a)}>
                          <Pencil size={14} />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(a.id)}>
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ActivitiesManagementPage;