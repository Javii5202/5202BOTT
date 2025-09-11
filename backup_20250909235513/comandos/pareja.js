// comandos/pareja.js
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

export default async function pareja(sock, from, m, args) {
  console.log("pareja", args);
  const target = getTargetId(m, args);
  if (!target) return await sock.sendMessage(from, { text: "❌ Debes mencionar a alguien para proponer." });

  const sender = normalizeJid(m.key.participant || m.key.remoteJid);
  if (sender === target) return await sock.sendMessage(from, { text: "❌ No puedes proponerte a ti mismo." });

  const data = load();
  // ¿ya están pareja?
  if (data.parejas[sender] || data.parejas[target]) return await sock.sendMessage(from, { text: "❌ Alguno ya está en pareja." });

  // ¿target ya tiene propuesta pendiente?
  if (data.propuestas[target]) return await sock.sendMessage(from, { text: "❌ Esa persona ya tiene una propuesta pendiente." });

  data.propuestas[target] = sender;
  save(data);

  // mensaje con menciones: primero receiver, luego proposer
  await sock.sendMessage(from, {
    text: `😍 @${target.split("@")[0]} @${sender.split("@")[0]} — @${sender.split("@")[0]} te propone ser su amorcito! Usa .aceptar @${sender.split("@")[0]} o .rechazar @${sender.split("@")[0]} para responder.`,
    mentions: [target, sender]
  });
}
