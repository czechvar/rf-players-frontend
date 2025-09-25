import { defineStore } from 'pinia'

interface AuthUser {
  id: string
  email: string
  role: 'admin' | 'trainer' | 'player' | 'parent'
  firstName?: string
  lastName?: string
}

const STORAGE_KEY = 'soccer-app-auth'

// Helper functions for localStorage operations
function saveToStorage(token: string, user: AuthUser | null) {
  if (process.client) {
    try {
      const data = { token, user }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      console.log('Auth saved to localStorage:', data)
    } catch (error) {
      console.error('Failed to save auth to localStorage:', error)
    }
  }
}

function loadFromStorage(): { token: string; user: AuthUser | null } {
  if (process.client) {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      console.log('Raw stored data:', stored)
      if (stored) {
        const data = JSON.parse(stored)
        console.log('Parsed stored data:', data)
        if (data.token && data.user) {
          return { token: data.token, user: data.user }
        }
      }
    } catch (error) {
      console.error('Failed to load auth from localStorage:', error)
      clearStorage()
    }
  }
  return { token: '', user: null }
}

function clearStorage() {
  if (process.client) {
    try {
      localStorage.removeItem(STORAGE_KEY)
      console.log('Auth cleared from localStorage')
    } catch (error) {
      console.error('Failed to clear auth from localStorage:', error)
    }
  }
}

export const useAuthStore = defineStore('auth', () => {
  // Initialize from localStorage
  const stored = loadFromStorage()
  
  // State
  const token = ref(stored.token)
  const user = ref(stored.user)

  // Getters
  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const isTrainerOrAdmin = computed(() => 
    user.value ? ['admin', 'trainer'].includes(user.value.role) : false
  )

  // Actions
  function setSession(newToken: string, newUser: AuthUser) {
    console.log('Setting session:', { newToken, newUser })
    token.value = newToken
    user.value = newUser
    saveToStorage(newToken, newUser)
  }

  function clear() {
    console.log('Clearing session')
    token.value = ''
    user.value = null
    clearStorage()
  }

  return {
    token: readonly(token),
    user: readonly(user),
    isAuthenticated,
    isTrainerOrAdmin,
    setSession,
    clear
  }
})