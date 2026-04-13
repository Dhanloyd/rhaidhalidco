import { useState, useEffect } from "react";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import {
  ShoppingCart, MapPin, CreditCard, CheckCircle,
  ChevronRight, ChevronLeft, ExternalLink, Loader2
} from "lucide-react";

const steps = ["Shipping", "Review", "Payment", "Confirmation"];

const CheckoutPage = () => {
  const { items, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [voucherCode, setVoucherCode] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState("cod");

  const [shipping, setShipping] = useState({
    full_name: "", phone: "", address_line: "", city: "", province: "", zip_code: "",
  });

  const shippingFee = totalPrice >= 2000 ? 0 : 100;
  const discount = appliedVoucher
    ? appliedVoucher.discount_type === "percentage"
      ? totalPrice * (appliedVoucher.discount_value / 100)
      : appliedVoucher.discount_value
    : 0;
  const grandTotal = totalPrice - discount + shippingFee;

  useEffect(() => {
    if (user) {
      supabase.from("addresses").select("*").eq("user_id", user.id).order("is_default", { ascending: false })
        .then(({ data }) => {
          setAddresses(data || []);
          const def = data?.find((a: any) => a.is_default);
          if (def) {
            setSelectedAddressId(def.id);
            setShipping({
              full_name: def.full_name, phone: def.phone,
              address_line: def.address_line, city: def.city,
              province: def.province || "", zip_code: def.zip_code || "",
            });
          }
        });
    }
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="text-center">
          <ShoppingCart size={48} className="mx-auto text-muted-foreground mb-4" />
          <h1 className="font-heading text-2xl uppercase text-foreground mb-2">Sign in to checkout</h1>
          <Link to="/signin"><Button className="bg-primary text-primary-foreground">Sign In</Button></Link>
        </div>
      </div>
    );
  }

  if (items.length === 0 && step < 3) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="text-center">
          <ShoppingCart size={48} className="mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">Your cart is empty</p>
          <Link to="/shop"><Button className="bg-primary text-primary-foreground">Browse Shop</Button></Link>
        </div>
      </div>
    );
  }

  const selectAddress = (addr: any) => {
    setSelectedAddressId(addr.id);
    setShipping({
      full_name: addr.full_name, phone: addr.phone, address_line: addr.address_line,
      city: addr.city, province: addr.province || "", zip_code: addr.zip_code || "",
    });
  };

  const applyVoucher = async () => {
    if (!voucherCode.trim()) return;
    const { data } = await supabase.from("vouchers").select("*")
      .eq("code", voucherCode.toUpperCase()).eq("active", true).maybeSingle();
    if (!data) { toast.error("Invalid voucher code"); return; }
    if (data.expiry_date && new Date(data.expiry_date) < new Date()) { toast.error("Voucher expired"); return; }
    if (data.max_uses && data.used_count >= data.max_uses) { toast.error("Voucher fully redeemed"); return; }
    if (totalPrice < data.min_spend) { toast.error(`Minimum spend ₱${data.min_spend.toLocaleString()}`); return; }
    setAppliedVoucher(data);
    toast.success("Voucher applied!");
  };

  const validateShipping = () => {
    if (!shipping.full_name || !shipping.phone || !shipping.address_line || !shipping.city) {
      toast.error("Please fill all required shipping fields");
      return false;
    }
    return true;
  };

  // ──────────────────────────────────────────
  // 🟢 CREATE ORDER in Supabase (status = pending)
  // ──────────────────────────────────────────
  const createOrder = async () => {
    const { data, error } = await supabase.from("orders").insert({
      user_id: user.id,
      customer_name: shipping.full_name,
      customer_email: user.email,
      items: items.map((i) => ({
        id: i.product_id, name: i.product?.name,
        price: i.product?.price, quantity: i.quantity,
      })),
      total: grandTotal,
      subtotal: totalPrice,
      discount,
      shipping_fee: shippingFee,
      shipping_name: shipping.full_name,
      shipping_phone: shipping.phone,
      shipping_address: `${shipping.address_line}, ${shipping.city}${shipping.province ? ", " + shipping.province : ""}${shipping.zip_code ? " " + shipping.zip_code : ""}`,
      status: "pending",
      payment_method: paymentMethod,
      payment_status: "pending",
      order_type: "online",
      voucher_id: appliedVoucher?.id || null,
    }).select("id").single();

    if (error) throw error;

    // Insert order items
    const orderItems = items.map((i) => ({
      order_id: data.id,
      product_id: i.product_id,
      product_name: i.product?.name || "",
      quantity: i.quantity,
      unit_price: i.product?.price || 0,
      total: (i.product?.price || 0) * i.quantity,
    }));
    await supabase.from("order_items").insert(orderItems);

    // Update voucher usage
    if (appliedVoucher) {
      await supabase.from("vouchers")
        .update({ used_count: appliedVoucher.used_count + 1 })
        .eq("id", appliedVoucher.id);
    }

    return data.id;
  };

  // ──────────────────────────────────────────
  // 💳 PAYMONGO — Direct API call (no edge function)
  // ──────────────────────────────────────────
 const handlePayMongoCheckout = async () => {
  setProcessing(true);
  try {
    const newOrderId = await createOrder();
    setOrderId(newOrderId);

    // Use PayMongo's client-side checkout via payment link
    const PUBLIC_KEY = "pk_live_Lo3hwj4HVj74HEcbq7hqJoqM";
    const BASE64_KEY = btoa(`${PUBLIC_KEY}:`);

    const response = await fetch("https://api.paymongo.com/v1/checkout_sessions", {
      method: "POST",
      headers: {
        Authorization: `Basic ${BASE64_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        data: {
          attributes: {
            billing: {
              name: shipping.full_name,
              email: user.email,
            },
            send_email_receipt: true,
            show_description: true,
            show_line_items: true,
            line_items: items.map((i) => ({
              currency: "PHP",
              amount: Math.round((i.product?.price || 0) * 100),
              name: i.product?.name || "Item",
              quantity: i.quantity,
            })),
            payment_method_types: ["gcash", "card", "maya", "grab_pay"],
            description: `Order #${newOrderId?.slice(0, 8).toUpperCase()}`,
            success_url: `${window.location.origin}/checkout/success?order_id=${newOrderId}`,
            cancel_url: `${window.location.origin}/checkout/cancel?order_id=${newOrderId}`,
          },
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.errors?.[0]?.detail || "PayMongo error");
    }

    const checkoutUrl = data.data.attributes.checkout_url;
    const sessionId = data.data.id;

    await supabase.from("orders")
      .update({ paymongo_session_id: sessionId })
      .eq("id", newOrderId);

    await clearCart();
    window.location.href = checkoutUrl;

  } catch (err: any) {
    toast.error(err.message || "Payment failed. Please try again.");
    setProcessing(false);
  }
};

  const handlePlaceOrder = () => {
    if (paymentMethod === "cod") {
      handleCOD();
    } else {
      handlePayMongoCheckout();
    }
  };

  const paymentMethods = [
    { id: "cod", label: "Cash on Delivery", icon: "💵", desc: "Pay when your order arrives" },
    {
      id: "gcash", label: "GCash", icon: "📱",
      desc: "Pay via GCash — you'll be redirected to a secure payment page",
    },
    {
      id: "card", label: "Credit / Debit Card", icon: "💳",
      desc: "Visa, Mastercard — secure checkout via PayMongo",
    },
  ];

  return (
    <div className="pt-24 pb-16 px-4">
      <div className="container mx-auto max-w-4xl">

        {/* Stepper */}
        <div className="flex items-center justify-center mb-10 gap-1">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                i === step ? "bg-primary text-primary-foreground"
                  : i < step ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground"
              }`}>
                {i < step
                  ? <CheckCircle size={16} />
                  : <span className="w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs">{i + 1}</span>
                }
                <span className="hidden sm:inline">{s}</span>
              </div>
              {i < steps.length - 1 && <ChevronRight size={16} className="text-muted-foreground mx-1" />}
            </div>
          ))}
        </div>

        {/* ── Step 0: Shipping ── */}
        {step === 0 && (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading uppercase tracking-wider flex items-center gap-2">
                    <MapPin size={18} /> Shipping Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {addresses.length > 0 && (
                    <div className="space-y-2 mb-4">
                      <p className="text-sm font-medium text-foreground">Saved Addresses</p>
                      {addresses.map((a) => (
                        <button key={a.id} onClick={() => selectAddress(a)}
                          className={`w-full text-left p-3 rounded-lg border transition-all ${
                            selectedAddressId === a.id
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          }`}>
                          <p className="font-medium text-sm text-foreground">{a.full_name} · {a.phone}</p>
                          <p className="text-xs text-muted-foreground">{a.address_line}, {a.city}</p>
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-1">Full Name *</label>
                      <Input value={shipping.full_name} onChange={(e) => setShipping({ ...shipping, full_name: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-1">Phone *</label>
                      <Input value={shipping.phone} onChange={(e) => setShipping({ ...shipping, phone: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1">Address *</label>
                    <Input value={shipping.address_line} onChange={(e) => setShipping({ ...shipping, address_line: e.target.value })} />
                  </div>
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-1">City *</label>
                      <Input value={shipping.city} onChange={(e) => setShipping({ ...shipping, city: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-1">Province</label>
                      <Input value={shipping.province} onChange={(e) => setShipping({ ...shipping, province: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-1">ZIP Code</label>
                      <Input value={shipping.zip_code} onChange={(e) => setShipping({ ...shipping, zip_code: e.target.value })} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            <OrderSummary items={items} subtotal={totalPrice} discount={discount} shippingFee={shippingFee}
              grandTotal={grandTotal} voucherCode={voucherCode} setVoucherCode={setVoucherCode}
              applyVoucher={applyVoucher} appliedVoucher={appliedVoucher} />
          </div>
        )}

        {/* ── Step 1: Review ── */}
        {step === 1 && (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader><CardTitle className="font-heading uppercase tracking-wider">Order Items</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                      {item.product?.image_url && (
                        <img src={item.product.image_url} alt={item.product.name} className="w-16 h-16 object-cover rounded-lg" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{item.product?.name}</p>
                        <p className="text-sm text-muted-foreground">Qty: {item.quantity} × ₱{(item.product?.price || 0).toLocaleString()}</p>
                      </div>
                      <p className="font-heading text-foreground">₱{((item.product?.price || 0) * item.quantity).toLocaleString()}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="font-heading uppercase tracking-wider text-sm">Ship To</CardTitle></CardHeader>
                <CardContent>
                  <p className="font-medium text-foreground">{shipping.full_name}</p>
                  <p className="text-sm text-muted-foreground">{shipping.phone}</p>
                  <p className="text-sm text-muted-foreground">{shipping.address_line}, {shipping.city}</p>
                </CardContent>
              </Card>
            </div>
            <OrderSummary items={items} subtotal={totalPrice} discount={discount} shippingFee={shippingFee} grandTotal={grandTotal} />
          </div>
        )}

        {/* ── Step 2: Payment ── */}
        {step === 2 && (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading uppercase tracking-wider flex items-center gap-2">
                    <CreditCard size={18} /> Payment Method
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {paymentMethods.map((pm) => (
                    <button key={pm.id} onClick={() => setPaymentMethod(pm.id)}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${
                        paymentMethod === pm.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/30"
                      }`}>
                      <span className="text-2xl">{pm.icon}</span>
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{pm.label}</p>
                        <p className="text-xs text-muted-foreground">{pm.desc}</p>
                      </div>
                      {paymentMethod === pm.id && <CheckCircle size={18} className="ml-auto text-primary shrink-0" />}
                    </button>
                  ))}

                  {(paymentMethod === "gcash" || paymentMethod === "card") && (
                    <div className="mt-2 rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
                      <div className="flex items-start gap-3">
                        <ExternalLink size={18} className="text-primary shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            You'll be redirected to a secure payment page
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {paymentMethod === "gcash"
                              ? "Pay via GCash on PayMongo's secure checkout. You'll be redirected back here after payment."
                              : "Enter your Visa or Mastercard details on PayMongo's secure checkout page."}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        {[
                          "Click \"Place Order\" below",
                          "You'll be taken to a secure PayMongo page",
                          paymentMethod === "gcash"
                            ? "Log in to GCash and confirm payment"
                            : "Enter your card details and confirm",
                          "You'll return here with order confirmation",
                        ].map((s, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                            <span className="w-4 h-4 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 mt-0.5 text-[10px]">{i + 1}</span>
                            {s}
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center gap-2 pt-1 border-t border-primary/10">
                        <span className="text-xs text-muted-foreground">Accepted:</span>
                        {paymentMethod === "gcash"
                          ? <span className="text-xs font-medium text-[#0070FF]">📱 GCash · Maya · GrabPay</span>
                          : <span className="text-xs font-medium text-foreground">💳 Visa · Mastercard</span>
                        }
                      </div>

                      <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                        🔒 Secured by <strong>PayMongo</strong> · BSP-regulated · PCI-DSS compliant
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            <OrderSummary items={items} subtotal={totalPrice} discount={discount} shippingFee={shippingFee} grandTotal={grandTotal} />
          </div>
        )}

        {/* ── Step 3: Confirmation ── */}
        {step === 3 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircle size={40} className="text-green-600" />
            </div>
            <h2 className="font-heading text-3xl uppercase text-foreground mb-2">Order Placed!</h2>
            <p className="text-muted-foreground mb-2">Your order has been placed successfully.</p>
            <p className="text-sm font-mono text-muted-foreground mb-6">
              Order ID: {orderId?.slice(0, 8).toUpperCase()}
            </p>
            <div className="flex justify-center gap-4">
              <Link to="/my-orders">
                <Button className="bg-primary text-primary-foreground font-heading uppercase tracking-wider">View Orders</Button>
              </Link>
              <Link to="/shop">
                <Button variant="outline" className="font-heading uppercase tracking-wider">Continue Shopping</Button>
              </Link>
            </div>
          </div>
        )}

        {/* Navigation */}
        {step < 3 && (
          <div className="flex justify-between mt-8">
            <Button variant="outline"
              onClick={() => step > 0 ? setStep(step - 1) : navigate("/cart")}
              className="gap-2 font-heading uppercase tracking-wider">
              <ChevronLeft size={16} /> {step === 0 ? "Back to Cart" : "Back"}
            </Button>

            {step < 2 ? (
              <Button
                onClick={() => { if (step === 0 && !validateShipping()) return; setStep(step + 1); }}
                className="gap-2 bg-primary text-primary-foreground font-heading uppercase tracking-wider">
                Continue <ChevronRight size={16} />
              </Button>
            ) : (
              <Button
                onClick={handlePlaceOrder}
                disabled={processing}
                className="gap-2 bg-primary text-primary-foreground font-heading uppercase tracking-wider disabled:opacity-50 min-w-[180px]">
                {processing
                  ? <><Loader2 size={16} className="animate-spin" /> Processing...</>
                  : paymentMethod === "cod"
                    ? `Place Order · ₱${grandTotal.toLocaleString()}`
                    : `Pay ₱${grandTotal.toLocaleString()} →`
                }
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Order Summary Component ──
const OrderSummary = ({ items, subtotal, discount, shippingFee, grandTotal, voucherCode, setVoucherCode, applyVoucher, appliedVoucher }: any) => (
  <Card className="h-fit sticky top-24">
    <CardHeader>
      <CardTitle className="font-heading uppercase tracking-wider text-sm">Order Summary</CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      <div className="space-y-1 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>Subtotal ({items.length} items)</span><span>₱{subtotal.toLocaleString()}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Discount</span><span>-₱{discount.toLocaleString()}</span>
          </div>
        )}
        <div className="flex justify-between text-muted-foreground">
          <span>Shipping</span><span>{shippingFee === 0 ? "Free" : `₱${shippingFee}`}</span>
        </div>
      </div>
      {setVoucherCode && (
        <div className="flex gap-2">
          <Input placeholder="Voucher code" value={voucherCode}
            onChange={(e: any) => setVoucherCode(e.target.value)} className="text-sm" />
          <Button size="sm" variant="outline" onClick={applyVoucher} disabled={!!appliedVoucher}>Apply</Button>
        </div>
      )}
      {appliedVoucher && <p className="text-xs text-green-600">✓ {appliedVoucher.code} applied</p>}
      <div className="border-t border-border pt-3 flex justify-between font-heading text-lg">
        <span className="text-foreground">Total</span>
        <span className="text-primary">₱{grandTotal.toLocaleString()}</span>
      </div>
    </CardContent>
  </Card>
);

export default CheckoutPage;
