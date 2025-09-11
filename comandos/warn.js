import fs from 'fs';
import path from 'path';
const WARN_FILE = path.join(process.cwd(),'warns.json');
function load() { try { return JSON.parse(fs.readFileSync(WARN_FILE,'utf8')||'{}'); } catch(e){ return {}; } }
function save(d){ fs.writeFileSync(WARN_FILE, JSON.stringify(d,null,2)); }

export default async function warn(sock, from, m, args) {
  try {
    const mentions = m.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const target = mentions[0] || args[0];
    if (!target) return await sock.sendMessage(from, { text: '❌ Menciona o responde el usuario a amonestar.' });
    const jid = target.includes('@') ? target : (target + '@s.whatsapp.net');
    const data = load();
    data[jid] = (data[jid]||0) + 1;
    save(data);
    await sock.sendMessage(from, { text: `⚠️ Usuario ${jid} ahora tiene ${data[jid]} warn(s).` });
  } catch (err) {
    console.error('Error en warn:',err);
    await sock.sendMessage(from, { text: '❌ Error en Warn.' });
  }
}