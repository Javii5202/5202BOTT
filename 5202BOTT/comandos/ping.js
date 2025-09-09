import { performance } from "perf_hooks";
import chalk from "chalk";

export default async function ping(sock, from) {
  try {
    const start = performance.now();
    await sock.sendMessage(from, { text: "🏓 Probando velocidad..." });
    const end = performance.now();
    const pingTime = (end - start).toFixed(2);
    await sock.sendMessage(from, { text: `✅ 𝟝𝟚𝟘𝟚 está activo\n📡 Velocidad: ${pingTime} ms` });
    console.log(chalk.green(`Ping enviado a ${from}: ${pingTime} ms`));
  } catch (err) {
    console.error(chalk.red("Error en comando ping:"), err);
    await sock.sendMessage(from, { text: "❌ Error al calcular el ping." });
  }
}
