export default async function warn(sock, from, m, args, quotedMessage, { isAdmin, isOwner }) {
  try {
    if (!isAdmin && !isOwner) {
      await sock.sendMessage(from, { text: "⚠️ Solo admins o el owner pueden usar este comando." });
      return;
    }

    if (!args[0]) {
      await sock.sendMessage(from, { text: "⚠️ Debes mencionar a alguien para advertir." });
      return;
    }

    const target = args[0]; // Ejemplo: "@59896105392"
    const warningsFile = "./warnings.json";
    let warnings = {};

    if (fs.existsSync(warningsFile)) {
      warnings = JSON.parse(fs.readFileSync(warningsFile, "utf-8"));
    }

    if (!warnings[target]) warnings[target] = 0;
    warnings[target] += 1;

    fs.writeFileSync(warningsFile, JSON.stringify(warnings, null, 2));

    await sock.sendMessage(from, { text: `⚠️ ${target} ahora tiene ${warnings[target]} advertencia(s).` });
  } catch (err) {
    console.error("Error en warn:", err);
  }
}
