import { webcrypto } from "crypto";
if (!globalThis.crypto) {
  globalThis.crypto = webcrypto;
}
import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
  useMultiFileAuthState,
} from "@whiskeysockets/baileys";
import qrcodeTerminal from "qrcode-terminal";
import QRCode from "qrcode";
import chalk from "chalk";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import express from "express";
import { fileURLToPath } from "url";

dotenv.config();

const PREFIX = ".";
const OWNER_NUMBER = process.env.OWNER_NUMBER || '';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const COMANDOS_DIR = path.join(__dirname, "comandos");
const QR_PATH = path.join(process.cwd(), "qr.png");

// Objeto para almacenar los comandos
const comandos = {};

// Carga de comandos (soporta varias formas de export)
async function loadCommands() {
  if (!fs.existsSync(COMANDOS_DIR)) return;
  const archivos = fs.readdirSync(COMANDOS_DIR).filter(f => f.endsWith(".js"));

  for (const file of archivos) {
    try {
      const nombre = file.replace(".js", "").toLowerCase();
      const ruta = path.join(COMANDOS_DIR, file);
      const mod = await import(`file://${ruta}`);
      let handler = null;

      if (typeof mod === 'function') handler = mod;
      else if (mod && typeof mod.default === 'function') handler = mod.default;
      else if (mod && mod.default && typeof mod.default.execute === 'function') handler = mod.default.execute;

      if (handler) {
        comandos[nombre] = handler;
        console.log(chalk.blue(`✅ Comando cargado: ${nombre}`));
      } else {
        console.log(chalk.yellow(`⚠️ El comando ${nombre} no tiene export default o no es una función`));
      }
    } catch (err) {
      console.error(chalk.red(`❌ Error cargando comando ${file}:`), err);
    }
  }
}

// Restore session from SESSION env (if provided as base64 or JSON string)
function restoreSessionFromEnv() {
  try {
    const sess = process.env.SESSION;
    if (!sess) return false;
    const sessDir = path.join(__dirname, "session");
    if (!fs.existsSync(sessDir)) fs.mkdirSync(sessDir, { recursive: true });
    let parsed = null;
    try {
      parsed = JSON.parse(sess);
    } catch (e) {
      try {
        parsed = JSON.parse(Buffer.from(sess,'base64').toString('utf8'));
      } catch (err) {
        console.warn("SESSION env found but could not parse as JSON or base64(JSON).");
      }
    }
    if (parsed && typeof parsed === 'object') {
      for (const [fname, content] of Object.entries(parsed)) {
        const target = path.join(sessDir, fname);
        if (typeof content === 'object') fs.writeFileSync(target, JSON.stringify(content, null, 2));
        else fs.writeFileSync(target, content);
      }
      console.log("🔐 Session restored from SESSION environment variable.");
      return true;
    }
  } catch (e) {
    console.warn("Error restoring session from env:", e);
  }
  return false;
}

async function startBot() {
  try {
    await loadCommands();

    // restore session from env if provided
    restoreSessionFromEnv();

    const { state, saveCreds } = await useMultiFileAuthState(path.join(__dirname, "session"));
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: false,
    });

    sock.ev.on("creds.update", saveCreds);

    // connection update with better reconnection policy
    sock.ev.on("connection.update", async (update) => {
      const { connection, qr, lastDisconnect } = update;

      if (qr) {
        try {
          // generate png for remote scanning
          await QRCode.toFile(QR_PATH, qr, { type: "png", width: 400 });
          console.log("📸 QR generado en /qr (endpoint) - abrí tu URL de Render y agrega /qr");
        } catch (e) {
          console.warn("No se pudo generar QR png:", e);
        }
        // also show ascii for local terminal
        qrcodeTerminal.generate(qr, { small: true });
      }

      if (connection === "open") {
        console.log(chalk.green("✅ Bot conectado a WhatsApp!"));
      }

      if (connection === "close") {
        const reasonCode = lastDisconnect?.error?.output?.statusCode || lastDisconnect?.error?.output?.statusCode;
        console.log(chalk.yellow("⚠️ Conexión cerrada."), lastDisconnect?.error || "");
        // if logged out, clear session
        const shouldReconnect = lastDisconnect?.error && lastDisconnect.error.output && lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut;
        if (!shouldReconnect) {
          console.log(chalk.red("🔴 Sesión cerrada, elimina session/ y vuelve a generar sesión si deseas reconectar."));
          return;
        }
        setTimeout(startBot, 5000);
      }
    });

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
        const isAdmin = participants.some(p => p.id === sender && (p.admin === "admin" || p.admin === "superadmin"));
        const isOwner = sender === OWNER_NUMBER;

        if (comandos[cmd]) {
          console.log(chalk.cyan(`💬 Comando detectado: ${cmd} | args: ${args}`));
          try {
            const handler = comandos[cmd];
            if (typeof handler === 'function') {
              await handler(sock, from, m, args, quotedMessage, { isAdmin, isOwner });
            } else if (handler && typeof handler.execute === 'function') {
              await handler.execute(sock, from, m, args, quotedMessage, { isAdmin, isOwner });
            } else {
              console.warn('El handler del comando existe pero no es invocable:', cmd);
            }
          } catch (err) {
            console.error(chalk.red(`❌ Error ejecutando comando ${cmd}:`), err);
            try { await sock.sendMessage(from, { text: "❌ Ocurrió un error al ejecutar el comando." }); } catch(e){}
          }
        }
      } catch (err) {
        console.error(chalk.red("❌ Error manejando mensaje:"), err);
      }
    });

    // Servidor web y endpoint para QR
    const app = express();
    app.get("/", (req, res) => res.send("Bot activo 5202!"));
    app.get("/qr", (req, res) => {
      if (fs.existsSync(QR_PATH)) return res.sendFile(QR_PATH);
      return res.status(404).send("QR no generado aún. Revisa logs o inicia sesión localmente para generar QR.");
    });

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, '0.0.0.0', () => console.log(chalk.green(`🌐 Servidor web escuchando en puerto ${PORT}`)));
  } catch (err) {
    console.error(chalk.red("💀 Error crítico al iniciar el bot:"), err);
    setTimeout(startBot, 5000);
  }
}

startBot();