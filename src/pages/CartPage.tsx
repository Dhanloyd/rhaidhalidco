import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Minus, Plus, Trash2, ShoppingCart, ChevronRight,
  Tag, Truck, Shield, RotateCcw, Heart,
  Lock, AlertTriangle, Package,
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

// ─── Size pills ──────────────────────────────────────────────────────────────
const SizePills = ({
  sizeInventory, outOfStock, selected, onSelect,
}: {
  sizeInventory: SizeStock[];
  outOfStock: string[];
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
          <button
            key={size}
            type="button"
            disabled={oos}
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
            {lowStock && !isSelected && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 border border-background" />
            )}
          </button>
        );
      })}
    </div>
  );
};

// ─── Size badge ──────────────────────────────────────────────────────────────
const SizeBadge = ({ size }: { size: string }) => (
  <span style={{
    display: "inline-flex", alignItems: "center", gap: "4px",
    padding: "3px 10px", borderRadius: "4px",
    background: "rgba(10,13,20,.06)", border: "1px solid rgba(10,13,20,.12)",
    fontSize: "11px", fontWeight: 700, color: "#0a0d14", letterSpacing: ".04em",
    textTransform: /^\d/.test(size) ? "none" : "uppercase",
  }}>
    {/^\d/.test(size) ? "📏" : "👕"} {size}
  </span>
);

// ─── Color badge (display only) ───────────────────────────────────────────────
const ColorBadge = ({ color, hex }: { color: string; hex?: string }) => (
  <span style={{
    display: "inline-flex", alignItems: "center", gap: "5px",
    padding: "3px 10px", borderRadius: "4px",
    background: "rgba(10,13,20,.05)", border: "1px solid rgba(10,13,20,.1)",
    fontSize: "11px", fontWeight: 600, color: "#0a0d14",
  }}>
    {hex && (
      <span style={{
        width: "10px", height: "10px", borderRadius: "50%",
        background: hex, border: "1px solid rgba(10,13,20,.15)", flexShrink: 0,
      }} />
    )}
    {color}
  </span>
);

// ─── Cart Page ────────────────────────────────────────────────────────────────
const CartPage = () => {
  const { items, totalPrice, totalItems, updateQuantity, removeFromCart, clearCart, loading } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const cartItems = items as CartItem[];

  const [variants, setVariants] = useState<Record<string, {
    selectedSize?: string | null;
  }>>({});

  useEffect(() => {
    const init: typeof variants = {};
    cartItems.forEach((item) => {
      init[item.id] = {
        selectedSize: item.selected_size ?? null,
      };
    });
    setVariants(init);
  }, [items]);

  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState<string | null>(null);
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoError, setPromoError] = useState("");
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());

  // ── Size selection ──
  const setSize = useCallback((itemId: string, size: string) => {
    setVariants((prev) => ({ ...prev, [itemId]: { ...prev[itemId], selectedSize: size } }));
    const item = cartItems.find((i) => i.id === itemId);
    if (item) updateQuantity(item.id, item.quantity, { selected_size: size });
  }, [cartItems, updateQuantity]);

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
    removeFromCart(item.id);
    toast.success(`"${item.product?.name}" moved to wishlist.`);
  };

  const shippingFee  = totalPrice >= 2000 ? 0 : 100;
  const freeShipPct  = Math.min(100, Math.round((totalPrice / 2000) * 100));
  const freeShipNeed = Math.max(0, 2000 - totalPrice);
  const grandTotal   = totalPrice + shippingFee - promoDiscount;

  const hasMissingSize = cartItems.some((item) => {
    const sizeInv = item.product?.size_inventory ?? [];
    return sizeInv.length > 0 && !variants[item.id]?.selectedSize;
  });

  type GroupedItems = Record<string, CartItem[]>;
  const groupedByCategory = cartItems.reduce<GroupedItems>((acc, item) => {
    const cat = item.product?.category ?? "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});
  const categoryGroups = Object.entries(groupedByCategory);

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
        {loading ? (
          <div className="flex justify-center py-24">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : cartItems.length === 0 ? (
          <div className="bg-background rounded-2xl border border-border p-16 text-center max-w-md mx-auto mt-8">
            <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
              <ShoppingCart size={36} className="text-muted-foreground" />
            </div>
            <h2 className="font-heading text-xl uppercase tracking-wider text-foreground mb-2">Your bag is empty</h2>
            <p className="text-sm text-muted-foreground mb-8">Looks like you haven't added anything yet.</p>
            <Link to="/shop">
              <Button className="bg-primary text-primary-foreground font-heading uppercase tracking-wider px-10">Start Shopping</Button>
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6 items-start">

            {/* ── LEFT: Items ── */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h1 className="font-heading text-xl uppercase tracking-wider text-foreground">
                  Shopping Bag <span className="text-muted-foreground font-normal text-base">({totalItems})</span>
                </h1>
                <button
                  onClick={() => { if (confirm("Remove all items?")) clearCart(); }}
                  className="text-xs text-muted-foreground hover:text-destructive transition-colors underline underline-offset-2">
                  Clear all
                </button>
              </div>

              {categoryGroups.map(([category, groupItems]) => (
                <div key={category} className="bg-background rounded-xl border border-border/60 overflow-hidden">
                  <div style={{
                    padding: "12px 16px",
                    background: "linear-gradient(135deg, #f8f9ff 0%, #f0f4ff 100%)",
                    borderBottom: "1px solid rgba(26,86,219,.1)",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "10px", fontWeight: 800, letterSpacing: ".18em", textTransform: "uppercase", color: "#1a56db" }}>{category}</span>
                      <span style={{ fontSize: "10px", fontWeight: 700, color: "rgba(26,86,219,.6)", background: "rgba(26,86,219,.08)", padding: "1px 7px", borderRadius: "999px" }}>
                        {groupItems.length} {groupItems.length === 1 ? "item" : "items"}
                      </span>
                    </div>
                    <span style={{ fontSize: "11px", color: "rgba(10,13,20,.4)", fontWeight: 500 }}>
                      ₱{groupItems.reduce((s, item) => s + (item.product?.price ?? 0) * item.quantity, 0).toLocaleString()}
                    </span>
                  </div>

                  {groupItems.map((item, itemIndex) => {
                    const product       = item.product;
                    const itemVariant   = variants[item.id] ?? {};
                    const sizeInventory = product?.size_inventory ?? [];
                    const outOfStock    = product?.out_of_stock_sizes ?? [];
                    const colors        = product?.colors ?? [];
                    const unitPrice     = product?.price ?? 0;
                    const lineTotal     = unitPrice * item.quantity;
                    const isWishlisted  = wishlist.has(item.product_id);
                    const hasSizes      = sizeInventory.length > 0;
                    const sizeSelected  = itemVariant.selectedSize ?? item.selected_size;
                    const colorSelected = item.selected_color ?? null;
                    const colorHex      = colors.find(c => c.name === colorSelected)?.hex ?? item.selected_color_hex ?? null;
                    const sizeMissing   = hasSizes && !sizeSelected;
                    const selectedSizeStock = sizeInventory.find((s) => s.size === sizeSelected)?.stock ?? 99;

                    return (
                      <div key={item.id} style={{
                        padding: "16px",
                        borderBottom: itemIndex < groupItems.length - 1 ? "1px solid rgba(10,13,20,.06)" : "none",
                        background: sizeMissing ? "rgba(245,158,11,.03)" : "transparent",
                        borderLeft: sizeMissing ? "3px solid #f59e0b" : "3px solid transparent",
                      }}>
                        <div style={{ display: "flex", gap: "14px" }}>
                          {/* Image */}
                          <Link to="/shop" style={{ flexShrink: 0 }}>
                            <div style={{ width: "100px", height: "130px", borderRadius: "8px", background: "#f3f4f6", overflow: "hidden" }}>
                              {product?.image_url ? (
                                <img src={product.image_url} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              ) : (
                                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                  <Package size={24} style={{ color: "rgba(10,13,20,.2)" }} />
                                </div>
                              )}
                            </div>
                          </Link>

                          {/* Body */}
                          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
                            {/* Name + actions */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                              <div style={{ flex: 1, paddingRight: "8px" }}>
                                {product?.brand && (
                                  <p style={{ fontSize: "9px", fontWeight: 800, letterSpacing: ".18em", textTransform: "uppercase", color: "rgba(10,13,20,.4)", marginBottom: "3px" }}>{product.brand}</p>
                                )}
                                <h3 style={{ fontWeight: 600, color: "#0a0d14", fontSize: "13px", lineHeight: 1.4 }} className="line-clamp-2">{product?.name}</h3>
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                                <button onClick={() => toggleWishlist(item.product_id)}
                                  style={{ color: isWishlisted ? "#ef4444" : "rgba(10,13,20,.3)", background: "none", border: "none", cursor: "pointer", padding: "2px" }}>
                                  <Heart size={15} fill={isWishlisted ? "currentColor" : "none"} />
                                </button>
                                <button
                                  onClick={() => { removeFromCart(item.id); toast.info("Item removed."); }}
                                  style={{ color: "rgba(10,13,20,.3)", background: "none", border: "none", cursor: "pointer", padding: "2px" }}
                                  onMouseEnter={e => (e.currentTarget.style.color = "#ef4444")}
                                  onMouseLeave={e => (e.currentTarget.style.color = "rgba(10,13,20,.3)")}>
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>

                            {/* Size + Color display (no picker for color) */}
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                              {sizeSelected
                                ? <SizeBadge size={sizeSelected} />
                                : hasSizes && (
                                  <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "3px 10px", borderRadius: "4px", background: "rgba(245,158,11,.1)", border: "1px solid rgba(245,158,11,.3)", fontSize: "11px", fontWeight: 700, color: "#d97706" }}>
                                    <AlertTriangle size={10} /> Select Size
                                  </span>
                                )
                              }
                              {colorSelected && <ColorBadge color={colorSelected} hex={colorHex ?? undefined} />}
                            </div>

                            {/* Price */}
                            <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                              <span style={{ fontSize: "14px", fontWeight: 800, color: "#0a0d14" }}>₱{unitPrice.toLocaleString()}</span>
                            </div>

                            {/* ── SIZE SELECTOR only ── */}
                          
                            {/* Qty + line total */}
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "4px" }}>
                              <div style={{ display: "flex", alignItems: "center", border: "1.5px solid rgba(10,13,20,.12)", borderRadius: "8px", overflow: "hidden" }}>
                                <button onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                  style={{ width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer", color: "rgba(10,13,20,.5)" }}
                                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(10,13,20,.05)")}
                                  onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                                  <Minus size={12} />
                                </button>
                                <span style={{ width: "36px", textAlign: "center", fontSize: "13px", fontWeight: 700, color: "#0a0d14", borderLeft: "1.5px solid rgba(10,13,20,.1)", borderRight: "1.5px solid rgba(10,13,20,.1)", height: "32px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() => {
                                    if (sizeSelected && item.quantity >= selectedSizeStock) {
                                      toast.error(`Only ${selectedSizeStock} left in size ${sizeSelected}`);
                                      return;
                                    }
                                    updateQuantity(item.id, item.quantity + 1);
                                  }}
                                  disabled={sizeSelected ? item.quantity >= selectedSizeStock : false}
                                  style={{ width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer", color: "rgba(10,13,20,.5)" }}
                                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(10,13,20,.05)")}
                                  onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                                  <Plus size={12} />
                                </button>
                              </div>

                              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                <span style={{ fontSize: "14px", fontWeight: 800, color: "#0a0d14" }}>₱{lineTotal.toLocaleString()}</span>
                                <button onClick={() => moveToWishlist(item)}
                                  style={{ fontSize: "10px", color: "rgba(10,13,20,.4)", fontWeight: 600, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "3px" }}
                                  onMouseEnter={e => (e.currentTarget.style.color = "#ef4444")}
                                  onMouseLeave={e => (e.currentTarget.style.color = "rgba(10,13,20,.4)")}>
                                  <Heart size={11} /> Wishlist
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}

              {/* Trust badges */}
              <div className="grid grid-cols-3 gap-3 mt-2">
                {[
                  { icon: Truck,     label: "Free Shipping", sub: "Orders over ₱2,000" },
                  { icon: RotateCcw, label: "Easy Returns",  sub: "Within 7 days" },
                  { icon: Shield,    label: "Secure Payment", sub: "100% protected" },
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
              {/* Promo */}
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
                    <button onClick={removePromo} className="text-[10px] text-muted-foreground hover:text-destructive underline underline-offset-2">Remove</button>
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
                      <Button variant="outline" size="sm" onClick={applyPromo} className="font-heading uppercase tracking-wider text-xs shrink-0">Apply</Button>
                    </div>
                    {promoError && <p className="text-[11px] text-destructive mt-1.5">{promoError}</p>}
                  </>
                )}
              </div>

              {/* Summary */}
              <div className="bg-background rounded-xl border border-border/60 p-5 space-y-4">
                <h2 className="font-heading text-sm uppercase tracking-wider text-foreground">Order Summary</h2>

                {hasMissingSize && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p className="text-xs text-amber-800 flex items-center gap-2">
                      <AlertTriangle size={13} className="shrink-0" />
                      Please select a size for all items before checkout.
                    </p>
                  </div>
                )}

                {/* Item breakdown with color */}
                <div style={{ borderBottom: "1px solid rgba(10,13,20,.08)", paddingBottom: "12px" }}>
                  {cartItems.map(item => {
                    const colorSelected = item.selected_color ?? null;
                    const colorHex = item.product?.colors?.find((c: ProductColor) => c.name === colorSelected)?.hex ?? (item as any).selected_color_hex ?? null;
                    return (
                      <div key={item.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", gap: "8px" }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: "11px", fontWeight: 600, color: "#0a0d14" }} className="truncate">{item.product?.name}</p>
                          <div style={{ display: "flex", gap: "5px", marginTop: "3px", flexWrap: "wrap", alignItems: "center" }}>
                            {(variants[item.id]?.selectedSize ?? item.selected_size) && (
                              <span style={{ fontSize: "9px", fontWeight: 700, padding: "1px 5px", borderRadius: "3px", background: "rgba(26,86,219,.08)", color: "#1a56db", border: "1px solid rgba(26,86,219,.12)", textTransform: "uppercase" }}>
                                {variants[item.id]?.selectedSize ?? item.selected_size}
                              </span>
                            )}
                            {colorSelected && (
                              <span style={{ display: "inline-flex", alignItems: "center", gap: "3px", fontSize: "9px", fontWeight: 600, color: "rgba(10,13,20,.5)" }}>
                                {colorHex && <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: colorHex, border: "1px solid rgba(10,13,20,.15)", flexShrink: 0 }} />}
                                {colorSelected}
                              </span>
                            )}
                            <span style={{ fontSize: "10px", color: "rgba(10,13,20,.4)" }}>× {item.quantity}</span>
                          </div>
                        </div>
                        <span style={{ fontSize: "12px", fontWeight: 700, color: "#0a0d14", flexShrink: 0 }}>
                          ₱{((item.product?.price ?? 0) * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    );
                  })}
                </div>

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
                
                  {shippingFee > 0 && (
                    <div>
                      <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                        <div className="h-1.5 bg-green-500 rounded-full transition-all duration-500" style={{ width: `${freeShipPct}%` }} />
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
                    className="w-full bg-primary text-primary-foreground font-heading uppercase tracking-wider text-sm h-12 rounded-xl disabled:opacity-50">
                    {hasMissingSize ? "⚠️ Select sizes first" : "Proceed to Checkout"}
                  </Button>
                </Link>

                <Link to="/shop" className="block">
                  <Button variant="outline" className="w-full font-heading uppercase tracking-wider text-xs h-10 rounded-xl">Continue Shopping</Button>
                </Link>

                <p className="text-[10px] text-muted-foreground text-center flex items-center justify-center gap-1">
                  <Lock size={10} /> Secure & encrypted checkout
                </p>

                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  {["VISA", "Mastercard", "GCash", "COD"].map((method) => (
                    <span key={method} className="text-[9px] font-semibold tracking-wide text-muted-foreground border border-border rounded px-2 py-0.5">{method}</span>
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
