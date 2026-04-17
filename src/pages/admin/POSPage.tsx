import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Minus, ShoppingCart, Trash2, CreditCard, Receipt, Barcode, X, Search, Ruler, Scale } from "lucide-react";

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

const PANTS_WAIST = ["28", "29", "30", "31", "32", "33", "34", "36", "38", "40", "42"];
const PANTS_LENGTH = ["28", "29", "30", "31", "32", "33", "34"];
const PANTS_CATEGORIES = ["pants", "jeans", "trousers", "shorts", "bottoms", "denim"];

const isPantsCategory = (category: string) =>
  PANTS_CATEGORIES.some(c => category.toLowerCase().includes(c));

const VariantPickerDialog = ({
  product, open, onClose, onConfirm,
}: {
  product: Product | null;
  open: boolean;
  onClose: () => void;
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading uppercase tracking-wider text-sm">Select Options</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 mt-2">
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
            {product.image_url && (
              <img src={product.image_url} alt={product.name} className="w-14 h-18 object-cover rounded-lg" style={{ height: "72px" }} />
            )}
            <div>
              {product.brand && <p className="text-[9px] font-bold tracking-widest uppercase text-muted-foreground mb-0.5">{product.brand}</p>}
              <p className="font-medium text-sm text-foreground leading-snug">{product.name}</p>
              <p className="font-heading text-primary text-sm mt-1">₱{Number(product.price).toLocaleString()}</p>
              {product.weight && (
                <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Scale size={9} /> {product.weight}g
                  {product.dimensions && ` · ${product.dimensions}`}
                </p>
              )}
            </div>
          </div>

          {isBottoms && (
            <>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    <Ruler size={13} className="text-primary" />
                    Waist Size
                    <span className="text-muted-foreground font-normal text-xs">— {waist || "Not selected"}</span>
                  </p>
                  <span className="text-[10px] text-muted-foreground">inches</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {waistOptions.map((w) => (
                    <button key={w} onClick={() => setWaist(w)}
                      className={`min-w-[44px] h-10 px-3 rounded-lg text-sm font-semibold border transition-all ${
                        waist === w
                          ? "bg-foreground text-background border-foreground"
                          : "border-border text-foreground hover:border-foreground/50"
                      }`}>
                      {w}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    <Ruler size={13} className="text-primary" />
                    Length
                    <span className="text-muted-foreground font-normal text-xs">— {length || "Not selected"}</span>
                  </p>
                  <span className="text-[10px] text-muted-foreground">inches</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {lengthOptions.map((l) => (
                    <button key={l} onClick={() => setLength(l)}
                      className={`min-w-[44px] h-10 px-3 rounded-lg text-sm font-semibold border transition-all ${
                        length === l
                          ? "bg-foreground text-background border-foreground"
                          : "border-border text-foreground hover:border-foreground/50"
                      }`}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              {waist && length && (
                <div style={{
                  padding: "10px 14px", borderRadius: "10px",
                  background: "rgba(26,86,219,.07)", border: "1px solid rgba(26,86,219,.18)",
                  display: "flex", alignItems: "center", gap: "10px",
                }}>
                  <Ruler size={15} style={{ color: "#1a56db" }} />
                  <div>
                    <p style={{ fontSize: "10px", fontWeight: 700, color: "rgba(10,13,20,.45)", letterSpacing: ".12em", textTransform: "uppercase", marginBottom: "2px" }}>
                      Selected Size
                    </p>
                    <p style={{ fontSize: "16px", fontWeight: 800, color: "#0a0d14", fontFamily: "monospace" }}>
                      W{waist} × L{length}
                    </p>
                  </div>
                </div>
              )}
            </>
          )}

          {needsSize && (
            <div>
              <p className="text-sm font-semibold text-foreground mb-2">
                Size <span className="text-muted-foreground font-normal">— {size || "Not selected"}</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {product.available_sizes!.map((s) => (
                  <button key={s} onClick={() => setSize(s)}
                    className={`min-w-[44px] h-10 px-3 rounded-lg text-sm font-semibold border transition-all ${
                      size === s ? "bg-foreground text-background border-foreground" : "border-border text-foreground hover:border-foreground/50"
                    }`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {needsColor && (
            <div>
              <p className="text-sm font-semibold text-foreground mb-2">
                Color <span className="text-muted-foreground font-normal">— {color || "Not selected"}</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {product.available_colors!.map((c) => (
                  <button key={c} onClick={() => setColor(c)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                      color === c ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                    }`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          {(product.weight || product.dimensions) && (
            <div style={{
              padding: "10px 14px", borderRadius: "8px",
              background: "rgba(10,13,20,.03)", border: "1px solid rgba(10,13,20,.08)",
            }}>
              <p style={{ fontSize: "9px", fontWeight: 800, letterSpacing: ".18em", textTransform: "uppercase", color: "rgba(10,13,20,.35)", marginBottom: "7px" }}>
                Product Details
              </p>
              <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                {product.weight && (
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <Scale size={12} style={{ color: "rgba(10,13,20,.4)" }} />
                    <span style={{ fontSize: "11px", color: "rgba(10,13,20,.55)", fontWeight: 500 }}>
                      Weight: <strong style={{ color: "#0a0d14" }}>{product.weight}g</strong>
                    </span>
                  </div>
                )}
                {product.dimensions && (
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <Ruler size={12} style={{ color: "rgba(10,13,20,.4)" }} />
                    <span style={{ fontSize: "11px", color: "rgba(10,13,20,.55)", fontWeight: 500 }}>
                      Dimensions: <strong style={{ color: "#0a0d14" }}>{product.dimensions}</strong>
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button onClick={handleConfirm} className="flex-1 bg-primary text-primary-foreground font-heading uppercase tracking-wider text-xs">
              Add to Cart
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

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
  const [receiptSettings, setReceiptSettings] = useState<ReceiptSettings>({
    company_name: "My Company", address: "", tin_no: "", vat_rate: 12, logo_url: null,
  });
  const barcodeRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchProducts(); fetchReceiptSettings(); }, []);

  const fetchProducts = async () => {
    const { data } = await supabase
      .from("products")
      .select("id, name, price, category, image_url, barcode, sku, stock_quantity, available_sizes, available_colors, available_waist_sizes, available_lengths, brand, weight, dimensions")
      .eq("in_stock", true)
      .order("name");
    setProducts(data || []);
  };

  const fetchReceiptSettings = async () => {
    const { data } = await supabase.from("receipt_settings")
      .select("company_name, address, tin_no, vat_rate, logo_url").limit(1).single();
    if (data) setReceiptSettings(data);
  };

  const openVariantPicker = (product: Product) => {
    const isBottoms = isPantsCategory(product.category);
    const needsVariant = isBottoms ||
      (product.available_sizes?.length ?? 0) > 0 ||
      (product.available_colors?.length ?? 0) > 0;

    if (needsVariant) {
      setVariantProduct(product);
      setVariantOpen(true);
    } else {
      addToCart(product);
    }
  };

  const addToCart = (
    product: Product,
    selectedSize?: string,
    selectedColor?: string,
    selectedWaist?: string,
    selectedLength?: string,
  ) => {
    setCart((prev) => {
      const existing = prev.find(
        (c) =>
          c.product.id === product.id &&
          c.selectedSize === selectedSize &&
          c.selectedColor === selectedColor &&
          c.selectedWaist === selectedWaist &&
          c.selectedLength === selectedLength
      );
      if (existing) {
        if (existing.quantity >= product.stock_quantity) { toast.error("Stock limit reached"); return prev; }
        return prev.map((c) =>
          c.product.id === product.id &&
          c.selectedSize === selectedSize &&
          c.selectedColor === selectedColor &&
          c.selectedWaist === selectedWaist &&
          c.selectedLength === selectedLength
            ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      if (product.stock_quantity <= 0) { toast.error("Out of stock"); return prev; }
      return [...prev, { product, quantity: 1, discount: 0, selectedSize, selectedColor, selectedWaist, selectedLength }];
    });

    const sizeLabel = selectedWaist && selectedLength
      ? `W${selectedWaist}/L${selectedLength}`
      : selectedSize ?? "";
    toast.success(`Added: ${product.name}${sizeLabel ? ` (${sizeLabel})` : ""}${selectedColor ? ` · ${selectedColor}` : ""}`);
  };

  const handleBarcodeScan = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const code = (e.target as HTMLInputElement).value.trim();
      const product = products.find((p) => p.barcode === code || p.sku === code);
      if (product) { openVariantPicker(product); }
      else toast.error("Product not found");
      setSearch("");
    }
  };

  const updateQty = (index: number, delta: number) => {
    setCart((prev) => prev.map((c, i) => {
      if (i !== index) return c;
      const newQty = c.quantity + delta;
      if (newQty > c.product.stock_quantity) { toast.error("Stock limit"); return c; }
      return { ...c, quantity: Math.max(0, newQty) };
    }).filter((c) => c.quantity > 0));
  };

  const removeFromCart = (index: number) => setCart((prev) => prev.filter((_, i) => i !== index));

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
      items: cart.map((c) => ({
        id: c.product.id, name: c.product.name, price: c.product.price,
        quantity: c.quantity, discount: c.discount,
        size: c.selectedSize || null, color: c.selectedColor || null,
        waist: c.selectedWaist || null, length: c.selectedLength || null,
      })),
      subtotal, discount: discountAmount, total,
      cash_received: cashReceived, change_amount: change,
      payment_method: paymentMethod, receipt_number: receiptNumber,
      customer_name: customerName,
    });

    if (error) { toast.error("Transaction failed"); setProcessing(false); return; }

    await supabase.from("orders").insert({
      customer_name: customerName,
      items: cart.map((c) => ({
        id: c.product.id, name: c.product.name, price: c.product.price,
        quantity: c.quantity,
        size: c.selectedSize || null, color: c.selectedColor || null,
        waist: c.selectedWaist || null, length: c.selectedLength || null,
      })),
      total, subtotal, discount: discountAmount,
      status: "completed", payment_method: paymentMethod, order_type: "pos",
    });

    for (const item of cart) {
      const newStock = Math.max(0, item.product.stock_quantity - item.quantity);
      await supabase.from("products").update({
        stock_quantity: newStock,
        sold_count: item.product.stock_quantity + item.quantity,
        in_stock: newStock > 0,
      }).eq("id", item.product.id);
      await supabase.from("inventory_logs").insert({
        product_id: item.product.id, change_type: "sold",
        quantity_change: -item.quantity,
        quantity_before: item.product.stock_quantity,
        quantity_after: newStock,
        notes: `POS Sale: ${receiptNumber}`,
      });
    }

    setLastReceipt({
      items: [...cart], subtotal, discount: discountAmount,
      vat_amount: vatAmount, vat_rate: receiptSettings.vat_rate,
      vatable_sales: vatableSales,
      total, cash_received: cashReceived, change,
      payment_method: paymentMethod, receipt_number: receiptNumber,
      customer_name: customerName, date: new Date().toLocaleString(),
      company_name: receiptSettings.company_name,
      address: receiptSettings.address, tin_no: receiptSettings.tin_no,
      logo_url: receiptSettings.logo_url,
    });

    setReceiptDialog(true);
    setCart([]);
    setCustomerName("Walk-in Customer");
    setCashReceived(0);
    setDiscountAmount(0);
    setProcessing(false);
    fetchProducts();
  };

  const categories = ["all", ...Array.from(new Set(products.map((p) => p.category)))];

  const filteredProducts = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.barcode?.includes(search) || p.sku?.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === "all" || p.category === categoryFilter;
    return matchSearch && matchCat;
  });

  const fmt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const getSizeLabel = (item: CartItem): string => {
    if (item.selectedWaist && item.selectedLength) return `W${item.selectedWaist}/L${item.selectedLength}`;
    if (item.selectedSize) return item.selectedSize;
    return "";
  };

  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl uppercase tracking-wider text-foreground">Point of Sale</h1>

      <div className="grid lg:grid-cols-3 gap-4">

        {/* Products Panel */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Barcode size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={barcodeRef}
                placeholder="Scan barcode or search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleBarcodeScan}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-36 text-xs"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c} value={c} className="capitalize text-xs">
                    {c === "all" ? "All Categories" : c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
              <Search size={32} className="opacity-30" />
              <p className="text-sm">No products found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
              {filteredProducts.map((p) => {
                const isBottoms = isPantsCategory(p.category);
                return (
                  <button
                    key={p.id}
                    onClick={() => openVariantPicker(p)}
                    className="group bg-card border border-border/40 rounded-xl overflow-hidden text-left hover:border-primary/40 hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
                  >
                    <div className="relative w-full aspect-[3/4] bg-muted overflow-hidden">
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <ShoppingCart size={24} />
                        </div>
                      )}
                      {p.stock_quantity <= 3 && p.stock_quantity > 0 && (
                        <span className="absolute top-1.5 left-1.5 text-[9px] px-1.5 py-0.5 rounded bg-orange-500 text-white font-bold">
                          Low Stock
                        </span>
                      )}
                      {p.stock_quantity === 0 && (
                        <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
                          <span className="text-xs font-bold text-muted-foreground">Out of Stock</span>
                        </div>
                      )}
                      <div className="absolute bottom-1.5 right-1.5 flex gap-1 flex-wrap justify-end">
                        {isBottoms && (
                          <span style={{
                            fontSize: "9px", padding: "2px 5px", borderRadius: "3px",
                            background: "rgba(26,86,219,.85)", color: "#fff", fontWeight: 700,
                          }}>W×L</span>
                        )}
                        {!isBottoms && (p.available_sizes?.length ?? 0) > 0 && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-black/60 text-white font-medium">SIZE</span>
                        )}
                        {(p.available_colors?.length ?? 0) > 0 && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-black/60 text-white font-medium">COLOR</span>
                        )}
                      </div>
                    </div>

                    <div className="p-2.5">
                      {p.brand && <p className="text-[10px] text-muted-foreground uppercase tracking-wider truncate">{p.brand}</p>}
                      <p className="text-xs font-medium text-foreground line-clamp-2 leading-snug mt-0.5">{p.name}</p>
                      <p className="font-heading text-primary text-sm mt-1">₱{Number(p.price).toLocaleString()}</p>
                      <div className="flex items-center justify-between mt-0.5">
                        <p className="text-[10px] text-muted-foreground">Stock: {p.stock_quantity}</p>
                        {p.weight && (
                          <p className="text-[9px] text-muted-foreground flex items-center gap-0.5">
                            <Scale size={8} /> {p.weight}g
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Cart Panel */}
        <Card className="h-fit sticky top-4 border-border/60">
          <CardHeader className="pb-2 border-b border-border/60">
            <CardTitle className="font-heading text-sm uppercase tracking-wider flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart size={15} /> Cart
              </div>
              {cart.length > 0 && (
                <button onClick={() => setCart([])}
                  className="text-[10px] text-muted-foreground hover:text-destructive transition-colors underline">
                  Clear
                </button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-3">
            {cart.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart size={28} className="mx-auto text-muted-foreground/40 mb-2" />
                <p className="text-xs text-muted-foreground">Tap a product to add</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[320px] overflow-y-auto pr-0.5">
                {cart.map((item, index) => {
                  const sizeLabel = getSizeLabel(item);
                  const isBottomItem = item.selectedWaist && item.selectedLength;

                  return (
                    <div key={index} className="flex gap-2 bg-muted/40 rounded-xl p-2.5 border border-border/40">
                      {item.product.image_url && (
                        <img src={item.product.image_url} alt={item.product.name}
                          className="w-10 h-12 object-cover rounded-lg shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-medium text-foreground leading-snug line-clamp-1">{item.product.name}</p>
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {isBottomItem ? (
                            <span style={{
                              fontSize: "9px", fontWeight: 800, padding: "2px 6px", borderRadius: "3px",
                              background: "rgba(26,86,219,.1)", color: "#1a56db", border: "1px solid rgba(26,86,219,.2)",
                              fontFamily: "monospace", letterSpacing: ".05em",
                            }}>
                              W{item.selectedWaist}/L{item.selectedLength}
                            </span>
                          ) : sizeLabel ? (
                            <span style={{
                              fontSize: "9px", fontWeight: 700, padding: "2px 6px", borderRadius: "3px",
                              background: "rgba(10,13,20,.07)", color: "rgba(10,13,20,.65)",
                              border: "1px solid rgba(10,13,20,.12)", textTransform: "uppercase",
                            }}>
                              {sizeLabel}
                            </span>
                          ) : null}
                          {item.selectedColor && (
                            <span style={{
                              fontSize: "9px", padding: "2px 6px", borderRadius: "3px",
                              background: "rgba(10,13,20,.05)", color: "rgba(10,13,20,.5)",
                              border: "1px solid rgba(10,13,20,.1)",
                            }}>
                              {item.selectedColor}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          ₱{Number(item.product.price).toLocaleString()} × {item.quantity}
                          = <span className="text-foreground font-medium">₱{(item.product.price * item.quantity).toLocaleString()}</span>
                        </p>
                        <div className="flex items-center justify-between mt-1.5">
                          <div className="flex items-center border border-border rounded-lg overflow-hidden">
                            <button onClick={() => updateQty(index, -1)}
                              className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                              <Minus size={9} />
                            </button>
                            <span className="text-[11px] w-6 text-center font-medium border-x border-border">{item.quantity}</span>
                            <button onClick={() => updateQty(index, 1)}
                              className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                              <Plus size={9} />
                            </button>
                          </div>
                          <button onClick={() => removeFromCart(index)}
                            className="text-muted-foreground hover:text-destructive transition-colors p-1">
                            <X size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="border-t border-border pt-3 space-y-2.5">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Subtotal</span><span>₱{fmt(subtotal)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground shrink-0">Discount:</span>
                <Input type="number" className="h-7 text-xs" value={discountAmount || ""}
                  onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)} placeholder="0" />
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount</span><span>-₱{fmt(discountAmount)}</span>
                </div>
              )}
              {receiptSettings.vat_rate > 0 && cart.length > 0 && (
                <div className="rounded-lg bg-muted/50 p-2 space-y-1">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">VAT Breakdown</p>
                  <div className="flex justify-between text-[11px] text-muted-foreground">
                    <span>Vatable Sales (ex-VAT)</span><span>₱{fmt(vatableSales)}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-muted-foreground">
                    <span>VAT {receiptSettings.vat_rate}%</span><span>₱{fmt(vatAmount)}</span>
                  </div>
                </div>
              )}
              <div className="flex justify-between font-heading text-lg border-t border-border pt-2">
                <span className="text-foreground">Total</span>
                <span className="text-primary">₱{fmt(total)}</span>
              </div>
              <Input placeholder="Customer name" className="h-8 text-sm" value={customerName}
                onChange={(e) => setCustomerName(e.target.value)} />
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="h-8 text-xs">
                  <CreditCard size={12} className="mr-1" /><SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="gcash">GCash</SelectItem>
                </SelectContent>
              </Select>
              {paymentMethod === "cash" && (
                <div className="space-y-1">
                  <Input type="number" placeholder="Cash received" className="h-8 text-sm"
                    value={cashReceived || ""} onChange={(e) => setCashReceived(parseFloat(e.target.value) || 0)} />
                  {cashReceived > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Change</span>
                      <span className="font-heading text-green-600">₱{fmt(change)}</span>
                    </div>
                  )}
                </div>
              )}
              <Button onClick={handleCheckout} disabled={cart.length === 0 || processing}
                className="w-full bg-primary text-primary-foreground font-heading uppercase tracking-wider h-11">
                {processing ? "Processing..." : `Checkout · ₱${fmt(total)}`}
              </Button>
            </div>
          </CardContent>
        </Card>
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
        <DialogContent className="max-w-md max-h-[92vh] overflow-y-auto p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>Receipt</DialogTitle>
          </DialogHeader>
          {lastReceipt && (
            <div id="printable-receipt">

              {/* Header */}
              <div style={{
                background: "linear-gradient(135deg, #060b18 0%, #0f1f3d 100%)",
                padding: "24px 20px 20px", textAlign: "center",
              }}>
                {lastReceipt.logo_url && (
                  <img src={lastReceipt.logo_url} alt="Logo" style={{ height: "48px", objectFit: "contain", margin: "0 auto 10px", display: "block" }} />
                )}
                <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.4rem", letterSpacing: ".08em", color: "#fff", marginBottom: "4px" }}>
                  {lastReceipt.company_name}
                </p>
                {lastReceipt.address && <p style={{ fontSize: "11px", color: "rgba(255,255,255,.45)", marginBottom: "2px" }}>{lastReceipt.address}</p>}
                {lastReceipt.tin_no && <p style={{ fontSize: "10px", color: "rgba(255,255,255,.35)" }}>TIN: {lastReceipt.tin_no}</p>}
              </div>

              {/* Receipt meta */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderBottom: "1px solid rgba(10,13,20,.08)" }}>
                {[
                  { label: "Receipt #", value: lastReceipt.receipt_number },
                  { label: "Date",      value: lastReceipt.date },
                  { label: "Customer",  value: lastReceipt.customer_name },
                  { label: "Payment",   value: lastReceipt.payment_method.toUpperCase() },
                ].map((m, i) => (
                  <div key={i} style={{
                    padding: "10px 16px",
                    borderBottom: i < 2 ? "1px solid rgba(10,13,20,.06)" : "none",
                    borderRight: i % 2 === 0 ? "1px solid rgba(10,13,20,.06)" : "none",
                  }}>
                    <p style={{ fontSize: "9px", fontWeight: 800, letterSpacing: ".16em", textTransform: "uppercase", color: "rgba(10,13,20,.35)", marginBottom: "2px" }}>
                      {m.label}
                    </p>
                    <p style={{ fontSize: "12px", fontWeight: 700, color: "#0a0d14" }}>{m.value}</p>
                  </div>
                ))}
              </div>

              {/* Items */}
              <div style={{ padding: "16px 16px 0" }}>
                <p style={{ fontSize: "9px", fontWeight: 800, letterSpacing: ".16em", textTransform: "uppercase", color: "rgba(10,13,20,.35)", marginBottom: "8px" }}>
                  Items
                </p>
                <div style={{
                  display: "grid", gridTemplateColumns: "1fr 52px 52px 64px",
                  padding: "6px 8px", background: "rgba(10,13,20,.04)", borderRadius: "5px", marginBottom: "4px",
                }}>
                  {["Item", "Size", "Qty", "Amount"].map(h => (
                    <span key={h} style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "rgba(10,13,20,.4)", textAlign: h !== "Item" ? "center" : "left" }}>{h}</span>
                  ))}
                </div>

                {lastReceipt.items.map((item: CartItem, i: number) => {
                  const sizeLabel    = getSizeLabel(item);
                  const isBottomItem = !!(item.selectedWaist && item.selectedLength);

                  return (
                    <div key={i} style={{
                      display: "grid", gridTemplateColumns: "1fr 52px 52px 64px",
                      padding: "8px 8px", alignItems: "center",
                      borderBottom: i < lastReceipt.items.length - 1 ? "1px solid rgba(10,13,20,.05)" : "none",
                    }}>
                      <div>
                        <p style={{ fontSize: "11px", fontWeight: 600, color: "#0a0d14", lineHeight: 1.3 }}>
                          {item.product.name}
                        </p>
                        {item.selectedColor && (
                          <p style={{ fontSize: "9px", color: "rgba(10,13,20,.4)", marginTop: "1px" }}>
                            {item.selectedColor}
                          </p>
                        )}
                        <p style={{ fontSize: "10px", color: "rgba(10,13,20,.4)", marginTop: "1px" }}>
                          @ ₱{fmt(item.product.price)}
                        </p>
                        {item.product.weight && (
                          <p style={{ fontSize: "9px", color: "rgba(10,13,20,.3)", marginTop: "1px" }}>
                            {item.product.weight}g
                            {item.product.dimensions ? ` · ${item.product.dimensions}` : ""}
                          </p>
                        )}
                      </div>

                      <div style={{ textAlign: "center" }}>
                        {isBottomItem ? (
                          <span style={{
                            display: "inline-block", fontSize: "9px", fontWeight: 800,
                            padding: "2px 4px", borderRadius: "3px",
                            background: "rgba(26,86,219,.08)", color: "#1a56db",
                            fontFamily: "monospace", lineHeight: 1.4,
                          }}>
                            W{item.selectedWaist}<br />L{item.selectedLength}
                          </span>
                        ) : sizeLabel ? (
                          <span style={{
                            display: "inline-block", fontSize: "10px", fontWeight: 700,
                            padding: "2px 6px", borderRadius: "3px",
                            background: "rgba(10,13,20,.06)", color: "#0a0d14",
                            textTransform: "uppercase",
                          }}>
                            {sizeLabel}
                          </span>
                        ) : (
                          <span style={{ fontSize: "10px", color: "rgba(10,13,20,.3)" }}>—</span>
                        )}
                      </div>

                      <div style={{ textAlign: "center", fontSize: "12px", fontWeight: 700, color: "#0a0d14" }}>
                        ×{item.quantity}
                      </div>

                      <div style={{ textAlign: "right", fontSize: "12px", fontWeight: 800, color: "#0a0d14" }}>
                        ₱{fmt(item.product.price * item.quantity)}
                      </div>
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

                  {/* VAT Summary */}
                  <div style={{ padding: "8px 12px", background: "rgba(10,13,20,.015)", borderBottom: "1px solid rgba(10,13,20,.05)" }}>
                    <p style={{ fontSize: "9px", fontWeight: 800, letterSpacing: ".14em", textTransform: "uppercase", color: "rgba(10,13,20,.35)", marginBottom: "5px" }}>
                      VAT Summary ({lastReceipt.vat_rate}%)
                    </p>
                    {[
                      { label: "VATable Sales (ex-VAT)", value: `₱${fmt(lastReceipt.vatable_sales)}` },
                      { label: `VAT ${lastReceipt.vat_rate}%`, value: `₱${fmt(lastReceipt.vat_amount)}` },
                      { label: "VAT-Exempt Sales",  value: "₱0.00" },
                      { label: "Zero-Rated Sales",  value: "₱0.00" },
                    ].map((v, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
                        <span style={{ fontSize: "10px", color: "rgba(10,13,20,.4)" }}>{v.label}</span>
                        <span style={{ fontSize: "10px", fontWeight: 600, color: "rgba(10,13,20,.55)" }}>{v.value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Grand total */}
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 12px", background: "#0a0d14" }}>
                    <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1rem", letterSpacing: ".06em", color: "rgba(255,255,255,.65)" }}>
                      TOTAL (VAT Incl.)
                    </span>
                    <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.3rem", color: "#fff" }}>
                      ₱{fmt(lastReceipt.total)}
                    </span>
                  </div>

                  {/* Cash / change */}
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
                <Button variant="outline" className="w-full" onClick={() => window.print()}>
                  <Receipt size={14} className="mr-2" /> Print Receipt
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <style>{`
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
