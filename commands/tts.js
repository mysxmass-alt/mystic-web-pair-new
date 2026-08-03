const axios = require('axios');

module.exports = async function(sock, chatId, msg, q) {
    if (!q) return await sock.sendMessage(chatId, { text: '\u26A0\uFE0F .tts <text>' }, { quoted: msg });
    
    try {
        await sock.sendMessage(chatId, { react: { text: '🗣️', key: msg.key } });
        await sock.sendMessage(chatId, { text: '\u1F442 Generating TTS...' }, { quoted: msg });
        
        // Using Prexzy API for TTS
        const apiUrl = `https://prexzyapis.com/tts/tts-adult-female--1-american-english-truvoice?text=${encodeURIComponent(q)}`;
        const response = await axios.get(apiUrl);
        
        if (response.data && response.data.status && response.data.audio_url && response.data.audio_url.result) {
            const audioUrl = response.data.audio_url.result;
            
            await sock.sendMessage(chatId, { 
                audio: { url: audioUrl },
                mimetype: 'audio/mp4',
                ptt: true
            }, { quoted: msg });
            
            await sock.sendMessage(chatId, { react: { text: '✅', key: msg.key } });
        } else {
            throw new Error("Failed to generate TTS from Prexzy API.");
        }
    } catch (e) {
        console.error('TTS Error:', e.message);
        // Fallback to Google TTS
        try {
            const googleTtsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(q)}&tl=en&client=tw-ob`;
            await sock.sendMessage(chatId, { 
                audio: { url: googleTtsUrl },
                mimetype: 'audio/mp4',
                ptt: true
            }, { quoted: msg });
        } catch (err) {
            await sock.sendMessage(chatId, { text: `\u1F442 TTS: "${q}"` }, { quoted: msg });
        }
    }
};
