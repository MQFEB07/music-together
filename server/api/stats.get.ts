import { Video } from '../models'
import { connectDB } from '../utils/db'

export default defineEventHandler(async () => {
  await connectDB()

  const topVideos = await Video.find()
    .sort({ playCount: -1 })
    .limit(10)

  const recentVideos = await Video.find()
    .sort({ lastPlayedAt: -1 })
    .limit(10)

  return {
    topVideos,
    recentVideos,
  }
})
