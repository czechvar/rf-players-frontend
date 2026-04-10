<script setup lang="ts">
const { request } = useApi()
const router = useRouter()
const { t } = useI18n()

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

const roleOptions = computed(() => [
  { label: t.roles.trainer, value: 'trainer' },
  { label: t.roles.admin, value: 'admin' }
])

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
      <h1 class="text-xl font-semibold">{{ t.auth.registerTitle }}</h1>
      <p class="text-xs text-gray-500">{{ t.auth.registerSubtitle }}</p>
    </div>
    <UAlert v-if="error" color="red" variant="subtle" :title="t.auth.registerFailed" :description="error" />
    <UAlert v-if="success" color="green" variant="soft" :title="t.common.success" :description="t.auth.registerSuccess" />
    <UForm :state="form" @submit.prevent="register" class="space-y-4">
      <div class="grid sm:grid-cols-2 gap-4">
        <UFormGroup :label="t.auth.firstName"><UInput v-model="form.firstName" required /></UFormGroup>
        <UFormGroup :label="t.auth.lastName"><UInput v-model="form.lastName" required /></UFormGroup>
      </div>
      <UFormGroup :label="t.auth.email"><UInput v-model="form.email" type="email" required /></UFormGroup>
      <UFormGroup :label="t.auth.password"><UInput v-model="form.password" type="password" required minlength="6" /></UFormGroup>
      <UFormGroup :label="t.auth.role">
        <USelect v-model="form.role" :options="roleOptions" />
      </UFormGroup>
      <UButton type="submit" block :loading="loading">{{ t.auth.registerButton }}</UButton>
    </UForm>
    <div class="text-center">
      <UButton to="/auth/login" variant="link" size="xs">{{ t.auth.backToLogin }}</UButton>
    </div>
  </div>
</template>