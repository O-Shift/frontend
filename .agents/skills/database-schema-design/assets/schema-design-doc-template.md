# [Product/Feature Name] — Database Schema Design

## Overview

*One or two sentences: what this schema is for, and what stage the product is at (prototype / MVP / production).*

## Conceptual model

*The entity list and how they relate — this can just be the ERD, plus a sentence or two of narration for anything non-obvious about the relationships.*

## Key decisions and rationale

*The heart of the document — not what the schema is, but why it's shaped this way. One row per decision that wasn't a trivial default.*

| Decision | Choice made | Why | Alternatives considered |
|---|---|---|---|
| *e.g., Multi-tenancy model* | *e.g., Shared schema + RLS* | *e.g., ~500 expected tenants, no data-residency requirement, cost-sensitive* | *e.g., Schema-per-tenant — rejected due to migration overhead at this tenant count* |

## Multi-tenancy model

*If applicable — how tenant isolation works, where RLS policies live, how the tenant context gets set per request. Skip this section entirely for single-tenant projects.*

## Known trade-offs and things to revisit

*Anything intentionally denormalized, any anti-pattern knowingly accepted for a stated reason, anything sized for current scale that will need revisiting past a specific growth point. Naming these explicitly here is what separates a deliberate trade-off from a silent oversight discovered later.*

## Assumptions made

*Anything decided by default rather than explicitly confirmed with stakeholders — so it's easy to spot and correct if wrong, instead of being invisible until it causes a problem.*

## Change log

*Track material changes to the design after this doc was first written, with the reasoning for each — this is what makes the doc stay trustworthy instead of going stale the first time the schema evolves.*

| Date | Change | Why |
|---|---|---|
| | | |
