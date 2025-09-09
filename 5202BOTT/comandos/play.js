// comandos/play.js
const path = require("path");
const fs = require("fs");
const axios = require("axios");
const chalk = require("chalk");
const ytdlp = require("yt-dlp-exec");

const downloadsDir = path.join(__dirname, "../downloads");
if (!fs.existsSync(downloadsDir)) fs.mkdirSync(downloadsDir);

module.exports = async function play(sock, from, message, args) {
  const query = args.join(" ").trim();
  if (!query) {
    await sock.sendMessage(from, { text: "Escribí el nombre de la canción que querés reproducir. Ej: `.play Duki Goteo`" });
    return;
  }

  try {
    // Buscar (ytsearch1)
    let infoRaw = await ytdlp(`ytsearch1:${query}`, { dumpSingleJson: true, skipDownload: true });
    let info = typeof infoRaw === "string" ? JSON.parse(infoRaw) : infoRaw;
    if (info.entries && info.entries.length) info = info.entries[0];

    const videoId = info.id;
    const title = info.title || "Sin título";
    const thumbnailUrl = info.thumbnail;
    const duration = info.duration_string || "Desconocida";
    const views = info.view_count || "Desconocidas";
    const uploadDate = info.upload_date ? info.upload_date.substring(0,4) : "Desconocido";
    const videoUrl = info.webpage_url || `https://www.youtube.com/watch?v=${videoId}`;

    const safeBase = title.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0,120) + "_" + Date.now();
    const outTemplate = path.join(downloadsDir, `${safeBase}.%(ext)s`);

    // Enviar miniatura/info (intento)
    try {
      const resp = await axios.get(thumbnailUrl, { responseType: "arraybuffer" });
      await sock.sendMessage(from, {
        image: Buffer.from(resp.data),
        caption: `🎵 *${title}*\n⏱ Duración: ${duration}\n👁 Vistas: ${views}\n📅 Año: ${uploadDate}\n🔗 ${videoUrl}`
      });
    } catch {
      await sock.sendMessage(from, { text: `Buscando "${query}" en YouTube...` });
    }

    // Intentar extraer mp3 (requiere ffmpeg). Si falla, fallback a m4a (no requiere ffmpeg normalmente).
    let downloadedFile = null;
    try {
      await ytdlp(videoUrl, {
        output: outTemplate,
        extractAudio: true,
        audioFormat: "mp3",
        noCallHome: true
      });
    } catch (err) {
      console.warn("Fallo extraer mp3 (posible falta ffmpeg). Intentando descargar m4a/bestaudio...", err?.message || err);
      // fallback: descargar mejor audio disponible (m4a preferible)
      try {
        await ytdlp(videoUrl, {
          output: outTemplate,
          format: "bestaudio[ext=m4a]/bestaudio",
          noCallHome: true
        });
      } catch (err2) {
        console.error("Fallo descargar audio alternativo:", err2);
        await sock.sendMessage(from, { text: "Ocurrió un error al descargar la canción." });
        return;
      }
    }

    // Buscar el archivo generado (safeBase.*)
    const files = fs.readdirSync(downloadsDir);
    const match = files.find(f => f.startsWith(safeBase));
    if (!match) {
      await sock.sendMessage(from, { text: "No se encontró el audio descargado." });
      return;
    }
    downloadedFile = path.join(downloadsDir, match);
    const ext = path.extname(downloadedFile).toLowerCase();

    // Enviar audio al chat
    const buffer = fs.readFileSync(downloadedFile);
    const mimetype = ext === ".mp3" ? "audio/mpeg" : (ext === ".m4a" ? "audio/mp4" : "audio/mpeg");
    await sock.sendMessage(from, { audio: buffer, mimetype, fileName: path.basename(downloadedFile) });

    // opcional: limpiar archivo
    try { fs.unlinkSync(downloadedFile); } catch {}

    console.log(chalk.green(`Audio "${title}" enviado correctamente.`));
  } catch (err) {
    console.error(chalk.red("Error al buscar canción:"), err);
    await sock.sendMessage(from, { text: "Ocurrió un error al buscar la canción." });
  }
};
