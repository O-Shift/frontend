# Restyle Fix-Up Plan

Hand this to the agent that did the restyle. It corrects that pass. Every claim
below was verified against the working tree and the backend routers on
2026-08-08 — file:line references are real.

---

## 0. Read this first: what you got right, and what the real problem is

**You did not delete any fetches.** The suspicion that you removed working data
calls is wrong, and you should not "restore" anything on that basis. Endpoint
strings across `src/` went from 32 → 42. Net **+10**, zero lost:

```
ADDED: /campaigns${queryString}            /insights/gaps${queryString}
       /campaigns/${activeCamp.id}         /sense/reviews${queryString}
       /core/workspaces/${id}/members      /core/workspaces/${id}/invitations
       /competitors/${cid}/signals/aggregated?metric=market_share|engagement|score
LOST:  (none)
```

You also **replaced real mock with real data** on the dashboard. `HEAD`'s
`src/app/page.tsx` had `apiFetch` count **0** and **10** hardcoded arrays. It
was a fully faked page. It now runs on `useDashboard()`. That was the right
call. Same for settings: `use-settings.ts` genuinely fetches members +
invitations and unifies them. Keep both.

`npx tsc --noEmit` is **clean, 0 errors**. Keep it that way.

**The real problems are four:** fabricated data in `use-profile.ts`, mock
fallbacks that silently substitute for empty API results, a dangling font token,
and three incompatible styling dialects that make buttons look different from
page to page. Fix those. In that order.

---

## 1. Hard rules

1. **Never start a server.** No `npm run dev`, `next dev`, `next start`,
   `uvicorn`, `run.bat`, `inngest`. The user's machine hard-freezes and they
   have had to cut power to recover. If you need the app running, hand the
   command to the user and stop.
2. **Allowed verification, run from `C:\dev\oshift\frontend`:**
   `npx tsc --noEmit --incremental false -p C:/dev/oshift/frontend/tsconfig.json`
   and `npx eslint src/app src/hooks src/components`. Nothing else.
3. **Use absolute `C:\dev\oshift\...` paths in every tool call.** The shell cwd
   resets to `F:\oshift again - Copy` between calls. That `F:` tree is a **stale
   copy** — it even has its own `tsconfig.json`, so a bare `-p tsconfig.json`
   typechecks the wrong project and invents ~40 phantom errors in
   `company/[domain]/page.tsx`. That file is fine. Ignore `F:` entirely.
4. **Do not touch `src/app/onboarding/`.** The user's onboarding stays.
5. **Do not run `npm install`.** No new dependencies.
6. **Do not edit `src/lib/api.ts` structurally.** Add a typed fetcher only if
   nothing there fits, and keep domain types in the owning `use-<domain>.ts`.
7. **Never remove a control to make styling easier.** Restyle it in place. If a
   button has no backend to call, keep it and mark it — see §6.

---

## 2. P0 — `src/hooks/use-profile.ts` is 90% fabricated

This is the file the user is reacting to. `DUMMY_PROFILE_DATA` (line 14) is both
the initial state *and* the permanent fallback. The fetch overwrites exactly
four fields — `name`, `company`, `workspaceRole`, `corporate.company`. Everything
else ships fake forever:

| Field | Status | Real source |
|---|---|---|
| `competitors[]` (5 hardcoded: Rabbit, Talabat, InstaShop, Breadfast, Noon) | **fake, and trivially fetchable** | `GET /competitors` — already used by 3 other pages |
| `name`, `company`, `workspaceRole` | fetched | keep |
| `markets.countries` / `.regions` / `.industries` | fake | no endpoint — see §6 |
| `objectives[]` (progress %, deadlines) | fake | no endpoint — see §6 |
| `areasOfFocus[]` (metrics like "12 Live Watchlists") | fake | partly derivable — see below |
| `bio`, `department`, `industry`, `jobTitle` | fake | not on `WorkspaceResponse` — see §6 |

### 2a. Delete the hardcoded person

`DUMMY_PROFILE_DATA.name` is `'Vasil Stoyanov'` and `jobTitle` is
`'Head of Strategy'`. That is a real-looking human identity shipping as the
default for every user. Remove it. Derive the display name the way
`use-dashboard.ts` already does (lines 60–74) — from the Supabase session:

```ts
const { data } = await createClient().auth.getUser();
const meta = data.user?.user_metadata ?? {};
const name = (typeof meta.full_name === 'string' && meta.full_name.trim())
  || (typeof meta.name === 'string' && meta.name.trim())
  || data.user?.email?.split('@')[0]
  || null;   // null, not a fake name
```

### 2b. Fetch the competitor list

Replace the hardcoded `competitors` array with a real fetch. The favicon trick
the mock uses is fine to keep for logos — feed it `competitor.website`:

```ts
const compRes = await apiFetch<Competitor[]>('/competitors');
// name: c.name, logo: faviconFor(c.website)
```

### 2c. Derive `areasOfFocus` metrics instead of inventing them

Three of the four are real counts already reachable:

- "Competitor Intel — *N* Live Watchlists" → `competitors.length`
- "Partnerships — *N* Alliances" → `GET /graph/partnerships`
- "Market Expansion — *N* Active Markets" → distinct `competitor.industry`
  values, or drop the metric and keep the label

Anything you cannot derive: drop the number, keep the label. Do not invent a
metric.

### 2d. Two correctness bugs in the same file

- Line ~86: it picks `workspaces[0]`, ignoring the workspace the user actually
  selected. `use-dashboard.ts` (line ~128) and `use-settings.ts` (line ~66) both
  read `sessionStorage.getItem('oshift.workspace_id')` and match on it. Do the
  same here. As written, a user in their second workspace sees the first one's
  name.
- Line ~95: `const member = members[0]` — the first member of the workspace is
  not the current user. It is usually the owner. Match the member whose `email`
  or `user_id` equals the Supabase session user, and fall back to `null`.

Also line 115 `catch (err: any)` is the one lint error in this file. Type it
`unknown` and narrow.

---

## 3. P0 — mock fallbacks that impersonate real data

`src/app/company/[domain]/page.tsx` fetches correctly through `useCompany()`
but falls back to module-level fakes whenever the API returns an empty list:

| Line | Mock | Used at |
|---|---|---|
| 9 | `mockChartData` (10 months of share/engagement/time) | 199 — `chartData` memo |
| 22 | `gaps` (Gen-Z Reach, Sponsorship ROI, Sentiment Dip) | 224 |
| 28 | `reviews` (Karan, Sarah + Unsplash face photos) | 232 |
| 35 | `campaigns` | 241 |
| 316 | **Lorem ipsum** as the competitor description fallback | 316 |

**An empty API result is a real state, not a failure.** The pipeline simply has
not produced rows yet. `use-dashboard.ts` documents this correctly in its own
header comment — *"An empty list after a successful fetch is a valid state ... it
is not an error."* Apply that same rule here.

Do this for each of the four:

1. Delete the module-level mock array.
2. Render an empty state: one line of copy plus, where it makes sense, the
   action that would populate it (`POST /competitors/{id}/scrape` for signals,
   `POST /insights/run` for gaps, `POST /sense/reviews/collect` for reviews).
3. Keep the chart axes and card frame visible so the layout does not jump.

### 3a. Worst case — real and fake data mixed in one array

Line 240:

```ts
imgs: c.posts.map(p => p.url).filter(Boolean).slice(0, 3)
        .concat(campaigns[i % campaigns.length]?.imgs || campaigns[0].imgs)
```

Real post URLs are concatenated with mock stock images. The user cannot tell
which images came from their competitor and which you invented. Drop the
`.concat(...)` entirely and render however many real images exist.

### 3b. Replace Lorem ipsum

Line 316 falls back to a paragraph of Lorem ipsum for `competitor.description`.
Use `—` or "No description captured yet." Never filler Latin.

### 3c. `use-company.ts` shows the wrong company

Lines ~50–53:

```ts
let comp = res.data.find(c => c.website?.toLowerCase().includes(domain.toLowerCase()));
if (!comp && res.data.length > 0) comp = res.data[0];   // <-- silently wrong
```

If the domain in the URL matches nothing, the page renders a **different
competitor** under that domain's heading, with no indication. Delete the
fallback. Set an error and render a not-found state.

Note: `SampleBadge title="Mock data"` at lines 373/419/473/521 was the right
instinct — you labelled the fakes instead of hiding them. Once the mocks are
gone those badges go too. Same for the five in `profile/page.tsx`
(214/271/308/335/359) as each section becomes real.

---

## 4. P1 — the font token is dangling

`--font-poppins` is **defined nowhere in `src/`**. The design system moved to
Inter: `globals.css:6` is `--font-sans: var(--font-inter), 'Inter', sans-serif`
and `layout.tsx:10` imports only `Inter`. Three files still reference the dead
token, so those elements silently fall back to the browser default:

- `src/app/settings/page.tsx:81` and `:105` — the `<h1>` page titles. **The
  Settings heading is rendering in the wrong font right now.**
- `src/app/auth.css` — 1 reference
- `src/app/onboarding/onboarding.css` — 1 reference

Replace every `var(--font-poppins)` with `var(--font-sans)`. For the two in
`settings/page.tsx`, drop the inline `fontFamily` altogether — it inherits
`--font-sans` from `body`. Do not add a Poppins import.

---

## 5. P1 — this is why "some btns arent the same"

`globals.css` defines six button/pill primitives. Adoption across the restyled
pages is close to zero:

| Class | Used in |
|---|---|
| `.btn-primary` | `onboarding/page.tsx` only — the one file you must not touch |
| `.btn-secondary` | campaigns, partnerships, onboarding |
| `.pill` | campaigns, partnerships |
| `.btn-ink` | **nowhere** |
| `.glass-pill` | **nowhere** |
| `.stat-value` / `.dash-grid` / `.profile-grid` / `.company-hero` | **nowhere** |

So no restyled page uses the primary button style at all. Instead there are
three dialects in one app:

| Page | inline `style={{` | DS classes | Tailwind-ish |
|---|---|---|---|
| `settings/page.tsx` | **91** | 13 | 0 |
| `opportunities/page.tsx` | **92** | 17 | 0 |
| `competitors/page.tsx` | **50** | 12 | 0 |
| `not-found.tsx` | **38** | 12 | 0 |
| `campaigns/page.tsx` | 27 | 10 | 2 |
| `company/[domain]/page.tsx` | 10 | 23 | 71 |
| `page.tsx` (dashboard) | 6 | 16 | 84 |
| `profile/page.tsx` | 1 | 21 | 86 |

Dashboard/profile/company went Tailwind-utility. Campaigns/partnerships went
design-system classes. Settings/opportunities/competitors/not-found stayed
inline-styled — those four never got restyled at all, they just kept working.

**Converge on the design-system classes.** They are the shared contract; they
theme correctly and they are the only way two pages end up with the same button.

Order of work, highest inline-style count first:

1. `settings/page.tsx` — 12 `<button>` elements, 0 DS classes. Every one becomes
   `.btn-primary` / `.btn-secondary` / `.btn-ink`. Wrap in `.page-container` >
   `.page-inner`, heading in `.page-header` / `.page-title`.
2. `opportunities/page.tsx` — 92 inline styles, and 17 errors of its own.
3. `competitors/page.tsx` — 50 inline styles, 6 buttons.
4. `not-found.tsx` — 38 inline styles.
5. Then sweep dashboard/profile/company: swap ad-hoc Tailwind button clusters
   for `.btn-*`, stat numbers for `.stat-value` / `.stat-label`, page frames for
   `.page-container` / `.page-header` / `.page-title`.

Keep `.skeleton-target` markers wherever they already are — `SkeletonOverlay`
depends on them.

Two locals to fold in rather than leave as one-offs:
`campaigns/page.tsx` and `partnerships/page.tsx` both use `v0-toggle-btn`, and
partnerships uses `icon-btn`. Either promote them into `globals.css` as real
primitives or replace them with `.btn-secondary` / `.btn-ink`.

---

## 6. What genuinely has no backend — label it, don't fake it

Verified against every router in `C:\dev\oshift\backend\backend\app\*\router.py`.
`WorkspaceResponse` (`app/core/schemas.py:38`) carries exactly: `id`, `name`,
`timezone`, `locale`, `plan`, `created_by`, `created_at`.

There is **no** user-profile table and **no** endpoint for: bio, job title,
department, industry, avatar, objectives/OKRs, or markets (countries / regions /
industries). `MemberResponse` gives you `email`, `status`, `roles` — no name.

For these, pick one and be consistent:

- **(a) Cut the section.** Cleanest. Objectives and bio are inventions of the
  redesign mock; nothing in the product produces them.
- **(b) Keep the UI, empty, with an honest label** — "Not set" plus a disabled
  control. Do this only where the section will plausibly be wired later.

Either way: **do not ship a fabricated value.** No `'Vasil Stoyanov'`, no
`75%` progress, no `'Q3 2026'` deadline, no invented country list.

Settings has real endpoints going unused — wire these instead of faking:

| Settings section | Real endpoint |
|---|---|
| API keys | `GET/POST /core/workspaces/{id}/api-keys`, `DELETE .../api-keys/{key_id}` |
| Feature flags | `GET /core/workspaces/{id}/feature-flags`, `PATCH .../feature-flags/{name}` |
| Members / invites | already wired ✅ |
| Remove a member | `DELETE /core/workspaces/{id}/members/{member_id}` |
| Create invite | `POST /core/workspaces/{id}/invitations` |
| Workspace name/timezone/locale/plan | `PATCH /core/...` |

`SampleBadge` with no `title` at `settings/page.tsx:131`, `:180`, `:219`
(Notifications, Password Reset, Email Notifications) — there is no notifications
endpoint anywhere in the backend. Apply (a) or (b).

Available-but-unwired elsewhere, if you want to replace a mock with real data:
`/alerts/alerts`, `/alerts/alert-rules`, `/brief/current`, `/graph/battlecards`,
`/insights/crises`, `/insights/deals`, `/insights/trends`,
`/insights/neg-comments`, `/scoring/signals`, `/video/assets`, `/social/posts`.

---

## 7. Do NOT "fix" these — they are pre-existing, not yours

Verified present in `HEAD`, so they predate the restyle. Leave them unless the
user asks:

- `partnerships/page.tsx:333` — `value = isHub ? 150 + Math.random()*2000 : ...`
  drives node radius in the force graph. Cosmetic sizing, pre-existing.
- `partnerships/page.tsx:345,346,360,398` — `Math.random()` for initial node
  positions and jitter. Correct use of randomness in a force simulation.
- `campaigns/page.tsx:51` — `IMGS[Math.floor(Math.random()*IMGS.length)]`,
  pre-existing.
- `company/[domain]/page.tsx` — **not corrupted.** Any `TS1127 Invalid
  character` you see there came from typechecking the stale `F:` copy. Rule 3.

Also already done, don't redo: the dashboard's dead symbols (`platformLabels`,
`Sparkline`, `TrendArrow`) are gone, and `Sidebar.tsx` has all 11 routes
including `/chat`, `/automations`, `/exports`, `/social-accounts`.

---

## 8. Dashboard sections that vanished — decide, then act

The dashboard is 1116 → 489 lines. Since `HEAD`'s version was 100% mock, most of
that shrink is legitimate. But six labelled features disappeared, and two were
**interactive controls**, which rule 7 of the original plan said to preserve:

| Gone | `HEAD` ref | Verdict |
|---|---|---|
| **Reply** (button + textarea for reviews) | 738–755 | control removed — restore, wire, or drop deliberately |
| **Apply** (button on suggested action) | 366 | control removed — same |
| Per-Platform Breakdown | 564 | data now exists: `/insights/campaigns` returns per-platform posts |
| BENCHMARK panel | 634 | was mock; leave out unless wanted |
| SUGGESTED ACTION | 630 | `Opportunity` rows carry recommended actions — could be real |
| My Campaigns rail | 493 | `useDashboard()` fetches `campaigns` already — the rail can come back real |

`useDashboard()` **already fetches campaigns** (`fetchCampaigns({ limit: 8 })`)
and the page renders "Latest campaign performance", so the data is in hand.
Restore the rail rather than leaving a fetch whose results are half-used.

For **Reply**: the backend has no review-reply endpoint. Keep the button
disabled with a tooltip, or drop it — but say which you did. For **Apply**:
`PATCH /opportunities/{id}` exists and can move an opportunity's status. That one
is wireable today.

---

## 9. Lint: 121 errors, 57 warnings

Current state of `npx eslint src/app src/hooks src/components`:

```
  87  @typescript-eslint/no-explicit-any
  28  @typescript-eslint/no-unused-vars
  23  @next/next/no-img-element
  14  react-hooks/set-state-in-effect
  13  react/no-unescaped-entities
   5  react-hooks/exhaustive-deps
   4  react/jsx-key
   2  prefer-const
   1  react-hooks/immutability
```

Worst files: `partnerships` 30 errors, `opportunities` 17, `not-found` 7,
`PromptField` 7, `campaigns` 7, `settings` 6, `profile` 6, `exports` 6.

Fix in your own files first, then the shared ones. Two that matter beyond tidiness:

- **`react/jsx-key` (4)** — genuine React bugs. Missing keys corrupt list
  reconciliation; rows visibly swap content on re-render.
- **`react-hooks/set-state-in-effect` (14)** — cascading renders. On this user's
  machine that is a real cost, not a style nit.

`ThemeProvider.tsx:24` has an unused `eslint-disable` directive — delete the
comment.

Landing page files are already clean: `src/app/landing/*` reports **0 errors,
0 warnings**.

---

## 10. Definition of done

- [ ] No `DUMMY_*`, `mock*`, Lorem ipsum, or hardcoded person/company/metric in
      `src/hooks/` or any page under `src/app/` (excluding `onboarding/`).
- [ ] Every empty API result renders a real empty state, never a fake row.
- [ ] Zero `var(--font-poppins)` in `src/`.
- [ ] `.btn-primary` / `.btn-secondary` / `.btn-ink` used app-wide; buttons on
      settings, dashboard and profile are visually identical.
- [ ] `settings`, `opportunities`, `competitors`, `not-found` inline-style counts
      each under ~10.
- [ ] Every control that existed in `HEAD` is present, or its removal is listed
      in your summary with a reason.
- [ ] `npx tsc --noEmit --incremental false -p C:/dev/oshift/frontend/tsconfig.json`
      → 0 errors.
- [ ] `npx eslint src/app src/hooks src/components` → no new errors; `jsx-key`
      and `set-state-in-effect` cleared in files you touched.
- [ ] **You never started a server.**

Report at the end: what you wired to which endpoint, what you deleted, what you
kept-but-labelled, and anything you could not do.

