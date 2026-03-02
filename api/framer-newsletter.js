// api/framer-newsletter.js

function pickEmail(payload) {
  return (
    payload?.email ||
    payload?.Email ||
    payload?.fields?.email ||
    payload?.fields?.Email ||
    payload?.data?.email ||
    payload?.data?.Email ||
    null
  );
}

function isValidEmail(email) {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).send("Method Not Allowed");
    }

    const body = req.body;

    // 🔐 Controllo secret semplice
    const providedSecret =
      req.headers["authorization"]?.replace("Bearer ", "") ||
      req.headers["x-webhook-secret"] ||
      body?.secret ||
      null;

    const expectedSecret = process.env.FRAMER_WEBHOOK_SECRET;

    if (!expectedSecret || providedSecret !== expectedSecret) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const email = pickEmail(body);

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: "Invalid email" });
    }

    // ✅ Rispondi subito a Framer
    res.status(200).json({ ok: true });

    // ✉️ Invia email (non bloccare il submit)
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: process.env.MAIL_FROM,
          to: email,
          subject: "Grazie per esserti iscritto!",
          html: `
            <div style="font-family:Arial;line-height:1.6">
              <h2>Grazie per l’iscrizione 👋</h2>
              <p>Iscrizione confermata.</p>
              <p>A presto,<br><strong>Team Colux</strong></p>
            </div>
          `,
        }),
      });
    } catch (err) {
      console.error("Resend error:", err);
    }
  } catch (err) {
    console.error("Webhook crash:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Server error" });
    }
  }
}
