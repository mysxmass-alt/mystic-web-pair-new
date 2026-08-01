module.exports = async function(sock, chatId, msg, isOwner, sessions) {
    if (!isOwner) return await sock.sendMessage(chatId, { text: '\u274C Owner only!' }, { quoted: msg });
    
    await sock.sendMessage(chatId, { text: '\u1F4A3 Shutting down all sessions...' }, { quoted: msg });
    
    let stopped = 0;
    for (const [sessionId, session] of Object.entries(sessions)) {
        try {
            if (session.sock) {
                await session.sock.logout();
                session.isConnected = false;
                stopped++;
            }
        } catch (e) {
            console.error(`Error shutting down ${sessionId}:`, e);
        }
    }
    
    await sock.sendMessage(chatId, { text: `\u2705 All sessions shut down! (${stopped} sessions)` });
};
