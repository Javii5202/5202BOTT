// comandos/k.js
async function __orig_kick(sock, from, m, args) {

  const chat = await sock.groupMetadata(from).catch(() => null);
  if (!chat) return sock.sendMessage(from, { text: "⚠️ Este comando solo funciona en grupos." });

  const sender = m.key.participant || m.key.remoteJid;
  const botNumber = sock.user.id.split(":")[0] + "@s.whatsapp.net";

  const botIsAdmin = chat.participants.some(p => p.id === botNumber && (p.admin === "admin" || p.admin === "superadmin"));
  if (!botIsAdmin) return sock.sendMessage(from, { text: "❌ No puedo expulsar: no soy admin del grupo." });

  const isAdmin = chat.participants.some(p => p.id === sender && (p.admin === "admin" || p.admin === "superadmin"));
  if (!isAdmin) return sock.sendMessage(from, { text: "❌ Solo admins pueden usar este comando." });

  const mention = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || args[0];
  if (!mention) return sock.sendMessage(from, { text: "⚠️ Menciona a alguien para expulsar." });

  try {
    await sock.groupParticipantsUpdate(from, [mention], "remove");
    sock.sendMessage(from, { text: `✅ Usuario <@${mention.split("@")[0]}> expulsado.`, mentions: [mention] });
  } catch (err) {
    sock.sendMessage(from, { text: `❌ Error expulsando: ${err.message}` });
  }

}


export default async function command_handler(sock, from, m, args, quotedMessage, meta) {
  try {
    return await __orig_kick(sock, from, m, args);
  } catch (err) {
    console.error("Error wrapper ejecutando comando k.js:", err);
    throw err;
  }
}

