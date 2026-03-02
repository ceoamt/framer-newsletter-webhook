import { createHmac, timingSafeEqual } from "crypto";

export const config = {
  api: { bodyParser: false },
};

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks);
}

function isSignatureValid(secret, submissionId, rawBody, signature) {
  if (!secret || !submissionId || !rawBody || !signature) return false;
  if (typeof signature !== "string" || !signature.startsWith("sha256=")) return false;

  const hmac = createHmac("sha256", secret);
  hmac.update(rawBody);
  hmac.update(submissionId);

  const expected = "sha256=" + hmac.digest("hex");
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;

  return timingSafeEqual(a, b);
}

function extractEmail(payload) {
  // prova campi comuni
  const direct =
    payload?.email ||
    payload?.Email ||
    payload?.fields?.email ||
    payload?.fields?.Email ||
    payload?.data?.email ||
    payload?.data?.Email;

  if (direct) return direct;

  // fallback: cerca la prima stringa che sembra email
  const match = JSON.stringify(payload).match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi);
  return match?.[0] || null;
}

function isValidEmail(email) {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

    const rawBody = await readRawBody(req);

    const signature = req.headers["framer-signature"];
    const submissionId = req.headers["framer-webhook-submission-id"];
    const secret = process.env.FRAMER_WEBHOOK_SECRET;

    if (!secret) return res.status(500).json({ error: "Missing FRAMER_WEBHOOK_SECRET" });

    if (!isSignatureValid(secret, submissionId, rawBody, signature)) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    let payload;
    try {
      payload = JSON.parse(rawBody.toString("utf8"));
    } catch {
      return res.status(400).json({ error: "Invalid JSON" });
    }

    const email = extractEmail(payload);
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: "Missing/invalid email" });
    }

    // ✅ Rispondi subito a Framer
    res.status(200).json({ ok: true });

    // ---- Resend (best effort) ----
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

    const r = await fetchWithTimeout(
      "https://api.resend.com/emails",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendKey}`,
        },
        body: JSON.stringify({ from, to: email, subject, html }),
      },
      4500
    );

    if (!r.ok) {
      const details = await r.text();
      console.error("Resend error:", r.status, details);
    } else {
      console.log("Resend ok -> sent to:", email);
    }
  } catch (err) {
    console.error("Webhook error:", err);
    if (!res.headersSent) res.status(500).json({ error: "Server error" });
  }
}
