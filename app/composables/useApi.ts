import { useAuthStore } from '../stores/auth'
// Proper Nuxt auto-import access
import { useRuntimeConfig } from '#imports'

// rely on Nuxt auto-import for useRuntimeConfig
export function useApi() {
  const config = useRuntimeConfig()
  const apiBase = config.public.apiBase
  const auth = useAuthStore()

  async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {})
    }
    
    // Add auth token if available
    if (auth.token) {
      headers['Authorization'] = `JWT ${auth.token}`
    }

    const res = await fetch(`${apiBase}${path}`, {
      ...options,
      headers,
      credentials: 'include'
    })

    // Handle 401 unauthorized - clear auth and redirect to login
    if (res.status === 401) {
      auth.clear()
      if (process.client) {
        await navigateTo('/auth/login')
      }
      throw new Error('Session expired. Please login again.')
    }

    if (!res.ok) {
      let message = `Request failed (${res.status})`
      try {
        const err = await res.json()
        message = err?.errors?.[0]?.message || err?.message || message
      } catch { /* ignore parse errors */ }
      throw new Error(message)
    }
    return res.json() as Promise<T>
  }

  return { request }
}