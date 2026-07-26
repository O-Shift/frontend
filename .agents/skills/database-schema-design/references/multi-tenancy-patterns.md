# Multi-tenancy patterns

This is one of the highest-stakes, hardest-to-retrofit decisions in SaaS schema design. Decide it deliberately, early, with the user — not by default, and not late.

## Contents

1. [The three canonical models](#1-the-three-canonical-models)
2. [Decision framework](#2-decision-framework)
3. [Implementing shared-schema with Row-Level Security](#3-implementing-shared-schema-with-row-level-security)
4. [Layering roles and permissions on top](#4-layering-roles-and-permissions-on-top)
5. [Users who belong to more than one tenant](#5-users-who-belong-to-more-than-one-tenant)
6. [You're not as locked in as it feels](#6-youre-not-as-locked-in-as-it-feels)

## 1. The three canonical models

- **Silo — database per tenant.** Each tenant gets a fully separate database. Strongest possible isolation, both for security and for performance (one tenant's load can never degrade another's — no "noisy neighbor" problem). Easiest model for compliance and data-residency asks ("show me exactly where this customer's data lives" has a one-sentence answer), and for a clean full-tenant export or deletion. The cost is operational: migrations must run once *per tenant*, connection pooling multiplies with tenant count, and infrastructure cost scales roughly linearly even for tiny, low-revenue tenants. Best fit: a small number of large, high-value tenants (enterprise-heavy businesses), or a hard regulatory/contractual isolation requirement that makes the operational cost worth paying.
- **Bridge — schema per tenant, one database.** A middle ground: stronger isolation than sharing tables, cheaper to run than fully separate databases. Still multiplies migrations by tenant count, and most ORMs handle "pick the right schema at runtime" awkwardly enough that it adds real application complexity. Best fit: a moderate number of mid-size tenants where you want more isolation than row-level security gives you, but full database-per-tenant is more operational overhead than you can justify.
- **Pool — shared schema, `tenant_id` column.** One set of tables serves every tenant; every tenant-scoped table carries a `tenant_id` (or `organization_id`) column. Cheapest to run, migrations run exactly once regardless of tenant count, and it scales comfortably to huge tenant counts including many tiny or free-tier tenants. The cost: isolation is now a software and policy responsibility rather than a structural given — a missed `WHERE tenant_id = ?` somewhere in the codebase is a real cross-tenant data leak, not a hypothetical one. The mitigation, and the reason this model is viable for serious production SaaS rather than just prototypes, is enforcing isolation at the database layer with Row-Level Security (§3) instead of relying on every query in the codebase remembering the filter.

## 2. Decision framework

Default to **pool (shared schema) + Row-Level Security** for most SaaS products. It's the cheapest to build and operate, it's what the vast majority of successful SaaS companies actually run on, and RLS closes the main risk (a forgotten filter) at the database layer instead of leaving it as a hope about application-code discipline.

Move toward schema-per-tenant or database-per-tenant only when there's a specific, concrete reason, not a vague sense that "more isolation is better":

- A handful of enterprise customers contractually or regulatorily require physical data isolation.
- Hard data-residency law requires a specific tenant's data to live in a specific jurisdiction, and that's cleaner to guarantee structurally than through application logic.
- One or a few tenants are so large that noisy-neighbor performance interference against your other tenants becomes a real, measured problem — not a theoretical one.

If none of those apply, the extra operational cost of silo or bridge models is very likely not buying you anything the shared-schema-plus-RLS model doesn't already give you.

## 3. Implementing shared-schema with Row-Level Security

This is the concrete, load-bearing part of the pool model — get it right and the model's main weakness goes away.

**The shape:**

```sql
-- Every tenant-scoped table:
ALTER TABLE invoices ADD COLUMN tenant_id uuid NOT NULL REFERENCES tenants(id);

-- Turn on RLS and add a policy:
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON invoices
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

The application sets the tenant context once per transaction, at the start of each request:

```sql
SET LOCAL app.current_tenant_id = '...';
```

`SET LOCAL` (not plain `SET`) matters — it scopes the setting to the current transaction, so it can't leak into the next request on a pooled connection.

**Gotchas that actually bite in production, worth surfacing explicitly rather than assuming they're handled:**

- **Superusers and table owners bypass RLS by default.** If your application's database role happens to own the tables (a common default when a role creates the tables it then uses), RLS silently does nothing for that role. Use a dedicated, non-owner application role for all normal query traffic, and reserve a separate `BYPASSRLS` role, used only for migrations and genuinely privileged admin tooling, with its usage audited.
- **Connection pooling can leak or drop tenant context.** With transaction-mode pooling (PgBouncer and similar), make sure the tenant context is actually re-set fresh at the start of every transaction — a stale context left over from a previous request on a reused connection is a real leak vector, and a silently-unset context is just as dangerous. Prefer a fail-*safe* default: a policy that returns zero rows when no tenant context is set, rather than one that accidentally returns everything.
- **Indexing is what makes this fast — or dangerously slow if skipped.** Every composite index on a tenant-scoped table should have `tenant_id` as the *leading* column. Skipping this is consistently the single biggest performance problem reported with RLS-based multi-tenancy — measured degradations around two orders of magnitude have been reported for exactly this miss, while a properly indexed shared-schema-plus-RLS setup adds only marginal overhead versus no RLS at all (low-single-digit percent in published benchmarks) — the isolation is close to free once the indexing is right, and expensive if it isn't.
- **Joins need policies on every table involved, not just the "main" one.** If a query joins `invoices` to `line_items`, both tables need `tenant_id` and an RLS policy, or the join can leak rows from the unprotected side.

## 4. Layering roles and permissions on top

Multi-tenancy (which tenant does this row belong to) and authorization (what can this specific user do within their tenant) are related but separate schema decisions — don't conflate them into one mechanism.

A standard, well-worn shape for role-based access within a tenant:

- `roles(id, tenant_id, name)` — if roles are tenant-customizable; a fixed, small set of global roles doesn't need `tenant_id` here at all.
- `permissions(id, name)` — the fixed vocabulary of things a role can grant (`invoices:read`, `invoices:write`, ...).
- `role_permissions(role_id, permission_id)` — join table.
- `user_roles(user_id, tenant_id, role_id)` — a user's role(s) within a specific tenant; the `tenant_id` here is what makes this work correctly for users who belong to more than one tenant (§5).

Only build the full version of this when the interview actually surfaces a need for custom, tenant-defined roles or fine-grained permissions. If access control is genuinely just "owner vs. everyone else," a simple `role` enum column on the tenant-membership row is enough, and building the full RBAC shape above ahead of that need is premature complexity.

## 5. Users who belong to more than one tenant

If a single human can be part of more than one organization — a contractor working across client accounts, an agency managing several customers — a user row cannot carry a single `tenant_id` foreign key directly. Model membership as its own join table instead:

```sql
CREATE TABLE tenant_memberships (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  user_id uuid NOT NULL REFERENCES users(id),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  role text NOT NULL,
  UNIQUE (user_id, tenant_id)
);
```

The application then needs a real notion of "which tenant is currently active for this session" (a UI tenant-switcher, a subdomain, a header) to know which `tenant_id` to set for RLS on any given request — this is worth surfacing during the interview rather than discovering when someone asks "wait, how do I switch between my two accounts?"

## 6. You're not as locked in as it feels

The pool model with a clean `tenant_id` column isn't a one-way door the way an entirely ad hoc, no-tenant-boundary schema would be. If a specific large customer later genuinely needs its own database for isolation or performance reasons, that tenant's data is already cleanly delineated by `tenant_id` — extracting it into its own database is a real, bounded migration project, not a full rearchitecture. This doesn't lower the bar for deciding the initial model carefully (it's still real work, and still much easier to do once, deliberately, than to back into under pressure) — but it's worth knowing this decision isn't permanently irreversible, since that context sometimes helps a user feel comfortable committing to the simpler shared-schema model instead of over-building for a "what if we need to split someone out" scenario that may never come up.
