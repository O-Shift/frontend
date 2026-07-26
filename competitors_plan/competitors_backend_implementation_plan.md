# Competitors Module Backend Implementation Plan

| Attribute | Value |
|---|---|
| **Goal** | Implement backend changes for the **Competitors Module** to seamlessly integrate with the updated Cloud Database schema without executing or altering database migrations. |
| **Scope** | **Backend Only** (`backend/app/`, `backend/tests/`). Database DDL editing and Frontend code are strictly out of scope. |
| **Grounding** | Verified against Cloud Supabase DB (`rxlptnkglfmhggdqmsdt`) and backend source files. |

---

## 1. Goal Description

The database schema on Supabase Cloud has been updated with:
1. `company` schema (`company.companies`, `company.social_accounts`, `company.social_post_cache`, `company.analytics_snapshots`, `company.reviews`, `company.api_credentials`).
2. `competitors.competitors_competitors` columns: `founding_year`, `market_valuation_usd`, `industry`.

The backend must be updated to interact seamlessly with this schema. Specifically for the **Competitors** module:
- Update all backend queries to fetch external competitors from `competitors.competitors_competitors` (without relying on `is_self=true`) and route user self-company operations to `company.companies`.
- Add single competitor retrieval, batch competitor creation, and signal metric aggregation endpoints (`GET /v1/competitors/{id}`, `POST /v1/competitors/batch`, `GET /v1/competitors/{id}/signals/aggregated`).
- Extend insights endpoints (`GET /v1/insights/gaps`, etc.) to support `competitor_id` and `layer` query filtering.
- Implement `campaigns` backend module for competitor-scoped campaigns (`GET /v1/campaigns`).
- Remove fake stubbed data from `ReviewsCollector` in `sense/reviews.py` and expose `GET /v1/sense/reviews?competitor_id={id}`.
- Refactor agent tools (`discovery.py`, `self_study.py`, `social.py`, `video.py`, `market.py`, `partnership_sources.py`) to align with the new schema fields and isolation logic.
- Update unit and integration tests.

---

## 2. User Review Required

> [!IMPORTANT]
> **Database Protection**: No database migrations or DDL statements will be executed. All changes are 100% limited to Python code in `backend/app/` and `backend/tests/`.

> [!NOTE]
> **Cloud DB Schema Verification**: Verification via Supabase MCP confirms that `company.companies` and the extended `competitors_competitors` columns (`founding_year`, `market_valuation_usd`, `industry`) already exist on Supabase Cloud (`rxlptnkglfmhggdqmsdt`).

---

## 3. Open Questions

None. The scope, constraints, and target schema structure have been verified against the cloud database.

---

## 4. Proposed Changes

### Component 1: Competitors Endpoints & Schemas (`backend/app/competitors/`)

#### [MODIFY] `backend/app/competitors/schemas.py`
- Add `founding_year: int | None`, `market_valuation_usd: float | None`, `industry: str | None`, and `metadata: dict[str, Any]` to `CompetitorResponse`.
- Add `CompetitorBatchCreate` (list of `CompetitorCreate`) and `CompetitorBatchResponse`.
- Add `AggregatedMetricPoint` (`timestamp: datetime`, `value: float | int`) and `AggregatedMetricsResponse`.

#### [MODIFY] `backend/app/competitors/router.py`
- Update `GET /v1/competitors` and `POST /v1/competitors` queries to SELECT/INSERT the new metadata columns (`founding_year`, `market_valuation_usd`, `industry`, `metadata`).
- **[NEW Endpoint]** `GET /v1/competitors/{competitor_id}`: Fetch single competitor metadata by UUID for workspace.
- **[NEW Endpoint]** `POST /v1/competitors/batch`: Bulk insert competitors, seed initial scrape runs/pages, and kick off background scrapers.
- **[NEW Endpoint]** `GET /v1/competitors/{competitor_id}/signals/aggregated`: Aggregates signals using `date_trunc()` on `signals.signals` by `metric` (`score` | `volume` | `engagement`), `range` (`1m` | `3m` | `6m` | `1y`), and `granularity` (`day` | `week` | `month`).

---

### Component 2: Self-Company & Competitor Schema Isolation (`backend/app/agent/`, `backend/app/automation/`, `backend/app/social/`, `backend/app/graph/`)

#### [MODIFY] `backend/app/agent/tools/onboarding.py`
- Update `save_onboarding_data` to save self profile into `company.companies` instead of inserting `competitors.competitors_competitors` with `is_self=true`.

#### [MODIFY] `backend/app/agent/tools/self_study.py`
- Update `scrape_user_company`, `build_self_profile`, and `update_self_profile` tools to target `company.companies`.
- Implement deep-merge logic for nested metadata updates.

#### [MODIFY] `backend/app/agent/tools/discovery.py`
- Update `register_competitor` to insert `founding_year`, `market_valuation_usd`, and `industry`.
- Update `list_competitors` to include new metadata fields and remove `is_self` checks.
- Add `start_competitor_scrape` agent tool.

#### [MODIFY] `backend/app/agent/tools/market.py`
- Update `analyze_market_position` self-profile queries to target `company.companies` and competitor queries to target `competitors.competitors_competitors`.

#### [MODIFY] `backend/app/agent/tools/social.py`, `video.py`, `partnership_sources.py`
- Align social, video, and partnership tool queries to check `company.companies` for self company and `competitors.competitors_competitors` for external competitors.

#### [MODIFY] `backend/app/agent/memory.py`
- Update `load_context` to fetch self profile from `company.companies` and competitor count from `competitors.competitors_competitors`.

#### [MODIFY] `backend/app/automation/functions/agent_steps.py`, `collectors.py`, `crawlers_pipeline.py`
- Remove `WHERE is_self = false` filters from pipeline steps (`_run_ads`, `_run_campaigns`, `_run_relationships`, `_run_sense`).
- Update `crawl-own-posts` to fetch from `company.social_accounts` and `crawl-competitor-posts` to fetch from `social.social_accounts`.

#### [MODIFY] `backend/app/graph/relationships.py`
- Update `_query_workspace_graph()` to remove `c.is_self` references and query external competitors cleanly.

---

### Component 3: Insights & Filtering (`backend/app/insights/`)

#### [MODIFY] `backend/app/insights/router.py`
- Refactor `_make_list_endpoint` to accept `competitor_id: UUID | None = Query(None)` and `layer: str | None = Query(None)` and append `AND g.competitor_id = :cid` / `AND g.layer = :layer` dynamically.
- Remove `AND is_self = false` filter from `list_campaigns` in `insights/router.py`.

---

### Component 4: Campaigns Backend Module (`backend/app/campaigns/`)

#### [NEW] `backend/app/campaigns/schemas.py`
- Create Pydantic models: `CampaignResponse`, `CampaignCreate`, `CampaignUpdate`.

#### [NEW] `backend/app/campaigns/router.py`
- Implement `GET /v1/campaigns` supporting `owner_type: str = Query("competitor")` and `competitor_id: UUID | None = Query(None)`.

#### [MODIFY] `backend/app/router.py`
- Import and register `campaigns.router` into `root_router`.

---

### Component 5: Sense Reviews Bug Fix & Listing Endpoint (`backend/app/sense/`)

#### [MODIFY] `backend/app/sense/reviews.py`
- Replace `stub_platform_miner` canned fake reviews with an empty fallback list (`return []`) and log a warning if no real miner is provided.

#### [MODIFY] `backend/app/sense/router.py`
- Add `GET /v1/sense/reviews` listing reviews from `sense.sense_reviews` filtered by `competitor_id` and workspace.

---

### Component 6: Verification & Test Alignment (`backend/tests/`)

#### [MODIFY] `backend/tests/unit/test_agent_tools.py`
- Update mock expectations and test assertions for double-prefix schema and `is_self` removal.

#### [MODIFY] `backend/tests/unit/test_agent_capabilities.py`
- Update capability tests for `register_competitor` and `save_onboarding_data`.

#### [MODIFY] `backend/tests/unit/test_relationships.py`, `test_insights.py`, `test_battlecards.py`
- Update unit test SQL mocks for new schemas and parameters.

#### [NEW/MODIFY] `backend/tests/integration/test_competitors.py`
- Add integration test coverage for `GET /v1/competitors/{id}`, `POST /v1/competitors/batch`, and `GET /v1/competitors/{id}/signals/aggregated`.

---

## 5. Verification Plan

### Automated Tests
Run pytest in the backend environment:
```powershell
cd C:\dev\OShift\OShift\backend
pytest tests/unit/
pytest tests/integration/test_competitors.py
```

### Manual Verification
1. Verify `GET /v1/competitors/{id}` returns complete competitor object with `founding_year`, `market_valuation_usd`, and `industry`.
2. Verify `POST /v1/competitors/batch` accepts array of competitors and creates records in DB.
3. Verify `GET /v1/competitors/{id}/signals/aggregated` returns clean time-series metric points.
4. Verify `GET /v1/insights/gaps?competitor_id={id}` correctly filters gaps by competitor.
5. Verify `GET /v1/sense/reviews` returns empty list instead of canned fake reviews when no miner is connected.
