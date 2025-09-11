// comandos/give.js
import {
  loadEconomia,
  saveEconomia,
  initUser,
  getSender,
  getMentionedOrQuoted
} from "./economy-lib.js";

async function __orig_give(sock, from, m, args) {

  try {
    const sender = getSender(m);
    if (!sender) return;

    const mentioned = getMentionedOrQuoted(m);
    const cantidad = parseInt(args[1] || args[0]);

    if (!mentioned) return sock.sendMessage(from, { text: "❌ Debes mencionar a alguien." });
    const tgt = mentioned.includes("@") ? mentioned : `${mentioned}@s.whatsapp.net`;
    if (tgt === sender) return sock.sendMessage(from, { text: "❌ No puedes darte dinero a ti mismo." });
    if (isNaN(cantidad) || cantidad <= 0) return sock.sendMessage(from, { text: "❌ Ingresa una cantidad válida." });

    const economia = loadEconomia();
    initUser(economia, sender);
    initUser(economia, tgt);

    if (economia[sender].dinero < cantidad) return sock.sendMessage(from, { text: "❌ No tienes suficiente dinero." });

    economia[sender].dinero -= cantidad;
    economia[tgt].dinero += cantidad;
    saveEconomia(economia);

    await sock.sendMessage(from, {
      text: `💸 Transferiste *$${cantidad}* a @${tgt.split("@")[0]}.\nTu saldo: *$${economia[sender].dinero}*`,
      mentions: [tgt]
    });
  } catch (e) {
    console.error("Error en give:", e);
    await sock.sendMessage(from, { text: "❌ Ocurrió un error en el comando .give" });
  }

}


export default async function command_handler(sock, from, m, args, quotedMessage, meta) {
  try {
    return await __orig_give(sock, from, m, args);
  } catch (err) {
    console.error("Error wrapper ejecutando comando give.js:", err);
    throw err;
  }
}

