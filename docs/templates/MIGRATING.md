# MIGRATING: `modules/<name>`

This module is not yet the single source of truth for its aggregate (NX-MIG-03). Until
this file is deleted, the items below still bypass it.

Target structure: rich / anemic (delete one). Owning ADR: `docs/adr/00xx-….md`.

## Still bypassing this module

| What | Where | Replaced by | Step |
| --- | --- | --- | --- |
| `lib/server/orders.ts` → `calculate_order_total()` | RPC write | `application/pay-order.ts` | 5 |
| `app/(app)/orders/page.tsx` reads `lib/server/orders.ts` | legacy read | `server.ts` → `queries.ts` | 4 |

## Done

- [x] `index.ts`, `server.ts`, `contracts.ts` exist
- [ ] reads moved to `queries.ts`
- [ ] writes ported to use cases, wired in `commands.ts`; legacy callers use them via `server.ts`
- [ ] invariants in `domain/`
- [ ] routes import only `index.ts`/`server.ts`
- [ ] folder removed from `legacy` in `eslint.config.mjs`
- [ ] inventory rows for ported functions marked dropped
