# Binding: Drizzle (role: ORM)

Maps the *ORM* role of the [core rules](../architecture.md) to Drizzle. A binding adds
rules; it never relaxes a core rule.

## Files

| Core file | Drizzle |
| --- | --- |
| `lib/db/client.ts` | starter, owned by the project: a lazy `db()` around `drizzle(postgres(DATABASE_URL))`, so `DATABASE_URL` is validated on first connection, not on import (NX-TYPE-06); and `withTransaction = createTransactionRunner(() => db())` from `@conventions/nextjs/drizzle` |
| `lib/db/schema.ts` | table definitions — **generated** (`drizzle-kit pull`) in migrations-first projects, hand-written in code-first projects (NX-DB-01) |
| `lib/db/relations.ts` | generated alongside the schema in migrations-first projects |
| `@conventions/nextjs/drizzle` | `createTransactionRunner` (sets `statement_timeout` with `set local`, NX-DB-07; a nested call joins the outer transaction; `{ rollbackOnErr: true }` rolls back when `fn` returns an `err`, NX-DB-06; `{ join: 'required' }` refuses to open a transaction of its own, NX-XMOD-01), `violatedConstraint`, `postgresErrorCode` (NX-DB-05), for node-postgres and postgres.js |

## Rules

<!-- rules: drizzle -->
| ID | Sev | Rule | Enforcement |
| --- | --- | --- | --- |
| NX-DRZ-01 | error | Only `lib/db/**` and `modules/*/infra/**` import `drizzle-orm`. | eslint:boundaries/external |
| NX-DRZ-02 | error | Row types are inferred in `infra/` with `InferSelectModel` / `InferInsertModel` as `<Noun>Row` / `New<Noun>Row`. Never hand-written. | ast-grep:nx-drz-02-no-hand-written-row-types |
| NX-DRZ-03 | error | **Migrations-first** projects: `drizzle-kit pull` writes `lib/db/schema.ts` and `relations.ts`; nothing runs `generate`, `push` or `migrate`; a CI job fails when the generated files drift. Generated identifiers are kept as emitted (`orders`, not `ordersTable`) — NX-NAME-08. | ci:schema-drift |
| NX-DRZ-04 | guidance | **Code-first** projects: tables are `export const <nouns>Table = pgTable('<nouns>', …)`, enums `<noun>StatusEnum = pgEnum('<noun>_status', …)`; migrations come from `drizzle-kit generate --name <verb>-<what>`. | agent |
| NX-DRZ-05 | guidance | `createTransactionRunner` sets `statement_timeout` per caller class: interactive callers 8 s, system callers 5 min (defaults; the project may pass its own and records it in `ARCHITECTURE.md`). A nested `withTransaction` joins the outer transaction and its timeout; `statementTimeout` overrides the budget for tests and maintenance only. | agent |
| NX-DRZ-06 | error | The `UnitOfWork` port is implemented in `infra/unit-of-work.ts` by delegating to `withTransaction` from `lib/db/client.ts` with `{ rollbackOnErr: true }`: its `run` takes a `fn` that returns a `Result` and rolls back on `err`. Use cases never see the Drizzle transaction object. | ast-grep:nx-db-06-transactions-only-in-infra |
| NX-DRZ-07 | guidance | Read models (category B) that are views are declared with `pgView` so they are typed. | agent |
| NX-DRZ-08 | warn | A repository runs a raw statement (`execute(sql`…`)`) only to call a category A/B function, to call a category C helper when a command needs its answer before it writes (`select public.is_iana_timezone($1)`), or for a query the query builder cannot express, such as a recursive CTE (`with recursive`). Each statement is wrapped by exactly one repository method and its result parsed with a contract schema; functions are called schema-qualified. A `sql` fragment passed to the builder (`.set({ archivedAt: sql`now()` })`) is not a raw statement. | ast-grep:nx-drz-08-no-raw-sql-in-repository |
<!-- /rules -->

## Raw statements (NX-DRZ-08)

The query builder covers almost every read and write. A raw statement, `tx.execute(sql`…`)`, is
allowed in a repository for three cases only, each in its own method with its result parsed:

```ts
// category A/B: the inventory row names this method as the function's wrapper
async claim(lease: string) {
  const { rows } = await tx.execute(sql`select * from public.claim_job(${lease}::interval)`);
  return claimedJobSchema.array().parse(rows);
},

// category C, asked before the command's first write (the constraint would refuse too late)
async isKnownZone(zone: string) {
  const { rows } = await tx.execute(sql`select public.is_iana_timezone(${zone}) as known`);
  return z.object({ known: z.boolean() }).parse(rows[0]).known;
},

// a query the builder cannot express: a recursive CTE instead of one query per level (NX-DB-04)
async supersededChain(observationId: string) {
  const { rows } = await tx.execute(sql`
    with recursive chain as (
      select id, supersedes_id from metric_observations where id = ${observationId}
      union all
      select o.id, o.supersedes_id from metric_observations o join chain c on o.id = c.supersedes_id
    )
    select id from chain`);
  return z.object({ id: z.uuid() }).array().parse(rows).map((r) => r.id);
},
```

Call functions schema-qualified (`public.claim_job`): the lint rule reads a qualified call or
`with recursive` as one of the allowed cases and warns on any other raw statement. A `sql`
fragment handed to the builder, such as `.set({ archivedAt: sql`now()` })`, is not a raw
statement.

## Shipped

`@conventions/nextjs/drizzle` (imported) and the starter `lib/db/client.ts` (written by
`conventions init`, owned by the project).
