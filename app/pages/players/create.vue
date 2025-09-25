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
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  dateOfBirth: '',
  phoneNumber: ''
})

const loading = ref(false)
const error = ref('')
const success = ref(false)

async function createPlayer() {
  if (!form.value.firstName.trim()) {
    error.value = 'First name is required'
    return
  }
  if (!form.value.lastName.trim()) {
    error.value = 'Last name is required'
    return
  }
  if (!form.value.email.trim()) {
    error.value = 'Email is required'
    return
  }
  if (!form.value.password.trim() || form.value.password.length < 6) {
    error.value = 'Password must be at least 6 characters'
    return
  }
  if (!form.value.dateOfBirth) {
    error.value = 'Date of birth is required for players'
    return
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(form.value.email)) {
    error.value = 'Please enter a valid email address'
    return
  }

  // Validate age (must be between 6-12 years old based on requirements)
  const birthDate = new Date(form.value.dateOfBirth)
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

  loading.value = true
  error.value = ''

  try {
    await request('/api/users', {
      method: 'POST',
      body: JSON.stringify({
        firstName: form.value.firstName.trim(),
        lastName: form.value.lastName.trim(),
        email: form.value.email.trim().toLowerCase(),
        password: form.value.password,
        role: 'player',
        dateOfBirth: form.value.dateOfBirth,
        phoneNumber: form.value.phoneNumber.trim() || undefined,
        isApproved: true,
        active: true
      })
    })
    
    success.value = true
    // Reset form
    form.value = {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      dateOfBirth: '',
      phoneNumber: ''
    }
    
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to create player'
  } finally {
    loading.value = false
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
      <p class="text-gray-600">Add a new player to the team (ages 6-12).</p>
    </div>

    <UAlert 
      v-if="success" 
      color="green" 
      variant="subtle" 
      title="Player registered successfully!" 
      description="The new player account has been created and is ready to use."
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

        <UFormGroup label="Email Address" required>
          <UInput 
            v-model="form.email" 
            type="email"
            placeholder="player@example.com"
            :disabled="loading"
          />
        </UFormGroup>

        <UFormGroup label="Password" required hint="Minimum 6 characters">
          <UInput 
            v-model="form.password" 
            type="password"
            placeholder="Enter password"
            :disabled="loading"
          />
        </UFormGroup>

        <UFormGroup label="Date of Birth" required hint="Player must be 6-12 years old">
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
            Register Player
          </UButton>
        </div>
      </form>
    </UCard>
  </div>
</template>