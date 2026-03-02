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
        <!DOCTYPE html>
<html lang="it">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Grazie per esserti iscritto</title>
  </head>

  <body style="margin:0;padding:0;background:#f5f7fa;">
    <!-- Preheader -->
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
      Iscrizione confermata. Ti scriveremo solo quando abbiamo qualcosa di utile.
    </div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7fa;padding:36px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0"
            style="width:600px;max-width:600px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #eef0f3;">

            <!-- Header -->
            <tr>
              <td style="padding:28px 28px 10px 28px;">
                <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
                  <div style="font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#94a3b8;">
                    Colux
                  </div>
                  <h1 style="margin:10px 0 0 0;font-size:24px;line-height:1.2;color:#0f172a;font-weight:650;">
                    Grazie per esserti iscritto 👋
                  </h1>
                </div>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding:0 28px 22px 28px;">
                <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#334155;font-size:15px;line-height:1.75;">
                  <p style="margin:12px 0 0 0;">
                    Iscrizione confermata.
                  </p>
                  <p style="margin:12px 0 0 0;">
                    Ti scriveremo solo quando abbiamo qualcosa di davvero utile: novità, release e contenuti selezionati.
                  </p>
                  <p style="margin:18px 0 0 0;">
                    A presto,<br />
                    <strong style="color:#0f172a;">Team Colux</strong>
                  </p>
                </div>
              </td>
            </tr>

            <!-- Optional CTA -->
            <tr>
              <td align="center" style="padding:0 28px 26px 28px;">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td bgcolor="#0f172a" style="border-radius:10px;">
                      <a href="https://colux.io"
                        style="display:inline-block;padding:12px 18px;
                               font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;
                               font-size:13px;font-weight:600;color:#ffffff;text-decoration:none;">
                        Visita Colux
                      </a>
                    </td>
                  </tr>
                </table>
                <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;font-size:12px;color:#94a3b8;margin-top:10px;">
                  Se non ti interessa, ignora pure questa mail.
                </div>
              </td>
            </tr>

            <!-- Divider -->
            <tr>
              <td style="padding:0 28px;">
                <hr style="border:none;border-top:1px solid #eef0f3;margin:0;" />
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding:16px 28px 22px 28px;">
                <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;font-size:11px;line-height:1.6;color:#94a3b8;">
                  Ricevi questa email perché ti sei iscritto alla newsletter.
                </div>
              </td>
            </tr>

          </table>

          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;">
            <tr>
              <td align="center" style="padding:14px 6px 0 6px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
                <div style="font-size:11px;line-height:1.6;color:#cbd5e1;">
                  © Colux
                </div>
              </td>
            </tr>
          </table>

        </td>
      </tr>
    </table>
  </body>
</html>
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
