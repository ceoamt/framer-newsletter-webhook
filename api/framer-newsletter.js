export const config = {
  api: { bodyParser: false },
};

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  try {
    const raw = await readRawBody(req);
    const text = raw.toString("utf8");

    console.log("=== FRAMER WEBHOOK DEBUG ===");
    console.log("METHOD:", req.method);
    console.log("HEADERS:", JSON.stringify(req.headers));
    console.log("RAW BODY:", text);

    // prova anche a parsare JSON se lo è
    try {
      const parsed = JSON.parse(text);
      console.log("PARSED JSON:", JSON.stringify(parsed));
    } catch {
      console.log("PARSED JSON: (not valid JSON)");
    }

    // IMPORTANT: rispondi 200 così Framer non blocca il submit
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("DEBUG ERROR:", err);
    return res.status(200).json({ ok: true });
  }
}
