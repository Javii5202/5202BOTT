// comandos/parejastats.js
import fs from "fs";
import path from "path";

const DB = path.join(process.cwd(), "parejas.json");

function load() {
  if (!fs.existsSync(DB)) return { parejas: {}, propuestas: {} };
  try { return JSON.parse(fs.readFileSync(DB, "utf8")); } catch { return { parejas: {}, propuestas: {} }; }
}
function normalizeJid(jid) {
  if (!jid) return jid;
  if (jid.endsWith("@g.us")) return jid;
  if (/@/.test(jid)) {
    if (jid.endsWith("@s.whatsapp.net") || jid.endsWith("@c.us")) return jid;
    return jid.replace(/@.*$/, "@s.whatsapp.net");
  }
  if (/^\d+$/.test(jid)) return `${jid}@s.whatsapp.net`;
  return jid;
}

async function __orig_parejastats(sock, from, m, args) {

  const mentions = m?.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
  const userId = normalizeJid(mentions[0] || m.key.participant || m.key.remoteJid);

  const data = load();
  if (!data.parejas[userId]) return await sock.sendMessage(from, { text: "❌ Esta persona no tiene pareja registrada." });

  const parejaId = data.parejas[userId].pareja;
  const startTime = data.parejas[userId].fecha;
  if (!parejaId || !startTime) return await sock.sendMessage(from, { text: "❌ No hay información completa de la pareja." });

  let diff = Date.now() - startTime;
  const weeks = Math.floor(diff / (1000 * 60 * 60 * 24 * 7));
  diff -= weeks * (1000 * 60 * 60 * 24 * 7);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  diff -= days * (1000 * 60 * 60 * 24);
  const hours = Math.floor(diff / (1000 * 60 * 60));
  diff -= hours * (1000 * 60 * 60);
  const minutes = Math.floor(diff / (1000 * 60));
  diff -= minutes * (1000 * 60);
  const seconds = Math.floor(diff / 1000);

  await sock.sendMessage(from, {
    text: `💞 @${userId.split("@")[0]} y @${parejaId.split("@")[0]} llevan:\n${weeks} semanas, ${days} días, ${hours} horas, ${minutes} minutos y ${seconds} segundos juntos.`,
    mentions: [userId, parejaId]
  });

}


export default async function command_handler(sock, from, m, args, quotedMessage, meta) {
  try {
    return await __orig_parejastats(sock, from, m, args);
  } catch (err) {
    console.error("Error wrapper ejecutando comando parejastats.js:", err);
    throw err;
  }
}

