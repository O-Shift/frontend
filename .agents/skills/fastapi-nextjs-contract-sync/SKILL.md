---
name: fastapi-nextjs-contract-sync
description: >-
  Use whenever a FastAPI backend and a Next.js/React frontend are supposed
  to work together but don't — a dashboard renders blank or stuck on mock
  data, an agent/chat page doesn't show streamed (SSE) responses, data
  "disappears" between the API and the UI, or someone says the frontend and
  backend "aren't merging," "aren't wiring up," or "don't match." Also
  trigger on: "the frontend expects a different shape than the backend
  sends," "SSE events aren't showing up," "dead code in the response
  parser," "the TypeScript type doesn't match the Pydantic model," or when
  reviewing a gap-analysis report flagging backend/frontend mismatches.
  Diffs what a FastAPI endpoint actually emits (JSON bodies, response_model,
  SSE/StreamingResponse/EventSourceResponse events) against what the
  Next.js/React consumer actually reads and handles, flags silent data loss
  and dead speculative-parsing branches, and directly edits whichever side
  is wrong so they agree again.
---

# FastAPI ↔ Next.js Contract Sync

## Why this exists

The most common reason a working backend and a working frontend don't work *together* isn't a missing feature — it's contract drift. Two people (or two agent sessions, weeks apart) each built their half against an assumption about what the other side does, and nobody re-checked those assumptions against the running code. Symptoms: a page that's "100% mocked," a streaming response that arrives instantly instead of typing progressively, a dashboard field that's always blank, a parser with five fallback branches where only one of them ever fires.

These bugs are easy to miss by reading either side alone — the backend code is internally consistent, the frontend code is internally consistent, and the mismatch only exists in the gap between them. This skill's whole job is to stand in that gap.

**Ground rule: trust the running code, never comments, README, or migration notes.** Docs go stale the moment someone changes behavior and forgets to update the paragraph describing it. If a docstring, README, or `CONTEXT.md`-style file disagrees with what the code actually does, the code wins — and the doc is itself a finding to report, not a source to rely on.

## When you're confident enough to just fix it vs. when to ask

You're set up to edit code directly, not just hand back a report. Use that freely for **mechanical** mismatches — a dead branch that can never fire, a field the frontend reads under the wrong name, a response shape that silently drops data the frontend needs. Fix those and say what you changed.

Stop and ask first only when the mismatch might be a **product decision**, not a bug — e.g., the frontend was clearly built expecting progressive token-by-token streaming, but the backend deliberately sends the whole response in one event. That could be a backend gap to close, or it could be intentional (maybe progressive typing is faked client-side elsewhere, or planned for later). Don't silently pick a side when the "right" answer depends on intent you don't have. Everything else — treat as the mechanical bug it almost always is.

## Step 1: Establish backend ground truth

Find the actual route handler(s) involved. Don't reason from the route's name or docstring — read the function body.

**For plain JSON endpoints:**
- Find the `response_model=` on the route decorator, or the Pydantic model / dict actually returned.
- List every field that's actually present at runtime, its exact key name, its type, and whether it's ever `None`/omitted.
- Watch for fields computed conditionally (only present on some code paths) — the frontend needs to handle their absence too.

**For streaming endpoints (SSE via `StreamingResponse`, `EventSourceResponse` / `sse-starlette`, or a raw `yield`-based generator):**
- Find every distinct event `type` the generator can `yield`. Grep for the literal strings passed as `type`/`event` fields — don't assume a list from a comment describes all of them; read every `yield` in the function (and anything it calls).
- For each event type, record its exact JSON shape (which keys, e.g. `content` vs `text` vs `delta`) and **when** it's emitted (once at the end? once per token? on error only?).
- Note anything exposed outside the SSE body entirely — e.g. an ID returned via an HTTP response header (`X-Conversation-Id`) rather than as an event. Headers are an easy thing for a frontend SSE reader to miss because it's only looking at the event stream.
- If there are multiple streaming endpoints in the same app (e.g. one for an agent orchestrator, one for a simpler chat/message endpoint), **do not assume they share an event contract**. Diagnose each one on its own — one might batch its whole response into a single event while another streams token-by-token, and a shared frontend parser that assumes one contract will silently misbehave on the other.

Write this all down as a plain table before moving on — you'll diff against it in Step 3.

## Step 2: Establish frontend ground truth

Find the actual consumer of this endpoint: a `fetch`/`EventSource` call, a hand-rolled `ReadableStream` reader, or a hook (`useSWR`, React Query, a custom `useXStream`). Read the parsing logic itself, not the component that calls it.

- For each event type or field the code branches on, note the **exact string or key** it checks against.
- List every extraction path in order, especially chained fallbacks like:
  ```ts
  const text = data.content ?? data.text ?? data.delta ?? data.chunk ?? data.message?.content;
  ```
  A long fallback chain like this is a specific smell worth naming: it usually means someone wasn't sure what the backend actually sends, so they coded defensively for every shape they could imagine instead of the one shape that's real. That defensiveness *hides* contract drift instead of surfacing it — the code "works" (something in the chain matches) even when most of the branches are dead, so nobody notices when the real shape changes out from under it.
- Note any event/field the parser has **no case for** — these fall through to a generic/default path, which can silently misrender something that was meant to be special-cased (e.g. a clarifying question rendered as an ordinary chat bubble instead of a modal).
- Note the corresponding TypeScript `interface`/`type` if one exists, separately from the runtime parsing logic — they drift from each other too, not just from the backend.

## Step 3: Diff and classify

Build one table per endpoint, one row per event type or field:

| Event/Field | Backend emits (file:line) | Frontend reads (file:line) | Finding |
|---|---|---|---|
| `token` | whole response, one event | `data.content` (matches) | OK, but see progressive-typing note below |
| `question` | `{"type":"question","content":...}` | no explicit case — falls to generic text path | **Unhandled event type** — renders as a chat bubble instead of a prompt |
| `delta`, `chunk`, `message.content` | never emitted by any endpoint | extraction chain checks for these | **Dead code** — safe to remove, but harmless |
| conversation id | `X-Conversation-Id` HTTP header only | reads response headers correctly | OK |

Classify each row as one of:
- **Silent data loss** — backend sends something meaningful the frontend never reads. Usually the highest-priority bug: this is the "why is my dashboard blank" class of issue.
- **Unhandled event/shape** — frontend has no case for something the backend sends, so it falls through to a default path that renders wrong instead of failing loudly.
- **Field mismatch** — same concept, different key name or type (`snake_case` vs `camelCase`, string vs enum, present vs optional).
- **Dead frontend code** — frontend defends against a shape nothing ever sends. Low priority, but worth cleaning up since it's the thing that lets drift go unnoticed (see Step 2).
- **Ambiguous / possible product decision** — see the "when to ask" rule above. Flag and ask instead of guessing.

## Step 4: Fix it

For everything except the ambiguous cases, make the edit directly:
- **Silent data loss / field mismatch / unhandled event** → almost always fix the frontend to match the backend's real shape, since the backend's shape is the actual available data. Add the missing `case`/branch rather than letting it fall through to a default.
- **Dead frontend code** → delete the branches that can never fire. Keep only the extraction path that matches a shape something actually sends.
- If the backend is genuinely missing something the frontend legitimately needs (e.g. it needs per-chunk streaming and the backend batches), that's a backend change — make it if it's a small, mechanical addition (e.g. splitting one `yield` into several); flag it instead if it's a bigger architectural change.

After editing, restate the fix in the report (Step 5) with a plain-language line, e.g. "Frontend now handles `question` events with a modal instead of rendering them as chat text" — not just a diff.

## Step 5: Write the Contract Diff Report

Keep it short — this is a diagnostic artifact, not a deliverable document. Use this shape:

```markdown
## Contract Diff: <endpoint or feature name>

### Backend truth
- <event/field>: <shape> — emitted <when> (`file:line`)

### Frontend before
- <what it actually read/handled> (`file:line`)

### Findings
| Finding | Severity | Fix applied |
|---|---|---|
| ... | Silent data loss / Unhandled event / Dead code / Ambiguous | ... |

### Changes made
- `path/to/file.ts`: <plain-language description of the edit>

### Flagged for you (not auto-fixed)
- <anything classified as ambiguous, with why>
```

If you're working from a written gap-analysis or audit report rather than live code, treat its claims the same way you'd treat a comment or README: useful as a map of where to look, not as ground truth. Re-verify each claim against the actual source before fixing anything — reports go stale too, sometimes within the same review cycle.

## Common FastAPI patterns to recognize

- `StreamingResponse(generator(), media_type="text/event-stream")` with hand-formatted `f"data: {json.dumps(...)}\n\n"` lines — read the generator function for every distinct payload shape.
- `sse-starlette`'s `EventSourceResponse` — events may set an explicit `event=` name separate from the JSON body's own `type` field; check both, since a frontend might switch on one and miss the other.
- Pydantic `response_model` mismatches: a route can declare one `response_model` but the frontend was written against an older or hoped-for version of that model. Compare the model's fields directly against the TypeScript type, field by field.
- Data returned via headers (`X-Conversation-Id` and similar) instead of the body — easy for both sides to disagree on silently since it's not visible in either the JSON body or the event stream.

## Common Next.js/React patterns to recognize

- A shared low-level "sse client" or "stream reader" utility used by multiple endpoints — check that its assumptions (one event shape, one timing model) actually hold for *every* endpoint that uses it, not just the one it was first written for.
- Fallback-chain field extraction (`a ?? b ?? c ?? d`) — always worth listing out which of the alternatives, if any, are actually live.
- A `switch`/`if` on event `type` with a `default`/`else` that silently renders as generic text — check what specific event types fall into that default and whether any of them were meant to be handled specially.
- Components reading from local mock data/arrays instead of the API client at all — this is a different failure mode (nothing is wired up yet, rather than wired up wrong) and is worth calling out separately so it doesn't get miscounted as a contract mismatch.
