// comandos/bal.js
import { loadEconomia, initUser, saveEconomia, getSender } from "./economy-lib.js";

async function __orig_bal(sock, from, m) {

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


export default async function command_handler(sock, from, m, args, quotedMessage, meta) {
  try {
    return await __orig_bal(sock, from, m);
  } catch (err) {
    console.error("Error wrapper ejecutando comando bal.js:", err);
    throw err;
  }
}

