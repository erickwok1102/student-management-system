-- 點名系統 v2 資料庫結構
-- 使用方法：喺 Supabase Dashboard → SQL Editor 貼上成個檔案，撳 Run

-- 班別
create table if not exists classes (
  id bigint generated always as identity primary key,
  name text not null unique,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- 學員（id 沿用舊系統嘅 Y0001 格式，方便由 Google Sheets 遷移）
create table if not exists students (
  id text primary key,
  name text not null,
  nickname text not null default '',
  class text not null default '',
  phone text not null default '',
  email text not null default '',
  birthday text not null default '',
  emergency_contact text not null default '',
  emergency_phone text not null default '',
  status text not null default '在讀',
  remarks text not null default '',
  created_at date not null default current_date
);

-- 點名記錄
-- 冇設 student_id 外鍵：等舊記錄（可能包含已刪除學員）都可以匯入
-- (date, student_id) 唯一：同一日同一學員重複點名會自動覆蓋，唔會重複
create table if not exists attendance (
  id bigint generated always as identity primary key,
  date date not null,
  class text not null,
  student_id text not null,
  student_name text not null,
  status text not null check (status in ('出席', '缺席', '遲到')),
  created_at timestamptz not null default now(),
  unique (date, student_id)
);

create index if not exists idx_attendance_date on attendance (date);
create index if not exists idx_attendance_class_date on attendance (class, date);
create index if not exists idx_students_class on students (class);

-- 開啟 RLS 但唔加任何 policy：
-- 即係話用 anon key 完全讀寫唔到，只有後端用 service role key 先入到嚟
alter table classes enable row level security;
alter table students enable row level security;
alter table attendance enable row level security;

-- 預設班別（可以喺 app 入面再加）
insert into classes (name, sort_order) values
  ('兒童班', 1),
  ('青年班', 2),
  ('成人班', 3)
on conflict (name) do nothing;
