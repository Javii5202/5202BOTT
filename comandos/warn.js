const fs = require('fs');
const path = './assets/warns.json';

module.exports = {
  name: 'warn',
  description: 'Da una advertencia a un usuario',
  async execute(client, message, args) {
    try {
      const mentioned = message.mentionedJid || args[0]; // si es una mención real, toma el JID
      if (!mentioned) return client.sendMessage(message.from, '❌ Debes mencionar a alguien');

      // Leer archivo de warns
      let warns = {};
      if (fs.existsSync(path)) {
        warns = JSON.parse(fs.readFileSync(path, 'utf8'));
      }

      // Inicializar si no existe
      if (!warns[mentioned]) warns[mentioned] = 0;

      // Sumar warn
      warns[mentioned] += 1;

      // Guardar archivo
      fs.writeFileSync(path, JSON.stringify(warns, null, 2));

      client.sendMessage(message.from, `⚠️ ${mentioned} ahora tiene ${warns[mentioned]} advertencia(s)`);
    } catch (err) {
      console.error('Error en warn:', err);
    }
  }
};
