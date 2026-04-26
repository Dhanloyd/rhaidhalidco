import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Plus, Minus, ShoppingCart, Trash2, CreditCard, Receipt,
  Barcode, X, Search, Ruler, Scale, Loader2, PackageX,
  Tag, Zap,
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  image_url: string | null;
  barcode: string | null;
  sku: string | null;
  stock_quantity: number;
  available_sizes?: string[];
  available_colors?: string[];
  available_waist_sizes?: string[];
  available_lengths?: string[];
  brand?: string;
  weight?: number;
  dimensions?: string;
}

interface CartItem {
  product: Product;
  quantity: number;
  discount: number;
  selectedSize?: string;
  selectedColor?: string;
  selectedWaist?: string;
  selectedLength?: string;
}

interface ReceiptSettings {
  company_name: string;
  address: string;
  tin_no: string;
  vat_rate: number;
  logo_url: string | null;
}

const PANTS_WAIST = ["28","29","30","31","32","33","34","36","38","40","42"];
const PANTS_LENGTH = ["28","29","30","31","32","33","34"];
const PANTS_CATEGORIES = ["pants","jeans","trousers","shorts","bottoms","denim"];
const ACCENT = ["#34d399","#60a5fa","#a78bfa","#fb923c","#f472b6","#f87171"];

const isPantsCategory = (category: string) =>
  PANTS_CATEGORIES.some(c => category.toLowerCase().includes(c));

const glass = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.08)",
  backdropFilter: "blur(20px)",
  boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
};

/* ─── Variant Picker Dialog ─── */
const VariantPickerDialog = ({
  product, open, onClose, onConfirm,
}: {
  product: Product | null; open: boolean; onClose: () => void;
  onConfirm: (size?: string, color?: string, waist?: string, length?: string) => void;
}) => {
  const [size, setSize]     = useState("");
  const [color, setColor]   = useState("");
  const [waist, setWaist]   = useState("");
  const [length, setLength] = useState("");

  useEffect(() => { if (open) { setSize(""); setColor(""); setWaist(""); setLength(""); } }, [open]);
  if (!product) return null;

  const isBottoms     = isPantsCategory(product.category);
  const needsSize     = !isBottoms && (product.available_sizes?.length ?? 0) > 0;
  const needsColor    = (product.available_colors?.length ?? 0) > 0;
  const waistOptions  = product.available_waist_sizes?.length ? product.available_waist_sizes : PANTS_WAIST;
  const lengthOptions = product.available_lengths?.length ? product.available_lengths : PANTS_LENGTH;

  const handleConfirm = () => {
    if (needsSize && !size)   { toast.error("Please select a size");   return; }
    if (needsColor && !color) { toast.error("Please select a color");  return; }
    if (isBottoms && !waist)  { toast.error("Please select a waist");  return; }
    if (isBottoms && !length) { toast.error("Please select a length"); return; }
    onConfirm(size || undefined, color || undefined, waist || undefined, length || undefined);
    onClose();
  };

  const chipBase: React.CSSProperties = {
    minWidth: 44, height: 40, padding: "0 12px", borderRadius: "10px",
    fontSize: "13px", fontWeight: 700, cursor: "pointer",
    transition: "all .18s ease", border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.05)", color: "rgba(148,163,184,0.8)",
  };
  const chipActive: React.CSSProperties = {
    ...chipBase,
    background: "rgba(52,211,153,0.15)", border: "1px solid rgba(52,211,153,0.4)",
    color: "#34d399",
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent style={{
        maxWidth: "420px", maxHeight: "90vh", overflowY: "auto",
        background: "rgba(10,15,30,0.97)", border: "1px solid rgba(255,255,255,0.1)",
        backdropFilter: "blur(30px)",
      }}>
        <DialogHeader>
          <DialogTitle style={{ fontSize: "13px", fontWeight: 800, color: "#fff", textTransform: "uppercase", letterSpacing: ".1em" }}>
            Select Options
          </DialogTitle>
        </DialogHeader>
        <div style={{ display: "flex", flexDirection: "column", gap: "18px", marginTop: "8px" }}>

          {/* Product preview */}
          <div style={{
            display: "flex", alignItems: "center", gap: "14px",
            padding: "14px", borderRadius: "14px",
            background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
          }}>
            {product.image_url && (
              <img src={product.image_url} alt={product.name}
                style={{ width: 56, height: 72, objectFit: "cover", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.1)", flexShrink: 0 }} />
            )}
            <div>
              {product.brand && <p style={{ fontSize: "9px", fontWeight: 800, letterSpacing: ".15em", textTransform: "uppercase", color: "rgba(148,163,184,0.5)", marginBottom: "2px" }}>{product.brand}</p>}
              <p style={{ fontWeight: 700, fontSize: "14px", color: "#fff", lineHeight: 1.3 }}>{product.name}</p>
              <p style={{ fontSize: "16px", fontWeight: 800, color: "#34d399", marginTop: "4px" }}>₱{Number(product.price).toLocaleString()}</p>
              {product.weight && (
                <p style={{ fontSize: "10px", color: "rgba(148,163,184,0.45)", display: "flex", alignItems: "center", gap: "4px", marginTop: "3px" }}>
                  <Scale size={9} /> {product.weight}g{product.dimensions ? ` · ${product.dimensions}` : ""}
                </p>
              )}
            </div>
          </div>

          {isBottoms && (
            <>
              {/* Waist */}
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                  <p style={{ fontSize: "12px", fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: "6px" }}>
                    <Ruler size={13} color="#60a5fa" /> Waist Size
                    <span style={{ fontSize: "11px", fontWeight: 500, color: "rgba(148,163,184,0.5)" }}>— {waist || "Not selected"}</span>
                  </p>
                  <span style={{ fontSize: "10px", color: "rgba(148,163,184,0.4)" }}>inches</span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {waistOptions.map(w => (
                    <button key={w} onClick={() => setWaist(w)} style={waist === w ? chipActive : chipBase}>{w}</button>
                  ))}
                </div>
              </div>

              {/* Length */}
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                  <p style={{ fontSize: "12px", fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: "6px" }}>
                    <Ruler size={13} color="#60a5fa" /> Length
                    <span style={{ fontSize: "11px", fontWeight: 500, color: "rgba(148,163,184,0.5)" }}>— {length || "Not selected"}</span>
                  </p>
                  <span style={{ fontSize: "10px", color: "rgba(148,163,184,0.4)" }}>inches</span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {lengthOptions.map(l => (
                    <button key={l} onClick={() => setLength(l)} style={length === l ? chipActive : chipBase}>{l}</button>
                  ))}
                </div>
              </div>

              {waist && length && (
                <div style={{
                  padding: "12px 16px", borderRadius: "12px",
                  background: "rgba(96,165,250,0.08)", border: "1px solid rgba(96,165,250,0.2)",
                  display: "flex", alignItems: "center", gap: "12px",
                }}>
                  <Ruler size={16} color="#60a5fa" />
                  <div>
                    <p style={{ fontSize: "9px", fontWeight: 700, letterSpacing: ".15em", textTransform: "uppercase", color: "rgba(148,163,184,0.45)", marginBottom: "2px" }}>Selected Size</p>
                    <p style={{ fontSize: "18px", fontWeight: 800, color: "#60a5fa", fontFamily: "monospace" }}>W{waist} × L{length}</p>
                  </div>
                </div>
              )}
            </>
          )}

          {needsSize && (
            <div>
              <p style={{ fontSize: "12px", fontWeight: 700, color: "#fff", marginBottom: "10px" }}>
                Size <span style={{ fontSize: "11px", fontWeight: 500, color: "rgba(148,163,184,0.5)" }}>— {size || "Not selected"}</span>
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {product.available_sizes!.map(s => (
                  <button key={s} onClick={() => setSize(s)} style={size === s ? chipActive : chipBase}>{s}</button>
                ))}
              </div>
            </div>
          )}

          {needsColor && (
            <div>
              <p style={{ fontSize: "12px", fontWeight: 700, color: "#fff", marginBottom: "10px" }}>
                Color <span style={{ fontSize: "11px", fontWeight: 500, color: "rgba(148,163,184,0.5)" }}>— {color || "Not selected"}</span>
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {product.available_colors!.map(c => (
                  <button key={c} onClick={() => setColor(c)} style={color === c ? { ...chipActive, background: "rgba(167,139,250,0.15)", border: "1px solid rgba(167,139,250,0.4)", color: "#a78bfa" } : chipBase}>{c}</button>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: "8px", paddingTop: "4px" }}>
            <button onClick={onClose} style={{
              flex: 1, padding: "12px", borderRadius: "12px",
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(148,163,184,0.8)", fontWeight: 700, fontSize: "13px", cursor: "pointer",
            }}>Cancel</button>
            <button onClick={handleConfirm} style={{
              flex: 1, padding: "12px", borderRadius: "12px",
              background: "rgba(52,211,153,0.9)", border: "none",
              color: "#001a0f", fontWeight: 800, fontSize: "13px",
              letterSpacing: ".06em", textTransform: "uppercase", cursor: "pointer",
              boxShadow: "0 6px 20px -5px rgba(52,211,153,0.35)",
            }}>Add to Cart</button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

/* ═══════════════════════════════════════ POS PAGE ══════════════════════════ */
const POSPage = () => {
  const { user } = useAuth();
  const [products, setProducts]             = useState<Product[]>([]);
  const [cart, setCart]                     = useState<CartItem[]>([]);
  const [customerName, setCustomerName]     = useState("Walk-in Customer");
  const [paymentMethod, setPaymentMethod]   = useState("cash");
  const [cashReceived, setCashReceived]     = useState(0);
  const [search, setSearch]                 = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [processing, setProcessing]         = useState(false);
  const [receiptDialog, setReceiptDialog]   = useState(false);
  const [lastReceipt, setLastReceipt]       = useState<any>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [variantProduct, setVariantProduct] = useState<Product | null>(null);
  const [variantOpen, setVariantOpen]       = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productError, setProductError]       = useState<string | null>(null);
  const [totalInDB, setTotalInDB]             = useState<number | null>(null);
  const [receiptSettings, setReceiptSettings] = useState<ReceiptSettings>({
    company_name: "My Company", address: "", tin_no: "", vat_rate: 12, logo_url: null,
  });
  const barcodeRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchProducts(); fetchReceiptSettings(); }, []);

  const fetchProducts = async () => {
    setLoadingProducts(true); setProductError(null);
    try {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, price, category, image_url, barcode, sku, stock_quantity, available_sizes, available_colors, available_waist_sizes, available_lengths, brand, weight, dimensions")
        .eq("in_stock", true).order("name");
      if (error) throw error;
      setProducts(data || []);
      if ((data || []).length === 0) {
        const { count } = await supabase.from("products").select("id", { count: "exact", head: true });
        setTotalInDB(count ?? 0);
      } else { setTotalInDB(null); }
    } catch (err: any) {
      setProductError(err?.message || "Failed to load products");
    } finally { setLoadingProducts(false); }
  };

  const fetchReceiptSettings = async () => {
    const { data } = await supabase.from("receipt_settings").select("company_name, address, tin_no, vat_rate, logo_url").limit(1).single();
    if (data) setReceiptSettings(data);
  };

  const openVariantPicker = (product: Product) => {
    const isBottoms = isPantsCategory(product.category);
    const needsVariant = isBottoms || (product.available_sizes?.length ?? 0) > 0 || (product.available_colors?.length ?? 0) > 0;
    if (needsVariant) { setVariantProduct(product); setVariantOpen(true); }
    else addToCart(product);
  };

  const addToCart = (product: Product, selectedSize?: string, selectedColor?: string, selectedWaist?: string, selectedLength?: string) => {
    setCart(prev => {
      const existing = prev.find(c =>
        c.product.id === product.id && c.selectedSize === selectedSize &&
        c.selectedColor === selectedColor && c.selectedWaist === selectedWaist && c.selectedLength === selectedLength
      );
      if (existing) {
        if (existing.quantity >= product.stock_quantity) { toast.error("Stock limit reached"); return prev; }
        return prev.map(c =>
          c.product.id === product.id && c.selectedSize === selectedSize &&
          c.selectedColor === selectedColor && c.selectedWaist === selectedWaist && c.selectedLength === selectedLength
            ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      if (product.stock_quantity <= 0) { toast.error("Out of stock"); return prev; }
      return [...prev, { product, quantity: 1, discount: 0, selectedSize, selectedColor, selectedWaist, selectedLength }];
    });
    const sizeLabel = selectedWaist && selectedLength ? `W${selectedWaist}/L${selectedLength}` : selectedSize ?? "";
    toast.success(`Added: ${product.name}${sizeLabel ? ` (${sizeLabel})` : ""}${selectedColor ? ` · ${selectedColor}` : ""}`);
  };

  const handleBarcodeScan = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const code = (e.target as HTMLInputElement).value.trim();
      const product = products.find(p => p.barcode === code || p.sku === code);
      if (product) openVariantPicker(product);
      else toast.error("Product not found");
      setSearch("");
    }
  };

  const updateQty = (index: number, delta: number) => {
    setCart(prev => prev.map((c, i) => {
      if (i !== index) return c;
      const newQty = c.quantity + delta;
      if (newQty > c.product.stock_quantity) { toast.error("Stock limit"); return c; }
      return { ...c, quantity: Math.max(0, newQty) };
    }).filter(c => c.quantity > 0));
  };

  const removeFromCart = (index: number) => setCart(prev => prev.filter((_, i) => i !== index));

  const subtotal           = cart.reduce((s, c) => s + c.product.price * c.quantity, 0);
  const discountedSubtotal = Math.max(0, subtotal - discountAmount);
  const vatRate            = (receiptSettings.vat_rate || 0) / 100;
  const vatableSales       = discountedSubtotal / (1 + vatRate);
  const vatAmount          = discountedSubtotal - vatableSales;
  const total              = discountedSubtotal;
  const change             = Math.max(0, cashReceived - total);

  const generateReceiptNo = () => `POS-${Date.now().toString(36).toUpperCase()}`;

  const handleCheckout = async () => {
    if (cart.length === 0) { toast.error("Cart is empty"); return; }
    if (paymentMethod === "cash" && cashReceived < total) { toast.error("Insufficient cash"); return; }
    setProcessing(true);
    const receiptNumber = generateReceiptNo();

    const { error } = await supabase.from("pos_transactions").insert({
      cashier_id: user?.id || "",
      items: cart.map(c => ({
        id: c.product.id, name: c.product.name, price: c.product.price,
        quantity: c.quantity, discount: c.discount,
        size: c.selectedSize || null, color: c.selectedColor || null,
        waist: c.selectedWaist || null, length: c.selectedLength || null,
      })),
      subtotal, discount: discountAmount, total,
      cash_received: cashReceived, change_amount: change,
      payment_method: paymentMethod, receipt_number: receiptNumber, customer_name: customerName,
    });

    if (error) { toast.error("Transaction failed"); setProcessing(false); return; }

    await supabase.from("orders").insert({
      customer_name: customerName,
      items: cart.map(c => ({
        id: c.product.id, name: c.product.name, price: c.product.price, quantity: c.quantity,
        size: c.selectedSize || null, color: c.selectedColor || null,
        waist: c.selectedWaist || null, length: c.selectedLength || null,
      })),
      total, subtotal, discount: discountAmount, status: "completed", payment_method: paymentMethod, order_type: "pos",
    });

    for (const item of cart) {
      const newStock = Math.max(0, item.product.stock_quantity - item.quantity);
      await supabase.from("products").update({ stock_quantity: newStock, sold_count: item.product.stock_quantity + item.quantity, in_stock: newStock > 0 }).eq("id", item.product.id);
      await supabase.from("inventory_logs").insert({
        product_id: item.product.id, change_type: "sold", quantity_change: -item.quantity,
        quantity_before: item.product.stock_quantity, quantity_after: newStock, notes: `POS Sale: ${receiptNumber}`,
      });
    }

    setLastReceipt({
      items: [...cart], subtotal, discount: discountAmount,
      vat_amount: vatAmount, vat_rate: receiptSettings.vat_rate, vatable_sales: vatableSales,
      total, cash_received: cashReceived, change, payment_method: paymentMethod,
      receipt_number: receiptNumber, customer_name: customerName, date: new Date().toLocaleString(),
      company_name: receiptSettings.company_name, address: receiptSettings.address,
      tin_no: receiptSettings.tin_no, logo_url: receiptSettings.logo_url,
    });

    setReceiptDialog(true);
    setCart([]); setCustomerName("Walk-in Customer"); setCashReceived(0); setDiscountAmount(0);
    setProcessing(false);
    fetchProducts();
  };

  const categories = ["all", ...Array.from(new Set(products.map(p => p.category)))];

  const filteredProducts = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.barcode?.includes(search) || p.sku?.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === "all" || p.category === categoryFilter;
    return matchSearch && matchCat;
  });

  const fmt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const getSizeLabel = (item: CartItem): string => {
    if (item.selectedWaist && item.selectedLength) return `W${item.selectedWaist}/L${item.selectedLength}`;
    if (item.selectedSize) return item.selectedSize;
    return "";
  };

  /* ── Product grid ── */
  const renderProductGrid = () => {
    if (loadingProducts) return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 0", gap: "12px" }}>
        <Loader2 size={32} color="rgba(148,163,184,0.4)" style={{ animation: "spin 1s linear infinite" }} />
        <p style={{ fontSize: "13px", color: "rgba(148,163,184,0.5)" }}>Loading products…</p>
      </div>
    );

    if (productError) return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 0", gap: "12px" }}>
        <PackageX size={32} color="#f87171" style={{ opacity: 0.5 }} />
        <p style={{ fontSize: "13px", fontWeight: 700, color: "#f87171" }}>Failed to load products</p>
        <p style={{ fontSize: "11px", color: "rgba(148,163,184,0.5)", maxWidth: "280px", textAlign: "center" }}>{productError}</p>
        <button onClick={fetchProducts} style={{
          padding: "8px 16px", borderRadius: "8px", fontSize: "12px", fontWeight: 700,
          background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
          color: "rgba(148,163,184,0.8)", cursor: "pointer",
        }}>Retry</button>
      </div>
    );

    if (filteredProducts.length === 0) {
      if (search || categoryFilter !== "all") return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 0", gap: "10px" }}>
          <Search size={32} color="rgba(148,163,184,0.25)" />
          <p style={{ fontSize: "13px", color: "rgba(148,163,184,0.5)" }}>No products match your search</p>
          <button onClick={() => { setSearch(""); setCategoryFilter("all"); }} style={{
            fontSize: "12px", color: "#60a5fa", fontWeight: 700, border: "none", background: "none", cursor: "pointer",
          }}>Clear filters</button>
        </div>
      );
      return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 0", gap: "10px" }}>
          <PackageX size={36} color="rgba(148,163,184,0.2)" />
          <p style={{ fontSize: "13px", fontWeight: 700, color: "#fff" }}>No products available</p>
          {totalInDB !== null && totalInDB > 0 ? (
            <p style={{ fontSize: "11px", color: "rgba(148,163,184,0.5)", maxWidth: "300px", textAlign: "center", lineHeight: 1.6 }}>
              <span style={{ color: "#fb923c", fontWeight: 700 }}>{totalInDB} product{totalInDB !== 1 ? "s" : ""} in database</span> but none are marked as{" "}
              <code style={{ background: "rgba(255,255,255,0.08)", padding: "1px 5px", borderRadius: "4px", fontSize: "10px" }}>in_stock = true</code>.
            </p>
          ) : (
            <p style={{ fontSize: "11px", color: "rgba(148,163,184,0.4)" }}>Add products in the Inventory section to get started.</p>
          )}
          <button onClick={fetchProducts} style={{
            padding: "8px 16px", borderRadius: "8px", fontSize: "12px", fontWeight: 700,
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
            color: "rgba(148,163,184,0.8)", cursor: "pointer", marginTop: "4px",
          }}>Refresh</button>
        </div>
      );
    }

    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(148px, 1fr))", gap: "12px" }}>
        {filteredProducts.map((p, i) => {
          const isBottoms = isPantsCategory(p.category);
          const accentColor = ACCENT[i % ACCENT.length];
          const isOutOfStock = p.stock_quantity === 0;
          return (
            <button key={p.id} onClick={() => openVariantPicker(p)} style={{
              ...glass,
              borderRadius: "16px", overflow: "hidden", textAlign: "left",
              cursor: isOutOfStock ? "not-allowed" : "pointer",
              opacity: isOutOfStock ? 0.55 : 1,
              transition: "transform .25s ease, box-shadow .25s ease, border-color .25s ease",
              border: `1px solid rgba(255,255,255,0.08)`,
              background: "rgba(255,255,255,0.04)",
              padding: 0,
            }}
              onMouseEnter={e => {
                if (!isOutOfStock) {
                  (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-4px)";
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 16px 40px rgba(0,0,0,0.4), 0 0 0 1px ${accentColor}30`;
                  (e.currentTarget as HTMLButtonElement).style.borderColor = `${accentColor}40`;
                }
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.transform = "";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 32px rgba(0,0,0,0.3)";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.08)";
              }}
            >
              {/* Image */}
              <div style={{ position: "relative", width: "100%", aspectRatio: "3/4", background: `${accentColor}10`, overflow: "hidden" }}>
                {p.image_url ? (
                  <img src={p.image_url} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "transform .3s ease" }}
                    onMouseEnter={e => (e.currentTarget as HTMLImageElement).style.transform = "scale(1.06)"}
                    onMouseLeave={e => (e.currentTarget as HTMLImageElement).style.transform = ""}
                  />
                ) : (
                  <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <ShoppingCart size={28} color={`${accentColor}60`} />
                  </div>
                )}

                {/* Low stock badge */}
                {p.stock_quantity <= 3 && p.stock_quantity > 0 && (
                  <span style={{
                    position: "absolute", top: 8, left: 8,
                    fontSize: "9px", padding: "3px 7px", borderRadius: "999px",
                    background: "rgba(251,146,60,0.85)", color: "#fff", fontWeight: 800,
                    backdropFilter: "blur(8px)",
                  }}>Low Stock</span>
                )}

                {/* Out of stock overlay */}
                {isOutOfStock && (
                  <div style={{
                    position: "absolute", inset: 0,
                    background: "rgba(10,15,30,0.7)", display: "flex", alignItems: "center", justifyContent: "center",
                    backdropFilter: "blur(3px)",
                  }}>
                    <span style={{ fontSize: "11px", fontWeight: 800, color: "rgba(148,163,184,0.7)", textTransform: "uppercase", letterSpacing: ".08em" }}>Out of Stock</span>
                  </div>
                )}

                {/* Variant badges */}
                <div style={{ position: "absolute", bottom: 8, right: 8, display: "flex", gap: "4px", flexWrap: "wrap", justifyContent: "flex-end" }}>
                  {isBottoms && (
                    <span style={{ fontSize: "9px", padding: "2px 6px", borderRadius: "4px", background: "rgba(96,165,250,0.85)", color: "#fff", fontWeight: 800, backdropFilter: "blur(8px)" }}>W×L</span>
                  )}
                  {!isBottoms && (p.available_sizes?.length ?? 0) > 0 && (
                    <span style={{ fontSize: "9px", padding: "2px 6px", borderRadius: "4px", background: "rgba(0,0,0,0.6)", color: "#fff", fontWeight: 700, backdropFilter: "blur(8px)" }}>SIZE</span>
                  )}
                  {(p.available_colors?.length ?? 0) > 0 && (
                    <span style={{ fontSize: "9px", padding: "2px 6px", borderRadius: "4px", background: "rgba(0,0,0,0.6)", color: "#fff", fontWeight: 700, backdropFilter: "blur(8px)" }}>COLOR</span>
                  )}
                </div>
              </div>

              {/* Info */}
              <div style={{ padding: "10px 11px 12px" }}>
                {p.brand && <p style={{ fontSize: "9px", color: "rgba(148,163,184,0.45)", textTransform: "uppercase", letterSpacing: ".1em", fontWeight: 700, marginBottom: "2px" }}>{p.brand}</p>}
                <p style={{ fontSize: "12px", fontWeight: 600, color: "#fff", lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{p.name}</p>
                <p style={{ fontSize: "15px", fontWeight: 800, color: accentColor, marginTop: "6px" }}>₱{Number(p.price).toLocaleString()}</p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "4px" }}>
                  <p style={{ fontSize: "10px", color: "rgba(148,163,184,0.4)" }}>Stock: {p.stock_quantity}</p>
                  {p.weight && <p style={{ fontSize: "9px", color: "rgba(148,163,184,0.35)", display: "flex", alignItems: "center", gap: "3px" }}><Scale size={8} />{p.weight}g</p>}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  const inputDark: React.CSSProperties = {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "#fff",
    borderRadius: "10px",
  };

  return (
    <div style={{ minHeight: "100vh", padding: "24px", display: "flex", flexDirection: "column", gap: "24px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", opacity: 0, animation: "fadeUp 0.5s ease forwards" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#34d399", animation: "pulse 2s infinite" }} />
            <span style={{ fontSize: "11px", color: "#34d399", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase" }}>Live</span>
          </div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>Point of Sale</h1>
          <p style={{ fontSize: "12px", color: "rgba(148,163,184,0.7)", marginTop: "2px", fontWeight: 500 }}>
            {!loadingProducts && !productError && `${products.length} product${products.length !== 1 ? "s" : ""} available`}
          </p>
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: "8px",
          padding: "8px 14px", borderRadius: "10px",
          background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)",
        }}>
          <Zap size={13} color="#34d399" />
          <span style={{ fontSize: "12px", fontWeight: 700, color: "#34d399" }}>POS Active</span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "20px", alignItems: "start" }}>

        {/* ── Products Panel ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", opacity: 0, animation: "fadeUp 0.5s ease 0.08s forwards" }}>

          {/* Search + filter */}
          <div style={{ display: "flex", gap: "10px" }}>
            <div style={{ position: "relative", flex: 1 }}>
              <Barcode size={15} style={{ position: "absolute", left: "13px", top: "50%", transform: "translateY(-50%)", color: "rgba(148,163,184,0.45)", zIndex: 1 }} />
              <Input
                ref={barcodeRef}
                placeholder="Scan barcode or search products…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={handleBarcodeScan}
                style={{ ...inputDark, paddingLeft: "40px" }}
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger style={{ ...inputDark, width: "160px", fontSize: "12px" }}>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(c => (
                  <SelectItem key={c} value={c} style={{ textTransform: "capitalize", fontSize: "12px" }}>
                    {c === "all" ? "All Categories" : c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Grid */}
          <div style={{ ...glass, borderRadius: "20px", padding: "20px", minHeight: "300px" }}>
            {renderProductGrid()}
          </div>
        </div>

        {/* ── Cart Panel ── */}
        <div style={{
          ...glass, borderRadius: "20px", overflow: "hidden",
          position: "sticky", top: "24px",
          opacity: 0, animation: "fadeUp 0.5s ease 0.16s forwards",
        }}>

          {/* Cart header */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <ShoppingCart size={15} color="#60a5fa" />
              <span style={{ fontSize: "12px", fontWeight: 800, color: "#fff", textTransform: "uppercase", letterSpacing: ".1em" }}>Cart</span>
              {cart.length > 0 && (
                <span style={{
                  fontSize: "10px", fontWeight: 800, padding: "2px 7px", borderRadius: "999px",
                  background: "rgba(96,165,250,0.15)", color: "#60a5fa", border: "1px solid rgba(96,165,250,0.25)",
                }}>{cart.length}</span>
              )}
            </div>
            {cart.length > 0 && (
              <button onClick={() => setCart([])} style={{
                fontSize: "11px", color: "rgba(248,113,113,0.7)", fontWeight: 700,
                border: "none", background: "none", cursor: "pointer",
                display: "flex", alignItems: "center", gap: "4px",
                transition: "color .18s ease",
              }}>
                <Trash2 size={11} /> Clear
              </button>
            )}
          </div>

          <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: "14px" }}>

            {/* Cart items */}
            {cart.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px 0" }}>
                <ShoppingCart size={28} color="rgba(148,163,184,0.2)" style={{ display: "block", margin: "0 auto 10px" }} />
                <p style={{ fontSize: "12px", color: "rgba(148,163,184,0.4)" }}>Tap a product to add</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "300px", overflowY: "auto", paddingRight: "4px" }}>
                {cart.map((item, index) => {
                  const sizeLabel    = getSizeLabel(item);
                  const isBottomItem = !!(item.selectedWaist && item.selectedLength);
                  return (
                    <div key={index} style={{
                      display: "flex", gap: "10px",
                      padding: "10px 12px", borderRadius: "12px",
                      background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)",
                      transition: "background .18s ease",
                    }}>
                      {item.product.image_url && (
                        <img src={item.product.image_url} alt={item.product.name}
                          style={{ width: 40, height: 50, objectFit: "cover", borderRadius: "8px", flexShrink: 0, border: "1px solid rgba(255,255,255,0.08)" }} />
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: "11px", fontWeight: 700, color: "#fff", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {item.product.name}
                        </p>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "4px" }}>
                          {isBottomItem ? (
                            <span style={{ fontSize: "9px", fontWeight: 800, padding: "2px 6px", borderRadius: "4px", background: "rgba(96,165,250,0.12)", color: "#60a5fa", border: "1px solid rgba(96,165,250,0.2)", fontFamily: "monospace" }}>
                              W{item.selectedWaist}/L{item.selectedLength}
                            </span>
                          ) : sizeLabel ? (
                            <span style={{ fontSize: "9px", fontWeight: 700, padding: "2px 6px", borderRadius: "4px", background: "rgba(255,255,255,0.07)", color: "rgba(148,163,184,0.8)", border: "1px solid rgba(255,255,255,0.1)", textTransform: "uppercase" }}>
                              {sizeLabel}
                            </span>
                          ) : null}
                          {item.selectedColor && (
                            <span style={{ fontSize: "9px", padding: "2px 6px", borderRadius: "4px", background: "rgba(167,139,250,0.1)", color: "#a78bfa", border: "1px solid rgba(167,139,250,0.2)" }}>
                              {item.selectedColor}
                            </span>
                          )}
                        </div>
                        <p style={{ fontSize: "10px", color: "rgba(148,163,184,0.5)", marginTop: "4px" }}>
                          ₱{Number(item.product.price).toLocaleString()} × {item.quantity} = {" "}
                          <span style={{ color: "#34d399", fontWeight: 700 }}>₱{(item.product.price * item.quantity).toLocaleString()}</span>
                        </p>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "8px" }}>
                          <div style={{ display: "flex", alignItems: "center", borderRadius: "8px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)" }}>
                            <button onClick={() => updateQty(index, -1)} style={{
                              width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center",
                              background: "rgba(255,255,255,0.05)", border: "none", cursor: "pointer", color: "rgba(148,163,184,0.7)",
                              transition: "background .15s ease",
                            }}>
                              <Minus size={9} />
                            </button>
                            <span style={{ width: 24, textAlign: "center", fontSize: "11px", fontWeight: 700, color: "#fff", borderLeft: "1px solid rgba(255,255,255,0.1)", borderRight: "1px solid rgba(255,255,255,0.1)" }}>{item.quantity}</span>
                            <button onClick={() => updateQty(index, 1)} style={{
                              width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center",
                              background: "rgba(255,255,255,0.05)", border: "none", cursor: "pointer", color: "rgba(148,163,184,0.7)",
                              transition: "background .15s ease",
                            }}>
                              <Plus size={9} />
                            </button>
                          </div>
                          <button onClick={() => removeFromCart(index)} style={{
                            background: "none", border: "none", cursor: "pointer", padding: "4px",
                            color: "rgba(248,113,113,0.5)", transition: "color .18s ease",
                          }}>
                            <X size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Totals & Checkout */}
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "14px", display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                <span style={{ color: "rgba(148,163,184,0.6)" }}>Subtotal</span>
                <span style={{ color: "#fff", fontWeight: 600 }}>₱{fmt(subtotal)}</span>
              </div>

              {/* Discount */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Tag size={12} color="rgba(148,163,184,0.5)" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: "11px", color: "rgba(148,163,184,0.6)", flexShrink: 0 }}>Discount:</span>
                <Input type="number" value={discountAmount || ""} onChange={e => setDiscountAmount(parseFloat(e.target.value) || 0)}
                  placeholder="0" style={{ ...inputDark, height: "32px", fontSize: "12px" }} />
              </div>

              {discountAmount > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                  <span style={{ color: "#34d399" }}>Discount</span>
                  <span style={{ color: "#34d399", fontWeight: 700 }}>-₱{fmt(discountAmount)}</span>
                </div>
              )}

              {receiptSettings.vat_rate > 0 && cart.length > 0 && (
                <div style={{
                  padding: "10px 12px", borderRadius: "10px",
                  background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
                }}>
                  <p style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".12em", color: "rgba(148,163,184,0.4)", marginBottom: "7px" }}>VAT Breakdown</p>
                  {[
                    { label: "Vatable Sales (ex-VAT)", value: `₱${fmt(vatableSales)}` },
                    { label: `VAT ${receiptSettings.vat_rate}%`, value: `₱${fmt(vatAmount)}` },
                  ].map((r, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                      <span style={{ fontSize: "10px", color: "rgba(148,163,184,0.5)" }}>{r.label}</span>
                      <span style={{ fontSize: "10px", fontWeight: 600, color: "rgba(148,163,184,0.7)" }}>{r.value}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Total */}
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "12px 14px", borderRadius: "12px",
                background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)",
              }}>
                <span style={{ fontSize: "14px", fontWeight: 800, color: "#fff" }}>Total</span>
                <span style={{ fontSize: "1.4rem", fontWeight: 800, color: "#34d399" }}>₱{fmt(total)}</span>
              </div>

              {/* Customer */}
              <Input placeholder="Customer name" value={customerName} onChange={e => setCustomerName(e.target.value)}
                style={{ ...inputDark, height: "36px", fontSize: "12px" }} />

              {/* Payment method */}
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger style={{ ...inputDark, height: "36px", fontSize: "12px" }}>
                  <CreditCard size={12} style={{ marginRight: "6px", color: "rgba(148,163,184,0.6)" }} />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="gcash">GCash</SelectItem>
                </SelectContent>
              </Select>

              {paymentMethod === "cash" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <Input type="number" placeholder="Cash received" value={cashReceived || ""}
                    onChange={e => setCashReceived(parseFloat(e.target.value) || 0)}
                    style={{ ...inputDark, height: "36px", fontSize: "12px" }} />
                  {cashReceived > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                      <span style={{ color: "rgba(148,163,184,0.6)" }}>Change</span>
                      <span style={{ fontWeight: 800, color: "#34d399" }}>₱{fmt(change)}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Checkout button */}
              <button onClick={handleCheckout} disabled={cart.length === 0 || processing} style={{
                width: "100%", padding: "14px", borderRadius: "12px",
                background: cart.length === 0 || processing ? "rgba(52,211,153,0.4)" : "rgba(52,211,153,0.9)",
                color: "#001a0f", fontWeight: 800, fontSize: "13px",
                letterSpacing: ".07em", textTransform: "uppercase",
                border: "none", cursor: cart.length === 0 || processing ? "not-allowed" : "pointer",
                boxShadow: cart.length > 0 ? "0 8px 24px -5px rgba(52,211,153,0.35)" : "none",
                transition: "all .2s ease",
              }}>
                {processing ? "Processing…" : `Checkout · ₱${fmt(total)}`}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Variant Picker */}
      <VariantPickerDialog
        product={variantProduct}
        open={variantOpen}
        onClose={() => { setVariantOpen(false); setVariantProduct(null); }}
        onConfirm={(size, color, waist, length) => {
          if (variantProduct) addToCart(variantProduct, size, color, waist, length);
        }}
      />

      {/* Receipt Dialog */}
      <Dialog open={receiptDialog} onOpenChange={setReceiptDialog}>
        <DialogContent style={{
          maxWidth: "420px", maxHeight: "92vh", overflowY: "auto", padding: 0,
          background: "#fff", border: "none",
        }}>
          <DialogHeader className="sr-only"><DialogTitle>Receipt</DialogTitle></DialogHeader>
          {lastReceipt && (
            <div id="printable-receipt">
              {/* Header */}
              <div style={{ background: "linear-gradient(135deg, #060b18 0%, #0f1f3d 100%)", padding: "24px 20px 20px", textAlign: "center" }}>
                {lastReceipt.logo_url && (
                  <img src={lastReceipt.logo_url} alt="Logo" style={{ height: 48, objectFit: "contain", margin: "0 auto 10px", display: "block" }} />
                )}
                <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.4rem", letterSpacing: ".08em", color: "#fff", marginBottom: "4px" }}>
                  {lastReceipt.company_name}
                </p>
                {lastReceipt.address && <p style={{ fontSize: "11px", color: "rgba(255,255,255,.45)", marginBottom: "2px" }}>{lastReceipt.address}</p>}
                {lastReceipt.tin_no && <p style={{ fontSize: "10px", color: "rgba(255,255,255,.35)" }}>TIN: {lastReceipt.tin_no}</p>}
              </div>

              {/* Meta */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderBottom: "1px solid rgba(10,13,20,.08)" }}>
                {[
                  { label: "Receipt #", value: lastReceipt.receipt_number },
                  { label: "Date",      value: lastReceipt.date },
                  { label: "Customer",  value: lastReceipt.customer_name },
                  { label: "Payment",   value: lastReceipt.payment_method.toUpperCase() },
                ].map((m, i) => (
                  <div key={i} style={{ padding: "10px 16px", borderBottom: i < 2 ? "1px solid rgba(10,13,20,.06)" : "none", borderRight: i % 2 === 0 ? "1px solid rgba(10,13,20,.06)" : "none" }}>
                    <p style={{ fontSize: "9px", fontWeight: 800, letterSpacing: ".16em", textTransform: "uppercase", color: "rgba(10,13,20,.35)", marginBottom: "2px" }}>{m.label}</p>
                    <p style={{ fontSize: "12px", fontWeight: 700, color: "#0a0d14" }}>{m.value}</p>
                  </div>
                ))}
              </div>

              {/* Items */}
              <div style={{ padding: "16px 16px 0" }}>
                <p style={{ fontSize: "9px", fontWeight: 800, letterSpacing: ".16em", textTransform: "uppercase", color: "rgba(10,13,20,.35)", marginBottom: "8px" }}>Items</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 52px 52px 64px", padding: "6px 8px", background: "rgba(10,13,20,.04)", borderRadius: "5px", marginBottom: "4px" }}>
                  {["Item","Size","Qty","Amount"].map(h => (
                    <span key={h} style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "rgba(10,13,20,.4)", textAlign: h !== "Item" ? "center" : "left" }}>{h}</span>
                  ))}
                </div>
                {lastReceipt.items.map((item: CartItem, i: number) => {
                  const sizeLabel    = getSizeLabel(item);
                  const isBottomItem = !!(item.selectedWaist && item.selectedLength);
                  return (
                    <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 52px 52px 64px", padding: "8px 8px", alignItems: "center", borderBottom: i < lastReceipt.items.length - 1 ? "1px solid rgba(10,13,20,.05)" : "none" }}>
                      <div>
                        <p style={{ fontSize: "11px", fontWeight: 600, color: "#0a0d14", lineHeight: 1.3 }}>{item.product.name}</p>
                        {item.selectedColor && <p style={{ fontSize: "9px", color: "rgba(10,13,20,.4)", marginTop: "1px" }}>{item.selectedColor}</p>}
                        <p style={{ fontSize: "10px", color: "rgba(10,13,20,.4)", marginTop: "1px" }}>@ ₱{fmt(item.product.price)}</p>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        {isBottomItem ? (
                          <span style={{ display: "inline-block", fontSize: "9px", fontWeight: 800, padding: "2px 4px", borderRadius: "3px", background: "rgba(26,86,219,.08)", color: "#1a56db", fontFamily: "monospace", lineHeight: 1.4 }}>
                            W{item.selectedWaist}<br />L{item.selectedLength}
                          </span>
                        ) : sizeLabel ? (
                          <span style={{ display: "inline-block", fontSize: "10px", fontWeight: 700, padding: "2px 6px", borderRadius: "3px", background: "rgba(10,13,20,.06)", color: "#0a0d14", textTransform: "uppercase" }}>
                            {sizeLabel}
                          </span>
                        ) : <span style={{ fontSize: "10px", color: "rgba(10,13,20,.3)" }}>—</span>}
                      </div>
                      <div style={{ textAlign: "center", fontSize: "12px", fontWeight: 700, color: "#0a0d14" }}>×{item.quantity}</div>
                      <div style={{ textAlign: "right", fontSize: "12px", fontWeight: 800, color: "#0a0d14" }}>₱{fmt(item.product.price * item.quantity)}</div>
                    </div>
                  );
                })}
              </div>

              {/* Totals */}
              <div style={{ padding: "12px 16px 0" }}>
                <div style={{ background: "rgba(10,13,20,.02)", borderRadius: "8px", border: "1px solid rgba(10,13,20,.07)", overflow: "hidden" }}>
                  {[
                    { label: "Subtotal", value: `₱${fmt(lastReceipt.subtotal)}` },
                    ...(lastReceipt.discount > 0 ? [{ label: "Discount", value: `-₱${fmt(lastReceipt.discount)}`, green: true }] : []),
                  ].map((row, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", borderBottom: "1px solid rgba(10,13,20,.05)" }}>
                      <span style={{ fontSize: "11px", color: "rgba(10,13,20,.5)" }}>{row.label}</span>
                      <span style={{ fontSize: "11px", fontWeight: 700, color: (row as any).green ? "#16a34a" : "#0a0d14" }}>{row.value}</span>
                    </div>
                  ))}

                  <div style={{ padding: "8px 12px", background: "rgba(10,13,20,.015)", borderBottom: "1px solid rgba(10,13,20,.05)" }}>
                    <p style={{ fontSize: "9px", fontWeight: 800, letterSpacing: ".14em", textTransform: "uppercase", color: "rgba(10,13,20,.35)", marginBottom: "5px" }}>VAT Summary ({lastReceipt.vat_rate}%)</p>
                    {[
                      { label: "VATable Sales (ex-VAT)", value: `₱${fmt(lastReceipt.vatable_sales)}` },
                      { label: `VAT ${lastReceipt.vat_rate}%`, value: `₱${fmt(lastReceipt.vat_amount)}` },
                      { label: "VAT-Exempt Sales", value: "₱0.00" },
                      { label: "Zero-Rated Sales", value: "₱0.00" },
                    ].map((v, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
                        <span style={{ fontSize: "10px", color: "rgba(10,13,20,.4)" }}>{v.label}</span>
                        <span style={{ fontSize: "10px", fontWeight: 600, color: "rgba(10,13,20,.55)" }}>{v.value}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", padding: "12px", background: "#0a0d14" }}>
                    <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1rem", letterSpacing: ".06em", color: "rgba(255,255,255,.65)" }}>TOTAL (VAT Incl.)</span>
                    <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.3rem", color: "#fff" }}>₱{fmt(lastReceipt.total)}</span>
                  </div>

                  {lastReceipt.payment_method === "cash" && (
                    <div style={{ padding: "8px 12px", borderTop: "1px solid rgba(255,255,255,.08)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                        <span style={{ fontSize: "11px", color: "rgba(10,13,20,.5)" }}>Cash Received</span>
                        <span style={{ fontSize: "11px", fontWeight: 700, color: "#0a0d14" }}>₱{fmt(lastReceipt.cash_received)}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ fontSize: "11px", color: "rgba(10,13,20,.5)" }}>Change</span>
                        <span style={{ fontSize: "11px", fontWeight: 700, color: "#16a34a" }}>₱{fmt(lastReceipt.change)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ padding: "14px 16px", textAlign: "center", borderTop: "1px solid rgba(10,13,20,.06)", marginTop: "14px" }}>
                <p style={{ fontSize: "10px", color: "rgba(10,13,20,.35)", lineHeight: 1.6 }}>
                  Thank you for your purchase!<br />
                  <strong style={{ color: "rgba(10,13,20,.5)" }}>This is your official receipt.</strong>
                </p>
              </div>

              <div style={{ padding: "0 16px 16px" }}>
                <button onClick={() => window.print()} style={{
                  width: "100%", padding: "11px", borderRadius: "10px",
                  background: "transparent", border: "1px solid rgba(10,13,20,.15)",
                  color: "rgba(10,13,20,.6)", fontWeight: 700, fontSize: "13px",
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                }}>
                  <Receipt size={14} /> Print Receipt
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @media print {
          body * { visibility: hidden; }
          #printable-receipt, #printable-receipt * { visibility: visible; }
          #printable-receipt { position: fixed; top: 0; left: 0; width: 80mm; }
          button { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default POSPage;
