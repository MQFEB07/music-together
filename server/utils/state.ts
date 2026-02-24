import { EventEmitter } from 'node:events'
import { State } from '../models'
import { connectDB } from './db'

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

export const events = new EventEmitter()

export async function broadcastState() {
  await connectDB()
  const state = await State.findOne({ roomId: 'default' } as any)
  if (state) {
    events.emit('update', {
      playlist: state.playlist,
      playback: state.playback,
    })
  }
}
