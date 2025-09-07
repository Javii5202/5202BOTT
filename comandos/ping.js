const { performance } = require("perf_hooks");
const chalk = require("chalk");

async function handler(sock, from) {
    try {
        const start = performance.now();

        // Enviar mensaje inicial
        const sent = await sock.sendMessage(from, { text: "🏓 Probando velocidad..." });

        const end = performance.now();
        const ping = end - start;

        // Editar el mensaje con el resultado
        await sock.sendMessage(from, {
            text: `✅ 𝟝𝟚𝟘𝟚 está activo\n📡 *Velocidad:* ${ping.toFixed(2)} ms`
        });

        console.log(chalk.green(`Ping enviado a ${from}: ${ping.toFixed(2)} ms`));

    } catch (err) {
        console.error(chalk.red("Error en comando ping:"), err);
        await sock.sendMessage(from, { text: "❌ Ocurrió un error al calcular el ping." });
    }
}

module.exports = handler;
