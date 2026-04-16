import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Minus, Plus, Trash2, ShoppingCart, ChevronRight,
  Tag, Truck, Shield, RotateCcw, Heart, Ruler,
  Lock, AlertTriangle, CheckCircle2, Package,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState, useCallback, useEffect } from "react";
import type { CartItem, SizeStock, ProductColor } from "@/hooks/useCart";

// ─── Promo codes ──────────────────────────────────────────────────────────────

const PROMO_CODES: Record<string, (subtotal: number) => number> = {
  SAVE10:    (sub) => Math.round(sub * 0.1),
  FREESHIP:  ()    => 100,
  WELCOME20: (sub) => Math.round(sub * 0.2),
};

// ─── Color swatches ───────────────────────────────────────────────────────────

const ColorSwatches = ({
  colors, selected, onSelect,
}: {
  colors: ProductColor[];
  selected?: string | null;
  onSelect: (name: string) => void;
}) => (
  <div className="flex items-center gap-1.5 flex-wrap">
    {colors.map((c) => (
      <button key={c.name} title={c.name} type="button" onClick={() => onSelect(c.name)}
        className={`w-[22px] h-[22px] rounded-full transition-all flex-shrink-0
          ${selected === c.name ? "ring-2 ring-offset-1 ring-foreground scale-110" : "hover:scale-105"}
          ${c.name.toLowerCase() === "white" ? "border border-border" : ""}`}
        style={{ background: c.hex }}
      />
    ))}
  </div>
);

// ─── Size pills with per-size stock ──────────────────────────────────────────

const SizePills = ({
  sizeInventory, outOfStock, selected, onSelect,
}: {
  sizeInventory: SizeStock[];     // full inventory with stock counts
  outOfStock: string[];           // sizes with 0 stock
  selected?: string | null;
  onSelect: (size: string) => void;
}) => {
  if (sizeInventory.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {sizeInventory.map(({ size, stock }) => {
        const oos = stock === 0 || outOfStock.includes(size);
        const lowStock = !oos && stock <= 5;
        const isSelected = selected === size;

        return (
          <button key={size} type="button" disabled={oos}
            title={oos ? "Out of stock" : `${stock} left`}
            onClick={() => !oos && onSelect(size)}
            className={`relative min-w-[36px] h-8 px-2 rounded-lg text-[11px] font-semibold border transition-all
              ${oos
                ? "opacity-40 line-through cursor-not-allowed border-border text-muted-foreground bg-muted"
                : isSelected
                  ? "border-foreground bg-foreground text-background shadow-sm"
                  : "border-border hover:border-foreground bg-background text-foreground hover:bg-muted/40"
              }`}
          >
            {size}
            {/* Low stock dot */}
            {lowStock && !isSelected && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 border border-background" />
            )}
            {/* Stock tooltip on hover via title — also show inline on selected */}
            {isSelected && !oos && (
              <span className="ml-1 text-[9px] opacity-60 font-normal">({stock})</span>
            )}
          </button>
        );
      })}
    </div>
  );
};

// ─── Cart Page ────────────────────────────────────────────────────────────────

const CartPage = () => {
  const { items, totalPrice, totalItems, updateQuantity, removeFromCart, clearCart, loading } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const cartItems = items as CartItem[];

  // Local variant state (mirrors DB, also used optimistically)
  const [variants, setVariants] = useState<Record<string, { selectedColor?: string | null; selectedSize?: string | null }>>({});

  // Sync variant state when cart items change
  useEffect(() => {
    const init: typeof variants = {};
    cartItems.forEach((item) => {
      init[item.id] = {
        selectedColor: item.selected_color ?? item.product?.colors?.[0]?.name ?? null,
        selectedSize: item.selected_size ?? null,
      };
    });
    setVariants(init);
  }, [items]);

  // Promo
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState<string | null>(null);
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoError, setPromoError] = useState("");

  // Wishlist
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());

  // ── Variant setters (optimistic + DB persist) ──────────────────────────────

  const setColor = useCallback((itemId: string, colorName: string) => {
    setVariants((prev) => ({ ...prev, [itemId]: { ...prev[itemId], selectedColor: colorName } }));
    const item = cartItems.find((i) => i.id === itemId);
    if (item) updateQuantity(item.product_id, item.quantity, { selected_color: colorName });
  }, [cartItems, updateQuantity]);

  const setSize = useCallback((itemId: string, size: string) => {
    setVariants((prev) => ({ ...prev, [itemId]: { ...prev[itemId], selectedSize: size } }));
    const item = cartItems.find((i) => i.id === itemId);
    if (item) updateQuantity(item.product_id, item.quantity, { selected_size: size });
  }, [cartItems, updateQuantity]);

  // ── Promo ──────────────────────────────────────────────────────────────────

  const applyPromo = () => {
    const code = promoCode.trim().toUpperCase();
    setPromoError("");
    if (promoApplied === code) { setPromoError("Code already applied."); return; }
    const fn = PROMO_CODES[code];
    if (fn) {
      const saved = fn(totalPrice);
      setPromoDiscount(saved); setPromoApplied(code);
      toast.success(`Code applied — ₱${saved.toLocaleString()} saved!`);
    } else {
      setPromoError("Invalid code. Try SAVE10, FREESHIP, or WELCOME20.");
    }
  };

  const removePromo = () => {
    setPromoApplied(null); setPromoDiscount(0); setPromoCode(""); setPromoError("");
    toast.info("Promo removed.");
  };

  // ── Wishlist ───────────────────────────────────────────────────────────────

  const toggleWishlist = (productId: string) => {
    setWishlist((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) { next.delete(productId); toast.info("Removed from wishlist."); }
      else { next.add(productId); toast.success("Added to wishlist!"); }
      return next;
    });
  };

  const moveToWishlist = (item: CartItem) => {
    setWishlist((prev) => new Set(prev).add(item.product_id));
    removeFromCart(item.product_id);
    toast.success(`"${item.product?.name}" moved to wishlist.`);
  };

  // ── Totals ─────────────────────────────────────────────────────────────────

  const shippingFee  = totalPrice >= 2000 ? 0 : 100;
  const freeShipPct  = Math.min(100, Math.round((totalPrice / 2000) * 100));
  const freeShipNeed = Math.max(0, 2000 - totalPrice);
  const grandTotal   = totalPrice + shippingFee - promoDiscount;

  // Items that have sizes available but none selected
  const hasMissingSize = cartItems.some((item) => {
    const sizeInv = item.product?.size_inventory ?? [];
    return sizeInv.length > 0 && !variants[item.id]?.selectedSize;
  });

  // ── Guards ─────────────────────────────────────────────────────────────────

  if (!user) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <ShoppingCart size={32} className="text-muted-foreground" />
          </div>
          <h1 className="font-heading text-2xl uppercase text-foreground mb-2">Sign in to view cart</h1>
          <p className="text-muted-foreground text-sm mb-6">You need to be signed in to view your cart.</p>
          <Link to="/signin">
            <Button className="bg-primary text-primary-foreground px-8 font-heading uppercase tracking-wider">Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-muted/30 pt-20 pb-16">

      {/* Breadcrumb */}
      <div className="bg-background border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <ChevronRight size={12} />
          <Link to="/shop" className="hover:text-foreground transition-colors">Shop</Link>
          <ChevronRight size={12} />
          <span className="text-foreground font-medium">Shopping Bag ({totalItems})</span>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">

        {/* Loading */}
        {loading ? (
          <div className="flex justify-center py-24">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>

        /* Empty */
        ) : cartItems.length === 0 ? (
          <div className="bg-background rounded-2xl border border-border p-16 text-center max-w-md mx-auto mt-8">
            <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
              <ShoppingCart size={36} className="text-muted-foreground" />
            </div>
            <h2 className="font-heading text-xl uppercase tracking-wider text-foreground mb-2">Your bag is empty</h2>
            <p className="text-sm text-muted-foreground mb-8">Looks like you haven't added anything yet.</p>
            <Link to="/shop">
              <Button className="bg-primary text-primary-foreground font-heading uppercase tracking-wider px-10">
                Start Shopping
              </Button>
            </Link>
          </div>

        /* Filled */
        ) : (
          <div className="grid lg:grid-cols-3 gap-6 items-start">

            {/* ── LEFT: Items ── */}
            <div className="lg:col-span-2 space-y-3">

              <div className="flex items-center justify-between mb-2">
                <h1 className="font-heading text-xl uppercase tracking-wider text-foreground">
                  Shopping Bag <span className="text-muted-foreground font-normal text-base">({totalItems})</span>
                </h1>
                <button onClick={() => { if (confirm("Remove all items?")) clearCart(); }}
                  className="text-xs text-muted-foreground hover:text-destructive transition-colors underline underline-offset-2">
                  Clear all
                </button>
              </div>

              {cartItems.map((item) => {
                const product        = item.product;
                const itemVariant    = variants[item.id] ?? {};
                const colors         = product?.colors ?? [];
                const sizeInventory  = product?.size_inventory ?? [];
                const outOfStock     = product?.out_of_stock_sizes ?? [];
                const unitPrice      = product?.price ?? 0;
                const lineTotal      = unitPrice * item.quantity;
                const isWishlisted   = wishlist.has(item.product_id);
                const hasSizes       = sizeInventory.length > 0;
                const sizeSelected   = itemVariant.selectedSize;
                const sizeMissing    = hasSizes && !sizeSelected;

                // Max qty for selected size
                const selectedSizeStock = sizeInventory.find((s) => s.size === sizeSelected)?.stock ?? 99;

                return (
                  <div key={item.id}
                    className={`bg-background rounded-xl border p-4 flex gap-4 transition-all duration-200 relative
                      ${sizeMissing ? "border-amber-300 bg-amber-50/30" : "border-border/60 hover:border-border"}`}
                  >
                    {/* Wishlist heart */}
                    <button onClick={() => toggleWishlist(item.product_id)}
                      className={`absolute top-3 right-3 transition-colors p-1 ${
                        isWishlisted ? "text-red-500" : "text-muted-foreground hover:text-red-400"}`}>
                      <Heart size={16} fill={isWishlisted ? "currentColor" : "none"} />
                    </button>

                    {/* Image */}
                    <Link to="/shop" className="shrink-0">
                      <div className="w-28 h-36 rounded-lg bg-muted overflow-hidden relative">
                        {product?.image_url ? (
                          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package size={24} className="text-muted-foreground" />
                          </div>
                        )}
                        {product?.discount_price && (
                          <span className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-[9px] font-semibold px-1.5 py-0.5 rounded tracking-wide">
                            SALE
                          </span>
                        )}
                      </div>
                    </Link>

                    {/* Body */}
                    <div className="flex-1 min-w-0 flex flex-col gap-2 py-0.5 pr-6">

                      {/* Brand + name */}
                      <div>
                        {product?.brand && (
                          <p className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground mb-0.5">
                            {product.brand}
                          </p>
                        )}
                        <h3 className="font-medium text-foreground text-sm leading-snug line-clamp-2">
                          {product?.name}
                        </h3>
                      </div>

                      {/* Price */}
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="font-heading text-base text-foreground">₱{unitPrice.toLocaleString()}</span>
                        {product?.discount_price && (
                          <>
                            <span className="text-xs text-muted-foreground line-through">₱{product.discount_price.toLocaleString()}</span>
                            <span className="text-[11px] text-destructive font-medium">
                              −₱{(product.discount_price - unitPrice).toLocaleString()}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Color selector */}
                      {colors.length > 0 && (
                        <div>
                          <p className="text-[11px] text-muted-foreground mb-1.5">
                            Color: <span className="text-foreground font-medium">{itemVariant.selectedColor ?? "—"}</span>
                          </p>
                          <ColorSwatches
                            colors={colors}
                            selected={itemVariant.selectedColor}
                            onSelect={(name) => setColor(item.id, name)}
                          />
                        </div>
                      )}

                      {/* Size selector */}
                      {hasSizes && (
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                              Size:{" "}
                              <span className={sizeSelected ? "text-foreground font-semibold" : "text-amber-600 font-semibold"}>
                                {sizeSelected ?? "Select size"}
                              </span>
                              {sizeMissing && <AlertTriangle size={11} className="text-amber-500 ml-0.5" />}
                              {sizeSelected && !sizeMissing && <CheckCircle2 size={11} className="text-green-500 ml-0.5" />}
                            </p>
                            <button className="flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2">
                              <Ruler size={10} /> Size guide
                            </button>
                          </div>

                          <SizePills
                            sizeInventory={sizeInventory}
                            outOfStock={outOfStock}
                            selected={sizeSelected}
                            onSelect={(size) => setSize(item.id, size)}
                          />

                          {/* Low stock warning for selected size */}
                          {sizeSelected && selectedSizeStock > 0 && selectedSizeStock <= 5 && (
                            <p className="text-[10px] text-amber-600 font-medium mt-1 flex items-center gap-1">
                              <AlertTriangle size={10} /> Only {selectedSizeStock} left in {sizeSelected}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Qty + actions */}
                      <div className="flex items-center justify-between mt-auto flex-wrap gap-2">
                        <div className="flex items-center border border-border rounded-lg overflow-hidden">
                          <button
                            onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                            className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                            <Minus size={13} />
                          </button>
                          <span className="w-10 text-center text-sm font-medium text-foreground border-x border-border h-8 flex items-center justify-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => {
                              if (sizeSelected && item.quantity >= selectedSizeStock) {
                                toast.error(`Only ${selectedSizeStock} left in ${sizeSelected}`);
                                return;
                              }
                              updateQuantity(item.product_id, item.quantity + 1);
                            }}
                            className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            disabled={sizeSelected ? item.quantity >= selectedSizeStock : false}>
                            <Plus size={13} />
                          </button>
                        </div>

                        <div className="flex items-center gap-3">
                          <p className="font-heading text-sm text-foreground">₱{lineTotal.toLocaleString()}</p>
                          <div className="flex items-center gap-2">
                            <button onClick={() => moveToWishlist(item)}
                              className="text-[11px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-0.5">
                              <Heart size={12} /> Wishlist
                            </button>
                            <span className="text-border">|</span>
                            <button onClick={() => { removeFromCart(item.product_id); toast.info("Item removed."); }}
                              className="text-muted-foreground hover:text-destructive transition-colors p-1">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Trust badges */}
              <div className="grid grid-cols-3 gap-3 mt-4">
                {[
                  { icon: Truck,     label: "Free Shipping", sub: "Orders over ₱2,000" },
                  { icon: RotateCcw, label: "Easy Returns",  sub: "Within 7 days" },
                  { icon: Shield,    label: "Secure Payment",sub: "100% protected" },
                ].map((b) => (
                  <div key={b.label} className="bg-background border border-border/60 rounded-xl p-3 flex flex-col items-center text-center gap-1">
                    <b.icon size={18} className="text-primary mb-0.5" />
                    <p className="text-xs font-medium text-foreground">{b.label}</p>
                    <p className="text-[10px] text-muted-foreground">{b.sub}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── RIGHT: Order Summary ── */}
            <div className="space-y-4 sticky top-24">

              {/* Promo code */}
              <div className="bg-background rounded-xl border border-border/60 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Tag size={14} className="text-primary" />
                  <p className="text-sm font-medium text-foreground">Promo Code</p>
                </div>

                {promoApplied ? (
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                    <div>
                      <p className="text-xs font-semibold text-green-700">{promoApplied} applied</p>
                      <p className="text-[10px] text-green-600">−₱{promoDiscount.toLocaleString()} saved</p>
                    </div>
                    <button onClick={removePromo} className="text-[10px] text-muted-foreground hover:text-destructive underline underline-offset-2">
                      Remove
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-2">
                      <input type="text" value={promoCode}
                        onChange={(e) => { setPromoCode(e.target.value.toUpperCase()); setPromoError(""); }}
                        onKeyDown={(e) => e.key === "Enter" && applyPromo()}
                        placeholder="Enter code"
                        className="flex-1 min-w-0 h-9 rounded-lg border border-border bg-muted/40 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <Button variant="outline" size="sm" onClick={applyPromo}
                        className="font-heading uppercase tracking-wider text-xs shrink-0">Apply</Button>
                    </div>
                    {promoError && <p className="text-[11px] text-destructive mt-1.5">{promoError}</p>}
                  </>
                )}
              </div>

              {/* Summary */}
              <div className="bg-background rounded-xl border border-border/60 p-5 space-y-4">
                <h2 className="font-heading text-sm uppercase tracking-wider text-foreground">Order Summary</h2>

                {/* Missing size warning */}
                {hasMissingSize && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p className="text-xs text-amber-800 flex items-center gap-2">
                      <AlertTriangle size={13} className="shrink-0" />
                      Please select a size for all items before checkout.
                    </p>
                  </div>
                )}

                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal ({totalItems} items)</span>
                    <span className="text-foreground">₱{totalPrice.toLocaleString()}</span>
                  </div>

                  {promoDiscount > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Promo ({promoApplied})</span>
                      <span className="text-green-600 font-medium">−₱{promoDiscount.toLocaleString()}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-muted-foreground">
                    <span>Shipping Fee</span>
                    <span className={shippingFee === 0 ? "text-green-600 font-medium" : "text-foreground"}>
                      {shippingFee === 0 ? "FREE" : `₱${shippingFee}`}
                    </span>
                  </div>

                  {shippingFee > 0 && (
                    <div>
                      <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                        <div className="h-1.5 bg-green-500 rounded-full transition-all duration-500"
                          style={{ width: `${freeShipPct}%` }} />
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1.5">
                        Add <span className="font-medium text-foreground">₱{freeShipNeed.toLocaleString()}</span> more for free shipping
                      </p>
                    </div>
                  )}
                </div>

                <div className="border-t border-border pt-3 flex justify-between items-center">
                  <span className="font-heading text-base text-foreground">Total</span>
                  <span className="font-heading text-2xl text-primary">₱{Math.max(0, grandTotal).toLocaleString()}</span>
                </div>

                <Link to={hasMissingSize ? "#" : "/checkout"} className="block"
                  onClick={hasMissingSize ? (e) => e.preventDefault() : undefined}>
                  <Button disabled={hasMissingSize}
                    className="w-full bg-primary text-primary-foreground font-heading uppercase tracking-wider text-sm h-12 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed">
                    {hasMissingSize ? "⚠️ Select sizes first" : "Proceed to Checkout"}
                  </Button>
                </Link>

                <Link to="/shop" className="block">
                  <Button variant="outline" className="w-full font-heading uppercase tracking-wider text-xs h-10 rounded-xl">
                    Continue Shopping
                  </Button>
                </Link>

                <p className="text-[10px] text-muted-foreground text-center flex items-center justify-center gap-1">
                  <Lock size={10} /> Secure & encrypted checkout
                </p>

                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  {["VISA", "Mastercard", "GCash", "Maya", "COD"].map((method) => (
                    <span key={method}
                      className="text-[9px] font-semibold tracking-wide text-muted-foreground border border-border rounded px-2 py-0.5">
                      {method}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;
