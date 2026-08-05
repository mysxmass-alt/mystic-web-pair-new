const axios = require('axios');

module.exports = async function(sock, chatId, msg, q) {
    if (!q) return await sock.sendMessage(chatId, { text: '⚠️ Please provide an anime name! Usage: .anime <name>' }, { quoted: msg });
    
    try {
        await sock.sendMessage(chatId, { react: { text: '🎌', key: msg.key } });
        await sock.sendMessage(chatId, { text: '🔍 Searching anime on MyAnimeList...' }, { quoted: msg });
        
        // Using Jikan API (MyAnimeList) for comprehensive anime data
        const response = await axios.get(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(q)}&limit=1`, { timeout: 10000 });
        const data = response.data;
        
        if (data && data.data && data.data.length > 0) {
            const anime = data.data[0];
            
            // Format genres and studios
            const genres = anime.genres ? anime.genres.map(g => g.name).join(', ') : 'N/A';
            const studios = anime.studios ? anime.studios.map(s => s.name).join(', ') : 'N/A';
            
            const text = `*🎌 ${anime.title}* (${anime.title_japanese || ''})\n\n` +
                `⭐ *Score:* ${anime.score || 'N/A'}\n` +
                `📌 *Type:* ${anime.type || 'N/A'}\n` +
                `📊 *Status:* ${anime.status || 'N/A'}\n` +
                `🎞️ *Episodes:* ${anime.episodes || 'N/A'}\n` +
                `🕒 *Duration:* ${anime.duration || 'N/A'}\n` +
                `📅 *Aired:* ${anime.aired?.string || 'N/A'}\n` +
                `🏢 *Studios:* ${studios}\n` +
                `🎭 *Genres:* ${genres}\n\n` +
                `📝 *Synopsis:* ${anime.synopsis ? anime.synopsis.substring(0, 400) + '...' : 'No synopsis available.'}\n\n` +
                `🔗 *URL:* ${anime.url}`;
            
            const imageUrl = anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url;
            
            if (imageUrl) {
                await sock.sendMessage(chatId, { image: { url: imageUrl }, caption: text }, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text }, { quoted: msg });
            }
            await sock.sendMessage(chatId, { react: { text: '✅', key: msg.key } });
        } else {
            // Fallback to Prexzy if Jikan fails or returns nothing
            console.log("Jikan found nothing, trying Prexzy...");
            const prexzyRes = await axios.get(`https://prexzyapis.com/anime/animesearch?q=${encodeURIComponent(q)}`, { timeout: 10000 });
            if (prexzyRes.data && prexzyRes.data.status && prexzyRes.data.result && prexzyRes.data.result.length > 0) {
                const anime = prexzyRes.data.result[0];
                const text = `*🎌 ${anime.title}*\n\n` +
                    `📌 Type: ${anime.type}\n` +
                    `📊 Status: ${anime.status}\n` +
                    `🎞️ Episodes: ${anime.episode}\n\n` +
                    `🔗 URL: ${anime.url}`;
                
                if (anime.image) {
                    await sock.sendMessage(chatId, { image: { url: anime.image }, caption: text }, { quoted: msg });
                } else {
                    await sock.sendMessage(chatId, { text }, { quoted: msg });
                }
                await sock.sendMessage(chatId, { react: { text: '✅', key: msg.key } });
            } else {
                await sock.sendMessage(chatId, { text: '❌ No anime found!' }, { quoted: msg });
            }
        }
    } catch (e) {
        console.error("Anime Search Error:", e.message);
        await sock.sendMessage(chatId, { text: '⚠️ Error: ' + e.message }, { quoted: msg });
    }
};
