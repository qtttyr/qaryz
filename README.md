# Qary5 💸

Учёт долгов, совместных расходов и взаиморасчётов.  
PWA — устанавливается на экран телефона, работает офлайн.

---

## Фичи

### 📋 Долги
- Два списка: «Мне должны» / «Я должен»
- Создание долга за 5 секунд через плавающую кнопку ➕
- Частичные и полные платежи
- Чат-история транзакций с человеком (как мессенджер)
- Баланс каждого человека вычисляется на лету (не хранится)

### 👥 Друзья
- Поиск пользователей по @username
- Заявки в друзья (принять/отклонить)
- Общие долги (shared debts) — синхронизируются между друзьями
- Профиль друга с общим балансом

### 🏠 Группы
- Создание групп с invite-кодом
- Совместные расходы с разделением (equal/custom)
- Доли участников, отметки о погашении

### 📊 Аналитика
- Сводка: сколько должны / должны мне / баланс
- Графики (Recharts): линейные, круговые, бары
- Метрики: крупнейший долг, средняя сумма, ежемесячная активность
- Всё вычисляется из данных — никакого отдельного хранения

### 🔔 Push-уведомления
- Поддержка iOS 16.4+ (Web Push через APNs)
- Автоматические уведомления при создании долга/платежа (Supabase Database Webhooks)
- Напоминания приходят даже когда приложение закрыто

### 🔄 Синхронизация
- Pull-to-Refresh на всех страницах
- Supabase как бэкенд
- Координатор синхронизации — никаких двойных запросов
- Данные в localStorage — работают без интернета

### 👤 Профиль
- Аватар, имя, @username, телефон
- Тема: тёмная/светлая
- Валюта: KZT / RUB / USD
- Язык: русский / English
- Push-уведомления: включить/отключить
- Выход из аккаунта, сброс всех данных

### 📱 PWA
- Установка на home screen (iOS + Android)
- Service Worker с кэшированием
- Офлайн-доступ
- Манифест с иконками 192/512 + maskable

---

## Архитектура

**Фронт:** React 19 + TypeScript 6 + Vite 8  
**Стили:** Tailwind CSS v4 + shadcn/ui (radix)  
**Состояние:** Zustand (изолированные сторы)  
**Анимации:** Framer Motion  
**Бэкенд:** Supabase (Auth, PostgreSQL, RLS, Edge Functions)  
**Иконки:** HugeIcons  
**Шрифт:** Montserrat Variable  

### Ключевые решения
- **Баланс = вычисляемое значение.** Никогда не хранится — всегда Σ долгов − Σ платежей. Нет рассинхронизации
- **Одна форма** создания долга для обоих направлений
- **localStorage persist.** Пока нет бэкенда — Zustand persist. При появлении API достаточно заменить storage
- **Чат-интерфейс.** История транзакций с человеком как мессенджер, не бухгалтерия
- **Computed аналитика.** Все метрики — чистые функции от данных

---

## RLS

Все таблицы защищены Row Level Security:
- Пользователь видит только свои долги, людей, платежи
- Профили доступны для поиска друзей (только аутентифицированным)
- Общие долги видны обеим сторонам
- Push-подписки — только свои (user-scoped)
- Уведомления — только свои (система вставляет через service_role)

---

## Что под капотом

```
src/
├── pages/          # 13 страниц
├── stores/         # 6 Zustand-сторов
├── hooks/          # 10 кастомных хуков
├── components/     # ui, layout, debts, friends, analytics, groups, shared, notifications
├── types/          # debt, user, group, friend, supabase
└── lib/            # supabase client, utils, sync coordinator

supabase/
├── migrations/     # 7 миграций (001-007)
└── functions/      # 4 Edge Functions: send-push, debt-webhook, payment-webhook
```

## 📋 📊 SKIP SUMMARY FOR EFFICIENT WORK

The project already has **comprehensive landing page (onboarding) with all necessary features** including PWA setup. The main challenge is to handle users who bypass the landing page and try to access protected routes when they haven't completed the onboarding.

Therefore, the tasks should focus on:

### 1. PROTECTING THE ONBOARDING FLOW
- Update `ProtectedRoute` to ensure users cannot skip onboarding
- Use `OnboardingGate` to redirect unauthenticated users
- Set up proper route protection to ensure smooth onboarding flow

### 2. VERIFYING existing profile management (ESPECIALLY FOR FUNDS IN THE PROFILE PAGE)
- Further refine and test existing profile sync logic
- Optimize user session handling
- Verify data persistence and authentication state

### 3. VERIFICATION AND DOCUMENTATION
- Complete all feature implementations
- Update documentation and detailed workflow plans
- Ensure all code changes are properly documented

The key requirement is to focus on protecting the onboarding flow and ensuring smooth user authentication and session management.
src/
├── pages/          # 13 страниц
├── stores/         # 6 Zustand-сторов
├── hooks/          # 10 кастомных хуков
├── components/     # ui, layout, debts, friends, analytics, groups, shared, notifications
├── types/          # debt, user, group, friend, supabase
└── lib/            # supabase client, utils, sync coordinator

supabase/
├── migrations/     # 7 миграций (001-007)
└── functions/      # 4 Edge Functions: send-push, debt-webhook, payment-webhook
```
