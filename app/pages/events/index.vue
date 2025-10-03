<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../../stores/auth'
import { useApi } from '../../composables/useApi'

interface EventDoc {
  id: string
  name: string
  date: string
  type: string
  location?: string
  locked?: boolean
}

const { request } = useApi()
const events = ref<EventDoc[]>([])
const error = ref<string>('')
const loading = ref<boolean>(true)
const auth = useAuthStore()

async function load() {
  try {
    const data = await request<{ docs: EventDoc[] }>(`/api/events?limit=25&sort=-date`)
    events.value = data.docs
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load events'
  } finally {
    loading.value = false
  }
}

function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString('cs-CZ', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

onMounted(load)
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-900">Events</h1>
    </div>

    <!-- Action buttons for trainers and admins -->
    <div v-if="auth.user && ['admin', 'trainer'].includes(auth.user.role)" class="flex flex-wrap gap-3">
      <UButton 
        icon="i-heroicons-plus" 
        to="/events/create"
        variant="solid"
      >
        Create Event
      </UButton>
      <UButton 
        icon="i-heroicons-users" 
        to="/players"
        variant="outline"
      >
        View Players
      </UButton>
      <UButton 
        icon="i-heroicons-user-plus" 
        to="/players/create"
        variant="ghost"
      >
        Register Player
      </UButton>
    </div>

    <div v-if="loading" class="flex justify-center py-10">
      <ULoader />
    </div>
    <UAlert v-else-if="error" color="red" variant="subtle" :title="'Error'" :description="error" />
    <div v-else>
      <UEmptyState v-if="events.length === 0" icon="i-heroicons-calendar" title="No events" description="Events will appear here once created." />
      <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <UCard 
          v-for="e in events" 
          :key="e.id" 
          :ui="{ body: { padding: 'p-4' } }"
          class="cursor-pointer hover:shadow-md transition-shadow"
          @click="navigateTo(`/events/${e.id}`)"
        >
          <template #header>
            <div class="flex items-start justify-between">
              <div>
                <p class="font-medium leading-tight">{{ e.name }}</p>
                <p class="text-xs text-gray-500">{{ formatDateTime(e.date) }}</p>
              </div>
              <UBadge v-if="e.locked" size="xs" color="gray" variant="soft">Locked</UBadge>
            </div>
          </template>
          <div class="space-y-2 text-xs">
            <div class="flex items-center gap-2">
              <UIcon name="i-heroicons-tag" class="w-4 h-4" />
              <span class="capitalize">{{ e.type }}</span>
            </div>
            <div v-if="e.location" class="flex items-center gap-2">
              <UIcon name="i-heroicons-map-pin" class="w-4 h-4" />
              <span>{{ e.location }}</span>
            </div>
          </div>
          <template #footer>
            <div class="flex justify-end">
              <UButton size="xs" variant="ghost" icon="i-heroicons-arrow-right">
                View Details
              </UButton>
            </div>
          </template>
        </UCard>
      </div>
    </div>
  </div>
</template>
