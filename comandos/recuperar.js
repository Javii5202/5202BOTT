import { jidNormalizedUser, downloadContentFromMessage } from "@whiskeysockets/baileys";

async function __orig_recuperar(sock, from, m, args, quoted) {

  try {
    // Solo en grupos
    const chat = await sock.groupMetadata(from).catch(() => null);
    if (!chat) {
      return await sock.sendMessage(from, { text: "❌ Este comando solo funciona en grupos." });
    }

    // Quien pidió el comando
    const sender = jidNormalizedUser(m.key.participant || m.key.remoteJid);
    const isAdmin = chat.participants.some(
      p => p.id === sender && (p.admin === "admin" || p.admin === "superadmin")
    );
    if (!isAdmin) {
      return await sock.sendMessage(from, { text: "❌ Solo administradores pueden usar este comando." });
    }

    // Debe responder a un mensaje
    if (!quoted) {
      return await sock.sendMessage(from, { text: "❌ Responde a la imagen o video (de ver una sola vez) usando `.recuperar`." });
    }

    // Determinar tipo
    const type = Object.keys(quoted)[0]; // imageMessage o videoMessage
    if (type !== "imageMessage" && type !== "videoMessage") {
      return await sock.sendMessage(from, { text: "❌ Solo se pueden recuperar imágenes o videos." });
    }

    // Descargar contenido
    const stream = await downloadContentFromMessage(quoted[type], type === "imageMessage" ? "image" : "video");
    let buffer = Buffer.from([]);
    for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

    // Enviar archivo recuperado
    if (type === "imageMessage") {
      await sock.sendMessage(from, { image: buffer });
    } else {
      await sock.sendMessage(from, { video: buffer });
    }

  } catch (err) {
    console.error("Error en .recuperar:", err);
    await sock.sendMessage(from, { text: "❌ Ocurrió un error al recuperar la imagen o video." });
  }

}


export default async function command_handler(sock, from, m, args, quotedMessage, meta) {
  try {
    return await __orig_recuperar(sock, from, m, args, quotedMessage);
  } catch (err) {
    console.error("Error wrapper ejecutando comando recuperar.js:", err);
    throw err;
  }
}

