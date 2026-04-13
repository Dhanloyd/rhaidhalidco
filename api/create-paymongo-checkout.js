export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end();

  try {
    const { amount, orderId, customerName, customerEmail, items } = req.body;

    const SECRET_KEY = process.env.PAYMONGO_SECRET_KEY;
    const BASE64_KEY = Buffer.from(`${SECRET_KEY}:`).toString("base64");

    const response = await fetch("https://api.paymongo.com/v1/checkout_sessions", {
      method: "POST",
      headers: {
        Authorization: `Basic ${BASE64_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        data: {
          attributes: {
            billing: { name: customerName, email: customerEmail },
            send_email_receipt: true,
            show_description: true,
            show_line_items: true,
            line_items: items.map((item) => ({
              currency: "PHP",
              amount: Math.round(item.price * 100),
              name: item.name,
              quantity: item.quantity,
            })),
            payment_method_types: ["gcash", "card", "grab_pay"],
            description: `Order #${orderId?.slice(0, 8).toUpperCase()}`,
           success_url: `${process.env.SITE_URL}/?checkout=success&order_id=${orderId}`,
cancel_url: `${process.env.SITE_URL}/?checkout=cancel&order_id=${orderId}`,
          },
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(400).json({ error: data.errors?.[0]?.detail || "PayMongo error" });
    }

    return res.status(200).json({
      checkoutUrl: data.data.attributes.checkout_url,
      sessionId: data.data.id,
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}