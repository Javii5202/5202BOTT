// comandos/recuperar.js
const { jidNormalizedUser, downloadContentFromMessage } = require("@whiskeysockets/baileys");
const path = require("path");
const fs = require("fs");

module.exports = async function recuperar(sock, from, message, args, quoted) {
  try {
    // solo en grupos
    const chat = await sock.groupMetadata(from).catch(()=>null);
    if (!chat) {
      await sock.sendMessage(from, { text: "Este comando solo funciona en grupos." });
      return;
    }

    // quien pidió
    const sender = jidNormalizedUser(message?.key?.participant || message?.key?.remoteJid);
    const isAdmin = chat.participants.some(p => p.id === sender && (p.admin === "admin" || p.admin === "superadmin"));
    if (!isAdmin) {
      await sock.sendMessage(from, { text: "❌ Solo administradores pueden usar este comando." });
      return;
    }

    if (!quoted) {
      await sock.sendMessage(from, { text: "Responde a la imagen o video (de ver una sola vez) usando `.recuperar`." });
      return;
    }

    // determinar tipo
    let type = Object.keys(quoted)[0]; // imageMessage o videoMessage
    if (type !== "imageMessage" && type !== "videoMessage") {
      await sock.sendMessage(from, { text: "Solo se pueden recuperar imágenes o videos." });
      return;
    }

    const stream = await downloadContentFromMessage(quoted[type], type === "imageMessage" ? "image" : "video");
    let buffer = Buffer.from([]);
    for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

    if (type === "imageMessage") {
      await sock.sendMessage(from, { image: buffer });
    } else {
      await sock.sendMessage(from, { video: buffer });
    }
  } catch (err) {
    console.error("Error al recuperar archivo:", err);
    await sock.sendMessage(from, { text: "Ocurrió un error al recuperar la imagen o video." });
  }
};
