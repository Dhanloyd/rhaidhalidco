import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface SizeStock {
  size: string;
  stock: number;
}

export interface ProductColor {
  name: string;
  hex: string;
}

export interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  selected_size?: string | null;
  selected_color?: string | null;
  product?: {
    id: string;
    name: string;
    brand?: string;
    price: number;
    discount_price?: number | null;
    image_url: string | null;
    category: string;
    colors?: ProductColor[];
    available_sizes?: string[];
    size_inventory?: SizeStock[];
    out_of_stock_sizes?: string[];
  };
}

interface VariantOptions {
  selected_size?: string;
  selected_color?: string;
}

interface CartContextType {
  items: CartItem[];
  loading: boolean;
  addToCart: (productId: string, quantity?: number, variants?: VariantOptions) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) fetchCart();
    else setItems([]);
  }, [user]);

  const fetchCart = async () => {
    if (!user) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("cart_items")
      .select(`
        id,
        product_id,
        quantity,
        selected_size,
        selected_color,
        products (
          id, name, brand, price, discount_price,
          image_url, category,
          colors, available_sizes, size_inventory
        )
      `)
      .eq("user_id", user.id);

    if (error) {
      console.error("fetchCart error:", error);
      setLoading(false);
      return;
    }

    const mapped: CartItem[] = (data || []).map((item: any) => {
      const prod = item.products;
      const sizeInventory: SizeStock[] = prod?.size_inventory ?? [];
      const outOfStockSizes = sizeInventory
        .filter((s) => s.stock <= 0)
        .map((s) => s.size);

      return {
        id: item.id,
        product_id: item.product_id,
        quantity: item.quantity,
        selected_size: item.selected_size ?? null,
        selected_color: item.selected_color ?? null,
        product: prod
          ? { ...prod, out_of_stock_sizes: outOfStockSizes }
          : undefined,
      };
    });

    setItems(mapped);
    setLoading(false);
  };

  const addToCart = async (
    productId: string,
    quantity = 1,
    variants?: VariantOptions
  ) => {
    if (!user) {
      toast.error("Please sign in to add items to cart");
      return;
    }

    const selectedSize = variants?.selected_size ?? null;
    const selectedColor = variants?.selected_color ?? null;

    // Use local state to check for existing item (avoids race condition)
    const existing = items.find(
      (i) =>
        i.product_id === productId &&
        (i.selected_size ?? null) === selectedSize &&
        (i.selected_color ?? null) === selectedColor
    );

    if (existing) {
      const { error } = await supabase
        .from("cart_items")
        .update({ quantity: existing.quantity + quantity })
        .eq("id", existing.id);

      if (error) {
        console.error("UPDATE ERROR:", error);
        toast.error("Failed to update cart");
      } else {
        toast.success("Cart updated!");
        await fetchCart();
      }
      return;
    }

    // New combination — insert a new row
    const payload: any = {
      user_id: user.id,
      product_id: productId,
      quantity,
    };

    if (selectedSize !== null) payload.selected_size = selectedSize;
    if (selectedColor !== null) payload.selected_color = selectedColor;

    const { error } = await supabase.from("cart_items").insert(payload);
    if (error) {
      console.error("INSERT ERROR:", error);
      toast.error("Failed to add to cart");
    } else {
      toast.success("Added to cart!");
      await fetchCart();
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (!user) return;
    if (quantity <= 0) {
      await removeFromCart(itemId);
      return;
    }

    const { error } = await supabase
      .from("cart_items")
      .update({ quantity })
      .eq("id", itemId);

    if (error) toast.error("Failed to update cart");
    else await fetchCart();
  };

  const removeFromCart = async (itemId: string) => {
    if (!user) return;
    const { error } = await supabase
      .from("cart_items")
      .delete()
      .eq("id", itemId);

    if (error) toast.error("Failed to remove item");
    else await fetchCart();
  };

  const clearCart = async () => {
    if (!user) return;
    await supabase.from("cart_items").delete().eq("user_id", user.id);
    setItems([]);
  };

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce(
    (sum, i) => sum + (i.product?.price || 0) * i.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        loading,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
};