<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useApi } from '../../composables/useApi'
import { useAuthStore } from '../../stores/auth'
import type { PlayerDoc } from '../../types'

// Check auth and role
const auth = useAuthStore()
if (!auth.user || !['admin', 'trainer'].includes(auth.user.role)) {
  throw createError({
    statusCode: 403,
    statusMessage: useI18n().t.errors.accessDenied
  })
}

const { t } = useI18n()
const route = useRoute()
const { request } = useApi()

const playerId = route.params.id as string
const player = ref<PlayerDoc | null>(null)
const loading = ref(true)
const error = ref('')
const saving = ref(false)
const isEditing = ref(false)
const uploadingPhoto = ref(false)

// Form data for editing
const editForm = ref({
  firstName: '',
  lastName: '',
  email: '',
  dateOfBirth: '',
  phoneNumber: '',
  active: true,
  isApproved: true
})

async function loadPlayer() {
  try {
    loading.value = true
    const data = await request<PlayerDoc>(`/api/users/${playerId}`)

    if (data.role !== 'player') {
      throw new Error('This user is not a player')
    }

    player.value = data

    // Initialize edit form with current data
    editForm.value = {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      dateOfBirth: data.dateOfBirth || '',
      phoneNumber: data.phoneNumber || '',
      active: data.active,
      isApproved: data.isApproved
    }

    error.value = ''
  } catch (e) {
    error.value = e instanceof Error ? e.message : t.validation.loadFailed
  } finally {
    loading.value = false
  }
}

async function savePlayer() {
  if (!player.value) return

  // Validate required fields
  if (!editForm.value.firstName.trim()) {
    error.value = t.validation.firstNameRequired
    return
  }
  if (!editForm.value.lastName.trim()) {
    error.value = t.validation.lastNameRequired
    return
  }
  if (!editForm.value.email.trim()) {
    error.value = t.validation.emailRequired
    return
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(editForm.value.email)) {
    error.value = t.validation.emailInvalid
    return
  }

  // Validate age if date of birth is provided
  if (editForm.value.dateOfBirth) {
    const birthDate = new Date(editForm.value.dateOfBirth)
    const today = new Date()
    const age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      // Birthday hasn't occurred this year
    }

    // Age validation is commented out as per existing code
    // if (age < 6 || age > 12) {
    //   error.value = 'Player must be between 6-12 years old'
    //   return
    // }
  }

  saving.value = true
  error.value = ''

  try {
    // Prepare update data based on user role
    const updateData: any = {
      firstName: editForm.value.firstName.trim(),
      lastName: editForm.value.lastName.trim(),
      dateOfBirth: editForm.value.dateOfBirth || undefined,
      phoneNumber: editForm.value.phoneNumber.trim() || undefined,
    }

    // Only admins can modify email and status fields
    if (auth.user?.role === 'admin') {
      updateData.email = editForm.value.email.trim().toLowerCase()
      updateData.active = editForm.value.active
      updateData.isApproved = editForm.value.isApproved
    }

    await request<PlayerDoc>(`/api/users/${playerId}`, {
      method: 'PATCH',
      body: JSON.stringify(updateData)
    })

    // Reload the player data to ensure we have the latest information
    await loadPlayer()

    isEditing.value = false

    // Show success message
    const successToast = useToast()
    successToast.add({
      title: t.common.success,
      description: t.players.playerUpdated,
      color: 'green'
    })

  } catch (e) {
    // Handle different types of errors
    if (e instanceof Error) {
      if (e.message.includes('403') || e.message.includes('Forbidden') || e.message.includes('not allowed')) {
        error.value = t.players.permissionDenied
      } else if (e.message.includes('400') || e.message.includes('validation')) {
        error.value = t.players.invalidData
      } else if (e.message.includes('409') || e.message.includes('conflict')) {
        error.value = t.players.emailConflict
      } else {
        error.value = e.message
      }
    } else {
      error.value = t.players.updateFailed
    }
  } finally {
    saving.value = false
  }
}

async function uploadPhoto(file: File) {
  if (!player.value) return

  uploadingPhoto.value = true
  error.value = ''

  try {
    // Create FormData for file upload
    const formData = new FormData()
    formData.append('file', file)

    // Get auth token from the auth store or cookie
    const token = useCookie('payload-token')

    if (!token.value) {
      throw new Error(t.players.photoAuthExpired)
    }

    // Use the request composable which handles auth properly
    const uploadResponse = await $fetch<{ doc: { id: string, url: string, filename: string } }>('/api/media', {
      method: 'POST',
      body: formData,
      baseURL: useRuntimeConfig().public.apiBase,
      headers: {
        'Authorization': `JWT ${token.value}`
      },
      // Don't set Content-Type for FormData, let browser handle it
      onResponseError({ response }) {
        console.error('Upload response error:', response)
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`)
      }
    })

    // Update player with new photo using the existing request method
    const updateData = {
      photo: uploadResponse.doc.id
    }

    await request<PlayerDoc>(`/api/users/${playerId}`, {
      method: 'PATCH',
      body: JSON.stringify(updateData)
    })

    // Reload player data to get updated photo
    await loadPlayer()

    // Show success message
    const successToast = useToast()
    successToast.add({
      title: t.common.success,
      description: t.players.photoUpdated,
      color: 'green'
    })

  } catch (e) {
    console.error('Photo upload error:', e)

    // Handle specific error cases
    if (e instanceof Error) {
      const errorMessage = e.message.toLowerCase()

      if (errorMessage.includes('403') || errorMessage.includes('forbidden')) {
        error.value = t.players.photoAccessDenied
      } else if (errorMessage.includes('401') || errorMessage.includes('unauthorized')) {
        error.value = t.players.photoAuthExpired
      } else if (errorMessage.includes('413') || errorMessage.includes('too large')) {
        error.value = t.players.photoTooLarge
      } else if (errorMessage.includes('415') || errorMessage.includes('unsupported')) {
        error.value = t.players.photoUnsupported
      } else if (errorMessage.includes('400')) {
        error.value = t.players.photoInvalid
      } else if (errorMessage.includes('cors')) {
        error.value = t.players.photoNetworkError
      } else {
        error.value = `${t.players.uploadFailed}: ${e.message}`
      }
    } else {
      error.value = t.players.photoUploadFailed
    }
  } finally {
    uploadingPhoto.value = false
  }
}

function handlePhotoUpload(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) return

  // Reset the input value so the same file can be selected again
  target.value = ''

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    error.value = t.players.photoUnsupported
    return
  }

  // Validate file size (2MB max to be safe)
  const maxSize = 2 * 1024 * 1024 // 2MB in bytes
  if (file.size > maxSize) {
    error.value = t.players.photoTooLarge
    return
  }

  // Clear any previous errors
  error.value = ''

  uploadPhoto(file)
}

async function removePhoto() {
  if (!player.value?.photo) return

  uploadingPhoto.value = true
  error.value = ''

  try {
    // Remove photo reference from player
    const updateData = {
      photo: null
    }

    await request<PlayerDoc>(`/api/users/${playerId}`, {
      method: 'PATCH',
      body: JSON.stringify(updateData)
    })

    // Reload player data
    await loadPlayer()

    // Show success message
    const successToast = useToast()
    successToast.add({
      title: t.common.success,
      description: t.players.photoRemoved,
      color: 'green'
    })

  } catch (e) {
    error.value = e instanceof Error ? e.message : t.players.photoRemovalFailed
  } finally {
    uploadingPhoto.value = false
  }
}

function cancelEdit() {
  if (!player.value) return

  // Reset form to original data
  editForm.value = {
    firstName: player.value.firstName,
    lastName: player.value.lastName,
    email: player.value.email,
    dateOfBirth: player.value.dateOfBirth || '',
    phoneNumber: player.value.phoneNumber || '',
    active: player.value.active,
    isApproved: player.value.isApproved
  }

  isEditing.value = false
  error.value = ''
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

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString()
}

function getPhotoUrl(url: string): string {
  const config = useRuntimeConfig()
  const apiBase = config.public.apiBase

  // If URL is already absolute (starts with http), return as is
  if (url.startsWith('http')) {
    return url
  }

  // If URL starts with /, it's relative to the API base
  if (url.startsWith('/')) {
    return `${apiBase}${url}`
  }

  // Otherwise, assume it needs to be appended to API base
  return `${apiBase}/${url}`
}

// Add computed property to check if user can edit sensitive fields
const canEditSensitiveFields = computed(() => {
  return auth.user?.role === 'admin'
})

onMounted(loadPlayer)

useHead({
  title: computed(() =>
    player.value
      ? `${player.value.firstName} ${player.value.lastName} - ${t.players.playerProfile}`
      : t.players.playerProfile
  )
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
      v-else-if="error && !player"
      color="red"
      variant="subtle"
      :title="t.common.error"
      :description="error"
    >
      <template #actions>
        <UButton @click="navigateTo('/players')" color="gray" variant="ghost" size="xs">
          {{ t.common.back }}
        </UButton>
      </template>
    </UAlert>

    <!-- Player details -->
    <div v-else-if="player">
      <!-- Header with actions -->
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-3">
          <UButton
            icon="i-heroicons-arrow-left"
            variant="ghost"
            size="sm"
            @click="navigateTo('/players')"
          />
          <div>
            <div class="flex items-center gap-2">
              <h1 class="text-2xl font-semibold">
                {{ player.firstName }} {{ player.lastName }}
              </h1>
              <UBadge v-if="!player.active" color="red" variant="soft">
                {{ t.players.inactive }}
              </UBadge>
              <UBadge v-if="!player.isApproved" color="yellow" variant="soft">
                {{ t.players.pendingApproval }}
              </UBadge>
            </div>
            <p class="text-gray-600">{{ t.players.playerProfile }}</p>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <UButton
            v-if="!isEditing"
            icon="i-heroicons-pencil"
            @click="isEditing = true"
          >
            {{ t.players.editPlayer }}
          </UButton>
          <template v-else>
            <UButton
              color="gray"
              variant="ghost"
              @click="cancelEdit"
              :disabled="saving"
            >
              {{ t.common.cancel }}
            </UButton>
            <UButton
              icon="i-heroicons-check"
              @click="savePlayer"
              :loading="saving"
              :disabled="saving"
            >
              {{ t.players.saveChanges }}
            </UButton>
          </template>
        </div>
      </div>

      <!-- Error message during editing -->
      <UAlert
        v-if="error && player"
        color="red"
        variant="subtle"
        :title="t.common.error"
        :description="error"
        class="mb-6"
      />

      <!-- Player information -->
      <div class="grid gap-6 lg:grid-cols-3">
        <!-- Main info -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Basic Information -->
          <UCard>
            <template #header>
              <h3 class="text-lg font-medium">{{ t.players.basicInfo }}</h3>
            </template>

            <div v-if="!isEditing" class="space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="text-sm font-medium text-gray-500">{{ t.auth.firstName }}</label>
                  <p class="mt-1 font-medium">{{ player.firstName }}</p>
                </div>
                <div>
                  <label class="text-sm font-medium text-gray-500">{{ t.auth.lastName }}</label>
                  <p class="mt-1 font-medium">{{ player.lastName }}</p>
                </div>
              </div>

              <div>
                <label class="text-sm font-medium text-gray-500">{{ t.players.emailAddress }}</label>
                <p class="mt-1 font-medium">{{ player.email }}</p>
              </div>

              <div v-if="player.dateOfBirth">
                <label class="text-sm font-medium text-gray-500">{{ t.players.dateOfBirth }}</label>
                <p class="mt-1 font-medium">
                  {{ formatDate(player.dateOfBirth) }}
                  <span class="text-gray-500 ml-2">({{ t.players.ageLabel }} {{ calculateAge(player.dateOfBirth) }})</span>
                </p>
              </div>

              <div v-if="player.phoneNumber">
                <label class="text-sm font-medium text-gray-500">{{ t.players.phoneNumber }}</label>
                <p class="mt-1 font-medium">{{ player.phoneNumber }}</p>
              </div>
            </div>

            <!-- Edit form -->
            <div v-else class="space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <UFormGroup :label="t.auth.firstName" required>
                  <UInput v-model="editForm.firstName" :disabled="saving" />
                </UFormGroup>
                <UFormGroup :label="t.auth.lastName" required>
                  <UInput v-model="editForm.lastName" :disabled="saving" />
                </UFormGroup>
              </div>

              <UFormGroup :label="t.players.emailAddress" required>
                <UInput
                  v-model="editForm.email"
                  type="email"
                  :disabled="saving || !canEditSensitiveFields"
                />
                <p v-if="!canEditSensitiveFields" class="text-xs text-gray-500 mt-1">
                  {{ t.players.adminOnlyEmail }}
                </p>
              </UFormGroup>

              <UFormGroup :label="t.players.dateOfBirth">
                <UInput v-model="editForm.dateOfBirth" type="date" :disabled="saving" />
              </UFormGroup>

              <UFormGroup :label="t.players.phoneNumber" :hint="t.common.optional">
                <UInput v-model="editForm.phoneNumber" type="tel" :disabled="saving" />
              </UFormGroup>
            </div>
          </UCard>

          <!-- Status & Settings -->
          <UCard v-if="isEditing && canEditSensitiveFields">
            <template #header>
              <h3 class="text-lg font-medium">{{ t.players.statusSettings }}</h3>
            </template>

            <div class="space-y-4">
              <UFormGroup :label="t.players.accountStatus">
                <UCheckbox
                  v-model="editForm.active"
                  :label="t.players.activePlayer"
                  :disabled="saving"
                />
                <p class="text-xs text-gray-500 mt-1">
                  {{ t.players.activePlayerHint }}
                </p>
              </UFormGroup>

              <UFormGroup :label="t.players.approvalStatus">
                <UCheckbox
                  v-model="editForm.isApproved"
                  :label="t.players.approvedForParticipation"
                  :disabled="saving"
                />
                <p class="text-xs text-gray-500 mt-1">
                  {{ t.players.approvalHint }}
                </p>
              </UFormGroup>
            </div>
          </UCard>
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
          <!-- Profile Photo -->
          <UCard>
            <template #header>
              <h3 class="text-lg font-medium">{{ t.players.profilePhoto }}</h3>
            </template>

            <div class="text-center">
              <div class="mb-4 flex justify-center">
                <PlayerAvatar
                  :first-name="player.firstName"
                  :last-name="player.lastName"
                  :photo="player.photo"
                  size="xl"
                />
              </div>

              <div class="space-y-2">
                <!-- File input for photo upload -->
                <input
                  ref="photoInput"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  class="hidden"
                  @change="handlePhotoUpload"
                />

                <UButton
                  size="sm"
                  variant="outline"
                  :loading="uploadingPhoto"
                  :disabled="uploadingPhoto"
                  @click="$refs.photoInput?.click()"
                >
                  <UIcon name="i-heroicons-camera" class="mr-2" />
                  {{ player.photo ? t.players.changePhoto : t.players.uploadPhoto }}
                </UButton>

                <UButton
                  v-if="player.photo"
                  size="sm"
                  color="red"
                  variant="ghost"
                  :loading="uploadingPhoto"
                  :disabled="uploadingPhoto"
                  @click="removePhoto"
                >
                  <UIcon name="i-heroicons-trash" class="mr-2" />
                  {{ t.players.removePhoto }}
                </UButton>
              </div>

              <div class="mt-3 text-xs text-gray-500 space-y-1">
                <p>{{ t.players.photoFormats }}</p>
                <p>{{ t.players.photoMaxSize }}</p>
                <p v-if="uploadingPhoto" class="text-blue-600">{{ t.players.uploadingPhoto }}</p>
              </div>
            </div>
          </UCard>

          <!-- Quick Stats -->
          <UCard>
            <template #header>
              <h3 class="text-lg font-medium">{{ t.players.quickInfo }}</h3>
            </template>

            <div class="space-y-3 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-500">{{ t.players.ageLabel }}:</span>
                <span class="font-medium">
                  {{ player.dateOfBirth ? calculateAge(player.dateOfBirth) : t.players.notSet }}
                </span>
              </div>

              <div class="flex justify-between">
                <span class="text-gray-500">{{ t.players.statusLabel }}:</span>
                <UBadge :color="player.active ? 'green' : 'red'" variant="soft" size="xs">
                  {{ player.active ? t.players.active : t.players.inactiveStatus }}
                </UBadge>
              </div>

              <div class="flex justify-between">
                <span class="text-gray-500">{{ t.players.approvalLabel }}:</span>
                <UBadge :color="player.isApproved ? 'green' : 'yellow'" variant="soft" size="xs">
                  {{ player.isApproved ? t.players.approved : t.players.pending }}
                </UBadge>
              </div>

              <div class="flex justify-between">
                <span class="text-gray-500">{{ t.players.registeredLabel }}:</span>
                <span class="font-medium">{{ formatDate(player.createdAt) }}</span>
              </div>

              <div class="flex justify-between">
                <span class="text-gray-500">{{ t.players.lastUpdated }}:</span>
                <span class="font-medium">{{ formatDate(player.updatedAt) }}</span>
              </div>
            </div>
          </UCard>

          <!-- Quick Actions -->
          <UCard>
            <template #header>
              <h3 class="text-lg font-medium">{{ t.players.quickActions }}</h3>
            </template>

            <div class="space-y-2">
              <UButton block variant="outline" size="sm" disabled>
                <UIcon name="i-heroicons-calendar" class="mr-2" />
                {{ t.players.viewEventHistory }}
              </UButton>

              <UButton block variant="outline" size="sm" disabled>
                <UIcon name="i-heroicons-chart-bar" class="mr-2" />
                {{ t.players.attendanceReport }}
              </UButton>

              <UButton block variant="outline" size="sm" disabled>
                <UIcon name="i-heroicons-envelope" class="mr-2" />
                {{ t.players.sendMessage }}
              </UButton>
            </div>

            <p class="text-xs text-gray-500 mt-3">
              {{ t.players.futureFeatures }}
            </p>
          </UCard>
        </div>
      </div>
    </div>
  </div>
</template>
