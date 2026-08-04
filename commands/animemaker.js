const axios = require('axios');

async function animemakerCommand(sock, from, msg, command) {
    try {
        await sock.sendMessage(from, { react: { text: '✨', key: msg.key } });
        
        // Categories specifically requested to use waifu.pics
        const waifuPicsCategories = [
            'waifu', 'neko', 'hug', 'kiss', 'pat', 'cuddle', 
            'smile', 'wave', 'highfive', 'nom', 'blush'
        ];

        // Other reaction commands that can use nekos.best or fallback
        const otherReactionCommands = [
            'cry', 'kill', 'lick', 'bite', 'yeet', 'bully', 'bonk',
            'wink', 'poke', 'slap', 'awoo', 'smug', 'glomp', 'happy', 
            'dance', 'cringe', 'handhold'
        ];

        let imageUrl = null;

        if (waifuPicsCategories.includes(command)) {
            // Use waifu.pics as primary for these categories
            try {
                const response = await axios.get(`https://api.waifu.pics/sfw/${command}`, { timeout: 5000 });
                if (response.data && response.data.url) {
                    imageUrl = response.data.url;
                }
            } catch (err) {
                console.log(`Waifu.pics failed for ${command}, trying nekos.best...`);
            }
            
            // Fallback to nekos.best if waifu.pics fails
            if (!imageUrl) {
                try {
                    const response = await axios.get(`https://nekos.best/api/v2/${command}`, { 
                        timeout: 5000,
                        headers: { 'User-Agent': 'Mystic-XMD/1.0' }
                    });
                    if (response.data && response.data.results && response.data.results[0]) {
                        imageUrl = response.data.results[0].url;
                    }
                } catch (err) {
                    console.log(`Nekos.best fallback failed for ${command}`);
                }
            }
        } else if (otherReactionCommands.includes(command)) {
            // Use nekos.best as primary for others
            try {
                const response = await axios.get(`https://nekos.best/api/v2/${command}`, { 
                    timeout: 5000,
                    headers: { 'User-Agent': 'Mystic-XMD/1.0' }
                });
                if (response.data && response.data.results && response.data.results[0]) {
                    imageUrl = response.data.results[0].url;
                }
            } catch (err) {
                console.log(`Nekos.best failed for ${command}, trying waifu.pics...`);
            }

            // Fallback to waifu.pics
            if (!imageUrl) {
                try {
                    const response = await axios.get(`https://api.waifu.pics/sfw/${command}`, { timeout: 5000 });
                    if (response.data && response.data.url) {
                        imageUrl = response.data.url;
                    }
                } catch (err) {
                    console.log(`Waifu.pics fallback failed for ${command}`);
                }
            }
        }

        if (imageUrl) {
            await sock.sendMessage(from, { 
                image: { url: imageUrl }, 
                caption: `✨ *${command.toUpperCase()}* anime action!` 
            }, { quoted: msg });
            await sock.sendMessage(from, { react: { text: '✅', key: msg.key } });
        } else if (!waifuPicsCategories.includes(command) && !otherReactionCommands.includes(command)) {
            // Specific character commands (naruto, onepiece, etc.)
            try {
                const url = `https://api.jikan.moe/v4/characters?q=${encodeURIComponent(command)}&limit=1`;
                const response = await axios.get(url, { timeout: 5000 });
                const character = response.data.data?.[0];
                
                if (character && character.images?.jpg?.image_url) {
                    await sock.sendMessage(from, { 
                        image: { url: character.images.jpg.image_url }, 
                        caption: `🌸 *${character.name}* (${command.toUpperCase()})\n\n${character.about?.substring(0, 200) || ''}...` 
                    }, { quoted: msg });
                    await sock.sendMessage(from, { react: { text: '✅', key: msg.key } });
                } else {
                    // Final fallback
                    await sock.sendMessage(from, { 
                        image: { url: "https://prexzyapis.com/random/waifu" }, 
                        caption: `🌸 Random Anime Image (Character *${command}* not found)` 
                    }, { quoted: msg });
                    await sock.sendMessage(from, { react: { text: '✅', key: msg.key } });
                }
            } catch (err) {
                console.error(`Character search failed for ${command}:`, err.message);
                await sock.sendMessage(from, { text: `⚠️ Error fetching ${command} image.` }, { quoted: msg });
            }
        } else {
            await sock.sendMessage(from, { text: `⚠️ Could not fetch image for ${command}.` }, { quoted: msg });
        }
    } catch (e) {
        console.error(`Error in animemaker for command ${command}:`, e.message);
        await sock.sendMessage(from, { text: `⚠️ Error: ${e.message}` }, { quoted: msg });
    }
}

module.exports = animemakerCommand;
