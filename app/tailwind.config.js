/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{vue,js,ts,jsx,tsx}',
    './pages/**/*.{vue,js,ts,jsx,tsx}',
    './components/**/*.{vue,js,ts,jsx,tsx}',
    './layouts/**/*.{vue,js,ts,jsx,tsx}',
    './plugins/**/*.{js,ts}',
    './nuxt.config.{js,ts}'
  ],
  darkMode: false, // Disable dark mode entirely
  theme: {
    extend: {
      colors: {
        // Custom colors
        primary: '#2563eb',
        'primary-dark': '#1e40af',
        secondary: '#64748b',
        'secondary-dark': '#475569',
        accent: '#f59e0b',
        'accent-dark': '#b45309',
        error: '#dc2626',
        success: '#15803d',
        warning: '#d97706',
        info: '#2563eb'
      },
      spacing: {
        // Custom spacing
        '18': '4.5rem',
        '22': '5.5rem',
        '26': '6.5rem',
        '30': '7.5rem'
      },
      borderRadius: {
        // Custom border radius
        '4xl': '2rem',
        '5xl': '2.5rem'
      },
      boxShadow: {
        // Custom box shadows
        'outline-primary': '0 0 0 3px rgba(37, 99, 235, 0.5)',
        'outline-secondary': '0 0 0 3px rgba(100, 116, 139, 0.5)'
      }
    }
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio')
  ]
}