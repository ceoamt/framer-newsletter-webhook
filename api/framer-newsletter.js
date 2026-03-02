// api/framer-newsletter.js (CommonJS)

module.exports = async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      res.statusCode = 405;
      return res.end("Method Not Allowed");
    }

    // Vercel (API routes) di solito ti parse-a già JSON.
    // Ma Framer può mandare raw string: gestiamo entrambe.
    let body = req.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch (e) {
        res.statusCode = 400;
        return res.end("Invalid JSON");
      }
    }

    const email = body && (body.Email || body.email);
    if (!email) {
      res.statusCode = 400;
      return res.end("Missing email");
    }

    const resendKey = process.env.RESEND_API_KEY;
    const from = process.env.MAIL_FROM;

    if (!resendKey || !from) {
      console.log("Missing env", { resendKey: !!resendKey, from: !!from });
      res.statusCode = 500;
      return res.end("Server misconfigured");
    }

    const html = `<!DOCTYPE html>
<html lang="it">
  <body style="margin:0;padding:0;background:#f5f7fa;font-family:Arial,sans-serif;">
    <div style="max-width:600px;margin:0 auto;background:#fff;border:1px solid #eef0f3;border-radius:14px;padding:28px;">
      <div style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#94a3b8;">Colux</div>
      <h1 style="margin:10px 0 0 0;font-size:24px;color:#0f172a;">Grazie per esserti iscritto 👋</h1>
      <p style="margin:14px 0 0 0;font-size:15px;line-height:1.7;color:#334155;">
        Iscrizione confermata. Ti scriveremo solo quando abbiamo qualcosa di davvero utile.
      </p>
      <p style="margin:18px 0 0 0;font-size:15px;line-height:1.7;color:#334155;">
        A presto,<br><strong style="color:#0f172a;">Team Colux</strong>
      </p>
      <hr style="border:none;border-top:1px solid #eef0f3;margin:20px 0;">
      <p style="margin:0;font-size:11px;line-height:1.6;color:#94a3b8;">
        Ricevi questa email perché ti sei iscritto alla newsletter.
      </p>
    </div>
  </body>
</html>`;

    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from,
        to: email,
        subject: "Grazie per esserti iscritto!",
        html,
      }),
    });

    const text = await r.text();
    console.log("RESEND STATUS:", r.status);
    console.log("RESEND RESPONSE:", text);

    // Framer vuole 2xx per conferma submit
    res.statusCode = 200;
    return res.end("ok");
  } catch (err) {
    console.error("Webhook error:", err);
    res.statusCode = 500;
    return res.end("error");
  }
};
