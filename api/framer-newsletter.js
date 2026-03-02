function pickEmail(payload) {
  const candidates = [
    payload?.email,
    payload?.Email,
    payload?.fields?.email,
    payload?.fields?.Email,
    payload?.data?.email,
    payload?.data?.Email,
  ].filter(Boolean);

  if (candidates[0]) return candidates[0];

  const allStrings = JSON.stringify(payload).match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi);
  return allStrings?.[0] || null;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  const authHeader = req.headers["authorization"] || "";
  const secretFromAuth = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const secretFromHeader = req.headers["x-framer-secret"] || req.headers["x-webhook-secret"];
  const providedSecret = secretFromAuth || secretFromHeader || null;

  if (process.env.FRAMER_WEBHOOK_SECRET && providedSecret !== process.env.FRAMER_WEBHOOK_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  const email = pickEmail(body);

  if (!email) return res.status(400).json({ error: "Missing email in payload", body });

  const subject = "Grazie per esserti iscritto!";
  const html = `
    <div style="font-family:-apple-system,Segoe UI,Roboto,Arial;line-height:1.6">
      <h2>Grazie per l’iscrizione 👋</h2>
      <p>Iscrizione confermata. Ti scriveremo solo quando abbiamo qualcosa di utile.</p>
      <p>A presto,<br><strong>Team Colux</strong></p>
    </div>
  `;

  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: process.env.MAIL_FROM,
      to: email,
      subject,
      html,
    }),
  });

  if (!r.ok) {
    const details = await r.text();
    return res.status(500).json({ error: "Resend error", details });
  }

  return res.status(200).json({ ok: true });
}
