const path = require("path");
const fs = require("fs");

module.exports = async function mostrarMenu(sock, from) {
    const menuText = `
╔═══════ 𝟝𝟚𝟘𝟚 ═══════╗
┃    Hola, soy tu bot  
┃      asistente traper
┃  Estado: en desarrollo... 🩸
╚════════════════════╝

⚰ COMANDOS ⚰
⛧ .menu - Ver menú
⛧ .ping - Ver si estoy activo
⛧ .idea <texto> - Enviar idea
⛧ .play <Nombre de la canción> - Descargar mp3
⛧ .video <Nombre de la canción/video> - Descargar mp4
⛧ .sticker (hacer un sticker de una imagen/video)
⛧ .r (recuperar una foto/video de ver una sola vez)

🕷➤ COMANDOS DE GRUPO (solo admins) 🕷
⛧ .warn <@tag> - Advertir
⛧ .unwarn <@tag> - Quitar advertencia
⛧ .listadv - Ver advertencias
⛧ .k - Expulsar a un miembro
`;

    const imagePath = path.join(__dirname, "../assets/menu.jpg");

    if (!fs.existsSync(imagePath)) {
        // Si no existe la imagen, enviar solo texto
        await sock.sendMessage(from, { text: menuText });
        return;
    }

    // Leer el archivo como buffer y enviar
    const imageBuffer = fs.readFileSync(imagePath);

    await sock.sendMessage(from, {
        image: imageBuffer,
        caption: menuText
    });
};
