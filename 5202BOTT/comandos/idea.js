// comandos/idea.js

module.exports = async function idea(sock, from, text) {
    // Quitar el comando ".idea" y espacios extra
    const contenido = text.replace(".idea", "").trim();

    if (!contenido) {
        await sock.sendMessage(from, { text: "⚠️ Escribí tu idea después de .idea" });
        return;
    }

    // Confirmar recepción de la idea
    const mensaje = `✅ Tu idea fue recibida: "${contenido}"`;
    await sock.sendMessage(from, { text: mensaje });
};
