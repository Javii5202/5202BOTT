// comandos/owner.js
async function __orig_owner(sock, from, m) {

  const ownerNumber = process.env.OWNER_NUMBER || "No configurado";

  const text = `👑 *Owner del Bot* 👑

📛 Nombre: Javv
📱 Número: wa.me/${ownerNumber.replace("@s.whatsapp.net", "").replace("@c.us", "")}

Siempre activo 5202 🔥`;

  await sock.sendMessage(from, { text });

}


export default async function command_handler(sock, from, m, args, quotedMessage, meta) {
  try {
    return await __orig_owner(sock, from, m);
  } catch (err) {
    console.error("Error wrapper ejecutando comando owner.js:", err);
    throw err;
  }
}

