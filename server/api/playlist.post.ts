import { State, Video } from '../models'
import { connectDB } from '../utils/db'
import { broadcastState } from '../utils/state'

export default defineEventHandler(async (event) => {
  await connectDB()
  const body = await readBody(event)
  const { video } = body

  if (!video || !video.id) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid video' })
  }

  // Upsert video in stats
  await Video.findOneAndUpdate(
    { id: video.id } as any,
    { $set: { title: video.title, thumbnail: video.thumbnail, duration: video.duration } },
    { upsert: true, returnDocument: 'after' },
  )

  let state = await State.findOne({ roomId: 'default' } as any)
  if (!state) {
    state = await State.create({ roomId: 'default' })
  }

  state.playlist.push(video)

  // If nothing is playing, start playing the new video
  if (!state.playback.videoId) {
    state.playback.videoId = video.id
    state.playback.isPlaying = true
    state.playback.currentTime = 0
    state.playback.updatedAt = Date.now()

    // Update stats
    await Video.findOneAndUpdate(
      { id: video.id } as any,
      { $inc: { playCount: 1 }, $set: { lastPlayedAt: new Date() } },
      { returnDocument: 'after', upsert: true },
    )
  }

  await state.save()
  broadcastState()

  return { success: true }
})
