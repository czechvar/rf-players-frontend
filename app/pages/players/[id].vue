<script setup lang="ts">
import { ref, onMounted } from 'vue'
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
    
    if (age < 6 || age > 12) {
      error.value = 'Player must be between 6-12 years old'
      return
    }
  }

  saving.value = true
  error.value = ''

  try {
    const updatedData = await request<PlayerDoc>(`/api/users/${playerId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        firstName: editForm.value.firstName.trim(),
        lastName: editForm.value.lastName.trim(),
        email: editForm.value.email.trim().toLowerCase(),
        dateOfBirth: editForm.value.dateOfBirth || undefined,
        phoneNumber: editForm.value.phoneNumber.trim() || undefined,
        active: editForm.value.active,
        isApproved: editForm.value.isApproved
      })
    })

    player.value = updatedData
    isEditing.value = false
    
    // Show success message briefly
    const successToast = useToast()
    successToast.add({
      title: 'Success',
      description: 'Player information updated successfully',
      color: 'green'
    })

  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to update player'
  } finally {
    saving.value = false
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
                <UInput v-model="editForm.email" type="email" :disabled="saving" />
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
          <UCard v-if="isEditing">
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
              
              <UButton size="sm" variant="outline" disabled>
                Upload Photo
              </UButton>
              <p class="text-xs text-gray-500 mt-2">Photo upload coming soon</p>
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