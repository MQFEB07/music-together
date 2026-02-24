import mongoose from 'mongoose'

const videoSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: String,
  thumbnail: String,
  duration: Number,
  playCount: { type: Number, default: 0 },
  lastPlayedAt: { type: Date, default: Date.now },
})

const stateSchema = new mongoose.Schema({
  roomId: { type: String, default: 'default', unique: true },
  playlist: [{
    id: String,
    title: String,
    thumbnail: String,
    duration: Number,
  }],
})

export const Video = mongoose.models.Video || mongoose.model('Video', videoSchema)
export const State = mongoose.models.State || mongoose.model('State', stateSchema)
