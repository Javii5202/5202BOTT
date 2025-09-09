import fs from "fs";
import path from "path";
import ytdl from "ytdl-core";
import ytSearch from "yt-search";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";

const downloadsDir = path.join(process.cwd(), "downloads");
if (!fs.existsSync(downloadsDir)) fs.mkdirSync(downloadsDir);

ffmpeg.setFfmpegPath(ffmpegPath);

export default async function play(sock, from, m, args) {
  const query = args.join(" ").trim();
  if (!query) {
    await sock.sendMessage(from, { text: "🎵 Escribí el nombre de la canción. Ej: `.play nombre`" });
    return;
  }

  try {
    // Buscar video
    const search = await ytSearch(query);
    const video = search.videos[0];
    if (!video) {
      await sock.sendMessage(from, { text: "❌ No encontré nada con ese nombre." });
      return;
    }

    const title = video.title;
    const url = video.url;
    const safeName = title.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 50) + "_" + Date.now();
    const outputPath = path.join(downloadsDir, `${safeName}.mp3`);

    // Descargar y convertir a MP3
    await new Promise((resolve, reject) => {
      ffmpeg(ytdl(url, { filter: "audioonly", quality: "highestaudio" }))
        .audioBitrate(128)
        .save(outputPath)
        .on("end", resolve)
        .on("error", reject);
    });

    const buffer = fs.readFileSync(outputPath);

    // Enviar portada con info
    try {
      const resp = await fetch(video.thumbnail);
      const thumbBuffer = Buffer.from(await resp.arrayBuffer());
      await sock.sendMessage(from, {
        image: thumbBuffer,
        caption: `🎶 *${title}*\n👀 ${video.views} vistas\n📅 ${video.ago}\n🔗 ${url}`,
      });
    } catch {
      await sock.sendMessage(from, { text: `🎶 *${title}*\n🔗 ${url}` });
    }

    // Enviar audio
    await sock.sendMessage(from, {
      audio: buffer,
      mimetype: "audio/mp4",
      fileName: `${title}.mp3`,
    });

    try { fs.unlinkSync(outputPath); } catch {}
    console.log("✅ Audio enviado:", title);

  } catch (err) {
    console.error("❌ Error en .play:", err);
    await sock.sendMessage(from, { text: "❌ Error al descargar el audio." });
  }
}
