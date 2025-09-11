const descriptions = {
  menu: "📜 Muestra el menú con todos los comandos.",
  ping: "🏓 Responde con 'pong' para verificar que el bot está activo.",
  idea: "💡 Envía una idea al desarrollador. Uso: .idea <texto>",
  play: "🎶 Descarga una canción en formato mp3. Uso: .play <nombre>",
  video: "🎥 Descarga un video en formato mp4. Uso: .video <nombre>",
  sticker: "🖼️ Convierte una imagen o video en sticker.",
  r: "📷 Recupera una foto/video de ver una sola vez.",

  warn: "⚠️ Da una advertencia a un miembro. Uso: .warn @usuario",
  unwarn: "✅ Quita una advertencia. Uso: .unwarn @usuario",
  listadv: "📋 Lista las advertencias de los miembros.",
  k: "👢 Expulsa a un miembro del grupo. Uso: .k @usuario",

  pareja: "💞 Proponer pareja a alguien. Uso: .pareja @usuario",
  aceptar: "💞 Aceptar propuesta de pareja. Uso: .aceptar @usuario",
  rechazar: "💔 Rechazar propuesta de pareja. Uso: .rechazar @usuario",
  terminar: "💔 Terminar relación actual. Uso: .terminar",
  parejastats: "📊 Ver estado de tu relación.",

  bal: "💰 Ver tu saldo.",
  global: "🌍 Ver ranking de dinero del grupo.",
  give: "💸 Dar dinero a alguien. Uso: .give @usuario <cantidad>",
  work: "💼 Trabajar (cada 15m, $5000-$8000).",
  beg: "🙏 Pedir limosna (cada 10m, $3000-$4000).",
  daily: "🎁 Reclamar recompensa diaria ($30.000 cada 12h).",

  rt: "🎰 Apostar en ruleta rojo/negro. Uso: .rt red/black <cantidad>",
  steal: "🕵️ Intentar robar dinero a alguien (50% de éxito). Uso: .steal @usuario <cantidad>"
};

async function __orig_help(sock, from, args) {

  // Aseguramos que args sea un array válido
  args = Array.isArray(args) ? args : [];

  if (args.length === 0) {
    // Si no se pasa comando, listamos todos
    let texto = "📜 Lista de comandos disponibles:\n\n";
    for (const cmd in descriptions) {
      texto += `⛧ .${cmd} — ${descriptions[cmd]}\n`;
    }
    return await sock.sendMessage(from, { text: texto });
  }

  const cmd = args[0];
  if (!cmd || typeof cmd !== "string") {
    return await sock.sendMessage(from, { text: "❌ Comando inválido." });
  }

  const desc = descriptions[cmd.toLowerCase()];
  if (!desc) {
    return await sock.sendMessage(from, { text: "❌ Comando no encontrado en la lista." });
  }

  await sock.sendMessage(from, { text: `📖 AYUDA DE .${cmd.toLowerCase()}\n\n${desc}` });

}


export default async function command_handler(sock, from, m, args, quotedMessage, meta) {
  try {
    return await __orig_help(sock, from, args);
  } catch (err) {
    console.error("Error wrapper ejecutando comando help.js:", err);
    throw err;
  }
}

