// comandos/sticker.js
const { downloadContentFromMessage } = require("@whiskeysockets/baileys");
const path = require("path");
const fs = require("fs");
const { exec } = require("child_process");
const downloadsDir = path.join(__dirname, "../downloads");
if (!fs.existsSync(downloadsDir)) fs.mkdirSync(downloadsDir);

async function bufferFromStream(stream) {
  let buff = Buffer.from([]);
  for await (const chunk of stream) buff = Buffer.concat([buff, chunk]);
  return buff;
}

module.exports = async function sticker(sock, from, message, args, quoted) {
  try {
    // quoted es el quotedMessage (imageMessage o videoMessage)
    if (!quoted || (!quoted.imageMessage && !quoted.videoMessage)) {
      await sock.sendMessage(from, { text: "Solo se pueden convertir imágenes o videos en sticker. Responde a uno con `.sticker`." });
      return;
    }

    const type = quoted.imageMessage ? "imageMessage" : "videoMessage";
    const stream = await downloadContentFromMessage(quoted[type], type.replace("Message", ""));
    const buffer = await bufferFromStream(stream);

    const tmpIn = path.join(downloadsDir, `sticker_in_${Date.now()}`);
    const tmpOut = path.join(downloadsDir, `sticker_out_${Date.now()}.webp`);
    fs.writeFileSync(tmpIn, buffer);

    // Intentar convertir con sharp (si existe) para imágenes
    let converted = false;
    try {
      const sharp = require("sharp");
      if (type === "imageMessage") {
        await sharp(tmpIn)
          .resize(512, 512, { fit: "inside" })
          .webp({ lossless: true })
          .toFile(tmpOut);
        converted = true;
      }
    } catch (e) {
      // sharp no disponible o fallo -> se intentará ffmpeg
    }

    if (!converted) {
      // Usar ffmpeg (si está instalado) - para imagen o video (extrae primer frame o convierte video a webp animado)
      await new Promise((resolve, reject) => {
        // for images ffmpeg still works to convert; for videos will create animated webp
        const cmd = `ffmpeg -i "${tmpIn}" -vcodec libwebp -filter:v "scale=512:512:force_original_aspect_ratio=decrease,fps=15" -lossless 1 -q:v 50 -preset default -an "${tmpOut}" -y`;
        exec(cmd, (err, stdout, stderr) => {
          if (err) return reject(err);
          resolve();
        });
      }).catch(async (err) => {
        console.error("Error al convertir a sticker (ffmpeg/sharp faltante):", err?.message || err);
        // limpiar tmpIn
        try { fs.unlinkSync(tmpIn); } catch {}
        await sock.sendMessage(from, { text: "No se pudo crear el sticker: falta `ffmpeg` o `sharp` en el servidor. Instala ffmpeg o agrega la dependencia sharp." });
        return;
      });
    }

    // enviar sticker
    if (fs.existsSync(tmpOut)) {
      await sock.sendMessage(from, { sticker: fs.readFileSync(tmpOut) });
      try { fs.unlinkSync(tmpIn); } catch {}
      try { fs.unlinkSync(tmpOut); } catch {}
      console.log("Sticker enviado correctamente.");
    } else {
      try { fs.unlinkSync(tmpIn); } catch {}
      await sock.sendMessage(from, { text: "No se pudo crear el sticker." });
    }
  } catch (err) {
    console.error("Error en sticker.js:", err);
    await sock.sendMessage(from, { text: "Ocurrió un error al crear el sticker." });
  }
};
