// Endpoint: accept a JSON body with { imageData: dataUrl, fileName }
// Saves image under /static/uploads and returns { ok: true, url }
import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { imageData, fileName } = req.body || {};
  if (!imageData) return res.status(400).json({ error: "Missing imageData" });

  const matches = imageData.match(
    /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/,
  );
  if (!matches) return res.status(400).json({ error: "Invalid data URL" });

  const mime = matches[1];
  const b64 = matches[2];
  const ext = mime.split("/")[1] || "png";
  const buffer = Buffer.from(b64, "base64");

  const uploadsDir = path.join(process.cwd(), "static", "uploads");
  try {
    fs.mkdirSync(uploadsDir, { recursive: true });
  } catch (e) {
    // ignore
  }

  const safeName = fileName
    ? path.basename(fileName).replace(/[^a-zA-Z0-9.\-_]/g, "_")
    : `popup.${ext}`;
  const outName = `${Date.now()}-${safeName}`;
  const outPath = path.join(uploadsDir, outName);

  try {
    fs.writeFileSync(outPath, buffer);
  } catch (err) {
    console.error("Failed to save uploaded popup image:", err);
    return res
      .status(500)
      .json({ error: "Failed to save file", detail: err.message });
  }

  const url = `/static/uploads/${outName}`;
  return res.status(200).json({ ok: true, url });
}
