// comandos/daily.js
import {
  loadEconomia,
  saveEconomia,
  initUser,
  formatMs,
  getRandom,
  getSender
} from "./economy-lib.js";

export default async function daily(sock, from, m) {
  try {
    const sender = getSender(m);
    if (!sender) return;

    const economia = loadEconomia();
    initUser(economia, sender);

    const now = Date.now();
    const cooldown = 12 * 60 * 60 * 1000; // 12 horas
    if (now - economia[sender].lastDaily < cooldown) {
      const restante = formatMs(cooldown - (now - economia[sender].lastDaily));
      return sock.sendMessage(from, { text: `⏳ Ya reclamaste el .daily. Espera *${restante}*.` });
    }

    const amount = 30000; // recompensa fija grande
    // opcional: pequeño bonus aleatorio
    const bonus = getRandom(0, 2000);
    economia[sender].dinero += (amount + bonus);
    economia[sender].lastDaily = now;
    saveEconomia(economia);

    await sock.sendMessage(from, {
      text: `🎁 Recompensa diaria: *$${amount}*${bonus?` + bonus *$${bonus}`:""}.\nSaldo: *$${economia[sender].dinero}*`
    });
  } catch (e) {
    console.error("Error en daily:", e);
    await sock.sendMessage(from, { text: "❌ Ocurrió un error en el comando .daily" });
  }
}
