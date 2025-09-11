import fs from 'fs';
import path from 'path';
const WARN_FILE = path.join(process.cwd(),'warns.json');
function load() { try { return JSON.parse(fs.readFileSync(WARN_FILE,'utf8')||'{}'); } catch(e){ return {}; } }
function save(d){ fs.writeFileSync(WARN_FILE, JSON.stringify(d,null,2)); }

export default async function unwarn(sock, from, m, args) {
  try {
    const mentions = m.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const target = mentions[0] || args[0];
    if (!target) return await sock.sendMessage(from, { text: '❌ Menciona o responde el usuario a remover warn.' });
    const jid = target.includes('@') ? target : (target + '@s.whatsapp.net');
    const data = load();
    if (!data[jid]) return await sock.sendMessage(from, { text: 'ℹ️ El usuario no tiene warns.' });
    data[jid] = Math.max(0, (data[jid]||0)-1);
    save(data);
    await sock.sendMessage(from, { text: `✅ Warn removido. Ahora tiene ${data[jid]} warn(s).` });
  } catch (err) {
    console.error('Error en unwarn:',err);
    await sock.sendMessage(from, { text: '❌ Error en Unwarn.' });
  }
}