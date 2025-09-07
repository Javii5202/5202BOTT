# WhatsApp Bot 5202

## Overview
This is a WhatsApp bot built with Node.js using the Baileys library that provides various features including music downloads, stickers, admin commands, and GPT integration.

## Project Structure
- `index.js` - Main bot entry point and message handler
- `comandos/` - Command modules directory
  - `menu.js` - Display bot menu
  - `ping.js` - Bot status check
  - `play.js` - Download MP3 music
  - `video.js` - Download MP4 videos  
  - `sticker.js` - Create stickers from images/videos
  - `gpt.js` - GPT integration via WhatsApp relay
  - `admin.js` - Admin commands (warn, unwarn, etc.)
  - `recuperar.js` - Recover view-once media
- `session/` - WhatsApp session data and authentication
- `assets/` - Menu image and other assets

## Features
- **Music & Video**: Download audio/video from YouTube (.play, .video commands)
- **Stickers**: Convert images/videos to WhatsApp stickers
- **GPT Integration**: AI responses via WhatsApp number relay
- **Admin Tools**: Warning system and group management
- **Media Recovery**: Recover view-once photos/videos

## Current State
- ✅ Bot is running and connected to WhatsApp
- ✅ All dependencies installed successfully
- ✅ Workflow configured and active
- ✅ Session data preserved from original project

## Recent Setup (September 7, 2025)
- Imported from GitHub and configured for Replit environment
- Installed Python 3.11 dependency for yt-dlp functionality
- Set up Node.js workflow for continuous bot operation
- Verified WhatsApp connection and bot functionality

## Dependencies
- @whiskeysockets/baileys - WhatsApp Web API
- axios - HTTP requests
- canvas - Image processing
- chalk - Terminal styling
- dotenv - Environment variables
- googleapis - Google APIs integration
- openai - AI integration
- qrcode-terminal - QR code display
- yt-search, ytdl-core, yt-dlp-exec - YouTube functionality

## Bot Commands
- `.menu` - Show available commands
- `.ping` - Check bot status
- `.play <song>` - Download MP3 audio
- `.video <query>` - Download MP4 video
- `.sticker` - Convert media to sticker
- `.gpt <question>` - Ask GPT via relay
- `.r` - Recover view-once media
- Admin: `.warn`, `.unwarn`, `.listadv`