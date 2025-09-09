sock.ev.on("messages.upsert", async ({ messages }) => {
  try {
    const m = messages[0];
    if (!m?.message) return;
    if (m.key?.fromMe) return;

    const from = m.key.remoteJid;
    const sender = m.key.participant || m.key.remoteJid;
    const text =
      m.message.conversation ||
      m.message.extendedTextMessage?.text ||
      m.message.imageMessage?.caption ||
      m.message.videoMessage?.caption ||
      "";

    if (!text.startsWith(PREFIX)) return;

    const parts = text.slice(PREFIX.length).trim().split(/ +/);
    const cmd = parts.shift().toLowerCase();
    const args = parts;

    const metadata = from.endsWith("@g.us") ? await sock.groupMetadata(from) : null;
    const participants = metadata?.participants || [];
    const isAdmin = participants.some(p => p.id === sender && p.admin);
    const isOwner = sender === OWNER_NUMBER;

    const comando = comandos[cmd];
    if (comando) {
      console.log(chalk.cyan(`💬 Ejecutando comando: ${cmd} | args: ${args}`));
      // 👇 Llamamos al execute del comando pasando todos los datos
      await comando.execute(sock, { message: m, from, args, isAdmin, isOwner });
    }
  } catch (err) {
    console.error(chalk.red("❌ Error manejando mensaje:"), err);
  }
});

