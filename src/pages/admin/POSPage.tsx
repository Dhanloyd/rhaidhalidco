import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Minus, ShoppingCart, Trash2, CreditCard, Receipt, Barcode } from "lucide-react";

interface Product {
  id: string; name: string; price: number; category: string; image_url: string | null; barcode: string | null; sku: string | null; stock_quantity: number;
}
interface CartItem { product: Product; quantity: number; discount: number; }

interface ReceiptSettings {
  company_name: string;
  address: string;
  tin_no: string;
  vat_rate: number;
  logo_url: string | null;
}

const POSPage = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("Walk-in Customer");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [cashReceived, setCashReceived] = useState(0);
  const [search, setSearch] = useState("");
  const [processing, setProcessing] = useState(false);
  const [receiptDialog, setReceiptDialog] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<any>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [receiptSettings, setReceiptSettings] = useState<ReceiptSettings>({
    company_name: "My Company",
    address: "",
    tin_no: "",
    vat_rate: 12,
    logo_url: null,
  });
  const barcodeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProducts();
    fetchReceiptSettings();
  }, []);

  const fetchProducts = async () => {
    const { data } = await supabase
      .from("products")
      .select("id, name, price, category, image_url, barcode, sku, stock_quantity")
      .eq("in_stock", true)
      .order("name");
    setProducts(data || []);
  };

  const fetchReceiptSettings = async () => {
    const { data } = await supabase
      .from("receipt_settings")
      .select("company_name, address, tin_no, vat_rate, logo_url")
      .limit(1)
      .single();
    if (data) setReceiptSettings(data);
  };

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock_quantity) { toast.error("Stock limit reached"); return prev; }
        return prev.map((c) => c.product.id === product.id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      if (product.stock_quantity <= 0) { toast.error("Out of stock"); return prev; }
      return [...prev, { product, quantity: 1, discount: 0 }];
    });
  };

  const handleBarcodeScan = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const code = (e.target as HTMLInputElement).value.trim();
      const product = products.find((p) => p.barcode === code || p.sku === code);
      if (product) { addToCart(product); toast.success(`Added: ${product.name}`); }
      else toast.error("Product not found");
      setSearch("");
    }
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) => prev.map((c) => {
      if (c.product.id !== id) return c;
      const newQty = c.quantity + delta;
      if (newQty > c.product.stock_quantity) { toast.error("Stock limit"); return c; }
      return { ...c, quantity: Math.max(0, newQty) };
    }).filter((c) => c.quantity > 0));
  };

  const removeFromCart = (id: string) => setCart((prev) => prev.filter((c) => c.product.id !== id));

  const subtotal = cart.reduce((s, c) => s + c.product.price * c.quantity, 0);
  const discountedSubtotal = Math.max(0, subtotal - discountAmount);
  const vatAmount = discountedSubtotal * ((receiptSettings.vat_rate || 0) / 100);
  const total = discountedSubtotal + vatAmount;
  const change = Math.max(0, cashReceived - total);

  const generateReceiptNo = () => `POS-${Date.now().toString(36).toUpperCase()}`;

  const handleCheckout = async () => {
    if (cart.length === 0) { toast.error("Cart is empty"); return; }
    if (paymentMethod === "cash" && cashReceived < total) { toast.error("Insufficient cash"); return; }

    setProcessing(true);
    const receiptNumber = generateReceiptNo();

    const { error } = await supabase.from("pos_transactions").insert({
      cashier_id: user?.id || "",
      items: cart.map((c) => ({ id: c.product.id, name: c.product.name, price: c.product.price, quantity: c.quantity, discount: c.discount })),
      subtotal,
      discount: discountAmount,
      total,
      cash_received: cashReceived,
      change_amount: change,
      payment_method: paymentMethod,
      receipt_number: receiptNumber,
      customer_name: customerName,
    });

    if (error) { toast.error("Transaction failed"); setProcessing(false); return; }

    await supabase.from("orders").insert({
      customer_name: customerName,
      items: cart.map((c) => ({ id: c.product.id, name: c.product.name, price: c.product.price, quantity: c.quantity })),
      total,
      subtotal,
      discount: discountAmount,
      status: "completed",
      payment_method: paymentMethod,
      order_type: "pos",
    });

    for (const item of cart) {
      const newStock = Math.max(0, item.product.stock_quantity - item.quantity);
      await supabase.from("products").update({ stock_quantity: newStock, sold_count: item.product.stock_quantity + item.quantity, in_stock: newStock > 0 }).eq("id", item.product.id);
      await supabase.from("inventory_logs").insert({
        product_id: item.product.id,
        change_type: "sold",
        quantity_change: -item.quantity,
        quantity_before: item.product.stock_quantity,
        quantity_after: newStock,
        notes: `POS Sale: ${receiptNumber}`,
      });
    }

    setLastReceipt({
      items: [...cart],
      subtotal,
      discount: discountAmount,
      vat_amount: vatAmount,
      vat_rate: receiptSettings.vat_rate,
      total,
      cash_received: cashReceived,
      change,
      payment_method: paymentMethod,
      receipt_number: receiptNumber,
      customer_name: customerName,
      date: new Date().toLocaleString(),
      // Snapshot of receipt settings at time of sale
      company_name: receiptSettings.company_name,
      address: receiptSettings.address,
      tin_no: receiptSettings.tin_no,
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

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.barcode?.includes(search) ||
    p.sku?.toLowerCase().includes(search.toLowerCase())
  );

  // Shown in cart summary (before VAT)
  const cartTotal = Math.max(0, subtotal - discountAmount);

  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl uppercase tracking-wider text-foreground">Point of Sale</h1>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Products */}
        <div className="lg:col-span-2 space-y-3">
          <div className="relative">
            <Barcode size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input ref={barcodeRef} placeholder="Scan barcode or search..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={handleBarcodeScan} className="pl-10" />
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2">
            {filteredProducts.map((p) => (
              <button key={p.id} onClick={() => addToCart(p)} className="bg-card border border-border/50 rounded-lg p-3 text-left hover:border-primary/50 hover:shadow-md transition-all group">
                {p.image_url && <img src={p.image_url} alt={p.name} className="w-full h-20 object-cover rounded mb-2 group-hover:scale-105 transition-transform" />}
                <p className="font-medium text-xs text-foreground truncate">{p.name}</p>
                <div className="flex justify-between items-center mt-1">
                  <p className="font-heading text-primary text-sm">₱{Number(p.price).toLocaleString()}</p>
                  <span className="text-[10px] text-muted-foreground">Stock: {p.stock_quantity}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Cart */}
        <Card className="h-fit sticky top-4">
          <CardHeader className="pb-2">
            <CardTitle className="font-heading text-base uppercase tracking-wider flex items-center gap-2">
              <ShoppingCart size={16} /> Cart ({cart.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {cart.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No items</p>
            ) : (
              <div className="space-y-2 max-h-[250px] overflow-y-auto">
                {cart.map((item) => (
                  <div key={item.product.id} className="flex items-center gap-2 bg-muted/50 rounded-lg p-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{item.product.name}</p>
                      <p className="text-[10px] text-muted-foreground">₱{Number(item.product.price).toLocaleString()} × {item.quantity}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateQty(item.product.id, -1)}><Minus size={10} /></Button>
                      <span className="text-xs w-5 text-center font-medium">{item.quantity}</span>
                      <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateQty(item.product.id, 1)}><Plus size={10} /></Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeFromCart(item.product.id)}><Trash2 size={10} /></Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t border-border pt-3 space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Subtotal</span><span>₱{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Discount:</span>
                <Input type="number" className="h-7 text-xs" value={discountAmount || ""} onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)} placeholder="0" />
              </div>
              {receiptSettings.vat_rate > 0 && (
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>VAT ({receiptSettings.vat_rate}%)</span>
                  <span>₱{vatAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-heading text-lg">
                <span className="text-foreground">Total</span>
                <span className="text-primary">₱{total.toFixed(2)}</span>
              </div>

              <Input placeholder="Customer name" className="h-8 text-sm" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />

              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="h-8 text-xs"><CreditCard size={12} className="mr-1" /><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="gcash">GCash</SelectItem>
                </SelectContent>
              </Select>

              {paymentMethod === "cash" && (
                <div className="space-y-1">
                  <Input type="number" placeholder="Cash received" className="h-8 text-sm" value={cashReceived || ""} onChange={(e) => setCashReceived(parseFloat(e.target.value) || 0)} />
                  {cashReceived > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Change</span>
                      <span className="font-heading text-green-600">₱{change.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              )}

              <Button onClick={handleCheckout} disabled={cart.length === 0 || processing} className="w-full bg-primary text-primary-foreground font-heading uppercase tracking-wider">
                {processing ? "Processing..." : `Checkout ₱${total.toFixed(2)}`}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Receipt Dialog ── */}
      <Dialog open={receiptDialog} onOpenChange={setReceiptDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading uppercase tracking-wider text-center sr-only">Receipt</DialogTitle>
          </DialogHeader>
          {lastReceipt && (
            <div
              id="printable-receipt"
              className="font-mono text-xs text-foreground space-y-3"
              style={{ maxWidth: 280, margin: "0 auto" }}
            >
              {/* ── Header ── */}
              <div className="text-center space-y-0.5 pb-3 border-b border-dashed border-border">
                {lastReceipt.logo_url && (
                  <img
                    src={lastReceipt.logo_url}
                    alt="Logo"
                    className="h-14 object-contain mx-auto mb-2"
                  />
                )}
                <p className="font-bold text-sm">{lastReceipt.company_name}</p>
                {lastReceipt.tin_no && (
                  <p className="text-[10px] text-muted-foreground">TIN: {lastReceipt.tin_no}</p>
                )}
                {lastReceipt.address && (
                  <p className="text-[10px] text-muted-foreground">{lastReceipt.address}</p>
                )}
                <p className="text-[10px] text-muted-foreground">{lastReceipt.date}</p>
                <p className="text-[10px] text-muted-foreground">Receipt#: {lastReceipt.receipt_number}</p>
                {lastReceipt.customer_name && lastReceipt.customer_name !== "Walk-in Customer" && (
                  <p className="text-[10px] text-muted-foreground">Customer: {lastReceipt.customer_name}</p>
                )}
              </div>

              {/* ── Title ── */}
              <p className="text-center font-bold tracking-widest uppercase text-xs">
                Official Receipt
              </p>

              {/* ── Column Headers ── */}
              <div className="flex justify-between text-[10px] font-bold border-b border-border pb-1">
                <span className="flex-1">Item</span>
                <span className="w-8 text-center">Qty</span>
                <span className="w-20 text-right">Amount</span>
              </div>

              {/* ── Items ── */}
              <div className="space-y-0.5">
                {lastReceipt.items.map((item: CartItem, i: number) => (
                  <div key={i} className="flex justify-between text-[10px]">
                    <span className="flex-1 truncate pr-1">{item.product.name}</span>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <span className="w-20 text-right">
                      ₱{(item.product.price * item.quantity).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
              </div>

              {/* ── Totals ── */}
              <div className="border-t border-dashed border-border pt-2 space-y-0.5">
                <div className="flex justify-between text-[10px]">
                  <span>Subtotal</span>
                  <span>₱{lastReceipt.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                {lastReceipt.discount > 0 && (
                  <div className="flex justify-between text-[10px]">
                    <span>Discount</span>
                    <span>-₱{lastReceipt.discount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                {lastReceipt.vat_rate > 0 && (
                  <div className="flex justify-between text-[10px]">
                    <span>VAT ({lastReceipt.vat_rate}%)</span>
                    <span>₱{lastReceipt.vat_amount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-xs pt-1 border-t border-border mt-1">
                  <span>Total</span>
                  <span>₱{lastReceipt.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span>Paid ({lastReceipt.payment_method})</span>
                  <span>₱{lastReceipt.cash_received.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                {lastReceipt.change > 0 && (
                  <div className="flex justify-between text-[10px]">
                    <span>Change</span>
                    <span>₱{lastReceipt.change.toFixed(2)}</span>
                  </div>
                )}
              </div>

              <p className="text-center text-[10px] text-muted-foreground pt-1">
                Thank you for your purchase!
              </p>

              <Button
                variant="outline"
                className="w-full mt-2"
                onClick={() => window.print()}
              >
                <Receipt size={14} className="mr-2" /> Print Receipt
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Print styles */}
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
