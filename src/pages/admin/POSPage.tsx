import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Minus, ShoppingCart, Trash2, CreditCard, Receipt, Barcode, X, Search } from "lucide-react";

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
  brand?: string;
}

interface CartItem {
  product: Product;
  quantity: number;
  discount: number;
  selectedSize?: string;
  selectedColor?: string;
}

interface ReceiptSettings {
  company_name: string;
  address: string;
  tin_no: string;
  vat_rate: number;
  logo_url: string | null;
}

// Size/Color picker dialog
const VariantPickerDialog = ({
  product, open, onClose, onConfirm,
}: {
  product: Product | null;
  open: boolean;
  onClose: () => void;
  onConfirm: (size?: string, color?: string) => void;
}) => {
  const [size, setSize]   = useState("");
  const [color, setColor] = useState("");

  useEffect(() => { if (open) { setSize(""); setColor(""); } }, [open]);

  if (!product) return null;

  const needsSize  = product.available_sizes && product.available_sizes.length > 0;
  const needsColor = product.available_colors && product.available_colors.length > 0;

  const handleConfirm = () => {
    if (needsSize && !size)  { toast.error("Please select a size");  return; }
    if (needsColor && !color){ toast.error("Please select a color"); return; }
    onConfirm(size || undefined, color || undefined);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-heading uppercase tracking-wider text-sm">Select Options</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 mt-2">
          {/* Product preview */}
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
            {product.image_url && (
              <img src={product.image_url} alt={product.name} className="w-14 h-14 object-cover rounded-lg" />
            )}
            <div>
              <p className="font-medium text-sm text-foreground">{product.name}</p>
              {product.brand && <p className="text-xs text-muted-foreground">{product.brand}</p>}
              <p className="font-heading text-primary text-sm mt-0.5">₱{Number(product.price).toLocaleString()}</p>
            </div>
          </div>

          {/* Size picker */}
          {needsSize && (
            <div>
              <p className="text-sm font-medium text-foreground mb-2">
                Size <span className="text-muted-foreground font-normal">— {size || "Not selected"}</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {product.available_sizes!.map((s) => (
                  <button key={s} onClick={() => setSize(s)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                      size === s
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                    }`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Color picker */}
          {needsColor && (
            <div>
              <p className="text-sm font-medium text-foreground mb-2">
                Color <span className="text-muted-foreground font-normal">— {color || "Not selected"}</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {product.available_colors!.map((c) => (
                  <button key={c} onClick={() => setColor(c)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                      color === c
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                    }`}>
                    {c}
                  </button>
                ))}
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
      .select("id, name, price, category, image_url, barcode, sku, stock_quantity, available_sizes, available_colors, brand")
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
    const needsVariant = (product.available_sizes?.length ?? 0) > 0 || (product.available_colors?.length ?? 0) > 0;
    if (needsVariant) {
      setVariantProduct(product);
      setVariantOpen(true);
    } else {
      addToCart(product);
    }
  };

  const addToCart = (product: Product, selectedSize?: string, selectedColor?: string) => {
    setCart((prev) => {
      const existing = prev.find(
        (c) => c.product.id === product.id && c.selectedSize === selectedSize && c.selectedColor === selectedColor
      );
      if (existing) {
        if (existing.quantity >= product.stock_quantity) { toast.error("Stock limit reached"); return prev; }
        return prev.map((c) =>
          c.product.id === product.id && c.selectedSize === selectedSize && c.selectedColor === selectedColor
            ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      if (product.stock_quantity <= 0) { toast.error("Out of stock"); return prev; }
      return [...prev, { product, quantity: 1, discount: 0, selectedSize, selectedColor }];
    });
    toast.success(`Added: ${product.name}${selectedSize ? ` (${selectedSize})` : ""}${selectedColor ? ` · ${selectedColor}` : ""}`);
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

  // ── Computations ──
  const subtotal          = cart.reduce((s, c) => s + c.product.price * c.quantity, 0);
  const discountedSubtotal = Math.max(0, subtotal - discountAmount);
  const vatRate           = (receiptSettings.vat_rate || 0) / 100;
  const vatableSales      = discountedSubtotal / (1 + vatRate);
  const vatAmount         = discountedSubtotal - vatableSales;
  const total             = discountedSubtotal;
  const change            = Math.max(0, cashReceived - total);

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
        quantity: c.quantity, size: c.selectedSize || null, color: c.selectedColor || null,
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

  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl uppercase tracking-wider text-foreground">Point of Sale</h1>

      <div className="grid lg:grid-cols-3 gap-4">

        {/* ── Products Panel ── */}
        <div className="lg:col-span-2 space-y-3">

          {/* Search + filter bar */}
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

          {/* Product grid — Zalora style */}
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
              <Search size={32} className="opacity-30" />
              <p className="text-sm">No products found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
              {filteredProducts.map((p) => (
                <button
                  key={p.id}
                  onClick={() => openVariantPicker(p)}
                  className="group bg-card border border-border/40 rounded-xl overflow-hidden text-left hover:border-primary/40 hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
                >
                  {/* Image */}
                  <div className="relative w-full aspect-[3/4] bg-muted overflow-hidden">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <ShoppingCart size={24} />
                      </div>
                    )}
                    {/* Stock badge */}
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
                    {/* Size/color indicator */}
                    {((p.available_sizes?.length ?? 0) > 0 || (p.available_colors?.length ?? 0) > 0) && (
                      <div className="absolute bottom-1.5 right-1.5 flex gap-1">
                        {(p.available_sizes?.length ?? 0) > 0 && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-black/60 text-white font-medium">SIZE</span>
                        )}
                        {(p.available_colors?.length ?? 0) > 0 && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-black/60 text-white font-medium">COLOR</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-2.5">
                    {p.brand && <p className="text-[10px] text-muted-foreground uppercase tracking-wider truncate">{p.brand}</p>}
                    <p className="text-xs font-medium text-foreground line-clamp-2 leading-snug mt-0.5">{p.name}</p>
                    <p className="font-heading text-primary text-sm mt-1">₱{Number(p.price).toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Stock: {p.stock_quantity}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Cart Panel ── */}
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
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-0.5">
                {cart.map((item, index) => (
                  <div key={index} className="flex gap-2 bg-muted/40 rounded-xl p-2.5 border border-border/40">
                    {item.product.image_url && (
                      <img src={item.product.image_url} alt={item.product.name}
                        className="w-10 h-12 object-cover rounded-lg shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-medium text-foreground leading-snug line-clamp-1">{item.product.name}</p>

                      {/* Variants */}
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {item.selectedSize && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium border border-primary/20">
                            {item.selectedSize}
                          </span>
                        )}
                        {item.selectedColor && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium border border-primary/20">
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
                ))}
              </div>
            )}

            {/* Totals + checkout */}
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

      {/* ── Variant Picker ── */}
      <VariantPickerDialog
        product={variantProduct}
        open={variantOpen}
        onClose={() => { setVariantOpen(false); setVariantProduct(null); }}
        onConfirm={(size, color) => { if (variantProduct) addToCart(variantProduct, size, color); }}
      />

      {/* ── Receipt Dialog ── */}
      <Dialog open={receiptDialog} onOpenChange={setReceiptDialog}>
        <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="sr-only">Receipt</DialogTitle>
          </DialogHeader>
          {lastReceipt && (
            <div id="printable-receipt" className="font-mono text-xs text-foreground space-y-3"
              style={{ maxWidth: 280, margin: "0 auto" }}>

              {/* Header */}
              <div className="text-center space-y-0.5 pb-3 border-b border-dashed border-border">
                {lastReceipt.logo_url && (
                  <img src={lastReceipt.logo_url} alt="Logo" className="h-14 object-contain mx-auto mb-2" />
                )}
                <p className="font-bold text-sm">{lastReceipt.company_name}</p>
                {lastReceipt.tin_no && <p className="text-[10px] text-muted-foreground">TIN: {lastReceipt.tin_no}</p>}
                {lastReceipt.address && <p className="text-[10px] text-muted-foreground">{lastReceipt.address}</p>}
                <p className="text-[10px] text-muted-foreground">{lastReceipt.date}</p>
                <p className="text-[10px] text-muted-foreground">Receipt#: {lastReceipt.receipt_number}</p>
                {lastReceipt.customer_name !== "Walk-in Customer" && (
                  <p className="text-[10px] text-muted-foreground">Customer: {lastReceipt.customer_name}</p>
                )}
              </div>

              <p className="text-center font-bold tracking-widest uppercase text-xs">Official Receipt</p>

              {/* Column headers */}
              <div className="flex justify-between text-[10px] font-bold border-b border-border pb-1">
                <span className="flex-1">Item</span>
                <span className="w-8 text-center">Qty</span>
                <span className="w-16 text-right">Amount</span>
              </div>

              {/* Items with size + color */}
              <div className="space-y-1.5">
                {lastReceipt.items.map((item: CartItem, i: number) => (
                  <div key={i}>
                    <div className="flex justify-between text-[10px]">
                      <span className="flex-1 truncate pr-1">{item.product.name}</span>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <span className="w-16 text-right">₱{fmt(item.product.price * item.quantity)}</span>
                    </div>
                    {/* Size / Color on next line */}
                    {(item.selectedSize || item.selectedColor) && (
                      <p className="text-[9px] text-muted-foreground pl-1 mt-0.5">
                        {[
                          item.selectedSize  ? `Size: ${item.selectedSize}`  : null,
                          item.selectedColor ? `Color: ${item.selectedColor}` : null,
                        ].filter(Boolean).join("  ·  ")}
                      </p>
                    )}
                    {/* Unit price if qty > 1 */}
                    {item.quantity > 1 && (
                      <p className="text-[9px] text-muted-foreground pl-1">
                        @ ₱{fmt(item.product.price)} each
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="border-t border-dashed border-border pt-2 space-y-0.5">
                <div className="flex justify-between text-[10px]">
                  <span>Subtotal</span><span>₱{fmt(lastReceipt.subtotal)}</span>
                </div>
                {lastReceipt.discount > 0 && (
                  <div className="flex justify-between text-[10px]">
                    <span>Discount</span><span>-₱{fmt(lastReceipt.discount)}</span>
                  </div>
                )}
              </div>

              {/* VAT Summary */}
              <div className="border-t border-dashed border-border pt-2 space-y-0.5">
                <p className="text-[10px] font-bold uppercase tracking-wider mb-1">VAT Summary</p>
                <div className="flex justify-between text-[10px]">
                  <span>Vatable Sales</span><span>₱{fmt(lastReceipt.vatable_sales)}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span>VAT ({lastReceipt.vat_rate}%)</span><span>₱{fmt(lastReceipt.vat_amount)}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span>VAT Exempt Sales</span><span>₱0.00</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span>Zero Rated Sales</span><span>₱0.00</span>
                </div>
              </div>

              {/* Grand total */}
              <div className="border-t border-border pt-2 space-y-0.5">
                <div className="flex justify-between font-bold text-xs">
                  <span>Total (VAT Inc.)</span><span>₱{fmt(lastReceipt.total)}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span>Paid ({lastReceipt.payment_method})</span>
                  <span>₱{fmt(lastReceipt.cash_received)}</span>
                </div>
                {lastReceipt.change > 0 && (
                  <div className="flex justify-between text-[10px]">
                    <span>Change</span><span>₱{fmt(lastReceipt.change)}</span>
                  </div>
                )}
              </div>

              <p className="text-center text-[10px] text-muted-foreground pt-1 border-t border-dashed border-border">
                Thank you for your purchase!
              </p>

              <Button variant="outline" className="w-full mt-2" onClick={() => window.print()}>
                <Receipt size={14} className="mr-2" /> Print Receipt
              </Button>
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