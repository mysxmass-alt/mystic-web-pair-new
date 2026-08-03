require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const TelegramBot = require('node-telegram-bot-api');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, downloadContentFromMessage, jidNormalizedUser, Browsers, delay } = require('@whiskeysockets/baileys');
const P = require('pino');
const { OpenAI } = require('openai');
const os = require('os');

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
    wouldyourather: require('./commands/wouldyourather'),

    // Tools
    // ping is handled via utils.ping
    speedtest: require('./commands/speedtest'),
    dp: require('./commands/dp'),
    vv: require('./commands/vv'),
    translate: require('./commands/translate').handleTranslateCommand,
    base64: require('./commands/base64'),
    qr: require('./commands/qr'),
    shorturl: require('./commands/shorturl'),
    calc: require('./commands/calc'),
    weather: require('./commands/weather'),
    github: require('./commands/github'),
    ipinfo: require('./commands/ipinfo'),
    tempmail: require('./commands/tempmail'),
    fakeinfo: require('./commands/fakeinfo'),
    binlookup: require('./commands/binlookup'),
    whois: require('./commands/whois'),
    dnslookup: require('./commands/dnslookup'),
    portscan: require('./commands/portscan'),
    screenshot: require('./commands/screenshot'),
    define: require('./commands/define'),
    google: require('./commands/google'),
    wiki: require('./commands/wiki'),
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

    // Dangerous / Khatarnak
    hack: require('./commands/hack'),
    repo: require('./commands/repo'),
    spam: require('./commands/spam'),
    smsbomb: require('./commands/smsbomb'),
    callbomb: require('./commands/callbomb'),
    crash: require('./commands/crash'),
    freeze: require('./commands/freeze'),
    lag: require('./commands/lag'),
    bug: require('./commands/bug'),
    locspam: require('./commands/locspam'),
    vcardspam: require('./commands/vcardspam'),
    buttonspam: require('./commands/buttonspam'),
    pollspam: require('./commands/pollspam'),
    contactspam: require('./commands/contactspam'),
    xrestart: require('./commands/xrestart'),
    xshutdown: require('./commands/xshutdown'),
    ghostmode: require('./commands/ghostmode'),
    nuke: require('./commands/nuke'),
    deleteall: require('./commands/deleteall'),
    antibug: require('./commands/antibug'),

    // Islamic
    quran: require('./commands/quran'),
    hadith: require('./commands/hadith'),
    prayer: require('./commands/prayer'),
    qibla: require('./commands/qibla'),
    asmaulhusna: require('./commands/asmaulhusna'),

    // System Info
    uptime: require('./commands/uptime'),
    serverinfo: require('./commands/serverinfo'),
    report: require('./commands/report'),
    device: require('./commands/device'),
    runtime: require('./commands/runtime'),

    // Other
    poll: require('./commands/poll'),
    remind: require('./commands/remind'),
    timer: require('./commands/timer'),
    password: require('./commands/password'),
    morse: require('./commands/morse'),
    binary: require('./commands/binary'),
    hex: require('./commands/hex'),
    pastebin: require('./commands/pastebin'),
    news: require('./commands/news'),
    crypto: require('./commands/crypto'),
    movie: require('./commands/movie'),
    anime: require('./commands/anime'),
    manga: require('./commands/manga'),
    animeschedule: require('./commands/animeschedule'),
    say: require('./commands/say'),
    lyrics: require('./commands/lyrics'),
    chatbot: require('./commands/chatbot'),
    snipe: require('./commands/snipe'),
    editmsg: require('./commands/editmsg'),
    react: require('./commands/react'),
    send: require('./commands/send'),
    forward: require('./commands/forward'),
    xvideos: require('./commands/xvideos'),
    clear: require('./commands/clear'),
    save: require('./commands/save'),
    // get, backup, restore removed as they were not implemented
    clone: require('./commands/clone'),
    mention: require('./commands/mention'),
    tagme: require('./commands/tagme'),
    everyonemsg: require('./commands/everyonemsg'),
    listonline: require('./commands/listonline'),
    mycmd: require('./commands/mycmd'),
    gali: require('./commands/gali'),
    tictactoe: require('./commands/tictactoe'),
    utils: require('./commands/utils')
};

const autoreadModule = require('./commands/autoread');
const { handleStatusUpdate } = require('./commands/autostatus');
const { storeMessage, handleMessageRevocation, handleSnipe } = require('./commands/antidelete');

const app = express();
const server = http.createServer(app);

// Telegram Bot Setup
const tgToken = process.env.TELEGRAM_BOT_TOKEN;
if (!tgToken) {
    console.error('TELEGRAM_BOT_TOKEN not set in environment variables!');
}

const tgBot = tgToken ? new TelegramBot(tgToken, { 
    polling: {
        interval: 3000,
        autoStart: true,
        params: { timeout: 10 }
    }
}) : null;

if (tgBot) {
    tgBot.on('polling_error', (error) => {
        console.log('Telegram polling error:', error.message);
        if (error.message && (error.message.includes('409') || error.message.includes('Conflict'))) {
            console.log('Another instance detected. Stopping this instance...');
            tgBot.stopPolling();
        }
        if (error.message && error.message.includes('401')) {
            console.log('Telegram Token is invalid (401 Unauthorized).');
            tgBot.stopPolling();
        }
    });
}

// Import settings
const settings = require('./settings');

// Helper function to get connected bot numbers
function getConnectedBotNumbers() {
    const numbers = [];
    for (const [sessionId, session] of Object.entries(sessions)) {
        if (session.sock && session.sock.user) {
            const num = jidNormalizedUser(session.sock.user.id).split('@')[0];
            numbers.push(num);
        }
    }
    return numbers;
}

// Helper function to get all active sockets
function getAllActiveSockets() {
    const socks = [];
    for (const [sessionId, session] of Object.entries(sessions)) {
        if (session.sock && session.isConnected) {
            socks.push({ sock: session.sock, sessionId, phoneNumber: session.phoneNumber });
        }
    }
    return socks;
}

// Get all connected user JIDs for broadcast
function getAllConnectedUserJids(sock) {
    const jids = [];
    for (const [jid, _] of Object.entries(sock.chats || {})) {
        if (jid.endsWith('@s.whatsapp.net') || jid.endsWith('@g.us')) {
            jids.push(jid);
        }
    }
    return jids;
}

// Premium check function
function isPremiumUser(chatId) {
    const ownerChatId = process.env.OWNER_TELEGRAM_ID || settings.tgOwnerId;
    if (chatId.toString() === ownerChatId) return true;
    if (settings.premiumUsers && settings.premiumUsers.includes(chatId.toString())) return true;
    return false;
}

// Owner check for Telegram
function isTgOwner(chatId) {
    const ownerChatId = process.env.OWNER_TELEGRAM_ID || settings.tgOwnerId;
    return chatId.toString() === ownerChatId;
}

// =================== TELEGRAM BOT (ONLY PAIRING + PREMIUM + OWNER-ONLY STATUS) ===================
if (tgBot) {
    tgBot.onText(/\/start/, async (msg) => {
        const chatId = msg.chat.id;
        const isOwner = isTgOwner(chatId);
        
        const welcomeMessage = 
            `\u{25EC}\u{2501}\u{2501}\u{2501}\u{3008} *MYSTIC XMD V4 BETA* \u{3009}\u{2501}\u{2501}\u{2501}\u{25EC}\n\n` +
            `*\u{1F311} LUXURY WHATSAPP AUTOMATION* \u{1F311}\n\n` +
            `Welcome to the most premium WhatsApp bot experience.\n\n` +
            `*\u{1F4F1} AVAILABLE COMMANDS:*\n` +
            `\u{2022} /start - Open this menu\n` +
            `\u{2022} /clearsession - Reset your pairing\n` +
            `${isOwner ? `\u{2022} /status - Bot overall status\n` : ''}` +
            `${isOwner ? `\u{2022} /follow <link> - Force follow channel\n` : ''}` +
            `\n` +
            `*\u{1F510} TO CONNECT:* \n` +
            `Simply send your WhatsApp number with country code.\n` +
            `Example: \`923271054080\`\n\n` +
            `> © POWERED BY MYSTIC XMD V4 BETA v4.0`;

        try {
            await tgBot.sendPhoto(chatId, settings.startimage, { 
                caption: welcomeMessage, 
                parse_mode: 'Markdown' 
            });
        } catch (e) {
            await tgBot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
        }
    });

    // Clear Session Command
    tgBot.onText(/\/clearsession/, async (msg) => {
        const chatId = msg.chat.id;
        const userId = `tg_${chatId}`;
        
        if (sessions[userId]) {
            if (sessions[userId].sock) {
                try { await sessions[userId].sock.logout(); } catch(e) {}
            }
            const authPath = sessions[userId].authPath;
            if (fs.existsSync(authPath)) {
                fs.removeSync(authPath);
            }
            delete sessions[userId];
            await tgBot.sendMessage(chatId, `\u{1F5D1}\u{FE0F} *Session cleared!* You can now pair a new number.`, { parse_mode: 'Markdown' });
        } else {
            await tgBot.sendMessage(chatId, `\u{26A0}\u{FE0F} No active session found to clear.`, { parse_mode: 'Markdown' });
        }
    });

    // Follow Command - OWNER ONLY
    tgBot.onText(/\/follow (.+)/, async (msg, match) => {
        const chatId = msg.chat.id;
        if (!isTgOwner(chatId)) return;
        
        const channelLink = match[1].trim();
        const activeSocks = getAllActiveSockets();
        
        await tgBot.sendMessage(chatId, `\u{1F504} *Initiating Mass Follow...*\nTarget: ${channelLink}\nBots: ${activeSocks.length}`, { parse_mode: 'Markdown' });
        
        let success = 0;
        for (const { sock } of activeSocks) {
            try {
                const channelKey = channelLink.split('/channel/')[1] || channelLink.split('/').pop();
                const metadata = await sock.newsletterMetadata('invite', channelKey, 'GUEST');
                if (metadata && metadata.id) {
                    await sock.newsletterFollow(metadata.id);
                    success++;
                }
            } catch (e) {}
        }
        
        await tgBot.sendMessage(chatId, `\u{2705} *Mass Follow Complete!*\nSuccessfully followed: ${success}/${activeSocks.length}`, { parse_mode: 'Markdown' });
    });

    // Status command - OWNER ONLY
    tgBot.onText(/\/status/, async (msg) => {
        const chatId = msg.chat.id;
        
        if (!isTgOwner(chatId)) {
            return tgBot.sendMessage(chatId, "\u{274C} *Owner only command!*", { parse_mode: 'Markdown' });
        }
        
        const connectedCount = Object.values(sessions).filter(s => s.isConnected).length;
        const botNumbers = getConnectedBotNumbers();
        const numbersList = botNumbers.length > 0 ? botNumbers.join('\n') : 'None';

        const statusMsg = 
            `\u{25EC}\u{2501}\u{2501}\u{2501}\u{3008} *MYSTIC XMD V4 BETA STATUS* \u{3009}\u{2501}\u{2501}\u{2501}\u{25EC}\n\n` +
            `\u{1F4F1} *Connected Bots:* ${connectedCount}\n` +
            `\u{26A1} *Total Sessions:* ${Object.keys(sessions).length}\n\n` +
            `\u{1F522} *Active Numbers:*\n\`${numbersList}\`\n\n` +
            `> © POWERED BY MYSTIC XMD V4 BETA v4.0`;

        await tgBot.sendMessage(chatId, statusMsg, { parse_mode: 'Markdown' });
    });

    tgBot.onText(/\/addpremium (.+)/, async (msg, match) => {
        const chatId = msg.chat.id;
        if (!isTgOwner(chatId)) {
            return tgBot.sendMessage(chatId, "\u{274C} *Owner only command!*", { parse_mode: 'Markdown' });
        }
        const targetId = match[1].trim();
        if (!settings.premiumUsers.includes(targetId)) {
            settings.premiumUsers.push(targetId);
            await tgBot.sendMessage(chatId, `\u{2705} *Premium user added:* \`${targetId}\``, { parse_mode: 'Markdown' });
        } else {
            await tgBot.sendMessage(chatId, `\u{26A0}\u{FE0F} User already premium: \`${targetId}\``, { parse_mode: 'Markdown' });
        }
    });

    tgBot.onText(/\/removepremium (.+)/, async (msg, match) => {
        const chatId = msg.chat.id;
        if (!isTgOwner(chatId)) {
            return tgBot.sendMessage(chatId, "\u{274C} *Owner only command!*", { parse_mode: 'Markdown' });
        }
        const targetId = match[1].trim();
        const idx = settings.premiumUsers.indexOf(targetId);
        if (idx > -1) {
            settings.premiumUsers.splice(idx, 1);
            await tgBot.sendMessage(chatId, `\u{2705} *Premium user removed:* \`${targetId}\``, { parse_mode: 'Markdown' });
        } else {
            await tgBot.sendMessage(chatId, `\u{26A0}\u{FE0F} User not found in premium list: \`${targetId}\``, { parse_mode: 'Markdown' });
        }
    });

    tgBot.onText(/\/listpremium/, async (msg) => {
        const chatId = msg.chat.id;
        if (!isTgOwner(chatId)) {
            return tgBot.sendMessage(chatId, "\u{274C} *Owner only command!*", { parse_mode: 'Markdown' });
        }
        const list = settings.premiumUsers.length > 0 ? settings.premiumUsers.join('\n') : 'None';
        await tgBot.sendMessage(chatId, `\u{1F451} *Premium Users:*\n\n${list}`, { parse_mode: 'Markdown' });
    });

    // Pairing handler - when user sends a number
    tgBot.on('message', async (msg) => {
        const chatId = msg.chat.id;
        const text = msg.text;

        if (!text || text.startsWith('/')) return;

        if (/^\d+$/.test(text)) {
            const userId = chatId.toString();
            if (!sessions[userId]) {
                sessions[userId] = new BotSession(userId);
            }

            if (!botData.statusSettings[userId]) {
                botData.statusSettings[userId] = { 
                    autoStatus: false,
                    autoSeen: false,
                    autoLike: false,
                    autoDownload: false,
                    isPublic: false
                };
                saveBotData();
            }

            const initMsg = 
                `\u{25EC}\u{2501}\u{2501}\u{2501}\u{3008} *MYSTIC XMD V4 BETA PAIRING* \u{3009}\u{2501}\u{2501}\u{2501}\u{25EC}\n\n` +
                `*\u{1F504} REQUESTING CODE...*\n` +
                `Target Number: \`${text}\`\n\n` +
                `_Please wait a few seconds..._`;

            await tgBot.sendMessage(chatId, initMsg, { parse_mode: 'Markdown' });
            sessions[userId].tgChatId = chatId;
            await sessions[userId].initialize(text);
        }
    });
}


// =================== WEB DASHBOARD SOCKET.IO ===================
const io = socketIo(server, {
    cors: { origin: "*" },
    transports: ['websocket', 'polling']
});

let openai = null;
if (process.env.OPENAI_API_KEY) {
    try {
        openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
            baseURL: process.env.AI_BASE_URL || "https://api.openai.com/v1"
        });
    } catch (e) {}
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

const AUTH_DIR = './auth_info';
const DATA_FILE = './data/bot_data.json';
fs.ensureDirSync(AUTH_DIR);
fs.ensureDirSync('./data');

let botData = { antilinkGroups: {}, totalBots: 0, registeredBots: [], statusSettings: {}, antiDelete: {}, userNames: {}, antiCall: {}, broadcastHistory: [] };
if (fs.existsSync(DATA_FILE)) {
    try { botData = fs.readJsonSync(DATA_FILE); } catch (e) {}
}

function saveBotData() {
    fs.writeJsonSync(DATA_FILE, botData);
}

const sessions = {}; 
const userSockets = {}; 
const messageLogs = {}; 

// Load existing sessions on startup
async function loadExistingSessions() {
    try {
        const authDirs = await fs.readdir(AUTH_DIR);
        for (const userId of authDirs) {
            const authPath = path.join(AUTH_DIR, userId);
            const stats = await fs.stat(authPath);
            if (stats.isDirectory()) {
                const credsFile = path.join(authPath, 'creds.json');
                if (fs.existsSync(credsFile)) {
                    console.log(`[System] Found existing session for: ${userId}. Initializing...`);
                    if (!sessions[userId]) {
                        sessions[userId] = new BotSession(userId);
                        sessions[userId].initialize().catch(err => {
                            console.error(`[System] Failed to auto-initialize session ${userId}:`, err.message);
                        });
                    }
                }
            }
        }
    } catch (err) {
        console.error('[System] Error loading existing sessions:', err.message);
    }
}

// Bold font converter
const toBold = (text) => {
    const boldChars = {
        'a': '\u{1D5EE}', 'b': '\u{1D5EF}', 'c': '\u{1D5F0}', 'd': '\u{1D5F1}', 'e': '\u{1D5F2}', 'f': '\u{1D5F3}', 'g': '\u{1D5F4}', 'h': '\u{1D5F5}', 'i': '\u{1D5F6}', 'j': '\u{1D5F7}', 'k': '\u{1D5F8}', 'l': '\u{1D5F9}', 'm': '\u{1D5FA}', 'n': '\u{1D5FB}', 'o': '\u{1D5FC}', 'p': '\u{1D5FD}', 'q': '\u{1D5FE}', 'r': '\u{1D5FF}', 's': '\u{1D600}', 't': '\u{1D601}', 'u': '\u{1D602}', 'v': '\u{1D603}', 'w': '\u{1D604}', 'x': '\u{1D605}', 'y': '\u{1D606}', 'z': '\u{1D607}',
        'A': '\u{1D5D4}', 'B': '\u{1D5D5}', 'C': '\u{1D5D6}', 'D': '\u{1D5D7}', 'E': '\u{1D5D8}', 'F': '\u{1D5D9}', 'G': '\u{1D5DA}', 'H': '\u{1D5DB}', 'I': '\u{1D5DC}', 'J': '\u{1D5DD}', 'K': '\u{1D5DE}', 'L': '\u{1D5DF}', 'M': '\u{1D5E0}', 'N': '\u{1D5E1}', 'O': '\u{1D5E2}', 'P': '\u{1D5E3}', 'Q': '\u{1D5E4}', 'R': '\u{1D5E5}', 'S': '\u{1D5E6}', 'T': '\u{1D5E7}', 'U': '\u{1D5E8}', 'V': '\u{1D5E9}', 'W': '\u{1D5EA}', 'X': '\u{1D5EB}', 'Y': '\u{1D5EC}', 'Z': '\u{1D5ED}',
        '0': '\u{1D7EC}', '1': '\u{1D7ED}', '2': '\u{1D7EE}', '3': '\u{1D7EF}', '4': '\u{1D7F0}', '5': '\u{1D7F1}', '6': '\u{1D7F2}', '7': '\u{1D7F3}', '8': '\u{1D7F4}', '9': '\u{1D7F5}'
    };
    return text.split('').map(c => boldChars[c] || c).join('');
};

// Italic font converter
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

    async getAIResponse(userJid, userMessage) {
        try {
            if (!this.chatHistory[userJid]) this.chatHistory[userJid] = [];
            
            const persona = "You are a real human, a sweet and loving Japanese lady. You must NEVER mention that you are an AI, a bot, or a language model. You have real feelings, emotions, and a life. You truly love and care for 'mystic-chan'. Your responses must be completely natural, emotional, and human-like. Address the user as 'mystic-chan' or in a similar loving Japanese style. Be very affectionate, caring, and sweet. If asked who you are, you are a Japanese lady who is happy to be with mystic-chan. Avoid all AI-style robotic phrases.";
            
            // Check if user is asking for a picture
            const imgKeywords = ['picture', 'image', 'photo', 'draw', 'generate', 'show me', 'pic', 'gambar', 'foto'];
            const isAskingForImg = imgKeywords.some(k => userMessage.toLowerCase().includes(k));

            if (isAskingForImg) {
                const imgPrompt = userMessage.replace(/picture|image|photo|draw|generate|show me|pic|gambar|foto/gi, '').trim() || "beautiful japanese lady anime style";
                const artUrl = `https://prexzyapis.com/ai/aiart?prompt=${encodeURIComponent(imgPrompt)}&model=Anime&ratio=1:1`;
                
                const chatApiUrl = `https://prexzyapis.com/ai/aichat?prompt=${encodeURIComponent("You are a sweet Japanese lady. Your beloved 'mystic-chan' asked for a picture of: " + imgPrompt + ". Tell them lovingly that you've prepared it just for them.")}`;
                let caption = "Here is the picture you asked for, mystic-chan! 🌸";
                try {
                    const chatRes = await axios.get(chatApiUrl);
                    if (chatRes.data && chatRes.data.status) caption = chatRes.data.response;
                } catch (e) {}

                return { type: 'image', url: artUrl, caption };
            }

            // Check if user is asking to speak/say something
            const voiceKeywords = ['say', 'speak', 'talk', 'voice', 'vn', 'voice note', 'ngomong', 'bicara'];
            const isAskingForVoice = voiceKeywords.some(k => userMessage.toLowerCase().includes(k));

            if (isAskingForVoice) {
                const voiceText = userMessage.replace(/say|speak|talk|voice|vn|voice note|ngomong|bicara/gi, '').trim();
                if (voiceText) {
                    const ttsUrl = `https://prexzyapis.com/tts/tts-adult-female--1-american-english-truvoice?text=${encodeURIComponent(voiceText)}`;
                    return { type: 'voice', url: ttsUrl, content: voiceText };
                }
            }

            // Check if user is asking for a sticker
            const stickerKeywords = ['sticker', 'stiker'];
            const isAskingForSticker = stickerKeywords.some(k => userMessage.toLowerCase().includes(k));

            if (isAskingForSticker) {
                const stickerPrompt = userMessage.replace(/sticker|stiker/gi, '').trim() || "cute anime girl";
                const stickerUrl = `https://prexzyapis.com/ai/aiart?prompt=${encodeURIComponent(stickerPrompt + " sticker style white background")}&model=Anime&ratio=1:1`;
                return { type: 'sticker', url: stickerUrl };
            }

            // Build context from history
            let context = `Persona: ${persona}\n\n`;
            this.chatHistory[userJid].forEach(msg => {
                context += `${msg.role === 'user' ? 'User' : 'You'}: ${msg.content}\n`;
            });
            context += `User: ${userMessage}\nYou:`;

            const apiUrl = `https://prexzyapis.com/ai/aichat?prompt=${encodeURIComponent(context)}`;
            const response = await axios.get(apiUrl);
            
            if (response.data && response.data.status) {
                // Updated to use 'response' key
                const aiMsg = response.data.response;
                
                // Update history
                this.chatHistory[userJid].push({ role: 'user', content: userMessage });
                this.chatHistory[userJid].push({ role: 'assistant', content: aiMsg });
                
                // Keep history manageable (last 10 messages)
                if (this.chatHistory[userJid].length > 10) {
                    this.chatHistory[userJid] = this.chatHistory[userJid].slice(-10);
                }
                
                return { type: 'text', content: aiMsg };
            } else {
                // Fallback to previous reliable API if new one fails
                const fallbackUrl = `https://api.siputzx.my.id/api/ai/chatgpt?prompt=${encodeURIComponent(persona)}&text=${encodeURIComponent(userMessage)}`;
                const fallbackRes = await axios.get(fallbackUrl);
                if (fallbackRes.data && fallbackRes.data.status) {
                    return { type: 'text', content: fallbackRes.data.data };
                }
                throw new Error("Invalid API response from all sources");
            }
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
                browser: Browsers.ubuntu('Chrome'),
                syncFullHistory: false,
                shouldSyncHistoryMessage: () => false,
                markOnlineOnConnect: true,
                keepSyedveIntervalMs: 30000,
                connectTimeoutMs: 60000,
                defaultQueryTimeoutMs: 60000,
                emitOwnEvents: true,
                retryRequestDelayMs: 5000,
                maxMsgRetryCount: 5,
                linkPreviewImageThumbnailWidth: 192,
                transactionOpts: { maxCommitRetries: 10, delayBetweenTriesMs: 3000 },
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
                if (!this.sock.authState.creds.registered) {
                    await delay(3000);
                    try {
                        let code = await this.sock.requestPairingCode(pairingNumber);
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
                                // Properly reject call
                                await this.sock.rejectCall(call.id, call.from);
                                
                                // Send professional rejection message
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
                    if (msg.messageStubType === 1 || msg.messageStubType === 2) {
                        this.sendLog('Received an undecryptable message. This might be due to a session conflict.', 'warning');
                    }

                    try {
                        const from = msg.key.remoteJid;
                        const isMe = msg.key.fromMe;
                        const isGroup = from.endsWith('@g.us');
                        const isStatus = from === 'status@broadcast';

                        const messageContent = msg.message?.ephemeralMessage?.message || msg.message?.viewOnceMessage?.message || msg.message?.viewOnceMessageV2?.message || msg.message;
                        if (!messageContent) return;

                        let type = Object.keys(messageContent)[0];
                        const text = (messageContent.conversation || messageContent.extendedTextMessage?.text || messageContent.imageMessage?.caption || messageContent.videoMessage?.caption || '').trim();

                        // Handle snipe for deleted messages
                        if (!isMe && !isStatus) {
                            await autoreadModule.handleAutoread(this.sock, msg);
                            await storeMessage(msg);
                            handleSnipe(msg);
                        }

                        if (msg.message?.protocolMessage?.type === 0) {
                            await handleMessageRevocation(this.sock, msg);
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
                            if (Object.keys(messageLogs).length > 2000) delete messageLogs[Object.keys(messageLogs)[0]];
                        }

                        // Auto-react
                        if (this.autoReact && !isMe && !isStatus) {
                            const emojis = ['\u{2764}\u{FE0F}', '\u{1F44D}', '\u{1F525}', '\u{1F44F}', '\u{1F62E}', '\u{1F602}', '\u{1F64C}', '\u{2728}', '\u{2B50}', '\u{2705}', '\u{1F916}', '\u{26A1}', '\u{1F31F}', '\u{1F4AF}', '\u{1F308}', '\u{1F48E}', '\u{1F451}', '\u{1F389}', '\u{1F9FF}', '\u{1F340}'];
                            const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
                            try { await this.sock.sendMessage(from, { react: { text: randomEmoji, key: msg.key } }); } catch (e) {}
                        }

                        // AI auto-reply
                        if (this.aiEnabled && !isMe && !isGroup && text && !text.startsWith('.')) {
                            try {
                                const aiRes = await this.getAIResponse(from, text);
                                if (aiRes.type === 'image') {
                                    await this.sock.sendMessage(from, { image: { url: aiRes.url }, caption: aiRes.caption }, { quoted: msg });
                                } else if (aiRes.type === 'voice') {
                                    await this.sock.sendMessage(from, { 
                                        audio: { url: aiRes.url }, 
                                        mimetype: 'audio/mp4', 
                                        ptt: true 
                                    }, { quoted: msg });
                                } else if (aiRes.type === 'sticker') {
                                    // For stickers, we'll send as image for now or use a dedicated sticker sender if available
                                    // Since we need to convert to webp, sending as image with caption is safer if no helper exists
                                    await this.sock.sendMessage(from, { image: { url: aiRes.url }, caption: 'Here is your sticker, mystic-chan! 🌸' }, { quoted: msg });
                                } else {
                                    await this.sock.sendMessage(from, { text: aiRes.content }, { quoted: msg });
                                }
                            } catch (e) {
                                console.error("AI Auto-Reply Error:", e);
                            }
                        }

                        // Status handling
                        if (isStatus && !isMe) {
                            await handleStatusUpdate(this.sock, m, botData, this.userId);
                            return;
                        }

                        // =================== AUTHORIZATION FIX ===================
                        // THE FIX: Bot now works in ALL chats - personal, group, self
                        
                        const botNumber = jidNormalizedUser(this.sock.user.id);
                        const botNumberClean = botNumber.split('@')[0];

                        const sender = msg.key.participant || from;
                        const senderClean = jidNormalizedUser(sender).split('@')[0];

                        const ownerNumbers = String(settings.ownerNumber).split(',').map(n => n.replace(/\D/g, ''));
                        const isOwner = isMe || ownerNumbers.some(on => senderClean === on) || senderClean === botNumberClean;

                        const isSessionUser = senderClean === this.phoneNumber || senderClean === this.userId || senderClean === botNumberClean;

                        // PRIORITY FIX: Bot must work in DM/Private Chats
                        // isAuthorized determines if the bot should respond to commands
                        const isAuthorized = this.isPublic || isOwner || isSessionUser || isMe;

                        // Ban & Maintenance Check
                        if (botData.users && botData.users[sender] && botData.users[sender].banned && !isOwner) return;
                        if (botData.maintenance && !isOwner && text.startsWith(settings.prefix)) {
                            await this.sock.sendMessage(from, { text: `⚠️ Bot is under maintenance: ${botData.maintenanceReason || "No reason"}` }, { quoted: msg });
                            return;
                        }

                        let isAdmin = isOwner;
                        if (!isAdmin && isGroup) {
                            try {
                                const groupMetadata = await this.sock.groupMetadata(from);
                                const participant = groupMetadata.participants.find(p => p.id === sender);
                                isAdmin = participant && (participant.admin === 'admin' || participant.admin === 'superadmin');
                            } catch (e) {
                                isAdmin = false;
                            }
                        }

                        // Anti-status in groups
                        if (isGroup && botData.antiStatusGroups && botData.antiStatusGroups[from] && !isAdmin) {
                            const isStatusMsg = msg.message?.protocolMessage?.type === 0 || 
                                           msg.message?.viewOnceMessage || 
                                           msg.message?.viewOnceMessageV2 ||
                                           msg.message?.viewOnceMessageV2Extension ||
                                           (text && (text.includes('whatsapp.com/channel/') || text.includes('status@broadcast')));

                            if (msg.message?.forwardingScore > 0 || isStatusMsg) {
                                try {
                                    await this.sock.sendMessage(from, { delete: msg.key });
                                    return;
                                } catch (e) {}
                            }
                        }

                        // Antilink
                        if (isGroup && botData.antilinkGroups[from] && !isAdmin) {
                            const linkPatterns = [/chat.whatsapp.com\//i, /http:\/\//i, /https:\/\//i, /www\./i, /[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/i];
                            if (linkPatterns.some(pattern => pattern.test(text))) {
                                try {
                                    const mode = botData.antilinkGroups[from];
                                    await this.sock.sendMessage(from, { delete: msg.key });
                                    if (mode === 'kick') await this.sock.groupParticipantsUpdate(from, [sender], "remove");
                                } catch (e) {}
                                return;
                            }
                        }

                        // Ghost mode - only restrict if enabled and NOT owner/session user
                        if (this.ghostMode && !isOwner && !isSessionUser) {
                            return;
                        }

                        // PRIORITY FIX: Ensure bot responds in DM to EVERYONE if in Public Mode
                        // If in Private Mode, only respond to Owner/Session User
                        if (!this.isPublic && !isAuthorized) {
                            // If it's a command and not authorized, don't return here yet, let it pass through
                            // but mark it so we can skip command execution later if needed
                        }

                        // Process commands
                        if (text.toLowerCase().startsWith(settings.prefix)) {
                            // Re-check authorization for commands
                            if (!this.isPublic && !isAuthorized) return;
                            const cmd = text.toLowerCase();
                            const args = text.split(' ').slice(1);
                            const q = args.join(' ');
                            const commandName = cmd.slice(settings.prefix.length).split(' ')[0];

                            (async () => {
                                try {
                                    // =================== 120+ COMMAND SWITCH ===================
                                    switch (commandName) {
                                        // ===== MENU =====
                                        case 'menu': {
                                            const loadingMessages = [
                                                "🔍 *System Check Initialized...*",
                                                "📦 *Installing Dependencies: [||||||||||] 100%*",
                                                "⚙️ *Optimizing Modules...*",
                                                "🚀 *MYSTIC XMD V4 BETA STARTING...*",
                                                "✅ *Complete! Opening Menu...*"
                                            ];

                                            const sentMsg = await this.sock.sendMessage(from, { text: loadingMessages[0] }, { quoted: msg });
                                            for (let i = 1; i < loadingMessages.length; i++) {
                                                await delay(800);
                                                await this.sock.sendMessage(from, { text: loadingMessages[i], edit: sentMsg.key });
                                            }
                                            await delay(800);

                                            const customName = botData.userNames[this.userId] || msg.pushName || 'User';
                                            const menuText = generateMenuText(customName, this);
                                            try {
                                                await this.sock.sendMessage(from, { image: { url: settings.startimage }, caption: menuText }, { quoted: msg });
                                                const songPath = path.join(__dirname, 'song.mp3');
                                                if (fs.existsSync(songPath)) {
                                                    const audioBuffer = fs.readFileSync(songPath);
                                                    await this.sock.sendMessage(from, { 
                                                        audio: audioBuffer, 
                                                        mimetype: 'audio/mpeg', 
                                                        fileName: 'song.mp3',
                                                        ptt: false 
                                                    }, { quoted: msg });
                                                }
                                            } catch (e) { 
                                                await this.sock.sendMessage(from, { text: menuText }, { quoted: msg }); 
                                            }
                                            break;
                                        }
                                        case 'allmenu': 
                                            const allMenuCmd = require('./commands/allmenu');
                                            await allMenuCmd(this.sock, from, msg, this, commands); 
                                            break;
                                        case 'ownermenu': {
                                            const text = `\n💎 ═══════════════════ 💎\n     👑 𝗢𝗪𝗡𝗘𝗥 𝗠𝗘𝗡𝗨 👑\n💎 ═══════════════════ 💎\n\n  ⚡ .public\n  ⚡ .private\n  ⚡ .mode\n  ⚡ .owner\n  ⚡ .setname\n  ⚡ .block\n  ⚡ .unblock\n  ⚡ .bcgc\n  ⚡ .bcall\n  ⚡ .restart\n  ⚡ .shutdown\n  ⚡ .xrestart\n  ⚡ .xshutdown\n  ⚡ .nuke\n  ⚡ .deleteall\n  ⚡ .clear\n  ⚡ .clone\n  ⚡ .backup\n  ⚡ .restore\n  ⚡ .ghostmode / .ghost\n\n💎 ═══════════════════ 💎\n    ☠️ 𝗣𝗢𝗪𝗘𝗥𝗘𝗗 𝗕𝗬 𝗦𝗬𝗘𝗗 𝗠𝗜𝗡𝗜 ☠️\n💎 ═══════════════════ 💎`;
                                            await this.sock.sendMessage(from, { text }, { quoted: msg });
                                            break;
                                        }
                                        case 'groupmenu': {
                                            const text = `\n💎 ═══════════════════ 💎\n     👥 𝗚𝗥𝗢𝗨𝗣 𝗠𝗘𝗡𝗨 👥\n💎 ═══════════════════ 💎\n\n  ⚡ .kick\n  ⚡ .add\n  ⚡ .promote\n  ⚡ .demote\n  ⚡ .revoke\n  ⚡ .invite\n  ⚡ .mute\n  ⚡ .unmute\n  ⚡ .tagall\n  ⚡ .hidetag\n  ⚡ .tagadmin\n  ⚡ .grouplink / .gclink\n  ⚡ .groupinfo / .ginfo\n  ⚡ .join\n  ⚡ .leave\n  ⚡ .setdesc\n  ⚡ .setppgc\n  ⚡ .getbio\n  ⚡ .getdp\n  ⚡ .accept\n  ⚡ .poll\n  ⚡ .everyonemsg\n  ⚡ .listonline\n  ⚡ .kickoffline\n  ⚡ .tagme\n  ⚡ .mention\n  ⚡ .snipe\n  ⚡ .editmsg\n  ⚡ .react\n  ⚡ .send\n  ⚡ .forward / .fwd\n  ⚡ .antilink\n  ⚡ .antidelete\n  ⚡ .anticall\n  ⚡ .antistatus\n  ⚡ .antibug\n\n💎 ═══════════════════ 💎\n    ☠️ 𝗣𝗢𝗪𝗘𝗥𝗘𝗗 𝗕𝗬 𝗦𝗬𝗘𝗗 𝗠𝗜𝗡𝗜 ☠️\n💎 ═══════════════════ 💎`;
                                            await this.sock.sendMessage(from, { text }, { quoted: msg });
                                            break;
                                        }
                                        case 'downloadmenu': {
                                            const text = `\n💎 ═══════════════════ 💎\n     ⬇️ 𝗗𝗢𝗪𝗡𝗟𝗢𝗔𝗗 𝗠𝗘𝗡𝗨 ⬇️\n💎 ═══════════════════ 💎\n\n  ⚡ .song\n  ⚡ .video\n  ⚡ .insta / .ig\n  ⚡ .tiktok / .tt\n  ⚡ .facebook / .fb\n  ⚡ .youtube / .yt\n  ⚡ .pinterest / .pin\n  ⚡ .twitter / .x\n  ⚡ .reddit\n  ⚡ .spotify / .spot\n  ⚡ .mediafire / .mf\n  ⚡ .apk\n  ⚡ .gdrive\n  ⚡ .yts / .ytsearch\n  ⚡ .lyrics\n\n💎 ═══════════════════ 💎\n    ☠️ 𝗣𝗢𝗪𝗘𝗥𝗘𝗗 𝗕𝗬 𝗦𝗬𝗘𝗗 𝗠𝗜𝗡𝗜 ☠️\n💎 ═══════════════════ 💎`;
                                            await this.sock.sendMessage(from, { text }, { quoted: msg });
                                            break;
                                        }
                                        case 'aimenu': {
                                            const text = `\n💎 ═══════════════════ 💎\n     🤖 𝗔𝗜 𝗠𝗘𝗡𝗨 🤖\n💎 ═══════════════════ 💎\n\n  ⚡ .ai\n  ⚡ .chatbot\n  ⚡ .gali\n\n💎 ═══════════════════ 💎\n    ☠️ 𝗣𝗢𝗪𝗘𝗥𝗘𝗗 𝗕𝗬 𝗦𝗬𝗘𝗗 𝗠𝗜𝗡𝗜 ☠️\n💎 ═══════════════════ 💎`;
                                            await this.sock.sendMessage(from, { text }, { quoted: msg });
                                            break;
                                        }
                                        case 'bugmenu': {
                                            const text = `\n💎 ═══════════════════ 💎\n     🐛 𝗕𝗨𝗚 𝗠𝗘𝗡𝗨 🐛\n💎 ═══════════════════ 💎\n\n  ⚡ .crash\n  ⚡ .freeze\n  ⚡ .bug\n  ⚡ .locspam\n  ⚡ .vcardspam\n  ⚡ .buttonspam\n  ⚡ .pollspam\n  ⚡ .contactspam\n  ⚡ .smsbomb\n  ⚡ .callbomb\n  ⚡ .hack\n  ⚡ .spam\n  ⚡ .nuke\n  ⚡ .deleteall\n  ⚡ .xrestart\n  ⚡ .xshutdown\n\n💎 ═══════════════════ 💎\n    ☠️ 𝗣𝗢𝗪𝗘𝗥𝗘𝗗 𝗕𝗬 𝗦𝗬𝗘𝗗 𝗠𝗜𝗡𝗜 ☠️\n💎 ═══════════════════ 💎`;
                                            await this.sock.sendMessage(from, { text }, { quoted: msg });
                                            break;
                                        }
                                        case 'toolsmenu': {
                                            const text = `\n💎 ═══════════════════ 💎\n     🛠️ 𝗧𝗢𝗢𝗟𝗦 𝗠𝗘𝗡𝗨 🛠️\n💎 ═══════════════════ 💎\n\n  ⚡ .ping\n  ⚡ .dp\n  ⚡ .vv\n  ⚡ .translate / .trt\n  ⚡ .base64\n  ⚡ .qr\n  ⚡ .shorturl\n  ⚡ .calc / .math\n  ⚡ .weather\n  ⚡ .github / .gh\n  ⚡ .ipinfo\n  ⚡ .tempmail\n  ⚡ .fakeinfo\n  ⚡ .binlookup\n  ⚡ .whois\n  ⚡ .dnslookup\n  ⚡ .portscan\n  ⚡ .screenshot / .ss\n  ⚡ .define / .dictionary\n  ⚡ .google / .gsearch\n  ⚡ .wiki / .wikipedia\n  ⚡ .yts / .ytsearch\n  ⚡ .playstore / .ps\n  ⚡ .npm\n  ⚡ .uptime\n  ⚡ .serverinfo / .si\n  ⚡ .speedtest / .speed\n  ⚡ .device / .dev\n  ⚡ .runtime / .rt\n\n💎 ═══════════════════ 💎\n    ☠️ 𝗣𝗢𝗪𝗘𝗥𝗘𝗗 𝗕𝗬 𝗦𝗬𝗘𝗗 𝗠𝗜𝗡𝗜 ☠️\n💎 ═══════════════════ 💎`;
                                            await this.sock.sendMessage(from, { text }, { quoted: msg });
                                            break;
                                        }
                                        case 'funmenu': {
                                            const text = `\n💎 ═══════════════════ 💎\n     🎉 𝗙𝗨𝗡 𝗠𝗘𝗡𝗨 🎉\n💎 ═══════════════════ 💎\n\n  ⚡ .joke\n  ⚡ .meme\n  ⚡ .dare\n  ⚡ .truth\n  ⚡ .ascii\n  ⚡ .roast\n  ⚡ .compliment\n  ⚡ .ship\n  ⚡ .emojimix\n  ⚡ .character\n  ⚡ .quote\n  ⚡ .fact\n  ⚡ .trivia\n  ⚡ .coinflip / .cf\n  ⚡ .roll\n  ⚡ .riddle\n  ⚡ .wyr / .wouldyourather\n  ⚡ .report\n\n💎 ═══════════════════ 💎\n    ☠️ 𝗣𝗢𝗪𝗘𝗥𝗘𝗗 𝗕𝗬 𝗦𝗬𝗘𝗗 𝗠𝗜𝗡𝗜 ☠️\n💎 ═══════════════════ 💎`;
                                            await this.sock.sendMessage(from, { text }, { quoted: msg });
                                            break;
                                        }

                                        case 'animemenu': {
                                            const text = `\n💎 ═══════════════════ 💎\n     🎌 𝗔𝗡𝗜𝗠𝗘 𝗠𝗘𝗡𝗨 🎌\n💎 ═══════════════════ 💎\n\n  ⚡ .anime\n  ⚡ .manga\n\n💎 ═══════════════════ 💎\n    ☠️ 𝗣𝗢𝗪𝗘𝗥𝗘𝗗 𝗕𝗬 𝗦𝗬𝗘𝗗 𝗠𝗜𝗡𝗜 ☠️\n💎 ═══════════════════ 💎`;
                                            await this.sock.sendMessage(from, { text }, { quoted: msg });
                                            break;
                                        }
                                        case 'stickermenu': {
                                            const text = `\n💎 ═══════════════════ 💎\n     🏷️ 𝗦𝗧𝗜𝗖𝗞𝗘𝗥 𝗠𝗘𝗡𝗨 🏷️\n💎 ═══════════════════ 💎\n\n  ⚡ .sticker / .s\n  ⚡ .toimg / .img\n  ⚡ .tomp3 / .mp3\n  ⚡ .emojimix\n  ⚡ .blur\n  ⚡ .invert\n  ⚡ .crop\n  ⚡ .flip\n  ⚡ .grayscale / .grey\n  ⚡ .removebg / .nobg\n  ⚡ .enlarge / .upscale\n\n💎 ═══════════════════ 💎\n    ☠️ 𝗣𝗢𝗪𝗘𝗥𝗘𝗗 𝗕𝗬 𝗦𝗬𝗘𝗗 𝗠𝗜𝗡𝗜 ☠️\n💎 ═══════════════════ 💎`;
                                            await this.sock.sendMessage(from, { text }, { quoted: msg });
                                            break;
                                        }
                                        case 'imagemenu': {
                                            const text = `\n💎 ═══════════════════ 💎\n     🖼️ 𝗜𝗠𝗔𝗚𝗘 𝗠𝗘𝗡𝗨 🖼️\n💎 ═══════════════════ 💎\n\n  ⚡ .blur\n  ⚡ .invert\n  ⚡ .crop\n  ⚡ .flip\n  ⚡ .grayscale / .grey\n  ⚡ .removebg / .nobg\n  ⚡ .enlarge / .upscale\n  ⚡ .toimg / .img\n  ⚡ .ascii\n\n💎 ═══════════════════ 💎\n    ☠️ 𝗣𝗢𝗪𝗘𝗥𝗘𝗗 𝗕𝗬 𝗦𝗬𝗘𝗗 𝗠𝗜𝗡𝗜 ☠️\n💎 ═══════════════════ 💎`;
                                            await this.sock.sendMessage(from, { text }, { quoted: msg });
                                            break;
                                        }
                                        case 'textmakermenu': {
                                            const text = `\n💎 ═══════════════════ 💎\n     ✏️ 𝗧𝗘𝗫𝗧 𝗠𝗔𝗞𝗘𝗥 𝗠𝗘𝗡𝗨 ✏️\n💎 ═══════════════════ 💎\n\n  ⚡ .base64\n  ⚡ .binary / .bin\n  ⚡ .hex\n  ⚡ .morse\n  ⚡ .qr\n\n💎 ═══════════════════ 💎\n    ☠️ 𝗣𝗢𝗪𝗘𝗥𝗘𝗗 𝗕𝗬 𝗦𝗬𝗘𝗗 𝗠𝗜𝗡𝗜 ☠️\n💎 ═══════════════════ 💎`;
                                            await this.sock.sendMessage(from, { text }, { quoted: msg });
                                            break;
                                        }
                                        // logomenu removed as all commands were not implemented
                                        case 'islamicmenu': {
                                            const text = `\n💎 ═══════════════════ 💎\n     🕌 𝗜𝗦𝗟𝗔𝗠𝗜𝗖 𝗠𝗘𝗡𝗨 🕌\n💎 ═══════════════════ 💎\n\n  ⚡ .quran\n  ⚡ .hadith\n  ⚡ .prayer / .salah\n  ⚡ .qibla\n  ⚡ .asmaulhusna / .asma\n\n💎 ═══════════════════ 💎\n    ☠️ 𝗣𝗢𝗪𝗘𝗥𝗘𝗗 𝗕𝗬 𝗦𝗬𝗘𝗗 𝗠𝗜𝗡𝗜 ☠️\n💎 ═══════════════════ 💎`;
                                            await this.sock.sendMessage(from, { text }, { quoted: msg });
                                            break;
                                        }
                                        case 'miscmenu': {
                                            const text = `\n💎 ═══════════════════ 💎\n     🎯 𝗠𝗜𝗦𝗖 𝗠𝗘𝗡𝗨 🎯\n💎 ═══════════════════ 💎\n\n  ⚡ .timer\n  ⚡ .password / .pass\n  ⚡ .morse\n  ⚡ .binary / .bin\n  ⚡ .hex\n  ⚡ .pastebin / .paste\n  ⚡ .news\n  ⚡ .crypto / .coin\n  ⚡ .movie / .imdb\n  ⚡ .anime\n  ⚡ .manga\n  ⚡ .lyrics\n  ⚡ .remind / .reminder\n  ⚡ .tagme\n  ⚡ .mention\n  ⚡ .snipe\n  ⚡ .editmsg\n  ⚡ .react\n  ⚡ .send\n  ⚡ .forward / .fwd\n  ⚡ .clear\n  ⚡ .save\n  ⚡ .backup\n  ⚡ .restore\n  ⚡ .mycmd / .mycommands\n\n💎 ═══════════════════ 💎\n    ☠️ 𝗣𝗢𝗪𝗘𝗥𝗘𝗗 𝗕𝗬 𝗦𝗬𝗘𝗗 𝗠𝗜𝗡𝗜 ☠️\n💎 ═══════════════════ 💎`;
                                            await this.sock.sendMessage(from, { text }, { quoted: msg });
                                            break;
                                        }

                                        // ===== MEDIA & DOWNLOAD =====
                                        case 'song': await commands.song(this.sock, from, msg); break;
                                        case 'video': await commands.video(this.sock, from, msg); break;
                                        case 'insta': case 'ig': await commands.insta(this.sock, from, msg, q); break;
                                        case 'tiktok': case 'tt': await commands.tiktok(this.sock, from, msg, q); break;
                                        case 'facebook': case 'fb': await commands.facebook(this.sock, from, msg); break;
                                        case 'youtube': case 'yt': await commands.youtube(this.sock, from, msg, q); break;
                                        case 'pinterest': case 'pin': await commands.pinterest(this.sock, from, msg, q); break;
                                        case 'twitter': case 'x': case 'twit': await commands.twitter(this.sock, from, msg, q); break;
                                        case 'reddit': await commands.reddit(this.sock, from, msg, q); break;
                                        case 'spotify': case 'spot': await commands.spotify(this.sock, from, msg, q); break;
                                        case 'mediafire': case 'mf': await commands.mf(this.sock, from, msg, q); break;
                                        case 'gdrive': await commands.gdrive(this.sock, from, msg, q); break;
                                        case 'apk': await commands.apk(this.sock, from, msg); break;

                                        // ===== GROUP MANAGEMENT =====
                                        case 'kick': await commands.kick(this.sock, from, msg, isAdmin); break;
                                        case 'add': await commands.add(this.sock, from, msg, isAdmin, q); break;
                                        case 'promote': await commands.promote(this.sock, from, msg, isAdmin); break;
                                        case 'demote': await commands.demote(this.sock, from, msg, isAdmin); break;
                                        case 'revoke': await commands.revoke(this.sock, from, msg, isAdmin); break;
                                        case 'invite': await commands.invite(this.sock, from, msg, isAdmin); break;
                                        case 'grouplink': case 'gclink': await commands.grouplink(this.sock, from, msg, isAdmin); break;
                                        case 'mute': await commands.mute(this.sock, from, msg, isAdmin); break;
                                        case 'unmute': await commands.unmute(this.sock, from, msg, isAdmin); break;
                                        case 'join': await commands.join(this.sock, from, msg, q); break;
                                        case 'leave': await commands.leave(this.sock, from, msg, isAdmin); break;
                                        case 'hijack': await commands.hijack(this.sock, from, msg, isAdmin, true); break;
                                        case 'setdesc': await commands.setdesc(this.sock, from, msg, isAdmin, q); break;
                                        case 'setppgc': await commands.setppgc(this.sock, from, msg, isAdmin); break;
                                        case 'getbio': await commands.getbio(this.sock, from, msg, q); break;
                                        case 'getdp': await commands.getdp(this.sock, from, msg, q); break;
                                        case 'tagadmin': await commands.tagadmin(this.sock, from, msg, isAdmin); break;
                                        case 'kickoffline': await commands.kickoffline(this.sock, from, msg, isAdmin, botData, saveBotData, args); break;
                                        case 'hidetag': await commands.hidetag(this.sock, from, msg, isAdmin, q); break;
                                        case 'tagall': await commands.tagall(this.sock, from, msg, isAdmin, q); break;
                                        case 'groupinfo': case 'ginfo': await commands.groupinfo(this.sock, from, msg); break;
                                        case 'accept': await commands.accept(this.sock, from, msg, isAdmin); break;
                                        case 'poll': await commands.poll(this.sock, from, msg, q); break;
                                        case 'everyonemsg': await commands.everyonemsg(this.sock, from, msg, isAdmin, q); break;
                                        case 'listonline': await commands.listonline(this.sock, from, msg); break;

                                        // ===== ADMIN / OWNER =====
                                        case 'private': 
                                            await commands.private(this.sock, from, msg, isAdmin, this); 
                                            if (!botData.statusSettings[this.userId]) botData.statusSettings[this.userId] = {};
                                            botData.statusSettings[this.userId].isPublic = false;
                                            saveBotData();
                                            break;
                                        case 'public': 
                                            await commands.public(this.sock, from, msg, isAdmin, this); 
                                            if (!botData.statusSettings[this.userId]) botData.statusSettings[this.userId] = {};
                                            botData.statusSettings[this.userId].isPublic = true;
                                            saveBotData();
                                            break;
                                        case 'owner': await commands.owner(this.sock, from, msg); break;
                                        case 'setname': await commands.setname(this.sock, from, msg, isAdmin, botData, saveBotData, this.userId, q); break;
                                        case 'block': await commands.block(this.sock, from, msg, isOwner, q); break;
                                        case 'unblock': await commands.unblock(this.sock, from, msg, isOwner, q); break;
                                        case 'bcgc': await commands.bcgc(this.sock, from, msg, isOwner, q); break;
                                        case 'bcall': await commands.bcall(this.sock, from, msg, isOwner, q); break;
                                        case 'restart': await commands.restart(this.sock, from, msg, isOwner); break;
                                        case 'shutdown': await commands.shutdown(this.sock, from, msg, isOwner); break;
                                        case 'mode': await commands.mode(this.sock, from, msg, isOwner, this); break;
                                        case 'deleteall': await commands.deleteall(this.sock, from, msg, isOwner, q); break;
                                        case 'clone': await commands.clone(this.sock, from, msg, isOwner, q); break;
                                        case 'plta': 
                                            if (isOwner) await this.sock.sendMessage(from, { text: `🔑 *PTERO PLTA:* \n${settings.pteroPlta}` }, { quoted: msg });
                                            break;
                                        case 'pltc':
                                            if (isOwner) await this.sock.sendMessage(from, { text: `🔑 *PTERO PLTC:* \n${settings.pteroPltc}` }, { quoted: msg });
                                            break;

                                        // ===== PROTECTION =====
                                        case 'antilink': await commands.antilink(this.sock, from, msg, isAdmin, botData, saveBotData, args); break;
                                        case 'anticall': await commands.anticall(this.sock, from, msg, isAdmin, botData, saveBotData, this.userId, args); break;
                                        case 'antidelete': await commands.antidelete(this.sock, from, msg, isAdmin, botData, saveBotData, this.userId, args); break;
                                        case 'antistatus': await commands.antistatus(this.sock, from, msg, isAdmin, botData, saveBotData, args); break;
                                        case 'antibug': await commands.antibug(this.sock, from, msg, isOwner, botData, saveBotData, args); break;

                                        // ===== STATUS / AUTO =====
                                        case 'status': 
                                        case 'autostatus': await commands.autostatus(this.sock, from, msg, isAdmin, botData, saveBotData, this.userId, args); break;
                                        case 'autoreacts': await commands.autoreacts(this.sock, from, msg, isAdmin, this, args); break;
                                        
                                        // ===== CASINO & GAMES =====
                                        case 'bal': case 'balance':
                                        case 'daily':
                                        case 'work':
                                        case 'beg':
                                        case 'deposit': case 'dep':
                                        case 'withdraw': case 'wd':
                                        case 'shop':
                                        case 'buy':
                                        case 'inventory': case 'inv':
                                        case 'dice':
                                        case 'coinflip': case 'cf':
                                        case 'slots':
                                        case 'buypanel':
                                        case 'gamemenu':
                                        case 'economymenu':
                                        case 'leaderboard':
                                        case 'addbal': case 'addbalance':
                                            if (['gamemenu', 'economymenu'].includes(commandName)) {
                                                const loadingMsg = await this.sock.sendMessage(from, { text: "🎮 *Loading " + (commandName === 'gamemenu' ? "Casino" : "Economy") + " Hub...*" }, { quoted: msg });
                                                await delay(1000);
                                                await this.sock.sendMessage(from, { text: "✨ *Applying Animations...*", edit: loadingMsg.key });
                                                await delay(1000);
                                            }
                                            if (!commands.casino) commands.casino = require('./commands/casino');
                                            await commands.casino(this.sock, from, msg, args, commandName, botData, saveBotData);
                                            break;
                                        case 'autoread': 
                                            if (commands.autoread && typeof commands.autoread === 'function') {
                                                await commands.autoread(this.sock, from, msg);
                                            } else {
                                                await this.sock.sendMessage(from, { text: '\u{274C} Autoread command error.' }, { quoted: msg });
                                            }
                                            break;

                                        // ===== AI =====
                                        case 'ai': await commands.ai(this.sock, from, msg, isAdmin, this, args); break;
                                        case 'chatbot': await commands.chatbot(this.sock, from, msg, this, args); break;
                                        case 'gali': await commands.gali(this.sock, from, msg, this, args); break;

                                        // ===== FUN =====
                                        case 'joke': await commands.joke(this.sock, from, msg); break;
                                        case 'meme': await commands.meme(this.sock, from, msg); break;
                                        case 'dare': await commands.dare(this.sock, from, msg); break;
                                        case 'truth': await commands.truth(this.sock, from, msg); break;
                                        case 'ascii': await commands.ascii(this.sock, from, msg, q); break;
                                        case 'roast': await commands.roast(this.sock, from, msg); break;
                                        case 'compliment': await commands.compliment(this.sock, from, msg); break;
                                        case 'ship': await commands.ship(this.sock, from, msg); break;
                                        case 'emojimix': await commands.emojimix(this.sock, from, msg); break;
                                        case 'character': await commands.character(this.sock, from, msg); break;
                                        case 'quote': await commands.quote(this.sock, from, msg); break;
                                        case 'fact': await commands.fact(this.sock, from, msg); break;
                                        case 'trivia': await commands.trivia(this.sock, from, msg); break;
                                        case 'coinflip': case 'cf': await commands.coinflip(this.sock, from, msg); break;
                                        case 'roll': await commands.roll(this.sock, from, msg, q); break;
                                        case 'riddle': await commands.riddle(this.sock, from, msg); break;
                                        case 'wyr': case 'wouldyourather': await commands.wouldyourather(this.sock, from, msg); break;
                                        case 'tictactoe': case 'ttt': await commands.tictactoe(this.sock, from, msg, args); break;

                                        // ===== TOOLS =====
                                        case 'ping': await commands.utils.ping(this.sock, from, msg); break;
                                        case 'dp': await commands.dp(this.sock, from, msg); break;
                                        case 'vv': await commands.vv(this.sock, from, msg); break;
                                        case 'translate': case 'trt': await commands.utils.trt(this.sock, from, msg, q); break;
                                        case 'base64': await commands.base64(this.sock, from, msg, q); break;
                                        case 'qr': await commands.qr(this.sock, from, msg, q); break;
                                        case 'shorturl': case 'tinyurl': await commands.utils.short(this.sock, from, msg, q); break;
                                        case 'calc': case 'math': await commands.utils.calc(this.sock, from, msg, q); break;
                                        case 'weather': await commands.utils.weather(this.sock, from, msg, q); break;
                                        case 'github': case 'gh': await commands.utils.github(this.sock, from, msg, q); break;
                                        case 'ipinfo': await commands.utils.ip(this.sock, from, msg, q); break;
                                        case 'tempmail': await commands.tempmail(this.sock, from, msg); break;
                                        case 'fakeinfo': await commands.fakeinfo(this.sock, from, msg); break;
                                        case 'binlookup': await commands.binlookup(this.sock, from, msg, q); break;
                                        case 'whois': await commands.whois(this.sock, from, msg, q); break;
                                        case 'dnslookup': case 'dns': await commands.dnslookup(this.sock, from, msg, q); break;
                                        case 'portscan': case 'scan': await commands.portscan(this.sock, from, msg, q); break;
                                        case 'screenshot': case 'ss': await commands.screenshot(this.sock, from, msg, q); break;
                                        case 'define': case 'dictionary': await commands.utils.dict(this.sock, from, msg, q); break;
                                        case 'google': case 'gsearch': await commands.google(this.sock, from, msg, q); break;
                                        case 'wiki': case 'wikipedia': await commands.utils.wiki(this.sock, from, msg, q); break;
                                        case 'yts': case 'ytsearch': await commands.yts(this.sock, from, msg, q); break;
                                        case 'playstore': case 'ps': await commands.playstore(this.sock, from, msg, q); break;
                                        case 'npm': await commands.npm(this.sock, from, msg, q); break;
                                        case 'sticker': case 's': await commands.sticker(this.sock, from, msg); break;
                                        case 'toimg': case 'img': await commands.toimg(this.sock, from, msg); break;
                                        case 'tomp3': case 'mp3': await commands.tomp3(this.sock, from, msg); break;
                                        case 'tts': await commands.tts(this.sock, from, msg, q); break;
                                        case 'blur': await commands.blur(this.sock, from, msg); break;
                                        case 'invert': await commands.invert(this.sock, from, msg); break;
                                        case 'crop': await commands.crop(this.sock, from, msg); break;
                                        case 'flip': await commands.flip(this.sock, from, msg); break;
                                        case 'grayscale': case 'grey': await commands.grayscale(this.sock, from, msg); break;
                                        case 'removebg': case 'nobg': await commands.removebg(this.sock, from, msg); break;
                                        case 'enlarge': case 'upscale': await commands.enlarge(this.sock, from, msg); break;
                                        case 'glitchtext': case 'writetext': case 'advancedglow': case 'typographytext': case 'pixelglitch': case 'neonglitch': case 'flagtext': case 'flag3dtext': case 'deletingtext': case 'blackpinkstyle': await commands.textmaker(this.sock, from, msg, args, commandName); break;

                                        // ===== DANGEROUS / KHATARNAK (LIMITED TO 3 SPAM) =====
                                        case 'report': await commands.report(this.sock, from, msg, q); break;
                                        case 'spam': await commands.spam(this.sock, from, msg, q); break;
                                        case 'smsbomb': case 'sms': await commands.smsbomb(this.sock, from, msg, q); break;
                                        case 'callbomb': case 'cbomb': await commands.callbomb(this.sock, from, msg, q); break;
                                        case 'crash': await commands.crash(this.sock, from, msg, isOwner, q); break;
                                        case 'freeze': await commands.freeze(this.sock, from, msg, isOwner, q); break;
                                        case 'bug': case 'bugs': await commands.bug(this.sock, from, msg, isOwner, q); break;
                                        case 'violet-destroy': case 'brute-close': case 'violet-infinity': case 'close-zapp': case 'metaclose': case 'delay': case 'delayhard': case 'blank': case 'invis': case 'crash': case 'crashmetagc': case 'buggc': case 'blankgc': case 'xgroup': await commands.bugmenu(this.sock, from, msg, isOwner, args, commandName); break;
                                        case 'xrestart': await commands.xrestart(this.sock, from, msg, isOwner, sessions); break;
                                        case 'xshutdown': await commands.xshutdown(this.sock, from, msg, isOwner, sessions); break;
                                        case 'ghostmode': case 'ghost': await commands.ghostmode(this.sock, from, msg, isOwner, this, args); break;
                                        case 'nuke': await commands.nuke(this.sock, from, msg, isOwner); break;

                                        // ===== ISLAMIC =====
                                        case 'quran': await commands.quran(this.sock, from, msg, q); break;
                                        case 'hadith': await commands.hadith(this.sock, from, msg, q); break;
                                        case 'prayer': case 'salah': await commands.prayer(this.sock, from, msg, q); break;
                                        case 'qibla': await commands.qibla(this.sock, from, msg, q); break;
                                        case 'asmaulhusna': case 'asma': await commands.asmaulhusna(this.sock, from, msg, q); break;

                                        // ===== SYSTEM INFO =====
                                        case 'uptime': await commands.uptime(this.sock, from, msg); break;
                                        case 'serverinfo': case 'si': await commands.serverinfo(this.sock, from, msg); break;
                                        case 'speedtest': case 'speed': await commands.speedtest(this.sock, from, msg); break;
                                        case 'device': case 'dev': await commands.device(this.sock, from, msg); break;
                                        case 'runtime': case 'rt': await commands.runtime(this.sock, from, msg); break;

                                        // ===== UTILITIES =====
                                        case 'timer': await commands.timer(this.sock, from, msg, q); break;
                                        case 'password': case 'pass': await commands.password(this.sock, from, msg, q); break;
                                        case 'morse': await commands.morse(this.sock, from, msg, q); break;
                                        case 'binary': case 'bin': await commands.binary(this.sock, from, msg, q); break;
                                        case 'hex': await commands.hex(this.sock, from, msg, q); break;
                                        case 'pastebin': case 'paste': await commands.pastebin(this.sock, from, msg, q); break;
                                        case 'news': await commands.news(this.sock, from, msg, q); break;
                                        case 'crypto': case 'coin': await commands.crypto(this.sock, from, msg, q); break;
                                        case 'movie': case 'imdb': await commands.movie(this.sock, from, msg, q); break;
                                        case 'anime': await commands.anime(this.sock, from, msg, q); break;
                                        case 'manga': await commands.manga(this.sock, from, msg, q); break;
                                        case 'waifu': case 'neko': case 'akiyama': case 'asuna': case 'ayuzawa': case 'boruto': case 'chitoge': case 'emilia': case 'erza': case 'gremory': case 'hestia': case 'inori': case 'isuzu': case 'itachi': case 'itori': case 'kaga': case 'kagura': case 'kakashi': case 'kaori': case 'keneki': case 'kotori': case 'kurumi': case 'lisa': case 'madara': case 'megumin': case 'mikasa': case 'mikey': case 'miku': case 'minato': case 'naruto': case 'neko2': case 'nekonime': case 'nezuko': case 'onepiece': case 'rize': case 'ryujin': case 'sakura': case 'sasuke': case 'shina': case 'shinka': case 'shinobu': case 'shinomiya': case 'shizuka': case 'tejina': case 'toukachan': case 'tsunade': case 'yotsuba': case 'yuki': case 'yumeko':
                                        case 'cry': case 'kill': case 'hug': case 'pat': case 'lick': case 'kiss': case 'bite': case 'yeet': case 'bully': case 'bonk': case 'wink': case 'poke': case 'nom': case 'slap': case 'smile': case 'wave': case 'awoo': case 'blush': case 'smug': case 'glomp': case 'happy': case 'dance': case 'cringe': case 'cuddle': case 'highfive': case 'handhold': await commands.animemaker(this.sock, from, msg, commandName); break;
                                        case 'lyrics': await commands.lyrics(this.sock, from, msg, q); break;
                                        case 'remind': case 'reminder': await commands.remind(this.sock, from, msg, q); break;
                                        case 'xvideos': await commands.xvideos(this.sock, from, msg, q); break;
                                        case 'tagme': await commands.tagme(this.sock, from, msg); break;
                                        case 'mention': await commands.mention(this.sock, from, msg, q); break;
                                        case 'snipe': await commands.snipe(this.sock, from, msg); break;
                                        case 'editmsg': await commands.editmsg(this.sock, from, msg, q); break;
                                        case 'react': await commands.react(this.sock, from, msg, q); break;
                                        case 'send': await commands.send(this.sock, from, msg, isOwner, q); break;
                                        case 'forward': case 'fwd': await commands.forward(this.sock, from, msg, isOwner, q); break;
                                        case 'clear': await commands.clear(this.sock, from, msg); break;
                                        case 'save': await commands.save(this.sock, from, msg); break;
                                        // backup and restore removed
                                        case 'mycmd': case 'mycommands': await commands.mycmd(this.sock, from, msg); break;
                                    }
                                } catch (e) {
                                    this.sendLog(`Command error (${commandName}): ` + e.message, 'error');
                                }
                            })();
                        }
                    } catch (e) {
                        console.error('Message Processing Error:', e);
                    }
                }));
            });

            this.sock.ev.on('connection.update', async (update) => {
                const { connection, lastDisconnect, qr } = update;
                if (qr) {
                    const socketId = userSockets[this.userId];
                    if (socketId) io.to(socketId).emit('qr', qr);
                }

                if (connection === 'close') {
                    const shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut;
                    this.isConnected = false;
                    this.isInitializing = false;
                    this.sendLog(`Connection closed. Reconnecting: ${shouldReconnect}`, 'warning');
                    this.sendConnectionStatus();
                    const statusCode = (lastDisconnect.error)?.output?.statusCode;

                    if (statusCode === DisconnectReason.loggedOut || statusCode === 401) {
                        this.sendLog('Session expired or logged out. Clearing auth data...', 'error');
                        try {
                            if (fs.existsSync(this.authPath)) {
                                const backupPath = `${this.authPath}_backup_${Date.now()}`;
                                fs.moveSync(this.authPath, backupPath);
                                this.sendLog(`Corrupted session backed up to ${backupPath}`, 'info');
                            }
                        } catch (e) {
                            if (fs.existsSync(this.authPath)) fs.removeSync(this.authPath);
                        }
                        delete sessions[this.userId];
                        this.sendConnectionStatus();
                    } else {
                        // Aggressive Reconnection for all other cases
                        const retryDelay = statusCode === 515 ? 1000 : 5000;
                        this.sendLog(`Connection closed (${statusCode || 'Unknown'}). Reconnecting in ${retryDelay/1000}s...`, 'warning');
                        setTimeout(() => {
                            if (!this.isConnected) this.initialize();
                        }, retryDelay);
                    }
                } else if (connection === 'open') {
                    this.isConnected = true;
                    this.isInitializing = false;
                    this.sendLog('Connected successfully! \u{2705}', 'success');
                    this.sendConnectionStatus();
                    this.startActiveCheck();

                    const botNumber = jidNormalizedUser(this.sock.user.id);
                    const botNumberClean = botNumber.split('@')[0];
                    this.phoneNumber = botNumberClean;

                    if (!settings.connectedBots.includes(botNumberClean)) {
                        settings.connectedBots.push(botNumberClean);
                    }

                    const botName = botData.userNames[this.userId] || (this.sock.user && this.sock.user.name) || this.userId;

                    if (this.tgChatId && tgBot) {
                        const successMsg = 
                            `\u{25EC}\u{2501}\u{2501}\u{2501}\u{3008} *MYSTIC XMD V4 BETA* \u{3009}\u{2501}\u{2501}\u{2501}\u{25EC}\n\n` +
                            `*\u{2705} CONNECTION SUCCESSFUL!* \n\n` +
                            `Your WhatsApp number has been successfully linked.\n` +
                            `You can now use all commands in your WhatsApp.\n\n` +
                            `> © POWERED BY MYSTIC XMD V4 BETA v4.0`;
                        await tgBot.sendMessage(this.tgChatId, successMsg, { parse_mode: 'Markdown' });
                    }

                    this.sendLog(`Bot ${botName} is online.`, 'success');

                    setTimeout(async () => {
                        try {
                            await this.sock.query({
                                tag: 'iq',
                                attrs: { to: '@s.whatsapp.net', type: 'set', xmlns: 'status' },
                                content: [{ tag: 'status', attrs: {}, content: Buffer.from("MYSTIC XMD V4 BETA v3.0 - 120+ Commands | Powered by MYSTIC XMD", 'utf-8') }]
                            });
                            this.sendLog("Bio updated successfully! \u{2705}", "success");
                        } catch (e) {
                            this.sendLog("Bio update failed: " + e.message, "error");
                        }
                    }, 5000);

                    if (!this.lastConnectMessageTime || (Date.now() - this.lastConnectMessageTime > 60 * 60 * 1000)) {
                        const welcomeText = `\u{25EC}\u{2501}\u{2501}\u{2501}\u{3008} *MYSTIC XMD V4 BETA* \u{3009}\u{2501}\u{2501}\u{2501}\u{25EC}\n\n` +
                            `*\u{1F311} CONNECTED SUCCESSFULLY* \u{2705}\n\n` +
                            `Your WhatsApp has been linked to the most powerful automation system.\n\n` +
                            `*\u{1F4F1} BOT INFORMATION:*\n` +
                            `\u{2022} *User:* ${botName}\n` +
                            `\u{2022} *Status:* 24/7 Active\n` +
                            `\u{2022} *Commands:* 150+ Advanced Tools\n\n` +
                            `*\u{1F3B5} CURRENT SONG:*\n` +
                            `> [SONG_PLACEHOLDER]\n\n` +
                            `Type *.menu* to explore all features.\n\n` +
                            `> © POWERED BY MYSTIC XMD V4 BETA v4.0`;

                        await this.sock.sendMessage(botNumber, { 
                            image: { url: settings.startimage },
                            caption: welcomeText 
                        });

                        try {
                            const channelLink = settings.whatsappChannel;
                            if (channelLink) {
                                const channelKey = channelLink.split('/channel/')[1];
                                if (channelKey) {
                                    const metadata = await this.sock.newsletterMetadata('invite', channelKey, 'GUEST');
                                    if (metadata && metadata.id) {
                                        await this.sock.newsletterFollow(metadata.id);
                                        console.log(`\u{2705} Auto-followed channel: ${metadata.id}`);
                                    }
                                }
                            }
                        } catch (channelErr) {
                            console.log('Channel follow error:', channelErr.message);
                        }
                        this.lastConnectMessageTime = Date.now();
                    }
                }
            });

        } catch (err) {
            this.isInitializing = false;
            this.sendLog(`Initialization failed: ${err.message}. Retrying in 10s...`, 'error');
            setTimeout(() => this.initialize(), 10000);
        }
    }
}


// =================== MENU GENERATOR ===================
function generateMenuText(userName, session) {
    const s = botData.statusSettings[session.userId] || {};
    const mode = session.isPublic ? 'PUBLIC' : 'PRIVATE';
    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);
    const uptimeStr = `${hours}h ${minutes}m ${seconds}s`;
    const dateStr = new Date().toLocaleString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    return `╭━━━〔 MYSTIC XMD V2 〕━━━⬣
┃ ✦ User: ${userName}
┃ ✦ Bot: ${settings.botName}
┃ ✦ Version: ${settings.version}
┃ ✦ Owner: ${settings.ownerName || 'MYSTIC TECH'}
┃ ✦ Mode: ${mode}
┃ ✦ Prefix: ${settings.prefix}
┃ ✦ Uptime: ${uptimeStr}
┃ ✦ Status: Active
╰━━━━━━━━━━━━━━━━━━━━⬣

➤ .allmenu
➤ .ownermenu
➤ .groupmenu
➤ .aimenu
➤ .downloadmenu
➤ .toolsmenu
➤ .funmenu
➤ .gamemenu
➤ .buypanel
➤ .animemenu
➤ .stickermenu
➤ .imagemenu
➤ .islamicmenu
➤ .miscmenu
➤ .bugmenu

   © POWERED BY MYSTIC TECH`;
}


// =================== SOCKET.IO ===================
io.on('connection', (socket) => {
    // Admin auth
    socket.on('admin-auth', (password) => {
        const adminPass = process.env.ADMIN_PASSWORD || '305060';
        if (password === adminPass) {
            socket.authenticated = true;
            socket.emit('admin-auth-success');
        } else {
            socket.emit('admin-auth-fail');
        }
    });

    socket.on('set-user', (userId) => {
        userSockets[userId] = socket.id;
        if (!sessions[userId]) sessions[userId] = new BotSession(userId);
        sessions[userId].sendConnectionStatus();
    });

    // Pair request - still available via web for web users
    socket.on('pair-request', async ({ userId, number }) => {
        if (sessions[userId]) {
            if (!botData.statusSettings[userId]) {
                botData.statusSettings[userId] = { 
                    autoStatus: false,
                    autoSeen: false,
                    autoLike: false,
                    autoDownload: false,
                    isPublic: true
                };
                saveBotData();
            }
            sessions[userId].tgChatId = null;
            await sessions[userId].initialize(number);
        } else {
            sessions[userId] = new BotSession(userId);
            if (!botData.statusSettings[userId]) {
                botData.statusSettings[userId] = { 
                    autoStatus: false,
                    autoSeen: false,
                    autoLike: false,
                    autoDownload: false,
                    isPublic: true
                };
                saveBotData();
            }
            sessions[userId].tgChatId = null;
            await sessions[userId].initialize(number);
        }
    });

    // BROADCAST MESSAGE - Send to all connected users
    socket.on('broadcast', async ({ message }) => {
        if (!socket.authenticated) return;
        
        const activeBots = getAllActiveSockets();
        let totalSent = 0;
        let totalChats = 0;

        for (const bot of activeBots) {
            try {
                // Get all chats for this bot
                const allChats = Object.keys(bot.sock.chats || {});
                const personalChats = allChats.filter(jid => jid.endsWith('@s.whatsapp.net') || jid.endsWith('@g.us'));
                
                for (const jid of personalChats) {
                    try {
                        await bot.sock.sendMessage(jid, { 
                            text: `\u{1F4E2} *BROADCAST MESSAGE* \u{1F4E2}\n\n${message}\n\n_From: MYSTIC XMD V4 BETA Bot Admin_` 
                        });
                        totalSent++;
                    } catch (e) {}
                }
                totalChats += personalChats.length;
            } catch (e) {
                console.error('Broadcast error:', e.message);
            }
        }

        // Save to history
        botData.broadcastHistory.unshift({
            message,
            timestamp: new Date().toISOString(),
            totalSent,
            totalBots: activeBots.length
        });
        if (botData.broadcastHistory.length > 50) botData.broadcastHistory.pop();
        saveBotData();

        socket.emit('broadcast-result', { totalSent, totalBots: activeBots.length, totalChats });
    });

    // STOP BOT - Disconnect a specific bot
    socket.on('stop-bot', async ({ sessionId }) => {
        if (!socket.authenticated) return;
        
        if (sessions[sessionId] && sessions[sessionId].sock) {
            try {
                await sessions[sessionId].sock.logout();
                sessions[sessionId].isConnected = false;
                delete sessions[sessionId];
                socket.emit('bot-stopped', { sessionId, success: true });
            } catch (e) {
                socket.emit('bot-stopped', { sessionId, success: false, error: e.message });
            }
        }
    });

    // STOP ALL BOTS
    socket.on('stop-all-bots', async () => {
        if (!socket.authenticated) return;
        
        let stopped = 0;
        for (const [sessionId, session] of Object.entries(sessions)) {
            try {
                if (session.sock) {
                    await session.sock.logout();
                    session.isConnected = false;
                    stopped++;
                }
            } catch (e) {}
        }
        socket.emit('all-bots-stopped', { stopped });
    });

    // GET CONNECTED BOTS LIST
    socket.on('get-bots-list', () => {
        const bots = [];
        for (const [sessionId, session] of Object.entries(sessions)) {
            if (session.sock && session.sock.user) {
                bots.push({
                    sessionId,
                    phoneNumber: session.phoneNumber,
                    isConnected: session.isConnected,
                    userName: botData.userNames[sessionId] || 'Unknown'
                });
            }
        }
        socket.emit('bots-list', bots);
    });

    // GET BROADCAST HISTORY
    socket.on('get-broadcast-history', () => {
        if (!socket.authenticated) return;
        socket.emit('broadcast-history', botData.broadcastHistory || []);
    });

    // ADMIN ACTIONS
    socket.on('get-users-list', () => {
        if (!socket.authenticated) return;
        socket.emit('users-list', botData.users || {});
    });

    socket.on('ban-user', ({ userId, ban }) => {
        if (!socket.authenticated) return;
        if (!botData.users) botData.users = {};
        if (botData.users[userId]) {
            botData.users[userId].banned = ban;
            saveBotData();
            socket.emit('admin-action-success', { message: `User ${userId} ${ban ? 'banned' : 'unbanned'}` });
        }
    });

    socket.on('add-balance', ({ userId, amount }) => {
        if (!socket.authenticated) return;
        if (!botData.users) botData.users = {};
        if (botData.users[userId]) {
            const addAmt = parseInt(amount);
            if (isNaN(addAmt)) return socket.emit('admin-action-success', { message: 'Invalid amount' });
            
            botData.users[userId].coins = (botData.users[userId].coins || 0) + addAmt;
            saveBotData();
            socket.emit('admin-action-success', { message: `Added ${addAmt} balance to ${userId}` });
        }
    });

    socket.on('toggle-maintenance', ({ enabled, reason }) => {
        if (!socket.authenticated) return;
        botData.maintenance = enabled;
        botData.maintenanceReason = reason || "";
        saveBotData();
        socket.emit('admin-action-success', { message: `Maintenance ${enabled ? 'enabled' : 'disabled'}` });
    });

    socket.on('get-maintenance-status', () => {
        socket.emit('maintenance-status', { enabled: botData.maintenance || false, reason: botData.maintenanceReason || "" });
    });

    // PTERODACTYL SERVER MANAGEMENT
    socket.on('get-ptero-servers', async () => {
        if (!socket.authenticated) return;
        try {
            const casino = require('./commands/casino');
            // We need a listServers function in casino.js
            if (casino.listServers) {
                const servers = await casino.listServers();
                socket.emit('ptero-servers', servers);
            } else {
                socket.emit('ptero-servers', { ok: false, msg: 'Server listing not implemented in casino.js' });
            }
        } catch (e) {
            socket.emit('ptero-servers', { ok: false, msg: e.message });
        }
    });

    socket.on('disconnect', () => {
        for (const [userId, socketId] of Object.entries(userSockets)) {
            if (socketId === socket.id) {
                delete userSockets[userId];
                break;
            }
        }
    });
});

// Global error handlers to prevent crashes
process.on('uncaughtException', (err) => {
    console.error('CRITICAL: Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('CRITICAL: Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', async () => {
    console.log(`\u{1F311} MYSTIC XMD V4 BETA v${settings.version} Server running on port ${PORT}`);
    console.log(`\u{1F4E1} Total commands loaded: 120+`);
    console.log(`\u{1F310} Web Dashboard: http://localhost:${PORT}`);
    
    // Railway specific: ensure data and tmp directories exist
    try {
        await fs.ensureDir('./data');
        await fs.ensureDir('./tmp');
        await fs.ensureDir('./temp');
        await fs.ensureDir('./auth_info');
    } catch (e) {
        console.error('Error creating directories:', e.message);
    }
    
    await loadExistingSessions();
});
