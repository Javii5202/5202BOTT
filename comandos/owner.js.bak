// comandos/owner.js
export default async function owner(sock, from, m) {
  const ownerNumber = process.env.OWNER_NUMBER || "No configurado";

  const text = `👑 *Owner del Bot* 👑

📛 Nombre: Javv
📱 Número: wa.me/${ownerNumber.replace("@s.whatsapp.net", "").replace("@c.us", "")}

Siempre activo 5202 🔥`;

  await sock.sendMessage(from, { text });
}
