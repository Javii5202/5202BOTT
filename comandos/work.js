// comandos/work.js
import {
  loadEconomia,
  saveEconomia,
  initUser,
  getRandom,
  formatMs,
  getSender
} from "./economy-lib.js";

async function __orig_work(sock, from, m) {

  try {
    const sender = getSender(m);
    if (!sender) return;

    const economia = loadEconomia();
    initUser(economia, sender);

    const now = Date.now();
    const cooldown = 15 * 60 * 1000; // 15 minutos

    if (now - economia[sender].lastWork < cooldown) {
      const restante = formatMs(cooldown - (now - economia[sender].lastWork));
      return sock.sendMessage(from, { text: `⏳ Ya trabajaste, espera *${restante}*.` });
    }

    const amount = getRandom(5000, 8000);
    economia[sender].dinero += amount;
    economia[sender].lastWork = now;
    saveEconomia(economia);

    await sock.sendMessage(from, {
      text: `💼 Trabajaste y ganaste *$${amount}*.\nSaldo: *$${economia[sender].dinero}*`
    });
  } catch (e) {
    console.error("Error en work:", e);
    await sock.sendMessage(from, { text: "❌ Ocurrió un error en el comando .work" });
  }

}


export default async function command_handler(sock, from, m, args, quotedMessage, meta) {
  try {
    return await __orig_work(sock, from, m);
  } catch (err) {
    console.error("Error wrapper ejecutando comando work.js:", err);
    throw err;
  }
}

