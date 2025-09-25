<script setup lang="ts">
import { ref } from 'vue'
import { useApi } from '../../composables/useApi'
import { useAuthStore } from '../../stores/auth'

// Check auth and role
const auth = useAuthStore()
if (!auth.user || !['admin', 'trainer'].includes(auth.user.role)) {
  throw createError({
    statusCode: 403,
    statusMessage: 'Access denied. Admin or trainer role required.'
  })
}

const { request } = useApi()

// Form data
const form = ref({
  name: '',
  date: '',
  location: '',
  type: 'practice' as 'practice' | 'game' | 'tournament' | 'meeting',
  description: ''
})

const loading = ref(false)
const error = ref('')
const success = ref(false)

const eventTypes = [
  { label: 'Practice', value: 'practice' },
  { label: 'Game', value: 'game' },
  { label: 'Tournament', value: 'tournament' },
  { label: 'Meeting', value: 'meeting' }
]

async function createEvent() {
  if (!form.value.name.trim()) {
    error.value = 'Event name is required'
    return
  }
  if (!form.value.date) {
    error.value = 'Date and time is required'
    return
  }
  if (!form.value.location.trim()) {
    error.value = 'Location is required'
    return
  }

  loading.value = true
  error.value = ''

  try {
    await request('/api/events', {
      method: 'POST',
      body: JSON.stringify({
        name: form.value.name.trim(),
        date: form.value.date,
        location: form.value.location.trim(),
        type: form.value.type,
        description: form.value.description.trim() || undefined
      })
    })
    
    success.value = true
    // Reset form
    form.value = {
      name: '',
      date: '',
      location: '',
      type: 'practice',
      description: ''
    }
    
    // Redirect after a short delay
    setTimeout(() => {
      navigateTo('/')
    }, 2000)
    
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to create event'
  } finally {
    loading.value = false
  }
}

// Format datetime-local input
function formatDateForInput(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

// Set default date to tomorrow at 6 PM
const tomorrow = new Date()
tomorrow.setDate(tomorrow.getDate() + 1)
tomorrow.setHours(18, 0, 0, 0)
form.value.date = formatDateForInput(tomorrow)

useHead({
  title: 'Create Event'
})
</script>

<template>
  <div class="max-w-2xl mx-auto py-6">
    <div class="mb-6">
      <h1 class="text-2xl font-semibold mb-2">Create New Event</h1>
      <p class="text-gray-600">Create a new training session, game, or other event for the team.</p>
    </div>

    <UAlert 
      v-if="success" 
      color="green" 
      variant="subtle" 
      title="Event created successfully!" 
      description="Redirecting to events list..."
      class="mb-6"
    />
    
    <UAlert 
      v-if="error" 
      color="red" 
      variant="subtle" 
      title="Error" 
      :description="error"
      class="mb-6"
    />

    <UCard>
      <form @submit.prevent="createEvent" class="space-y-6">
        <UFormGroup label="Event Name" required>
          <UInput 
            v-model="form.name" 
            placeholder="e.g., Weekly Training Session"
            :disabled="loading"
          />
        </UFormGroup>

        <UFormGroup label="Date & Time" required>
          <UInput 
            v-model="form.date" 
            type="datetime-local"
            :disabled="loading"
          />
        </UFormGroup>

        <UFormGroup label="Location" required>
          <UInput 
            v-model="form.location" 
            placeholder="e.g., Main Soccer Field"
            :disabled="loading"
          />
        </UFormGroup>

        <UFormGroup label="Event Type" required>
          <USelect 
            v-model="form.type" 
            :options="eventTypes"
            :disabled="loading"
          />
        </UFormGroup>

        <UFormGroup label="Description" hint="Optional details about the event">
          <UTextarea 
            v-model="form.description" 
            placeholder="Additional information about this event..."
            :rows="3"
            :disabled="loading"
          />
        </UFormGroup>

        <div class="flex justify-end gap-3">
          <UButton 
            type="button" 
            color="gray" 
            variant="ghost"
            :disabled="loading"
            @click="navigateTo('/')"
          >
            Cancel
          </UButton>
          <UButton 
            type="submit" 
            :loading="loading"
            :disabled="loading"
          >
            Create Event
          </UButton>
        </div>
      </form>
    </UCard>
  </div>
</template>