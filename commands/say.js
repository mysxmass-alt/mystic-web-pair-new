const axios = require('axios');

module.exports = async function(sock, chatId, msg, q) {
    if (!q) return await sock.sendMessage(chatId, { text: '⚠️ Please provide text to say! Usage: .say <text>' }, { quoted: msg });
    
    try {
        await sock.sendMessage(chatId, { react: { text: '🗣️', key: msg.key } });
        
        // Using Prexzy API for TTS (Mike voice)
        const apiUrl = `https://prexzyapis.com/tts/tts-mike?text=${encodeURIComponent(q)}`;
        const response = await axios.get(apiUrl);
        const data = response.data;

        if (data && data.status && data.audio_url) {
            const audioUrl = data.audio_url.result || data.audio_url;
            await sock.sendMessage(chatId, { 
                audio: { url: audioUrl },
                mimetype: 'audio/mp4',
                ptt: true
            }, { quoted: msg });
            
            await sock.sendMessage(chatId, { react: { text: '✅', key: msg.key } });
        } else {
            await sock.sendMessage(chatId, { text: '❌ Failed to generate voice. Please try again.' }, { quoted: msg });
        }
    } catch (e) {
        console.error('Say Error:', e.message);
        await sock.sendMessage(chatId, { text: '❌ Error generating voice: ' + e.message }, { quoted: msg });
    }
};
