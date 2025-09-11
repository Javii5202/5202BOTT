// Run locally to generate a base64-encoded JSON of session/ folder
const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, 'session');
if (!fs.existsSync(dir)) { console.error('No session/ folder found'); process.exit(1); }
const out = {};
for (const file of fs.readdirSync(dir)) {
  const full = path.join(dir, file);
  try { out[file] = JSON.parse(fs.readFileSync(full,'utf8')); } catch(e) { out[file] = fs.readFileSync(full,'utf8'); }
}
const json = JSON.stringify(out);
console.log(Buffer.from(json,'utf8').toString('base64'));
