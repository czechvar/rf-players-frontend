<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useApi } from '../../composables/useApi'
import { useAuthStore } from '../../stores/auth'

const route = useRoute()
const { request } = useApi()
const auth = useAuthStore()

interface EventDoc {
  id: string
  name: string
  date: string
  type: string
  location: string
  description?: string
  locked: boolean
  createdAt: string
  updatedAt: string
}

interface PlayerDoc {
  id: string
  firstName: string
  lastName: string
  email: string
  dateOfBirth?: string
  active: boolean
  photo?: {
    id: string
    url: string
    filename: string
  }
}

const event = ref<EventDoc | null>(null)
const players = ref<PlayerDoc[]>([])
const loading = ref(true)
const playersLoading = ref(false)
const error = ref('')

const eventId = route.params.id as string

async function loadEvent() {
  try {
    const data = await request<EventDoc>(`/api/events/${eventId}`)
    event.value = data
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load event'
  } finally {
    loading.value = false
  }
}

async function loadPlayers() {
  if (!auth.user || !['admin', 'trainer'].includes(auth.user.role)) {
    return
  }
  
  playersLoading.value = true
  try {
    const data = await request<{ docs: PlayerDoc[] }>(`/api/users?where[role][equals]=player&where[active][equals]=true&limit=100&sort=firstName`)
    players.value = data.docs
  } catch (e) {
    console.error('Failed to load players:', e)
  } finally {
    playersLoading.value = false
  }
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

function calculateAge(dateOfBirth: string): number {
  const birth = new Date(dateOfBirth)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  
  return age
}

onMounted(async () => {
  await loadEvent()
  if (auth.user && ['admin', 'trainer'].includes(auth.user.role)) {
    await loadPlayers()
  }
})

useHead({
  title: computed(() => event.value ? event.value.name : 'Event Details')
})
</script>

<template>
  <div class="py-6 space-y-6">
    <!-- Loading state -->
    <div v-if="loading" class="flex justify-center py-10">
      <ULoader />
    </div>

    <!-- Error state -->
    <UAlert 
      v-else-if="error" 
      color="red" 
      variant="subtle" 
      :title="'Error'" 
      :description="error"
    />

    <!-- Event details -->
    <div v-else-if="event">
      <!-- Header with back button -->
      <div class="flex items-center gap-3 mb-6">
        <UButton 
          icon="i-heroicons-arrow-left" 
          variant="ghost" 
          size="sm"
          @click="navigateTo('/')"
        />
        <div>
          <h1 class="text-2xl font-semibold">{{ event.name }}</h1>
          <div class="flex items-center gap-2 mt-1">
            <UBadge 
              :color="event.type === 'practice' ? 'blue' : event.type === 'game' ? 'green' : 'purple'" 
              variant="subtle"
            >
              {{ event.type }}
            </UBadge>
            <UBadge v-if="event.locked" color="gray" variant="soft">
              Locked
            </UBadge>
          </div>
        </div>
      </div>

      <!-- Event info cards -->
      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <UCard>
          <div class="flex items-center gap-3">
            <UIcon name="i-heroicons-calendar" class="w-6 h-6 text-blue-500" />
            <div>
              <p class="text-sm text-gray-500">Date & Time</p>
              <p class="font-medium">{{ formatDate(event.date) }}</p>
            </div>
          </div>
        </UCard>

        <UCard>
          <div class="flex items-center gap-3">
            <UIcon name="i-heroicons-map-pin" class="w-6 h-6 text-green-500" />
            <div>
              <p class="text-sm text-gray-500">Location</p>
              <p class="font-medium">{{ event.location }}</p>
            </div>
          </div>
        </UCard>

        <UCard>
          <div class="flex items-center gap-3">
            <UIcon name="i-heroicons-tag" class="w-6 h-6 text-purple-500" />
            <div>
              <p class="text-sm text-gray-500">Event Type</p>
              <p class="font-medium capitalize">{{ event.type }}</p>
            </div>
          </div>
        </UCard>
      </div>

      <!-- Description -->
      <UCard v-if="event.description" class="mb-8">
        <template #header>
          <h3 class="text-lg font-medium">Description</h3>
        </template>
        <p class="text-gray-700 whitespace-pre-wrap">{{ event.description }}</p>
      </UCard>

      <!-- Players section (only for trainers/admins) -->
      <div v-if="auth.user && ['admin', 'trainer'].includes(auth.user.role)" class="space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-medium">Team Players</h3>
          <UButton 
            icon="i-heroicons-user-plus" 
            size="sm" 
            variant="outline"
            to="/players/create"
          >
            Add New Player
          </UButton>
        </div>

        <UCard>
          <div v-if="playersLoading" class="flex justify-center py-6">
            <ULoader size="sm" />
          </div>
          
          <div v-else-if="players.length === 0" class="text-center py-6 text-gray-500">
            No players found. Add some players to get started.
          </div>

          <div v-else class="space-y-3">
            <div 
              v-for="player in players" 
              :key="player.id"
              class="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
              @click="navigateTo(`/players/${player.id}`)"
            >
              <div class="flex items-center gap-3">
                <PlayerAvatar 
                  :first-name="player.firstName"
                  :last-name="player.lastName"
                  :photo="player.photo"
                  size="md"
                />
                <div>
                  <p class="font-medium">{{ player.firstName }} {{ player.lastName }}</p>
                  <p class="text-sm text-gray-500">
                    {{ player.email }}
                    <span v-if="player.dateOfBirth">
                      • Age {{ calculateAge(player.dateOfBirth) }}
                    </span>
                  </p>
                </div>
              </div>
              
              <!-- Actions -->
              <div class="flex items-center gap-2" @click.stop>
                <UButton 
                  size="xs" 
                  variant="ghost" 
                  icon="i-heroicons-user"
                  @click="navigateTo(`/players/${player.id}`)"
                >
                  View Profile
                </UButton>
                <UButton 
                  size="xs" 
                  variant="outline"
                  disabled
                >
                  Register
                </UButton>
              </div>
            </div>
          </div>
        </UCard>

        <!-- Placeholder for future attendance marking -->
        <UAlert 
          color="blue" 
          variant="subtle" 
          title="Coming Next" 
          description="Player registration and attendance marking features will be added in the next step."
        />
      </div>
    </div>
  </div>
</template>