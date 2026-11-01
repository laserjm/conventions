# Changelog

## 0.1.2

Fixes found adopting the profile in a brownfield project (screenerhub).

- `legacy` globs are anchored at `appRoot` (boundaries `mode: 'full'`): `components/**` no longer
  turns a module's `components/` into legacy. Exclude a folder with an extglob,
  `components/!(ui)/**`.
- Legacy code gets the layer rules only (NX-LAYER-10): naming, cast, env and the custom naming
  rules start when a folder leaves the list.
- NX-ZOD-05 skips tooling outside the app: `*.config.*` at the app root and `scripts/**`.
- `contracts.ts` and `infra/` may import another module's `index.ts` (NX-LAYER-01, NX-TYPE-01);
  `application/` stays types-only.
- Templates, upstreamed from screenerhub:
  - `lib/db/transaction.ts`: a nested `withTransaction` joins the outer transaction;
    `set_config` with a bound value instead of `sql.raw`; optional `statementTimeout` override.
  - `lib/db/errors.ts`: unwraps Drizzle's error wrapper; `postgresErrorCode()`; works with
    node-postgres and postgres.js.
  - `lib/db/client.ts` is a starter the project owns and exports a lazy `db()` (it connected on
    import, against NX-TYPE-06). **Copies of the old template call `db.` → `db().`**
  - New starter `lib/auth/requester.ts` (binding: supabase), which `lib/safe-action.ts` imports.

## 0.1.1

- Skill `nextjs-conventions` installs with `npx skills add https://github.com/laserjm/conventions/tree/v0.1.1 --skill nextjs-conventions`:
  the `description` frontmatter is a block scalar, so strict YAML parsers accept it.
- Skill works when installed outside this repo: it finds the catalogue from the app's folder
  (monorepos included) and reads the prose and reference module at the pinned tag. New
  workflow step for projects with `legacy` code.
- README: setup split into greenfield and brownfield, with a monorepo note. Brownfield merges
  the helpers and `ARCHITECTURE.md` instead of copying over them and replaces a hand-written
  `eslint-plugin-boundaries` config.
- Releases attach the lint package as a tarball, so npm projects install it by URL; pnpm keeps
  the `github:` tag form.

## 0.1.0 — initial release

- Profile `nextjs`: architecture, naming and testing rules with IDs (129 rules, 39 lint-enforced).
- Bindings: drizzle, supabase, zod, next-safe-action.
- `@conventions/eslint-plugin-nextjs`: flat config (`createConfig`) + 8 custom rules.
- Shipped helpers: `lib/result.ts`, `lib/errors.ts`, `lib/db/{client,transaction,errors}.ts`, `lib/safe-action.ts`, `tests/support/local-stack.ts`.
- Templates: `ARCHITECTURE.md`, `db-inventory.md`, `MIGRATING.md`.
- Skill `nextjs-conventions` (Claude Code plugin).
- Reference module `examples/nextjs-orders`; violation fixtures `examples/nextjs-violations`.
- Optional `commands.ts` per module (NX-LAYER-11): write use cases wired to their dependencies,
  taking the caller's `Requester`; re-exported by `server.ts`. Enforced by the new rule
  `nextjs/actions-use-commands`, `require-server-only` and the boundaries config.
- `index.ts` exports use-case types, never use-case functions (NX-NAME-12).
- `application/` may import another module's `index.ts` types only, so an event handler can
  name the event it receives (NX-LAYER-01, NX-XMOD-02).
- `lib/safe-action.ts`: `memberActionClient` ends a signed-out call with `returnServerError`,
  so `ctx.requester` is never null (NX-NSA-01).
- Installed from the `v0.1.0` git tag; not published to npm.
