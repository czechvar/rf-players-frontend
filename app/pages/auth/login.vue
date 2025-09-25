<script setup lang="ts">
const auth = useAuthStore()
const { request } = useApi()
const router = useRouter()

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function login() {
  error.value = ''
  loading.value = true
  try {
    const data = await request<{ token: string; user: any }>('/api/users/login', {
      method: 'POST',
      body: JSON.stringify({ email: email.value, password: password.value })
    })
  ;(auth as any).setSession(data.token, data.user)
    router.push('/')
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="max-w-sm mx-auto py-10 space-y-6">
    <div class="space-y-2 text-center">
      <h1 class="text-xl font-semibold">Login</h1>
      <p class="text-xs text-gray-500">Access your dashboard</p>
    </div>
    <UAlert v-if="error" color="red" variant="subtle" :title="'Login failed'" :description="error" />
    <UForm :state="{}" @submit.prevent="login" class="space-y-4">
      <UFormGroup label="Email">
        <UInput v-model="email" type="email" required />
      </UFormGroup>
      <UFormGroup label="Password">
        <UInput v-model="password" type="password" required />
      </UFormGroup>
      <UButton type="submit" block :loading="loading">Login</UButton>
    </UForm>
    <div class="text-center">
      <UButton to="/auth/register" variant="link" size="xs">Create account</UButton>
    </div>
  </div>
</template>