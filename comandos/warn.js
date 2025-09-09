// comandos/warn.js
import fs from 'fs';
import path from 'path';

const warnsPath = path.join('./assets/warns.json');

export default async function warn(sock, from, m, args) {
  const chat = await sock.groupMetadata(from).catch(() => null);
  if (!chat) return sock.sendMessage(from, { text: "⚠️ Este comando solo funciona en grupos." });

  const sender = m.key.participant || m.key.remoteJid;
  const isAdmin = chat.participants.some(p => p.id === sender && (p.admin === "admin" || p.admin === "superadmin"));
  if (!isAdmin) return sock.sendMessage(from, { text: "❌ Solo admins pueden usar este comando." });

  const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || args[0];
  if (!mentioned) return sock.sendMessage(from, { text: "⚠️ Menciona a alguien para advertir." });

  // Leer warns desde archivo
  let warnsDB = {};
  if (fs.existsSync(warnsPath)) warnsDB = JSON.parse(fs.readFileSync(warnsPath, 'utf-8'));

  if (!warnsDB[mentioned]) warnsDB[mentioned] = 0;
  warnsDB[mentioned] += 1;

  fs.writeFileSync(warnsPath, JSON.stringify(warnsDB, null, 2));

  sock.sendMessage(from, { text: `⚠️ Usuario <@${mentioned.split("@")[0]}> recibió un warn.\nTotal: ${warnsDB[mentioned]}`, mentions: [mentioned] });
}
