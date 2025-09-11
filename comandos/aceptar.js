// comandos/aceptar.js
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
function getTargetId(m, args) {
  const mentions = m?.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
  if (mentions.length) return normalizeJid(mentions[0]);
  const participant = m?.message?.extendedTextMessage?.contextInfo?.participant;
  if (participant) return normalizeJid(participant);
  if (args && args[0]) {
    let a = args[0].replace(/^@/, "");
    if (/^\d+$/.test(a)) return normalizeJid(`${a}@s.whatsapp.net`);
    if (/@/.test(a)) return normalizeJid(a);
  }
  return null;
}

async function __orig_aceptar(sock, from, m, args) {

  console.log("aceptar", args);
  const proposer = getTargetId(m, args); // quien propuso
  const receiver = normalizeJid(m.key.participant || m.key.remoteJid); // quien acepta (quien usa el comando)

  if (!proposer) return await sock.sendMessage(from, { text: "❌ Debes mencionar a quien te propuso." });

  const data = load();
  if (!data.propuestas[receiver] || data.propuestas[receiver] !== proposer) {
    return await sock.sendMessage(from, { text: "❌ No tienes ninguna propuesta pendiente de esa persona." });
  }

  // crear relación
  const now = Date.now();
  data.parejas[receiver] = { pareja: proposer, fecha: now };
  data.parejas[proposer] = { pareja: receiver, fecha: now };
  delete data.propuestas[receiver];
  save(data);

  await sock.sendMessage(from, {
    text: `💞 @${proposer.split("@")[0]} y @${receiver.split("@")[0]} ahora son pareja!`,
    mentions: [proposer, receiver]
  });

}


export default async function command_handler(sock, from, m, args, quotedMessage, meta) {
  try {
    return await __orig_aceptar(sock, from, m, args);
  } catch (err) {
    console.error("Error wrapper ejecutando comando aceptar.js:", err);
    throw err;
  }
}

