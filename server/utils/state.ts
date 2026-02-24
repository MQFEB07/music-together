import { EventEmitter } from 'node:events'

export interface Video {
  id: string
  title: string
  thumbnail: string
  duration: number
}

export interface PlaybackState {
  videoId: string | null
  isPlaying: boolean
  currentTime: number
  updatedAt: number
}

export interface AppState {
  playlist: Video[]
  playback: PlaybackState
}

export const state: AppState = {
  playlist: [],
  playback: {
    videoId: null,
    isPlaying: false,
    currentTime: 0,
    updatedAt: Date.now(),
  },
}

export const events = new EventEmitter()

export function broadcastState() {
  events.emit('update', state)
}
