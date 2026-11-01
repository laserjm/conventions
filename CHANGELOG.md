# Changelog

## 0.1.0 — initial release

- Profile `nextjs`: architecture, naming and testing rules with IDs (128 rules, 38 lint-enforced).
- Bindings: drizzle, supabase, zod, next-safe-action.
- `@conventions/eslint-plugin-nextjs`: flat config (`createConfig`) + 7 custom rules.
- Shipped helpers: `lib/result.ts`, `lib/errors.ts`, `lib/db/{client,transaction,errors}.ts`, `lib/safe-action.ts`, `tests/support/local-stack.ts`.
- Templates: `ARCHITECTURE.md`, `db-inventory.md`, `MIGRATING.md`.
- Skill `nextjs-conventions` (Claude Code plugin).
- Reference module `examples/nextjs-orders`; violation fixtures `examples/nextjs-violations`.
