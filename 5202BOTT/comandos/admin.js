const fs = require("fs");
const path = require("path");
const { jidNormalizedUser } = require("@whiskeysockets/baileys");

const warnsPath = path.join(__dirname, "../assets/warns.json");

// Función para leer warns.json
function readWarns() {
    if (!fs.existsSync(warnsPath)) return {};
    const data = fs.readFileSync(warnsPath, "utf-8");
    try {
        return JSON.parse(data);
    } catch {
        return {};
    }
}

// Función para guardar warns.json
function saveWarns(data) {
    fs.writeFileSync(warnsPath, JSON.stringify(data, null, 2));
}

module.exports = async function adminCmds(sock, from, message, args) {
    try {
        const chat = await sock.groupMetadata(from).catch(() => null);
        if (!chat) {
            await sock.sendMessage(from, { text: "Este comando solo funciona en grupos." });
            return;
        }

        const sender = jidNormalizedUser(message?.key?.participant || message?.key?.remoteJid);
        const isAdmin = chat.participants.some(p => p.id === sender && (p.admin === "admin" || p.admin === "superadmin"));
        if (!isAdmin) {
            await sock.sendMessage(from, { text: "❌ Solo los administradores pueden usar este comando." });
            return;
        }

        const command = args[0]?.toLowerCase();
        if (!command) return;

        const warns = readWarns();
        if (!warns[from]) warns[from] = {};

        // Obtener usuario objetivo
        let user;
        // Primero revisa si hay mención real
        if (message.extendedTextMessage?.contextInfo?.mentionedJid?.length) {
            user = message.extendedTextMessage.contextInfo.mentionedJid[0];
        } else if (args[1]) {
            // Normaliza número a WhatsApp JID
            let num = args[1].replace(/\D/g, ""); // elimina todo excepto números
            user = num + "@s.whatsapp.net";
        }

        if ((command === "warn" || command === "unwarn") && !user) {
            await sock.sendMessage(from, { text: "❌ Menciona a alguien o escribe su número para ejecutar este comando." });
            return;
        }

        switch (command) {
            case "warn": {
                if (!warns[from][user]) warns[from][user] = 0;
                warns[from][user]++;
                saveWarns(warns);

                const warnCount = warns[from][user];
                await sock.sendMessage(from, {
                    text: `⚠️ @${user.split("@")[0]} ahora tiene ${warnCount}/3 advertencias.`,
                    mentions: [user]
                });

                // Auto-expulsar si llega a 3
                if (warnCount >= 3) {
                    await sock.groupParticipantsUpdate(from, [user], "remove");
                    await sock.sendMessage(from, {
                        text: `❌ @${user.split("@")[0]} fue expulsado automáticamente por 3 advertencias.`,
                        mentions: [user]
                    });
                    warns[from][user] = 0; // reset warns después de expulsar
                    saveWarns(warns);
                }
                break;
            }
            case "unwarn": {
                if (!warns[from][user]) warns[from][user] = 0;
                warns[from][user] = Math.max(0, warns[from][user] - 1);
                saveWarns(warns);

                await sock.sendMessage(from, {
                    text: `✅ @${user.split("@")[0]} ahora tiene ${warns[from][user]}/3 advertencias.`,
                    mentions: [user]
                });
                break;
            }
            case "listadv": {
                let list = "🕷 Lista de advertencias:\n\n";
                for (const [uid, count] of Object.entries(warns[from])) {
                    list += `⚠️ @${uid.split("@")[0]} → ${count}/3\n`;
                }
                await sock.sendMessage(from, { text: list, mentions: Object.keys(warns[from]) });
                break;
            }
            case "k": {
                if (!user) {
                    await sock.sendMessage(from, { text: "❌ Menciona a alguien o escribe su número para expulsarlo." });
                    return;
                }
                await sock.groupParticipantsUpdate(from, [user], "remove");
                await sock.sendMessage(from, {
                    text: `❌ @${user.split("@")[0]} fue expulsado.`,
                    mentions: [user]
                });
                break;
            }
            default:
                await sock.sendMessage(from, { text: "Comando de admin no reconocido." });
        }

    } catch (err) {
        console.error("Error en admin.js:", err);
        await sock.sendMessage(from, { text: "Ocurrió un error ejecutando el comando de admin." });
    }
};
