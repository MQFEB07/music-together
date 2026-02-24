import { events, state } from '../utils/state'

export default defineEventHandler((event) => {
  setHeader(event, 'Content-Type', 'text/event-stream')
  setHeader(event, 'Cache-Control', 'no-cache')
  setHeader(event, 'Connection', 'keep-alive')

  const sendState = () => {
    event.node.res.write(`data: ${JSON.stringify(state)}\n\n`)
  }

  // Send initial state
  sendState()

  // Listen for updates
  events.on('update', sendState)

  // Clean up on disconnect
  event.node.req.on('close', () => {
    events.off('update', sendState)
  })

  // Keep connection alive
  const interval = setInterval(() => {
    event.node.res.write(': keep-alive\n\n')
  }, 15000)

  event.node.req.on('close', () => {
    clearInterval(interval)
  })

  // Return a promise that never resolves to keep the connection open
  return new Promise(() => {})
})
