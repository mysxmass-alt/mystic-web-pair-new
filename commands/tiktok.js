const axios = require('axios');

async function tiktokCommand(sock, from, msg, q) {
    if (!q) return await sock.sendMessage(from, { text: "❌ Please provide a TikTok URL." }, { quoted: msg });
    
    try {
        await sock.sendMessage(from, { react: { text: '⏳', key: msg.key } });
        
        // Using Prexzy API
        const apiUrl = `https://prexzyapis.com/download/tiktok?url=${encodeURIComponent(q)}`;
        const res = await axios.get(apiUrl);
        
        if (res.data && res.data.status && res.data.data) {
            const videoData = res.data.data;
            const videoUrl = videoData.play; // Direct MP4 URL
            const author = videoData.author?.nickname || "Unknown";
            const title = videoData.title || "TikTok Video";

            const caption = `*\u1F3A5 TikTok Downloader*\n\n` +
                `📝 *Title:* ${title}\n` +
                `👤 *Author:* ${author}\n\n` +
                `> © POWERED BY MYSTIC XMD`;

            // Send Video
            await sock.sendMessage(from, { 
                video: { url: videoUrl }, 
                caption,
                mimetype: 'video/mp4'
            }, { quoted: msg });
            
            await sock.sendMessage(from, { react: { text: '✅', key: msg.key } });
        } else {
            throw new Error('Failed to fetch TikTok video from Prexzy API.');
        }
    } catch (e) {
        console.error('TikTok Error:', e.message);
        await sock.sendMessage(from, { text: "❌ Error downloading TikTok: " + e.message }, { quoted: msg });
        await sock.sendMessage(from, { react: { text: '❌', key: msg.key } });
    }
}

module.exports = tiktokCommand;
