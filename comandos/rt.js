// comandos/rt.js
import {
  loadEconomia,
  saveEconomia,
  initUser,
  getRandom,
  getSender
} from "./economy-lib.js";

export default async function rt(sock, from, m, args) {
  try {
    const sender = getSender(m);
    if (!sender) return;

    const color = (args[0] || "").toLowerCase();
    const cantidad = parseInt(args[1]);

    if (!["red", "black", "r", "b"].includes(color)) return sock.sendMessage(from, { text: "❌ Uso: .rt red cantidad  o .rt black cantidad" });
    if (isNaN(cantidad) || cantidad <= 0) return sock.sendMessage(from, { text: "❌ Ingresa una cantidad válida." });

    const economia = loadEconomia();
    initUser(economia, sender);

    if (economia[sender].dinero < cantidad) return sock.sendMessage(from, { text: "❌ No tienes suficiente dinero." });

    const flip = Math.random() < 0.5 ? "red" : "black";
    const guess = (color === "r") ? "red" : (color === "b" ? "black" : color);

    if (flip === guess) {
      // duplica la apuesta (gana la misma cantidad)
      economia[sender].dinero += cantidad;
      saveEconomia(economia);
      return sock.sendMessage(from, { text: `🎉 La ruleta salió *${flip.toUpperCase()}*! Ganaste *$${cantidad}*. Saldo: *$${economia[sender].dinero}*` });
    } else {
      economia[sender].dinero -= cantidad;
      saveEconomia(economia);
      return sock.sendMessage(from, { text: `💥 La ruleta salió *${flip.toUpperCase()}*. Perdiste *$${cantidad}*. Saldo: *$${economia[sender].dinero}*` });
    }
  } catch (e) {
    console.error("Error en rt:", e);
    await sock.sendMessage(from, { text: "❌ Ocurrió un error en el comando .rt" });
  }
}
