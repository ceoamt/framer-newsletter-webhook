// api/framer-newsletter.js

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

  // fallback: cerca una stringa che sembri email in tutto il payload
  const allStrings = JSON.stringify(payload).match(
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi
  );
  return allStrings?.[0] || null;
}

function getProvidedSecret(req, body) {
  // 1) Authorization: Bearer <secret>
  const authHeader = req.headers["authorization"] || "";
  const secretFromAuth = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  // 2) Alcuni header possibili (Framer o reverse proxies)
  const secretFromHeader =
    req.headers["x-framer-secret"] ||
    req.headers["x-webhook-secret"] ||
    req.headers["x-hook-secret"] ||
    req.headers["x-framer-webhook-secret"];

  // 3) Possibili campi nel body
  const secretFromBody =
    body?.secret ||
    body?.webhookSecret ||
    body?.token ||
    body?.auth ||
    body?.authorization;

  return secretFromAuth || secretFromHeader || secretFromBody || null;
}

function isValidEmail(email) {
  // Validazione semplice (abbastanza per un form)
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).send("Method Not Allowed");
    }

    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    // --- AUTH ---
    const expected = process.env.FRAMER_WEBHOOK_SECRET;
    const provided = getProvidedSecret(req, body);

    // Se hai impostato FRAMER_WEBHOOK_SECRET, allora lo richiediamo.
    if (expected && provided !== expected) {
      return res.status(401).json({
        error: "Unauthorized",
        hint: "Webhook secret missing or invalid",
      });
    }

    // --- INPUT ---
    const email = pickEmail(body);

    if (!isValidEmail(email)) {
      return res.status(400).json({
        error: "Missing or invalid email in payload",
      });
    }

    // --- RESEND CONFIG ---
    const resendKey = process.env.RESEND_API_KEY;
    const from = process.env.MAIL_FROM;

    if (!resendKey) {
      return res.status(500).json({ error: "Server misconfigured: RESEND_API_KEY missing" });
    }
    if (!from) {
      return res.status(500).json({ error: "Server misconfigured: MAIL_FROM missing" });
    }

    // --- EMAIL CONTENT ---
    const subject = "Grazie per esserti iscritto!";
    const html = `
      <div style="font-family:-apple-system,Segoe UI,Roboto,Arial;line-height:1.6">
        <h2 style="margin:0 0 12px 0;">Grazie per l’iscrizione 👋</h2>
        <p style="margin:0 0 12px 0;">Iscrizione confermata. Ti scriveremo solo quando abbiamo qualcosa di utile.</p>
        <p style="margin:0;">A presto,<br><strong>Team Colux</strong></p>
      </div>
    `;

    // --- SEND ---
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from,
        to: email,
        subject,
        html,
      }),
    });

    if (!r.ok) {
      const details = await r.text();
      return res.status(502).json({
        error: "Resend error",
        details,
      });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({
      error: "Internal error",
      details: err?.message || String(err),
    });
  }
}
