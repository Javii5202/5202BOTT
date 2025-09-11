// comandos/beg.js
import {
  loadEconomia,
  saveEconomia,
  initUser,
  getRandom,
  formatMs,
  getSender
} from "./economy-lib.js";

async function __orig_beg(sock, from, m) {

  try {
    const sender = getSender(m);
    if (!sender) return;

    const economia = loadEconomia();
    initUser(economia, sender);

    const now = Date.now();
    const cooldown = 10 * 60 * 1000; // 10 minutos
    if (now - economia[sender].lastBeg < cooldown) {
      const restante = formatMs(cooldown - (now - economia[sender].lastBeg));
      return sock.sendMessage(from, { text: `⏳ Ya pediste, espera *${restante}*.` });
    }

    const amount = getRandom(3000, 4000);
    economia[sender].dinero += amount;
    economia[sender].lastBeg = now;
    saveEconomia(economia);

    await sock.sendMessage(from, {
      text: `🙏 Alguien te dio *$${amount}*.\nSaldo: *$${economia[sender].dinero}*`
    });
  } catch (e) {
    console.error("Error en beg:", e);
    await sock.sendMessage(from, { text: "❌ Ocurrió un error en el comando .beg" });
  }

}


export default async function command_handler(sock, from, m, args, quotedMessage, meta) {
  try {
    return await __orig_beg(sock, from, m);
  } catch (err) {
    console.error("Error wrapper ejecutando comando beg.js:", err);
    throw err;
  }
}

