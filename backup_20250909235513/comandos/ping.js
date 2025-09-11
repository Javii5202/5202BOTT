import { performance } from "perf_hooks";

export default async function ping(sock, from) {
  const start = performance.now();
  await sock.sendMessage(from, { text: "🏓 Probando velocidad..." });
  const end = performance.now();
  const pingTime = (end - start).toFixed(2);
  await sock.sendMessage(from, { text: `✅ 5202 está activo\n📡 Velocidad: ${pingTime} ms` });
}
