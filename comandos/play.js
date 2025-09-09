import fs from "fs";
import path from "path";
import ytdl from "ytdl-core";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import axios from "axios";

ffmpeg.setFfmpegPath(ffmpegPath);

const downloadsDir = path.join(process.cwd(), "downloads");
if (!fs.existsSync(downloadsDir)) fs.mkdirSync(downloadsDir);

export default async function play(sock, from, m, args) {
  const query = args.join(" ").trim();
  if (!query) {
    return await sock.sendMessage(from, { text: "❌ Escribí el nombre de la canción. Ejemplo: `.play Duki Goteo`" });
  }

  try {
    // Buscar en YouTube usando yts
    const yts = (await import('yt-search')).default;
    const searchResult = await yts(query);
    if (!searchResult || !searchResult.videos.length) 
      return await sock.sendMessage(from, { text: "❌ No se encontró la canción." });

    const video = searchResult.videos[0];
    const title = video.title;
    const videoUrl = video.url;

    // Nombre seguro para el archivo
    const safeBase = title.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 120) + "_" + Date.now();
    const outputPath = path.join(downloadsDir, `${safeBase}.mp3`);

    // Enviar miniatura mientras se descarga
    try {
      const resp = await axios.get(video.thumbnail, { responseType: "arraybuffer" });
      await sock.sendMessage(from, {
        image: Buffer.from(resp.data),
        caption: `🎵 ${title}\n🔗 ${videoUrl}`
      });
    } catch {
      await sock.sendMessage(from, { text: `🎵 Buscando "${query}" en YouTube...` });
    }

    // Descargar y convertir a mp3
    await new Promise((resolve, reject) => {
      ffmpeg(ytdl(videoUrl, { filter: "audioonly" }))
        .audioBitrate(128)
        .save(outputPath)
        .on("end", resolve)
        .on("error", reject);
    });

    // Leer archivo y enviar
    const buffer = fs.readFileSync(outputPath);
    await sock.sendMessage(from, {
      audio: buffer,
      mimetype: "audio/mpeg",
      fileName: path.basename(outputPath)
    });

    // Eliminar archivo temporal
    fs.unlinkSync(outputPath);

  } catch (err) {
    console.error("Error en .play:", err);
    await sock.sendMessage(from, { text: "❌ Ocurrió un error al buscar o descargar la canción." });
  }
}
