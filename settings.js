require('dotenv').config();

module.exports = {
    startimage: process.env.START_IMAGE_URL || 'https://files.catbox.moe/qtj502.png',
    ownerNumber: process.env.OWNER_NUMBER || '',
    botName: process.env.BOT_NAME || 'MYSTIC XMD',
    ownerName: process.env.OWNER_NAME || 'MYSTIC',
    whatsappChannel: process.env.WHATSAPP_CHANNEL || 'https://whatsapp.com/channel/0029VbCd887Bqbr3YdYfnu1v',
    tgOwnerId: process.env.OWNER_TELEGRAM_ID || '',
    tgBotToken: process.env.TELEGRAM_BOT_TOKEN || '',
    akariGroupReplies: !['false', '0', 'off', 'no'].includes(String(process.env.AKARI_GROUP_REPLIES || 'true').toLowerCase()),
    akariStickerIds: String(process.env.AKARI_TELEGRAM_STICKER_IDS || '').split(',').map(value => value.trim()).filter(Boolean),
    akariStickerCooldownMs: Math.max(15000, Number(process.env.AKARI_STICKER_COOLDOWN_MS || 45000)),
    telegramAntiLinkEnabled: !['false', '0', 'off', 'no'].includes(String(process.env.TELEGRAM_ANTILINK_ENABLED || 'true').toLowerCase()),
    telegramQuoteReplies: !['false', '0', 'off', 'no'].includes(String(process.env.TELEGRAM_QUOTE_REPLIES || 'true').toLowerCase()),
    premiumUsers: [],
    connectedBots: [],
    version: '4.0.0',
    prefix: process.env.BOT_PREFIX || '.',
    pteroEgg: process.env.PTERO_EGG || '15',
    pteroLocation: process.env.PTERO_LOCATION || '1',
    pteroDomain: process.env.PTERO_DOMAIN || '',
    pteroPlta: process.env.PTERO_PLTA || '',
    pteroPltc: process.env.PTERO_PLTC || ''
};
