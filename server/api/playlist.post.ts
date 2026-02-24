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

  // Check if video already exists in playlist
  const isDuplicate = state.playlist.some((v: any) => v.id === video.id)
  if (isDuplicate) {
    return { success: false, message: 'Video already in playlist' }
  }

  state.playlist.push(video)

  await state.save()
  broadcastState()

  return { success: true }
})
