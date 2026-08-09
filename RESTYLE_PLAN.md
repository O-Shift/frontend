# OShift — Restyle + Wiring Implementation Plan

## 0. The two codebases

| Role | Path |
|---|---|
| **CURRENT** — the real app, you edit this | `C:\dev\oshift\frontend` |
| **REDESIGN** — read-only reference, NEVER edit | `C:\Users\hp\Documents\antigravity\beautiful-volta\oshift` |
| Backend (read for endpoints; do NOT run) | `C:\dev\oshift\backend\backend` |

The redesign was built by the frontend team against an **older snapshot** of this app. It looks better but is **missing features the current app has since gained** (Supabase auth, new routes, new buttons, new panels).

### Prime Directive

**Take the redesign's STYLE. Never lose the current app's FUNCTIONALITY.**

If the redesign lacks something current has — a nav item, a route, a CSS class, a button, a panel — you **keep the current thing and restyle it** in the new visual language. Never delete a feature because the redesign didn't have it. When the redesign has a *better-looking* version of something current also has, take the redesign's markup/CSS and re-attach current's handlers and data.

### Hard rules (non-negotiable)

1. **NEVER start a server.** No `npm run dev`, `next dev`, `next start`, `uvicorn`, `run.bat`, `inngest`. The user's machine hard-freezes when servers run and they have had to cut power. Only ever *tell* the user the command.
2. Allowed verification command, and the only one: `npx tsc --noEmit -p C:\dev\oshift\frontend\tsconfig.json`. Also `npx eslint` in the frontend dir.
3. **Read `C:\dev\oshift\frontend\node_modules\next\dist\docs\` before writing Next.js code.** This is Next.js **16.2.9** — APIs differ from training data. The repo's `AGENTS.md` mandates this.
4. **Use absolute paths in every tool call.** The shell cwd is a stale unrelated dir (`F:\oshift again - Copy\...`); relative paths silently hit the wrong tree. Pass `path: "C:\\dev\\oshift\\frontend"` to Grep/Glob.
5. **IGNORE the redesign's onboarding entirely.** It has a 6-step flow (`onboarding/step-2..step-6`). The user explicitly said current onboarding is better: *"dont copy their onboarding keep ours ours it better"*. Never touch `src/app/onboarding/` and never let ported CSS override it.
6. Don't run `npm install`. Deps already differ (current adds Supabase, lucide-react, react-markdown); the redesign needs no new packages.
7. `F:\oshift again - Copy` is a **stale copy**. Ignore it completely.

---

## 1. Design system the redesign introduces

Read `REDESIGN/src/app/globals.css` in full first. Highlights:

**Font:** Poppins → **Inter** (`--font-inter`).

**Body background:** flat `#111111` → layered radial gradients over `#0d0d11`; `--bg-sidebar`, `--bg-main`, `--bg-main-alt` all become `transparent`. Adds `--bg-pattern-opacity` / `--bg-pattern-filter`.

**New tokens:**
```
--space-xs|sm|md|lg|xl|2xl        4/8/16/24/32/48px
--text-xs|sm|base|lg|xl|2xl       12/13/14/16/24/32px
--card-radius 12px, --card-radius-sm 8px, --card-radius-lg 16px
--card-shadow: none, --card-shadow-hover: none
--page-max-width 1120px, --page-padding-x 40px, --page-padding-top 48px
--skeleton-base, --skeleton-shine, --skeleton-radius
```

**New utility classes (use these instead of inline styles):**
`.btn-primary` `.btn-secondary` `.btn-ink` (+`:hover`) · `.pill` `.pill-accent` `.glass-pill` `.glass-pill.highlight` · `.card` `.card-sm` `.card-lg` `.card-flat` `.card:hover` · `.page-canvas` `.page-container` `.page-inner` `.page-header` `.page-title` `.page-subtitle` · `.section-title` `.divider` · `.stat-block` `.stat-value` `.stat-label` · `.dash-grid` `.profile-grid` `.company-hero` (+`.hero-stat`) `.profile-globe` · `.skeleton` `.skeleton-card` `.skeleton-line` `.skeleton-line-sm` `.skeleton-circle` `@keyframes shimmer` · `.sidebar-logo` · `.deck-wrapper .card|.card-left|.card-right|.deck-front` · responsive `@media` at 1120/1100/780/700px.

The point of the restyle: **replace ad-hoc inline styling with these classes.** That is what kills the "AI slop" look. Page-local inline styles should survive only where no class covers them.

---

## 2. Phase 1 — Shared foundation (MUST land before Phase 2)

One agent, sequential, blocking. Owns **only** these files. Must NOT open any `page.tsx` / `loading.tsx` / `not-found.tsx` — Phase 2 agents own those.

### 2.1 `src/app/globals.css` — merge, do not overwrite

Base = redesign's file. Then **merge back the 36 selectors that exist only in current** (they back live pages; losing them breaks chat and the deck):

`.chat-window` · `.chat-header` · `.chat-header-actions` · `.chat-header-btn` (+`:hover`) · `.chat-title-group` (+` img`, +` span`) · `.chat-body` (+`::-webkit-scrollbar`, +`::-webkit-scrollbar-thumb`) · `.chat-bubble` (+`.user-bubble`, `.assistant-bubble`, `.error-bubble`) · `.chat-message-wrapper` (+`.user`, `.assistant`) · `.chat-avatar-icon` (+`.user-avatar`, `.assistant-avatar`, `.assistant-avatar img`) · `.command-wrapper.show-wrapper .chat-window` · `.typing-indicator` · `.typing-dot` (+`:nth-child(1|2|3)`) · `@keyframes typingPulse` · `@keyframes skeletonPulseLight` · `.card-left` · `.card-right` · `.deck-front` · `.main-content:active` · `body:has(.auth-root)` · `[data-theme="light"] body.is-thinking-active .skeleton-target::after`

Re-verify that list with your own diff before trusting it. **Watch out:** `.card-left` / `.card-right` / `.deck-front` exist in the redesign but **scoped under `.deck-wrapper`** — reconcile so both scoped and unscoped usages still render.

Sanity check afterwards: grep the current `src/app` and `src/components` trees for every class name you removed or rescoped, and confirm nothing references it.

### 2.2 `src/app/light-overrides.css`, `auth.css`, `profile.css`

Same merge discipline. Current `auth.css` is 653 lines vs redesign 632; current `profile.css` is 533 vs 438 — current has extra rules, likely for newer auth states and profile panels. Diff, take the redesign's look, keep current's extra selectors.

### 2.3 `src/app/layout.tsx`

Redesign switches Poppins → Inter, adds `PinnedProvider`, adds favicon. Port all three. **Keep** current's existing CSS imports. Target shape:

```tsx
import { Inter } from "next/font/google";
import "./globals.css";
import "./light-overrides.css";
import "./profile.css";
import AppShell from "@/components/AppShell";
import { ThemeProvider } from "@/components/ThemeProvider";
import { PinnedProvider } from "@/context/PinnedContext";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "OShift",
  description: "Campaigns and Partnerships Dashboard",
  icons: { icon: "/logo.png" },
};
// body className={`${inter.variable} font-sans`}
// <ThemeProvider><PinnedProvider><AppShell>{children}</AppShell></PinnedProvider></ThemeProvider>
```
Copy `REDESIGN/public/logo.png` → `CURRENT/public/logo.png` (current lacks it). Do not delete current's `investigator_mascot.png`.

### 2.4 `src/components/AppShell.tsx`

Port the redesign's `PromptFieldProvider` wrapper + framer-motion `AnimatePresence` page transition (`key={pathname}`, opacity/y 6→0→-4, 0.22s).

**CRITICAL:** the redesign's `SHELL_EXCLUDED_ROUTES` is missing `'/workspaces'` and `'/auth'`, which current has. Merged array must be the **union**:
```ts
['/login','/signup','/forgot-password','/update-password','/onboarding','/workspaces','/auth']
```
Dropping those renders the sidebar over the workspace picker and the OAuth callback.

### 2.5 `src/components/Sidebar.tsx`

Port the redesign's visual treatment (`.sidebar-logo`, `.sidebar.collapsed .sidebar-logo`, spacing, active state).

**CRITICAL:** current has nav items the redesign lacks — **`/chat` (AI Agent Chat), `/automations`, `/exports`, `/social-accounts`**. All must survive, restyled. Take the **union** of nav items. Keep current's theme toggle and collapse button.

### 2.6 New shared components to port

`src/components/Skeleton.tsx`, `AuthLoading.tsx`, `DashboardLoading.tsx`, `PromptFieldContext.tsx` (current is MISSING this and AppShell will need it), and `src/context/PinnedContext.tsx` (new dir).

Then diff-and-improve, keeping current behaviour: `ThemeProvider.tsx`, `AuthRightPanel.tsx`, `SkeletonOverlay.tsx`, `OrangeWaveBackground.tsx`, `PromptField.tsx`, `Globe.tsx`, `InfiniteCanvas.tsx`.

**Gate:** typecheck clean (ignoring Phase-2 files in flight) before Phase 2 starts.

---

## 3. Phase 2 — Page agents (parallel, disjoint file sets)

**File ownership is exclusive. An agent edits only its own listed files.** Two agents editing one file will corrupt each other.

**Shared-file rule:** `src/lib/api.ts` is shared — **wiring agents must NOT edit it.** Each wiring agent imports only `apiFetch` / `ApiResult` from `@/lib/api` and declares its own types + fetchers **inside its own `src/hooks/use-<domain>.ts`**. This matches the existing `use-automations.ts` / `use-exports.ts` pattern and guarantees zero conflicts.

| Agent | Files owned | Job |
|---|---|---|
| **A** | `src/app/settings/page.tsx`, `src/hooks/use-settings.ts` | Wire + restyle |
| **B** | `src/app/profile/page.tsx`, `src/hooks/use-profile.ts` | Wire + restyle |
| **C** | `src/app/company/[domain]/page.tsx`, `src/hooks/use-company.ts` | Wire + restyle |
| **D** | `src/app/page.tsx` | Restyle only (already wired) |
| **E** | `src/app/campaigns/page.tsx`, `src/app/campaigns/[id]/page.tsx` | Restyle only |
| **F** | `src/app/partnerships/page.tsx` | Restyle only |
| **G** | `src/app/competitors/page.tsx` | Restyle only |
| **H** | `src/app/login/page.tsx`, `signup/page.tsx`, `forgot-password/page.tsx`, `update-password/page.tsx`, `not-found.tsx` + those dirs' `layout.tsx` | Restyle only |

Line counts (current vs redesign) — where current is **larger**, current has features the redesign lacks, so expect to keep extra markup:

```
page.tsx (dashboard)      cur 1116  new  391   <-- current far ahead; restyle in place, do NOT adopt wholesale
profile/page.tsx          cur  553  new  404
settings/page.tsx         cur  367  new  347
campaigns/page.tsx        cur  489  new  506
campaigns/[id]/page.tsx   cur  821  new  821
partnerships/page.tsx     cur  933  new  821
competitors/page.tsx      cur  678  new  275   <-- current far ahead
company/[domain]/page.tsx cur  613  new  505
login/page.tsx            cur  172  new  152
signup/page.tsx           cur  243  new  256
forgot-password/page.tsx  cur   80  new   96
update-password/page.tsx  cur  135  new  135
not-found.tsx             cur  435  new  476
```

### 3.1 Restyle-only agents (D–H) — method

1. Read the current page fully. Inventory every interactive element: buttons, handlers, links, state, data hooks, conditional/loading/error/empty branches.
2. Read the redesign's counterpart. Inventory its visual language.
3. Rewrite the current page using the redesign's classes and layout primitives (`.page-container` / `.page-inner` / `.page-header` / `.page-title` / `.card` / `.btn-*` / `.pill` / `.stat-block`), replacing inline styles.
4. **Diff your inventory from step 1 against the result. Every item must still be present and functional.** Anything the redesign has no visual precedent for, style consistently by hand using the new tokens.
5. Do not introduce mock data. If a page is already wired to a hook, it stays wired.

**Agent D note:** the dashboard was just wired this session (`src/hooks/use-dashboard.ts`, live opportunities/gaps/reviews/campaigns rails, `RailState` loading/error/empty component, `SampleBadge` marking the two widgets that legitimately have no backend — the 3 platform charts and the Performance panel). **Preserve all of it**, including both `SampleBadge`s. The redesign's dashboard is 391 lines against current's 1116 — it is a much older, much smaller page. Do **not** adopt it wholesale; mine it for visual treatment only.

**Agent H note:** auth pages are Supabase-backed in current and were NOT in the redesign's auth flow in the same form. Preserve every Supabase call, error state, and redirect. Style only.

### 3.2 Wiring agents (A–C) — method

1. **Find the real endpoints first.** Read the backend routers under `C:\dev\oshift\backend\backend\app\`. Router prefixes: `/automation` `/campaigns` `/competitors` `/briefs` `/exports` `/core` `/agent` `/hermes` `/opportunities` `/video` `/normalizer` `/sense` `/social` `/graph` `/insights`. All frontend calls go through `apiFetch`, which prefixes `/v1`.
2. **Traps learned the hard way — do not repeat these:**
   - Some routers register endpoints via `router.add_api_route(...)` in a **loop** (e.g. `app/insights/`), not `@router.get` decorators. A grep for `@router.get` will **miss real endpoints**. Read the router module properly.
   - Tables use **double-prefixed** names: `core.core_workspaces`, `insights.insights_gaps`. Exceptions: `signals.signals`, `alerts.alerts`.
   - `campaigns.campaigns` is the real campaigns table and is what `/v1/campaigns` reads. It was previously dead — zero readers/writers, while the routes read `insights.insights_gaps WHERE layer='campaign'` instead — but the backend was re-pointed at it. `insights_gaps` still holds AI-synthesised gap rows, which are a different thing. Note `campaigns.campaigns` has no `confidence` column, so the API returns null there.
   - **Never invent a field.** If the DB has no budget/spend/ROI/reply-state column, do not fake it. Either drop the UI element or mark it with the existing `SampleBadge` pattern from `src/app/page.tsx` and leave a code comment naming the missing backend.
3. If an endpoint genuinely does not exist, **do not build a backend router.** Keep the UI element, render it from a clearly-labelled placeholder, comment why, and report it.
4. Follow `src/hooks/use-dashboard.ts` as the reference hook: per-rail `{items, loading, error}` state, `Promise.all`, each rail settles independently so one failing endpoint can't blank the page, `refresh()` via a nonce in the effect deps.
5. Auth context: workspace id comes from `sessionStorage.getItem("oshift.workspace_id")`; `apiFetch` sets `X-Workspace-ID` and the bearer token automatically. Session user via `createClient().auth.getUser()` from `@/utils/supabase/client`.
6. Then restyle per §3.1.

Pages must be `'use client'` — they need state, effects and handlers. (Confirmed against the Next.js Server/Client Components doc in `node_modules`.)

---

## 4. Verification & reporting

Each agent, before reporting done:
- `npx tsc --noEmit -p C:\dev\oshift\frontend\tsconfig.json` — fix errors **in your own files**; ignore others' in-flight errors.
- `npx eslint <your files>` from `C:\dev\oshift\frontend` — unused declarations will fail lint. (Known dead symbols already in `src/app/page.tsx`: `platformLabels`, `Sparkline`, `TrendArrow` — Agent D should remove them.)
- Grep your page for leftover mock arrays / Unsplash URLs / hardcoded avatars.

Report: files changed · features preserved · anything deliberately not ported and why · anything needing a human decision.

Final integration step (owner: orchestrator): full typecheck + lint, then hand the user the run command **without executing it** — `C:\dev\oshift\backend\run.bat` (starts backend + frontend; Inngest intentionally omitted).

---

## 5. Outstanding, user-side

Move the Windows pagefile from D: to C: (`sysdm.cpl` → Advanced → Performance Settings → Advanced → Virtual memory) and reboot. This is the actual fix for the freeze-on-`npm run dev`.

