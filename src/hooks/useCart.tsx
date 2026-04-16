import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

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
    available_sizes?: string[];           // simple list e.g. ["S","M","L"]
    size_inventory?: SizeStock[];         // per-size stock e.g. [{size:"S",stock:3}]
    out_of_stock_sizes?: string[];        // derived: sizes with stock=0
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
  updateQuantity: (productId: string, quantity: number, variants?: VariantOptions) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// ─── Provider ────────────────────────────────────────────────────────────────

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

    // Fetch cart items including new variant columns and expanded product fields
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

      // Derive out_of_stock_sizes from size_inventory
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
          ? {
              ...prod,
              out_of_stock_sizes: outOfStockSizes,
            }
          : undefined,
      };
    });

    setItems(mapped);
    setLoading(false);
  };

  // ── addToCart ──────────────────────────────────────────────────────────────
  const addToCart = async (
    productId: string,
    quantity = 1,
    variants?: VariantOptions
  ) => {
    if (!user) {
      toast.error("Please sign in to add items to cart");
      return;
    }

    // If same product AND same size already in cart → bump quantity
    const existing = items.find(
      (i) =>
        i.product_id === productId &&
        (variants?.selected_size
          ? i.selected_size === variants.selected_size
          : true)
    );

    if (existing) {
      await updateQuantity(productId, existing.quantity + quantity, variants);
      return;
    }

    const payload: any = {
      user_id: user.id,
      product_id: productId,
      quantity,
    };
    if (variants?.selected_size)  payload.selected_size  = variants.selected_size;
    if (variants?.selected_color) payload.selected_color = variants.selected_color;

    const { error } = await supabase.from("cart_items").insert(payload);
    if (error) toast.error("Failed to add to cart");
    else {
      toast.success("Added to cart!");
      fetchCart();
    }
  };

  // ── updateQuantity ─────────────────────────────────────────────────────────
  const updateQuantity = async (
    productId: string,
    quantity: number,
    variants?: VariantOptions
  ) => {
    if (!user) return;
    if (quantity <= 0) {
      await removeFromCart(productId);
      return;
    }

    const updatePayload: any = { quantity };
    if (variants?.selected_size  !== undefined) updatePayload.selected_size  = variants.selected_size;
    if (variants?.selected_color !== undefined) updatePayload.selected_color = variants.selected_color;

    const { error } = await supabase
      .from("cart_items")
      .update(updatePayload)
      .eq("user_id", user.id)
      .eq("product_id", productId);

    if (error) toast.error("Failed to update cart");
    else fetchCart();
  };

  // ── removeFromCart ─────────────────────────────────────────────────────────
  const removeFromCart = async (productId: string) => {
    if (!user) return;
    const { error } = await supabase
      .from("cart_items")
      .delete()
      .eq("user_id", user.id)
      .eq("product_id", productId);
    if (error) toast.error("Failed to remove item");
    else fetchCart();
  };

  // ── clearCart ──────────────────────────────────────────────────────────────
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
