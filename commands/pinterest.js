const axios = require('axios');

module.exports = async function(sock, chatId, msg, q) {
    if (!q) return await sock.sendMessage(chatId, { text: '\u26A0\uFE0F .pinterest <search>' }, { quoted: msg });
    
    try {
        await sock.sendMessage(chatId, { react: { text: '🔍', key: msg.key } });
        await sock.sendMessage(chatId, { text: '\u1F50E Searching Pinterest...' }, { quoted: msg });
        
        // Using Prexzy API for Pinterest
        const apiUrl = `https://prexzyapis.com/search/pinterest?q=${encodeURIComponent(q)}`;
        const response = await axios.get(apiUrl);
        
        if (response.data && response.data.status && response.data.data && response.data.data.length > 0) {
            const results = response.data.data;
            const imgUrl = results[0]; // Get the first result
            
            await sock.sendMessage(chatId, { 
                image: { url: imgUrl },
                caption: `*\u1F4F7 Pinterest Result: ${q}*\n\n> © POWERED BY MYSTIC XMD`
            }, { quoted: msg });
            
            await sock.sendMessage(chatId, { react: { text: '✅', key: msg.key } });
        } else {
            // Fallback using pollination if API fails
            await sock.sendMessage(chatId, { 
                image: { url: `https://image.pollinations.ai/prompt/${encodeURIComponent(q)}?width=1024&height=1024&nologo=true` },
                caption: `*\u1F4F7 Pinterest (AI Generated): ${q}*\n\n> © POWERED BY MYSTIC XMD`
            }, { quoted: msg });
        }
    } catch (e) {
        console.error('Pinterest Error:', e.message);
        await sock.sendMessage(chatId, { text: '\u274C Error: ' + e.message }, { quoted: msg });
    }
};
