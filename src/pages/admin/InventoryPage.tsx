import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Package, AlertTriangle, TrendingDown, Search, Plus, History,
  ChevronRight, BarChart2, DollarSign, TrendingUp,
  ArrowUpRight, ArrowDownRight, CheckCircle2, XCircle,
  PhilippinePesoIcon, RefreshCw, Filter
} from "lucide-react";

/* ─── Types ─── */
interface SizeStock { size: string; stock: number; }

/* ─── Stock breakdown from size_inventory ─── */
const SizeStockBreakdown = ({ product }: { product: any }) => {
  const sizeInv: SizeStock[] = product.size_inventory || [];

  if (sizeInv.length > 0) {
    return (
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", maxWidth: "220px" }}>
        {sizeInv.map(s => {
          const bg    = s.stock === 0 ? "rgba(248,113,113,0.15)" : s.stock <= 5 ? "rgba(251,146,60,0.15)" : "rgba(52,211,153,0.15)";
          const color = s.stock === 0 ? "#f87171"  : s.stock <= 5 ? "#fb923c" : "#34d399";
          const border= s.stock === 0 ? "rgba(248,113,113,0.3)" : s.stock <= 5 ? "rgba(251,146,60,0.3)" : "rgba(52,211,153,0.3)";
          return (
            <div key={s.size} title={`${s.size}: ${s.stock} units`} style={{
              display: "inline-flex", flexDirection: "column", alignItems: "center",
              padding: "3px 6px", borderRadius: "6px", minWidth: "34px", lineHeight: 1.2,
              background: bg, border: `1px solid ${border}`, color,
              transition: "transform .18s ease", cursor: "default",
            }}>
              <span style={{ fontSize: "8px", fontWeight: 700, textDecoration: s.stock === 0 ? "line-through" : "none", opacity: s.stock === 0 ? 0.7 : 1 }}>{s.size}</span>
              <span style={{ fontSize: "10px", fontWeight: 800 }}>{s.stock}</span>
            </div>
          );
        })}
      </div>
    );
  }

  const sizes = (product.available_sizes || []) as string[];
  if (sizes.length === 0) return <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.2)" }}>—</span>;
  const qty = sizes.length > 0 ? Math.floor(product.stock_quantity / sizes.length) : 0;
  const color = qty === 0 ? "#f87171" : qty <= 2 ? "#fb923c" : "#34d399";
  const bg    = qty === 0 ? "rgba(248,113,113,0.15)" : qty <= 2 ? "rgba(251,146,60,0.15)" : "rgba(52,211,153,0.15)";
  const border= qty === 0 ? "rgba(248,113,113,0.3)"  : qty <= 2 ? "rgba(251,146,60,0.3)"  : "rgba(52,211,153,0.3)";

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", maxWidth: "200px" }}>
      {sizes.map(s => (
        <div key={s} style={{
          display: "inline-flex", flexDirection: "column", alignItems: "center",
          padding: "3px 6px", borderRadius: "6px", minWidth: "34px", lineHeight: 1.2,
          background: bg, border: `1px solid ${border}`, color,
        }}>
          <span style={{ fontSize: "8px", fontWeight: 700 }}>{s}</span>
          <span style={{ fontSize: "10px", fontWeight: 800 }}>{qty}</span>
        </div>
      ))}
    </div>
  );
};

/* ─── Stat Card (dark glassmorphism) ─── */
const StatCard = ({
  icon: Icon, label, value, iconBg, iconColor, index,
}: {
  icon: any; label: string; value: string | number;
  iconBg: string; iconColor: string; index: number;
}) => (
  <div style={{
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    backdropFilter: "blur(20px)",
    boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
    borderRadius: "16px",
    padding: "20px",
    opacity: 0,
    animation: `fadeUp 0.5s ease ${index * 0.08}s forwards`,
    transition: "transform .3s ease, box-shadow .3s ease",
    cursor: "default",
  }}
    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 16px 40px rgba(0,0,0,0.4)"; }}
    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ""; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 32px rgba(0,0,0,0.3)"; }}
  >
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "16px" }}>
      <div style={{
        width: 40, height: 40, borderRadius: "12px",
        background: iconBg,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon size={18} className={iconColor} style={{ color: "inherit" }} />
      </div>
    </div>
    <p style={{ fontSize: "10px", color: "rgba(148,163,184,1)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "4px", fontWeight: 600 }}>{label}</p>
    <p style={{ fontSize: "1.6rem", fontWeight: 800, color: "#fff", lineHeight: 1.1 }}>{value}</p>
  </div>
);

/* ─── Stock bar ─── */
const StockBar = ({ current, threshold, max }: { current: number; threshold: number; max: number }) => {
  const pct   = max > 0 ? Math.min((current / max) * 100, 100) : 0;
  const color = current === 0 ? "#f87171" : current <= threshold ? "#fb923c" : "#34d399";
  return (
    <div style={{ height: "4px", borderRadius: "999px", background: "rgba(255,255,255,0.08)", overflow: "hidden", width: "80px" }}>
      <div style={{ height: "100%", borderRadius: "999px", width: `${pct}%`, background: color, transition: "width .8s cubic-bezier(.22,1,.36,1)" }} />
    </div>
  );
};

const cardStyle = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.08)",
  backdropFilter: "blur(20px)",
  boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
};

/* ═══════════════════════════════════════ INVENTORY PAGE ═══════════════════════ */
const InventoryPage = () => {
  const [products, setProducts]       = useState<any[]>([]);
  const [logs, setLogs]               = useState<any[]>([]);
  const [search, setSearch]           = useState("");
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [adjustDialog, setAdjustDialog] = useState(false);
  const [logsDialog, setLogsDialog]   = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [adjustQty, setAdjustQty]     = useState(0);
  const [adjustType, setAdjustType]   = useState("added");
  const [adjustNotes, setAdjustNotes] = useState("");
  const [stockFilter, setStockFilter] = useState<"all"|"low"|"out"|"ok">("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [saving, setSaving]           = useState(false);

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    const { data } = await supabase.from("products").select("*").order("name");
    setProducts(data || []);
    setLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchProducts();
    setRefreshing(false);
    toast.success("Inventory refreshed");
  };

  /* ── Computed stats ── */
  const totalProducts   = products.length;
  const lowStock        = products.filter(p => p.stock_quantity > 0 && p.stock_quantity <= p.low_stock_threshold).length;
  const outOfStock      = products.filter(p => p.stock_quantity === 0).length;
  const inventoryValue  = products.reduce((s, p) => s + p.price * p.stock_quantity, 0);
  const totalCost       = products.reduce((s, p) => s + (p.cost_price || 0) * p.stock_quantity, 0);
  const avgMargin       = products.filter(p => p.price > 0 && p.cost_price > 0)
    .reduce((s, p, _, arr) => s + ((p.price - p.cost_price) / p.price * 100) / arr.length, 0);

  const maxStock = Math.max(...products.map(p => p.stock_quantity || 0), 1);

  /* ── Filters ── */
  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];
  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku?.toLowerCase().includes(search.toLowerCase());
    const matchStock  = stockFilter === "all" ? true
      : stockFilter === "out" ? p.stock_quantity === 0
      : stockFilter === "low" ? (p.stock_quantity > 0 && p.stock_quantity <= p.low_stock_threshold)
      : p.stock_quantity > p.low_stock_threshold;
    const matchCat = categoryFilter === "all" || p.category === categoryFilter;
    return matchSearch && matchStock && matchCat;
  });

  /* ── Adjust dialog ── */
  const openAdjust = (product: any) => {
    setSelectedProduct(product);
    setAdjustQty(0); setAdjustType("added"); setAdjustNotes("");
    setAdjustDialog(true);
  };

  const handleAdjust = async () => {
    if (!selectedProduct || adjustQty === 0) { toast.error("Enter a quantity"); return; }
    setSaving(true);
    const change = adjustType === "added" || adjustType === "returned" ? adjustQty : -adjustQty;
    const newQty = Math.max(0, selectedProduct.stock_quantity + change);

    const { error: logError } = await supabase.from("inventory_logs").insert({
      product_id: selectedProduct.id, change_type: adjustType,
      quantity_change: change, quantity_before: selectedProduct.stock_quantity,
      quantity_after: newQty, notes: adjustNotes || null,
    });
    if (logError) { toast.error("Failed to log: " + logError.message); setSaving(false); return; }

    const { error } = await supabase.from("products")
      .update({ stock_quantity: newQty, in_stock: newQty > 0 })
      .eq("id", selectedProduct.id);
    if (error) { toast.error("Failed to update: " + error.message); setSaving(false); return; }

    toast.success(`✓ ${selectedProduct.name} updated → ${newQty} units`);
    setSaving(false); setAdjustDialog(false);
    fetchProducts();
  };

  /* ── View logs ── */
  const viewLogs = async (product: any) => {
    setSelectedProduct(product);
    const { data } = await supabase.from("inventory_logs").select("*")
      .eq("product_id", product.id).order("created_at", { ascending: false }).limit(24);
    setLogs(data || []);
    setLogsDialog(true);
  };

  /* ── Stock status ── */
  const stockStatus = (p: any) => {
    if (p.stock_quantity === 0)                            return { label: "Out of Stock", color: "#f87171",  bg: "rgba(248,113,113,0.15)",  border: "rgba(248,113,113,0.3)"  };
    if (p.stock_quantity <= (p.low_stock_threshold ?? 10)) return { label: `Low · ${p.stock_quantity}`, color: "#fb923c", bg: "rgba(251,146,60,0.15)", border: "rgba(251,146,60,0.3)" };
    return { label: p.stock_quantity.toString(), color: "#34d399", bg: "rgba(52,211,153,0.15)", border: "rgba(52,211,153,0.3)" };
  };

  const adjustTypeConfig: Record<string, { label: string; color: string }> = {
    added:    { label: "Restocked",  color: "#34d399" },
    sold:     { label: "Sold",       color: "#60a5fa" },
    returned: { label: "Returned",   color: "#fb923c" },
    adjusted: { label: "Adjusted",   color: "#94a3b8" },
  };

  const statCards = [
    { icon: Package,            label: "Total Products",   value: totalProducts,                          iconBg: "rgba(96,165,250,0.2)",   iconColor: "text-blue-400"   },
    { icon: AlertTriangle,      label: "Low Stock",        value: lowStock,                               iconBg: "rgba(251,191,36,0.2)",   iconColor: "text-amber-400"  },
    { icon: TrendingDown,       label: "Out of Stock",     value: outOfStock,                             iconBg: "rgba(248,113,113,0.2)",  iconColor: "text-red-400"    },
    { icon: PhilippinePesoIcon, label: "Inventory Value",  value: `₱${(inventoryValue/1000).toFixed(1)}k`, iconBg: "rgba(52,211,153,0.2)", iconColor: "text-emerald-400"},
    { icon: DollarSign,         label: "Total Cost",       value: `₱${(totalCost/1000).toFixed(1)}k`,    iconBg: "rgba(251,146,60,0.2)",   iconColor: "text-orange-400" },
    { icon: TrendingUp,         label: "Avg Margin",       value: `${avgMargin.toFixed(0)}%`,             iconBg: "rgba(167,139,250,0.2)",  iconColor: "text-violet-400" },
  ];

  const PIE_COLORS = ["#34d399","#60a5fa","#a78bfa","#fb923c","#f472b6","#f87171"];

  return (
    <div style={{ minHeight: "100vh", padding: "24px", display: "flex", flexDirection: "column", gap: "24px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "14px", opacity: 0, animation: "fadeUp 0.5s ease forwards" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#34d399", animation: "pulse 2s infinite" }} />
            <span style={{ fontSize: "11px", color: "#34d399", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase" }}>Live</span>
          </div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>Inventory</h1>
          <p style={{ fontSize: "12px", color: "rgba(148,163,184,0.8)", marginTop: "2px", fontWeight: 500 }}>
            {products.length} products · {products.reduce((s, p) => s + (p.stock_quantity || 0), 0).toLocaleString()} total units
          </p>
        </div>
        <button onClick={handleRefresh} disabled={refreshing} style={{
          display: "inline-flex", alignItems: "center", gap: "7px",
          padding: "9px 18px", borderRadius: "12px",
          background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.7)",
          border: "1px solid rgba(255,255,255,0.1)",
          fontWeight: 700, fontSize: "13px", cursor: "pointer",
          backdropFilter: "blur(10px)", transition: "background .2s ease",
        }}>
          <RefreshCw size={13} style={{ animation: refreshing ? "spin 0.8s linear infinite" : "none" }} />
          Refresh
        </button>
      </div>

      {/* Stat Cards */}
      {!loading && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "14px" }}>
          {statCards.map((s, i) => (
            <StatCard key={s.label} icon={s.icon} label={s.label} value={s.value}
              iconBg={s.iconBg} iconColor={s.iconColor} index={i} />
          ))}
        </div>
      )}

      {/* Alert bar */}
      {!loading && (outOfStock > 0 || lowStock > 0) && (
        <div style={{
          padding: "14px 18px", borderRadius: "14px",
          background: outOfStock > 0 ? "rgba(248,113,113,0.08)" : "rgba(251,146,60,0.08)",
          border: `1px solid ${outOfStock > 0 ? "rgba(248,113,113,0.25)" : "rgba(251,146,60,0.25)"}`,
          display: "flex", alignItems: "center", gap: "10px",
          backdropFilter: "blur(10px)",
          opacity: 0, animation: "fadeUp 0.5s ease 0.5s forwards",
        }}>
          <AlertTriangle size={15} color={outOfStock > 0 ? "#f87171" : "#fb923c"} />
          <span style={{ fontSize: "13px", fontWeight: 600, color: outOfStock > 0 ? "#f87171" : "#fb923c" }}>
            {outOfStock > 0 ? `${outOfStock} product${outOfStock > 1 ? "s" : ""} are out of stock` : `${lowStock} product${lowStock > 1 ? "s" : ""} running low`}
          </span>
          <button onClick={() => setStockFilter(outOfStock > 0 ? "out" : "low")} style={{
            marginLeft: "auto", fontSize: "11px", fontWeight: 700,
            color: outOfStock > 0 ? "#f87171" : "#fb923c",
            background: "none", border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", gap: "4px",
          }}>
            View <ChevronRight size={12} />
          </button>
        </div>
      )}

      {/* Filters */}
      <div style={{
        display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center",
        opacity: 0, animation: "fadeUp 0.5s ease 0.55s forwards",
      }}>
        <div style={{ position: "relative", flex: "1", minWidth: "200px", maxWidth: "340px" }}>
          <Search size={14} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "rgba(148,163,184,0.5)", zIndex: 1 }} />
          <Input placeholder="Search products or SKU…" value={search} onChange={e => setSearch(e.target.value)}
            className="pl-10"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }} />
        </div>
        <Select value={stockFilter} onValueChange={v => setStockFilter(v as any)}>
          <SelectTrigger style={{ width: "150px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}>
            <SelectValue placeholder="Stock Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stock</SelectItem>
            <SelectItem value="ok">In Stock</SelectItem>
            <SelectItem value="low">Low Stock</SelectItem>
            <SelectItem value="out">Out of Stock</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger style={{ width: "150px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}>
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
          </SelectContent>
        </Select>
        <div style={{ fontSize: "12px", color: "rgba(148,163,184,0.5)", marginLeft: "auto" }}>
          {filtered.length} of {products.length} products
        </div>
      </div>

      {/* Table */}
      <div style={{
        ...cardStyle, borderRadius: "20px", overflow: "hidden",
        opacity: 0, animation: "fadeUp 0.5s ease 0.6s forwards",
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
            <Package size={40} style={{ display: "block", margin: "0 auto 12px", color: "rgba(148,163,184,0.2)" }} />
            <p style={{ fontWeight: 600, color: "rgba(148,163,184,0.4)" }}>No products match your filters</p>
            <button onClick={() => { setSearch(""); setStockFilter("all"); setCategoryFilter("all"); }}
              style={{ marginTop: "12px", fontSize: "12px", color: "#60a5fa", fontWeight: 700, border: "none", background: "none", cursor: "pointer" }}>
              Clear filters
            </button>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  {["Product","SKU","Stock","Level","Threshold","Cost / Price","Margin","Sold","Size Breakdown","Actions"].map(h => (
                    <th key={h} style={{
                      padding: "14px 16px", textAlign: "left",
                      fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
                      color: "rgba(148,163,184,0.6)", whiteSpace: "nowrap",
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, rowIdx) => {
                  const ss = stockStatus(p);
                  const mg = p.cost_price && p.price ? Math.round(((p.price - p.cost_price) / p.price) * 100) : null;
                  return (
                    <tr key={p.id} style={{
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                      transition: "background .18s ease",
                    }}
                      onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = "rgba(255,255,255,0.03)"}
                      onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = ""}
                    >
                      {/* Product */}
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "11px" }}>
                          {p.image_url ? (
                            <img src={p.image_url} alt={p.name} style={{ width: 40, height: 40, borderRadius: "10px", objectFit: "cover", flexShrink: 0, border: "1px solid rgba(255,255,255,0.1)" }} />
                          ) : (
                            <div style={{
                              width: 40, height: 40, borderRadius: "10px", flexShrink: 0,
                              background: `${PIE_COLORS[rowIdx % PIE_COLORS.length]}20`,
                              display: "flex", alignItems: "center", justifyContent: "center",
                            }}>
                              <Package size={15} style={{ color: PIE_COLORS[rowIdx % PIE_COLORS.length] }} />
                            </div>
                          )}
                          <div>
                            <div style={{ fontWeight: 700, fontSize: "13px", color: "#fff" }}>{p.name}</div>
                            {p.brand && <div style={{ fontSize: "10px", color: "rgba(148,163,184,0.5)", fontWeight: 600 }}>{p.brand}</div>}
                            <div style={{ fontSize: "9px", color: "rgba(148,163,184,0.35)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".08em", marginTop: "2px" }}>{p.category}</div>
                          </div>
                        </div>
                      </td>

                      {/* SKU */}
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ fontFamily: "monospace", fontSize: "11px", color: "rgba(148,163,184,0.5)" }}>{p.sku || "—"}</span>
                      </td>

                      {/* Stock badge */}
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: "5px",
                          padding: "4px 10px", borderRadius: "999px", fontSize: "10px", fontWeight: 700,
                          background: ss.bg, border: `1px solid ${ss.border}`, color: ss.color,
                        }}>
                          {p.stock_quantity === 0 ? <XCircle size={10} /> : p.stock_quantity <= (p.low_stock_threshold ?? 10) ? <AlertTriangle size={10} /> : <CheckCircle2 size={10} />}
                          {ss.label}
                        </span>
                      </td>

                      {/* Stock bar */}
                      <td style={{ padding: "12px 16px" }}>
                        <StockBar current={p.stock_quantity} threshold={p.low_stock_threshold} max={maxStock} />
                      </td>

                      {/* Threshold */}
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ fontSize: "12px", color: "rgba(148,163,184,0.5)" }}>{p.low_stock_threshold ?? 10}</span>
                      </td>

                      {/* Cost / Price */}
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ fontSize: "12px" }}>
                          <div style={{ color: "rgba(148,163,184,0.45)", fontWeight: 500 }}>₱{Number(p.cost_price || 0).toLocaleString()}</div>
                          <div style={{ fontWeight: 800, color: "#fff" }}>₱{Number(p.price).toLocaleString()}</div>
                        </div>
                      </td>

                      {/* Margin */}
                      <td style={{ padding: "12px 16px" }}>
                        {mg !== null ? (
                          <span style={{
                            fontSize: "11px", fontWeight: 800, padding: "3px 8px", borderRadius: "6px",
                            background: mg >= 40 ? "rgba(52,211,153,0.15)" : mg >= 20 ? "rgba(251,146,60,0.15)" : "rgba(248,113,113,0.15)",
                            color: mg >= 40 ? "#34d399" : mg >= 20 ? "#fb923c" : "#f87171",
                            border: `1px solid ${mg >= 40 ? "rgba(52,211,153,0.3)" : mg >= 20 ? "rgba(251,146,60,0.3)" : "rgba(248,113,113,0.3)"}`,
                          }}>{mg}%</span>
                        ) : <span style={{ color: "rgba(148,163,184,0.25)", fontSize: "12px" }}>—</span>}
                      </td>

                      {/* Sold */}
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                          <span style={{ fontSize: "13px", fontWeight: 700, color: "#fff" }}>{p.sold_count || 0}</span>
                          {(p.sold_count || 0) > 50 && (
                            <span style={{ fontSize: "9px", fontWeight: 800, padding: "2px 5px", borderRadius: "4px", background: "rgba(99,102,241,0.2)", color: "#a78bfa", border: "1px solid rgba(99,102,241,0.3)" }}>HOT</span>
                          )}
                        </div>
                      </td>

                      {/* Size breakdown */}
                      <td style={{ padding: "12px 16px" }}><SizeStockBreakdown product={p} /></td>

                      {/* Actions */}
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                          <button onClick={() => openAdjust(p)} style={{
                            display: "inline-flex", alignItems: "center", gap: "5px",
                            padding: "6px 12px", borderRadius: "8px", border: "none", cursor: "pointer",
                            fontWeight: 700, fontSize: "11px", letterSpacing: ".02em",
                            background: "rgba(96,165,250,0.15)", color: "#60a5fa",
                            border: "1px solid rgba(96,165,250,0.2)" as any,
                            transition: "background .18s ease, transform .18s ease",
                          }}
                            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(96,165,250,0.25)"; (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)"; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(96,165,250,0.15)"; (e.currentTarget as HTMLButtonElement).style.transform = ""; }}
                          >
                            <Plus size={11} /> Adjust
                          </button>
                          <button onClick={() => viewLogs(p)} style={{
                            display: "inline-flex", alignItems: "center", gap: "5px",
                            padding: "6px 12px", borderRadius: "8px", border: "none", cursor: "pointer",
                            fontWeight: 700, fontSize: "11px",
                            background: "rgba(255,255,255,0.06)", color: "rgba(148,163,184,0.7)",
                            border: "1px solid rgba(255,255,255,0.08)" as any,
                            transition: "background .18s ease, transform .18s ease",
                          }}
                            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.1)"; (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)"; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)"; (e.currentTarget as HTMLButtonElement).style.transform = ""; }}
                          >
                            <History size={11} /> Log
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

      {/* ── Adjust Stock Dialog ── */}
      <Dialog open={adjustDialog} onOpenChange={setAdjustDialog}>
        <DialogContent style={{ maxWidth: "440px", background: "rgba(10,15,30,0.97)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(30px)" }}>
          <DialogHeader>
            <DialogTitle style={{ fontSize: "1.3rem", fontWeight: 800, color: "#fff" }}>Adjust Stock</DialogTitle>
          </DialogHeader>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "8px" }}>
            {/* Product info */}
            <div style={{
              display: "flex", alignItems: "center", gap: "12px",
              padding: "12px 14px", borderRadius: "12px",
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
            }}>
              {selectedProduct?.image_url && (
                <img src={selectedProduct.image_url} alt={selectedProduct?.name}
                  style={{ width: 44, height: 44, borderRadius: "10px", objectFit: "cover", border: "1px solid rgba(255,255,255,0.1)" }} />
              )}
              <div>
                <div style={{ fontWeight: 700, fontSize: "13.5px", color: "#fff" }}>{selectedProduct?.name}</div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "3px" }}>
                  <span style={{ fontSize: "11px", color: "rgba(148,163,184,0.6)", fontWeight: 600 }}>Current:</span>
                  <span style={{
                    fontSize: "1.2rem", lineHeight: 1, fontWeight: 800,
                    color: selectedProduct?.stock_quantity === 0 ? "#f87171"
                      : selectedProduct?.stock_quantity <= (selectedProduct?.low_stock_threshold ?? 10) ? "#fb923c"
                      : "#34d399",
                  }}>{selectedProduct?.stock_quantity}</span>
                  <span style={{ fontSize: "11px", color: "rgba(148,163,184,0.4)" }}>units</span>
                </div>
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "rgba(148,163,184,0.6)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: ".08em" }}>Adjustment Type</label>
              <Select value={adjustType} onValueChange={setAdjustType}>
                <SelectTrigger style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="added">➕ Restock / Add Units</SelectItem>
                  <SelectItem value="sold">🛍️ Mark as Sold</SelectItem>
                  <SelectItem value="returned">↩️ Customer Return</SelectItem>
                  <SelectItem value="adjusted">✏️ Manual Adjustment</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "rgba(148,163,184,0.6)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: ".08em" }}>Quantity</label>
              <Input type="number" min={1} placeholder="Enter quantity" value={adjustQty || ""}
                onChange={e => setAdjustQty(parseInt(e.target.value) || 0)}
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }} />
              {adjustQty > 0 && selectedProduct && (
                <p style={{ marginTop: "6px", fontSize: "11.5px", color: "rgba(148,163,184,0.5)", fontWeight: 500 }}>
                  New stock: <strong style={{ color: "#34d399" }}>{Math.max(0, selectedProduct.stock_quantity + ((adjustType === "added" || adjustType === "returned") ? adjustQty : -adjustQty))}</strong> units
                </p>
              )}
            </div>

            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "rgba(148,163,184,0.6)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: ".08em" }}>Notes (optional)</label>
              <Input placeholder="e.g. Received from supplier, PO #123" value={adjustNotes} onChange={e => setAdjustNotes(e.target.value)}
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }} />
            </div>

            <button onClick={handleAdjust} disabled={saving || adjustQty === 0} style={{
              width: "100%", padding: "13px", borderRadius: "12px",
              background: saving || adjustQty === 0 ? "rgba(52,211,153,0.4)" : "rgba(52,211,153,0.9)",
              color: "#001a0f", fontWeight: 800, fontSize: "13px",
              letterSpacing: ".06em", textTransform: "uppercase",
              border: "none", cursor: saving || adjustQty === 0 ? "not-allowed" : "pointer",
              boxShadow: "0 6px 22px -5px rgba(52,211,153,0.3)",
            }}>
              {saving ? "Applying…" : "Apply Adjustment"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Stock Logs Dialog ── */}
      <Dialog open={logsDialog} onOpenChange={setLogsDialog}>
        <DialogContent style={{ maxWidth: "520px", background: "rgba(10,15,30,0.97)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(30px)" }}>
          <DialogHeader>
            <DialogTitle style={{ fontSize: "1.3rem", fontWeight: 800, color: "#fff" }}>Stock History</DialogTitle>
            <p style={{ fontSize: "12px", color: "rgba(148,163,184,0.5)", marginTop: "4px", fontWeight: 500 }}>{selectedProduct?.name}</p>
          </DialogHeader>
          <div style={{ maxHeight: "420px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "7px", marginTop: "12px", paddingRight: "4px" }}>
            {logs.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 0" }}>
                <History size={32} style={{ display: "block", margin: "0 auto 12px", color: "rgba(148,163,184,0.2)" }} />
                <p style={{ color: "rgba(148,163,184,0.4)", fontWeight: 600 }}>No stock history yet</p>
              </div>
            ) : logs.map(log => {
              const cfg = adjustTypeConfig[log.change_type] || adjustTypeConfig.adjusted;
              const isPositive = log.quantity_change > 0;
              return (
                <div key={log.id} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "12px 14px", borderRadius: "12px",
                  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)",
                  transition: "background .16s ease",
                }}
                  onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.07)"}
                  onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.04)"}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: "10px", flexShrink: 0,
                      background: `${cfg.color}18`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {isPositive ? <ArrowUpRight size={15} color={cfg.color} /> : <ArrowDownRight size={15} color={cfg.color} />}
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{
                          fontSize: "10px", fontWeight: 800, padding: "2px 8px", borderRadius: "999px",
                          background: `${cfg.color}18`, color: cfg.color,
                          border: `1px solid ${cfg.color}30`,
                        }}>{cfg.label}</span>
                        <span style={{ fontWeight: 800, fontSize: "13px", color: isPositive ? "#34d399" : "#f87171" }}>
                          {isPositive ? "+" : ""}{log.quantity_change}
                        </span>
                      </div>
                      {log.notes && <div style={{ fontSize: "11.5px", color: "rgba(148,163,184,0.5)", marginTop: "3px" }}>{log.notes}</div>}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: "11px", fontWeight: 700, color: "rgba(148,163,184,0.5)" }}>
                      {log.quantity_before} → {log.quantity_after}
                    </div>
                    <div style={{ fontSize: "10px", color: "rgba(148,163,184,0.3)", marginTop: "2px" }}>
                      {new Date(log.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      {" · "}
                      {new Date(log.created_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes bounce { from { transform: translateY(0); } to { transform: translateY(-8px); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </div>
  );
};

export default InventoryPage;
