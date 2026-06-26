-- 天津大学职业价值取舍互动H5：Supabase 建表脚本
-- 使用方法：Supabase Dashboard -> SQL Editor -> New query -> 粘贴运行

create extension if not exists pgcrypto;

create table if not exists public.career_value_responses (
  id uuid primary key default gen_random_uuid(),
  class_id text not null,
  user_id text not null,
  initial5 text[] not null,
  retained4 text[] not null,
  retained3 text[] not null,
  final_value text not null,
  reflection text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists career_value_responses_class_user_unique
on public.career_value_responses (class_id, user_id);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_career_value_responses_updated_at on public.career_value_responses;
create trigger set_career_value_responses_updated_at
before update on public.career_value_responses
for each row execute function public.set_updated_at();

alter table public.career_value_responses enable row level security;

-- 为课堂互动开放匿名提交、读取、更新、清空本场数据。
-- 本应用不收集姓名、学号、手机号等隐私信息，只记录匿名设备ID和选择结果。
drop policy if exists "anon can insert career value responses" on public.career_value_responses;
create policy "anon can insert career value responses"
on public.career_value_responses
for insert
to anon
with check (true);

drop policy if exists "anon can select career value responses" on public.career_value_responses;
create policy "anon can select career value responses"
on public.career_value_responses
for select
to anon
using (true);

drop policy if exists "anon can update own class user response" on public.career_value_responses;
create policy "anon can update own class user response"
on public.career_value_responses
for update
to anon
using (true)
with check (true);

drop policy if exists "anon can delete career value responses" on public.career_value_responses;
create policy "anon can delete career value responses"
on public.career_value_responses
for delete
to anon
using (true);
