// comandos/invocar.js
async function __orig_invocar(sock, from, m, args) {

  // Obtener metadata del grupo
  const chat = await sock.groupMetadata(from).catch(()=>null);
  if (!chat) return await sock.sendMessage(from, { text: "⚠️ Este comando solo funciona en grupos." });

  // Verificar si el sender es admin
  const sender = m.key.participant || m.key.remoteJid;
  const isAdmin = chat.participants.some(p => p.id === sender && (p.admin === "admin" || p.admin === "superadmin"));
  if (!isAdmin) return await sock.sendMessage(from, { text: "❌ Solo administradores pueden usar este comando." });

  // Texto opcional
  const text = args.join(" ").trim() || "";
  
  // Obtener todos los miembros del grupo
  const members = chat.participants.map(p => p.id);
  if (!members.length) return await sock.sendMessage(from, { text: "⚠️ No hay miembros en el grupo para invocar." });

  // Crear mensaje con menciones
  const msg = `${text ? text + ": " : ""}${members.map(m => "@" + m.split("@")[0]).join(" ")}`;

  await sock.sendMessage(from, { text: msg, mentions: members });

}


export default async function command_handler(sock, from, m, args, quotedMessage, meta) {
  try {
    return await __orig_invocar(sock, from, m, args);
  } catch (err) {
    console.error("Error wrapper ejecutando comando invocar.js:", err);
    throw err;
  }
}

