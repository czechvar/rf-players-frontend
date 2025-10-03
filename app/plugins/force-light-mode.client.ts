export default defineNuxtPlugin(() => {
  // Force light mode immediately on client-side
  if (process.client) {
    // Remove dark mode from localStorage
    localStorage.removeItem('nuxt-color-mode')
    localStorage.setItem('nuxt-color-mode', 'light')
    
    // Remove dark classes from document
    document.documentElement.classList.remove('dark')
    document.documentElement.classList.add('light')
    
    // Set color scheme
    document.documentElement.style.colorScheme = 'light'
    
    // Watch for any attempts to add dark mode back
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          const target = mutation.target as HTMLElement
          if (target.classList.contains('dark')) {
            target.classList.remove('dark')
            target.classList.add('light')
          }
        }
      })
    })
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })
  }
})
