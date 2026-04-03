import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Minus, ShoppingCart, Trash2, CreditCard } from "lucide-react";

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  image_url: string | null;
  in_stock: boolean;
}

interface CartItem {
  product: Product;
  quantity: number;
}

const POSPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [search, setSearch] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    supabase.from("products").select("*").eq("in_stock", true).order("name").then(({ data }) => setProducts(data || []));
  }, []);

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.product.id === product.id);
      if (existing) return prev.map((c) => c.product.id === product.id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) => prev.map((c) => c.product.id === id ? { ...c, quantity: Math.max(0, c.quantity + delta) } : c).filter((c) => c.quantity > 0));
  };

  const removeFromCart = (id: string) => setCart((prev) => prev.filter((c) => c.product.id !== id));

  const total = cart.reduce((sum, c) => sum + c.product.price * c.quantity, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) { toast.error("Cart is empty"); return; }
    if (!customerName.trim()) { toast.error("Enter customer name"); return; }

    setProcessing(true);
    const { error } = await supabase.from("orders").insert({
      customer_name: customerName,
      items: cart.map((c) => ({ id: c.product.id, name: c.product.name, price: c.product.price, quantity: c.quantity })),
      total,
      status: "completed",
      payment_method: paymentMethod,
      order_type: "pos",
    });
    setProcessing(false);

    if (error) {
      toast.error("Failed to process order");
    } else {
      toast.success(`Order completed! Total: ₱${total.toLocaleString()}`);
      setCart([]);
      setCustomerName("");
    }
  };

  const filteredProducts = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl uppercase tracking-wider text-foreground">Point of Sale</h1>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Products */}
        <div className="lg:col-span-2 space-y-4">
          <Input placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
            {filteredProducts.map((p) => (
              <button
                key={p.id}
                onClick={() => addToCart(p)}
                className="bg-card border border-border/50 rounded-xl p-4 text-left hover:border-primary/50 hover:shadow-md transition-all group"
              >
                {p.image_url && <img src={p.image_url} alt={p.name} className="w-full h-24 object-cover rounded-lg mb-3 group-hover:scale-105 transition-transform" />}
                <p className="font-medium text-sm text-foreground truncate">{p.name}</p>
                <p className="font-heading text-primary text-sm">₱{Number(p.price).toLocaleString()}</p>
              </button>
            ))}
          </div>
          {filteredProducts.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">No products found</div>
          )}
        </div>

        {/* Cart */}
        <Card className="h-fit sticky top-6">
          <CardHeader>
            <CardTitle className="font-heading text-lg uppercase tracking-wider flex items-center gap-2">
              <ShoppingCart size={18} /> Cart ({cart.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {cart.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No items in cart</p>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {cart.map((item) => (
                  <div key={item.product.id} className="flex items-center gap-3 bg-muted/50 rounded-lg p-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{item.product.name}</p>
                      <p className="text-xs text-muted-foreground">₱{Number(item.product.price).toLocaleString()} × {item.quantity}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQty(item.product.id, -1)}><Minus size={12} /></Button>
                      <span className="text-sm w-6 text-center font-medium">{item.quantity}</span>
                      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQty(item.product.id, 1)}><Plus size={12} /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeFromCart(item.product.id)}><Trash2 size={12} /></Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t border-border pt-4 space-y-3">
              <div className="flex justify-between font-heading text-lg">
                <span className="text-foreground">Total</span>
                <span className="text-primary">₱{total.toLocaleString()}</span>
              </div>
              <Input placeholder="Customer name *" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <CreditCard size={14} className="mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="gcash">GCash</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={handleCheckout}
                disabled={cart.length === 0 || processing}
                className="w-full bg-primary text-primary-foreground hover:bg-primary-light font-heading uppercase tracking-wider"
              >
                {processing ? "Processing..." : `Checkout ₱${total.toLocaleString()}`}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default POSPage;
