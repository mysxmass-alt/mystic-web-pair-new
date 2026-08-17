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
| TELEGRAM_FORCE_JOIN_ENABLED | Set `true` to require Telegram membership before pairing or commands |
| TELEGRAM_FORCE_JOIN_TARGETS | Comma-separated Telegram channel/group IDs; the bot must be an administrator in each target |
| TELEGRAM_FORCE_JOIN_CHANNEL_URL | Channel link shown to users who have not joined |
| TELEGRAM_FORCE_JOIN_GROUP_URL | Group link shown to users who have not joined |
| WHATSAPP_FORCE_JOIN_ENABLED | Set `true` to require membership in configured WhatsApp groups |
| WHATSAPP_FORCE_JOIN_GROUP_IDS | Comma-separated WhatsApp group JIDs used for membership verification |
| WHATSAPP_FORCE_JOIN_GROUP_LINK | Group invite link shown to users who have not joined |
| WHATSAPP_FORCE_JOIN_CHANNEL_LINK | WhatsApp channel link shown during onboarding; channel membership cannot be verified by the current API |
| OPENAI_API_KEY | OpenAI API key (optional) |
| ADMIN_PASSWORD | Strong server-side password for `/admin` (never commit the real value) |
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

### Force-join gates

Force-join is disabled by default. When enabled, Telegram users are checked with `getChatMember` before `/start`, pairing, and commands are processed. The Telegram bot must be an administrator in every configured target chat. WhatsApp users can be verified against configured WhatsApp group JIDs, with invite links shown when they are not members. WhatsApp bots cannot silently join groups or channels; an administrator must add the bot or the user must use the supplied invite flow. WhatsApp channel membership is link-only because the current WhatsApp connection does not expose a reliable membership-check API. Owners can obtain a channel’s internal ID by replying `.channelid` to a forwarded channel post; the bot returns the `@newsletter` JID used for configuration and logs no channel content.

### Protected admin console

Open `/admin` to access the protected administration surface. It provides an overview of tracked users, banned users, active sessions, Telegram readiness, and Pterodactyl readiness. The **Users & credits** tab supports ban/unban and credit adjustments for users already present in the bot data store. The **Pterodactyl** tab stores only safe panel metadata; API keys remain environment-only. The **Runtime** tab exposes protected admin events and active bot sessions.

The admin console uses an HTTP-only server-side session cookie and is disabled until `ADMIN_PASSWORD` is configured. Use a long, unique password in Railway or the deployment environment; do not use a password that has been pasted into chat or committed to Git.

## License

MIT

<!-- Verified Manus AI connection at 2026-08-01 -->
