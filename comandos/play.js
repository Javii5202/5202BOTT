import ytdl from "ytdl-core";
import yts from "yt-search";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import fs from "fs";
import path from "path";

ffmpeg.setFfmpegPath(ffmpegPath);

export default async function play(sock, from, m, args) {
  try {
    if (!args.length) {
      return sock.sendMessage(from, { text: "❌ Uso: .play <nombre o link>" });
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
    const filePath = path.join("downloads", `${title}.mp3`);

    await new Promise((resolve, reject) => {
      ffmpeg(ytdl(url, { filter: "audioonly" }))
        .audioCodec("libmp3lame")
        .toFormat("mp3")
        .save(filePath)
        .on("end", resolve)
        .on("error", reject);
    });

    await sock.sendMessage(from, {
      audio: { url: filePath },
      mimetype: "audio/mp4",
      ptt: false,
    });

    fs.unlinkSync(filePath);
  } catch (err) {
    console.error("❌ Error en .play:", err);
    await sock.sendMessage(from, { text: "⚠️ Error descargando el audio." });
  }
}
