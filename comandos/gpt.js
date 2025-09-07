const { jidNormalizedUser } = require("@whiskeysockets/baileys");

const OPENAI_NUMBER = "18002428478@s.whatsapp.net"; // Número de OpenAI
const pendingQuestions = {}; // Guardará preguntas pendientes por chat

/**
 * Enviar la pregunta al número de OpenAI
 */
async function gpt(sock, from, message, args) {
    if (!args || args.length === 0) {
        await sock.sendMessage(from, { text: "❌ Escribe tu pregunta después del comando." });
        return;
    }

    const question = args.join(" ");
    pendingQuestions[question] = from;

    await sock.sendMessage(from, { text: `💬 Tu pregunta fue enviada a OpenAI. Esperando respuesta...` });

    // Reenviar la pregunta al número de OpenAI
    await sock.sendMessage(OPENAI_NUMBER, { text: question });
}

/**
 * Escuchar mensajes y reenviar respuestas desde OpenAI al grupo correspondiente
 */
async function handleResponse(sock, message) {
    try {
        const from = jidNormalizedUser(message.key.remoteJid);
        const text = message.message?.conversation || message.message?.extendedTextMessage?.text;

        if (!text) return;

        // Solo procesar mensajes que vienen del número de OpenAI
        if (from !== OPENAI_NUMBER) return;

        // Buscar la pregunta que coincide en pendingQuestions
        const question = Object.keys(pendingQuestions).find(q => text.toLowerCase().includes(q.toLowerCase()));
        if (!question) return;

        const targetGroup = pendingQuestions[question];
        delete pendingQuestions[question];

        await sock.sendMessage(targetGroup, { text: `💬 Respuesta de OpenAI:\n${text}` });
    } catch (err) {
        console.error("Error en gpt.js:", err);
    }
}

module.exports = gpt;
module.exports.handleResponse = handleResponse;
