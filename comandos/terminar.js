// comandos/terminar.js
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

async function __orig_terminar(sock, from, m, args) {

  console.log("terminar", args);
  const who = normalizeJid(m.key.participant || m.key.remoteJid);
  const data = load();
  if (!data.parejas[who]) return await sock.sendMessage(from, { text: "❌ No estás en pareja." });

  const parejaId = data.parejas[who].pareja;
  delete data.parejas[who];
  if (data.parejas[parejaId]) delete data.parejas[parejaId];
  save(data);

  await sock.sendMessage(from, {
    text: `😢 @${who.split("@")[0]} y @${parejaId.split("@")[0]} se separaron.`,
    mentions: [who, parejaId]
  });

}


export default async function command_handler(sock, from, m, args, quotedMessage, meta) {
  try {
    return await __orig_terminar(sock, from, m, args);
  } catch (err) {
    console.error("Error wrapper ejecutando comando terminar.js:", err);
    throw err;
  }
}

