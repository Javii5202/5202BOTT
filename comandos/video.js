import fs from "fs";
import path from "path";
import axios from "axios";
import ytdlp from "yt-dlp-exec";

const downloadsDir = path.join(process.cwd(), "downloads");

export default async function video(sock, from, m, args) {
  const query = args.join(" ").trim();
  if (!query) return await sock.sendMessage(from, { text: "❌ Escribí el nombre del video. Ej: `.video nombre`" });

  try {
    // Buscar video en YouTube
    let infoRaw = await ytdlp(`ytsearch1:${query}`, { dumpSingleJson: true, skipDownload: true });
    let info = typeof infoRaw === "string" ? JSON.parse(infoRaw) : infoRaw;
    if (info.entries?.length) info = info.entries[0];

    const title = info.title || "Sin título";
    const videoUrl = info.webpage_url;
    const thumbnailUrl = info.thumbnail;
    const duration = info.duration_string || "Desconocida";

    const safeBase = title.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 120) + "_" + Date.now();
    const outFile = path.join(downloadsDir, `${safeBase}.mp4`);

    // Enviar thumbnail mientras descarga
    try {
      const resp = await axios.get(thumbnailUrl, { responseType: "arraybuffer" });
      await sock.sendMessage(from, {
        image: Buffer.from(resp.data),
        caption: `🎬 ${title}\n⏱ Duración: ${duration}\n🔗 ${videoUrl}`
      });
    } catch {
      await sock.sendMessage(from, { text: `Buscando "${query}" en YouTube...` });
    }

    // Descargar video
    await ytdlp(videoUrl, {
      output: outFile,
      format: "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best",
      mergeOutputFormat: "mp4",
      noCallHome: true
    });

    // Enviar video
    const buffer = fs.readFileSync(outFile);
    await sock.sendMessage(from, { video: buffer, mimetype: "video/mp4", fileName: `${title}.mp4` });

    // Eliminar temporal
    fs.unlinkSync(outFile);

  } catch (err) {
    console.error("Error en .video:", err);
    await sock.sendMessage(from, { text: "❌ Ocurrió un error al descargar el video." });
  }
}
