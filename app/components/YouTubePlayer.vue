<script setup lang="ts">
import { useScriptTag } from '@vueuse/core'
import { onMounted, onUnmounted, ref, watch } from 'vue'

const props = defineProps<{
  videoId: string | null
}>()

const emit = defineEmits<{
  (e: 'ended'): void
}>()

const playerContainer = ref<HTMLElement | null>(null)
let player: any = null
let isReady = false

const { load } = useScriptTag('https://www.youtube.com/iframe_api', () => {
  // The API is loaded, but we need to wait for YT.Player to be available
  if (window.YT && window.YT.Player) {
    initPlayer()
  }
  else {
    window.onYouTubeIframeAPIReady = initPlayer
  }
})

function initPlayer() {
  if (!playerContainer.value)
    return

  player = new window.YT.Player(playerContainer.value, {
    height: '100%',
    width: '100%',
    videoId: props.videoId || '',
    playerVars: {
      autoplay: 1,
      controls: 1,
      disablekb: 1,
      rel: 0,
    },
    events: {
      onReady: onPlayerReady,
      onStateChange: onPlayerStateChange,
    },
  })
}

function onPlayerReady(_event: any) {
  isReady = true
  if (props.videoId) {
    player.playVideo()
  }
}

function onPlayerStateChange(event: any) {
  const state = event.data
  const YT = window.YT

  if (state === YT.PlayerState.ENDED) {
    emit('ended')
  }
}

watch(() => props.videoId, (newId) => {
  if (isReady && player && newId) {
    player.loadVideoById(newId)
  }
})

onMounted(() => {
  load()
})

onUnmounted(() => {
  if (player) {
    player.destroy()
  }
})
</script>

<template>
  <div class="rounded-lg bg-black w-full aspect-video shadow-lg overflow-hidden">
    <div ref="playerContainer" />
    <div v-if="!videoId" class="text-gray-500 flex h-full w-full items-center justify-center">
      No video selected
    </div>
  </div>
</template>
