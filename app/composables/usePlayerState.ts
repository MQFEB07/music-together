import { ref } from 'vue'
import { useCookie } from '#app'

export const playerRect = ref<{
  top: number
  left: number
  width: number
  height: number
} | null>(null)
export const isPlayerVisible = ref(true)
export const isTransitioning = ref(false)
export const isInitialLoad = ref(true)
export const globalVideoEnded = ref(0) // trigger to notify index.vue

export const miniPlayerPosition = ref<{ x: number, y: number } | null>(null)

export function usePlayerState() {
  const currentVideoId = useCookie<string | null>('music-together-current-video', { default: () => null })
  
  function triggerVideoEnded() {
    globalVideoEnded.value++
  }

  return {
    currentVideoId,
    playerRect,
    isPlayerVisible,
    isTransitioning,
    isInitialLoad,
    miniPlayerPosition,
    globalVideoEnded,
    triggerVideoEnded
  }
}
