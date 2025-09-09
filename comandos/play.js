import fs from "fs";
import path from "path";
import axios from "axios";
import ytdlp from "yt-dlp-exec";

const downloadsDir = path.join(process.cwd(), "downloads");

export default async function play(sock, from, m, args) {
  const query = args.join(" ").trim();
  if (!query) return await sock.sendMessage(from, { text: "❌ Escribí el nombre de la canción. Ej: `.play Duki Goteo`" });

  try {
    // Buscar la canción en YouTube
    let infoRaw = await ytdlp(`ytsearch1:${query}`, { dumpSingleJson: true, skipDownload: true });
    let info = typeof infoRaw === "string" ? JSON.parse(infoRaw) : infoRaw;
    if (info.entries?.length) info = info.entries[0];

    const title = info.title || "Sin título";
    const videoUrl = info.webpage_url;

    // Nombre seguro para archivo
    const safeBase = title.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 120) + "_" + Date.now();
    const outFile = path.join(downloadsDir, `${safeBase}.mp3`);

    // Descargar audio
    await ytdlp(videoUrl, {
      output: outFile,
      extractAudio: true,
      audioFormat: "mp3",
      noCallHome: true
    });

    // Enviar audio
    const buffer = fs.readFileSync(outFile);
    await sock.sendMessage(from, { audio: buffer, mimetype: "audio/mpeg", fileName: `${title}.mp3` });

    // Eliminar temporal
    fs.unlinkSync(outFile);

  } catch (err) {
    console.error("Error en .play:", err);
    await sock.sendMessage(from, { text: "❌ Ocurrió un error al buscar o descargar la canción." });
  }
}
