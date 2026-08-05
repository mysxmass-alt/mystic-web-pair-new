const axios = require('axios');

module.exports = async function(sock, chatId, msg, q) {
    if (!q) return await sock.sendMessage(chatId, { text: '⚠️ Please provide a manga name! Usage: .manga <name>' }, { quoted: msg });
    
    try {
        await sock.sendMessage(chatId, { react: { text: '📖', key: msg.key } });
        await sock.sendMessage(chatId, { text: '🔍 Searching manga on MyAnimeList...' }, { quoted: msg });
        
        // Using Jikan API (MyAnimeList) for comprehensive manga data
        const response = await axios.get(`https://api.jikan.moe/v4/manga?q=${encodeURIComponent(q)}&limit=1`, { timeout: 10000 });
        const data = response.data;
        
        if (data && data.data && data.data.length > 0) {
            const manga = data.data[0];
            
            // Format genres and authors
            const genres = manga.genres ? manga.genres.map(g => g.name).join(', ') : 'N/A';
            const authors = manga.authors ? manga.authors.map(a => a.name).join(', ') : 'N/A';
            
            const text = `*📖 ${manga.title}* (${manga.title_japanese || ''})\n\n` +
                `⭐ *Score:* ${manga.score || 'N/A'}\n` +
                `📌 *Type:* ${manga.type || 'N/A'}\n` +
                `📊 *Status:* ${manga.status || 'N/A'}\n` +
                `📚 *Chapters:* ${manga.chapters || 'N/A'}\n` +
                `📕 *Volumes:* ${manga.volumes || 'N/A'}\n` +
                `✍️ *Authors:* ${authors}\n` +
                `🎭 *Genres:* ${genres}\n\n` +
                `📝 *Synopsis:* ${manga.synopsis ? manga.synopsis.substring(0, 400) + '...' : 'No synopsis available.'}\n\n` +
                `🔗 *URL:* ${manga.url}`;
            
            const imageUrl = manga.images?.jpg?.large_image_url || manga.images?.jpg?.image_url;
            
            if (imageUrl) {
                await sock.sendMessage(chatId, { image: { url: imageUrl }, caption: text }, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text }, { quoted: msg });
            }
            await sock.sendMessage(chatId, { react: { text: '✅', key: msg.key } });
        } else {
            // Fallback to Prexzy if Jikan fails or returns nothing
            console.log("Jikan found nothing, trying Prexzy...");
            const prexzyRes = await axios.get(`https://prexzyapis.com/anime/manga-search?q=${encodeURIComponent(q)}`, { timeout: 10000 });
            if (prexzyRes.data && prexzyRes.data.status && prexzyRes.data.result && prexzyRes.data.result.length > 0) {
                const manga = prexzyRes.data.result[0];
                const text = `*📖 ${manga.title}*\n\n` +
                    `ℹ️ Description: ${manga.desc || 'No description available.'}\n\n` +
                    `🔗 URL: ${manga.url}`;
                
                if (manga.image) {
                    await sock.sendMessage(chatId, { image: { url: manga.image }, caption: text }, { quoted: msg });
                } else {
                    await sock.sendMessage(chatId, { text }, { quoted: msg });
                }
                await sock.sendMessage(chatId, { react: { text: '✅', key: msg.key } });
            } else {
                await sock.sendMessage(chatId, { text: '❌ No manga found!' }, { quoted: msg });
            }
        }
    } catch (e) {
        console.error("Manga Search Error:", e.message);
        await sock.sendMessage(chatId, { text: '⚠️ Error: ' + e.message }, { quoted: msg });
    }
};
