# Requirements interview: the full question bank

This is the exhaustive version of the interview described in SKILL.md. Don't recite this verbatim or in order — use it as a checklist to make sure you've actually covered the ground, and ask in your own words, adapted to what the user has already told you. See SKILL.md's "Running the interview" section for the technique (batching, calibrating depth to stakes, reading signals). This file is the *content*; SKILL.md is the *delivery*.

## Contents

1. [Domain & users](#1-domain--users)
2. [Scale & growth](#2-scale--growth)
3. [Entities & relationships](#3-entities--relationships)
4. [Multi-tenancy & access](#4-multi-tenancy--access)
5. [Consistency & concurrency](#5-consistency--concurrency)
6. [History, audit & compliance](#6-history-audit--compliance)
7. [Stack & constraints](#7-stack--constraints)
8. [Search, reporting & real-time](#8-search-reporting--real-time)
9. [Reading the signals](#9-reading-the-signals)
10. [Interview technique, worked example](#10-interview-technique-worked-example)

---

## 1. Domain & users

**Why it matters:** Column names and table structure are meaningless without domain context. This is also where you pick up your first, cheapest clue about multi-tenancy — before you've had to ask about it directly.

- "Give me the elevator pitch — what does this product do, and who's the primary user?"
- "Is this B2B (companies as customers), B2C (individuals), or both?"
- If B2B: "When a company signs up, is it one person's account, or do they invite teammates in? Do teammates ever need different permission levels?"
- "What are the 3–5 things a user does most often in this product?" — this tells you the hot paths that should drive your indexing and denormalization choices later, so it's worth getting concretely, not just in the abstract.
- "Is this a brand-new product, or are you adding a feature to something that already has users and data?" — determines whether you're doing greenfield design or a live-schema change (see `migrations-and-evolution.md`).

## 2. Scale & growth

**Why it matters:** Scale changes almost every downstream decision — index strategy, key type, whether partitioning is worth the complexity, whether row-level-security overhead is even measurable. Getting this roughly right up front saves you from over- or under-engineering.

- "Roughly how many tenants/customers/organizations do you expect in year one? Order of magnitude is fine — tens, hundreds, tens of thousands?"
- "For your biggest table, how many rows do you expect at launch, and in about two years?"
- "Read-heavy or write-heavy? Or roughly even?" — if they don't know, ask what the app spends most of its time doing: showing data back to users (read-heavy) or ingesting events/transactions (write-heavy).
- "Any predictable bursty load?" — end-of-month invoicing runs, a daily batch job, a marketing email that sends everyone to the site at once.
- "Any hard latency requirements?" — real-time collaboration, sub-100ms API responses, or is "feels fast" good enough.
- "Any geographic or data-residency requirements?" — a single region is fine for most projects, but "our EU customers' data must stay in the EU" is a real, common constraint that changes infrastructure and sometimes schema (e.g., region as part of a tenant's routing key).

## 3. Entities & relationships

**Why it matters:** This category *is* the schema. Everything else refines it; this is what you're actually building. Take real time here — it's the highest-leverage part of the whole interview.

- "List the nouns — the 'things' your app manages. Don't worry about structure yet, just brainstorm: users, projects, tasks, invoices, whatever they are."
- For each entity that comes up: "What makes one `{Entity}` different from another — what would a human use to tell two of them apart?" This probes natural-key candidates and helps you spot which fields are actually required vs incidental.
- For each pair of related entities: "Walk me through how a `{A}` relates to a `{B}` — can one `A` have many `B`s? Can a `B` ever belong to more than one `A`, or move between `A`s over its lifetime?" Get the cardinality and the mutability of the relationship, not just its existence.
- "Is there anything with a parent-child relationship to *itself* — categories with subcategories, an org chart, comment replies, nested folders?" If yes: "How deep can that nesting realistically go, and do you ever need to query 'everything under X' efficiently?" (This routes you to the hierarchy patterns in `relationships-and-hierarchies.md`.)
- "Is there anything that needs to attach to more than one *kind* of parent?" — comments that can go on both a post and a photo, attachments that can live on a task or a project. This probes polymorphic associations, also in `relationships-and-hierarchies.md`.
- "Does `{Entity}` move through states — draft, published, archived, that kind of thing? Are the transitions restricted, or can it jump between any two states freely?" Feeds into the status-modeling guidance in `common-patterns-and-conventions.md`.
- "Does anything need custom, user-defined fields — things that vary per tenant or that end users configure themselves, not just what you as the developer define?" This is the question that tempts people toward EAV; flag it early so you can steer toward a better pattern from `data-modeling-and-normalization.md` instead of discovering the temptation mid-implementation.

## 4. Multi-tenancy & access

**Why it matters:** For SaaS specifically, this is one of the highest-stakes, hardest-to-retrofit decisions in the whole design. Get real detail here even if the user seems confident it's "just simple."

- "Is tenant data completely siloed, or is there ever legitimate cross-tenant visibility?" — a marketplace, shared templates, public profiles, anything one tenant can see that belongs to another.
- "How complex is the permission model?" — just "the owner can do everything," or custom roles per tenant (RBAC), or permissions that depend on more than role alone, like resource ownership or team membership (ABAC-ish).
- "Can one human belong to more than one tenant?" — a contractor working across several client accounts, an agency managing multiple customers, a user who's part of two organizations. If yes, a user cannot have a single `tenant_id` column; you need a join table between users and tenants.
- "Do your own support or ops staff need to access a tenant's data — impersonation, an admin override?" If yes: "Does that access need to be audited?" (usually yes, and worth confirming explicitly rather than assuming).

## 5. Consistency & concurrency

**Why it matters:** Determines transaction boundaries and whether you need optimistic or pessimistic locking anywhere. Skipping this is how "it worked in testing" becomes "we double-charged a customer in production."

- "Are there operations that must succeed or fail together?" — deduct inventory and create the order, or neither; charge the card and create the subscription, or neither.
- "Is there anything with financial or billing correctness on the line, where a duplicate or lost operation is a real problem?" If yes, that points toward idempotency keys (see `common-patterns-and-conventions.md`) — flag it now even if you design the specific table later.
- "How often will two people try to edit the exact same record at the same time? Does 'last write silently wins' cause a real problem here, or is that acceptable?" — most CRUD apps are fine with last-write-wins; a shared document or shared inventory count usually isn't.

## 6. History, audit & compliance

**Why it matters:** Compliance and audit requirements aren't a bolt-on feature — they change the schema itself (audit tables, retention fields, an erasure mechanism). Finding this out after launch is expensive.

- "Do you need to know who changed a record and when? Is that a compliance requirement — SOC 2, HIPAA — or just a nice-to-have?" The answer changes whether you need a real audit-log table or just `updated_by`/`updated_at` on the row (see `security-and-compliance.md` for the difference).
- "Do users expect an 'undo' or a trash/restore for things they delete?" — this is the real litmus test for whether soft delete earns its ongoing cost, not "soft delete sounds safer."
- "Any regulatory requirements around where data physically lives, how long you must or can keep it, or a user's right to have their data deleted?" — GDPR/CCPA-style erasure obligations belong at design time, not as a scramble later.
- "Is there PII, health data, or financial data involved?" Even a partial, rough list helps you flag which columns need extra protection as you design them, instead of retrofitting a classification pass afterward.

## 7. Stack & constraints

**Why it matters:** Determines what output is actually useful, and sometimes what's feasible at all.

- "Is the database engine already decided — Postgres, MySQL, SQLite, a managed platform like Supabase, PlanetScale, Neon — or is that still open?"
- "What's the app's stack or ORM — Prisma, Drizzle, Django, Rails, SQLAlchemy, raw SQL, something else?" You'll generate schema code in that format; see `schema-output-formats.md`.
- "Anything existing this needs to integrate with, or data that needs to migrate in from somewhere else?"
- "How comfortable is the team with SQL and database work day-to-day?" Not a judgment call on them — it genuinely affects whether you lean toward simpler patterns even at some cost (e.g., a plain status column over a formal state machine) or more sophisticated ones the team can actually maintain.

## 8. Search, reporting & real-time

**Why it matters:** Each of these can require schema support (indexes, extra columns, change-tracking) that's awkward to bolt on after the fact.

- "Does anything need full-text search — searching across free-text fields, not just exact match?"
- "Will there be heavy reporting or analytics against this data? Should that run against the same database, or would a read replica or warehouse make more sense?" (See `indexing-and-performance.md` for the replication-lag trade-off if they want a replica.)
- "Anything real-time — live updates, collaborative editing — that might need change-tracking beyond normal CRUD?"

---

## 9. Reading the signals

Some things are worth digging into even when not directly asked, because they're common ways a design goes wrong quietly:

- **Downplayed complexity + money anywhere.** "Just a simple CRUD app" plus any mention of payments, billing, or invoicing means financial correctness (§5, and money handling in `common-patterns-and-conventions.md`) needs real depth regardless of the stated stakes.
- **"B2B" without more detail.** Immediately worth clarifying single-user vs multi-user-per-account — it's the fork that decides whether you need a tenancy model at all.
- **"Eventually" or "later" for a feature.** Still worth a light touch now if it's the kind of thing that's expensive to retrofit — multi-tenancy, audit trail, a hierarchy that will need deep queries. Cheap to note and design room for now; expensive to bolt on after the fact. Features that are cheap to add later (an extra column, a new unrelated table) don't need this treatment — ask yourself "would adding this in six months require touching existing rows or existing constraints?" If not, it's safe to defer without asking about it now.
- **An existing schema with an anti-pattern already in production.** Don't silently fix it and don't silently leave it. Name it, explain the actual risk (not just "this is bad practice"), and let the user decide whether it's worth the migration cost now or worth carrying as known debt.
- **Vague answers on scale ("I don't know, could be big").** Push gently for an order of magnitude rather than designing for an unbounded hypothetical — "if I had to guess, would 'a few hundred customers in year one' be closer, or 'tens of thousands'?" Most schemas don't need to be designed for a scale nobody actually expects to hit; over-engineering for imagined scale has its own real cost in complexity.

## 10. Interview technique, worked example

A concrete before/after, since the difference between "grilling" and "good interviewing" is mostly about execution:

**Weak (a form dump):**
> "Please answer the following: 1) What is your database engine? 2) What is your expected scale? 3) Do you need multi-tenancy? 4) What are your entities? 5) Do you need soft deletes? 6) What is your consistency model? ... [continues for 20 more items]"

This front-loads every question with no context for why any of it matters, forces the user to do the organizing work themselves, and reads like a compliance form rather than a colleague thinking alongside them.

**Strong (staged, reasoned, batched):**
> "Quick gut-check first: is this a weekend prototype, an MVP you'll keep iterating on, or something that needs to hold up under paying customers? That tells me how much rigor to bring to the rest of this.
>
> And to get oriented — give me the elevator pitch on what the product does, and whether it's B2B or B2C. If B2B, does a signup bring in just one person, or a whole team?"

Two tight questions, both high-leverage, both with a one-line reason attached. The next batch would follow naturally from the answers — e.g., if they say "B2B, whole team," the very next thing worth asking is about tenant isolation and whether one person can belong to more than one organization, *before* diving into entity brainstorming — because the answer changes what "an entity" even looks like (does every table need a `tenant_id`?).

This is the pattern to repeat: orient, ask a tight batch tied to what you just learned, listen for what it implies, then ask the next tight batch. Not: dump the whole checklist and wait.
