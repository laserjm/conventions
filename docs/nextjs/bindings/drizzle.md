# Binding: Drizzle (role: ORM)

Maps the *ORM* role of the [core rules](../architecture.md) to Drizzle. A binding adds
rules; it never relaxes a core rule.

## Files

| Core file | Drizzle |
| --- | --- |
| `lib/db/client.ts` | `drizzle(postgres(env.DATABASE_URL))`; `DATABASE_URL` validated here on first connection (NX-TYPE-06) |
| `lib/db/schema.ts` | table definitions — **generated** (`drizzle-kit pull`) in migrations-first projects, hand-written in code-first projects (NX-DB-01) |
| `lib/db/relations.ts` | generated alongside the schema in migrations-first projects |
| `lib/db/transaction.ts` | `withTransaction` around `db.transaction()`, sets `statement_timeout` with `set local` (NX-DB-07) |
| `lib/db/errors.ts` | `violatedConstraint(error)` reads the Postgres error code and constraint name (NX-DB-05) |

## Rules

| ID | Sev | Rule | Enforcement |
| --- | --- | --- | --- |
| NX-DRZ-01 | error | Only `lib/db/**` and `modules/*/infra/**` import `drizzle-orm`. | eslint:boundaries/external |
| NX-DRZ-02 | error | Row types are inferred in `infra/` with `InferSelectModel` / `InferInsertModel` as `<Noun>Row` / `New<Noun>Row`. Never hand-written. | review |
| NX-DRZ-03 | error | **Migrations-first** projects: `drizzle-kit pull` writes `lib/db/schema.ts` and `relations.ts`; nothing runs `generate`, `push` or `migrate`; a CI job fails when the generated files drift. Generated identifiers are kept as emitted (`orders`, not `ordersTable`) — NX-NAME-08. | CI |
| NX-DRZ-04 | error | **Code-first** projects: tables are `export const <nouns>Table = pgTable('<nouns>', …)`, enums `<noun>StatusEnum = pgEnum('<noun>_status', …)`; migrations come from `drizzle-kit generate --name <verb>-<what>`. | review |
| NX-DRZ-05 | error | `withTransaction` sets `statement_timeout` per caller class: interactive callers 8 s, system callers 5 min (defaults; the project may change them in `ARCHITECTURE.md`). | review |
| NX-DRZ-06 | error | The `UnitOfWork` port is implemented in `infra/unit-of-work.ts` by delegating to `withTransaction`. Use cases never see the Drizzle transaction object. | eslint:boundaries |
| NX-DRZ-07 | warn | Read models (category B) that are views are declared with `pgView` so they are typed. | review |
| NX-DRZ-08 | warn | A repository runs no raw SQL except to call a category A/B function; the call is wrapped by exactly one method and its result parsed with a contract schema. | review |

## Shipped files

`packages/eslint-plugin-nextjs/templates/lib/db/{transaction,errors,client}.ts` — copy
into the project; upgrade with the conventions version.
