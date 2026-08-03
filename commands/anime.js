const axios = require('axios');

module.exports = async function(sock, chatId, msg, q) {
    if (!q) return await sock.sendMessage(chatId, { text: '⚠️ Please provide an anime name! Usage: .anime <name>' }, { quoted: msg });
    
    try {
        await sock.sendMessage(chatId, { react: { text: '🎌', key: msg.key } });
        await sock.sendMessage(chatId, { text: '🔍 Searching anime...' }, { quoted: msg });
        
        const response = await axios.get(`https://prexzyapis.com/anime/animesearch?q=${encodeURIComponent(q)}`, { timeout: 10000 });
        const data = response.data;
        
        if (data && data.status && data.result && data.result.length > 0) {
            const anime = data.result[0];
            const text = `*🎌 ${anime.title}*\n\n` +
                `📌 Type: ${anime.type}\n` +
                `📊 Status: ${anime.status}\n` +
                `🎞️ Episodes: ${anime.episode}\n` +
                `🔊 Sub/Dub: ${anime.subtitleType || 'N/A'}\n\n` +
                `🔗 URL: ${anime.url}`;
            
            if (anime.image) {
                await sock.sendMessage(chatId, { image: { url: anime.image }, caption: text }, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text }, { quoted: msg });
            }
        } else {
            await sock.sendMessage(chatId, { text: '❌ No anime found!' }, { quoted: msg });
        }
    } catch (e) {
        console.error("Anime Search Error:", e.message);
        await sock.sendMessage(chatId, { text: '⚠️ Error: ' + e.message }, { quoted: msg });
    }
};
