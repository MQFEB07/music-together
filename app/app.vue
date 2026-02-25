<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import YouTubePlayer from '~/components/YouTubePlayer.vue'
import { usePlayerState } from '~/composables/usePlayerState'
import { appName } from '~/constants'

useHead({
  title: appName,
})

const { currentVideoId, playerRect, isPlayerVisible, isTransitioning, isInitialLoad, miniPlayerPosition, triggerVideoEnded } = usePlayerState()

const isDragging = ref(false)
const dragOffset = ref({ x: 0, y: 0 })
const playerRef = ref<HTMLElement | null>(null)

function startDrag(e: MouseEvent | TouchEvent) {
  if (isPlayerVisible.value)
    return // Only drag when mini player

  isDragging.value = true

  const clientX = 'touches' in e ? e.touches[0]!.clientX : e.clientX
  const clientY = 'touches' in e ? e.touches[0]!.clientY : e.clientY

  if (playerRef.value) {
    const rect = playerRef.value.getBoundingClientRect()
    dragOffset.value = {
      x: clientX - rect.left,
      y: clientY - rect.top,
    }
  }

  // Prevent text selection while dragging
  document.body.style.userSelect = 'none'
}

function onDrag(e: MouseEvent | TouchEvent) {
  if (!isDragging.value)
    return

  // Prevent default to stop scrolling while dragging on touch devices
  if (e.type === 'touchmove') {
    e.preventDefault()
  }

  const clientX = 'touches' in e ? e.touches[0]!.clientX : e.clientX
  const clientY = 'touches' in e ? e.touches[0]!.clientY : e.clientY

  // Calculate new position
  let newX = clientX - dragOffset.value.x
  let newY = clientY - dragOffset.value.y

  // Constrain to window bounds
  // Use responsive dimensions for mini player
  const isMobile = window.innerWidth < 768
  const playerWidth = isMobile ? 240 : 320
  const playerHeight = isMobile ? 135 : 180

  newX = Math.max(0, Math.min(newX, window.innerWidth - playerWidth))
  newY = Math.max(0, Math.min(newY, window.innerHeight - playerHeight))

  miniPlayerPosition.value = { x: newX, y: newY }
}

function stopDrag() {
  if (!isDragging.value)
    return
  isDragging.value = false
  document.body.style.userSelect = ''
}

onMounted(() => {
  window.addEventListener('mousemove', onDrag)
  window.addEventListener('mouseup', stopDrag)
  window.addEventListener('touchmove', onDrag, { passive: false })
  window.addEventListener('touchend', stopDrag)
})

onUnmounted(() => {
  window.removeEventListener('mousemove', onDrag)
  window.removeEventListener('mouseup', stopDrag)
  window.removeEventListener('touchmove', onDrag)
  window.removeEventListener('touchend', stopDrag)
})
</script>

<template>
  <VitePwaManifest />
  <NuxtLayout>
    <NuxtPage :keepalive="{ max: 10 }" />
  </NuxtLayout>

  <!-- Global Player -->
  <div
    ref="playerRef"
    class="rounded-lg shadow-xl fixed z-50 overflow-hidden"
    :class="{
      'transition-all duration-300': isTransitioning && !isInitialLoad && !isDragging,
      'cursor-grab active:cursor-grabbing': !isPlayerVisible,
      'ring-2 ring-primary-500': isDragging,
    }"
    :style="{
      top: isPlayerVisible && playerRect ? `${playerRect.top}px` : (isPlayerVisible ? '0px' : (miniPlayerPosition ? `${miniPlayerPosition.y}px` : 'calc(100vh - var(--mini-player-height) - 20px)')),
      left: isPlayerVisible && playerRect ? `${playerRect.left}px` : (isPlayerVisible ? '0px' : (miniPlayerPosition ? `${miniPlayerPosition.x}px` : 'calc(100vw - var(--mini-player-width) - 20px)')),
      width: isPlayerVisible && playerRect ? `${playerRect.width}px` : 'var(--mini-player-width)',
      height: isPlayerVisible && playerRect ? `${playerRect.height}px` : 'var(--mini-player-height)',
      opacity: (isPlayerVisible && !playerRect) ? 0 : (isPlayerVisible || currentVideoId ? 1 : 0),
      pointerEvents: (isPlayerVisible && !playerRect) ? 'none' : (isPlayerVisible || currentVideoId ? 'auto' : 'none'),
      transform: !isPlayerVisible && !currentVideoId ? 'translateY(100%)' : 'translateY(0)',
      touchAction: !isPlayerVisible ? 'none' : 'auto',
    }"
  >
    <!-- Drag Handle Overlay (only active when mini player) -->
    <div
      v-if="!isPlayerVisible"
      class="group inset-0 absolute z-10"
      @mousedown="startDrag"
      @touchstart="startDrag"
    >
      <!-- Close/Expand buttons could go here -->
      <div class="p-1 rounded-lg bg-black/50 opacity-100 flex gap-2 transition-opacity right-2 top-2 absolute md:opacity-0 md:group-hover:opacity-100">
        <NuxtLink to="/" class="text-white p-1 flex items-center justify-center hover:text-primary-400" title="Back to Player" @mousedown.stop @touchstart.stop>
          <div class="i-carbon-maximize text-xl" />
        </NuxtLink>
      </div>
    </div>

    <YouTubePlayer
      :video-id="currentVideoId"
      @ended="triggerVideoEnded"
    />
  </div>
</template>

<style>
:root {
  --mini-player-width: 240px;
  --mini-player-height: 135px;
}

@media (min-width: 768px) {
  :root {
    --mini-player-width: 320px;
    --mini-player-height: 180px;
  }
}

html,
body,
#__nuxt {
  height: 100vh;
  margin: 0;
  padding: 0;
}

html.dark {
  color-scheme: dark;
}
</style>
