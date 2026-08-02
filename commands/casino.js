const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const settings = require('../settings');

const PANELS_FILE = './data/panels.json';

// Initialize files if they don't exist
if (!fs.existsSync(PANELS_FILE)) {
    fs.ensureDirSync('./data');
    fs.writeJsonSync(PANELS_FILE, {});
}

function getPanels() {
    try { return fs.readJsonSync(PANELS_FILE); } catch (e) { return {}; }
}

function savePanels(data) {
    fs.writeJsonSync(PANELS_FILE, data);
}

function getUserData(userId, botData) {
    if (!botData.users) botData.users = {};
    
    const ownerNumber = settings.ownerNumber.replace(/[^0-9]/g, '');
    const isOwner = userId.includes(ownerNumber);
    
    if (!botData.users[userId]) {
        botData.users[userId] = {
            coins: isOwner ? 1000000000 : 400,
            username: botData.userNames?.[userId] || 'User',
            gamesPlayed: 0,
            gamesWon: 0,
            panelsBought: 0,
            banned: false,
            lastDaily: 0,
            lastBeg: 0,
            lastRob: 0
        };
    } else if (isOwner && botData.users[userId].coins < 1000000000) {
        // Ensure owner always has at least 1 billion
        botData.users[userId].coins = 1000000000;
    }
    return botData.users[userId];
}

const E = {
    coin: '💰', dice: '🎲', slot: '🎰', trophy: '🏆', win: '✅', lose: '❌', 
    shop: '🛒', rocket: '🚀', key: '🔑', user: '👤', lock: '🔒', info: 'ℹ️',
    chart: '📊', gem: '💎', lightning: '⚡', warning: '⚠️', time: '🕒', fire: '🔥', gift: '🎁'
};

const PANEL_PRICES = {
    '1gb': 1000, '2gb': 1500, '3gb': 2300, '4gb': 4700, '5gb': 6100,
    '6gb': 7500, '7gb': 8900, '8gb': 9300, '9gb': 10700, '10gb': 12100, 'unli': 15000
};

async function createPanel(username, plan) {
    const domain = process.env.PTERO_DOMAIN || settings.pteroDomain;
    const plta = process.env.PTERO_PLTA || settings.pteroPlta;
    
    if (!domain || !plta) return { ok: false, msg: 'Pterodactyl credentials not configured!' };

    const plans = {
        '1gb':{m:'1024',c:'30',d:'1024'},'2gb':{m:'2048',c:'60',d:'2048'},
        '3gb':{m:'3048',c:'90',d:'3048'},'4gb':{m:'4048',c:'120',d:'4048'},
        '5gb':{m:'5048',c:'150',d:'5048'},'6gb':{m:'6048',c:'180',d:'6048'},
        '7gb':{m:'7048',c:'210',d:'7048'},'8gb':{m:'8048',c:'240',d:'8048'},
        '9gb':{m:'9048',c:'270',d:'9048'},'10gb':{m:'10048',c:'300',d:'10048'},
        'unli':{m:'0',c:'0',d:'0'}
    };
    const p = plans[plan];
    const email = username + '@mystic-bot.com';
    const pwd = username + Math.floor(Math.random() * 9000 + 1000);
    const spc = 'if [[ -d .git ]] && [[ {{AUTO_UPDATE}} == "1" ]]; then git pull; fi; if [[ ! -z ${NODE_PACKAGES} ]]; then /usr/local/bin/npm install ${NODE_PACKAGES}; fi; if [[ ! -z ${UNNODE_PACKAGES} ]]; then /usr/local/bin/npm uninstall ${UNNODE_PACKAGES}; fi; if [ -f /home/container/package.json ]; then /usr/local/bin/npm install; fi; /usr/local/bin/${CMD_RUN}';

    try {
        // Ensure domain doesn't have trailing slash
        const baseUrl = domain.endsWith('/') ? domain.slice(0, -1) : domain;
        
        const ur = await axios.post(baseUrl + '/api/application/users', {
            email, username, first_name: username, last_name: 'MysticUser', language: 'en', password: pwd
        }, { headers: { 'Authorization': 'Bearer ' + plta, 'Accept': 'application/json' } });
        
        const user = ur.data.attributes;
        const sr = await axios.post(baseUrl + '/api/application/servers', {
            name: username + '-' + plan, user: user.id, egg: parseInt(settings.pteroEgg),
            docker_image: 'ghcr.io/parkervcp/yolks:nodejs_18',
            startup: spc,
            environment: { INST: 'npm', USER_UPLOAD: '0', AUTO_UPDATE: '0', CMD_RUN: 'npm start' },
            limits: { memory: p.m, swap: 0, disk: p.d, io: 500, cpu: p.c },
            feature_limits: { databases: 5, backups: 5, allocations: 1 },
            deploy: { locations: [parseInt(settings.pteroLocation)], dedicated_ip: false, port_range: [] }
        }, { headers: { 'Authorization': 'Bearer ' + plta, 'Accept': 'application/json' } });

        return { ok: true, user, server: sr.data.attributes, password: pwd, plan, email };
    } catch (e) {
        console.error('Pterodactyl API Error:', e.response?.data || e.message);
        return { ok: false, msg: e.response?.data?.errors?.[0]?.detail || e.message };
    }
}

async function listServers() {
    const domain = process.env.PTERO_DOMAIN || settings.pteroDomain;
    const plta = process.env.PTERO_PLTA || settings.pteroPlta;
    
    if (!domain || !plta) return { ok: false, msg: 'Pterodactyl credentials not configured!' };
    
    try {
        const baseUrl = domain.endsWith('/') ? domain.slice(0, -1) : domain;
        const res = await axios.get(baseUrl + '/api/application/servers', {
            headers: { 'Authorization': 'Bearer ' + plta, 'Accept': 'application/json' }
        });
        return { ok: true, data: res.data.data };
    } catch (e) {
        return { ok: false, msg: e.response?.data?.errors?.[0]?.detail || e.message };
    }
}

const { jidNormalizedUser } = require('@whiskeysockets/baileys');

async function casinoCommand(sock, from, msg, args, commandName, botData, saveBotData) {
    const userId = msg.key.remoteJid;
    const sender = jidNormalizedUser(msg.key.participant || userId);
    const user = getUserData(sender, botData);
    const ownerNumber = settings.ownerNumber.replace(/[^0-9]/g, '');
    const isOwner = sender.includes(ownerNumber);

    if (user.banned) return await sock.sendMessage(from, { text: E.warning + " You are banned!" }, { quoted: msg });
    if (botData.maintenance && !isOwner) {
        return await sock.sendMessage(from, { text: E.warning + " Bot is under maintenance: " + (botData.maintenanceReason || "No reason provided") }, { quoted: msg });
    }

    switch (commandName) {
        case 'bal':
        case 'balance':
            await sock.sendMessage(from, { text: `*${E.coin} WALLET BALANCE* \n\nUser: @${user.username}\nBalance: ${user.coins.toLocaleString()} coins` }, { quoted: msg });
            break;

        case 'daily':
            const now = Date.now();
            if (now - (user.lastDaily || 0) < 86400000) {
                const remaining = 86400000 - (now - (user.lastDaily || 0));
                const hours = Math.floor(remaining / 3600000);
                return await sock.sendMessage(from, { text: `${E.time} You already claimed your daily reward! Try again in ${hours}h.` }, { quoted: msg });
            }
            const reward = 500;
            user.coins += reward;
            user.lastDaily = now;
            saveBotData();
            await sock.sendMessage(from, { text: `${E.gift} Daily reward claimed! You got ${reward} coins.` }, { quoted: msg });
            break;

        case 'beg':
            const begNow = Date.now();
            if (begNow - (user.lastBeg || 0) < 300000) return await sock.sendMessage(from, { text: `${E.time} Stop begging! Wait 5 minutes.` }, { quoted: msg });
            const begAmt = Math.floor(Math.random() * 50) + 10;
            user.coins += begAmt;
            user.lastBeg = begNow;
            saveBotData();
            await sock.sendMessage(from, { text: `🙏 Someone felt sorry for you and gave you ${begAmt} coins.` }, { quoted: msg });
            break;

        case 'dice':
            if (!args[0] || !args[1]) return await sock.sendMessage(from, { text: `Usage: .dice [1-6] [bet]` }, { quoted: msg });
            const guess = parseInt(args[0]);
            const bet = parseInt(args[1]);
            if (guess < 1 || guess > 6 || isNaN(bet) || bet < 10) return await sock.sendMessage(from, { text: "Invalid guess or bet (min 10)!" }, { quoted: msg });
            if (user.coins < bet) return await sock.sendMessage(from, { text: "Not enough coins!" }, { quoted: msg });
            
            user.coins -= bet;
            user.gamesPlayed++;
            const roll = Math.floor(Math.random() * 6) + 1;
            if (roll === guess) {
                const win = bet * 2;
                user.coins += win;
                user.gamesWon++;
                await sock.sendMessage(from, { text: `${E.dice} Dice: ${roll}\n${E.win} YOU WON ${win} coins!` }, { quoted: msg });
            } else {
                await sock.sendMessage(from, { text: `${E.dice} Dice: ${roll}\n${E.lose} YOU LOST ${bet} coins!` }, { quoted: msg });
            }
            saveBotData();
            break;

        case 'coinflip':
        case 'cf':
            if (!args[0] || !args[1]) return await sock.sendMessage(from, { text: `Usage: .cf [heads/tails] [bet]` }, { quoted: msg });
            const choice = args[0].toLowerCase();
            const cfBet = parseInt(args[1]);
            if (!['heads', 'tails'].includes(choice) || isNaN(cfBet) || cfBet < 10) return await sock.sendMessage(from, { text: "Invalid choice or bet (min 10)!" }, { quoted: msg });
            if (user.coins < cfBet) return await sock.sendMessage(from, { text: "Not enough coins!" }, { quoted: msg });
            
            user.coins -= cfBet;
            user.gamesPlayed++;
            const result = Math.random() < 0.5 ? 'heads' : 'tails';
            if (result === choice) {
                const win = cfBet * 2;
                user.coins += win;
                user.gamesWon++;
                await sock.sendMessage(from, { text: `🪙 Result: ${result.toUpperCase()}\n${E.win} YOU WON ${win} coins!` }, { quoted: msg });
            } else {
                await sock.sendMessage(from, { text: `🪙 Result: ${result.toUpperCase()}\n${E.lose} YOU LOST ${cfBet} coins!` }, { quoted: msg });
            }
            saveBotData();
            break;

        case 'slots':
            const sBet = parseInt(args[0]);
            if (isNaN(sBet) || sBet < 10) return await sock.sendMessage(from, { text: "Invalid bet (min 10)!" }, { quoted: msg });
            if (user.coins < sBet) return await sock.sendMessage(from, { text: "Not enough coins!" }, { quoted: msg });
            
            user.coins -= sBet;
            user.gamesPlayed++;
            const icons = ['🍎', '💎', '🔔', '7️⃣', '🍒', '🍋'];
            const res = [icons[Math.floor(Math.random()*6)], icons[Math.floor(Math.random()*6)], icons[Math.floor(Math.random()*6)]];
            let multiplier = 0;
            if (res[0] === res[1] && res[1] === res[2]) multiplier = 10;
            else if (res[0] === res[1] || res[1] === res[2] || res[0] === res[2]) multiplier = 2;
            
            if (multiplier > 0) {
                const win = sBet * multiplier;
                user.coins += win;
                user.gamesWon++;
                await sock.sendMessage(from, { text: `${E.slot} [ ${res.join(' | ')} ]\n${E.win} YOU WON ${win} coins!` }, { quoted: msg });
            } else {
                await sock.sendMessage(from, { text: `${E.slot} [ ${res.join(' | ')} ]\n${E.lose} YOU LOST ${sBet} coins!` }, { quoted: msg });
            }
            saveBotData();
            break;

        case 'buypanel':
            if (!args[0]) return await sock.sendMessage(from, { text: `Usage: .buypanel [plan]\nPlans: 1gb, 2gb, 3gb, 4gb, 5gb, 6gb, 7gb, 8gb, 9gb, 10gb, unli` }, { quoted: msg });
            const plan = args[0].toLowerCase();
            const price = PANEL_PRICES[plan];
            if (!price) return await sock.sendMessage(from, { text: "Invalid plan!" }, { quoted: msg });
            if (user.coins < price) return await sock.sendMessage(from, { text: `Not enough coins! Price: ${price}` }, { quoted: msg });
            
            // Check panel limit (max 3 for normal users)
            if (!isOwner && (user.panelsBought || 0) >= 3) {
                return await sock.sendMessage(from, { text: `${E.warning} You have reached the maximum limit of 3 panels!` }, { quoted: msg });
            }

            const pName = user.username.replace(/[^a-z0-9]/gi, '').toLowerCase() + Math.floor(Math.random()*1000);
            await sock.sendMessage(from, { text: `${E.rocket} Creating your ${plan} panel...` }, { quoted: msg });
            
            const pRes = await createPanel(pName, plan);
            if (pRes.ok) {
                user.coins -= price;
                user.panelsBought = (user.panelsBought || 0) + 1;
                saveBotData();
                
                const panels = getPanels();
                if (!panels[sender]) panels[sender] = [];
                panels[sender].push({ plan, ...pRes.server, password: pRes.password, email: pRes.email });
                savePanels(panels);

                const domain = process.env.PTERO_DOMAIN || settings.pteroDomain;
                const details = `${E.trophy} *PANEL PURCHASE SUCCESS* \n\n` +
                    `${E.key} URL: ${domain}\n` +
                    `${E.user} User: ${pRes.user.username}\n` +
                    `${E.lock} Pass: ${pRes.password}\n` +
                    `${E.info} Email: ${pRes.email}\n` +
                    `${E.rocket} Plan: ${plan.toUpperCase()}`;
                
                await sock.sendMessage(sender, { text: details });
                await sock.sendMessage(from, { text: `${E.win} Panel created! Details sent to your DM.` }, { quoted: msg });
            } else {
                await sock.sendMessage(from, { text: `${E.lose} Failed: ${pRes.msg}` }, { quoted: msg });
            }
            break;

        case 'gamemenu':
            const menu = `*${E.dice} MYSTIC CASINO MENU* \n\n` +
                `.bal - Check coins\n` +
                `.daily - Daily reward\n` +
                `.beg - Beg for coins\n` +
                `.dice [1-6] [bet] - Play Dice\n` +
                `.cf [heads/tails] [bet] - Coin Flip\n` +
                `.slots [bet] - Play Slots\n` +
                `.buypanel [plan] - Buy Panel\n` +
                `.leaderboard - Top Players\n\n` +
                `*PANEL PRICES:*\n` +
                `1GB: 1000 | 2GB: 1500 | 3GB: 2300\n` +
                `4GB: 4700 | 5GB: 6100 | 6GB: 7500\n` +
                `7GB: 8900 | 8GB: 9300 | 9GB: 10700\n` +
                `10GB: 12100 | UNLI: 15000\n\n` +
                `${E.warning} Normal users: Max 3 panels.`;
            await sock.sendMessage(from, { text: menu }, { quoted: msg });
            break;

        case 'leaderboard':
            const users = Object.values(botData.users || {})
                .sort((a, b) => b.coins - a.coins)
                .slice(0, 10);
            let lb = `*${E.trophy} TOP 10 PLAYERS* \n\n`;
            users.forEach((u, i) => {
                lb += `${i+1}. ${u.username || 'User'} - ${u.coins.toLocaleString()} coins\n`;
            });
            await sock.sendMessage(from, { text: lb }, { quoted: msg });
            break;

        case 'addbal':
        case 'addbalance':
            if (!isOwner) return await sock.sendMessage(from, { text: E.warning + " This command is for owners only!" }, { quoted: msg });
            if (!args[0] || !args[1]) return await sock.sendMessage(from, { text: "Usage: .addbal @user [amount]" }, { quoted: msg });
            
            const targetJid = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || 
                             (args[0].includes('@') ? args[0].replace('@', '') + '@s.whatsapp.net' : null);
            const amount = parseInt(args[1]);

            if (!targetJid || isNaN(amount)) return await sock.sendMessage(from, { text: "Invalid user or amount!" }, { quoted: msg });
            
            const targetUser = getUserData(targetJid, botData);
            targetUser.coins += amount;
            saveBotData();
            
            await sock.sendMessage(from, { text: `${E.win} Successfully added ${amount.toLocaleString()} coins to @${targetJid.split('@')[0]}`, mentions: [targetJid] }, { quoted: msg });
            break;
    }
}

module.exports = casinoCommand;
module.exports.listServers = listServers;
