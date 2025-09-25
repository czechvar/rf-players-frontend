<template>
  <UApp>
    <div class="min-h-screen flex flex-col">
      <UHeader>
        <template #left>
          <NuxtLink to="/" class="font-semibold">RF Players</NuxtLink>
        </template>
        <template #right>
          <div class="flex items-center gap-3">
            <template v-if="auth.user">
              <span class="text-sm">Hi {{ auth.user.firstName || auth.user.email }}</span>
              <UButton color="gray" size="xs" variant="soft" @click="logout">Logout</UButton>
            </template>
            <template v-else>
              <UButton to="/auth/login" color="primary" size="xs" variant="solid">Login</UButton>
              <UButton to="/auth/register" color="gray" size="xs" variant="soft">Register</UButton>
            </template>
          </div>
        </template>
      </UHeader>
      <UMain class="flex-1">
        <UContainer>
          <slot />
        </UContainer>
      </UMain>
      <UFooter class="mt-8 text-center text-xs">&copy; {{ new Date().getFullYear() }} RF Players</UFooter>
    </div>
  </UApp>
</template>

<script setup lang="ts">
import { useAuthStore } from '../stores/auth'
const auth = useAuthStore()
function logout() {
  // Pinia action defined in store
  ;(auth as any).clear()
}
</script>