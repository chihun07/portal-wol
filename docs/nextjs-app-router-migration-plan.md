# Next.js App Router Migration Plan

이 문서는 기존 React + Express 애플리케이션을 Next.js(App Router) 기반으로 마이그레이션하기 위한 상세 계획과 코드 템플릿을 제공합니다. 로그인, 대시보드, 리포트 기능을 SSR/SSG/ISR 전략에 맞춰 이전하면서, Express 백엔드와 REST API는 프록시 레이어 형태로 유지합니다.

## 1. 아키텍처 개요
- **프론트엔드 런타임**: Next.js 15(App Router, React Server Components 기본).
- **라우팅 원칙**
  - 기본은 서버 컴포넌트(`.tsx`), 상호작용이 필요한 경우에만 클라이언트 컴포넌트(`"use client"`).
  - 로그인/인증 플로우는 CSR 전용 페이지(`app/(auth)/login/page.tsx`)로 유지하되, 서버 액션으로 쿠키 설정.
- **데이터 패칭 전략**
  - `app/dashboard/page.tsx`: SSR (`fetch` + `cache: 'no-store'`).
  - `app/reports/page.tsx`: ISR (`revalidateTag('reports')`).
  - `app/(docs)/**`: SSG (`generateStaticParams`).
- **API 통신**: `/app/api/*` 라우트에서 Express 서버로 프록시. Edge runtime 대신 Node.js runtime 사용.
- **상태 관리**: 서버 상태는 SSR/ISR에 맡기고, 클라이언트 전역 상태는 Zustand 스토어로 분리.
- **스타일 시스템**: Tailwind CSS + 디자인 토큰(`tailwind.config.ts` + `app/styles/tokens.css`). 다크 모드는 `class` 전략.
- **보안/운영**: `middleware.ts` 로 인증 가드, Response 헤더 강화, 태그 기반 재검증 API 제공.

## 2. 디렉터리 구조 템플릿
```
src/
  app/
    (auth)/
      layout.tsx
      login/
        page.tsx
        actions.ts
    (dashboard)/
      layout.tsx
      dashboard/
        page.tsx
        components/
          SummaryCards.tsx
          RecentActivity.tsx
    (reports)/
      layout.tsx
      reports/
        page.tsx
        components/
          ReportFilters.tsx
          ReportTable.tsx
        loading.tsx
    (docs)/
      layout.tsx
      [slug]/
        page.tsx
        generateStaticParams.ts
    api/
      express/
        route.ts
      revalidate/
        route.ts
    layout.tsx
    page.tsx
    globals.css
  middleware.ts
  lib/
    auth.ts
    fetcher.ts
    logger.ts
  state/
    sessionStore.ts
    uiStore.ts
  styles/
    tokens.css
  types/
    auth.ts
    dashboard.ts
    reports.ts
  utils/
    headers.ts
    time.ts
  tailwind.config.ts
  postcss.config.mjs
```

## 3. 핵심 구현 조각

### 3.1 Tailwind 및 토큰 설정
```tsx
// tailwind.config.ts
import type { Config } from 'tailwindcss';
import plugin from 'tailwindcss/plugin';

const config: Config = {
  darkMode: 'class',
  content: ['src/app/**/*.{ts,tsx}', 'src/components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: 'rgb(var(--color-surface) / <alpha-value>)',
          elevated: 'rgb(var(--color-surface-elevated) / <alpha-value>)',
        },
        primary: 'rgb(var(--color-primary) / <alpha-value>)',
        accent: 'rgb(var(--color-accent) / <alpha-value>)',
      },
      spacing: {
        gutter: 'var(--space-gutter)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui'],
      },
    },
  },
  plugins: [
    plugin(({ addBase }) => {
      addBase({
        ':root': {
          '--color-surface': '255 255 255',
          '--color-surface-elevated': '248 250 252',
          '--color-primary': '59 130 246',
          '--color-accent': '16 185 129',
          '--space-gutter': '1.5rem',
        },
        '.dark': {
          '--color-surface': '15 23 42',
          '--color-surface-elevated': '30 41 59',
          '--color-primary': '96 165 250',
          '--color-accent': '45 212 191',
        },
      });
    }),
  ],
};

export default config;
```

```css
/* src/styles/tokens.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --font-sans: "Pretendard Variable";
}
```

### 3.2 인증 미들웨어
```ts
// src/middleware.ts
import { NextResponse, type NextRequest } from 'next/server';
import { verifySession } from './lib/auth';

const PUBLIC_PATHS = ['/app/(auth)/login'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  const session = await verifySession(request.cookies.get('sid')?.value);
  if (!session) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const response = NextResponse.next();
  response.headers.set('Content-Security-Policy', "default-src 'self'; connect-src 'self';");
  response.headers.set('X-Frame-Options', 'DENY');
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

### 3.3 Express 프록시 라우트
```ts
// src/app/api/express/route.ts
import { cookies, headers } from 'next/headers';
import { NextResponse } from 'next/server';

const EXPRESS_BASE = process.env.EXPRESS_BASE_URL!;

async function proxy(request: Request) {
  const url = new URL(request.url);
  const targetUrl = new URL(url.pathname.replace(/^\/app\/api\//, '/api/'), EXPRESS_BASE);

  const upstream = await fetch(targetUrl, {
    method: request.method,
    headers: {
      ...Object.fromEntries(headers()),
      authorization: cookies().get('sid')?.value ? `Bearer ${cookies().get('sid')!.value}` : undefined,
    },
    body: request.method === 'GET' ? undefined : await request.arrayBuffer(),
    cache: 'no-store',
    credentials: 'include',
  });

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: upstream.headers,
  });
}

export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
```

### 3.4 대시보드 SSR 페이지
```tsx
// src/app/(dashboard)/dashboard/page.tsx
import { cookies } from 'next/headers';
import { fetchDashboard } from '@/lib/fetcher';
import SummaryCards from './components/SummaryCards';
import RecentActivity from './components/RecentActivity';

export default async function DashboardPage() {
  const token = cookies().get('sid')?.value;
  const data = await fetchDashboard({ token, cache: 'no-store' });

  return (
    <section className="space-y-6">
      <SummaryCards metrics={data.metrics} />
      <RecentActivity items={data.activities} />
    </section>
  );
}
```

### 3.5 리포트 ISR + 태그 무효화
```tsx
// src/app/(reports)/reports/page.tsx
import { fetchReports } from '@/lib/fetcher';

export const revalidate = 3600; // fallback revalidate

export default async function ReportsPage() {
  const reports = await fetchReports({ next: { tags: ['reports'] } });
  return <ReportTable data={reports} />;
}
```

```ts
// src/app/api/revalidate/route.ts
import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';

export async function POST(request: Request) {
  const { secret, tags } = await request.json();
  if (secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  ([] as string[]).concat(tags ?? []).forEach((tag) => revalidateTag(tag));
  return NextResponse.json({ ok: true });
}
```

### 3.6 로그인 CSR + 서버 액션
```tsx
// src/app/(auth)/login/actions.ts
'use server';

import { cookies } from 'next/headers';
import { authenticate } from '@/lib/auth';

export async function loginAction(_: unknown, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const session = await authenticate({ email, password });
  cookies().set('sid', session.token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
  });
}
```

```tsx
// src/app/(auth)/login/page.tsx
'use client';

import { useTransition } from 'react';
import { loginAction } from './actions';

export default function LoginPage() {
  const [pending, startTransition] = useTransition();

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        startTransition(async () => {
          await loginAction(null, form);
        });
      }}
      className="mx-auto mt-24 max-w-sm space-y-4"
    >
      <input name="email" type="email" required className="input" />
      <input name="password" type="password" required className="input" />
      <button type="submit" className="btn-primary" disabled={pending}>
        {pending ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}
```

### 3.7 Zustand 전역 상태 예시
```ts
// src/state/sessionStore.ts
'use client';

import { create } from 'zustand';

interface SessionState {
  user?: {
    id: string;
    name: string;
    roles: string[];
  };
  setUser: (user?: SessionState['user']) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  user: undefined,
  setUser: (user) => set({ user }),
}));
```

```ts
// src/state/uiStore.ts
'use client';

import { create } from 'zustand';

interface UIState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: false,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}));
```

## 4. 마이그레이션 체크리스트 (스냅샷)
1. ✅ Next.js 15 프로젝트 초기화 및 Tailwind 셋업(`npx create-next-app@latest --ts`).
2. ✅ 공통 스타일/토큰 정의, 글로벌 레이아웃 + Tailwind 다크 모드 class 전략 구성.
3. ✅ `middleware.ts` 인증 가드 및 보안 헤더 설정.
4. ✅ `/app/api/express` 프록시 라우트 구현 후 Express 백엔드와 연결.
5. ✅ 로그인 CSR 페이지 + 서버 액션 기반 세션 쿠키 저장 로직 구현.
6. ✅ 대시보드 SSR(`cache: 'no-store'`), 리포트 ISR(`revalidateTag('reports')`), 정적 문서는 SSG(`generateStaticParams`).
7. ✅ Zustand 스토어로 Redux 대체, 각 도메인별 slice 정리.
8. ✅ 공통 UI 컴포넌트/토큰 정립 및 접근성 점검.
9. ✅ CSP/보안 헤더, rate limit(Express 레이어 또는 Next middleware) 구성.
10. ✅ `/app/api/revalidate` 태그 기반 ISR 무효화 파이프라인 구축 + 배포 워크플로우에 통합.
11. ✅ 모니터링/로그 수집(Sentry, OpenTelemetry 등)과 릴리즈 전략 확정.
12. ✅ 단계별 롤아웃: 기존 빌드 백업(`.bak`), 프리뷰 배포, 점진적 트래픽 전환.

## 5. 운영 고려사항
- **배포 전략**: Vercel + Express(별도 서버) 또는 단일 인프라(예: Docker Compose)에서 Next.js 빌드를 reverse proxy 뒤에 배치.
- **환경 변수**: `EXPRESS_BASE_URL`, `REVALIDATE_SECRET`, `NEXT_PUBLIC_API_BASE` 등 환경 분리.
- **로그/모니터링**: Next.js Edge 로그 + Express 중앙집중 로그를 `revalidate` 호출 시점과 연동.
- **테스트**: Playwright(E2E), Jest/Testing Library(클라이언트), Vitest(서버 액션) 등으로 기능 회귀 테스트 구성.

---
이 문서는 팀 합의에 따라 지속적으로 업데이트하며, 각 단계가 완료될 때마다 체크리스트 상태를 갱신하세요.
