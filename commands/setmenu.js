module.exports = async function(sock, chatId, msg, q, session, botData, saveBotData) {
    // Only owner can change menu type
    const settings = require('../settings');
    const sender = msg.key.participant || msg.key.remoteJid;
    const senderClean = sender.split('@')[0];
    const ownerNumbers = String(settings.ownerNumber).split(',').map(n => n.replace(/\D/g, ''));
    const isOwner = ownerNumbers.some(on => senderClean === on) || msg.key.fromMe;

    if (!isOwner) return await sock.sendMessage(chatId, { text: '❌ Only the owner can use this command!' }, { quoted: msg });

    const validTypes = ['text', 'slide'];
    if (!q || !validTypes.includes(q.toLowerCase())) {
        return await sock.sendMessage(chatId, { 
            text: `⚠️ Usage: .setmenu <type>\n\nAvailable types:\n1. *text* - Classic text menu\n2. *slide* - Modern slide/list format` 
        }, { quoted: msg });
    }

    botData.menuType = q.toLowerCase();
    saveBotData();

    await sock.sendMessage(chatId, { 
        text: `✅ *Menu Style Updated!*\n\nNew Style: *${q.toLowerCase()}*\n\nType .menu to see the new look!` 
    }, { quoted: msg });
};
