<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
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

const route = useRoute()
const { request } = useApi()

interface PlayerDoc {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
  dateOfBirth?: string
  phoneNumber?: string
  active: boolean
  isApproved: boolean
  photo?: {
    id: string
    url: string
    filename: string
  }
  createdAt: string
  updatedAt: string
}

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
    error.value = e instanceof Error ? e.message : 'Failed to load player'
  } finally {
    loading.value = false
  }
}

async function savePlayer() {
  if (!player.value) return

  // Validate required fields
  if (!editForm.value.firstName.trim()) {
    error.value = 'First name is required'
    return
  }
  if (!editForm.value.lastName.trim()) {
    error.value = 'Last name is required'
    return
  }
  if (!editForm.value.email.trim()) {
    error.value = 'Email is required'
    return
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(editForm.value.email)) {
    error.value = 'Please enter a valid email address'
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
      title: 'Success',
      description: 'Player information updated successfully',
      color: 'green'
    })

  } catch (e) {
    // Handle different types of errors
    if (e instanceof Error) {
      if (e.message.includes('403') || e.message.includes('Forbidden') || e.message.includes('not allowed')) {
        error.value = 'You do not have permission to modify this player. Contact an administrator.'
      } else if (e.message.includes('400') || e.message.includes('validation')) {
        error.value = 'Invalid data provided. Please check your inputs.'
      } else if (e.message.includes('409') || e.message.includes('conflict')) {
        error.value = 'Email address is already in use by another user.'
      } else {
        error.value = e.message
      }
    } else {
      error.value = 'Failed to update player. Please try again.'
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
      throw new Error('Authentication required. Please log in again.')
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
      title: 'Success',
      description: 'Profile photo updated successfully',
      color: 'green'
    })

  } catch (e) {
    console.error('Photo upload error:', e)
    
    // Handle specific error cases
    if (e instanceof Error) {
      const errorMessage = e.message.toLowerCase()
      
      if (errorMessage.includes('403') || errorMessage.includes('forbidden')) {
        error.value = 'Access denied. You may not have permission to upload photos or your session has expired. Please refresh the page and try again.'
      } else if (errorMessage.includes('401') || errorMessage.includes('unauthorized')) {
        error.value = 'Authentication expired. Please refresh the page and log in again.'
      } else if (errorMessage.includes('413') || errorMessage.includes('too large')) {
        error.value = 'File is too large. Please choose a smaller image (max 2MB).'
      } else if (errorMessage.includes('415') || errorMessage.includes('unsupported')) {
        error.value = 'Unsupported file type. Please upload a JPEG, PNG, or WebP image.'
      } else if (errorMessage.includes('400')) {
        error.value = 'Invalid file format or corrupted file. Please try a different image.'
      } else if (errorMessage.includes('cors')) {
        error.value = 'Network error. Please check your connection and try again.'
      } else {
        error.value = `Upload failed: ${e.message}`
      }
    } else {
      error.value = 'Failed to upload photo. Please try again.'
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
    error.value = 'Please upload a JPEG, PNG, or WebP image.'
    return
  }

  // Validate file size (2MB max to be safe)
  const maxSize = 2 * 1024 * 1024 // 2MB in bytes
  if (file.size > maxSize) {
    error.value = 'File is too large. Please choose an image smaller than 2MB.'
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
      title: 'Success',
      description: 'Profile photo removed successfully',
      color: 'green'
    })

  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to remove photo'
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
      ? `${player.value.firstName} ${player.value.lastName} - Player Details`
      : 'Player Details'
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
      title="Error" 
      :description="error"
    >
      <template #actions>
        <UButton @click="navigateTo('/players')" color="gray" variant="ghost" size="xs">
          Back to Players
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
                Inactive
              </UBadge>
              <UBadge v-if="!player.isApproved" color="yellow" variant="soft">
                Pending Approval
              </UBadge>
            </div>
            <p class="text-gray-600">Player Profile</p>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <UButton 
            v-if="!isEditing" 
            icon="i-heroicons-pencil" 
            @click="isEditing = true"
          >
            Edit Player
          </UButton>
          <template v-else>
            <UButton 
              color="gray" 
              variant="ghost"
              @click="cancelEdit"
              :disabled="saving"
            >
              Cancel
            </UButton>
            <UButton 
              icon="i-heroicons-check" 
              @click="savePlayer"
              :loading="saving"
              :disabled="saving"
            >
              Save Changes
            </UButton>
          </template>
        </div>
      </div>

      <!-- Error message during editing -->
      <UAlert 
        v-if="error && player" 
        color="red" 
        variant="subtle" 
        title="Error" 
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
              <h3 class="text-lg font-medium">Basic Information</h3>
            </template>

            <div v-if="!isEditing" class="space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="text-sm font-medium text-gray-500">First Name</label>
                  <p class="mt-1 font-medium">{{ player.firstName }}</p>
                </div>
                <div>
                  <label class="text-sm font-medium text-gray-500">Last Name</label>
                  <p class="mt-1 font-medium">{{ player.lastName }}</p>
                </div>
              </div>
              
              <div>
                <label class="text-sm font-medium text-gray-500">Email Address</label>
                <p class="mt-1 font-medium">{{ player.email }}</p>
              </div>
              
              <div v-if="player.dateOfBirth">
                <label class="text-sm font-medium text-gray-500">Date of Birth</label>
                <p class="mt-1 font-medium">
                  {{ formatDate(player.dateOfBirth) }}
                  <span class="text-gray-500 ml-2">(Age {{ calculateAge(player.dateOfBirth) }})</span>
                </p>
              </div>
              
              <div v-if="player.phoneNumber">
                <label class="text-sm font-medium text-gray-500">Phone Number</label>
                <p class="mt-1 font-medium">{{ player.phoneNumber }}</p>
              </div>
            </div>

            <!-- Edit form -->
            <div v-else class="space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <UFormGroup label="First Name" required>
                  <UInput v-model="editForm.firstName" :disabled="saving" />
                </UFormGroup>
                <UFormGroup label="Last Name" required>
                  <UInput v-model="editForm.lastName" :disabled="saving" />
                </UFormGroup>
              </div>
              
              <UFormGroup label="Email Address" required>
                <UInput 
                  v-model="editForm.email" 
                  type="email" 
                  :disabled="saving || !canEditSensitiveFields" 
                />
                <p v-if="!canEditSensitiveFields" class="text-xs text-gray-500 mt-1">
                  Only administrators can modify email addresses
                </p>
              </UFormGroup>
              
              <UFormGroup label="Date of Birth">
                <UInput v-model="editForm.dateOfBirth" type="date" :disabled="saving" />
              </UFormGroup>
              
              <UFormGroup label="Phone Number" hint="Optional">
                <UInput v-model="editForm.phoneNumber" type="tel" :disabled="saving" />
              </UFormGroup>
            </div>
          </UCard>

          <!-- Status & Settings -->
          <UCard v-if="isEditing && canEditSensitiveFields">
            <template #header>
              <h3 class="text-lg font-medium">Status & Settings</h3>
            </template>

            <div class="space-y-4">
              <UFormGroup label="Account Status">
                <UCheckbox 
                  v-model="editForm.active" 
                  label="Active Player" 
                  :disabled="saving"
                />
                <p class="text-xs text-gray-500 mt-1">
                  Inactive players cannot participate in events
                </p>
              </UFormGroup>
              
              <UFormGroup label="Approval Status">
                <UCheckbox 
                  v-model="editForm.isApproved" 
                  label="Approved for Participation" 
                  :disabled="saving"
                />
                <p class="text-xs text-gray-500 mt-1">
                  Unapproved players need trainer/admin approval
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
              <h3 class="text-lg font-medium">Profile Photo</h3>
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
                  {{ player.photo ? 'Change Photo' : 'Upload Photo' }}
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
                  Remove Photo
                </UButton>
              </div>
              
              <div class="mt-3 text-xs text-gray-500 space-y-1">
                <p>Supported formats: JPEG, PNG, WebP</p>
                <p>Maximum file size: 2MB</p>
                <p v-if="uploadingPhoto" class="text-blue-600">Uploading photo...</p>
              </div>
            </div>
          </UCard>

          <!-- Quick Stats -->
          <UCard>
            <template #header>
              <h3 class="text-lg font-medium">Quick Info</h3>
            </template>
            
            <div class="space-y-3 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-500">Age:</span>
                <span class="font-medium">
                  {{ player.dateOfBirth ? calculateAge(player.dateOfBirth) : 'Not set' }}
                </span>
              </div>
              
              <div class="flex justify-between">
                <span class="text-gray-500">Status:</span>
                <UBadge :color="player.active ? 'green' : 'red'" variant="soft" size="xs">
                  {{ player.active ? 'Active' : 'Inactive' }}
                </UBadge>
              </div>
              
              <div class="flex justify-between">
                <span class="text-gray-500">Approval:</span>
                <UBadge :color="player.isApproved ? 'green' : 'yellow'" variant="soft" size="xs">
                  {{ player.isApproved ? 'Approved' : 'Pending' }}
                </UBadge>
              </div>
              
              <div class="flex justify-between">
                <span class="text-gray-500">Registered:</span>
                <span class="font-medium">{{ formatDate(player.createdAt) }}</span>
              </div>
              
              <div class="flex justify-between">
                <span class="text-gray-500">Last Updated:</span>
                <span class="font-medium">{{ formatDate(player.updatedAt) }}</span>
              </div>
            </div>
          </UCard>

          <!-- Quick Actions -->
          <UCard>
            <template #header>
              <h3 class="text-lg font-medium">Quick Actions</h3>
            </template>
            
            <div class="space-y-2">
              <UButton block variant="outline" size="sm" disabled>
                <UIcon name="i-heroicons-calendar" class="mr-2" />
                View Event History
              </UButton>
              
              <UButton block variant="outline" size="sm" disabled>
                <UIcon name="i-heroicons-chart-bar" class="mr-2" />
                Attendance Report
              </UButton>
              
              <UButton block variant="outline" size="sm" disabled>
                <UIcon name="i-heroicons-envelope" class="mr-2" />
                Send Message
              </UButton>
            </div>
            
            <p class="text-xs text-gray-500 mt-3">
              These features will be available in future updates
            </p>
          </UCard>
        </div>
      </div>
    </div>
  </div>
</template>