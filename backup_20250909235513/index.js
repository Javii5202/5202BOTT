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
const OWNER_NUMBER = process.env.OWNER_NUMBER;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const COMANDOS_DIR = path.join(__dirname, "comandos");

// Objeto para almacenar los comandos
const comandos = {};

// Función para cargar comandos
async function loadCommands() {
  if (!fs.existsSync(COMANDOS_DIR)) return;
  const archivos = fs.readdirSync(COMANDOS_DIR).filter(f => f.endsWith(".js"));

  for (const file of archivos) {
    try {
      const nombre = file.replace(".js", "").toLowerCase();
      const ruta = path.join(COMANDOS_DIR, file);
      const mod = await import(`file://${ruta}`);
      
      // Cargar default o toda la exportación si no hay default
      if (mod.default && typeof mod.default === "function") {
        comandos[nombre] = mod.default;
        console.log(chalk.blue(`✅ Comando cargado: ${nombre}`));
      } else if (typeof mod === "function") {
        comandos[nombre] = mod;
        console.log(chalk.blue(`✅ Comando cargado: ${nombre} (función exportada sin default)`));
      } else {
        console.log(chalk.yellow(`⚠️ El comando ${nombre} no tiene export default o no es una función`));
      }
    } catch (err) {
      console.error(chalk.red(`❌ Error cargando comando ${file}:`), err);
    }
  }
}

// Función principal del bot
async function startBot() {
  try {
    await loadCommands();

    const { state, saveCreds } = await useMultiFileAuthState(path.join(__dirname, "session"));
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: false,
    });

    sock.ev.on("creds.update", saveCreds);

    // Manejo de conexión
    sock.ev.on("connection.update", (update) => {
      const { connection, qr, lastDisconnect } = update;

      if (qr) qrcode.generate(qr, { small: true });
      if (connection === "open") console.log(chalk.green("✅ Bot conectado a WhatsApp!"));

      if (connection === "close") {
        const reasonCode = lastDisconnect?.error?.output?.statusCode;

        if (reasonCode === 409) { // conflicto de sesión
          console.log(chalk.red("⚠️ Sesión reemplazada, eliminando archivo de sesión..."));
          fs.rmSync(path.join(__dirname, "session"), { recursive: true, force: true });
          console.log(chalk.yellow("🔄 Reiniciando bot para escanear QR..."));
          setTimeout(startBot, 1000);
          return;
        }

        const shouldReconnect = reasonCode !== DisconnectReason.loggedOut;
        console.log(chalk.yellow("⚠️ Conexión cerrada."), lastDisconnect?.error || "");
        if (shouldReconnect) setTimeout(startBot, 5000);
      }
    });

    // Manejo de mensajes
    sock.ev.on("messages.upsert", async ({ messages }) => {
      try {
        const m = messages[0];
        if (!m?.message) return;
        if (m.key?.fromMe) return;

        const from = m.key.remoteJid;
        const sender = m.key.participant || m.key.remoteJid;
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

        const metadata = from.endsWith("@g.us") ? await sock.groupMetadata(from) : null;
        const participants = metadata?.participants || [];
        const isAdmin = participants.some(p => p.id === sender && p.admin);
        const isOwner = sender === OWNER_NUMBER;

        if (comandos[cmd]) {
          console.log(chalk.cyan(`💬 Comando detectado: ${cmd} | args: ${args}`));
          try {
            await comandos[cmd](sock, from, m, args, quotedMessage, { isAdmin, isOwner });
          } catch (err) {
            console.error(chalk.red(`❌ Error ejecutando comando ${cmd}:`), err);
            await sock.sendMessage(from, { text: "❌ Ocurrió un error al ejecutar el comando." });
          }
        }
      } catch (err) {
        console.error(chalk.red("❌ Error manejando mensaje:"), err);
      }
    });

    // Servidor web
    const app = express();
    app.get("/", (req, res) => res.send("Bot activo 5202!"));
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(chalk.green(`🌐 Servidor web escuchando en puerto ${PORT}`)));
  } catch (err) {
    console.error(chalk.red("💀 Error crítico al iniciar el bot:"), err);
    setTimeout(startBot, 5000);
  }
}

startBot();
