// comandos/warn.js
import fs from "fs";
import path from "path";

const DB = path.join(process.cwd(), "warns.json");

function loadDB() {
  if (!fs.existsSync(DB)) return {};
  try { return JSON.parse(fs.readFileSync(DB, "utf8")); } catch { return {}; }
}
function saveDB(data) { fs.writeFileSync(DB, JSON.stringify(data, null, 2)); }

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

export default async function warn(sock, from, m, args) {
  console.log("warn command", args);
  // solo en grupos
  const chat = await sock.groupMetadata(from).catch(()=>null);
  if(!chat) return await sock.sendMessage(from, { text: "⚠️ Este comando solo funciona en grupos." });

  const sender = m.key.participant || m.key.remoteJid;
  const isAdmin = chat.participants.some(p => p.id === sender && (p.admin === "admin" || p.admin === "superadmin"));
  if (!isAdmin) return await sock.sendMessage(from, { text: "❌ Solo administradores pueden usar este comando." });

  const target = getTargetId(m, args);
  if (!target) return await sock.sendMessage(from, { text: "⚠️ Menciona o responde al usuario a quien querés advertir." });

  const db = loadDB();
  db[from] = db[from] || {};
  db[from][target] = (db[from][target] || 0) + 1;
  saveDB(db);

  const count = db[from][target];
  await sock.sendMessage(from, {
    text: `⚠️ Usuario @${target.split("@")[0]} recibió un warn.\nTotal: ${count}`,
    mentions: [target]
  });

  if (count >= 3) {
    try {
      await sock.groupParticipantsUpdate(from, [target], "remove");
      db[from][target] = 0;
      saveDB(db);
      await sock.sendMessage(from, { text: `🚨 Usuario @${target.split("@")[0]} expulsado por 3 warns.`, mentions: [target] });
    } catch (e) {
      console.error("No pude expulsar al usuario:", e);
      await sock.sendMessage(from, { text: "❌ No pude expulsar al usuario (revisa permisos del bot)." });
    }
  }
}
