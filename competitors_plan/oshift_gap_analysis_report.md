# OShift Backend ↔ Frontend Gap Analysis — Final Report

| Field | Value |
|---|---|
| **Document Version** | 1.1 (corrects v1.0 model-identity error after user feedback; adds §1.19 stale-doc audit) |
| **Date** | 2026-07-24 |
| **Author** | Super Z (AI Assistant) |
| **Sources Analyzed** | `OShift-main.zip` (backend + testing frontend), `oshift-master.zip` (production frontend), `Features_probably_missing.txt` |
| **Verification Method** | Direct read of all 19 SQL migration files + targeted code-level verification of 16 markdown-derived claims (after user correction) |
| **Status** | Approved for delivery (user-confirmed scope decisions inline) |

---

## Executive Summary

OShift is a multi-tenant competitive-intelligence platform whose backend and production frontend were developed in parallel with limited alignment. After reading both codebases, all 19 SQL migration files, the backend `MIGRATION_NOTES.md`, and cross-referencing `Features_probably_missing.txt`, this report catalogs **18 missing features**, **4 critical bugs**, and **7 stubs/placeholders** that block the product from shipping as a coherent whole.

**Important methodological note (added in v1.1):** An earlier draft of this report (v1.0) trusted `MIGRATION_NOTES.md` when it claimed the agent had been migrated to MiniMax-M2.7. The user corrected this — the agent is **Kimi K2.6**, not MiniMax (the MiniMax migration was rolled back in code but the docs were never updated). After that correction, every markdown-derived claim in this report was re-verified against actual source code; the results are in §1.19. The bottom line: **the codebase has multiple stale-doc files (`MIGRATION_NOTES.md`, `CONTEXT.md` §4, `.env.example`, several module docstrings) that contradict the runtime code.** Whenever this report and a markdown doc disagree, the report wins (because it was re-verified against code).

The single biggest finding is a **product-identity mismatch**: the backend is built as a competitive-intelligence engine (crawl competitors → score signals → produce insights/battlecards/briefs about competitors), while the production frontend's dashboard is built as a creator-analytics product (Total Followers, Total Views, Revenue MTD, YouTube/TikTok/Instagram/Podcast breakdowns). The user has confirmed (decision **A1a**) that the backend must be extended to ingest the user's own creator analytics for Instagram and TikTok, with revenue dropped entirely from MVP scope.

The second biggest finding is that the **`is_self=true` pattern** (modeling the user's own company as a special competitor row) is too confusing and should be migrated to a dedicated `company` schema (decision **E3**). This is the single largest line-item in the report — a ~15-file surgical refactor — but the user has confirmed it is the right call.

Implementation is organized into **7 phases** ranging from immediate bug fixes (~1 day) to creator-analytics ingestion (~3 weeks). Total estimated effort: **8–12 weeks** for a single full-stack developer, with the option to parallelize Phase 4 (new features) and Phase 5 (creator analytics).

Both a Markdown source (this file, for AI agents) and a PDF rendering (for human review) are delivered.

---

## Part 1 — Critical Code-Level Findings (Ground Truth)

This section documents what was **verified by reading the actual code and SQL migrations** — not inferred from comments or summaries. Every claim here is backed by a file:line reference.

### 1.1 Schema Source of Truth

The `supabase/migrations/` folder contains 19 files totaling ~800 lines of SQL. However, the **vast majority of the actual schema is NOT defined in the repo**. The migrations contain:

- **3 Phase-1 prototype tables** (in the `public` schema, not the double-prefixed app schemas): `competitor_sources`, `competitor_signals`, `social_posts`, `video_analyses`. These appear to be dead — the active code uses `competitors.competitors_competitors`, `social.social_post_cache`, `video.video_assets`, etc. instead.
- **1 schema + 3 table creations** for the `video` schema (`video.video_assets`, `video.video_analyses`, `video.video_cache`) in migration `20260726_07_video_schema_assets.sql`.
- **ALTER TABLE statements** that modify pre-existing tables: `competitors.competitors_competitors`, `insights.insights_gaps`, `graph.graph_corrections`, `scoring.scoring_prompts`, `signals.signals` (partition RLS), `hermes.hermes_messages` (partition RLS), `core.audit_log` (partition RLS), `core.core_workspaces`, `core.core_users`, `core.core_workspace_members`.
- **RLS policy definitions** for the above tables.
- **Role/permission setup** in `20260716_oshift_app_role.sql` (grants to the `oshift_app` role).

**Implication:** The real DDL for `core.*`, `competitors.*`, `social.*`, `sense.*`, `signals.*`, `normalizer.*`, `scoring.*`, `graph.*`, `insights.*`, `brief.*`, `hermes.*`, `alerts.*`, `exports.*`, `automation.*` schemas lives **only on Supabase Cloud**, created out-of-band (the spec bible docs referenced in migration comments are not in this repo). All schema references in this report are therefore inferred from SQL statements in the application code (SELECT/INSERT/UPDATE column lists). Direct DDL verification requires Supabase Cloud access.

### 1.2 Table Naming Convention (Verified)

Tables use a **double-prefix** convention: `competitors.competitors_competitors`, `insights.insights_gaps`, `graph.graph_entities`, `graph.graph_relationships`, `social.social_accounts`, `social.social_post_cache`, `sense.sense_reviews`, `signals.signals`, `brief.briefs`, `hermes.hermes_conversations`, etc.

**Exceptions** (called out in `CONTEXT.md` §3.2): `signals.signals`, `signals.signals_dedup`, `core.schema_migrations`, `core.core_change_requests`, and the `alerts` namespace tables (`alerts.alerts`, `alerts.alert_rules`, `alerts.alert_acks`, `alerts.alert_deliveries`).

A unit test at `backend/tests/unit/test_agent_tools.py:870-873` explicitly verifies the double-prefix:
```python
# Verify exact table queried is competitors.competitors_competitors
assert "competitors.competitors_competitors" in query_str
assert "competitors.competitors " not in query_str
```

### 1.3 BUG: Migration `20260726_07_video_schema_assets.sql` Has a Broken FK

**File:** `supabase/migrations/20260726_07_video_schema_assets.sql:16`

```sql
CREATE TABLE IF NOT EXISTS video.video_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES core.core_workspaces(id) ON DELETE CASCADE,
    competitor_id UUID NOT NULL REFERENCES competitors.competitors(id) ON DELETE CASCADE,  -- ← WRONG
    ...
);
```

The FK references `competitors.competitors(id)` (single prefix), but the actual table is `competitors.competitors_competitors(id)` (double prefix). This migration would **fail at apply time** on a fresh database. It currently works on the live Supabase Cloud only because the table likely already exists with the correct FK from an out-of-band DDL.

**Fix:** Change line 16 to `REFERENCES competitors.competitors_competitors(id) ON DELETE CASCADE`. Track as **Phase 0 bug fix**.

### 1.4 Model Identity: Kimi K2.6 (NOT MiniMax — docs are stale)

**Verified against actual code (not against markdown docs).**

`backend/app/config.py:36-38` — Pydantic Settings defaults to Kimi K2.6:
```python
gemini_api_key: str
gemini_flash_model: str = "moonshotai/Kimi-K2.6"
gemini_pro_model: str = "gemini-3.1-pro-preview"
```

`backend/app/scoring/io/gemini_flash_client.py:88-90` — module-level constants also default to Kimi:
```python
# Default MiniMax inference endpoint.
_DEFAULT_KIMI_BASE_URL = "https://inference.dahl.global"
_DEFAULT_KIMI_MODEL = "moonshotai/Kimi-K2.6"
```

`backend/app/scoring/io/gemini_flash_client.py:210-226` — the constructor **actively remaps** any MiniMax-M2.7 (or legacy `gemini-3.5-flash`) string back to Kimi K2.6:
```python
def __init__(
    self,
    api_key: SecretStr | str,
    model: str = _DEFAULT_KIMI_MODEL,           # "moonshotai/Kimi-K2.6"
    base_url: str | None = None,
) -> None:
    # Accept legacy model names gracefully — they map to MiniMax-M2.7.
    if model in {
        "gemini-3.5-flash",
        "MiniMaxAI/MiniMax-M2.7",
    }:
        model = _DEFAULT_KIMI_MODEL             # REMAPS to Kimi K2.6!
    ...
    self.model_name = model
```

`backend/app/scoring/io/gemini_flash_client.py:278-285` — the JSON payload sent in HTTP requests uses `self.model_name`, which is Kimi K2.6 (or remapped-to-Kimi):
```python
payload: dict[str, Any] = {
    "model": self.model_name,
    "messages": messages,
    "temperature": temperature,
    "stream": stream,
}
```

**Corroborating code comments that contradict the stale docs:**
- `app/agent/tools/__init__.py:3`: "Tools the agent can call via **Kimi K2.6** function-calling:"
- `app/agent/orchestrator.py:100`: "Call Kimi with stream=False. **Kimi-K2.6 is a reasoning model** that buffers the entire response…"
- `app/sense/news.py:32-33`: "Improved prompt for **Kimi K2.6**…"

**The MiniMax migration in `MIGRATION_NOTES.md` (§"v7 Update: MiniMax-M2.7 Adoption") was rolled back in code but the docs were never updated.** The code is internally inconsistent: the module-level docstring of `gemini_flash_client.py` (lines 1-26) still says "MiniMax-M2.7 migration… delegates to the MiniMax-M2.7 inference endpoint", but the runtime code defaults to Kimi K2.6 AND actively remaps any MiniMax string back to Kimi. Similarly, `app/prompts/agent.py:6,12` describes the agent as "MiniMax M2.7" — stale. `.env.example:42` documents `GEMINI_FLASH_MODEL=MiniMaxAI/MiniMax-M2.7` — also stale (and even if a user follows it, the constructor silently converts it to Kimi K2.6).

**Implication for the report:** All references to "MiniMax-M2.7" in code docstrings, `MIGRATION_NOTES.md`, `CONTEXT.md`, `.env.example`, and `app/prompts/agent.py` are stale documentation. The actual production model is `moonshotai/Kimi-K2.6` hosted at `https://inference.dahl.global/v1/chat/completions` (OpenAI-compatible). Hash-based 768-dim embeddings (because Kimi has no embeddings endpoint) and URL-based video analysis (because Kimi cannot ingest video files) are both still in effect — only the "MiniMax" label is wrong.

**Action item (documentation cleanup):** Update `MIGRATION_NOTES.md`, `CONTEXT.md` §4, `.env.example`, the `gemini_flash_client.py` module docstring, `app/io/gemini_pro_video.py` module docstring, and `app/prompts/agent.py` to say "Kimi K2.6" instead of "MiniMax-M2.7". Track as **Phase 0 doc cleanup** (no functional change, but the stale docs will confuse future maintainers and AI agents).

### 1.5 CRITICAL BUG: `stub_platform_miner` Is the DEFAULT Review Collector

**File:** `backend/app/sense/reviews.py:21-50`

```python
def stub_platform_miner(platform: str, competitor_id: UUID) -> list[dict[str, Any]]:
    """Return canned reviews for v1. Returns the same shape that the real v1.1 miner will."""
    _ = competitor_id
    return [
        {"review_id": f"{platform}-001", "rating": 5, "body": "Best product we've used this year...", "author": "Reviewer A", "comments": [...]},
        {"review_id": f"{platform}-002", "rating": 2, "body": "Slow customer support...", ...},
        {"review_id": f"{platform}-003", "rating": 4, "body": "Solid value for the price...", ...},
    ]
```

This function is the **default `platform_miner`** for `ReviewsCollector` (line 62). Every time the `_run_sense` pipeline step runs (which is part of the standard `oshift-pipeline-v1` and `oshift/crawlers.run` workflows), 3 hardcoded fake reviews per competitor are normalized into `signals.signals` and may surface in dashboards, insights, and briefs.

**Production impact:** High. Users see fake reviews in their "What Customers Are Saying" carousels and in negative-comment-cluster insights. The ReviewsCollector must either be wired to a real platform miner (G2/Capterra/Trustpilot) or the stub must be disabled with an explicit "no reviews available" return.

**Fix priority:** Phase 0 (immediate).

### 1.6 STUB: `_run_analyze_partnerships` Only Logs, Does Not Persist

**File:** `backend/app/automation/functions/analyzers_pipeline.py:42-54`

```python
for s in signals:
    try:
        prompt = f"Analyze this text about a company's partnerships and extract the names of the partner companies as a JSON list. Text: {s['content']}"
        result = await client.generate(prompt)
        # In a full implementation, we'd insert these into the graph/relationships table
        logger.info("Analyzed partnership signal %s: %s", s['id'], result)
        analyzed += 1
```

Line 47 explicitly comments "In a full implementation, we'd insert these into the graph/relationships table". The extraction runs (consuming LLM tokens) but the result is **logged and discarded**. The only path that actually persists partnerships is the agent tool `discover_partnerships` in `app/agent/tools/partnerships.py`.

**Implication:** The `analyze-partnerships` pipeline step is dead weight. Either implement the persistence (write to `graph.graph_entities` + `graph.graph_relationships`) or remove the step from `ANALYZERS_SEQUENCE`.

### 1.7 STUB: `_run_slides` Is a Pure Placeholder

**File:** `backend/app/automation/functions/reporters_pipeline.py:19-22`

```python
async def _run_slides(db: AsyncSession, workspace_id: UUID) -> dict:
    """Generate slides from the weekly digest (Placeholder)."""
    logger.info("Slide generation in progress for workspace %s (Placeholder)", workspace_id)
    return {"step": "slides", "status": "placeholder"}
```

Wired into `REPORTERS_SEQUENCE` so it executes, but does nothing. No schema, no prompts, no generation logic. Per decision **E5/JSON schema**, slides will be implemented as a JSON document the frontend renders — see Feature F11.

### 1.8 STUB: Invitation Email Delivery in Production

**File:** `backend/app/core/router.py:49-71`

```python
def _deliver_invitation(raw_token, invitee_email, workspace_id, inviter_email) -> None:
    invite_url = f"{settings.app_base_url}/invite?token={raw_token}"
    if settings.environment == "dev":
        service.logger.info("invitation.delivered.dev", invitee=..., invite_url=invite_url)
    else:
        # Prod: hand off to Resend / Supabase Auth admin invite API (wired in a later phase).
        service.logger.info("invitation.delivered.prod_stub", invitee=..., workspace_id=...)
```

In production, invitations are logged but never emailed. Per decision **E6(b)**, the frontend will display the returned invite URL for the user to copy/paste. Email delivery deferred to a later phase.

### 1.9 SSE Event Shape Discrepancies

The frontend's `PromptField.tsx` listens for: `conversation_id`, `tool_call`, `tool_result`, `error`, and generic token events whose data can be `{ content | text | delta | chunk | message | message.content | delta.content }`.

**What `/v1/agent/chat` actually emits** (verified in `app/agent/orchestrator.py`):

| Event type | JSON shape | Line |
|---|---|---|
| `ping` | `{"type":"ping"}` | orchestrator.py:119, 133 |
| `token` | `{"type":"token","content":"..."}` — **entire response in one event, not chunked** | orchestrator.py:148 |
| `tool_call` | `{"type":"tool_call","tool":"<name>","args":{...}}` | orchestrator.py:170 |
| `tool_result` | `{"type":"tool_result","tool":"<name>","result":{...}}` | orchestrator.py:194, 229 |
| `question` | `{"type":"question","content":"...","message_id":"..."}` | orchestrator.py:244-250 |
| `done` | `{"type":"done","message_id":"..."}` | orchestrator.py:153 |
| `error` | `{"type":"error","content":"..."}` | orchestrator.py:125-130, 162-167, 254, 257 |

**What `/v1/hermes/conversations/{id}/messages` actually emits** (verified in `app/hermes/router.py:433-539`):

| Event type | JSON shape | Line |
|---|---|---|
| `token` | `{"type":"token","content":"<chunk>"}` — **per-chunk streaming** | router.py:480 |
| `error` | `{"type":"error","content":"..."}` | router.py:495-500 |
| `done` | `{"type":"done","message_id":"<uuid>","token_count":N,"first_token_ms":N}` | router.py:532-539 |

**Critical discrepancies:**

1. **NEITHER endpoint emits `conversation_id` as an SSE event.** It is exposed only via the `X-Conversation-Id` HTTP response header (verified in both `agent/router.py:122` and `hermes/router.py`). The frontend's `sseStream` helper in `src/lib/api.ts:114-121` correctly reads this header and yields it as a synthetic `conversation_id` event — so this works, but only because of the frontend's defensive design.
2. **The agent's `token` event carries the ENTIRE response in one shot** (not streamed char-by-char). The frontend's broad `data.content | data.text | data.delta | data.chunk | data.message | data.message.content | data.delta.content` extraction list happens to work because it picks up `data.content`, but the user sees no progressive typing indicator from the agent. Hermes DOES stream per-chunk.
3. **Hermes does NOT emit `tool_call`/`tool_result` events.** Tools run silently post-stream (verified in `hermes/router.py:386-430`). The frontend listens for these but will never receive them from Hermes.
4. **The event types `delta`, `chunk`, `message`, `message.content`, `delta.content` are NEVER emitted by either endpoint.** They appear to be speculative frontend code for an OpenAI-compatible streaming format that the backend doesn't use.
5. **The agent emits `question` events** (for the `ask_user_question` tool) — the frontend doesn't appear to handle these explicitly; they likely fall through to the generic text path.

**Fix priority:** Phase 0 (frontend SSE handling cleanup) + Phase 4 (decide canonical event format when Hermes is killed or kept).

### 1.10 Agent Tool Registry: 54 Tools (Not 44)

**File:** `backend/app/agent/tools/__init__.py:93-153`

The `TOOL_REGISTRY` dict contains **54 tools** (the module docstring lists ~25 in prose but the actual dict has 54). Categorized:

| Category | Count | Tools |
|---|---|---|
| Onboarding & self-profile | 5 | `save_onboarding_data`, `ask_user_question`, `scrape_user_company`, `build_self_profile`, `update_self_profile` |
| Competitor discovery | 10 | `discover_competitors`, `register_competitor`, `list_competitors`, `update_competitor`, `remove_competitor`, `discover_social_links`, `extract_competitor_products`, `extract_all_competitor_products`, `suggest_handles`, `run_single_competitor_analysis` |
| Analysis pipeline | 2 | `run_full_pipeline`, `refresh_competitor` |
| Feedback / insights / corrections | 9 | `persist_feedback`, `edit_insight`, `list_corrections`, `clear_corrections`, `remove_correction`, `store_insight`, `update_insight_in_place`, `remove_insight`, `list_insights` |
| Retrieval / read | 4 | `search_signals`, `get_brief`, `get_battlecard`, `query_relationship_graph` |
| Automation / scheduling | 4 | `list_schedules`, `create_schedule`, `update_schedule`, `delete_schedule` |
| Partnership graph | 5 | `discover_partnerships`, `query_partnership_graph`, `add_partnership`, `update_partnership`, `remove_partnership` |
| Market view | 2 | `analyze_market_position`, `get_competitor_insights` |
| Social media pipeline | 8 | `discover_social_profiles`, `list_social_accounts`, `add_social_account`, `update_social_account`, `remove_social_account`, `collect_social_posts`, `list_social_posts`, `remove_social_post` |
| Video analysis pipeline | 5 | `collect_video`, `download_video`, `analyze_video_path`, `list_video_assets`, `get_video_analysis` |

All 54 tools are reachable from `/v1/agent/chat` via the orchestrator's `TOOL_REGISTRY` dispatch (`orchestrator.py:201-203`). The full tool list with one-line descriptions is in **Appendix C**.

### 1.11 `is_self` Filter Matrix (Verified)

Per-step breakdown of how each pipeline step handles the `is_self` flag on `competitors.competitors_competitors`:

| Pipeline Step | File:Line | `is_self` filter | Behavior |
|---|---|---|---|
| `_run_social` (legacy 15-step) | `collectors.py:53-66` | **NONE** | Includes self + non-self accounts |
| `_run_ads` | `agent_steps.py:54-69` | `= false` | Skips self |
| `_run_campaigns` | `agent_steps.py:117-131` | `= false` | Skips self |
| `_run_relationships` | `agent_steps.py:162-176` | `= false` | Skips self |
| `_run_sense` (reviews/trends/news) | `collectors.py:218-233` | `= false` | Skips self |
| `_run_video` | `collectors.py:69-199` | **NONE** | Includes both |
| `_run_web` (= _run_competitors) | `collectors.py:12-50` | **NONE** | Includes both |
| `crawl-own-posts` | `crawlers_pipeline.py:23-26` | `= true` | Only self |
| `crawl-competitor-posts` | `crawlers_pipeline.py:41-44` | `= false` | Skips self |
| `crawl-partnerships` | `crawlers_pipeline.py:72-75` | **NONE** | Includes both |
| `analyze-partnerships` | `analyzers_pipeline.py:35-38` | **NONE** | Operates on signals (no competitor filter) |
| `GET /v1/insights/campaigns` | `insights/router.py:251` | `= false` | Skips self |

**Implication for F1 (Self-Company Schema Migration):** Once the self-row moves to `company.companies`, every `WHERE is_self = false` filter becomes a no-op (the competitors table no longer contains self rows), and every "no filter" step needs an explicit decision: should it now operate on `company.*` tables, `competitors.*` tables, or both? See F1 implementation steps for the per-step migration plan.

### 1.12 Endpoint Filter Gaps

**`GET /v1/insights/gaps` does NOT accept `competitor_id` or `layer` query params.** It only accepts `limit`. Same for `/v1/insights/{crises,deals,neg-comments,trends}`. The endpoint factory is `_make_list_endpoint(name)` at `app/insights/router.py:126-149`:

```python
def _make_list_endpoint(name: str) -> Callable[..., Any]:
    sql = text(_GET_QUERIES[name])
    async def _endpoint(
        user: CurrentUser = Depends(require_workspace_member),
        session: AsyncSession = Depends(get_db),
        limit: int = Query(50, ge=1, le=200),
    ) -> list[dict[str, Any]]:
        ...
```

**Implication:** The frontend's `/company/[domain]` page cannot filter gaps by competitor without a new endpoint or query param. This blocks Feature F14 (Frontend-Backend Wiring for company detail page).

### 1.13 No `GET /v1/agent/memory` Endpoint

Agent memory is loaded internally by the orchestrator via `agent.memory.load_context` (`app/agent/memory.py:27-129`). It loads:

1. **Recent messages** (last 20) from `hermes.hermes_messages` — `{role, content}` in chronological order.
2. **Self-profile** (is_self=true competitor) — `id, name, website, description, metadata` from `competitors.competitors_competitors`.
3. **self_profile_summary** — string built from `metadata.positioning` or `description`.
4. **competitor_count** — count of `is_self=false` competitors.
5. **recent_corrections** — last 5 from `graph.graph_corrections` with `id, correction_type, field, reason, created_at`.

**None of this is exposed via any API endpoint.** Per decision **B6(a)**, a new `GET /v1/agent/memory` endpoint must be added (see Feature F8).

### 1.14 `social_accounts.follower_count` Is Overwrite-Only

**Verified:** `social.social_accounts.follower_count` exists, is set on INSERT (`app/social/router.py:78-82`), and is updated via `follower_count = COALESCE(:fc, follower_count)` in the agent's `discover_social_profiles` flow (`app/agent/tools/social.py:237-245`). It is **overwrite-only** — there is no historical time-series table.

The SocialCrawl API response includes an `author.followers` field (`social_api_client.py:276, 288`), but the SocialCollector (`app/social/collector.py:319-325`) never writes it to `social_accounts.follower_count`. The collector only fetches posts, not profile metadata. Follower counts are only refreshed when `discover_social_profiles` (agent tool) explicitly fetches the live profile.

**Confirms decision A2:** Use a JSONB "history" array on `social_accounts` (and equivalent tables for the user's own accounts) rather than a separate snapshots table.

### 1.15 `update_self_profile` Does Shallow Merge

**File:** `backend/app/agent/tools/self_study.py:166-226`

```python
existing_meta = self_row.get("metadata") or {}
if not isinstance(existing_meta, dict):
    existing_meta = {}
existing_meta.update(updates)  # ← Python dict.update is SHALLOW
```

Nested keys are replaced wholesale, not deep-merged. **Implication for F1 (Self-Company Schema Migration):** The new `update_company_profile` tool should support deep merge (e.g., recursively merge nested dicts) to avoid clobbering structured fields like `metadata.icp.geography` when the user provides a partial update.

### 1.16 `competitors_competitors` Columns Actually Used in Code

| Column | Used in code? | Example site |
|---|---|---|
| `id` | YES | router.py:51, 78, 89 (RETURNING), 160, 183 |
| `workspace_id` | YES | router.py:51 (WHERE), 89 (INSERT), 143 |
| `name` | YES | router.py:51, 89, 143, 183 |
| `website` | YES | router.py:67, 79, 89, 143 |
| `description` | YES | router.py:67, 89, 143 |
| `is_self` | YES | memory.py:72, onboarding.py:85, agent_steps.py:61/123/168, crawlers_pipeline.py:25/43, collectors.py:225, insights/router.py:251, self_study.py:135/195 |
| `metadata` | YES | self_study.py:150, 194, 217; partnership_sources.py:260, 316; discovery.py:58; market.py:63, 87; memory.py:70 |
| `created_by` | YES | router.py:90 (INSERT only) |
| `created_at` | YES | router.py:78, 92, 143 |
| `updated_at` | YES | onboarding.py:84, 88; discovery.py:191; self_study.py:151, 218 |
| `deleted_at` | YES | router.py:51, 144, 160, 183; everywhere WHERE clauses |

**Columns NOT referenced anywhere in code or migrations:**

- `founding_year` — 0 hits in `/backend`
- `market_valuation` — 0 hits in entire repo
- `industry` (as a column) — **NOT a column**; only accessed as `metadata->>'industry'` (JSON), e.g. `collectors.py:223`

**Confirms decision E2(a):** Add `founding_year`, `market_valuation_usd`, `industry` as proper columns via a new migration.

### 1.17 Frontend Calls Only 7 Real Backend Endpoints

Despite the backend exposing ~80 endpoints across 15 modules, the production frontend (`oshift-master`) only calls **7** real endpoints:

| # | Frontend call site | Backend endpoint | Method |
|---|---|---|---|
| 1 | `workspaces/page.tsx:27` | `/v1/core/workspaces` | GET |
| 2 | `workspaces/page.tsx:57` | `/v1/core/workspaces` | POST |
| 3 | `partnerships/page.tsx:110` | `/v1/graph/partnerships` | GET |
| 4 | `partnerships/page.tsx:111` | `/v1/competitors` | GET |
| 5 | `competitors/page.tsx:95` | `/v1/competitors` | GET |
| 6 | `competitors/page.tsx:136` | `/v1/competitors` | POST |
| 7 | `competitors/page.tsx:161` | `/v1/competitors/{id}` | DELETE |
| 8 | `PromptField.tsx:215` | `/v1/agent/chat` (SSE) | POST |

(Eight if you count the SSE agent chat.) Everything else on the dashboard, opportunities, campaigns, company-detail, profile, and settings pages is mocked with hardcoded data and `// BACKEND: ⚠️ NO EQUIVALENT` comments.

### 1.18 Onboarding Flow Persists NOTHING

All 6 onboarding steps (`/onboarding` through `/onboarding/step-6`) persist zero data to the backend:

| Step | Data collected | Where it currently goes | Where it should go |
|---|---|---|---|
| 1 (goal) | One enum: expansion/tracking/innovation | Local React state only | Workspace metadata + User metadata (decision D1) |
| 2 (competitors) | Array of `{name, domain}` | Local React state only | `POST /v1/competitors/batch` (decision D2) |
| 3 (topics) | Array of strings | Local React state only | Self-row metadata (decision D3) |
| 4 (PDF upload) | File | `localStorage.oshift_has_pdf` boolean only | Supabase Storage (temp, 24h TTL) → agent Gemini analysis → `company.companies.metadata` (decision D4) |
| 5 (Hermes chat) | Conversation | Hardcoded 2-second canned response | `POST /v1/agent/chat` with onboarding intent (decision D5) |
| 6 (team invites) | Array of emails | Local React state only | `POST /v1/core/workspaces/{id}/invitations` per email (decision E6) |

**Additionally:** Step 6 routes to `/` directly, skipping workspace selection. `sessionStorage.oshift.workspace_id` is never set, so every subsequent `apiFetch` call lacks the `X-Workspace-ID` header. This is a **functional bug** — the dashboard loads but every API call fails silently.

**Google OAuth signup** also skips onboarding entirely (`signInWithGoogle('/workspaces')`), which is inconsistent with the email signup flow that goes to `/onboarding`.

### 1.19 Stale-Documentation Audit (added in v1.1)

After the user caught the model-identity error (§1.4), every markdown-derived claim in this report was re-verified against actual source code. The audit found **6 stale-doc / refuted claims** and **5 additional discrepancies** that don't affect the report's recommendations but should be flagged for documentation cleanup. The verdicts:

| # | Markdown claim | Source | Verdict | Actual code says |
|---|---|---|---|---|
| 1 | Agent uses MiniMax-M2.7 | `MIGRATION_NOTES.md` §v7 | **REFUTED** | Kimi K2.6 — see §1.4 above |
| 2 | "Use Gemini 3.5 Flash for all AI operations" | `CONTEXT.md` §4 | **STALE-DOC** | Kimi K2.6 — `app/config.py:37` |
| 3 | RLS GUC is `app.current_workspace_id`, middleware extracts from "auth header or API key" | `CONTEXT.md` §3.1 | **REFUTED (two errors)** | GUC is `app.tenant_id` (`app/db/session.py:115`); workspace_id is extracted from JWT payload (`app/auth/middleware.py:196-204`), not the auth header. API-key workspace selection happens via the `X-Workspace-ID` HTTP header in `app/auth/deps.py`. |
| 4 | Frontend uses Geist font | `oshift-master/README.md` | **REFUTED — stale boilerplate** | Frontend uses **Poppins** (`src/app/layout.tsx:2,9-13`). README is unmodified `create-next-app` template. |
| 5 | `GeminiFlashClient` has "60+ import sites" | `MIGRATION_NOTES.md` lines 13, 35, 72 | **NUANCED — overstated** | Actual count is **38** production import sites (45 including tests). |
| 6 | `.env.example` documents `KIMI_API_KEY` env var | `.env.example:44` | **DEAD DOCUMENTATION** | `KIMI_API_KEY` is NEVER read anywhere in code. Only `GEMINI_API_KEY` (via Pydantic Settings, 22 call sites) and `KIMI_BASE_URL` (via `os.environ.get()` in `gemini_flash_client.py:232`) are actually read. |

**Additional discrepancies found (documentation cleanup needed, no functional impact):**

1. **`gemini_flash_client.py` module docstring** (lines 1-26) says "MiniMax-M2.7 migration" but the rest of the file's code and inline comments correctly say "Kimi". Self-contradicting file.
2. **`app/io/gemini_pro_video.py` module docstring** (lines 1-13) says "delegates to the MiniMax-M2.7 client" but the class docstring (line 50) correctly says "Kimi-K2.6 backed". Self-contradicting file.
3. **`app/prompts/agent.py:6,12`** describes the agent as "MiniMax M2.7" — stale. The orchestrator and tool registry both correctly say Kimi K2.6.
4. **`app/sense/news.py:32-36`** correctly says "Kimi K2.6" — but this contradicts every other docstring in the codebase, making the inconsistency visible.
5. **`app/sense/trends.py:91-100`** does NOT pass `url=` to `RawSignal` — defaults to `""`. `MIGRATION_NOTES.md` lists `trends.py` as one of the files where the `url=""` bug was fixed, but only the `commit()→flush()` portion was applied (line 101). The empty-URL portion is **still unfixed** and may cause `fn_normalize_signal` to fail on trends signals (per its `p_url IS NOT NULL` contract — though in practice the function may tolerate empty strings; needs verification).

**Two non-doc facts the audit confirmed (so the report can rely on them):**

- **Pipeline count is 4, not 3.** `CONTEXT.md` §7 implies the monolithic `oshift-pipeline-v1` was replaced by 3 modular pipelines (`oshift/crawlers.run`, `oshift/analyzers.run`, `oshift/reporters.run`). In reality, the original 15-step monolithic pipeline at `app/automation/functions/pipeline.py:302-393` is **still registered as a fourth Inngest function** (`fn_id="oshift-pipeline"`, trigger `oshift/pipeline.run`). The 3 modular pipelines + the chain parameter are also implemented as documented. So the system has 4 Inngest functions, not 3.
- **Hash-based 768-dim embeddings via `sha512(text + counter)`** — VERIFIED. The only embedding implementation is `_hash_embedding()` in `app/scoring/io/gemini_flash_client.py:140-158`. There is NO HTTP call to any embeddings endpoint. The model name `"text-embedding-004"` referenced in `app/graph/embeddings.py:17` is a vestigial label, not a real API call.

**Action items (track as Phase 0 doc cleanup — no functional change):**

| File | Stale claim | Replace with |
|---|---|---|
| `backend/MIGRATION_NOTES.md` §v7 | "MiniMax-M2.7 Adoption" | Add a §v8 note: "Rolled back to Kimi K2.6 — see `app/config.py:37` and `gemini_flash_client.py:217-221`" |
| `backend/CONTEXT.md` §4 | "Use Gemini 3.5 Flash for all AI operations" | "Use `moonshotai/Kimi-K2.6` (hosted at `https://inference.dahl.global/v1/chat/completions`, OpenAI-compatible)" |
| `backend/CONTEXT.md` §3.1 | "uses `set_config('app.current_workspace_id', ...)`" | "uses `set_config('app.tenant_id', ...)`" (and fix the middleware description) |
| `backend/CONTEXT.md` §7 | "was split into three independent modular pipelines" | "was split into three modular pipelines that **run alongside** the original 15-step monolithic `oshift-pipeline` (4 Inngest functions total)" |
| `backend/.env.example:42` | `GEMINI_FLASH_MODEL=MiniMaxAI/MiniMax-M2.7` | `GEMINI_FLASH_MODEL=moonshotai/Kimi-K2.6` |
| `backend/.env.example:44` | `KIMI_API_KEY=...` | DELETE — this env var is never read |
| `backend/app/scoring/io/gemini_flash_client.py:1-26` | Module docstring says MiniMax | Update to Kimi K2.6 |
| `backend/app/io/gemini_pro_video.py:1-13` | Module docstring says MiniMax | Update to Kimi K2.6 |
| `backend/app/prompts/agent.py:6,12` | "MiniMax M2.7" | "Kimi K2.6" |
| `backend/app/sense/trends.py:91-100` | Missing `url=` on `RawSignal` | Add `url=f"https://trends.google.com/trends?q={keyword}"` (or similar non-empty placeholder) |
| `oshift-master/README.md` | "uses Geist font" | "uses Poppins font" (or just delete the boilerplate README and replace with real project docs) |

---

## Part 2 — Missing Features: Detailed Catalog

Each feature is documented with: ID, title, category, affected modules, database changes, backend API changes, frontend changes, implementation steps (surgical and ordered), cross-feature impact, and complexity estimate.

---

### Feature F1 — Self-Company Schema Migration

| Field | Value |
|---|---|
| **ID** | F1 |
| **Category** | Foundation |
| **Decision ref** | E3 (user-confirmed: surgical migration to dedicated schema) |
| **Affected modules** | Backend: `competitors/`, `agent/tools/{onboarding,self_study,discovery,market,partnerships,social,video,feedback}.py`, `agent/memory.py`, `insights/router.py`, `automation/functions/{agent_steps,collectors,crawlers_pipeline,analyzers_pipeline}.py`, `core/router.py` (workspace creation seeds self-row). Frontend: `/company/[domain]` (will need new route or repurposing), `/profile`. Database: new `company` schema, migration of `is_self=true` rows. |
| **Complexity** | XL (largest single line-item) |

#### Why

The `is_self=true` pattern models the user's own company as a special row in `competitors.competitors_competitors`. This is confusing because:
- Every pipeline step must remember to filter `WHERE is_self = false` (or `= true`) — and several steps get this wrong (see §1.11 matrix).
- The `metadata` JSONB on the self-row holds the entire self-profile (positioning, ICP, strengths, weaknesses, key_products, social_links), which is semantically different from a competitor's `metadata` (which holds industry, products, etc.).
- The frontend `/profile` page conflates "the user's employer" with "a competitor we track".
- Agent tools like `update_self_profile` exist alongside `update_competitor` — same operation, different code paths.

A dedicated `company` schema makes the mental model clean: `company.companies` (1:1 with workspace) is the user's own company; `competitors.competitors_competitors` is purely competitors.

#### Database changes — new `company` schema

```sql
-- Migration: Create company schema (replaces is_self=true pattern)
CREATE SCHEMA IF NOT EXISTS company;

-- 1:1 with workspace. Created on workspace creation.
CREATE TABLE company.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL UNIQUE REFERENCES core.core_workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    website TEXT,
    description TEXT,                      -- formerly competitors.description (used for target_customer)
    industry TEXT,                         -- formerly metadata->>'industry'
    founding_year INTEGER,
    market_valuation_usd NUMERIC(18, 2),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- metadata holds: positioning, icp{industry,company_size,roles,geography},
    --                  strengths[], weaknesses[], key_products[{name,description,pricing_tier}],
    --                  social_links{instagram,tiktok,youtube,...}, clarifying_questions[],
    --                  goals[], topics[]
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- Self social accounts (separate from competitor social accounts)
CREATE TABLE company.social_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES core.core_workspaces(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES company.companies(id) ON DELETE CASCADE,
    platform TEXT NOT NULL CHECK (platform IN ('instagram','tiktok','youtube','x','linkedin','facebook')),
    handle TEXT NOT NULL,
    display_name TEXT,
    follower_count INTEGER,
    follower_history JSONB NOT NULL DEFAULT '[]'::jsonb,  -- array of {at, count} per A2 decision
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_verified BOOLEAN NOT NULL DEFAULT false,
    external_account_id TEXT,                -- platform-native account ID for API sync
    last_synced_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (workspace_id, platform, handle)
);

-- Self social posts (mirror of social.social_post_cache but for the user's own accounts)
CREATE TABLE company.social_post_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES core.core_workspaces(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES company.social_accounts(id) ON DELETE CASCADE,
    platform TEXT NOT NULL,
    post_id TEXT NOT NULL,
    content TEXT,
    content_hash TEXT NOT NULL,
    likes INTEGER NOT NULL DEFAULT 0,
    shares BIGINT NOT NULL DEFAULT 0,
    comments INTEGER NOT NULL DEFAULT 0,
    posted_at TIMESTAMPTZ,
    captured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (workspace_id, platform, post_id)
);

-- Self analytics snapshots (NEW per A1: monthly time-series for the 5 dashboard stats)
-- Per A2 decision, use JSONB "history" arrays on social_accounts for follower_count.
-- This table holds the AGGREGATE daily/weekly/monthly rollups the dashboard reads.
CREATE TABLE company.analytics_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES core.core_workspaces(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES company.companies(id) ON DELETE CASCADE,
    snapshot_date DATE NOT NULL,
    platform TEXT NOT NULL,                  -- 'all' | 'instagram' | 'tiktok'
    followers INTEGER,
    views INTEGER,
    engagement_rate NUMERIC(5, 2),           -- percentage 0.00-100.00
    -- Revenue intentionally omitted per A1 decision (drop revenue entirely for MVP)
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (workspace_id, company_id, snapshot_date, platform)
);

-- Self campaigns (per B2 unified campaigns schema — see F4)
-- Self reviews (per E4 — custom thing for the user, separate from sense.sense_reviews)
CREATE TABLE company.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES core.core_workspaces(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES company.companies(id) ON DELETE CASCADE,
    platform TEXT NOT NULL,                  -- 'instagram' | 'tiktok' | 'trustpilot' | etc.
    review_id TEXT NOT NULL,
    rating SMALLINT CHECK (rating BETWEEN 1 AND 5),
    title TEXT,
    body TEXT,
    author TEXT,
    author_avatar_url TEXT,
    sentiment TEXT CHECK (sentiment IN ('positive','neutral','negative')),
    response_status TEXT CHECK (response_status IN ('replied','pending','ignored')) DEFAULT 'pending',
    reviewed_at TIMESTAMPTZ,
    captured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (workspace_id, platform, review_id)
);

-- Enable RLS on all company tables
ALTER TABLE company.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE company.companies FORCE ROW LEVEL SECURITY;
CREATE POLICY rls_company_companies ON company.companies
    FOR ALL USING (workspace_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
    WITH CHECK (workspace_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
-- (repeat for social_accounts, social_post_cache, analytics_snapshots, reviews)

-- Grant permissions to oshift_app role
GRANT USAGE ON SCHEMA company TO oshift_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA company TO oshift_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA company TO oshift_app;
```

#### Database changes — migrate `is_self=true` rows

```sql
-- Data migration: copy is_self=true rows from competitors.competitors_competitors to company.companies
INSERT INTO company.companies (workspace_id, name, website, description, industry, metadata, created_at, updated_at, deleted_at)
SELECT
    workspace_id,
    name,
    website,
    description,
    metadata->>'industry',                    -- extract industry from JSONB to column
    metadata - 'industry',                    -- remove industry from JSONB (now a column)
    created_at,
    updated_at,
    deleted_at
FROM competitors.competitors_competitors
WHERE is_self = true;

-- Migrate social accounts belonging to the self-row
INSERT INTO company.social_accounts (workspace_id, company_id, platform, handle, display_name, follower_count, is_active, deleted_at, created_at, updated_at)
SELECT
    sa.workspace_id,
    c.id,
    sa.platform,
    sa.handle,
    sa.display_name,
    sa.follower_count,
    sa.is_active,
    sa.deleted_at,
    sa.created_at,
    sa.updated_at
FROM social.social_accounts sa
JOIN competitors.competitors_competitors cc ON sa.competitor_id = cc.id
JOIN company.companies c ON c.workspace_id = cc.workspace_id
WHERE cc.is_self = true;

-- Migrate social posts for self accounts
INSERT INTO company.social_post_cache (workspace_id, account_id, platform, post_id, content, content_hash, likes, shares, comments, posted_at, captured_at)
SELECT
    spc.workspace_id,
    nsa.id,
    spc.platform,
    spc.post_id,
    spc.content,
    spc.content_hash,
    spc.likes,
    spc.shares,
    spc.comments,
    spc.posted_at,
    spc.captured_at
FROM social.social_post_cache spc
JOIN social.social_accounts osa ON spc.account_id = osa.id
JOIN competitors.competitors_competitors cc ON osa.competitor_id = cc.id
JOIN company.social_accounts nsa ON nsa.workspace_id = osa.workspace_id AND nsa.platform = osa.platform AND nsa.handle = osa.handle
WHERE cc.is_self = true;

-- After verification, delete migrated rows from old tables (deferred to a later cleanup migration)
-- DELETE FROM social.social_post_cache WHERE account_id IN (SELECT id FROM social.social_accounts WHERE competitor_id IN (SELECT id FROM competitors.competitors_competitors WHERE is_self = true));
-- DELETE FROM social.social_accounts WHERE competitor_id IN (SELECT id FROM competitors.competitors_competitors WHERE is_self = true));
-- DELETE FROM competitors.competitors_competitors WHERE is_self = true;
-- ALTER TABLE competitors.competitors_competitors DROP COLUMN is_self;
-- DROP INDEX uq_competitors_self_per_workspace;
```

#### Backend API changes — new `company` module

Create `backend/app/company/` module with:
- `router.py` — `GET /v1/company`, `PATCH /v1/company` (update self-profile), `GET /v1/company/analytics?platform=&range=`, `GET /v1/company/reviews`, `GET /v1/company/social-accounts`, `POST /v1/company/social-accounts`, `GET /v1/company/social-posts`
- `service.py` — CRUD + analytics aggregation logic
- `schemas.py` — Pydantic models

#### Backend changes — update existing modules (surgical)

| File | Change |
|---|---|
| `app/agent/tools/onboarding.py:83-86` | Change `INSERT INTO competitors.competitors_competitors ... is_self=true` → `INSERT INTO company.companies` |
| `app/agent/tools/onboarding.py:86` | Remove `ON CONFLICT (workspace_id) WHERE is_self = true ...` partial-index upsert; use `ON CONFLICT (workspace_id) DO UPDATE` on company.companies |
| `app/agent/tools/self_study.py:135, 150, 194, 195, 217` | Change `competitors.competitors_competitors WHERE is_self = true` → `company.companies WHERE workspace_id = :ws` |
| `app/agent/tools/self_study.py:209-212` | Replace shallow `dict.update` with deep-merge helper (per §1.15) |
| `app/agent/tools/discovery.py:58` | Change `WHERE is_self = false` filter → remove (competitors table no longer has self rows) |
| `app/agent/tools/market.py:63, 87` | Change self-profile load from `competitors.competitors_competitors WHERE is_self = true` → `company.companies` |
| `app/agent/memory.py:65-81` | Change self-profile load → `SELECT id, name, website, description, metadata FROM company.companies WHERE workspace_id = :ws` |
| `app/insights/router.py:251` | Remove `AND is_self = false` filter (no longer needed) |
| `app/automation/functions/agent_steps.py:61, 123, 168` | Remove `WHERE is_self = false` filters from `_run_ads`, `_run_campaigns`, `_run_relationships` |
| `app/automation/functions/collectors.py:225` | Remove `WHERE is_self = false` from `_run_sense`; add new `_run_company_sense` step that collects reviews for `company.companies` |
| `app/automation/functions/crawlers_pipeline.py:23-26` | `crawl-own-posts` now reads from `company.social_accounts` instead of `competitors.competitors_competitors WHERE is_self = true` |
| `app/automation/functions/crawlers_pipeline.py:41-44` | `crawl-competitor-posts` — remove `is_self = false` filter |
| `app/core/router.py` (workspace creation) | On workspace create, also create a `company.companies` row (replaces the current "seed self-row" behavior) |
| `app/social/router.py`, `app/social/collector.py` | Add a branch for `company.social_accounts` when the account belongs to the user's company (or split into a separate `company/social/` submodule) |

#### Frontend changes

| File | Change |
|---|---|
| `src/app/company/[domain]/page.tsx` | Currently this is the competitor detail page (using a domain param). Repurpose as the user's OWN company detail page (route `/company` without domain param) — or move to `/profile` and remove `/company/[domain]`. |
| `src/app/profile/page.tsx` | Pull corporate identity, focus areas, markets, objectives from `GET /v1/company` + `GET /v1/agent/memory` instead of `PROFILE_DATA` mock. |
| `src/lib/api.ts` | Add `GET /v1/company` typed response shape. |

#### Implementation order

1. Write & apply migration: create `company` schema + tables + RLS.
2. Run data migration: copy `is_self=true` rows to `company.companies` + `company.social_accounts` + `company.social_post_cache`.
3. Create `backend/app/company/` module with router/service/schemas.
4. Update `app/core/router.py` workspace-creation flow to also create a `company.companies` row.
5. Surgically update each agent tool (onboarding, self_study, discovery, market, memory) — one PR per tool to keep diffs reviewable.
6. Surgically update each pipeline step (remove `is_self = false` filters; add `_run_company_sense` etc.).
7. Update `app/insights/router.py` to remove `is_self = false` filter on `/v1/insights/campaigns`.
8. Add new endpoints: `GET /v1/company`, `PATCH /v1/company`, `GET /v1/company/analytics`, `GET /v1/company/reviews`.
9. Update frontend `/profile` to consume the new endpoints.
10. **Defer** the cleanup migration (delete old `is_self=true` rows + drop column) until all code paths are verified.

#### Cross-feature impact

- **F2 (Creator Analytics):** depends on F1 — `company.analytics_snapshots` table is created here.
- **F4 (Campaigns):** the unified `campaigns.campaigns` table (F4) will have `owner_type` ∈ {self, competitor} with FK to `company.companies(id)` when `owner_type='self'`. Requires F1 to be done first.
- **F7 (Profile Enhancements):** `bio` goes on `core.core_users`; `focus_areas` and `objectives` go on `core.core_users` (per-user, per B5). `markets` goes on `core.core_workspaces.metadata` (per-workspace). The `company.companies` row is loaded alongside.
- **F8 (Agent Memory):** `agent.memory.load_context` now loads from `company.companies` instead of `competitors.competitors_competitors WHERE is_self=true`.
- **F10 (Onboarding Persistence):** `save_onboarding_data` tool writes to `company.companies` instead of self-row.
- **F13 (Competitor Detail):** the `/company/[domain]` route becomes `/competitors/[id]` (rename for clarity).

---

### Feature F2 — Creator Analytics Ingestion (Instagram + TikTok)

| Field | Value |
|---|---|
| **ID** | F2 |
| **Category** | New Feature |
| **Decision ref** | A1(a) — extend backend to ingest user's own creator analytics; A2 — JSONB "history" array for follower_count; MVP platforms: Instagram + TikTok only; Revenue dropped entirely. |
| **Affected modules** | Backend: new `company/collectors/` submodule (IG + TikTok API clients), `company/scheduler.py` (monthly rollup), `automation/functions/` (new `_run_company_analytics` step). Frontend: `/` dashboard (replace all 5 mocked stats + 3 charts), `/profile` (markets/globe stays). Database: `company.analytics_snapshots` (created in F1), `company.social_accounts.follower_history` (created in F1). |
| **Complexity** | L |

#### Why

The dashboard's 5 stats (Total Followers, Total Views, Revenue MTD, Active Campaigns, Avg Engagement) and 3 charts (Audience Growth, Views, Engagement Rate) are 100% mocked. Per A1(a), the backend must ingest the user's own creator analytics. Per A2, follower counts use a JSONB "history" array rather than a separate snapshots table.

#### Database changes (in addition to F1)

```sql
-- Already created in F1: company.analytics_snapshots (workspace_id, company_id, snapshot_date, platform, followers, views, engagement_rate, metadata)
-- Already created in F1: company.social_accounts.follower_history JSONB (array of {at, count})

-- Add an OAuth credentials table for storing user's IG/TikTok API tokens (encrypted at rest)
CREATE TABLE company.api_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES core.core_workspaces(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES company.companies(id) ON DELETE CASCADE,
    platform TEXT NOT NULL CHECK (platform IN ('instagram','tiktok')),
    access_token_encrypted TEXT NOT NULL,    -- AES-256-GCM encrypted
    refresh_token_encrypted TEXT,
    token_expires_at TIMESTAMPTZ,
    scope TEXT[],                             -- OAuth scopes granted
    connected_account_id TEXT,                -- platform-native account ID
    connected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    revoked_at TIMESTAMPTZ,
    UNIQUE (workspace_id, company_id, platform)
);
```

#### Backend changes

1. **New module:** `backend/app/company/collectors/`
   - `instagram.py` — Instagram Graph API client (requires Facebook Business account + linked IG business account). Endpoints: `/{ig-user-id}/insights` for reach/impressions, `/{ig-user-id}?fields=followers_count` for follower count, `/{ig-user-id}/media` for media engagement.
   - `tiktok.py` — TikTok Display API client (requires business verification). Endpoints: `/user/info/` for follower count, `/video/list/` for video engagement metrics.
   - Both clients return a normalized `AnalyticsSnapshot` shape: `{platform, followers, views, engagement_rate, captured_at, raw_metadata}`.

2. **New pipeline step:** `_run_company_analytics` in `automation/functions/collectors.py`:
   - Loads `company.api_credentials` for the workspace.
   - For each connected platform, fetches the latest snapshot.
   - Writes to `company.analytics_snapshots` (INSERT … ON CONFLICT (workspace_id, company_id, snapshot_date, platform) DO UPDATE).
   - Appends to `company.social_accounts.follower_history` JSONB array (per A2): `UPDATE company.social_accounts SET follower_history = follower_history || jsonb_build_array(jsonb_build_object('at', now(), 'count', :count)) WHERE ...`.

3. **New endpoints** (in `app/company/router.py`):
   - `POST /v1/company/connect/instagram` — initiate OAuth flow (returns redirect URL).
   - `GET /v1/company/connect/instagram/callback` — OAuth callback handler.
   - `POST /v1/company/connect/tiktok` + `GET /v1/company/connect/tiktok/callback` — same for TikTok.
   - `DELETE /v1/company/credentials/{platform}` — revoke a platform connection.
   - `GET /v1/company/analytics?platform=all|instagram|tiktok&range=1m|3m|6m|1y` — returns time-series for the dashboard.

4. **Aggregation logic:** A monthly scheduled job (cron `'0 3 1 * *'`) that:
   - Runs `_run_company_analytics` for all workspaces with connected credentials.
   - Computes month-over-month change percentages (per A2: monthly cadence).

#### Frontend changes

| File | Change |
|---|---|
| `src/app/page.tsx` (dashboard) | Replace `platformData` mock with `GET /v1/company/analytics?platform=all&range=6m`. Replace 5-stat-bar mock with derived stats from the same endpoint. Drop "Revenue (MTD)" stat entirely. Rename "Active Campaigns" to read from `GET /v1/campaigns?owner_type=self&status=active`. |
| `src/app/settings/page.tsx` | Add "Connected Accounts" section under a new tab: shows Instagram + TikTok connection status with connect/disconnect buttons. |
| `src/app/onboarding/step-2/page.tsx` OR a new step | After competitor selection, prompt user to connect IG/TikTok (optional). |

#### Implementation order

1. **Depends on F1** (company schema must exist).
2. Add `company.api_credentials` table + encryption helpers.
3. Implement Instagram Graph API client (smallest scope first — follower count + media insights).
4. Implement TikTok Display API client.
5. Implement OAuth callback routes.
6. Implement `_run_company_analytics` pipeline step.
7. Implement `GET /v1/company/analytics` endpoint with platform + range params.
8. Implement frontend "Connected Accounts" settings UI.
9. Replace dashboard mocks with real API calls.
10. Add monthly cron schedule for analytics refresh.

#### Cross-feature impact

- **F1:** hard dependency — must be done first.
- **F4 (Campaigns):** "Active Campaigns" stat on dashboard reads from `GET /v1/campaigns?owner_type=self`. Requires F4.
- **F18 (Frontend Cleanup):** the dashboard's hardcoded `brandColor1`/`brandColor2` amber colors should be unified with the `--accent` orange token (currently inconsistent).

---

### Feature F3 — Opportunities Module

| Field | Value |
|---|---|
| **ID** | F3 |
| **Category** | New Feature |
| **Decision ref** | B1(a) — first-class `opportunities` table with effort, impact, analysis_fields JSONB. |
| **Affected modules** | Backend: new `opportunities/` module. Database: new `opportunities` schema. Frontend: `/opportunities` page (replace mock), `/` dashboard (replace mock opportunities list). |
| **Complexity** | M |

#### Why

The frontend has a full `/opportunities` page mock with rich Gap & Opportunity Reports (description, related gaps, effort, impact, dynamic analysis fields like Top Complaint / Root Cause / Trend Alert / Quick Win — not all present in every opportunity). The backend has `insights.insights_gaps` with `layer='act_now'` (closest match, but no effort/impact/dynamic analysis fields) and the agent tool `get_competitor_insights` synthesizes opportunities in-flight via LLM but doesn't persist them.

Per B1(a), create a first-class `opportunities` table with `effort`, `impact`, `analysis_fields` JSONB columns + `GET/POST /v1/opportunities` endpoints, populated by the agent.

#### Database changes

```sql
CREATE SCHEMA IF NOT EXISTS opportunities;

CREATE TABLE opportunities.opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES core.core_workspaces(id) ON DELETE CASCADE,
    company_id UUID REFERENCES company.companies(id) ON DELETE CASCADE,    -- nullable: opportunity may be tied to user's company or be market-wide
    competitor_id UUID REFERENCES competitors.competitors_competitors(id),  -- nullable: opportunity may target a specific competitor
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    opportunity_type TEXT NOT NULL CHECK (opportunity_type IN ('market_expansion','product_innovation','partnership','content','pricing','positioning','other')),
    effort TEXT NOT NULL CHECK (effort IN ('low','medium','high')),
    impact TEXT NOT NULL CHECK (impact IN ('low','medium','high')),
    priority_score INTEGER CHECK (priority_score BETWEEN 0 AND 100),
    priority_reasoning TEXT,
    -- Dynamic analysis fields (per Features_probably_missing.txt item 2):
    -- NOT ALL will be in every opportunity, so JSONB is the right shape.
    -- Examples: top_complaint, root_cause, trend_alert, quick_win, gap_identified, opportunity_text, early_warning
    analysis_fields JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- Related gaps (FK array to insights.insights_gaps)
    related_gap_ids UUID[] NOT NULL DEFAULT '{}',
    status TEXT NOT NULL CHECK (status IN ('new','reviewing','approved','in_progress','completed','rejected')) DEFAULT 'new',
    expires_at TIMESTAMPTZ,                   -- for time-sensitive opportunities
    detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX ix_opportunities_workspace ON opportunities.opportunities (workspace_id) WHERE deleted_at IS NULL;
CREATE INDEX ix_opportunities_status ON opportunities.opportunities (workspace_id, status) WHERE deleted_at IS NULL;
CREATE INDEX ix_opportunities_competitor ON opportunities.opportunities (competitor_id) WHERE competitor_id IS NOT NULL;

ALTER TABLE opportunities.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities.opportunities FORCE ROW LEVEL SECURITY;
CREATE POLICY rls_opportunities ON opportunities.opportunities
    FOR ALL USING (workspace_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
    WITH CHECK (workspace_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
```

#### Backend changes

1. **New module:** `backend/app/opportunities/`
   - `router.py` — `GET /v1/opportunities` (with filters: `competitor_id`, `status`, `opportunity_type`, `limit`), `GET /v1/opportunities/{id}`, `POST /v1/opportunities` (agent-only), `PATCH /v1/opportunities/{id}` (status updates), `DELETE /v1/opportunities/{id}` (soft delete).
   - `schemas.py` — `OpportunityCreate`, `OpportunityUpdate`, `OpportunityResponse`.
   - `service.py` — CRUD + priority-score computation.

2. **New agent tool:** `store_opportunity` in `app/agent/tools/feedback.py` (or a new `app/agent/tools/opportunities.py`):
   - Args: `{title, description, opportunity_type, effort, impact, analysis_fields, related_gap_ids, competitor_id?, expires_at?}`.
   - Inserts into `opportunities.opportunities`.
   - Returns the new opportunity ID.

3. **Extend `get_competitor_insights` agent tool** (in `app/agent/tools/market.py`):
   - Currently synthesizes opportunities in-flight via LLM but doesn't persist them.
   - Change: after LLM synthesis, call `store_opportunity` for each opportunity in the response.

4. **Extend `analyze_market_position` agent tool** (in `app/agent/tools/market.py`):
   - Same pattern: persist `whitespace_opportunities` to the table.

#### Frontend changes

| File | Change |
|---|---|
| `src/app/opportunities/page.tsx` | Replace 3-mock-item `OPPORTUNITIES` array with `GET /v1/opportunities?limit=20`. Render dynamic `analysis_fields` as collapsible sections (keys are dynamic per Features_probably_missing.txt item 2). |
| `src/app/page.tsx` (dashboard) | Replace `opportunities` mock with `GET /v1/opportunities?limit=3` for the "Opportunities" panel. Wire "Apply" button to `PATCH /v1/opportunities/{id}` with `{status: 'approved'}`. |
| `src/lib/api.ts` | Add typed `Opportunity` interface. |

#### Implementation order

1. Write & apply migration: create `opportunities` schema + table + RLS.
2. Create `backend/app/opportunities/` module.
3. Add `store_opportunity` agent tool.
4. Extend `get_competitor_insights` + `analyze_market_position` to persist opportunities.
5. Add `GET /v1/opportunities` endpoint with filters.
6. Update frontend `/opportunities` page to call the endpoint.
7. Update dashboard `/` opportunities panel + wire "Apply" button.

#### Cross-feature impact

- **F1:** `opportunities.opportunities.company_id` FK depends on `company.companies` existing.
- **F14 (Insights Gaps Wiring):** the `related_gap_ids` array references `insights.insights_gaps.id` — once F14 adds `competitor_id` filtering to `/v1/insights/gaps`, the opportunities page can show "Related Gaps" with deep links.

---

### Feature F4 — Campaigns Module (Unified)

| Field | Value |
|---|---|
| **ID** | F4 |
| **Category** | New Feature |
| **Decision ref** | B2(a) — unified `campaigns.campaigns` table with `owner_type` ENUM('self', 'competitor'); E3 — self campaigns belong to `company.companies`, competitor campaigns belong to `competitors.competitors_competitors`. |
| **Affected modules** | Backend: new `campaigns/` module, retire `insights_gaps layer='campaign'` (migrate to campaigns.campaigns). Database: new `campaigns` schema. Frontend: `/campaigns` page (replace 27-item mock), `/campaigns/[id]` page (replace Empee Mushrooms demo), `/` dashboard (replace 3-item mock), `/company/[domain]` page (replace 3-item mock), `/competitors/[id]` page (per F13). |
| **Complexity** | L |

#### Why

The frontend mocks campaigns in 4 places with different shapes (27 items on `/campaigns`, 3 items on `/`, 3 items on `/company/[domain]`, slide deck on `/campaigns/[id]`). The backend has `insights.insights_gaps` with `layer='campaign'` and `GET /v1/insights/campaigns` returning `{post_count, date_range, themes, signal_ids}` per campaign — but no target/style/budget/ROI fields. Per B2(a), promote campaigns to a first-class unified table.

#### Database changes

```sql
CREATE SCHEMA IF NOT EXISTS campaigns;

-- Enum: who owns the campaign
CREATE TYPE campaign_owner_type AS ENUM ('self', 'competitor');

CREATE TABLE campaigns.campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES core.core_workspaces(id) ON DELETE CASCADE,
    owner_type campaign_owner_type NOT NULL,
    company_id UUID REFERENCES company.companies(id) ON DELETE CASCADE,        -- set when owner_type='self'
    competitor_id UUID REFERENCES competitors.competitors_competitors(id),      -- set when owner_type='competitor'
    -- Identification
    name TEXT NOT NULL,
    description TEXT,
    -- Cluster (for the /campaigns infinite-canvas grouping)
    cluster TEXT,                              -- e.g. 'Holiday Seasons', 'Tech Product Launches'
    -- Targeting (per Features_probably_missing.txt item 4: "identified target")
    identified_target TEXT,                    -- free-text description of who the campaign targets
    -- Style (per item 4: "style")
    style TEXT,                                -- e.g. 'humorous', 'educational', 'aspirational', 'urgent'
    -- Platforms
    platforms TEXT[] NOT NULL DEFAULT '{}',    -- ['instagram','tiktok','youtube','x']
    -- Status
    status TEXT NOT NULL CHECK (status IN ('active','completed','underperforming','planned','cancelled')) DEFAULT 'active',
    -- Timing
    start_date DATE,
    end_date DATE,
    detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- Performance metrics (nullable — only set for self-owned campaigns where we have ground truth)
    budget_usd NUMERIC(12, 2),
    spent_usd NUMERIC(12, 2),
    progress INTEGER CHECK (progress BETWEEN 0 AND 100),
    roi NUMERIC(8, 2),                         -- return on investment multiplier (e.g. 2.5 = 250% ROI)
    -- Platform-specific metrics (per /company/[domain] mock: platformMetrics)
    platform_metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- e.g. {"instagram": {"reach": 1200000, "engagement": 4.5, "followers_gained": 5000}, ...}
    -- Themes (from insights_gaps.metadata.themes — preserved during migration)
    themes TEXT[] NOT NULL DEFAULT '{}',
    -- Linked signals (from insights_signal_links — preserved during migration)
    signal_ids UUID[] NOT NULL DEFAULT '{}',
    -- Metadata for anything else
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    -- Constraint: exactly one of (company_id, competitor_id) must be set
    CONSTRAINT chk_campaign_owner CHECK (
        (owner_type = 'self' AND company_id IS NOT NULL AND competitor_id IS NULL) OR
        (owner_type = 'competitor' AND competitor_id IS NOT NULL AND company_id IS NULL)
    )
);

CREATE INDEX ix_campaigns_workspace ON campaigns.campaigns (workspace_id) WHERE deleted_at IS NULL;
CREATE INDEX ix_campaigns_owner ON campaigns.campaigns (workspace_id, owner_type) WHERE deleted_at IS NULL;
CREATE INDEX ix_campaigns_competitor ON campaigns.campaigns (competitor_id) WHERE competitor_id IS NOT NULL;
CREATE INDEX ix_campaigns_cluster ON campaigns.campaigns (workspace_id, cluster) WHERE cluster IS NOT NULL;

ALTER TABLE campaigns.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns.campaigns FORCE ROW LEVEL SECURITY;
CREATE POLICY rls_campaigns ON campaigns.campaigns
    FOR ALL USING (workspace_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
    WITH CHECK (workspace_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
```

#### Data migration from `insights.insights_gaps layer='campaign'`

```sql
INSERT INTO campaigns.campaigns (
    workspace_id, owner_type, competitor_id, name, description,
    status, detected_at, themes, signal_ids, metadata, created_at, updated_at
)
SELECT
    ig.workspace_id,
    'competitor'::campaign_owner_type,
    ig.competitor_id,
    ig.title,
    ig.description,
    'completed'::TEXT,                          -- default for migrated campaigns
    ig.detected_at,
    COALESCE(ig.metadata->>'themes', '[]')::TEXT[],
    COALESCE(ig.metadata->>'signal_ids', '[]')::UUID[],
    ig.metadata,
    ig.created_at,
    ig.updated_at
FROM insights.insights_gaps ig
WHERE ig.layer = 'campaign' AND ig.deleted_at IS NULL;

-- After verification, soft-delete the migrated rows from insights_gaps
-- UPDATE insights.insights_gaps SET deleted_at = now() WHERE layer = 'campaign';
```

#### Backend changes

1. **New module:** `backend/app/campaigns/`
   - `router.py`:
     - `GET /v1/campaigns?owner_type=self|competitor&competitor_id=&cluster=&status=&limit=` — list with filters
     - `GET /v1/campaigns/{id}` — single campaign
     - `POST /v1/campaigns` — create (agent-only)
     - `PATCH /v1/campaigns/{id}` — update (budget, spent, progress, status, platform_metrics)
     - `DELETE /v1/campaigns/{id}` — soft delete
     - `GET /v1/campaigns/clusters` — distinct clusters for infinite-canvas grouping
     - `GET /v1/campaigns/heatmap` — grouped by ROI bucket (high/average/low) for heatmap view
   - `schemas.py` — `CampaignCreate`, `CampaignUpdate`, `CampaignResponse`, `ClusterResponse`, `HeatmapResponse`.
   - `service.py` — CRUD + aggregation logic.

2. **Retire `CampaignsEngine` in `app/insights/campaigns.py`:**
   - Either delete the engine entirely (preferred) or refactor it to write to `campaigns.campaigns` instead of `insights_gaps layer='campaign'`.
   - Update `app/automation/functions/agent_steps.py:_run_campaigns` to call the new write path.
   - The `/v1/insights/campaigns` endpoint becomes deprecated; remove or redirect to `/v1/campaigns?owner_type=competitor`.

3. **New agent tool:** `store_campaign` in `app/agent/tools/feedback.py` (or new `app/agent/tools/campaigns.py`):
   - Args: `{name, description, owner_type, company_id?, competitor_id?, identified_target?, style?, platforms[], cluster?, ...}`.
   - Inserts into `campaigns.campaigns`.

#### Frontend changes

| File | Change |
|---|---|
| `src/app/campaigns/page.tsx` | Replace 27-item mock with `GET /v1/campaigns?owner_type=competitor&limit=50`. Replace `CLUSTERS` mock with `GET /v1/campaigns/clusters`. Replace `HEATMAP_CLUSTERS` mock with `GET /v1/campaigns/heatmap`. Replace `IMGS` Unsplash URLs with real campaign images (or platform-derived thumbnails). |
| `src/app/campaigns/[id]/page.tsx` | **DELETE the Empee Mushrooms slide deck entirely.** Replace with a real campaign detail view: header (name, status, dates, platforms), target + style section, budget/spent/progress section, platform_metrics charts, linked signals list, "Request Replication Blueprint" button (calls F5). |
| `src/app/page.tsx` (dashboard) | Replace `campaigns` mock with `GET /v1/campaigns?owner_type=self&limit=3&status=active`. |
| `src/app/company/[domain]/page.tsx` (or `/competitors/[id]` per F13) | Replace `campaigns` mock with `GET /v1/campaigns?owner_type=competitor&competitor_id={id}&limit=10`. |
| `src/lib/api.ts` | Add typed `Campaign` interface. |

#### Implementation order

1. **Depends on F1** (company schema must exist for `owner_type='self'` FK).
2. Write & apply migration: create `campaigns` schema + table + RLS.
3. Run data migration: copy `insights_gaps layer='campaign'` rows to `campaigns.campaigns`.
4. Create `backend/app/campaigns/` module.
5. Add `store_campaign` agent tool.
6. Refactor `CampaignsEngine` to write to `campaigns.campaigns` (or delete + redirect pipeline step).
7. Add `GET /v1/campaigns` + `/clusters` + `/heatmap` endpoints.
8. Update frontend `/campaigns` page to call the endpoints.
9. **DELETE** the Empee Mushrooms `/campaigns/[id]` page; replace with real campaign detail.
10. Update dashboard `/` and competitor-detail pages to call `/v1/campaigns`.

#### Cross-feature impact

- **F1:** hard dependency (company_id FK).
- **F5 (Campaign Blueprints):** the `campaigns.campaign_blueprints` table FKs to `campaigns.campaigns.id`.
- **F13 (Competitor Detail):** competitor-detail page reads from `/v1/campaigns?owner_type=competitor`.
- **F11 (Slides):** the deleted Empee Mushrooms slide deck is replaced by the F11 slide-deck feature for any campaign (per Q5: JSON schema).

---

### Feature F5 — Campaign Blueprints

| Field | Value |
|---|---|
| **ID** | F5 |
| **Category** | New Feature |
| **Decision ref** | B3(b) — versioned like battlecards; Q4 — any campaign (self or competitor). |
| **Affected modules** | Backend: new `campaigns/blueprints.py` (or extend `campaigns/` module). Database: new `campaigns.campaign_blueprints` + `campaigns.campaign_blueprint_versions` tables (mirror battlecards). Frontend: `/campaigns/[id]` page (add "Request Replication Blueprint" button). |
| **Complexity** | M |

#### Why

Per Features_probably_missing.txt item 4, clicking "Request a Replication Blueprint" on a competitor campaign should produce a structured blueprint the user can follow. Per B3(b), blueprints are versioned like battlecards. Per Q4, any campaign (own or competitor) can have a blueprint.

#### Database changes

```sql
-- Mirror the graph.graph_battlecards + graph.graph_battlecard_versions pattern
CREATE TABLE campaigns.campaign_blueprints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES core.core_workspaces(id) ON DELETE CASCADE,
    source_campaign_id UUID NOT NULL REFERENCES campaigns.campaigns(id) ON DELETE CASCADE,
    title TEXT NOT NULL,                       -- defaults to "Blueprint: {campaign.name}"
    current_version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    UNIQUE (workspace_id, source_campaign_id)  -- one blueprint per campaign
);

CREATE TABLE campaigns.campaign_blueprint_versions (
    blueprint_id UUID NOT NULL REFERENCES campaigns.campaign_blueprints(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    content JSONB NOT NULL,                    -- structured blueprint (see schema below)
    -- Content shape (per Q5: JSON schema):
    -- {
    --   "executive_summary": str,
    --   "target_audience": {"demographics": ..., "psychographics": ..., "behaviors": ...},
    --   "messaging_pillars": [{"title": str, "description": str, "example_assets": [str]}],
    --   "channel_strategy": [{"platform": str, "tactics": [str], "kpi_targets": {...}}],
    --   "content_calendar": [{"week": int, "theme": str, "deliverables": [str]}],
    --   "budget_allocation": {"production": float, "media_spend": float, "creator_fees": float},
    --   "kpi_framework": [{"metric": str, "baseline": float, "target": float, "measurement_method": str}],
    --   "risk_mitigation": [{"risk": str, "mitigation": str}],
    --   "estimated_timeline": {"pre_production": str, "launch": str, "optimization": str}
    -- }
    model TEXT NOT NULL,                       -- e.g. 'moonshotai/Kimi-K2.6'
    prompt_version INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (blueprint_id, version)
);

ALTER TABLE campaigns.campaign_blueprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns.campaign_blueprints FORCE ROW LEVEL SECURITY;
CREATE POLICY rls_campaign_blueprints ON campaigns.campaign_blueprints
    FOR ALL USING (workspace_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
    WITH CHECK (workspace_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

ALTER TABLE campaigns.campaign_blueprint_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns.campaign_blueprint_versions FORCE ROW LEVEL SECURITY;
CREATE POLICY rls_campaign_blueprint_versions ON campaigns.campaign_blueprint_versions
    FOR ALL USING (
        blueprint_id IN (
            SELECT id FROM campaigns.campaign_blueprints
            WHERE workspace_id = nullif(current_setting('app.tenant_id', true), '')::uuid
        )
    );
```

#### Backend changes

1. **New module:** `backend/app/campaigns/blueprints.py`:
   - `generate_blueprint(campaign_id, db, workspace_id)` — assembles context (campaign + linked signals + competitor market data), calls LLM with the blueprint prompt, returns structured JSON.
   - `regenerate_blueprint(blueprint_id, db, workspace_id)` — writes a new immutable version, bumps `current_version`.
   - Pattern mirrors `app/graph/battlecards.py`.

2. **New endpoints** (in `app/campaigns/router.py`):
   - `POST /v1/campaigns/{campaign_id}/blueprint` — generate a blueprint (returns blueprint_id + initial version).
   - `GET /v1/campaigns/{campaign_id}/blueprint` — get the current version.
   - `GET /v1/campaigns/{campaign_id}/blueprint/versions` — list all versions.
   - `GET /v1/campaigns/{campaign_id}/blueprint/versions/{version}` — get a specific version.
   - `POST /v1/campaigns/{campaign_id}/blueprint/regenerate` — write a new version.

3. **New agent tool:** `request_replication_blueprint` in `app/agent/tools/campaigns.py`:
   - Args: `{campaign_id}`.
   - Calls `generate_blueprint`, returns the blueprint content.

4. **New prompt:** `app/prompts/campaign_blueprint.py` — defines the JSON schema the LLM must return.

#### Frontend changes

| File | Change |
|---|---|
| `src/app/campaigns/[id]/page.tsx` | Add "Request Replication Blueprint" button (or "View Blueprint" if one exists). On click: `POST /v1/campaigns/{id}/blueprint`. Render the returned JSON in a structured layout (sections: Executive Summary, Target Audience, Messaging Pillars, Channel Strategy, etc.). |
| `src/lib/api.ts` | Add typed `CampaignBlueprint` interface. |

#### Implementation order

1. **Depends on F4** (campaigns table must exist).
2. Write & apply migration: create `campaign_blueprints` + `campaign_blueprint_versions` tables.
3. Create `app/campaigns/blueprints.py` (mirror `app/graph/battlecards.py`).
4. Create `app/prompts/campaign_blueprint.py`.
5. Add endpoints in `app/campaigns/router.py`.
6. Add `request_replication_blueprint` agent tool.
7. Update frontend `/campaigns/[id]` page with blueprint button + render layout.

#### Cross-feature impact

- **F4:** hard dependency.
- **F11 (Slides):** the blueprint's `content_calendar` and `messaging_pillars` could feed the slide-deck generator (F11) — potential integration point.

---

### Feature F6 — Partnerships Timeline with Event Dates

| Field | Value |
|---|---|
| **ID** | F6 |
| **Category** | New Feature |
| **Decision ref** | B4 — add `announced_at` + `date_source` columns to `graph.graph_relationships`; allow user corrections through agent chat (no direct UI edit). Backfill existing data as NULL/unknown. |
| **Affected modules** | Backend: `graph/relationships.py`, `agent/tools/partnerships.py`, `agent/tools/partnership_sources.py`. Database: ALTER `graph.graph_relationships`. Frontend: `/partnerships` page (timeline view uses `announced_at` instead of `created_at`). |
| **Complexity** | M |

#### Why

Per Features_probably_missing.txt item 3, the partnerships timeline should show WHEN partnerships actually happened (not when they were added to the DB). The date should be extracted from social media captions or post dates, or from newspaper article publish dates, with a `source` field recording where the date came from. The current `graph.graph_relationships` only has `created_at`/`updated_at`.

#### Database changes

```sql
-- New enum for date provenance
CREATE TYPE partnership_date_source AS ENUM (
    'caption_explicit',         -- date explicitly mentioned in social caption
    'post_date',                -- date of the social post announcing the partnership
    'article_publish_date',     -- publication date of a news article
    'article_written_date',     -- dateline / written date of a news article (fallback)
    'unknown'                   -- no date could be extracted
);

ALTER TABLE graph.graph_relationships
    ADD COLUMN IF NOT EXISTS announced_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS date_source partnership_date_source NOT NULL DEFAULT 'unknown';

CREATE INDEX ix_graph_relationships_announced_at
    ON graph.graph_relationships (workspace_id, announced_at)
    WHERE announced_at IS NOT NULL AND deleted_at IS NULL;
```

**Note:** `graph.graph_corrections` is frozen (append-only trigger). `graph.graph_relationships` is NOT frozen, so ALTER TABLE works without a change request.

#### Backend changes

1. **Update `discover_partnerships` agent tool** (`app/agent/tools/partnerships.py`):
   - When extracting a partnership from a signal, also extract the announcement date.
   - For social signals: try caption-explicit date first (LLM extracts), fall back to `signals.captured_at` (post date).
   - For news signals: use `sense.sense_news_articles.published_at` if available, else `signals.captured_at`.
   - Store `announced_at` + `date_source` on the INSERT into `graph.graph_relationships`.

2. **Update `partnership_sources.py`:**
   - SEC EDGAR: extract filing date as `announced_at`, `date_source='article_publish_date'`.
   - USPTO PatentsView: extract patent grant date as `announced_at`, `date_source='article_publish_date'`.
   - GDELT: extract article publish date as `announced_at`, `date_source='article_publish_date'`.
   - SocialCrawl: extract post date as `announced_at`, `date_source='post_date'` (or `caption_explicit` if LLM finds a date in the caption).

3. **Update `add_partnership` agent tool** to accept optional `announced_at` + `date_source` args.

4. **New agent tool:** `correct_partnership_date` (or extend `update_partnership`):
   - Args: `{relationship_id, announced_at, date_source, reason}`.
   - Updates `graph.graph_relationships.announced_at` + `date_source`.
   - Also writes a `graph.graph_corrections` row recording the user's correction (per B4: "allow user to correct stuff THROUGH chatting with the agent").

5. **Update `GET /v1/graph/partnerships`** (`app/graph/router.py`):
   - Include `announced_at` + `date_source` in the edge response shape.
   - Add optional `?timeline=true` param that filters to edges with `announced_at IS NOT NULL` and sorts by `announced_at`.

#### Frontend changes

| File | Change |
|---|---|
| `src/app/partnerships/page.tsx` | Timeline view currently uses `created_at`/`updated_at` (real timestamps). Change to use `announced_at` (with `date_source` shown as a tooltip/badge). Filter out edges with `announced_at IS NULL` from the timeline (show them only in the graph view). Add a small badge/icon indicating `date_source` (e.g. 📅 for explicit, 📰 for article, 📝 for post_date). |
| `src/lib/api.ts` | Update `DBGraphEdge` interface to include `announced_at?: string` and `date_source?: string`. |

#### Implementation order

1. Write & apply migration: ALTER `graph.graph_relationships` + new enum + index.
2. Update `partnership_sources.py` to extract dates from each source.
3. Update `discover_partnerships` agent tool to store `announced_at` + `date_source`.
4. Update `add_partnership` agent tool to accept optional date args.
5. Add `correct_partnership_date` capability to `update_partnership` (or new tool).
6. Update `GET /v1/graph/partnerships` response shape + timeline filter.
7. Update frontend `/partnerships` timeline view.
8. **No backfill** of existing data (per B4: leave NULL/unknown).

#### Cross-feature impact

- None significant. The `graph.graph_relationships` table is used by `GET /v1/graph/partnerships`, `query_partnership_graph` agent tool, and the frontend `/partnerships` page — all updated together.

---

### Feature F7 — Profile Enhancements (Bio, Focus Areas, Markets, Objectives)

| Field | Value |
|---|---|
| **ID** | F7 |
| **Category** | New Feature |
| **Decision ref** | B5 — bio on `core.core_users`; focus_areas per-user (JSONB on core_users); markets per-workspace (JSONB on core_workspaces); objectives per-user (JSONB on core_users). |
| **Affected modules** | Backend: `core/router.py` (extend user + workspace endpoints), `core/service.py`. Database: ALTER `core.core_users` + `core.core_workspaces`. Frontend: `/profile` page (replace all PROFILE_DATA mocks). |
| **Complexity** | M |

#### Why

Per Features_probably_missing.txt item 5, the profile page should show: Overview, Corporate Identity, Focus Areas, User Objectives. The frontend mocks all of these. None exist in the backend.

#### Database changes

```sql
-- Add bio + focus_areas + objectives to core.core_users (per B5: per-user)
ALTER TABLE core.core_users
    ADD COLUMN IF NOT EXISTS bio TEXT,
    ADD COLUMN IF NOT EXISTS focus_areas JSONB NOT NULL DEFAULT '[]'::jsonb,
    -- focus_areas shape: [{"label": "Market Expansion", "description": "...", "learned_at": "2026-07-20"}]
    ADD COLUMN IF NOT EXISTS objectives JSONB NOT NULL DEFAULT '[]'::jsonb;
    -- objectives shape: [{"title": "Expand MENA Market Presence", "target": "Q3 2026", "status": "on_track"|"at_risk"|"completed", "learned_at": "2026-07-20"}]

-- Add markets + goals to core.core_workspaces (per D1: workspace-level goals + B5: markets per-workspace)
ALTER TABLE core.core_workspaces
    ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;
    -- metadata shape: {
    --   "markets": {"countries": ["Egypt","UAE"], "regions": ["MENA"], "industries": ["FinTech"]},
    --   "goals": ["expansion"|"tracking"|"innovation"],   -- from onboarding step 1 (per D1)
    --   "topics": ["AI","SaaS"]                          -- from onboarding step 3 (per D3)
    -- }
```

#### Backend changes

1. **Extend `GET /v1/core/workspaces/{id}/members`** to include each member's `bio`, `focus_areas`, `objectives`.
2. **New endpoints:**
   - `PATCH /v1/core/users/me` — update current user's `bio`, `focus_areas`, `objectives` (and `full_name` if desired).
   - `GET /v1/core/users/me` — current user's full profile.
   - `PATCH /v1/core/workspaces/{id}` — update workspace `metadata.markets` (admin only).
3. **Update agent tools:**
   - Extend `save_onboarding_data` to also save `goals` to `core_workspaces.metadata.goals` (per D1) and `topics` to `core_workspaces.metadata.topics` (per D3).
   - New agent tool: `update_user_profile` — updates `bio`, `focus_areas`, `objectives` on `core.core_users`. Per Features_probably_missing.txt item 5: "ALL SHOULD BE LEARNED ABOUT THE USER/MEMBER THROUGH THE AGENT" — so the agent populates these fields during chat.
   - New agent tool: `update_workspace_markets` — updates `core_workspaces.metadata.markets`.

#### Frontend changes

| File | Change |
|---|---|
| `src/app/profile/page.tsx` | Replace `PROFILE_DATA` mock with `GET /v1/core/users/me` + `GET /v1/core/workspaces/{id}`. Bio textarea calls `PATCH /v1/core/users/me`. Competitor logos section uses `GET /v1/competitors?limit=5`. Markets tab reads from `core_workspaces.metadata.markets`. Objectives + focus_areas read from `core_users.objectives` + `core_users.focus_areas`. |
| `src/components/Globe.tsx` | The 5 hardcoded country IDs (`HIGHLIGHTED_COUNTRY_IDS = [818, 784, 682, 276, 826]`) should be derived from `core_workspaces.metadata.markets.countries` (mapped to ISO numeric codes). |
| `src/app/settings/page.tsx` | The 3 workspace-users rows in `MOCK_USERS` come from `GET /v1/core/workspaces/{id}/members` (now including bio/focus_areas/objectives per member). |

#### Implementation order

1. Write & apply migration: ALTER `core.core_users` + `core.core_workspaces`.
2. Add `PATCH /v1/core/users/me` + `GET /v1/core/users/me` endpoints.
3. Extend `GET /v1/core/workspaces/{id}/members` to include new fields.
4. Add `PATCH /v1/core/workspaces/{id}` endpoint (admin-only).
5. Add `update_user_profile` + `update_workspace_markets` agent tools.
6. Extend `save_onboarding_data` to write `goals` + `topics` to workspace metadata.
7. Update frontend `/profile` page.
8. Update `Globe.tsx` to derive country IDs from API data.

#### Cross-feature impact

- **F1:** `company.companies` is loaded alongside the user profile for the corporate-identity section.
- **F8 (Agent Memory):** the agent memory view surfaces the user's `focus_areas` + `objectives` so the user can see what the agent has learned.
- **F10 (Onboarding):** onboarding step 1 (goal) and step 3 (topics) write to `core_workspaces.metadata` per D1 and D3.

---

### Feature F8 — Agent Memory View

| Field | Value |
|---|---|
| **ID** | F8 |
| **Category** | New Feature |
| **Decision ref** | B6(a) + surface in `/settings` as a new "Agent Memory" section. |
| **Affected modules** | Backend: `agent/router.py` (new endpoint), `agent/memory.py` (extend `load_context` to expose learned facts). Frontend: `/settings` page (new "Agent Memory" tab). |
| **Complexity** | S |

#### Why

Per Features_probably_missing.txt item 6, the user wants to view "what the agent decided to keep and remember about the member (just view only)". The backend's `agent.memory.load_context` already composes self-profile + recent corrections + recent gaps — but there's no `GET /v1/agent/memory` endpoint.

#### Backend changes

1. **New endpoint:** `GET /v1/agent/memory` in `app/agent/router.py`:
   - Returns the structured memory the agent uses for the current user:
     ```json
     {
       "self_profile": {...},                   // from company.companies (per F1)
       "self_profile_summary": "...",            // string built from metadata.positioning
       "competitor_count": 5,
       "user_profile": {                          // NEW — from core.core_users (per F7)
         "bio": "...",
         "focus_areas": [...],
         "objectives": [...]
       },
       "workspace_metadata": {                    // NEW — from core.core_workspaces
         "markets": {...},
         "goals": [...],
         "topics": [...]
       },
       "recent_corrections": [...],               // last 10 from graph.graph_corrections
       "recent_gaps": [...],                      // last 10 from insights.insights_gaps
       "learned_facts": [...]                     // NEW — extracted from past agent conversations
     }
     ```
   - `learned_facts` is a new concept: facts the agent has extracted from past conversations and stored for future use. Implement as a new table `agent.agent_memory_facts` (or store in `core.core_users.metadata` JSONB array — simpler, no new table).

2. **Extend `agent.memory.load_context`** to also load `user_profile` (bio, focus_areas, objectives) + `workspace_metadata` (markets, goals, topics) so the agent has full context.

#### Frontend changes

| File | Change |
|---|---|
| `src/app/settings/page.tsx` | Add a new "Agent Memory" tab. Render the memory as read-only sections: Self Profile (from `company.companies`), User Profile (bio, focus_areas, objectives), Workspace Metadata (markets, goals, topics), Recent Corrections (table), Recent Gaps (list), Learned Facts (list). All fields are read-only (per B6: "just view only"). |

#### Implementation order

1. **Depends on F1 + F7** (company schema + user profile fields must exist).
2. Decide: new `agent.agent_memory_facts` table OR `core.core_users.metadata.learned_facts` JSONB array. Recommend the JSONB array (simpler, no new table).
3. Add `GET /v1/agent/memory` endpoint.
4. Extend `load_context` to include user_profile + workspace_metadata.
5. Add a new agent tool `remember_fact` that appends to `core.core_users.metadata.learned_facts` (agent calls this proactively when the user shares something worth remembering).
6. Update frontend `/settings` with the new tab.

#### Cross-feature impact

- **F1, F7:** hard dependencies.
- **F9 (Chat History):** the chat history icon (F9) is separate but complementary — memory shows what the agent *knows*, history shows what the agent *was told*.

---

### Feature F9 — Chat History Icon

| Field | Value |
|---|---|
| **ID** | F9 |
| **Category** | New Feature |
| **Decision ref** | B7(c) — history icon in the PromptField mascot. E7 — `POST /v1/agent/conversations/{id}/messages` for stored chat (industry standard). Keep `POST /v1/agent/chat` for non-stored automation pipelines. |
| **Affected modules** | Backend: `agent/router.py` (new endpoint `POST /v1/agent/conversations/{id}/messages`). Frontend: `PromptField.tsx` (add history icon + panel), new `/chats/[id]` route OR a modal. |
| **Complexity** | S |

#### Why

Per Features_probably_missing.txt item 6, the user wants "a history of all the Chats THIS SPECIFIC MEMBER of the workspace had with the agent with the ability to continue on if wanted". The backend already has `GET /v1/agent/conversations` and `GET /v1/agent/conversations/{id}` — the frontend just doesn't surface them.

Per E7, the canonical endpoint for stored chat becomes `POST /v1/agent/conversations/{id}/messages` (industry standard, RESTful). `POST /v1/agent/chat` remains for non-stored automation pipelines.

#### Backend changes

1. **New endpoint:** `POST /v1/agent/conversations/{id}/messages` in `app/agent/router.py`:
   - Same behavior as `POST /v1/agent/chat` but requires a `conversation_id` path param (no auto-create).
   - Returns SSE stream (same event types as `/v1/agent/chat`).
   - If the conversation doesn't exist or doesn't belong to the current user, return 404.

2. **Update `POST /v1/agent/chat`** to be documented as "ephemeral" (no conversation persistence) for automation use. Or, simpler: keep `/v1/agent/chat` creating conversations (current behavior) but add a `?ephemeral=true` query param to skip persistence. **Recommend:** keep `/v1/agent/chat` as-is (auto-creates conversations) and add `/v1/agent/conversations/{id}/messages` as the canonical "continue this conversation" endpoint.

3. **Update `GET /v1/agent/conversations`** to support pagination (`?limit=20&offset=`) and sorting (`?sort=recent_activity`).

#### Frontend changes

| File | Change |
|---|---|
| `src/components/PromptField.tsx` | Add a history icon (clock or list icon) next to the mascot. On click, opens a panel listing past conversations (`GET /v1/agent/conversations?limit=20`). Each item shows title, last message preview, timestamp. Clicking an item sets `conversation_id` in the PromptField state and calls `POST /v1/agent/conversations/{id}/messages` for subsequent messages. |
| `src/lib/api.ts` | Update `sseStream` call in PromptField to use `/v1/agent/conversations/{conversation_id}/messages` when `conversation_id` is set, falling back to `/v1/agent/chat` for new conversations. |

#### Implementation order

1. Add `POST /v1/agent/conversations/{id}/messages` endpoint (mirror of `/v1/agent/chat` with required conversation_id).
2. Add pagination to `GET /v1/agent/conversations`.
3. Update frontend `PromptField.tsx` with history icon + panel.
4. Update `sseStream` call site to use the new endpoint when `conversation_id` is set.

#### Cross-feature impact

- None significant. Standalone feature.

---

### Feature F10 — Onboarding Flow Persistence

| Field | Value |
|---|---|
| **ID** | F10 |
| **Category** | New Feature |
| **Decision ref** | D1 (goal → workspace + user metadata), D2 (batch endpoint for competitors), D3 (topics → self-row metadata), D4 (PDF → temp storage → agent Gemini analysis → company.companies.metadata), D5 (chat → agent onboarding intent, manual vs agent-driven paths), E6 (invites → existing endpoint, display URL for copy/paste). |
| **Affected modules** | Backend: `competitors/router.py` (batch endpoint), `core/router.py` (workspace metadata update), `agent/` (PDF upload + onboarding chat flow). Frontend: all 6 onboarding steps. Database: none new (uses F1's `company.companies` + F7's `core_workspaces.metadata`). |
| **Complexity** | L |

#### Why

All 6 onboarding steps persist zero data to the backend (see §1.18). Additionally, step 6 routes to `/` without selecting a workspace, breaking every subsequent API call. Google OAuth signup skips onboarding entirely.

#### Backend changes

1. **New endpoint:** `POST /v1/competitors/batch` (per D2):
   ```json
   // Request
   {"competitors": [{"name": "Apple", "website": "apple.com", "description": "..."}, ...]}
   // Response
   {"created": [...], "failed": [{"name": "...", "error": "..."}]}
   ```
   - Iterates the input, calls the existing `create_competitor` logic per item.
   - Returns per-item success/failure (don't fail the whole batch on one bad item).
   - Each created competitor gets a pending `scrape_run` seeded (existing behavior).

2. **New endpoint:** `POST /v1/company/upload-brief` (per D4):
   - Accepts a multipart file upload (PDF, max 10MB).
   - Stores in Supabase Storage (temp bucket, 24h TTL).
   - Returns a temporary URL the agent can pass to Gemini for analysis.
   - The agent then calls `update_company_profile` with the extracted data.
   - PDF is deleted from storage after the agent's analysis completes (or after 24h TTL).

3. **Extend `save_onboarding_data` agent tool** to accept `goals`, `topics` and write them to `core_workspaces.metadata` (per D1, D3).

4. **New agent tool:** `start_competitor_scrape`:
   - Args: `{competitor_ids: UUID[]}`.
   - Calls the existing `POST /v1/competitors/{id}/scrape` per item, in the background via Inngest.
   - Per D5: "the agent prompts the user if they want the scrapping to start now (if yes, it starts in the background automatically using the agent and the user continues their onboarding normally)".

5. **New agent prompt flow** (per D5):
   - If onboarding is done via agent chat: agent calls `save_onboarding_data` + `scrape_user_company` + `build_self_profile` automatically.
   - If onboarding is done via manual form fill: agent calls `ask_user_question` to prompt "Would you like me to run a self-profile analysis now?" before calling `build_self_profile`.
   - For competitor discovery: agent calls `discover_competitors` (FIND only, no scrape) → user reviews → agent calls `ask_user_question` to prompt "Start scraping now?" → if yes, calls `start_competitor_scrape`.

6. **Fix Google OAuth signup:** change `signInWithGoogle('/workspaces')` in `/signup` to `signInWithGoogle('/onboarding')` for consistency with the email signup flow.

#### Frontend changes

| File | Change |
|---|---|
| `src/app/onboarding/page.tsx` (step 1) | On continue: `PATCH /v1/core/workspaces/{id}` with `{metadata: {goals: [selectedOption]}}` (per D1: also user metadata if user is admin/owner). |
| `src/app/onboarding/step-2/page.tsx` | On continue: `POST /v1/competitors/batch` with the selected companies. Replace `MOCK_COMPANIES` with a real company-search endpoint (or use the agent's `discover_competitors` tool via `/v1/agent/chat`). |
| `src/app/onboarding/step-3/page.tsx` | On continue: `PATCH /v1/core/workspaces/{id}` with `{metadata: {topics: [topic1, topic2, ...]}}` (per D3). |
| `src/app/onboarding/step-4/page.tsx` | On upload: `POST /v1/company/upload-brief` with the PDF file. On skip: no call. |
| `src/app/onboarding/step-5/page.tsx` | Replace mock Hermes reply with `sseStream('/v1/agent/conversations/{conversation_id}/messages', {content: userMessage})`. The agent should call `save_onboarding_data` + `build_self_profile` during this chat. |
| `src/app/onboarding/step-6/page.tsx` | On "Go to Dashboard": for each email, call `POST /v1/core/workspaces/{id}/invitations` with `{email, role: 'member'}`. Display the returned invite URLs for copy/paste (per E6). Then route to `/workspaces` FIRST (not `/`) to ensure workspace is selected. |
| `src/app/signup/page.tsx` | Change `signInWithGoogle('/workspaces')` to `signInWithGoogle('/onboarding')`. |
| `src/app/workspaces/page.tsx` | On workspace create: route to `/onboarding` (not `/`) so the user goes through the full flow. |

#### Implementation order

1. **Depends on F1** (company schema) + F7 (workspace metadata) + F9 (agent conversations endpoint).
2. Add `POST /v1/competitors/batch` endpoint.
3. Add `POST /v1/company/upload-brief` endpoint.
4. Extend `save_onboarding_data` to accept `goals` + `topics`.
5. Add `start_competitor_scrape` agent tool.
6. Update agent system prompt to handle the onboarding flow (manual vs agent-driven paths per D5).
7. Update each of the 6 frontend onboarding steps to call the appropriate endpoints.
8. Fix the step-6 routing bug (route to `/workspaces` first).
9. Fix Google OAuth signup routing.

#### Cross-feature impact

- **F1, F7, F9:** dependencies.
- **F8 (Agent Memory):** the agent's `save_onboarding_data` calls during onboarding populate the memory the user later sees in `/settings`.

---

### Feature F11 — Slides

| Field | Value |
|---|---|
| **ID** | F11 |
| **Category** | New Feature |
| **Decision ref** | E5 — JSON schema (backend emits JSON, frontend renders). |
| **Affected modules** | Backend: `automation/functions/reporters_pipeline.py` (replace stub), new `app/slides/` module (or extend `brief/`). Database: new `slides.slides` + `slides.slide_versions` tables (mirror briefs). Frontend: replace `/campaigns/[id]` Empee Mushrooms content with a slide renderer, OR a new `/slides/{id}` route. |
| **Complexity** | M |

#### Why

The `_run_slides` pipeline step is a pure stub (§1.7). The frontend `/campaigns/[id]` page currently shows "Empee Mushrooms" demo content (§K7 from frontend exploration). Per Q5, the backend emits a JSON schema and the frontend renders it.

#### Database changes

```sql
CREATE SCHEMA IF NOT EXISTS slides;

-- A slide deck is tied to either a brief or a campaign (nullable both)
CREATE TABLE slides.slides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES core.core_workspaces(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    brief_id UUID REFERENCES brief.briefs(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES campaigns.campaigns(id) ON DELETE CASCADE,
    current_version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE slides.slide_versions (
    slide_id UUID NOT NULL REFERENCES slides.slides(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    -- JSON schema (per Q5):
    -- {
    --   "slides": [
    --     {"type": "cover", "title": "...", "subtitle": "...", "image_query": "..."},
    --     {"type": "chart", "title": "...", "data": {"labels": [...], "values": [...]}, "chart_type": "bar"|"line"|"pie"},
    --     {"type": "quote", "text": "...", "attribution": "..."},
    --     {"type": "bullets", "title": "...", "bullets": [{"text": "...", "subtext": "..."}]},
    --     {"type": "image_grid", "title": "...", "images": [{"url": "...", "caption": "..."}]},
    --     {"type": "stat_block", "title": "...", "stats": [{"label": "...", "value": "...", "change": "..."}]},
    --     {"type": "timeline", "title": "...", "events": [{"date": "...", "title": "...", "description": "..."}]},
    --     {"type": "typography_spec", "title": "...", "fonts": [{"family": "...", "weight": "...", "usage": "..."}]}
    --   ]
    -- }
    content JSONB NOT NULL,
    model TEXT NOT NULL,
    prompt_version INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (slide_id, version)
);

ALTER TABLE slides.slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE slides.slides FORCE ROW LEVEL SECURITY;
CREATE POLICY rls_slides ON slides.slides
    FOR ALL USING (workspace_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
    WITH CHECK (workspace_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
```

#### Backend changes

1. **Replace `_run_slides` stub** in `app/automation/functions/reporters_pipeline.py`:
   - Load the latest brief.
   - Load top opportunities + top gaps + top campaigns.
   - Call LLM with a slide-generation prompt (`app/prompts/slides.py`).
   - Insert into `slides.slides` + `slides.slide_versions`.

2. **New module:** `backend/app/slides/`:
   - `router.py` — `GET /v1/slides` (list), `GET /v1/slides/{id}` (current version), `GET /v1/slides/{id}/versions/{v}`, `POST /v1/slides/generate` (manual trigger).
   - `generator.py` — assembles context + calls LLM.
   - `schemas.py` — `SlideResponse`, `SlideVersionResponse`.
   - `prompts.py` — defines the JSON schema the LLM must return.

3. **New endpoints:**
   - `GET /v1/briefs/{brief_id}/slides` — get the slide deck for a brief.
   - `POST /v1/briefs/{brief_id}/slides/generate` — generate/regenerate.

#### Frontend changes

| File | Change |
|---|---|
| `src/app/campaigns/[id]/page.tsx` | DELETE the Empee Mushrooms slide deck entirely (per E1). Replace with the F5 campaign-detail view (or a slide-deck view if the campaign has a generated slide deck). |
| New file: `src/app/slides/[id]/page.tsx` | New route for viewing a slide deck. Renders the JSON schema: cover slide, chart slide (using Recharts), quote slide, bullets slide, image grid, stat block, timeline, typography spec. Navigation: arrow keys + tap + auto-advance every 6s (matching the current Empee UX). |
| `src/app/briefs/[id]/page.tsx` (NEW) | New page showing the latest brief + a "View Slide Deck" button linking to `/slides/{id}`. |
| `src/components/Sidebar.tsx` | Add "Briefs" nav item (currently absent). |

#### Implementation order

1. Write & apply migration: create `slides` schema + tables.
2. Create `backend/app/slides/` module.
3. Create `app/prompts/slides.py`.
4. Replace `_run_slides` stub with real generation.
5. Add `GET /v1/slides` + `POST /v1/slides/generate` endpoints.
6. **DELETE** the Empee Mushrooms `/campaigns/[id]` page (per E1).
7. Create new `/slides/[id]` route with the JSON-schema slide renderer.
8. Create new `/briefs/[id]` route.
9. Add "Briefs" nav item to sidebar.

#### Cross-feature impact

- **F4 (Campaigns):** `slides.slides.campaign_id` FK depends on `campaigns.campaigns`.
- **F5 (Blueprints):** the slide renderer could be reused for blueprint presentations.
- The frontend `/campaigns/[id]` page is replaced (per E1).

---

### Feature F12 — Auth Flow Completion

| Field | Value |
|---|---|
| **ID** | F12 |
| **Category** | Polish |
| **Decision ref** | (none — straightforward fix) |
| **Affected modules** | Frontend: `/forgot-password`, `/update-password`. |
| **Complexity** | S |

#### Why

Both `/forgot-password` and `/update-password` have stubbed handlers (§K1 from frontend exploration). The comments explicitly say what to call but the call is missing.

#### Backend changes

None — Supabase Auth handles both flows natively.

#### Frontend changes

| File | Change |
|---|---|
| `src/app/forgot-password/page.tsx` | Replace `setIsSent(true)` with `await supabase.auth.resetPasswordForEmail(email, { redirectTo: '${window.location.origin}/update-password' })`. Remove the "[Simulate Email Link: Update Password]" temporary link. |
| `src/app/update-password/page.tsx` | Replace `router.push('/login')` with `await supabase.auth.updateUser({ password })` then `router.push('/login')`. |

#### Implementation order

1. Wire up `/forgot-password` to `supabase.auth.resetPasswordForEmail`.
2. Wire up `/update-password` to `supabase.auth.updateUser`.
3. Remove the temporary "Simulate Email Link" UI.

#### Cross-feature impact

- None.

---

### Feature F13 — Competitor Detail Page + Competitor Columns

| Field | Value |
|---|---|
| **ID** | F13 |
| **Category** | New Feature |
| **Decision ref** | E2(a) — add `founding_year`, `market_valuation_usd`, `industry` columns to `competitors.competitors_competitors`. E1 — `/campaigns/[id]` is unrelated demo content (handled by F4/F11). |
| **Affected modules** | Backend: `competitors/router.py` (new endpoint), `competitors/schemas.py`. Database: ALTER `competitors.competitors_competitors`. Frontend: `/company/[domain]` (rename to `/competitors/[id]`), all 4 mocks on that page. |
| **Complexity** | M |

#### Why

The `/company/[domain]` page is 100% mocked: "Since 1967", "Market Val: 0.67", "Industry: Technology", Lorem ipsum description, 3 mock charts, 3 mock campaigns, 3 mock gaps, 4 mock reviews. The page receives a domain via URL param but doesn't fetch a competitor record. Per §1.16, `founding_year`, `market_valuation_usd`, `industry` columns don't exist in the backend.

#### Database changes

```sql
ALTER TABLE competitors.competitors_competitors
    ADD COLUMN IF NOT EXISTS founding_year INTEGER,
    ADD COLUMN IF NOT EXISTS market_valuation_usd NUMERIC(18, 2),
    ADD COLUMN IF NOT EXISTS industry TEXT;
```

#### Backend changes

1. **New endpoints** in `app/competitors/router.py`:
   - `GET /v1/competitors/{competitor_id}` — single competitor (id, name, website, description, founding_year, market_valuation_usd, industry, metadata, created_at).
   - `GET /v1/competitors/{competitor_id}/signals/aggregated?metric=score|volume&range=1m|3m|6m|1y` — daily/weekly/monthly aggregation of signals for the 3 line charts on the detail page.
   - `GET /v1/sense/reviews?competitor_id={id}&limit=20` — list reviews for a competitor (the backend has collect-only endpoints; needs a list endpoint).
   - `GET /v1/insights/gaps?competitor_id={id}&limit=10` — list gaps for a competitor (requires F14 to add the `competitor_id` filter).

2. **Extend `POST /v1/competitors`** to accept optional `founding_year`, `market_valuation_usd`, `industry` (populated by the agent's `extract_competitor_products` tool or via scraper enrichment).

3. **Update `register_competitor` agent tool** to populate the new columns from scraped data.

#### Frontend changes

| File | Change |
|---|---|
| `src/app/company/[domain]/page.tsx` | **Rename file** to `src/app/competitors/[id]/page.tsx` (route `/competitors/[id]`). Replace `mockChartData` with `GET /v1/competitors/{id}/signals/aggregated?metric=score&range=6m`. Replace `gaps` mock with `GET /v1/insights/gaps?competitor_id={id}&limit=10`. Replace `reviews` mock with `GET /v1/sense/reviews?competitor_id={id}&limit=20`. Replace `campaigns` mock with `GET /v1/campaigns?owner_type=competitor&competitor_id={id}&limit=10`. Replace hardcoded "Since 1967", "$0.67", "Industry: Technology", Lorem ipsum with real competitor fields. |
| `src/app/competitors/page.tsx` | Update card-click handler to route to `/competitors/{id}` instead of `/company/{domain}`. (The morph animation params can be preserved.) |
| `src/app/partnerships/page.tsx` | Update double-click handler on company node to route to `/competitors/{id}` (need to look up the competitor ID from the entity name/website). |

#### Implementation order

1. Write & apply migration: ALTER `competitors.competitors_competitors`.
2. Add `GET /v1/competitors/{id}` endpoint.
3. Add `GET /v1/competitors/{id}/signals/aggregated` endpoint.
4. Add `GET /v1/sense/reviews` list endpoint.
5. **Depends on F14** for `GET /v1/insights/gaps?competitor_id=`.
6. **Depends on F4** for `GET /v1/campaigns?owner_type=competitor&competitor_id=`.
7. Rename frontend route `/company/[domain]` → `/competitors/[id]`.
8. Replace all mocks with real API calls.

#### Cross-feature impact

- **F4, F14:** dependencies (campaigns + gaps filtering).
- **F1:** after F1, the `/company/[domain]` route is freed up to become the user's OWN company page (per F1 frontend changes) — but the cleaner approach is to keep `/competitors/[id]` for competitors and use `/profile` (extended per F7) for the user's own company.

---

### Feature F14 — Insights Gaps/Campaigns Endpoint Filters

| Field | Value |
|---|---|
| **ID** | F14 |
| **Category** | Wiring |
| **Decision ref** | (none — straightforward fix) |
| **Affected modules** | Backend: `insights/router.py`. Frontend: `/` dashboard (Growth Gaps), `/competitors/[id]` (Strategic Gaps). |
| **Complexity** | S |

#### Why

Per §1.12, `GET /v1/insights/gaps` does NOT accept `competitor_id` or `layer` query params — only `limit`. The frontend cannot filter gaps by competitor on the `/competitors/[id]` page.

#### Backend changes

Update `_make_list_endpoint` factory in `app/insights/router.py:126-149` to accept optional `competitor_id` and `layer` query params:

```python
def _make_list_endpoint(name: str) -> Callable[..., Any]:
    base_sql = text(_GET_QUERIES[name])
    async def _endpoint(
        user: CurrentUser = Depends(require_workspace_member),
        session: AsyncSession = Depends(get_db),
        limit: int = Query(50, ge=1, le=200),
        competitor_id: UUID | None = Query(None),    # NEW
        layer: str | None = Query(None),              # NEW (only applies to /gaps)
    ) -> list[dict[str, Any]]:
        # Build dynamic WHERE clause
        params = {"ws": user.workspace_id, "limit": limit}
        sql_str = str(base_sql)
        if competitor_id is not None:
            sql_str = sql_str.replace(
                "WHERE workspace_id = :ws",
                "WHERE workspace_id = :ws AND competitor_id = :cid"
            )
            params["cid"] = competitor_id
        if layer is not None and name == "gaps":
            sql_str = sql_str.replace(
                "WHERE workspace_id = :ws",
                "WHERE workspace_id = :ws AND layer = :layer"
            )
            params["layer"] = layer
        result = await session.execute(text(sql_str), params)
        ...
```

Apply the same pattern to `/v1/insights/crises`, `/deals`, `/neg-comments`, `/trends` (the `competitor_id` filter applies to all; `layer` only to `/gaps`).

#### Frontend changes

| File | Change |
|---|---|
| `src/app/page.tsx` (dashboard) | Replace `gaps` mock with `GET /v1/insights/gaps?layer=gap&limit=5` (filter out `act_now`/`alarm_for_us`/`campaign` layers for the "Growth Gaps" carousel). |
| `src/app/competitors/[id]/page.tsx` (per F13) | Replace `gaps` mock with `GET /v1/insights/gaps?competitor_id={id}&limit=10`. |

#### Implementation order

1. Update `_make_list_endpoint` factory.
2. Update frontend dashboard + competitor-detail page.

#### Cross-feature impact

- **F13:** dependency (competitor-detail page needs the filter).
- **F3 (Opportunities):** the `related_gap_ids` array on opportunities can now be deep-linked to a filtered gaps view.

---

### Feature F15 — Sense Reviews List Endpoint + Real Platform Miner

| Field | Value |
|---|---|
| **ID** | F15 |
| **Category** | Critical Bug Fix + Wiring |
| **Decision ref** | (none — straightforward fix) |
| **Affected modules** | Backend: `sense/router.py` (new list endpoint), `sense/reviews.py` (replace stub_platform_miner). Frontend: `/` dashboard (What Customers Are Saying), `/competitors/[id]` (Top Comments). |
| **Complexity** | M |

#### Why

Per §1.5, `stub_platform_miner` is the DEFAULT review collector — production ingests 3 hardcoded fake reviews per competitor per run. Per §1.17, the frontend has no way to list reviews (backend has collect-only).

#### Backend changes

1. **Replace `stub_platform_miner`** in `app/sense/reviews.py:21-50`:
   - Option A: Implement real platform miners for G2, Capterra, Trustpilot (significant effort — each platform has its own scraping/API requirements).
   - Option B: Return an empty list `[]` with a logged warning "no real platform miner configured for {platform}" (safer than fake data).
   - Option C: Use the agent's grounded search to find reviews via Gemini Search (medium effort, lower quality than direct platform APIs).
   - **Recommend Option B for immediate fix** (Phase 0), Option A or C for Phase 4.

2. **New endpoint:** `GET /v1/sense/reviews?competitor_id={id}&platform=&sentiment=&limit=` in `app/sense/router.py`:
   - List reviews from `sense.sense_reviews` with filters.
   - Returns: `[{id, competitor_id, platform, review_id, rating, title, body, author, sentiment, response_status, reviewed_at, captured_at}]`.

3. **New endpoint:** `POST /v1/sense/reviews/{id}/reply` — store a reply to a review (sets `response_status='replied'` and stores the reply text in a new `sense.sense_review_replies` table OR in `sense.sense_reviews.metadata`).

#### Frontend changes

| File | Change |
|---|---|
| `src/app/page.tsx` (dashboard) | Replace `reviews` mock with `GET /v1/sense/reviews?competitor_id={self_company_id}&limit=5` (per E4: custom thing for the user — but during the transition, before F1 lands, use the self-row's competitor_id). Wire "Send" reply button to `POST /v1/sense/reviews/{id}/reply`. |
| `src/app/competitors/[id]/page.tsx` (per F13) | Replace `reviews` mock with `GET /v1/sense/reviews?competitor_id={id}&limit=10`. |

#### Implementation order

1. **Phase 0 (immediate):** Replace `stub_platform_miner` with Option B (empty list + warning).
2. Add `GET /v1/sense/reviews` list endpoint.
3. Add `POST /v1/sense/reviews/{id}/reply` endpoint.
4. Update frontend dashboard + competitor-detail page.
5. **Phase 4:** Implement real platform miners (Option A or C).

#### Cross-feature impact

- **F1:** after F1, self-company reviews move to `company.reviews` (separate from `sense.sense_reviews`). The `/` dashboard reads from `GET /v1/company/reviews` for self and `GET /v1/sense/reviews?competitor_id=` for competitors.

---

### Feature F16 — Signals Aggregation Endpoint

| Field | Value |
|---|---|
| **ID** | F16 |
| **Category** | Wiring |
| **Decision ref** | (none — straightforward fix) |
| **Affected modules** | Backend: `competitors/router.py` (new endpoint). Frontend: `/competitors/[id]` (3 line charts). |
| **Complexity** | S |

#### Why

The `/competitors/[id]` page has 3 line charts (Market Share / Engagement / Avg Response Time) using `mockChartData` (10 monthly points). The frontend comment says `// BACKEND: signals.signals aggregated by day (e.g. SELECT date_trunc('day', created_at), sum(score) WHERE competitor_id = ?)`.

#### Backend changes

**New endpoint:** `GET /v1/competitors/{competitor_id}/signals/aggregated?metric=score|volume|engagement&range=1m|3m|6m|1y&granularity=day|week|month` in `app/competitors/router.py`:

```python
# Aggregation logic:
# - metric='score': SELECT date_trunc(:granularity, captured_at), AVG(score) FROM signals.signals WHERE competitor_id = :cid AND captured_at >= :range_start GROUP BY 1
# - metric='volume': SELECT date_trunc(:granularity, captured_at), COUNT(*) FROM signals.signals WHERE competitor_id = :cid AND captured_at >= :range_start GROUP BY 1
# - metric='engagement': join with social.social_post_cache to get AVG(likes + comments + shares) per period
```

Returns: `[{date: "2026-01-01", value: 48.5}, {date: "2026-02-01", value: 52.0}, ...]`.

#### Frontend changes

| File | Change |
|---|---|
| `src/app/competitors/[id]/page.tsx` (per F13) | Replace `mockChartData` with 3 calls to `GET /v1/competitors/{id}/signals/aggregated?metric=score|volume|engagement&range=6m&granularity=month`. Map the 3 charts to the 3 metrics. |

#### Implementation order

1. Add the aggregation endpoint.
2. Update frontend to call it.

#### Cross-feature impact

- **F13:** dependency (the competitor-detail page must exist).

---

### Feature F17 — Settings: Workspace Users + Invites

| Field | Value |
|---|---|
| **ID** | F17 |
| **Category** | Wiring |
| **Decision ref** | Q3 — ignore the entire roles thing for now (keep as-is). E6(b) — display invite URL for copy/paste. |
| **Affected modules** | Frontend: `/settings` page (replace MOCK_USERS, wire invite button). |
| **Complexity** | S |

#### Why

The `/settings` page mocks 3 users and has dead "+ Invite User" + "Send Link" buttons. The backend already has `GET /v1/core/workspaces/{id}/members` and `POST /v1/core/workspaces/{id}/invitations`.

#### Backend changes

None — endpoints already exist.

#### Frontend changes

| File | Change |
|---|---|
| `src/app/settings/page.tsx` | Replace `MOCK_USERS` with `GET /v1/core/workspaces/{id}/members`. Map the response to the table: `name` from `core.core_users.full_name`, `email` from `core.core_users.email`, `role` from `core.core_workspace_members.role`, `status` derived from `accepted_at`/`deleted_at` (per §G of backend inventory: 'removed' if deleted_at IS NOT NULL; 'invited' if accepted_at IS NULL; 'active' otherwise). Drop the "access" column entirely (per Q3: ignore roles expansion). Wire "+ Invite User" button to `POST /v1/core/workspaces/{id}/invitations` with `{email, role: 'member'}`. On success, display the returned invite URL for copy/paste (per E6). |

#### Implementation order

1. Replace `MOCK_USERS` with real API call.
2. Wire "+ Invite User" button.
3. Display invite URL on success.

#### Cross-feature impact

- **F10 (Onboarding):** step 6 also calls the invitations endpoint — the same UI pattern (display URL for copy/paste) should be reused.

---

### Feature F18 — Frontend Dead Buttons & Mocks Cleanup

| Field | Value |
|---|---|
| **ID** | F18 |
| **Category** | Polish |
| **Decision ref** | (none — straightforward fix) |
| **Affected modules** | Frontend: `/` dashboard, `/settings`, `Sidebar.tsx`, `next.config.ts`, `package.json`. |
| **Complexity** | S |

#### Why

Per the frontend exploration §K, there are many dead buttons, dead nav items, hardcoded identity strings, unused dependencies, and dev-laptop leftovers. These don't block functionality but make the product look unfinished.

#### Frontend changes

| File | Change |
|---|---|
| `src/app/page.tsx` (dashboard) | Wire "Apply" button (per F3), "Send" button (per F15), "See More →" links (route to `/opportunities` and `/campaigns` respectively). Replace hardcoded "Vasil S." / "Creator & Founder · Since 2024" with `GET /v1/core/users/me` + `GET /v1/core/workspaces/{id}` (per F7). Unify `brandColor1`/`brandColor2` amber colors with `--accent` orange token. |
| `src/app/settings/page.tsx` | Wire "Password Reset" → "Send Link" button (per F12). Wire notifications toggles to `PATCH /v1/core/users/me` with `{metadata: {notification_preferences: {...}}}` (or defer to a later phase per Q3). |
| `src/components/Sidebar.tsx` | Replace hardcoded "Vasil S." / "vasil@pshift.com" with real user data. Remove or wire "Documentation" + "Integrations" dead anchors (either delete or link to a real docs/integrations page). Add workspace switcher UI (currently absent — user must go back to `/workspaces` to switch). Uncomment or delete the "Boost with AI" / "Upgrade to Pro" card. |
| `src/app/campaigns/page.tsx` | Remove the hardcoded `v0-sidebar` with "analyze this" text (per §K24). |
| `src/app/partnerships/page.tsx` | Remove the hardcoded `v0-sidebar` with "replicate this" text. |
| `next.config.ts` | Remove the `allowedDevOrigins` LAN IPs (`['192.168.1.6', '192.168.1.9', '192.168.1.15', '192.168.1.3']`). |
| `package.json` | Remove unused dependencies: `next-auth`, `cobe`, `@react-three/drei`, `@react-three/fiber`. |
| `src/components/SkeletonOverlay.tsx` | Delete the unused component. |
| `src/app/light-overrides.css` | Incrementally replace inline `color: white` styles with CSS variables so the `!important` overrides can be removed over time. |

#### Implementation order

1. Fix hardcoded user identity (depends on F7).
2. Wire all dead buttons (depends on F3, F12, F15).
3. Remove dev-laptop leftovers + unused dependencies.
4. Sidebar polish (workspace switcher, dead anchors).

#### Cross-feature impact

- Depends on F3, F7, F12, F15 for the button wiring.

---

## Part 3 — Implementation Order (Phased Roadmap)

### Phase 0: Critical Bug Fixes + Doc Cleanup (immediate, ~1 day)

| Task | Feature | Effort |
|---|---|---|
| Fix migration `20260726_07_video_schema_assets.sql` broken FK | §1.3 | S |
| Replace `stub_platform_miner` with empty-list fallback (Option B) | F15 | S |
| Remove or fix `_run_analyze_partnerships` (persist or delete) | §1.6 | S |
| Frontend: fix Google OAuth signup routing (`/workspaces` → `/onboarding`) | F10 | S |
| Frontend: fix onboarding step-6 routing (route to `/workspaces` first) | F10 | S |
| **Doc cleanup: update stale MiniMax→Kimi references** in `MIGRATION_NOTES.md`, `CONTEXT.md` §4, `.env.example`, `gemini_flash_client.py` docstring, `gemini_pro_video.py` docstring, `app/prompts/agent.py` | §1.4, §1.19 | S |
| **Doc cleanup: fix `CONTEXT.md` §3.1** GUC name (`app.current_workspace_id` → `app.tenant_id`) + middleware description | §1.19 | S |
| **Doc cleanup: delete dead `KIMI_API_KEY` env var** from `.env.example` | §1.19 | S |
| **Doc cleanup: fix `oshift-master/README.md`** font claim (Geist → Poppins) | §1.19 | S |
| **Bug fix: `app/sense/trends.py:91-100`** add non-empty `url=` to `RawSignal` | §1.19 | S |

### Phase 1: Foundation (1–2 weeks)

| Task | Feature | Effort |
|---|---|---|
| Self-Company Schema Migration | F1 | XL |
| Competitor columns: founding_year, market_valuation_usd, industry | F13 | S |
| Insights gaps/campaigns endpoint filters | F14 | S |

### Phase 2: Onboarding Persistence (1 week)

| Task | Feature | Effort |
|---|---|---|
| All 6 onboarding steps wired to backend | F10 | L |

### Phase 3: Frontend-Backend Wiring (1 week)

| Task | Feature | Effort |
|---|---|---|
| Dashboard gaps wiring | F14 | S |
| Company/competitor detail page | F13 | M |
| Settings workspace users + invites | F17 | S |
| Auth flows (forgot/update password) | F12 | S |
| Signals aggregation endpoint | F16 | S |
| Sense reviews list endpoint | F15 (partial) | S |

### Phase 4: New Features (2–3 weeks)

| Task | Feature | Effort |
|---|---|---|
| Opportunities Module | F3 | M |
| Campaigns Module (unified) | F4 | L |
| Campaign Blueprints | F5 | M |
| Partnerships Timeline with Event Dates | F6 | M |

### Phase 5: Creator Analytics (2–3 weeks)

| Task | Feature | Effort |
|---|---|---|
| Instagram Graph API integration | F2 | L |
| TikTok Display API integration | F2 | L |
| Monthly rollup + change% computation | F2 | M |
| Dashboard stats + charts wiring | F2 | M |

### Phase 6: Profile & Memory (1 week)

| Task | Feature | Effort |
|---|---|---|
| Profile enhancements (bio, focus areas, markets, objectives) | F7 | M |
| Agent Memory view | F8 | S |
| Chat History icon | F9 | S |

### Phase 7: Polish (1 week)

| Task | Feature | Effort |
|---|---|---|
| Slides (JSON schema + renderer) | F11 | M |
| Frontend dead buttons & mocks cleanup | F18 | S |
| Real review platform miners (G2/Capterra/Trustpilot) | F15 (full) | L |

**Total estimated effort:** 8–12 weeks for a single full-stack developer. Phases 4 and 5 can be parallelized if two developers are available.

---

## Part 4 — Cross-Feature Impact Matrix

| Feature | F1 | F2 | F3 | F4 | F5 | F6 | F7 | F8 | F9 | F10 | F11 | F12 | F13 | F14 | F15 | F16 | F17 | F18 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **F1** Self-Company | — | enables | enables | enables | — | — | enables | enables | — | enables | — | — | — | — | — | — | — | — |
| **F2** Creator Analytics | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | enables |
| **F3** Opportunities | — | — | — | — | — | — | — | — | — | — | — | — | — | enables | — | — | — | enables |
| **F4** Campaigns | enables | — | — | — | enables | — | — | — | — | — | enables | — | enables | — | — | — | — | enables |
| **F5** Blueprints | — | — | — | depends | — | — | — | — | — | — | enables | — | — | — | — | — | — | — |
| **F6** Partnerships Timeline | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| **F7** Profile | depends | — | — | — | — | — | — | enables | — | enables | — | — | — | — | — | — | enables | enables |
| **F8** Agent Memory | depends | — | — | — | — | — | depends | — | — | — | — | — | — | — | — | — | — | — |
| **F9** Chat History | — | — | — | — | — | — | — | — | — | enables | — | — | — | — | — | — | — | — |
| **F10** Onboarding | depends | — | — | — | — | — | depends | — | depends | — | — | — | — | — | — | — | — | — |
| **F11** Slides | — | — | — | depends | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| **F12** Auth Flows | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | enables |
| **F13** Competitor Detail | — | — | — | depends | — | — | — | — | — | — | — | — | — | depends | — | depends | — | — |
| **F14** Insights Filters | — | — | enables | — | — | — | — | — | — | — | — | — | enables | — | — | — | — | — |
| **F15** Reviews | — | — | — | — | — | — | — | — | — | — | — | — | depends | — | — | — | — | enables |
| **F16** Signals Aggregation | — | — | — | — | — | — | — | — | — | — | — | — | depends | — | — | — | — | — |
| **F17** Settings Users | — | — | — | — | — | — | depends | — | — | enables | — | — | — | — | — | — | — | — |
| **F18** Frontend Cleanup | — | enables | enables | enables | — | — | depends | — | — | — | — | depends | — | — | depends | — | — | — |

**Reading the matrix:**
- `depends` = feature in row requires feature in column to be done first.
- `enables` = feature in row makes feature in column possible (but column doesn't strictly require row).
- `—` = no significant dependency.

**Critical path:** F1 → F4 → F5/F11 (slides via campaigns). F1 → F7 → F8/F10. F1 → F2. F1 → F3. F14 → F13. The longest dependency chain is F1 → F4 → F11 (about 5–6 weeks if serial).

---

## Appendix A — Verified Schema Inventory

### Schemas (verified via `app/scripts/verify_rls.py` and migration `20260716_oshift_app_role.sql`)

`core`, `competitors`, `social`, `video`, `sense`, `signals`, `normalizer`, `scoring`, `graph`, `insights`, `brief`, `hermes`, `alerts`, `exports`, `automation`. (15 schemas; the `agent` schema mentioned in some comments does NOT exist — agent tables live in `hermes.hermes_*`.)

**Proposed new schemas** (per this report): `company`, `campaigns`, `opportunities`, `slides`.

### Tables verified by code-level inspection

| Schema | Table | Verified columns (from INSERT/SELECT in code) |
|---|---|---|
| `core` | `core_workspaces` | id, name, slug, timezone, locale, plan, created_by, created_at, deleted_at, metadata (per F7) |
| `core` | `core_users` | id, email, full_name, created_at, bio (per F7), focus_areas (per F7), objectives (per F7) |
| `core` | `core_workspace_members` | id, workspace_id, user_id, role, invited_by, accepted_at, deleted_at, created_at |
| `core` | `core_roles` | id, workspace_id, name |
| `core` | `core_member_roles` | workspace_id, member_id, role_id |
| `core` | `core_invitations` | id, workspace_id, email, token, role, expires_at, invited_by, accepted_at, deleted_at, created_at |
| `core` | `core_api_keys` | id, workspace_id, name, key_hash, key_prefix, user_id, last_used_at, created_at |
| `core` | `core_feature_flags` | workspace_id, flag_name, enabled |
| `core` | `core_change_requests` | cr_id, title, description, schema_name, table_name, status, requested_by, approved_by, approved_at, applied_at, workspace_id |
| `core` | `audit_log` (partitioned monthly) | workspace_id, … (per migration `20260726_01_partition_rls.sql`) |
| `competitors` | `competitors_competitors` | id, workspace_id, name, website, description, is_self, metadata, created_by, created_at, updated_at, deleted_at, founding_year (per F13), market_valuation_usd (per F13), industry (per F13) |
| `competitors` | `competitors_scrape_runs` | id, workspace_id, competitor_id, status, started_at, completed_at, pages_total, pages_ok, pages_failed, created_at |
| `competitors` | `competitors_scrape_pages` | id, workspace_id, run_id, competitor_id, url, page_type, status, created_at |
| `competitors` | `competitors_page_snapshots` | id, workspace_id, competitor_id, url, url_hash, content_hash, text_content, captured_at |
| `social` | `social_accounts` | id, workspace_id, platform, handle, competitor_id, display_name, follower_count, is_active, deleted_at, created_at, updated_at |
| `social` | `social_post_cache` | id, workspace_id, account_id, platform, post_id, content, content_hash, likes, shares, comments, posted_at, captured_at |
| `video` | `video_assets` | id, workspace_id, competitor_id, url, url_hash, title, duration_s, platform, source, captured_at, deleted_at |
| `video` | `video_analyses` | id, workspace_id, asset_id, model, analysis, cost_usd, analyzed_at |
| `video` | `video_cache` | id, workspace_id, url_hash, analysis_hash, analysis, expires_at |
| `sense` | `sense_reviews` | id, workspace_id, competitor_id, platform, review_id, rating, title, body, sentiment, content_hash, reviewed_at, captured_at |
| `sense` | `sense_news_articles` | id, workspace_id, competitor_id, title, summary, content_hash, grounding_urls, source_name, published_at, captured_at |
| `sense` | `sense_trends_snapshots` | id, workspace_id, keyword, trend_data, captured_at |
| `signals` | `signals` (partitioned monthly) | id, workspace_id, source, url, title, content, content_hash, competitor_id, media_analysis, captured_at, score, score_reasoning, score_version, embedding, embedding_model, deleted_at, updated_at |
| `signals` | `signals_dedup` | workspace_id, source, content_hash, signal_id |
| `normalizer` | `normalizer_runs` | id, workspace_id, source, status, started_at, completed_at, signals_in, signals_ok, signals_rejected |
| `normalizer` | `normalizer_rejections` | id, workspace_id, run_id, source, rejection_reason, raw_payload, rejected_at |
| `scoring` | `scoring_prompts` | id, version, body, model, temperature, is_active, created_at, created_by |
| `scoring` | `scoring_runs` | id, workspace_id, prompt_version, status, started_at, completed_at, signals_scored |
| `scoring` | `scoring_batches` | id, workspace_id, run_id, signal_id, score, reasoning, scored_at, created_at |
| `scoring` | `scoring_factors` | workspace_id, batch_id, factor_name, factor_score, weight |
| `scoring` | `scoring_thresholds` | workspace_id, threshold_name, min_score, is_active |
| `graph` | `graph_entities` | id, workspace_id, name, entity_type, metadata, created_at, updated_at, deleted_at |
| `graph` | `graph_relationships` | id, workspace_id, source_id, target_id, rel_type, metadata, weight, created_at, updated_at, deleted_at, announced_at (per F6), date_source (per F6) |
| `graph` | `graph_citations` | id, workspace_id, entity_id, signal_id, citation_url, claim_text, created_at |
| `graph` | `graph_entity_positions` | id, workspace_id, entity_id, field, valid_period, value |
| `graph` | `graph_corrections` | id, workspace_id, entity_id (nullable), field, old_value, new_value, reason, corrected_by, correction_type, applied_at, created_at |
| `graph` | `graph_battlecards` | id, workspace_id, competitor_id, title, current_version, created_at, updated_at, deleted_at |
| `graph` | `graph_battlecard_versions` | battlecard_id, version, content, model, prompt_version, created_at |
| `insights` | `insights_gaps` | id, workspace_id, competitor_id, layer, title, description, confidence, detected_at, metadata, created_at, updated_at, deleted_at |
| `insights` | `insights_signal_links` | id, workspace_id, insight_type, insight_id, signal_id, created_at |
| `insights` | `insights_crises` | id, workspace_id, competitor_id, severity, title, description, detected_at, resolved_at |
| `insights` | `insights_deals` | id, workspace_id, competitor_id, deal_type, description, deal_value_usd, announced_at, detected_at |
| `insights` | `insights_neg_comment_clusters` | id, workspace_id, competitor_id, theme, comment_count, severity, first_seen_at, last_seen_at |
| `insights` | `insights_trend_psychology` | id, workspace_id, keyword, psych_frame, description, captured_at |
| `brief` | `briefs` | id, workspace_id, week_start, current_version, status, created_at, updated_at |
| `brief` | `brief_versions` | brief_id, version, what_happened, what_matters, what_to_do, model, prompt_version, created_at |
| `brief` | `brief_citations` | id, workspace_id, brief_id, version, claim_text, citation_url, signal_id, position, created_at |
| `brief` | `brief_prior_refs` | workspace_id, brief_id, prior_brief_id, ref_type |
| `hermes` | `hermes_conversations` | id, workspace_id, user_id, title, model, created_at, updated_at, deleted_at |
| `hermes` | `hermes_messages` (partitioned monthly) | id, workspace_id, conversation_id, role, content, token_count, created_at |
| `hermes` | `hermes_tool_calls` | id, workspace_id, message_id, tool_name, arguments, result, error, duration_ms, created_at |
| `hermes` | `hermes_retrievals` | id, workspace_id, message_id, signal_id, query_text, distance, rank, created_at |
| `hermes` | `hermes_prompt_injections` | id, workspace_id, message_id, detected_pattern, raw_content, detected_at |
| `hermes` | `hermes_feedback` | id, workspace_id, message_id, rating, comment, created_by, created_at |
| `alerts` | `alert_rules` | id, workspace_id, name, rule_type, conditions, severity, is_active, created_at |
| `alerts` | `alerts` | id, workspace_id, rule_id, severity, title, body, metadata, triggered_at |
| `alerts` | `alert_acks` | id, workspace_id, alert_id, acknowledged_by, note, acknowledged_at |
| `alerts` | `alert_deliveries` | id, workspace_id, alert_id, channel, status, created_at |
| `exports` | `export_destinations` | id, workspace_id, destination_type, name, config, deleted_at, created_at |
| `exports` | `export_jobs` | id, workspace_id, destination_id, job_type, payload, idempotency_key, status, attempts, error, started_at, completed_at |
| `exports` | `export_log` (partitioned monthly) | id, workspace_id, job_id, event, metadata, created_at |
| `automation` | `automation_runs` | id, workspace_id, status, instance_id, started_at, completed_at, error |
| `automation` | `automation_workflow_instances` | id, workspace_id, workflow_type, status, started_at, completed_at |
| `automation` | `automation_workflow_history` | id, workspace_id, instance_id, event, metadata, created_at |
| `automation` | `automation_step_results` | id, workspace_id, run_id, step_name, status, duration_ms, error, created_at |
| `automation` | `automation_schedules` | id, workspace_id, name, cron_expr, workflow_type, is_active, last_run_at, next_run_at, created_by, created_at, updated_at |

**Note:** The above columns are inferred from SQL statements in the application code (SELECT/INSERT/UPDATE column lists) and from the 19 migration files in the repo. The actual DDL for most tables lives on Supabase Cloud and was not directly verified. Direct DDL verification requires Supabase Cloud access.

---

## Appendix B — Verified Endpoint Inventory

### Root-level endpoints (no `/v1` prefix)

| Method | Path | Purpose |
|---|---|---|
| GET | `/healthz` | Liveness probe |
| GET | `/readyz` | Readiness probe (checks DB connectivity) |
| POST | `/api/inngest` | Inngest webhook |
| GET | `/docs`, `/redoc`, `/openapi.json` | OpenAPI/Swagger UI |

### `core` module (`/v1/core`)

| Method | Path | Purpose |
|---|---|---|
| POST | `/core/workspaces` | Create a workspace |
| GET | `/core/workspaces` | List workspaces for current user |
| GET | `/core/workspaces/{workspace_id}` | Get one workspace |
| GET | `/core/workspaces/{workspace_id}/members` | List members |
| DELETE | `/core/workspaces/{workspace_id}/members/{member_id}` | Remove a member |
| POST | `/core/workspaces/{workspace_id}/invitations` | Create an invitation |
| GET | `/core/workspaces/{workspace_id}/invitations` | List invitations |
| POST | `/core/invitations/{token}/accept` | Accept invitation |
| POST | `/core/workspaces/{workspace_id}/api-keys` | Create API key |
| GET | `/core/workspaces/{workspace_id}/api-keys` | List API keys |
| DELETE | `/core/workspaces/{workspace_id}/api-keys/{key_id}` | Revoke an API key |
| GET | `/core/workspaces/{workspace_id}/feature-flags` | List feature flags |
| PATCH | `/core/workspaces/{workspace_id}/feature-flags/{name}` | Upsert a feature flag |

**New endpoints proposed in this report:** `GET /core/users/me`, `PATCH /core/users/me`, `PATCH /core/workspaces/{id}` (admin-only metadata update).

### `competitors` module (`/v1/competitors`)

| Method | Path | Purpose |
|---|---|---|
| POST | `/competitors` | Create a competitor |
| GET | `/competitors` | List competitors |
| DELETE | `/competitors/{competitor_id}` | Soft-delete a competitor |
| POST | `/competitors/{competitor_id}/scrape` | Trigger an immediate scrape |
| GET | `/competitors/{competitor_id}/signals` | List recent page snapshots |

**New endpoints proposed:** `GET /competitors/{id}` (single), `GET /competitors/{id}/signals/aggregated`, `POST /competitors/batch`, `POST /competitors/{id}/blueprint` (or under `/campaigns/`).

### `social` module (`/v1/social`)

| Method | Path | Purpose |
|---|---|---|
| POST | `/social/accounts` | Create a social account |
| GET | `/social/accounts` | List accounts |
| PATCH | `/social/accounts/{account_id}` | Update |
| DELETE | `/social/accounts/{account_id}` | Soft-delete |
| GET | `/social/posts` | List cached posts |
| DELETE | `/social/posts/{post_id}` | Delete a cached post |
| POST | `/social/collect` | Collect posts for ALL active accounts |
| POST | `/social/collect/{competitor_id}` | Collect posts for one competitor |

### `video` module (`/v1/video`)

| Method | Path | Purpose |
|---|---|---|
| POST | `/video/assets` | Register a video URL |
| POST | `/video/collect` | Analyse a video |
| POST | `/video/download` | Download a video |
| POST | `/video/analyze-path` | Analyse a local file |
| GET | `/video/assets` | List last 50 |
| GET | `/video/assets/{asset_id}` | Get one |

### `sense` module (`/v1/sense`)

| Method | Path | Purpose |
|---|---|---|
| POST | `/sense/trends/collect` | Google Trends via pytrends (broken on urllib3 ≥ 2.0) |
| POST | `/sense/news/collect` | Gemini-grounded news brief |
| POST | `/sense/reviews/collect` | Reviews via stub_platform_miner + Gemini sentiment |

**New endpoints proposed:** `GET /sense/reviews` (list with filters), `POST /sense/reviews/{id}/reply`.

### `normalizer` module (`/v1/normalizer`) — observability endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/normalizer/runs` | List normalizer runs |
| GET | `/normalizer/runs/{run_id}` | Get one run |
| GET | `/normalizer/rejections` | List rejections |

### `scoring` module

| Method | Path | Purpose |
|---|---|---|
| POST | `/scoring/runs` | Trigger a scoring run |
| GET | `/scoring/runs` | List scoring runs |
| GET | `/scoring/runs/{run_id}` | Get one run |
| GET | `/scoring/thresholds` | List scoring thresholds |
| PUT | `/scoring/thresholds/{threshold_name}` | Upsert a threshold (admin) |
| GET | `/signals` | List feed signals ≥ feed-threshold |
| GET | `/signals/{signal_id}` | Get one scored signal |

### `graph` module (`/v1/graph`)

| Method | Path | Purpose |
|---|---|---|
| GET | `/graph/entities` | List entities |
| GET | `/graph/entities/{entity_id}` | Get one entity + citations + positions |
| GET | `/graph/partnerships` | Partnership network (nodes + edges) |
| POST | `/graph/corrections` | File a correction (append-only) |
| GET | `/graph/corrections` | List corrections |
| GET | `/graph/battlecards` | List battlecards |
| GET | `/graph/battlecards/{battlecard_id}` | Get one battlecard |
| POST | `/graph/battlecards/{battlecard_id}/regenerate` | Regenerate battlecard |

### `insights` module (`/v1/insights`)

| Method | Path | Purpose |
|---|---|---|
| GET | `/insights/gaps` | List gaps (no `competitor_id`/`layer` filter today — F14 adds them) |
| GET | `/insights/crises` | List crises |
| GET | `/insights/deals` | List deals |
| GET | `/insights/neg-comments` | List neg-comment clusters |
| GET | `/insights/trends` | List trend-psychology |
| GET | `/insights/campaigns` | Campaigns grouped by competitor (deprecated by F4) |
| POST | `/insights/run` | Run all 5 (or subset via `?engines=`) |

### `brief` module (`/v1/briefs`)

| Method | Path | Purpose |
|---|---|---|
| GET | `/briefs` | List briefs |
| GET | `/briefs/current` | Most recent brief's current version |
| GET | `/briefs/{brief_id}` | One brief's current version |
| GET | `/briefs/{brief_id}/citations` | List citations with joined signal content |
| POST | `/briefs/generate` | Generate (or regenerate) the weekly brief |

### `hermes` module (`/v1/hermes`)

| Method | Path | Purpose |
|---|---|---|
| POST | `/hermes/conversations` | Create conversation |
| GET | `/hermes/conversations` | List conversations (per user) |
| GET | `/hermes/conversations/{conv_id}` | Get one conversation |
| POST | `/hermes/conversations/{conv_id}/messages` | SSE-streamed chat reply (RAG + tool calls) |
| POST | `/hermes/messages/{message_id}/feedback` | Submit 1-5 star feedback |

### `agent` module (`/v1/agent`)

| Method | Path | Purpose |
|---|---|---|
| POST | `/agent/chat` | SSE-streamed agent chat (auto-creates conversation) |
| POST | `/agent/conversations` | Create an `[Agent]` conversation |
| GET | `/agent/conversations` | List agent conversations |
| GET | `/agent/conversations/{conversation_id}` | Get one + message history |

**New endpoints proposed:** `POST /agent/conversations/{id}/messages` (per E7), `GET /agent/memory` (per F8).

### `alerts` module

| Method | Path | Purpose |
|---|---|---|
| POST | `/alert-rules` | Create rule (admin) |
| GET | `/alert-rules` | List rules |
| PUT | `/alert-rules/{rule_id}` | Update rule (admin) |
| DELETE | `/alert-rules/{rule_id}` | Disable rule (admin) |
| GET | `/alerts` | List alerts (paginated) |
| POST | `/alerts/{alert_id}/ack` | Acknowledge alert (member) |

### `exports` module (`/v1/exports`)

| Method | Path | Purpose |
|---|---|---|
| POST | `/exports/destinations` | Create destination (admin) |
| GET | `/exports/destinations` | List destinations |
| POST | `/exports/slack` | Post brief to Slack (idempotent) |
| GET | `/exports/jobs` | List jobs |
| GET | `/exports/log` | List log entries (requires `?month=YYYY-MM`) |

### `automation` module (`/v1/automation`)

| Method | Path | Purpose |
|---|---|---|
| POST | `/automation/trigger` | Manually trigger pipeline (owner) |
| GET | `/automation/runs` | List pipeline runs |
| GET | `/automation/runs/{run_id}/steps` | Per-step timing |
| GET | `/automation/schedules` | List schedules |
| POST | `/automation/schedules` | Create cron schedule (owner) |
| PUT | `/automation/schedules/{schedule_id}` | Update schedule (owner) |

### Proposed new modules

| Module | Path prefix | Purpose |
|---|---|---|
| `company` | `/v1/company` | User's own company profile, analytics, reviews, social accounts |
| `campaigns` | `/v1/campaigns` | Unified campaigns (self + competitor) + blueprints |
| `opportunities` | `/v1/opportunities` | First-class opportunities table |
| `slides` | `/v1/slides` | Slide decks (JSON schema) |

---

## Appendix C — Verified Agent Tools (54)

Source: `backend/app/agent/tools/__init__.py:93-153`. Categorized with file location and one-line description.

### Onboarding & self-profile (5)

| Tool | File:Line | Description |
|---|---|---|
| `save_onboarding_data` | onboarding.py:20 | Save the user's onboarding data (company name, website, industry, social handles, ICP, target customer). Creates or updates the self-profile competitor row (is_self=true). |
| `ask_user_question` | onboarding.py:115 | Ask the user a clarifying question. PAUSES the agent loop. |
| `scrape_user_company` | self_study.py:24 | Scrape the user's company website to gather information for the self-profile. |
| `build_self_profile` | self_study.py:67 | Build a structured self-profile from onboarding data + scraped content. Calls Gemini. |
| `update_self_profile` | self_study.py:167 | Update the self-profile with additional information. Shallow merge. |

### Competitor discovery (10)

| Tool | File:Line | Description |
|---|---|---|
| `discover_competitors` | discovery.py:24 | Discover competitor candidates using AI-powered search. Call PROACTIVELY after onboarding. |
| `register_competitor` | discovery.py:132 | Register a new competitor in the workspace. |
| `list_competitors` | discovery.py:418 | List registered competitors. |
| `update_competitor` | discovery.py:238 | Update competitor details. |
| `remove_competitor` | discovery.py:505 | Soft-delete a competitor. |
| `discover_social_links` | discovery.py:601 | Scrape competitor website for social links. |
| `extract_competitor_products` | discovery.py:638 | Scrape competitor site for products. |
| `extract_all_competitor_products` | discovery.py:802 | Batch-extract products for ALL competitors. |
| `suggest_handles` | discovery.py:938 | Suggest social handles from name+website. |
| `run_single_competitor_analysis` | discovery.py:985 | Full analysis on one competitor. |

### Analysis pipeline (2)

| Tool | File:Line | Description |
|---|---|---|
| `run_full_pipeline` | analysis.py:19 | Trigger Inngest pipeline. |
| `refresh_competitor` | analysis.py:94 | Refresh data for one competitor. |

### Feedback / insights / corrections (9)

| Tool | File:Line | Description |
|---|---|---|
| `persist_feedback` | feedback.py:20 | Persist user feedback as a correction row. |
| `edit_insight` | feedback.py:133 | Edit an existing insight (writes correction; original NOT modified). |
| `list_corrections` | feedback.py:241 | List recent corrections. |
| `clear_corrections` | feedback.py:330 | Clear all corrections. |
| `remove_correction` | feedback.py:285 | Remove a specific correction. |
| `store_insight` | feedback.py:381 | Manually store an Analysis/Gap/Opportunity row. |
| `update_insight_in_place` | feedback.py:481 | Directly update insight fields. |
| `remove_insight` | feedback.py:587 | Soft-delete an insight. |
| `list_insights` | feedback.py:646 | List stored Analysis/Gaps/Opportunities. |

### Retrieval / read (4)

| Tool | File:Line | Description |
|---|---|---|
| `search_signals` | retrieval.py:19 | Search the signal feed. |
| `get_brief` | retrieval.py:105 | Get latest weekly brief. |
| `get_battlecard` | retrieval.py:153 | Get battlecard for a competitor. |
| `query_relationship_graph` | retrieval.py:209 | Query relationship graph (media-buyer view). |

### Automation / scheduling (4)

| Tool | File:Line | Description |
|---|---|---|
| `list_schedules` | automation.py:18 | List automation schedules. |
| `create_schedule` | automation.py:54 | Create cron schedule. |
| `update_schedule` | automation.py:124 | Update schedule. |
| `delete_schedule` | automation.py:210 | Delete schedule. |

### Partnership graph (5)

| Tool | File:Line | Description |
|---|---|---|
| `discover_partnerships` | partnerships.py:53 | Discover partnerships via grounded web search (SEC EDGAR + USPTO + GDELT + Social + optional NewsAPI/Crunchbase/Owler). |
| `query_partnership_graph` | partnerships.py:364 | Query partnership graph (nodes + edges). |
| `add_partnership` | partnerships.py:550 | Manually add a partnership. |
| `update_partnership` | partnerships.py:654 | Update partnership. |
| `remove_partnership` | partnerships.py:773 | Soft-delete partnership. |

### Market view (2)

| Tool | File:Line | Description |
|---|---|---|
| `analyze_market_position` | market.py:35 | Analyze user's company position in market. |
| `get_competitor_insights` | market.py:308 | Structured insights summary for one competitor. |

### Social media pipeline (8)

| Tool | File:Line | Description |
|---|---|---|
| `discover_social_profiles` | social.py:342 | Discover social profiles across IG/TikTok/X/YouTube. |
| `list_social_accounts` | social.py:659 | List social accounts. |
| `add_social_account` | social.py:739 | Manually register a social account. |
| `update_social_account` | social.py:864 | Update social account. |
| `remove_social_account` | social.py:1028 | Soft-delete social account. |
| `collect_social_posts` | social.py:1126 | Trigger collection of recent posts. |
| `list_social_posts` | social.py:1214 | List cached posts. |
| `remove_social_post` | social.py:1308 | Remove cached post + signal. |

### Video analysis pipeline (5)

| Tool | File:Line | Description |
|---|---|---|
| `collect_video` | video.py:143 | Download + Gemini-analyse a video URL. |
| `download_video` | video.py:232 | Download a video to local file. |
| `analyze_video_path` | video.py:282 | Analyse local file or direct URL. |
| `list_video_assets` | video.py:392 | List video assets. |
| `get_video_analysis` | video.py:471 | Get latest analysis for an asset. |

---

## Appendix D — Verified Pipeline `is_self` Filter Matrix

| Pipeline Step | File:Line | `is_self` filter | Behavior | F1 Migration Action |
|---|---|---|---|---|
| `_run_social` (legacy 15-step) | `collectors.py:53-66` | **NONE** | Includes self + non-self accounts | After F1: self accounts live in `company.social_accounts`; this step's `_load_accounts` query needs a UNION with `company.social_accounts` (or split into two steps) |
| `_run_ads` | `agent_steps.py:54-69` | `= false` | Skips self | Remove filter (competitors table no longer has self rows) |
| `_run_campaigns` | `agent_steps.py:117-131` | `= false` | Skips self | Remove filter; add separate `_run_company_campaigns` step that runs CampaignsEngine on `company.social_post_cache` |
| `_run_relationships` | `agent_steps.py:162-176` | `= false` | Skips self | Remove filter |
| `_run_sense` (reviews/trends/news) | `collectors.py:218-233` | `= false` | Skips self | Remove filter; add separate `_run_company_sense` step that collects reviews for `company.companies` |
| `_run_video` | `collectors.py:69-199` | **NONE** | Includes both | After F1: self-company videos come from `company.social_post_cache` (not `competitors.*`); needs explicit branching |
| `_run_web` (= _run_competitors) | `collectors.py:12-50` | **NONE** | Includes both | After F1: self-company website scraping should go through `scrape_user_company` agent tool (already exists); this step can ignore self |
| `crawl-own-posts` | `crawlers_pipeline.py:23-26` | `= true` | Only self | Change to read from `company.social_accounts` |
| `crawl-competitor-posts` | `crawlers_pipeline.py:41-44` | `= false` | Skips self | Remove filter |
| `crawl-partnerships` | `crawlers_pipeline.py:72-75` | **NONE** | Includes both | After F1: partnerships for self-company are still meaningful (the user's company partners with others); keep the no-filter behavior |
| `analyze-partnerships` | `analyzers_pipeline.py:35-38` | **NONE** | Operates on signals | No change needed (operates on signals, not competitors) |
| `GET /v1/insights/campaigns` | `insights/router.py:251` | `= false` | Skips self | Remove filter (deprecated by F4 anyway — campaigns move to `campaigns.campaigns` with `owner_type`) |

---

## Appendix E — Verified SSE Event Shapes

### `/v1/agent/chat` (verified in `app/agent/orchestrator.py`)

| Event type | JSON shape | When emitted |
|---|---|---|
| `ping` | `{"type":"ping"}` | Heartbeat, every 15s |
| `token` | `{"type":"token","content":"..."}` | **Entire response in ONE event** (not chunked) |
| `tool_call` | `{"type":"tool_call","tool":"<name>","args":{...}}` | Before each tool execution |
| `tool_result` | `{"type":"tool_result","tool":"<name>","result":{...}}` | After each tool execution |
| `question` | `{"type":"question","content":"...","message_id":"..."}` | When `ask_user_question` tool is called |
| `done` | `{"type":"done","message_id":"..."}` | Stream complete |
| `error` | `{"type":"error","content":"..."}` | On any error |

**Conversation ID:** Exposed only via `X-Conversation-Id` HTTP response header (`agent/router.py:122`), NOT as an SSE event.

### `/v1/hermes/conversations/{id}/messages` (verified in `app/hermes/router.py:433-539`)

| Event type | JSON shape | When emitted |
|---|---|---|
| `token` | `{"type":"token","content":"<chunk>"}` | **Per-chunk streaming** (true token-by-token) |
| `error` | `{"type":"error","content":"..."}` | On any error |
| `done` | `{"type":"done","message_id":"<uuid>","token_count":N,"first_token_ms":N}` | Stream complete |

**Conversation ID:** Exposed only via `X-Conversation-Id` HTTP response header, NOT as an SSE event.

**Hermes does NOT emit `tool_call`/`tool_result` events.** Tools run silently post-stream (`hermes/router.py:386-430`).

### Frontend's expected events (verified in `src/components/PromptField.tsx` + `src/lib/api.ts`)

The frontend's `sseStream` helper yields:
- A synthetic `conversation_id` event from the `X-Conversation-Id` HTTP header (works correctly for both endpoints).
- Each SSE event's `type` field is read; the frontend listens for: `conversation_id`, `tool_call`, `tool_result`, `error`.
- For all other events, the frontend tries to extract text from: `data.content | data.text | data.delta | data.chunk | data.message | data.message.content | data.delta.content`.

**Discrepancies:**
1. The agent's `token` event carries the ENTIRE response in one shot. The frontend's broad extraction list picks up `data.content` correctly, but the user sees no progressive typing indicator from the agent.
2. Hermes's `token` event is per-chunk — progressive typing works.
3. The event types `delta`, `chunk`, `message`, `message.content`, `delta.content` are NEVER emitted by either endpoint — they are speculative frontend code.
4. The agent emits `question` events — the frontend doesn't explicitly handle these; they fall through to the generic text path (may render as a chat bubble when they should be a modal prompt).

### Recommended canonical SSE format (per E7)

For the new `POST /v1/agent/conversations/{id}/messages` endpoint (F9), keep the agent's existing 7-event format. The frontend should:
1. Remove the dead `delta`/`chunk`/`message`/`message.content`/`delta.content` extraction branches.
2. Add explicit handling for `question` events (render as a modal or highlighted chat bubble).
3. Accept that `token` events carry the whole response (no progressive typing from the agent) OR extend the agent to stream per-chunk (separate task).

---

## Appendix F — Frontend Page Status Summary

| Route | Real API calls | Status | Wired by |
|---|---|---|---|
| `/login` | Supabase Auth only | OK | — |
| `/signup` | Supabase Auth only | OK (fix Google OAuth routing) | F10 |
| `/forgot-password` | NONE (stubbed) | Broken | F12 |
| `/update-password` | NONE (stubbed) | Broken | F12 |
| `/auth/callback` | Supabase Auth only | OK | — |
| `/auth/auth-code-error` | NONE | OK | — |
| `/onboarding` (step 1) | NONE | Broken (no persistence) | F10 |
| `/onboarding/step-2` | NONE | Broken (no persistence) | F10 |
| `/onboarding/step-3` | NONE | Broken (no persistence) | F10 |
| `/onboarding/step-4` | NONE | Broken (no persistence) | F10 |
| `/onboarding/step-5` | NONE (mocked Hermes reply) | Broken | F10 |
| `/onboarding/step-6` | NONE (broken routing) | Broken | F10 |
| `/workspaces` | GET/POST `/v1/core/workspaces` | OK | — |
| `/` (dashboard) | NONE (100% mocked) | Broken | F2, F3, F7, F14, F15, F18 |
| `/profile` | NONE (100% mocked) | Broken | F1, F7, F8 |
| `/settings` | NONE (100% mocked) | Broken | F8, F12, F17, F18 |
| `/opportunities` | NONE (100% mocked) | Broken | F3 |
| `/partnerships` | GET `/v1/graph/partnerships` + GET `/v1/competitors` | OK (timeline needs F6) | F6 |
| `/competitors` | GET/POST/DELETE `/v1/competitors` | OK | — |
| `/company/[domain]` | NONE (100% mocked, Lorem ipsum) | Broken | F13 (rename to `/competitors/[id]`) |
| `/campaigns` | NONE (27 mock items) | Broken | F4 |
| `/campaigns/[id]` | NONE (Empee Mushrooms demo) | Broken | F4, F5, F11 |
| `/not-found` | NONE (chess game) | OK | — |

**Pages that work today:** 5 of 22 (`/login`, `/signup`, `/auth/callback`, `/workspaces`, `/competitors`, `/partnerships` partial, `/not-found`).

**Pages that need work:** 17 of 22.

---

## Document End

This report (v1.1) was generated by Super Z (AI Assistant) on 2026-07-24. It is grounded in direct reads of:
- All 19 SQL migration files in `OShift-main/supabase/migrations/`
- All 22 source files in `oshift-master/src/app/` (production frontend pages)
- All 15 router/service files in `OShift-main/backend/app/*/` (backend modules)
- All 10 agent tool files in `OShift-main/backend/app/agent/tools/`
- The backend `MIGRATION_NOTES.md` and `CONTEXT.md` (treated as documentation hints, NOT as ground truth — see §1.19)
- The frontend `AGENTS.md`, `CLAUDE.md`, `context.md`, `README.md` (treated as documentation hints, NOT as ground truth)
- The user's `Features_probably_missing.txt`
- The user's confirmed scope decisions over 4 conversation turns (A1-A3, B1-B7, C, D1-D5, E1-E7, Q1-Q5, Tier 2 assumptions, and the model-identity correction that triggered §1.19)

**v1.1 changelog:** Corrected §1.4 (the agent is Kimi K2.6, not MiniMax-M2.7 — the markdown docs were stale). Added §1.19 stale-documentation audit. Added 5 new Phase 0 doc-cleanup tasks. All other content from v1.0 stands.

All file:line references in this report were verified against the actual source code (not against markdown documentation). Any subsequent code changes should re-verify the references before relying on them.
