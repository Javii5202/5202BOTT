/**
File fallback adapter (development only).
Saves session files under session_store/ in repo (ephemeral on Render).
*/
const fs = require('fs');
const path = require('path');
const base = path.resolve(__dirname, '../session_store');
if (!fs.existsSync(base)) fs.mkdirSync(base, { recursive: true });
module.exports = {
  save(key, obj) {
    fs.writeFileSync(path.join(base, key + '.json'), JSON.stringify(obj, null,2));
  },
  load(key) {
    const p = path.join(base, key + '.json');
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p,'utf8'));
  },
  del(key) {
    const p = path.join(base, key + '.json');
    if (fs.existsSync(p)) fs.unlinkSync(p);
  }
};