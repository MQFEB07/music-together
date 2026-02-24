import { YouTube } from 'youtube-sr'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const q = query.q as string

  if (!q) {
    return []
  }

  try {
    const videos = await YouTube.search(q, { limit: 10, type: 'video' })
    return videos.map(v => ({
      id: v.id,
      title: v.title,
      thumbnail: v.thumbnail?.url || '',
      duration: v.duration,
    }))
  } catch (error) {
    console.error('Search error:', error)
    return []
  }
})
