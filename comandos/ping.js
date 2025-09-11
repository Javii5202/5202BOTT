import { performance } from "perf_hooks";

async function __orig_ping(sock, from) {

  const start = performance.now();
  await sock.sendMessage(from, { text: "🏓 Probando velocidad..." });
  const end = performance.now();
  const pingTime = (end - start).toFixed(2);
  await sock.sendMessage(from, { text: `✅ 5202 está activo\n📡 Velocidad: ${pingTime} ms` });

}


export default async function command_handler(sock, from, m, args, quotedMessage, meta) {
  try {
    return await __orig_ping(sock, from);
  } catch (err) {
    console.error("Error wrapper ejecutando comando ping.js:", err);
    throw err;
  }
}

