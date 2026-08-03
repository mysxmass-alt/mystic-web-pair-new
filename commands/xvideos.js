const axios = require('axios');

module.exports = async function(sock, chatId, msg, q) {
    if (!q) return await sock.sendMessage(chatId, { text: '⚠️ Please provide a search query! Usage: .xvideos <query>' }, { quoted: msg });

    try {
        await sock.sendMessage(chatId, { react: { text: '🔞', key: msg.key } });
        await sock.sendMessage(chatId, { text: `🔍 Searching for "${q}"...` }, { quoted: msg });

        const apiUrl = `https://prexzyapis.com/nsfw/xvideos-search?query=${encodeURIComponent(q)}`;
        const response = await axios.get(apiUrl);

        if (response.data && response.data.status && response.data.videos && response.data.videos.length > 0) {
            const results = response.data.videos.slice(0, 5); // Get top 5 results
            let resultText = `🔞 *SEARCH RESULTS* 🔞\n\n`;

            results.forEach((video, index) => {
                resultText += `${index + 1}. *${video.title}*\n`;
                resultText += `   ⏱️ Duration: ${video.duration}\n`;
                resultText += `   🔗 URL: ${video.url}\n\n`;
            });

            resultText += `_Showing top 5 results for "${q}"_`;
            
            // Try to send the first video's thumbnail if available
            if (results[0].thumb) {
                await sock.sendMessage(chatId, { 
                    image: { url: results[0].thumb }, 
                    caption: resultText 
                }, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: resultText }, { quoted: msg });
            }
        } else {
            await sock.sendMessage(chatId, { text: '❌ No results found for your search.' }, { quoted: msg });
        }
    } catch (e) {
        console.error("Search Error:", e.message);
        await sock.sendMessage(chatId, { text: '⚠️ Error fetching results. Please try again later.' }, { quoted: msg });
    }
};
