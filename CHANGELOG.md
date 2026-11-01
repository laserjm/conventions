# Changelog

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
