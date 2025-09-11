export default async function k(sock, from, m, args) {
  try {
    if (!from.endsWith('@g.us')) return await sock.sendMessage(from, { text: '⚠️ Este comando solo funciona en grupos.' });
    const metadata = await sock.groupMetadata(from);
    const sender = m.key.participant || m.key.remoteJid;
    const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';
    const botIsAdmin = metadata.participants.some(p => p.id === botId && (p.admin === 'admin' || p.admin === 'superadmin'));
    if (!botIsAdmin) return await sock.sendMessage(from, { text: '❌ Necesito ser admin para expulsar usuarios.' });
    const isAdmin = metadata.participants.some(p => p.id === sender && (p.admin === 'admin' || p.admin === 'superadmin'));
    if (!isAdmin) return await sock.sendMessage(from, { text: '❌ Solo los administradores pueden usar este comando.' });

    // target puede ser m.message.extendedTextMessage.contextInfo.mentionedJid o reply
    let target = null;
    const ctx = m.message.extendedTextMessage?.contextInfo;
    if (ctx?.mentionedJid && ctx.mentionedJid.length) target = ctx.mentionedJid[0];
    else if (ctx?.participant) target = ctx.participant;
    else if (args && args.length) {
      let a = args[0];
      if (!a.includes('@')) a = a + '@s.whatsapp.net';
      target = a;
    }

    if (!target) return await sock.sendMessage(from, { text: '❌ Debes mencionar o responder el mensaje del usuario a expulsar.' });

    // don't allow kicking owner or self
    if (target === botId) return await sock.sendMessage(from, { text: '❌ No puedo expulsarme a mi mismo.' });
    if (target === sender) return await sock.sendMessage(from, { text: '⚠️ No puedes expulsarte.' });
    if (target === (process.env.OWNER_NUMBER || '')) return await sock.sendMessage(from, { text: '❌ No puedes expulsar al owner.' });

    await sock.groupParticipantsUpdate(from, [target], 'remove');
    await sock.sendMessage(from, { text: '✅ Usuario expulsado.' });
  } catch (err) {
    console.error('Error en comando .k:', err);
    await sock.sendMessage(from, { text: '❌ Error intentando expulsar.' });
  }
}