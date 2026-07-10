# Qaryz Project Context

## Project
Modern PWA for tracking debts, shared expenses, and settlements between people.
React 19 + TypeScript 6 + Vite 8 + Tailwind CSS v4 + Zustand + shadcn/ui

## Current Status: ✅ ALL TASKS COMPLETE

### Bug Fixes (friendStore.ts:removeFriend)
- **Баг 1 (DELETE filter)**: Вместо `friend.friendId` использовался `otherUserId`. Одно из двух направлений дружбы не удалялось. FIX: [x]
- **Баг 2 (friend_requests)**: После удаления `friends` строки, старый `friend_requests` со статусом `"accepted"` оставался в БД. Unique constraint `(sender_id, receiver_id)` блокировал новый INSERT (ошибка 23505). FIX: сброс запроса на `"rejected"` при удалении друга. + Бонус: вынес `otherUserId` на уровень функции, чтобы был доступен в обоих try-блоках. [x]

### Performance Upgrades
1. **Lazy loading страниц**: 12 страниц заменены на `React.lazy()`. `<Outlet/>` обёрнут в `<Suspense fallback={<PageLoader/>}>`. [x]
2. **Zustand селектор в TransactionList**: Вместо `useDebtStore(s => s.debts)` + `.filter()` на месте → `useDebtStore(s => s.debts.filter(d => d.personId === personId))`. [x]
3. **React.memo**: PersonCard и FriendCard обёрнуты, сравнение по id + index. [x]
4. **Виртуал скролл (react-virtuoso)**: OwedToMePage, IOwePage, FriendsPage — map + AnimatePresence заменены на `<Virtuoso>`. [x]

### Build Verification
- `tsc --noEmit`: ✅ (1 pre-existing deprecation warning only)
- `npm run build`: ✅ (46 JS chunks, production build successful)
- Warning: `debtStore.ts` dynamically imports `friendStore.ts` but others import statically — pre-existing, not introduced.

### Changed Files
- `src/stores/friendStore.ts` — Bug fixes + variable scope fix
- `src/router.tsx` — React.lazy for all 12 pages
- `src/components/layout/AppLayout.tsx` — Suspense around Outlet
- `src/components/shared/PageLoader.tsx` — New spinner component
- `src/components/debts/PersonCard.tsx` — React.memo
- `src/components/friends/FriendCard.tsx` — React.memo
- `src/components/debts/TransactionList.tsx` — Optimized selector
- `src/pages/OwedToMePage.tsx` — Virtuoso
- `src/pages/IOwePage.tsx` — Virtuoso
- `src/pages/FriendsPage.tsx` — Virtuoso
