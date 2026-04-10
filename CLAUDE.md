# Frontend — Nuxt 4 (Vue 3)

Nuxt 4.1.2 with Nuxt UI 2.18.7, Tailwind CSS, Pinia for state.

## Running

```bash
pnpm install
pnpm dev          # http://localhost:4000
```

## Key Constraints

- **Light mode only** — dark mode is disabled globally (nuxt.config, tailwind.config, force-light-mode plugin). Never add dark: variants.
- All API calls go through `app/composables/useApi.ts` — never use raw $fetch for backend calls.
- JWT token stored in `payload-token` cookie, injected automatically by useApi.

## Project Structure

```
app/
  pages/           # File-based routing
  components/      # Vue components
  composables/     # useApi, etc.
  stores/          # Pinia stores (auth.ts)
  layouts/         # default.vue with nav
  plugins/         # force-light-mode
```

Note: There are some legacy directories at root level (`components/`, `pages/`, `plugins/`) from older structure. The active code is under `app/`.

## Pages

- `/` — Login form (unauthenticated) or dashboard (authenticated)
- `/auth/login`, `/auth/register` — Auth pages
- `/events` — List events (formatted dates, no seconds)
- `/events/create` — Create event form
- `/events/[id]` — Event detail + attendance management
- `/players` — List players
- `/players/create` — Create player (auto-email, auto-password, auto-registration)
- `/players/[id]` — Player profile editor

## Auth Flow

Pinia store (`stores/auth.ts`) manages user + token. On login, token goes to cookie, user to store. On 401 from any API call, auto-logout and redirect.

## UI Patterns

- Nuxt UI components (`UCard`, `UButton`, `UTable`, `UModal`, etc.)
- Role-based rendering: `v-if="['admin', 'trainer'].includes(auth.user?.role)"`
- Attendance buttons: OK (green), NO (red), Excused (yellow)
- Toast notifications for user feedback
- Loading states on all async operations

## Player Creation

Auto-generates email as `firstname.lastname@player-rf.cz` with option to override. Auto-generates 8-char password. After creation, auto-registers player for all upcoming events.

## Environment

NUXT_PUBLIC_API_BASE defaults to http://localhost:3000.
