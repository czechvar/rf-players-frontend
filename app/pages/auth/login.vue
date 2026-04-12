<script setup lang="ts">
import type { LoginResponse } from '../../types'

const auth = useAuthStore()
const { request } = useApi()
const router = useRouter()
const { t } = useI18n()

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function login() {
  error.value = ''
  loading.value = true
  try {
    const data = await request<LoginResponse>('/api/users/login', {
      method: 'POST',
      body: JSON.stringify({ email: email.value, password: password.value }),
    })

    const user = data.user

    // Check email verification (only for player/parent — admin/trainer bypass)
    if (['player', 'parent'].includes(user.role)) {
      if (!user.emailVerified) {
        error.value = t.auth.emailNotVerified
        return
      }
      if (!user.isApproved) {
        error.value = t.auth.accountNotApproved
        return
      }
    }

    auth.setSession(data.token, user)
    router.push('/')
  } catch (e: any) {
    error.value = e.message || t.auth.loginFailed
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="max-w-sm mx-auto py-10 space-y-6">
    <div class="space-y-2 text-center">
      <h1 class="text-xl font-semibold">{{ t.auth.loginTitle }}</h1>
      <p class="text-xs text-gray-500">{{ t.auth.loginSubtitle }}</p>
    </div>
    <UAlert v-if="error" color="red" variant="subtle" :title="t.auth.loginFailed" :description="error" />
    <UForm :state="{}" @submit.prevent="login" class="space-y-4">
      <UFormGroup :label="t.auth.email">
        <UInput v-model="email" type="email" required :placeholder="t.auth.emailPlaceholder" />
      </UFormGroup>
      <UFormGroup :label="t.auth.password">
        <UInput v-model="password" type="password" required :placeholder="t.auth.passwordPlaceholder" />
      </UFormGroup>
      <UButton type="submit" block :loading="loading">{{ t.auth.loginButton }}</UButton>
    </UForm>
    <div class="text-center text-sm text-gray-500">
      {{ t.auth.needAccount }}
      <UButton to="/auth/register" variant="link" size="xs">{{ t.auth.createAccount }}</UButton>
    </div>
  </div>
</template>
