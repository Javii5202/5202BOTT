import { downloadContentFromMessage } from "@whiskeysockets/baileys";
import fs from "fs";
import path from "path";
import { exec } from "child_process";

const downloadsDir = path.join(process.cwd(), "downloads");
if (!fs.existsSync(downloadsDir)) fs.mkdirSync(downloadsDir);

async function bufferFromStream(stream) {
  let buff = Buffer.from([]);
  for await (const chunk of stream) buff = Buffer.concat([buff, chunk]);
  return buff;
}

export default async function sticker(sock, from, m, args, quoted) {
  try {
    // Debe responder a una imagen o video
    if (!quoted || (!quoted.imageMessage && !quoted.videoMessage)) {
      return await sock.sendMessage(from, {
        text: "❌ Solo se pueden convertir imágenes o videos en sticker. Responde a uno con `.sticker`."
      });
    }

    const type = quoted.imageMessage ? "imageMessage" : "videoMessage";
    const stream = await downloadContentFromMessage(quoted[type], type.replace("Message", ""));
    const buffer = await bufferFromStream(stream);

    const tmpIn = path.join(downloadsDir, `sticker_in_${Date.now()}`);
    const tmpOut = path.join(downloadsDir, `sticker_out_${Date.now()}.webp`);
    fs.writeFileSync(tmpIn, buffer);

    let converted = false;

    // Intentar con sharp si es imagen
    try {
      const sharp = await import("sharp");
      if (type === "imageMessage") {
        await sharp.default(tmpIn)
          .resize(512, 512, { fit: "inside" })
          .webp({ lossless: true })
          .toFile(tmpOut);
        converted = true;
      }
    } catch (e) {
      // Si falla, intentará ffmpeg
    }

    if (!converted) {
      // Usar ffmpeg
      await new Promise((resolve, reject) => {
        const cmd = `ffmpeg -i "${tmpIn}" -vcodec libwebp -filter:v "scale=512:512:force_original_aspect_ratio=decrease,fps=15" -lossless 1 -q:v 50 -preset default -an "${tmpOut}" -y`;
        exec(cmd, (err) => err ? reject(err) : resolve());
      }).catch(async (err) => {
        console.error("Error al convertir a sticker (ffmpeg/sharp faltante):", err?.message || err);
        try { fs.unlinkSync(tmpIn); } catch {}
        return await sock.sendMessage(from, {
          text: "❌ No se pudo crear el sticker: falta `ffmpeg` o `sharp`."
        });
      });
    }

    // Enviar sticker
    if (fs.existsSync(tmpOut)) {
      await sock.sendMessage(from, { sticker: fs.readFileSync(tmpOut) });
      try { fs.unlinkSync(tmpIn); } catch {}
      try { fs.unlinkSync(tmpOut); } catch {}
      console.log("Sticker enviado correctamente.");
    } else {
      try { fs.unlinkSync(tmpIn); } catch {}
      await sock.sendMessage(from, { text: "❌ No se pudo crear el sticker." });
    }

  } catch (err) {
    console.error("Error en sticker.js:", err);
    await sock.sendMessage(from, { text: "❌ Ocurrió un error al crear el sticker." });
  }
}
