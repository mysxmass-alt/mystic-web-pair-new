async function textmakerCommand(sock, from, msg, args, command) {
    if (args.length < 1) {
        return sock.sendMessage(from, { text: `❌ Please provide text!\nExample: .${command} Violet` }, { quoted: msg });
    }
    let text = args.join(" ");
    try {
        await sock.sendMessage(from, { react: { text: '🎨', key: msg.key } });
        let url = `https://apis.prexzyvilla.site/${command}?text=${encodeURIComponent(text)}`;
        let caption = `✨ *${command.toUpperCase()}* Generated for: *${text}*`;
        await sock.sendMessage(from, { image: { url }, caption: caption }, { quoted: msg });
    } catch (e) {
        console.error(e);
        await sock.sendMessage(from, { text: `⚠️ Error generating ${command}.` }, { quoted: msg });
    }
}

module.exports = textmakerCommand;
