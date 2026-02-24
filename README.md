# 🎵 Music Together

Music Together is a real-time web application that allows you and your friends to listen to music and watch YouTube videos synchronously.

## ✨ Features

- **Direct YouTube Search**: Search for YouTube videos directly within the app without needing an API Key (powered by `youtube-sr`).
- **Shared Playlist**: Anyone can search and add songs to a collaborative, shared playlist.
- **Real-time Synchronization**:
  - When someone adds a video, it instantly appears on everyone's screen.
  - Playback state (Play/Pause) and video time are synchronized across all connected devices using Server-Sent Events (SSE).
- **Modern UI**: Responsive design with built-in Light and Dark mode support.

## 🚀 Tech Stack

- **Framework**: [Nuxt 4](https://nuxt.com/) (Vue 3)
- **Styling**: [UnoCSS](https://unocss.dev/)
- **Real-time**: Server-Sent Events (SSE)
- **YouTube API**: `youtube-sr` (Scraping) & YouTube IFrame Player API

## 🛠️ Local Setup & Installation

1. Clone this repository to your local machine.
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Start the development server:
   ```bash
   pnpm dev
   ```
4. Open your browser and navigate to `http://localhost:3000`. Open it in multiple tabs or devices to test the real-time synchronization!
