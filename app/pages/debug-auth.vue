<script setup lang="ts">
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()

// Debug info
const debugInfo = computed(() => {
  return {
    token: auth.token,
    user: auth.user,
    isAuthenticated: auth.isAuthenticated,
    isTrainerOrAdmin: auth.isTrainerOrAdmin,
    localStorage: process.client ? localStorage.getItem('soccer-app-auth') : 'SSR'
  }
})

function testLogin() {
  // Mock login for testing
  auth.setSession('test-token-123', {
    id: '1',
    email: 'test@example.com',
    role: 'trainer',
    firstName: 'Test',
    lastName: 'User'
  })
}

function testClear() {
  auth.clear()
}
</script>

<template>
  <div class="max-w-2xl mx-auto py-6 space-y-6">
    <h1 class="text-2xl font-semibold">Auth Debug Page</h1>
    
    <UCard>
      <template #header>
        <h2 class="text-lg font-medium">Current Auth State</h2>
      </template>
      
      <div class="space-y-3">
        <div>
          <strong>Token:</strong> 
          <code class="ml-2 text-xs bg-gray-100 px-2 py-1 rounded">
            {{ debugInfo.token || 'No token' }}
          </code>
        </div>
        
        <div>
          <strong>User:</strong>
          <pre class="mt-1 text-xs bg-gray-100 p-2 rounded overflow-auto">{{ JSON.stringify(debugInfo.user, null, 2) }}</pre>
        </div>
        
        <div>
          <strong>Is Authenticated:</strong> 
          <UBadge :color="debugInfo.isAuthenticated ? 'green' : 'red'">
            {{ debugInfo.isAuthenticated }}
          </UBadge>
        </div>
        
        <div>
          <strong>Is Trainer/Admin:</strong> 
          <UBadge :color="debugInfo.isTrainerOrAdmin ? 'green' : 'red'">
            {{ debugInfo.isTrainerOrAdmin }}
          </UBadge>
        </div>
        
        <div>
          <strong>LocalStorage:</strong>
          <pre class="mt-1 text-xs bg-gray-100 p-2 rounded overflow-auto">{{ debugInfo.localStorage }}</pre>
        </div>
      </div>
    </UCard>

    <UCard>
      <template #header>
        <h2 class="text-lg font-medium">Test Actions</h2>
      </template>
      
      <div class="flex gap-3">
        <UButton @click="testLogin" color="green">
          Test Login
        </UButton>
        
        <UButton @click="testClear" color="red" variant="outline">
          Clear Auth
        </UButton>
        
        <UButton @click="$router.go(0)" color="blue" variant="ghost">
          Refresh Page
        </UButton>
      </div>
    </UCard>

    <div class="text-center space-y-3">
      <div class="flex justify-center gap-3">
        <UButton to="/" variant="ghost">
          Back to Home
        </UButton>
        <UButton to="/players" variant="outline">
          View Players
        </UButton>
        <UButton to="/events/create" variant="outline">
          Create Event
        </UButton>
      </div>
      <p class="text-xs text-gray-500">Quick navigation for testing</p>
    </div>
  </div>
</template>