import { broadcastState, state } from '../utils/state'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { videoId, isPlaying, currentTime } = body

  if (videoId !== undefined)
    state.playback.videoId = videoId
  if (isPlaying !== undefined)
    state.playback.isPlaying = isPlaying
  if (currentTime !== undefined)
    state.playback.currentTime = currentTime

  state.playback.updatedAt = Date.now()

  broadcastState()

  return { success: true }
})
