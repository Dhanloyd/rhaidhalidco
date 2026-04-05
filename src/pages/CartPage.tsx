import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Minus, Plus, Trash2, ShoppingCart } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

const CartPage = () => {
  const { items, totalPrice, totalItems, updateQuantity, removeFromCart, clearCart, loading } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);

  if (!user) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="text-center">
          <ShoppingCart size={48} className="mx-auto text-muted-foreground mb-4" />
          <h1 className="font-heading text-2xl uppercase text-foreground mb-2">Sign in to view cart</h1>
          <Link to="/signin"><Button className="bg-primary text-primary-foreground">Sign In</Button></Link>
        </div>
      </div>
    );
  }

  const handleCheckout = async () => {
    if (items.length === 0) return;
    setProcessing(true);
    const { error } = await supabase.from("orders").insert({
      user_id: user.id,
      customer_name: user.email || "Customer",
      customer_email: user.email,
      items: items.map((i) => ({ id: i.product_id, name: i.product?.name, price: i.product?.price, quantity: i.quantity })),
      total: totalPrice,
      status: "pending",
      payment_method: "online",
      order_type: "online",
    });
    setProcessing(false);
    if (error) { toast.error("Checkout failed"); return; }
    await clearCart();
    toast.success("Order placed successfully!");
    navigate("/my-orders");
  };

  return (
    <div className="pt-24 pb-16 px-4">
      <div className="container mx-auto max-w-3xl">
        <h1 className="font-heading text-3xl uppercase tracking-wider text-foreground mb-8">Shopping Cart ({totalItems})</h1>

        {loading ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
        ) : items.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingCart size={48} className="mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">Your cart is empty</p>
            <Link to="/shop"><Button className="bg-primary text-primary-foreground">Browse Shop</Button></Link>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="bg-card rounded-xl border border-border/50 p-4 flex items-center gap-4">
                {item.product?.image_url && (
                  <img src={item.product.image_url} alt={item.product.name} className="w-20 h-20 object-cover rounded-lg" />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-heading text-foreground truncate">{item.product?.name}</h3>
                  <p className="text-sm text-primary font-heading">₱{(item.product?.price || 0).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.product_id, item.quantity - 1)}>
                    <Minus size={14} />
                  </Button>
                  <span className="w-8 text-center font-medium text-foreground">{item.quantity}</span>
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.product_id, item.quantity + 1)}>
                    <Plus size={14} />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeFromCart(item.product_id)}>
                    <Trash2 size={14} />
                  </Button>
                </div>
                <p className="font-heading text-foreground w-24 text-right">₱{((item.product?.price || 0) * item.quantity).toLocaleString()}</p>
              </div>
            ))}

            <div className="bg-card rounded-xl border border-border/50 p-6 mt-6">
              <div className="flex justify-between items-center mb-4">
                <span className="font-heading text-lg text-foreground">Total</span>
                <span className="font-heading text-2xl text-primary">₱{totalPrice.toLocaleString()}</span>
              </div>
              <Link to="/checkout">
                <Button className="w-full bg-primary text-primary-foreground hover:bg-primary-light font-heading uppercase tracking-wider">
                  Proceed to Checkout
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;
