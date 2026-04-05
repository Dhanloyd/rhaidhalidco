import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { Heart, ShoppingCart, Trash2 } from "lucide-react";

const WishlistPage = () => {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (user) fetchWishlist(); }, [user]);

  const fetchWishlist = async () => {
    const { data } = await supabase.from("wishlist").select("*, products(*)").eq("user_id", user!.id);
    setItems(data || []);
    setLoading(false);
  };

  const removeItem = async (id: string) => {
    await supabase.from("wishlist").delete().eq("id", id);
    toast.success("Removed from wishlist");
    fetchWishlist();
  };

  const moveToCart = async (item: any) => {
    await addToCart(item.product_id);
    await supabase.from("wishlist").delete().eq("id", item.id);
    fetchWishlist();
  };

  if (!user) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="text-center">
          <Heart size={48} className="mx-auto text-muted-foreground mb-4" />
          <h1 className="font-heading text-2xl uppercase text-foreground mb-2">Sign in to view wishlist</h1>
          <Link to="/signin"><Button className="bg-primary text-primary-foreground">Sign In</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-16 px-4">
      <div className="container mx-auto max-w-4xl">
        <h1 className="font-heading text-3xl uppercase tracking-wider text-foreground mb-8">My Wishlist</h1>
        {loading ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
        ) : items.length === 0 ? (
          <div className="text-center py-16">
            <Heart size={48} className="mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">Your wishlist is empty</p>
            <Link to="/shop"><Button className="bg-primary text-primary-foreground">Browse Shop</Button></Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <div key={item.id} className="bg-card rounded-xl border border-border/50 overflow-hidden hover-lift">
                {item.products?.image_url && (
                  <img src={item.products.image_url} alt={item.products.name} className="w-full h-48 object-cover" />
                )}
                <div className="p-4">
                  <h3 className="font-heading text-lg uppercase text-foreground mb-1">{item.products?.name}</h3>
                  <p className="font-heading text-primary mb-3">₱{Number(item.products?.price || 0).toLocaleString()}</p>
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1 gap-1 bg-primary text-primary-foreground" onClick={() => moveToCart(item)}>
                      <ShoppingCart size={14} /> Add to Cart
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => removeItem(item.id)}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WishlistPage;
