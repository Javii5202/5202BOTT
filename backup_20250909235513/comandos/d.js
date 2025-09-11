// comandos/d.js
export default async function demote(sock, from, m, args) {
  const normalizeJid = (jid) => {
    if (!jid) return jid;
    if (jid.endsWith("@g.us")) return jid;
    if (/@/.test(jid)) {
      if (jid.endsWith("@s.whatsapp.net") || jid.endsWith("@c.us")) return jid;
      return jid.replace(/@.*$/, "@s.whatsapp.net");
    }
    if (/^\d+$/.test(jid)) return `${jid}@s.whatsapp.net`;
    return jid;
  };

  const getTargetId = (m, args) => {
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
  };

  console.log("demote command", args);
  const chat = await sock.groupMetadata(from).catch(()=>null);
  if (!chat) return await sock.sendMessage(from, { text: "⚠️ Solo en grupos." });

  const sender = m.key.participant || m.key.remoteJid;
  const isAdmin = chat.participants.some(p => p.id === sender && (p.admin === "admin" || p.admin === "superadmin"));
  if (!isAdmin) return await sock.sendMessage(from, { text: "❌ Solo administradores pueden usar este comando." });

  const target = getTargetId(m, args);
  if (!target) return await sock.sendMessage(from, { text: "⚠️ Menciona o responde al usuario." });

  try {
    await sock.groupParticipantsUpdate(from, [target], "demote");
    await sock.sendMessage(from, { text: `⬇️ @${target.split("@")[0]} ahora es un random.`, mentions: [target] });
  } catch (e) {
    console.error("demote error:", e);
    await sock.sendMessage(from, { text: "❌ No pude degradar al usuario (revisa permisos)." });
  }
}
