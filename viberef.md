# 📒 VibeRef 개발 로그

## 🗓️ 2026-04-23 (Day 1)
> **목표:** MVP 개발 착수 및 핵심 인프라/UI 뼈대 구축

### 🚀 주요 성과
- [x] **기술 스택 확정**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Supabase 연동.
- [x] **데이터베이스 설계**: `items`, `collections`, `collection_items` 테이블 구축 및 RLS(보안 정책) 적용.
- [x] **인증 시스템 완비**: Magic Link, Google OAuth, 그리고 개발 효율을 위한 Password 로그인 구현.
- [x] **디자인 시스템 확립**: Eagle.cool 스타일의 딥 다크 테마(#1A1A1F) 및 옐로우 포인트(#F5E642) 적용.
- [x] **핵심 기능 구현**: URL 입력 시 Microlink API를 활용한 실시간 스크린샷 캡처 및 저장 기능.

---

### 🎨 디자인 시스템 (Design System)
- **Background:** `#1A1A1F` (Deep Dark)
- **Sidebar/Panel:** `#141418`
- **Card:** `#222228` (Hover: `#2A2A32`)
- **Accent:** `#F5E642` (Yellow)
- **Typography:** Font-light 기반의 세련된 서체 적용

### 🛠️ 기술적 도전 및 해결
#### 1. Supabase 세션 공유 이슈 (401 Error)
- **문제:** 단순 `createClient` 사용 시 클라이언트에서 인증 세션을 읽지 못함.
- **해결:** `@supabase/ssr`의 `createBrowserClient`와 `createServerClient`로 분리하여 쿠키 기반 세션 연동 완료.

#### 2. 실시간 스크린샷 캡처
- **문제:** 이미지 저장 인프라 구축 전 빠른 프로토타이핑 필요.
- **해결:** `Microlink API`를 활용하여 실시간 캡처 URL을 생성하고, 실패 시 `og:image`를 가져오는 폴백 로직 적용.

### 📝 오늘의 생각
- Eagle.cool의 밀도감 있는 다크 테마를 옐로우 포인트로 재해석했는데, 생각보다 결과물이 훨씬 세련되게 나와서 만족스럽다.
- AI 코딩 도구(Gemini CLI)와의 협업이 매우 빨라 하루 만에 로그인부터 DB 연동, 3패널 레이아웃까지 마칠 수 있었다.

---

### 넥스트 스텝 (Next Steps)
- [ ] 이미지 컬러 팔레트 자동 추출 로직 (Color Thieve 등 활용)
- [ ] 사이드바 컬렉션 생성 및 필터링 기능
- [ ] 아이템 삭제 및 검색(Command+K) 고도화

#VibeRef #SaaS #DevLog #NextJS #Supabase #TailwindCSS
