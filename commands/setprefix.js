module.exports = async function(sock, chatId, msg, q, session, botData, saveBotData) {
    // Only owner can change prefix
    const settings = require('../settings');
    const sender = msg.key.participant || msg.key.remoteJid;
    const senderClean = sender.split('@')[0];
    const ownerNumbers = String(settings.ownerNumber).split(',').map(n => n.replace(/\D/g, ''));
    const isOwner = ownerNumbers.some(on => senderClean === on) || msg.key.fromMe;

    if (!isOwner) return await sock.sendMessage(chatId, { text: '❌ Only the owner can use this command!' }, { quoted: msg });

    if (!q) return await sock.sendMessage(chatId, { text: '⚠️ Please provide a new prefix! Example: .setprefix #' }, { quoted: msg });

    if (q.length > 3) return await sock.sendMessage(chatId, { text: '⚠️ Prefix must be 1-3 characters long!' }, { quoted: msg });

    botData.globalPrefix = q;
    saveBotData();

    await sock.sendMessage(chatId, { 
        text: `✅ *Prefix Updated!*\n\nNew Prefix: *${q}*\n\nAll commands will now respond to *${q}*` 
    }, { quoted: msg });
};
