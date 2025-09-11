import axios from "axios";
import * as cheerio from "cheerio";

export default async function imagen(sock, from, m, args) {
  try {
    if (!args.length) {
      await sock.sendMessage(from, { text: "⚠️ Uso: .imagen <término>" });
      return;
    }
    const query = args.join(" ");
    const url = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}`;
    const { data } = await axios.get(url, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    const $ = cheerio.load(data);
    const img = $("img").eq(1).attr("src");
    if (!img) throw new Error("No se encontró imagen");
    await sock.sendMessage(from, { image: { url: img }, caption: `🖼️ Resultado: ${query}` });
  } catch (err) {
    await sock.sendMessage(from, { text: "❌ No pude obtener la imagen." });
  }
}