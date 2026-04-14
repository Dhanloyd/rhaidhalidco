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
  id: string;
  name: string;
  price: number;
  category: string;
  image_url: string | null;
  barcode: string | null;
  sku: string | null;
  stock_quantity: number;
}

interface CartItem {
  product: Product;
  quantity: number;
  discount: number;
}

const POSPage = () => {
  const { user } = useAuth();

  // PRODUCTS + CART
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [processing, setProcessing] = useState(false);

  // CUSTOMER + PAYMENT
  const [customerName, setCustomerName] = useState("Walk-in Customer");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [cashReceived, setCashReceived] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);

  // RECEIPT MODAL
  const [receiptDialog, setReceiptDialog] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<any>(null);

  // =========================
  // BUSINESS SETTINGS (EDITABLE)
  // =========================
  const [companyName, setCompanyName] = useState("RaidKhalid & Co.");
  const [tinNo, setTinNo] = useState("000-000-000-000");
  const [companyAddress, setCompanyAddress] = useState("Davao City, Philippines");
  const [vatRate, setVatRate] = useState(12);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  const barcodeRef = useRef<HTMLInputElement>(null);

  // LOAD PRODUCTS
  useEffect(() => {
    supabase
      .from("products")
      .select("id, name, price, category, image_url, barcode, sku, stock_quantity")
      .eq("in_stock", true)
      .order("name")
      .then(({ data }) => setProducts(data || []));
  }, []);

  // CART LOGIC
  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.product.id === product.id);

      if (existing) {
        if (existing.quantity >= product.stock_quantity) {
          toast.error("Stock limit reached");
          return prev;
        }
        return prev.map((c) =>
          c.product.id === product.id
            ? { ...c, quantity: c.quantity + 1 }
            : c
        );
      }

      if (product.stock_quantity <= 0) {
        toast.error("Out of stock");
        return prev;
      }

      return [...prev, { product, quantity: 1, discount: 0 }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => {
          if (c.product.id !== id) return c;
          const newQty = c.quantity + delta;

          if (newQty > c.product.stock_quantity) {
            toast.error("Stock limit");
            return c;
          }

          return { ...c, quantity: Math.max(0, newQty) };
        })
        .filter((c) => c.quantity > 0)
    );
  };

  const removeFromCart = (id: string) =>
    setCart((prev) => prev.filter((c) => c.product.id !== id));

  const handleBarcodeScan = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const code = (e.target as HTMLInputElement).value.trim();
      const product = products.find(
        (p) => p.barcode === code || p.sku === code
      );

      if (product) {
        addToCart(product);
        toast.success(`Added: ${product.name}`);
      } else {
        toast.error("Product not found");
      }

      setSearch("");
    }
  };

  // =========================
  // CALCULATIONS
  // =========================
  const subtotal = cart.reduce(
    (s, c) => s + c.product.price * c.quantity,
    0
  );

  const vatAmount = (subtotal - discountAmount) * (vatRate / 100);
  const total = subtotal - discountAmount;

  const change = Math.max(0, cashReceived - total);

  const generateReceiptNo = () =>
    `POS-${Date.now().toString(36).toUpperCase()}`;

  // =========================
  // CHECKOUT
  // =========================
  const handleCheckout = async () => {
    if (cart.length === 0) return toast.error("Cart is empty");
    if (paymentMethod === "cash" && cashReceived < total)
      return toast.error("Insufficient cash");

    setProcessing(true);

    const receiptNumber = generateReceiptNo();

    const { error } = await supabase.from("pos_transactions").insert({
      cashier_id: user?.id || "",
      items: cart.map((c) => ({
        id: c.product.id,
        name: c.product.name,
        price: c.product.price,
        quantity: c.quantity,
        discount: c.discount,
      })),
      subtotal,
      discount: discountAmount,
      vat: vatAmount,
      vat_rate: vatRate,
      total,
      cash_received: cashReceived,
      change_amount: change,
      payment_method: paymentMethod,
      receipt_number: receiptNumber,
      customer_name: customerName,
    });

    if (error) {
      toast.error("Transaction failed");
      setProcessing(false);
      return;
    }

    // STOCK UPDATE
    for (const item of cart) {
      const newStock = item.product.stock_quantity - item.quantity;

      await supabase
        .from("products")
        .update({
          stock_quantity: newStock,
          sold_count: item.product.stock_quantity + item.quantity,
          in_stock: newStock > 0,
        })
        .eq("id", item.product.id);
    }

    // RECEIPT DATA
    setLastReceipt({
      items: [...cart],
      subtotal,
      discount: discountAmount,
      vatAmount,
      vatRate,
      total,
      cash_received: cashReceived,
      change,
      payment_method: paymentMethod,
      receipt_number: receiptNumber,
      customer_name: customerName,
      date: new Date().toLocaleString(),

      // business info
      companyName,
      tinNo,
      companyAddress,
      logoUrl,
    });

    setReceiptDialog(true);

    // RESET
    setCart([]);
    setCashReceived(0);
    setDiscountAmount(0);
    setProcessing(false);
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.barcode?.includes(search) ||
      p.sku?.toLowerCase().includes(search.toLowerCase())
  );

  // =========================
  // UI
  // =========================
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Point of Sale</h1>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* PRODUCTS */}
        <div className="lg:col-span-2 space-y-3">
          <Input
            placeholder="Scan barcode or search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleBarcodeScan}
          />

          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {filteredProducts.map((p) => (
              <button
                key={p.id}
                onClick={() => addToCart(p)}
                className="border p-2 rounded"
              >
                <p className="text-sm font-medium">{p.name}</p>
                <p>₱{p.price}</p>
                <p className="text-xs text-gray-500">
                  Stock: {p.stock_quantity}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* CART */}
        <Card>
          <CardHeader>
            <CardTitle>Cart</CardTitle>
          </CardHeader>

          <CardContent className="space-y-2">
            {cart.map((item) => (
              <div key={item.product.id} className="flex justify-between">
                <span>
                  {item.product.name} x {item.quantity}
                </span>

                <div className="flex gap-1">
                  <Button size="sm" onClick={() => updateQty(item.product.id, -1)}>
                    -
                  </Button>
                  <Button size="sm" onClick={() => updateQty(item.product.id, 1)}>
                    +
                  </Button>
                  <Button size="sm" onClick={() => removeFromCart(item.product.id)}>
                    x
                  </Button>
                </div>
              </div>
            ))}

            <hr />

            <div>Subtotal: ₱{subtotal}</div>
            <div>VAT ({vatRate}%): ₱{vatAmount.toFixed(2)}</div>

            <Input
              placeholder="Discount"
              type="number"
              value={discountAmount}
              onChange={(e) =>
                setDiscountAmount(parseFloat(e.target.value) || 0)
              }
            />

            <div className="font-bold text-lg">Total: ₱{total}</div>

            <Input
              placeholder="Customer Name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />

            {paymentMethod === "cash" && (
              <Input
                placeholder="Cash received"
                type="number"
                value={cashReceived}
                onChange={(e) =>
                  setCashReceived(parseFloat(e.target.value) || 0)
                }
              />
            )}

            <Button onClick={handleCheckout} disabled={processing}>
              Checkout
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* RECEIPT */}
      <Dialog open={receiptDialog} onOpenChange={setReceiptDialog}>
        <DialogContent>
          {lastReceipt && (
            <div className="text-center font-mono text-sm">
              {lastReceipt.logoUrl && (
                <img src={lastReceipt.logoUrl} className="h-10 mx-auto" />
              )}

              <h2>{lastReceipt.companyName}</h2>
              <p>{lastReceipt.companyAddress}</p>
              <p>TIN: {lastReceipt.tinNo}</p>

              <hr />

              <p>OR: {lastReceipt.receipt_number}</p>
              <p>{lastReceipt.date}</p>

              <hr />

              {lastReceipt.items.map((item: any, i: number) => (
                <div key={i} className="flex justify-between">
                  <span>
                    {item.product.name} x{item.quantity}
                  </span>
                  <span>₱{item.product.price * item.quantity}</span>
                </div>
              ))}

              <hr />

              <p>Subtotal: ₱{lastReceipt.subtotal}</p>
              <p>VAT: ₱{lastReceipt.vatAmount}</p>
              <p>Discount: ₱{lastReceipt.discount}</p>

              <p className="font-bold">
                Total: ₱{lastReceipt.total}
              </p>

              <p>Change: ₱{lastReceipt.change}</p>

              <Button onClick={() => window.print()} className="mt-2 w-full">
                Print
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default POSPage;