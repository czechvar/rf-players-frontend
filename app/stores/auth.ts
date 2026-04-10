import { defineStore } from 'pinia'
import type { AuthUser } from '../types'

const STORAGE_KEY = 'soccer-app-auth'

function saveToStorage(token: string, user: AuthUser | null) {
  if (process.client) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, user }))
    } catch (error) {
      console.error('Failed to save auth to localStorage:', error)
    }
  }
}

function loadFromStorage(): { token: string; user: AuthUser | null } {
  if (process.client) {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const data = JSON.parse(stored)
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
    } catch (error) {
      console.error('Failed to clear auth from localStorage:', error)
    }
  }
}

export const useAuthStore = defineStore('auth', () => {
  const stored = loadFromStorage()

  const token = ref(stored.token)
  const user = ref<AuthUser | null>(stored.user)

  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const isTrainerOrAdmin = computed(() =>
    user.value ? ['admin', 'trainer'].includes(user.value.role) : false
  )

  function setSession(newToken: string, newUser: AuthUser) {
    token.value = newToken
    user.value = newUser
    saveToStorage(newToken, newUser)
  }

  function clear() {
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
