const { downloadContentFromMessage } = require("@whiskeysockets/baileys");
const { Writable } = require("stream");
const fs = require("fs");
const path = require("path");

module.exports = async function recuperar(sock, from, quoted) {
    try {
        if (!quoted) {
            await sock.sendMessage(from, { text: "Debes responder a la imagen o video de ver una sola vez." });
            return;
        }

        // Identificar tipo de mensaje
        let type = Object.keys(quoted)[0]; // imageMessage o videoMessage
        if (type !== "imageMessage" && type !== "videoMessage") {
            await sock.sendMessage(from, { text: "Solo se pueden recuperar imágenes o videos de ver una sola vez." });
            return;
        }

        // Descargar contenido
        const stream = await downloadContentFromMessage(quoted[type], type === "imageMessage" ? "image" : "video");
        let buffer = Buffer.from([]);
        for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

        // Enviar al chat
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

