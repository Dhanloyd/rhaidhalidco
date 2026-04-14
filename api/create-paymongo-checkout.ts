
import type { VercelRequest, VercelResponse } from "@vercel/node";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// ✅ Helper to apply CORS headers to every response
function setCors(res: VercelResponse) {
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // ✅ Handle preflight OPTIONS request
  if (req.method === "OPTIONS") {
    res.writeHead(200, corsHeaders);
    res.end();
    return;
  }

  // ✅ Always set CORS headers (including on error responses)
  setCors(res);

  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      amount,
      orderId,
      customerName,
      customerEmail,
      items,
      siteUrl, // ✅ received from frontend (window.location.origin)
    } = req.body;

    // ✅ Validate required fields
    if (!orderId || !customerName || !customerEmail || !items?.length) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const SECRET_KEY = process.env.PAYMONGO_SECRET_KEY!;
    if (!SECRET_KEY) {
      return res.status(500).json({ error: "PayMongo secret key not configured" });
    }

    const BASE64_KEY = Buffer.from(`${SECRET_KEY}:`).toString("base64");

    const lineItems = items.map((item: any) => ({
      currency: "PHP",
      amount: Math.round(item.price * 100), // convert to centavos
      name: item.name,
      quantity: item.quantity,
    }));

    // ✅ Use siteUrl from frontend, fallback to env var, then hardcoded domain
    const resolvedSiteUrl =
      siteUrl ||
      process.env.SITE_URL ||
      "https://rhaidhalidco.vercel.app";

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
            payment_method_types: ["gcash", "card", "grab_pay"],
            description: `Order #${orderId?.slice(0, 8).toUpperCase() || "NEW"}`,
            success_url: `${resolvedSiteUrl}/checkout/success?order_id=${orderId}`,
            cancel_url: `${resolvedSiteUrl}/checkout/cancel?order_id=${orderId}`,
          },
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("PayMongo error:", JSON.stringify(data, null, 2));
      return res.status(400).json({
        error: data.errors?.[0]?.detail || "PayMongo error",
      });
    }

    const checkoutUrl = data.data.attributes.checkout_url;
    const sessionId = data.data.id;

    return res.status(200).json({ checkoutUrl, sessionId });

  } catch (err: any) {
    console.error("Server error:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
}
