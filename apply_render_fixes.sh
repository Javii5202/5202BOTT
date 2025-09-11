#!/usr/bin/env bash
set -euo pipefail

# apply_render_fixes.sh
# Ejecutar: chmod +x apply_render_fixes.sh
# Luego: ./apply_render_fixes.sh
# Hace cambios automáticos para dejar el repo "ready for Render" y genera project_render_ready_*.zip

TIMESTAMP=$(date +%Y%m%d%H%M%S)
BACKUP_DIR="backup_$TIMESTAMP"
mkdir -p "$BACKUP_DIR"
echo "==> Backup en: $BACKUP_DIR"

# 1) Backups generales
echo "-> Copiando archivos clave al backup..."
for f in package.json package-lock.json index.js app.js server.js; do
  [ -f "$f" ] && cp -v "$f" "$BACKUP_DIR/" || true
done
[ -d comandos ] && cp -r comandos "$BACKUP_DIR/" || true
[ -d session ] && cp -r session "$BACKUP_DIR/session" || true

# 2) Crear .env.example si no existe
if [ ! -f .env.example ]; then
  cat > .env.example <<'ENVEX'
# Ejemplo .env
PORT=
NODE_ENV=production

# Redis (Render Key Value)
REDIS_URL=redis://:password@redis-host:6379

# Servicios externos (rellenar)
OPENAI_KEY=
TWILIO_SID=
TWILIO_TOKEN=
WHATSAPP_PHONE=
SESSION_STORE=redis   # 'redis' o 'file' (dev)
ENVEX
  echo "-> .env.example creado"
else
  echo "-> .env.example ya existe, no lo sobrescribo"
fi

# 3) .nvmrc (Node 18 LTS recomendable)
if [ ! -f .nvmrc ]; then
  echo "18" > .nvmrc
  echo "-> .nvmrc creado con Node 18"
fi

# 4) Asegurar scripts.start y engines en package.json
if [ -f package.json ]; then
  node - <<'NODE' || true
const fs=require('fs');
const p=JSON.parse(fs.readFileSync('package.json','utf8'));
let changed=false;
if(!p.scripts) p.scripts={};
if(!p.scripts.start){ p.scripts.start="node index.js"; changed=true; }
if(!p.engines){ p.engines = { "node": "18.x" }; changed=true; }
if(changed){ fs.writeFileSync('package.json', JSON.stringify(p,null,2)); console.log('-> package.json actualizado (start/engines).'); } else { console.log('-> package.json OK.'); }
NODE
else
  echo "-> package.json no encontrado. Asegurate de ejecutar en la raíz del proyecto."
fi

# 5) Reemplazar patrones comunes de listen(...) por process.env.PORT || <num> y bind 0.0.0.0
# Guardamos backups por archivo modificado
echo "-> Buscando occurrences de listen(...) para reemplazar patrones comunes..."
FILES_TO_PATCH=$(grep -R --line-number -E "listen\\(|server.listen\\(" . 2>/dev/null | awk -F: '{print $1}' | sort -u || true)
if [ -n "$FILES_TO_PATCH" ]; then
  for f in $FILES_TO_PATCH; do
    echo "   - Procesando $f"
    cp "$f" "$BACKUP_DIR/$(basename $f).bak"
    # Reemplazo simple: listen(3000, ...) -> listen(process.env.PORT || 3000, '0.0.0.0', ...)
    # Manejo varios casos comunes. No cubre todos los JS complejos.
    sed -E -i "s/listen\\(([[:space:]]*)([0-9]{2,5})([[:space:]]*),/listen(process.env.PORT || \\2, '0.0.0.0',/" "$f" || true
    sed -E -i "s/listen\\(([[:space:]]*)([0-9]{2,5})([[:space:]]*)\\)/listen(process.env.PORT || \\2, '0.0.0.0')/" "$f" || true
    sed -E -i "s/server.listen\\(([[:space:]]*)([0-9]{2,5})([[:space:]]*),/server.listen(process.env.PORT || \\2, '0.0.0.0',/" "$f" || true
    sed -E -i "s/server.listen\\(([[:space:]]*)([0-9]{2,5})([[:space:]]*)\\)/server.listen(process.env.PORT || \\2, '0.0.0.0')/" "$f" || true
    # Asegurar existencia de const PORT = process.env.PORT || 3000; (solo si no existe)
    if ! grep -q "process.env.PORT" "$f"; then
      # Intentamos insertar al inicio del archivo
      sed -i "1i const PORT = process.env.PORT || 3000;\nconst HOST = '0.0.0.0';" "$f" || true
    fi
  done
else
  echo "-> No se encontraron archivos con listen(...) (puede que tu servidor no exponga HTTP o el patrón sea distinto)."
fi

# 6) Si existe carpeta session -> crear session.example (copia), y excluir session real del zip final
if [ -d "session" ]; then
  if [ -d "session.example" ]; then
    echo "-> session.example ya existe, no la sobreescribo"
  else
    cp -r session session.example
    echo "-> Copiada session -> session.example"
  fi
else
  echo "-> No existe carpeta session en repo"
fi

# 7) Crear adapters/redisSession.js (ejemplo) y adapters/fileSessionFallback.js
mkdir -p adapters
cat > adapters/redisSession.js <<'JS'
/**
 * adapters/redisSession.js
 * Ejemplo mínimo. Instalar: npm i ioredis
 */
const Redis = require('ioredis');
const redisUrl = process.env.REDIS_URL || null;
let client = null;
if (redisUrl) {
  client = new Redis(redisUrl);
} else {
  console.warn('REDIS_URL no configurado. Adapter Redis no funcional sin Redis.');
}
module.exports = {
  async save(key, obj) {
    if (!client) throw new Error('Redis no inicializado');
    await client.set(`session:${key}`, JSON.stringify(obj));
  },
  async load(key) {
    if (!client) return null;
    const v = await client.get(`session:${key}`);
    return v ? JSON.parse(v) : null;
  },
  async del(key) {
    if (!client) return null;
    await client.del(`session:${key}`);
  }
};
JS
echo "-> Creado adapters/redisSession.js (ejemplo)"

cat > adapters/fileSessionFallback.js <<'JS'
/**
 * adapters/fileSessionFallback.js
 * Guarda session en disco — solo para desarrollo. En Render el filesystem es efímero.
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
JS
echo "-> Creado adapters/fileSessionFallback.js"

# 8) Crear render.yaml de ejemplo
cat > render.yaml <<'YAML'
services:
  - type: web
    name: 5202bott-web
    env: node
    plan: free
    buildCommand: npm ci
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
YAML
echo "-> render.yaml creado (ejemplo). Ajustar nombre y plan según prefieras."

# 9) Dockerfile para Puppeteer/Chromium (opcional)
cat > Dockerfile.puppeteer <<'DOCK'
# Dockerfile.puppeteer (opcional para proyectos que usan puppeteer/chromium)
FROM node:18-bullseye

RUN apt-get update && apt-get install -y \
    ca-certificates fonts-liberation libappindicator3-1 libasound2 libatk1.0-0 \
    libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 \
    libglib2.0-0 libgtk-3-0 libnspr4 libnss3 libpango-1.0-0 libx11-6 libx11-xcb1 \
    libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 \
    libxrandr2 libxrender1 libxss1 libxtst6 lsb-release wget xdg-utils --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
CMD ["npm","start"]
DOCK
echo "-> Dockerfile.puppeteer creado (opcional)."

# 10) README.render.md
cat > README.render.md <<'MD'
# Deploy en Render - instrucciones (generado automáticamente)

Pasos rápidos:
1. Subir repo a GitHub o subir ZIP al servicio Render.
2. Crear servicio:
   - Si tu bot necesita HTTP (webhooks/health) -> Web Service.
   - Si solo corre en background sin recibir HTTP -> Background Worker.
3. En Build/Start:
   - Build command: `npm ci`
   - Start command: `npm start` (o usar Dockerfile.puppeteer si necesitas Chromium)
4. Variables de entorno (copiar desde .env.example):
   - NODE_ENV=production
   - REDIS_URL=redis://:password@host:6379 (si usas Redis)
   - OPENAI_KEY, etc.
5. IMPORTANTE: No subir `.env` ni `session/` con credenciales reales.
6. Si necesitas persistencia de sesión en Render (plan free no tiene Persistent Disk), usa Redis (Key Value) ofrecido por Render o un servicio externo.
MD
echo "-> README.render.md creado."

# 11) CHANGELOG_RENDER.txt
cat > CHANGELOG_RENDER.txt <<'CH'
CHANGELOG (automático) - Cambios aplicados por apply_render_fixes.sh
- Se creó .env.example
- Se creó .nvmrc (Node 18)
- package.json: añadido start y engines (si faltaban)
- Reemplazo (intento) de listen(...) por process.env.PORT || <port> y binding a 0.0.0.0 (backup en folder)
- Copia session -> session.example (si existía)
- Creado adapters/redisSession.js y adapters/fileSessionFallback.js
- Creado render.yaml (ejemplo) y README.render.md
- Creado Dockerfile.puppeteer (opcional)
CH
echo "-> CHANGELOG_RENDER.txt creado."

# 12) Opcional: instalar dependencias (descomentá si querés que lo haga aquí)
# echo "-> Ejecutando npm ci (opcional)..."
# npm ci

# 13) Empaquetar en ZIP excluyendo .env y session real
ZIPNAME="project_render_ready_${TIMESTAMP}.zip"
echo "-> Creando ZIP: $ZIPNAME (excluye node_modules, .env, session/)"
zip -r "$ZIPNAME" . -x "node_modules/*" -x ".git/*" -x ".env" -x "session/*" -x "backup_*" > /dev/null || true
echo "-> ZIP creado: $ZIPNAME"

echo ""
echo "==> FIN. Revisa backup en $BACKUP_DIR. ZIP final: $ZIPNAME"
echo "Si algo no quedó bien, pegá aquí el contenido de los backups (por ejemplo: $BACKUP_DIR) y te doy el parche línea a línea."
