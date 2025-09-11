import fetch from "node-fetch";

export default {
  name: "imagen",
  description: "Busca una imagen en Google y la envía",
  async execute(sock, m, args) {
    if (!args.length) {
      return sock.sendMessage(m.key.remoteJid, { text: "❌ Usa: .imagen <búsqueda>" });
    }

    const query = args.join(" ");
    try {
      const url = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(query)}&cx=${process.env.GOOGLE_CX}&searchType=image&key=${process.env.GOOGLE_API_KEY}`;
      const res = await fetch(url);
      const data = await res.json();

      if (!data.items || !data.items.length) {
        return sock.sendMessage(m.key.remoteJid, { text: "❌ No encontré imágenes." });
      }

      const imageUrl = data.items[0].link;
      await sock.sendMessage(m.key.remoteJid, { image: { url: imageUrl }, caption: `🖼 Resultado para: ${query}` });
    } catch (err) {
      console.error("Error en .imagen:", err);
      await sock.sendMessage(m.key.remoteJid, { text: "⚠️ Error buscando la imagen." });
    }
  }
};