const settings = require('../settings');

module.exports = async function(sock, chatId, msg) {
    const text = `\n💎 ═══════════════════ 💎\n     📊 𝗖𝗢𝗠𝗠𝗔𝗡𝗗 𝗦𝗧𝗔𝗧𝗦 📊\n💎 ═══════════════════ 💎\n\n` +
        `  ⚡ Total commands used: Tracking...\n` +
        `  ⚡ Favorite command: .menu\n` +
        `  ⚡ Session active: Yes\n` +
        `  ⚡ Bot: ${settings.botName}\n\n` +
        `💎 ═══════════════════ 💎\n` +
        `    ☠️ 𝗣𝗢𝗪𝗘𝗥𝗘𝗗 𝗕𝗬 𝗦𝗬𝗘𝗗 𝗠𝗜𝗡𝗜 ☠️\n` +
        `💎 ═══════════════════ 💎`;
    
    await sock.sendMessage(chatId, { text }, { quoted: msg });
};
