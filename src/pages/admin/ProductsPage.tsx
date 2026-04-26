import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import {
  Plus, Pencil, Trash2, Search, Upload, Image as ImageIcon,
  Package, AlertTriangle, CheckCircle2, Layers, XCircle,
  TrendingUp, BarChart2, ShoppingBag, DollarSign,
  PhilippinePesoIcon,
} from "lucide-react";
import { categoryLabels } from "@/data/products";

/* ─── Constants ─── */
const categories = Object.entries(categoryLabels);
const APPAREL_SIZES  = ["XS","S","M","L","XL","XXL","XXXL","Free Size"];
const SHOE_SIZES_EU  = ["EU 35","EU 36","EU 37","EU 38","EU 39","EU 40","EU 41","EU 42","EU 43","EU 44","EU 45"];
const SHOE_SIZES_US  = ["US 4","US 5","US 6","US 7","US 8","US 9","US 10","US 11","US 12"];
const SHOE_CATEGORIES = ["shoes","footwear","sneakers","sandals","slippers","socks"];

const COLOR_PRESETS = [
  { name:"Black",   hex:"#0a0d14" }, { name:"White",  hex:"#f5f5f5" },
  { name:"Blue",    hex:"#1847d4" }, { name:"Red",    hex:"#ef4444" },
  { name:"Gold",    hex:"#f59e0b" }, { name:"Navy",   hex:"#1e3a5f" },
  { name:"Green",   hex:"#16a34a" }, { name:"Gray",   hex:"#6b7280" },
  { name:"Orange",  hex:"#ea580c" }, { name:"Pink",   hex:"#ec4899" },
  { name:"Purple",  hex:"#8b5cf6" }, { name:"Teal",   hex:"#14b8a6" },
];

const ACCENT_COLORS = ["#34d399","#60a5fa","#a78bfa","#fb923c","#f472b6","#f87171"];

interface SizeStock { size: string; stock: number; }
interface ProductColor { name: string; hex: string; }

const emptyForm = {
  name:"", description:"", price:0, cost_price:0, discount_price:null as number|null,
  sku:"", barcode:"", brand:"", category:"fashion-apparel",
  image_url:"", badge:"", in_stock:true,
  stock_quantity:0, low_stock_threshold:10, status:"active",
  available_sizes:[] as string[],
  size_inventory:[] as SizeStock[],
  colors:[] as ProductColor[],
};

const glassCard = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.08)",
  backdropFilter: "blur(20px)",
  boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
};

/* ─── Size Inventory Editor ─── */
const SizeInventoryEditor = ({
  sizeInventory, onChange, category,
}: { sizeInventory: SizeStock[]; onChange: (inv: SizeStock[]) => void; category: string; }) => {
  const isShoe = SHOE_CATEGORIES.some(c => category.toLowerCase().includes(c));
  const sizeGroups = isShoe
    ? [{ label: "EU Sizes", sizes: SHOE_SIZES_EU }, { label: "US Sizes", sizes: SHOE_SIZES_US }, { label: "Apparel", sizes: APPAREL_SIZES }]
    : [{ label: "Apparel Sizes", sizes: APPAREL_SIZES }, { label: "Shoe Sizes (EU)", sizes: SHOE_SIZES_EU }, { label: "Shoe Sizes (US)", sizes: SHOE_SIZES_US }];

  const getStock = (size: string) => sizeInventory.find(s => s.size === size)?.stock ?? 0;
  const isActive = (size: string) => sizeInventory.some(s => s.size === size);
  const totalStock = sizeInventory.reduce((sum, s) => sum + s.stock, 0);

  const setStock = (size: string, stock: number) => {
    if (sizeInventory.some(s => s.size === size)) {
      onChange(sizeInventory.map(s => s.size === size ? { ...s, stock } : s));
    } else if (stock > 0) {
      onChange([...sizeInventory, { size, stock }]);
    }
  };

  const toggleSize = (size: string) => {
    if (isActive(size)) onChange(sizeInventory.filter(s => s.size !== size));
    else onChange([...sizeInventory, { size, stock: 0 }]);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Summary */}
      <div style={{
        display: "flex", alignItems: "center", gap: "12px",
        padding: "12px 16px", borderRadius: "12px",
        background: "rgba(96,165,250,0.08)", border: "1px solid rgba(96,165,250,0.15)",
      }}>
        <Layers size={15} color="#60a5fa" style={{ flexShrink: 0 }} />
        <div style={{ flex: 1, fontSize: "13px" }}>
          <span style={{ fontWeight: 700, color: "#60a5fa" }}>{sizeInventory.length} sizes active</span>
          <span style={{ color: "rgba(148,163,184,0.5)", margin: "0 8px" }}>·</span>
          <span style={{ color: "rgba(148,163,184,0.5)" }}>{totalStock} total units</span>
        </div>
        {sizeInventory.length > 0 && (
          <button type="button" onClick={() => onChange([])}
            style={{ fontSize: "11px", color: "#f87171", fontWeight: 600, border: "none", background: "none", cursor: "pointer" }}>
            Clear all
          </button>
        )}
      </div>

      {sizeGroups.map(group => (
        <div key={group.label}>
          <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: ".15em", textTransform: "uppercase", color: "rgba(148,163,184,0.45)", marginBottom: "8px" }}>
            {group.label}
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(106px, 1fr))", gap: "7px" }}>
            {group.sizes.map(size => {
              const active = isActive(size);
              const stock  = getStock(size);
              const isLow  = active && stock > 0 && stock <= 5;
              const isOut  = active && stock === 0;
              const borderColor = !active ? "rgba(255,255,255,0.08)" : isOut ? "rgba(248,113,113,0.4)" : isLow ? "rgba(251,146,60,0.4)" : "rgba(52,211,153,0.4)";
              const bgColor     = !active ? "rgba(255,255,255,0.03)" : isOut ? "rgba(248,113,113,0.08)" : isLow ? "rgba(251,146,60,0.08)" : "rgba(52,211,153,0.08)";

              return (
                <div key={size} style={{
                  borderRadius: "10px", border: `1.5px solid ${borderColor}`,
                  background: bgColor, opacity: !active ? 0.5 : 1,
                  transition: "all .2s ease",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "7px 8px 4px" }}>
                    <input type="checkbox" checked={active} onChange={() => toggleSize(size)}
                      style={{ width: 13, height: 13, cursor: "pointer", accentColor: "#60a5fa" }} />
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#fff", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {size}
                    </span>
                    {active && (isOut
                      ? <XCircle size={10} color="#f87171" />
                      : isLow ? <AlertTriangle size={10} color="#fb923c" />
                      : <CheckCircle2 size={10} color="#34d399" />
                    )}
                  </div>
                  {active && (
                    <div style={{ padding: "0 7px 7px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <button type="button" onClick={() => setStock(size, Math.max(0, stock - 1))} style={{
                          width: 22, height: 22, borderRadius: "5px",
                          border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)",
                          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "14px", color: "rgba(148,163,184,0.7)", lineHeight: 1,
                        }}>−</button>
                        <input type="number" min={0} value={stock}
                          onChange={e => setStock(size, Math.max(0, parseInt(e.target.value) || 0))}
                          style={{
                            flex: 1, minWidth: 0, height: 22, textAlign: "center",
                            fontSize: "11px", fontWeight: 700,
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: "5px", background: "rgba(255,255,255,0.05)",
                            outline: "none", color: "#fff",
                          }} />
                        <button type="button" onClick={() => setStock(size, stock + 1)} style={{
                          width: 22, height: 22, borderRadius: "5px",
                          border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)",
                          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "14px", color: "rgba(148,163,184,0.7)", lineHeight: 1,
                        }}>+</button>
                      </div>
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

/* ─── Color Selector ─── */
const ColorSelector = ({
  colors, onChange,
}: { colors: ProductColor[]; onChange: (c: ProductColor[]) => void; }) => {
  const [customName, setCustomName] = useState("");
  const [customHex, setCustomHex]   = useState("#000000");

  const isSelected = (name: string) => colors.some(c => c.name === name);
  const toggle     = (color: ProductColor) => {
    isSelected(color.name) ? onChange(colors.filter(c => c.name !== color.name)) : onChange([...colors, color]);
  };
  const addCustom  = () => {
    if (!customName.trim()) return;
    if (isSelected(customName.trim())) { toast.error("Color already added"); return; }
    onChange([...colors, { name: customName.trim(), hex: customHex }]);
    setCustomName("");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      <div>
        <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: ".15em", textTransform: "uppercase", color: "rgba(148,163,184,0.45)", marginBottom: "10px" }}>Presets</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {COLOR_PRESETS.map(color => (
            <button key={color.name} type="button" title={color.name} onClick={() => toggle(color)}
              style={{
                width: 28, height: 28, borderRadius: "50%",
                background: color.hex, cursor: "pointer",
                border: isSelected(color.name) ? "2px solid #60a5fa" : (color.name === "White" ? "1px solid rgba(255,255,255,0.2)" : "2px solid transparent"),
                transform: isSelected(color.name) ? "scale(1.12)" : undefined,
                boxShadow: isSelected(color.name) ? "0 0 0 3px rgba(96,165,250,0.3)" : undefined,
                transition: "transform .2s ease, box-shadow .2s ease",
              }} />
          ))}
        </div>
      </div>

      {colors.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
          {colors.map(c => (
            <span key={c.name} style={{
              display: "inline-flex", alignItems: "center", gap: "6px",
              fontSize: "11px", fontWeight: 600, padding: "4px 10px",
              borderRadius: "999px", border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.06)", color: "#fff",
            }}>
              <span style={{ width: 11, height: 11, borderRadius: "50%", display: "inline-block", background: c.hex, border: "1px solid rgba(255,255,255,0.15)", flexShrink: 0 }} />
              {c.name}
              <button type="button" onClick={() => onChange(colors.filter(x => x.name !== c.name))}
                style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(148,163,184,0.5)", fontSize: "14px", lineHeight: 1, padding: 0 }}>
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <div>
        <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: ".15em", textTransform: "uppercase", color: "rgba(148,163,184,0.45)", marginBottom: "8px" }}>Custom Color</p>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <input type="color" value={customHex} onChange={e => setCustomHex(e.target.value)}
            style={{ width: 36, height: 36, borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer", padding: "2px", background: "transparent" }} />
          <Input value={customName} onChange={e => setCustomName(e.target.value)}
            placeholder="Color name (e.g. Midnight Blue)" className="h-9 text-xs flex-1"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}
            onKeyDown={e => e.key === "Enter" && addCustom()} />
          <Button type="button" variant="outline" size="sm" onClick={addCustom} className="h-9 text-xs px-4 shrink-0"
            style={{ background: "rgba(96,165,250,0.1)", border: "1px solid rgba(96,165,250,0.25)", color: "#60a5fa" }}>
            Add
          </Button>
        </div>
      </div>
    </div>
  );
};

/* ─── Summary Stats ─── */
const SummaryStats = ({ products }: { products: any[] }) => {
  const totalProducts = products.length;
  const totalRevenue  = products.reduce((s, p) => s + p.price * (p.sold_count || 0), 0);
  const lowStock      = products.filter(p => p.stock_quantity > 0 && p.stock_quantity <= p.low_stock_threshold).length;
  const outOfStock    = products.filter(p => p.stock_quantity === 0).length;

  const cards = [
    { icon: ShoppingBag,   label: "Total Products", value: totalProducts,                          iconBg: "rgba(96,165,250,0.2)",  iconColor: "#60a5fa"  },
    { icon: PhilippinePesoIcon, label: "Revenue (sold)", value: `₱${totalRevenue.toLocaleString()}`, iconBg: "rgba(52,211,153,0.2)", iconColor: "#34d399"  },
    { icon: AlertTriangle, label: "Low Stock",      value: lowStock,                               iconBg: "rgba(251,191,36,0.2)",  iconColor: "#fbbf24"  },
    { icon: XCircle,       label: "Out of Stock",   value: outOfStock,                             iconBg: "rgba(248,113,113,0.2)", iconColor: "#f87171"  },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "14px" }}>
      {cards.map((card, i) => (
        <div key={card.label} style={{
          ...glassCard, borderRadius: "16px", padding: "20px",
          cursor: "default", opacity: 0,
          animation: `fadeUp 0.5s ease ${i * 0.08}s forwards`,
          transition: "transform .3s ease, box-shadow .3s ease",
        }}
          onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ""; }}
        >
          <div style={{
            width: 40, height: 40, borderRadius: "12px", marginBottom: "16px",
            background: card.iconBg,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <card.icon size={18} color={card.iconColor} />
          </div>
          <p style={{ fontSize: "1.6rem", fontWeight: 800, color: "#fff", lineHeight: 1.1 }}>{card.value}</p>
          <p style={{ fontSize: "10px", fontWeight: 600, color: "rgba(148,163,184,0.6)", marginTop: "5px", textTransform: "uppercase", letterSpacing: "0.08em" }}>{card.label}</p>
        </div>
      ))}
    </div>
  );
};

/* ═══════════════════════════════════════ MAIN PAGE ═══════════════════════════ */
const ProductsPage = () => {
  const [products, setProducts]   = useState<any[]>([]);
  const [form, setForm]           = useState(emptyForm);
  const [editId, setEditId]       = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch]       = useState("");
  const [loading, setLoading]     = useState(true);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<"basic" | "inventory" | "variants">("basic");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [saving, setSaving]       = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    setProducts(data || []);
    setLoading(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please select an image"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB"); return; }
    setUploading(true);
    const ext = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(fileName, file);
    if (error) { toast.error("Upload failed: " + error.message); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(fileName);
    setForm(f => ({ ...f, image_url: urlData.publicUrl }));
    setUploading(false);
    toast.success("Image uploaded!");
  };

  const handleSave = async () => {
    if (!form.name || form.price <= 0) { toast.error("Name and price are required"); return; }
    setSaving(true);
    const totalStock = form.size_inventory.reduce((sum, s) => sum + s.stock, 0);
    const payload = {
      name: form.name, description: form.description || null,
      price: form.price, cost_price: form.cost_price,
      discount_price: form.discount_price || null,
      sku: form.sku || null, barcode: form.barcode || null,
      brand: form.brand || null, category: form.category,
      image_url: form.image_url || null, badge: form.badge || null,
      in_stock: totalStock > 0 || form.in_stock,
      stock_quantity: totalStock, low_stock_threshold: form.low_stock_threshold,
      status: form.status,
      available_sizes: form.size_inventory.length > 0 ? form.size_inventory.map(s => s.size) : null,
      size_inventory: form.size_inventory.length > 0 ? form.size_inventory : null,
      colors: form.colors.length > 0 ? form.colors : null,
    };

    if (editId) {
      const { error } = await supabase.from("products").update(payload).eq("id", editId);
      if (error) { toast.error("Failed to update: " + error.message); setSaving(false); return; }
      toast.success("Product updated successfully");
    } else {
      const { error } = await supabase.from("products").insert(payload);
      if (error) { toast.error("Failed to create: " + error.message); setSaving(false); return; }
      toast.success("Product created successfully");
    }
    setSaving(false);
    setForm(emptyForm); setEditId(null); setDialogOpen(false); setActiveTab("basic");
    fetchProducts();
  };

  const handleEdit = (p: any) => {
    setForm({
      name: p.name, description: p.description || "",
      price: p.price, cost_price: p.cost_price || 0,
      discount_price: p.discount_price, sku: p.sku || "",
      barcode: p.barcode || "", brand: p.brand || "",
      category: p.category, image_url: p.image_url || "",
      badge: p.badge || "", in_stock: p.in_stock,
      stock_quantity: p.stock_quantity || 0,
      low_stock_threshold: p.low_stock_threshold || 10,
      status: p.status || "active",
      available_sizes: p.available_sizes || [],
      size_inventory: p.size_inventory || [],
      colors: p.colors || [],
    });
    setEditId(p.id); setDialogOpen(true); setActiveTab("basic");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product? This cannot be undone.")) return;
    await supabase.from("products").delete().eq("id", id);
    toast.success("Product deleted");
    fetchProducts();
  };

  const getStockStatus = (p: any) => {
    const qty = p.stock_quantity ?? 0;
    if (qty === 0)                             return { label: "Out of Stock", color: "#f87171",  bg: "rgba(248,113,113,0.15)", border: "rgba(248,113,113,0.3)"  };
    if (qty <= (p.low_stock_threshold ?? 10))  return { label: `Low · ${qty}`, color: "#fb923c", bg: "rgba(251,146,60,0.15)",  border: "rgba(251,146,60,0.3)"   };
    return { label: qty.toString(), color: "#34d399", bg: "rgba(52,211,153,0.15)", border: "rgba(52,211,153,0.3)" };
  };

  const getStatusBadge = (status: string) => {
    if (status === "active")   return { label: "Active",    color: "#34d399", bg: "rgba(52,211,153,0.15)",   border: "rgba(52,211,153,0.3)"   };
    if (status === "draft")    return { label: "Draft",     color: "#fb923c", bg: "rgba(251,146,60,0.15)",   border: "rgba(251,146,60,0.3)"   };
    return { label: "Archived", color: "#94a3b8", bg: "rgba(148,163,184,0.1)", border: "rgba(148,163,184,0.2)" };
  };

  const filtered = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const margin = (p: any) => {
    if (!p.cost_price || !p.price) return null;
    return Math.round(((p.price - p.cost_price) / p.price) * 100);
  };

  const TABS: { key: "basic"|"inventory"|"variants"; emoji: string; label: string; count?: number }[] = [
    { key: "basic",     emoji: "📦", label: "Basic Info" },
    { key: "inventory", emoji: "📊", label: "Size & Stock", count: form.size_inventory.length },
    { key: "variants",  emoji: "🎨", label: "Colors",       count: form.colors.length },
  ];

  const labelStyle = {
    display: "block" as const, fontSize: "11px", fontWeight: 700,
    color: "rgba(148,163,184,0.6)", marginBottom: "6px",
    textTransform: "uppercase" as const, letterSpacing: ".08em",
  };

  const inputStyle = {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "#fff",
  };

  return (
    <div style={{ minHeight: "100vh", padding: "24px", display: "flex", flexDirection: "column", gap: "24px" }}>

      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "14px",
        opacity: 0, animation: "fadeUp 0.5s ease forwards",
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#34d399", animation: "pulse 2s infinite" }} />
            <span style={{ fontSize: "11px", color: "#34d399", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase" }}>Live</span>
          </div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>Products</h1>
          <p style={{ fontSize: "12px", color: "rgba(148,163,184,0.7)", marginTop: "2px", fontWeight: 500 }}>
            {products.length} total products
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={o => { setDialogOpen(o); if (!o) { setForm(emptyForm); setEditId(null); setActiveTab("basic"); } }}>
          <DialogTrigger asChild>
            <button style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              padding: "11px 22px", borderRadius: "12px",
              background: "rgba(52,211,153,0.9)", color: "#001a0f",
              fontWeight: 800, fontSize: "12px", letterSpacing: ".06em", textTransform: "uppercase",
              border: "none", cursor: "pointer",
              boxShadow: "0 6px 22px -5px rgba(52,211,153,0.35)",
              transition: "transform .2s ease, box-shadow .2s ease",
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 10px 30px -5px rgba(52,211,153,0.5)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = ""; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 6px 22px -5px rgba(52,211,153,0.35)"; }}
            >
              <Plus size={15} /> Add Product
            </button>
          </DialogTrigger>

          <DialogContent style={{
            maxWidth: "740px", maxHeight: "92vh", overflowY: "auto",
            background: "rgba(10,15,30,0.97)", border: "1px solid rgba(255,255,255,0.1)",
            backdropFilter: "blur(30px)",
          }}>
            <DialogHeader>
              <DialogTitle style={{ fontSize: "1.3rem", fontWeight: 800, color: "#fff" }}>
                {editId ? "Edit Product" : "New Product"}
              </DialogTitle>
            </DialogHeader>

            {/* Tabs */}
            <div style={{
              display: "flex", gap: "4px",
              background: "rgba(255,255,255,0.05)", padding: "4px", borderRadius: "12px", marginTop: "10px",
              border: "1px solid rgba(255,255,255,0.07)",
            }}>
              {TABS.map(tab => (
                <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key)} style={{
                  flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "7px",
                  padding: "10px 18px", borderRadius: "9px", border: "none", cursor: "pointer",
                  fontWeight: 700, fontSize: "12.5px",
                  background: activeTab === tab.key ? "rgba(52,211,153,0.15)" : "transparent",
                  color: activeTab === tab.key ? "#34d399" : "rgba(148,163,184,0.6)",
                  transition: "background .2s ease, color .2s ease",
                }}>
                  {tab.emoji} {tab.label}
                  {tab.count !== undefined && tab.count > 0 && (
                    <span style={{
                      background: activeTab === tab.key ? "#34d399" : "rgba(52,211,153,0.2)",
                      color: activeTab === tab.key ? "#001a0f" : "#34d399",
                      fontSize: "9px", fontWeight: 900, padding: "1px 6px", borderRadius: "999px",
                    }}>{tab.count}</span>
                  )}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "8px" }}>

              {/* ── BASIC INFO ── */}
              {activeTab === "basic" && (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div>
                      <label style={labelStyle}>Product Name *</label>
                      <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. RaidKhalid Pro Jersey" style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Brand</label>
                      <Input value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} placeholder="e.g. RaidKhalid" style={inputStyle} />
                    </div>
                  </div>

                  <div>
                    <label style={labelStyle}>Description</label>
                    <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Brief product description..." style={inputStyle} />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                    <div>
                      <label style={labelStyle}>Selling Price (₱) *</label>
                      <Input type="number" value={form.price} onChange={e => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Cost Price (₱)</label>
                      <Input type="number" value={form.cost_price} onChange={e => setForm({ ...form, cost_price: parseFloat(e.target.value) || 0 })} style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Discount Price</label>
                      <Input type="number" value={form.discount_price || ""} placeholder="Optional"
                        onChange={e => setForm({ ...form, discount_price: parseFloat(e.target.value) || null })} style={inputStyle} />
                    </div>
                  </div>

                  {/* Margin indicator */}
                  {form.cost_price > 0 && form.price > 0 && (
                    <div style={{
                      padding: "10px 14px", borderRadius: "10px",
                      background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.18)",
                      display: "flex", alignItems: "center", gap: "8px",
                    }}>
                      <BarChart2 size={14} color="#34d399" />
                      <span style={{ fontSize: "12px", color: "#34d399", fontWeight: 700 }}>
                        Margin: {Math.round(((form.price - form.cost_price) / form.price) * 100)}%
                        <span style={{ fontWeight: 500, color: "rgba(148,163,184,0.5)", marginLeft: "8px" }}>
                          (₱{(form.price - form.cost_price).toLocaleString()} profit per unit)
                        </span>
                      </span>
                    </div>
                  )}

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                    <div>
                      <label style={labelStyle}>SKU</label>
                      <Input value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} placeholder="RK-001" style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Barcode</label>
                      <Input value={form.barcode} onChange={e => setForm({ ...form, barcode: e.target.value })} style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Category</label>
                      <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                        <SelectTrigger style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {categories.map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Image upload */}
                  <div>
                    <label style={labelStyle}>Product Image</label>
                    <div style={{
                      border: "2px dashed rgba(255,255,255,0.1)", borderRadius: "14px", overflow: "hidden",
                      transition: "border-color .22s ease, background .22s ease",
                    }}
                      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(52,211,153,0.4)"; (e.currentTarget as HTMLDivElement).style.background = "rgba(52,211,153,0.03)"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.1)"; (e.currentTarget as HTMLDivElement).style.background = ""; }}
                    >
                      {form.image_url ? (
                        <div style={{ position: "relative" }}>
                          <img src={form.image_url} alt="Preview" style={{ width: "100%", height: "180px", objectFit: "cover", display: "block" }} />
                          <button onClick={() => setForm({ ...form, image_url: "" })} style={{
                            position: "absolute", top: 10, right: 10,
                            width: 30, height: 30, borderRadius: "50%",
                            background: "rgba(248,113,113,0.9)", color: "#fff", border: "none", cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: "16px", lineHeight: 1,
                          }}>×</button>
                        </div>
                      ) : (
                        <div style={{ padding: "32px", textAlign: "center" }}>
                          <ImageIcon style={{ display: "block", margin: "0 auto 10px", color: "rgba(148,163,184,0.25)" }} size={36} />
                          <p style={{ fontSize: "13px", color: "rgba(148,163,184,0.4)", marginBottom: "14px" }}>Drop an image or click to upload</p>
                          <button onClick={() => fileRef.current?.click()} disabled={uploading} style={{
                            padding: "9px 20px", borderRadius: "9px",
                            border: "1px solid rgba(255,255,255,0.12)",
                            background: "rgba(255,255,255,0.05)", cursor: "pointer",
                            fontWeight: 700, fontSize: "12px",
                            display: "inline-flex", alignItems: "center", gap: "7px",
                            color: "rgba(148,163,184,0.7)",
                          }}>
                            <Upload size={14} /> {uploading ? "Uploading…" : "Choose File"}
                          </button>
                        </div>
                      )}
                      <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageUpload} />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                    <div>
                      <label style={labelStyle}>Low Stock Alert</label>
                      <Input type="number" value={form.low_stock_threshold}
                        onChange={e => setForm({ ...form, low_stock_threshold: parseInt(e.target.value) || 10 })} style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Badge</label>
                      <Select value={form.badge || "none"} onValueChange={v => setForm({ ...form, badge: v === "none" ? "" : v })}>
                        <SelectTrigger style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="hot">🔥 Hot</SelectItem>
                          <SelectItem value="featured">⭐ Featured</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label style={labelStyle}>Status</label>
                      <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                        <SelectTrigger style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="archived">Archived</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </>
              )}

              {/* ── SIZE & STOCK ── */}
              {activeTab === "inventory" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div style={{
                    padding: "12px 14px", background: "rgba(251,146,60,0.08)",
                    border: "1px solid rgba(251,146,60,0.2)", borderRadius: "10px",
                    display: "flex", gap: "10px", alignItems: "flex-start",
                  }}>
                    <AlertTriangle size={15} color="#fb923c" style={{ marginTop: "1px", flexShrink: 0 }} />
                    <p style={{ fontSize: "12.5px", color: "rgba(251,146,60,0.9)", lineHeight: 1.6 }}>
                      Check the sizes you carry, then set the stock count. Sizes with 0 units show as <strong>Out of Stock</strong> to customers.
                    </p>
                  </div>
                  <SizeInventoryEditor
                    sizeInventory={form.size_inventory}
                    onChange={inv => setForm({ ...form, size_inventory: inv })}
                    category={form.category}
                  />
                </div>
              )}

              {/* ── COLORS ── */}
              {activeTab === "variants" && (
                <div>
                  <p style={{ fontSize: "13px", color: "rgba(148,163,184,0.5)", marginBottom: "14px", lineHeight: 1.6 }}>
                    Select available colors. These appear as swatches on the product and cart pages.
                  </p>
                  <ColorSelector colors={form.colors} onChange={colors => setForm({ ...form, colors })} />
                </div>
              )}

              {/* Save button */}
              <button onClick={handleSave} disabled={saving} style={{
                width: "100%", padding: "14px", borderRadius: "12px",
                background: saving ? "rgba(52,211,153,0.5)" : "rgba(52,211,153,0.9)",
                color: "#001a0f", fontWeight: 800, fontSize: "13px",
                letterSpacing: ".07em", textTransform: "uppercase",
                border: "none", cursor: saving ? "not-allowed" : "pointer",
                boxShadow: "0 6px 22px -5px rgba(52,211,153,0.3)",
                transition: "background .2s ease",
              }}>
                {saving ? "Saving…" : editId ? "Update Product" : "Create Product"}
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary stats */}
      {!loading && <SummaryStats products={products} />}

      {/* Search & filter */}
      <div style={{
        display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center",
        opacity: 0, animation: "fadeUp 0.5s ease 0.4s forwards",
      }}>
        <div style={{ position: "relative", flex: "1", minWidth: "200px", maxWidth: "380px" }}>
          <Search size={15} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "rgba(148,163,184,0.45)", zIndex: 1 }} />
          <Input placeholder="Search by name or SKU…" value={search} onChange={e => setSearch(e.target.value)}
            className="pl-10" style={inputStyle} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger style={{ width: "140px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}>
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
        <div style={{ fontSize: "12px", color: "rgba(148,163,184,0.45)", marginLeft: "auto" }}>
          {filtered.length} of {products.length} products
        </div>
      </div>

      {/* Table */}
      <div style={{
        ...glassCard, borderRadius: "20px", overflow: "hidden",
        opacity: 0, animation: "fadeUp 0.5s ease 0.5s forwards",
      }}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "60px 0", gap: "12px" }}>
            {[0, 0.15, 0.3].map((d, i) => (
              <div key={i} style={{
                width: 8, height: 8, borderRadius: "50%",
                background: i === 0 ? "#34d399" : i === 1 ? "#60a5fa" : "#a78bfa",
                animation: `bounce 0.7s ease ${d}s infinite alternate`,
              }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <Package size={36} style={{ display: "block", margin: "0 auto 12px", color: "rgba(148,163,184,0.2)" }} />
            <p style={{ fontWeight: 600, color: "rgba(148,163,184,0.4)" }}>No products found</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  {["Product","SKU","Category","Price","Margin","Stock","Sizes","Colors","Status","Actions"].map(h => (
                    <th key={h} style={{
                      padding: "14px 16px", textAlign: "left",
                      fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
                      color: "rgba(148,163,184,0.55)", whiteSpace: "nowrap",
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, rowIdx) => {
                  const stock   = getStockStatus(p);
                  const statusB = getStatusBadge(p.status);
                  const mg      = margin(p);
                  const sizeInv: SizeStock[]    = p.size_inventory || [];
                  const colors:  ProductColor[] = p.colors || [];

                  return (
                    <tr key={p.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", transition: "background .18s ease" }}
                      onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = "rgba(255,255,255,0.03)"}
                      onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = ""}
                    >
                      {/* Product */}
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          {p.image_url ? (
                            <img src={p.image_url} alt={p.name} style={{ width: 42, height: 42, borderRadius: "10px", objectFit: "cover", flexShrink: 0, border: "1px solid rgba(255,255,255,0.1)" }} />
                          ) : (
                            <div style={{
                              width: 42, height: 42, borderRadius: "10px", flexShrink: 0,
                              background: `${ACCENT_COLORS[rowIdx % ACCENT_COLORS.length]}20`,
                              display: "flex", alignItems: "center", justifyContent: "center",
                            }}>
                              <Package size={16} style={{ color: ACCENT_COLORS[rowIdx % ACCENT_COLORS.length] }} />
                            </div>
                          )}
                          <div>
                            <div style={{ fontWeight: 700, fontSize: "13.5px", color: "#fff" }}>{p.name}</div>
                            {p.brand && <div style={{ fontSize: "10px", color: "rgba(148,163,184,0.45)", fontWeight: 600, marginTop: "1px" }}>{p.brand}</div>}
                            {p.badge && (
                              <span style={{
                                display: "inline-block", marginTop: "3px",
                                fontSize: "9px", fontWeight: 800, padding: "2px 6px", borderRadius: "4px",
                                background: p.badge === "hot" ? "rgba(248,113,113,0.15)" : "rgba(96,165,250,0.15)",
                                color: p.badge === "hot" ? "#f87171" : "#60a5fa",
                                border: `1px solid ${p.badge === "hot" ? "rgba(248,113,113,0.3)" : "rgba(96,165,250,0.3)"}`,
                              }}>
                                {p.badge === "hot" ? "🔥 HOT" : "⭐ FEAT"}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* SKU */}
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ fontFamily: "monospace", fontSize: "11.5px", color: "rgba(148,163,184,0.45)" }}>{p.sku || "—"}</span>
                      </td>

                      {/* Category */}
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ fontSize: "12px", color: "rgba(148,163,184,0.7)" }}>
                          {categoryLabels[p.category as keyof typeof categoryLabels] || p.category}
                        </span>
                      </td>

                      {/* Price */}
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ fontWeight: 800, fontSize: "13.5px", color: "#fff" }}>₱{Number(p.price).toLocaleString()}</div>
                        {p.discount_price && (
                          <div style={{ fontSize: "10px", color: "#f87171", fontWeight: 600 }}>→ ₱{p.discount_price}</div>
                        )}
                      </td>

                      {/* Margin */}
                      <td style={{ padding: "12px 16px" }}>
                        {mg !== null ? (
                          <span style={{
                            fontSize: "11px", fontWeight: 700, padding: "3px 8px", borderRadius: "6px",
                            background: mg >= 40 ? "rgba(52,211,153,0.15)" : mg >= 20 ? "rgba(251,146,60,0.15)" : "rgba(248,113,113,0.15)",
                            color: mg >= 40 ? "#34d399" : mg >= 20 ? "#fb923c" : "#f87171",
                            border: `1px solid ${mg >= 40 ? "rgba(52,211,153,0.3)" : mg >= 20 ? "rgba(251,146,60,0.3)" : "rgba(248,113,113,0.3)"}`,
                          }}>{mg}%</span>
                        ) : <span style={{ color: "rgba(148,163,184,0.25)", fontSize: "12px" }}>—</span>}
                      </td>

                      {/* Stock */}
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: "4px",
                          padding: "3px 10px", borderRadius: "999px", fontSize: "10px", fontWeight: 700,
                          background: stock.bg, border: `1px solid ${stock.border}`, color: stock.color,
                        }}>{stock.label}</span>
                      </td>

                      {/* Sizes */}
                      <td style={{ padding: "12px 16px" }}>
                        {sizeInv.length > 0 ? (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", maxWidth: "200px" }}>
                            {sizeInv.slice(0, 5).map(s => (
                              <span key={s.size} title={`${s.size}: ${s.stock} units`} style={{
                                fontSize: "9px", fontWeight: 700, padding: "2px 5px", borderRadius: "4px",
                                background: s.stock === 0 ? "rgba(248,113,113,0.15)" : s.stock <= 5 ? "rgba(251,146,60,0.15)" : "rgba(52,211,153,0.15)",
                                color: s.stock === 0 ? "#f87171" : s.stock <= 5 ? "#fb923c" : "#34d399",
                                border: `1px solid ${s.stock === 0 ? "rgba(248,113,113,0.3)" : s.stock <= 5 ? "rgba(251,146,60,0.3)" : "rgba(52,211,153,0.3)"}`,
                                textDecoration: s.stock === 0 ? "line-through" : "none",
                              }}>
                                {s.size} ({s.stock})
                              </span>
                            ))}
                            {sizeInv.length > 5 && (
                              <span style={{ fontSize: "9px", color: "rgba(148,163,184,0.4)", fontWeight: 600 }}>+{sizeInv.length - 5}</span>
                            )}
                          </div>
                        ) : <span style={{ fontSize: "12px", color: "rgba(148,163,184,0.25)" }}>—</span>}
                      </td>

                      {/* Colors */}
                      <td style={{ padding: "12px 16px" }}>
                        {colors.length > 0 ? (
                          <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                            {colors.map(c => (
                              <span key={c.name} title={c.name} style={{
                                width: 18, height: 18, borderRadius: "50%", display: "inline-block",
                                background: c.hex, flexShrink: 0, border: "1.5px solid rgba(255,255,255,0.15)",
                              }} />
                            ))}
                          </div>
                        ) : <span style={{ fontSize: "12px", color: "rgba(148,163,184,0.25)" }}>—</span>}
                      </td>

                      {/* Status */}
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{
                          display: "inline-flex", alignItems: "center",
                          padding: "3px 10px", borderRadius: "999px", fontSize: "10px", fontWeight: 700,
                          background: statusB.bg, border: `1px solid ${statusB.border}`, color: statusB.color,
                        }}>{statusB.label}</span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                          <button onClick={() => handleEdit(p)} title="Edit" style={{
                            width: 30, height: 30, borderRadius: "8px",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            border: "1px solid rgba(96,165,250,0.2)", cursor: "pointer",
                            background: "rgba(96,165,250,0.1)", color: "#60a5fa",
                            transition: "background .18s ease, transform .18s ease",
                          }}
                            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(96,165,250,0.22)"; (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.1)"; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(96,165,250,0.1)"; (e.currentTarget as HTMLButtonElement).style.transform = ""; }}
                          >
                            <Pencil size={13} />
                          </button>
                          <button onClick={() => handleDelete(p.id)} title="Delete" style={{
                            width: 30, height: 30, borderRadius: "8px",
                            display: "flex", alignItems: "center", justifyContent: "center",
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
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes bounce { from { transform: translateY(0); } to { transform: translateY(-8px); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </div>
  );
};

export default ProductsPage;
