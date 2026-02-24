import { broadcastState, state } from '../../utils/state'

export default defineEventHandler((event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid ID' })
  }

  const index = state.playlist.findIndex(v => v.id === id)
  if (index !== -1) {
    state.playlist.splice(index, 1)
    broadcastState()
  }

  return { success: true }
})
