<script setup lang="ts">
import { ref, onMounted, computed, nextTick } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useApi } from '../composables/useApi'

const auth = useAuthStore()
const { request } = useApi()

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

// Stats data
const stats = ref({
  upcomingEvents: 0,
  pastEvents: 0,
  activePlayers: 0,
  activeTrainers: 0
})
const statsLoading = ref(false)

// Create a computed property to check if user is logged in
const isLoggedIn = computed(() => {
  return !!(auth.user && auth.token)
})

// Remove the automatic redirect since we want to show dashboard content
onMounted(() => {
  // Comment out the auto-redirect to allow showing dashboard
  // if (auth.isLoggedIn) {
  //   navigateTo('/events')
  // }
})

// Load dashboard stats for admin/trainer
async function loadStats() {
  if (!['admin', 'trainer'].includes(auth.user?.role)) return
  
  statsLoading.value = true
  try {
    const today = new Date().toISOString().split('T')[0]
    
    // Load upcoming events
    const upcomingEventsData = await request<{ docs: any[] }>(`/api/events?where[date][greater_than_equal]=${today}&limit=100`)
    stats.value.upcomingEvents = upcomingEventsData.docs.length

    // Load past events  
    const pastEventsData = await request<{ docs: any[] }>(`/api/events?where[date][less_than]=${today}&limit=100`)
    stats.value.pastEvents = pastEventsData.docs.length

    // Load active players
    const playersData = await request<{ docs: any[] }>('/api/users?where[role][equals]=player&where[active][not_equals]=false&limit=100')
    stats.value.activePlayers = playersData.docs.length

    // Load active trainers
    const trainersData = await request<{ docs: any[] }>('/api/users?where[role][equals]=trainer&where[active][not_equals]=false&limit=100')
    stats.value.activeTrainers = trainersData.docs.length

  } catch (e) {
    console.error('Failed to load stats:', e)
  } finally {
    statsLoading.value = false
  }
}

async function login() {
  error.value = ''
  loading.value = true
  try {
    const data = await request<{ token: string; user: any }>('/api/users/login', {
      method: 'POST',
      body: JSON.stringify({ email: email.value, password: password.value })
    })
    ;(auth as any).setSession(data.token, data.user)
    
    // Force reactivity update by waiting a tick
    await nextTick()
    
    // Redirect to events page after successful login
    await navigateTo('/events')
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (isLoggedIn.value) {
    loadStats()
  }
})
</script>

<template>
        <!-- Quick Stats (Admin/Trainer) -->
      <div v-if="['admin', 'trainer'].includes(auth.user?.role ?? '')" class="bg-white rounded-lg shadow p-6">
        <h2 class="text-2xl font-semibold mb-6">Quick Overview</h2>
        <div v-if="statsLoading" class="flex justify-center py-8">
          <ULoader />
        </div>
        <div v-else class="grid md:grid-cols-4 gap-6">
          <div class="text-center">
            <div class="text-3xl font-bold text-blue-600">{{ stats.upcomingEvents }}</div>
            <div class="text-gray-600">Upcoming Events</div>
          </div>
          <div class="text-center">
            <div class="text-3xl font-bold text-gray-600">{{ stats.pastEvents }}</div>
            <div class="text-gray-600">Past Events</div>
          </div>
          <div class="text-center">
            <div class="text-3xl font-bold text-green-600">{{ stats.activePlayers }}</div>
            <div class="text-gray-600">Active Players</div>
          </div>
          <div class="text-center">
            <div class="text-3xl font-bold text-purple-600">{{ stats.activeTrainers }}</div>
            <div class="text-gray-600">Active Trainers</div>
          </div>
        </div>
      </div>
  <!-- Show welcome dashboard if logged in -->
  <div v-if="isLoggedIn" class="min-h-screen bg-gray-50">
    <div class="max-w-4xl mx-auto py-12 px-4">
      <!-- Welcome Header -->
      <div class="text-center mb-12">
        <h1 class="text-4xl font-bold text-gray-900 mb-4">
          Welcome back, {{ auth.user?.firstName || auth.user?.email }}!
        </h1>
        <p class="text-lg text-gray-600">
          Manage your soccer team activities from your dashboard
        </p>
        <UBadge 
          :label="auth.user?.role?.toUpperCase()" 
          size="lg" 
          variant="subtle"
          class="mt-4"
        />
      </div>

      <!-- Quick Actions Grid -->
      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <!-- Events Card -->
        <UCard class="hover:shadow-lg transition-shadow cursor-pointer" @click="navigateTo('/events')">
          <template #header>
            <div class="flex items-center gap-3">
              <UIcon name="i-heroicons-calendar-days" class="w-8 h-8 text-blue-500" />
              <h3 class="text-xl font-semibold">Events</h3>
            </div>
          </template>
          <p class="text-gray-600 mb-4">
            View upcoming trainings, matches, and tournaments
          </p>
          <UButton to="/events" variant="outline" block>
            View All Events
          </UButton>
        </UCard>

        <!-- Players Card (Admin/Trainer only) -->
        <UCard 
          v-if="['admin', 'trainer'].includes(auth.user?.role)" 
          class="hover:shadow-lg transition-shadow cursor-pointer" 
          @click="navigateTo('/players')"
        >
          <template #header>
            <div class="flex items-center gap-3">
              <UIcon name="i-heroicons-users" class="w-8 h-8 text-green-500" />
              <h3 class="text-xl font-semibold">Players</h3>
            </div>
          </template>
          <p class="text-gray-600 mb-4">
            Manage player profiles and registrations
          </p>
          <UButton to="/players" variant="outline" block>
            View All Players
          </UButton>
        </UCard>

        <!-- Create Event Card (Admin/Trainer only) -->
        <UCard 
          v-if="['admin', 'trainer'].includes(auth.user?.role)" 
          class="hover:shadow-lg transition-shadow cursor-pointer border-dashed border-2 border-gray-300"
          @click="navigateTo('/events/create')"
        >
          <template #header>
            <div class="flex items-center gap-3">
              <UIcon name="i-heroicons-plus-circle" class="w-8 h-8 text-purple-500" />
              <h3 class="text-xl font-semibold">Create Event</h3>
            </div>
          </template>
          <p class="text-gray-600 mb-4">
            Schedule a new training session or match
          </p>
          <UButton to="/events/create" variant="solid" block>
            Create New Event
          </UButton>
        </UCard>

        <!-- Create Player Card (Admin/Trainer only) -->
        <UCard 
          v-if="['admin', 'trainer'].includes(auth.user?.role)" 
          class="hover:shadow-lg transition-shadow cursor-pointer border-dashed border-2 border-gray-300"
          @click="navigateTo('/players/create')"
        >
          <template #header>
            <div class="flex items-center gap-3">
              <UIcon name="i-heroicons-user-plus" class="w-8 h-8 text-orange-500" />
              <h3 class="text-xl font-semibold">Create Player</h3>
            </div>
          </template>
          <p class="text-gray-600 mb-4">
            Register a new player to the team
          </p>
          <UButton to="/players/create" variant="solid" block>
            Register Player
          </UButton>
        </UCard>

        <!-- My Attendance Card (Player/Parent) -->
        <UCard 
          v-if="['player', 'parent'].includes(auth.user?.role)" 
          class="hover:shadow-lg transition-shadow"
        >
          <template #header>
            <div class="flex items-center gap-3">
              <UIcon name="i-heroicons-check-circle" class="w-8 h-8 text-emerald-500" />
              <h3 class="text-xl font-semibold">My Attendance</h3>
            </div>
          </template>
          <p class="text-gray-600 mb-4">
            Track your attendance history and stats
          </p>
          <UButton variant="outline" block>
            View Attendance
          </UButton>
        </UCard>
      </div>
    </div>
  </div>

  <!-- Show login form if not authenticated -->
  <div v-else class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="max-w-md w-full space-y-8 p-8">
      <div class="text-center space-y-4">
        <h1 class="text-3xl font-bold text-gray-900">RF Players</h1>
        <p class="text-sm text-gray-600">Sign in to access your dashboard</p>
      </div>
      
      <UAlert v-if="error" color="red" variant="subtle" :title="'Login failed'" :description="error" />
      
      <UForm :state="{}" @submit.prevent="login" class="space-y-6">
        <UFormGroup label="Email Address">
          <UInput 
            v-model="email" 
            type="email" 
            placeholder="Enter your email"
            required 
            size="lg"
          />
        </UFormGroup>
        
        <UFormGroup label="Password">
          <UInput 
            v-model="password" 
            type="password" 
            placeholder="Enter your password"
            required 
            size="lg"
          />
        </UFormGroup>
        
        <UButton 
          type="submit" 
          block 
          size="lg"
          :loading="loading"
          :disabled="!email || !password"
        >
          Sign In
        </UButton>
      </UForm>
      
      <div class="text-center space-y-2">
        <p class="text-sm text-gray-600">Need an account?</p>
        <UButton to="/auth/register" variant="link" size="sm">
          Contact your administrator
        </UButton>
      </div>
    </div>
  </div>
</template>