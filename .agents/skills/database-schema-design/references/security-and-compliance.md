# Security and compliance

## Contents

1. [Classify sensitive data at design time](#1-classify-sensitive-data-at-design-time)
2. [Encryption](#2-encryption)
3. [Row-level security beyond multi-tenancy](#3-row-level-security-beyond-multi-tenancy)
4. [Retention and the right to erasure](#4-retention-and-the-right-to-erasure)
5. [Audit logging](#5-audit-logging)
6. [Secrets](#6-secrets)
7. [Least-privilege database roles](#7-least-privilege-database-roles)

## 1. Classify sensitive data at design time

Maintain a simple classification per column as part of the design doc while you're naming it — public, internal, sensitive, or restricted — rather than treating "which columns are sensitive" as a question to answer later via an audit. It costs almost nothing to note "this one's sensitive" while you're already looking at the column; it costs real time and real risk to reconstruct that classification across an existing schema after the fact, and the gap in between is exactly when a sensitive column ends up unencrypted in a log line or an unfiltered API response.

## 2. Encryption

For genuinely sensitive fields (government IDs, health information, and similar), application-level encryption — encrypt before writing, decrypt after reading, with keys managed outside the database itself — is usually more practical than database-native column encryption, mainly because native column encryption tends to break the ability to index or query on that column at all.

For data that's regulated at a level where you'd be taking on real liability by storing it (full payment card numbers under PCI-DSS is the standard example), the better answer is often to not store the raw value yourself at all — tokenize through a payment processor or a dedicated vault service, and store only their reference token. This isn't just a schema-design preference; it meaningfully changes your compliance scope and liability, which is worth surfacing explicitly to the user rather than quietly designing a column for it.

## 3. Row-level security beyond multi-tenancy

`multi-tenancy-patterns.md` covers RLS as a tenant-isolation mechanism, but the same tool is useful more generally for any row-visibility rule that should be enforced by the database rather than trusted to application code — a manager who should see only their own team's records, a user who should see only their own submissions. The implementation pattern (a policy comparing a row's column against a session-scoped setting) is the same; only the specific rule and the column it checks change.

## 4. Retention and the right to erasure

Design the "delete my data" path at schema time rather than improvising it under a real regulatory deadline (GDPR and CCPA-style requests typically come with a response-time clock attached). Two real approaches, and the right one depends on what else references the data:

- **True deletion**, cascading through everything that belongs solely to that user — appropriate when nothing else needs to retain a reference to the deleted rows.
- **Anonymization**, where PII columns are nulled out or hashed in place while the row itself (and anything that references it) survives — appropriate when other rows have a legitimate reason to keep existing (an order history for accounting purposes, aggregated analytics that shouldn't lose a data point) but shouldn't keep identifying the specific person anymore.

Deciding which of these applies to which entity is much easier to do deliberately, once, at design time — while you already understand the relationships involved — than to reconstruct correctly under time pressure once a real request arrives and you're tracing foreign keys to figure out what's safe to touch.

## 5. Audit logging

`created_by` / `updated_by` columns on a row (see `common-patterns-and-conventions.md`) tell you who made the *most recent* change — they can't answer "what did this used to say before three edits ago" or "list everything this user touched last month," because each new update overwrites the previous values with no history retained.

A real audit-log table — `audit_log(id, actor_id, action, entity_type, entity_id, before, after, occurred_at)`, with `before`/`after` typically stored as JSONB snapshots or diffs — is what you need when the actual requirement is "who changed what, and what did it used to be." Build this specifically when there's a real compliance requirement (SOC 2, HIPAA, or similar) or a real support/debugging need for change history, not preemptively on every table — it's real additional write volume and storage, worth paying for deliberately.

## 6. Secrets

Never store API keys, passwords, or auth tokens in plaintext. Passwords specifically should go through a proper adaptive hashing algorithm designed for this (bcrypt, argon2, scrypt) — never a reversible encryption scheme, and never a fast general-purpose hash like plain SHA-256 or MD5 used alone, since those are specifically too fast to resist brute-force attacks against a leaked hash table. Third-party API tokens and similar secrets your application needs to use (not just verify) should be encrypted at rest or held in a dedicated secrets manager/vault rather than sitting as plaintext columns in the main schema.

## 7. Least-privilege database roles

The application's own database role shouldn't be a superuser or the owner of the tables it queries — beyond the general security principle, this is a hard requirement for Row-Level Security to actually take effect at all (owners and superusers bypass RLS by default; see `multi-tenancy-patterns.md`). Separate roles for the running application, for migrations/admin tooling, and for analytics or reporting read access let you grant each one only what it actually needs, and make it possible to audit or revoke one without affecting the others.
