
import type { VercelRequest, VercelResponse } from "@vercel/node";

// ✅ CORS headers — fixes the "blocked by CORS policy" error
const corsHeaders = {
  "Access-Control-Allow-Origin": "https://rhaidhalidco.vercel.app", // or replace * with your exact domain e.g. "https://rhaidhalidco.vercel.app"
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // ✅ Handle preflight OPTIONS request (browser sends this before POST)
  if (req.method === "OPTIONS") {
    res.writeHead(200, corsHeaders);
    res.end();
    return;
  }

  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Set CORS headers on every response
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  try {
    const { amount, orderId, customerName, customerEmail, items } = req.body;

    const SECRET_KEY = process.env.PAYMONGO_SECRET_KEY!;
    const BASE64_KEY = Buffer.from(`${SECRET_KEY}:`).toString("base64");

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
            payment_method_types: ["gcash", "card", "maya", "grab_pay"],
            description: `Order #${orderId?.slice(0, 8).toUpperCase() || "NEW"}`,
            success_url: `${process.env.SITE_URL}/checkout/success?order_id=${orderId}`,
            cancel_url: `${process.env.SITE_URL}/checkout/cancel?order_id=${orderId}`,
          },
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("PayMongo error:", data);
      return res.status(400).json({ error: data.errors?.[0]?.detail || "PayMongo error" });
    }

    const checkoutUrl = data.data.attributes.checkout_url;
    const sessionId = data.data.id;

    return res.status(200).json({ checkoutUrl, sessionId });

  } catch (err: any) {
    console.error("Server error:", err);
    return res.status(500).json({ error: err.message });
  }
}
</parameter>
