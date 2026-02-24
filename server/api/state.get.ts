import { State } from '../models'
import { connectDB } from '../utils/db'

export default defineEventHandler(async () => {
  await connectDB()

  let state = await State.findOne({ roomId: 'default' } as any)

  if (!state) {
    state = await State.create({
      roomId: 'default',
      playlist: [],
    })
  }

  return {
    playlist: state.playlist,
  }
})
