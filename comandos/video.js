import ytsr from "ytsr";
import ytdl from "@distube/ytdl-core";
import fs from "fs";
import path from "path";

export default async function video(sock, from, m, args) {
  try {
    if (!args || args.length === 0) {
      await sock.sendMessage(from, { text: "❌ Debes escribir el nombre de un video." }, { quoted: m });
      return;
    }

    const query = args.join(" ");
    const searchResults = await ytsr(query, { limit: 1 });
    if (!searchResults.items || searchResults.items.length === 0) {
      await sock.sendMessage(from, { text: "❌ Video no encontrado." }, { quoted: m });
      return;
    }

    const video = searchResults.items[0];
    const url = video.url;

    const filePath = path.join("/tmp", `video_${Date.now()}.mp4`);
    const stream = ytdl(url, {
      filter: "videoandaudio",
      quality: "highest",
      highWaterMark: 1 << 25,
    });

    await new Promise((resolve, reject) => {
      const writeStream = fs.createWriteStream(filePath);
      stream.pipe(writeStream);
      writeStream.on("finish", resolve);
      writeStream.on("error", reject);
    });

    await sock.sendMessage(from, {
      video: { url: filePath },
      caption: `📹 ${video.title}`,
    }, { quoted: m });

    fs.unlinkSync(filePath);

  } catch (err) {
    console.error("❌ Error en .video:", err);
    await sock.sendMessage(from, { text: "❌ Error descargando el video." }, { quoted: m });
  }
}
