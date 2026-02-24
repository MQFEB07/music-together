import { useSupabase } from '~/utils/supabase'
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

// Initialize Supabase client for server-side broadcasting
const supabase = useSupabase()
export async function broadcastState() {
  await connectDB()
  const state = await State.findOne({ roomId: 'default' } as any)
  if (state && supabase) {
    // Broadcast the state using Supabase Realtime
    await supabase.channel('room:default').send({
      type: 'broadcast',
      event: 'state-update',
      payload: {
        playlist: state.playlist,
        playback: state.playback,
      },
    })
  }
}
