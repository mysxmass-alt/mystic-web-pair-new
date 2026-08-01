const settings = require('../settings');

async function allMenu(sock, from, msg, session, commands) {
    // ===== COOL HEADER =====
    let allMenuText = `╭━━━〔 MYSTIC XMD V2 〕━━━⬣\n`;
    allMenuText += `┃ ✦ Total Commands: 300+\n`;
    allMenuText += `┃ ✦ Version: ${settings.version}\n`;
    allMenuText += `┃ ✦ Owner: ${settings.ownerName || 'MYSTIC TECH'}\n`;
    allMenuText += `┃ ✦ Prefix: ${settings.prefix}\n`;
    allMenuText += `┃ ✦ Status: Active\n`;
    allMenuText += `╰━━━━━━━━━━━━━━━━━━━━⬣\n\n`;

    // ===== CATEGORIES =====
    const categories = {
        '👑 OWNER': ['public', 'private', 'mode', 'owner', 'setname', 'block', 'unblock', 'bcgc', 'bcall', 'restart', 'shutdown', 'xrestart', 'xshutdown', 'nuke', 'clear', 'clone', 'ghostmode', 'deleteall', 'autostatus'],
        '👥 GROUP': ['kick', 'add', 'promote', 'demote', 'mute', 'unmute', 'tagall', 'hidetag', 'grouplink', 'groupinfo', 'join', 'leave', 'setdesc', 'setppgc', 'getbio', 'getdp', 'accept', 'poll', 'everyonemsg', 'listonline', 'tagme', 'mention', 'kickoffline', 'snipe', 'editmsg', 'react', 'send', 'forward', 'save', 'antilink', 'antidelete', 'anticall', 'antistatus', 'antibug'],
        '🤖 AI MODULE': ['ai', 'chatbot', 'gali'],
        '⬇️ DOWNLOAD CENTER': ['song', 'video', 'insta', 'tiktok', 'facebook', 'youtube', 'pinterest', 'twitter', 'reddit', 'spotify', 'mf', 'apk', 'gdrive', 'yts', 'lyrics'],
        '🛠️ TOOLS': ['ping', 'dp', 'vv', 'translate', 'base64', 'qr', 'shorturl', 'calc', 'weather', 'github', 'ipinfo', 'tempmail', 'fakeinfo', 'binlookup', 'whois', 'dnslookup', 'portscan', 'screenshot', 'define', 'google', 'wiki', 'yts', 'playstore', 'npm', 'sticker', 'toimg', 'tomp3', 'tts', 'blur', 'invert', 'crop', 'flip', 'grayscale', 'removebg', 'enlarge', 'uptime', 'serverinfo', 'speedtest', 'device', 'runtime'],
        '🎉 FUN ZONE': ['joke', 'meme', 'dare', 'truth', 'ascii', 'roast', 'compliment', 'ship', 'emojimix', 'character', 'quote', 'fact', 'trivia', 'coinflip', 'roll', 'riddle', 'wouldyourather', 'report'],
        '🎮 GAME HUB': ['trivia', 'coinflip', 'roll', 'dare', 'truth', 'riddle', 'wouldyourather'],
        '🎌 ANIME HUB': ['anime', 'manga'],
        '🏷️ STICKER LAB': ['sticker', 'toimg', 'tomp3', 'emojimix', 'blur', 'invert', 'crop', 'flip', 'grayscale', 'removebg', 'enlarge'],
        '🖼️ IMAGE EDITOR': ['blur', 'invert', 'crop', 'flip', 'grayscale', 'removebg', 'enlarge', 'toimg', 'ascii'],
        '✏️ TEXT MAKER': ['base64', 'binary', 'hex', 'morse', 'qr', 'glitchtext', 'writetext', 'advancedglow', 'typographytext', 'pixelglitch', 'neonglitch', 'flagtext', 'flag3dtext', 'deletingtext', 'blackpinkstyle'],
        '🕌 ISLAMIC HUB': ['quran', 'hadith', 'prayer', 'qibla', 'asmaulhusna'],
        '🐛 DANGER ZONE': ['hack', 'spam', 'smsbomb', 'callbomb', 'crash', 'freeze', 'lag', 'bug', 'locspam', 'vcardspam', 'buttonspam', 'pollspam', 'contactspam', 'xrestart', 'xshutdown', 'ghostmode', 'nuke', 'deleteall', 'antibug'],
        '🎯 MISC CENTER': ['timer', 'password', 'morse', 'binary', 'hex', 'pastebin', 'news', 'crypto', 'movie', 'anime', 'manga', 'lyrics', 'remind', 'tagme', 'mention', 'snipe', 'editmsg', 'react', 'send', 'forward', 'clear', 'save', 'mycmd']
    };

    // ===== BUILD LIST =====
    for (const [category, cmds] of Object.entries(categories)) {
        allMenuText += `╭━━━〔 ${category} 〕━━━⬣\n`;
        
        cmds.forEach((cmd) => {
            allMenuText += `┃ ➤ .${cmd}\n`;
        });
        
        allMenuText += `╰━━━━━━━━━━━━━━━━━━━━⬣\n\n`;
    }

    // ===== FOOTER =====
    allMenuText += `   © POWERED BY MYSTIC TECH`;

    // ===== SEND =====
    try {
        await sock.sendMessage(from, { image: { url: settings.startimage }, caption: allMenuText }, { quoted: msg });
    } catch (e) {
        // Fallback - send as text only
        await sock.sendMessage(from, { text: allMenuText }, { quoted: msg });
    }
}

module.exports = allMenu;
