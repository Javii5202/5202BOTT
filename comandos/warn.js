import fs from "fs";
import path from "path";

const warnsPath = path.resolve("./assets/warns.json");

const warnCommand = {
  name: "warn",
  description: "Da una advertencia a un usuario",
  async execute(client, from, message, args, quotedMessage, { isAdmin, isOwner }) {
    try {
      // Obtener el JID del usuario mencionado o pasado como argumento
      const mentioned = message.mentionedJid || args[0];
      if (!mentioned) {
        return client.sendMessage(from, { text: "❌ Debes mencionar a alguien" });
      }

      // Leer archivo de warns
      let warns = {};
      if (fs.existsSync(warnsPath)) {
        const data = await fs.promises.readFile(warnsPath, "utf8");
        warns = JSON.parse(data);
      }

      // Inicializar si no existe
      if (!warns[mentioned]) warns[mentioned] = 0;

      // Sumar warn
      warns[mentioned] += 1;

      // Guardar archivo
      await fs.promises.writeFile(warnsPath, JSON.stringify(warns, null, 2));

      // Enviar mensaje correctamente con objeto { text }
      await client.sendMessage(from, {
        text: `⚠️ ${mentioned} ahora tiene ${warns[mentioned]} advertencia(s)`
      });
    } catch (err) {
      console.error("Error en warn:", err);
      await client.sendMessage(from, { text: "❌ Ocurrió un error al ejecutar el comando." });
    }
  }
};

export default warnCommand;
