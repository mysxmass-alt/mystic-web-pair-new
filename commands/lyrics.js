const axios = require('axios');

module.exports = async function(sock, chatId, msg, q) {
    if (!q) return await sock.sendMessage(chatId, { text: '\u26A0\uFE0F .lyrics <song name>' }, { quoted: msg });
    
    try {
        await sock.sendMessage(chatId, { react: { text: '🎵', key: msg.key } });
        await sock.sendMessage(chatId, { text: '\u1F3B5 Searching lyrics...' }, { quoted: msg });
        
        // Using Prexzy API for lyrics
        const apiUrl = `https://prexzyapis.com/search/lyrics?title=${encodeURIComponent(q)}`;
        const response = await axios.get(apiUrl);
        
        if (response.data && response.data.status && response.data.data) {
            const song = response.data.data;
            const text = `*\u1F3B5 ${song.title}*\n` +
                `_by ${song.artist}_\n\n` +
                `${song.lyrics.substring(0, 3000)}\n\n` +
                `${song.lyrics.length > 3000 ? '_... (truncated)_' : ''}\n\n` +
                `> © POWERED BY MYSTIC XMD`;
            
            await sock.sendMessage(chatId, { text }, { quoted: msg });
            await sock.sendMessage(chatId, { react: { text: '✅', key: msg.key } });
        } else {
            await sock.sendMessage(chatId, { 
                text: `\u274C Lyrics not found for "${q}" on Prexzy API.` 
            }, { quoted: msg });
        }
    } catch (e) {
        console.error('Lyrics Error:', e.message);
        await sock.sendMessage(chatId, { text: '\u274C Error: ' + e.message }, { quoted: msg });
    }
};
