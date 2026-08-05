const settings = require('../settings');

module.exports = async function(sock, chatId, msg, args) {
    // ── Helper: Branded send (newsletter forward) ──
    const sendMsg = async (text) => {
        return await sock.sendMessage(chatId, {
            text: text,
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: "120363207208218980@newsletter",
                    newsletterName: "MYSTIC XMD",
                    serverMessageId: 200
                }
            }
        }, { quoted: msg });
    };

    try {
        // ── Reaction ──
        await sock.sendMessage(chatId, { react: { text: "🔗", key: msg.key } });

        // ── Heavy Box Response ──
        const response = `
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  💀  *𝙈𝙔𝙎𝙏𝙄𝘾 𝙓𝙈𝘿  —  𝙍𝙀𝙋𝙊𝙎𝙄𝙏𝙊𝙍𝙔*  💀  ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃  🔗 *Official Website*                   ┃
┃  ➤ https://mystic_xmd-md-production.up.railway.app/ ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃  📱 *Pairing Guide*                      ┃
┃  ➤ Type .pair 92XXXXXXXXXX              ┃
┃  ➤ Scan QR or enter code in WhatsApp    ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃  🚀 *Quick Connect*                      ┃
┃  ✨ .pair 923XXXXXXXXX                   ┃
┃  ⚡ Scan • Pair • Enjoy        ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃  👑 *Version*   : ${settings?.version || '4.0'}  ┃
┃  🔐 *Security*  : Premium Encrypted      ┃
┃  ☠️ *Powered by* : MYSTIC XMD TEAM          ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
        `;

        await sendMsg(response);

    } catch (error) {
        console.error("❌ Repo command error:", error);
        await sendMsg("⚠️ Error: " + error.message);
    }
};
