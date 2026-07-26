# Relationships and hierarchies

## Contents

1. [Many-to-many: join table or first-class entity?](#1-many-to-many-join-table-or-first-class-entity)
2. [One-to-one, when it's actually justified](#2-one-to-one-when-its-actually-justified)
3. [Self-referential hierarchies (trees)](#3-self-referential-hierarchies-trees)
4. [Polymorphic associations](#4-polymorphic-associations)

## 1. Many-to-many: join table or first-class entity?

Every many-to-many relationship needs a join table, but there are two very different reasons a join table exists, and confusing them leads to awkward schemas:

- **A thin join table** just records that a relationship exists, maybe with a small amount of relationship-specific metadata: `team_members(team_id, user_id, role)`. It has no independent lifecycle worth naming — nobody thinks of "the membership of Alice on Team X" as a thing with its own story.
- **A first-class entity that happens to connect two other entities** has real attributes, a real lifecycle, and is something the domain actually talks about: `enrollments(student_id, course_id, grade, enrolled_at, completed_at)`. A student's enrollment in a course has a grade, a completion date, maybe a withdrawal date — it's not incidental metadata on a link, it *is* the thing.

**The rule of thumb:** if the join table is accumulating more than one or two extra columns, or if those columns have their own lifecycle (dates, statuses, history), stop calling it a join table in your head. Name it and model it as the entity it actually is — `Enrollment`, `Membership`, `Subscription` — not `student_courses`. This isn't just a naming nicety: once it's modeled as a real entity, it's obvious that it might need its own primary key, its own audit trail, or its own related tables, which a "just a join table" mental model tends to obscure.

## 2. One-to-one, when it's actually justified

A true 1:1 relationship (each row in A has at most one corresponding row in B, and vice versa) is uncommon as a *design choice* rather than an accident of over-splitting. Before creating one, check whether it's actually justified:

- **Legitimate: splitting off optional, rarely-accessed, or large columns.** `users` stays small and fast to query for the common case; `user_profiles` (bio, avatar, preferences — accessed less often, some of it optional) lives in its own table joined in only when needed.
- **Legitimate: a security or compliance boundary.** Splitting sensitive fields (payment details, government IDs) into their own table specifically so you can apply tighter access controls, different encryption, or a different retention policy to that table than to the rest of the entity.
- **Not legitimate: no real reason, just because the tables were created at different times or by different people.** If you can't articulate why the split exists beyond "that's how it happened," merge them — a 1:1 split with no purpose just adds a join to every read for nothing.

## 3. Self-referential hierarchies (trees)

Categories with subcategories, org charts, comment threads, nested folders — anything where a row's parent is a row in the same table. This is one of the classic hard problems in schema design, because the four standard patterns trade off read speed, write speed, and complexity very differently, and picking the wrong one for your actual access pattern is a common, painful mistake.

| Pattern | How it works | Read: "children of X" | Read: "all descendants of X" | Write: insert/move a node | Best for |
|---|---|---|---|---|---|
| **Adjacency list** | A `parent_id` self-referencing FK | Fast (indexed FK lookup) | Needs a recursive CTE or app-level recursion | Cheap — just update one FK | Shallow-to-moderate trees, or when write simplicity matters most. The right default absent a specific reason to choose otherwise. |
| **Path enumeration / materialized path** | A string column like `/1/4/9/` encoding the ancestor chain | Fast (`LIKE '/1/4/%'` or prefix match) | Fast (same prefix match) | Moderate — moving a subtree means rewriting the path on every descendant | Read-heavy trees where "all descendants" queries are common, and moves are rare |
| **Nested sets** | Two integers per row (`lft`, `rgt`) encoding a pre-order traversal range | Fast | Very fast (single range query, no recursion) | Expensive — inserting or moving a node requires renumbering a range of *other* rows | Trees that are read constantly and change rarely (e.g., a fixed taxonomy/category tree) — a poor fit for anything users edit often |
| **Closure table** | A separate table listing every ancestor-descendant pair (including self-pairs) | Fast | Fast, in either direction (ancestors of X or descendants of X) | Moderate — inserting a node means inserting its new ancestor pairs; a subtree move touches the closure rows for that subtree, not the whole tree | General-purpose choice when you need good performance in *both* directions and writes aren't rare. Extra storage (one row per ancestor-descendant pair, which grows faster than the tree itself) is the real cost. |

**Recommendation:** default to adjacency list plus a recursive CTE unless you have a specific, real need for fast "all descendants" queries at real scale — in which case a closure table is usually the best all-around choice for hierarchies that are both read *and* actively edited. Nested sets are largely a legacy choice today; the write cost is rarely worth it once a closure table is a viable, better-behaved alternative for the same "fast in both directions" goal — reach for nested sets only for a genuinely static, rarely-modified tree.

Whichever pattern you choose, explicitly ask (per the interview) how deep nesting can realistically go and how often "everything under X" queries actually happen — the answer usually makes the right choice obvious.

## 4. Polymorphic associations

The "this belongs to either a Post or a Photo" (or "attachments can live on a Task or a Project") problem. Two real implementations, with a real trade-off between them — not just a style preference:

**Option A — exclusive-arm nullable foreign keys.** The child table gets one nullable FK column per possible parent type (`post_id NULL`, `photo_id NULL`), with a `CHECK` constraint ensuring exactly one is set:

```sql
CREATE TABLE comments (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  post_id uuid REFERENCES posts(id),
  photo_id uuid REFERENCES photos(id),
  body text NOT NULL,
  CONSTRAINT exactly_one_parent CHECK (
    (post_id IS NOT NULL)::int + (photo_id IS NOT NULL)::int = 1
  )
);
```

Real foreign-key referential integrity is preserved — the database itself guarantees `post_id` points at a real post. The cost is that adding a new possible parent type means adding a new nullable column (and updating the check constraint) to the child table.

**Option B — a generic `{x}able_type` + `{x}able_id` pair.** One `commentable_type` (text/enum) and one `commentable_id` (matching the type of whatever primary keys you're pointing at) column. Adding a new parent type needs no schema change at all — just start writing rows with a new type value.

The real cost: **you lose actual foreign-key referential integrity.** The database has no way to enforce that `commentable_id` really points at an existing row in the table named by `commentable_type`, because a FK constraint can only ever point at one specific table. That guarantee moves entirely into application code and tests, which will eventually have a bug, a bad migration, or a bulk-import script that bypasses it — and now you have orphaned or misattributed rows with nothing in the schema that would have caught it.

**Recommendation:** prefer Option A when the set of possible parent types is small and reasonably stable — the referential-integrity guarantee is worth the minor schema-change cost of adding a new type occasionally. Reach for Option B only when the parent-type set is genuinely large or growing quickly, and you're knowingly trading away DB-enforced integrity for that flexibility. Even then, consider whether separate join tables per type (`post_comments`, `photo_comments`, both pointing at a shared `comments` table for the actual content) might get you the flexibility of B with the integrity of A, at the cost of a bit more schema surface area.
