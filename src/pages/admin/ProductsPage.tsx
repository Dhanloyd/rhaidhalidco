import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search, Upload, Image as ImageIcon, Package, AlertTriangle, CheckCircle2, Layers } from "lucide-react";
import { categoryLabels } from "@/data/products";

// ─── Constants ────────────────────────────────────────────────────────────────

const categories = Object.entries(categoryLabels);

const ALL_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "XXXL", "Free Size",
  "EU 35", "EU 36", "EU 37", "EU 38", "EU 39", "EU 40", "EU 41", "EU 42", "EU 43", "EU 44", "EU 45",
  "US 4", "US 5", "US 6", "US 7", "US 8", "US 9", "US 10", "US 11", "US 12",
];

const APPAREL_SIZES   = ["XS", "S", "M", "L", "XL", "XXL", "XXXL", "Free Size"];
const SHOE_SIZES_EU   = ["EU 35","EU 36","EU 37","EU 38","EU 39","EU 40","EU 41","EU 42","EU 43","EU 44","EU 45"];
const SHOE_SIZES_US   = ["US 4","US 5","US 6","US 7","US 8","US 9","US 10","US 11","US 12"];

// Shoe/sock categories that use shoe sizing
const SHOE_CATEGORIES = ["shoes", "footwear", "sneakers", "sandals", "slippers", "socks"];

// ─── Types ────────────────────────────────────────────────────────────────────

interface SizeStock {
  size: string;
  stock: number;
}

interface ProductColor {
  name: string;
  hex: string;
}

const emptyForm = {
  name: "", description: "", price: 0, cost_price: 0, discount_price: null as number | null,
  sku: "", barcode: "", brand: "", category: "fashion-apparel",
  image_url: "", badge: "", in_stock: true,
  stock_quantity: 0, low_stock_threshold: 10, status: "active",
  available_sizes: [] as string[],
  size_inventory: [] as SizeStock[],   // ← NEW: per-size stock
  colors: [] as ProductColor[],        // ← NEW: color options
};

// ─── Color presets ────────────────────────────────────────────────────────────

const COLOR_PRESETS: ProductColor[] = [
  { name: "Black",  hex: "#0a0d14" },
  { name: "White",  hex: "#f5f5f5" },
  { name: "Blue",   hex: "#1a56db" },
  { name: "Red",    hex: "#ef4444" },
  { name: "Gold",   hex: "#f59e0b" },
  { name: "Navy",   hex: "#1e3a5f" },
  { name: "Green",  hex: "#16a34a" },
  { name: "Gray",   hex: "#6b7280" },
  { name: "Orange", hex: "#ea580c" },
  { name: "Pink",   hex: "#ec4899" },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Editable per-size stock table */
const SizeInventoryEditor = ({
  sizeInventory,
  onChange,
  category,
}: {
  sizeInventory: SizeStock[];
  onChange: (inv: SizeStock[]) => void;
  category: string;
}) => {
  const isShoe = SHOE_CATEGORIES.some((c) => category.toLowerCase().includes(c));
  const sizeGroups = isShoe
    ? [{ label: "EU Sizes", sizes: SHOE_SIZES_EU }, { label: "US Sizes", sizes: SHOE_SIZES_US }, { label: "Apparel", sizes: APPAREL_SIZES }]
    : [{ label: "Apparel Sizes", sizes: APPAREL_SIZES }, { label: "Shoe Sizes (EU)", sizes: SHOE_SIZES_EU }, { label: "Shoe Sizes (US)", sizes: SHOE_SIZES_US }];

  const getStock = (size: string) =>
    sizeInventory.find((s) => s.size === size)?.stock ?? 0;

  const setStock = (size: string, stock: number) => {
    const existing = sizeInventory.find((s) => s.size === size);
    if (existing) {
      onChange(sizeInventory.map((s) => (s.size === size ? { ...s, stock } : s)));
    } else if (stock > 0) {
      onChange([...sizeInventory, { size, stock }]);
    }
  };

  const isActive = (size: string) => sizeInventory.some((s) => s.size === size);

  const toggleSize = (size: string) => {
    if (isActive(size)) {
      onChange(sizeInventory.filter((s) => s.size !== size));
    } else {
      onChange([...sizeInventory, { size, stock: 0 }]);
    }
  };

  const totalStock = sizeInventory.reduce((sum, s) => sum + s.stock, 0);

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 border border-blue-100">
        <Layers size={16} className="text-blue-600 shrink-0" />
        <div className="flex-1 text-sm">
          <span className="font-semibold text-blue-800">{sizeInventory.length} sizes active</span>
          <span className="text-blue-600 ml-2">·</span>
          <span className="text-blue-600 ml-2">{totalStock} total units</span>
        </div>
        {sizeInventory.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-xs text-blue-500 hover:text-red-500 underline underline-offset-2 transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {sizeGroups.map((group) => (
        <div key={group.label}>
          <p className="text-xs font-bold tracking-wider uppercase text-muted-foreground mb-2">
            {group.label}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {group.sizes.map((size) => {
              const active = isActive(size);
              const stock = getStock(size);
              const lowStock = active && stock > 0 && stock <= 5;
              const outOfStock = active && stock === 0;

              return (
                <div
                  key={size}
                  className={`relative rounded-lg border transition-all ${
                    active
                      ? outOfStock
                        ? "border-red-200 bg-red-50"
                        : lowStock
                        ? "border-amber-200 bg-amber-50"
                        : "border-green-200 bg-green-50"
                      : "border-border bg-background opacity-50"
                  }`}
                >
                  {/* Toggle checkbox */}
                  <div className="flex items-center gap-2 p-2 pb-1">
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={() => toggleSize(size)}
                      className="rounded accent-blue-600 w-3.5 h-3.5 cursor-pointer"
                    />
                    <span className="text-xs font-semibold text-foreground truncate">{size}</span>
                    {active && (
                      <span className="ml-auto">
                        {outOfStock ? (
                          <AlertTriangle size={11} className="text-red-500" />
                        ) : lowStock ? (
                          <AlertTriangle size={11} className="text-amber-500" />
                        ) : (
                          <CheckCircle2 size={11} className="text-green-500" />
                        )}
                      </span>
                    )}
                  </div>

                  {/* Stock input */}
                  {active && (
                    <div className="px-2 pb-2">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setStock(size, Math.max(0, stock - 1))}
                          className="w-6 h-6 rounded border border-border bg-background text-muted-foreground hover:text-foreground flex items-center justify-center text-sm leading-none transition-colors"
                        >−</button>
                        <input
                          type="number"
                          min={0}
                          value={stock}
                          onChange={(e) => setStock(size, Math.max(0, parseInt(e.target.value) || 0))}
                          className="flex-1 min-w-0 h-6 text-center text-xs font-semibold border border-border rounded bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-blue-400"
                        />
                        <button
                          type="button"
                          onClick={() => setStock(size, stock + 1)}
                          className="w-6 h-6 rounded border border-border bg-background text-muted-foreground hover:text-foreground flex items-center justify-center text-sm leading-none transition-colors"
                        >+</button>
                      </div>
                      <p className="text-[9px] text-center mt-0.5 text-muted-foreground">units</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

/** Color selector */
const ColorSelector = ({
  colors,
  onChange,
}: {
  colors: ProductColor[];
  onChange: (colors: ProductColor[]) => void;
}) => {
  const [customName, setCustomName] = useState("");
  const [customHex, setCustomHex] = useState("#000000");

  const isSelected = (name: string) => colors.some((c) => c.name === name);

  const togglePreset = (color: ProductColor) => {
    if (isSelected(color.name)) {
      onChange(colors.filter((c) => c.name !== color.name));
    } else {
      onChange([...colors, color]);
    }
  };

  const addCustom = () => {
    if (!customName.trim()) return;
    if (isSelected(customName.trim())) { toast.error("Color already added"); return; }
    onChange([...colors, { name: customName.trim(), hex: customHex }]);
    setCustomName("");
  };

  return (
    <div className="space-y-3">
      {/* Preset swatches */}
      <div className="flex flex-wrap gap-2">
        {COLOR_PRESETS.map((color) => (
          <button
            key={color.name}
            type="button"
            title={color.name}
            onClick={() => togglePreset(color)}
            className={`w-7 h-7 rounded-full border-2 transition-all ${
              isSelected(color.name) ? "border-foreground scale-110 ring-2 ring-offset-1 ring-foreground" : "border-transparent hover:scale-105"
            } ${color.name === "White" ? "border-border" : ""}`}
            style={{ background: color.hex }}
          />
        ))}
      </div>

      {/* Selected tags */}
      {colors.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {colors.map((c) => (
            <span key={c.name} className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-1 rounded-full border border-border bg-muted text-foreground">
              <span className="w-3 h-3 rounded-full inline-block border border-border/50" style={{ background: c.hex }} />
              {c.name}
              <button type="button" onClick={() => onChange(colors.filter((x) => x.name !== c.name))}
                className="text-muted-foreground hover:text-red-500 ml-0.5 transition-colors">×</button>
            </span>
          ))}
        </div>
      )}

      {/* Custom color */}
      <div className="flex gap-2 items-center">
        <input type="color" value={customHex} onChange={(e) => setCustomHex(e.target.value)}
          className="w-8 h-8 rounded cursor-pointer border border-border" />
        <Input value={customName} onChange={(e) => setCustomName(e.target.value)}
          placeholder="Custom color name" className="h-8 text-xs flex-1" onKeyDown={(e) => e.key === "Enter" && addCustom()} />
        <Button type="button" size="sm" variant="outline" onClick={addCustom} className="h-8 text-xs shrink-0">
          Add
        </Button>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const ProductsPage = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<"basic" | "inventory" | "variants">("basic");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    const { data } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });
    setProducts(data || []);
    setLoading(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB"); return; }
    setUploading(true);
    const ext = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(fileName, file);
    if (error) { toast.error("Upload failed: " + error.message); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(fileName);
    setForm({ ...form, image_url: urlData.publicUrl });
    setUploading(false);
    toast.success("Image uploaded!");
  };

  const handleSave = async () => {
    if (!form.name || form.price <= 0) { toast.error("Name and price required"); return; }

    // Derive available_sizes from size_inventory keys
    const derivedSizes = form.size_inventory.map((s) => s.size);
    // Total stock = sum of all size stocks
    const totalStock = form.size_inventory.reduce((sum, s) => sum + s.stock, 0);

    const payload = {
      name: form.name,
      description: form.description || null,
      price: form.price,
      cost_price: form.cost_price,
      discount_price: form.discount_price || null,
      sku: form.sku || null,
      barcode: form.barcode || null,
      brand: form.brand || null,
      category: form.category,
      image_url: form.image_url || null,
      badge: form.badge || null,
      in_stock: totalStock > 0 || form.in_stock,
      stock_quantity: totalStock,
      low_stock_threshold: form.low_stock_threshold,
      status: form.status,
      available_sizes: derivedSizes.length > 0 ? derivedSizes : null,
      size_inventory: form.size_inventory.length > 0 ? form.size_inventory : null,
      colors: form.colors.length > 0 ? form.colors : null,
    };

    if (editId) {
      const { error } = await supabase.from("products").update(payload).eq("id", editId);
      if (error) { toast.error("Failed to update: " + error.message); return; }
      toast.success("Product updated");
    } else {
      const { error } = await supabase.from("products").insert(payload);
      if (error) { toast.error("Failed to create: " + error.message); return; }
      toast.success("Product created");
    }
    setForm(emptyForm); setEditId(null); setDialogOpen(false); setActiveTab("basic");
    fetchProducts();
  };

  const handleEdit = (p: any) => {
    setForm({
      name: p.name,
      description: p.description || "",
      price: p.price,
      cost_price: p.cost_price || 0,
      discount_price: p.discount_price,
      sku: p.sku || "",
      barcode: p.barcode || "",
      brand: p.brand || "",
      category: p.category,
      image_url: p.image_url || "",
      badge: p.badge || "",
      in_stock: p.in_stock,
      stock_quantity: p.stock_quantity || 0,
      low_stock_threshold: p.low_stock_threshold || 10,
      status: p.status || "active",
      available_sizes: p.available_sizes || [],
      size_inventory: p.size_inventory || [],
      colors: p.colors || [],
    });
    setEditId(p.id);
    setDialogOpen(true);
    setActiveTab("basic");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    await supabase.from("products").delete().eq("id", id);
    toast.success("Product deleted");
    fetchProducts();
  };

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku?.toLowerCase().includes(search.toLowerCase())
  );

  // ── Stock status helper ────────────────────────────────────────────────────
  const getStockStatus = (p: any) => {
    const qty = p.stock_quantity ?? 0;
    if (qty === 0) return { label: "Out of Stock", cls: "bg-red-100 text-red-700" };
    if (qty <= (p.low_stock_threshold ?? 10)) return { label: `Low (${qty})`, cls: "bg-amber-100 text-amber-700" };
    return { label: qty.toString(), cls: "bg-green-100 text-green-700" };
  };

  const TAB_CLS = (t: string) =>
    `px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
      activeTab === t
        ? "bg-primary text-primary-foreground"
        : "text-muted-foreground hover:text-foreground hover:bg-muted"
    }`;

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="font-heading text-2xl uppercase tracking-wider text-foreground">Products</h1>

        <Dialog open={dialogOpen} onOpenChange={(o) => {
          setDialogOpen(o);
          if (!o) { setForm(emptyForm); setEditId(null); setActiveTab("basic"); }
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-primary text-primary-foreground font-heading uppercase tracking-wider">
              <Plus size={16} /> Add Product
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-heading uppercase tracking-wider">
                {editId ? "Edit Product" : "New Product"}
              </DialogTitle>
            </DialogHeader>

            {/* ── Tab nav ── */}
            <div className="flex gap-1 bg-muted p-1 rounded-xl mt-2">
              <button type="button" className={TAB_CLS("basic")} onClick={() => setActiveTab("basic")}>
                📦 Basic Info
              </button>
              <button type="button" className={TAB_CLS("inventory")} onClick={() => setActiveTab("inventory")}>
                📊 Size & Stock
                {form.size_inventory.length > 0 && (
                  <span className="ml-1.5 bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {form.size_inventory.length}
                  </span>
                )}
              </button>
              <button type="button" className={TAB_CLS("variants")} onClick={() => setActiveTab("variants")}>
                🎨 Colors
                {form.colors.length > 0 && (
                  <span className="ml-1.5 bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {form.colors.length}
                  </span>
                )}
              </button>
            </div>

            <div className="space-y-4 mt-2">

              {/* ══ BASIC INFO TAB ══ */}
              {activeTab === "basic" && (
                <>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-1">Name *</label>
                      <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-1">Brand</label>
                      <Input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1">Description</label>
                    <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                  </div>

                  <div className="grid sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-1">Price (₱) *</label>
                      <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-1">Cost Price (₱)</label>
                      <Input type="number" value={form.cost_price} onChange={(e) => setForm({ ...form, cost_price: parseFloat(e.target.value) || 0 })} />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-1">Discount Price</label>
                      <Input type="number" value={form.discount_price || ""} placeholder="Optional"
                        onChange={(e) => setForm({ ...form, discount_price: parseFloat(e.target.value) || null })} />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-1">SKU</label>
                      <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-1">Barcode</label>
                      <Input value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-1">Category</label>
                      <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {categories.map(([key, label]) => (
                            <SelectItem key={key} value={key}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Image upload */}
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1">Product Image</label>
                    <div className="border-2 border-dashed border-border rounded-lg p-4">
                      {form.image_url ? (
                        <div className="relative">
                          <img src={form.image_url} alt="Preview" className="w-full h-40 object-cover rounded-lg" />
                          <Button variant="destructive" size="sm" className="absolute top-2 right-2"
                            onClick={() => setForm({ ...form, image_url: "" })}>Remove</Button>
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <ImageIcon className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground mb-2">Click to upload an image</p>
                          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading} className="gap-2">
                            <Upload size={14} /> {uploading ? "Uploading…" : "Upload Image"}
                          </Button>
                        </div>
                      )}
                      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-1">Low Stock Threshold</label>
                      <Input type="number" value={form.low_stock_threshold}
                        onChange={(e) => setForm({ ...form, low_stock_threshold: parseInt(e.target.value) || 10 })} />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-1">Badge</label>
                      <Select value={form.badge || "none"} onValueChange={(v) => setForm({ ...form, badge: v === "none" ? "" : v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="hot">🔥 Hot</SelectItem>
                          <SelectItem value="featured">⭐ Featured</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-1">Status</label>
                      <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="archived">Archived</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <label className="flex items-center gap-2 text-sm font-medium text-foreground cursor-pointer w-fit">
                    <input type="checkbox" checked={form.in_stock} onChange={(e) => setForm({ ...form, in_stock: e.target.checked })} className="rounded" />
                    In Stock (auto-set from size inventory)
                  </label>
                </>
              )}

              {/* ══ SIZE & STOCK TAB ══ */}
              {activeTab === "inventory" && (
                <div className="space-y-4">
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex gap-2">
                    <AlertTriangle size={16} className="text-amber-600 mt-0.5 shrink-0" />
                    <p className="text-sm text-amber-800">
                      Check the sizes you carry, then set the stock count for each. Sizes with 0 stock will show as <strong>Out of Stock</strong> to customers.
                    </p>
                  </div>

                  <SizeInventoryEditor
                    sizeInventory={form.size_inventory}
                    onChange={(inv) => setForm({ ...form, size_inventory: inv })}
                    category={form.category}
                  />
                </div>
              )}

              {/* ══ COLORS TAB ══ */}
              {activeTab === "variants" && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">Select available colors for this product. These will appear as swatches on the product and cart pages.</p>
                  <ColorSelector
                    colors={form.colors}
                    onChange={(colors) => setForm({ ...form, colors })}
                  />
                </div>
              )}

              <Button onClick={handleSave} className="w-full bg-primary text-primary-foreground font-heading uppercase tracking-wider">
                {editId ? "Update Product" : "Create Product"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* ── Search ── */}
      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search products or SKU…" value={search}
          onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      {/* ── Table ── */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No products found</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Sizes & Inventory</TableHead>
                    <TableHead>Colors</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((p) => {
                    const stockStatus = getStockStatus(p);
                    const sizeInv: SizeStock[] = p.size_inventory || [];
                    const colors: ProductColor[] = p.colors || [];

                    return (
                      <TableRow key={p.id}>
                        {/* Product */}
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {p.image_url
                              ? <img src={p.image_url} alt={p.name} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                              : <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                                  <Package size={16} className="text-muted-foreground" />
                                </div>
                            }
                            <div>
                              <span className="font-medium text-foreground">{p.name}</span>
                              {p.brand && <p className="text-xs text-muted-foreground">{p.brand}</p>}
                              {p.badge && (
                                <span className="inline-block mt-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded"
                                  style={{ background: p.badge === "hot" ? "#fef2f2" : "#eff6ff", color: p.badge === "hot" ? "#b91c1c" : "#1d4ed8" }}>
                                  {p.badge === "hot" ? "🔥 HOT" : "⭐ FEAT"}
                                </span>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        {/* SKU */}
                        <TableCell className="font-mono text-xs text-muted-foreground">{p.sku || "—"}</TableCell>

                        {/* Category */}
                        <TableCell className="text-muted-foreground text-sm">
                          {categoryLabels[p.category as keyof typeof categoryLabels] || p.category}
                        </TableCell>

                        {/* Price */}
                        <TableCell>
                          <span className="font-heading">₱{Number(p.price).toLocaleString()}</span>
                          {p.discount_price && (
                            <span className="text-xs text-destructive ml-1">→₱{p.discount_price}</span>
                          )}
                        </TableCell>

                        {/* Cost */}
                        <TableCell className="text-sm">₱{Number(p.cost_price || 0).toLocaleString()}</TableCell>

                        {/* Stock */}
                        <TableCell>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${stockStatus.cls}`}>
                            {stockStatus.label}
                          </span>
                        </TableCell>

                        {/* Size inventory */}
                        <TableCell>
                          {sizeInv.length > 0 ? (
                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                              {sizeInv.map((s) => (
                                <span key={s.size}
                                  className={`text-[10px] px-1.5 py-0.5 rounded font-semibold border ${
                                    s.stock === 0
                                      ? "bg-red-50 text-red-600 border-red-200 line-through"
                                      : s.stock <= 5
                                      ? "bg-amber-50 text-amber-700 border-amber-200"
                                      : "bg-green-50 text-green-700 border-green-200"
                                  }`}
                                  title={`${s.size}: ${s.stock} units`}
                                >
                                  {s.size} <span className="opacity-70">({s.stock})</span>
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>

                        {/* Colors */}
                        <TableCell>
                          {colors.length > 0 ? (
                            <div className="flex gap-1 flex-wrap">
                              {colors.map((c) => (
                                <span key={c.name} title={c.name}
                                  className="w-5 h-5 rounded-full border border-border/60 inline-block shrink-0"
                                  style={{ background: c.hex }} />
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            p.status === "active" ? "bg-green-100 text-green-700"
                            : p.status === "draft" ? "bg-amber-100 text-amber-700"
                            : "bg-muted text-muted-foreground"
                          }`}>{p.status}</span>
                        </TableCell>

                        {/* Actions */}
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(p)}>
                              <Pencil size={14} />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(p.id)}>
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

  
    </div>
  );
};

export default ProductsPage;
