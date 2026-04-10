<script setup lang="ts">
import { ref } from 'vue'
import { useApi } from '../../composables/useApi'
import { useAuthStore } from '../../stores/auth'
import type { EventType } from '../../types'

const auth = useAuthStore()
const { t } = useI18n()

// Check auth and role
if (!auth.user || !['admin', 'trainer'].includes(auth.user.role)) {
  throw createError({
    statusCode: 403,
    statusMessage: t.errors.accessDenied
  })
}

const { request } = useApi()

// Form data
const form = ref({
  name: '',
  date: '',
  location: '',
  type: 'practice' as EventType,
  description: ''
})

const loading = ref(false)
const error = ref('')
const success = ref(false)

const eventTypes = [
  { label: t.events.practice, value: 'practice' },
  { label: t.events.game, value: 'game' },
  { label: t.events.tournament, value: 'tournament' },
  { label: t.events.meeting, value: 'meeting' }
]

async function createEvent() {
  if (!form.value.name.trim()) {
    error.value = t.validation.eventNameRequired
    return
  }
  if (!form.value.date) {
    error.value = t.validation.dateRequired
    return
  }
  if (!form.value.location.trim()) {
    error.value = t.validation.locationRequired
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
    error.value = e instanceof Error ? e.message : t.validation.loadFailed
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
  title: t.events.createTitle
})
</script>

<template>
  <div class="max-w-2xl mx-auto py-6">
    <div class="mb-6">
      <h1 class="text-2xl font-semibold mb-2">{{ t.events.createTitle }}</h1>
      <p class="text-gray-600">{{ t.events.createSubtitle }}</p>
    </div>

    <UAlert
      v-if="success"
      color="green"
      variant="subtle"
      :title="t.events.eventCreated"
      :description="t.events.eventCreatedRedirect"
      class="mb-6"
    />

    <UAlert
      v-if="error"
      color="red"
      variant="subtle"
      :title="t.common.error"
      :description="error"
      class="mb-6"
    />

    <UCard>
      <form @submit.prevent="createEvent" class="space-y-6">
        <UFormGroup :label="t.events.eventName" required>
          <UInput
            v-model="form.name"
            :placeholder="t.events.eventNamePlaceholder"
            :disabled="loading"
          />
        </UFormGroup>

        <UFormGroup :label="t.events.dateTime" required>
          <UInput
            v-model="form.date"
            type="datetime-local"
            :disabled="loading"
          />
        </UFormGroup>

        <UFormGroup :label="t.events.location" required>
          <UInput
            v-model="form.location"
            :placeholder="t.events.locationPlaceholder"
            :disabled="loading"
          />
        </UFormGroup>

        <UFormGroup :label="t.events.eventType" required>
          <USelect
            v-model="form.type"
            :options="eventTypes"
            :disabled="loading"
          />
        </UFormGroup>

        <UFormGroup :label="t.events.description" :hint="t.events.descriptionHint">
          <UTextarea
            v-model="form.description"
            :placeholder="t.events.descriptionPlaceholder"
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
            {{ t.common.cancel }}
          </UButton>
          <UButton
            type="submit"
            :loading="loading"
            :disabled="loading"
          >
            {{ t.events.createEvent }}
          </UButton>
        </div>
      </form>
    </UCard>
  </div>
</template>
