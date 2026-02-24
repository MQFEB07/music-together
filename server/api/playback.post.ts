import { connectDB } from '../utils/db'
import { State, Video } from '../models'
import { broadcastState } from '../utils/state'

export default defineEventHandler(async (event) => {
  await connectDB()
  const body = await readBody(event)
  const { videoId, isPlaying, currentTime } = body

  let state = await State.findOne({ roomId: 'default' } as any)
  if (!state) {
    state = await State.create({ roomId: 'default' })
  }

  const oldVideoId = state.playback.videoId

  if (videoId !== undefined)
    state.playback.videoId = videoId
  if (isPlaying !== undefined)
    state.playback.isPlaying = isPlaying
  if (currentTime !== undefined)
    state.playback.currentTime = currentTime

  state.playback.updatedAt = Date.now()

  await state.save()

  // If video changed, update stats
  if (videoId !== undefined && videoId !== oldVideoId) {
    await Video.findOneAndUpdate(
      { id: videoId } as any, 
      { $inc: { playCount: 1 }, $set: { lastPlayedAt: new Date() } },
      { returnDocument: 'after', upsert: true }
    )
  }

  broadcastState()

  return { success: true }
})
