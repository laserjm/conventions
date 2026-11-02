# Changelog

## 0.2.2 — what the screenerhub2 rollout needs

- Install: the `drizzle-orm` peer range is `>=0.40.0 || >=1.0.0-rc.0`, so the profile installs
  next to `1.0.0-rc.5` without `--legacy-peer-deps`; the package builds and tests against rc.5
  (#15).
- Runtime: `@conventions/nextjs/core` and `/drizzle` load under plain Node ESM (the build
  emitted extensionless imports, which only bundlers and tsx resolved).
- `withTransaction(caller, fn, { rollbackOnErr: true })`: `fn` returns a `Result`; an `err`
  rolls the transaction back and is returned unchanged, so a use case that refuses after it
  wrote keeps nothing. Joined to an outer transaction, it hands the `err` to the outer unit of
  work. The reference `UnitOfWork` port and `infra/unit-of-work.ts` use it (NX-DB-06,
  NX-DRZ-06, #8).
- `withTransaction(caller, fn, { join: 'required' })` joins the caller's transaction and stops
  with a bug when none is open: for a lock or write that only means something inside another
  module's unit of work (NX-XMOD-01, #5).
- `bug(message): never` and `Bug` in `@conventions/nextjs/core`: the sanctioned way for
  `domain/` and `application/` to stop on an impossible state. NX-LAYER-08 and NX-ERR-01 say a
  refusal returns `err(...)` and a bug calls `bug(...)`; the lint message says so too (#2).
- NX-DB-02 adds category X, legacy to be ported, allowed while its callers are legacy code;
  an A or B row may leave its wrapper empty while its caller is legacy. The architecture doc's
  category table and the inventory template describe it (#14).
- `conventions check`'s inventory check is rewritten (#16). It replays the migrations (quoted
  and schema-qualified names, `create constraint trigger`, comma-separated drops, renames of
  functions, triggers and tables; a trigger goes with its table and its function), reads every
  table with a `Category` column and a section that names one category for a list of names,
  ignores Dropped sections, and reports a row without a valid category. Policies are no
  longer inventoried: NX-DB-02 covers functions and triggers. On screenerhub2 the check goes
  from 79 findings, 78 of them false, to none.

Upgrading from 0.2.1: `npm i -D -E @conventions/nextjs@0.2.2 @conventions/cli@0.2.2`,
`npx conventions sync`. A project that rolled back refusals with its own signal in
`infra/unit-of-work.ts` can pass `{ rollbackOnErr: true }` instead.

## 0.2.1 — fixes from the first 0.2.0 dry run (screenerhub2)

- ast-grep rules match declarations by node kind: a use case, action, component or type with a
  return type, a type annotation or generics is no longer invisible (NX-LAYER-07, NX-NAME-50/52,
  NX-NSA-02, NX-NAME-20/61, NX-ERR-03, NX-DRZ-02).
- Deviations rows apply to every tool: the files or globs named in backticks in the Deviation
  column turn findings of that rule into warnings in `conventions lint` and `conventions check`.
  A project no longer needs per-rule ESLint override blocks (NX-MIG-04).
- `conventions check`: a disable comment for a non-convention rule (`react-hooks/…`, `@next/…`)
  is ignored; a bare disable is reported; a Legacy row may carry prose after the folder.
- Header keys `migrations:` and `inventory:` for monorepos whose SQL and inventory live outside
  the app; `conventions init` writes the CI workflow at the repository root with
  `working-directory` set to the app.
- Tooling (`scripts/`, `*.config.*`) may import legacy code and module APIs (NX-LAYER-10).
- NX-NAME-61 is checked in `contracts.ts` only.
- `conventions lint` ignores hidden folders (`.next`) in ls-lint output.
- Release workflow: pushing `v<version>` packs both packages and attaches the tarballs.


## 0.2.0 — rebuild: every rule names its tool

Breaking: the lint package is now `@conventions/nextjs` (was `@conventions/eslint-plugin-nextjs`)
and the runtime helpers are imported from it instead of copied. Migration for a 0.1 project:

1. `npm rm @conventions/eslint-plugin-nextjs && npm i -D @conventions/nextjs @conventions/cli`.
2. `npx conventions init --profile nextjs` (keeps existing files), then move `appRoot` and
   `legacy` from `eslint.config.mjs` into the `ARCHITECTURE.md` header and reduce the config to
   `...conventions.createConfig()`.
3. Delete `lib/result.ts`, `lib/errors.ts`, `lib/db/transaction.ts`, `lib/db/errors.ts`,
   `tests/support/local-stack.ts`; import from `@conventions/nextjs/core`, `/drizzle`,
   `/testing`. `lib/db/client.ts` gains `export const withTransaction = createTransactionRunner(() => db())`;
   `lib/safe-action.ts` becomes `createActionClients({ getRequester })`.
4. `Requester.tenantId` is a `TenantId`; repositories take it first. Use cases are declared
   with `defineUseCase`, repositories with `defineRepository`. Integration tests use
   `describeIntegration` and `assertTenantIsolation`.
5. `npx conventions lint && npx conventions check`, fix, record deviations.

Catalogue

- Rules live in `catalog/nextjs/*.yaml` (schema-validated); the doc tables and `rules/nextjs.yaml`
  are generated. Severities are `error`, `warn`, `guidance`; mechanisms `eslint`, `ast-grep`,
  `ls-lint`, `tsc`, `check`, `ci`, `agent`. A `guidance` rule is always `agent`-enforced and
  vice versa, so "error" means a tool fails.
- 78 of 130 rules are mechanical (was 43 of 129). New rule NX-STR-07 (module completeness).
- `rulesets:` in the header adopts rule groups one at a time.

Enforcement

- ESLint: elements split into `actions`, `queries`, `components`; components may not import
  `infra/`, `queries.ts`, `commands.ts` or use cases; `index.ts` may not reach `queries.ts`
  through the alias; `next/cache` specifiers restricted per file (NX-CACHE-01/04);
  `boundaries/no-unknown-files` on, so a stray file or folder in a module or `components/`
  fails (NX-STR-02); every boundary message starts with the rule id it enforces; test globs
  follow `app-root`.
- ast-grep: 25 rules with test cases, including the ports of `action-suffix`,
  `no-inline-cache-tags`, `schema-suffix`, `require-server-only`, and new rules for
  NX-LAYER-07/08, NX-ERR-03/04, NX-CACHE-05, NX-NAME-20/52/61, NX-AUTH-01/07, NX-RICH-03,
  NX-NSA-01/02, NX-ZOD-05, NX-DRZ-02/08, NX-TYPE-06, NX-TEST-03.
- ls-lint replaces check-file.
- `conventions check`: header version, module completeness, module names, rich/anemic shape,
  unit test per use case, integration test per repository with the tenant-isolation helper,
  legacy table and MIGRATING.md, deviations for every disabled rule, database inventory vs
  migrations, route-local components.
- tsc: `TenantId` brand, `defineUseCase`, `systemRequester`.

Tooling

- `@conventions/cli`: `lint`, `lint-file`, `check`, `explain`, `init`, `sync`.
- Claude Code plugin: hooks lint on write and check on stop; `new-module` skill.
- Fixtures are keyed by rule id and CI asserts every lint-enforced rule has one.
- CI runs the reference module's unit tests and `tsc`.

## 0.1.2

Fixes found adopting the profile in a brownfield project (screenerhub).

- `legacy` globs are anchored at `appRoot`; legacy code gets the layer rules only (NX-LAYER-10).
- NX-ZOD-05 skips tooling outside the app. `contracts.ts` and `infra/` may import another module's `index.ts`.
- Templates upstreamed from screenerhub (`lib/db/transaction.ts`, `lib/db/errors.ts`, lazy `db()`, `lib/auth/requester.ts`).

## 0.1.1

- Skill installable with `npx skills add`; works outside this repo. README split into greenfield and brownfield.
- Releases attach the lint package as a tarball.

## 0.1.0 — initial release

- Profile `nextjs`: architecture, naming and testing rules with ids (129 rules, 39 lint-enforced), bindings drizzle, supabase, zod, next-safe-action, flat config + 8 custom rules, shipped helpers, templates, skill, reference module and violation fixtures.
