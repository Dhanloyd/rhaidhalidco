import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingCart, Heart, Eye, ChevronDown, ChevronRight, SlidersHorizontal, X, Star, Check, ArrowUpDown, Grid3X3, LayoutList, Search, Zap, Tag, Truck, Ruler } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { categoryLabels, categoryIcons, type ProductCategory } from "@/data/products";

/* ─── Global styles ─── */
const SHOP_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Outfit:wght@300;400;500;600;700;800&display=swap');

  :root {
    --ink: #0a0d14; --ink2: #1a1f2e; --blue: #1a56db; --blue2: #2563eb;
    --blue-light: #60a5fa; --red: #ef4444; --green: #16a34a; --gold: #f59e0b;
    --bg: #f5f5f5; --surface: #ffffff; --border: rgba(10,13,20,.1);
    --muted: rgba(10,13,20,.45); --r: 10px;
  }
  @keyframes fadeUp { from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn { from{opacity:0}to{opacity:1} }
  @keyframes shimmer { 0%{background-position:-400px 0}100%{background-position:400px 0} }
  @keyframes badgePop { 0%{transform:scale(0) rotate(-8deg);opacity:0}80%{transform:scale(1.1) rotate(2deg)}100%{transform:scale(1) rotate(0);opacity:1} }
  @keyframes slideInLeft { from{opacity:0;transform:translateX(-20px)}to{opacity:1;transform:translateX(0)} }
  @keyframes overlayIn { from{opacity:0}to{opacity:1} }
  @keyframes slideUp { from{opacity:0;transform:translateY(40px)}to{opacity:1;transform:translateY(0)} }

  .shop-fade-up { animation:fadeUp .55s cubic-bezier(.22,1,.36,1) both; }
  .shop-fade-in { animation:fadeIn .4s ease both; }

  .zp-card { background:#fff;border-radius:var(--r);overflow:hidden;transition:transform .35s cubic-bezier(.22,1,.36,1),box-shadow .35s ease;cursor:pointer;position:relative; }
  .zp-card:hover { transform:translateY(-5px);box-shadow:0 20px 52px -12px rgba(10,13,20,.18); }
  .zp-img-wrap { position:relative;overflow:hidden;background:#f3f4f6; }
  .zp-img-wrap img { width:100%;height:100%;object-fit:cover;transition:transform .65s cubic-bezier(.22,1,.36,1);display:block; }
  .zp-card:hover .zp-img-wrap img { transform:scale(1.07); }
  .zp-actions { position:absolute;right:10px;top:10px;display:flex;flex-direction:column;gap:8px;opacity:0;transform:translateX(10px);transition:opacity .28s ease,transform .28s ease;z-index:4; }
  .zp-card:hover .zp-actions { opacity:1;transform:translateX(0); }
  .zp-action-btn { width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,.95);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 12px rgba(10,13,20,.14);transition:transform .2s ease,background .2s ease; }
  .zp-action-btn:hover { transform:scale(1.12);background:#fff; }
  .zp-add-bar { position:absolute;bottom:0;left:0;right:0;padding:0 10px 10px;transform:translateY(100%);transition:transform .32s cubic-bezier(.22,1,.36,1);z-index:4; }
  .zp-card:hover .zp-add-bar { transform:translateY(0); }
  .zp-add-btn { width:100%;padding:10px 0;background:#0a0d14;color:#fff;border:none;border-radius:8px;cursor:pointer;font-family:'Outfit',sans-serif;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;display:flex;align-items:center;justify-content:center;gap:7px;transition:background .2s ease; }
  .zp-add-btn:hover { background:var(--blue); }
  .zp-badge { position:absolute;top:10px;left:10px;z-index:3;padding:3px 9px;border-radius:5px;font-family:'Outfit',sans-serif;font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;animation:badgePop .4s cubic-bezier(.22,1,.36,1) both; }
  .zp-info { padding:12px 14px 16px; }
  .zp-brand { font-size:10px;font-weight:800;letter-spacing:.16em;color:var(--blue);text-transform:uppercase;margin-bottom:5px; }
  .zp-name { font-family:'Outfit',sans-serif;font-size:13.5px;font-weight:600;color:#0a0d14;line-height:1.38;margin-bottom:8px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;min-height:2.76em; }
  .zp-stars { display:flex;align-items:center;gap:5px;margin-bottom:9px; }
  .zp-stars-row { display:flex;gap:2px; }
  .zp-review-count { font-size:11px;color:var(--muted);font-weight:500; }
  .zp-price-row { display:flex;align-items:center;gap:8px;flex-wrap:wrap; }
  .zp-price { font-size:15px;font-weight:800;color:#0a0d14; }
  .zp-original { font-size:12px;color:var(--muted);text-decoration:line-through;font-weight:500; }
  .zp-discount { font-size:11px;font-weight:800;color:#fff;background:var(--red);padding:2px 6px;border-radius:4px;letter-spacing:.04em; }
  .zp-shipping { margin-top:7px;font-size:11px;font-weight:700;color:var(--green);display:flex;align-items:center;gap:4px; }
  .zp-sidebar { flex-shrink:0; }
  .zp-filter-group { margin-bottom:28px; }
  .zp-filter-title { font-family:'Outfit',sans-serif;font-size:12px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:#0a0d14;margin-bottom:14px;display:flex;align-items:center;justify-content:space-between;cursor:pointer;user-select:none;padding-bottom:10px;border-bottom:1.5px solid var(--border); }
  .zp-cat-item { display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:8px;cursor:pointer;font-family:'Outfit',sans-serif;font-size:13.5px;font-weight:500;color:#0a0d14;transition:background .2s ease,color .2s ease;margin-bottom:2px; }
  .zp-cat-item:hover { background:rgba(26,86,219,.06);color:var(--blue); }
  .zp-cat-item.active { background:rgba(26,86,219,.1);color:var(--blue);font-weight:700; }
  .zp-cat-count { margin-left:auto;font-size:11px;font-weight:700;color:var(--muted);background:rgba(10,13,20,.06);padding:2px 7px;border-radius:999px; }
  .zp-range { width:100%;accent-color:var(--blue);cursor:pointer; }
  .zp-swatch { width:28px;height:28px;border-radius:50%;cursor:pointer;border:2px solid transparent;transition:transform .2s ease,border-color .2s ease;flex-shrink:0; }
  .zp-swatch:hover { transform:scale(1.15); }
  .zp-swatch.active { border-color:#0a0d14; }
  .zp-size { padding:6px 14px;border-radius:6px;cursor:pointer;font-family:'Outfit',sans-serif;font-size:12px;font-weight:600;border:1.5px solid var(--border);color:#0a0d14;transition:background .2s ease,border-color .2s ease,color .2s ease; }
  .zp-size:hover { border-color:var(--blue);color:var(--blue); }
  .zp-size.active { background:var(--blue);border-color:var(--blue);color:#fff; }
  .zp-sort-bar { display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;gap:12px;flex-wrap:wrap; }
  .zp-sort-select { font-family:'Outfit',sans-serif;font-size:13px;font-weight:600;border:1.5px solid var(--border);border-radius:8px;padding:8px 14px;background:#fff;color:#0a0d14;cursor:pointer;outline:none;appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%230a0d14' stroke-width='2.5'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 10px center;padding-right:32px;transition:border-color .2s ease; }
  .zp-sort-select:hover { border-color:var(--blue); }
  .zp-view-toggle { display:flex;gap:4px; }
  .zp-view-btn { width:36px;height:36px;border-radius:8px;border:1.5px solid var(--border);background:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .2s ease,border-color .2s ease; }
  .zp-view-btn.active { background:var(--ink);border-color:var(--ink);color:#fff; }
  .zp-view-btn:hover:not(.active) { border-color:var(--blue); }
  .zp-filter-overlay { position:fixed;inset:0;background:rgba(10,13,20,.45);z-index:50;animation:overlayIn .25s ease;backdrop-filter:blur(4px); }
  .zp-filter-drawer { position:fixed;top:0;right:0;bottom:0;width:min(340px,90vw);background:#fff;z-index:51;overflow-y:auto;padding:24px 20px;animation:slideInLeft .3s cubic-bezier(.22,1,.36,1); }
  .zp-skeleton { background:linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%);background-size:400px 100%;animation:shimmer 1.4s infinite;border-radius:var(--r); }
  .zp-search-wrap { position:relative;margin-bottom:20px; }
  .zp-search { width:100%;padding:10px 14px 10px 40px;border:1.5px solid var(--border);border-radius:10px;font-family:'Outfit',sans-serif;font-size:13px;background:#fff;color:#0a0d14;outline:none;transition:border-color .2s ease,box-shadow .2s ease; }
  .zp-search:focus { border-color:var(--blue);box-shadow:0 0 0 3px rgba(26,86,219,.12); }
  .zp-search-icon { position:absolute;left:13px;top:50%;transform:translateY(-50%);pointer-events:none;color:var(--muted); }
  .zp-banner-strip { display:flex;align-items:center;justify-content:center;gap:32px;flex-wrap:wrap;padding:14px 20px;background:#0a0d14;color:#fff; }
  .zp-banner-item { display:flex;align-items:center;gap:8px;font-family:'Outfit',sans-serif;font-size:12px;font-weight:600;letter-spacing:.06em; }
  .zp-applied-tag { display:inline-flex;align-items:center;gap:6px;padding:5px 12px;border-radius:999px;background:rgba(26,86,219,.1);border:1.5px solid rgba(26,86,219,.2);font-family:'Outfit',sans-serif;font-size:12px;font-weight:600;color:var(--blue);cursor:pointer;transition:background .2s ease; }
  .zp-applied-tag:hover { background:rgba(26,86,219,.18); }
  .zp-results-count { font-family:'Outfit',sans-serif;font-size:13px;color:var(--muted);font-weight:500; }
  .zp-empty { display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px 20px;text-align:center;background:#fff;border-radius:var(--r);border:1.5px dashed var(--border); }
  .zp-load-more { display:flex;align-items:center;justify-content:center;gap:8px;width:100%;padding:14px 0;margin-top:32px;border:2px solid var(--border);border-radius:999px;background:#fff;color:#0a0d14;font-family:'Outfit',sans-serif;font-size:13px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;cursor:pointer;transition:border-color .2s ease,background .2s ease; }
  .zp-load-more:hover { border-color:var(--blue);color:var(--blue);background:rgba(26,86,219,.04); }
  .zp-size-overlay { position:fixed;inset:0;background:rgba(10,13,20,.55);z-index:100;display:flex;align-items:flex-end;justify-content:center;animation:overlayIn .2s ease;backdrop-filter:blur(6px); }
  .zp-size-sheet { background:#fff;width:100%;max-width:520px;border-radius:20px 20px 0 0;padding:0 0 32px;animation:slideUp .35s cubic-bezier(.22,1,.36,1);max-height:90vh;overflow-y:auto; }
  .zp-size-handle { width:40px;height:4px;background:#e5e7eb;border-radius:2px;margin:14px auto 0; }
  .zp-size-pill { display:flex;align-items:center;justify-content:center;min-width:52px;height:44px;padding:0 14px;border:1.5px solid #e5e7eb;border-radius:8px;cursor:pointer;font-family:'Outfit',sans-serif;font-size:13px;font-weight:600;color:#0a0d14;transition:all .18s ease;position:relative; }
  .zp-size-pill:hover:not(.oos) { border-color:#0a0d14;background:#f9f9f9; }
  .zp-size-pill.selected { border-color:#0a0d14;background:#0a0d14;color:#fff; }
  .zp-size-pill.oos { opacity:.38;cursor:not-allowed;text-decoration:line-through; }
  .zp-size-pill .zp-stock-dot { position:absolute;top:-4px;right:-4px;width:8px;height:8px;border-radius:50%;background:#f59e0b;border:1.5px solid #fff; }
  .stagger-1{animation-delay:.05s} .stagger-2{animation-delay:.12s} .stagger-3{animation-delay:.19s} .stagger-4{animation-delay:.26s}

  /* ── Color swatch in sheet ── */
  .zp-color-swatch {
    width:32px;height:32px;border-radius:50%;cursor:pointer;
    border:2.5px solid transparent;
    transition:transform .18s ease,border-color .18s ease,box-shadow .18s ease;
    flex-shrink:0;position:relative;
  }
  .zp-color-swatch:hover { transform:scale(1.15); }
  .zp-color-swatch.selected {
    border-color:#0a0d14;
    box-shadow:0 0 0 3px rgba(255,255,255,1),0 0 0 5px #0a0d14;
    transform:scale(1.1);
  }
  .zp-color-label {
    font-family:'Outfit',sans-serif;font-size:11px;font-weight:600;
    color:rgba(10,13,20,.5);margin-top:5px;text-align:center;
    transition:color .15s ease;
  }
  .zp-color-swatch.selected + .zp-color-label { color:#0a0d14;font-weight:700; }
`;

interface DbProduct {
  id: string;
  name: string;
  price: number;
  original_price?: number;
  category: string;
  image_url: string | null;
  badge: string | null;
  in_stock: boolean;
  sold_count?: number;
  rating?: number;
  review_count?: number;
  available_sizes?: string[];
  size_inventory?: { size: string; stock: number }[];
  out_of_stock_sizes?: string[];
  colors?: { name: string; hex: string }[];
}

const allCategories = Object.keys(categoryLabels) as ProductCategory[];

const SIDEBAR_COLORS = [
  { name: "Black", hex: "#0a0d14" },
  { name: "White", hex: "#f5f5f5" },
  { name: "Blue", hex: "#1a56db" },
  { name: "Red", hex: "#ef4444" },
  { name: "Gold", hex: "#f59e0b" },
  { name: "Navy", hex: "#1e3a5f" },
];

const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

const SORT_OPTIONS = [
  { value: "newest",     label: "Newest First" },
  { value: "popular",   label: "Most Popular" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc",label: "Price: High to Low" },
  { value: "rating",    label: "Top Rated" },
];

const StarRow = ({ rating = 4.5 }: { rating?: number }) => (
  <div className="zp-stars-row">
    {[1,2,3,4,5].map(n => (
      <Star key={n} size={11}
        fill={n <= Math.floor(rating) ? "#f59e0b" : "none"}
        color={n <= rating ? "#f59e0b" : "#d1d5db"}
        strokeWidth={1.5}
      />
    ))}
  </div>
);

// ── Size + Color Picker Sheet ────────────────────────────────────────────────
const SizePickerSheet = ({
  product, onClose, onAddToCart,
}: {
  product: DbProduct;
  onClose: () => void;
  onAddToCart: (productId: string, quantity: number, variants?: { selected_size?: string; selected_color?: string; selected_color_hex?: string }) => void;
}) => {
  const [selectedSize, setSelectedSize]   = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  const sizeInventory = product.size_inventory ?? [];
  const outOfStock    = product.out_of_stock_sizes ?? [];
  const availableSizes = product.available_sizes ?? [];
  const hasSizes  = availableSizes.length > 0;
  // Use colors from DB if available, fallback to none
  const colors    = product.colors ?? [];
  const hasColors = colors.length > 0;

  // Auto-select first color if only one
  useEffect(() => {
    if (colors.length === 1) setSelectedColor(colors[0].name);
  }, [product.id]);

  const hasDiscount = product.original_price && Number(product.original_price) > Number(product.price);
  const discountPct = hasDiscount
    ? Math.round((1 - Number(product.price) / Number(product.original_price!)) * 100)
    : 0;

  const getStock = (size: string) => sizeInventory.find(s => s.size === size)?.stock ?? 99;

  const canAdd = (!hasSizes || selectedSize) && (!hasColors || selectedColor);

  const handleAdd = () => {
    if (!canAdd) return;
    const colorHex = colors.find(c => c.name === selectedColor)?.hex;
    onAddToCart(product.id, 1, {
      selected_size: selectedSize ?? undefined,
      selected_color: selectedColor ?? undefined,
      selected_color_hex: colorHex ?? undefined,
    });
    onClose();
  };

  return (
    <div className="zp-size-overlay" onClick={onClose}>
      <div className="zp-size-sheet" onClick={e => e.stopPropagation()}>
        <div className="zp-size-handle" />

        {/* Product info row */}
        <div style={{ display:"flex", gap:"14px", padding:"20px 24px 0", alignItems:"flex-start" }}>
          <div style={{ width:"80px", height:"100px", borderRadius:"10px", overflow:"hidden", background:"#f3f4f6", flexShrink:0 }}>
            {product.image_url
              ? <img src={product.image_url} alt={product.name} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
              : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <ShoppingCart size={24} style={{ color:"rgba(10,13,20,.2)" }} />
                </div>
            }
          </div>
          <div style={{ flex:1 }}>
            <p style={{ fontSize:"10px", fontWeight:800, letterSpacing:".14em", color:"#1a56db", textTransform:"uppercase", marginBottom:"4px" }}>RaidKhalid</p>
            <h3 style={{ fontFamily:"'Outfit',sans-serif", fontSize:"14px", fontWeight:600, color:"#0a0d14", lineHeight:1.4, marginBottom:"8px" }}>
              {product.name}
            </h3>
            <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
              <span style={{ fontSize:"16px", fontWeight:800, color:"#0a0d14" }}>₱{Number(product.price).toLocaleString()}</span>
              {hasDiscount && <>
                <span style={{ fontSize:"12px", color:"rgba(10,13,20,.4)", textDecoration:"line-through" }}>₱{Number(product.original_price).toLocaleString()}</span>
                <span style={{ fontSize:"11px", fontWeight:800, color:"#fff", background:"#ef4444", padding:"2px 7px", borderRadius:"4px" }}>-{discountPct}%</span>
              </>}
            </div>
            {/* Selected variants preview */}
            <div style={{ display:"flex", gap:"6px", marginTop:"8px", flexWrap:"wrap" }}>
              {selectedColor && (
                <span style={{
                  display:"inline-flex", alignItems:"center", gap:"4px",
                  padding:"2px 8px", borderRadius:"4px",
                  background:"rgba(10,13,20,.06)", border:"1px solid rgba(10,13,20,.1)",
                  fontSize:"10px", fontWeight:700, color:"#0a0d14",
                }}>
                  <span style={{ width:"8px", height:"8px", borderRadius:"50%", background:colors.find(c=>c.name===selectedColor)?.hex, border:"1px solid rgba(10,13,20,.15)", flexShrink:0 }} />
                  {selectedColor}
                </span>
              )}
              {selectedSize && (
                <span style={{
                  padding:"2px 8px", borderRadius:"4px",
                  background:"rgba(26,86,219,.1)", border:"1px solid rgba(26,86,219,.15)",
                  fontSize:"10px", fontWeight:700, color:"#1a56db", textTransform:"uppercase",
                }}>
                  {selectedSize}
                </span>
              )}
            </div>
          </div>
        </div>

        <div style={{ height:"1px", background:"rgba(10,13,20,.08)", margin:"18px 0" }} />

        {/* ── COLOR PICKER from database ── */}
        {hasColors && (
          <div style={{ padding:"0 24px 0" }}>
            <p style={{ fontFamily:"'Outfit',sans-serif", fontSize:"13px", fontWeight:700, color:"#0a0d14", marginBottom:"14px" }}>
              Select Color
              {selectedColor && (
                <span style={{ fontWeight:500, color:"rgba(10,13,20,.5)", marginLeft:"8px" }}>— {selectedColor}</span>
              )}
            </p>
            <div style={{ display:"flex", gap:"12px", flexWrap:"wrap", marginBottom:"4px" }}>
              {colors.map(color => (
                <div key={color.name} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"4px" }}>
                  <button
                    title={color.name}
                    className={`zp-color-swatch ${selectedColor === color.name ? "selected" : ""}`}
                    style={{
                      background: color.hex,
                      border: color.hex === "#f5f5f5" || color.hex === "#ffffff" || color.hex === "#fff"
                        ? "2.5px solid #e5e7eb" : "2.5px solid transparent",
                    }}
                    onClick={() => setSelectedColor(color.name)}
                  >
                    {selectedColor === color.name && (
                      <Check
                        size={13}
                        color={color.hex === "#f5f5f5" || color.hex === "#ffffff" || color.hex === "#fff" || color.hex === "#f5f5f4"
                          ? "#0a0d14" : "#fff"}
                        style={{ display:"block", margin:"auto" }}
                      />
                    )}
                  </button>
                  <span style={{
                    fontSize:"10px", fontWeight: selectedColor === color.name ? 700 : 500,
                    color: selectedColor === color.name ? "#0a0d14" : "rgba(10,13,20,.45)",
                    textAlign:"center", maxWidth:"48px", lineHeight:1.2,
                  }}>
                    {color.name}
                  </span>
                </div>
              ))}
            </div>
            <div style={{ height:"1px", background:"rgba(10,13,20,.08)", margin:"18px 0" }} />
          </div>
        )}

        {/* ── SIZE PICKER ── */}
        {hasSizes && (
          <div style={{ padding:"0 24px" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"14px" }}>
              <p style={{ fontFamily:"'Outfit',sans-serif", fontSize:"13px", fontWeight:700, color:"#0a0d14" }}>
                Select Size
                {selectedSize && (
                  <span style={{ fontWeight:500, color:"rgba(10,13,20,.5)", marginLeft:"8px" }}>— {selectedSize}</span>
                )}
              </p>
              <button style={{ display:"flex", alignItems:"center", gap:"5px", fontSize:"11px", fontWeight:600, color:"#1a56db", background:"none", border:"none", cursor:"pointer" }}>
                <Ruler size={12} /> Size Guide
              </button>
            </div>

            <div style={{ display:"flex", flexWrap:"wrap", gap:"8px", marginBottom:"6px" }}>
              {availableSizes.map(size => {
                const stock = getStock(size);
                const isOos = stock === 0 || outOfStock.includes(size);
                const isLow = !isOos && stock <= 3;
                const isSelected = selectedSize === size;
                return (
                  <button key={size}
                    className={`zp-size-pill${isOos ? " oos" : ""}${isSelected ? " selected" : ""}`}
                    onClick={() => !isOos && setSelectedSize(size)}
                    disabled={isOos}
                  >
                    {size}
                    {isLow && <span className="zp-stock-dot" />}
                    {isSelected && stock > 0 && stock <= 10 && (
                      <span style={{ position:"absolute", bottom:"-18px", left:"50%", transform:"translateX(-50%)", fontSize:"9px", fontWeight:700, color:"#f59e0b", whiteSpace:"nowrap" }}>
                        {stock} left
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div style={{ display:"flex", alignItems:"center", gap:"6px", marginTop:"20px", marginBottom:"4px" }}>
              <span style={{ width:"8px", height:"8px", borderRadius:"50%", background:"#f59e0b", border:"1.5px solid rgba(10,13,20,.12)", flexShrink:0 }} />
              <span style={{ fontSize:"11px", color:"rgba(10,13,20,.45)", fontWeight:500 }}>Low stock</span>
            </div>
          </div>
        )}

        {!hasSizes && !hasColors && (
          <div style={{ padding:"0 24px" }}>
            <p style={{ fontSize:"13px", color:"rgba(10,13,20,.5)", fontWeight:500, marginBottom:"8px" }}>
              No variants needed — ready to add!
            </p>
          </div>
        )}

        <div style={{ height:"1px", background:"rgba(10,13,20,.08)", margin:"20px 0" }} />

        {/* ── CTA ── */}
        <div style={{ padding:"0 24px", display:"flex", flexDirection:"column", gap:"10px" }}>
          {/* Validation message */}
          {!canAdd && (
            <p style={{ fontSize:"11px", color:"#f59e0b", fontWeight:600, textAlign:"center" }}>
              {hasSizes && !selectedSize && hasColors && !selectedColor
                ? "Please select a color and size"
                : hasSizes && !selectedSize
                  ? "Please select a size"
                  : "Please select a color"}
            </p>
          )}

          <button
            onClick={handleAdd}
            disabled={!canAdd}
            style={{
              width:"100%", padding:"15px 0",
              background: canAdd ? "#0a0d14" : "rgba(10,13,20,.12)",
              color: canAdd ? "#fff" : "rgba(10,13,20,.35)",
              border:"none", borderRadius:"10px", cursor: canAdd ? "pointer" : "not-allowed",
              fontFamily:"'Outfit',sans-serif", fontSize:"13px", fontWeight:700,
              letterSpacing:".08em", textTransform:"uppercase",
              display:"flex", alignItems:"center", justifyContent:"center", gap:"8px",
              transition:"all .2s ease",
            }}>
            <ShoppingCart size={15} />
            {canAdd ? "Add to Bag" : "Select Options First"}
          </button>
          <button onClick={onClose} style={{
            width:"100%", padding:"13px 0", background:"transparent", color:"rgba(10,13,20,.5)",
            border:"1.5px solid rgba(10,13,20,.12)", borderRadius:"10px", cursor:"pointer",
            fontFamily:"'Outfit',sans-serif", fontSize:"12px", fontWeight:600, letterSpacing:".06em",
          }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Product Card ─────────────────────────────────────────────────────────────
const ZProductCard = ({
  product, wished, onWish, onSelectSize, view = "grid", style = {},
}: {
  product: DbProduct;
  wished: boolean;
  onWish: (id: string) => void;
  onSelectSize: (product: DbProduct) => void;
  view?: "grid" | "list";
  style?: React.CSSProperties;
}) => {
  const rating   = product.rating ?? (4 + Math.random()).toFixed(1);
  const reviews  = product.review_count ?? Math.floor(Math.random() * 150 + 10);
  const hasDiscount = product.original_price && Number(product.original_price) > Number(product.price);
  const discountPct = hasDiscount
    ? Math.round((1 - Number(product.price) / Number(product.original_price!)) * 100) : 0;
  const availableSizes = product.available_sizes ?? [];
  const hasSizes = availableSizes.length > 0;
  const colors = product.colors ?? [];

  if (view === "list") {
    return (
      <div className="zp-card shop-fade-up" style={{ display:"flex", borderRadius:"10px", ...style }}>
        <div className="zp-img-wrap" style={{ width:"180px", flexShrink:0, height:"180px" }}>
          {product.image_url
            ? <img src={product.image_url} alt={product.name} loading="lazy" />
            : <div style={{ width:"100%", height:"100%", background:"#f3f4f6", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <ShoppingCart size={28} style={{ color:"rgba(10,13,20,.15)" }} />
              </div>
          }
          {product.badge && (
            <div className="zp-badge" style={{ background: product.badge === "hot" ? "#ef4444" : "#1a56db", color:"#fff" }}>
              {product.badge === "hot" ? "HOT" : "NEW"}
            </div>
          )}
          <div className="zp-actions">
            <button className="zp-action-btn" onClick={(e) => { e.preventDefault(); onWish(product.id); }}>
              <Heart size={15} fill={wished ? "#ef4444" : "none"} color={wished ? "#ef4444" : "#0a0d14"} strokeWidth={1.8} />
            </button>
          </div>
        </div>
        <div style={{ padding:"18px 20px", display:"flex", flexDirection:"column", gap:"6px", flex:1 }}>
          <div className="zp-brand">RaidKhalid</div>
          <h3 style={{ fontFamily:"'Outfit',sans-serif", fontSize:"15px", fontWeight:600, color:"#0a0d14", lineHeight:1.4, marginBottom:"4px" }}>{product.name}</h3>
          <div className="zp-stars">
            <StarRow rating={Number(rating)} />
            <span className="zp-review-count">({reviews})</span>
          </div>
          {/* Color dots */}
          {colors.length > 0 && (
            <div style={{ display:"flex", gap:"5px", flexWrap:"wrap", marginBottom:"2px" }}>
              {colors.map(c => (
                <span key={c.name} title={c.name} style={{
                  width:"14px", height:"14px", borderRadius:"50%", background:c.hex,
                  border:"1.5px solid rgba(10,13,20,.15)", flexShrink:0,
                }} />
              ))}
            </div>
          )}
          {hasSizes && (
            <div style={{ display:"flex", gap:"4px", flexWrap:"wrap" }}>
              {availableSizes.slice(0, 6).map(s => (
                <span key={s} style={{ fontSize:"10px", fontWeight:600, padding:"2px 7px", borderRadius:"4px", border:"1px solid rgba(10,13,20,.15)", color:"rgba(10,13,20,.6)" }}>{s}</span>
              ))}
            </div>
          )}
          <div className="zp-price-row">
            <span className="zp-price">₱{Number(product.price).toLocaleString()}</span>
            {hasDiscount && <>
              <span className="zp-original">₱{Number(product.original_price).toLocaleString()}</span>
              <span className="zp-discount">-{discountPct}%</span>
            </>}
          </div>
          {Number(product.price) >= 500 && <div className="zp-shipping"><Truck size={12} /> Free Shipping</div>}
          <div style={{ marginTop:"auto", paddingTop:"12px" }}>
            <button className="zp-add-btn" style={{ width:"auto", padding:"10px 24px", borderRadius:"8px" }}
              onClick={(e) => { e.preventDefault(); onSelectSize(product); }}>
              <ShoppingCart size={13} /> {hasSizes || colors.length > 0 ? "Select Options" : "Add to Bag"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="zp-card shop-fade-up" style={style}>
      <div className="zp-img-wrap" style={{ height:"clamp(220px,26vw,300px)" }}>
        {product.image_url
          ? <img src={product.image_url} alt={product.name} loading="lazy" />
          : <div style={{ width:"100%", height:"100%", background:"linear-gradient(135deg,#e8f0fe,#f3f4f6)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <ShoppingCart size={32} style={{ color:"rgba(10,13,20,.15)" }} />
            </div>
        }
        <div className="zp-actions">
          <button className="zp-action-btn" onClick={(e) => { e.preventDefault(); onWish(product.id); }}>
            <Heart size={15} fill={wished ? "#ef4444" : "none"} color={wished ? "#ef4444" : "#0a0d14"} strokeWidth={1.8} />
          </button>
          <button className="zp-action-btn" onClick={(e) => e.preventDefault()}>
            <Eye size={14} color="#0a0d14" strokeWidth={1.8} />
          </button>
        </div>
        {product.badge && (
          <div className="zp-badge" style={{ background: product.badge === "hot" ? "#ef4444" : "#1a56db", color:"#fff" }}>
            {product.badge === "hot" ? "HOT" : "NEW"}
          </div>
        )}
        {(product.sold_count ?? 0) > 30 && (
          <div style={{ position:"absolute", bottom:48, left:10, zIndex:3, background:"rgba(10,13,20,.72)", backdropFilter:"blur(6px)", borderRadius:"5px", padding:"3px 8px", fontSize:"10px", fontWeight:700, color:"rgba(255,255,255,.88)" }}>
            🔥 {product.sold_count}+ sold
          </div>
        )}
        <div className="zp-add-bar">
          <button className="zp-add-btn" onClick={(e) => { e.preventDefault(); onSelectSize(product); }}>
            <ShoppingCart size={13} /> {hasSizes || colors.length > 0 ? "Select Options" : "Add to Bag"}
          </button>
        </div>
      </div>

      <div className="zp-info">
        <div className="zp-brand">RaidKhalid</div>
        <div className="zp-name">{product.name}</div>
        <div className="zp-stars">
          <StarRow rating={Number(rating)} />
          <span className="zp-review-count">({reviews})</span>
        </div>
        {/* Color dots on card */}
        {colors.length > 0 && (
          <div style={{ display:"flex", gap:"5px", flexWrap:"wrap", marginBottom:"8px", alignItems:"center" }}>
            {colors.map(c => (
              <span key={c.name} title={c.name} style={{
                width:"12px", height:"12px", borderRadius:"50%", background:c.hex,
                border:"1.5px solid rgba(10,13,20,.15)", flexShrink:0,
              }} />
            ))}
            <span style={{ fontSize:"10px", color:"rgba(10,13,20,.4)", fontWeight:500 }}>
              {colors.length} color{colors.length > 1 ? "s" : ""}
            </span>
          </div>
        )}
        {hasSizes && (
          <div style={{ display:"flex", gap:"4px", flexWrap:"wrap", marginBottom:"8px" }}>
            {availableSizes.slice(0, 5).map(s => (
              <span key={s} style={{ fontSize:"10px", fontWeight:600, padding:"2px 7px", borderRadius:"4px", border:"1px solid rgba(10,13,20,.15)", color:"rgba(10,13,20,.55)" }}>{s}</span>
            ))}
            {availableSizes.length > 5 && (
              <span style={{ fontSize:"10px", color:"rgba(10,13,20,.4)", fontWeight:500, alignSelf:"center" }}>+{availableSizes.length - 5}</span>
            )}
          </div>
        )}
        <div className="zp-price-row">
          <span className="zp-price">₱{Number(product.price).toLocaleString()}</span>
          {hasDiscount && <>
            <span className="zp-original">₱{Number(product.original_price).toLocaleString()}</span>
            <span className="zp-discount">-{discountPct}%</span>
          </>}
        </div>
        {Number(product.price) >= 500 && <div className="zp-shipping"><Truck size={11} /> Free Shipping</div>}
      </div>
    </div>
  );
};

// ── Filter Section ────────────────────────────────────────────────────────────
const FilterSection = ({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="zp-filter-group">
      <div className="zp-filter-title" onClick={() => setOpen(o => !o)}>
        {title}
        <ChevronDown size={14} style={{ transform: open ? "rotate(180deg)" : "rotate(0)", transition:"transform .25s ease" }} />
      </div>
      {open && <div className="shop-fade-in">{children}</div>}
    </div>
  );
};

const SkeletonCard = () => (
  <div style={{ borderRadius:"10px", overflow:"hidden", background:"#fff" }}>
    <div className="zp-skeleton" style={{ height:"260px" }} />
    <div style={{ padding:"12px 14px 16px", display:"flex", flexDirection:"column", gap:"8px" }}>
      <div className="zp-skeleton" style={{ height:"10px", width:"40%", borderRadius:"4px" }} />
      <div className="zp-skeleton" style={{ height:"14px", width:"85%", borderRadius:"4px" }} />
      <div className="zp-skeleton" style={{ height:"12px", width:"60%", borderRadius:"4px" }} />
      <div className="zp-skeleton" style={{ height:"16px", width:"45%", borderRadius:"4px" }} />
    </div>
  </div>
);

// ── Main ShopPage ─────────────────────────────────────────────────────────────
const ShopPage = () => {
  const { addToCart } = useCart();
  const [products, setProducts]             = useState<DbProduct[]>([]);
  const [loading, setLoading]               = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [sortBy, setSortBy]                 = useState("newest");
  const [view, setView]                     = useState<"grid" | "list">("grid");
  const [wishlist, setWishlist]             = useState<Set<string>>(new Set());
  const [search, setSearch]                 = useState("");
  const [priceMax, setPriceMax]             = useState(5000);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes]   = useState<string[]>([]);
  const [showMobileFilter, setShowMobileFilter] = useState(false);
  const [visibleCount, setVisibleCount]     = useState(12);
  const [sizePickerProduct, setSizePickerProduct] = useState<DbProduct | null>(null);

  useEffect(() => {
    const id = "zp-shop-styles";
    if (!document.getElementById(id)) {
      const s = document.createElement("style");
      s.id = id; s.textContent = SHOP_STYLES;
      document.head.appendChild(s);
    }

    const fetchProducts = async () => {
      const { data } = await supabase.from("products").select("*").eq("in_stock", true).order("created_at", { ascending: false });
      setProducts(data || []);
      setLoading(false);
    };

    fetchProducts();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchProducts, 30000);

    // Real-time subscription for instant updates
    const channel = supabase
      .channel("shop-products")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "products" }, fetchProducts)
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

const handleAddToCart = async (
  productId: string,
  quantity: number,
  variants?: {
    selected_size?: string;
    selected_color?: string;
    selected_color_hex?: string;
  }
) => {
  // Optimistically add to cart UI immediately
  addToCart(productId, quantity, variants);

  // Deduct stock if a size was selected
  if (variants?.selected_size) {
    const { data: updatedInventory, error } = await supabase.rpc("deduct_size_stock", {
      p_id: productId,
      p_size: variants.selected_size,
      p_qty: quantity,
    });

    if (error) {
      console.error("Stock deduction failed:", error.message);
    } else {
      // Parse the returned JSONB array
      const inventory = updatedInventory as { size: string; stock: number }[];

      const newOutOfStock = inventory
        .filter((e) => e.stock === 0)
        .map((e) => e.size);

      // Update the products list state
      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId
            ? { ...p, size_inventory: inventory, out_of_stock_sizes: newOutOfStock }
            : p
        )
      );

      // Sync the size picker sheet if it's open for this product
      setSizePickerProduct((prev) =>
        prev?.id === productId
          ? { ...prev, size_inventory: inventory, out_of_stock_sizes: newOutOfStock }
          : prev
      );
    }
  }
};

  const toggleWish   = (id: string) => setWishlist(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  const toggleColor  = (c: string) => setSelectedColors(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
  const toggleSize   = (s: string) => setSelectedSizes(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  let filtered = products.filter(p => {
    if (activeCategory !== "all" && p.category !== activeCategory) return false;
    if (Number(p.price) > priceMax) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  filtered = [...filtered].sort((a, b) => {
    if (sortBy === "price_asc")  return Number(a.price) - Number(b.price);
    if (sortBy === "price_desc") return Number(b.price) - Number(a.price);
    if (sortBy === "popular")    return (b.sold_count ?? 0) - (a.sold_count ?? 0);
    if (sortBy === "rating")     return (b.rating ?? 0) - (a.rating ?? 0);
    return 0;
  });

  const catCounts = allCategories.reduce((acc, cat) => { acc[cat] = products.filter(p => p.category === cat).length; return acc; }, {} as Record<string, number>);
  const maxPrice = Math.max(...products.map(p => Number(p.price)), 5000);
  const activeFiltersCount = (activeCategory !== "all" ? 1 : 0) + selectedColors.length + selectedSizes.length + (priceMax < maxPrice ? 1 : 0);
  const clearAllFilters = () => { setActiveCategory("all"); setSelectedColors([]); setSelectedSizes([]); setPriceMax(maxPrice); setSearch(""); };
  const visibleProducts = filtered.slice(0, visibleCount);

  const SidebarContent = () => (
    <div>
      <div className="zp-search-wrap">
        <Search size={15} className="zp-search-icon" />
        <input className="zp-search" placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <FilterSection title="Categories">
        <div className={`zp-cat-item ${activeCategory === "all" ? "active" : ""}`} onClick={() => setActiveCategory("all")}>
          <span>🏷️</span> All Products <span className="zp-cat-count">{products.length}</span>
        </div>
        {allCategories.map(cat => (
          <div key={cat} className={`zp-cat-item ${activeCategory === cat ? "active" : ""}`} onClick={() => setActiveCategory(cat)}>
            <span>{typeof categoryIcons[cat] === "string" && (categoryIcons[cat] as string).includes(".jpg") ? "👕" : categoryIcons[cat]}</span>
            {categoryLabels[cat]} <span className="zp-cat-count">{catCounts[cat] ?? 0}</span>
          </div>
        ))}
      </FilterSection>

      <FilterSection title="Price Range">
        <div style={{ marginBottom:"12px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"10px" }}>
            <span style={{ fontSize:"13px", fontWeight:600, color:"#0a0d14" }}>₱0</span>
            <span style={{ fontSize:"13px", fontWeight:700, color:"var(--blue)" }}>₱{priceMax.toLocaleString()}</span>
          </div>
          <input type="range" className="zp-range" min={0} max={maxPrice} value={priceMax} onChange={e => setPriceMax(Number(e.target.value))} style={{ width:"100%" }} />
        </div>
      </FilterSection>

      <FilterSection title="Color" defaultOpen={false}>
        <div style={{ display:"flex", flexWrap:"wrap", gap:"8px" }}>
          {SIDEBAR_COLORS.map(c => (
            <button key={c.name} title={c.name} className={`zp-swatch ${selectedColors.includes(c.name) ? "active" : ""}`}
              style={{ background: c.hex }} onClick={() => toggleColor(c.name)}>
              {selectedColors.includes(c.name) && <Check size={12} color={c.hex === "#f5f5f5" ? "#0a0d14" : "#fff"} style={{ margin:"auto", display:"block" }} />}
            </button>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Size" defaultOpen={false}>
        <div style={{ display:"flex", flexWrap:"wrap", gap:"6px" }}>
          {SIZES.map(s => (
            <button key={s} className={`zp-size ${selectedSizes.includes(s) ? "active" : ""}`} onClick={() => toggleSize(s)}>{s}</button>
          ))}
        </div>
      </FilterSection>

      {activeFiltersCount > 0 && (
        <button onClick={clearAllFilters} style={{ width:"100%", padding:"10px 0", borderRadius:"8px", background:"rgba(239,68,68,.08)", border:"1.5px solid rgba(239,68,68,.2)", color:"#ef4444", fontFamily:"'Outfit',sans-serif", fontSize:"12px", fontWeight:700, letterSpacing:".06em", textTransform:"uppercase", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:"6px" }}>
          <X size={13} /> Clear All Filters
        </button>
      )}
    </div>
  );

  return (
    <div style={{ fontFamily:"'Outfit',sans-serif", background:"var(--bg)", minHeight:"100vh" }}>

     {sizePickerProduct && (
  <SizePickerSheet
    product={products.find(p => p.id === sizePickerProduct.id) ?? sizePickerProduct}
    onClose={() => setSizePickerProduct(null)}
    onAddToCart={handleAddToCart}
  />
)}

      <div className="zp-banner-strip">
        {[
          { icon: <Truck size={15} />, text: "Free Shipping on ₱500+" },
          { icon: <Zap size={15} />,   text: "Same Day Processing" },
          { icon: <Tag size={15} />,   text: "Official Merch Only" },
          { icon: <Check size={15} />, text: "Secure Checkout" },
        ].map((b, i) => <div key={i} className="zp-banner-item">{b.icon} {b.text}</div>)}
      </div>

      <div style={{ background:"linear-gradient(135deg, #060b18 0%, #0f1f3d 55%, #1a2e5a 100%)", padding:"48px 0 56px", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(rgba(255,255,255,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.025) 1px,transparent 1px)", backgroundSize:"52px 52px" }} />
        <div style={{ position:"absolute", top:"-40%", left:"30%", width:"500px", height:"500px", borderRadius:"50%", background:"radial-gradient(circle, rgba(26,86,219,.25) 0%, transparent 70%)", pointerEvents:"none" }} />
        <div className="container mx-auto px-6 relative" style={{ zIndex:1 }}>
          <div style={{ display:"flex", alignItems:"center", gap:"6px", marginBottom:"20px", opacity:.55 }}>
            <span style={{ fontSize:"12px", fontWeight:600, color:"#fff" }}>Home</span>
            <ChevronRight size={12} color="#fff" />
            <span style={{ fontSize:"12px", fontWeight:600, color:"#60a5fa" }}>Shop</span>
          </div>
          <p style={{ fontFamily:"'Outfit',sans-serif", fontSize:"11px", fontWeight:800, letterSpacing:".26em", textTransform:"uppercase", color:"#60a5fa", marginBottom:"14px", display:"flex", alignItems:"center", gap:"10px" }}>
            <span style={{ width:28, height:2, background:"#60a5fa", borderRadius:2, display:"inline-block", opacity:.65 }} />
            Official Merchandise
          </p>
          <h1 className="shop-fade-up" style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"clamp(3rem,9vw,6rem)", lineHeight:.92, letterSpacing:".02em", color:"#fff", marginBottom:"16px" }}>
            Shop Collection
          </h1>
          <p className="shop-fade-up stagger-2" style={{ fontSize:"15px", color:"rgba(255,255,255,.55)", maxWidth:"480px", lineHeight:1.7, borderLeft:"3px solid #1a56db", paddingLeft:"16px" }}>
            Gear up with authentic RaidKhalid & Co. apparel, accessories, and collectibles.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-8">
        <div style={{ display:"flex", gap:"24px", alignItems:"flex-start" }}>

          <aside className="zp-sidebar hidden md:block" style={{ width:"240px", flexShrink:0 }}>
            <div style={{ background:"#fff", borderRadius:"12px", padding:"20px", border:"1.5px solid var(--border)", position:"sticky", top:"16px" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"20px" }}>
                <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"1.4rem", letterSpacing:".06em", color:"#0a0d14" }}>Filters</span>
                {activeFiltersCount > 0 && <span style={{ background:"#1a56db", color:"#fff", fontSize:"11px", fontWeight:800, padding:"2px 8px", borderRadius:"999px" }}>{activeFiltersCount}</span>}
              </div>
              <SidebarContent />
            </div>
          </aside>

          <div style={{ flex:1, minWidth:0 }}>
            {(search || activeCategory !== "all" || selectedColors.length > 0 || selectedSizes.length > 0) && (
              <div style={{ display:"flex", flexWrap:"wrap", gap:"8px", marginBottom:"16px" }}>
                {search && <span className="zp-applied-tag" onClick={() => setSearch("")}>Search: "{search}" <X size={11} /></span>}
                {activeCategory !== "all" && <span className="zp-applied-tag" onClick={() => setActiveCategory("all")}>{categoryLabels[activeCategory as ProductCategory]} <X size={11} /></span>}
                {selectedColors.map(c => <span key={c} className="zp-applied-tag" onClick={() => toggleColor(c)}>{c} <X size={11} /></span>)}
                {selectedSizes.map(s => <span key={s} className="zp-applied-tag" onClick={() => toggleSize(s)}>Size {s} <X size={11} /></span>)}
              </div>
            )}

            <div className="zp-sort-bar">
              <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
                <button className="md:hidden" onClick={() => setShowMobileFilter(true)} style={{ display:"flex", alignItems:"center", gap:"7px", padding:"9px 16px", borderRadius:"8px", border:"1.5px solid var(--border)", background:"#fff", fontFamily:"'Outfit',sans-serif", fontSize:"13px", fontWeight:700, cursor:"pointer" }}>
                  <SlidersHorizontal size={14} /> Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
                </button>
                <span className="zp-results-count"><strong style={{ color:"#0a0d14" }}>{filtered.length}</strong> products</span>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                <div style={{ display:"flex", alignItems:"center", gap:"6px" }}>
                  <ArrowUpDown size={13} style={{ color:"var(--muted)" }} />
                  <select className="zp-sort-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                    {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div className="zp-view-toggle hidden sm:flex">
                  <button className={`zp-view-btn ${view === "grid" ? "active" : ""}`} onClick={() => setView("grid")}><Grid3X3 size={14} color={view === "grid" ? "#fff" : "#0a0d14"} /></button>
                  <button className={`zp-view-btn ${view === "list" ? "active" : ""}`} onClick={() => setView("list")}><LayoutList size={14} color={view === "list" ? "#fff" : "#0a0d14"} /></button>
                </div>
              </div>
            </div>

            {/* Category pills */}
            <div style={{ display:"flex", gap:"8px", flexWrap:"wrap", marginBottom:"20px" }}>
              <button onClick={() => setActiveCategory("all")} style={{ padding:"7px 18px", borderRadius:"999px", background: activeCategory === "all" ? "#0a0d14" : "#fff", color: activeCategory === "all" ? "#fff" : "#0a0d14", border:"1.5px solid " + (activeCategory === "all" ? "#0a0d14" : "var(--border)"), fontFamily:"'Outfit',sans-serif", fontSize:"12px", fontWeight:700, letterSpacing:".04em", textTransform:"uppercase", cursor:"pointer", transition:"all .2s ease" }}>All</button>
              {allCategories.map(cat => (
                <button key={cat} onClick={() => setActiveCategory(cat)} style={{ padding:"7px 18px", borderRadius:"999px", background: activeCategory === cat ? "#1a56db" : "#fff", color: activeCategory === cat ? "#fff" : "#0a0d14", border:"1.5px solid " + (activeCategory === cat ? "#1a56db" : "var(--border)"), fontFamily:"'Outfit',sans-serif", fontSize:"12px", fontWeight:700, letterSpacing:".04em", textTransform:"uppercase", cursor:"pointer", transition:"all .2s ease" }}>
                  {categoryLabels[cat]}
                </button>
              ))}
            </div>

            {loading ? (
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(190px,1fr))", gap:"14px" }}>
                {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="zp-empty">
                <ShoppingCart size={48} style={{ color:"rgba(10,13,20,.12)", marginBottom:"16px" }} />
                <h3 style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"1.8rem", letterSpacing:".04em", color:"#0a0d14", marginBottom:"8px" }}>No Products Found</h3>
                <p style={{ fontSize:"14px", color:"var(--muted)", maxWidth:"300px", lineHeight:1.65 }}>Try adjusting your filters or search term.</p>
                <button onClick={clearAllFilters} style={{ marginTop:"20px", padding:"11px 28px", borderRadius:"999px", background:"#1a56db", color:"#fff", border:"none", cursor:"pointer", fontFamily:"'Outfit',sans-serif", fontSize:"13px", fontWeight:700 }}>Clear Filters</button>
              </div>
            ) : view === "list" ? (
              <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
                {visibleProducts.map((p, i) => (
                  <ZProductCard key={p.id} product={p} wished={wishlist.has(p.id)} onWish={toggleWish} onSelectSize={setSizePickerProduct} view="list" style={{ animationDelay:`${(i % 6) * 0.07}s` }} />
                ))}
              </div>
            ) : (
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(190px,1fr))", gap:"14px" }}>
                {visibleProducts.map((p, i) => (
                  <ZProductCard key={p.id} product={p} wished={wishlist.has(p.id)} onWish={toggleWish} onSelectSize={setSizePickerProduct} style={{ animationDelay:`${(i % 6) * 0.07}s` }} />
                ))}
              </div>
            )}

            {visibleCount < filtered.length && (
              <button className="zp-load-more" onClick={() => setVisibleCount(c => c + 12)}>
                Load More Products <ChevronDown size={15} />
              </button>
            )}
            {!loading && filtered.length > 0 && visibleCount >= filtered.length && (
              <p style={{ textAlign:"center", marginTop:"32px", fontSize:"13px", color:"var(--muted)", fontWeight:500 }}>
                ✓ You've seen all {filtered.length} products
              </p>
            )}
          </div>
        </div>
      </div>

      {showMobileFilter && (
        <>
          <div className="zp-filter-overlay" onClick={() => setShowMobileFilter(false)} />
          <div className="zp-filter-drawer">
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"24px" }}>
              <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"1.5rem", letterSpacing:".06em", color:"#0a0d14" }}>Filters</span>
              <button onClick={() => setShowMobileFilter(false)} style={{ background:"none", border:"none", cursor:"pointer", padding:"4px" }}><X size={20} color="#0a0d14" /></button>
            </div>
            <SidebarContent />
            <button onClick={() => setShowMobileFilter(false)} style={{ width:"100%", padding:"14px 0", borderRadius:"999px", marginTop:"16px", background:"#1a56db", color:"#fff", border:"none", cursor:"pointer", fontFamily:"'Outfit',sans-serif", fontSize:"13px", fontWeight:700, letterSpacing:".06em", textTransform:"uppercase" }}>
              View {filtered.length} Products
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ShopPage;
