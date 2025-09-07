const crypto = require("crypto");
global.crypto = crypto;

const { default: makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys");
const qrcode = require("qrcode-terminal");
const chalk = require("chalk");
const dotenv = require("dotenv");

dotenv.config();

// Comandos
const mostrarMenu = require("./comandos/menu");
const ping = require("./comandos/ping");
const idea = require("./comandos/idea");
const play = require("./comandos/play");
const video = require("./comandos/video");
const sticker = require("./comandos/sticker");
const recuperar = require("./comandos/recuperar");
const adminCmds = require("./comandos/admin");
const gpt = require("./comandos/gpt");

async function connectBot() {
    try {
        console.log(chalk.blue("Iniciando bot 5202..."));

        const { state, saveCreds } = await useMultiFileAuthState("session");
        const sock = makeWASocket({ auth: state });

        sock.ev.on("creds.update", saveCreds);

        sock.ev.on("connection.update", ({ connection, qr, lastDisconnect }) => {
            if (qr) qrcode.generate(qr, { small: true });
            if (connection === "open") console.log(chalk.green("¡Bot conectado a WhatsApp!"));
            if (connection === "close") setTimeout(connectBot, 5000);
        });

        sock.ev.on("messages.upsert", async ({ messages }) => {
            const m = messages[0];
            if (!m?.message) return;

            const from = m.key.remoteJid;
            const text = m.message.conversation || m.message.extendedTextMessage?.text;
            if (!text) return;

            const match = text.match(/^([.#\/])(\w+)/);
            if (!match) return;

            const command = match[2].toLowerCase();
            const args = text.slice(match[1].length + command.length).trim().split(" ");

            try {
                switch (command) {
                    // Comandos generales
                    case "menu": 
                        await mostrarMenu(sock, from); 
                        break;
                    case "ping": 
                        await ping(sock, from); 
                        break;
                    case "idea": 
                        await idea(sock, from, args.join(" ")); 
                        break;
                    case "play": 
                        await play(sock, from, args.join(" ")); 
                        break;
                    case "video": 
                        await video(sock, from, args.join(" ")); 
                        break;
                    case "sticker": {
                        const quotedSticker = m.message.extendedTextMessage?.contextInfo?.quotedMessage;
                        await sticker(sock, from, quotedSticker);
                        break;
                    }
                    case "r": {
                        const quotedR = m.message.extendedTextMessage?.contextInfo?.quotedMessage;
                        await recuperar(sock, from, quotedR);
                        break;
                    }
                    // Comandos de admin
                    case "warn":
                    case "unwarn":
                    case "listadv":
                        await adminCmds(sock, from, m, [command, ...args]);
                        break;
                    // Comando GPT
                    case "gpt":
                        await gpt(sock, from, m, args);
                        break;
                    default:
                        break;
                }

                // Reenviar respuestas que lleguen del número de OpenAI
                await gpt.handleResponse(sock, m);

            } catch (err) {
                console.error(chalk.red(`Error al ejecutar el comando "${command}":`), err);
                await sock.sendMessage(from, { text: `Ocurrió un error al ejecutar el comando "${command}".` });
            }
        });

    } catch (err) {
        console.error(chalk.red("Error crítico al iniciar el bot:"), err);
        setTimeout(connectBot, 5000);
    }
}

connectBot();
