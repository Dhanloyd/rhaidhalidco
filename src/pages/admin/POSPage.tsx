import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Minus, ShoppingCart, Trash2, CreditCard, Receipt, Barcode, Building2 } from "lucide-react";

interface Product {
  id: string; name: string; price: number; category: string; image_url: string | null; barcode: string | null; sku: string | null; stock_quantity: number;
}
interface CartItem { product: Product; quantity: number; discount: number; }

const DEFAULT_COMPANY = {
  name: "RaidKhalid & Co.",
  tin: "000-000-000-000",
  address: "123 Main Street, City, Province",
  vatRate: 12,
};

const POSPage = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("Walk-in Customer");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [cashReceived, setCashReceived] = useState(0);
  const [search, setSearch] = useState("");
  const [processing, setProcessing] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);
  const barcodeRef = useRef<HTMLInputElement>(null);

  // Checkout preview modal
  const [checkoutDialog, setCheckoutDialog] = useState(false);
  const [companyName, setCompanyName] = useState(DEFAULT_COMPANY.name);
  const [tinNo, setTinNo] = useState(DEFAULT_COMPANY.tin);
  const [address, setAddress] = useState(DEFAULT_COMPANY.address);
  const [vatRate, setVatRate] = useState(DEFAULT_COMPANY.vatRate);

  // Final receipt modal
  const [receiptDialog, setReceiptDialog] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<any>(null);

  useEffect(() => {
    supabase.from("products").select("id, name, price, category, image_url, barcode, sku, stock_quantity").eq("in_stock", true).order("name").then(({ data }) => setProducts(data || []));
  }, []);

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
  // VAT-inclusive calculation: vatAmount = total * vatRate / (100 + vatRate)
  const vatAmount = discountedSubtotal * (vatRate / (100 + vatRate));
  const total = discountedSubtotal;
  const change = Math.max(0, cashReceived - total);

  const generateReceiptNo = () => `OR-${Date.now().toString(36).toUpperCase()}`;

  // Open checkout preview
  const handleOpenCheckout = () => {
    if (cart.length === 0) { toast.error("Cart is empty"); return; }
    setCheckoutDialog(true);
  };

  // Proceed from checkout preview → process transaction
  const handleProceed = async () => {
    if (paymentMethod === "cash" && cashReceived < total) { toast.error("Insufficient cash"); return; }

    setProcessing(true);
    const receiptNumber = generateReceiptNo();
    const now = new Date();

    const { error } = await supabase.from("pos_transactions").insert({
      cashier_id: user?.id || "",
      items: cart.map((c) => ({ id: c.product.id, name: c.product.name, price: c.product.price, quantity: c.quantity, discount: c.discount })),
      subtotal,
      discount: discountAmount,
      vat_rate: vatRate,
      vat_amount: vatAmount,
      total,
      cash_received: cashReceived,
      change_amount: change,
      payment_method: paymentMethod,
      receipt_number: receiptNumber,
      customer_name: customerName,
      company_name: companyName,
      tin_number: tinNo,
      company_address: address,
    });

    if (error) { toast.error("Transaction failed"); setProcessing(false); return; }

    await supabase.from("orders").insert({
      customer_name: customerName,
      items: cart.map((c) => ({ id: c.product.id, name: c.product.name, price: c.product.price, quantity: c.quantity })),
      total, subtotal, discount: discountAmount,
      status: "completed", payment_method: paymentMethod, order_type: "pos",
    });

    for (const item of cart) {
      const newStock = Math.max(0, item.product.stock_quantity - item.quantity);
      await supabase.from("products").update({ stock_quantity: newStock, sold_count: item.product.stock_quantity + item.quantity, in_stock: newStock > 0 }).eq("id", item.product.id);
      await supabase.from("inventory_logs").insert({
        product_id: item.product.id, change_type: "sold",
        quantity_change: -item.quantity, quantity_before: item.product.stock_quantity, quantity_after: newStock,
        notes: `POS Sale: ${receiptNumber}`,
      });
    }

    setLastReceipt({
      items: [...cart], subtotal, discount: discountAmount,
      vatRate, vatAmount, total,
      cash_received: cashReceived, change,
      payment_method: paymentMethod, receipt_number: receiptNumber,
      customer_name: customerName,
      date: now.toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" }),
      time: now.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      companyName, tinNo, address,
    });

    setCheckoutDialog(false);
    setReceiptDialog(true);
    setCart([]);
    setCustomerName("Walk-in Customer");
    setCashReceived(0);
    setDiscountAmount(0);
    setProcessing(false);

    const { data } = await supabase.from("products").select("id, name, price, category, image_url, barcode, sku, stock_quantity").eq("in_stock", true).order("name");
    setProducts(data || []);
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) || p.barcode?.includes(search) || p.sku?.toLowerCase().includes(search.toLowerCase())
  );

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
              <div className="flex justify-between font-heading text-lg">
                <span className="text-foreground">Total</span>
                <span className="text-primary">₱{total.toLocaleString()}</span>
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

              <Button
                onClick={handleOpenCheckout}
                disabled={cart.length === 0}
                className="w-full bg-primary text-primary-foreground font-heading uppercase tracking-wider"
              >
                Checkout ₱{total.toLocaleString()}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Checkout Preview Dialog ── */}
      <Dialog open={checkoutDialog} onOpenChange={setCheckoutDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading uppercase tracking-wider text-center flex items-center justify-center gap-2">
              <Building2 size={16} /> Checkout Preview
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 font-mono text-sm">
            {/* Editable company info */}
            <div className="bg-muted/40 rounded-lg p-3 space-y-2">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-sans mb-1">Company Details (Editable)</p>
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground font-sans uppercase tracking-wider">Company Name</label>
                <Input className="h-8 text-sm font-mono" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground font-sans uppercase tracking-wider">TIN No.</label>
                <Input className="h-8 text-sm font-mono" value={tinNo} onChange={(e) => setTinNo(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground font-sans uppercase tracking-wider">Address</label>
                <Input className="h-8 text-sm font-mono" value={address} onChange={(e) => setAddress(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground font-sans uppercase tracking-wider">VAT Rate (%)</label>
                <Input type="number" className="h-8 text-sm font-mono" value={vatRate} onChange={(e) => setVatRate(parseFloat(e.target.value) || 0)} />
              </div>
            </div>

            {/* Receipt preview */}
            <div className="border border-dashed border-border rounded-lg p-4 space-y-3 bg-white text-black dark:bg-zinc-900 dark:text-white">
              {/* Header */}
              <div className="text-center space-y-0.5">
                <div className="flex justify-center mb-1">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Building2 size={20} className="text-primary" />
                  </div>
                </div>
                <p className="font-bold text-base tracking-wide">{companyName}</p>
                <p className="text-[11px] text-muted-foreground">TIN: {tinNo}</p>
                <p className="text-[11px] text-muted-foreground">{address}</p>
                <p className="text-[11px] text-muted-foreground">{new Date().toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })} · {new Date().toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })}</p>
              </div>

              <div className="border-t border-dashed border-border/60" />
              <p className="text-center font-bold text-sm uppercase tracking-widest">Official Receipt</p>
              <div className="border-t border-dashed border-border/60" />

              {/* Items */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-muted-foreground uppercase tracking-wider font-sans">
                  <span className="flex-1">Item</span>
                  <span className="w-8 text-center">Qty</span>
                  <span className="w-20 text-right">Amount</span>
                </div>
                <div className="border-t border-border/40" />
                {cart.map((item) => (
                  <div key={item.product.id} className="flex justify-between text-xs">
                    <span className="flex-1 truncate pr-2">{item.product.name}</span>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <span className="w-20 text-right">₱{(item.product.price * item.quantity).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed border-border/60" />

              {/* Totals */}
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>₱{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Discount</span>
                    <span>-₱{discountAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">VAT ({vatRate}%)</span>
                  <span>₱{vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="border-t border-border/40 pt-1 flex justify-between font-bold text-sm">
                  <span>TOTAL</span>
                  <span>₱{total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                {paymentMethod === "cash" && (
                  <>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Cash Received</span>
                      <span>₱{cashReceived.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Change</span>
                      <span>₱{change.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  </>
                )}
              </div>

              <div className="border-t border-dashed border-border/60" />
              <p className="text-center text-[10px] text-muted-foreground">Customer: {customerName}</p>
              <p className="text-center text-[10px] text-muted-foreground">Payment: {paymentMethod.toUpperCase()}</p>
            </div>

            <Button
              onClick={handleProceed}
              disabled={processing || (paymentMethod === "cash" && cashReceived < total)}
              className="w-full bg-primary text-primary-foreground font-heading uppercase tracking-wider"
            >
              {processing ? "Processing..." : "Proceed & Confirm"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Final Receipt Dialog ── */}
      <Dialog open={receiptDialog} onOpenChange={setReceiptDialog}>
        <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading uppercase tracking-wider text-center">Official Receipt</DialogTitle>
          </DialogHeader>

          {lastReceipt && (
            <div className="font-mono text-sm space-y-3" id="print-receipt">
              {/* Header */}
              <div className="text-center space-y-0.5">
                <div className="flex justify-center mb-1">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Building2 size={20} className="text-primary" />
                  </div>
                </div>
                <p className="font-bold text-base tracking-wide">{lastReceipt.companyName}</p>
                <p className="text-[11px] text-muted-foreground">TIN: {lastReceipt.tinNo}</p>
                <p className="text-[11px] text-muted-foreground">{lastReceipt.address}</p>
                <p className="text-[11px] text-muted-foreground">{lastReceipt.date}</p>
                <p className="text-[11px] text-muted-foreground">{lastReceipt.time}</p>
              </div>

              <div className="border-t border-dashed border-border" />
              <p className="text-center font-bold text-sm uppercase tracking-widest">Official Receipt</p>
              <p className="text-center text-[10px] text-muted-foreground">{lastReceipt.receipt_number}</p>
              <div className="border-t border-dashed border-border" />

              {/* Items */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-muted-foreground uppercase tracking-wider">
                  <span className="flex-1">Item</span>
                  <span className="w-8 text-center">Qty</span>
                  <span className="w-20 text-right">Amount</span>
                </div>
                <div className="border-t border-border/40" />
                {lastReceipt.items.map((item: any, i: number) => (
                  <div key={i} className="flex justify-between text-xs">
                    <span className="flex-1 truncate pr-2">{item.product.name}</span>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <span className="w-20 text-right">₱{(item.product.price * item.quantity).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed border-border" />

              {/* Totals */}
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>₱{lastReceipt.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                {lastReceipt.discount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Discount</span>
                    <span>-₱{lastReceipt.discount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">VAT ({lastReceipt.vatRate}%)</span>
                  <span>₱{lastReceipt.vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="border-t border-border/40 pt-1 flex justify-between font-bold text-sm">
                  <span>TOTAL</span>
                  <span>₱{lastReceipt.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Paid ({lastReceipt.payment_method.toUpperCase()})</span>
                  <span>₱{lastReceipt.cash_received.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                {lastReceipt.change > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Change</span>
                    <span>₱{lastReceipt.change.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
              </div>

              <div className="border-t border-dashed border-border" />
              <p className="text-center text-[10px] text-muted-foreground">Customer: {lastReceipt.customer_name}</p>
              <p className="text-center text-xs text-muted-foreground pt-1">Thank you for your purchase!</p>
              <p className="text-center text-[10px] text-muted-foreground">This serves as your official receipt.</p>

              <Button variant="outline" className="w-full mt-2" onClick={() => window.print()}>
                <Receipt size={14} className="mr-2" /> Print Receipt
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default POSPage;
