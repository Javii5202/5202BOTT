// comandos/economy.js
import fs from "fs";
import path from "path";

const DBPATH = path.join(process.cwd(), "economy.json");
const LOCKS = new Map(); // key -> true if locked

async function _wait(ms){ return new Promise(r=>setTimeout(r, ms)); }

async function acquire() {
  // simple async spinlock
  while (LOCKS.get(DBPATH)) await _wait(8);
  LOCKS.set(DBPATH, true);
}
function release(){ LOCKS.delete(DBPATH); }

function _readSync() {
  if (!fs.existsSync(DBPATH)) return { balances: {}, cooldowns: {} };
  try {
    const raw = fs.readFileSync(DBPATH, "utf8");
    return JSON.parse(raw);
  } catch (e) {
    console.error("economy: archivo corrupto o JSON inválido, reiniciando DB:", e);
    return { balances: {}, cooldowns: {} };
  }
}
function _writeSync(data) {
  const tmp = DBPATH + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, DBPATH);
}

export async function loadDB() {
  await acquire();
  try {
    const db = _readSync();
    if (!db.balances) db.balances = {};
    if (!db.cooldowns) db.cooldowns = {};
    return db;
  } finally {
    release();
  }
}

export async function saveDB(db) {
  await acquire();
  try {
    if (!db.balances) db.balances = {};
    if (!db.cooldowns) db.cooldowns = {};
    _writeSync(db);
  } finally {
    release();
  }
}

export function normalizeJid(jid){
  if (!jid) return jid;
  if (jid.endsWith("@g.us")) return jid;
  if (/@/.test(jid)) {
    if (jid.endsWith("@s.whatsapp.net") || jid.endsWith("@c.us")) return jid;
    return jid.replace(/@.*$/, "@s.whatsapp.net");
  }
  if (/^\d+$/.test(jid)) return `${jid}@s.whatsapp.net`;
  return jid;
}

// changeBalance: delta integer (can be negative). returns new balance.
export async function changeBalance(jid, delta) {
  jid = normalizeJid(jid);
  await acquire();
  try{
    const db = _readSync();
    db.balances = db.balances || {};
    const cur = Math.max(0, Math.floor(db.balances[jid] || 0));
    let next = cur + Math.floor(delta);
    if (next < 0) next = 0; // never negative
    db.balances[jid] = next;
    _writeSync(db);
    return next;
  } finally {
    release();
  }
}

export async function setBalance(jid, amount) {
  jid = normalizeJid(jid);
  await acquire();
  try{
    const db = _readSync();
    db.balances = db.balances || {};
    db.balances[jid] = Math.max(0, Math.floor(amount));
    _writeSync(db);
    return db.balances[jid];
  } finally { release(); }
}

export async function getBalance(jid){
  jid = normalizeJid(jid);
  await acquire();
  try{
    const db = _readSync();
    db.balances = db.balances || {};
    return Math.max(0, Math.floor(db.balances[jid] || 0));
  } finally { release(); }
}

// transfer from -> to (atomic)
export async function transfer(from, to, amount) {
  from = normalizeJid(from);
  to = normalizeJid(to);
  amount = Math.max(0, Math.floor(amount));
  if (amount <= 0) return { ok: false, reason: "amount_invalid" };

  await acquire();
  try{
    const db = _readSync();
    db.balances = db.balances || {};
    const balFrom = Math.max(0, Math.floor(db.balances[from] || 0));
    const real = Math.min(balFrom, amount);
    if (real <= 0) {
      _writeSync(db);
      return { ok: false, reason: "insufficient" };
    }
    db.balances[from] = balFrom - real;
    db.balances[to] = Math.max(0, Math.floor(db.balances[to] || 0)) + real;
    _writeSync(db);
    return { ok: true, amount: real, from: db.balances[from], to: db.balances[to] };
  } finally { release(); }
}

// cooldowns: check and optionally set
// checkCooldown(user, action) => { ok: boolean, remainingMs: number }
export async function checkCooldown(user, action, seconds) {
  user = normalizeJid(user);
  seconds = Number(seconds) || 0;
  await acquire();
  try {
    const db = _readSync();
    db.cooldowns = db.cooldowns || {};
    db.cooldowns[user] = db.cooldowns[user] || {};
    const last = db.cooldowns[user][action] || 0;
    const now = Date.now();
    const diff = now - last;
    if (diff >= seconds * 1000) return { ok: true, remainingMs: 0 };
    return { ok: false, remainingMs: seconds * 1000 - diff };
  } finally { release(); }
}
export async function setCooldown(user, action) {
  user = normalizeJid(user);
  await acquire();
  try {
    const db = _readSync();
    db.cooldowns = db.cooldowns || {};
    db.cooldowns[user] = db.cooldowns[user] || {};
    db.cooldowns[user][action] = Date.now();
    _writeSync(db);
  } finally { release(); }
}

export async function getAllBalances() {
  await acquire();
  try {
    const db = _readSync();
    return db.balances || {};
  } finally { release(); }
}

export function format(number) {
  return Number(number).toLocaleString("en-US");
}
