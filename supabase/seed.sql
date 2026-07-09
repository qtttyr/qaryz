-- ============================================================
-- Qaryz — Seed Data (для тестирования)
-- Вставь в Supabase SQL Editor после создания таблиц
-- ============================================================

-- Вставка от имени конкретного пользователя не сработает через RLS.
-- Запускай этот SQL в Supabase Dashboard (bypass RLS).

-- Замени 'YOUR_USER_ID' на реальный id из auth.users
-- Можно узнать: SELECT id FROM auth.users LIMIT 1;

-- Пример данных (на 1 пользователя):
do $$
declare
  v_user_id uuid := 'YOUR_USER_ID'; -- ← ЗАМЕНИТЬ
  v_person_a_id uuid;
  v_person_b_id uuid;
  v_person_c_id uuid;
  v_debt_1_id uuid;
  v_debt_2_id uuid;
  v_debt_3_id uuid;
begin
  -- Люди
  insert into public.persons (id, user_id, name, phone) values
    (gen_random_uuid(), v_user_id, 'Айбек', '+77011234567'),
    (gen_random_uuid(), v_user_id, 'Алина', '+77019876543'),
    (gen_random_uuid(), v_user_id, 'Дамир', '+77015551234')
  returning id into v_person_a_id;

  select id into v_person_b_id from public.persons
  where user_id = v_user_id and name = 'Алина' limit 1;

  select id into v_person_c_id from public.persons
  where user_id = v_user_id and name = 'Дамир' limit 1;

  -- Долги
  insert into public.debts (id, user_id, person_id, direction, amount, description) values
    (gen_random_uuid(), v_user_id, v_person_a_id, 'owed_to_me', 12500, 'Обед и такси'),
    (gen_random_uuid(), v_user_id, v_person_b_id, 'i_owe', 7000, 'Билеты на концерт'),
    (gen_random_uuid(), v_user_id, v_person_c_id, 'owed_to_me', 3000, 'Кофе на неделю')
  returning id into v_debt_1_id;

  -- Платежи
  insert into public.payments (id, user_id, debt_id, amount, type) values
    (gen_random_uuid(), v_user_id, v_debt_1_id, 2000, 'partial');
end $$;
