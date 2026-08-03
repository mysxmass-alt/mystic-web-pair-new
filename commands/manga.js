const axios = require('axios');

module.exports = async function(sock, chatId, msg, q) {
    if (!q) return await sock.sendMessage(chatId, { text: '⚠️ Please provide a manga name! Usage: .manga <name>' }, { quoted: msg });
    
    try {
        await sock.sendMessage(chatId, { react: { text: '📖', key: msg.key } });
        await sock.sendMessage(chatId, { text: '🔍 Searching manga...' }, { quoted: msg });
        
        const response = await axios.get(`https://prexzyapis.com/anime/manga-search?q=${encodeURIComponent(q)}`, { timeout: 10000 });
        const data = response.data;
        
        if (data && data.status && data.result && data.result.length > 0) {
            const manga = data.result[0];
            const text = `*📖 ${manga.title}*\n\n` +
                `ℹ️ Description: ${manga.desc || 'No description available.'}\n\n` +
                `🔗 URL: ${manga.url}`;
            
            if (manga.image) {
                await sock.sendMessage(chatId, { image: { url: manga.image }, caption: text }, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text }, { quoted: msg });
            }
        } else {
            await sock.sendMessage(chatId, { text: '❌ No manga found!' }, { quoted: msg });
        }
    } catch (e) {
        console.error("Manga Search Error:", e.message);
        await sock.sendMessage(chatId, { text: '⚠️ Error: ' + e.message }, { quoted: msg });
    }
};
