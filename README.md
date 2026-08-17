# MYSTIC XMD V4 BETA

Ultimate WhatsApp Automation Tool with 120+ Commands

## Features

- 120+ WhatsApp Commands
- Hacking & Dangerous Tools
- Group Management
- Media Download (YouTube, TikTok, Instagram, etc.)
- Image Editing Tools
- Islamic Commands
- Fun & Games
- AI Chatbot
- Anti-Delete, Anti-Link, Anti-Call
- Auto-Status Viewer
- Web Dashboard with Broadcast & Admin Panel
- Casino & Credit System
- Pterodactyl Panel Integration
- Telegram Pairing System
- Premium User System

## Installation

```bash
npm install
npm start
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| TELEGRAM_BOT_TOKEN | Bot token from @BotFather |
| OWNER_NUMBER | Your WhatsApp number |
| OWNER_TELEGRAM_ID | Your Telegram ID |
| OPENAI_API_KEY | OpenAI API key (optional) |
| ADMIN_PASSWORD | Dashboard password |
| PORT | Web dashboard port |
| PTERO_DOMAIN | Pterodactyl Panel URL (e.g., https://slayers.kevinhosts.qzz.io) |
| PTERO_PLTA | Pterodactyl Application API Key |

## Command Categories

- **Media Download**: song, video, youtube, instagram, tiktok, facebook, etc.
- **Group Management**: kick, add, promote, demote, mute, revoke, etc.
- **Dangerous**: hack, crash, freeze, lag, bug, spam, report, etc.
- **Tools**: weather, github, ipinfo, whois, portscan, etc.
- **Fun**: joke, meme, dare, truth, ship, trivia, etc.
- **Islamic**: quran, hadith, prayer, qibla, asmaulhusna
- **System**: uptime, serverinfo, speedtest, device

## Web Dashboard

Access at `http://localhost:3000`. The control center is organized into four live tabs: **Pulse**, **Pairing lab**, **Bot fleet**, and **Live signals**. Pairing uses the Socket.IO backend, while the fleet and diagnostics tabs reflect live server state.

Telegram is optional and is disabled safely when `TELEGRAM_BOT_TOKEN` is empty. Copy `.env.example` to `.env` and provide secrets only through the deployment environment; never commit tokens to the repository.

## License

MIT

<!-- Verified Manus AI connection at 2026-08-01 -->
