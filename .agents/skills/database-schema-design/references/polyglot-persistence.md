# Polyglot persistence: SQL vs NoSQL, properly framed

## Contents

1. [The default position](#1-the-default-position)
2. [When a specialized store actually earns its complexity](#2-when-a-specialized-store-actually-earns-its-complexity)
3. [The cost that's easy to underweight](#3-the-cost-thats-easy-to-underweight)
4. [Before adding a second store](#4-before-adding-a-second-store)
5. [A note on JSONB vs "a NoSQL database"](#5-a-note-on-jsonb-vs-a-nosql-database)

## 1. The default position

For the core data of most applications — and especially most SaaS products — relational/SQL is still the right starting point. Most application data is genuinely relational in nature (things relate to other things: orders relate to customers relate to line items relate to products), and a relational database gives you real transactions, real constraints, and flexible ad-hoc querying essentially for free — all of which you will want the first time product or support asks an unanticipated question of the data, which happens to every real product eventually.

Frame this as **polyglot persistence** — which specific tool fits which specific job — rather than "SQL vs. NoSQL" as one binary choice made once for the whole system. Most real systems that use something other than their primary relational database use it for one specific, bounded piece of the system, alongside — not instead of — a relational core.

## 2. When a specialized store actually earns its complexity

- **Document store** (MongoDB and similar) — genuinely variable, nested structure per record, with little need to query or join across records on their internal structure. Good fits: flexible form responses, CMS content blocks, arbitrary event payloads. Poor fit for anything that's actually relational underneath (most core business data), even if it feels flexible on the surface.
- **Key-value store** (Redis, or DynamoDB used purely as KV) — extremely high-throughput simple lookups: caching, session storage, rate-limiting counters, feature flags. Not a substitute for a relational store's querying and consistency guarantees.
- **Wide-column / time-series** (Cassandra, TimescaleDB, ClickHouse) — massive write-heavy time-series or event data with known, aggregation-heavy query patterns (metrics over time windows). Worth noting: a Postgres extension like TimescaleDB often lets you stay inside Postgres for this rather than operating an entirely separate system, which is frequently the better trade-off unless you're at a scale where a purpose-built system is clearly justified.
- **Search engine** (Elasticsearch/OpenSearch, or Postgres's own full-text search / `pg_trgm` for lighter needs) — full-text relevance ranking and faceted search at real scale. Postgres's built-in full-text search covers a genuinely large fraction of real search needs without a separate system; reach for a dedicated search engine once you need relevance tuning, faceting, or scale beyond what that comfortably handles.
- **Graph database** (Neo4j and similar) — appropriate when deep, variable-depth relationship traversal is the *primary* access pattern of the product itself (social graphs, recommendation engines built on graph traversal). Genuinely rare as a primary store for typical SaaS applications — most "graph-shaped" needs in ordinary products (org charts, category trees, comment threads) are well served by the hierarchy patterns in `relationships-and-hierarchies.md`, inside a normal relational schema, without a separate graph database.
- **Vector store** (`pgvector`, or a dedicated service like Pinecone) — embeddings and similarity search for AI-powered features. `pgvector` lets you keep this inside Postgres for small-to-moderate scale, which avoids operating a whole separate system for a single feature; a dedicated vector database earns its complexity once you're at a scale or a set of vector-search features that outgrows what `pgvector` handles comfortably.

## 3. The cost that's easy to underweight

Every additional data store is a new thing to operate, back up, monitor, secure, and keep consistent with your source of truth — and a new thing every engineer on the team needs to understand well enough to debug at 2am. This cost is genuinely easy to underweight in the moment a specific feature seems like an obviously better fit for a specialized store, and genuinely expensive to have underweighted a year later once several of these have accumulated and nobody's quite sure which system is authoritative for what.

The bar for adding a second store should be "this specific access pattern is genuinely bad in Postgres or your primary store, *and* it's common enough in your actual product to be worth the ongoing operational cost" — not "NoSQL is what scales" as a general belief, which was already a dated oversimplification years ago and remains one now.

## 4. Before adding a second store

A short, deliberately blunt checklist worth actually running through with the user before agreeing to add one:

- Have you actually measured this being a real problem in the primary store, or does it just feel like it should be one?
- Does an extension to your primary database (JSONB, `pg_trgm`, `pgvector`, TimescaleDB, and similar) get you most of the benefit without a second system to operate?
- Who is the source of truth once there are two stores, and what keeps them in sync — and what happens when that sync mechanism fails or lags?
- Is the team ready to operate, monitor, and debug a second kind of database in production, not just to write the first version of the integration?

If the honest answers don't clearly justify it, staying inside the primary relational store — even if it's not the theoretically "purest" fit for one specific feature — is very often the better real-world decision.

## 5. A note on JSONB vs "a NoSQL database"

Storing some genuinely flexible data as a JSONB column inside an otherwise-relational Postgres schema is a much smaller decision than adding an entirely separate NoSQL database — it's not really the same choice at all, and conflating them leads to reaching for a whole new system when a single column type would have done the job. See the EAV/JSONB discussion in `data-modeling-and-normalization.md` §7 for when a JSONB column is the right tool within an otherwise-normal schema.
