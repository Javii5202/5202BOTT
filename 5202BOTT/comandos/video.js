// comandos/video.js
const path = require("path");
const fs = require("fs");
const axios = require("axios");
const chalk = require("chalk");
const ytdlp = require("yt-dlp-exec");

const downloadsDir = path.join(__dirname, "../downloads");
if (!fs.existsSync(downloadsDir)) fs.mkdirSync(downloadsDir);

module.exports = async function video(sock, from, message, args) {
  const query = args.join(" ").trim();
  if (!query) {
    await sock.sendMessage(from, { text: "Escribí el nombre del video que querés descargar. Ej: `.video nombre`" });
    return;
  }

  try {
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

    try {
      const resp = await axios.get(thumbnailUrl, { responseType: "arraybuffer" });
      await sock.sendMessage(from, {
        image: Buffer.from(resp.data),
        caption: `🎬 *${title}*\n⏱ Duración: ${duration}\n👁 Vistas: ${views}\n📅 Año: ${uploadDate}\n🔗 ${videoUrl}`
      });
    } catch {
      await sock.sendMessage(from, { text: `Buscando "${query}" en YouTube...` });
    }

    // Descargar mejor video disponible (yt-dlp se encarga)
    try {
      await ytdlp(videoUrl, {
        output: outTemplate,
        format: "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best",
        mergeOutputFormat: "mp4",
        noCallHome: true
      });
    } catch (err) {
      console.warn("Fallo descargar formato MP4 exacto, intentando best fallback...", err?.message || err);
      try {
        await ytdlp(videoUrl, { output: outTemplate, format: "best", noCallHome: true });
      } catch (err2) {
        console.error("Fallo descargar video:", err2);
        await sock.sendMessage(from, { text: "Ocurrió un error al descargar el video." });
        return;
      }
    }

    const files = fs.readdirSync(downloadsDir);
    const match = files.find(f => f.startsWith(safeBase));
    if (!match) {
      await sock.sendMessage(from, { text: "No se encontró el video descargado." });
      return;
    }
    const downloadedFile = path.join(downloadsDir, match);
    const buffer = fs.readFileSync(downloadedFile);
    await sock.sendMessage(from, { video: buffer, mimetype: "video/mp4", fileName: path.basename(downloadedFile) });

    try { fs.unlinkSync(downloadedFile); } catch {}

    console.log(chalk.green(`Video "${title}" enviado correctamente.`));
  } catch (err) {
    console.error(chalk.red("Error al buscar video:"), err);
    await sock.sendMessage(from, { text: "Ocurrió un error al intentar descargar el video." });
  }
};
