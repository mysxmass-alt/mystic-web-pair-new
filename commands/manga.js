const axios = require('axios');

module.exports = async function(sock, chatId, msg, q) {
    if (!q) return await sock.sendMessage(chatId, { text: '⚠️ Please provide a manga name! Usage: .manga <name>' }, { quoted: msg });
    
    try {
        await sock.sendMessage(chatId, { react: { text: '📖', key: msg.key } });
        await sock.sendMessage(chatId, { text: '🔍 Searching manga...' }, { quoted: msg });
        
        // Primary: Prexzy Manga Search
        const prexzyUrl = `https://prexzyapis.com/anime/manga-search?query=${encodeURIComponent(q)}`;
        try {
            const response = await axios.get(prexzyUrl, { timeout: 10000 });
            const data = response.data;
            
            if (data && data.status && data.data && data.data.results && data.data.results.length > 0) {
                const manga = data.data.results[0];
                const text = `*📖 ${manga.title}*\n\n` +
                    `📌 *Type:* ${manga.type || 'N/A'}\n` +
                    `📊 *Status:* ${manga.status || 'N/A'}\n\n` +
                    `🔗 *URL:* ${manga.url}`;
                
                if (manga.image) {
                    await sock.sendMessage(chatId, { image: { url: manga.image }, caption: text }, { quoted: msg });
                } else {
                    await sock.sendMessage(chatId, { text }, { quoted: msg });
                }
                await sock.sendMessage(chatId, { react: { text: '✅', key: msg.key } });
                return;
            }
        } catch (err) {
            console.log("Prexzy Manga Search failed, trying Jikan...");
        }

        // Fallback: Jikan API
        try {
            const jikanRes = await axios.get(`https://api.jikan.moe/v4/manga?q=${encodeURIComponent(q)}&limit=1`, { timeout: 10000 });
            if (jikanRes.data && jikanRes.data.data && jikanRes.data.data.length > 0) {
                const manga = jikanRes.data.data[0];
                const text = `*📖 ${manga.title}*\n\n` +
                    `⭐ *Score:* ${manga.score || 'N/A'}\n` +
                    `📚 *Chapters:* ${manga.chapters || 'N/A'}\n\n` +
                    `🔗 *URL:* ${manga.url}`;
                
                const imageUrl = manga.images?.jpg?.large_image_url || manga.images?.jpg?.image_url;
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

        await sock.sendMessage(chatId, { text: '❌ No manga found!' }, { quoted: msg });
        
    } catch (e) {
        console.error("Manga Search Error:", e.message);
        await sock.sendMessage(chatId, { text: '⚠️ Error: ' + e.message }, { quoted: msg });
    }
};
