import fs from "fs";
import path from "path";

const DB = path.join(process.cwd(), "warns.json");

function loadDB() {
  if (!fs.existsSync(DB)) return {};
  try { return JSON.parse(fs.readFileSync(DB, "utf8")); } catch { return {}; }
}

async function __orig_listadv(sock, from, m, args) {

  const chat = await sock.groupMetadata(from).catch(() => null);
  if (!chat) return await sock.sendMessage(from, { text: "⚠️ Este comando funciona solo en grupos." });

  const db = loadDB();
  const warnsForChat = db[from] || {};
  const keys = Object.keys(warnsForChat);
  if (!keys.length) return await sock.sendMessage(from, { text: "📋 No hay warns registrados en este grupo." });

  let msg = "📋 Warns en este grupo:\n\n";
  for (const user of keys) {
    msg += `- @${user.split("@")[0]}: ${warnsForChat[user]}\n`;
  }

  await sock.sendMessage(from, { text: msg, mentions: keys });

}


export default async function command_handler(sock, from, m, args, quotedMessage, meta) {
  try {
    return await __orig_listadv(sock, from, m, args);
  } catch (err) {
    console.error("Error wrapper ejecutando comando listadv.js:", err);
    throw err;
  }
}

