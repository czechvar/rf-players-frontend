<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useApi } from '../../composables/useApi'
import { useAuthStore } from '../../stores/auth'
import type { PlayerDoc } from '../../types'

// Check auth and role
const auth = useAuthStore()
if (!auth.user || !['admin', 'trainer'].includes(auth.user.role)) {
  throw createError({
    statusCode: 403,
    statusMessage: useI18n().t.errors.accessDenied
  })
}

const { t, tr } = useI18n()
const { request } = useApi()
const players = ref<PlayerDoc[]>([])
const loading = ref(true)
const error = ref('')

async function loadPlayers() {
  try {
    const data = await request<{ docs: PlayerDoc[] }>(`/api/users?where[role][equals]=player&limit=100&sort=firstName`)
    players.value = data.docs
  } catch (e) {
    error.value = e instanceof Error ? e.message : t.validation.loadFailed
  } finally {
    loading.value = false
  }
}

function calculateAge(dateOfBirth: string): number {
  const birth = new Date(dateOfBirth)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }

  return age
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString()
}

onMounted(loadPlayers)

useHead({
  title: t.players.title
})
</script>

<template>
  <div class="py-6 space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-semibold">{{ t.players.title }}</h1>
        <p class="text-gray-600 mt-1">{{ t.players.subtitle }}</p>
      </div>
      <UButton
        icon="i-heroicons-user-plus"
        to="/players/create"
      >
        {{ t.players.registerNew }}
      </UButton>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="flex justify-center py-10">
      <ULoader />
    </div>

    <!-- Error state -->
    <UAlert
      v-else-if="error"
      color="red"
      variant="subtle"
      :title="t.common.error"
      :description="error"
    />

    <!-- Players list -->
    <div v-else>
      <UEmptyState
        v-if="players.length === 0"
        icon="i-heroicons-users"
        :title="t.players.noPlayers"
        :description="t.players.noPlayersDesc"
      >
        <template #actions>
          <UButton icon="i-heroicons-user-plus" to="/players/create">
            {{ t.players.registerFirst }}
          </UButton>
        </template>
      </UEmptyState>

      <UCard v-else>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-medium">
              {{ tr(t.players.registeredPlayers, { count: players.length }) }}
            </h3>
          </div>
        </template>

        <div class="space-y-3">
          <div
            v-for="player in players"
            :key="player.id"
            class="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
            @click="navigateTo(`/players/${player.id}`)"
          >
            <div class="flex items-center gap-4">
              <!-- Avatar -->
              <PlayerAvatar
                :first-name="player.firstName"
                :last-name="player.lastName"
                :photo="player.photo"
                size="lg"
              />

              <!-- Player info -->
              <div>
                <div class="flex items-center gap-2">
                  <h4 class="font-medium">{{ player.firstName }} {{ player.lastName }}</h4>
                  <UBadge
                    v-if="!player.active"
                    color="red"
                    variant="soft"
                    size="xs"
                  >
                    {{ t.players.inactive }}
                  </UBadge>
                  <UBadge
                    v-if="!player.isApproved"
                    color="yellow"
                    variant="soft"
                    size="xs"
                  >
                    {{ t.players.pendingApproval }}
                  </UBadge>
                </div>
                <p class="text-sm text-gray-600">{{ player.email }}</p>
                <div class="flex items-center gap-4 text-xs text-gray-500 mt-1">
                  <span v-if="player.dateOfBirth">
                    {{ t.players.age }}: {{ calculateAge(player.dateOfBirth) }}
                  </span>
                  <span v-if="player.phoneNumber">
                    {{ t.players.phone }}: {{ player.phoneNumber }}
                  </span>
                  <span>
                    {{ t.players.registered }}: {{ formatDate(player.createdAt) }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-2" @click.stop>
              <UButton
                size="xs"
                variant="ghost"
                icon="i-heroicons-arrow-right"
                @click="navigateTo(`/players/${player.id}`)"
              >
                {{ t.players.viewDetails }}
              </UButton>
              <UDropdown :items="[
                [{
                  label: t.players.editPlayer,
                  icon: 'i-heroicons-pencil',
                  click: () => navigateTo(`/players/${player.id}`)
                }],
                [{
                  label: t.players.deactivate,
                  icon: 'i-heroicons-user-minus',
                  disabled: true
                }]
              ]">
                <UButton
                  size="xs"
                  variant="ghost"
                  icon="i-heroicons-ellipsis-horizontal"
                />
              </UDropdown>
            </div>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>
