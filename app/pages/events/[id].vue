<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useApi } from '../../composables/useApi'
import { useAuthStore } from '../../stores/auth'
import type { EventDoc, PlayerDoc, AttendanceRecord, PaginatedResponse, LockResponse } from '../../types'

const route = useRoute()
const { request } = useApi()
const { t } = useI18n()
const auth = useAuthStore()

const event = ref<EventDoc | null>(null)
const attendance = ref<AttendanceRecord[]>([])
const loading = ref(true)
const attendanceLoading = ref(false)
const lockLoading = ref(false)
const error = ref('')
const nameFilter = ref('')
const statusFilter = ref<string>('all')
const excusedNotes = ref<Record<string, string>>({})
const showExcusedModal = ref(false)
const currentExcusedPlayer = ref<string | null>(null)

const eventId = route.params.id as string

// Status labels map for i18n
const statusLabels = computed(() => ({
  pending: t.attendance.pending,
  attending: t.attendance.attending,
  declined: t.attendance.declined,
  attended: t.attendance.attended,
  excused: t.attendance.excused
}))

// Computed properties for filtering and sorting
const filteredAttendance = computed(() => {
  let filtered = attendance.value.filter(record => {
    const player = record.playerId as PlayerDoc
    const nameMatch = !nameFilter.value ||
      `${player.firstName} ${player.lastName}`.toLowerCase().includes(nameFilter.value.toLowerCase())

    const statusMatch = statusFilter.value === 'all' || record.status === statusFilter.value

    return nameMatch && statusMatch
  })

  // Sort by status: pending first, then by player name
  return filtered.sort((a, b) => {
    const statusOrder = { pending: 0, attending: 1, declined: 2, attended: 3, excused: 4 }
    const statusDiff = statusOrder[a.status] - statusOrder[b.status]

    if (statusDiff !== 0) return statusDiff

    const playerA = a.playerId as PlayerDoc
    const playerB = b.playerId as PlayerDoc
    return `${playerA.firstName} ${playerA.lastName}`.localeCompare(`${playerB.firstName} ${playerB.lastName}`)
  })
})

const attendanceSummary = computed(() => {
  const summary = {
    total: attendance.value.length,
    pending: 0,
    attending: 0,
    declined: 0,
    attended: 0,
    excused: 0
  }

  attendance.value.forEach(record => {
    summary[record.status]++
  })

  return summary
})

async function loadEvent() {
  try {
    const data = await request<EventDoc>(`/api/events/${eventId}`)
    event.value = data
  } catch (e) {
    error.value = e instanceof Error ? e.message : t.validation.loadFailed
  } finally {
    loading.value = false
  }
}

async function loadAttendance() {
  if (!auth.user || !['admin', 'trainer'].includes(auth.user.role)) {
    console.log('User not authorized for attendance:', auth.user?.role)
    return
  }

  attendanceLoading.value = true
  try {
    console.log('Loading attendance for event:', eventId)

    // Try to load existing attendance records
    const data = await request<PaginatedResponse<AttendanceRecord>>(`/api/events/${eventId}/attendance`)
    console.log('Attendance data received:', data)
    attendance.value = data.docs

    // If no attendance records found, try to generate them for existing players
    if (data.docs.length === 0) {
      console.log('No attendance records found, attempting to generate for existing players')
      await generateAttendanceForExistingPlayers()
    }

  } catch (e) {
    console.error('Failed to load attendance:', e)

    // If the custom endpoint fails, try the standard attendance endpoint
    try {
      const fallbackData = await request<PaginatedResponse<AttendanceRecord>>(`/api/attendance?where[eventId][equals]=${eventId}&depth=2&limit=100`)
      console.log('Fallback attendance data:', fallbackData)
      attendance.value = fallbackData.docs
    } catch (fallbackError) {
      console.error('Fallback attendance request also failed:', fallbackError)
      error.value = t.attendance.title + ' ' + t.common.error + ': ' + (e instanceof Error ? e.message : 'Unknown error')
    }
  } finally {
    attendanceLoading.value = false
  }
}

async function generateAttendanceForExistingPlayers() {
  try {
    // Get all active players
    const playersData = await request<{ docs: any[] }>('/api/users?where[role][equals]=player&where[active][equals]=true&limit=100')

    if (playersData.docs && playersData.docs.length > 0) {
      console.log(`Generating attendance records for ${playersData.docs.length} existing players`)

      // Create attendance records for each player
      const attendancePromises = playersData.docs.map(player =>
        request('/api/attendance', {
          method: 'POST',
          body: JSON.stringify({
            eventId: eventId,
            playerId: player.id,
            status: 'pending',
            notes: 'Auto-generated for existing player',
            updatedBy: auth.user?.id
          })
        }).catch(err => {
          console.error(`Failed to create attendance for player ${player.firstName} ${player.lastName}:`, err)
          return null
        })
      )

      const results = await Promise.allSettled(attendancePromises)

      // Reload attendance after generation
      const newData = await request<PaginatedResponse<AttendanceRecord>>(`/api/events/${eventId}/attendance`)
      attendance.value = newData.docs

      console.log('Attendance records generated and reloaded')
    }
  } catch (e) {
    console.error('Failed to generate attendance for existing players:', e)
  }
}

async function updateAttendance(playerId: string, status: string, notes?: string) {
  if (!auth.user || !['admin', 'trainer'].includes(auth.user.role)) {
    return
  }

  try {
    await request(`/api/events/${eventId}/attendance`, {
      method: 'PATCH',
      body: JSON.stringify({
        playerId,
        status,
        notes: notes || ''
      })
    })

    // Update local attendance record
    const recordIndex = attendance.value.findIndex(
      record => (record.playerId as PlayerDoc).id === playerId
    )

    if (recordIndex !== -1 && attendance.value[recordIndex]) {
      attendance.value[recordIndex].status = status as any
      attendance.value[recordIndex].notes = notes || ''
      attendance.value[recordIndex].updatedAt = new Date().toISOString()
    }

    // Show success notification
    // You can add a toast notification here

  } catch (e) {
    console.error('Failed to update attendance:', e)
    alert(t.attendance.updateFailed + ': ' + (e instanceof Error ? e.message : 'Unknown error'))
  }
}

function handleAttendedClick(playerId: string) {
  updateAttendance(playerId, 'attended')
}

function handleDeclinedClick(playerId: string) {
  updateAttendance(playerId, 'declined')
}

function handleExcusedClick(playerId: string) {
  currentExcusedPlayer.value = playerId
  showExcusedModal.value = true
}

function submitExcused() {
  if (currentExcusedPlayer.value) {
    const notes = excusedNotes.value[currentExcusedPlayer.value] || ''
    updateAttendance(currentExcusedPlayer.value, 'excused', notes)
    showExcusedModal.value = false
    excusedNotes.value[currentExcusedPlayer.value] = ''
    currentExcusedPlayer.value = null
  }
}

function cancelExcused() {
  showExcusedModal.value = false
  currentExcusedPlayer.value = null
  if (currentExcusedPlayer.value) {
    excusedNotes.value[currentExcusedPlayer.value] = ''
  }
}

function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    pending: 'gray',
    attending: 'blue',
    declined: 'red',
    attended: 'green',
    excused: 'yellow'
  }
  return colors[status] || 'gray'
}

function getStatusIcon(status: string) {
  const icons: Record<string, string> = {
    pending: 'i-heroicons-clock',
    attending: 'i-heroicons-check-circle',
    declined: 'i-heroicons-x-circle',
    attended: 'i-heroicons-check-circle',
    excused: 'i-heroicons-exclamation-triangle'
  }
  return icons[status] || 'i-heroicons-question-mark-circle'
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString('cs-CZ', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

async function testConnection() {
  try {
    console.log('Testing API connection...')

    // First try a simple health check without auth
    console.log('Testing health endpoint...')
    const healthResponse = await fetch('http://localhost:3000/api/health')
    const healthData = await healthResponse.json()
    console.log('Health check response:', healthData)

    if (!healthResponse.ok) {
      throw new Error(`Health check failed: ${healthData.message}`)
    }

    // Then try the basic attendance collection with auth
    console.log('Testing basic attendance API with auth...')
    const basicAttendance = await request('/api/attendance?limit=5')
    console.log('Basic attendance response:', basicAttendance)

    // Then try our custom endpoint
    console.log('Testing custom debug API...')
    const debugData = await request('/api/debug/attendance')
    console.log('Debug data:', debugData)

    alert(t.attendance.connectionSuccess + ' ' + t.common.checkConsole)
  } catch (e) {
    console.error('Connection test failed:', e)
    alert(t.attendance.connectionFailed + ': ' + (e instanceof Error ? e.message : 'Unknown error'))
  }
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

async function lockEvent() {
  if (!event.value) return

  lockLoading.value = true
  try {
    const response = await request<LockResponse>(`/api/events/${eventId}/lock`, {
      method: 'POST'
    })

    // Update local event state
    event.value.locked = true

    // Show success message
    console.log('Event locked successfully:', response.message)
  } catch (e) {
    console.error('Failed to lock event:', e)
    error.value = t.validation.lockFailed + ': ' + (e instanceof Error ? e.message : 'Unknown error')
  } finally {
    lockLoading.value = false
  }
}

async function unlockEvent() {
  if (!event.value) return

  lockLoading.value = true
  try {
    const response = await request<LockResponse>(`/api/events/${eventId}/lock`, {
      method: 'DELETE'
    })

    // Update local event state
    event.value.locked = false

    // Show success message
    console.log('Event unlocked successfully:', response.message)
  } catch (e) {
    console.error('Failed to unlock event:', e)
    error.value = t.validation.unlockFailed + ': ' + (e instanceof Error ? e.message : 'Unknown error')
  } finally {
    lockLoading.value = false
  }
}

onMounted(async () => {
  await loadEvent()
  if (auth.user && ['admin', 'trainer'].includes(auth.user.role)) {
    await loadAttendance()
  }
})

useHead({
  title: computed(() => event.value ? event.value.name : t.events.pageTitle)
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
      :title="t.common.error"
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
              {{ t.events.locked }}
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
              <p class="text-sm text-gray-500">{{ t.events.dateTimeLabel }}</p>
              <p class="font-medium">{{ formatDate(event.date) }}</p>
            </div>
          </div>
        </UCard>

        <UCard>
          <div class="flex items-center gap-3">
            <UIcon name="i-heroicons-map-pin" class="w-6 h-6 text-green-500" />
            <div>
              <p class="text-sm text-gray-500">{{ t.events.locationLabel }}</p>
              <p class="font-medium">{{ event.location }}</p>
            </div>
          </div>
        </UCard>

        <UCard>
          <div class="flex items-center gap-3">
            <UIcon name="i-heroicons-tag" class="w-6 h-6 text-purple-500" />
            <div>
              <p class="text-sm text-gray-500">{{ t.events.eventTypeLabel }}</p>
              <p class="font-medium capitalize">{{ event.type }}</p>
            </div>
          </div>
        </UCard>
      </div>

      <!-- Description -->
      <UCard v-if="event.description" class="mb-8">
        <template #header>
          <h3 class="text-lg font-medium">{{ t.events.description }}</h3>
        </template>
        <p class="text-gray-700 whitespace-pre-wrap">{{ event.description }}</p>
      </UCard>

        <!-- Event Actions (only for trainers/admins) -->
        <UCard v-if="auth.user && ['admin', 'trainer'].includes(auth.user.role)" class="mb-6">
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-medium">{{ t.events.eventManagement }}</h3>
              <div class="flex items-center gap-2">
                <UButton
                  v-if="!event.locked"
                  @click="lockEvent"
                  :loading="lockLoading"
                  color="orange"
                  variant="solid"
                  size="sm"
                  icon="i-heroicons-lock-closed"
                >
                  {{ t.events.lockEvent }}
                </UButton>
                <UButton
                  v-else-if="auth.user.role === 'admin'"
                  @click="unlockEvent"
                  :loading="lockLoading"
                  color="green"
                  variant="solid"
                  size="sm"
                  icon="i-heroicons-lock-open"
                >
                  {{ t.events.unlockEvent }}
                </UButton>
                <UBadge v-else color="gray" variant="soft">
                  {{ t.events.eventLocked }}
                </UBadge>
              </div>
            </div>
          </template>
          <div class="space-y-2">
            <div v-if="!event.locked" class="text-sm text-gray-600">
              <UIcon name="i-heroicons-information-circle" class="inline w-4 h-4 mr-1" />
              {{ t.events.lockInfo }}
            </div>
            <div v-else class="text-sm text-gray-600">
              <UIcon name="i-heroicons-shield-check" class="inline w-4 h-4 mr-1" />
              {{ t.events.lockedInfo }}
            </div>
          </div>
        </UCard>

        <!-- Attendance Management (only for trainers/admins) -->
      <div v-if="auth.user && ['admin', 'trainer'].includes(auth.user.role)" class="space-y-6">
        <!-- Debug Info -->
        <UAlert
          v-if="error"
          color="red"
          variant="subtle"
          :title="t.common.error"
          :description="error"
        />

        <!-- Attendance Header with Summary -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 class="text-lg font-medium">{{ t.attendance.title }}</h3>
            <p class="text-sm text-gray-500">{{ t.attendance.subtitle }}</p>
            <UButton
              v-if="(attendance.length === 0 && !attendanceLoading) || error"
              size="xs"
              variant="outline"
              @click="testConnection"
            >
              {{ t.attendance.debugConnection }}
            </UButton>
          </div>          <!-- Attendance Summary -->
          <div class="flex items-center gap-4 text-sm">
            <div class="flex items-center gap-1">
              <div class="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>{{ t.attendance.summaryAttended }}: {{ attendanceSummary.attended }}</span>
            </div>
            <div class="flex items-center gap-1">
              <div class="w-2 h-2 bg-red-500 rounded-full"></div>
              <span>{{ t.attendance.summaryDeclined }}: {{ attendanceSummary.declined }}</span>
            </div>
            <div class="flex items-center gap-1">
              <div class="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span>{{ t.attendance.summaryExcused }}: {{ attendanceSummary.excused }}</span>
            </div>
            <div class="flex items-center gap-1">
              <div class="w-2 h-2 bg-gray-400 rounded-full"></div>
              <span>{{ t.attendance.summaryPending }}: {{ attendanceSummary.pending }}</span>
            </div>
          </div>
        </div>

        <!-- Filters -->
        <UCard>
          <div class="flex flex-col sm:flex-row gap-4">
            <!-- Name Filter -->
            <div class="flex-1">
              <UInput
                v-model="nameFilter"
                icon="i-heroicons-magnifying-glass"
                :placeholder="t.attendance.filterByName"
                size="sm"
              />
            </div>

            <!-- Status Filter -->
            <div class="w-full sm:w-48">
              <USelect
                v-model="statusFilter"
                :options="[
                  { label: t.attendance.allStatuses, value: 'all' },
                  { label: t.attendance.pending, value: 'pending' },
                  { label: t.attendance.attending, value: 'attending' },
                  { label: t.attendance.declined, value: 'declined' },
                  { label: t.attendance.attended, value: 'attended' },
                  { label: t.attendance.excused, value: 'excused' }
                ]"
                size="sm"
              />
            </div>
          </div>
        </UCard>

        <!-- Attendance List -->
        <UCard>
          <div v-if="attendanceLoading" class="flex justify-center py-8">
            <ULoader size="sm" />
          </div>

          <div v-else-if="attendance.length === 0" class="text-center py-8 text-gray-500">
            <p class="mb-4">{{ t.attendance.noRecords }}</p>
            <div class="text-sm">
              <p>{{ t.attendance.noRecordsReasons }}</p>
              <ul class="mt-2 space-y-1">
                <li>• {{ t.attendance.noPlayersYet }}</li>
                <li>• {{ t.attendance.eventBeforeSystem }}</li>
                <li>• {{ t.attendance.needGeneration }}</li>
              </ul>
            </div>
            <UButton
              class="mt-4"
              size="sm"
              variant="outline"
              @click="testConnection"
            >
              {{ t.attendance.testBackend }}
            </UButton>
          </div>

          <div v-else-if="filteredAttendance.length === 0" class="text-center py-8 text-gray-500">
            {{ t.attendance.noMatchFilter }}
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="record in filteredAttendance"
              :key="record.id"
              class="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <!-- Player Info -->
              <div class="flex items-center gap-3">
                <PlayerAvatar
                  :first-name="(record.playerId as PlayerDoc).firstName"
                  :last-name="(record.playerId as PlayerDoc).lastName"
                  :photo="(record.playerId as PlayerDoc).photo"
                  size="lg"
                />
                <div>
                  <p class="font-medium">
                    {{ (record.playerId as PlayerDoc).firstName }} {{ (record.playerId as PlayerDoc).lastName }}
                  </p>
                  <div class="flex items-center gap-2 mt-1">
                    <UBadge
                      :color="getStatusColor(record.status) as any"
                      :icon="getStatusIcon(record.status)"
                      variant="subtle"
                    >
                      {{ statusLabels[record.status] }}
                    </UBadge>
                    <span v-if="record.notes" class="text-xs text-gray-500">
                      • {{ record.notes }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="flex items-center gap-2" v-if="!event.locked || auth.user?.role === 'admin'">
                <!-- Attended Button -->
                <UButton
                  size="sm"
                  :color="record.status === 'attended' ? 'green' : 'gray'"
                  :variant="record.status === 'attended' ? 'solid' : 'outline'"
                  icon="i-heroicons-check"
                  @click="handleAttendedClick((record.playerId as PlayerDoc).id)"
                >
                  {{ t.attendance.ok }}
                </UButton>

                <!-- Declined Button -->
                <UButton
                  size="sm"
                  :color="record.status === 'declined' ? 'red' : 'gray'"
                  :variant="record.status === 'declined' ? 'solid' : 'outline'"
                  icon="i-heroicons-x-mark"
                  @click="handleDeclinedClick((record.playerId as PlayerDoc).id)"
                >
                  {{ t.attendance.no }}
                </UButton>

                <!-- Excused Button -->
                <UButton
                  size="sm"
                  :color="record.status === 'excused' ? 'yellow' : 'gray'"
                  :variant="record.status === 'excused' ? 'solid' : 'outline'"
                  icon="i-heroicons-exclamation-triangle"
                  @click="handleExcusedClick((record.playerId as PlayerDoc).id)"
                >
                  {{ t.attendance.excusedButton }}
                </UButton>
              </div>

              <!-- Locked Message -->
              <div v-else class="text-sm text-gray-500">
                {{ t.attendance.eventIsLocked }}
              </div>
            </div>
          </div>
        </UCard>
      </div>
    </div>

    <!-- Excused Modal -->
    <UModal v-model="showExcusedModal">
      <div class="p-6">
        <h3 class="text-lg font-medium mb-4">{{ t.attendance.markAsExcused }}</h3>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              {{ t.attendance.excusedReason }}
            </label>
            <UTextarea
              v-model="excusedNotes[currentExcusedPlayer || '']"
              :placeholder="t.attendance.excusedPlaceholder"
              :rows="3"
            />
          </div>

          <div class="flex justify-end gap-3">
            <UButton
              variant="ghost"
              @click="cancelExcused"
            >
              {{ t.common.cancel }}
            </UButton>
            <UButton
              color="yellow"
              :disabled="!excusedNotes[currentExcusedPlayer || '']?.trim()"
              @click="submitExcused"
            >
              {{ t.attendance.markAsExcused }}
            </UButton>
          </div>
        </div>
      </div>
    </UModal>
  </div>
</template>
