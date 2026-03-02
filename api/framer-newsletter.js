// api/framer-newsletter.js
import crypto from "crypto";

function isWebhookSignatureValid(secret, submissionId, payloadBuffer, signature) {
  if (!secret || !submissionId || !payloadBuffer || !signature) return false;
  if (typeof signature !== "string" || !signature.startsWith("sha256=")) return false;

  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(payloadBuffer);
  hmac.update(submissionId);

  const expected = "sha256=" + hmac.digest("hex");

  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

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

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks);
}

async function sendWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
}

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

    // 1) Raw body (serve per la firma)
    const rawBody = await readRawBody(req);

    // 2) Headers Framer
    const signature = req.headers["framer-signature"];
    const submissionId = req.headers["framer-webhook-submission-id"];

    const secret = process.env.FRAMER_WEBHOOK_SECRET;
    if (!secret) {
      return res.status(500).json({ error: "Server misconfigured: FRAMER_WEBHOOK_SECRET missing" });
    }

    const okSig = isWebhookSignatureValid(secret, submissionId, rawBody, signature);
    if (!okSig) {
      // Questo causa il “requires authentication”
      return res.status(401).json({ error: "Unauthorized", hint: "Invalid Framer signature" });
    }

    // 3) Parse JSON
    let body;
    try {
      body = JSON.parse(rawBody.toString("utf8"));
    } catch {
      return res.status(400).json({ error: "Invalid JSON payload" });
    }

    const email = pickEmail(body);
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: "Missing or invalid email" });
    }

    // 4) Rispondi SUBITO 200 a Framer (così la conferma submit funziona sempre)
    res.status(200).json({ ok: true });

    // 5) Invio email (best effort)
    const resendKey = process.env.RESEND_API_KEY;
    const from = process.env.MAIL_FROM;

    if (!resendKey || !from) {
      console.error("Missing RESEND_API_KEY or MAIL_FROM");
      return;
    }

    const subject = "Grazie per esserti iscritto!";
    const html = `
      <div style="font-family:-apple-system,Segoe UI,Roboto,Arial;line-height:1.6">
        <h2 style="margin:0 0 12px 0;">Grazie per l’iscrizione 👋</h2>
        <p style="margin:0 0 12px 0;">Iscrizione confermata. Ti scriveremo solo quando abbiamo qualcosa di utile.</p>
        <p style="margin:0;">A presto,<br><strong>Team Colux</strong></p>
      </div>
    `;

    try {
      const r = await sendWithTimeout(
        "https://api.resend.com/emails",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendKey}`,
          },
          body: JSON.stringify({ from, to: email, subject, html }),
        },
        4000 // 4s max, poi basta
      );

      if (!r.ok) {
        const details = await r.text();
        console.error("Resend error:", r.status, details);
      }
    } catch (e) {
      console.error("Resend request failed:", e?.message || e);
    }
  } catch (err) {
    // Se siamo qui, probabilmente non abbiamo ancora risposto.
    if (!res.headersSent) {
      return res.status(500).json({ error: "Internal error", details: err?.message || String(err) });
    }
    console.error("Post-response error:", err?.message || err);
  }
}
