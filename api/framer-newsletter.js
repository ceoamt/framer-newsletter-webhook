// api/framer-newsletter.js

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).send("Method Not Allowed");
    }

    const body = req.body;

    const email =
      body?.email ||
      body?.fields?.email ||
      body?.data?.email;

    if (!email) {
      return res.status(400).json({ error: "Missing email" });
    }

    // 🚨 QUI NON CI SONO IF CHE BLOCCANO
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: process.env.MAIL_FROM,
        to: email,
        subject: "Grazie per esserti iscritto!",
        html: "<p>Iscrizione confermata 👋</p>",
      }),
    });

    const responseText = await r.text();
    console.log("RESEND STATUS:", r.status);
    console.log("RESEND RESPONSE:", responseText);

    return res.status(200).json({ ok: true });

  } catch (err) {
    console.error("Webhook crash:", err);
    return res.status(500).json({ error: "Server error" });
  }
}
