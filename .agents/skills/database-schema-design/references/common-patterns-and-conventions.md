# Common patterns and conventions

## Contents

1. [Naming conventions](#1-naming-conventions)
2. [Timestamps](#2-timestamps)
3. [Soft delete vs hard delete](#3-soft-delete-vs-hard-delete)
4. [Modeling status and state](#4-modeling-status-and-state)
5. [Money and currency](#5-money-and-currency)
6. [Concurrency control](#6-concurrency-control)
7. [Idempotency keys](#7-idempotency-keys)

## 1. Naming conventions

The specific convention matters less than picking one and never deviating — inconsistency is a small tax paid on every single table added afterward, forever, by everyone who touches the schema.

- **Case**: `snake_case` for tables and columns is the pragmatic default, especially on Postgres, which folds unquoted identifiers to lowercase — fighting that by using `camelCase` or `PascalCase` means every reference to that identifier needs to be quoted exactly, forever, which is easy to forget and annoying to debug when it's wrong.
- **Table names**: plural (`users`, `orders`) is the more common modern convention (Rails and much of the surrounding ecosystem popularized it), but singular (`user`, `order`) is also entirely defensible and used deliberately in some enterprise shops. Pick one, state it explicitly in the design doc, and never mix them within one schema.
- **Reserved words**: avoid naming a table or column something that's a reserved word in your database engine — `user`, `order`, `group`, `table` are classic landmines that force awkward quoting everywhere they're used. Using plural table names sidesteps most of these automatically (`users`, `orders`, `groups` are generally fine).
- **Foreign key columns**: name them `<singular_referenced_table>_id` — `user_id` referencing `users`, `order_id` referencing `orders`. Predictable enough that you can usually guess a FK column's name correctly without checking.
- **Booleans**: prefix with `is_` or `has_` (`is_active`, `has_verified_email`) so a column's type is guessable from its name alone.
- **Avoid cryptic abbreviations.** `qty` instead of `quantity` saves nothing meaningful and costs a small amount of clarity every time someone reads it who didn't write it.

## 2. Timestamps

Every mutable table gets `created_at` and `updated_at` at minimum, both `timestamptz` (never a naive/timezone-less datetime — see the golden rules in SKILL.md for why), defaulting to `now()` on insert. `updated_at` is more reliably maintained by a database trigger than by application/ORM code alone — a trigger catches raw SQL updates, bulk migrations, and anything else that bypasses the ORM layer; app-level `updated_at` handling only catches writes that go through that specific code path.

Add `created_by` / `updated_by` (foreign keys to whatever your user/actor table is) whenever you'll need to know *who* made a change, not just *when* — which is common enough in B2B/SaaS contexts (audit and support needs) that it's worth deciding deliberately per table rather than skipping by default.

## 3. Soft delete vs hard delete

Soft delete (a `deleted_at timestamptz NULL` column; a "deleted" row is filtered out rather than actually removed) is a real, ongoing cost, not a free safety net — treat the decision to add it as seriously as any other design choice, per-entity, not as a habit applied to every table by default.

The real, recurring costs:

- **Every query needs the filter.** `WHERE deleted_at IS NULL` has to be remembered everywhere that table is queried — an easy thing to forget once, and a real bug (a "deleted" row reappearing somewhere) when it happens.
- **Unique constraints get harder.** A plain `UNIQUE (email)` constraint blocks a new signup from reusing an email that belongs to a soft-deleted account. Fix with a partial unique index scoped to non-deleted rows (see `indexing-and-performance.md` §4) — an extra thing to remember to do correctly for every uniquely-constrained column on a soft-deletable table.
- **Foreign keys pointing at a soft-deleted row need an explicit answer.** If an `order` references a soft-deleted `customer`, what should the order's UI show? This needs a real decision, not an accident of whatever the join happens to do.

**When it earns its cost:** entities where users genuinely expect "undo" (an accidentally deleted document, a trashed item with a restore option), or where audit/compliance requirements mean you can't actually remove the row. **When it doesn't:** most other cases — a real hard delete, backed by a real backup/point-in-time-recovery story for genuine accidents, is simpler and often entirely sufficient. An alternative worth knowing: an **archive table** (move deleted rows to a separate `_archive` table on delete) keeps the live table small and simple while still preserving the data, at the cost of an extra step on every delete — a reasonable middle ground when you need to retain data but rarely need to query it back.

## 4. Modeling status and state

Three tiers of sophistication, and a recommendation to start at the simplest one and escalate only when you actually feel the pain of it:

1. **A plain `status` column, constrained by an enum type or a `CHECK` constraint.** Correct default for most cases — simple, queryable, indexable, and the database rejects invalid values outright.
2. **A `statuses` lookup table**, when statuses need their own metadata (a display name, a color, a sort order for a kanban-style UI) or need to be tenant-customizable (different companies define their own pipeline stages). Worth it specifically when one of those needs is real, not preemptively.
3. **A real state-machine enforcement** (application-level state-machine library/pattern, or database-level `CHECK` constraints on valid transitions), when invalid transitions are a genuine correctness risk — an order moving from `shipped` back to `pending`, a payment moving from `refunded` to `pending`. Worth the complexity specifically when a wrong transition would cause a real problem (financial, logistical, contractual), not for status fields where an odd transition is merely cosmetically wrong.

## 5. Money and currency

Never store money as `float` or `double` — binary floating point cannot represent most decimal fractions exactly, and the rounding errors compound across aggregation into real, visible accounting discrepancies. Use integer minor units (store cents as an integer: `price_cents integer`) or a fixed-point `DECIMAL`/`NUMERIC` type.

Always store the currency alongside the amount — a bare `amount` column with no `currency` column is an implicit, fragile assumption that everything is in one currency, which tends to break the first time it's wrong. `(amount_cents integer, currency char(3))` as a pair, not just a number. Be deliberate about rounding and tax handling in any aggregation across rows — summing already-rounded per-line amounts can differ from rounding a sum of exact amounts, and which one is "correct" is a real business/accounting decision, not a technical one to default silently.

## 6. Concurrency control

- **Optimistic locking** — a `version` (or `lock_version`) integer column, incremented on every update; an update statement checks the version hasn't changed since it was read (`UPDATE ... WHERE id = ? AND version = ?`, then check the row count affected) and fails/retries if someone else updated it first. No lock is held between read and write, so it's cheap and doesn't block other transactions — appropriate for the common case where conflicting edits are rare and a "someone else changed this, please retry" experience is acceptable.
- **Pessimistic locking** — `SELECT ... FOR UPDATE` takes a real row lock for the duration of the transaction, blocking other transactions from modifying (or in some modes, even reading) the same row until it commits or rolls back. Appropriate for genuinely high-contention critical sections where correctness can't tolerate an optimistic retry — the standard example is decrementing a limited inventory count, where you need certainty that no two concurrent transactions both see and act on the same starting count.

Default to optimistic locking; reach for pessimistic locking specifically where contention is real and expected, not as a default posture, since held locks reduce throughput under load.

## 7. Idempotency keys

For any write triggered from outside your own transaction boundary that might be retried — webhooks, payment provider callbacks, any "at-least-once" delivery system, or a client that might retry a request after a timeout without knowing whether the first attempt actually succeeded — store a unique `idempotency_key` column on the resulting row (or a small dedicated `processed_events` table) and check for its existence before processing, so a retried request is safely ignored instead of double-applied.

```sql
CREATE TABLE payments (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  idempotency_key text NOT NULL UNIQUE,
  -- ...
);
-- INSERT ... ON CONFLICT (idempotency_key) DO NOTHING
-- (or DO UPDATE, if the retried request should return the original result)
```

This is a small addition at design time and a genuinely difficult retrofit once duplicate-processing bugs are already live and have already caused real, visible problems (a customer charged twice) — worth raising proactively (per the interview's consistency & concurrency section) for anything financial or externally-triggered, rather than waiting to be asked.
