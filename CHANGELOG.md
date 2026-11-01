# Changelog

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
