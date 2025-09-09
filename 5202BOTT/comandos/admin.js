import fs from "fs";

const warnsFile = "warns.json";

function loadWarns() {
  if (!fs.existsSync(warnsFile)) return {};
  return JSON.parse(fs.readFileSync(warnsFile, "utf8"));
}

function saveWarns(data) {
  fs.writeFileSync(warnsFile, JSON.stringify(data, null, 2));
}

export default async function admin(sock, from, m, args) {
  const chat = await sock.groupMetadata(from).catch(() => null);
  if (!chat) return await sock.sendMessage(from, { text: "Este comando solo funciona en grupos." });

  const sender = m.key.participant || m.key.remoteJid;
  const isAdmin = chat.participants.some(p => p.id === sender && (p.admin === "admin" || p.admin === "superadmin"));
  if (!isAdmin) return await sock.sendMessage(from, { text: "❌ Solo administradores pueden usar este comando." });

  const subcmd = args[0];
  const mentioned = m.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
  const target = mentioned[0] || sender;

  const warns = loadWarns();

  switch (subcmd) {
    case "warn": {
      warns[target] = (warns[target] || 0) + 1;
      saveWarns(warns);
      await sock.sendMessage(from, {
        text: `⚠️ Usuario @${target.split("@")[0]} recibió un warn.\nTotal: ${warns[target]}`,
        mentions: [target],
      });
      if (warns[target] >= 3) {
        await sock.groupParticipantsUpdate(from, [target], "remove");
        warns[target] = 0;
        saveWarns(warns);
      }
      break;
    }

    case "unwarn": {
      warns[target] = Math.max((warns[target] || 0) - 1, 0);
      saveWarns(warns);
      await sock.sendMessage(from, {
        text: `✅ Warn eliminado. Usuario @${target.split("@")[0]} ahora tiene ${warns[target]} warns.`,
        mentions: [target],
      });
      break;
    }

    case "listadv": {
      let msg = "📋 Lista de warns:\n\n";
      for (const [user, count] of Object.entries(warns)) {
        msg += `- @${user.split("@")[0]}: ${count}\n`;
      }
      await sock.sendMessage(from, { text: msg || "📋 No hay warns registrados.", mentions: Object.keys(warns) });
      break;
    }

    case "k": {
      await sock.groupParticipantsUpdate(from, [target], "remove");
      await sock.sendMessage(from, { text: `👋 Usuario @${target.split("@")[0]} fue expulsado.`, mentions: [target] });
      break;
    }

    default:
      await sock.sendMessage(from, {
        text: "⚙️ Comandos de admin:\n- .warn @user\n- .unwarn @user\n- .listadv\n- .k @user",
      });
  }
}
