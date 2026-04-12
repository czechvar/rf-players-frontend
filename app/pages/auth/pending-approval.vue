<script setup lang="ts">
const { t } = useI18n()
</script>

<template>
  <div class="max-w-md mx-auto py-16 space-y-6 text-center">
    <UIcon name="i-heroicons-clock" class="w-16 h-16 text-yellow-500 mx-auto" />
    <h1 class="text-xl font-semibold">{{ t.auth.pendingApprovalTitle }}</h1>
    <p class="text-sm text-gray-600">{{ t.auth.pendingApprovalMessage }}</p>
    <p class="text-xs text-gray-400">{{ t.auth.pendingApprovalHint }}</p>
    <UButton to="/auth/login" block variant="soft" size="lg">
      {{ t.auth.goToLogin }}
    </UButton>
  </div>
</template>
