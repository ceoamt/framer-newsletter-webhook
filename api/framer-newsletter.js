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

    const html =<!DOCTYPE html>
<html lang="it">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Iscrizione confermata</title>
  </head>

  <body style="margin:0;padding:0;background:#f5f7fa;">
    <!-- Preheader -->
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
      Iscrizione confermata. Benvenuto su Colux.
    </div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7fa;padding:40px 12px;">
      <tr>
        <td align="center">
          <!-- Card container -->
          <table role="presentation" width="640" cellpadding="0" cellspacing="0"
            style="width:640px;max-width:640px;background:#ffffff;border:1px solid #eef0f3;border-radius:18px;overflow:hidden;">
            
            <!-- Header with logo -->
            <tr>
              <td style="padding:22px 26px;border-bottom:1px solid #f1f3f6;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="left" style="vertical-align:middle;">
                      <img
                        src="https://framerusercontent.com/images/WbMyWlDT75CfPK3uTQGaEXfp1w.webp?width=300&height=401"
                        width="120"
                        alt="Colux Logo"
                        style="display:block;border:0;outline:none;text-decoration:none;height:auto;"
                      />
                    </td>
                    <td align="right" style="vertical-align:middle;">
                      <a href="https://www.colux.io"
                         style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;
                                font-size:12px;color:#64748b;text-decoration:none;">
                        colux.io
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Main content -->
            <tr>
              <td style="padding:28px 26px 18px 26px;">
                <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
                  
                  <div style="font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#94a3b8;">
                    Newsletter
                  </div>

                  <h1 style="margin:10px 0 0 0;font-size:28px;line-height:1.15;color:#0f172a;font-weight:700;">
                    Grazie per esserti iscritto 👋
                  </h1>

                  <p style="margin:14px 0 0 0;font-size:15px;line-height:1.75;color:#334155;">
                    Iscrizione confermata. Ti scriveremo solo quando abbiamo qualcosa di davvero utile:
                    aggiornamenti di prodotto, nuove feature e contenuti selezionati.
                  </p>

                  <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:18px;">
                    <tr>
                      <td bgcolor="#0f172a" style="border-radius:12px;">
                        <a href="https://www.colux.io"
                           style="display:inline-block;padding:12px 16px;
                                  font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;
                                  font-size:13px;font-weight:600;color:#ffffff;text-decoration:none;">
                          Visita Colux
                        </a>
                      </td>
                    </tr>
                  </table>

                  <p style="margin:18px 0 0 0;font-size:15px;line-height:1.75;color:#334155;">
                    A presto,<br />
                    <strong style="color:#0f172a;">Team Colux</strong>
                  </p>
                </div>
              </td>
            </tr>

            <!-- Footer text -->
            <tr>
              <td style="padding:16px 26px 22px 26px;border-top:1px solid #f1f3f6;">
                <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;
                            font-size:11px;line-height:1.6;color:#94a3b8;">
                  Ricevi questa email perché ti ti sei iscritto alla newsletter.
                </div>
              </td>
            </tr>

          </table>

          <!-- Very small footer -->
          <table role="presentation" width="640" cellpadding="0" cellspacing="0" style="width:640px;max-width:640px;">
            <tr>
              <td align="center" style="padding-top:14px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
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
