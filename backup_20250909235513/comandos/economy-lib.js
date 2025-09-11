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

// inicializa usuario si no existe
export function initUser(economia, user) {
  if (!user) return;
  economia[user] ||= {
    dinero: 0,
    lastWork: 0,
    lastBeg: 0,
    lastSteal: 0,
    lastDaily: 0
  };
}

// random
export function getRandom(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// formato ms
export function formatMs(ms) {
  const sec = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(sec / 60);
  const seconds = sec % 60;
  return `${minutes}m ${seconds}s`;
}

// obtiene sender (grupos/privados)
export function getSender(m) {
  return m?.key?.participant || m?.key?.remoteJid;
}

// obtiene el primer mencionado o el citado
export function getMentionedOrQuoted(m) {
  const mentioned = m?.message?.extendedTextMessage?.contextInfo?.mentionedJid;
  if (mentioned?.length) return mentioned[0];
  const quoted = m?.message?.extendedTextMessage?.contextInfo?.participant;
  return quoted || null;
}
