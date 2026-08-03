const yts = require('yt-search');
const axios = require('axios');

module.exports = async function(sock, chatId, msg, q) {
    if (!q) return await sock.sendMessage(chatId, { text: '\u26A0\uFE0F .youtube <search query/link>' }, { quoted: msg });
    
    try {
        await sock.sendMessage(chatId, { react: { text: '⏳', key: msg.key } });
        
        let videoUrl = q;
        if (!q.includes('youtube.com') && !q.includes('youtu.be')) {
            const search = await yts(q);
            const video = search.videos[0];
            if (!video) return await sock.sendMessage(chatId, { text: '\u274C No results found!' }, { quoted: msg });
            videoUrl = video.url;
        }

        // Using Prexzy API for downloading
        const apiUrl = `https://prexzyapis.com/download/ytmp4?url=${encodeURIComponent(videoUrl)}`;
        const response = await axios.get(apiUrl);
        const data = response.data;

        if (data && data.status && data.download_url) {
            const videoInfo = data.info || {};
            const caption = `*\u25B6\uFE0F ${videoInfo.title || 'YouTube Video'}*\n\n` +
                `\u23F1\uFE0F Duration: ${videoInfo.duration_string || 'N/A'}\n` +
                `\u1F517 Link: ${videoUrl}\n\n` +
                `> © POWERED BY MYSTIC XMD`;

            // Send Video
            await sock.sendMessage(chatId, { 
                video: { url: data.download_url }, 
                caption,
                mimetype: 'video/mp4'
            }, { quoted: msg });
            
            await sock.sendMessage(chatId, { react: { text: '✅', key: msg.key } });
        } else {
            throw new Error('Failed to fetch download link from Prexzy API.');
        }
    } catch (e) {
        console.error('YouTube Error:', e.message);
        await sock.sendMessage(chatId, { text: '\u274C Error: ' + e.message }, { quoted: msg });
        await sock.sendMessage(chatId, { react: { text: '❌', key: msg.key } });
    }
};
