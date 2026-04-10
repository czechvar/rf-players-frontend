<script setup lang="ts">
import type { PlayerPhoto } from '../types'

interface Props {
  firstName: string
  lastName: string
  photo?: PlayerPhoto
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md'
})

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-sm',
  xl: 'w-32 h-32 text-2xl'
}

function getPhotoUrl(url: string): string {
  const config = useRuntimeConfig()
  const apiBase = config.public.apiBase
  if (url.startsWith('http')) return url
  if (url.startsWith('/')) return `${apiBase}${url}`
  return `${apiBase}/${url}`
}

const initials = computed(() =>
  `${props.firstName.charAt(0)}${props.lastName.charAt(0)}`
)
</script>

<template>
  <div :class="[sizeClasses[size], 'rounded-full overflow-hidden']">
    <img
      v-if="photo"
      :src="getPhotoUrl(photo.url)"
      :alt="`${firstName} ${lastName}`"
      class="w-full h-full object-cover"
    >
    <div
      v-else
      class="w-full h-full bg-blue-100 flex items-center justify-center"
    >
      <span :class="['font-medium text-blue-600', size === 'xl' ? 'text-2xl' : 'text-sm']">
        {{ initials }}
      </span>
    </div>
  </div>
</template>
