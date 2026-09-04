# OShift Frontend

Modern web frontend for **OShift** — an AI-powered competitive intelligence and content strategy platform for brands, creators, and marketers.

Built on **Next.js 16 (App Router + Turbopack)** and **React 19**, styled with **Tailwind CSS v4**, backed by **Supabase Auth**, and integrated with the OShift FastAPI backend.

---

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (Turbopack, App Router)
- **Runtime & UI**: [React 19](https://react.dev/), [TypeScript 5](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Auth**: [Supabase SSR](https://supabase.com/docs/guides/auth/server-side/nextjs) (`@supabase/ssr`, cookie-based sessions)
- **Visualization & Animation**: [Recharts](https://recharts.org/), [Three.js](https://threejs.org/), [Framer Motion](https://www.framer.com/motion/)
- **Icons**: [Lucide React](https://lucide.dev/), [React Icons](https://react-icons.github.io/react-icons/)
- **Analytics**: [PostHog](https://posthog.com/) (`posthog-js`, proxied reverse-path)
- **Test Suite**: Node.js Native Test Runner with `--experimental-strip-types`

---

## Architectural Highlights

### 1. Same-Origin Reverse Proxy
To eliminate browser CORS preflight latency and prevent backend URL exposure, client-side requests route through `/api/[...path]`. Next.js forwards these to the FastAPI service configured in `API_BACKEND_URL` (default: `http://localhost:8000`).

### 2. Resilient API Client & RFC 9457
The unified client (`src/lib/api.ts`) implements RFC 9457 Problem Details error parsing:
- Normalizes backend errors, upstream Cloudflare 502/504 HTML gateways, and validation issues into typed `ApiError` instances.
- Generates `X-Request-ID` and extracts incoming `X-Error-Ref` correlation identifiers.
- Supports bounded timeout aborts and caller-supplied `AbortSignal` cancellation.

### 3. Error Boundaries & Toast Throttling
- Granular error boundaries (`src/components/error/ErrorBoundary.tsx` and `WidgetErrorBoundary.tsx`) isolate component and widget failures without crashing the parent layout.
- Collision-resistant Crockford Base32 client error references (`ERR-CXXXX`) facilitate trace logging and support reporting.
- A sliding-window token rate limiter (`src/lib/toast-limiter.ts`) suppresses rapid error storms and collapses duplicate toasts.

### 4. Domain Glossary
All architectural terms, design tokens, and domain concepts follow [`CONTEXT.md`](./CONTEXT.md).

---

## Getting Started

### Prerequisites
- Node.js 22+
- Running OShift FastAPI backend (default: `http://localhost:8000`)
- Supabase project for authentication

### Environment Setup
Copy the sample environment file and configure credentials:

```bash
cp .env.example .env.local
```

Key environment variables:
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anon/public key
- `NEXT_PUBLIC_API_BASE_URL`: Set to `/api` for same-origin proxying
- `API_BACKEND_URL`: Destination URL for FastAPI backend (server-side, e.g., `http://localhost:8000`)
- `NEXT_PUBLIC_POSTHOG_KEY`: (Optional) PostHog analytics key

### Installation

```bash
npm install
```

### Running Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Available Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start Next.js development server with Turbopack |
| `npm run build` | Build optimized production bundle |
| `npm run start` | Start production Next.js server |
| `npm run type-check` | Run strict TypeScript compiler verification (`tsc --noEmit`) |
| `npm test` | Run complete Node test suite (`*.test.ts`, `*.test.mjs`) |
| `npm run lint` | Run ESLint across application code |

---

## Project Structure

```
├── .agents/                    # Agent instructions and skills
├── docs/                       # Project documentation
│   ├── agents/                 # Issue tracking, triage, and domain guidelines
│   ├── competitors-plan/       # Competitor module backend and sync documentation
│   └── email-templates/        # Production email HTML templates
├── public/                     # Static assets, branding, and images
├── src/
│   ├── app/                    # Next.js App Router routes and page views
│   │   ├── api/[...path]/      # Same-origin FastAPI reverse proxy
│   │   ├── auth/               # Supabase auth handlers and callback routes
│   │   ├── competitors/        # Competitor intelligence views and watchlists
│   │   ├── opportunities/      # Content opportunities feed and decks
│   │   ├── partnerships/       # Interactive partnerships canvas
│   │   └── videos/             # Video analysis and viral metric deck
│   ├── components/             # Reusable React components and widgets
│   │   ├── error/              # ErrorBoundary, ErrorCard, and ConfirmDialog
│   │   ├── skeletons/          # Shimmer loading skeleton placeholders
│   │   └── ui/                 # Core UI atoms, inputs, and dialogs
│   ├── hooks/                  # Custom hooks (canvas, opportunities, video)
│   ├── lib/                    # API client, error handling, toast rate-limiting
│   ├── types/                  # TypeScript data contracts and entity definitions
│   └── utils/                  # Supabase clients and helper utilities
├── CONTEXT.md                  # Canonical domain glossary and vocabulary
├── eslint.config.mjs           # Flat ESLint configuration
└── next.config.ts              # Next.js rewrites and security headers
```

