import fs from "fs";
import path from "path";

async function __orig_mostrarMenu(sock, from) {

  const menuText = ` ╔═══════ 𝟝𝟚𝟘𝟚 ═══════╗
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

🕷➤ COMANDOS DE GRUPO (solo admins)
🕷 ⛧ .warn <@tag> - Advertir a un miembro
🕷 ⛧ .unwarn <@tag> - Quitar advertencia
🕷 ⛧ .listadv - Ver lista de advertencias
🕷 ⛧ .k <@tag> - Expulsar a un miembro
🕷 ⛧ .owner - Ver información del dueño
💞➤ COMANDOS DE PAREJAS
💞 ⛧ .pareja <@tag> - Proponer pareja
💞 ⛧ .aceptar <@tag> - Aceptar propuesta
💞 ⛧ .rechazar <@tag> - Rechazar propuesta
💞 ⛧ .terminar - Terminar relación
💞 ⛧ .parejastats - Ver estado de tu relación

💸➤ COMANDOS DE ECONOMÍA
💸 ⛧ .bal - Ver tu saldo
💸 ⛧ .global - Ver ranking del grupo
💸 ⛧ .give <@tag> <cantidad> - Dar dinero a alguien
💸 ⛧ .work - Trabajar (cada 15m, $5000-$8000)
💸 ⛧ .beg - Pedir limosna (cada 10m, $3000-$4000)
💸 ⛧ .daily - Reclamar recompensa diaria ($30.000, cada 12h)

🎰➤ COMANDOS DE APUESTAS
🎰 ⛧ .rt red/black <cantidad> - Apostar en la ruleta (2x si ganas)

🎭➤ EXTRA DIVERTIDO
🎭 ⛧ .steal <@tag> <cantidad> - Intentar robar dinero a alguien (50% de éxito)
`;

  const imagePath = path.join(process.cwd(), "assets/menu.jpg");
  if (!fs.existsSync(imagePath)) {
    return await sock.sendMessage(from, { text: menuText });
  }

  const imageBuffer = fs.readFileSync(imagePath);
  await sock.sendMessage(from, { image: imageBuffer, caption: menuText });

}


export default async function command_handler(sock, from, m, args, quotedMessage, meta) {
  try {
    return await __orig_mostrarMenu(sock, from);
  } catch (err) {
    console.error("Error wrapper ejecutando comando menu.js:", err);
    throw err;
  }
}

