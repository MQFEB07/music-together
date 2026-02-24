import { broadcastState, state } from '../utils/state'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { video } = body

  if (!video || !video.id) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid video' })
  }

  state.playlist.push(video)

  // If nothing is playing, start playing the new video
  if (!state.playback.videoId) {
    state.playback.videoId = video.id
    state.playback.isPlaying = true
    state.playback.currentTime = 0
    state.playback.updatedAt = Date.now()
  }

  broadcastState()

  return { success: true }
})
