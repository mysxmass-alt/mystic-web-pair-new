const axios = require('axios');

module.exports = async function(sock, chatId, msg, q) {
    if (!q) return await sock.sendMessage(chatId, { text: '⚠️ Please provide an anime name! Usage: .anime <name>' }, { quoted: msg });
    
    try {
        await sock.sendMessage(chatId, { react: { text: '🎌', key: msg.key } });
        await sock.sendMessage(chatId, { text: '🔍 Searching anime...' }, { quoted: msg });
        
        // Primary: Prexzy Anime Search (More reliable than Jikan currently)
        const prexzyUrl = `https://prexzyapis.com/anime/animesearch?query=${encodeURIComponent(q)}`;
        try {
            const response = await axios.get(prexzyUrl, { timeout: 10000 });
            const data = response.data;
            
            if (data && data.status && data.data && data.data.results && data.data.results.length > 0) {
                const anime = data.data.results[0];
                const text = `*🎌 ${anime.title}*\n\n` +
                    `📌 *Type:* ${anime.type || 'N/A'}\n` +
                    `📊 *Status:* ${anime.status || 'N/A'}\n` +
                    `🎞️ *Episodes:* ${anime.episode || 'N/A'}\n` +
                    `🔊 *Sub/Dub:* ${anime.subtitleType || 'N/A'}\n\n` +
                    `🔗 *URL:* ${anime.url}`;
                
                if (anime.image) {
                    await sock.sendMessage(chatId, { image: { url: anime.image }, caption: text }, { quoted: msg });
                } else {
                    await sock.sendMessage(chatId, { text }, { quoted: msg });
                }
                await sock.sendMessage(chatId, { react: { text: '✅', key: msg.key } });
                return;
            }
        } catch (err) {
            console.log("Prexzy Anime Search failed, trying Jikan...");
        }

        // Fallback: Jikan API
        try {
            const jikanRes = await axios.get(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(q)}&limit=1`, { timeout: 10000 });
            if (jikanRes.data && jikanRes.data.data && jikanRes.data.data.length > 0) {
                const anime = jikanRes.data.data[0];
                const text = `*🎌 ${anime.title}*\n\n` +
                    `⭐ *Score:* ${anime.score || 'N/A'}\n` +
                    `📌 *Type:* ${anime.type || 'N/A'}\n` +
                    `📊 *Status:* ${anime.status || 'N/A'}\n` +
                    `🎞️ *Episodes:* ${anime.episodes || 'N/A'}\n\n` +
                    `🔗 *URL:* ${anime.url}`;
                
                const imageUrl = anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url;
                if (imageUrl) {
                    await sock.sendMessage(chatId, { image: { url: imageUrl }, caption: text }, { quoted: msg });
                } else {
                    await sock.sendMessage(chatId, { text }, { quoted: msg });
                }
                await sock.sendMessage(chatId, { react: { text: '✅', key: msg.key } });
                return;
            }
        } catch (err) {
            console.error("Jikan fallback failed:", err.message);
        }

        await sock.sendMessage(chatId, { text: '❌ No anime found!' }, { quoted: msg });
        
    } catch (e) {
        console.error("Anime Search Error:", e.message);
        await sock.sendMessage(chatId, { text: '⚠️ Error: ' + e.message }, { quoted: msg });
    }
};
