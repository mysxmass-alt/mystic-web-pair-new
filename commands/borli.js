async function borliCommand(sock, from, msg, isAdmin, session, args) {
    if (args.length === 0) return await sock.sendMessage(from, { text: "❌ Please provide a query for Borli AI." }, { quoted: msg });
    
    const query = args.join(' ');
    try {
        await sock.sendMessage(from, { react: { text: '🎭', key: msg.key } });
        const aiRes = await session.getBorliResponse(from, query);
        await sock.sendMessage(from, { text: aiRes.content }, { quoted: msg });
    } catch (e) {
        await sock.sendMessage(from, { text: "❌ Borli Error: " + e.message }, { quoted: msg });
    }
}

module.exports = borliCommand;
