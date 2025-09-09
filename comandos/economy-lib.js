// comandos/economy-lib.js
import fs from "fs";
import path from "path";

const ECONOMIA_PATH = path.join(process.cwd(), "economia.json");

export function loadEconomia() {
  try {
    if (!fs.existsSync(ECONOMIA_PATH)) {
      fs.writeFileSync(ECONOMIA_PATH, JSON.stringify({}, null, 2));
    }
    const raw = fs.readFileSync(ECONOMIA_PATH, "utf8");
    return JSON.parse(raw || "{}");
  } catch (e) {
    console.error("Error loadEconomia:", e);
    return {};
  }
}

export function saveEconomia(data) {
  try {
    fs.writeFileSync(ECONOMIA_PATH, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("Error saveEconomia:", e);
  }
}

export function initUser(economia, user) {
  if (!user) return;
  if (!economia[user]) {
    economia[user] = {
      dinero: 0,
      lastWork: 0,
      lastBeg: 0,
      lastSteal: 0,
      lastDaily: 0
    };
  } else {
    // asegurar campos
    economia[user].dinero = economia[user].dinero || 0;
    economia[user].lastWork = economia[user].lastWork || 0;
    economia[user].lastBeg = economia[user].lastBeg || 0;
    economia[user].lastSteal = economia[user].lastSteal || 0;
    economia[user].lastDaily = economia[user].lastDaily || 0;
  }
}

export function getRandom(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function formatMs(ms) {
  const sec = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(sec / 60);
  const seconds = sec % 60;
  return `${minutes}m ${seconds}s`;
}

export function getSender(m) {
  // participant en grupos, remoteJid en privados
  return m?.key?.participant || m?.key?.remoteJid;
}

export function getMentionedOrQuoted(m) {
  // Primero mentions
  const mentioned = m?.message?.extendedTextMessage?.contextInfo?.mentionedJid;
  if (mentioned && mentioned.length) return mentioned[0];
  // Si fue reply -> participant del quoted message
  const quotedParticipant = m?.message?.extendedTextMessage?.contextInfo?.participant;
  if (quotedParticipant) return quotedParticipant;
  return null;
}
