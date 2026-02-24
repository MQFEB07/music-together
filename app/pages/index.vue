<script setup lang="ts">
import { useFetch, useRuntimeConfig } from '#app'
import { onMounted, onUnmounted, ref } from 'vue'
import YouTubePlayer from '~/components/YouTubePlayer.vue'
import { useSupabase } from '~/utils/supabase'

interface Video {
  id: string
  title: string
  thumbnail: string
  duration: number
}

interface PlaybackState {
  videoId: string | null
  isPlaying: boolean
  currentTime: number
  updatedAt: number
}

interface AppState {
  playlist: Video[]
  playback: PlaybackState
}

const searchQuery = ref('')
const searchResults = ref<Video[]>([])
const isSearching = ref(false)

const state = ref<AppState>({
  playlist: [],
  playback: {
    videoId: null,
    isPlaying: false,
    currentTime: 0,
    updatedAt: Date.now(),
  },
})

let channel: any = null
let supabaseClient: any = null

onMounted(async () => {
  // Fetch initial state
  const { data } = await useFetch<AppState>('/api/state')
  if (data.value) {
    state.value = data.value
  }

  // Initialize Supabase Realtime
  supabaseClient = useSupabase()
  if (supabaseClient) {
    channel = supabaseClient.channel('room:default')

    channel
      .on('broadcast', { event: 'state-update' }, (payload: any) => {
        state.value = payload.payload
      })
      .subscribe()
  }
})

onUnmounted(() => {
  if (channel && supabaseClient) {
    supabaseClient.removeChannel(channel)
  }
})

async function search() {
  if (!searchQuery.value.trim())
    return
  isSearching.value = true
  try {
    const { data } = await useFetch<Video[]>('/api/search', {
      query: { q: searchQuery.value },
    })
    if (data.value) {
      searchResults.value = data.value
    }
  }
  finally {
    isSearching.value = false
  }
}

async function addToPlaylist(video: Video) {
  const response = await $fetch<{ success: boolean, message?: string }>('/api/playlist', {
    method: 'POST',
    body: { video },
  })

  if (response && !response.success && response.message) {
    alert(response.message)
  }
  else {
    searchResults.value = []
    searchQuery.value = ''
  }
}

async function removeFromPlaylist(id: string) {
  await $fetch(`/api/playlist/${id}`, {
    method: 'DELETE',
  })
}

async function playVideo(id: string) {
  await $fetch('/api/playback', {
    method: 'POST',
    body: {
      videoId: id,
      isPlaying: true,
      currentTime: 0,
    },
  })
}

async function updatePlayback(playbackState: { isPlaying: boolean, currentTime: number }) {
  await $fetch('/api/playback', {
    method: 'POST',
    body: {
      videoId: state.value.playback.videoId,
      isPlaying: playbackState.isPlaying,
      currentTime: playbackState.currentTime,
    },
  })
}

async function onVideoEnded() {
  // Play next video in playlist
  const currentIndex = state.value.playlist.findIndex(v => v.id === state.value.playback.videoId)
  if (currentIndex !== -1 && currentIndex < state.value.playlist.length - 1) {
    const nextVideo = state.value.playlist[currentIndex + 1]
    if (nextVideo) {
      await $fetch('/api/playback', {
        method: 'POST',
        body: {
          videoId: nextVideo.id,
          isPlaying: true,
          currentTime: 0,
        },
      })
    }
  }
  else {
    // Stop playback
    await $fetch('/api/playback', {
      method: 'POST',
      body: {
        isPlaying: false,
        currentTime: 0,
      },
    })
  }
}

function formatDuration(ms: number) {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}
</script>

<template>
  <div class="text-gray-900 p-4 bg-gray-50 min-h-screen dark:text-gray-100 md:p-8 dark:bg-gray-900">
    <div class="mx-auto gap-8 grid grid-cols-1 max-w-6xl lg:grid-cols-3">
      <!-- Left Column: Player & Search -->
      <div class="space-y-6 lg:col-span-2">
        <div class="flex items-center justify-between">
          <h1 class="text-3xl font-bold flex gap-2 items-center">
            <div class="i-carbon-music text-primary-500" />
            Music Together
          </h1>
          <NuxtLink to="/stats" class="px-4 py-2 rounded-lg bg-gray-200 flex gap-2 transition-colors items-center dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700">
            <div class="i-carbon-chart-bar" />
            Stats
          </NuxtLink>
        </div>

        <!-- Player -->
        <div class="space-y-2">
          <YouTubePlayer
            :video-id="state.playback.videoId"
            :is-playing="state.playback.isPlaying"
            :current-time="state.playback.currentTime"
            :updated-at="state.playback.updatedAt"
            @update:playback="updatePlayback"
            @ended="onVideoEnded"
          />
          <div v-if="state.playback.videoId" class="px-2">
            <h2 class="text-xl font-semibold">
              {{ state.playlist.find(v => v.id === state.playback.videoId)?.title || 'Playing Video' }}
            </h2>
          </div>
        </div>

        <!-- Search -->
        <div class="p-4 border border-gray-200 rounded-xl bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <form class="flex gap-2" @submit.prevent="search">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search YouTube videos..."
              class="px-4 py-2 border border-gray-300 rounded-lg bg-transparent flex-1 focus:outline-none dark:border-gray-600 focus:ring-2 focus:ring-primary-500"
            >
            <button
              type="submit"
              :disabled="isSearching"
              class="text-white font-medium px-6 py-2 rounded-lg bg-primary-600 flex gap-2 transition-colors items-center hover:bg-primary-700 disabled:opacity-50"
            >
              <div v-if="isSearching" class="i-carbon-circle-dash animate-spin" />
              <div v-else class="i-carbon-search" />
              Search
            </button>
          </form>

          <!-- Search Results -->
          <div v-if="searchResults.length > 0" class="mt-4 pr-2 max-h-96 overflow-y-auto space-y-2">
            <div
              v-for="video in searchResults"
              :key="video.id"
              class="group p-2 rounded-lg flex gap-4 transition-colors items-center hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <img :src="video.thumbnail" :alt="video.title" class="rounded h-16 w-24 object-cover">
              <div class="flex-1 min-w-0">
                <h3 class="font-medium truncate" :title="video.title">
                  {{ video.title }}
                </h3>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {{ formatDuration(video.duration) }}
                </p>
              </div>
              <button
                v-if="state.playlist.some(v => v.id === video.id)"
                class="text-red-500 p-2 rounded-full opacity-0 transition-all hover:bg-red-50 group-hover:opacity-100 dark:hover:bg-red-900/30"
                title="Remove from Playlist"
                @click="removeFromPlaylist(video.id)"
              >
                <div class="i-carbon-trash-can text-xl" />
              </button>
              <button
                v-else
                class="text-primary-600 p-2 rounded-full opacity-0 transition-all hover:bg-primary-50 group-hover:opacity-100 dark:hover:bg-primary-900/30"
                title="Add to Playlist"
                @click="addToPlaylist(video)"
              >
                <div class="i-carbon-add-alt text-xl" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column: Playlist -->
      <div class="p-4 border border-gray-200 rounded-xl bg-white flex flex-col h-[calc(100vh-4rem)] shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h2 class="text-xl font-semibold mb-4 flex gap-2 items-center">
          <div class="i-carbon-list" />
          Shared Playlist
          <span class="text-sm text-gray-500 font-normal ml-auto px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700">
            {{ state.playlist.length }} items
          </span>
        </h2>

        <div class="pr-2 flex-1 overflow-y-auto space-y-2">
          <div v-if="state.playlist.length === 0" class="text-gray-500 py-8 text-center">
            Playlist is empty. Search and add some videos!
          </div>

          <div
            v-for="(video, index) in state.playlist"
            :key="video.id + index"
            class="group p-2 rounded-lg flex gap-3 transition-colors items-center"
            :class="state.playback.videoId === video.id ? 'bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800' : 'hover:bg-gray-100 dark:hover:bg-gray-700'"
          >
            <div class="flex-shrink-0 h-14 w-20 relative">
              <img :src="video.thumbnail" :alt="video.title" class="rounded h-full w-full object-cover">
              <div v-if="state.playback.videoId === video.id" class="rounded bg-black/40 flex items-center inset-0 justify-center absolute">
                <div v-if="state.playback.isPlaying" class="i-carbon-volume-up text-xl text-white animate-pulse" />
                <div v-else class="i-carbon-pause text-xl text-white" />
              </div>
            </div>

            <div class="flex-1 min-w-0 cursor-pointer" @click="playVideo(video.id)">
              <h3 class="text-sm font-medium line-clamp-2" :class="state.playback.videoId === video.id ? 'text-primary-600 dark:text-primary-400' : ''">
                {{ video.title }}
              </h3>
            </div>

            <button
              class="text-primary-600 p-1.5 rounded-full opacity-0 transition-all hover:bg-primary-50 group-hover:opacity-100 dark:hover:bg-primary-900/30"
              title="Play Video"
              @click="playVideo(video.id)"
            >
              <div class="i-carbon-play-filled-alt" />
            </button>

            <button
              class="text-red-500 p-1.5 rounded-full opacity-0 transition-all hover:bg-red-50 group-hover:opacity-100 dark:hover:bg-red-900/30"
              title="Remove from Playlist"
              @click="removeFromPlaylist(video.id)"
            >
              <div class="i-carbon-trash-can" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
