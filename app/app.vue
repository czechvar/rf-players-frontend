<script setup>
// Force light mode on app initialization
const colorMode = useColorMode()
colorMode.preference = 'light'

// Remove dark class from document if it exists
onMounted(() => {
  document.documentElement.classList.remove('dark')
  document.documentElement.classList.add('light')
})
</script>

<template>
  <div class="light">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<style>
/* Force light mode styles globally */
html {
  color-scheme: light only;
}

html.dark,
html[data-theme="dark"] {
  color-scheme: light only !important;
}

/* Override any dark mode CSS variables if they exist */
:root {
  --color-mode: 'light';
}
</style>
