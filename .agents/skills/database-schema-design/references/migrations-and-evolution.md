# Migrations and schema evolution

## Contents

1. [Why this needs a plan at all](#1-why-this-needs-a-plan-at-all)
2. [The expand/contract pattern](#2-the-expandcontract-pattern)
3. [Backward-compatible vs breaking changes](#3-backward-compatible-vs-breaking-changes)
4. [Adding NOT NULL to an existing column safely](#4-adding-not-null-to-an-existing-column-safely)
5. [Indexing a large existing table without locking it](#5-indexing-a-large-existing-table-without-locking-it)
6. [Use a real migration tool](#6-use-a-real-migration-tool)
7. [Multi-tenant-specific note](#7-multi-tenant-specific-note)

## 1. Why this needs a plan at all

The moment there's real data and more than one running instance of the application (which is nearly immediately, in any deployment with rolling restarts or more than one server), a schema migration and a code deploy become two separate events that cannot be perfectly synchronized. For some brief window, old application code will run against the new schema, or new application code will run against the old schema. Design every migration assuming that window exists and needs to survive gracefully, rather than assuming the whole system will atomically switch over at one instant — it won't.

## 2. The expand/contract pattern

Also called "parallel change." The safe way to make a structural change — renaming a column is the clearest example of why the naive approach breaks:

The naive approach — `ALTER TABLE users RENAME COLUMN full_name TO name;` in one migration — breaks the moment old code (still querying `full_name`) runs against the new schema (which no longer has that column), which is exactly the coexistence window from §1.

The safe version, across several small deploys instead of one big one:

1. **Expand**: add the new column (`name`) alongside the old one (`full_name`). Both exist; nothing is removed yet.
2. **Dual-write**: deploy application code that writes to both columns on every insert/update. Backfill existing rows so `name` is populated from `full_name` for all pre-existing data.
3. **Migrate reads**: deploy application code that reads from the new column (`name`) instead of the old one. At this point both columns are still being kept in sync, so this deploy is safe to roll back if something's wrong.
4. **Contract**: once you're confident nothing is still reading or writing the old column, stop writing to it in a deploy, then drop it in a later migration.

This is more steps than "just rename it," and that's the actual point — each individual step is small, safe, and independently reversible, instead of one change that requires the code deploy and the schema migration to land at exactly the same instant across every running instance.

## 3. Backward-compatible vs breaking changes

- **Safe, backward-compatible**: adding a new nullable column, adding a new table, adding a new index (see §5 for how, on a large table), widening a column's type (e.g., `varchar(50)` to `varchar(100)`, `int` to `bigint`).
- **Breaking, needs the expand/contract treatment**: dropping or renaming a column, adding a `NOT NULL` constraint to an existing column without a safe rollout (§4), narrowing a column's type, changing a column's meaning without changing its name.

Default new migrations to the safe category whenever the actual goal allows it — "add the new thing, migrate to it, remove the old thing later" instead of "change the thing in place" is very often the same end state reached more slowly but far more safely.

## 4. Adding NOT NULL to an existing column safely

Adding `NOT NULL` directly to a column with existing rows fails outright if any existing row has a null value there, and even when it would succeed, on some databases it takes a full-table lock to validate every existing row against the new constraint — a real problem on a large, actively-written table. The safer sequence:

1. Add the column as nullable (or, if it already exists and is nullable, skip to the next step).
2. Backfill: update existing rows to have a value.
3. Add a `CHECK` constraint as `NOT VALID` first (in Postgres, `ALTER TABLE ... ADD CONSTRAINT ... CHECK (col IS NOT NULL) NOT VALID` takes only a brief lock, since it doesn't validate existing rows immediately), then `VALIDATE CONSTRAINT` separately (which does check existing rows, but without blocking concurrent writes the way the combined operation would).
4. Once validated, the constraint is fully enforced going forward, including for new rows — you now have the same guarantee a native `NOT NULL` would give you, reached without a long table-wide lock.

## 5. Indexing a large existing table without locking it

A plain `CREATE INDEX` takes a lock that blocks writes to the table for the duration of the build — fine on a small table, a real production incident on a large, actively-written one. In Postgres, `CREATE INDEX CONCURRENTLY` builds the index without holding that lock (at the cost of taking somewhat longer, and needing a retry if it fails partway). This is a very commonly-hit, very avoidable production incident — worth calling out explicitly any time you're proposing a new index on a table that might already have meaningful data in it.

## 6. Use a real migration tool

Track schema changes through a real migration tool (whatever your ORM provides — Prisma Migrate, Django migrations, Rails migrations, Alembic for SQLAlchemy — or a dedicated one like Flyway or Sqitch for raw SQL) rather than hand-run scripts applied inconsistently across environments. The point isn't the specific tool; it's having one single source of truth for "what shape is the schema in right now," verifiable and reproducible across every environment (local, staging, production) instead of tracked informally or from memory.

## 7. Multi-tenant-specific note

If the multi-tenancy model is schema-per-tenant or database-per-tenant (see `multi-tenancy-patterns.md`), every migration has to run once per tenant, not once total. This needs to be genuinely automated (a script that applies a migration across every tenant schema/database and reports failures) from early on — it's one of the real, ongoing operational costs of those models, and it gets meaningfully harder to bolt on automation for after you already have dozens of tenants than to build in from the first migration.
