import type { Config } from 'tailwindcss'

export default <Partial<Config>>{
  darkMode: 'class', // Controlled by Nuxt UI; light mode forced via plugin
  content: [
    './app/**/*.{vue,js,ts}',
    './components/**/*.{vue,js,ts}',
    './layouts/**/*.{vue,js,ts}',
    './pages/**/*.{vue,js,ts}',
    './plugins/**/*.{js,ts}',
    './nuxt.config.{js,ts}'
  ],
  theme: {
    extend: {
      container: {
        center: true,
        padding: '1rem'
      },
      fontFamily: {
        sans: ['system-ui', 'ui-sans-serif', 'Helvetica', 'Arial', 'sans-serif']
      }
    }
  }
}
