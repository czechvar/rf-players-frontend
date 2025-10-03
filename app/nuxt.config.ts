<script setup lang="ts">
import { ref, computed } from 'vue'
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
  firstName: '',
  lastName: '',
  email: '', // Add custom email field
  dateOfBirth: '',
  phoneNumber: ''
})

const loading = ref(false)
const error = ref('')
const success = ref(false)
const generatedCredentials = ref({ email: '', password: '' })

// Add state for auto-registration feedback
const autoRegistrationCount = ref(0)

// Auto-generate email based on first and last name (fallback)
const generatedEmail = computed(() => {
  if (!form.value.firstName.trim() || !form.value.lastName.trim()) {
    return ''
  }
  
  const firstName = form.value.firstName.trim().toLowerCase()
  const lastName = form.value.lastName.trim().toLowerCase()
  
  // Remove special characters and spaces, replace with dots
  const cleanFirstName = firstName.replace(/[^a-z0-9]/g, '')
  const cleanLastName = lastName.replace(/[^a-z0-9]/g, '')
  
  return `${cleanFirstName}.${cleanLastName}@player-rf.cz`
})

// Final email to use (custom or generated)
const finalEmail = computed(() => {
  return form.value.email.trim() || generatedEmail.value
})

// Generate random password
function generatePassword() {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let password = ''
  for (let i = 0; i < 8; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length))
  }
  return password
}

async function createPlayer() {
  if (!form.value.firstName.trim()) {
    error.value = 'First name is required'
    return
  }
  if (!form.value.lastName.trim()) {
    error.value = 'Last name is required'
    return
  }

  // Validate email format if custom email is provided
  if (form.value.email.trim()) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(form.value.email.trim())) {
      error.value = 'Please enter a valid email address'
      return
    }
  }

  // Validate age if birth date is provided (must be between 6-12 years old based on requirements)
  if (form.value.dateOfBirth) {
    const birthDate = new Date(form.value.dateOfBirth)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age-- // Birthday hasn't occurred this year
    }
    
    // if (age < 6 || age > 12) {
    //   error.value = 'Player must be between 6-12 years old'
    //   return
    // }
  }

  loading.value = true
  error.value = ''

  // Generate email and password
  const email = finalEmail.value
  const password = generatePassword()

  try {
    // Create the player
    const newPlayer = await request('/api/users', {
      method: 'POST',
      body: JSON.stringify({
        firstName: form.value.firstName.trim(),
        lastName: form.value.lastName.trim(),
        email: email,
        password: password,
        role: 'player',
        dateOfBirth: form.value.dateOfBirth || undefined,
        phoneNumber: form.value.phoneNumber.trim() || undefined,
        isApproved: true,
        active: true
      })
    })

    // Auto-register for upcoming events
    try {
      await autoRegisterForUpcomingEvents(newPlayer.doc.id)
    } catch (registrationError) {
      console.warn('Failed to auto-register for some events:', registrationError)
      // Don't fail the entire operation if event registration fails
    }
    
    success.value = true
    generatedCredentials.value = { email, password }
    
    // Reset form
    form.value = {
      firstName: '',
      lastName: '',
      email: '',
      dateOfBirth: '',
      phoneNumber: ''
    }
    
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to create player'
  } finally {
    loading.value = false
  }
}

async function autoRegisterForUpcomingEvents(playerId: string) {
  try {
    // Get upcoming events (events with date >= today)
    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
    
    const eventsData = await request<{ docs: any[] }>(`/api/events?where[date][greater_than_equal]=${today}&sort=date&limit=50`)
    
    if (eventsData.docs && eventsData.docs.length > 0) {
      console.log(`Auto-registering player ${playerId} for ${eventsData.docs.length} upcoming events`)
      
      // Create attendance records for each upcoming event
      const registrationPromises = eventsData.docs.map(event => 
        request('/api/attendance', {
          method: 'POST',
          body: JSON.stringify({
            eventId: event.id,
            playerId: playerId,
            status: 'pending',
            notes: 'Auto-registered when player was created',
            updatedBy: auth.user?.id
          })
        }).catch(err => {
          console.error(`Failed to register for event ${event.name}:`, err)
          return null // Continue with other registrations
        })
      )
      
      const results = await Promise.allSettled(registrationPromises)
      
      // Count successful registrations
      const successCount = results.filter(result => 
        result.status === 'fulfilled' && result.value !== null
      ).length
      
      if (successCount > 0) {
        console.log(`Successfully registered player for ${successCount} upcoming events`)
        
        // Update success message to include event registration info
        autoRegistrationCount.value = successCount
      }
    }
  } catch (e) {
    console.error('Failed to auto-register for upcoming events:', e)
    throw e
  }
}

useHead({
  title: 'Register New Player'
})
</script>

<template>
  <div class="max-w-2xl mx-auto py-6">
    <div class="mb-6">
      <h1 class="text-2xl font-semibold mb-2">Register New Player</h1>
      <p class="text-gray-600">Add a new player to the team. Login credentials will be automatically generated.</p>
    </div>

    <UAlert 
      v-if="success" 
      color="green" 
      variant="subtle" 
      title="Player registered successfully!" 
      class="mb-6"
    >
      <template #description>
        <div class="space-y-2">
          <p>The new player account has been created with the following credentials:</p>
          <div class="bg-gray-50 p-3 rounded-md font-mono text-sm">
            <p><strong>Email:</strong> {{ generatedCredentials.email }}</p>
            <p><strong>Password:</strong> {{ generatedCredentials.password }}</p>
          </div>
          <div v-if="autoRegistrationCount > 0" class="mt-3 p-3 bg-blue-50 rounded-md">
            <div class="flex items-start gap-2">
              <UIcon name="i-heroicons-calendar-days" class="w-4 h-4 text-blue-500 mt-0.5" />
              <div class="text-sm text-blue-700">
                <p class="font-medium">Automatically registered for upcoming events</p>
                <p>The player has been registered for {{ autoRegistrationCount }} upcoming event{{ autoRegistrationCount === 1 ? '' : 's' }} with "pending" status.</p>
              </div>
            </div>
          </div>
          <p class="text-xs text-gray-600">Please share these credentials with the player or their parents.</p>
        </div>
      </template>
    </UAlert>
    
    <UAlert 
      v-if="error" 
      color="red" 
      variant="subtle" 
      title="Error" 
      :description="error"
      class="mb-6"
    />

    <UCard>
      <form @submit.prevent="createPlayer" class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <UFormGroup label="First Name" required>
            <UInput 
              v-model="form.firstName" 
              placeholder="First name"
              :disabled="loading"
            />
          </UFormGroup>

          <UFormGroup label="Last Name" required>
            <UInput 
              v-model="form.lastName" 
              placeholder="Last name"
              :disabled="loading"
            />
          </UFormGroup>
        </div>

        <!-- Editable email field -->
        <UFormGroup 
          label="Email Address" 
          :hint="form.email.trim() ? 'Using custom email address' : 'Leave empty to auto-generate from name'"
        >
          <UInput 
            v-model="form.email"
            type="email"
            :placeholder="generatedEmail || 'Enter email or leave empty to auto-generate'"
            :disabled="loading"
            icon="i-heroicons-at-symbol"
          />
        </UFormGroup>

        <!-- Show final email preview -->
        <div v-if="finalEmail" class="bg-gray-50 p-3 rounded-md">
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-eye" class="w-4 h-4 text-gray-500" />
            <span class="text-sm text-gray-600">Final email:</span>
            <span class="text-sm font-mono" :class="form.email.trim() ? 'text-blue-600 font-medium' : 'text-gray-800'">
              {{ finalEmail }}
            </span>
          </div>
        </div>

        <UFormGroup label="Date of Birth">
          <UInput 
            v-model="form.dateOfBirth" 
            type="date"
            :disabled="loading"
          />
        </UFormGroup>

        <UFormGroup label="Phone Number" hint="Optional">
          <UInput 
            v-model="form.phoneNumber" 
            type="tel"
            placeholder="(555) 123-4567"
            :disabled="loading"
          />
        </UFormGroup>

        <div class="bg-blue-50 p-4 rounded-lg">
          <div class="flex items-start gap-3">
            <UIcon name="i-heroicons-information-circle" class="w-5 h-5 text-blue-500 mt-0.5" />
            <div class="text-sm">
              <p class="font-medium text-blue-900">Automatic Setup</p>
              <div class="text-blue-700 mt-1 space-y-1">
                <p>• Enter a known email address or leave empty for auto-generation</p>
                <p>• A secure password will be automatically generated</p>
                <p>• Player will be registered for all upcoming events with "pending" status</p>
                <p>• Login credentials will be displayed after registration</p>
              </div>
            </div>
          </div>
        </div>

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
            :disabled="loading || !form.firstName.trim() || !form.lastName.trim()"
          >
            Register Player
          </UButton>
        </div>
      </form>
    </UCard>
  </div>
</template>