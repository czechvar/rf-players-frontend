// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  // Run frontend on port 4000 so that Payload backend can stay on 3000
  devServer: {
    port: 4000,
    host: '0.0.0.0'
  },
  modules: ['@pinia/nuxt', '@nuxt/ui'],
  // @ts-ignore - module augmentation for @nuxt/ui may not be picked up in this context
  ui: {
    global: true,
    icons: 'all'
  },
  imports: {
    dirs: []
  },
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:3000',
      graphqlEndpoint: process.env.NUXT_PUBLIC_GRAPHQL_ENDPOINT || 'http://localhost:3000/api/graphql'
    }
  }
})
