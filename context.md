# Qaryz 💸

Современное минималистичное PWA-приложение для учёта долгов, совместных расходов и взаиморасчётов между людьми.

**Главная идея:** «Не теряй деньги и не порть отношения.»

**Принципы:**
- ⚡ Супер быстро — 5 секунд на создание записи
- 🎨 Визуально чисто — воздух, мягкие тени, никакого шума
- 👥 Эмоционально понятно — интерфейс как чат, а не бухгалтерия
- ❌ Без ощущения бухгалтерии — никаких таблиц, только карточки и диалоги

---

## 🧱 Tech Stack

| Технология | Назначение |
|---|---|
| **React 19 + TypeScript 6** | Фреймворк и типизация |
| **Vite 8** | Сборщик |
| **Tailwind CSS v4** | Стилизация |
| **shadcn/ui (radix-vega)** | UI-кит (Button, Card, Sheet, Sidebar, Input, Select, Tooltip, Separator, Skeleton, Slider, Chart) |
| **Recharts** | Графики |
| **Zustand** | Управление состоянием (лёгкий, без boilerplate) |
| **Framer Motion** | Анимации (переходы между страницами, появление элементов) |
| **react-router-dom** | Клиентский роутинг |
| **HugeIcons** | Иконки |
| **Montserrat Variable** | Шрифт |
| **Vite PWA** | Офлайн-доступ, установка на экран |
| **tw-animate-css** | CSS-анимации (базовые) |

---

## 📁 Структура проекта

```
src/
├── main.tsx                          # Точка входа
├── router.tsx                        # Конфигурация роутов
├── App.tsx                           # Корневой компонент (RouterProvider)
├── App.css
│
├── pages/                            # Страницы (1 файл = 1 роут)
│   ├── OwedToMePage.tsx              # / — Люди, которые должны мне
│   ├── IOwePage.tsx                  # /i-owe — Люди, которым должен я
│   ├── PersonDetailPage.tsx          # /person/:id — Чат-история с человеком
│   ├── AnalyticsPage.tsx              # /analytics — Дашборд + графики
│   └── ProfilePage.tsx               # /profile — Профиль + настройки
│
├── components/
│   ├── ui/                           # shadcn/ui (12 компонентов)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── chart.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── separator.tsx
│   │   ├── sheet.tsx
│   │   ├── sidebar.tsx
│   │   ├── skeleton.tsx
│   │   ├── slider.tsx
│   │   └── tooltip.tsx
│   │
│   ├── layout/                       # Скелет приложения
│   │   ├── AppLayout.tsx             # Корневой layout: Sidebar (desktop) / BottomNav (mobile)
│   │   ├── BottomNav.tsx             # Мобильная нижняя навигация
│   │   └── FloatingAddButton.tsx     # Плавающая кнопка "+"
│   │
│   ├── debts/                        # Всё, что связано с долгами
│   │   ├── PersonCard.tsx            # Карточка человека: аватар, имя, баланс, последняя операция
│   │   ├── TransactionList.tsx       # Чат-лента транзакций
│   │   ├── DebtForm.tsx              # Modal/Sheet создания долга (5 секунд)
│   │   ├── PaymentForm.tsx           # Форма частичного/полного погашения
│   │   └── ReminderButton.tsx        # Кнопка «Напомнить»
│   │
│   ├── analytics/                    # Аналитика
│   │   ├── OverviewCard.tsx          # Сводка: должны / должен / баланс
│   │   ├── StatCard.tsx              # Одна метрика
│   │   └── ChartSection.tsx          # Блок с графиками (линии, круги, бары)
│
├── stores/                           # Zustand stores
│   ├── debtStore.ts                  # Долги: CRUD, фильтрация по направлению
│   ├── uiStore.ts                    # UI-состояние: тема, sidebar, активный модальный окно
│   └── userStore.ts                  # Профиль пользователя + настройки
│
├── hooks/                            # Кастомные хуки
│   ├── use-mobile.ts                 # Детект мобильного viewport (< 768px)
│   ├── useDebts.ts                   # Удобная обёртка над debtStore
│   ├── usePeople.ts                  # Люди с вычисленными балансами (из долгов)
│   ├── useAnalytics.ts               # Вычисляемая аналитика на лету
│   └── useLocalStorage.ts            # Типизированная работа с localStorage
│
├── types/                            # TypeScript-типы
│   ├── debt.ts                       # Debt, Transaction, Person, DebtDirection, PaymentStatus
│   └── user.ts                       # UserProfile, AppSettings, Theme
│
└── lib/
    └── utils.ts                      # cn() — clsx + tailwind-merge
```

---

## 🧭 Роутинг

```tsx
// src/router.tsx
createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { index: true,          element: <OwedToMePage /> },
      { path: "i-owe",       element: <IOwePage /> },
      { path: "person/:id",  element: <PersonDetailPage /> },
      { path: "analytics",   element: <AnalyticsPage /> },
      { path: "profile",     element: <ProfilePage /> },
    ],
  },
]);
```

---

## 🧩 Типы данных

```typescript
// src/types/debt.ts

type DebtDirection = "owed_to_me" | "i_owe";

interface Debt {
  id: string;
  personId: string;
  direction: DebtDirection;
  amount: number;           // всегда положительное число
  description?: string;
  createdAt: string;         // ISO date
  settledAt?: string;        // ISO date — дата полного закрытия
}

interface Payment {
  id: string;
  debtId: string;
  amount: number;
  note?: string;
  createdAt: string;
  type: "partial" | "full";
}

interface Person {
  id: string;
  name: string;
  avatar?: string;           // URL или base64
  createdAt: string;
}
```

```typescript
// src/types/user.ts

interface UserProfile {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  currency: string;           // "KZT" | "RUB" | "USD"
  language: "ru" | "en";
}

type Theme = "dark" | "light";

interface AppSettings {
  theme: Theme;
  autoReminders: boolean;
  aiTone: "neutral" | "friendly" | "formal";
  recurringReminders: boolean;
  notificationsEnabled: boolean;
}
```

---

## 🏪 Сторы (Zustand)

### debtStore
```typescript
interface DebtStore {
  debts: Debt[];
  payments: Payment[];
  people: Person[];

  // Debt CRUD
  addDebt(debt: Omit<Debt, "id" | "createdAt">): void;
  settleDebt(debtId: string): void;
  removeDebt(debtId: string): void;

  // Payments
  addPayment(debtId: string, amount: number, note?: string): void;

  // Person CRUD
  addPerson(name: string): string;       // возвращает id
  getPerson(id: string): Person | undefined;

  // Computed
  getDebtsByDirection(dir: DebtDirection): Debt[];
  getPersonBalance(personId: string): number;
  getRemainingAmount(debtId: string): number;   // сумма долга минус все платежи
  getDebtsForPerson(personId: string): Debt[];

  // Persist
  _persist: PersistStorage<DebtStore>;   // localStorage
}
```

**Почему вычисляемый баланс?**  
Баланс человека не хранится — он всегда вычисляется как `сумма всех долгов − сумма всех платежей`. Это исключает рассинхронизацию данных. Единственный источник истины — список долгов и платежей.

### uiStore
```typescript
interface UIStore {
  theme: Theme;
  sidebarOpen: boolean;
  activeModal: "none" | "add-debt" | "add-payment";
  activeModalData?: Record<string, unknown>;   // id человека и т.д.

  setTheme(theme: Theme): void;
  toggleTheme(): void;
  toggleSidebar(): void;
  openModal(modal: UIStore["activeModal"], data?: Record<string, unknown>): void;
  closeModal(): void;
}
```

### userStore
```typescript
interface UserStore {
  profile: UserProfile;
  settings: AppSettings;

  updateProfile(partial: Partial<UserProfile>): void;
  updateSettings(partial: Partial<AppSettings>): void;
  resetProfile(): void;
}
```

---

## 🎨 Дизайн-система

### Визуальная концепция
- **Тёмная тема** — базовая, основная. Светлая — как опция в настройках.
- **Цвета:**
  - 🟢 Зелёный — «Мне должны» (positive, incoming)
  - 🔴 Красный — «Я должен» (negative, outgoing)
  - ⚪ Серый — закрытые долги, нейтральное
  - 🔵 Electric blue / soft purple — акцент (кнопки, ссылки, активные элементы)
- **Карточки:** большие, воздушные, с мягкими тенями (`shadow-sm`)
- **Типографика:** Montserrat Variable, без засечек, много воздуха
- **Иконки:** HugeIcons — единый набор, линейный стиль

### Вдохновение
Linear × Revolut × Notion × Monarch Money × Kaspi.kz

### Анимации (Framer Motion)
- Плавные переходы между страницами (`AnimatePresence`)
- Slide-in для модалок и Sheet
- Soft motion для появления карточек (scale + fade)
- Hover-эффекты без flash

---

## 🧠 Ключевые архитектурные решения

### 1. Единый DebtForm для обоих направлений
Одна форма создания долга. Внутри — переключатель `direction`: «Мне должны» / «Я должен». Это сокращает дублирование кода и гарантирует одинаковый UX.

### 2. Баланс = вычисляемое значение
Баланс человека никогда не хранится в базе. Он вычисляется на лету:
```
balance = сумма(debt.amount where direction = "owed_to_me") − сумма(debt.amount where direction = "i_owe")
```
Исключает рассинхронизацию и баги с «застывшими» значениями.

### 3. LocalStorage persist
Пока нет бэкенда — все данные живут в localStorage через `zustand/middleware/persist`. При появлении API достаточно заменить персистент на HTTP-клиент, не меняя логику сторов.

### 4. PersonDetail как чат
История транзакций отображается как чат:
- Сообщение = транзакция
- Зелёные сообщения — «ты дал / тебе вернули»
- Красные — «ты взял / ты вернул»
- Системные сообщения — «Напоминание отправлено»
Это эмоционально понятно и не похоже на бухгалтерию.

### 5. Разделение Person и Debt
Человек — отдельная сущность. Один человек может иметь несколько долгов (в т.ч. в обе стороны). Это позволяет корректно считать общий баланс и показывать историю.

### 6. Zustand вместо Context
- Без boilerplate
- Селекторы для избежания лишних ререндеров
- Встроенный persist (localStorage)
- Изолированные сторы: изменения в uiStore не триггерят debtStore

### 7. Вычисляемая аналитика
Все метрики на странице аналитики — чистые функции от `debtStore`. Никакого отдельного хранения:
- totalOwedToMe / totalIOwe / balance
- closedDebtsCount
- mostFrequentDebtor
- averageDebtAmount
- monthlyRepayments
- biggestDebt
- monthlyActivity

### 8. FloatingButton как единственный вход
Весь ввод данных — через плавающую кнопку "➕". Она открывает DebtForm (Sheet на мобилках, Modal на десктопе). Максимум 5 секунд на создание записи.

### 9. PWA-first
Приложение устанавливается на экран телефона. Работает офлайн. Все данные кешируются в localStorage и service worker.

### 10. Layout == маршрутизатор
AppLayout — не просто обёртка. Он отвечает за:
- Desktop: Sidebar (слева) + Content (справа)
- Mobile: BottomNav (снизу) + FAB
- Переключение происходит через `useIsMobile()` хук
- Активный пункт навигации синхронизирован с текущим роутом

---

## 📱 Mobile UX

- **Bottom navigation:** Home (Мне должны) | Analytics | Profile
- **FAB ➕** — всегда видна, открывает DebtForm
- **Desktop Sidebar** → превращается в **BottomNav** на мобилках
- Все модалки — Bottom Sheet (через shadcn Sheet)
- Тапы — крупные, отзывчивые
- Анимации — slick, без тормозов

---

## 🧪 План реализации (порядок)

1. Установить зависимости: `react-router-dom`, `zustand`, `framer-motion`
2. Создать типы (`types/debt.ts`, `types/user.ts`)
3. Создать стор `debtStore` (Zustand + persist)
4. Создать стор `uiStore` (тема, модалки)
5. Создать стор `userStore` (профиль + настройки)
6. Создать хуки (`useDebts`, `usePeople`, `useAnalytics`, `useLocalStorage`)
7. Создать Layout (`AppLayout`, `BottomNav`, `FloatingAddButton`)
8. Создать роутер (`router.tsx`) и обновить `App.tsx`
9. Создать feature-компоненты (`PersonCard`, `DebtForm`, `TransactionList`, и т.д.)
10. Создать страницы (5 страниц)
11. Настроить PWA (manifest, service worker)
12. Добавить анимации (Framer Motion — переходы, появление)
