# Web app architecture

The web app follows
[Next.js Architecture Rules](../../docs/architecture/nextjs-architecture-rules.md)
and [Naming Conventions per Layer](../../docs/architecture/naming-conventions.md).
[ADR 0015](../../docs/adr/0015-drizzle-and-feature-modules.md) records why and
in what order the code moves to them, and
[the inventory](../../docs/architecture/rpc-inventory.md) lists every database
function and trigger and where it goes. This file records how this project
reads the rules where they leave room. Each entry says what was decided and
where it is enforced or recorded. Add an entry before you deviate; change one
only with the decision that changes it.

## Interpretations

### No `src/` folder

`app/`, `modules/`, `lib/` and `components/` sit directly in `apps/web/`, and
`@/` points there. The rules' `src/` prefix is dropped everywhere.

### The Supabase migrations are the only schema source

Migrations are created with `supabase migration new` in `supabase/migrations/`,
never under `drizzle/`. `npm run types` (from the repository root) writes
`lib/db/schema.ts` and `lib/db/relations.ts` with `drizzle-kit pull`; nothing
runs `drizzle-kit generate`, `push` or `migrate`, and the Database types CI job
fails when the generated files drift. The generated table names are kept
(`portfolios`, not `portfoliosTable`), so the naming conventions' `Table` suffix
does not apply. Only `infra/` imports them, and row types are inferred there.

### A tenant is one member

There are no shared workspaces. `Requester` (`lib/safe-action.ts`) carries
`tenantId` equal to `userId`, and `roles` is empty until roles exist. Drizzle
connects as the database owner, so row policies do not apply to it: every
repository method that reads or writes a member's rows takes their id from the
`Requester` and names it in the query, and the repository's
`*.integration.test.ts` proves another member's rows can be neither read nor
changed. System work (the scheduled run, the check worker, email delivery)
uses the same connection and names its tenant explicitly. Row policies guard
only the Data API.

### Transactions and their timeouts

`withTransaction` in `lib/db/transaction.ts` is the Drizzle transaction, and
every repository statement runs inside one. It sets `statement_timeout` with
`set local`: 8 seconds for a member, `"5min"` for system work, because the
transaction pooler shares sessions. Only `infra/` may import `lib/db`, so a use
case that needs several writes in one transaction receives it through a
`UnitOfWork` port its module's `infra/` implements.

### Repositories

A module without a use case exports its repository as a plain object,
`<noun>Repository` in `infra/<noun>.repository.ts`, whose methods take the
member's `ownerId` first; the action passes `requester.tenantId`. A constraint
the database refuses becomes a tagged error there, read with
`violatedConstraint` from `lib/db/errors.ts`
(`modules/accounts/infra/account.repository.ts`).

### A module's server-only reads

A module's public API is its `index.ts`. When client components use the
module's domain, as they use `modules/filters`, `index.ts` exports only what
is safe in the browser, and the reads that reach the database come from
`server.ts`, which re-exports `queries.ts` (marked `server-only`). Importing
`server.ts` from a client component fails the build. `eslint.config.mjs`
treats both files as the module's public API. A module whose `index.ts` no
client component imports, such as `modules/accounts`, keeps one file.

Reads of data every member shares, such as the field registry and the
templates, name no owner and need no requester: their repository methods and
queries take no arguments. Every page that shows them has signed its member in
already.

### `Result` and action errors

`lib/result.ts` defines `Result<T, E>` as `{ ok: true, value } | { ok: false,
error }`, built with `ok()` and `err()`; every error is tagged with `_tag`.
Member actions use `memberActionClient` from `lib/safe-action.ts`, which signs
the caller in once and returns `SignedOut`, or `Unexpected` with a trace id for
a thrown error.

### Database functions that stay

Beyond the rules' timing-critical transactions, the inventory keeps the queue
claims (`claim_check`, `finalize_check`, `claim_email`), the market read models
(`screen_listings`, `release_cells` and the others, until a later step), the
helpers that policies and constraints use, such as `is_iana_timezone`, and the
data pipelines' functions. `handle_new_user` on `auth.users` also stays: it
creates the account and its preferences however a user appears. Each read model
or claim is wrapped by one repository method with a zod schema for its result.
A migration that adds a function or trigger adds a row to the inventory. On
member tables the only triggers left are `set_updated_at` and the audit
trigger.

### Legacy code

`lib/server/`, `app/` and `components/` are the `legacy` element in
`eslint.config.mjs`: they keep the imports they have, but reach a module only
through its `index.ts` (or `server.ts`). `lib/monitor/` and `lib/screener/`
are legacy too, because they use the filters module, which `lib/` may not;
they move with the monitors and market-read modules. `app/` and `components/ui/` stay where the rules put
them; they are on the list only because their files still import `lib/server/`. Code under `lib/server/` keeps its own shape (operations
built with `defineOperation`, returning the `Result` of `lib/server/operation.ts`
with reason codes, and the PL/pgSQL functions they call) until its module
migrates, in the order ADR 0015 gives. Add no new feature there, and import
nothing a module already replaced. A half-migrated module carries a
`MIGRATING.md` listing what still bypasses it; when a module is done, its old
folder leaves the legacy list.

### Tests

Unit tests sit beside their file as `*.test.ts`; use cases are tested with
in-memory fakes. Integration tests are `*.integration.test.ts` and run in
`npm test` against the local Supabase stack, skipped through
`describe.skipIf(!localStack())` when none is running
(`tests/support/local-supabase.ts`). Browser tests live in
`tests/browser/*.spec.ts`, not `e2e/`. Tenant policies, constraints and the
remaining database functions are tested with pgTAP in `supabase/tests/`. Test
files are outside the layer lint rules.

### Environment variables

`lib/env.ts` validates the variables that modules read, and grows as code
reading `process.env` migrates. `DATABASE_URL` is validated in
`lib/db/client.ts` on first connection instead, so importing the client needs
no database configuration.
