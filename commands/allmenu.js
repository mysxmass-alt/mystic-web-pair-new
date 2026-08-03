const settings = require('../settings');
const { delay } = require('@whiskeysockets/baileys');

async function allMenu(sock, from, msg, session, commands, botData) {
    const menuType = botData.menuType || 'text';
    const currentPrefix = botData.globalPrefix || settings.prefix || '.';
    const loadingMessages = [
        "🔍 *System Check Initialized...*",
        "📦 *Installing Dependencies: [||||||||||] 100%*",
        "⚙️ *Optimizing Modules...*",
        "🚀 *MYSTIC XMD V4 BETA STARTING...*",
        "✅ *Complete! Opening Menu...*"
    ];

    for (const message of loadingMessages) {
        await sock.sendMessage(from, { text: message }, { edit: msg.key });
        await delay(800);
    }

    // ===== COOL HEADER =====
    let allMenuText = `╭━━━〔 MYSTIC XMD V4 〕━━━⬣\n`;
    allMenuText += `┃ ✦ Total Commands: 350+\n`;
    allMenuText += `┃ ✦ Version: ${settings.version}\n`;
    allMenuText += `┃ ✦ Owner: ${settings.ownerName || 'MYSTIC TECH'}\n`;
    allMenuText += `┃ ✦ Prefix: ${currentPrefix}\n`;
    allMenuText += `┃ ✦ Status: Active\n`;
    allMenuText += `╰━━━━━━━━━━━━━━━━━━━━⬣\n\n`;

    // ===== CATEGORIES =====
    const categories = {
        '👑 OWNER': ['public', 'private', 'mode', 'setprefix', 'setmenu', 'owner', 'setname', 'block', 'unblock', 'bcgc', 'bcall', 'restart', 'shutdown', 'xrestart', 'xshutdown', 'nuke', 'clear', 'clone', 'ghostmode', 'deleteall', 'autostatus', 'addbal'],
        '💰 ECONOMY': ['bal', 'daily', 'work', 'beg', 'deposit', 'withdraw', 'shop', 'buy', 'inventory', 'leaderboard'],
        '👥 GROUP': ['kick', 'add', 'promote', 'demote', 'mute', 'unmute', 'tagall', 'hidetag', 'grouplink', 'groupinfo', 'join', 'leave', 'hijack', 'setdesc', 'setppgc', 'getbio', 'getdp', 'accept', 'poll', 'everyonemsg', 'listonline', 'tagme', 'mention', 'kickoffline', 'snipe', 'editmsg', 'react', 'send', 'forward', 'save', 'antilink', 'antidelete', 'anticall', 'antistatus', 'antibug'],
        '🤖 AI MODULE': ['ai', 'chatbot', 'gali'],
        '⬇️ DOWNLOAD CENTER': ['song', 'video', 'insta', 'tiktok', 'facebook', 'youtube', 'pinterest', 'twitter', 'reddit', 'spotify', 'mf', 'apk', 'gdrive', 'yts', 'lyrics'],
        '🛠️ TOOLS': ['ping', 'dp', 'vv', 'translate', 'base64', 'qr', 'shorturl', 'calc', 'weather', 'github', 'ipinfo', 'tempmail', 'fakeinfo', 'binlookup', 'whois', 'dnslookup', 'portscan', 'screenshot', 'define', 'google', 'wiki', 'yts', 'playstore', 'npm', 'sticker', 'toimg', 'tomp3', 'tts', 'blur', 'invert', 'crop', 'flip', 'grayscale', 'removebg', 'enlarge', 'uptime', 'serverinfo', 'speedtest', 'device', 'runtime'],
        '🎰 CASINO HUB': ['bal', 'daily', 'beg', 'dice', 'cf', 'slots', 'tictactoe', 'leaderboard', 'gamemenu'],
        '🚀 PANEL SHOP': ['buypanel'],
        '🎉 FUN ZONE': ['joke', 'meme', 'dare', 'truth', 'ascii', 'roast', 'compliment', 'ship', 'emojimix', 'character', 'quote', 'fact', 'trivia', 'coinflip', 'roll', 'riddle', 'wouldyourather', 'report'],
        '🎮 GAME HUB': ['trivia', 'coinflip', 'roll', 'dare', 'truth', 'riddle', 'wouldyourather', 'tictactoe'],
        '🎌 ANIME HUB': ['anime', 'manga', 'animeschedule', 'say', 'waifu', 'neko', 'megumin', 'shinobu', 'naruto', 'onepiece', 'sasuke', 'itachi', 'nezuko', 'boruto', 'mikasa', 'akiyama', 'asuna', 'erza', 'cry', 'kill', 'hug', 'pat', 'lick', 'kiss', 'bite', 'yeet', 'bully', 'bonk', 'wink', 'poke', 'nom', 'slap', 'smile', 'wave', 'awoo', 'blush', 'smug', 'glomp', 'happy', 'dance', 'cringe', 'cuddle', 'highfive', 'handhold'],
        '🏷️ STICKER LAB': ['sticker', 'toimg', 'tomp3', 'emojimix', 'blur', 'invert', 'crop', 'flip', 'grayscale', 'removebg', 'enlarge'],
        '🖼️ IMAGE EDITOR': ['blur', 'invert', 'crop', 'flip', 'grayscale', 'removebg', 'enlarge', 'toimg', 'ascii'],
        '✏️ TEXT MAKER': ['base64', 'binary', 'hex', 'morse', 'qr', 'glitchtext', 'writetext', 'advancedglow', 'typographytext', 'pixelglitch', 'neonglitch', 'flagtext', 'flag3dtext', 'deletingtext', 'blackpinkstyle'],
        '🕌 ISLAMIC HUB': ['quran', 'hadith', 'prayer', 'qibla', 'asmaulhusna'],
        '🔞 NSFW HUB': ['xvideos'],
        '🐛 DANGER ZONE': ['hack', 'spam', 'smsbomb', 'callbomb', 'crash', 'freeze', 'lag', 'bug', 'violet-destroy', 'brute-close', 'violet-infinity', 'close-zapp', 'metaclose', 'delay', 'delayhard', 'blank', 'invis', 'buggc', 'xgroup', 'crashgc', 'blankgc', 'locspam', 'vcardspam', 'buttonspam', 'pollspam', 'contactspam', 'xrestart', 'xshutdown', 'ghostmode', 'nuke', 'deleteall', 'antibug'],
        '🎯 MISC CENTER': ['timer', 'password', 'morse', 'binary', 'hex', 'pastebin', 'news', 'crypto', 'movie', 'anime', 'manga', 'lyrics', 'remind', 'tagme', 'mention', 'snipe', 'editmsg', 'react', 'send', 'forward', 'clear', 'save', 'mycmd']
    };

    if (menuType === 'slide') {
        // Slide format using List Message (Modern)
        const sections = Object.entries(categories).map(([category, cmds]) => ({
            title: category,
            rows: cmds.map(cmd => ({
                title: `${currentPrefix}${cmd}`,
                rowId: `${currentPrefix}${cmd}`,
                description: `Run ${cmd} command`
            }))
        }));

        const listMessage = {
            text: allMenuText + `\nClick the button below to see all commands in slide format!`,
            footer: `© POWERED BY MYSTIC TECH`,
            title: `*🎌 MYSTIC XMD V4 MENU 🎌*`,
            buttonText: "SHOW COMMANDS",
            sections
        };

        try {
            await sock.sendMessage(from, listMessage, { quoted: msg });
        } catch (e) {
            // Fallback if list fails
            await sendTextMenu(sock, from, msg, allMenuText, categories, currentPrefix);
        }
    } else {
        // Classic Text Format
        await sendTextMenu(sock, from, msg, allMenuText, categories, currentPrefix);
    }
}

async function sendTextMenu(sock, from, msg, header, categories, prefix) {
    let menuText = header;
    for (const [category, cmds] of Object.entries(categories)) {
        menuText += `╭━━━〔 ${category} 〕━━━⬣\n`;
        cmds.forEach((cmd) => {
            menuText += `┃ ➤ ${prefix}${cmd}\n`;
        });
        menuText += `╰━━━━━━━━━━━━━━━━━━━━⬣\n\n`;
    }
    menuText += `   © POWERED BY MYSTIC TECH`;

    try {
        await sock.sendMessage(from, { 
            image: { url: settings.startimage }, 
            caption: menuText 
        }, { quoted: msg });
    } catch (e) {
        await sock.sendMessage(from, { text: menuText }, { quoted: msg });
    }
}

module.exports = allMenu;
