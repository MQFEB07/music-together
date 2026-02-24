# 🎵 Music Together

Music Together is a real-time web application that allows you and your friends to build a shared playlist and see what everyone is currently watching.

## ✨ Features

- **Direct YouTube Search**: Search for YouTube videos directly within the app without needing an API Key (powered by `youtube-sr`).
- **Shared Playlist**: Anyone can search and add songs to a collaborative, shared playlist. The playlist is synchronized in real-time across all connected devices.
- **Local Playback**: Each user controls their own playback experience. You can watch videos at your own pace, loop the playlist, or skip ahead.
- **Live Presence Tracking**: See exactly who is watching which video in real-time. Active viewers are displayed directly on the playlist items.
- **Modern UI**: Responsive design with built-in Light and Dark mode support.

## 🚀 Tech Stack

- **Framework**: [Nuxt 4](https://nuxt.com/) (Vue 3)
- **Styling**: [UnoCSS](https://unocss.dev/)
- **Real-time**: [Supabase Realtime](https://supabase.com/docs/guides/realtime) (Channels & Presence)
- **Database**: [MongoDB](https://www.mongodb.com/) (Mongoose)
- **YouTube API**: `youtube-sr` (Scraping) & YouTube IFrame Player API

## 🛠️ Local Setup & Installation

1. Clone this repository to your local machine.
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Set up your environment variables. Create a `.env` file in the root directory and add your MongoDB and Supabase credentials:
   ```env
   MONGODB_URI=your_mongodb_connection_string
   NUXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NUXT_PUBLIC_SUPABASE_KEY=your_supabase_anon_key
   ```
4. Start the development server:
   ```bash
   pnpm dev
   ```
5. Open your browser and navigate to `http://localhost:3000`. Open it in multiple tabs or devices to test the real-time playlist and presence tracking!
