import { useState, useEffect } from "react";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, MapPin, CreditCard, CheckCircle, ChevronRight, ChevronLeft, Smartphone, ExternalLink, Copy } from "lucide-react";

const GCASH_NUMBER = "09463891787";
const GCASH_NAME = "RaidKhalid & Co.";

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
  const [gcashLaunched, setGcashLaunched] = useState(false);
  const [gcashConfirmed, setGcashConfirmed] = useState(false);
  const [refNumber, setRefNumber] = useState("");

  const [shipping, setShipping] = useState({
    full_name: "", phone: "", address_line: "", city: "", province: "", zip_code: "",
  });
  const [paymentMethod, setPaymentMethod] = useState("cod");

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
            setShipping({ full_name: def.full_name, phone: def.phone, address_line: def.address_line, city: def.city, province: def.province || "", zip_code: def.zip_code || "" });
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
    setShipping({ full_name: addr.full_name, phone: addr.phone, address_line: addr.address_line, city: addr.city, province: addr.province || "", zip_code: addr.zip_code || "" });
  };

  const applyVoucher = async () => {
    if (!voucherCode.trim()) return;
    const { data } = await supabase.from("vouchers").select("*").eq("code", voucherCode.toUpperCase()).eq("active", true).maybeSingle();
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

  // GCash deep link — opens GCash app with pre-filled amount and number
  const handleGcashPay = () => {
    const amount = grandTotal.toFixed(2);
    // GCash deep link format
    const deepLink = `gcash://send?phone=${GCASH_NUMBER}&amount=${amount}&note=RaidKhalid+Order`;
    // Fallback: GCash web
    const webFallback = `https://www.gcash.com/`;

    // Try to open the app; fallback after short delay
    const win = window.open(deepLink, "_blank");
    setGcashLaunched(true);

    // If deep link fails (no app), open web fallback after 2s
    setTimeout(() => {
      if (!document.hidden) {
        window.open(webFallback, "_blank");
      }
    }, 2000);

    toast.success("Opening GCash app...");
  };

  const copyNumber = () => {
    navigator.clipboard.writeText(GCASH_NUMBER);
    toast.success("GCash number copied!");
  };

  const handlePlaceOrder = async () => {
    if (paymentMethod === "gcash" && !gcashConfirmed) {
      toast.error("Please confirm you have completed the GCash payment.");
      return;
    }
    setProcessing(true);
    const { data, error } = await supabase.from("orders").insert({
      user_id: user.id,
      customer_name: shipping.full_name,
      customer_email: user.email,
      items: items.map((i) => ({ id: i.product_id, name: i.product?.name, price: i.product?.price, quantity: i.quantity })),
      total: grandTotal,
      subtotal: totalPrice,
      discount,
      shipping_fee: shippingFee,
      shipping_name: shipping.full_name,
      shipping_phone: shipping.phone,
      shipping_address: `${shipping.address_line}, ${shipping.city}${shipping.province ? ", " + shipping.province : ""}${shipping.zip_code ? " " + shipping.zip_code : ""}`,
      status: "pending",
      payment_method: paymentMethod,
      payment_reference: refNumber || null,
      order_type: "online",
      voucher_id: appliedVoucher?.id || null,
    }).select("id").single();

    if (error) { toast.error("Checkout failed"); setProcessing(false); return; }

    if (data) {
      const orderItems = items.map((i) => ({
        order_id: data.id,
        product_id: i.product_id,
        product_name: i.product?.name || "",
        quantity: i.quantity,
        unit_price: i.product?.price || 0,
        total: (i.product?.price || 0) * i.quantity,
      }));
      await supabase.from("order_items").insert(orderItems);
    }

    if (appliedVoucher) {
      await supabase.from("vouchers").update({ used_count: appliedVoucher.used_count + 1 }).eq("id", appliedVoucher.id);
    }

    await clearCart();
    setOrderId(data?.id || "");
    setStep(3);
    setProcessing(false);
  };

  const paymentMethods = [
    { id: "cod", label: "Cash on Delivery", icon: "💵", desc: "Pay when your order arrives" },
    { id: "gcash", label: "GCash", icon: "📱", desc: "Pay via GCash — opens the app automatically" },
    { id: "card", label: "Credit/Debit Card", icon: "💳", desc: "Card payment (mock)" },
  ];

  return (
    <div className="pt-24 pb-16 px-4">
      <div className="container mx-auto max-w-4xl">
        {/* Stepper */}
        <div className="flex items-center justify-center mb-10 gap-1">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                i === step ? "bg-primary text-primary-foreground" : i < step ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
              }`}>
                {i < step ? <CheckCircle size={16} /> : <span className="w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs">{i + 1}</span>}
                <span className="hidden sm:inline">{s}</span>
              </div>
              {i < steps.length - 1 && <ChevronRight size={16} className="text-muted-foreground mx-1" />}
            </div>
          ))}
        </div>

        {/* Step 0: Shipping */}
        {step === 0 && (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader><CardTitle className="font-heading uppercase tracking-wider flex items-center gap-2"><MapPin size={18} /> Shipping Information</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {addresses.length > 0 && (
                    <div className="space-y-2 mb-4">
                      <p className="text-sm font-medium text-foreground">Saved Addresses</p>
                      {addresses.map((a) => (
                        <button key={a.id} onClick={() => selectAddress(a)} className={`w-full text-left p-3 rounded-lg border transition-all ${selectedAddressId === a.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}>
                          <p className="font-medium text-sm text-foreground">{a.full_name} · {a.phone}</p>
                          <p className="text-xs text-muted-foreground">{a.address_line}, {a.city}</p>
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div><label className="text-sm font-medium text-foreground block mb-1">Full Name *</label><Input value={shipping.full_name} onChange={(e) => setShipping({ ...shipping, full_name: e.target.value })} /></div>
                    <div><label className="text-sm font-medium text-foreground block mb-1">Phone *</label><Input value={shipping.phone} onChange={(e) => setShipping({ ...shipping, phone: e.target.value })} /></div>
                  </div>
                  <div><label className="text-sm font-medium text-foreground block mb-1">Address *</label><Input value={shipping.address_line} onChange={(e) => setShipping({ ...shipping, address_line: e.target.value })} /></div>
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div><label className="text-sm font-medium text-foreground block mb-1">City *</label><Input value={shipping.city} onChange={(e) => setShipping({ ...shipping, city: e.target.value })} /></div>
                    <div><label className="text-sm font-medium text-foreground block mb-1">Province</label><Input value={shipping.province} onChange={(e) => setShipping({ ...shipping, province: e.target.value })} /></div>
                    <div><label className="text-sm font-medium text-foreground block mb-1">ZIP Code</label><Input value={shipping.zip_code} onChange={(e) => setShipping({ ...shipping, zip_code: e.target.value })} /></div>
                  </div>
                </CardContent>
              </Card>
            </div>
            <OrderSummary items={items} subtotal={totalPrice} discount={discount} shippingFee={shippingFee} grandTotal={grandTotal} voucherCode={voucherCode} setVoucherCode={setVoucherCode} applyVoucher={applyVoucher} appliedVoucher={appliedVoucher} />
          </div>
        )}

        {/* Step 1: Review */}
        {step === 1 && (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader><CardTitle className="font-heading uppercase tracking-wider">Order Items</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                      {item.product?.image_url && <img src={item.product.image_url} alt={item.product.name} className="w-16 h-16 object-cover rounded-lg" />}
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

        {/* Step 2: Payment */}
        {step === 2 && (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader><CardTitle className="font-heading uppercase tracking-wider flex items-center gap-2"><CreditCard size={18} /> Payment Method</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {paymentMethods.map((pm) => (
                    <button key={pm.id} onClick={() => { setPaymentMethod(pm.id); setGcashLaunched(false); setGcashConfirmed(false); }}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${paymentMethod === pm.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}>
                      <span className="text-2xl">{pm.icon}</span>
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{pm.label}</p>
                        <p className="text-xs text-muted-foreground">{pm.desc}</p>
                      </div>
                      {paymentMethod === pm.id && <CheckCircle size={18} className="ml-auto text-primary shrink-0" />}
                    </button>
                  ))}

                  {/* ── GCash Payment Flow ── */}
                  {paymentMethod === "gcash" && (
                    <div className="mt-2 rounded-xl border border-primary/30 overflow-hidden">
                      {/* Header */}
                      <div className="bg-[#0070FF] px-5 py-4 flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shrink-0">
                          <span className="text-[#0070FF] font-bold text-sm">G</span>
                        </div>
                        <div>
                          <p className="text-white font-semibold text-sm">GCash Payment</p>
                          <p className="text-white/80 text-xs">Send to {GCASH_NAME}</p>
                        </div>
                        <div className="ml-auto text-right">
                          <p className="text-white/70 text-xs">Amount due</p>
                          <p className="text-white font-bold text-lg">₱{grandTotal.toLocaleString()}</p>
                        </div>
                      </div>

                      {/* Body */}
                      <div className="p-5 space-y-4 bg-card">
                        {/* GCash number */}
                        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div>
                            <p className="text-xs text-muted-foreground mb-0.5">GCash Number</p>
                            <p className="font-mono font-semibold text-foreground text-lg">{GCASH_NUMBER}</p>
                            <p className="text-xs text-muted-foreground">{GCASH_NAME}</p>
                          </div>
                          <button onClick={copyNumber}
                            className="flex items-center gap-1.5 text-xs text-primary border border-primary/30 px-3 py-1.5 rounded-lg hover:bg-primary/5 transition-colors">
                            <Copy size={13} /> Copy
                          </button>
                        </div>

                        {/* Steps */}
                        <div className="space-y-2">
                          {[
                            "Tap the button below to open GCash",
                            `Send exactly ₱${grandTotal.toLocaleString()} to ${GCASH_NUMBER}`,
                            "Copy your GCash reference number",
                            "Paste it below and confirm payment",
                          ].map((s, i) => (
                            <div key={i} className="flex items-start gap-3 text-sm">
                              <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                              <span className="text-muted-foreground">{s}</span>
                            </div>
                          ))}
                        </div>

                        {/* Open GCash button */}
                        <button onClick={handleGcashPay}
                          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#0070FF] hover:bg-[#0060DD] text-white font-semibold text-sm transition-colors">
                          <Smartphone size={18} />
                          {gcashLaunched ? "Re-open GCash App" : "Open GCash App"}
                          <ExternalLink size={14} />
                        </button>

                        {/* Reference number input */}
                        {gcashLaunched && (
                          <div className="space-y-3 pt-1">
                            <div>
                              <label className="text-sm font-medium text-foreground block mb-1.5">
                                GCash Reference Number <span className="text-muted-foreground font-normal">(optional but recommended)</span>
                              </label>
                              <Input
                                value={refNumber}
                                onChange={(e) => setRefNumber(e.target.value)}
                                placeholder="e.g. 1234567890"
                                className="font-mono"
                              />
                            </div>

                            {/* Confirm checkbox */}
                            <button onClick={() => setGcashConfirmed(!gcashConfirmed)}
                              className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all ${gcashConfirmed ? "border-green-500 bg-green-50" : "border-border hover:border-primary/30"}`}>
                              <div className={`w-5 h-5 rounded flex items-center justify-center border-2 shrink-0 transition-colors ${gcashConfirmed ? "bg-green-500 border-green-500" : "border-border"}`}>
                                {gcashConfirmed && <CheckCircle size={12} className="text-white" />}
                              </div>
                              <span className={`text-sm font-medium ${gcashConfirmed ? "text-green-700" : "text-foreground"}`}>
                                I have sent ₱{grandTotal.toLocaleString()} via GCash
                              </span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {paymentMethod === "card" && (
                    <div className="mt-2 p-4 bg-muted rounded-xl">
                      <p className="text-sm text-muted-foreground">Card payment processing (mock). Your card will not be charged.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            <OrderSummary items={items} subtotal={totalPrice} discount={discount} shippingFee={shippingFee} grandTotal={grandTotal} />
          </div>
        )}

        {/* Step 3: Confirmation */}
        {step === 3 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircle size={40} className="text-green-600" />
            </div>
            <h2 className="font-heading text-3xl uppercase text-foreground mb-2">Order Placed!</h2>
            <p className="text-muted-foreground mb-2">Your order has been placed successfully.</p>
            <p className="text-sm font-mono text-muted-foreground mb-2">Order ID: {orderId?.slice(0, 8).toUpperCase()}</p>
            {paymentMethod === "gcash" && refNumber && (
              <p className="text-sm text-muted-foreground mb-6">GCash Ref: <span className="font-mono text-primary">{refNumber}</span></p>
            )}
            {paymentMethod === "gcash" && (
              <div className="inline-block bg-blue-50 border border-blue-200 rounded-xl px-6 py-3 mb-6">
                <p className="text-sm text-blue-700">📱 GCash payment will be verified by our team within 24 hours.</p>
              </div>
            )}
            <div className="flex justify-center gap-4">
              <Link to="/my-orders"><Button className="bg-primary text-primary-foreground font-heading uppercase tracking-wider">View Orders</Button></Link>
              <Link to="/shop"><Button variant="outline" className="font-heading uppercase tracking-wider">Continue Shopping</Button></Link>
            </div>
          </div>
        )}

        {/* Navigation */}
        {step < 3 && (
          <div className="flex justify-between mt-8">
            <Button variant="outline" onClick={() => step > 0 ? setStep(step - 1) : navigate("/cart")} className="gap-2 font-heading uppercase tracking-wider">
              <ChevronLeft size={16} /> {step === 0 ? "Back to Cart" : "Back"}
            </Button>
            {step < 2 ? (
              <Button onClick={() => { if (step === 0 && !validateShipping()) return; setStep(step + 1); }} className="gap-2 bg-primary text-primary-foreground font-heading uppercase tracking-wider">
                Continue <ChevronRight size={16} />
              </Button>
            ) : (
              <Button
                onClick={handlePlaceOrder}
                disabled={processing || (paymentMethod === "gcash" && !gcashConfirmed)}
                className="gap-2 bg-primary text-primary-foreground font-heading uppercase tracking-wider disabled:opacity-50">
                {processing ? "Processing..." : `Place Order · ₱${grandTotal.toLocaleString()}`}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const OrderSummary = ({ items, subtotal, discount, shippingFee, grandTotal, voucherCode, setVoucherCode, applyVoucher, appliedVoucher }: any) => (
  <Card className="h-fit sticky top-24">
    <CardHeader><CardTitle className="font-heading uppercase tracking-wider text-sm">Order Summary</CardTitle></CardHeader>
    <CardContent className="space-y-3">
      <div className="space-y-1 text-sm">
        <div className="flex justify-between text-muted-foreground"><span>Subtotal ({items.length} items)</span><span>₱{subtotal.toLocaleString()}</span></div>
        {discount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-₱{discount.toLocaleString()}</span></div>}
        <div className="flex justify-between text-muted-foreground"><span>Shipping</span><span>{shippingFee === 0 ? "Free" : `₱${shippingFee}`}</span></div>
      </div>
      {setVoucherCode && (
        <div className="flex gap-2">
          <Input placeholder="Voucher code" value={voucherCode} onChange={(e: any) => setVoucherCode(e.target.value)} className="text-sm" />
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
