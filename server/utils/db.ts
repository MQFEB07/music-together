import process from 'node:process'
import mongoose from 'mongoose'

let isConnected = false

export async function connectDB() {
  if (isConnected && mongoose.connection.readyState === 1) {
    return
  }

  // Use environment variable or fallback to local MongoDB for development
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/music-together'

  try {
    // In serverless environments, we need to handle connection pooling carefully
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    })
    isConnected = true
    console.warn('MongoDB connected successfully')
  }
  catch (error) {
    console.error('MongoDB connection error:', error)
    isConnected = false
    throw error
  }
}

export async function disconnectDB() {
  if (isConnected) {
    await mongoose.disconnect()
    isConnected = false
    console.warn('MongoDB disconnected successfully')
  }
}
