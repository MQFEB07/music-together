<script setup lang="ts">
import { useCookie, useFetch } from '#app'
import { onMounted, onUnmounted, ref, watch } from 'vue'
import YouTubePlayer from '~/components/YouTubePlayer.vue'
import { useSupabase } from '~/utils/supabase'

interface Video {
  id: string
  title: string
  thumbnail: string
  duration: number
}

interface AppState {
  playlist: Video[]
}

const searchQuery = ref('')
const searchResults = ref<Video[]>([])
const isSearching = ref(false)

const userName = useCookie<string>('music-together-username', { default: () => `Guest-${Math.floor(Math.random() * 10000)}` })
const currentVideoId = useCookie<string | null>('music-together-current-video', { default: () => null })
const isLooping = ref(false)

const activeUsers = ref<{ [key: string]: { userName: string, videoId: string | null } }>({})

const state = ref<AppState>({
  playlist: [],
})

let channel: any = null
let supabaseClient: any = null
let isSubscribed = false
const clientId = Math.random().toString(36).substring(2, 15)

const { data: initialState } = await useFetch<AppState>('/api/state')
if (initialState.value) {
  state.value = initialState.value
  if (state.value && state.value.playlist && state.value.playlist.length > 0) {
    // Only set to first video if currentVideoId is null or not in playlist
    const exists = state.value.playlist.some(v => v.id === currentVideoId.value)
    if (!exists) {
      currentVideoId.value = state.value.playlist[0]!.id
    }
  }
}

watch([userName, currentVideoId], async () => {
  if (channel && isSubscribed) {
    await channel.track({ userName: userName.value, videoId: currentVideoId.value })
  }
})

onMounted(async () => {
  // Initialize Supabase Realtime
  supabaseClient = useSupabase()
  if (supabaseClient) {
    channel = supabaseClient.channel('room:default', {
      config: {
        presence: {
          key: clientId,
        },
      },
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState()
        const users: any = {}
        for (const id in newState) {
          users[id] = newState[id][0]
        }
        activeUsers.value = users
      })
      .on('broadcast', { event: 'state-update' }, (payload: any) => {
        state.value = payload.payload
      })
      .subscribe(async (status: string) => {
        if (status === 'SUBSCRIBED') {
          isSubscribed = true
          await channel.track({ userName: userName.value, videoId: currentVideoId.value })
        }
      })
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
  const isFirstVideo = state.value.playlist.length === 0

  const response = await $fetch<{ success: boolean, message?: string }>('/api/playlist', {
    method: 'POST',
    body: { video },
  })

  if (response && !response.success && response.message) {
    // alert(response.message)
  }
  else {
    searchResults.value = []
    searchQuery.value = ''

    // If it was the first video added, play it immediately
    if (isFirstVideo) {
      playVideo(video.id)
    }
  }
}

async function removeFromPlaylist(id: string) {
  await $fetch(`/api/playlist/${id}`, {
    method: 'DELETE',
  })
}

async function playVideo(id: string) {
  currentVideoId.value = id
  // Still call the API to update play count stats
  await $fetch('/api/playback', {
    method: 'POST',
    body: {
      videoId: id,
    },
  })
}

async function onVideoEnded() {
  if (!state.value || !state.value.playlist)
    return

  // Play next video in playlist
  const currentIndex = state.value.playlist.findIndex(v => v.id === currentVideoId.value)
  if (currentIndex !== -1 && currentIndex < state.value.playlist.length - 1) {
    const nextVideo = state.value.playlist[currentIndex + 1]
    if (nextVideo) {
      playVideo(nextVideo.id)
    }
  }
  else if (isLooping.value && state.value.playlist.length > 0) {
    // Loop back to the first video
    playVideo(state.value.playlist[0]!.id)
  }
  else {
    // Stop playback
    currentVideoId.value = null
  }
}

function formatDuration(ms: number) {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

function getUsersForVideo(id: string) {
  return Object.values(activeUsers.value).filter(u => u.videoId === id)
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
            <span class="text-sm text-gray-500 font-normal ml-2 px-2 py-1 rounded-full bg-gray-200 flex gap-1 items-center dark:bg-gray-800" title="Total users online">
              <div class="i-carbon-user-multiple" />
              {{ Object.keys(activeUsers).length }}
            </span>
          </h1>
          <div class="flex gap-4 items-center">
            <DarkToggle class="text-2xl text-gray-600 transition-colors dark:text-gray-300 hover:text-primary-500" />
            <NuxtLink to="/stats" class="px-4 py-2 rounded-lg bg-gray-200 flex gap-2 transition-colors items-center dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700">
              <div class="i-carbon-chart-bar" />
              Stats
            </NuxtLink>
          </div>
        </div>

        <!-- Player -->
        <div class="space-y-2">
          <YouTubePlayer
            :video-id="currentVideoId"
            @ended="onVideoEnded"
          />
          <div v-if="currentVideoId" class="px-2 flex items-center justify-between">
            <h2 class="text-xl font-semibold">
              {{ state.playlist.find(v => v.id === currentVideoId)?.title || 'Playing Video' }}
            </h2>
            <div class="flex gap-2 items-center">
              <div class="i-carbon-user text-gray-500" />
              <input
                v-model="userName"
                type="text"
                class="text-sm text-gray-600 px-1 py-0.5 border-b border-transparent bg-transparent w-32 transition-colors dark:text-gray-400 focus:outline-none focus:border-primary-500 hover:border-gray-300"
                placeholder="Your name"
              >
            </div>
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
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-xl font-semibold flex gap-2 items-center">
            <div class="i-carbon-list" />
            Shared Playlist
            <span class="text-sm text-gray-500 font-normal ml-2 px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700">
              {{ state.playlist.length }} items
            </span>
          </h2>
          <button
            class="p-2 rounded-lg transition-colors"
            :class="isLooping ? 'text-primary-600 bg-primary-50 dark:bg-primary-900/30 dark:text-primary-400' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'"
            title="Toggle Loop Playlist"
            @click="isLooping = !isLooping"
          >
            <div class="i-carbon-repeat text-xl" />
          </button>
        </div>

        <div class="pr-2 flex-1 overflow-y-auto space-y-2">
          <div v-if="state.playlist.length === 0" class="text-gray-500 py-8 text-center">
            Playlist is empty. Search and add some videos!
          </div>

          <div
            v-for="(video, index) in state.playlist"
            :key="video.id + index"
            class="group p-2 rounded-lg flex gap-3 transition-colors items-center"
            :class="currentVideoId === video.id ? 'bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800' : 'hover:bg-gray-100 dark:hover:bg-gray-700'"
          >
            <div class="flex-shrink-0 h-14 w-20 relative">
              <img :src="video.thumbnail" :alt="video.title" class="rounded h-full w-full object-cover">
              <div v-if="currentVideoId === video.id" class="rounded bg-black/40 flex items-center inset-0 justify-center absolute">
                <div class="i-carbon-volume-up text-xl text-white animate-pulse" />
              </div>
            </div>

            <div class="flex-1 min-w-0 cursor-pointer" @click="playVideo(video.id)">
              <div class="flex gap-1 items-start">
                <h3 class="text-sm font-medium line-clamp-2" :class="currentVideoId === video.id ? 'text-primary-600 dark:text-primary-400' : ''">
                  {{ video.title }}
                </h3>
                <!-- Active Users Indicator -->
                <div v-if="getUsersForVideo(video.id).length > 0" class="group/tooltip mt-0.5 flex-shrink-0 relative">
                  <span class="text-xs text-white leading-none px-0.5 py-0.5 rounded-full bg-red-500 inline-flex min-w-[16px] cursor-help items-center justify-center">
                    {{ getUsersForVideo(video.id).length > 9 ? '9+' : getUsersForVideo(video.id).length }}
                  </span>
                  <div class="text-xs text-white font-normal mt-1 p-2 text-left rounded bg-gray-800 min-w-max hidden shadow-lg right-0 top-full absolute z-10 dark:bg-gray-700 group-hover/tooltip:block">
                    <span class="text-gray-300 mb-1 pb-1 border-b border-gray-600 block">
                      Watching now:
                    </span>
                    <span v-for="user in getUsersForVideo(video.id)" :key="user.userName" class="py-0.5 flex gap-1 items-center">
                      <span class="i-carbon-user text-[10px]" />
                      {{ user.userName }}
                    </span>
                  </div>
                </div>
              </div>
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
