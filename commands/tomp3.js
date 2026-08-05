const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { toAudio } = require('../lib/converter');

module.exports = async function(sock, chatId, msg) {
    try {
        const quoted = msg.message?.videoMessage ||
            msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.videoMessage;
        
        if (!quoted) return await sock.sendMessage(chatId, { text: '⚠️ Reply to a video!' }, { quoted: msg });
        
        await sock.sendMessage(chatId, { react: { text: '🎵', key: msg.key } });
        await sock.sendMessage(chatId, { text: '🎵 Converting to MP3...' }, { quoted: msg });
        
        try {
            const stream = await downloadContentFromMessage(quoted, 'video');
            let buffer = Buffer.from([]);
            
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }
            
            if (!buffer || buffer.length === 0) {
                throw new Error('Failed to download video content');
            }
            
            // Convert to MP3 using ffmpeg
            console.log(`Converting ${buffer.length} bytes to MP3...`);
            const mp3Buffer = await toAudio(buffer, 'mp4');
            
            if (!mp3Buffer || mp3Buffer.length === 0) {
                throw new Error('Conversion resulted in empty buffer');
            }
            
            await sock.sendMessage(chatId, { 
                audio: mp3Buffer,
                mimetype: 'audio/mpeg',
                fileName: 'converted.mp3',
                ptt: false
            }, { quoted: msg });
            
            await sock.sendMessage(chatId, { react: { text: '✅', key: msg.key } });
            console.log('✅ Successfully converted video to MP3');
            
        } catch (conversionError) {
            console.error('Conversion error:', conversionError.message);
            
            // Fallback: Send as document if conversion fails
            const stream = await downloadContentFromMessage(quoted, 'video');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
            
            await sock.sendMessage(chatId, { 
                document: buffer,
                mimetype: 'audio/mpeg',
                fileName: 'converted.mp3'
            }, { quoted: msg });
        }
        
    } catch (e) {
        console.error('ToMP3 Error:', e.message);
        await sock.sendMessage(chatId, { text: '❌ Error: ' + e.message }, { quoted: msg });
    }
};
