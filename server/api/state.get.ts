import { State } from '../models'
import { connectDB } from '../utils/db'

export default defineEventHandler(async () => {
  await connectDB()

  let state = await State.findOne({ roomId: 'default' } as any)

  if (!state) {
    state = await State.create({
      roomId: 'default',
      playlist: [],
      playback: {
        videoId: null,
        isPlaying: false,
        currentTime: 0,
        updatedAt: Date.now(),
      },
    })
  }

  return {
    playlist: state.playlist,
    playback: state.playback,
  }
})
