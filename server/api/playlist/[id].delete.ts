import { State } from '../../models'
import { connectDB } from '../../utils/db'
import { broadcastState } from '../../utils/state'

export default defineEventHandler(async (event) => {
  await connectDB()
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid ID' })
  }

  let state = await State.findOne({ roomId: 'default' } as any)
  if (!state) {
    state = await State.create({ roomId: 'default' })
  }

  const index = state.playlist.findIndex((v: any) => v.id === id)
  if (index !== -1) {
    state.playlist.splice(index, 1)
    await state.save()
    broadcastState()
  }

  return { success: true }
})
