# Indexing and performance

## Contents

1. [What an index costs, not just what it buys](#1-what-an-index-costs-not-just-what-it-buys)
2. [Index types, practically](#2-index-types-practically)
3. [Composite index column order](#3-composite-index-column-order)
4. [Partial and covering indexes](#4-partial-and-covering-indexes)
5. [The foreign-key-index rule, with a concrete example](#5-the-foreign-key-index-rule-with-a-concrete-example)
6. [Don't index speculatively — then iterate with real query plans](#6-dont-index-speculatively--then-iterate-with-real-query-plans)
7. [Partitioning](#7-partitioning)
8. [Read replicas and the consistency trade-off](#8-read-replicas-and-the-consistency-trade-off)
9. [Denormalizing and caching for read-heavy paths](#9-denormalizing-and-caching-for-read-heavy-paths)

## 1. What an index costs, not just what it buys

An index makes specific reads faster by maintaining an extra, sorted data structure alongside the table. That structure has to be updated on every insert, update, or delete that touches an indexed column — so every index is a trade: faster reads on the columns it covers, slower writes and more storage, permanently, for the life of the table. Treat "should this be indexed" as a real question with a real answer, not a reflex to add an index whenever something feels slow.

## 2. Index types, practically

- **B-tree (the default, and correct for most cases).** Handles equality, range (`<`, `>`, `BETWEEN`), and sorting well. Reach for this unless you have a specific reason not to — it's what you get automatically and it's right most of the time.
- **Hash.** Equality only, no range or sort support. In Postgres specifically, B-tree already handles equality efficiently, so hash indexes rarely earn their more limited functionality — default to B-tree even for pure equality lookups unless you've measured a specific reason not to.
- **GIN.** Good for values with multiple internal components you need to search into: JSONB containment queries (`@>`), full-text search (`tsvector`), array membership. Reach for this the moment you're indexing a JSONB or array column for querying, not a plain B-tree.
- **GiST.** Good for ranges, geometric/spatial data, and some full-text/fuzzy-match use cases. Less commonly needed than GIN or B-tree; know it exists for range-type and spatial columns.
- **BRIN.** Very small, very cheap index for huge tables where the indexed column's values correlate strongly with physical row order — the textbook case is a `created_at` column on a large, append-only, rarely-updated table (events, logs), where BRIN gives most of the query benefit of a B-tree at a small fraction of the size and maintenance cost.

## 3. Composite index column order

A composite index on `(a, b, c)` is really a single sorted structure ordered first by `a`, then by `b` within each `a`, then by `c` within each `b` — which means it can serve queries that filter on `a` alone, or `a` and `b`, or `a` and `b` and `c`, but generally **cannot** efficiently serve a query that filters on `b` alone, or `c` alone, without `a`. This is the "leftmost prefix" rule, and it's the single most common source of "I have an index but the query planner isn't using it" confusion.

Practical consequence: put the column you filter on most often, or the one that's most selective (narrows the result set the most), first. For multi-tenant tables specifically, this is why `tenant_id` belongs as the leading column of nearly every composite index (see `multi-tenancy-patterns.md`) — almost every query already filters by tenant, so it should be the first thing the index narrows on.

```sql
-- Serves: WHERE tenant_id = ?  AND  WHERE tenant_id = ? AND status = ?
-- Does NOT efficiently serve: WHERE status = ? alone
CREATE INDEX idx_orders_tenant_status ON orders (tenant_id, status);
```

## 4. Partial and covering indexes

**Partial indexes** — index only the rows that actually matter for a query, using a `WHERE` clause on the index itself:

```sql
CREATE UNIQUE INDEX idx_active_users_email
  ON users (email)
  WHERE deleted_at IS NULL;
```

This is genuinely underused and high-value, especially paired with soft delete: it keeps the index smaller and faster, and it's exactly how you enforce "email must be unique among *active* users" without a global uniqueness constraint that would block reusing an email after a soft-deleted account.

**Covering indexes** (Postgres's `INCLUDE` clause) let a query be answered entirely from the index without touching the underlying table (an "index-only scan") by carrying a few extra columns in the index that aren't part of the sort/filter key but are needed in the result. Worth reaching for on a specific, hot, measured read path — not a default to apply everywhere.

## 5. The foreign-key-index rule, with a concrete example

Repeating this because it's genuinely one of the most common real-world performance bugs: **index every foreign key column.** Most databases index primary keys automatically; almost none index foreign keys automatically.

```sql
CREATE TABLE order_items (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  order_id uuid NOT NULL REFERENCES orders(id),
  product_id uuid NOT NULL REFERENCES products(id)
  -- ...
);

-- Without these, both of the following do a full table scan on order_items:
-- "show me all items for this order" (join on order_id)
-- "delete this order" (the DB still has to check order_items for rows to cascade/restrict)
CREATE INDEX idx_order_items_order_id ON order_items (order_id);
CREATE INDEX idx_order_items_product_id ON order_items (product_id);
```

An unindexed FK is invisible right up until the table has enough rows for the missing index to matter — which is exactly why it's easy to miss in early development and painful to discover in production.

## 6. Don't index speculatively — then iterate with real query plans

Index for queries you actually have, or that came out of the interview's "what are the 5-10 things this app does most" question — not for hypothetical future queries "just in case." Every unused index is pure write-cost and storage with no offsetting benefit.

Once a schema is live, `EXPLAIN ANALYZE` on your actual slow queries is the real feedback loop — it shows you whether the planner is using the indexes you expect, and if not, why (wrong leading column, insufficient selectivity, a type mismatch preventing index use, or genuinely needing a different index). Treat initial indexing as an informed starting point, not a final answer — plan to revisit it against real query plans once real traffic exists.

## 7. Partitioning

Partitioning splits one logical table into multiple physical pieces, transparently to most queries, based on a partition key. It's worth the added complexity for two fairly specific, common situations:

- **A huge, mostly-append-only table where you want to cheaply drop old data.** The classic case is an events/audit-log table partitioned by month on `created_at`: dropping a whole partition when data ages out is close to instant, versus a `DELETE` of millions of individual rows, which is slow and generates a lot of write-ahead-log and vacuum overhead.
- **Bounding index size on a table that's grown too large for its indexes to stay efficient**, by partitioning on a key that most queries already filter on (often the same `created_at`, or `tenant_id` for a small number of very large tenants).

Range partitioning (by date, or by a numeric range) is the most common case by far; list partitioning (explicit set of values, e.g., by region) and hash partitioning (even distribution with no natural range) exist for less common shapes. Don't reach for partitioning pre-emptively — it adds real operational complexity (constraints and unique indexes need to include the partition key, some queries need to be partition-key-aware to prune effectively) that isn't worth paying before a table is actually large enough for it to matter.

## 8. Read replicas and the consistency trade-off

A read replica offloads read traffic (especially reporting/analytics queries) from the primary database, which is valuable once reporting load starts contending with transactional (OLTP) load for the same resources.

The real trade-off to surface explicitly: replicas are asynchronously updated, so there's a replication lag window — typically milliseconds, but non-zero — during which a replica can return stale data relative to the primary. This becomes a real, user-visible bug under one specific, common pattern: a user writes something (to the primary) and is then immediately shown a read (routed to a lagging replica) that doesn't yet reflect their own write — "I just saved this and it disappeared." Two common mitigations: route a user back to the primary for reads immediately following their own write (at least for a short window), or use the replica only for genuinely separate read paths (dashboards, reports, other users' views) where "eventually consistent, within a second or two" is actually fine.

## 9. Denormalizing and caching for read-heavy paths

See `data-modeling-and-normalization.md` for the full denormalization guidance — the performance-specific addition here: a cached/precomputed column (like `orders_count` on a `customers` row, maintained by trigger or application logic) trades write-time bookkeeping and a second source of truth for a read that no longer needs a join or aggregation. Only worth it once you've actually measured that join or aggregation being too slow for a real, current need.

If you're layering an application-level cache (Redis, etc.) in front of the database, that has a schema implication worth planning for: you generally need a reliable way to detect "this row changed since I last cached it," which usually means an `updated_at` timestamp (which you likely already have, per the conventions file) or an explicit version/etag column, kept accurate enough to safely invalidate or compare against.
