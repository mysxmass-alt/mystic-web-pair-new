require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const TelegramBot = require('node-telegram-bot-api');
const settings = require('./settings');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, downloadContentFromMessage, jidNormalizedUser, Browsers, delay, isJidBroadcast } = require('@whiskeysockets/baileys');
const P = require('pino');
const { OpenAI } = require('openai');
const os = require('os');
const crypto = require('crypto');

// Global Data Structures
const AUTH_DIR = './auth_info';
const DATA_FILE = './data/bot_data.json';
fs.ensureDirSync(AUTH_DIR);
fs.ensureDirSync('./data');

let botData = { 
    antilinkGroups: {}, 
    totalBots: 0, 
    registeredBots: [], 
    statusSettings: {}, 
    antiDelete: {}, 
    userNames: {}, 
    antiCall: {}, 
    broadcastHistory: [], 
    globalPrefix: '.', 
    menuType: 'text',
    antiStatusGroups: {},
    premiumUsers: []
};

if (fs.existsSync(DATA_FILE)) {
    try { 
        const savedData = fs.readJsonSync(DATA_FILE); 
        botData = { ...botData, ...savedData }; 
    } catch (e) {}
}

function saveBotData() {
    fs.writeJsonSync(DATA_FILE, botData);
}

const sessions = {}; 
const userSockets = {}; 
const messageLogs = {};
const adminSessions = new Map();
const adminEvents = [];
const ADMIN_SETTINGS_FILE = './data/admin_settings.json';

const envBool = (name) => ['1', 'true', 'yes', 'on'].includes(String(process.env[name] || '').trim().toLowerCase());
const envList = (name) => String(process.env[name] || '').split(',').map(value => value.trim()).filter(Boolean);
const defaultTelegramTargets = ['-1003901471731', '-1003833337043'];
const telegramForceJoin = {
    enabled: Object.prototype.hasOwnProperty.call(process.env, 'TELEGRAM_FORCE_JOIN_ENABLED') ? envBool('TELEGRAM_FORCE_JOIN_ENABLED') : true,
    targets: envList('TELEGRAM_FORCE_JOIN_TARGETS').length ? envList('TELEGRAM_FORCE_JOIN_TARGETS') : defaultTelegramTargets,
    channelUrl: String(process.env.TELEGRAM_FORCE_JOIN_CHANNEL_URL || 'https://t.me/mysdomain').trim(),
    groupUrl: String(process.env.TELEGRAM_FORCE_JOIN_GROUP_URL || 'https://t.me/mysticdomainx1').trim()
};
const whatsappForceJoin = {
    enabled: envBool('WHATSAPP_FORCE_JOIN_ENABLED'),
    groupIds: envList('WHATSAPP_FORCE_JOIN_GROUP_IDS'),
    groupLink: String(process.env.WHATSAPP_FORCE_JOIN_GROUP_LINK || '').trim(),
    channelLink: String(process.env.WHATSAPP_FORCE_JOIN_CHANNEL_LINK || '').trim(),
    ownerBypass: envBool('WHATSAPP_FORCE_JOIN_OWNER_BYPASS')
};

function telegramJoinPrompt() {
    const links = [
        telegramForceJoin.channelUrl && `Channel: ${telegramForceJoin.channelUrl}`,
        telegramForceJoin.groupUrl && `Group: ${telegramForceJoin.groupUrl}`
    ].filter(Boolean);
    return `🔒 *Membership required*\n\nJoin the required Telegram channel/group${links.length ? `:\n${links.join('\n')}` : '.'}\n\nAfter joining, send /start again.`;
}

async function checkTelegramForceJoin(bot, chatId) {
    if (!telegramForceJoin.enabled) return { ok: true };
    if (!telegramForceJoin.targets.length) return { ok: false, configurationError: true };
    if (String(process.env.OWNER_TELEGRAM_ID || '').split(',').map(value => value.trim()).includes(String(chatId))) return { ok: true };
    for (const target of telegramForceJoin.targets) {
        try {
            const member = await bot.getChatMember(target, chatId);
            if (['creator', 'administrator', 'member'].includes(member?.status) || (member?.status === 'restricted' && member?.is_member)) continue;
            return { ok: false };
        } catch (error) {
            console.error(`Telegram force-join check failed for ${target}:`, error?.message || error);
            return { ok: false, configurationError: true };
        }
    }
    return { ok: true };
}

const telegramForceJoinNoticeCache = new Map();
async function handleTelegramJoinFailure(bot, msg, joinStatus) {
    if (joinStatus.ok) return false;
    if (joinStatus.configurationError) {
        const chatType = msg.chat?.type || 'private';
        console.error(`Telegram force-join configuration error in ${chatType} chat ${msg.chat?.id || 'unknown'}; verify target IDs and bot admin permissions.`);
        if (chatType !== 'private') return true;
        const chatKey = String(msg.chat?.id || 'unknown');
        const lastNotice = telegramForceJoinNoticeCache.get(chatKey) || 0;
        if (Date.now() - lastNotice < 15 * 60 * 1000) return true;
        telegramForceJoinNoticeCache.set(chatKey, Date.now());
        await bot.sendMessage(msg.chat.id, '⚠️ Telegram force-join is temporarily unavailable. Please contact the bot owner.');
        return true;
    }
    await bot.sendMessage(msg.chat.id, telegramJoinPrompt(), { parse_mode: 'Markdown' });
    return true;
}

async function checkWhatsAppForceJoin(session, from, sender, isGroup) {
    if (!whatsappForceJoin.enabled || !whatsappForceJoin.groupIds.length) return { ok: true };
    const senderId = jidNormalizedUser(sender || from);
    if (isGroup && whatsappForceJoin.groupIds.some(id => jidNormalizedUser(id) === jidNormalizedUser(from))) return { ok: true };
    session.forceJoinCache = session.forceJoinCache || new Map();
    const cached = session.forceJoinCache.get(senderId);
    if (cached && cached.expiresAt > Date.now()) return cached.result;
    let result = { ok: false };
    try {
        for (const groupId of whatsappForceJoin.groupIds) {
            const metadata = await session.sock.groupMetadata(groupId);
            const participant = metadata?.participants?.find(item => jidNormalizedUser(item.id) === senderId);
            if (participant) { result = { ok: true }; break; }
        }
    } catch (error) {
        console.error('WhatsApp force-join check failed:', error?.message || error);
        result = { ok: false, configurationError: true };
    }
    session.forceJoinCache.set(senderId, { result, expiresAt: Date.now() + 60000 });
    return result;
}

function whatsappJoinPrompt() {
    const links = [
        whatsappForceJoin.groupLink && `Group: ${whatsappForceJoin.groupLink}`,
        whatsappForceJoin.channelLink && `Channel: ${whatsappForceJoin.channelLink}`
    ].filter(Boolean);
    return `🔒 Membership required\n\nJoin the required WhatsApp group/channel${links.length ? `:\n${links.join('\n')}` : '.'}\n\nAfter joining, send your command again.`;
}

function findNewsletterId(value, depth = 0) {
    if (!value || depth > 6 || typeof value !== 'object') return null;
    if (typeof value.newsletterJid === 'string' && value.newsletterJid.endsWith('@newsletter')) return value.newsletterJid;
    if (typeof value.remoteJid === 'string' && value.remoteJid.endsWith('@newsletter')) return value.remoteJid;
    for (const child of Object.values(value)) {
        const found = findNewsletterId(child, depth + 1);
        if (found) return found;
    }
    return null;
}

// Import all commands
const commands = {
    // Media & Download
    song: require('./commands/song'),
    video: require('./commands/video'),
    insta: require('./commands/insta'),
    tiktok: require('./commands/tiktok'),
    facebook: require('./commands/facebook'),
    youtube: require('./commands/youtube'),
    pinterest: require('./commands/pinterest'),
    twitter: require('./commands/twitter'),
    reddit: require('./commands/reddit'),
    spotify: require('./commands/spotify'),
    apk: require('./commands/apk'),
    gdrive: require('./commands/gdrive'),
    mf: require('./commands/mf'),
    mediafire: require('./commands/mf'),
   
    // Group Management
    kick: require('./commands/kick'),
    add: require('./commands/add'),
    promote: require('./commands/promote'),
    demote: require('./commands/demote'),
    revoke: require('./commands/revoke'),
    invite: require('./commands/invite'),
    mute: require('./commands/mute'),
    unmute: require('./commands/unmute'),
    kickoffline: require('./commands/kickoffline'),
    hidetag: require('./commands/hidetag'),
    tagall: require('./commands/tagall'),
    tagadmin: require('./commands/tagadmin'),
    groupinfo: require('./commands/groupinfo'),
    grouplink: require('./commands/grouplink'),
    join: require('./commands/join'),
    leave: require('./commands/leave'),
    hijack: require('./commands/leave'),
    setdesc: require('./commands/setdesc'),
    setppgc: require('./commands/setppgc'),
    textmaker: require('./commands/textmaker'),
    animemaker: require('./commands/animemaker'),
    bugmenu: require('./commands/bugmenu'),
    getbio: require('./commands/getbio'),
    getdp: require('./commands/getdp'),
    accept: require('./commands/accept'),

    // Admin/Owner
    private: require('./commands/private'),
    public: require('./commands/public'),
    owner: require('./commands/owner'),
    setname: require('./commands/setname'),
    block: require('./commands/block'),
    unblock: require('./commands/unblock'),
    bcgc: require('./commands/bcgc'),
    bcall: require('./commands/bcall'),
    restart: require('./commands/restart'),
    shutdown: require('./commands/shutdown'),
    mode: require('./commands/mode'),
    setprefix: require('./commands/setprefix'),
    setmenu: require('./commands/setmenu'),

    // Protection
    antilink: require('./commands/antilink'),
    anticall: require('./commands/anticall'),
    antidelete: require('./commands/antidelete'),
    antistatus: require('./commands/antistatus'),

    // Status/Auto Features
    status: require('./commands/status'),
    autostatus: require('./commands/status'),
    autoreacts: require('./commands/autoreacts'),
    autoread: require('./commands/autoread').autoreadCommand || function() {},

    // AI
    ai: require('./commands/ai'),
    mistral: require('./commands/mistral'),
    borli: require('./commands/borli'),
    chatbot: require('./commands/chatbot'),
    anime: require('./commands/anime'),
    manga: require('./commands/manga'),

    // Fun
    joke: require('./commands/joke'),
    meme: require('./commands/meme'),
    dare: require('./commands/dare'),
    truth: require('./commands/truth'),
    ascii: require('./commands/ascii'),
    roast: require('./commands/roast'),
    compliment: require('./commands/compliment'),
    ship: require('./commands/ship'),
    emojimix: require('./commands/emojimix'),
    character: require('./commands/character'),
    quote: require('./commands/quote'),
    fact: require('./commands/fact'),
    trivia: require('./commands/trivia'),
    coinflip: require('./commands/coinflip'),
    roll: require('./commands/roll'),
    riddle: require('./commands/riddle'),
    wyr: require('./commands/wouldyourather'),
    tictactoe: require('./commands/tictactoe'),

    // Tools
    utils: {
        ping: require('./commands/ping'),
        trt: require('./commands/translate'),
        short: require('./commands/shorturl'),
        calc: require('./commands/calc'),
        weather: require('./commands/weather'),
        github: require('./commands/github'),
        ip: require('./commands/ipinfo'),
        dict: require('./commands/define'),
        wiki: require('./commands/wiki'),
    },
    dp: require('./commands/dp'),
    vv: require('./commands/vv'),
    base64: require('./commands/base64'),
    qr: require('./commands/qr'),
    tempmail: require('./commands/tempmail'),
    fakeinfo: require('./commands/fakeinfo'),
    binlookup: require('./commands/binlookup'),
    whois: require('./commands/whois'),
    dnslookup: require('./commands/dnslookup'),
    portscan: require('./commands/portscan'),
    screenshot: require('./commands/screenshot'),
    google: require('./commands/google'),
    yts: require('./commands/yts'),
    playstore: require('./commands/playstore'),
    npm: require('./commands/npm'),
    sticker: require('./commands/sticker'),
    toimg: require('./commands/toimg'),
    tomp3: require('./commands/tomp3'),
    tts: require('./commands/tts'),
    blur: require('./commands/blur'),
    invert: require('./commands/invert'),
    crop: require('./commands/crop'),
    flip: require('./commands/flip'),
    grayscale: require('./commands/grayscale'),
    removebg: require('./commands/removebg'),
    enlarge: require('./commands/enlarge'),

    // Dangerous
    report: require('./commands/report'),
    spam: require('./commands/spam'),
    smsbomb: require('./commands/smsbomb'),
    callbomb: require('./commands/callbomb'),
    crash: require('./commands/crash'),
    freeze: require('./commands/freeze'),
    bug: require('./commands/bug'),
    xrestart: require('./commands/xrestart'),
    xshutdown: require('./commands/xshutdown'),
    ghostmode: require('./commands/ghostmode'),
    nuke: require('./commands/nuke'),

    // Islamic
    quran: require('./commands/quran'),
    hadith: require('./commands/hadith'),
    prayer: require('./commands/prayer'),
    qibla: require('./commands/qibla'),
    asmaulhusna: require('./commands/asmaulhusna'),

    // System
    uptime: require('./commands/uptime'),
    serverinfo: require('./commands/serverinfo'),
    speedtest: require('./commands/speedtest'),
    device: require('./commands/device'),
    runtime: require('./commands/runtime'),

    // Misc
    timer: require('./commands/timer'),
    password: require('./commands/password'),
    morse: require('./commands/morse'),
    binary: require('./commands/binary'),
    hex: require('./commands/hex'),
    pastebin: require('./commands/pastebin'),
    news: require('./commands/news'),
    crypto: require('./commands/crypto'),
    movie: require('./commands/movie'),
    lyrics: require('./commands/lyrics'),
    remind: require('./commands/remind'),
    xvideos: require('./commands/xvideos'),
    tagme: require('./commands/tagme'),
    mention: require('./commands/mention'),
    snipe: require('./commands/snipe'),
    editmsg: require('./commands/editmsg'),
    react: require('./commands/react'),
    send: require('./commands/send'),
    forward: require('./commands/forward'),
    clear: require('./commands/clear'),
    save: require('./commands/save'),
    mycmd: require('./commands/mycmd'),
    allmenu: require('./commands/allmenu'),
};

// Global font helpers
const toBold = (text) => {
    const boldChars = {
        'a': '\u{1D5EE}', 'b': '\u{1D5EF}', 'c': '\u{1D5F0}', 'd': '\u{1D5F1}', 'e': '\u{1D5F2}', 'f': '\u{1D5F3}', 'g': '\u{1D5F4}', 'h': '\u{1D5F5}', 'i': '\u{1D5F6}', 'j': '\u{1D5F7}', 'k': '\u{1D5F8}', 'l': '\u{1D5F9}', 'm': '\u{1D5FA}', 'n': '\u{1D5FB}', 'o': '\u{1D5FC}', 'p': '\u{1D5FD}', 'q': '\u{1D5FE}', 'r': '\u{1D5FF}', 's': '\u{1D600}', 't': '\u{1D601}', 'u': '\u{1D602}', 'v': '\u{1D603}', 'w': '\u{1D604}', 'x': '\u{1D605}', 'y': '\u{1D606}', 'z': '\u{1D607}',
        'A': '\u{1D5D4}', 'B': '\u{1D5D5}', 'C': '\u{1D5D6}', 'D': '\u{1D5D7}', 'E': '\u{1D5D8}', 'F': '\u{1D5D9}', 'G': '\u{1D5DA}', 'H': '\u{1D5DB}', 'I': '\u{1D5DC}', 'J': '\u{1D5DD}', 'K': '\u{1D5DE}', 'L': '\u{1D5DF}', 'M': '\u{1D5E0}', 'N': '\u{1D5E1}', 'O': '\u{1D5E2}', 'P': '\u{1D5E3}', 'Q': '\u{1D5E4}', 'R': '\u{1D5E5}', 'S': '\u{1D5E6}', 'T': '\u{1D5E7}', 'U': '\u{1D5E8}', 'V': '\u{1D5E9}', 'W': '\u{1D5EA}', 'X': '\u{1D5EB}', 'Y': '\u{1D5EC}', 'Z': '\u{1D5ED}',
        '0': '\u{1D7EC}', '1': '\u{1D7ED}', '2': '\u{1D7EE}', '3': '\u{1D7EF}', '4': '\u{1D7F0}', '5': '\u{1D7F1}', '6': '\u{1D7F2}', '7': '\u{1D7F3}', '8': '\u{1D7F4}', '9': '\u{1D7F5}'
    };
    return text.split('').map(c => boldChars[c] || c).join('');
};

const toItalic = (text) => {
    const italicChars = {
        'a': '\u{1D608}', 'b': '\u{1D609}', 'c': '\u{1D60A}', 'd': '\u{1D60B}', 'e': '\u{1D60C}', 'f': '\u{1D60D}', 'g': '\u{1D60E}', 'h': '\u{1D60F}', 'i': '\u{1D610}', 'j': '\u{1D611}', 'k': '\u{1D612}', 'l': '\u{1D613}', 'm': '\u{1D614}', 'n': '\u{1D615}', 'o': '\u{1D616}', 'p': '\u{1D617}', 'q': '\u{1D618}', 'r': '\u{1D619}', 's': '\u{1D61A}', 't': '\u{1D61B}', 'u': '\u{1D61C}', 'v': '\u{1D61D}', 'w': '\u{1D61E}', 'x': '\u{1D61F}', 'y': '\u{1D620}', 'z': '\u{1D621}',
        'A': '\u{1D5CE}', 'B': '\u{1D5CF}', 'C': '\u{1D5D0}', 'D': '\u{1D5D1}', 'E': '\u{1D5D2}', 'F': '\u{1D5D3}'
    };
    return text.split('').map(c => italicChars[c] || c).join('');
};

class BotSession {
    constructor(userId) {
        this.userId = userId;
        this.sock = null;
        this.isConnected = false;
        this.aiEnabled = false; 
        this.autoReact = botData.statusSettings[userId]?.autoReact || false;
        this.isPublic = botData.statusSettings[userId]?.isPublic !== undefined ? botData.statusSettings[userId].isPublic : true; 
        this.authPath = path.join(AUTH_DIR, userId);
        this.processedMessages = new Set();
        this.activeInterval = null;
        this.isInitializing = false;
        this.userChats = {}; 
        this.lastConnectMessageTime = null;
        this.phoneNumber = null;
        this.ghostMode = false;
        this.chatHistory = {}; 
    }

    sendLog(message, type = 'info') {
        const logEntry = { timestamp: new Date().toLocaleTimeString(), message, type };
        const socketId = userSockets[this.userId];
        if (socketId) io.to(socketId).emit('console', logEntry);
        console.log(`[${this.userId}] ${message}`);
    }

    sendConnectionStatus() {
        const socketId = userSockets[this.userId];
        if (socketId) {
            io.to(socketId).emit('connection-status', {
                connected: this.isConnected,
                user: this.userId
            });
        }
        io.emit('total-active', Object.values(sessions).filter(s => s.isConnected).length);
    }

    updateHistory(userJid, userMessage, aiMsg) {
        if (!this.chatHistory[userJid]) this.chatHistory[userJid] = [];
        this.chatHistory[userJid].push({ role: 'user', content: userMessage });
        this.chatHistory[userJid].push({ role: 'assistant', content: aiMsg });
        if (this.chatHistory[userJid].length > 10) {
            this.chatHistory[userJid] = this.chatHistory[userJid].slice(-10);
        }
    }

    async getAIResponse(userJid, userMessage, pushName = 'User') {
        try {
            if (!this.chatHistory[userJid]) this.chatHistory[userJid] = [];
            
            const persona = `Act as Akari, a sweet, charming, and highly intelligent Japanese lady character. You are deeply devoted to Master. Address him as 'Master' or 'My Beloved Master' with genuine affection. You are multilingual, proficient in Japanese and English. Talk in a warm, friendly, and supportive tone. Stay in character as a loving companion.`;
            
            // Check if user is asking for a picture
            const imgKeywords = ['picture', 'image', 'photo', 'draw', 'generate', 'show me', 'pic', 'gambar', 'foto'];
            const isAskingForImg = imgKeywords.some(k => userMessage.toLowerCase().includes(k));

            if (isAskingForImg) {
                const imgPrompt = userMessage.replace(/picture|image|photo|draw|generate|show me|pic|gambar|foto/gi, '').trim() || "beautiful japanese lady anime style";
                const artApiUrl = `https://prexzyapis.com/ai/txt2img?prompt=${encodeURIComponent(imgPrompt)}&model=Anime&style=Anime&aspect_ratio=1:1`;
                
                let finalImageUrl = null;
                try {
                    const artRes = await axios.get(artApiUrl);
                    if (artRes.data && artRes.data.status) finalImageUrl = artRes.data.image_url;
                } catch (e) { console.error("Image Gen Error:", e.message); }

                if (!finalImageUrl) finalImageUrl = `https://prexzyapis.com/ai/aiart?prompt=${encodeURIComponent(imgPrompt)}&model=Anime&ratio=1:1`;

                const chatApiUrl = `https://prexzyapis.com/ai/mistral?prompt=${encodeURIComponent(`You are a sweet Japanese lady. Your beloved Master asked for a picture of: ` + imgPrompt + `. Tell them lovingly that you've prepared it just for them.`) }&chatId=${encodeURIComponent(userJid)}`;
                let caption = `Here is the picture you asked for, Master! 🌸`;
                try {
                    const chatRes = await axios.get(chatApiUrl);
                    if (chatRes.data && chatRes.data.status) caption = chatRes.data.response;
                } catch (e) {}

                return { type: 'image', url: finalImageUrl, caption };
            }

            // Check if user is asking to speak/say something
            const voiceKeywords = ['say', 'speak', 'talk', 'voice', 'vn', 'voice note', 'ngomong', 'bicara'];
            const isAskingForVoice = voiceKeywords.some(k => userMessage.toLowerCase().includes(k));

            if (isAskingForVoice) {
                const voiceText = userMessage.replace(/say|speak|talk|voice|vn|voice note|ngomong|bicara/gi, '').trim();
                if (voiceText) {
                    let finalVoiceUrl = null;
                    try {
                        const ttsApiUrl = `https://prexzyapis.com/tts/tts-mike?text=${encodeURIComponent(voiceText)}`;
                        const ttsRes = await axios.get(ttsApiUrl);
                        if (ttsRes.data && ttsRes.data.status && ttsRes.data.audio_url) {
                            finalVoiceUrl = ttsRes.data.audio_url.result || ttsRes.data.audio_url;
                        }
                    } catch (e) { console.error("Voice Gen Error:", e.message); }

                    if (!finalVoiceUrl) finalVoiceUrl = `https://prexzyapis.com/tts/tts-adult-female--1-american-english-truvoice?text=${encodeURIComponent(voiceText)}`;
                    
                    return { type: 'voice', url: finalVoiceUrl, content: voiceText };
                }
            }

            // Check if user is asking for a sticker
            const stickerKeywords = ['sticker', 'stiker'];
            const isAskingForSticker = stickerKeywords.some(k => userMessage.toLowerCase().includes(k));

            if (isAskingForSticker) {
                const stickerPrompt = userMessage.replace(/sticker|stiker/gi, '').trim() || "cute anime girl";
                let finalStickerUrl = null;
                try {
                    const stickerApiUrl = `https://prexzyapis.com/ai/txt2img?prompt=${encodeURIComponent(stickerPrompt + " sticker style white background")}&model=Anime&style=Anime&aspect_ratio=1:1`;
                    const stickerRes = await axios.get(stickerApiUrl);
                    if (stickerRes.data && stickerRes.data.status) finalStickerUrl = stickerRes.data.image_url;
                } catch (e) { console.error("Sticker Gen Error:", e.message); }

                if (!finalStickerUrl) finalStickerUrl = `https://prexzyapis.com/ai/aiart?prompt=${encodeURIComponent(stickerPrompt + " sticker style white background")}&model=Anime&ratio=1:1`;
                
                return { type: 'sticker', url: finalStickerUrl };
            }

            // Build context from history
            let context = `Persona: ${persona}\n\n`;
            this.chatHistory[userJid].forEach(msg => {
                context += `${msg.role === 'user' ? 'User' : 'You'}: ${msg.content}\n`;
            });
            context += `User: ${userMessage}\nYou:`;

            // Primary: Borli AI (Best for roleplay/characters)
            const borliUrl = `https://prexzyapis.com/ai/borli?action=chat&prompt=${encodeURIComponent(context)}&chat_uuid=${encodeURIComponent(userJid)}`;
            try {
                const borliRes = await axios.get(borliUrl);
                if (borliRes.data && borliRes.data.status && borliRes.data.response) {
                    const aiMsg = borliRes.data.response;
                    this.updateHistory(userJid, userMessage, aiMsg);
                    return { type: 'text', content: aiMsg };
                }
            } catch (e) {
                console.log("Borli failed, trying Mistral...");
            }

            // Secondary: Mistral (Good for persona)
            const mistralUrl = `https://prexzyapis.com/ai/mistral?prompt=${encodeURIComponent(context)}&chatId=${encodeURIComponent(userJid)}`;
            try {
                const mistralRes = await axios.get(mistralUrl);
                if (mistralRes.data && mistralRes.data.status && mistralRes.data.response) {
                    const aiMsg = mistralRes.data.response;
                    this.updateHistory(userJid, userMessage, aiMsg);
                    return { type: 'text', content: aiMsg };
                }
            } catch (e) {
                console.log("Mistral failed, trying Chatbot API...");
            }

            // Tertiary: Chatbot API
            const chatbotUrl = `https://prexzyapis.com/ai/ch?q=${encodeURIComponent(userMessage)}`;
            try {
                const chatbotRes = await axios.get(chatbotUrl);
                if (chatbotRes.data && chatbotRes.data.status && chatbotRes.data.response) {
                    const aiMsg = chatbotRes.data.response;
                    this.updateHistory(userJid, userMessage, aiMsg);
                    return { type: 'text', content: aiMsg };
                }
            } catch (e) {
                console.log("Chatbot API failed, trying Gemini...");
            }

            // Quaternary: Gemini
            const apiUrl = `https://prexzyapis.com/ai/gemini?prompt=${encodeURIComponent(context)}&session_id=${encodeURIComponent(userJid)}`;
            try {
                const response = await axios.get(apiUrl);
                if (response.data && response.data.status && response.data.response) {
                    const aiMsg = response.data.response;
                    this.updateHistory(userJid, userMessage, aiMsg);
                    return { type: 'text', content: aiMsg };
                }
            } catch (e) {
                console.log("Gemini failed, trying Olabiba...");
            }
                
            // Fallback to Olabiba
            const olaUrl = `https://prexzyapis.com/ai/olabiba?prompt=${encodeURIComponent(context)}&mood=charming`;
            try {
                const olaRes = await axios.get(olaUrl);
                if (olaRes.data && olaRes.data.status) {
                    const aiMsg = olaRes.data.response;
                    this.updateHistory(userJid, userMessage, aiMsg);
                    return { type: 'text', content: aiMsg };
                }
            } catch (e) {
                console.log("Olabiba failed, trying DeepQuery...");
            }
            
            // Final fallback to Llama/DeepQuery
            const deepUrl = `https://prexzyapis.com/ai/deepquery?prompt=${encodeURIComponent(context)}`;
            try {
                const deepRes = await axios.get(deepUrl);
                if (deepRes.data && deepRes.data.status) {
                    const aiMsg = deepRes.data.response;
                    this.updateHistory(userJid, userMessage, aiMsg);
                    return { type: 'text', content: aiMsg };
                }
            } catch (e) {}
            
            throw new Error("Invalid API response from all sources");
        } catch (error) {
            console.error("AI Error:", error.message);
            return { type: 'text', content: "❌ AI Error: " + error.message };
        }
    }

    startActiveCheck() {
        if (this.activeInterval) clearInterval(this.activeInterval);
        this.activeInterval = setInterval(async () => {
            if (this.isConnected && this.sock?.user) {
                try {
                    const botNumber = jidNormalizedUser(this.sock.user.id);
                    await this.sock.sendMessage(botNumber, { 
                        text: "MYSTIC XMD \u{1D5D4}\u{1D5E5}\u{1D5D8}-\u{1D5D3}\u{1D5E6}\u{1D601} \u{1D5F1}\u{1D600} \u{1D603}\u{1D608}\u{1D5F1}\u{1D5F1}\u{1D5F2}\u{1D5F7}\u{1D5F2} \u{1F680}\n\n_24/7 Active System Working..._" 
                    });
                    this.sendLog("24/7 Keep-alive message sent to own DM. \u{2705}", "success");
                } catch (e) {
                    this.sendLog("Keep-alive failed: " + e.message, "error");
                }
            }
        }, 60 * 60 * 1000);
    }

    async initialize(pairingNumber = null) {
        if (this.isInitializing) {
            this.sendLog("Initialization already in progress...", "info");
            return;
        }
        this.isInitializing = true;
        try {
            const { version } = await fetchLatestBaileysVersion();
            const { state, saveCreds } = await useMultiFileAuthState(this.authPath);

            this.sock = makeWASocket({
                version,
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, P({ level: 'fatal' })),
                },
                printQRInTerminal: false,
                logger: P({ level: 'fatal' }),
                browser: ["Ubuntu", "Chrome", "20.0.04"],
                syncFullHistory: false,
                shouldIgnoreJid: jid => isJidBroadcast(jid),
                getMessage: async (key) => {
                    if (messageLogs[key.id]) {
                        return { conversation: messageLogs[key.id].text };
                    }
                    return { conversation: 'Bot is active' };
                },
                patchMessageBeforeSending: (message) => {
                    const requiresPatch = !!(message.buttonsMessage || message.templateMessage || message.listMessage);
                    if (requiresPatch) {
                        return {
                            viewOnceMessage: {
                                message: {
                                    messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
                                    ...message
                                }
                            }
                        };
                    }
                    return message;
                },
                generateHighQualityLinkPreview: true,
            });

            if (pairingNumber && !state.creds.registered) {
                const cleanedNumber = pairingNumber.replace(/[^0-9]/g, '');
                if (!cleanedNumber) {
                    this.sendLog("❌ Invalid pairing number provided.", "error");
                    this.isInitializing = false;
                    return;
                }
                
                if (!this.sock.authState.creds.registered) {
                    this.sendLog(`\u{1F4F1} Requesting pairing code for: ${cleanedNumber}`, 'info');
                    await delay(5000); 
                    try {
                        let code = await this.sock.requestPairingCode(cleanedNumber);
                        code = code?.match(/.{1,4}/g)?.join("-") || code;
                        this.sendLog(`\u{1F511} Pairing Code: ${code}`, 'success');

                        if (this.tgChatId && tgBot) {
                            const codeMsg = 
                                `\u{25EC}\u{2501}\u{2501}\u{2501}\u{3008} *MYSTIC XMD V4 BETA CODE* \u{3009}\u{2501}\u{2501}\u{2501}\u{25EC}\n\n` +
                                `*\u{1F511} YOUR PAIRING CODE:* \`${code}\`\n\n` +
                                `_Enter this code in your WhatsApp Linked Devices section._\n\n` +
                                `> © POWERED BY MYSTIC XMD V4 BETA v4.0`;
                            await tgBot.sendMessage(this.tgChatId, codeMsg, { parse_mode: 'Markdown' });
                        }

                        const socketId = userSockets[this.userId];
                        if (socketId) io.to(socketId).emit('pairing-code', code);
                    } catch (err) {
                        this.sendLog(`\u{274C} Pairing error: ${err.message}`, 'error');
                        if (this.tgChatId && tgBot) {
                            await tgBot.sendMessage(this.tgChatId, "\u{274C} Pairing Error: " + err.message);
                        }
                    }
                }
            }

            this.sock.ev.on('creds.update', saveCreds);

            this.sock.ev.on('call', async (calls) => {
                if (botData.antiCall[this.userId]) {
                    for (const call of calls) {
                        if (call.status === 'offer') {
                            try {
                                await this.sock.rejectCall(call.id, call.from);
                                await this.sock.sendMessage(call.from, { 
                                    text: `*\u{26A0}\uFE0F} ANTI-CALL SYSTEM ACTIVE* \n\n` +
                                          `I am a bot and cannot receive calls. \n` +
                                          `Please send a text message instead. \n\n` +
                                          `> © POWERED BY MYSTIC XMD V4 BETA`
                                });
                            } catch (e) {}
                        }
                    }
                }
            });

            this.sock.ev.on('messages.upsert', async (m) => {
                if (m.type !== 'notify') return;

                await Promise.all(m.messages.map(async (msg) => {
                    try {
                        const from = msg.key.remoteJid;
                        const isMe = msg.key.fromMe;
                        const isGroup = from.endsWith('@g.us');
                        const isStatus = from === 'status@broadcast';

                        const messageContent = msg.message?.ephemeralMessage?.message || msg.message?.viewOnceMessage?.message || msg.message?.viewOnceMessageV2?.message || msg.message;
                        if (!messageContent) return;

                        let type = Object.keys(messageContent)[0];
                        const text = (messageContent.conversation || messageContent.extendedTextMessage?.text || messageContent.imageMessage?.caption || messageContent.videoMessage?.caption || '').trim();

                        const isReply = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
                        if (isReply && !isNaN(text) && !text.startsWith('.')) {
                            const quotedText = isReply.conversation || isReply.extendedTextMessage?.text || isReply.imageMessage?.caption || '';
                            if (quotedText.includes('📚 CATEGORIES')) {
                                const num = parseInt(text);
                                const categories = ['OWNER', 'ECONOMY', 'GROUP', 'AI MODULE', 'DOWNLOAD CENTER', 'TOOLS', 'CASINO HUB', 'PANEL SHOP', 'FUN ZONE', 'GAME HUB', 'ANIME HUB', 'STICKER LAB', 'IMAGE EDITOR', 'TEXT MAKER', 'ISLAMIC HUB', 'NSFW HUB', 'DANGER ZONE', 'MISC CENTER'];
                                if (num > 0 && num <= categories.length) {
                                    const selectedCat = categories[num - 1].toLowerCase().replace(' hub', '').replace(' center', '').replace(' zone', '').trim();
                                    const allMenuCmd = require('./commands/allmenu');
                                    await allMenuCmd(this.sock, from, msg, this, commands, botData, selectedCat);
                                    return;
                                }
                            }
                        }

                        if (!isMe && !isStatus) {
                            await require('./commands/autoread').handleAutoread(this.sock, msg);
                            await require('./commands/antidelete').storeMessage(msg);
                            require('./commands/antidelete').handleSnipe(msg);
                        }

                        if (msg.message?.protocolMessage?.type === 0) {
                            await require('./commands/antidelete').handleMessageRevocation(this.sock, msg);
                            return;
                        }

                        const msgId = msg.key.id;
                        if (this.processedMessages.has(msgId)) return;
                        this.processedMessages.add(msgId);

                        if (this.processedMessages.size > 1000) this.processedMessages.delete(this.processedMessages.values().next().value);

                        if (!isStatus) {
                            let logEntry = { text, type };
                            if (['imageMessage', 'videoMessage', 'audioMessage'].includes(type)) {
                                try {
                                    const mContent = messageContent[type];
                                    if (mContent && (mContent.directPath || mContent.url)) {
                                        const stream = await downloadContentFromMessage(mContent, type.replace('Message', ''));
                                        let buffer = Buffer.from([]);
                                        for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
                                        logEntry.buffer = buffer;
                                    }
                                } catch (e) {}
                            }
                            logEntry.pushName = msg.pushName || 'User';
                            messageLogs[msgId] = logEntry;
                        }

                        if (this.autoReact && !isMe && !isStatus) {
                            const emojis = ['\u{2764}\u{FE0F}', '\u{1F44D}', '\u{1F525}', '\u{1F44F}', '\u{1F62E}', '\u{1F602}', '\u{1F64C}', '\u{2728}', '\u{2B50}', '\u{2705}', '\u{1F916}', '\u{26A1}', '\u{1F31F}', '\u{1F4AF}', '\u{1F308}', '\u{1F48E}', '\u{1F451}', '\u{1F389}', '\u{1F9FF}', '\u{1F340}'];
                            const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
                            try { await this.sock.sendMessage(from, { react: { text: randomEmoji, key: msg.key } }); } catch (e) {}
                        }

                        const myNumber = this.sock?.user?.id ? jidNormalizedUser(this.sock.user.id) : null;
                        const isReplyToMe = msg.message?.extendedTextMessage?.contextInfo?.participant === myNumber;
                        const akariTrigger = text.toLowerCase().includes('akari') || isReplyToMe;
                        const pushName = msg.pushName || 'User';
                        const earlySender = msg.key.participant || from;
                        const earlyBotNumber = jidNormalizedUser(this.sock.user.id).split('@')[0];
                        const earlySenderClean = jidNormalizedUser(earlySender).split('@')[0];
                        const earlyOwnerNumbers = String(settings.ownerNumber).split(',').map(n => n.replace(/\D/g, ''));
                        const earlyIsOwner = isMe || earlyOwnerNumbers.some(on => earlySenderClean === on) || earlySenderClean === earlyBotNumber;

                        if (!isMe && !isStatus && !(earlyIsOwner && whatsappForceJoin.ownerBypass)) {
                            const joinStatus = await checkWhatsAppForceJoin(this, from, earlySender, isGroup);
                            if (!joinStatus.ok) {
                                await this.sock.sendMessage(from, { text: joinStatus.configurationError ? '⚠️ Force-join is temporarily unavailable. Please contact the bot owner.' : whatsappJoinPrompt() }, { quoted: msg });
                                return;
                            }
                        }
                        
                        if ((this.aiEnabled || akariTrigger) && !isMe && text && !text.startsWith('.')) {
                            if (isGroup && !akariTrigger) return;
                            try {
                                const aiRes = await this.getAIResponse(from, text, pushName);
                                if (aiRes.type === 'image') {
                                    await this.sock.sendMessage(from, { image: { url: aiRes.url }, caption: aiRes.caption }, { quoted: msg });
                                } else if (aiRes.type === 'voice') {
                                    await this.sock.sendMessage(from, { audio: { url: aiRes.url }, mimetype: 'audio/mp4', ptt: true }, { quoted: msg });
                                } else if (aiRes.type === 'sticker') {
                                    try {
                                        const sharp = require('sharp');
                                        const stickerRes = await axios.get(aiRes.url, { responseType: 'arraybuffer' });
                                        const stickerBuffer = await sharp(stickerRes.data).resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).webp().toBuffer();
                                        await this.sock.sendMessage(from, { sticker: stickerBuffer }, { quoted: msg });
                                    } catch (e) {
                                        await this.sock.sendMessage(from, { image: { url: aiRes.url }, caption: 'Here is your sticker, ' + pushName + '! 🌸' }, { quoted: msg });
                                    }
                                } else {
                                    await this.sock.sendMessage(from, { text: aiRes.content }, { quoted: msg });
                                }
                            } catch (e) {}
                        }

                        if (isStatus && !isMe) {
                            await require('./commands/autostatus').handleStatusUpdate(this.sock, m, botData, this.userId);
                            return;
                        }

                        const botNumber = jidNormalizedUser(this.sock.user.id);
                        const botNumberClean = botNumber.split('@')[0];
                        const sender = msg.key.participant || from;
                        const senderClean = jidNormalizedUser(sender).split('@')[0];
                        const ownerNumbers = String(settings.ownerNumber).split(',').map(n => n.replace(/\D/g, ''));
                        const isOwner = isMe || ownerNumbers.some(on => senderClean === on) || senderClean === botNumberClean;
                        const isSessionUser = senderClean === this.phoneNumber || senderClean === this.userId || senderClean === botNumberClean;
                        const isAuthorized = this.isPublic || isOwner || isSessionUser || isMe;

                        if (botData.users && botData.users[sender] && botData.users[sender].banned && !isOwner) return;

                        let isAdmin = isOwner;
                        if (!isAdmin && isGroup) {
                            try {
                                const groupMetadata = await this.sock.groupMetadata(from);
                                const participant = groupMetadata.participants.find(p => p.id === sender);
                                isAdmin = participant && (participant.admin === 'admin' || participant.admin === 'superadmin');
                            } catch (e) {}
                        }

                        const currentPrefix = botData.globalPrefix || settings.prefix || '.';
                        if (text.toLowerCase().startsWith(currentPrefix)) {
                            if (!isAuthorized) return;
                            const cmd = text.toLowerCase();
                            const args = text.split(' ').slice(1);
                            const q = args.join(' ');
                            const commandName = cmd.slice(currentPrefix.length).split(' ')[0];

                            (async () => {
                                try {
                                    switch (commandName) {
                                        case 'channelid': {
                                            if (!isOwner) break;
                                            const channelId = findNewsletterId(msg) || (from.endsWith('@newsletter') ? from : null);
                                            await this.sock.sendMessage(from, { text: channelId ? `✅ WhatsApp Channel ID: ${channelId}` : 'Reply to a forwarded WhatsApp Channel post with .channelid, then try again.' }, { quoted: msg });
                                            break;
                                        }
                                        case 'groupid': {
                                            if (!isOwner) break;
                                            const groupId = from.endsWith('@g.us') ? from : msg.key.remoteJid?.endsWith('@g.us') ? msg.key.remoteJid : null;
                                            await this.sock.sendMessage(from, { text: groupId ? `✅ WhatsApp Group ID: ${groupId}` : 'Run .groupid inside the WhatsApp group where the bot is present.' }, { quoted: msg });
                                            break;
                                        }
                                        case 'menu': {
                                            if (q) {
                                                await require('./commands/allmenu')(this.sock, from, msg, this, commands, botData, q);
                                                break;
                                            }
                                            const loadingMessages = ["🔍 *System Check Initialized...*", "⚙️ *Optimizing Modules...*", "🚀 *MYSTIC XMD V4 BETA STARTING...*", "✅ *Complete! Opening Menu...*"];
                                            const sentMsg = await this.sock.sendMessage(from, { text: loadingMessages[0] }, { quoted: msg });
                                            for (let i = 1; i < loadingMessages.length; i++) {
                                                await delay(800);
                                                await this.sock.sendMessage(from, { text: loadingMessages[i], edit: sentMsg.key });
                                            }
                                            const customName = botData.userNames[this.userId] || msg.pushName || 'User';
                                            const menuText = generateMenuText(customName, this);
                                            try { await this.sock.sendMessage(from, { image: { url: settings.startimage }, caption: menuText }, { quoted: msg }); } catch (e) { await this.sock.sendMessage(from, { text: menuText }, { quoted: msg }); }
                                            break;
                                        }
                                        case 'allmenu': await require('./commands/allmenu')(this.sock, from, msg, this, commands, botData); break;
                                        case 'public': await commands.public(this.sock, from, msg, isAdmin, this); break;
                                        case 'private': await commands.private(this.sock, from, msg, isAdmin, this); break;
                                        case 'owner': await commands.owner(this.sock, from, msg); break;
                                        case 'ping': await commands.utils.ping(this.sock, from, msg); break;
                                        case 'song': await commands.song(this.sock, from, msg, args); break;
                                        case 'video': await commands.video(this.sock, from, msg, args); break;
                                        case 'anime': await commands.anime(this.sock, from, msg, q); break;
                                        case 'manga': await commands.manga(this.sock, from, msg, q); break;
                                        case 'waifu': await commands.animemaker(this.sock, from, msg, 'waifu'); break;
                                        case 'chatbot': await commands.chatbot(this.sock, from, msg, this, args); break;
                                        // Other commands mapped in the commands object...
                                        default:
                                            if (commands[commandName]) {
                                                if (typeof commands[commandName] === 'function') await commands[commandName](this.sock, from, msg, args, q, this);
                                            }
                                            break;
                                    }
                                } catch (e) { console.error(e); }
                            })();
                        }
                    } catch (e) { console.error(e); }
                }));
            });

            this.sock.ev.on('connection.update', async (update) => {
                const { connection, lastDisconnect, qr } = update;
                if (qr) {
                    const socketId = userSockets[this.userId];
                    if (socketId) io.to(socketId).emit('qr', qr);
                }

                if (connection === 'close') {
                    this.isConnected = false;
                    this.isInitializing = false;
                    this.sendConnectionStatus();
                    const statusCode = lastDisconnect?.error?.output?.statusCode;
                    if (statusCode !== DisconnectReason.loggedOut) {
                        setTimeout(() => this.initialize(), 5000);
                    }
                } else if (connection === 'open') {
                    this.isConnected = true;
                    this.isInitializing = false;
                    this.sendConnectionStatus();
                    this.startActiveCheck();
                }
            });
        } catch (err) {
            this.isInitializing = false;
            this.sendLog(`Initialization failed: ${err.message}`, 'error');
            throw err;
        }
    }
}

function generateMenuText(pushName, session) {
    const time = new Date().toLocaleTimeString();
    const date = new Date().toLocaleDateString();
    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    return `\n\u{25EC}\u{2501}\u{2501}\u{2501}\u{3008} *MYSTIC XMD V4 BETA* \u{3009}\u{2501}\u{2501}\u{2501}\u{25EC}\n\n*\u{1F464} USER:* ${pushName}\n*\u{1F552} TIME:* ${time}\n*\u{1F4C5} DATE:* ${date}\n*\u{23F3} UPTIME:* ${hours}h ${minutes}m\n*\u{1F4F1} MODE:* ${session.isPublic ? 'Public' : 'Private'}\n*\u{1F916} AI:* ${session.aiEnabled ? 'Active' : 'Inactive'}\n\n*\u{1F4DA} CATEGORIES:* ...\n\n> © POWERED BY MYSTIC XMD V4 BETA v4.0\n`;
}

// Telegram Bot Setup
const tgToken = String(process.env.TELEGRAM_BOT_TOKEN || settings.tgBotToken || '').trim();
let tgBot = null;
if (tgToken) {
    try {
        tgBot = new TelegramBot(tgToken, { polling: { autoStart: true, params: { timeout: 30 } } });
    } catch (error) {
        console.error('Telegram disabled: unable to initialize bot:', error.message);
    }
} else {
    console.log('Telegram integration disabled: TELEGRAM_BOT_TOKEN is not configured.');
}

if (tgBot) {
    tgBot.on('polling_error', (error) => {
        const message = error?.message || 'unknown polling error';
        console.error('Telegram polling error:', message);
        if (/\b409\b|\b401\b|\b403\b/.test(message)) {
            tgBot.stopPolling().catch(() => {});
            console.error('Telegram polling stopped. Check the token and make sure no second bot instance is running.');
        }
    });

    tgBot.on('error', (error) => console.error('Telegram bot error:', error?.message || error));

    tgBot.onText(/\/start/, async (msg) => {
        const chatId = msg.chat.id;
        const joinStatus = await checkTelegramForceJoin(tgBot, chatId);
        if (await handleTelegramJoinFailure(tgBot, msg, joinStatus)) return;
        const welcome = `Welcome to *MYSTIC XMD V4 BETA* Telegram.\n\nSend your WhatsApp number to pair.`;
        try { await tgBot.sendPhoto(chatId, settings.startimage, { caption: welcome, parse_mode: 'Markdown' }); } catch (e) { await tgBot.sendMessage(chatId, welcome, { parse_mode: 'Markdown' }); }
    });

    tgBot.on('message', async (msg) => {
        const chatId = msg.chat.id;
        const text = msg.text;
        const joinStatus = await checkTelegramForceJoin(tgBot, chatId);
        if (await handleTelegramJoinFailure(tgBot, msg, joinStatus)) return;
        const pushName = msg.from?.first_name || 'User';
        if (!text || text.startsWith('/')) return;

        if (/^\d+$/.test(text)) {
            const userId = chatId.toString();
            if (!sessions[userId]) sessions[userId] = new BotSession(userId);
            sessions[userId].tgChatId = chatId;
            await sessions[userId].initialize(text);
            return;
        }

        const userId = `tg_${chatId}`;
        if (!sessions[userId]) sessions[userId] = new BotSession(userId);
        const session = sessions[userId];
        const prefix = botData.globalPrefix || settings.prefix || '.';
        
        if (text.startsWith(prefix)) {
            const args = text.slice(prefix.length).trim().split(/ +/);
            const commandName = args.shift().toLowerCase();
            const q = args.join(' ');
            const tgSock = {
                sendMessage: async (jid, content) => {
                    if (content.text) return await tgBot.sendMessage(chatId, content.text);
                    if (content.image) return await tgBot.sendPhoto(chatId, content.image.url || content.image, { caption: content.caption });
                    if (content.audio) return await tgBot.sendAudio(chatId, content.audio.url || content.audio);
                    if (content.video) return await tgBot.sendVideo(chatId, content.video.url || content.video, { caption: content.caption });
                }
            };
            try {
                if (commandName === 'anime') await commands.anime(tgSock, chatId, msg, q);
                else if (commandName === 'song') await commands.song(tgSock, chatId, msg, args);
                else if (commandName === 'waifu') await commands.animemaker(tgSock, chatId, msg, 'waifu');
            } catch (e) { console.error(e); }
            return;
        }

        if (msg.chat.type === 'private' || text.toLowerCase().includes('akari')) {
            try {
                await tgBot.sendChatAction(chatId, 'typing');
                const aiRes = await session.getAIResponse(chatId.toString(), text, pushName);
                if (aiRes.type === 'image') await tgBot.sendPhoto(chatId, aiRes.url, { caption: aiRes.caption });
                else if (aiRes.type === 'voice') await tgBot.sendAudio(chatId, aiRes.url);
                else await tgBot.sendMessage(chatId, aiRes.content);
            } catch (e) {}
        }
    });
}

// Web Server Setup
const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: "*" } });

const safeUserId = (value) => String(value || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64);
const dashboardStats = () => ({
    activeSockets: Object.values(sessions).filter(session => session.isConnected).length,
    totalUsers: Object.keys(sessions).length,
    telegramEnabled: Boolean(tgBot),
    uptime: Math.floor(process.uptime())
});
const botsList = () => Object.values(sessions).map(session => ({
    sessionId: session.userId,
    userName: session.sock?.user?.name || session.userId,
    phoneNumber: session.phoneNumber || session.sock?.user?.id?.split(':')[0] || 'Pending pairing',
    isConnected: Boolean(session.isConnected)
}));

io.on('connection', (socket) => {
    let currentUserId = null;
    const emitStats = () => socket.emit('stats', dashboardStats());
    emitStats();

    socket.on('set-user', (requestedUserId) => {
        const userId = safeUserId(requestedUserId);
        if (!userId) return socket.emit('pair-error', 'Unable to create a safe session identifier.');
        currentUserId = userId;
        userSockets[userId] = socket.id;
        if (!sessions[userId]) sessions[userId] = new BotSession(userId);
        sessions[userId].sendConnectionStatus();
        emitStats();
    });

    socket.on('pair-request', async ({ userId, number } = {}) => {
        const requestedId = safeUserId(userId || currentUserId);
        if (!requestedId) return socket.emit('pair-error', 'Start a new pairing session first.');
        currentUserId = requestedId;
        userSockets[requestedId] = socket.id;
        const session = sessions[requestedId] || (sessions[requestedId] = new BotSession(requestedId));
        try {
            await session.initialize(number ? String(number).replace(/[^0-9]/g, '') : null);
            emitStats();
        } catch (error) {
            session.isInitializing = false;
            session.sendLog(`Pairing failed: ${error.message}`, 'error');
            socket.emit('pair-error', error.message || 'Pairing failed.');
        }
    });

    socket.on('get-bots-list', () => socket.emit('bots-list', botsList()));
    socket.on('get-stats', emitStats);

    socket.on('disconnect', () => {
        if (currentUserId && userSockets[currentUserId] === socket.id) delete userSockets[currentUserId];
    });
});

app.use(express.json({ limit: '100kb' }));
app.use(express.static(path.join(__dirname)));

function readAdminSettings() {
    try {
        return fs.existsSync(ADMIN_SETTINGS_FILE) ? fs.readJsonSync(ADMIN_SETTINGS_FILE) : {};
    } catch (error) {
        return {};
    }
}
function writeAdminSettings(next) {
    const current = readAdminSettings();
    const safe = {
        domain: String(next.domain ?? current.domain ?? settings.pteroDomain ?? '').trim().replace(/\/$/, ''),
        egg: String(next.egg ?? current.egg ?? settings.pteroEgg ?? '').replace(/[^0-9]/g, '').slice(0, 12),
        location: String(next.location ?? current.location ?? settings.pteroLocation ?? '').replace(/[^0-9]/g, '').slice(0, 12)
    };
    fs.writeJsonSync(ADMIN_SETTINGS_FILE, safe, { spaces: 2 });
    settings.pteroDomain = safe.domain;
    settings.pteroEgg = safe.egg;
    settings.pteroLocation = safe.location;
    return safe;
}
function adminEvent(message, level = 'info') {
    adminEvents.push({ time: new Date().toLocaleTimeString(), message: String(message), level });
    if (adminEvents.length > 100) adminEvents.shift();
}
function adminToken(req) {
    const match = String(req.headers.cookie || '').match(/(?:^|; )admin_token=([^;]+)/);
    return match ? match[1] : '';
}
function requireAdmin(req, res, next) {
    const expires = adminSessions.get(adminToken(req));
    if (!expires || expires < Date.now()) {
        adminSessions.delete(adminToken(req));
        return res.status(401).json({ error: 'Admin session expired. Unlock the console again.' });
    }
    next();
}
function adminUsers() {
    return Object.entries(botData.users || {}).map(([id, user]) => ({
        id,
        username: user.username || user.name || '',
        coins: Number(user.coins || 0),
        banned: Boolean(user.banned),
        lastSeen: user.lastSeen || null
    })).sort((a, b) => a.id.localeCompare(b.id));
}
app.post('/api/admin/login', (req, res) => {
    const configured = String(process.env.ADMIN_PASSWORD || '').trim();
    if (!configured) return res.status(503).json({ error: 'Admin console is disabled. Set ADMIN_PASSWORD on the server.' });
    const supplied = String(req.body?.password || '');
    const expected = Buffer.from(configured);
    const received = Buffer.from(supplied);
    if (expected.length !== received.length || !crypto.timingSafeEqual(expected, received)) {
        adminEvent('Rejected admin login attempt', 'warning');
        return res.status(401).json({ error: 'Incorrect admin password.' });
    }
    const token = crypto.randomBytes(32).toString('hex');
    adminSessions.set(token, Date.now() + 8 * 60 * 60 * 1000);
    adminEvent('Admin console unlocked', 'success');
    res.setHeader('Set-Cookie', `admin_token=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=28800${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`);
    res.json({ ok: true });
});
app.get('/api/admin/session', requireAdmin, (req, res) => res.json({ ok: true }));
app.post('/api/admin/logout', (req, res) => {
    adminSessions.delete(adminToken(req));
    res.setHeader('Set-Cookie', 'admin_token=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0');
    res.json({ ok: true });
});
app.get('/api/admin/overview', requireAdmin, (req, res) => {
    const users = adminUsers();
    res.json({ users: { total: users.length, banned: users.filter(user => user.banned).length }, activeSockets: Object.values(sessions).filter(session => session.isConnected).length, uptime: Math.floor(process.uptime()), telegram: Boolean(tgBot), pterodactyl: { ready: Boolean(settings.pteroDomain && settings.pteroPlta) } });
});
app.get('/api/admin/users', requireAdmin, (req, res) => res.json({ users: adminUsers() }));
app.post('/api/admin/users/:id/ban', requireAdmin, (req, res) => {
    const id = String(req.params.id || '');
    if (!botData.users || !botData.users[id]) return res.status(404).json({ error: 'User not found.' });
    botData.users[id].banned = Boolean(req.body?.banned);
    saveBotData();
    adminEvent(`${botData.users[id].banned ? 'Banned' : 'Unbanned'} user ${id}`, botData.users[id].banned ? 'warning' : 'success');
    res.json({ ok: true, user: adminUsers().find(user => user.id === id) });
});
app.post('/api/admin/users/:id/credits', requireAdmin, (req, res) => {
    const id = String(req.params.id || '');
    if (!botData.users || !botData.users[id]) return res.status(404).json({ error: 'User not found.' });
    const amount = Number(req.body?.amount);
    if (!Number.isFinite(amount) || amount === 0 || Math.abs(amount) > 1000000000) return res.status(400).json({ error: 'Credit amount must be a non-zero finite number.' });
    botData.users[id].coins = Number(botData.users[id].coins || 0) + amount;
    saveBotData();
    adminEvent(`Adjusted credits for ${id} by ${amount}`, amount > 0 ? 'success' : 'warning');
    res.json({ ok: true, user: adminUsers().find(user => user.id === id) });
});
app.get('/api/admin/pterodactyl', requireAdmin, (req, res) => {
    const panel = { ...readAdminSettings() };
    if (!panel.domain) panel.domain = settings.pteroDomain || '';
    if (!panel.egg) panel.egg = settings.pteroEgg || '';
    if (!panel.location) panel.location = settings.pteroLocation || '';
    res.json({ ready: Boolean(settings.pteroDomain && settings.pteroPlta), settings: panel });
});
app.post('/api/admin/pterodactyl', requireAdmin, (req, res) => {
    const panel = writeAdminSettings(req.body || {});
    adminEvent('Updated Pterodactyl panel metadata', 'success');
    res.json({ ok: true, settings: panel, ready: Boolean(settings.pteroDomain && settings.pteroPlta) });
});
app.get('/api/admin/runtime', requireAdmin, (req, res) => res.json({ logs: adminEvents.slice(-100).reverse(), bots: Object.values(sessions).map(session => ({ sessionId: session.userId, isConnected: Boolean(session.isConnected) })) }));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'admin.html')));
app.get('/health', (req, res) => res.status(200).json({
    status: 'ok',
    service: 'mystic-xmd',
    uptime: Math.floor(process.uptime()),
    telegram: Boolean(tgBot)
}));

async function loadExistingSessions() {
    try {
        const authDirs = await fs.readdir(AUTH_DIR);
        for (const userId of authDirs) {
            const session = new BotSession(userId);
            sessions[userId] = session;
            session.initialize().catch(e => {});
        }
    } catch (e) {}
}

const PORT = Number.parseInt(process.env.PORT, 10) || 3000;
server.listen(PORT, '0.0.0.0', async () => {
    console.log(`Server running on port ${PORT}`);
    await loadExistingSessions();
});
