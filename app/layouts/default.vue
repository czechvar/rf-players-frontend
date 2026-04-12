<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center py-4">
          <!-- Logo -->
          <NuxtLink to="/" class="flex items-center gap-2 hover:opacity-80">
            <UIcon name="i-heroicons-trophy" class="w-8 h-8 text-primary-500" />
            <span class="font-bold text-xl text-gray-900">{{ t.common.appName }}</span>
          </NuxtLink>

          <!-- Navigation -->
          <nav v-if="auth.user" class="hidden md:flex space-x-8">
            <NuxtLink
              to="/events"
              class="text-gray-900 hover:text-primary-600 px-3 py-2 text-sm font-medium"
              :class="{ 'text-primary-600 border-b-2 border-primary-600': route.path === '/events' || route.path.startsWith('/events') }"
            >
              {{ t.nav.events }}
            </NuxtLink>
            <NuxtLink
              v-if="['admin', 'trainer'].includes(auth.user.role)"
              to="/players"
              class="text-gray-500 hover:text-primary-600 px-3 py-2 text-sm font-medium"
              :class="{ 'text-primary-600 border-b-2 border-primary-600': route.path.startsWith('/players') }"
            >
              {{ t.nav.players }}
            </NuxtLink>
            <NuxtLink
              v-if="['admin', 'trainer'].includes(auth.user.role)"
              to="/admin/approvals"
              class="text-gray-500 hover:text-primary-600 px-3 py-2 text-sm font-medium"
              :class="{ 'text-primary-600 border-b-2 border-primary-600': route.path.startsWith('/admin/approvals') }"
            >
              {{ t.nav.approvals }}
            </NuxtLink>
          </nav>

          <!-- User Menu -->
          <div class="flex items-center gap-4">
            <template v-if="auth.user">
              <div class="hidden sm:block text-right">
                <p class="text-sm font-medium text-gray-900">
                  {{ auth.user.firstName || auth.user.email }}
                </p>
                <UBadge
                  :label="auth.user.role"
                  size="xs"
                  variant="subtle"
                  class="uppercase"
                />
              </div>
              <UButton
                variant="ghost"
                @click="logout"
                icon="i-heroicons-arrow-right-on-rectangle"
                size="sm"
              >
                <span class="hidden sm:inline ml-2">{{ t.nav.logout }}</span>
              </UButton>
            </template>
            <template v-else>
              <UButton
                to="/auth/login"
                size="sm"
              >
                {{ t.nav.login }}
              </UButton>
              <UButton
                to="/auth/register"
                variant="outline"
                size="sm"
              >
                {{ t.nav.register }}
              </UButton>
            </template>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <slot />
    </main>

    <!-- Footer -->
    <footer class="bg-white border-t border-gray-200 mt-16">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div class="flex flex-col sm:flex-row justify-between items-center gap-4">
          <p class="text-sm text-gray-500">
            {{ tr(t.common.footer, { year: new Date().getFullYear() }) }}
          </p>
          <div class="flex items-center gap-2 text-sm text-gray-400">
            <span>{{ t.common.version }}</span>
            <UIcon name="i-heroicons-heart" class="w-4 h-4 text-red-400" />
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const auth = useAuthStore()
const { t, tr } = useI18n()

async function logout() {
  auth.clear()
  await navigateTo('/')
}
</script>