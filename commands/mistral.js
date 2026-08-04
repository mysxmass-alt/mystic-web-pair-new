async function mistralCommand(sock, from, msg, isAdmin, session, args) {
    if (args.length === 0) return await sock.sendMessage(from, { text: "❌ Please provide a query for Mistral AI." }, { quoted: msg });
    
    const query = args.join(' ');
    try {
        await sock.sendMessage(from, { react: { text: '🌀', key: msg.key } });
        const aiRes = await session.getMistralResponse(from, query);
        await sock.sendMessage(from, { text: aiRes.content }, { quoted: msg });
    } catch (e) {
        await sock.sendMessage(from, { text: "❌ Mistral Error: " + e.message }, { quoted: msg });
    }
}

module.exports = mistralCommand;
