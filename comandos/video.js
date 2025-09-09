import fs from "fs";
import path from "path";
import ytdl from "ytdl-core";
import ytSearch from "yt-search";

const downloadsDir = path.join(process.cwd(), "downloads");
if (!fs.existsSync(downloadsDir)) fs.mkdirSync(downloadsDir);

export default async function video(sock, from, m, args) {
  const query = args.join(" ").trim();
  if (!query) {
    await sock.sendMessage(from, { text: "📹 Escribí el nombre del video. Ej: `.video nombre`" });
    return;
  }

  try {
    // Buscar video
    const search = await ytSearch(query);
    const vid = search.videos[0];
    if (!vid) {
      await sock.sendMessage(from, { text: "❌ No encontré nada con ese nombre." });
      return;
    }

    const title = vid.title;
    const url = vid.url;
    const safeName = title.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 50) + "_" + Date.now();
    const outputPath = path.join(downloadsDir, `${safeName}.mp4`);

    // Descargar video
    await new Promise((resolve, reject) => {
      ytdl(url, { quality: "highest" })
        .pipe(fs.createWriteStream(outputPath))
        .on("finish", resolve)
        .on("error", reject);
    });

    const buffer = fs.readFileSync(outputPath);

    // Enviar miniatura con detalles
    try {
      const resp = await fetch(vid.thumbnail);
      const thumbBuffer = Buffer.from(await resp.arrayBuffer());
      await sock.sendMessage(from, {
        image: thumbBuffer,
        caption: `🎬 *${title}*\n⏱ ${vid.timestamp}\n👀 ${vid.views} vistas\n📅 ${vid.ago}\n🔗 ${url}`,
      });
    } catch {
      await sock.sendMessage(from, { text: `🎬 *${title}*\n🔗 ${url}` });
    }

    // Enviar video
    await sock.sendMessage(from, {
      video: buffer,
      mimetype: "video/mp4",
      fileName: `${title}.mp4`,
    });

    try { fs.unlinkSync(outputPath); } catch {}
    console.log("✅ Video enviado:", title);

  } catch (err) {
    console.error("❌ Error en .video:", err);
    await sock.sendMessage(from, { text: "❌ Error al descargar el video." });
  }
}
