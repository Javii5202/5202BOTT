import ytdl from "ytdl-core";
import yts from "yt-search";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import fs from "fs";
import path from "path";

ffmpeg.setFfmpegPath(ffmpegPath);

export default async function video(sock, from, m, args) {
  try {
    if (!args.length) {
      return sock.sendMessage(from, { text: "❌ Uso: .video <nombre o link>" });
    }

    const query = args.join(" ");
    let url;

    if (ytdl.validateURL(query)) {
      url = query;
    } else {
      const search = await yts(query);
      if (!search.videos.length) {
        return sock.sendMessage(from, { text: "❌ No encontré resultados." });
      }
      url = search.videos[0].url;
    }

    const info = await ytdl.getInfo(url);
    const title = info.videoDetails.title.replace(/[^\w\s]/gi, "");
    const filePath = path.join("downloads", `${title}.mp4`);

    await new Promise((resolve, reject) => {
      ffmpeg(ytdl(url, { quality: "highestvideo" }))
        .videoCodec("libx264")
        .toFormat("mp4")
        .save(filePath)
        .on("end", resolve)
        .on("error", reject);
    });

    await sock.sendMessage(from, {
      video: { url: filePath },
      caption: `🎬 ${info.videoDetails.title}`,
    });

    fs.unlinkSync(filePath);
  } catch (err) {
    console.error("❌ Error en .video:", err);
    await sock.sendMessage(from, { text: "⚠️ Error descargando el video." });
  }
}
