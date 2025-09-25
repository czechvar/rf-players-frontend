<script setup lang="ts">
const { request } = useApi()
const router = useRouter()

const form = reactive({
  role: 'trainer',
  email: '',
  password: '',
  firstName: '',
  lastName: ''
})
const error = ref('')
const loading = ref(false)
const success = ref(false)
const roleOptions = [
  { label: 'Trainer', value: 'trainer' },
  { label: 'Admin', value: 'admin' }
]

async function register() {
  error.value = ''
  success.value = false
  loading.value = true
  try {
    await request('/api/users', {
      method: 'POST',
      body: JSON.stringify({
        email: form.email,
        password: form.password,
        role: form.role,
        firstName: form.firstName,
        lastName: form.lastName,
        isApproved: true
      })
    })
    success.value = true
    setTimeout(() => router.push('/auth/login'), 1200)
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="max-w-md mx-auto py-10 space-y-6">
    <div class="text-center space-y-2">
      <h1 class="text-xl font-semibold">Create Account</h1>
      <p class="text-xs text-gray-500">Admin or Trainer</p>
    </div>
    <UAlert v-if="error" color="red" variant="subtle" :title="'Registration failed'" :description="error" />
    <UAlert v-if="success" color="green" variant="soft" title="Success" description="Account created! Redirecting..." />
    <UForm :state="form" @submit.prevent="register" class="space-y-4">
      <div class="grid sm:grid-cols-2 gap-4">
        <UFormGroup label="First Name"><UInput v-model="form.firstName" required /></UFormGroup>
        <UFormGroup label="Last Name"><UInput v-model="form.lastName" required /></UFormGroup>
      </div>
      <UFormGroup label="Email"><UInput v-model="form.email" type="email" required /></UFormGroup>
      <UFormGroup label="Password"><UInput v-model="form.password" type="password" required minlength="6" /></UFormGroup>
      <UFormGroup label="Role">
        <USelect v-model="form.role" :options="roleOptions" />
      </UFormGroup>
      <UButton type="submit" block :loading="loading">Register</UButton>
    </UForm>
    <div class="text-center">
      <UButton to="/auth/login" variant="link" size="xs">Back to login</UButton>
    </div>
  </div>
</template>