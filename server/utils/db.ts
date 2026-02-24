import process from 'node:process'
import mongoose from 'mongoose'

let isConnected = false

export async function connectDB() {
  if (isConnected)
    return

  // Use environment variable or fallback to local MongoDB for development
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/music-together'

  try {
    await mongoose.connect(uri)
    isConnected = true
    console.warn('MongoDB connected successfully')
  }
  catch (error) {
    console.error('MongoDB connection error:', error)
  }
}
