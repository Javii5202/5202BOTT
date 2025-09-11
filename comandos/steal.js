// comandos/steal.js
import {
  loadEconomia,
  saveEconomia,
  initUser,
  getRandom,
  formatMs,
  getSender,
  getMentionedOrQuoted
} from "./economy-lib.js";

export default async function steal(sock, from, m, args) {
  try {
    const sender = getSender(m);
    if (!sender) return;

    const target = getMentionedOrQuoted(m) || args[0]; // si pasaron raw id como fallback
    if (!target) return sock.sendMessage(from, { text: "❌ Menciona o responde al usuario al que quieres robar." });

    // si pasaron un token tipo @123... sin domain, intentar normalizar
    const tgt = target.includes("@") ? target : `${target}@s.whatsapp.net`;
    if (tgt === sender) return sock.sendMessage(from, { text: "❌ No puedes robarte a ti mismo." });

    const economia = loadEconomia();
    initUser(economia, sender);
    initUser(economia, tgt);

    const now = Date.now();
    const cooldown = 2 * 60 * 1000; // 2 minutos
    if (now - economia[sender].lastSteal < cooldown) {
      const restante = formatMs(cooldown - (now - economia[sender].lastSteal));
      return sock.sendMessage(from, { text: `⏳ Ya intentaste robar, espera *${restante}*.` });
    }

    if (economia[tgt].dinero < 50) {
      return sock.sendMessage(from, { text: "❌ Esa persona no tiene suficiente dinero para robar." });
    }

    const success = Math.random() < 0.5;
    if (success) {
      const amount = getRandom(50, Math.min(500, Math.floor(economia[tgt].dinero * 0.3)));
      economia[tgt].dinero -= amount;
      economia[sender].dinero += amount;
      economia[sender].lastSteal = now;
      saveEconomia(economia);
      return sock.sendMessage(from, {
        text: `🦹 Robaste *$${amount}* a @${tgt.split("@")[0]}.\nSaldo: *$${economia[sender].dinero}*`,
        mentions: [tgt]
      });
    } else {
      const fine = getRandom(20, 100);
      economia[sender].dinero = Math.max(0, economia[sender].dinero - fine);
      economia[sender].lastSteal = now;
      saveEconomia(economia);
      return sock.sendMessage(from, { text: `🚔 Te atraparon. Multa de *$${fine}*.\nSaldo: *$${economia[sender].dinero}*` });
    }
  } catch (e) {
    console.error("Error en steal:", e);
    await sock.sendMessage(from, { text: "❌ Ocurrió un error en el comando .steal" });
  }
}
