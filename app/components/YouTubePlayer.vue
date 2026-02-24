<script setup lang="ts">
import { useScriptTag } from '@vueuse/core'
import { onMounted, onUnmounted, ref, watch } from 'vue'

const props = defineProps<{
  videoId: string | null
  isPlaying: boolean
  currentTime: number
  updatedAt: number
}>()

const emit = defineEmits<{
  (e: 'update:playback', state: { isPlaying: boolean, currentTime: number }): void
  (e: 'ended'): void
}>()

const playerContainer = ref<HTMLElement | null>(null)
let player: any = null
let isReady = false
let ignoreNextStateChange = false

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
      autoplay: props.isPlaying ? 1 : 0,
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
    if (props.isPlaying) {
      player.playVideo()
    }
    const timeDiff = (Date.now() - props.updatedAt) / 1000
    const targetTime = props.currentTime + (props.isPlaying ? timeDiff : 0)
    player.seekTo(targetTime, true)
  }
}

function onPlayerStateChange(event: any) {
  if (ignoreNextStateChange) {
    ignoreNextStateChange = false
    return
  }

  const state = event.data
  const YT = window.YT

  if (state === YT.PlayerState.PLAYING) {
    emit('update:playback', { isPlaying: true, currentTime: player.getCurrentTime() })
  }
  else if (state === YT.PlayerState.PAUSED) {
    emit('update:playback', { isPlaying: false, currentTime: player.getCurrentTime() })
  }
  else if (state === YT.PlayerState.ENDED) {
    emit('ended')
  }
}

watch(() => props.videoId, (newId) => {
  if (isReady && player && newId) {
    ignoreNextStateChange = true
    player.loadVideoById(newId)
    if (!props.isPlaying) {
      player.pauseVideo()
    }
  }
})

watch(() => props.isPlaying, (playing) => {
  if (isReady && player) {
    ignoreNextStateChange = true
    if (playing) {
      player.playVideo()
    }
    else {
      player.pauseVideo()
    }
  }
})

watch(() => props.currentTime, (time) => {
  if (isReady && player) {
    const current = player.getCurrentTime()
    if (Math.abs(current - time) > 2) {
      ignoreNextStateChange = true
      player.seekTo(time, true)
    }
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
