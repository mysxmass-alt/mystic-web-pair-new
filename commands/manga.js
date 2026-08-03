const axios = require('axios');

module.exports = async function(sock, chatId, msg, q) {
    if (!q) return await sock.sendMessage(chatId, { text: '⚠️ Please provide a manga name! Usage: .manga <name>' }, { quoted: msg });
    
    try {
        await sock.sendMessage(chatId, { react: { text: '📖', key: msg.key } });
        await sock.sendMessage(chatId, { text: '🔍 Searching manga...' }, { quoted: msg });
        
        const response = await axios.get(`https://prexzyapis.com/anime/manga-search?query=${encodeURIComponent(q)}`, { timeout: 10000 });
        
        if (response.data && response.data.status && response.data.data && response.data.data.length > 0) {
            const manga = response.data.data[0];
            const text = `*📖 ${manga.title}*\n\n` +
                `🎭 Genres: ${manga.genres.join(', ')}\n` +
                `📑 Latest: ${manga.latestChapterTitle}\n` +
                `ℹ️ Info: ${manga.description}\n\n` +
                `🔗 Source: ${manga.source}`;
            
            if (manga.coverImages && manga.coverImages.length > 0) {
                await sock.sendMessage(chatId, { image: { url: manga.coverImages[0] }, caption: text }, { quoted: msg });
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
