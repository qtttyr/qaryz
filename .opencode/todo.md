# Mission: Push-уведомления для Qaryz (iOS + Free) ✅ COMPLETE

## M1: Service Worker + Vite Config | status: completed ✅
### T1.1: Vite config → injectManifest | agent:Worker | status: completed ✅
- [x] S1.1.1: Switch to `strategies: 'injectManifest'`, add `srcDir: 'src'`, `filename: 'sw.ts'` | verified (already in vite.config.ts)
- [x] S1.1.2: Add `id: "/"` and `start_url: "/"` to manifest (iOS 16.4+ requirement) | verified (already in vite.config.ts)

### T1.2: Create custom service worker | agent:Worker | status: completed ✅
- [x] S1.2.1: Create `src/sw.ts` with precacheAndRoute, skipWaiting, clientsClaim | verified (build passes)
- [x] S1.2.2: Add `push` event listener → showNotification with body/data | verified (build passes)
- [x] S1.2.3: Add `notificationclick` → focus client or open app | verified (build passes)

## M2: Supabase — Таблицы и RLS | status: completed ✅
### T2.1: Migration 007 | agent:Worker | status: completed ✅
- [x] S2.1.1: Create `007_push_subscriptions.sql` — push_subscriptions table + RLS + unique per user | verified
- [x] S2.1.2: Create `notifications` table (history) + RLS + tag/delivered columns | verified

## M3: Edge Function — send-push | status: completed ✅
### T3.1: Edge Function | agent:Worker | status: completed ✅
- [x] S3.1.1: Create `supabase/functions/send-push/index.ts` — web-push send with VAPID | verified
- [x] S3.1.2: Create `supabase/functions/send-push/deno.json` — import map for web-push | verified
- [x] S3.1.3: Handle VAPID keys from Deno.env, expired subscription cleanup | verified

## M4: Клиент — подписка и UI | status: completed ✅
### T4.1: Хук usePushNotifications | agent:Worker | status: completed ✅
- [x] S4.1.1: Create `src/hooks/usePushNotifications.ts` — permission + subscribe + unsubscribe | verified
- [x] S4.1.2: VAPID public key fetch from `VITE_VAPID_PUBLIC_KEY` env | verified
- [x] S4.1.3: Subscription CRUD → Supabase push_subscriptions table via direct insert/upsert | verified

### T4.2: UI-компоненты | agent:Worker | status: completed ✅
- [x] S4.2.1: Create `src/components/notifications/PushSetupBanner.tsx` — плавная анимация, 3 состояния | verified
- [x] S4.2.2: Add секцию "Уведомления" в ProfilePage с toggle + баннером + настройками | verified

## M5: Автоматические уведомления | status: completed ✅
### T5.1: Database Webhook обработчики | agent:Worker | status: completed ✅
- [x] S5.1.1: `supabase/functions/debt-webhook/index.ts` — INSERT shared_debts → push | verified
- [x] S5.1.2: `supabase/functions/payment-webhook/index.ts` — INSERT payments → push | verified

## M6: Финальная верификация | status: completed ✅
### T6.1: Проверка | agent:Reviewer | status: completed ✅
- [x] S6.1.1: `tsc --noEmit` — чисто (только pre-existing TS5101 deprecation) | verified
- [x] S6.1.2: `vite build` — чисто (main app + sw.ts injection) | verified
- [x] S6.1.3: Проверка безопасности:
  - VAPID private key: только в Deno.env, никогда в клиенте ✅
  - RLS: push_subscriptions — user-scoped, notifications — user-scoped + system insert ✅
  - service_role: только в edge functions, не в клиенте ✅
  - Нет хардкоженных секретов в исходниках ✅
- [x] S6.1.4: iOS-ready:
  - manifest `id: "/"` ✅
  - manifest `start_url: "/"` ✅
  - `display: "standalone"` ✅
  - Иконки 192x192 + 512x512 + maskable ✅
  - Service worker с push/notificationclick ✅

## Summary
| Milestone | Status |
|-----------|--------|
| M1: Service Worker + Vite Config | ✅ |
| M2: Supabase — Таблицы и RLS | ✅ |
| M3: Edge Function — send-push | ✅ |
| M4: Клиент — подписка и UI | ✅ |
| M5: Автоматические уведомления | ✅ |
| M6: Финальная верификация | ✅ |

**Mission Complete!** 🚀
