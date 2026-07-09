# Qaryz Project Context

## Environment
- Language: TypeScript 6 / React 19
- Runtime: Node.js (Vite 8)
- Build: `npx tsc -b && npx vite build` (passes clean, only pre-existing warnings)
- PWA: Vite PWA plugin (service worker, manifest)

## Completed Fixes — Mission Complete ✅

### M1: Payment & Shared Debt Architecture
- ✅ Migration `006_shared_debt_paid.sql` — `ALTER TABLE shared_debts ADD COLUMN paid_amount`
- ✅ `increment_shared_debt_paid` RPC function (SECURITY DEFINER, safe concurrent update)
- ✅ `paidAmount` added to `SharedDebt` type in `friend.ts`
- ✅ `addPayment` — calls RPC for shared debts on ANY payment (not just full), updates local state
- ✅ `syncSharedDebts` — removed dedup filter (`!existingIds.has()`), uses `debtMap` approach, reads `paid_amount` from DB
- ✅ `syncFromSupabase` — preserves local shared-debt payments, merges with server payments
- ✅ `settleDebt` — checks `paid_amount >= amount` before settling shared debts, updates local `sharedDebts`
- ✅ `removeDebt` — removes local `sharedDebts` entry to prevent reappearance
- ✅ `getRemainingAmount` / `getPersonBalance` — both account for `paidAmount` from shared debts

### M2: Friend Cards with Real Data
- ✅ `useFriendsWithBalances` — returns `{ friends, totalFriends, friendsWithDebts, friendsWithoutDebts }`
- ✅ `FriendCard` — uses `activeDebtsCount`, shows balance (green/red), Instagram-style avatar ring
- ✅ `FriendsPage` — summary bar (total + with debts), search, proper `FriendCard` props

### M3: Sync & Pull-to-Refresh Fix
- ✅ `syncCoordinator` — `coordinatedSync()` deduplicates concurrent calls per key
- ✅ `debtStore.syncFromSupabase` — wrapped with coordinator
- ✅ `friendStore.syncFromSupabase` — wrapped with coordinator
- ✅ Toast notifications on sync errors (already present in debtStore)
- ✅ PullToRefresh — content flash fixed by atomic debt updates

### M4: Critical Bug Fixes
- ✅ RLS policy in `003_groups.sql` — proper table aliases (no `group_id = group_id`)
- ✅ `authStore.onAuthStateChange` — awaits `syncProfile()` to prevent white screen
- ✅ Theme default — already `"dark"` in `uiStore`
- ✅ Pluralization — `PersonCard` uses `pluralize` from `@/lib/formatters` with full forms

### M5: Final Verification
- ✅ `tsc -b` — 0 errors
- ✅ `vite build` — passes (pre-existing warnings only)

## Key Files Modified (Earlier)
- `supabase/migrations/006_shared_debt_paid.sql` — new migration
- `src/types/friend.ts` — added `paidAmount` to SharedDebt
- `src/stores/debtStore.ts` — major rewrites: addPayment, syncSharedDebts, syncFromSupabase, settleDebt, removeDebt, getRemainingAmount, getPersonBalance
- `src/stores/friendStore.ts` — coordinated sync wrapper
- `src/stores/authStore.ts` — await syncProfile in onAuthStateChange
- `src/hooks/useFriendsWithBalances.ts` — rewritten with enriched type + grouping
- `src/components/friends/FriendCard.tsx` — fixed `debtCount` → `activeDebtsCount`
- `src/components/debts/PersonCard.tsx` — fixed pluralization
- `src/pages/FriendsPage.tsx` — updated to match hook API
- `src/lib/syncCoordinator.ts` — new file
- `src/App.tsx` — restored missing import

---

## Current Status: Push-уведомления (iOS + Free) — 100% COMPLETE ✅

### M1: Vite Config + Service Worker
- `vite.config.ts`: switched to `injectManifest`, `id: "/"`, `start_url: "/"` (iOS 16.4+ requirement)
- `src/sw.ts`: custom SW with `precacheAndRoute`, `skipWaiting`, `clientsClaim`, `push` event → `showNotification`, `notificationclick` → focus/open

### M2: Supabase Migration 007
- `supabase/migrations/007_push_subscriptions.sql`:
  - `push_subscriptions` table (user_id UNIQUE, endpoint, p256dh_key, auth_key, device_info) + RLS (user-scoped)
  - `notifications` table (history: user_id, title, body, data, tag, delivered, source_type, source_id, read) + RLS
  - RPC `upsert_push_subscription(user_id, endpoint, p256dh_key, auth_key)` — SECURITY DEFINER
  - RPC `remove_push_subscription(user_id)` — SECURITY DEFINER

### M3: Edge Function send-push
- `supabase/functions/send-push/index.ts`: JWT-верификация, VAPID-шифрование (web-push), subscription iteration, expired cleanup, notification logging
- `supabase/functions/send-push/deno.json`: import map (web-push@3.6.7, supabase-js@2)

### M4: Client Hook + UI
- `src/hooks/usePushNotifications.ts`: `supported`, `permission`, `subscribed` state, `subscribe()`/`unsubscribe()`, `urlBase64ToUint8Array` conversion, RPC+fallback CRUD
- `src/components/notifications/PushSetupBanner.tsx`: multi-state красивое приглашение (Framer Motion, gradient, states: loading/subscribed/denied/prompt)
- `src/pages/ProfilePage.tsx`: секция "Уведомления" с toggle, баннер вверху страницы

### M5: Database Webhooks (автоматические уведомления)
- `supabase/functions/debt-webhook/index.ts` + `deno.json`: INSERT on `shared_debts` → push to other party (direction detection, user name fetch, formatted notification)
- `supabase/functions/payment-webhook/index.ts` + `deno.json`: INSERT on `payments` → push to debt owner (debt direction analysis, shared debt support, partial/full distinction)

### M6: Verification
- `tsc --noEmit`: ✅ only pre-existing TS5101 (baseUrl deprecation)
- `vite build`: ✅ 2952 modules, SW compiled (6 precache entries), 5.54s
- Security: VAPID private key in Deno.env only, RLS on push_subscriptions, JWT auth on Edge Functions
- iOS-ready: manifest id/start_url, display:standalone, maskable icons, push/notificationclick in SW

### ✅ User Completed Setup
- ✅ VAPID keys generated, public in `.env`, both in Supabase Secrets
- ✅ Migration `007_push_subscriptions.sql` executed
- ✅ Edge Functions deployed: `send-push`, `debt-webhook`, `payment-webhook`
- ✅ 2 Database Webhooks created: shared_debts→debt-webhook, payments→payment-webhook

### 🔜 Next: Test
Run `npm run dev` → Profile → enable notifications → create a debt/payment → check push arrives
