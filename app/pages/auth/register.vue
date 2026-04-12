<script setup lang="ts">
import type { RegisterResponse } from '../../types'

const { request } = useApi()
const { t } = useI18n()

const form = reactive({
  role: '' as 'player' | 'parent' | '',
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  dateOfBirth: '',
})
const error = ref('')
const loading = ref(false)

// After successful registration, show verification step
const registrationComplete = ref(false)
const verificationToken = ref('')

const roleOptions = computed(() => [
  { label: t.auth.selectRole, value: '', disabled: true },
  { label: t.auth.playerRole, value: 'player' },
  { label: t.auth.parentRole, value: 'parent' },
])

const showDateOfBirth = computed(() => form.role === 'player')

async function register() {
  error.value = ''
  loading.value = true
  try {
    const body: Record<string, string> = {
      email: form.email,
      password: form.password,
      role: form.role,
      firstName: form.firstName,
      lastName: form.lastName,
    }
    if (form.role === 'player' && form.dateOfBirth) {
      body.dateOfBirth = form.dateOfBirth
    }

    const data = await request<RegisterResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    })

    // Store the verification token for the "verify now" button
    verificationToken.value = data.verificationToken
    registrationComplete.value = true
  } catch (e: any) {
    error.value = e.message || t.auth.registerFailed
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="max-w-md mx-auto py-10 space-y-6">
    <!-- Registration complete → show verification step -->
    <template v-if="registrationComplete">
      <div class="text-center space-y-4">
        <UIcon name="i-heroicons-envelope" class="w-16 h-16 text-primary-500 mx-auto" />
        <h1 class="text-xl font-semibold">{{ t.auth.registrationCompleteTitle }}</h1>
        <p class="text-sm text-gray-600">{{ t.auth.registrationCompleteMessage }}</p>
        <p class="text-xs text-gray-400">{{ t.auth.registrationCompleteHint }}</p>
      </div>
      <UButton
        :to="`/auth/verify?token=${verificationToken}`"
        block
        size="lg"
      >
        {{ t.auth.verifyNow }}
      </UButton>
      <div class="text-center">
        <UButton to="/auth/login" variant="link" size="xs">{{ t.auth.backToLogin }}</UButton>
      </div>
    </template>

    <!-- Registration form -->
    <template v-else>
      <div class="text-center space-y-2">
        <h1 class="text-xl font-semibold">{{ t.auth.registerTitle }}</h1>
        <p class="text-xs text-gray-500">{{ t.auth.registerSubtitle }}</p>
      </div>

      <UAlert v-if="error" color="red" variant="subtle" :title="t.auth.registerFailed" :description="error" />

      <UForm :state="form" @submit.prevent="register" class="space-y-4">
        <div class="grid sm:grid-cols-2 gap-4">
          <UFormGroup :label="t.auth.firstName">
            <UInput v-model="form.firstName" required :placeholder="t.players.firstNamePlaceholder" />
          </UFormGroup>
          <UFormGroup :label="t.auth.lastName">
            <UInput v-model="form.lastName" required :placeholder="t.players.lastNamePlaceholder" />
          </UFormGroup>
        </div>

        <UFormGroup :label="t.auth.email">
          <UInput v-model="form.email" type="email" required :placeholder="t.auth.emailPlaceholder" />
        </UFormGroup>

        <UFormGroup :label="t.auth.password">
          <UInput v-model="form.password" type="password" required minlength="6" :placeholder="t.auth.passwordPlaceholder" />
        </UFormGroup>

        <UFormGroup :label="t.auth.role">
          <USelect v-model="form.role" :options="roleOptions" required />
        </UFormGroup>

        <UFormGroup v-if="showDateOfBirth" :label="t.auth.dateOfBirth">
          <UInput v-model="form.dateOfBirth" type="date" required />
        </UFormGroup>

        <UButton type="submit" block :loading="loading" :disabled="!form.role">
          {{ t.auth.registerButton }}
        </UButton>
      </UForm>

      <div class="text-center text-sm text-gray-500">
        {{ t.auth.alreadyHaveAccount }}
        <UButton to="/auth/login" variant="link" size="xs">{{ t.auth.backToLogin }}</UButton>
      </div>
    </template>
  </div>
</template>
