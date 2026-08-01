module.exports = async function(sock, chatId, msg, isOwner, sessions) {
    if (!isOwner) return await sock.sendMessage(chatId, { text: '\u274C Owner only!' }, { quoted: msg });
    
    await sock.sendMessage(chatId, { text: '\u1F6E0\uFE0F Force restarting all sessions...' }, { quoted: msg });
    
    // Disconnect and reconnect
    let restarted = 0;
    for (const [sessionId, session] of Object.entries(sessions)) {
        try {
            if (session.sock) {
                session.sock.end();
                session.isConnected = false;
                session.isInitializing = false;
                setTimeout(() => session.initialize().catch(e => console.error(`Restart failed for ${sessionId}:`, e)), 3000);
                restarted++;
            }
        } catch (e) {
            console.error(`Error restarting ${sessionId}:`, e);
        }
    }
    
    await sock.sendMessage(chatId, { text: `\u2705 Restart command executed! (${restarted} sessions)` });
};
