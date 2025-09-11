export default async function invocar(sock, from, m, args) {
  try {
    const metadata = await sock.groupMetadata(from);
    const participantes = metadata.participants.map(p => p.id);
    const mentions = participantes;
    await sock.sendMessage(from, {
      text: "🚨 Invocación general 🚨",
      mentions
    });
  } catch (err) {
    await sock.sendMessage(from, { text: "❌ Error al invocar" });
  }
}