const axios = require('axios');

async function animemakerCommand(sock, from, msg, command) {
    try {
        await sock.sendMessage(from, { react: { text: '✨', key: msg.key } });
        
        // List of commands that should be stickers/reaction GIFs
        const reactionCommands = [
            'cry', 'kill', 'hug', 'pat', 'lick', 'kiss', 'bite', 'yeet', 'bully', 'bonk',
            'wink', 'poke', 'nom', 'slap', 'smile', 'wave', 'awoo', 'blush', 'smug', 
            'glomp', 'happy', 'dance', 'cringe', 'cuddle', 'highfive', 'handhold'
        ];

        // List of common character categories supported by nekos.best or waifu.pics
        const commonCharacterCommands = ['waifu', 'neko', 'shinobu', 'megumin'];

        if (reactionCommands.includes(command) || commonCharacterCommands.includes(command)) {
            let imageUrl = null;
            
            // Special handling for waifu command as requested by user
            if (command === 'waifu') {
                imageUrl = "https://prexzyapis.com/random/waifu";
            } else {
                // Try nekos.best first (very reliable) for other commands
                try {
                    const nekosBestCategories = [
                        'cry', 'kill', 'hug', 'pat', 'lick', 'kiss', 'bite', 'yeet', 'bonk', 
                        'wink', 'poke', 'nom', 'slap', 'smile', 'wave', 'awoo', 'blush', 
                        'smug', 'glomp', 'happy', 'dance', 'cringe', 'cuddle', 'highfive', 
                        'handhold', 'waifu', 'neko'
                    ];
                    
                    if (nekosBestCategories.includes(command)) {
                        const response = await axios.get(`https://nekos.best/api/v2/${command}`, { 
                            timeout: 5000,
                            headers: { 'User-Agent': 'Mystic-XMD/1.0' }
                        });
                        if (response.data && response.data.results && response.data.results[0]) {
                            imageUrl = response.data.results[0].url;
                        }
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
                        console.log(`Waifu.pics failed for ${command}`);
                    }
                }
            }

            // Special handling for bully and other waifu.pics specific ones
            if (!imageUrl && command === 'bully') {
                imageUrl = "https://media.tenor.com/79_uP98uC6IAAAAC/anime-bully.gif";
            }

            if (imageUrl) {
                await sock.sendMessage(from, { 
                    image: { url: imageUrl }, 
                    caption: `✨ *${command.toUpperCase()}* anime action!` 
                }, { quoted: msg });
            } else {
                throw new Error(`Could not fetch image for ${command} from any API`);
            }
        } else {
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
                } else {
                    // Final fallback to a random anime image if character not found
                    // Use the new waifu API for fallback too
                    await sock.sendMessage(from, { 
                        image: { url: "https://prexzyapis.com/random/waifu" }, 
                        caption: `🌸 Random Anime Image (Character *${command}* not found)` 
                    }, { quoted: msg });
                }
            } catch (err) {
                console.error(`Fallback failed for ${command}:`, err.message);
                await sock.sendMessage(from, { text: `⚠️ Error fetching ${command} image. Please try again later.` }, { quoted: msg });
            }
        }
    } catch (e) {
        console.error(`Error in animemaker for command ${command}:`, e.message);
        await sock.sendMessage(from, { text: `⚠️ Error fetching ${command} image. Please try again later.` }, { quoted: msg });
    }
}

module.exports = animemakerCommand;
