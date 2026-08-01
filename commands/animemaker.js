const axios = require('axios');

async function animemakerCommand(sock, from, msg, command) {
    try {
        await sock.sendMessage(from, { react: { text: '✨', key: msg.key } });
        
        // List of commands that should be stickers (using waifu.pics)
        const stickerCommands = [
            'cry', 'kill', 'hug', 'pat', 'lick', 'kiss', 'bite', 'yeet', 'bully', 'bonk',
            'wink', 'poke', 'nom', 'slap', 'smile', 'wave', 'awoo', 'blush', 'smug', 
            'glomp', 'happy', 'dance', 'cringe', 'cuddle', 'highfive', 'handhold'
        ];

        if (stickerCommands.includes(command)) {
            const { data } = await axios.get(`https://api.waifu.pics/sfw/${command}`);
            // Since we don't have sendImageAsSticker directly in the simple sock, 
            // we'll send it as an image for now, or the user can use .sticker command on it.
            // Alternatively, if the bot has a sticker conversion lib, we could use it.
            // For now, let's send as image with a nice caption.
            await sock.sendMessage(from, { 
                image: { url: data.url }, 
                caption: `✨ *${command.toUpperCase()}* anime action!` 
            }, { quoted: msg });
        } else {
            // Random anime character images (using prexzyvilla API)
            const url = `https://apis.prexzyvilla.site/random/anime/${command}`;
            await sock.sendMessage(from, { 
                image: { url: url }, 
                caption: `🌸 Random *${command.toUpperCase()}* Image` 
            }, { quoted: msg });
        }
    } catch (e) {
        console.error(e);
        await sock.sendMessage(from, { text: `⚠️ Error fetching ${command} image.` }, { quoted: msg });
    }
}

module.exports = animemakerCommand;
