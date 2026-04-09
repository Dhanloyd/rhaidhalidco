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

const emptyForm = {
  title:"",
  content:"",
  excerpt:"",
  image_url:"",
  published:false
};

const NewsManagementPage = () => {

  const [news,setNews] = useState<any[]>([]);
  const [form,setForm] = useState(emptyForm);
  const [editId,setEditId] = useState<string | null>(null);
  const [dialogOpen,setDialogOpen] = useState(false);
  const [search,setSearch] = useState("");
  const [loading,setLoading] = useState(true);
  const [imageFile,setImageFile] = useState<File | null>(null);

  useEffect(()=>{

    fetchNews();

  },[]);

  const fetchNews = async ()=>{

    const { data } =
    await supabase
    .from("news")
    .select("*")
    .order("created_at",{ascending:false});

    setNews(data || []);

    setLoading(false);

  };

  const uploadImage = async ()=>{

    if(!imageFile)
    return form.image_url;

    const fileName =
    `news/${Date.now()}-${imageFile.name}`;

    const { error } =
    await supabase.storage
    .from("news")
    .upload(fileName,imageFile);

    if(error){

      toast.error("Image upload failed");

      return null;

    }

    const { data } =
    supabase.storage
    .from("news")
    .getPublicUrl(fileName);

    return data.publicUrl;

  };

  const handleSave = async ()=>{

    if(!form.title){

      toast.error("Title required");

      return;

    }

    const imageUrl =
    await uploadImage();

    const payload = {

      title:form.title,
      content:form.content || null,
      excerpt:form.excerpt || null,
      image_url:
      imageUrl ||
      form.image_url ||
      null,
      published:form.published

    };

    if(editId){

      const { error } =
      await supabase
      .from("news")
      .update(payload)
      .eq("id",editId);

      if(error){

        toast.error("Update failed");

        return;

      }

      toast.success("News updated");

    }
    else{

      const { error } =
      await supabase
      .from("news")
      .insert(payload);

      if(error){

        toast.error("Create failed");

        return;

      }

      toast.success("News created");

    }

    setForm(emptyForm);
    setEditId(null);
    setImageFile(null);
    setDialogOpen(false);

    fetchNews();

  };

  const handleEdit = (item:any)=>{

    setForm({

      title:item.title,
      content:item.content || "",
      excerpt:item.excerpt || "",
      image_url:item.image_url || "",
      published:item.published

    });

    setEditId(item.id);

    setDialogOpen(true);

  };

  const handleDelete = async(id:string)=>{

    const { error } =
    await supabase
    .from("news")
    .delete()
    .eq("id",id);

    if(error){

      toast.error("Delete failed");

      return;

    }

    toast.success("News deleted");

    fetchNews();

  };

  const togglePublish = async(
    id:string,
    published:boolean
  )=>{

    await supabase
    .from("news")
    .update({
      published:!published
    })
    .eq("id",id);

    fetchNews();

  };

  const filtered =
  news.filter((n)=>
  n.title
  .toLowerCase()
  .includes(search.toLowerCase())
  );

  return(

    <div className="space-y-6">

      <div className="flex items-center justify-between">

        <h1 className="text-2xl font-heading">

          News Management

        </h1>

        <Dialog
        open={dialogOpen}
        onOpenChange={(o)=>{

          setDialogOpen(o);

          if(!o){

            setForm(emptyForm);

            setEditId(null);

            setImageFile(null);

          }

        }}>

        <DialogTrigger asChild>

          <Button className="gap-2">

            <Plus size={16}/>

            Add News

          </Button>

        </DialogTrigger>

        <DialogContent className="max-w-lg">

          <DialogHeader>

            <DialogTitle>

              {editId ?
              "Edit News":
              "New News"}

            </DialogTitle>

          </DialogHeader>

          <div className="space-y-4 mt-4">

            <div>

              <label>Title *</label>

              <Input
              value={form.title}
              onChange={(e)=>
              setForm({
                ...form,
                title:e.target.value
              })}
              />

            </div>

            <div>

              <label>Excerpt</label>

              <Input
              value={form.excerpt}
              onChange={(e)=>
              setForm({
                ...form,
                excerpt:e.target.value
              })}
              />

            </div>

            <div>

              <label>Content</label>

              <Textarea
              rows={5}
              value={form.content}
              onChange={(e)=>
              setForm({
                ...form,
                content:e.target.value
              })}
              />

            </div>

            <div>

              <label>Upload Image</label>

              <Input
              type="file"
              accept="image/*"
              onChange={(e)=>{

                if(e.target.files?.[0]){

                  setImageFile(
                    e.target.files[0]
                  );

                  setForm({

                    ...form,

                    image_url:
                    URL.createObjectURL(
                      e.target.files[0]
                    )

                  });

                }

              }}
              />

              {form.image_url &&(

                <img
                src={form.image_url}
                className="mt-2 w-full h-32 object-cover rounded"
                />

              )}

            </div>

            <label className="flex gap-2">

              <input
              type="checkbox"
              checked={form.published}
              onChange={(e)=>
              setForm({
                ...form,
                published:e.target.checked
              })}
              />

              Published

            </label>

            <Button
            onClick={handleSave}
            className="w-full">

              {editId ?
              "Update":
              "Create"}

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
        placeholder="Search news..."
        value={search}
        onChange={(e)=>
        setSearch(e.target.value)
        }
        className="pl-10"
        />

      </div>

      <Card>

        <CardContent className="pt-6">

          {loading ?

          <div className="flex justify-center py-12">

            <div className="animate-spin h-8 w-8 border-b-2 border-primary"/>

          </div>

          :

          filtered.length===0 ?

          <div className="text-center py-12">

            No news

          </div>

          :

          <Table>

            <TableHeader>

              <TableRow>

                <TableHead>Title</TableHead>

                <TableHead>Excerpt</TableHead>

                <TableHead>Status</TableHead>

                <TableHead>Date</TableHead>

                <TableHead>Actions</TableHead>

              </TableRow>

            </TableHeader>

            <TableBody>

              {filtered.map((item)=>(

                <TableRow key={item.id}>

                  <TableCell>

                    {item.title}

                  </TableCell>

                  <TableCell className="max-w-[200px] truncate">

                    {item.excerpt}

                  </TableCell>

                  <TableCell>

                    {item.published ?
                    "Published":
                    "Draft"}

                  </TableCell>

                  <TableCell>

                    {new Date(
                      item.created_at
                    ).toLocaleDateString()}

                  </TableCell>

                  <TableCell>

                    <div className="flex gap-1">

                      <Button
                      variant="ghost"
                      size="icon"
                      onClick={()=>
                      togglePublish(
                        item.id,
                        item.published
                      )}>

                        {item.published ?
                        <EyeOff size={14}/> :
                        <Eye size={14}/>}

                      </Button>

                      <Button
                      variant="ghost"
                      size="icon"
                      onClick={()=>
                      handleEdit(item)}>

                        <Pencil size={14}/>

                      </Button>

                      <Button
                      variant="ghost"
                      size="icon"
                      onClick={()=>
                      handleDelete(item.id)}>

                        <Trash2 size={14}/>

                      </Button>

                    </div>

                  </TableCell>

                </TableRow>

              ))}

            </TableBody>

          </Table>

          }

        </CardContent>

      </Card>

    </div>

  );

};

export default NewsManagementPage;