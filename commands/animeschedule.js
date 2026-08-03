const axios = require('axios');

module.exports = async function(sock, chatId, msg) {
    try {
        await sock.sendMessage(chatId, { react: { text: '📅', key: msg.key } });
        await sock.sendMessage(chatId, { text: '🕒 Fetching anime schedule...' }, { quoted: msg });
        
        const response = await axios.get(`https://prexzyapis.com/anime/animekill-schedule`, { timeout: 10000 });
        
        if (response.data && response.data.status && response.data.data && response.data.data.data && response.data.data.data.animeSuggestions) {
            const schedule = response.data.data.data.animeSuggestions.slice(0, 10);
            let resultText = `📅 *ANIME SCHEDULE* 📅\n\n`;
            
            schedule.forEach((anime, index) => {
                resultText += `${index + 1}. *${anime.name}*\n`;
                resultText += `   🕒 Type: ${anime.anime_type} | Origin: ${anime.anime_origin}\n\n`;
            });
            
            resultText += `_Showing top 10 upcoming/recent anime updates_`;
            
            await sock.sendMessage(chatId, { text: resultText }, { quoted: msg });
        } else {
            await sock.sendMessage(chatId, { text: '❌ Could not fetch schedule at this time.' }, { quoted: msg });
        }
    } catch (e) {
        console.error("Anime Schedule Error:", e.message);
        await sock.sendMessage(chatId, { text: '⚠️ Error: ' + e.message }, { quoted: msg });
    }
};
