<script setup lang="ts">
import { useFetch } from '#app'

interface VideoStat {
  id: string
  title: string
  thumbnail: string
  duration: number
  playCount: number
  lastPlayedAt: string
}

interface StatsResponse {
  topVideos: VideoStat[]
  recentVideos: VideoStat[]
}

const { data: stats, pending } = await useFetch<StatsResponse>('/api/stats')

function formatDuration(ms: number) {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString()
}
</script>

<template>
  <div class="p-4 md:p-8">
    <div class="mx-auto max-w-6xl space-y-8">
      <div class="flex items-center justify-between">
        <h1 class="text-3xl font-bold flex gap-2 items-center">
          <div class="i-carbon-chart-bar text-primary-500" />
          Statistics
        </h1>
        <NuxtLink to="/" class="px-4 py-2 rounded-lg bg-gray-200 flex gap-2 transition-colors items-center dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700">
          <div class="i-carbon-home" />
          Back to Player
        </NuxtLink>
      </div>

      <div v-if="pending" class="py-12 flex justify-center">
        <div class="i-carbon-circle-dash text-4xl text-primary-500 animate-spin" />
      </div>

      <div v-else-if="stats" class="gap-8 grid grid-cols-1 md:grid-cols-2">
        <!-- Top Played Videos -->
        <div class="p-6 border border-gray-200 rounded-xl bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 class="text-xl font-semibold mb-4 flex gap-2 items-center">
            <div class="i-carbon-trophy text-yellow-500" />
            Top Played Videos
          </h2>
          <div class="space-y-4">
            <div v-if="stats.topVideos.length === 0" class="text-gray-500 py-4 text-center">
              No data available yet
            </div>
            <div v-for="(video, index) in stats.topVideos" :key="video.id" class="p-3 rounded-lg flex gap-4 transition-colors items-center hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <div class="text-2xl text-gray-300 font-bold text-center w-8 dark:text-gray-600">
                {{ index + 1 }}
              </div>
              <img :src="video.thumbnail" :alt="video.title" class="rounded h-16 w-24 object-cover">
              <div class="flex-1 min-w-0">
                <h3 class="font-medium truncate" :title="video.title">
                  {{ video.title }}
                </h3>
                <div class="text-sm text-gray-500 mt-1 flex gap-4 items-center dark:text-gray-400">
                  <span class="flex gap-1 items-center">
                    <div class="i-carbon-play-filled" />
                    {{ video.playCount }} plays
                  </span>
                  <span>{{ formatDuration(video.duration) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Recently Played -->
        <div class="p-6 border border-gray-200 rounded-xl bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 class="text-xl font-semibold mb-4 flex gap-2 items-center">
            <div class="i-carbon-time text-blue-500" />
            Recently Played
          </h2>
          <div class="space-y-4">
            <div v-if="stats.recentVideos.length === 0" class="text-gray-500 py-4 text-center">
              No data available yet
            </div>
            <div v-for="video in stats.recentVideos" :key="video.id" class="p-3 rounded-lg flex gap-4 transition-colors items-center hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <img :src="video.thumbnail" :alt="video.title" class="rounded h-16 w-24 object-cover">
              <div class="flex-1 min-w-0">
                <h3 class="font-medium truncate" :title="video.title">
                  {{ video.title }}
                </h3>
                <div class="text-sm text-gray-500 mt-1 flex gap-2 items-center dark:text-gray-400">
                  <div class="i-carbon-calendar" />
                  {{ formatDate(video.lastPlayedAt) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
