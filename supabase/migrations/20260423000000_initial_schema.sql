-- 저장된 레퍼런스 아이템
create table if not exists items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) default auth.uid(),
  url text not null,                        -- 원본 URL
  screenshot_url text,                      -- Cloudflare R2 저장 경로
  title text,
  memo text,
  colors jsonb,                             -- 추출된 컬러 팔레트 ['#000000', ...]
  ai_tags jsonb,                            -- AI 자동 태그 (Phase 2)
  user_tags jsonb,                          -- 사용자 직접 태그 ['미니멀', 'SaaS']
  created_at timestamp default now()
);

-- 컬렉션 (폴더 개념)
create table if not exists collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) default auth.uid(),
  name text not null,                       -- '랜딩페이지', '버튼 디자인' 등
  description text,
  color text,                               -- 사이드바 컬러 닷
  cover_image_url text,
  created_at timestamp default now()
);

-- 아이템 ↔ 컬렉션 다대다
create table if not exists collection_items (
  collection_id uuid references collections(id) on delete cascade,
  item_id uuid references items(id) on delete cascade,
  primary key (collection_id, item_id)
);

-- RLS 활성화
alter table items enable row level security;
alter table collections enable row level security;
alter table collection_items enable row level security;

-- 1. items 정책: 로그인한 사용자는 자신의 데이터만 CRUD 가능
create policy "Users can manage their own items"
on items for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- 2. collections 정책: 로그인한 사용자는 자신의 컬렉션만 CRUD 가능
create policy "Users can manage their own collections"
on collections for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- 3. collection_items 정책: 컬렉션 소유자만 관계 생성/삭제 가능
create policy "Users can manage their own collection items"
on collection_items for all
to authenticated
using (
  exists (
    select 1 from collections 
    where collections.id = collection_id and collections.user_id = auth.uid()
  )
);
