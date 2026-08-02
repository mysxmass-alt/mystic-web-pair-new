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
            banned: false
        };
    }
    return botData.users[userId];
}

const E = {
    coin: '💰', dice: '🎲', slot: '🎰', trophy: '🏆', win: '✅', lose: '❌', 
    shop: '🛒', rocket: '🚀', key: '🔑', user: '👤', lock: '🔒', info: 'ℹ️',
    chart: '📊', gem: '💎', lightning: '⚡', warning: '⚠️'
};

const PANEL_PRICES = {
    '1gb': 1000, '2gb': 1500, '3gb': 2300, '4gb': 4700, '5gb': 6100,
    '6gb': 7500, '7gb': 8900, '8gb': 9300, '9gb': 10700, '10gb': 12100, 'unli': 15000
};

async function createPanel(username, plan) {
    const domain = process.env.PTERO_DOMAIN;
    const plta = process.env.PTERO_PLTA;
    
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
    const email = username + '@mystic.com';
    const pwd = username + Math.floor(Math.random() * 9000 + 1000);

    try {
        const ur = await axios.post(domain + '/api/application/users', {
            email, username, first_name: username, last_name: 'User', language: 'en', password: pwd
        }, { headers: { 'Authorization': 'Bearer ' + plta, 'Accept': 'application/json' } });
        
        const user = ur.data.attributes;
        const sr = await axios.post(domain + '/api/application/servers', {
            name: username + '-' + plan, user: user.id, egg: 1,
            docker_image: 'ghcr.io/parkervcp/yolks:nodejs_18',
            startup: 'npm start',
            environment: { INST: 'npm', USER_UPLOAD: '0', AUTO_UPDATE: '0', CMD_RUN: 'npm start' },
            limits: { memory: p.m, swap: 0, disk: p.d, io: 500, cpu: p.c },
            feature_limits: { databases: 1, backups: 1, allocations: 1 },
            deploy: { locations: [1], dedicated_ip: false, port_range: [] }
        }, { headers: { 'Authorization': 'Bearer ' + plta, 'Accept': 'application/json' } });

        return { ok: true, user, server: sr.data.attributes, password: pwd, plan, email };
    } catch (e) {
        return { ok: false, msg: e.response?.data?.errors?.[0]?.detail || e.message };
    }
}

async function casinoCommand(sock, from, msg, args, commandName, botData, saveBotData) {
    const userId = msg.key.remoteJid;
    const sender = msg.key.participant || userId;
    const user = getUserData(sender, botData);

    if (user.banned) return await sock.sendMessage(from, { text: E.warning + " You are banned!" }, { quoted: msg });
    if (botData.maintenance && !sender.includes(settings.ownerNumber.replace(/[^0-9]/g, ''))) {
        return await sock.sendMessage(from, { text: E.warning + " Bot is under maintenance: " + (botData.maintenanceReason || "No reason provided") }, { quoted: msg });
    }

    switch (commandName) {
        case 'bal':
        case 'balance':
            await sock.sendMessage(from, { text: `*${E.coin} WALLET BALANCE* \n\nUser: @${user.username}\nBalance: ${user.coins.toLocaleString()} coins` }, { quoted: msg });
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

        case 'slots':
            const sBet = parseInt(args[0]);
            if (isNaN(sBet) || sBet < 10) return await sock.sendMessage(from, { text: "Invalid bet (min 10)!" }, { quoted: msg });
            if (user.coins < sBet) return await sock.sendMessage(from, { text: "Not enough coins!" }, { quoted: msg });
            
            user.coins -= sBet;
            user.gamesPlayed++;
            const icons = ['🍎', '💎', '🔔', '7️⃣', '🍒', '🍋'];
            const result = [icons[Math.floor(Math.random()*6)], icons[Math.floor(Math.random()*6)], icons[Math.floor(Math.random()*6)]];
            let multiplier = 0;
            if (result[0] === result[1] && result[1] === result[2]) multiplier = 10;
            else if (result[0] === result[1] || result[1] === result[2] || result[0] === result[2]) multiplier = 2;
            
            if (multiplier > 0) {
                const win = sBet * multiplier;
                user.coins += win;
                user.gamesWon++;
                await sock.sendMessage(from, { text: `${E.slot} [ ${result.join(' | ')} ]\n${E.win} YOU WON ${win} coins!` }, { quoted: msg });
            } else {
                await sock.sendMessage(from, { text: `${E.slot} [ ${result.join(' | ')} ]\n${E.lose} YOU LOST ${sBet} coins!` }, { quoted: msg });
            }
            saveBotData();
            break;

        case 'buypanel':
            if (!args[0]) return await sock.sendMessage(from, { text: `Usage: .buypanel [plan]\nPlans: 1gb, 2gb, 3gb, 4gb, 5gb, 6gb, 7gb, 8gb, 9gb, 10gb, unli` }, { quoted: msg });
            const plan = args[0].toLowerCase();
            const price = PANEL_PRICES[plan];
            if (!price) return await sock.sendMessage(from, { text: "Invalid plan!" }, { quoted: msg });
            if (user.coins < price) return await sock.sendMessage(from, { text: `Not enough coins! Price: ${price}` }, { quoted: msg });
            
            const pName = user.username.replace(/[^a-z0-9]/gi, '').toLowerCase() + Math.floor(Math.random()*1000);
            await sock.sendMessage(from, { text: `${E.rocket} Creating your ${plan} panel...` }, { quoted: msg });
            
            const res = await createPanel(pName, plan);
            if (res.ok) {
                user.coins -= price;
                user.panelsBought++;
                saveBotData();
                
                const panels = getPanels();
                if (!panels[sender]) panels[sender] = [];
                panels[sender].push({ plan, ...res.server, password: res.password, email: res.email });
                savePanels(panels);

                const domain = process.env.PTERO_DOMAIN;
                const details = `${E.trophy} *PANEL PURCHASE SUCCESS* \n\n` +
                    `${E.key} URL: ${domain}\n` +
                    `${E.user} User: ${res.user.username}\n` +
                    `${E.lock} Pass: ${res.password}\n` +
                    `${E.info} Email: ${res.email}\n` +
                    `${E.rocket} Plan: ${plan.toUpperCase()}`;
                
                await sock.sendMessage(sender, { text: details });
                await sock.sendMessage(from, { text: `${E.win} Panel created! Details sent to your DM.` }, { quoted: msg });
            } else {
                await sock.sendMessage(from, { text: `${E.lose} Failed: ${res.msg}` }, { quoted: msg });
            }
            break;

        case 'gamemenu':
            const menu = `*${E.dice} MYSTIC CASINO MENU* \n\n` +
                `.bal - Check coins\n` +
                `.dice [1-6] [bet] - Play Dice\n` +
                `.slots [bet] - Play Slots\n` +
                `.buypanel [plan] - Buy Panel\n` +
                `.leaderboard - Top Players\n\n` +
                `*PANEL PRICES:*\n` +
                `1GB: 1000 | 2GB: 1500 | 3GB: 2300\n` +
                `4GB: 4700 | 5GB: 6100 | 6GB: 7500\n` +
                `7GB: 8900 | 8GB: 9300 | 9GB: 10700\n` +
                `10GB: 12100 | UNLI: 15000`;
            await sock.sendMessage(from, { text: menu }, { quoted: msg });
            break;

        case 'leaderboard':
            const users = Object.values(botData.users || {})
                .sort((a, b) => b.coins - a.coins)
                .slice(0, 10);
            let lb = `*${E.trophy} TOP 10 PLAYERS* \n\n`;
            users.forEach((u, i) => {
                lb += `${i+1}. ${u.username} - ${u.coins.toLocaleString()} coins\n`;
            });
            await sock.sendMessage(from, { text: lb }, { quoted: msg });
            break;
    }
}

module.exports = casinoCommand;
