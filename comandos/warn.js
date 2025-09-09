import fs from "fs";

export default async function warn(m, args, client) {
  try {
    const user = args[0];
    if (!user) return client.sendMessage(m.chat, "Debes mencionar un usuario");

    const warnsPath = "./warns.json";
    let warns = {};
    if (fs.existsSync(warnsPath)) {
      warns = JSON.parse(fs.readFileSync(warnsPath, "utf8") || "{}");
    }

    warns[user] = (warns[user] || 0) + 1;
    fs.writeFileSync(warnsPath, JSON.stringify(warns, null, 2));

    client.sendMessage(m.chat, `Usuario ${user} ahora tiene ${warns[user]} warn(s)`);
  } catch (e) {
    console.error("Error en warn.js:", e);
    client.sendMessage(m.chat, "Ocurrió un error al dar el warn ❌");
  }
}
