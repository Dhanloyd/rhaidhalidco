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
  image_url: "",
  link_url: "",
  display_order: 0,
  active: true
};

const HighlightsPage = () => {

  const [highlights, setHighlights] = useState<any[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    fetchHighlights();
  }, []);

  const fetchHighlights = async () => {
    const { data } = await supabase
      .from("highlights")
      .select("*")
      .order("display_order");

    setHighlights(data || []);
    setLoading(false);
  };

  const uploadImage = async () => {

    if (!imageFile) return form.image_url;

    const fileName = `${Date.now()}-${imageFile.name}`;

    const { error } = await supabase.storage
      .from("highlights")
      .upload(fileName, imageFile);

    if (error) {
      toast.error("Image upload failed");
      return null;
    }

    const { data } = supabase.storage
      .from("highlights")
      .getPublicUrl(fileName);

    return data.publicUrl;
  };

  const handleSave = async () => {

    if (!form.title) {
      toast.error("Title required");
      return;
    }

    const imageUrl = await uploadImage();

    const payload = {

      title: form.title,
      description: form.description || null,
      image_url: imageUrl || form.image_url || null,
      link_url: form.link_url || null,
      display_order: form.display_order,
      active: form.active

    };

    if (editId) {

      const { error } = await supabase
        .from("highlights")
        .update(payload)
        .eq("id", editId);

      if (error) {
        toast.error("Update failed");
        return;
      }

      toast.success("Highlight updated");

    } else {

      const { error } = await supabase
        .from("highlights")
        .insert(payload);

      if (error) {
        toast.error("Create failed");
        return;
      }

      toast.success("Highlight created");

    }

    setForm(emptyForm);
    setEditId(null);
    setImageFile(null);
    setDialogOpen(false);

    fetchHighlights();
  };

  const handleEdit = (item: any) => {

    setForm({
      title: item.title,
      description: item.description || "",
      image_url: item.image_url || "",
      link_url: item.link_url || "",
      display_order: item.display_order,
      active: item.active
    });

    setEditId(item.id);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {

    const { error } = await supabase
      .from("highlights")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Delete failed");
      return;
    }

    toast.success("Deleted");

    fetchHighlights();
  };

  const filtered = highlights.filter((h) =>
    h.title.toLowerCase().includes(search.toLowerCase())
  );

  return (

    <div className="space-y-6">

      <div className="flex items-center justify-between flex-wrap gap-4">

        <h1 className="font-heading text-2xl uppercase tracking-wider">
          Highlights
        </h1>

        <Dialog
          open={dialogOpen}
          onOpenChange={(o) => {

            setDialogOpen(o);

            if (!o) {
              setForm(emptyForm);
              setEditId(null);
              setImageFile(null);
            }

          }}
        >

          <DialogTrigger asChild>

            <Button className="gap-2 bg-primary text-primary-foreground">

              <Plus size={16} />

              Add Highlight

            </Button>

          </DialogTrigger>

          <DialogContent className="max-w-lg">

            <DialogHeader>

              <DialogTitle>

                {editId ? "Edit Highlight" : "New Highlight"}

              </DialogTitle>

            </DialogHeader>

            <div className="space-y-4 mt-4">

              <div>

                <label>Title *</label>

                <Input
                  value={form.title}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      title: e.target.value
                    })
                  }
                />

              </div>

              <div>

                <label>Description</label>

                <Textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      description: e.target.value
                    })
                  }
                />

              </div>

              <div>

                <label>Upload Image</label>

                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {

                    if (e.target.files?.[0]) {

                      setImageFile(e.target.files[0]);

                      setForm({
                        ...form,
                        image_url: URL.createObjectURL(
                          e.target.files[0]
                        )
                      });

                    }

                  }}
                />

                {form.image_url && (

                  <img
                    src={form.image_url}
                    className="mt-2 w-40 rounded"
                  />

                )}

              </div>

              <div className="grid grid-cols-2 gap-4">

                <div>

                  <label>Link URL</label>

                  <Input
                    value={form.link_url}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        link_url: e.target.value
                      })
                    }
                  />

                </div>

                <div>

                  <label>Display Order</label>

                  <Input
                    type="number"
                    value={form.display_order}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        display_order:
                          parseInt(e.target.value) || 0
                      })
                    }
                  />

                </div>

              </div>

              <label className="flex gap-2">

                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      active: e.target.checked
                    })
                  }
                />

                Active

              </label>

              <Button
                onClick={handleSave}
                className="w-full bg-primary"
              >

                {editId ? "Update" : "Create"}

              </Button>

            </div>

          </DialogContent>

        </Dialog>

      </div>

      <div className="relative max-w-md">

        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2"
        />

        <Input
          placeholder="Search..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          className="pl-10"
        />

      </div>

      <Card>

        <CardContent className="pt-6">

          {loading ? (

            <div className="flex justify-center py-12">

              <div className="animate-spin h-8 w-8 border-b-2 border-primary"/>

            </div>

          ) : filtered.length === 0 ? (

            <div className="text-center py-12">
              No highlights
            </div>

          ) : (

            <div className="overflow-x-auto">

              <Table>

                <TableHeader>

                  <TableRow>

                    <TableHead>Title</TableHead>

                    <TableHead>Image</TableHead>

                    <TableHead>Order</TableHead>

                    <TableHead>Status</TableHead>

                    <TableHead>Actions</TableHead>

                  </TableRow>

                </TableHeader>

                <TableBody>

                  {filtered.map((item) => (

                    <TableRow key={item.id}>

                      <TableCell>

                        {item.title}

                      </TableCell>

                      <TableCell>

                        {item.image_url && (

                          <img
                            src={item.image_url}
                            className="w-14 h-10 object-cover rounded"
                          />

                        )}

                      </TableCell>

                      <TableCell>

                        {item.display_order}

                      </TableCell>

                      <TableCell>

                        {item.active
                          ? "Active"
                          : "Inactive"}

                      </TableCell>

                      <TableCell>

                        <div className="flex gap-1">

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              handleEdit(item)
                            }
                          >

                            <Pencil size={14}/>

                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              handleDelete(item.id)
                            }
                          >

                            <Trash2 size={14}/>

                          </Button>

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

export default HighlightsPage;