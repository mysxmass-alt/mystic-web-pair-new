const axios = require('axios');

module.exports = async function(sock, chatId, msg, q) {
    if (!q) return await sock.sendMessage(chatId, { text: '\u26A0\uFE0F .weather <city name>' }, { quoted: msg });
    
    try {
        await sock.sendMessage(chatId, { react: { text: '☁️', key: msg.key } });
        await sock.sendMessage(chatId, { text: '\u26C5 Fetching weather...' }, { quoted: msg });
        
        // Using Prexzy API for weather
        const apiUrl = `https://prexzyapis.com/search/cuaca?kota=${encodeURIComponent(q)}`;
        const response = await axios.get(apiUrl);
        
        if (response.data && response.data.status && response.data.data) {
            const w = response.data.data;
            const text = `*\u26C5 Weather in ${w.location}, ${w.country}*\n\n` +
                `\uD83C\uDF21\uFE0F Temperature: ${w.currentTemp}\n` +
                `\uD83C\uDF21\uFE0F Max/Min: ${w.maxTemp} / ${w.minTemp}\n` +
                `\uD83D\uDCA7 Humidity: ${w.humidity}\n` +
                `\uD83D\uDCA8 Wind: ${w.windSpeed}\n` +
                `\uD83D\uDD14 Description: ${w.weather}\n\n` +
                `> © POWERED BY MYSTIC XMD`;
            
            await sock.sendMessage(chatId, { text }, { quoted: msg });
            await sock.sendMessage(chatId, { react: { text: '✅', key: msg.key } });
        } else {
            throw new Error("City not found or API error.");
        }
    } catch (e) {
        console.error('Weather Error:', e.message);
        await sock.sendMessage(chatId, { text: '\u274C Error: ' + e.message }, { quoted: msg });
        await sock.sendMessage(chatId, { react: { text: '❌', key: msg.key } });
    }
};
