const axios = require('axios');

module.exports = async function(sock, chatId, msg, q) {
    if (!q) return await sock.sendMessage(chatId, { text: '⚠️ Please provide text to say! Usage: .say <text>' }, { quoted: msg });
    
    try {
        await sock.sendMessage(chatId, { react: { text: '🗣️', key: msg.key } });
        
        // Using Prexzy API for TTS (Mike voice)
        const apiUrl = `https://prexzyapis.com/tts/tts-mike?text=${encodeURIComponent(q)}`;
        
        await sock.sendMessage(chatId, { 
            audio: { url: apiUrl },
            mimetype: 'audio/mp4',
            ptt: true
        }, { quoted: msg });
        
        await sock.sendMessage(chatId, { react: { text: '✅', key: msg.key } });
    } catch (e) {
        console.error('Say Error:', e.message);
        await sock.sendMessage(chatId, { text: '❌ Error generating voice: ' + e.message }, { quoted: msg });
    }
};
