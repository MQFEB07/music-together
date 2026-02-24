import { Video } from '../models'
import { connectDB } from '../utils/db'

export default defineEventHandler(async (event) => {
  await connectDB()
  const body = await readBody(event)
  const { videoId } = body

  // If video changed, update stats
  if (videoId) {
    await Video.findOneAndUpdate(
      { id: videoId } as any,
      { $inc: { playCount: 1 }, $set: { lastPlayedAt: new Date() } },
      { returnDocument: 'after', upsert: true },
    )
  }

  return { success: true }
})
