import crypto from "crypto";
import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
  useMultiFileAuthState,
} from "@whiskeysockets/baileys";
import qrcode from "qrcode-terminal";
import chalk from "chalk";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import express from "express";
import { fileURLToPath } from "url";

dotenv.config();

const PREFIX = ".";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const COMANDOS_DIR = path.join(__dirname, "comandos");

// Cargar comandos dinámicamente (ESM)
const comandos = {};
if (fs.existsSync(COMANDOS_DIR)) {
  for (const file of fs.readdirSync(COMANDOS_DIR).filter(f => f.endsWith(".js"))) {
    try {
      const nombre = file.replace(".js", "").toLowerCase();
      const ruta = path.join(COMANDOS_DIR, file);
      const mod = await import(`file://${ruta}`);
      comandos[nombre] = mod.default;
      console.log(chalk.blue(`✅ Comando cargado: ${nombre}`));
    } catch (err) {
      console.error(chalk.red(`❌ Error cargando comando ${file}:`), err);
    }
  }
}

async function startBot() {
  try {
    const { state, saveCreds } = await useMultiFileAuthState(path.join(__dirname, "session"));
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: false,
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", (update) => {
      const { connection, qr, lastDisconnect } = update;

      if (qr) qrcode.generate(qr, { small: true });
      if (connection === "open") console.log(chalk.green("✅ Bot conectado a WhatsApp!"));

      if (connection === "close") {
        const shouldReconnect =
          lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
        console.log(chalk.yellow("Conexión cerrada."), lastDisconnect?.error || "");
        if (shouldReconnect) setTimeout(startBot, 5000);
      }
    });

    sock.ev.on("messages.upsert", async ({ messages }) => {
      try {
        const m = messages[0];
        if (!m?.message) return;
        if (m.key?.fromMe) return;

        const from = m.key.remoteJid;
        const text =
          m.message.conversation ||
          m.message.extendedTextMessage?.text ||
          m.message.imageMessage?.caption ||
          m.message.videoMessage?.caption ||
          "";

        if (!text || !text.startsWith(PREFIX)) return;

        const withoutPrefix = text.slice(PREFIX.length).trim();
        const parts = withoutPrefix.split(/ +/);
        const cmd = parts.shift().toLowerCase();
        const args = parts;

        const quotedMessage = m.message.extendedTextMessage?.contextInfo?.quotedMessage;

        if (comandos[cmd]) {
          console.log(chalk.cyan(`💬 Comando detectado: ${cmd} | args: ${args}`));
          try {
            await comandos[cmd](sock, from, m, args, quotedMessage);
          } catch (err) {
            console.error(chalk.red(`❌ Error ejecutando comando ${cmd}:`), err);
            await sock.sendMessage(from, { text: "❌ Ocurrió un error al ejecutar el comando." });
          }
        }
      } catch (err) {
        console.error("Error manejando mensaje:", err);
      }
    });

    // Server web
    const app = express();
    app.get("/", (req, res) => res.send("Bot activo 5202!"));
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(chalk.green(`Servidor web escuchando en puerto ${PORT}`)));
  } catch (err) {
    console.error(chalk.red("Error crítico al iniciar el bot:"), err);
    setTimeout(startBot, 5000);
  }
}

startBot();
