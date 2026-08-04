const axios = require('axios');

module.exports = async function(sock, chatId, msg, q) {
    if (!q) return await sock.sendMessage(chatId, { text: '⚠️ Please provide a search query! Usage: .xvideos <query>' }, { quoted: msg });

    try {
        await sock.sendMessage(chatId, { react: { text: '🔞', key: msg.key } });
        await sock.sendMessage(chatId, { text: `🔍 Searching for "${q}"...` }, { quoted: msg });

        // Step 1: Search for videos
        const searchUrl = `https://prexzyapis.com/nsfw/xvideos-search?query=${encodeURIComponent(q)}`;
        const searchResponse = await axios.get(searchUrl);
        const searchData = searchResponse.data;

        if (searchData && searchData.status && searchData.videos && searchData.videos.length > 0) {
            const firstVideo = searchData.videos[0];
            const videoUrl = firstVideo.url;

            await sock.sendMessage(chatId, { text: `✅ Found: *${firstVideo.title}*\n⏱️ Duration: ${firstVideo.duration}\n\n📥 *Downloading video for you...*` }, { quoted: msg });

            // Step 2: Get download link
            const dlUrl = `https://prexzyapis.com/nsfw/xvideos-dl?url=${encodeURIComponent(videoUrl)}`;
            const dlResponse = await axios.get(dlUrl);
            const dlData = dlResponse.data;

            if (dlData && dlData.status && dlData.best && dlData.best.url) {
                const downloadLink = dlData.best.url;

                // Step 3: Send video to WhatsApp
                await sock.sendMessage(chatId, { 
                    video: { url: downloadLink }, 
                    caption: `🔞 *${firstVideo.title}*\n\n> © Powered by Prexzy APIs`,
                    mimetype: 'video/mp4'
                }, { quoted: msg });

                await sock.sendMessage(chatId, { react: { text: '✅', key: msg.key } });
            } else {
                await sock.sendMessage(chatId, { text: `❌ Failed to fetch download link for: ${firstVideo.title}. You can try the link manually: ${videoUrl}` }, { quoted: msg });
            }
        } else {
            await sock.sendMessage(chatId, { text: '❌ No results found for your search.' }, { quoted: msg });
        }
    } catch (e) {
        console.error("XVideos Error:", e.message);
        await sock.sendMessage(chatId, { text: '⚠️ Error: ' + e.message }, { quoted: msg });
    }
};
