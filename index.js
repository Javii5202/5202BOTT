import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
  useMultiFileAuthState
} from "@whiskeysockets/baileys";
import qrcode from "qrcode-terminal";
import chalk from "chalk";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import express from "express";
import axios from "axios";
import { fileURLToPath } from "url";
import * as cheerio from "cheerio";

// Fix para crypto en entornos como Render
import { webcrypto } from "crypto";
if (!globalThis.crypto) globalThis.crypto = webcrypto;

dotenv.config();

const PREFIX = ".";
const OWNER_NUMBER = process.env.OWNER_NUMBER;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const COMANDOS_DIR = path.join(__dirname, "comandos");

// Objeto de comandos
const comandos = {};

// Cargar comandos dinámicamente
async function loadCommands() {
  if (!fs.existsSync(COMANDOS_DIR)) return;
  const archivos = fs.readdirSync(COMANDOS_DIR).filter(f => f.endsWith(".js"));
  for (const file of archivos) {
    try {
      const nombre = file.replace(".js", "").toLowerCase();
      const ruta = path.join(COMANDOS_DIR, file);
      const mod = await import(`file://${ruta}`);
      if (mod.default && typeof mod.default === "function") {
        comandos[nombre] = mod.default;
        console.log(chalk.blue(`✅ Comando cargado: ${nombre}`));
      }
    } catch (err) {
      console.error(chalk.red(`❌ Error cargando comando ${file}:`), err);
    }
  }
}

async function startBot() {
  try {
    await loadCommands();
    const { state, saveCreds } = await useMultiFileAuthState(path.join(__dirname, "session"));
    const { version } = await fetchLatestBaileysVersion();
    const sock = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: true
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", (update) => {
      const { connection, qr, lastDisconnect } = update;
      if (qr) qrcode.generate(qr, { small: true });
      if (connection === "open") console.log(chalk.green("✅ Bot conectado a WhatsApp!"));
      if (connection === "close") {
        const reasonCode = lastDisconnect?.error?.output?.statusCode;
        const shouldReconnect = reasonCode !== DisconnectReason.loggedOut;
        if (shouldReconnect) setTimeout(startBot, 5000);
      }
    });

    sock.ev.on("messages.upsert", async ({ messages }) => {
      const m = messages[0];
      if (!m?.message || m.key.fromMe) return;
      const from = m.key.remoteJid;
      const sender = m.key.participant || m.key.remoteJid;
      const text =
        m.message.conversation ||
        m.message.extendedTextMessage?.text ||
        m.message.imageMessage?.caption ||
        m.message.videoMessage?.caption ||
        "";
      if (!text.startsWith(PREFIX)) return;

      const [cmd, ...args] = text.slice(PREFIX.length).trim().split(/ +/);
      if (comandos[cmd]) {
        try {
          await comandos[cmd](sock, from, m, args);
        } catch (err) {
          console.error(chalk.red(`❌ Error ejecutando ${cmd}:`), err);
          await sock.sendMessage(from, { text: "❌ Error en el comando." });
        }
      }
    });

    const app = express();
    app.get("/", (req, res) => res.send("✅ Bot activo en Render"));
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(chalk.green(`🌐 Servidor escuchando en puerto ${PORT}`)));
  } catch (err) {
    console.error(chalk.red("💀 Error crítico:"), err);
    setTimeout(startBot, 5000);
  }
}

startBot();
