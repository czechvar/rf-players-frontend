<script setup lang="ts">
import type { UserDoc, PendingUsersResponse } from '../../types'

const { request } = useApi()
const auth = useAuthStore()
const { t, tr } = useI18n()

// Guard: only admin/trainer
if (!auth.isTrainerOrAdmin) {
  navigateTo('/')
}

const pendingUsers = ref<UserDoc[]>([])
const loading = ref(true)
const error = ref('')
const actionLoading = ref<string | null>(null) // userId currently being processed
const toast = ref<{ message: string; color: string } | null>(null)

async function fetchPending() {
  loading.value = true
  error.value = ''
  try {
    const data = await request<PendingUsersResponse>('/api/auth/approve')
    pendingUsers.value = data.docs
  } catch (e: any) {
    error.value = e.message || t.errors.generic
  } finally {
    loading.value = false
  }
}

async function handleApproval(userId: string, approved: boolean) {
  actionLoading.value = userId
  try {
    await request('/api/auth/approve', {
      method: 'POST',
      body: JSON.stringify({ userId, approved }),
    })
    // Remove from list
    pendingUsers.value = pendingUsers.value.filter((u) => u.id !== userId)
    toast.value = {
      message: approved ? t.auth.userApproved : t.auth.userRejected,
      color: approved ? 'green' : 'red',
    }
    setTimeout(() => (toast.value = null), 3000)
  } catch (e: any) {
    error.value = e.message || t.auth.approvalFailed
  } finally {
    actionLoading.value = null
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('cs-CZ', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

onMounted(fetchPending)
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">{{ t.auth.approvalsTitle }}</h1>
      <p class="text-sm text-gray-500 mt-1">{{ t.auth.approvalsSubtitle }}</p>
    </div>

    <!-- Toast -->
    <UAlert v-if="toast" :color="toast.color" variant="soft" :description="toast.message" />
    <UAlert v-if="error" color="red" variant="subtle" :title="t.common.error" :description="error" />

    <!-- Loading -->
    <div v-if="loading" class="text-center py-12 text-gray-400">
      {{ t.common.loading }}
    </div>

    <!-- Empty state -->
    <div v-else-if="pendingUsers.length === 0" class="text-center py-12 space-y-2">
      <UIcon name="i-heroicons-check-badge" class="w-12 h-12 text-green-400 mx-auto" />
      <p class="text-gray-500 font-medium">{{ t.auth.noApprovals }}</p>
      <p class="text-xs text-gray-400">{{ t.auth.noApprovalsDesc }}</p>
    </div>

    <!-- Pending users list -->
    <div v-else class="space-y-3">
      <UCard v-for="user in pendingUsers" :key="user.id">
        <div class="flex items-center justify-between gap-4">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <p class="font-medium text-gray-900 truncate">
                {{ user.firstName }} {{ user.lastName }}
              </p>
              <UBadge :label="t.roles[user.role]" size="xs" variant="subtle" />
            </div>
            <p class="text-sm text-gray-500 truncate">{{ user.email }}</p>
            <p class="text-xs text-gray-400 mt-1">
              {{ tr(t.auth.registeredAt, { date: formatDate(user.createdAt) }) }}
            </p>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <UButton
              color="green"
              size="sm"
              :loading="actionLoading === user.id"
              @click="handleApproval(user.id, true)"
            >
              {{ t.auth.approveUser }}
            </UButton>
            <UButton
              color="red"
              variant="soft"
              size="sm"
              :loading="actionLoading === user.id"
              @click="handleApproval(user.id, false)"
            >
              {{ t.auth.rejectUser }}
            </UButton>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>
