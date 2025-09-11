import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import util from 'util';
import ytSearch from 'yt-search';
import ytdlp from 'yt-dlp-exec';
const execFileP = util.promisify(execFile);

const TMP = '/tmp';
export default async function play(sock, from, m, args) {
  try {
    const query = args.join(' ').trim();
    if (!query) return await sock.sendMessage(from, { text: '❌ Uso: .play <título o link>' });
    // If it's a URL, use directly; otherwise search
    let url = query;
    if (!/^https?:\/\//i.test(query)) {
      const r = await ytSearch(query);
      const first = r && r.videos && r.videos.length ? r.videos[0] : null;
      if (!first) return await sock.sendMessage(from, { text: '❌ Canción no encontrada.' });
      url = first.url;
    }
    const out = path.join(TMP, `audio_${Date.now()}.mp3`);
    // Use yt-dlp to extract audio as mp3
    await ytdlp(url, { output: out, extractAudio: true, audioFormat: 'mp3', quiet: true, noWarnings: true, preferFreeFormats: true });
    // send as audio via file URL
    await sock.sendMessage(from, { audio: { url: out }, mimetype: 'audio/mpeg' });
    try { fs.unlinkSync(out); } catch(e) {}
  } catch (err) {
    console.error('Error en .play:', err);
    await sock.sendMessage(from, { text: '❌ Error descargando la canción.' });
  }
}