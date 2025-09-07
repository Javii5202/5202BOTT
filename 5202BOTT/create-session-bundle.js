// create-session-bundle.js
const fs = require('fs');
const path = require('path');

const sessionDir = path.join(__dirname, 'session');
if (!fs.existsSync(sessionDir)) {
  console.error('No existe la carpeta session/ en este directorio');
  process.exit(1);
}

const out = {};
const files = fs.readdirSync(sessionDir);
files.forEach(file => {
  const full = path.join(sessionDir, file);
  try {
    out[file] = JSON.parse(fs.readFileSync(full, 'utf8'));
  } catch (e) {
    // si el archivo no es JSON (raro), lo guardamos como texto
    out[file] = fs.readFileSync(full, 'utf8');
  }
});

console.log(JSON.stringify(out));
