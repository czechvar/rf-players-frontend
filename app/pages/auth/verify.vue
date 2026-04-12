<script setup lang="ts">
import type { VerifyEmailResponse } from '../../types'

const route = useRoute()
const { request } = useApi()
const { t } = useI18n()

const loading = ref(true)
const success = ref(false)
const isApproved = ref(false)
const error = ref('')

onMounted(async () => {
  const token = route.query.token as string
  if (!token) {
    error.value = t.auth.verifyFailed
    loading.value = false
    return
  }

  try {
    const data = await request<VerifyEmailResponse>('/api/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    })
    success.value = true
    isApproved.value = data.isApproved
  } catch (e: any) {
    error.value = e.message || t.auth.verifyFailed
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="max-w-md mx-auto py-16 space-y-6 text-center">
    <!-- Loading -->
    <template v-if="loading">
      <UIcon name="i-heroicons-envelope-open" class="w-16 h-16 text-primary-500 mx-auto animate-pulse" />
      <h1 class="text-xl font-semibold">{{ t.auth.verifyTitle }}</h1>
      <p class="text-sm text-gray-500">{{ t.auth.verifySubtitle }}</p>
    </template>

    <!-- Success -->
    <template v-else-if="success">
      <UIcon name="i-heroicons-check-circle" class="w-16 h-16 text-green-500 mx-auto" />
      <h1 class="text-xl font-semibold">{{ t.auth.verifySuccess }}</h1>

      <template v-if="isApproved">
        <p class="text-sm text-gray-600">{{ t.auth.verifyRedirectApproved }}</p>
        <UButton to="/auth/login" block size="lg">{{ t.nav.login }}</UButton>
      </template>

      <template v-else>
        <p class="text-sm text-gray-600">{{ t.auth.verifyRedirectPending }}</p>
        <UButton to="/auth/pending-approval" block size="lg" variant="soft">
          {{ t.common.confirm }}
        </UButton>
      </template>
    </template>

    <!-- Error -->
    <template v-else>
      <UIcon name="i-heroicons-x-circle" class="w-16 h-16 text-red-500 mx-auto" />
      <h1 class="text-xl font-semibold">{{ t.auth.verifyTitle }}</h1>
      <UAlert color="red" variant="subtle" :description="error" />
      <UButton to="/auth/login" variant="link">{{ t.auth.backToLogin }}</UButton>
    </template>
  </div>
</template>
