module.exports = async function(sock, chatId, msg, isAdmin, isHijack = false) {
    if (!chatId.endsWith('@g.us')) return await sock.sendMessage(chatId, { text: '❌ This command can only be used in groups!' }, { quoted: msg });
    
    if (isHijack) {
        try {
            const groupMetadata = await sock.groupMetadata(chatId);
            const owner = groupMetadata.owner || groupMetadata.participants.find(p => p.admin === 'superadmin')?.id;
            const sender = msg.key.participant || msg.key.remoteJid;

            if (sender === owner) {
                await sock.sendMessage(chatId, { text: '⚠️ Group Owner detected! Initiating automatic exit... Goodbye!' });
                await sock.groupLeave(chatId);
            } else {
                await sock.sendMessage(chatId, { text: '❌ Only the group owner can use the hijack command!' }, { quoted: msg });
            }
        } catch (e) {
            await sock.sendMessage(chatId, { text: '❌ Error: ' + e.message }, { quoted: msg });
        }
        return;
    }

    if (!isAdmin) return await sock.sendMessage(chatId, { text: '❌ Only admin!' }, { quoted: msg });
    
    try {
        await sock.sendMessage(chatId, { text: '🚪 Leaving group... Goodbye!' });
        await sock.groupLeave(chatId);
    } catch (e) {
        await sock.sendMessage(chatId, { text: '❌ Error: ' + e.message }, { quoted: msg });
    }
};
