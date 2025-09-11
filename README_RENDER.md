# Bot preparado para Render

Instrucciones:

1. Generar session localmente:

```bash
npm install
node index.js  # escanea QR en tu terminal
node create-session-bundle-base64.js > session.b64
```

2. Subir `SESSION` env en Render (contenido de session.b64)
3. En Render crear env OWNER_NUMBER y SESSION
4. Hacer deploy
5. Abrir https://<your-service>.onrender.com/qr para ver el PNG del QR si se generó
