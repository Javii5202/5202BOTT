const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");
const axios = require("axios");
const chalk = require("chalk");

const downloadsDir = path.join(__dirname, "../downloads");
if (!fs.existsSync(downloadsDir)) fs.mkdirSync(downloadsDir);

async function play(sock, from, query) {
    try {
        if (!query) {
            await sock.sendMessage(from, { text: "Escribí el nombre de la canción que querés reproducir." });
            return;
        }

        // Buscar video en YouTube usando JSON
        const searchCommand = `yt-dlp "ytsearch1:${query}" -j`;
        exec(searchCommand, async (err, stdout) => {
            if (err) {
                console.error(chalk.red("Error al buscar canción:"), err);
                await sock.sendMessage(from, { text: "Ocurrió un error al buscar la canción." });
                return;
            }

            let info;
            try {
                info = JSON.parse(stdout);
            } catch (e) {
                console.error(chalk.red("Error al parsear JSON:"), e);
                await sock.sendMessage(from, { text: "No se pudo procesar la información de la canción." });
                return;
            }

            const videoId = info.id;
            const title = info.title;
            const duration = info.duration_string || "Desconocida";
            const thumbnailUrl = info.thumbnail;
            const views = info.view_count || "Desconocidas";
            const uploadDate = info.upload_date ? info.upload_date.substring(0,4) : "Desconocido";
            const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

            const safeName = title.replace(/[^a-zA-Z0-9]/g, "_");
            const outputPath = path.join(downloadsDir, `${safeName}.mp3`);

            // Enviar miniatura con info
            try {
                const response = await axios.get(thumbnailUrl, { responseType: "arraybuffer" });
                await sock.sendMessage(from, {
                    image: Buffer.from(response.data),
                    caption: `🎵 *${title}*\n⏱ Duración: ${duration}\n👁 Vistas: ${views}\n📅 Año: ${uploadDate}\n🔗 ${videoUrl}`,
                    mentions: []
                });
            } catch {
                await sock.sendMessage(from, { text: `Buscando "${query}" en YouTube...` });
            }

            // Descargar audio
            const downloadCommand = `yt-dlp -f bestaudio "${videoUrl}" -x --audio-format mp3 -o "${outputPath}" --ffmpeg-location "C:\\Users\\CUENCA\\Documents\\ffmpeg\\bin" --geo-bypass --add-header "User-Agent: Mozilla/5.0"`;

            exec(downloadCommand, async (downloadErr) => {
                if (downloadErr) {
                    console.error(chalk.red("Error al descargar audio:"), downloadErr);
                    await sock.sendMessage(from, { text: "Ocurrió un error al descargar la canción." });
                    return;
                }

                if (fs.existsSync(outputPath)) {
                    await sock.sendMessage(from, {
                        audio: fs.readFileSync(outputPath),
                        mimetype: "audio/mpeg",
                        fileName: `${safeName}.mp3`
                    });
                    console.log(chalk.green(`Audio "${title}" enviado correctamente.`));
                } else {
                    await sock.sendMessage(from, { text: "No se pudo descargar la canción." });
                }
            });
        });

    } catch (err) {
        console.error(chalk.red("Error en play.js:"), err);
        await sock.sendMessage(from, { text: "Ocurrió un error al intentar reproducir la canción." });
    }
}

module.exports = play;

