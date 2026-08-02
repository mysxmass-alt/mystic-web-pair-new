module.exports = async function(sock, chatId, msg, session, args) {
    const text = args.join(' ');
    
    if (!text) {
        return await sock.sendMessage(chatId, { 
            text: `*🤖 MYSTIC AI CHATBOT*\n\n` +
                `Status: ${session.aiEnabled ? '✅ ON' : '❌ OFF'}\n\n` +
                `*Commands:*\n` +
                `• .chatbot on - Enable auto-reply\n` +
                `• .chatbot off - Disable auto-reply\n` +
                `• .chatbot <message> - Chat with me directly!` 
        }, { quoted: msg });
    }

    if (text.toLowerCase() === 'on') {
        session.aiEnabled = true;
        await sock.sendMessage(chatId, { text: '🌸 *Chatbot AI ON!* I will now auto-reply to your messages lovingy, mystic-chan!' }, { quoted: msg });
    } else if (text.toLowerCase() === 'off') {
        session.aiEnabled = false;
        await sock.sendMessage(chatId, { text: '💔 *Chatbot AI OFF!* I\'ll miss you, mystic-chan...' }, { quoted: msg });
    } else {
        // Direct chat
        try {
            await sock.sendMessage(chatId, { react: { text: '💖', key: msg.key } });
            const aiResponse = await session.getAIResponse(chatId, text);
            await sock.sendMessage(chatId, { text: aiResponse }, { quoted: msg });
        } catch (e) {
            await sock.sendMessage(chatId, { text: '⚠️ Gomen, mystic-chan! I had a little trouble responding.' }, { quoted: msg });
        }
    }
};
