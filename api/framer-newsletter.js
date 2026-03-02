export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).send("Method Not Allowed");
    }

    const body = req.body;
    const email = body?.Email;

    if (!email) {
      return res.status(400).json({ error: "Missing email" });
    }

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
     html: 
    <!DOCTYPE html>
    <html>
      <body style="margin:0;padding:0;background:#f5f7fa;">
        <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;background:#f5f7fa;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0"
                style="background:#ffffff;border-radius:12px;border:1px solid #eee;">
                <tr>
                  <td style="padding:30px;font-family:Arial;">
                    <h1 style="margin:0 0 15px 0;color:#111;">
                      Grazie per esserti iscritto 👋
                    </h1>
                    <p style="margin:0 0 15px 0;color:#444;">
                      Iscrizione confermata.
                    </p>
                    <p style="margin:0;color:#444;">
                      A presto,<br><strong>Team Colux</strong>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `,
}),
    const responseText = await r.text();
    console.log("RESEND STATUS:", r.status);
    console.log("RESEND RESPONSE:", responseText);

    return res.status(200).json({ ok: true });

  } catch (err) {
    console.error("Webhook crash:", err);
    return res.status(500).json({ error: "Server error" });
  }
}
