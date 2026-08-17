module.exports = async function ping(sock, jid, msg) {
    const started = Date.now();
    await sock.sendMessage(jid, { text: '🏓 Checking response time...' }, { quoted: msg });
    const latency = Date.now() - started;
    await sock.sendMessage(jid, { text: `🏓 Pong! ${latency}ms` }, { quoted: msg });
};
