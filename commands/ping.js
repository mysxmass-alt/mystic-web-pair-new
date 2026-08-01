async function pingCommand(sock, from, msg) {
    const start = Date.now();
    const pingMsg = await sock.sendMessage(from, { text: 'Testing Speed...' }, { quoted: msg });
    const end = Date.now();
    await sock.sendMessage(from, { text: `\u{26A1} *Response Speed:* ${end - start}ms` }, { quoted: pingMsg });
}

module.exports = pingCommand;
