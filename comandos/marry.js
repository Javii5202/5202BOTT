// comandos/marry.js
import fs from "fs";
import path from "path";

const DB = path.join(process.cwd(), "parejas.json");

function load() {
  if (!fs.existsSync(DB)) return { parejas: {}, propuestas: {} };
  try { return JSON.parse(fs.readFileSync(DB, "utf8")); } catch { return { parejas: {}, propuestas: {} }; }
}
function save(data) { fs.writeFileSync(DB, JSON.stringify(data, null, 2)); }
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

async function __orig_marry(sock, from, m, args) {

  console.log("marry", args);
  const who = normalizeJid(m.key.participant || m.key.remoteJid);
  const data = load();
  if (!data.parejas[who]) return await sock.sendMessage(from, { text: "❌ No estás en pareja." });

  const parejaId = data.parejas[who].pareja;
  const start = data.parejas[who].fecha;
  if (!start) return await sock.sendMessage(from, { text: "❌ No hay fecha de inicio registrada." });

  const now = Date.now();
  const oneWeek = 7 * 24 * 60 * 60 * 1000;
  if (now - start < oneWeek) return await sock.sendMessage(from, { text: "❌ Deben llevar al menos 1 semana juntos para casarse." });

  data.parejas[who].casados = now;
  if (data.parejas[parejaId]) data.parejas[parejaId].casados = now;
  save(data);

  // textos variados (ejemplo)
  const texts = [
    `💍 @${who.split("@")[0]} y @${parejaId.split("@")[0]} ahora están casados! 🎉`,
    `💒 @${who.split("@")[0]} se casó con @${parejaId.split("@")[0]} — que vivan los novios!`
  ];
  const text = texts[Math.floor(Math.random() * texts.length)];
  await sock.sendMessage(from, { text, mentions: [who, parejaId] });

}


export default async function command_handler(sock, from, m, args, quotedMessage, meta) {
  try {
    return await __orig_marry(sock, from, m, args);
  } catch (err) {
    console.error("Error wrapper ejecutando comando marry.js:", err);
    throw err;
  }
}

