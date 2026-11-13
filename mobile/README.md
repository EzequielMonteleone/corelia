# Corelia Mobile

Expo/React Native client for Corelia, the building-management platform. It mirrors the web dashboard with a mobile-first, tab-based experience.

## Features

- **Inicio** — role-aware dashboard with building KPIs, recent periods, claims, and documents.
- **Expensas** — expense periods, detail breakdown, payments, and CSV/PDF exports.
- **Edificios** — building list/detail, units, amenity catalog, and amenity settings.
- **Menú** — every remaining option: users, roles, household records, claims, documents, chat, notifications, amenities, and profile.
- **Auth** — JWT persisted in `expo-secure-store`, profile in AsyncStorage, guarded routes via Expo Router.
- **Data layer** — TanStack Query with a 60s stale time, AppState focus refetch, and typed Axios APIs.
- **Notifications** — polling, unread badge, and deep links into the related building screen.

## Requirements

- Node.js 20+
- Yarn 1.x (the repository includes `yarn.lock`)
- Xcode or Android Studio for native builds, or Expo Go for the bundled modules

## Setup

```bash
yarn install
cp .env.example .env
yarn start
```

Environment variables:

| Variable | Default | Description |
| --- | --- | --- |
| `EXPO_PUBLIC_API_URL` | `http://localhost:3000` | Corelia API base URL |
| `EXPO_PUBLIC_APP_TIMEZONE` | `America/Argentina/Buenos_Aires` | Timezone for amenity slots and date keys |

In development, Android automatically replaces `localhost`/`127.0.0.1` with `10.0.2.2`, the emulator alias for the host machine. On a physical device, set `EXPO_PUBLIC_API_URL` to your machine's LAN IP. Production builds use the URL as-is.

## Scripts

| Command | Description |
| --- | --- |
| `yarn start` | Start the Expo dev server |
| `yarn ios` / `yarn android` | Run a development build on a device |
| `yarn lint` | ESLint via `expo lint` |
| `yarn typecheck` | TypeScript without emitting files |
| `yarn test` | Jest test suite |

## Architecture

```
src/
  app/           Expo Router routes (tabs, detail screens, auth guard)
  api/           Axios client, endpoint modules, query keys
  hooks/         Query/mutation hooks and shared app hooks
  store/         Zustand stores (auth, selected building, toasts)
  components/
    ui/          Design-system primitives (Button, Input, ModalSheet, ...)
    layout/      App shell pieces (Screen, AppHeader, BuildingSwitcher)
    domain/      Feature components (claims, expenses, buildings, users)
  lib/           Formatting, API errors, timezone math, exports, access rules
  schemas/       Zod validation for forms and payloads
  theme/         Dark color palette, spacing, radii, typography
  types/         Shared API types
```

Responsibilities stay separated: screens compose domain components, components never call Axios directly, and all network access goes through `api/` + query hooks. Forms validate locally with Zod before invoking mutations.

## Access rules

Global roles are `SUPERADMIN` and `USER`; building roles are `Admin`, `Owner`, and `Roomer`. The same sidebar rules as the web app apply:

- Buildings: Admin, Owner
- Users: Admin
- Expenses, amenities, household, claims, documents: Admin, Owner, Roomer
- Roles: SUPERADMIN
- Dashboard, chat, profile, notifications: every signed-in user

`RequireAccess` protects screens, and the Buildings tab is hidden when the user has no access.

## Testing

Jest with `jest-expo` and React Native Testing Library covers the auth store, access rules, formatting, timezone helpers, API error mapping, form validation, and query hooks.

```bash
yarn test
```

Tests are colocated under `__tests__/` folders. Async RNTL v14 APIs (`render`, `fireEvent`, `renderHook`) must be awaited.

## Debugging with Reactotron

Reactotron is wired up for development builds (`__DEV__`) only; production bundles do not initialize it.

1. Download and open the [Reactotron desktop app](https://github.com/infinitered/reactotron/releases).
2. Start the app with `yarn start` and open it on a simulator or device.
3. On Android, forward the port first:

   ```bash
   adb reverse tcp:9090 tcp:9090
   ```

The integration includes network request inspection, console logs, global errors, AsyncStorage events (excluding the auth payload), and a TanStack Query panel for inspecting the cache, mutations, and invalidating queries.

## Native builds

`ios/` and `android/` are generated. Do not edit them by hand; configure native behavior in `app.json` and config plugins. After adding a library with native code, create a development build:

```bash
npx expo run:ios
# or
eas build --profile development
```
