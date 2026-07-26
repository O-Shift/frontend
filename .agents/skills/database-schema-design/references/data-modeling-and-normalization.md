# Data modeling and normalization

## Contents

1. [What normalization actually buys you](#1-what-normalization-actually-buys-you)
2. [The normal forms, practically](#2-the-normal-forms-practically)
3. [The default: 3NF for OLTP](#3-the-default-3nf-for-oltp)
4. [Denormalizing on purpose](#4-denormalizing-on-purpose)
5. [Materialized views: denormalizing without lying](#5-materialized-views-denormalizing-without-lying)
6. [Cardinality and what it means for the schema](#6-cardinality-and-what-it-means-for-the-schema)
7. [The EAV trap](#7-the-eav-trap)
8. [Normalized vs denormalized, at a glance](#8-normalized-vs-denormalized-at-a-glance)

## 1. What normalization actually buys you

Normalization isn't a purity ritual — it exists to eliminate three concrete failure modes:

- **Update anomalies**: a fact is stored in more than one place, and an update touches one copy but not the other, so the database now contains a contradiction.
- **Insert anomalies**: you can't record a fact you know without also inventing a fake row for some unrelated fact you don't have yet (the classic example: you can't add a new product category until at least one product exists in it, because category name lives on the product row).
- **Delete anomalies**: deleting a row destroys a fact you didn't mean to lose, because it was only stored as a side effect of the row that got deleted.

A normalized schema stores every fact exactly once, in the place that owns it. That's the actual goal — the normal forms below are just formal names for progressively stricter versions of that goal.

## 2. The normal forms, practically

Skip the textbook definitions; here's what each one rules out, with a running example of an `orders` table that started life as one flat table with `customer_name`, `customer_email`, `product_name`, `product_price`, and `quantity`.

- **1NF — no repeating groups, atomic values.** Each column holds one value, not a list. `products: "Widget, Gadget"` in one cell breaks 1NF; fix is a join table (`order_items`), not a comma-separated string (see the anti-patterns file for why the comma-separated version keeps causing problems long after you'd expect).
- **2NF — no partial dependency on a composite key.** If `orders` has a composite key of `(order_id, product_id)`, then `customer_name` only depends on `order_id`, not on the pair — it doesn't belong on this table at all. Split `orders` (order-level facts) from `order_items` (line-item-level facts).
- **3NF — no transitive dependency on a non-key column.** If `customer_email` lives on the `orders` table but is really a fact about the customer, not the order, then updating a customer's email requires updating it on every one of their orders — or it silently goes stale on old ones. Move it to a `customers` table and reference it by `customer_id`.
- **BCNF** — a stricter version of 3NF for edge cases with overlapping candidate keys. Rare to hit in ordinary application schemas; worth knowing exists, not worth designing for by default.

Beyond BCNF (4NF, 5NF) deals with multi-valued and join dependencies that show up occasionally in specialized domains, but for the overwhelming majority of application schemas, getting cleanly to 3NF and stopping is the right amount of normalization. Chasing higher normal forms "because it's more correct" past this point usually buys you very little and costs you extra joins on every read.

## 3. The default: 3NF for OLTP

For an OLTP (transactional, read-and-write application) schema, default to 3NF. It gives you the anomaly-freedom above, and it composes well with real foreign keys and constraints, which is where a relational database actually earns its keep.

Don't treat this as a rule to apply uniformly and mechanically to every table without judgment — apply it as a strong default you deviate from with a stated reason (see §4), not as a checklist to blindly satisfy. A schema that's technically 3NF everywhere but requires eight joins to render a single page is not a well-designed schema; it's over-applied theory. Judgment about your actual query patterns (from the interview) matters more than the letter of the normal forms.

## 4. Denormalizing on purpose

Denormalization means deliberately storing a derived or duplicated fact to avoid a join or a recomputation, in exchange for accepting the risk that the copy can drift from its source of truth. This is a legitimate, sometimes-necessary technique — but it should be a *local, deliberate, measured* response to a specific proven read hotspot, not a blanket "for performance" applied everywhere up front.

Good candidates for denormalization:

- A cached count or aggregate that's read far more often than the underlying rows change (`orders_count` on a `customers` row, updated via trigger or application logic on every insert/delete of an order).
- A field duplicated onto a child row specifically to avoid a join on a page that's rendered extremely often (e.g., duplicating a product's `name` onto an `order_item` row so historical orders still show the product name even if the product is later renamed or deleted — note this one is actually about correctness, not just performance: an order should show what the product was called *at the time of purchase*, not its current name).
- Search-optimized duplicated text (a `search_text` column combining several fields for full-text indexing).

The real cost you're accepting: two sources of truth that can drift, and a real invalidation strategy you now have to build and maintain (trigger, background job, or careful application-level bookkeeping) and test. Don't reach for this until you've actually measured a join or aggregation being too slow for a real, current need — "might be slow at scale someday" is not the same bar as "is measurably slow right now for a query we actually run."

## 5. Materialized views: denormalizing without lying

A materialized view lets you get most of the benefit of denormalization — a precomputed, fast-to-read result — without hand-maintaining duplicate columns and their invalidation logic yourself. You write a normal query (however many joins and aggregations it needs), the database periodically (or on-demand) executes it and caches the result as if it were a table.

This is a strong first choice for reporting/dashboard-style read patterns: keep your OLTP tables clean and normalized, and let a materialized view carry the denormalized, pre-joined shape that a dashboard actually wants to read. The trade-off is staleness (the view is only as fresh as its last refresh) rather than the drift-and-invalidation-logic problem of hand-rolled denormalized columns — often a much easier trade-off to reason about and operate.

## 6. Cardinality and what it means for the schema

- **One-to-one.** Genuinely rare as a *design choice* — usually either a sign the two tables should just be merged, or a deliberate split for a good reason: an optional, rarely-accessed set of large columns (e.g., `user_profiles` split off `users` so the hot `users` row stays small), or a security/compliance boundary (splitting sensitive payment fields into a table with tighter access controls than the rest of the entity). If you can't articulate why the split exists, it probably shouldn't.
- **One-to-many.** The bread-and-butter case: a foreign key on the "many" side pointing back to the "one" side. Decide whether the relationship is required (`NOT NULL` FK) or optional (`NULL`-able FK) — this is a real modeling decision, not a default to leave nullable "just in case."
- **Many-to-many.** Needs a join/junction table. Whether that table is a thin join table or a first-class entity in its own right is a real design decision — see `relationships-and-hierarchies.md` for the detailed guidance and worked examples.

## 7. The EAV trap

Entity-Attribute-Value modeling — a generic `attributes` table with `entity_id`, `attribute_name`, `attribute_value` columns instead of real, typed columns — is tempting the moment "custom fields" or "flexible schema" comes up. It's almost always the wrong answer for anything beyond a narrow, bounded use case, for reasons that don't show up immediately:

- Every value gets stored as text (or forced into a few generic typed columns), so you lose real column types, real constraints, and real indexes on the actual data.
- A query that would be one `WHERE` clause on a normal column becomes a self-join per attribute you're filtering on.
- The database can no longer enforce anything about what's valid — that burden moves entirely into application code, which will eventually have a bug.

Better alternatives, roughly in order of preference depending on how flexible the fields genuinely need to be:

1. **Real columns.** If you actually know the fields, even if there are many of them, they're still just columns. "Flexible" is often just "unfamiliar with the domain yet," not a genuine runtime-configurable requirement.
2. **A JSONB column, scoped to one entity, for genuinely unstructured or sparse attributes.** Postgres's `jsonb` type with a GIN index gives you reasonable queryability without a separate EAV table — appropriate when the extra attributes are truly variable per row and not something you need to join or aggregate across rows efficiently.
3. **A proper metadata-driven custom-fields system**, the pattern real products (Salesforce, HubSpot, and similar) use when end users genuinely need to define their own fields at runtime: a `field_definitions` table (per tenant) describing name/type/validation, and either typed value tables per data type or a well-indexed JSONB value column keyed against the definition. This is real complexity — only build it when end users truly need runtime-configurable fields, not as a shortcut to avoid modeling decisions you could actually make.

The rule of thumb: EAV (and its cousin, "just put everything in one big JSON blob") defers the pain of modeling. It doesn't remove it. The pain comes back later as unindexable, unqueryable, unvalidatable data — after there's real data in it and rewriting it is no longer free.

## 8. Normalized vs denormalized, at a glance

| | Normalized (3NF default) | Denormalized (deliberate, local) |
|---|---|---|
| Write correctness | Each fact lives once; no drift possible | Multiple copies can drift; needs an invalidation strategy |
| Read performance | May need joins | Fast, no join needed |
| Storage | Smaller | Larger (duplicated data) |
| Flexibility to change | Easy — change the one place a fact lives | Harder — every copy needs updating logic |
| When to reach for it | Default, for OLTP write paths | A specific, measured read hotspot, or historical-accuracy needs (see the order-item product-name example above) |
