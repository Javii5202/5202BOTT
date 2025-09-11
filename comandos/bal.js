// comandos/bal.js
import { loadEconomia, initUser, saveEconomia, getSender } from "./economy-lib.js";

export default async function bal(sock, from, m) {
  try {
    const sender = getSender(m);
    if (!sender) return;

    const economia = loadEconomia();
    initUser(economia, sender);
    saveEconomia(economia);

    await sock.sendMessage(from, { text: `💰 Tu saldo: *$${economia[sender].dinero}*` });
  } catch (e) {
    console.error("Error en bal:", e);
    await sock.sendMessage(from, { text: "❌ Ocurrió un error en el comando .bal" });
  }
}
