import fs from 'fs';
import path from 'path';
import ytSearch from 'yt-search';
import ytdlp from 'yt-dlp-exec';
const TMP = '/tmp';

export default async function video(sock, from, m, args) {
  try {
    const query = args.join(' ').trim();
    if (!query) return await sock.sendMessage(from, { text: '❌ Uso: .video <título o link>' });
    let url = query;
    if (!/^https?:\/\//i.test(query)) {
      const r = await ytSearch(query);
      const first = r && r.videos && r.videos.length ? r.videos[0] : null;
      if (!first) return await sock.sendMessage(from, { text: '❌ Video no encontrado.' });
      url = first.url;
    }
    const out = path.join(TMP, `video_${Date.now()}.mp4`);
    await ytdlp(url, { output: out, format: 'mp4', quiet: true, noWarnings: true, preferFreeFormats: true });
    await sock.sendMessage(from, { video: { url: out }, caption: '📹 Video' });
    try { fs.unlinkSync(out); } catch(e) {}
  } catch (err) {
    console.error('Error en .video:', err);
    await sock.sendMessage(from, { text: '❌ Error descargando el video.' });
  }
}