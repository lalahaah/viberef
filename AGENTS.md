# VibeRef - AGENTS.md
> 이 파일은 Claude Code, Antigravity(Gemini), Cursor 등
> 모든 AI 코딩 도구가 세션 시작마다 자동으로 읽는 프로젝트 컨텍스트 문서입니다.
> 작업 시작 전 반드시 읽고, 작업 후 변경사항을 반영해주세요.

---

## 제품 정의

**제품명:** VibeRef
**한 줄 정의:** SaaS 개발자를 위한 AI 연동 디자인 레퍼런스 관리 도구
**핵심 차별점:** 웹 기반 + 컬러 자동 추출 + (Phase 2) AI Tailwind 코드 변환

---

## 개발 환경

- **IDE:** Google Antigravity
- **AI:** Gemini CLI (터미널)
- **배포:** Vercel

---

## 현재 Phase

**Phase 1 - MVP (진행 중)**

완료 기준:
- [ ] 브라우저 확장 프로그램으로 한 클릭 저장
- [ ] 컬렉션 + 태그 분류
- [ ] 검색 & 필터링
- [ ] 웹에서 어디서든 접근 (Vercel 배포)
- [ ] 컬러 팔레트 자동 추출

**Phase 2 - AI 연동 (미착수)**
- 이미지 → Tailwind 코드 추출 (Claude Vision API)
- AI 자동 태깅
- "이 스타일로 만들어줘" 프롬프트 생성기

**Phase 3 - 멀티 유저 (미착수)**
- 회원가입 / 멀티 유저
- 공개 컬렉션 공유
- 무료/유료 플랜 분리
- 팀 기능

---

## 기술 스택

| 역할 | 기술 | 비고 |
|------|------|------|
| Frontend | Next.js 14 (App Router) | Tailwind CSS |
| Database | Supabase (PostgreSQL) | 무료 tier |
| 이미지 저장 | Cloudflare R2 | 스크린샷 압축 저장 |
| 배포 | Vercel | 무료 tier |
| 인증 | Supabase Auth | Google OAuth + Magic Link |
| 브라우저 확장 | Chrome Extension Manifest V3 | |

---

## 데이터 모델 (Supabase)

```sql
-- 저장된 레퍼런스 아이템
create table items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),  -- Phase 3 대비 (지금은 단일 유저)
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
create table collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  name text not null,                       -- '랜딩페이지', '버튼 디자인' 등
  description text,
  color text,                               -- 사이드바 컬러 닷
  cover_image_url text,
  created_at timestamp default now()
);

-- 아이템 ↔ 컬렉션 다대다
create table collection_items (
  collection_id uuid references collections(id) on delete cascade,
  item_id uuid references items(id) on delete cascade,
  primary key (collection_id, item_id)
);
```

---

## UI 구조

**3패널 레이아웃 (Eagle.cool 스타일)**

```
┌──────────────────────────────────────────────────┐
│ 사이드바(200px) │  그리드 메인   │ 디테일(220px)  │
│                │               │                 │
│ [로고]         │ [상단 필터바]  │ [선택 아이템]   │
│ [검색 ⌘K]     │               │ [컬러 팔레트]   │
│                │ ┌──┐ ┌──┐   │ [태그]          │
│ 컬렉션         │ │  │ │  │   │ [메모]          │
│ • 전체         │ └──┘ └──┘   │ [원본 URL]      │
│ • 랜딩페이지   │               │                 │
│ • 대시보드     │ ┌──┐ ┌──┐   │ [AI변환 버튼]   │
│ • 버튼/CTA     │ │  │ │  │   │ → Phase 2       │
│                │ └──┘ └──┘   │                 │
│ 태그           │               │                 │
│ # 미니멀       │               │                 │
│ # 다크모드     │               │                 │
│ # SaaS         │               │                 │
└──────────────────────────────────────────────────┘
```

**페이지 구조:**
```
/login       → 로그인 (Google OAuth + Magic Link)
/dashboard   → 메인 3패널 UI
/            → 랜딩페이지 (Phase 3 때 구현, 지금은 /dashboard로 redirect)
```

---

## 저장 전략

```
저장하는 것:
  ✅ 스크린샷 (Cloudflare R2, 압축 후 ~300kb)
  ✅ 원본 URL
  ✅ 메타데이터 (title, og:image)
  ✅ 컬러 팔레트 (자동 추출)
  ✅ 사용자 태그 + 메모

저장하지 않는 것:
  ❌ 원본 고화질 이미지 (비용 이슈)
  ❌ 전체 HTML/CSS
```

---

## 디자인 시스템

**포인트 컬러:** `#7F77DD` (퍼플)
**스타일:** Eagle.cool 스타일 3패널, 라이트 모드 기본
**컴포넌트:** Tailwind CSS + shadcn/ui

---

## 코딩 규칙

- Next.js App Router 사용 (Pages Router 사용 금지)
- TypeScript 사용
- 컴포넌트는 `src/components/` 에 위치
- API route는 `src/app/api/` 에 위치
- Supabase client는 `src/lib/supabase.ts` 에서 관리
- 환경변수는 `.env.local` 사용, 절대 하드코딩 금지
- 복잡한 비즈니스 로직엔 반드시 주석 추가

---

## Phase 1에서 하지 말 것

```
❌ 팀/공유 기능 → Phase 3
❌ AI 코드 추출 → Phase 2
❌ 랜딩페이지 제작 → Phase 3
❌ 결제/구독 기능 → Phase 3
❌ 모바일 앱 → 미정
❌ 퍼블릭 API → 미정
```

---

## 작업 로그

| 날짜 | 완료 내용 |
|------|----------|
| 2026-04-23 | 기획 확정, AGENTS.md 작성, 프로젝트 시작 |
| 2026-04-23 | Supabase 초기 설정 및 테이블(items, collections) 생성, RLS 보안 정책 적용 |
| 2026-04-23 | Supabase Auth 연동 (Google OAuth, Magic Link) 및 Route 보호(Middleware) 구현 |
| 2026-04-23 | Dashboard 3패널 레이아웃(사이드바, 그리드, 상세패널) UI 구현 완료 |
| 2026-04-23 | 아이템 저장 기능 구현 (URL, 제목, 태그, 메모) 및 Supabase DB 실제 연동 완료 |
| 2026-04-23 | 아이템 리스트 낙관적 업데이트(Optimistic Update) 및 상세 정보 조회 기능 구현 |
| 2026-04-23 | 대시보드 테마 변경: 옐로우 포인트(#F5E642) + 딥 다크(#1A1A1F) 디자인 시스템 적용 |
| 2026-04-23 | 개발 효율을 위한 NODE_ENV 기반 비밀번호 로그인 기능 추가 |
| 2026-04-23 | Microlink API 연동을 통한 스크린샷 자동 캡처 및 og:image 폴백 로직 구현 |
| 2026-04-23 | 카드 그리드 UI 개선: 이미지 패딩 제거 및 꽉 찬 레이아웃(Object-fit) 적용 |

---

## 세션 시작/종료 규칙

```
세션 시작할 때 반드시:
"AGENTS.md 읽고 [작업내용] 시작해줘"

세션 종료할 때 반드시:
"오늘 작업한 내용 AGENTS.md 작업 로그에 추가해줘"
```
