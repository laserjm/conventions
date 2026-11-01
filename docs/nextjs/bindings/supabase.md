# Binding: Supabase (roles: database platform, identity)

Maps the *database platform* and *identity* roles to Supabase (Postgres, Auth, migrations,
RLS, Data API).

## Rules

| ID | Sev | Rule | Enforcement |
| --- | --- | --- | --- |
| NX-SB-01 | error | Supabase migrations are the only schema source (`supabase migration new`, `supabase/migrations/`). The project is **migrations-first** (NX-DB-01, NX-DRZ-03). | review |
| NX-SB-02 | error | The app connects with the ORM as the database owner through the transaction pooler. Row policies therefore do **not** apply to app queries; tenant isolation is enforced in the repository (NX-AUTH-03). Row policies guard only the Data API (NX-AUTH-04). | review (integration test) |
| NX-SB-03 | error | `Requester` is built from `supabase.auth.getUser()` in `lib/safe-action.ts` and `lib/auth/requester.ts`. `tenantId` is the user's id until shared workspaces exist, when it becomes the workspace id; `roles` is empty until roles exist. | review |
| NX-SB-04 | error | `handle_new_user` on `auth.users` is a category D hook (NX-DB-02): it provisions the account row and its defaults however a user appears. It is the only trigger allowed to write business rows. | db inventory |
| NX-SB-05 | error | Queue claims (`claim_*`, `finalize_*`) are category A; `SECURITY DEFINER` helpers used by policies or `CHECK` constraints (`is_iana_timezone`) are category C; read-model functions for the Data API are category B. All have inventory rows. | db inventory |
| NX-SB-06 | error | Database tests (policies, constraints, category A–E functions) are written with pgTAP in `supabase/tests/` and run in CI against the local stack (NX-TEST-04). | CI |
| NX-SB-07 | error | Integration tests skip with `describe.skipIf(!localStack())` from `tests/support/local-stack.ts` when `supabase status` reports no running stack. | review |
| NX-SB-08 | warn | The Supabase JS client is used for Auth and Storage only; data access goes through the ORM. A module that needs the Data API (realtime, edge) records it in `ARCHITECTURE.md`. | eslint:boundaries/external (`@supabase/supabase-js` only in `lib/auth/**`, `lib/storage/**`, `lib/safe-action.ts`) |

## Inventory

Every project using this binding has `docs/architecture/db-inventory.md`
([template](../../templates/db-inventory.md)) with a row per function, trigger and policy
helper. A migration that adds one adds the row in the same PR.
