import ytsr from "ytsr";
import ytdl from "@distube/ytdl-core";
import fs from "fs";
import path from "path";

export default async function play(sock, from, m, args) {
  try {
    if (!args || args.length === 0) {
      await sock.sendMessage(from, { text: "❌ Debes escribir el nombre de una canción." }, { quoted: m });
      return;
    }

    const query = args.join(" ");
    const searchResults = await ytsr(query, { limit: 1 });
    if (!searchResults.items || searchResults.items.length === 0) {
      await sock.sendMessage(from, { text: "❌ Canción no encontrada." }, { quoted: m });
      return;
    }

    const song = searchResults.items[0];
    const url = song.url;

    const filePath = path.join("/tmp", `audio_${Date.now()}.mp3`);
    const stream = ytdl(url, {
      filter: "audioonly",
      quality: "highestaudio",
      highWaterMark: 1 << 25,
    });

    await new Promise((resolve, reject) => {
      const writeStream = fs.createWriteStream(filePath);
      stream.pipe(writeStream);
      writeStream.on("finish", resolve);
      writeStream.on("error", reject);
    });

    await sock.sendMessage(from, {
      audio: { url: filePath },
      mimetype: "audio/mp4",
      ptt: false,
    }, { quoted: m });

    fs.unlinkSync(filePath); // limpiar tmp

  } catch (err) {
    console.error("❌ Error en .play:", err);
    await sock.sendMessage(from, { text: "❌ Error descargando la canción." }, { quoted: m });
  }
}
