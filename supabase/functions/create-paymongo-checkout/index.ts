
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { amount, orderId, customerName, customerEmail, items } = await req.json();

    const SECRET_KEY = Deno.env.get("PAYMONGO_SECRET_KEY")!;
    const BASE64_KEY = btoa(`${SECRET_KEY}:`);

    // Build line items from cart
    const lineItems = items.map((item: any) => ({
      currency: "PHP",
      amount: Math.round(item.price * 100), // centavos
      name: item.name,
      quantity: item.quantity,
    }));

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
              name: customerName,
              email: customerEmail,
            },
            send_email_receipt: true,
            show_description: true,
            show_line_items: true,
            line_items: lineItems,
            // ✅ Supports GCash + Credit/Debit Card + Maya in one page
            payment_method_types: ["gcash", "card", , "grab_pay"],
            description: `Order #${orderId?.slice(0, 8).toUpperCase() || "NEW"}`,
            success_url: `${Deno.env.get("SITE_URL")}/checkout/success?order_id=${orderId}`,
            cancel_url: `${Deno.env.get("SITE_URL")}/checkout/cancel?order_id=${orderId}`,
          },
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("PayMongo error:", data);
      return new Response(JSON.stringify({ error: data.errors?.[0]?.detail || "PayMongo error" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const checkoutUrl = data.data.attributes.checkout_url;
    const sessionId = data.data.id;

    return new Response(JSON.stringify({ checkoutUrl, sessionId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
