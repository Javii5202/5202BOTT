// comandos/global.js
import { loadEconomia } from "./economy-lib.js";

export default async function globalCmd(sock, from) {
  try {
    const economia = loadEconomia();

    // si es grupo, mostrar solo participantes del grupo (en ese orden por saldo)
    const chat = await sock.groupMetadata(from).catch(() => null);

    let users = [];
    if (chat && chat.participants) {
      users = chat.participants.map(p => p.id);
      // mapear a dinero (por si no existe -> 0)
      const ranking = users.map(u => ({ user: u, dinero: (economia[u]?.dinero || 0) }))
        .sort((a,b) => b.dinero - a.dinero);
      let msg = "🌍 Saldos del grupo:\n\n";
      ranking.forEach((r, i) => {
        msg += `${i+1}. @${r.user.split("@")[0]} — $${r.dinero}\n`;
      });
      return sock.sendMessage(from, { text: msg, mentions: ranking.map(r => r.user) });
    } else {
      // no es grupo -> top global
      const ranking = Object.entries(economia)
        .map(([user, data]) => ({ user, dinero: data.dinero || 0 }))
        .sort((a,b) => b.dinero - a.dinero);
      let msg = "🌍 Top global:\n\n";
      ranking.slice(0, 50).forEach((p, i) => {
        msg += `${i+1}. @${p.user.split("@")[0]} — $${p.dinero}\n`;
      });
      return sock.sendMessage(from, { text: msg, mentions: ranking.map(p => p.user) });
    }
  } catch (e) {
    console.error("Error en global:", e);
    await sock.sendMessage(from, { text: "❌ Ocurrió un error en el comando .global" });
  }
}
