const axios = require('axios');

module.exports = async function(sock, chatId, msg, q) {
    if (!q) return await sock.sendMessage(chatId, { text: '⚠️ .tts <text>' }, { quoted: msg });
    
    try {
        await sock.sendMessage(chatId, { react: { text: '🗣️', key: msg.key } });
        await sock.sendMessage(chatId, { text: '👂 Generating TTS...' }, { quoted: msg });
        
        // Try multiple TTS voices with fallback
        const ttsVoices = [
            { name: 'Female Voice', url: 'https://prexzyapis.com/tts/tts-adult-female--1-american-english-truvoice' },
            { name: 'Male Voice', url: 'https://prexzyapis.com/tts/tts-adult-male--1-american-english-truvoice' },
            { name: 'Olivia', url: 'https://prexzyapis.com/tts/olivia' },
            { name: 'James', url: 'https://prexzyapis.com/tts/james' }
        ];
        
        let audioUrl = null;
        let selectedVoice = null;
        
        for (const voice of ttsVoices) {
            try {
                const apiUrl = `${voice.url}?text=${encodeURIComponent(q)}`;
                const response = await axios.get(apiUrl, { timeout: 15000 });
                
                if (response.data && response.data.status) {
                    // Handle different response formats
                    if (response.data.audio_url) {
                        audioUrl = response.data.audio_url.result || response.data.audio_url;
                    } else if (response.data.result) {
                        audioUrl = response.data.result;
                    }
                    
                    if (audioUrl) {
                        selectedVoice = voice.name;
                        console.log(`✅ Using ${voice.name} for TTS`);
                        break;
                    }
                }
            } catch (err) {
                console.log(`❌ ${voice.name} failed: ${err.message}`);
                continue;
            }
        }
        
        if (audioUrl) {
            // Verify the audio URL is accessible
            try {
                const headResponse = await axios.head(audioUrl, { timeout: 5000 });
                if (headResponse.status === 200) {
                    await sock.sendMessage(chatId, { 
                        audio: { url: audioUrl },
                        mimetype: 'audio/mp4',
                        ptt: true
                    }, { quoted: msg });
                    
                    await sock.sendMessage(chatId, { react: { text: '✅', key: msg.key } });
                    return;
                }
            } catch (err) {
                console.log(`Audio URL verification failed: ${err.message}`);
            }
        }
        
        // Fallback to Google TTS if Prexzy fails
        console.log('Falling back to Google TTS...');
        const googleTtsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(q)}&tl=en&client=tw-ob`;
        
        try {
            await sock.sendMessage(chatId, { 
                audio: { url: googleTtsUrl },
                mimetype: 'audio/mp4',
                ptt: true
            }, { quoted: msg });
            
            await sock.sendMessage(chatId, { react: { text: '✅', key: msg.key } });
        } catch (err) {
            console.error('Google TTS also failed:', err.message);
            await sock.sendMessage(chatId, { text: `👂 TTS: "${q}"` }, { quoted: msg });
        }
        
    } catch (e) {
        console.error('TTS Error:', e.message);
        await sock.sendMessage(chatId, { text: `❌ TTS Error: ${e.message}` }, { quoted: msg });
    }
};
