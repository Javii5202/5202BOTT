export default {
  name: "invocar",
  description: "Menciona a todos los participantes del grupo",
  async execute(sock, m, args) {
    if (!m.key.remoteJid.endsWith("@g.us")) {
      return sock.sendMessage(m.key.remoteJid, { text: "❌ Este comando solo funciona en grupos." });
    }

    const metadata = await sock.groupMetadata(m.key.remoteJid);
    const participants = metadata.participants.map(p => p.id);
    const mensaje = `📢 Invocación realizada por @${m.key.participant.split("@")[0]}`;

    await sock.sendMessage(m.key.remoteJid, {
      text: mensaje,
      mentions: participants
    });
  }
};