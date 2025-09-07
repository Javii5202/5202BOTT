const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");
const chalk = require("chalk");
const { downloadContentFromMessage } = require("@whiskeysockets/baileys");

const downloadsDir = path.join(__dirname, "../downloads");
if (!fs.existsSync(downloadsDir)) fs.mkdirSync(downloadsDir);

async function sticker(sock, from, quoted) {
    try {
        if (!quoted || (!quoted.imageMessage && !quoted.videoMessage)) {
            await sock.sendMessage(from, { text: "Solo se pueden convertir imágenes o videos en sticker. Responde a uno." });
            return;
        }

        // Determinar tipo de mensaje
        const type = quoted.imageMessage ? "imageMessage" : "videoMessage";
        const stream = await downloadContentFromMessage(quoted[type], type.replace("Message", ""));
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }

        const inputName = path.join(downloadsDir, `sticker_${Date.now()}.tmp`);
        const outputName = path.join(downloadsDir, `sticker_${Date.now()}.webp`);

        fs.writeFileSync(inputName, buffer);

        // Comando FFmpeg robusto
        const ffmpegCmd = `ffmpeg -i "${inputName}" -vcodec libwebp -filter:v "scale=512:512:force_original_aspect_ratio=decrease,fps=15" -lossless 1 -q:v 50 -preset default -an "${outputName}"`;

        exec(ffmpegCmd, async (err) => {
            fs.unlinkSync(inputName);

            if (err) {
                console.error(chalk.red("Error al convertir a sticker:"), err);
                await sock.sendMessage(from, { text: "Ocurrió un error al crear el sticker." });
                return;
            }

            if (fs.existsSync(outputName)) {
                await sock.sendMessage(from, {
                    sticker: fs.readFileSync(outputName)
                });
                fs.unlinkSync(outputName);
                console.log(chalk.green("Sticker enviado correctamente."));
            } else {
                await sock.sendMessage(from, { text: "No se pudo crear el sticker." });
            }
        });

    } catch (err) {
        console.error(chalk.red("Error en sticker.js:"), err);
        await sock.sendMessage(from, { text: "Ocurrió un error al crear el sticker." });
    }
}

module.exports = sticker;

