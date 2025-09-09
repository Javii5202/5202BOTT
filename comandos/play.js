import fs from "fs";
import path from "path";
import axios from "axios";
import ytdlp from "yt-dlp-exec";

// Carpeta donde se guardarán los mp3 temporales
const downloadsDir = path.join(process.cwd(), "downloads");
if (!fs.existsSync(downloadsDir)) fs.mkdirSync(downloadsDir);

export default async function play(sock, from, m, args) {
  const query = args.join(" ").trim();
  if (!query) {
    return await sock.sendMessage(from, { text: "❌ Escribí el nombre de la canción. Ejemplo: `.play Duki Goteo`" });
  }

  try {
    // Buscar la canción en YouTube
    let infoRaw = await ytdlp(`ytsearch1:${query}`, { dumpSingleJson: true, skipDownload: true });
    let info = typeof infoRaw === "string" ? JSON.parse(infoRaw) : infoRaw;
    if (info.entries?.length) info = info.entries[0];

    const title = info.title || "Sin título";
    const videoUrl = info.webpage_url;

    // Nombre seguro para el archivo
    const safeBase = title.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 120) + "_" + Date.now();
    const outTemplate = path.join(downloadsDir, `${safeBase}.%(ext)s`);

    // Enviar miniatura mientras se descarga
    try {
      const resp = await axios.get(info.thumbnail, { responseType: "arraybuffer" });
      await sock.sendMessage(from, {
        image: Buffer.from(resp.data),
        caption: `🎵 ${title}\n🔗 ${videoUrl}`
      });
    } catch {
      await sock.sendMessage(from, { text: `🎵 Buscando "${query}" en YouTube...` });
    }

    // Descargar audio en mp3
    await ytdlp(videoUrl, {
      output: outTemplate,
      extractAudio: true,
      audioFormat: "mp3",
      noCallHome: true
    });

    // Encontrar archivo descargado
    const files = fs.readdirSync(downloadsDir);
    const match = files.find(f => f.startsWith(safeBase));
    if (!match) return await sock.sendMessage(from, { text: "❌ No se encontró el audio descargado." });

    const downloadedFile = path.join(downloadsDir, match);
    const buffer = fs.readFileSync(downloadedFile);

    // Enviar audio
    await sock.sendMessage(from, {
      audio: buffer,
      mimetype: "audio/mpeg",
      fileName: path.basename(downloadedFile)
    });

    // Eliminar archivo temporal
    fs.unlinkSync(downloadedFile);

  } catch (err) {
    console.error("Error en .play:", err);
    await sock.sendMessage(from, { text: "❌ Ocurrió un error al buscar o descargar la canción." });
  }
}
