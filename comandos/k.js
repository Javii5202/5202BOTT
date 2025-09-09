// comandos/k.js
import fs from "fs";
import path from "path";

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

export default async function k(sock, from, m, args) {
  console.log("k command", args);
  const chat = await sock.groupMetadata(from).catch(()=>null);
  if (!chat) return await sock.sendMessage(from, { text: "⚠️ Solo en grupos." });

  const sender = m.key.participant || m.key.remoteJid;
  const isAdmin = chat.participants.some(p => p.id === sender && (p.admin === "admin" || p.admin === "superadmin"));
  if (!isAdmin) return await sock.sendMessage(from, { text: "❌ Solo admins pueden expulsar." });

  const target = getTargetId(m, args);
  if (!target) return await sock.sendMessage(from, { text: "⚠️ Menciona o responde al usuario a expulsar." });

  try {
    await sock.groupParticipantsUpdate(from, [target], "remove");
    await sock.sendMessage(from, { text: `👋 Usuario @${target.split("@")[0]} fue expulsado.`, mentions: [target] });
  } catch (e) {
    console.error("Error expulsando:", e);
    await sock.sendMessage(from, { text: "❌ No pude expulsar al usuario (revisa permisos del bot)." });
  }
}
